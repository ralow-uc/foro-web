import { Injectable, inject } from '@angular/core';
import { AutorVista, Sancion, SancionVista, TipoContenido } from '../models';
import {
  ComentarioRepositorio,
  NormaRepositorio,
  SancionRepositorio,
  TemaRepositorio,
  UsuarioRepositorio,
} from '../repositories';
import { extracto } from '../utils/texto';

/** Autor genérico cuando la cuenta fue eliminada por un administrador. */
const AUTOR_ELIMINADO = (id: number): AutorVista => ({
  id,
  nombreUsuario: 'usuario-eliminado',
  nombreVisible: 'Usuario eliminado',
  colorAvatar: '#8a8799',
  eliminado: true,
});

/**
 * Construye los modelos de vista que comparten los facades (autor, sanción,
 * resumen del contenido). No contiene reglas de negocio: solo "une" repositorios,
 * como haría un DTO ensamblado en el backend.
 */
@Injectable({ providedIn: 'root' })
export class MapeadorVistas {
  private readonly usuarios = inject(UsuarioRepositorio);
  private readonly temas = inject(TemaRepositorio);
  private readonly comentarios = inject(ComentarioRepositorio);
  private readonly normas = inject(NormaRepositorio);
  private readonly sanciones = inject(SancionRepositorio);

  autor(id: number): AutorVista {
    const u = this.usuarios.buscarPorId(id);
    if (!u) return AUTOR_ELIMINADO(id);
    return {
      id: u.id,
      nombreUsuario: u.nombreUsuario,
      nombreVisible: u.nombreVisible,
      colorAvatar: u.colorAvatar,
      eliminado: false,
    };
  }

  /** Título del tema o extracto del comentario sancionado/reportado. */
  resumenContenido(tipo: TipoContenido, contenidoId: number): string {
    if (tipo === 'TEMA') return this.temas.buscarPorId(contenidoId)?.titulo ?? '(tema eliminado)';
    const comentario = this.comentarios.buscarPorId(contenidoId);
    return comentario ? extracto(comentario.contenido, 110) : '(comentario eliminado)';
  }

  /** Id del tema al que pertenece el contenido (para enlazarlo). */
  temaDelContenido(tipo: TipoContenido, contenidoId: number): number | null {
    if (tipo === 'TEMA') return this.temas.buscarPorId(contenidoId) ? contenidoId : null;
    const comentario = this.comentarios.buscarPorId(contenidoId);
    return comentario && this.temas.buscarPorId(comentario.temaId) ? comentario.temaId : null;
  }

  /** Autor del contenido o `null` si el contenido ya no existe. */
  autorDelContenido(tipo: TipoContenido, contenidoId: number): AutorVista | null {
    const autorId =
      tipo === 'TEMA'
        ? this.temas.buscarPorId(contenidoId)?.autorId
        : this.comentarios.buscarPorId(contenidoId)?.autorId;
    return autorId === undefined ? null : this.autor(autorId);
  }

  sancion(s: Sancion): SancionVista {
    return {
      ...s,
      norma: this.normas.buscarPorId(s.normaId) ?? null,
      moderador: this.autor(s.moderadorId),
      levantadaPor: s.levantadaPorId === null ? null : this.autor(s.levantadaPorId),
      resumenContenido: this.resumenContenido(s.tipo, s.contenidoId),
      temaId: this.temaDelContenido(s.tipo, s.contenidoId),
    };
  }

  /** Sanción activa (en vista) de un contenido, o `null`. */
  sancionActiva(tipo: TipoContenido, contenidoId: number): SancionVista | null {
    const s = this.sanciones.activaPara(tipo, contenidoId);
    return s ? this.sancion(s) : null;
  }
}
