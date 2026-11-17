import { Entidad } from './entidad.model';

export interface Tema extends Entidad {
  titulo: string;
  contenido: string;
  categoriaId: number;
  autorId: number;
  cerrado: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date | null;
}
