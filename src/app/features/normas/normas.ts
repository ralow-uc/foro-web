import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModeracionFacade } from '../../core/facades/moderacion.facade';
import { ETIQUETA_GRAVEDAD, Gravedad } from '../../core/models';

/** Normas del foro (pública). Son las que se citan al reportar o banear. */
@Component({
  selector: 'app-normas',
  imports: [RouterLink],
  template: `
    <section class="container py-4 py-md-5">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <h1 class="h2">Normas del foro</h1>
          <p class="text-body-secondary">
            CuboClub es un espacio para aprender y compartir sobre speedcubing. Estas normas aplican a temas y comentarios;
            si ves contenido que las incumple, usa el botón <strong>Reportar</strong> y un moderador lo revisará.
          </p>
          <div class="row g-3">
            @for (n of moderacion.normasActivas(); track n.id) {
              <div class="col-12 col-md-6">
                <article class="tarjeta-panel h-100 p-3">
                  <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                    <h2 class="h6 mb-0"><span class="text-primary me-1">{{ n.codigo }}</span>{{ n.nombre }}</h2>
                    <span class="badge flex-shrink-0" [class]="claseGravedad(n.gravedad)">{{ etiqueta[n.gravedad] }}</span>
                  </div>
                  <p class="small mb-0">{{ n.descripcion }}</p>
                </article>
              </div>
            }
          </div>
          <div class="alert alert-info mt-4 small">
            <strong>¿Qué pasa si se incumple una norma?</strong> Un moderador puede banear el tema o comentario: deja de
            verse para la comunidad y queda registrado con la norma y el motivo. Solo un administrador puede levantar un baneo.
          </div>
          <a routerLink="/" class="btn btn-outline-dark">Volver al foro</a>
        </div>
      </div>
    </section>
  `,
})
export class NormasComponent {
  protected readonly moderacion = inject(ModeracionFacade);
  protected readonly etiqueta = ETIQUETA_GRAVEDAD;

  protected claseGravedad(g: Gravedad): string {
    return g === 'CRITICA' ? 'text-bg-danger' : g === 'GRAVE' ? 'text-bg-warning' : 'text-bg-secondary';
  }
}
