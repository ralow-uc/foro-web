import { Injectable, computed, inject } from '@angular/core';
import {
  AutorVista,
  Categoria,
  CategoriaConConteo,
  Comentario,
  ComentarioVista,
  Resultado,
  Tema,
  TemaVista,
  exito,
  fallo,
} from '../models';
import {
  CategoriaRepositorio,
  ComentarioRepositorio,
  ReporteRepositorio,
  SancionRepositorio,
  TemaRepositorio,
  UsuarioRepositorio,
} from '../repositories';
import { esAdministrador, puedeModerar } from '../utils/permisos';
import { normalizarTexto } from '../utils/texto';
import { AutenticacionFacade } from './autenticacion.facade';
import { MapeadorVistas } from './mapeador-vistas';

/** Límites de validación (iguales a las restricciones del microservicio foro-temas). */
export const LIMITES_TEMA = {
  tituloMin: 10,
  tituloMax: 200,
  contenidoMin: 20,
  contenidoMax: 4000,
} as const;

export const LIMITES_COMENTARIO = { min: 3, max: 2000 } as const;

export type OrdenTemas = 'recientes' | 'antiguos' | 'comentados' | 'actividad' | 'titulo';

export const OPCIONES_ORDEN: readonly { valor: OrdenTemas; etiqueta: string }[] = [
  { valor: 'actividad', etiqueta: 'Última actividad' },
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'antiguos', etiqueta: 'Más antiguos' },
  { valor: 'comentados', etiqueta: 'Más comentados' },
  { valor: 'titulo', etiqueta: 'Título (A-Z)' },
];

export interface FiltroTemas {
  categoriaId?: number | null;
  texto?: string;
  autorId?: number | null;
  orden?: OrdenTemas;
  pagina?: number;
  porPagina?: number;
}

