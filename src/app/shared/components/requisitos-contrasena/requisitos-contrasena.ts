import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { REGLAS_CONTRASENA, calcularFortaleza } from '../../validators';

/** Lista de requisitos en vivo (verde/rojo) + medidor de fortaleza de la contraseña. */
@Component({
  selector: 'app-requisitos-contrasena',
  template: `
    <div class="requisitos mt-2" aria-live="polite">
      <div class="d-flex justify-content-between align-items-center small mb-1">
        <span class="fw-bold">Seguridad de la contraseña</span>
        <span class="fw-bold" [class]="'texto-' + fortaleza().nivel">{{ fortaleza().etiqueta }}</span>
      </div>
      <div
        class="progress mb-2"
        role="progressbar"
        aria-label="Fortaleza de la contraseña"
        [attr.aria-valuenow]="fortaleza().porcentaje"
        aria-valuemin="0"
        aria-valuemax="100"
        style="height: 8px"
      >
        <div class="progress-bar" [class]="fortaleza().clase" [style.width.%]="fortaleza().porcentaje"></div>
      </div>
      <ul class="list-unstyled row g-0 small mb-0">
        @for (regla of reglas(); track regla.clave) {
          <li class="col-12 col-sm-6" [class.cumple]="regla.cumple" [class.no-cumple]="!regla.cumple">
            <i class="bi me-1" [class]="regla.cumple ? 'bi-check-circle-fill' : 'bi-x-circle'" aria-hidden="true"></i>
            {{ regla.descripcion }}
            <span class="visually-hidden">{{ regla.cumple ? '(cumple)' : '(no cumple)' }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .requisitos { background: var(--cc-crema); border-radius: 0.6rem; padding: 0.75rem 0.9rem; }
    .cumple { color: var(--cc-turquesa); }
    .no-cumple { color: var(--cc-rojo); }
    .texto-0 { color: var(--bs-secondary-color); }
    .texto-1 { color: var(--cc-rojo); }
    .texto-2 { color: #8a6100; }
    .texto-3, .texto-4 { color: var(--cc-turquesa); }
  `,
})
export class RequisitosContrasenaComponent {
  readonly control = input.required<AbstractControl>();
  readonly nombreUsuario = input<string | null | undefined>(null);

  private readonly version = signal(0);
  private readonly valor = computed(() => {
    this.version();
    return (this.control().value ?? '') as string;
  });

  protected readonly reglas = computed(() =>
    REGLAS_CONTRASENA.map((r) => ({
      clave: r.clave,
      descripcion: r.descripcion,
      cumple: r.cumple(this.valor(), this.nombreUsuario()),
    })),
  );

  protected readonly fortaleza = computed(() => calcularFortaleza(this.valor(), this.nombreUsuario()));

  constructor() {
    effect((onCleanup) => {
      const sub = this.control().valueChanges.subscribe(() => this.version.update((v) => v + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }
}
