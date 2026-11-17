import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LIMITES_MODERACION, ModeracionFacade } from '../../../core/facades/moderacion.facade';
import { Resultado } from '../../../core/models';
import { AccionModeracionService, SolicitudAccionModeracion } from '../../services/accion-moderacion.service';
import { ControladorModal } from '../../services/bootstrap';
import { NotificacionService } from '../../services/notificacion.service';
import { largoMinimoSinEspacios, sinSoloEspacios } from '../../validators';
import { CampoErrorComponent } from '../campo-error/campo-error';

const TEXTOS = {
  reportar: {
    titulo: 'Reportar contenido',
    icono: 'bi-flag',
    boton: 'Enviar reporte',
    variante: 'btn-primary',
    campo: 'Describe el problema',
    ayuda: 'Un moderador revisará tu reporte. No se muestra públicamente.',
    exito: 'Gracias: un moderador revisará tu reporte.',
  },
  banear: {
    titulo: 'Banear contenido',
    icono: 'bi-slash-circle',
    boton: 'Banear',
    variante: 'btn-danger',
    campo: 'Motivo del baneo',
    ayuda: 'El contenido dejará de verse para los usuarios. Solo un ADMIN podrá levantar el baneo.',
    exito: 'El contenido fue baneado.',
  },
  levantar: {
    titulo: 'Levantar baneo',
    icono: 'bi-arrow-counterclockwise',
    boton: 'Levantar baneo',
    variante: 'btn-success',
    campo: 'Motivo del levantamiento',
    ayuda: 'El contenido volverá a ser visible y la sanción quedará en el historial.',
    exito: 'El baneo fue levantado y el contenido es visible otra vez.',
  },
} as const;

/**
 * Modal global de moderación (Bootstrap Modal) controlado por AccionModeracionService.
 * Valida con atributos HTML y validadores de Angular, y delega la regla de negocio
 * en el ModeracionFacade (quién puede, norma vigente, duplicados…).
 */
