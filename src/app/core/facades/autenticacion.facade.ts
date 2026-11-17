import { Injectable, computed, inject, signal } from '@angular/core';
import {
  MetodoResolucion,
  Resultado,
  Rol,
  Sesion,
  Usuario,
  UsuarioPublico,
  exito,
  fallo,
} from '../models';
import { UsuarioRepositorio } from '../repositories';
import { esAdministrador, puedeModerar, rolPrincipal, tieneAlgunRol } from '../utils/permisos';
import { REGLAS_CONTRASENA } from '../../shared/validators/contrasena.validators';

export interface DatosRegistro {
  nombreUsuario: string;
  correo: string;
  contrasena: string;
  fechaNacimiento?: string | null;
}

export interface DatosPerfil {
  correo: string;
  nombreVisible: string;
  biografia: string;
  ciudad: string;
  cuboFavorito: string;
  metodoPrincipal: MetodoResolucion;
  colorAvatar: string;
}

interface CodigoRecuperacion {
  codigo: string;
  expira: Date;
}

/** Minutos de validez del código de recuperación simulado. */
export const MINUTOS_VALIDEZ_CODIGO = 15;

export const MENSAJES_AUTENTICACION = {
  credenciales: 'Correo o contraseña incorrectos.',
  inactivo: 'Tu cuenta está desactivada. Contacta a un administrador del foro para reactivarla.',
  correoDuplicado: 'Ya existe una cuenta registrada con ese correo.',
  usuarioDuplicado: 'Ese nombre de usuario ya está en uso.',
  correoNoRegistrado: 'No encontramos una cuenta asociada a ese correo.',
} as const;

/**
 * Facade de autenticación (patrón Facade).
 *
 * Única puerta de entrada de los componentes para sesión, registro, recuperación
 * de contraseña y perfil. Simula los endpoints de foro-usuarios usando el
 * repositorio en memoria. La sesión vive en un signal (no se persiste).
 */
@Injectable({ providedIn: 'root' })
export class AutenticacionFacade {
  private readonly usuarios = inject(UsuarioRepositorio);
  private readonly _sesion = signal<Sesion | null>(null);
  private readonly codigos = new Map<string, CodigoRecuperacion>();

  readonly sesion = this._sesion.asReadonly();

  /** Usuario en sesión, siempre sincronizado con el repositorio (si un ADMIN lo desactiva, la sesión cae). */
  readonly usuarioActual = computed<UsuarioPublico | null>(() => {
    const sesion = this._sesion();
    if (!sesion) return null;
    this.usuarios.elementos();
    const usuario = this.usuarios.buscarPorId(sesion.usuarioId);
    return usuario && usuario.activo ? aPublico(usuario) : null;
  });

  readonly estaAutenticado = computed(() => this.usuarioActual() !== null);
  readonly roles = computed<Rol[]>(() => this.usuarioActual()?.roles ?? []);
  readonly rolPrincipal = computed(() => rolPrincipal(this.roles()));
  readonly puedeModerar = computed(() => puedeModerar(this.roles()));
  readonly esAdmin = computed(() => esAdministrador(this.roles()));

  tieneAlgunRol(requeridos: readonly Rol[]): boolean {
    return tieneAlgunRol(this.roles(), requeridos);
  }

  // ---------------------------------------------------------------- sesión

  iniciarSesion(correo: string, contrasena: string): Resultado<UsuarioPublico> {
    const usuario = this.usuarios.buscarPorCorreo(correo);
    if (!usuario || usuario.contrasena !== contrasena) return fallo(MENSAJES_AUTENTICACION.credenciales);
    if (!usuario.activo) return fallo(MENSAJES_AUTENTICACION.inactivo);
    this._sesion.set({
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      roles: [...usuario.roles],
      fechaInicio: new Date(),
    });
    return exito(aPublico(usuario));
  }

  cerrarSesion(): void {
    this._sesion.set(null);
  }

  // -------------------------------------------------------------- registro

  correoDisponible(correo: string, excluirId?: number): boolean {
    const existente = this.usuarios.buscarPorCorreo(correo);
    return !existente || existente.id === excluirId;
  }

  nombreUsuarioDisponible(nombreUsuario: string): boolean {
    return !this.usuarios.buscarPorNombreUsuario(nombreUsuario);
  }

