import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ForoFacade, LIMITES_TEMA } from '../../../core/facades/foro.facade';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { NotificacionService } from '../../../shared/services/notificacion.service';
import { largoMinimoSinEspacios, sinSoloEspacios } from '../../../shared/validators';

/** Crear (/temas/nuevo) o editar (/temas/:id/editar) un tema. */
@Component({
  selector: 'app-formulario-tema',
  imports: [ReactiveFormsModule, RouterLink, CampoErrorComponent],
  templateUrl: './formulario-tema.html',
})
export class FormularioTemaComponent implements OnInit {
  protected readonly foro = inject(ForoFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  /** :id (solo al editar) */
  readonly id = input<string>();
  /** ?categoria=slug para preseleccionar la categoría al crear. */
  readonly categoria = input<string>();

  protected readonly limites = LIMITES_TEMA;
  protected readonly esEdicion = computed(() => this.id() !== undefined);
  protected readonly error = signal<string | null>(null);
  protected readonly largoTitulo = signal(0);
  protected readonly largoContenido = signal(0);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    titulo: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITES_TEMA.tituloMin),
        Validators.maxLength(LIMITES_TEMA.tituloMax),
        sinSoloEspacios(),
        largoMinimoSinEspacios(LIMITES_TEMA.tituloMin),
      ],
    ],
    categoriaId: ['', [Validators.required]],
    contenido: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITES_TEMA.contenidoMin),
        Validators.maxLength(LIMITES_TEMA.contenidoMax),
        sinSoloEspacios(),
        largoMinimoSinEspacios(LIMITES_TEMA.contenidoMin),
      ],
    ],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id !== undefined) {
      const tema = this.foro.tema(Number(id));
      if (!tema) {
        void this.router.navigateByUrl('/temas/' + id, { replaceUrl: true });
        return;
      }
      if (!this.foro.puedeEditarTema(tema)) {
        void this.router.navigateByUrl('/acceso-denegado', { replaceUrl: true });
        return;
      }
      this.form.setValue({ titulo: tema.titulo, categoriaId: String(tema.categoriaId), contenido: tema.contenido });
    } else {
      const slug = this.categoria();
      const c = slug ? this.foro.categoriaPorSlug(slug) : undefined;
      if (c) this.form.controls.categoriaId.setValue(String(c.id));
    }
    this.actualizarContadores();
  }

  protected actualizarContadores(): void {
    this.largoTitulo.set(this.form.controls.titulo.value.length);
    this.largoContenido.set(this.form.controls.contenido.value.length);
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected enviar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = { titulo: v.titulo, contenido: v.contenido, categoriaId: Number(v.categoriaId) };
    const id = this.id();
    const r = id !== undefined ? this.foro.editarTema(Number(id), datos) : this.foro.crearTema(datos);
    if (!r.ok) {
      this.error.set(r.error);
      return;
    }
    this.notificaciones.exito(id !== undefined ? 'Los cambios fueron guardados.' : 'Tu tema ya está publicado.', id !== undefined ? 'Tema actualizado' : 'Tema publicado');
    void this.router.navigate(['/temas', r.valor.id]);
  }

  protected cancelar(): void {
    const id = this.id();
    void this.router.navigateByUrl(id !== undefined ? `/temas/${id}` : '/');
  }
}
