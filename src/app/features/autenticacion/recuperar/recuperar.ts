import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AutenticacionFacade, MINUTOS_VALIDEZ_CODIGO } from '../../../core/facades/autenticacion.facade';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { PanelAutenticacionComponent } from '../../../shared/components/panel-autenticacion/panel-autenticacion';
import { RequisitosContrasenaComponent } from '../../../shared/components/requisitos-contrasena/requisitos-contrasena';
import { NotificacionService } from '../../../shared/services/notificacion.service';
import { CONTRASENA_MAX, PATRON_CONTRASENA_HTML, coincideCon, validadoresContrasena } from '../../../shared/validators';

type Paso = 1 | 2 | 3;

/** Recuperación de contraseña en 3 pasos: correo → código + nueva contraseña → éxito. */
@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink, CampoErrorComponent, PanelAutenticacionComponent, RequisitosContrasenaComponent],
  templateUrl: './recuperar.html',
  styleUrl: './recuperar.css',
})
export class RecuperarComponent {
  private readonly auth = inject(AutenticacionFacade);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly paso = signal<Paso>(1);
  protected readonly codigoSimulado = signal<string | null>(null);
  protected readonly correoConfirmado = signal('');
  private readonly nombreUsuario = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly minutosValidez = MINUTOS_VALIDEZ_CODIGO;
  protected readonly patronContrasena = PATRON_CONTRASENA_HTML;
  protected readonly maxContrasena = CONTRASENA_MAX;

  protected readonly formCorreo = this.fb.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
  });

  protected readonly formNueva = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    contrasena: ['', [Validators.required, ...validadoresContrasena(() => this.nombreUsuario())]],
    confirmacion: ['', [Validators.required, coincideCon('contrasena')]],
  });

  constructor() {
    this.formNueva.controls.contrasena.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.formNueva.controls.confirmacion.updateValueAndValidity());
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected nombreUsuarioActual(): string {
    return this.nombreUsuario();
  }

  /** Paso 1: verificar que el correo exista y "enviar" el código. */
  protected solicitarCodigo(): void {
    this.error.set(null);
    if (this.formCorreo.invalid) {
      this.formCorreo.markAllAsTouched();
      return;
    }
    const correo = this.formCorreo.controls.correo.value;
    const resultado = this.auth.solicitarRecuperacion(correo);
    if (!resultado.ok) {
      this.formCorreo.controls.correo.setErrors({ noRegistrado: { mensaje: resultado.error } });
      this.formCorreo.controls.correo.markAsTouched();
      return;
    }
    this.codigoSimulado.set(resultado.valor.codigo);
    this.nombreUsuario.set(resultado.valor.nombreUsuario);
    this.correoConfirmado.set(correo.trim().toLowerCase());
    this.formNueva.reset();
    this.paso.set(2);
    this.notificaciones.info(
      `Simulación de correo: tu código de verificación es ${resultado.valor.codigo}.`,
      'Código enviado',
      12000,
    );
  }

  /** Paso 2: validar código y guardar la nueva contraseña. */
  protected restablecer(): void {
    this.error.set(null);
    if (this.formNueva.invalid) {
      this.formNueva.markAllAsTouched();
      return;
    }
    const { codigo, contrasena } = this.formNueva.getRawValue();
    const resultado = this.auth.restablecerContrasena(this.correoConfirmado(), codigo, contrasena);
    if (!resultado.ok) {
      if (resultado.error.includes('código')) {
        this.formNueva.controls.codigo.setErrors({ codigoIncorrecto: { mensaje: resultado.error } });
      } else {
        this.error.set(resultado.error);
      }
      return;
    }
    this.paso.set(3);
    this.codigoSimulado.set(null);
    this.notificaciones.exito('Tu contraseña fue actualizada. Ya puedes ingresar.', 'Contraseña restablecida');
  }

  protected reenviar(): void {
    this.formCorreo.controls.correo.setValue(this.correoConfirmado());
    this.solicitarCodigo();
  }

  protected volverAlPaso1(): void {
    this.paso.set(1);
    this.codigoSimulado.set(null);
    this.error.set(null);
  }
}
