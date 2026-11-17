/**
 * Acceso tipado al objeto global `bootstrap` que expone
 * `bootstrap.bundle.min.js` (cargado en angular.json → scripts).
 * En pruebas (jsdom) no existe, por eso todo es opcional.
 */
export interface InstanciaComponenteBootstrap {
  show(): void;
  hide(): void;
  dispose(): void;
}

interface FabricaComponente {
  getOrCreateInstance(elemento: Element, opciones?: Record<string, unknown>): InstanciaComponenteBootstrap;
  getInstance(elemento: Element): InstanciaComponenteBootstrap | null;
}

export interface BootstrapGlobal {
  Modal: FabricaComponente;
  Toast: FabricaComponente;
  Collapse: FabricaComponente;
}

export function obtenerBootstrap(): BootstrapGlobal | undefined {
  return (globalThis as { bootstrap?: BootstrapGlobal }).bootstrap;
}

/** Envoltorio mínimo para abrir/cerrar un modal de Bootstrap desde un componente. */
export class ControladorModal {
  constructor(private readonly elemento: () => HTMLElement | undefined) {}

  abrir(): void {
    const el = this.elemento();
    if (el) obtenerBootstrap()?.Modal.getOrCreateInstance(el).show();
  }

  cerrar(): void {
    const el = this.elemento();
    if (el) obtenerBootstrap()?.Modal.getOrCreateInstance(el).hide();
  }
}