  /** Registra un USUARIO nuevo e inicia su sesión. */
  registrar(datos: DatosRegistro): Resultado<UsuarioPublico> {
    const nombreUsuario = datos.nombreUsuario.trim();
    const correo = datos.correo.trim().toLowerCase();
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(nombreUsuario)) {
      return fallo('El nombre de usuario debe tener entre 3 y 30 letras, números, punto, guion o guion bajo.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return fallo('El correo no es válido.');
    if (!this.nombreUsuarioDisponible(nombreUsuario)) return fallo(MENSAJES_AUTENTICACION.usuarioDuplicado);
    if (!this.correoDisponible(correo)) return fallo(MENSAJES_AUTENTICACION.correoDuplicado);
    const errorContrasena = validarContrasena(datos.contrasena, nombreUsuario);
    if (errorContrasena) return fallo(errorContrasena);

    const usuario = this.usuarios.crear({
      nombreUsuario,
      correo,
      contrasena: datos.contrasena,
      roles: ['USUARIO'],
      activo: true,
      nombreVisible: nombreUsuario,
      biografia: '',
      ciudad: '',
      cuboFavorito: '',
      metodoPrincipal: 'CFOP',
      colorAvatar: '#c7421a',
      fechaNacimiento: datos.fechaNacimiento || null,
      fechaCreacion: new Date(),
    });
    this.iniciarSesion(correo, datos.contrasena);
    return exito(aPublico(usuario));
  }

  // ----------------------------------------------------------- recuperación

  /**
   * Paso 1: el correo debe existir. Simula el envío de un código de 6 dígitos
   * (en la vida real llegaría por correo; aquí se devuelve para mostrarlo en pantalla).
   */
  solicitarRecuperacion(correo: string): Resultado<{ codigo: string; nombreUsuario: string }> {
    const usuario = this.usuarios.buscarPorCorreo(correo);
    if (!usuario) return fallo(MENSAJES_AUTENTICACION.correoNoRegistrado);
    if (!usuario.activo) return fallo(MENSAJES_AUTENTICACION.inactivo);
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expira = new Date(Date.now() + MINUTOS_VALIDEZ_CODIGO * 60_000);
    this.codigos.set(usuario.correo, { codigo, expira });
    return exito({ codigo, nombreUsuario: usuario.nombreUsuario });
  }

  /** Paso 2: valida el código y cambia la contraseña. */
  restablecerContrasena(correo: string, codigo: string, nuevaContrasena: string): Resultado {
    const usuario = this.usuarios.buscarPorCorreo(correo);
    if (!usuario) return fallo(MENSAJES_AUTENTICACION.correoNoRegistrado);
    const registro = this.codigos.get(usuario.correo);
    if (!registro || registro.codigo !== codigo.trim()) return fallo('El código ingresado no es correcto.');
    if (registro.expira.getTime() < Date.now()) {
      this.codigos.delete(usuario.correo);
      return fallo('El código expiró. Solicita uno nuevo.');
    }
    const errorContrasena = validarContrasena(nuevaContrasena, usuario.nombreUsuario);
    if (errorContrasena) return fallo(errorContrasena);
    if (nuevaContrasena === usuario.contrasena) return fallo('La nueva contraseña debe ser distinta de la anterior.');
    this.usuarios.actualizar(usuario.id, { contrasena: nuevaContrasena });
    this.codigos.delete(usuario.correo);
    return exito(undefined);
  }

  // ------------------------------------------------------------------ perfil

  actualizarPerfil(datos: DatosPerfil): Resultado<UsuarioPublico> {
    const actual = this.usuarioActual();
    if (!actual) return fallo('Debes iniciar sesión.');
    const correo = datos.correo.trim().toLowerCase();
    if (!this.correoDisponible(correo, actual.id)) return fallo(MENSAJES_AUTENTICACION.correoDuplicado);
    if (datos.biografia.length > 280) return fallo('La biografía no puede superar los 280 caracteres.');
    const actualizado = this.usuarios.actualizar(actual.id, {
      correo,
      nombreVisible: datos.nombreVisible.trim(),
      biografia: datos.biografia.trim(),
      ciudad: datos.ciudad.trim(),
      cuboFavorito: datos.cuboFavorito.trim(),
      metodoPrincipal: datos.metodoPrincipal,
      colorAvatar: datos.colorAvatar,
    });
    return actualizado ? exito(aPublico(actualizado)) : fallo('No se encontró el usuario.');
  }

  cambiarContrasena(actualContrasena: string, nuevaContrasena: string): Resultado {
    const sesion = this._sesion();
    const usuario = sesion ? this.usuarios.buscarPorId(sesion.usuarioId) : undefined;
    if (!usuario) return fallo('Debes iniciar sesión.');
    if (usuario.contrasena !== actualContrasena) return fallo('La contraseña actual no es correcta.');
    if (actualContrasena === nuevaContrasena) return fallo('La nueva contraseña debe ser distinta de la actual.');
    const errorContrasena = validarContrasena(nuevaContrasena, usuario.nombreUsuario);
    if (errorContrasena) return fallo(errorContrasena);
    this.usuarios.actualizar(usuario.id, { contrasena: nuevaContrasena });
    return exito(undefined);
  }
}

/** Quita la contraseña antes de exponer un usuario a la interfaz. */
export function aPublico(usuario: Usuario): UsuarioPublico {
  const { contrasena: _omitida, ...publico } = usuario;
  return publico;
}

/** Reglas de seguridad también del lado del "servidor" simulado. */
function validarContrasena(valor: string, nombreUsuario: string): string | null {
  const incumplida = REGLAS_CONTRASENA.find((r) => !r.cumple(valor, nombreUsuario));
  return incumplida ? `La contraseña no cumple: ${incumplida.descripcion.toLowerCase()}.` : null;
}
