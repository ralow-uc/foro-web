import { Injectable, computed, inject } from '@angular/core';
import {
  Norma,
  Reporte,
  ReporteVista,
  Resultado,
  Sancion,
  SancionVista,
  TipoContenido,
  exito,
  fallo,
} from '../models';
import {
  ComentarioRepositorio,
  NormaRepositorio,
  ReporteRepositorio,
  SancionRepositorio,
  TemaRepositorio,
  UsuarioRepositorio,
} from '../repositories';
import { esAdministrador, puedeModerar } from '../utils/permisos';
import { AutenticacionFacade } from './autenticacion.facade';
import { MapeadorVistas } from './mapeador-vistas';

/** Límites de texto (iguales a las validaciones de foro-moderacion). */
export const LIMITES_MODERACION = {
  motivoMin: 10,
  motivoMax: 400,
  detalleReporteMin: 10,
  detalleReporteMax: 500,
  motivoLevantamientoMin: 10,
} as const;

export interface DatosReporte {
  tipo: TipoContenido;
  contenidoId: number;
  normaId: number;
  detalle: string;
}

export interface DatosSancion {
  tipo: TipoContenido;
  contenidoId: number;
  normaId: number;
  motivo: string;
  /** Reporte que origina la sanción (opcional). */
  reporteId?: number | null;
}

export const MENSAJES_MODERACION = {
  sinPermiso: 'Solo MODERADOR o ADMIN pueden moderar contenido.',
  soloAdminLevanta: 'Solo un ADMIN puede levantar un baneo.',
} as const;

/**
 * Facade de moderación (patrón Facade).
 *
 * Reportes de usuarios, baneos de temas/comentarios citando una norma,
 * cierre/reapertura de temas y levantamiento de baneos.
 * Reglas: MODERADOR y ADMIN banean, descartan reportes y cierran temas;
 * solo ADMIN levanta un baneo indicando un motivo (≥ 10 caracteres).
 */
@Injectable({ providedIn: 'root' })
export class ModeracionFacade {
  private readonly auth = inject(AutenticacionFacade);
  private readonly normas = inject(NormaRepositorio);
  private readonly reportes = inject(ReporteRepositorio);
  private readonly sanciones = inject(SancionRepositorio);
  private readonly temas = inject(TemaRepositorio);
  private readonly comentarios = inject(ComentarioRepositorio);
  private readonly usuarios = inject(UsuarioRepositorio);
  private readonly mapeador = inject(MapeadorVistas);

  readonly puedeModerar = computed(() => puedeModerar(this.auth.roles()));
  readonly puedeLevantar = computed(() => esAdministrador(this.auth.roles()));

  /** Normas ordenadas por número (N1, N2, …, N10). */
  readonly todasLasNormas = computed<Norma[]>(() =>
    [...this.normas.elementos()].sort((a, b) => numeroNorma(a.codigo) - numeroNorma(b.codigo)),
  );

  /** Normas vigentes: se muestran en /normas y se pueden citar al reportar o banear. */
  readonly normasActivas = computed(() => this.todasLasNormas().filter((n) => n.activa));

  private readonly reportesVista = computed<ReporteVista[]>(() => {
    this.temas.elementos();
    this.comentarios.elementos();
    this.usuarios.elementos();
    this.sanciones.elementos();
    this.normas.elementos();
    return this.reportes
      .elementos()
      .map((r) => this.aVista(r))
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  });

  readonly reportesPendientes = computed(() => this.reportesVista().filter((r) => r.estado === 'PENDIENTE'));
  readonly reportesResueltos = computed(() => this.reportesVista().filter((r) => r.estado !== 'PENDIENTE'));

  private readonly sancionesVista = computed<SancionVista[]>(() => {
    this.temas.elementos();
    this.comentarios.elementos();
    this.usuarios.elementos();
    this.normas.elementos();
    return this.sanciones
      .elementos()
      .map((s) => this.mapeador.sancion(s))
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  });

