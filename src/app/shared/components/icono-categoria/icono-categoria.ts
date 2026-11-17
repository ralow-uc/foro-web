import { Component, input } from '@angular/core';

/** Íconos SVG propios para cada categoría (dibujados a mano, sin recursos externos). */
@Component({
  selector: 'app-icono-categoria',
  template: `
    <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 48 48" aria-hidden="true" class="icono">
      <rect x="1.5" y="1.5" width="45" height="45" rx="11" [attr.fill]="fondo()" stroke="#17162b" stroke-width="3" />
      @switch (slug()) {
        @case ('cubo-3x3') {
          @for (i of tres; track i) {
            @for (j of tres; track j) {
              <rect [attr.x]="11 + i * 9" [attr.y]="11 + j * 9" width="7.5" height="7.5" rx="1.6"
                [attr.fill]="(i + j) % 2 === 0 ? '#fffdf8' : '#f4b92b'" stroke="#17162b" stroke-width="1.5" />
            }
          }
        }
        @case ('big-cubes') {
          @for (i of cinco; track i) {
            @for (j of cinco; track j) {
              <rect [attr.x]="10 + i * 5.8" [attr.y]="10 + j * 5.8" width="4.6" height="4.6" rx="1"
                [attr.fill]="i === j || i + j === 4 ? '#ff7a3d' : '#fffdf8'" stroke="#17162b" stroke-width="1" />
            }
          }
        }
        @case ('metodos-y-algoritmos') {
          <path d="M12 17h18l-5-5M36 31H18l5 5" fill="none" stroke="#fffdf8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
          <text x="24" y="28" text-anchor="middle" font-size="9" font-weight="800" fill="#f4b92b" font-family="monospace">R U R'</text>
        }
        @case ('puzzles-no-cubicos') {
          <polygon points="24,10 38,35 10,35" fill="#f4b92b" stroke="#17162b" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M17 22.5h14M24 35l-7-12.5M24 35l7-12.5" stroke="#17162b" stroke-width="2" />
        }
        @case ('competencias-wca') {
          <circle cx="24" cy="26" r="11" fill="#fffdf8" stroke="#17162b" stroke-width="2.5" />
          <rect x="21" y="9" width="6" height="5" rx="1.5" fill="#17162b" />
          <path d="M24 26V19M24 26l5 3" stroke="#c7421a" stroke-width="2.5" stroke-linecap="round" />
        }
        @case ('hardware-y-mods') {
          <path d="M14 14h7v12a3 3 0 0 0 6 0V14h7v12a10 10 0 0 1-20 0z" fill="#fffdf8" stroke="#17162b" stroke-width="2.5" stroke-linejoin="round" />
          <rect x="14" y="14" width="7" height="5" fill="#c22f3a" stroke="#17162b" stroke-width="2" />
          <rect x="27" y="14" width="7" height="5" fill="#2b50d6" stroke="#17162b" stroke-width="2" />
        }
        @default {
          <path d="M24 11l12 7v12l-12 7-12-7V18z" fill="#fffdf8" stroke="#17162b" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M12 18l12 7 12-7M24 25v12" fill="none" stroke="#17162b" stroke-width="2.5" />
        }
      }
    </svg>
  `,
  styles: `.icono { flex-shrink: 0; display: block; }`,
})
export class IconoCategoriaComponent {
  readonly slug = input.required<string>();
  readonly tamano = input(48);

  protected readonly tres = [0, 1, 2];
  protected readonly cinco = [0, 1, 2, 3, 4];

  protected fondo(): string {
    const colores: Record<string, string> = {
      'cubo-3x3': '#c7421a',
      'big-cubes': '#2b50d6',
      'metodos-y-algoritmos': '#17162b',
      'puzzles-no-cubicos': '#0b7f73',
      'competencias-wca': '#f4b92b',
      'hardware-y-mods': '#efe7d8',
    };
    return colores[this.slug()] ?? '#7a4fc4';
  }
}
