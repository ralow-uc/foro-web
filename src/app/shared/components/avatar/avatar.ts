import { Component, computed, input } from '@angular/core';

/** Avatar circular con iniciales y el color elegido por el usuario. */
@Component({
  selector: 'app-avatar',
  template: `
    <span
      class="avatar"
      [style.background]="color()"
      [style.width.px]="tamano()"
      [style.height.px]="tamano()"
      [style.font-size.px]="tamano() * 0.4"
      [attr.title]="nombre()"
      aria-hidden="true"
      >{{ iniciales() }}</span
    >
  `,
  styles: `
    .avatar {
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
      border-radius: 30%; color: #fff; font-family: var(--cc-fuente-titulos); font-weight: 800;
      border: 2px solid var(--cc-tinta); text-transform: uppercase; letter-spacing: -0.02em;
    }
  `,
})
export class AvatarComponent {
  readonly nombre = input.required<string>();
  readonly color = input('#17162b');
  readonly tamano = input(36);

  protected readonly iniciales = computed(() => {
    const partes = this.nombre().trim().split(/[\s._-]+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2);
    return partes[0][0] + partes[1][0];
  });
}
