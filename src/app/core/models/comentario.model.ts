import { Entidad } from './entidad.model';

export interface Comentario extends Entidad {
  temaId: number;
  autorId: number;
  contenido: string;
  fechaCreacion: Date;
  fechaActualizacion: Date | null;
}
