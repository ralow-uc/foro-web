import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AdministracionFacade, LIMITES_ADMIN, PATRON_CODIGO_NORMA } from '../../../core/facades/administracion.facade';
import { ETIQUETA_GRAVEDAD, GRAVEDADES, Gravedad, Norma } from '../../../core/models';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { ConfirmacionService } from '../../../shared/services/confirmacion.service';
import { NotificacionService } from '../../../shared/services/notificacion.service';
import { largoMinimoSinEspacios, sinSoloEspacios } from '../../../shared/validators';
import { NavAdminComponent } from '../nav-admin';

/** CRUD de normas del foro (código N1..N999 único, gravedad, vigencia). Solo ADMIN. */
@Component({
  selector: 'app-admin-normas',
  imports: [ReactiveFormsModule, CampoErrorComponent, NavAdminComponent],
  templateUrl: './admin-normas.html',
})
export class AdminNormasComponent {
  protected readonly admin = inject(AdministracionFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly limites = LIMITES_ADMIN;
  protected readonly gravedades = GRAVEDADES;
  protected readonly etiquetaGravedad = ETIQUETA_GRAVEDAD;
  /** Mismo patrón para el atributo HTML `pattern`. */
  protected readonly patronCodigoHtml = '[Nn][1-9][0-9]{0,2}';
  protected readonly editandoId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  private readonly codigoUnico: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
    c.value && PATRON_CODIGO_NORMA.test(c.value) && !this.admin.codigoNormaDisponible(c.value, this.editandoId() ?? undefined)
      ? { duplicado: { mensaje: 'Ya existe una norma con ese código.' } }
      : null;

  protected readonly form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(4), Validators.pattern(PATRON_CODIGO_NORMA), this.codigoUnico]],
    nombre: [
      '',
      [Validators.required, Validators.minLength(LIMITES_ADMIN.normaNombreMin), Validators.maxLength(LIMITES_ADMIN.normaNombreMax), sinSoloEspacios()],
    ],
    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITES_ADMIN.normaDescripcionMin),
        Validators.maxLength(LIMITES_ADMIN.normaDescripcionMax),
        largoMinimoSinEspacios(LIMITES_ADMIN.normaDescripcionMin),
      ],
    ],
    gravedad: ['LEVE' as Gravedad, [Validators.required]],
    activa: [true],
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly largoDescripcion = computed(() => this.valores().descripcion?.length ?? 0);

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected claseGravedad(g: Gravedad): string {
    return g === 'CRITICA' ? 'text-bg-danger' : g === 'GRAVE' ? 'text-bg-warning' : 'text-bg-secondary';
  }

  protected editar(n: Norma): void {
    this.editandoId.set(n.id);
    this.error.set(null);
    this.form.reset({ codigo: n.codigo, nombre: n.nombre, descripcion: n.descripcion, gravedad: n.gravedad, activa: n.activa });
  }

  protected cancelar(): void {
    this.editandoId.set(null);
    this.error.set(null);
    this.form.reset({ codigo: '', nombre: '', descripcion: '', gravedad: 'LEVE', activa: true });
  }

  protected guardar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.editandoId();
    const datos = this.form.getRawValue();
    const r = id === null ? this.admin.crearNorma(datos) : this.admin.editarNorma(id, datos);
    if (!r.ok) {
      this.error.set(r.error);
      return;
    }
    this.notificaciones.exito(`La norma ${r.valor.codigo} fue ${id === null ? 'creada' : 'actualizada'}.`);
    this.cancelar();
  }

  protected async eliminar(n: Norma & { usos: number }): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar norma',
      mensaje: `¿Eliminar la norma ${n.codigo} · ${n.nombre}?`,
      textoConfirmar: 'Eliminar',
      variante: 'danger',
    });
    if (!ok) return;
    const r = this.admin.eliminarNorma(n.id);
    if (r.ok) this.notificaciones.exito(`La norma ${n.codigo} fue eliminada.`);
    else this.notificaciones.error(r.error);
  }
}
