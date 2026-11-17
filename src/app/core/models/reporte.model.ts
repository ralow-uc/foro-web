import { Entidad } from './entidad.model';

/** Tipo de contenido que puede reportarse o sancionarse. */
export type TipoContenido = 'TEMA' | 'COMENTARIO';

export type EstadoReporte = 'PENDIENTE' | 'SANCIONADO' | 'DESCARTADO';

export interface Reporte extends Entidad {
  tipo: TipoContenido;
  contenidoId: number;
  normaId: number;
  reportanteId: number;
  detalle: string;
  estado: EstadoReporte;
  fechaCreacion: Date;
  resueltoPorId: number | null;
  fechaResolucion: Date | null;
}