  readonly sancionesActivas = computed(() => this.sancionesVista().filter((s) => s.activa));
  readonly sancionesLevantadas = computed(() => this.sancionesVista().filter((s) => !s.activa));

  /** Temas cerrados (para el panel de moderación). */
  readonly temasCerrados = computed(() =>
    this.temas
      .elementos()
      .filter((t) => t.cerrado)
      .map((t) => ({ id: t.id, titulo: t.titulo })),
  );

  readonly resumen = computed(() => ({
    pendientes: this.reportesPendientes().length,
    activas: this.sancionesActivas().length,
    levantadas: this.sancionesLevantadas().length,
    cerrados: this.temasCerrados().length,
  }));

  // --------------------------------------------------------------- reportes

  /** Cualquier usuario con sesión reporta contenido ajeno citando una norma vigente. */
  reportar(datos: DatosReporte): Resultado<Reporte> {
    const yo = this.auth.usuarioActual();
    if (!yo) return fallo('Debes iniciar sesión para reportar.');
    const autor = this.mapeador.autorDelContenido(datos.tipo, datos.contenidoId);
    if (!autor) return fallo('El contenido reportado no existe.');
    if (autor.id === yo.id) return fallo('No puedes reportar tu propio contenido.');
    if (this.sanciones.activaPara(datos.tipo, datos.contenidoId)) return fallo('Este contenido ya fue baneado.');
    const norma = this.normas.buscarPorId(datos.normaId);
    if (!norma || !norma.activa) return fallo('Selecciona una norma vigente.');
    const detalle = datos.detalle.trim();
    if (detalle.length < LIMITES_MODERACION.detalleReporteMin || detalle.length > LIMITES_MODERACION.detalleReporteMax) {
      return fallo(
        `El detalle debe tener entre ${LIMITES_MODERACION.detalleReporteMin} y ${LIMITES_MODERACION.detalleReporteMax} caracteres.`,
      );
    }
    const duplicado = this.reportes.existe(
      (r) =>
        r.estado === 'PENDIENTE' &&
        r.reportanteId === yo.id &&
        r.tipo === datos.tipo &&
        r.contenidoId === datos.contenidoId,
    );
    if (duplicado) return fallo('Ya reportaste este contenido; un moderador lo revisará pronto.');
    return exito(
      this.reportes.crear({
        tipo: datos.tipo,
        contenidoId: datos.contenidoId,
        normaId: datos.normaId,
        reportanteId: yo.id,
        detalle,
        estado: 'PENDIENTE',
        fechaCreacion: new Date(),
        resueltoPorId: null,
        fechaResolucion: null,
      }),
    );
  }

  descartarReporte(reporteId: number): Resultado {
    const yo = this.auth.usuarioActual();
    if (!yo || !this.puedeModerar()) return fallo(MENSAJES_MODERACION.sinPermiso);
    const reporte = this.reportes.buscarPorId(reporteId);
    if (!reporte) return fallo('El reporte no existe.');
    if (reporte.estado !== 'PENDIENTE') return fallo('El reporte ya fue resuelto.');
    this.reportes.actualizar(reporteId, { estado: 'DESCARTADO', resueltoPorId: yo.id, fechaResolucion: new Date() });
    return exito(undefined);
  }

  // ---------------------------------------------------------------- baneos

