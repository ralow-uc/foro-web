import { Entidad } from './entidad.model';

export interface Categoria extends Entidad {
  nombre: string;
  slug: string;
  descripcion: string;
  fechaCreacion: Date;
}
