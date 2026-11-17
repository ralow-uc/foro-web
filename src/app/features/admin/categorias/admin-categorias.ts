import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdministracionFacade, LIMITES_ADMIN } from '../../../core/facades/administracion.facade';
import { CategoriaConConteo } from '../../../core/models';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { IconoCategoriaComponent } from '../../../shared/components/icono-categoria/icono-categoria';
import { ConfirmacionService } from '../../../shared/services/confirmacion.service';
import { NotificacionService } from '../../../shared/services/notificacion.service';
import { largoMinimoSinEspacios, sinSoloEspacios } from '../../../shared/validators';
import { NavAdminComponent } from '../nav-admin';

/** Crear y editar categorías del foro (nombre único, slug automático). Solo ADMIN. */
@Component({
  selector: 'app-admin-categorias',
  imports: [ReactiveFormsModule, RouterLink, CampoErrorComponent, IconoCategoriaComponent, NavAdminComponent],
  templateUrl: './admin-categorias.html',
})
export class AdminCategoriasComponent {
  protected readonly admin = inject(AdministracionFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly limites = LIMITES_ADMIN;
  protected readonly editandoId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  private readonly nombreUnico: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
    c.value && !this.admin.nombreCategoriaDisponible(c.value, this.editandoId() ?? undefined)
      ? { duplicado: { mensaje: 'Ya existe una categoría con ese nombre.' } }
      : null;

  protected readonly form = this.fb.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITES_ADMIN.categoriaNombreMin),
        Validators.maxLength(LIMITES_ADMIN.categoriaNombreMax),
        sinSoloEspacios(),
        largoMinimoSinEspacios(LIMITES_ADMIN.categoriaNombreMin),
        this.nombreUnico,
      ],
    ],
    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITES_ADMIN.categoriaDescripcionMin),
        Validators.maxLength(LIMITES_ADMIN.categoriaDescripcionMax),
        largoMinimoSinEspacios(LIMITES_ADMIN.categoriaDescripcionMin),
      ],
    ],
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  /** Vista previa del slug mientras se escribe el nombre. */
  protected readonly slug = computed(() => this.admin.slugPara(this.valores().nombre ?? '', this.editandoId() ?? undefined));
  protected readonly largoDescripcion = computed(() => this.valores().descripcion?.length ?? 0);

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected editar(c: CategoriaConConteo): void {
    this.editandoId.set(c.id);
    this.error.set(null);
    this.form.reset({ nombre: c.nombre, descripcion: c.descripcion });
  }

  protected cancelar(): void {
    this.editandoId.set(null);
    this.error.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
  }

  protected guardar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.editandoId();
    const r = id === null ? this.admin.crearCategoria(this.form.getRawValue()) : this.admin.editarCategoria(id, this.form.getRawValue());
    if (!r.ok) {
      this.error.set(r.error);
      return;
    }
    this.notificaciones.exito(`La categoría "${r.valor.nombre}" fue ${id === null ? 'creada' : 'actualizada'}.`);
    this.cancelar();
  }

  protected async eliminar(c: CategoriaConConteo): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar categoría',
      mensaje: `¿Eliminar la categoría "${c.nombre}"?`,
      textoConfirmar: 'Eliminar',
      variante: 'danger',
    });
    if (!ok) return;
    const r = this.admin.eliminarCategoria(c.id);
    if (r.ok) this.notificaciones.exito('La categoría fue eliminada.');
    else this.notificaciones.error(r.error);
  }
}
