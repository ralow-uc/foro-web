import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Encabezado común de las páginas de administración (solo ADMIN). */
@Component({
  selector: 'app-nav-admin',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
      <div>
        <p class="small text-uppercase text-body-secondary fw-bold mb-1"><i class="bi bi-gear me-1" aria-hidden="true"></i>Administración</p>
        <h1 class="h2 mb-1">{{ titulo() }}</h1>
        <p class="text-body-secondary mb-0">{{ descripcion() }}</p>
      </div>
      <nav class="nav nav-pills flex-nowrap overflow-auto" aria-label="Secciones de administración">
        <a class="nav-link text-nowrap" routerLink="/admin/usuarios" routerLinkActive="active"><i class="bi bi-people me-1" aria-hidden="true"></i>Usuarios</a>
        <a class="nav-link text-nowrap" routerLink="/admin/categorias" routerLinkActive="active"><i class="bi bi-grid-3x3-gap me-1" aria-hidden="true"></i>Categorías</a>
        <a class="nav-link text-nowrap" routerLink="/admin/normas" routerLinkActive="active"><i class="bi bi-journal-text me-1" aria-hidden="true"></i>Normas</a>
      </nav>
    </div>
  `,
})
export class NavAdminComponent {
  readonly titulo = input.required<string>();
  readonly descripcion = input('');
}
