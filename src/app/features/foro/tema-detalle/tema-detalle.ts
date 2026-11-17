import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionFacade } from '../../../core/facades/autenticacion.facade';
import { ForoFacade, LIMITES_COMENTARIO } from '../../../core/facades/foro.facade';
import { ComentarioVista } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { AvisoBaneoComponent } from '../../../shared/components/aviso-baneo/aviso-baneo';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { TiempoRelativoPipe } from '../../../shared/pipes/tiempo-relativo.pipe';
import { ConfirmacionService } from '../../../shared/services/confirmacion.service';
import { NotificacionService } from '../../../shared/services/notificacion.service';
import { largoMinimoSinEspacios, sinSoloEspacios } from '../../../shared/validators';
import { NoEncontradoComponent } from '../../errores/no-encontrado';

/** Detalle de un tema: contenido, comentarios, comentar, editar/eliminar lo propio. */
@Component({
  selector: 'app-tema-detalle',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TiempoRelativoPipe,
    AvatarComponent,
    AvisoBaneoComponent,
    CampoErrorComponent,
    NoEncontradoComponent,
  ],
  templateUrl: './tema-detalle.html',
  styleUrl: './tema-detalle.css',
})
export class TemaDetalleComponent {
  protected readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AutenticacionFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** Parámetro de ruta :id */
  readonly id = input.required<string>();

  protected readonly limites = LIMITES_COMENTARIO;
  protected readonly temaId = computed(() => Number(this.id()));
  protected readonly tema = computed(() => this.foro.tema(this.temaId()));
  protected readonly ocultoPorModeracion = computed(() => this.foro.temaOcultoPorModeracion(this.temaId()));
  protected readonly comentarios = computed(() => (this.tema() ? this.foro.comentariosDe(this.temaId()) : []));

  private readonly validadoresComentario = [
    Validators.required,
    Validators.minLength(LIMITES_COMENTARIO.min),
    Validators.maxLength(LIMITES_COMENTARIO.max),
    sinSoloEspacios(),
    largoMinimoSinEspacios(LIMITES_COMENTARIO.min),
  ];

  protected readonly formComentario = this.fb.group({ contenido: ['', this.validadoresComentario] });
  protected readonly largoComentario = signal(0);

  /** Edición en línea de un comentario propio. */
  protected readonly editandoId = signal<number | null>(null);
  protected readonly formEdicion = this.fb.group({ contenido: ['', this.validadoresComentario] });
  protected readonly largoEdicion = signal(0);

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected comentar(): void {
    if (this.formComentario.invalid) {
      this.formComentario.markAllAsTouched();
      return;
    }
    const r = this.foro.comentar(this.temaId(), this.formComentario.controls.contenido.value);
    if (!r.ok) {
      this.notificaciones.error(r.error);
      return;
    }
    this.formComentario.reset();
    this.largoComentario.set(0);
    this.notificaciones.exito('Tu comentario fue publicado.', 'Comentario agregado');
  }

  protected iniciarEdicion(c: ComentarioVista): void {
    this.editandoId.set(c.id);
    this.formEdicion.reset({ contenido: c.contenido });
    this.largoEdicion.set(c.contenido.length);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  protected guardarEdicion(id: number): void {
    if (this.formEdicion.invalid) {
      this.formEdicion.markAllAsTouched();
      return;
    }
    const r = this.foro.editarComentario(id, this.formEdicion.controls.contenido.value);
    if (!r.ok) {
      this.notificaciones.error(r.error);
      return;
    }
    this.editandoId.set(null);
    this.notificaciones.exito('El comentario fue actualizado.');
  }

  protected async eliminarComentario(c: ComentarioVista): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar comentario',
      mensaje: '¿Seguro que quieres eliminar este comentario? Esta acción no se puede deshacer.',
      textoConfirmar: 'Eliminar',
      variante: 'danger',
    });
    if (!ok) return;
    const r = this.foro.eliminarComentario(c.id);
    if (r.ok) this.notificaciones.exito('El comentario fue eliminado.');
    else this.notificaciones.error(r.error);
  }

  protected async eliminarTema(): Promise<void> {
    const tema = this.tema();
    if (!tema) return;
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar tema',
      mensaje: `Se eliminará "${tema.titulo}" junto con sus ${tema.cantidadComentarios} comentarios. ¿Continuar?`,
      textoConfirmar: 'Eliminar tema',
      variante: 'danger',
    });
    if (!ok) return;
    const slug = tema.categoria?.slug;
    const r = this.foro.eliminarTema(tema.id);
    if (!r.ok) {
      this.notificaciones.error(r.error);
      return;
    }
    this.notificaciones.exito('El tema fue eliminado.');
    void this.router.navigateByUrl(slug ? `/categorias/${slug}` : '/');
  }
}
