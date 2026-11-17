import { Entidad } from './entidad.model';
import { TipoContenido } from './reporte.model';

/** Baneo de un tema o comentario. Solo un ADMIN puede levantarlo. */
export interface Sancion extends Entidad {
  tipo: TipoContenido;
  contenidoId: number;
  normaId: number;
  moderadorId: number;
  motivo: string;
  reporteId: number | null;
  activa: boolean;
  fechaCreacion: Date;
  levantadaPorId: number | null;
  motivoLevantamiento: string | null;
  fechaLevantamiento: Date | null;
}
