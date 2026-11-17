import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página 404. */
@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  template: `
    <section class="container py-5">
      <div class="row align-items-center g-4 justify-content-center">
        <div class="col-12 col-md-6 col-lg-5 text-center">
          <img src="img/ilustracion-pieza-perdida.svg" alt="" class="img-fluid" width="320" height="260" />
        </div>
        <div class="col-12 col-md-6 col-lg-5 text-center text-md-start">
          <p class="etiqueta-superior mb-2">Error 404</p>
          <h1 class="display-5">Se nos perdió una pieza</h1>
          <p class="lead">La página que buscas no existe o fue movida. Revisa la dirección o vuelve al inicio.</p>
          <a routerLink="/" class="btn btn-primary btn-lg btn-sticker"><i class="bi bi-house me-2"></i>Volver al inicio</a>
        </div>
      </div>
    </section>
  `,
})
export class NoEncontradoComponent {}
