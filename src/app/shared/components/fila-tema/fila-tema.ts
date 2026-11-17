import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TemaVista } from '../../../core/models';
import { TiempoRelativoPipe } from '../../pipes/tiempo-relativo.pipe';
import { AvatarComponent } from '../avatar/avatar';
import { AvisoBaneoComponent } from '../aviso-baneo/aviso-baneo';

/** Fila de un listado de temas (se apila en móvil y se alinea en una fila desde md). */
@Component({
  selector: 'app-fila-tema',
  imports: [RouterLink, DatePipe, TiempoRelativoPipe, AvatarComponent, AvisoBaneoComponent],
  template: `
    @let t = tema();
    <article class="fila p-3 p-md-3" [class.contenido-baneado]="t.sancion">
      <div class="row g-2 g-md-3 align-items-md-center">
        <div class="col-auto d-none d-sm-block">
          <app-avatar [nombre]="t.autor.nombreVisible" [color]="t.autor.colorAvatar" [tamano]="44" />
        </div>
        <div class="col min-w-0">
          <div class="d-flex flex-wrap gap-1 mb-1">
            @if (mostrarCategoria() && t.categoria) {
              <a class="badge text-bg-light border text-decoration-none" [routerLink]="['/categorias', t.categoria.slug]">{{ t.categoria.nombre }}</a>
            }
            @if (t.cerrado) {
              <span class="badge text-bg-secondary"><i class="bi bi-lock-fill me-1" aria-hidden="true"></i>Cerrado</span>
            }
            @if (t.fechaActualizacion) {
              <span class="badge text-bg-light border fw-normal">Editado</span>
            }
          </div>
          <h3 class="h6 mb-1 titulo">
            <a [routerLink]="['/temas', t.id]" class="text-reset text-decoration-none">{{ t.titulo }}</a>
          </h3>
          <p class="small text-body-secondary mb-0">
            <span class="fw-bold text-body">&#64;{{ t.autor.nombreUsuario }}</span>
            · <time [attr.datetime]="t.fechaCreacion.toISOString()" [title]="t.fechaCreacion | date: 'medium'">{{ t.fechaCreacion | tiempoRelativo }}</time>
          </p>
          @if (t.sancion) {
            <app-aviso-baneo class="d-block mt-2" [sancion]="t.sancion" [compacto]="true" />
          }
        </div>
        <div class="col-12 col-md-auto d-flex d-md-block gap-3 text-md-end small text-body-secondary contadores">
          <div><i class="bi bi-chat-left-text me-1" aria-hidden="true"></i><strong class="text-body">{{ t.cantidadComentarios }}</strong> {{ t.cantidadComentarios === 1 ? 'comentario' : 'comentarios' }}</div>
          <div><i class="bi bi-clock-history me-1" aria-hidden="true"></i>{{ t.ultimaActividad | tiempoRelativo }}</div>
        </div>
      </div>
    </article>
  `,
  styles: `
    .fila { border-bottom: 1.5px solid var(--cc-borde); background: var(--cc-blanco); transition: background 0.12s; }
    .fila:hover { background: #fffaf1; }
    .titulo a:hover { color: var(--cc-naranja) !important; text-decoration: underline !important; }
    .titulo { overflow-wrap: anywhere; }
    @media (min-width: 768px) { .contadores { min-width: 9.5rem; } }
  `,
})
export class FilaTemaComponent {
  readonly tema = input.required<TemaVista>();
  readonly mostrarCategoria = input(true);
}
