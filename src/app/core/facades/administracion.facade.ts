import { Injectable, computed, inject } from '@angular/core';
import {
  Categoria,
  CategoriaConConteo,
  Gravedad,
  GRAVEDADES,
  Norma,
  Resultado,
  Rol,
  ROLES,
  UsuarioPublico,
  exito,
  fallo,
} from '../models';
import {
  CategoriaRepositorio,
  NormaRepositorio,
  ReporteRepositorio,
  SancionRepositorio,
  TemaRepositorio,
  UsuarioRepositorio,
} from '../repositories';
import { esAdministrador } from '../utils/permisos';
import { generarSlug, normalizarTexto } from '../utils/texto';
import { AutenticacionFacade, aPublico } from './autenticacion.facade';
import { numeroNorma } from './moderacion.facade';

/** Límites de validación (iguales a los de los microservicios). */
export const LIMITES_ADMIN = {
  categoriaNombreMin: 3,
  categoriaNombreMax: 100,
  categoriaDescripcionMin: 10,
  categoriaDescripcionMax: 400,
  normaNombreMin: 3,
  normaNombreMax: 100,
  normaDescripcionMin: 10,
  normaDescripcionMax: 400,
} as const;

/** Código de norma: N1 … N999 (igual que la validación de foro-moderacion). */
export const PATRON_CODIGO_NORMA = /^[Nn][1-9]\d{0,2}$/;

export interface UsuarioAdministrado extends UsuarioPublico {
  cantidadTemas: number;
  esYo: boolean;
}

export interface FiltroUsuarios {
  texto?: string;
  rol?: Rol | '';
  estado?: 'activos' | 'inactivos' | '';
}

export interface DatosCategoria {
  nombre: string;
  descripcion: string;
}

export interface DatosNorma {
  codigo: string;
  nombre: string;
  descripcion: string;
  gravedad: Gravedad;
  activa: boolean;
}

export const MENSAJE_SOLO_ADMIN = 'Solo un ADMIN puede administrar el foro.';

/**
 * Facade de administración (patrón Facade), exclusivo del rol ADMIN.
 *
 * Gestiona cuentas (roles, activación, eliminación), categorías y normas.
 * Reglas que protegen al propio sistema:
 * - un ADMIN no puede quitarse su rol ADMIN, desactivarse ni eliminarse
 *   (evita dejar el foro sin administradores);
 * - toda cuenta conserva al menos un rol;
 * - categorías con nombre único (sin distinguir tildes) y slug generado solo;
 * - una norma citada por reportes o sanciones no se elimina: se desactiva
 *   (misma regla que el microservicio foro-moderacion).
 */
@Injectable({ providedIn: 'root' })
export class AdministracionFacade {
  private readonly auth = inject(AutenticacionFacade);
  private readonly usuarios = inject(UsuarioRepositorio);
  private readonly categorias = inject(CategoriaRepositorio);
  private readonly temas = inject(TemaRepositorio);
  private readonly normas = inject(NormaRepositorio);
  private readonly reportes = inject(ReporteRepositorio);
  private readonly sanciones = inject(SancionRepositorio);

  readonly esAdmin = computed(() => esAdministrador(this.auth.roles()));

  readonly listaUsuarios = computed<UsuarioAdministrado[]>(() => {
    const temas = this.temas.elementos();
    const yo = this.auth.usuarioActual()?.id;
    return this.usuarios
      .elementos()
      .map((u) => ({ ...aPublico(u), cantidadTemas: temas.filter((t) => t.autorId === u.id).length, esYo: u.id === yo }))
      .sort((a, b) => a.id - b.id);
  });

  readonly resumenUsuarios = computed(() => {
    const lista = this.listaUsuarios();
    return {
      total: lista.length,
      activos: lista.filter((u) => u.activo).length,
      porRol: Object.fromEntries(ROLES.map((r) => [r, lista.filter((u) => u.roles.includes(r)).length])) as Record<Rol, number>,
    };
  });

  readonly listaCategorias = computed<CategoriaConConteo[]>(() => {
    const temas = this.temas.elementos();
    return [...this.categorias.elementos()]
      .sort((a, b) => a.id - b.id)
      .map((c) => ({ ...c, cantidadTemas: temas.filter((t) => t.categoriaId === c.id).length }));
  });

