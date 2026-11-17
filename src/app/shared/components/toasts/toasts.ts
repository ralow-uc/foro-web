import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  computed,
  DestroyRef,
} from '@angular/core';
import { Notificacion, NotificacionService } from '../../services/notificacion.service';
import { obtenerBootstrap } from '../../services/bootstrap';

/** Un toast individual: se muestra con el plugin Toast de Bootstrap y avisa al ocultarse. */
@Component({
  selector: 'app-toast-item',
  template: `
    <div class="toast border-0" role="status" aria-live="polite" aria-atomic="true">
      <div class="toast-header" [class]="claseCabecera()">
        <i class="bi me-2" [class]="icono()" aria-hidden="true"></i>
        <strong class="me-auto">{{ notificacion().titulo }}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
      <div class="toast-body">{{ notificacion().mensaje }}</div>
    </div>
  `,
  styles: `
    .toast { border: 2px solid var(--cc-tinta) !important; box-shadow: var(--cc-sombra); background: var(--cc-blanco); }
    .toast-header { color: #fff; border-bottom: 0; }
    .toast-header .btn-close { filter: invert(1) grayscale(1) brightness(2); }
    .cab-info { background: var(--cc-azul); }
    .cab-exito { background: var(--cc-turquesa); }
    .cab-error { background: var(--cc-rojo); }
    .cab-advertencia { background: var(--cc-amarillo); color: var(--cc-tinta); }
    .cab-advertencia .btn-close { filter: none; }
  `,
})
export class ToastItemComponent {
  readonly notificacion = input.required<Notificacion>();
  readonly cerrado = output<void>();

  protected readonly claseCabecera = computed(() => `cab-${this.notificacion().tipo}`);
  protected readonly icono = computed(
    () =>
      ({
        exito: 'bi-check-circle-fill',
        error: 'bi-x-octagon-fill',
        info: 'bi-info-circle-fill',
        advertencia: 'bi-exclamation-triangle-fill',
      })[this.notificacion().tipo],
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = host.nativeElement.querySelector('.toast');
      const bs = obtenerBootstrap();
      if (!el || !bs) {
        const t = setTimeout(() => this.cerrado.emit(), this.notificacion().duracionMs);
        destroyRef.onDestroy(() => clearTimeout(t));
        return;
      }
      el.addEventListener('hidden.bs.toast', () => this.cerrado.emit());
      bs.Toast.getOrCreateInstance(el, { delay: this.notificacion().duracionMs }).show();
      destroyRef.onDestroy(() => bs.Toast.getInstance(el)?.dispose());
    });
  }
}

/** Contenedor global de toasts (esquina inferior derecha). */
@Component({
  selector: 'app-toasts',
  imports: [ToastItemComponent],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      @for (n of servicio.notificaciones(); track n.id) {
        <app-toast-item [notificacion]="n" (cerrado)="servicio.quitar(n.id)" />
      }
    </div>
  `,
  styles: `.toast-container { z-index: 1090; }`,
})
export class ToastsComponent {
  protected readonly servicio = inject(NotificacionService);
}
