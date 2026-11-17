import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { ConfirmacionService, SolicitudConfirmacion } from '../../services/confirmacion.service';
import { ControladorModal } from '../../services/bootstrap';

/** Modal global de confirmación (Bootstrap Modal) controlado por ConfirmacionService. */
@Component({
  selector: 'app-modal-confirmacion',
  template: `
    <div class="modal fade" #modal tabindex="-1" aria-labelledby="tituloConfirmacion" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title fs-5" id="tituloConfirmacion">{{ visible()?.titulo }}</h2>
            <button type="button" class="btn-close" aria-label="Cerrar" (click)="responder(false)"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ visible()?.mensaje }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="responder(false)">Cancelar</button>
            <button
              type="button"
              class="btn"
              [class]="'btn-' + (visible()?.variante ?? 'primary')"
              (click)="responder(true)"
              data-prueba="confirmar"
            >
              {{ visible()?.textoConfirmar ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModalConfirmacionComponent {
  private readonly servicio = inject(ConfirmacionService);
  private readonly modalRef = viewChild.required<ElementRef<HTMLElement>>('modal');
  private readonly controlador = new ControladorModal(() => this.modalRef().nativeElement);

  /** Copia de la solicitud mostrada (se conserva durante la animación de cierre). */
  protected readonly visible = signal<SolicitudConfirmacion | null>(null);

  constructor() {
    effect(() => {
      const solicitud = this.servicio.solicitud();
      if (solicitud) {
        this.visible.set(solicitud);
        this.controlador.abrir();
      } else {
        this.controlador.cerrar();
      }
    });
    effect((onCleanup) => {
      const el = this.modalRef().nativeElement;
      // Si el usuario cierra con Esc o clic fuera, se cuenta como "cancelar".
      const alOcultar = (): void => this.servicio.responder(false);
      el.addEventListener('hidden.bs.modal', alOcultar);
      onCleanup(() => el.removeEventListener('hidden.bs.modal', alOcultar));
    });
  }

  protected responder(confirmado: boolean): void {
    this.servicio.responder(confirmado);
  }
}