export interface PaginaTemas {
  elementos: TemaVista[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface DatosTema {
  titulo: string;
  categoriaId: number;
  contenido: string;
}

/**
 * Facade del foro (patrón Facade).
 *
 * Reúne categorías, temas y comentarios y aplica las reglas de negocio:
 * - El contenido baneado se oculta a USUARIO y visitantes; MODERADOR y ADMIN
 *   lo ven marcado como "Baneado" junto al motivo.
 * - Solo el autor (o un ADMIN) edita o elimina su tema; un tema cerrado o
 *   baneado no admite comentarios ni ediciones del autor.
 * - Cada usuario edita o elimina sus propios comentarios (MODERADOR/ADMIN
 *   también pueden eliminar cualquiera).
 * Todo lo expuesto es reactivo (signals / computed → patrón Observer).
 */
@Injectable({ providedIn: 'root' })
export class ForoFacade {
  private readonly auth = inject(AutenticacionFacade);
  private readonly categorias = inject(CategoriaRepositorio);
  private readonly temas = inject(TemaRepositorio);
  private readonly comentarios = inject(ComentarioRepositorio);
  private readonly sanciones = inject(SancionRepositorio);
  private readonly reportes = inject(ReporteRepositorio);
  private readonly usuarios = inject(UsuarioRepositorio);
  private readonly mapeador = inject(MapeadorVistas);

  /** ¿El usuario actual puede ver contenido baneado? (MODERADOR o ADMIN) */
  readonly veContenidoBaneado = computed(() => puedeModerar(this.auth.roles()));

  /** Todos los temas enriquecidos (incluye baneados; uso interno). */
  private readonly todosLosTemas = computed<TemaVista[]>(() => {
    this.sanciones.elementos();
    this.usuarios.elementos();
    const comentarios = this.comentarios.elementos();
    const categorias = this.categorias.elementos();
    return this.temas.elementos().map((t) => {
      const delTema = comentarios.filter((c) => c.temaId === t.id);
      const fechas = [t.fechaCreacion, t.fechaActualizacion, ...delTema.map((c) => c.fechaCreacion)]
        .filter((f): f is Date => f !== null)
        .map((f) => f.getTime());
      return {
        ...t,
        autor: this.mapeador.autor(t.autorId),
        categoria: categorias.find((c) => c.id === t.categoriaId) ?? null,
        cantidadComentarios: delTema.filter((c) => !this.sanciones.activaPara('COMENTARIO', c.id)).length,
        ultimaActividad: new Date(Math.max(...fechas)),
        sancion: this.mapeador.sancionActiva('TEMA', t.id),
      };
    });
  });

  /** Temas que el usuario actual puede ver. */
  readonly temasVisibles = computed<TemaVista[]>(() => {
    const ve = this.veContenidoBaneado();
    return this.todosLosTemas().filter((t) => ve || t.sancion === null);
  });

  readonly listaCategorias = computed<Categoria[]>(() =>
    [...this.categorias.elementos()].sort((a, b) => a.id - b.id),
  );

  /** Categorías con la cantidad de temas visibles (grilla del inicio). */
  readonly categoriasConConteo = computed<CategoriaConConteo[]>(() => {
    const temas = this.temasVisibles();
    return this.listaCategorias().map((c) => ({
      ...c,
      cantidadTemas: temas.filter((t) => t.categoriaId === c.id).length,
    }));
  });

  /** Últimos temas con actividad (inicio). */
  readonly temasRecientes = computed(() =>
    [...this.temasVisibles()].sort((a, b) => b.ultimaActividad.getTime() - a.ultimaActividad.getTime()).slice(0, 5),
  );

  readonly estadisticas = computed(() => ({
    temas: this.temasVisibles().length,
    comentarios: this.temasVisibles().reduce((s, t) => s + t.cantidadComentarios, 0),
    miembros: this.usuarios.elementos().filter((u) => u.activo).length,
    categorias: this.categorias.total(),
  }));

  /** Temas del usuario en sesión. Incluye los propios baneados para que el autor sepa por qué. */
  readonly misTemas = computed<TemaVista[]>(() => {
    const yo = this.auth.usuarioActual();
    if (!yo) return [];
    return this.todosLosTemas()
      .filter((t) => t.autorId === yo.id)
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  });

  // ------------------------------------------------------------- consultas

  categoriaPorSlug(slug: string): Categoria | undefined {
    return this.categorias.buscarPorSlug(slug);
  }

  /** Autores con temas visibles en la categoría (filtro por autor). */
  autoresDeCategoria(categoriaId: number): AutorVista[] {
    const mapa = new Map<number, AutorVista>();
    for (const t of this.temasVisibles()) if (t.categoriaId === categoriaId) mapa.set(t.autor.id, t.autor);
    return [...mapa.values()].sort((a, b) => a.nombreVisible.localeCompare(b.nombreVisible, 'es'));
  }

  /** Búsqueda de texto, filtro por autor, orden y paginación. */
  buscarTemas(filtro: FiltroTemas): PaginaTemas {
    const texto = normalizarTexto(filtro.texto ?? '');
    const porPagina = Math.max(1, filtro.porPagina ?? 5);
    let lista = this.temasVisibles().filter(
      (t) =>
        (filtro.categoriaId == null || t.categoriaId === filtro.categoriaId) &&
        (filtro.autorId == null || t.autorId === filtro.autorId) &&
        (texto === '' ||
          normalizarTexto(t.titulo).includes(texto) ||
          normalizarTexto(t.contenido).includes(texto) ||
          normalizarTexto(t.autor.nombreUsuario).includes(texto)),
    );
    lista = ordenarTemas(lista, filtro.orden ?? 'actividad');
    const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
    const pagina = Math.min(Math.max(1, filtro.pagina ?? 1), totalPaginas);
    return {
      elementos: lista.slice((pagina - 1) * porPagina, pagina * porPagina),
      total: lista.length,
      pagina,
      totalPaginas,
    };
  }

  /** Tema visible para el usuario actual o `null` (no existe o está baneado y no puede verlo). */
  tema(id: number): TemaVista | null {
    return this.temasVisibles().find((t) => t.id === id) ?? null;
  }

  /** ¿Existe el tema aunque el usuario no pueda verlo? (para distinguir 404 de baneado) */
  temaOcultoPorModeracion(id: number): boolean {
    return !this.tema(id) && this.todosLosTemas().some((t) => t.id === id);
  }

  /** Comentarios visibles de un tema, en orden cronológico. */
  comentariosDe(temaId: number): ComentarioVista[] {
    this.sanciones.elementos();
    this.usuarios.elementos();
    const ve = this.veContenidoBaneado();
    return this.comentarios
      .elementos()
      .filter((c) => c.temaId === temaId)
      .map((c) => ({ ...c, autor: this.mapeador.autor(c.autorId), sancion: this.mapeador.sancionActiva('COMENTARIO', c.id) }))
      .filter((c) => ve || c.sancion === null)
      .sort((a, b) => a.fechaCreacion.getTime() - b.fechaCreacion.getTime());
  }

  // ------------------------------------------------------------- permisos

  esAutor(tema: Pick<Tema, 'autorId'> | Pick<Comentario, 'autorId'>): boolean {
    return this.auth.usuarioActual()?.id === tema.autorId;
  }

  puedeEditarTema(tema: TemaVista): boolean {
    if (!this.auth.estaAutenticado()) return false;
    if (esAdministrador(this.auth.roles())) return true;
    return this.esAutor(tema) && !tema.cerrado && tema.sancion === null;
  }

  puedeEliminarTema(tema: TemaVista): boolean {
    if (!this.auth.estaAutenticado()) return false;
    return esAdministrador(this.auth.roles()) || (this.esAutor(tema) && tema.sancion === null);
  }

  puedeComentar(tema: TemaVista): boolean {
    return this.auth.estaAutenticado() && !tema.cerrado && tema.sancion === null;
  }

  puedeEditarComentario(comentario: ComentarioVista): boolean {
    if (!this.esAutor(comentario) || comentario.sancion !== null) return false;
    const tema = this.temas.buscarPorId(comentario.temaId);
    return !!tema && !tema.cerrado;
  }

  puedeEliminarComentario(comentario: ComentarioVista): boolean {
    if (!this.auth.estaAutenticado()) return false;
    return puedeModerar(this.auth.roles()) || (this.esAutor(comentario) && comentario.sancion === null);
  }

  /** Cualquier usuario con sesión puede reportar contenido ajeno no baneado. */
  puedeReportar(contenido: { autorId: number; sancion: unknown }): boolean {
    return this.auth.estaAutenticado() && !this.esAutor(contenido) && contenido.sancion === null;
  }

  // ------------------------------------------------------------- escritura

  crearTema(datos: DatosTema): Resultado<Tema> {
    const yo = this.auth.usuarioActual();
    if (!yo) return fallo('Debes iniciar sesión para publicar.');
    const error = this.validarTema(datos);
    if (error) return fallo(error);
    const tema = this.temas.crear({
      titulo: datos.titulo.trim(),
      contenido: datos.contenido.trim(),
      categoriaId: datos.categoriaId,
      autorId: yo.id,
      cerrado: false,
      fechaCreacion: new Date(),
      fechaActualizacion: null,
    });
    return exito(tema);
  }

  editarTema(id: number, datos: DatosTema): Resultado<Tema> {
    const tema = this.tema(id);
    if (!tema) return fallo('El tema no existe.');
    if (!this.puedeEditarTema(tema)) return fallo('No tienes permiso para editar este tema.');
    const error = this.validarTema(datos);
    if (error) return fallo(error);
    const actualizado = this.temas.actualizar(id, {
      titulo: datos.titulo.trim(),
      contenido: datos.contenido.trim(),
      categoriaId: datos.categoriaId,
      fechaActualizacion: new Date(),
    });
    return actualizado ? exito(actualizado) : fallo('El tema no existe.');
  }

  /** Elimina el tema con sus comentarios y los reportes pendientes asociados. */
  eliminarTema(id: number): Resultado {
    const tema = this.tema(id);
    if (!tema) return fallo('El tema no existe.');
    if (!this.puedeEliminarTema(tema)) return fallo('No tienes permiso para eliminar este tema.');
    const idsComentarios = new Set(this.comentarios.porTema(id).map((c) => c.id));
    this.comentarios.eliminarDonde((c) => c.temaId === id);
    this.reportes.eliminarDonde(
      (r) =>
        r.estado === 'PENDIENTE' &&
        ((r.tipo === 'TEMA' && r.contenidoId === id) || (r.tipo === 'COMENTARIO' && idsComentarios.has(r.contenidoId))),
    );
    this.temas.eliminar(id);
    return exito(undefined);
  }

  comentar(temaId: number, contenido: string): Resultado<Comentario> {
    const yo = this.auth.usuarioActual();
    if (!yo) return fallo('Debes iniciar sesión para comentar.');
    const tema = this.tema(temaId);
    if (!tema) return fallo('El tema no existe.');
    if (tema.cerrado) return fallo('El tema está cerrado: no admite nuevos comentarios.');
    if (tema.sancion) return fallo('El tema fue baneado por moderación.');
    const error = validarComentario(contenido);
    if (error) return fallo(error);
    return exito(
      this.comentarios.crear({
        temaId,
        autorId: yo.id,
        contenido: contenido.trim(),
        fechaCreacion: new Date(),
        fechaActualizacion: null,
      }),
    );
  }

  editarComentario(id: number, contenido: string): Resultado<Comentario> {
    const comentario = this.buscarComentarioVista(id);
    if (!comentario) return fallo('El comentario no existe.');
    if (!this.puedeEditarComentario(comentario)) return fallo('Solo puedes editar tus propios comentarios.');
    const error = validarComentario(contenido);
    if (error) return fallo(error);
    const actualizado = this.comentarios.actualizar(id, { contenido: contenido.trim(), fechaActualizacion: new Date() });
    return actualizado ? exito(actualizado) : fallo('El comentario no existe.');
  }

  eliminarComentario(id: number): Resultado {
    const comentario = this.buscarComentarioVista(id);
    if (!comentario) return fallo('El comentario no existe.');
    if (!this.puedeEliminarComentario(comentario)) return fallo('No tienes permiso para eliminar este comentario.');
    this.comentarios.eliminar(id);
    this.reportes.eliminarDonde((r) => r.estado === 'PENDIENTE' && r.tipo === 'COMENTARIO' && r.contenidoId === id);
    return exito(undefined);
  }

  // --------------------------------------------------------------- privados

  private buscarComentarioVista(id: number): ComentarioVista | undefined {
    const c = this.comentarios.buscarPorId(id);
    return c ? this.comentariosDe(c.temaId).find((x) => x.id === id) : undefined;
  }

  private validarTema(datos: DatosTema): string | null {
    const titulo = datos.titulo.trim();
    const contenido = datos.contenido.trim();
    if (titulo.length < LIMITES_TEMA.tituloMin || titulo.length > LIMITES_TEMA.tituloMax) {
      return `El título debe tener entre ${LIMITES_TEMA.tituloMin} y ${LIMITES_TEMA.tituloMax} caracteres.`;
    }
    if (contenido.length < LIMITES_TEMA.contenidoMin || contenido.length > LIMITES_TEMA.contenidoMax) {
      return `El contenido debe tener entre ${LIMITES_TEMA.contenidoMin} y ${LIMITES_TEMA.contenidoMax} caracteres.`;
    }
    if (!this.categorias.buscarPorId(datos.categoriaId)) return 'Selecciona una categoría válida.';
    return null;
  }
}

function validarComentario(contenido: string): string | null {
  const largo = contenido.trim().length;
  return largo < LIMITES_COMENTARIO.min || largo > LIMITES_COMENTARIO.max
    ? `El comentario debe tener entre ${LIMITES_COMENTARIO.min} y ${LIMITES_COMENTARIO.max} caracteres.`
    : null;
}

function ordenarTemas(lista: TemaVista[], orden: OrdenTemas): TemaVista[] {
  const copia = [...lista];
  switch (orden) {
    case 'recientes':
      return copia.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
    case 'antiguos':
      return copia.sort((a, b) => a.fechaCreacion.getTime() - b.fechaCreacion.getTime());
    case 'comentados':
      return copia.sort((a, b) => b.cantidadComentarios - a.cantidadComentarios || b.id - a.id);
    case 'titulo':
      return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    default:
      return copia.sort((a, b) => b.ultimaActividad.getTime() - a.ultimaActividad.getTime());
  }
}
