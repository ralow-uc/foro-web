import { Injectable, signal } from '@angular/core';

export interface SolicitudConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  variante?: 'danger' | 'primary' | 'success' | 'dark';
}

interface SolicitudPendiente extends SolicitudConfirmacion {
  resolver: (confirmado: boolean) => void;
}

/**
 * Servicio Singleton que abre el modal de confirmación global
 * y devuelve una promesa con la decisión del usuario.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private readonly _solicitud = signal<SolicitudPendiente | null>(null);
  readonly solicitud = this._solicitud.asReadonly();

  confirmar(solicitud: SolicitudConfirmacion): Promise<boolean> {
    this._solicitud()?.resolver(false);
    return new Promise<boolean>((resolver) => {
      this._solicitud.set({ ...solicitud, resolver });
    });
  }

  responder(confirmado: boolean): void {
    const actual = this._solicitud();
    if (!actual) return;
    this._solicitud.set(null);
    actual.resolver(confirmado);
  }
}
