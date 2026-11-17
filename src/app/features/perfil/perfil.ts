import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AutenticacionFacade, MENSAJES_AUTENTICACION } from '../../core/facades/autenticacion.facade';
import { ForoFacade } from '../../core/facades/foro.facade';
import { COLORES_AVATAR, ETIQUETA_ROL, METODOS_RESOLUCION, MetodoResolucion } from '../../core/models';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { BadgeRolComponent } from '../../shared/components/badge-rol/badge-rol';
import { CampoErrorComponent } from '../../shared/components/campo-error/campo-error';
import { RequisitosContrasenaComponent } from '../../shared/components/requisitos-contrasena/requisitos-contrasena';
import { NotificacionService } from '../../shared/services/notificacion.service';
import {
  CONTRASENA_MAX,
  PATRON_CONTRASENA_HTML,
  coincideCon,
  distintoDe,
  sinSoloEspacios,
  validadoresContrasena,
} from '../../shared/validators';

export const LIMITES_PERFIL = { nombreMin: 2, nombreMax: 50, biografiaMax: 280, ciudadMax: 60, cuboMax: 60 } as const;

/** Letras (con tildes), espacios, punto, apóstrofo y guion: "Viña del Mar", "Ñuñoa". */
export const PATRON_CIUDAD = "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'\\-]*";

/** Modificación de perfil del usuario en sesión y cambio de contraseña. */
@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, AvatarComponent, BadgeRolComponent, CampoErrorComponent, RequisitosContrasenaComponent],
  templateUrl: './perfil.html',
})
export class PerfilComponent {
  protected readonly auth = inject(AutenticacionFacade);
  private readonly foro = inject(ForoFacade);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly limites = LIMITES_PERFIL;
  protected readonly patronCiudad = PATRON_CIUDAD;
  protected readonly metodos = METODOS_RESOLUCION;
  protected readonly colores = COLORES_AVATAR;
  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly patronContrasena = PATRON_CONTRASENA_HTML;
  protected readonly maxContrasena = CONTRASENA_MAX;

  protected readonly usuario = this.auth.usuarioActual;
  protected readonly cantidadTemas = computed(() => this.foro.misTemas().length);
  protected readonly errorPerfil = signal<string | null>(null);
  protected readonly errorContrasena = signal<string | null>(null);
  protected readonly verContrasenas = signal(false);

  /** El correo puede quedar igual; si cambia, no debe estar usado por otra cuenta. */
  private readonly correoDisponible: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
    control.value && !this.auth.correoDisponible(control.value, this.usuario()?.id)
      ? { duplicado: { mensaje: MENSAJES_AUTENTICACION.correoDuplicado } }
      : null;

  protected readonly formPerfil = this.fb.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(100), this.correoDisponible]],
    nombreVisible: [
      '',
      [Validators.required, Validators.minLength(LIMITES_PERFIL.nombreMin), Validators.maxLength(LIMITES_PERFIL.nombreMax), sinSoloEspacios()],
    ],
    biografia: ['', [Validators.maxLength(LIMITES_PERFIL.biografiaMax)]],
    ciudad: ['', [Validators.maxLength(LIMITES_PERFIL.ciudadMax), Validators.pattern(new RegExp(`^${PATRON_CIUDAD}$`))]],
    cuboFavorito: ['', [Validators.maxLength(LIMITES_PERFIL.cuboMax)]],
    metodoPrincipal: ['CFOP' as MetodoResolucion, [Validators.required]],
    colorAvatar: ['#c7421a', [Validators.required]],
  });

  protected readonly formContrasena = this.fb.group({
    actual: ['', [Validators.required]],
    nueva: [
      '',
      [
        Validators.required,
        ...validadoresContrasena(() => this.usuario()?.nombreUsuario),
        distintoDe('actual', 'La nueva contraseña debe ser distinta de la actual.'),
      ],
    ],
    confirmacion: ['', [Validators.required, coincideCon('nueva')]],
  });

  /** Vista previa en vivo del avatar y del nombre (signals alimentados por el formulario). */
  protected readonly vistaPrevia = signal({ nombre: '', color: '#c7421a' });
  protected readonly largoBiografia = signal(0);

  constructor() {
    this.restablecer();
    this.formPerfil.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      this.vistaPrevia.set({ nombre: v.nombreVisible || this.usuario()?.nombreUsuario || '', color: v.colorAvatar ?? '#c7421a' });
      this.largoBiografia.set(v.biografia?.length ?? 0);
    });
    this.formContrasena.controls.nueva.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.formContrasena.controls.confirmacion.updateValueAndValidity());
    this.formContrasena.controls.actual.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.formContrasena.controls.nueva.updateValueAndValidity({ emitEvent: false }));
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  /** Carga en el formulario los datos actuales del usuario. */
  protected restablecer(): void {
    const u = this.usuario();
    if (!u) return;
    this.formPerfil.reset({
      correo: u.correo,
      nombreVisible: u.nombreVisible,
      biografia: u.biografia,
      ciudad: u.ciudad,
      cuboFavorito: u.cuboFavorito,
      metodoPrincipal: u.metodoPrincipal,
      colorAvatar: u.colorAvatar,
    });
    this.vistaPrevia.set({ nombre: u.nombreVisible, color: u.colorAvatar });
    this.largoBiografia.set(u.biografia.length);
    this.errorPerfil.set(null);
  }

  protected guardarPerfil(): void {
    this.errorPerfil.set(null);
    if (this.formPerfil.invalid) {
      this.formPerfil.markAllAsTouched();
      this.notificaciones.error('Revisa los campos marcados en rojo.', 'Perfil incompleto');
      return;
    }
    const r = this.auth.actualizarPerfil(this.formPerfil.getRawValue());
    if (!r.ok) {
      this.errorPerfil.set(r.error);
      return;
    }
    this.formPerfil.markAsPristine();
    this.notificaciones.exito('Tus datos se guardaron correctamente.', 'Perfil actualizado');
  }

  protected cambiarContrasena(): void {
    this.errorContrasena.set(null);
    if (this.formContrasena.invalid) {
      this.formContrasena.markAllAsTouched();
      return;
    }
    const { actual, nueva } = this.formContrasena.getRawValue();
    const r = this.auth.cambiarContrasena(actual, nueva);
    if (!r.ok) {
      this.errorContrasena.set(r.error);
      return;
    }
    this.formContrasena.reset();
    this.notificaciones.exito('Usa tu nueva contraseña la próxima vez que ingreses.', 'Contraseña actualizada');
  }
}
