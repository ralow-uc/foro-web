import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/** Mensajes por defecto para los errores estándar de Angular. */
function mensajePorDefecto(clave: string, detalle: unknown): string {
  const d = (detalle ?? {}) as Record<string, unknown>;
  switch (clave) {
    case 'required':
      return 'Este campo es obligatorio.';
    case 'minlength':
      return `Debe tener al menos ${d['requiredLength']} caracteres (llevas ${d['actualLength']}).`;
    case 'maxlength':
      return `No puede superar los ${d['requiredLength']} caracteres.`;
    case 'email':
      return 'Ingresa un correo válido, por ejemplo nombre@dominio.cl.';
    case 'pattern':
      return 'El formato ingresado no es válido.';
    case 'min':
      return `El valor mínimo es ${d['min']}.`;
    case 'max':
      return `El valor máximo es ${d['max']}.`;
    default:
      return typeof d['mensaje'] === 'string' ? (d['mensaje'] as string) : 'El valor no es válido.';
  }
}

/**
 * Muestra el primer error de un control con el estilo `invalid-feedback` de Bootstrap,
 * solo cuando el control fue tocado (blur) o el formulario se intentó enviar.
 * Se suscribe a `control.events` para funcionar con detección de cambios OnPush.
 */
@Component({
  selector: 'app-campo-error',
  template: `
    @if (mensaje(); as texto) {
      <div class="invalid-feedback d-block" [attr.id]="idError()" role="alert">
        <i class="bi bi-exclamation-circle me-1" aria-hidden="true"></i>{{ texto }}
      </div>
    }
  `,
})
export class CampoErrorComponent {
  readonly control = input.required<AbstractControl>();
  /** Mensajes personalizados por clave de error (sobrescriben a los por defecto). */
  readonly mensajes = input<Record<string, string>>({});
  readonly idError = input<string | null>(null);

  private readonly version = signal(0);

  protected readonly mensaje = computed(() => {
    this.version();
    const control = this.control();
    if (!control.invalid || !control.touched || !control.errors) return null;
    // "pattern" al final: los validadores específicos explican mejor el problema.
    const claves = Object.keys(control.errors).sort((a, b) => (a === 'pattern' ? 1 : b === 'pattern' ? -1 : 0));
    const clave = claves[0];
    return this.mensajes()[clave] ?? mensajePorDefecto(clave, control.errors[clave]);
  });

  constructor() {
    effect((onCleanup) => {
      const sub = this.control().events.subscribe(() => this.version.update((v) => v + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }
}
