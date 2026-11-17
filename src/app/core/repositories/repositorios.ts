import { Injectable } from '@angular/core';
import {
  crearCategoriasSemilla,
  crearComentariosSemilla,
  crearNormasSemilla,
  crearReportesSemilla,
  crearSancionesSemilla,
  crearTemasSemilla,
  crearUsuariosSemilla,
} from '../data';
import { Categoria, Comentario, Norma, Reporte, Sancion, Tema, TipoContenido, Usuario } from '../models';
import { normalizarTexto } from '../utils/texto';
import { RepositorioEnMemoria } from './repositorio-en-memoria';

/*
 * Repositorios concretos. Cada uno es un Singleton (`providedIn: 'root'`):
 * Angular crea una sola instancia para toda la aplicación, por lo que todos
 * los facades comparten el mismo estado en memoria.
 */

@Injectable({ providedIn: 'root' })
export class UsuarioRepositorio extends RepositorioEnMemoria<Usuario> {
  constructor() {
    super(crearUsuariosSemilla());
  }

  buscarPorCorreo(correo: string): Usuario | undefined {
    const buscado = correo.trim().toLowerCase();
    return this.buscarUno((u) => u.correo.toLowerCase() === buscado);
  }

  buscarPorNombreUsuario(nombreUsuario: string): Usuario | undefined {
    const buscado = nombreUsuario.trim().toLowerCase();
    return this.buscarUno((u) => u.nombreUsuario.toLowerCase() === buscado);
  }
}

@Injectable({ providedIn: 'root' })
export class CategoriaRepositorio extends RepositorioEnMemoria<Categoria> {
  constructor() {
    super(crearCategoriasSemilla());
  }

  buscarPorSlug(slug: string): Categoria | undefined {
    return this.buscarUno((c) => c.slug === slug);
  }

  /** Comparación sin mayúsculas ni tildes ("Métodos" == "metodos"). */
  buscarPorNombre(nombre: string): Categoria | undefined {
    const buscado = normalizarTexto(nombre);
    return this.buscarUno((c) => normalizarTexto(c.nombre) === buscado);
  }
}

@Injectable({ providedIn: 'root' })
export class TemaRepositorio extends RepositorioEnMemoria<Tema> {
  constructor() {
    super(crearTemasSemilla());
  }
}

@Injectable({ providedIn: 'root' })
export class ComentarioRepositorio extends RepositorioEnMemoria<Comentario> {
  constructor() {
    super(crearComentariosSemilla());
  }

  porTema(temaId: number): Comentario[] {
    return this.buscar((c) => c.temaId === temaId);
  }
}

@Injectable({ providedIn: 'root' })
export class NormaRepositorio extends RepositorioEnMemoria<Norma> {
  constructor() {
    super(crearNormasSemilla());
  }

  buscarPorCodigo(codigo: string): Norma | undefined {
    const buscado = codigo.trim().toUpperCase();
    return this.buscarUno((n) => n.codigo.toUpperCase() === buscado);
  }
}

@Injectable({ providedIn: 'root' })
export class ReporteRepositorio extends RepositorioEnMemoria<Reporte> {
  constructor() {
    super(crearReportesSemilla());
  }
}

@Injectable({ providedIn: 'root' })
export class SancionRepositorio extends RepositorioEnMemoria<Sancion> {
  constructor() {
    super(crearSancionesSemilla());
  }

  activaPara(tipo: TipoContenido, contenidoId: number): Sancion | undefined {
    return this.buscarUno((s) => s.activa && s.tipo === tipo && s.contenidoId === contenidoId);
  }
}
