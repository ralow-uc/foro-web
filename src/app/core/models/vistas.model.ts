import { Categoria } from './categoria.model';
import { Comentario } from './comentario.model';
import { Norma } from './norma.model';
import { Reporte } from './reporte.model';
import { Sancion } from './sancion.model';
import { Tema } from './tema.model';
import { UsuarioPublico } from './usuario.model';

/** Modelos de vista enriquecidos que los facades entregan a los componentes. */

export interface AutorVista {
  id: number;
  nombreUsuario: string;
  nombreVisible: string;
  colorAvatar: string;
  eliminado: boolean;
}

export interface SancionVista extends Sancion {
  norma: Norma | null;
  moderador: AutorVista;
  levantadaPor: AutorVista | null;
  /** Texto breve del contenido sancionado (título o extracto). */
  resumenContenido: string;
  temaId: number | null;
}

export interface TemaVista extends Tema {
  autor: AutorVista;
  categoria: Categoria | null;
  cantidadComentarios: number;
  ultimaActividad: Date;
  sancion: SancionVista | null;
}

export interface ComentarioVista extends Comentario {
  autor: AutorVista;
  sancion: SancionVista | null;
}

export interface CategoriaConConteo extends Categoria {
  cantidadTemas: number;
}

export interface ReporteVista extends Reporte {
  norma: Norma | null;
  reportante: AutorVista;
  resumenContenido: string;
  autorContenido: AutorVista | null;
  temaId: number | null;
  contenidoBaneado: boolean;
}

export type UsuarioVista = UsuarioPublico;
