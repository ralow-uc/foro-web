import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../logo/logo';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LogoComponent],
  template: `
    <footer class="pie mt-5">
      <div class="container py-4 py-md-5">
        <div class="row g-4 align-items-start">
          <div class="col-12 col-md-6 col-lg-5">
            <app-logo [tamano]="40" />
            <p class="mt-3 mb-0 small opacity-75">
              Comunidad hispanohablante de speedcubing y puzzles de giro. Proyecto académico de Desarrollo Full Stack III,
              Duoc UC.
            </p>
          </div>
          <div class="col-6 col-md-3 col-lg-2 offset-lg-1">
            <h2 class="h6 text-uppercase small opacity-75">Explorar</h2>
            <ul class="list-unstyled small mb-0">
              <li><a routerLink="/">Inicio</a></li>
              <li><a routerLink="/categorias/cubo-3x3">Cubo 3x3</a></li>
              <li><a routerLink="/normas">Normas del foro</a></li>
            </ul>
          </div>
          <div class="col-6 col-md-3 col-lg-4">
            <h2 class="h6 text-uppercase small opacity-75">Datos de demostración</h2>
            <p class="small mb-0 opacity-75">
              Esta versión funciona sin backend: los datos viven en memoria y se reinician al recargar la página.
            </p>
          </div>
        </div>
        <hr class="my-4 border-light opacity-25" />
        <p class="small mb-0 opacity-75">© 2026 CuboClub · Hecho con Angular y Bootstrap.</p>
      </div>
    </footer>
  `,
  styles: `
    .pie { background: var(--cc-tinta); color: #f1ecff; flex-shrink: 0; }
    a { color: #f1ecff; text-decoration: none; }
    a:hover { color: var(--cc-naranja-vivo); text-decoration: underline; }
    li { margin-bottom: 0.35rem; }
  `,
})
export class FooterComponent {}
