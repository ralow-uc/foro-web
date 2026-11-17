import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página que se muestra cuando un guard niega el acceso por rol. */
@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink],
  template: `
    <section class="container py-5">
      <div class="row align-items-center g-4 justify-content-center">
        <div class="col-12 col-md-6 col-lg-5 text-center">
          <img src="img/ilustracion-acceso.svg" alt="" class="img-fluid" width="320" height="260" />
        </div>
        <div class="col-12 col-md-6 col-lg-5 text-center text-md-start">
          <p class="etiqueta-superior mb-2">Error 403</p>
          <h1 class="display-5">Acceso denegado</h1>
          <p class="lead">Tu cuenta no tiene los permisos necesarios para ver esta sección.</p>
          <p class="text-body-secondary">
            Si crees que es un error, contacta a un administrador del foro.
          </p>
          <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
            <a routerLink="/" class="btn btn-primary btn-sticker"><i class="bi bi-house me-2"></i>Ir al inicio</a>
            <a routerLink="/normas" class="btn btn-outline-primary">Ver normas</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AccesoDenegadoComponent {}
