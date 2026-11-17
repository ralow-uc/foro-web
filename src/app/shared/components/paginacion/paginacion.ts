import { Component, computed, input, output } from '@angular/core';

/** Paginación de Bootstrap reutilizable. */
@Component({
  selector: 'app-paginacion',
  template: `
    @if (totalPaginas() > 1) {
      <nav [attr.aria-label]="etiqueta()">
        <ul class="pagination justify-content-center flex-wrap mb-0">
          <li class="page-item" [class.disabled]="pagina() === 1">
            <button type="button" class="page-link" (click)="ir(pagina() - 1)" aria-label="Página anterior">
              <i class="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
          </li>
          @for (n of paginas(); track n) {
            <li class="page-item" [class.active]="n === pagina()">
              <button type="button" class="page-link" (click)="ir(n)" [attr.aria-current]="n === pagina() ? 'page' : null">
                {{ n }}
              </button>
            </li>
          }
          <li class="page-item" [class.disabled]="pagina() === totalPaginas()">
            <button type="button" class="page-link" (click)="ir(pagina() + 1)" aria-label="Página siguiente">
              <i class="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
          </li>
        </ul>
      </nav>
    }
  `,
})
export class PaginacionComponent {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly etiqueta = input('Paginación');
  readonly cambiar = output<number>();

  protected readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  protected ir(n: number): void {
    if (n >= 1 && n <= this.totalPaginas() && n !== this.pagina()) this.cambiar.emit(n);
  }
}