  readonly listaNormas = computed(() => {
    const reportes = this.reportes.elementos();
    const sanciones = this.sanciones.elementos();
    return [...this.normas.elementos()]
      .sort((a, b) => numeroNorma(a.codigo) - numeroNorma(b.codigo))
      .map((n) => ({
        ...n,
        usos: reportes.filter((r) => r.normaId === n.id).length + sanciones.filter((s) => s.normaId === n.id).length,
      }));
  });

  // --------------------------------------------------------------- usuarios

  filtrarUsuarios(filtro: FiltroUsuarios): UsuarioAdministrado[] {
    const texto = normalizarTexto(filtro.texto ?? '');
    return this.listaUsuarios().filter(
      (u) =>
        (texto === '' ||
          normalizarTexto(u.nombreUsuario).includes(texto) ||
          normalizarTexto(u.nombreVisible).includes(texto) ||
          normalizarTexto(u.correo).includes(texto)) &&
        (!filtro.rol || u.roles.includes(filtro.rol)) &&
        (!filtro.estado || (filtro.estado === 'activos') === u.activo),
    );
  }

  /** Reemplaza los roles de una cuenta (como PUT /api/usuarios/{id}/roles). */
  cambiarRoles(usuarioId: number, roles: readonly Rol[]): Resultado {
    const error = this.exigirAdmin();
    if (error) return fallo(error);
    const usuario = this.usuarios.buscarPorId(usuarioId);
    if (!usuario) return fallo('La cuenta no existe.');
    const validos = ROLES.filter((r) => roles.includes(r));
    if (validos.length === 0) return fallo('La cuenta debe conservar al menos un rol.');
    if (this.esYo(usuarioId) && !validos.includes('ADMIN')) {
      return fallo('No puedes quitarte tu propio rol de administrador.');
    }
    this.usuarios.actualizar(usuarioId, { roles: validos });
    return exito(undefined);
  }

  /** Activa o desactiva una cuenta. Una cuenta inactiva no puede iniciar sesión. */
  cambiarActivo(usuarioId: number, activo: boolean): Resultado {
    const error = this.exigirAdmin();
    if (error) return fallo(error);
    const usuario = this.usuarios.buscarPorId(usuarioId);
    if (!usuario) return fallo('La cuenta no existe.');
    if (this.esYo(usuarioId) && !activo) return fallo('No puedes desactivar tu propia cuenta.');
    this.usuarios.actualizar(usuarioId, { activo });
    return exito(undefined);
  }

  /** Elimina la cuenta. Su contenido se conserva firmado como "Usuario eliminado". */
  eliminarUsuario(usuarioId: number): Resultado {
    const error = this.exigirAdmin();
    if (error) return fallo(error);
    if (this.esYo(usuarioId)) return fallo('No puedes eliminar tu propia cuenta.');
    return this.usuarios.eliminar(usuarioId) ? exito(undefined) : fallo('La cuenta no existe.');
  }

  // ------------------------------------------------------------- categorías

  /** Vista previa del slug que se generará para un nombre. */
  slugPara(nombre: string, excluirId?: number): string {
    const base = generarSlug(nombre) || 'categoria';
    let slug = base;
    for (let i = 2; this.categorias.existe((c) => c.slug === slug && c.id !== excluirId); i++) slug = `${base}-${i}`;
    return slug;
  }

  nombreCategoriaDisponible(nombre: string, excluirId?: number): boolean {
    const existente = this.categorias.buscarPorNombre(nombre);
    return !existente || existente.id === excluirId;
  }

  crearCategoria(datos: DatosCategoria): Resultado<Categoria> {
    const error = this.exigirAdmin() ?? this.validarCategoria(datos);
    if (error) return fallo(error);
    return exito(
      this.categorias.crear({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim(),
        slug: this.slugPara(datos.nombre),
        fechaCreacion: new Date(),
      }),
    );
  }

  editarCategoria(id: number, datos: DatosCategoria): Resultado<Categoria> {
    const error = this.exigirAdmin() ?? this.validarCategoria(datos, id);
    if (error) return fallo(error);
    const actualizada = this.categorias.actualizar(id, {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      slug: this.slugPara(datos.nombre, id),
    });
    return actualizada ? exito(actualizada) : fallo('La categoría no existe.');
  }

