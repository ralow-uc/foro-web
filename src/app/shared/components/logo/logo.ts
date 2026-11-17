import { Component, input } from '@angular/core';

/** Logo de CuboClub: cubo isométrico propio (public/img/logo-cuboclub.svg) + nombre. */
@Component({
  selector: 'app-logo',
  template: `
    <span class="d-inline-flex align-items-center gap-2">
      <img src="img/logo-cuboclub.svg" [width]="tamano()" [height]="tamano()" alt="" aria-hidden="true" />
      @if (conTexto()) {
        <span class="lh-1">
          <span class="d-block fw-bold marca">Cubo<span class="acento">Club</span></span>
          @if (conLema()) {
            <small class="d-block lema">Foro de speedcubing</small>
          }
        </span>
      }
    </span>
  `,
  styles: `
    .marca { font-family: var(--cc-fuente-titulos); font-size: 1.3rem; letter-spacing: -0.03em; }
    .acento { color: var(--cc-naranja-vivo); }
    .lema { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.75; margin-top: 2px; }
  `,
})
export class LogoComponent {
  readonly tamano = input(36);
  readonly conTexto = input(true);
  readonly conLema = input(true);
}
