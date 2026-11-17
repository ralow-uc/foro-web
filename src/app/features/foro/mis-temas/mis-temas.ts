import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ForoFacade } from '../../../core/facades/foro.facade';
import { TemaVista } from '../../../core/models';
import { AvisoBaneoComponent } from '../../../shared/components/aviso-baneo/aviso-baneo';
import { ConfirmacionService } from '../../../shared/services/confirmacion.service';
import { NotificacionService } from '../../../shared/services/notificacion.service';

/** Temas del usuario en sesión: tabla en escritorio/tablet y tarjetas en móvil. */
@Component({
  selector: 'app-mis-temas',
  imports: [RouterLink, DatePipe, AvisoBaneoComponent],
  templateUrl: './mis-temas.html',
})
export class MisTemasComponent {
  protected readonly foro = inject(ForoFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly temas = this.foro.misTemas;
  protected readonly totalComentarios = computed(() => this.temas().reduce((s, t) => s + t.cantidadComentarios, 0));

  protected estado(t: TemaVista): { texto: string; clase: string } {
    if (t.sancion) return { texto: 'Baneado', clase: 'text-bg-danger' };
    if (t.cerrado) return { texto: 'Cerrado', clase: 'text-bg-secondary' };
    return { texto: 'Abierto', clase: 'text-bg-success' };
  }

  protected async eliminar(t: TemaVista): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar tema',
      mensaje: `Se eliminará "${t.titulo}" con todos sus comentarios. ¿Continuar?`,
      textoConfirmar: 'Eliminar',
      variante: 'danger',
    });
    if (!ok) return;
    const r = this.foro.eliminarTema(t.id);
    if (r.ok) this.notificaciones.exito('El tema fue eliminado.');
    else this.notificaciones.error(r.error);
  }
}