@Component({
  selector: 'app-modal-moderacion',
  imports: [ReactiveFormsModule, RouterLink, CampoErrorComponent],
  template: `
    <div class="modal fade" #modal tabindex="-1" aria-labelledby="tituloModeracion" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <form class="modal-content" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          @if (visible(); as s) {
            <div class="modal-header">
              <h2 class="modal-title fs-5" id="tituloModeracion">
                <i class="bi me-2" [class]="textos().icono" aria-hidden="true"></i>{{ textos().titulo }}
              </h2>
              <button type="button" class="btn-close" aria-label="Cerrar" (click)="cancelar()"></button>
            </div>
            <div class="modal-body">
              <p class="small text-body-secondary mb-3">
                {{ s.tipo === 'TEMA' ? 'Tema' : 'Comentario' }}:
                <span class="fw-semibold text-body">“{{ s.resumen }}”</span>
              </p>

              @if (s.modo !== 'levantar') {
                <div class="mb-3">
                  <label for="moderacion-norma" class="form-label">Norma que se incumple</label>
                  <select id="moderacion-norma" class="form-select" formControlName="normaId" required
                    [class.is-invalid]="invalido(form.controls.normaId)" aria-describedby="moderacion-norma-error">
                    <option [ngValue]="null" disabled>Selecciona una norma…</option>
                    @for (n of moderacion.normasActivas(); track n.id) {
                      <option [ngValue]="n.id">{{ n.codigo }} · {{ n.nombre }}</option>
                    }
                  </select>
                  <app-campo-error [control]="form.controls.normaId" idError="moderacion-norma-error"
                    [mensajes]="{ required: 'Selecciona la norma que se incumple.' }" />
                  <a routerLink="/normas" class="small" (click)="cancelar()">Ver las normas del foro</a>
                </div>
              }

              <label for="moderacion-texto" class="form-label">{{ textos().campo }}</label>
              <textarea id="moderacion-texto" class="form-control" rows="4" formControlName="texto" required
                [minlength]="minimo()" [maxlength]="maximo()" (input)="largo.set(form.controls.texto.value.length)"
                [class.is-invalid]="invalido(form.controls.texto)" aria-describedby="moderacion-texto-error moderacion-ayuda"></textarea>
              <div class="d-flex justify-content-between align-items-start gap-2 mt-1">
                <app-campo-error [control]="form.controls.texto" idError="moderacion-texto-error" />
                <small class="text-body-secondary ms-auto">{{ largo() }}/{{ maximo() }}</small>
              </div>
              <p id="moderacion-ayuda" class="form-text mb-0">{{ textos().ayuda }}</p>

              @if (error(); as e) {
                <div class="alert alert-danger small mt-3 mb-0" role="alert">{{ e }}</div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="cancelar()">Cancelar</button>
              <button type="submit" class="btn" [class]="textos().variante">{{ textos().boton }}</button>
            </div>
          }
        </form>
      </div>
    </div>
  `,
})
export class ModalModeracionComponent {
  protected readonly moderacion = inject(ModeracionFacade);
  private readonly servicio = inject(AccionModeracionService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = viewChild.required<ElementRef<HTMLElement>>('modal');
  private readonly controlador = new ControladorModal(() => this.modalRef().nativeElement);

  /** Copia de la solicitud (se conserva durante la animación de cierre). */
  protected readonly visible = signal<SolicitudAccionModeracion | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly largo = signal(0);
  private completada = false;

  protected readonly textos = computed(() => TEXTOS[this.visible()?.modo ?? 'reportar']);
  protected readonly minimo = computed(() =>
    this.visible()?.modo === 'reportar' ? LIMITES_MODERACION.detalleReporteMin : LIMITES_MODERACION.motivoMin,
  );
  protected readonly maximo = computed(() =>
    this.visible()?.modo === 'reportar' ? LIMITES_MODERACION.detalleReporteMax : LIMITES_MODERACION.motivoMax,
  );

  protected readonly form = this.fb.group({
    normaId: this.fb.control<number | null>(null),
    texto: this.fb.nonNullable.control(''),
  });

  constructor() {
    effect(() => {
      const solicitud = this.servicio.solicitud();
      if (solicitud) {
        this.preparar(solicitud);
        this.controlador.abrir();
      } else {
        this.controlador.cerrar();
      }
    });
    effect((onCleanup) => {
      const el = this.modalRef().nativeElement;
      // Esc o clic fuera del modal: se cancela (salvo que la acción ya se haya completado).
      const alOcultar = (): void => this.servicio.finalizar(this.completada);
      el.addEventListener('hidden.bs.modal', alOcultar);
      onCleanup(() => el.removeEventListener('hidden.bs.modal', alOcultar));
    });
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected cancelar(): void {
    this.servicio.finalizar(false);
  }

  protected enviar(): void {
    const s = this.visible();
    if (!s) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { normaId, texto } = this.form.getRawValue();
    let resultado: Resultado<unknown>;
    switch (s.modo) {
      case 'reportar':
        resultado = this.moderacion.reportar({ tipo: s.tipo, contenidoId: s.contenidoId, normaId: normaId!, detalle: texto });
        break;
      case 'banear':
        resultado = this.moderacion.banear({
          tipo: s.tipo,
          contenidoId: s.contenidoId,
          normaId: normaId!,
          motivo: texto,
          reporteId: s.reporteId ?? null,
        });
        break;
      default:
        resultado = this.moderacion.levantarSancion(s.sancionId!, texto);
    }
    if (!resultado.ok) {
      this.error.set(resultado.error);
      return;
    }
    this.notificaciones.exito(this.textos().exito, this.textos().titulo);
    this.completada = true;
    this.servicio.finalizar(true);
  }

  /** Ajusta los validadores según el modo: la norma no aplica al levantar un baneo. */
  private preparar(s: SolicitudAccionModeracion): void {
    this.visible.set(s);
    this.error.set(null);
    this.completada = false;
    const min = s.modo === 'reportar' ? LIMITES_MODERACION.detalleReporteMin : LIMITES_MODERACION.motivoMin;
    const max = s.modo === 'reportar' ? LIMITES_MODERACION.detalleReporteMax : LIMITES_MODERACION.motivoMax;
    this.form.controls.normaId.setValidators(s.modo === 'levantar' ? [] : [Validators.required]);
    this.form.controls.texto.setValidators([
      Validators.required,
      Validators.minLength(min),
      Validators.maxLength(max),
      sinSoloEspacios(),
      largoMinimoSinEspacios(min),
    ]);
    this.form.reset({ normaId: null, texto: '' });
    this.largo.set(0);
  }
}
