import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { SancionVista } from '../../../core/models';

/**
 * Marca "Baneado" con la norma y el motivo. Solo llega a mostrarse a MODERADOR
 * y ADMIN (o al autor en "Mis temas"), porque el ForoFacade oculta el contenido
 * baneado al resto de los usuarios.
 */
@Component({
  selector: 'app-aviso-baneo',
  imports: [DatePipe],
  template: `
    <div class="aviso d-flex gap-2 align-items-start small" [class.compacto]="compacto()" role="note">
      <span class="badge text-bg-danger flex-shrink-0"><i class="bi bi-slash-circle me-1" aria-hidden="true"></i>Baneado</span>
      <span class="min-w-0">
        @if (sancion().norma; as norma) {
          <strong>{{ norma.codigo }} · {{ norma.nombre }}.</strong>
        }
        Motivo: {{ sancion().motivo }}
        @if (!compacto()) {
          <span class="d-block text-body-secondary">
            Por &#64;{{ sancion().moderador.nombreUsuario }} el {{ sancion().fechaCreacion | date: 'd MMM y, HH:mm' }}
          </span>
        }
      </span>
    </div>
  `,
  styles: `
    .aviso { color: #7a1d25; background: #fdecea; border: 1.5px solid #f3b7bc; border-radius: 0.5rem; padding: 0.5rem 0.65rem; }
    .aviso.compacto { padding: 0.3rem 0.5rem; }
  `,
})
export class AvisoBaneoComponent {
  readonly sancion = input.required<SancionVista>();
  readonly compacto = input(false);
}
