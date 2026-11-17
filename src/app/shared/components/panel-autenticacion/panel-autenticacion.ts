import { Component, input } from '@angular/core';

/** Marco visual común para login, registro y recuperación de contraseña. */
@Component({
  selector: 'app-panel-autenticacion',
  template: `
    <section class="fondo-cuadricula py-4 py-md-5 flex-grow-1">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-12 col-md-10 col-lg-10 col-xl-9">
            <div class="card tarjeta-sticker overflow-hidden">
              <div class="row g-0">
                <aside class="col-lg-5 d-none d-lg-flex lateral flex-column justify-content-between p-4 p-xl-5">
                  <div>
                    <p class="etiqueta-superior lateral-etiqueta mb-2">CuboClub</p>
                    <h2 class="h3 text-white">{{ lema() }}</h2>
                    <p class="mb-0 lateral-texto">{{ detalle() }}</p>
                  </div>
                  <img src="img/ilustracion-hero.svg" alt="" class="img-fluid mt-4" width="520" height="440" />
                </aside>
                <div class="col-12 col-lg-7 p-4 p-sm-5">
                  <h1 class="h2 mb-1">{{ titulo() }}</h1>
                  <p class="text-body-secondary mb-4">{{ subtitulo() }}</p>
                  <ng-content />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: flex; flex-direction: column; }
    .lateral { background: var(--cc-tinta); color: #e9e4ff; }
    .lateral-etiqueta { color: var(--cc-naranja-vivo); }
    .lateral-texto { opacity: 0.8; }
  `,
})
export class PanelAutenticacionComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly lema = input('Gira, aprende y comparte tus tiempos.');
  readonly detalle = input('Únete a la comunidad de speedcubing: métodos, hardware, competencias WCA y más.');
}