  /** Solo se elimina una categoría vacía (igual que en foro-temas). */
  eliminarCategoria(id: number): Resultado {
    const error = this.exigirAdmin();
    if (error) return fallo(error);
    if (this.temas.existe((t) => t.categoriaId === id)) return fallo('La categoría tiene temas: muévelos o elimínalos antes.');
    return this.categorias.eliminar(id) ? exito(undefined) : fallo('La categoría no existe.');
  }

  // ----------------------------------------------------------------- normas

  codigoNormaDisponible(codigo: string, excluirId?: number): boolean {
    const existente = this.normas.buscarPorCodigo(codigo);
    return !existente || existente.id === excluirId;
  }

  crearNorma(datos: DatosNorma): Resultado<Norma> {
    const error = this.exigirAdmin() ?? this.validarNorma(datos);
    if (error) return fallo(error);
    return exito(this.normas.crear(this.normalizarNorma(datos)));
  }

  editarNorma(id: number, datos: DatosNorma): Resultado<Norma> {
    const error = this.exigirAdmin() ?? this.validarNorma(datos, id);
    if (error) return fallo(error);
    const actualizada = this.normas.actualizar(id, this.normalizarNorma(datos));
    return actualizada ? exito(actualizada) : fallo('La norma no existe.');
  }

  eliminarNorma(id: number): Resultado {
    const error = this.exigirAdmin();
    if (error) return fallo(error);
    const norma = this.normas.buscarPorId(id);
    if (!norma) return fallo('La norma no existe.');
    const citada = this.reportes.existe((r) => r.normaId === id) || this.sanciones.existe((s) => s.normaId === id);
    if (citada) return fallo(`La norma ${norma.codigo} está citada en reportes o sanciones: desactívala en lugar de eliminarla.`);
    this.normas.eliminar(id);
    return exito(undefined);
  }

  // --------------------------------------------------------------- privados

  private exigirAdmin(): string | null {
    return this.esAdmin() ? null : MENSAJE_SOLO_ADMIN;
  }

  private esYo(usuarioId: number): boolean {
    return this.auth.usuarioActual()?.id === usuarioId;
  }

  private validarCategoria(datos: DatosCategoria, excluirId?: number): string | null {
    const nombre = datos.nombre.trim();
    const descripcion = datos.descripcion.trim();
    if (nombre.length < LIMITES_ADMIN.categoriaNombreMin || nombre.length > LIMITES_ADMIN.categoriaNombreMax) {
      return `El nombre debe tener entre ${LIMITES_ADMIN.categoriaNombreMin} y ${LIMITES_ADMIN.categoriaNombreMax} caracteres.`;
    }
    if (descripcion.length < LIMITES_ADMIN.categoriaDescripcionMin || descripcion.length > LIMITES_ADMIN.categoriaDescripcionMax) {
      return `La descripción debe tener entre ${LIMITES_ADMIN.categoriaDescripcionMin} y ${LIMITES_ADMIN.categoriaDescripcionMax} caracteres.`;
    }
    if (!this.nombreCategoriaDisponible(nombre, excluirId)) return 'Ya existe una categoría con ese nombre.';
    return null;
  }

  private validarNorma(datos: DatosNorma, excluirId?: number): string | null {
    if (!PATRON_CODIGO_NORMA.test(datos.codigo.trim())) return 'El código debe tener la forma N1, N2, … N999.';
    if (!this.codigoNormaDisponible(datos.codigo, excluirId)) return 'Ya existe una norma con ese código.';
    const nombre = datos.nombre.trim();
    if (nombre.length < LIMITES_ADMIN.normaNombreMin || nombre.length > LIMITES_ADMIN.normaNombreMax) {
      return `El nombre debe tener entre ${LIMITES_ADMIN.normaNombreMin} y ${LIMITES_ADMIN.normaNombreMax} caracteres.`;
    }
    const descripcion = datos.descripcion.trim();
    if (descripcion.length < LIMITES_ADMIN.normaDescripcionMin || descripcion.length > LIMITES_ADMIN.normaDescripcionMax) {
      return `La descripción debe tener entre ${LIMITES_ADMIN.normaDescripcionMin} y ${LIMITES_ADMIN.normaDescripcionMax} caracteres.`;
    }
    if (!GRAVEDADES.includes(datos.gravedad)) return 'Selecciona una gravedad válida.';
    return null;
  }

  private normalizarNorma(datos: DatosNorma): Omit<Norma, 'id'> {
    return {
      codigo: datos.codigo.trim().toUpperCase(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      gravedad: datos.gravedad,
      activa: datos.activa,
    };
  }
}
