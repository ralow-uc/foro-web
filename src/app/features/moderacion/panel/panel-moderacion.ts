import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModeracionFacade } from '../../../core/facades/moderacion.facade';
import { ReporteVista, SancionVista } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { TiempoRelativoPipe } from '../../../shared/pipes/tiempo-relativo.pipe';
import { AccionModeracionService } from '../../../shared/services/accion-moderacion.service';
import { ConfirmacionService } from '../../../shared/services/confirmacion.service';
import { NotificacionService } from '../../../shared/services/notificacion.service';

type Pestana = 'reportes' | 'baneos' | 'historial' | 'cerrados';

/**
 * Panel de moderación (MODERADOR y ADMIN, protegido con rolGuard).
 * Reportes pendientes, baneos activos, historial y temas cerrados.
 * Solo el ADMIN ve el botón para levantar un baneo.
 */
@Component({
  selector: 'app-panel-moderacion',
  imports: [RouterLink, DatePipe, TiempoRelativoPipe, AvatarComponent],
  templateUrl: './panel-moderacion.html',
})
export class PanelModeracionComponent {
  protected readonly moderacion = inject(ModeracionFacade);
  private readonly accion = inject(AccionModeracionService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly pestana = signal<Pestana>('reportes');

  protected readonly pestanas: readonly { id: Pestana; texto: string; icono: string }[] = [
    { id: 'reportes', texto: 'Reportes pendientes', icono: 'bi-flag' },
    { id: 'baneos', texto: 'Baneos activos', icono: 'bi-slash-circle' },
    { id: 'historial', texto: 'Historial', icono: 'bi-clock-history' },
    { id: 'cerrados', texto: 'Temas cerrados', icono: 'bi-lock' },
  ];

  protected contador(id: Pestana): number {
    const r = this.moderacion.resumen();
    return { reportes: r.pendientes, baneos: r.activas, historial: r.levantadas, cerrados: r.cerrados }[id];
  }

  protected banearDesdeReporte(r: ReporteVista): void {
    void this.accion.abrir({
      modo: 'banear',
      tipo: r.tipo,
      contenidoId: r.contenidoId,
      resumen: r.resumenContenido,
      reporteId: r.id,
    });
  }

  protected async descartar(r: ReporteVista): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Descartar reporte',
      mensaje: `El contenido "${r.resumenContenido}" seguirá visible. ¿Confirmas que no incumple las normas?`,
      textoConfirmar: 'Descartar',
      variante: 'dark',
    });
    if (!ok) return;
    const res = this.moderacion.descartarReporte(r.id);
    if (res.ok) this.notificaciones.exito('El reporte fue descartado.');
    else this.notificaciones.error(res.error);
  }

  protected levantar(s: SancionVista): void {
    void this.accion.abrir({
      modo: 'levantar',
      tipo: s.tipo,
      contenidoId: s.contenidoId,
      resumen: s.resumenContenido,
      sancionId: s.id,
    });
  }

  protected reabrir(temaId: number): void {
    const r = this.moderacion.reabrirTema(temaId);
    if (r.ok) this.notificaciones.exito('El tema fue reabierto.');
    else this.notificaciones.error(r.error);
  }

  protected etiquetaEstado(estado: string): { texto: string; clase: string } {
    return estado === 'SANCIONADO'
      ? { texto: 'Sancionado', clase: 'text-bg-danger' }
      : estado === 'DESCARTADO'
        ? { texto: 'Descartado', clase: 'text-bg-secondary' }
        : { texto: 'Pendiente', clase: 'text-bg-warning' };
  }
}
