import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionFacade } from '../../../core/facades/autenticacion.facade';
import { CONTRASENA_DEMO } from '../../../core/data';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { PanelAutenticacionComponent } from '../../../shared/components/panel-autenticacion/panel-autenticacion';
import { NotificacionService } from '../../../shared/services/notificacion.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CampoErrorComponent, PanelAutenticacionComponent],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly auth = inject(AutenticacionFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  /** URL a la que volver tras iniciar sesión (query param `volver`, lo pone el authGuard). */
  readonly volver = input<string | undefined>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    contrasena: ['', [Validators.required, Validators.maxLength(64)]],
  });

  protected readonly error = signal<string | null>(null);
  protected readonly verContrasena = signal(false);

  /** Cuentas de demostración (mismas del seed del backend). */
  protected readonly cuentasDemo = [
    { correo: 'admin@foro.cl', rol: 'ADMIN' },
    { correo: 'moderadora@foro.cl', rol: 'MODERADOR' },
    { correo: 'feliks@foro.cl', rol: 'USUARIO' },
    { correo: 'tymon@foro.cl', rol: 'Inactivo' },
  ];

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected usarCuenta(correo: string): void {
    this.form.setValue({ correo, contrasena: CONTRASENA_DEMO });
    this.error.set(null);
  }

  protected enviar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { correo, contrasena } = this.form.getRawValue();
    const resultado = this.auth.iniciarSesion(correo, contrasena);
    if (!resultado.ok) {
      this.error.set(resultado.error);
      return;
    }
    this.notificaciones.exito(`¡Hola de nuevo, ${resultado.valor.nombreVisible}!`, 'Sesión iniciada');
    const destino = this.volver();
    void this.router.navigateByUrl(destino && destino.startsWith('/') ? destino : '/');
  }
}
