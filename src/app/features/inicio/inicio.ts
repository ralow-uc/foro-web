import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionFacade } from '../../core/facades/autenticacion.facade';
import { ForoFacade } from '../../core/facades/foro.facade';
import { FilaTemaComponent } from '../../shared/components/fila-tema/fila-tema';
import { IconoCategoriaComponent } from '../../shared/components/icono-categoria/icono-categoria';

/** Página de inicio: hero, estadísticas, grilla de categorías con conteo y actividad reciente. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, IconoCategoriaComponent, FilaTemaComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class InicioComponent {
  protected readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AutenticacionFacade);
}
