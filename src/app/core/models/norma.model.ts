import { Entidad } from './entidad.model';

export type Gravedad = 'LEVE' | 'GRAVE' | 'CRITICA';

export const GRAVEDADES: readonly Gravedad[] = ['LEVE', 'GRAVE', 'CRITICA'];

export const ETIQUETA_GRAVEDAD: Record<Gravedad, string> = {
  LEVE: 'Leve',
  GRAVE: 'Grave',
  CRITICA: 'Crítica',
};

/** Norma del foro (N1..N999), igual que en el microservicio de moderación. */
export interface Norma extends Entidad {
  codigo: string;
  nombre: string;
  descripcion: string;
  gravedad: Gravedad;
  activa: boolean;
}
