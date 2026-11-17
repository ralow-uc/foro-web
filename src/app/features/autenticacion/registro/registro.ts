import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionFacade, MENSAJES_AUTENTICACION } from '../../../core/facades/autenticacion.facade';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { PanelAutenticacionComponent } from '../../../shared/components/panel-autenticacion/panel-autenticacion';
import { RequisitosContrasenaComponent } from '../../../shared/components/requisitos-contrasena/requisitos-contrasena';
import { NotificacionService } from '../../../shared/services/notificacion.service';
import {
  CONTRASENA_MAX,
  PATRON_CONTRASENA_HTML,
  coincideCon,
  edadMinima,
  fechaMaximaParaEdad,
  validadoresContrasena,
} from '../../../shared/validators';

export const PATRON_NOMBRE_USUARIO = '[A-Za-z0-9._\\-]{3,30}';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, CampoErrorComponent, PanelAutenticacionComponent, RequisitosContrasenaComponent],
  templateUrl: './registro.html',
})
export class RegistroComponent {
  private readonly auth = inject(AutenticacionFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly patronUsuario = PATRON_NOMBRE_USUARIO;
  protected readonly patronContrasena = PATRON_CONTRASENA_HTML;
  protected readonly maxContrasena = CONTRASENA_MAX;
  protected readonly fechaMaxima = fechaMaximaParaEdad(13);
  protected readonly verContrasena = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Validador síncrono que consulta al facade si el valor ya está registrado. */
  private disponible(consulta: (valor: string) => boolean, mensaje: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      control.value && !consulta(control.value) ? { duplicado: { mensaje } } : null;
  }

  /** Se declara aparte para que el validador de contraseña pueda leer el usuario actual. */
  private readonly controlUsuario = this.fb.control('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(30),
    Validators.pattern(/^[A-Za-z0-9._-]+$/),
    this.disponible((v) => this.auth.nombreUsuarioDisponible(v), MENSAJES_AUTENTICACION.usuarioDuplicado),
  ]);

  protected readonly form = this.fb.group({
    nombreUsuario: this.controlUsuario,
    correo: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(100),
        this.disponible((v) => this.auth.correoDisponible(v), MENSAJES_AUTENTICACION.correoDuplicado),
      ],
    ],
    contrasena: ['', [Validators.required, ...validadoresContrasena(() => this.controlUsuario.value)]],
    confirmacion: ['', [Validators.required, coincideCon('contrasena')]],
    fechaNacimiento: ['', [edadMinima(13)]],
    aceptaNormas: [false, [Validators.requiredTrue]],
  });

  constructor() {
    // Si cambia el usuario o la contraseña, se revalidan los campos dependientes.
    this.form.controls.nombreUsuario.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.contrasena.updateValueAndValidity({ emitEvent: false }));
    this.form.controls.contrasena.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmacion.updateValueAndValidity());
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected enviar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificaciones.error('Revisa los campos marcados en rojo.', 'Formulario incompleto');
      return;
    }
    const datos = this.form.getRawValue();
    const resultado = this.auth.registrar({
      nombreUsuario: datos.nombreUsuario,
      correo: datos.correo,
      contrasena: datos.contrasena,
      fechaNacimiento: datos.fechaNacimiento || null,
    });
    if (!resultado.ok) {
      this.error.set(resultado.error);
      return;
    }
    this.notificaciones.exito(`Tu cuenta @${resultado.valor.nombreUsuario} fue creada. ¡Bienvenido a CuboClub!`, 'Registro exitoso');
    void this.router.navigateByUrl('/perfil');
  }
}