  /** MODERADOR o ADMIN banean un tema o comentario citando una norma y un motivo (10–400). */
  banear(datos: DatosSancion): Resultado<Sancion> {
    const yo = this.auth.usuarioActual();
    if (!yo || !this.puedeModerar()) return fallo(MENSAJES_MODERACION.sinPermiso);
    if (!this.mapeador.autorDelContenido(datos.tipo, datos.contenidoId)) return fallo('El contenido no existe.');
    if (this.sanciones.activaPara(datos.tipo, datos.contenidoId)) return fallo('El contenido ya tiene un baneo activo.');
    const norma = this.normas.buscarPorId(datos.normaId);
    if (!norma || !norma.activa) return fallo('Selecciona una norma vigente.');
    const motivo = datos.motivo.trim();
    if (motivo.length < LIMITES_MODERACION.motivoMin || motivo.length > LIMITES_MODERACION.motivoMax) {
      return fallo(`El motivo debe tener entre ${LIMITES_MODERACION.motivoMin} y ${LIMITES_MODERACION.motivoMax} caracteres.`);
    }
    const ahora = new Date();
    const sancion = this.sanciones.crear({
      tipo: datos.tipo,
      contenidoId: datos.contenidoId,
      normaId: datos.normaId,
      moderadorId: yo.id,
      motivo,
      reporteId: datos.reporteId ?? null,
      activa: true,
      fechaCreacion: ahora,
      levantadaPorId: null,
      motivoLevantamiento: null,
      fechaLevantamiento: null,
    });
    // Todos los reportes pendientes del mismo contenido quedan resueltos como "sancionado".
    for (const r of this.reportes.buscar(
      (r) => r.estado === 'PENDIENTE' && r.tipo === datos.tipo && r.contenidoId === datos.contenidoId,
    )) {
      this.reportes.actualizar(r.id, { estado: 'SANCIONADO', resueltoPorId: yo.id, fechaResolucion: ahora });
    }
    return exito(sancion);
  }

  /** Solo ADMIN: levanta un baneo activo indicando el motivo (≥ 10 caracteres). */
  levantarSancion(sancionId: number, motivo: string): Resultado {
    const yo = this.auth.usuarioActual();
    if (!yo || !this.puedeLevantar()) return fallo(MENSAJES_MODERACION.soloAdminLevanta);
    const sancion = this.sanciones.buscarPorId(sancionId);
    if (!sancion) return fallo('La sanción no existe.');
    if (!sancion.activa) return fallo('La sanción ya fue levantada.');
    const texto = motivo.trim();
    if (texto.length < LIMITES_MODERACION.motivoLevantamientoMin || texto.length > LIMITES_MODERACION.motivoMax) {
      return fallo(
        `El motivo debe tener entre ${LIMITES_MODERACION.motivoLevantamientoMin} y ${LIMITES_MODERACION.motivoMax} caracteres.`,
      );
    }
    this.sanciones.actualizar(sancionId, {
      activa: false,
      levantadaPorId: yo.id,
      motivoLevantamiento: texto,
      fechaLevantamiento: new Date(),
    });
    return exito(undefined);
  }

  sancionActiva(tipo: TipoContenido, contenidoId: number): SancionVista | null {
    return this.mapeador.sancionActiva(tipo, contenidoId);
  }

  // ---------------------------------------------------------- cerrar temas

  cerrarTema(temaId: number): Resultado {
    return this.cambiarCierre(temaId, true);
  }

  reabrirTema(temaId: number): Resultado {
    return this.cambiarCierre(temaId, false);
  }

  private cambiarCierre(temaId: number, cerrado: boolean): Resultado {
    if (!this.puedeModerar()) return fallo(MENSAJES_MODERACION.sinPermiso);
    const tema = this.temas.buscarPorId(temaId);
    if (!tema) return fallo('El tema no existe.');
    if (tema.cerrado === cerrado) return fallo(cerrado ? 'El tema ya está cerrado.' : 'El tema ya está abierto.');
    this.temas.actualizar(temaId, { cerrado });
    return exito(undefined);
  }

  private aVista(r: Reporte): ReporteVista {
    return {
      ...r,
      norma: this.normas.buscarPorId(r.normaId) ?? null,
      reportante: this.mapeador.autor(r.reportanteId),
      resumenContenido: this.mapeador.resumenContenido(r.tipo, r.contenidoId),
      autorContenido: this.mapeador.autorDelContenido(r.tipo, r.contenidoId),
      temaId: this.mapeador.temaDelContenido(r.tipo, r.contenidoId),
      contenidoBaneado: !!this.sanciones.activaPara(r.tipo, r.contenidoId),
    };
  }
}

/** "N12" → 12 (para ordenar las normas numéricamente). */
export function numeroNorma(codigo: string): number {
  const n = Number.parseInt(codigo.replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}
