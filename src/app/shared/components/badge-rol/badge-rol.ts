import { Component, computed, input } from '@angular/core';
import { ETIQUETA_ROL, Rol } from '../../../core/models';

/** Insignia de color según el rol (ADMIN, MODERADOR, USUARIO). */
@Component({
  selector: 'app-badge-rol',
  template: `<span class="badge rounded-pill" [class]="clase()"
    ><i class="bi me-1" [class]="icono()" aria-hidden="true"></i>{{ etiqueta() }}</span
  >`,
})
export class BadgeRolComponent {
  readonly rol = input.required<Rol>();

  protected readonly etiqueta = computed(() => ETIQUETA_ROL[this.rol()]);
  protected readonly clase = computed(
    () =>
      ({
        ADMIN: 'text-bg-danger',
        MODERADOR: 'text-bg-warning',
        USUARIO: 'text-bg-light border',
      })[this.rol()],
  );
  protected readonly icono = computed(
    () => ({ ADMIN: 'bi-shield-lock-fill', MODERADOR: 'bi-shield-check', USUARIO: 'bi-person' })[this.rol()],
  );
}
