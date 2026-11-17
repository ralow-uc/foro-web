import { Injectable, signal } from '@angular/core';
import { TipoContenido } from '../../core/models';

/** Acción que abre el modal de moderación. */
export type ModoAccionModeracion = 'reportar' | 'banear' | 'levantar';

export interface SolicitudAccionModeracion {
  modo: ModoAccionModeracion;
  tipo: TipoContenido;
  contenidoId: number;
  /** Título del tema o extracto del comentario, para que el usuario sepa sobre qué actúa. */
  resumen: string;
  /** Al banear desde un reporte, se vincula la sanción con él. */
  reporteId?: number | null;
  /** Requerido para levantar un baneo. */
  sancionId?: number;
}

interface SolicitudPendiente extends SolicitudAccionModeracion {
  resolver: (realizada: boolean) => void;
}

/**
 * Servicio Singleton que abre el modal global de moderación
 * (reportar, banear o levantar un baneo) y resuelve la promesa con
 * `true` si la acción se completó.
 */
@Injectable({ providedIn: 'root' })
export class AccionModeracionService {
  private readonly _solicitud = signal<SolicitudPendiente | null>(null);
  readonly solicitud = this._solicitud.asReadonly();

  abrir(solicitud: SolicitudAccionModeracion): Promise<boolean> {
    this._solicitud()?.resolver(false);
    return new Promise<boolean>((resolver) => this._solicitud.set({ ...solicitud, resolver }));
  }

  finalizar(realizada: boolean): void {
    const actual = this._solicitud();
    if (!actual) return;
    this._solicitud.set(null);
    actual.resolver(realizada);
  }
}
