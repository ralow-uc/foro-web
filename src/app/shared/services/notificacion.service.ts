import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info' | 'advertencia';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  duracionMs: number;
}

/** Servicio Singleton de notificaciones (toasts de Bootstrap). */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private siguienteId = 1;
  private readonly _notificaciones = signal<Notificacion[]>([]);
  readonly notificaciones = this._notificaciones.asReadonly();

  mostrar(tipo: TipoNotificacion, mensaje: string, titulo?: string, duracionMs = 5000): void {
    const tituloPorDefecto: Record<TipoNotificacion, string> = {
      exito: 'Listo',
      error: 'No se pudo completar',
      info: 'Información',
      advertencia: 'Atención',
    };
    const notificacion: Notificacion = {
      id: this.siguienteId++,
      tipo,
      titulo: titulo ?? tituloPorDefecto[tipo],
      mensaje,
      duracionMs,
    };
    this._notificaciones.update((lista) => [...lista, notificacion]);
  }

  exito(mensaje: string, titulo?: string): void {
    this.mostrar('exito', mensaje, titulo);
  }

  error(mensaje: string, titulo?: string): void {
    this.mostrar('error', mensaje, titulo, 7000);
  }

  info(mensaje: string, titulo?: string, duracionMs = 8000): void {
    this.mostrar('info', mensaje, titulo, duracionMs);
  }

  quitar(id: number): void {
    this._notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }
}
