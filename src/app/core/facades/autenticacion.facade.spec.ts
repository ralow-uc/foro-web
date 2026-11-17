import { TestBed } from '@angular/core/testing';
import { CONTRASENA_DEMO } from '../data';
import { UsuarioRepositorio } from '../repositories';
import { AutenticacionFacade, MENSAJES_AUTENTICACION } from './autenticacion.facade';

describe('AutenticacionFacade', () => {
  let auth: AutenticacionFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AutenticacionFacade);
  });

  it('inicia sesión con credenciales correctas y expone el rol', () => {
    const r = auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    expect(r.ok).toBe(true);
    expect(auth.estaAutenticado()).toBe(true);
    expect(auth.usuarioActual()?.nombreUsuario).toBe('feliks');
    expect(auth.rolPrincipal()).toBe('USUARIO');
    expect(auth.puedeModerar()).toBe(false);
  });

  it('no expone la contraseña en el usuario actual', () => {
    auth.iniciarSesion('admin@foro.cl', CONTRASENA_DEMO);
    expect(auth.usuarioActual()).not.toHaveProperty('contrasena');
    expect(auth.esAdmin()).toBe(true);
  });

  it('el correo no distingue mayúsculas', () => {
    expect(auth.iniciarSesion('  Moderadora@Foro.CL ', CONTRASENA_DEMO).ok).toBe(true);
    expect(auth.rolPrincipal()).toBe('MODERADOR');
  });

  it('rechaza contraseña incorrecta con mensaje genérico', () => {
    const r = auth.iniciarSesion('feliks@foro.cl', 'Otra1234*');
    expect(r).toEqual({ ok: false, error: MENSAJES_AUTENTICACION.credenciales });
    expect(auth.estaAutenticado()).toBe(false);
  });

  it('rechaza correo inexistente con el mismo mensaje', () => {
    expect(auth.iniciarSesion('nadie@foro.cl', CONTRASENA_DEMO)).toEqual({
      ok: false,
      error: MENSAJES_AUTENTICACION.credenciales,
    });
  });

  it('rechaza al usuario inactivo (tymon) con un mensaje claro', () => {
    const r = auth.iniciarSesion('tymon@foro.cl', CONTRASENA_DEMO);
    expect(r).toEqual({ ok: false, error: MENSAJES_AUTENTICACION.inactivo });
  });

  it('cierra sesión', () => {
    auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    auth.cerrarSesion();
    expect(auth.usuarioActual()).toBeNull();
  });

  it('registra un usuario nuevo con rol USUARIO e inicia su sesión', () => {
    const r = auth.registrar({ nombreUsuario: 'nuevo_cubero', correo: 'nuevo@foro.cl', contrasena: 'Giro2026*' });
    expect(r.ok).toBe(true);
    expect(auth.usuarioActual()?.roles).toEqual(['USUARIO']);
  });

  it('rechaza registro con correo duplicado', () => {
    const r = auth.registrar({ nombreUsuario: 'otro', correo: 'FELIKS@foro.cl', contrasena: 'Giro2026*' });
    expect(r).toEqual({ ok: false, error: MENSAJES_AUTENTICACION.correoDuplicado });
  });

  it('rechaza registro con nombre de usuario duplicado', () => {
    const r = auth.registrar({ nombreUsuario: 'Yiheng', correo: 'otro@foro.cl', contrasena: 'Giro2026*' });
    expect(r).toEqual({ ok: false, error: MENSAJES_AUTENTICACION.usuarioDuplicado });
  });

  it('rechaza registro con contraseña insegura', () => {
    const r = auth.registrar({ nombreUsuario: 'debil', correo: 'debil@foro.cl', contrasena: 'debil' });
    expect(r.ok).toBe(false);
  });

  it('recupera la contraseña con código de 6 dígitos', () => {
    const solicitud = auth.solicitarRecuperacion('yiheng@foro.cl');
    expect(solicitud.ok).toBe(true);
    if (!solicitud.ok) return;
    expect(solicitud.valor.codigo).toMatch(/^\d{6}$/);
    expect(auth.restablecerContrasena('yiheng@foro.cl', '000000x', 'Nueva2026*').ok).toBe(false);
    expect(auth.restablecerContrasena('yiheng@foro.cl', solicitud.valor.codigo, 'Nueva2026*').ok).toBe(true);
    expect(auth.iniciarSesion('yiheng@foro.cl', 'Nueva2026*').ok).toBe(true);
  });

  it('no envía código a correos no registrados', () => {
    expect(auth.solicitarRecuperacion('fantasma@foro.cl')).toEqual({
      ok: false,
      error: MENSAJES_AUTENTICACION.correoNoRegistrado,
    });
  });

  it('cambia la contraseña validando la actual', () => {
    auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    expect(auth.cambiarContrasena('mala', 'Nueva2026*').ok).toBe(false);
    expect(auth.cambiarContrasena(CONTRASENA_DEMO, CONTRASENA_DEMO).ok).toBe(false);
    expect(auth.cambiarContrasena(CONTRASENA_DEMO, 'Nueva2026*').ok).toBe(true);
  });

  it('actualiza el perfil y valida correo único', () => {
    auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    const base = {
      nombreVisible: 'Feliks Z',
      biografia: 'Sub-15 pronto',
      ciudad: 'Concepción',
      cuboFavorito: 'GAN',
      metodoPrincipal: 'CFOP' as const,
      colorAvatar: '#2b50d6',
    };
    expect(auth.actualizarPerfil({ ...base, correo: 'yiheng@foro.cl' }).ok).toBe(false);
    expect(auth.actualizarPerfil({ ...base, correo: 'feliks@foro.cl' }).ok).toBe(true);
    expect(auth.usuarioActual()?.nombreVisible).toBe('Feliks Z');
  });

  it('la sesión cae si un administrador desactiva la cuenta', () => {
    auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    TestBed.inject(UsuarioRepositorio).actualizar(3, { activo: false });
    expect(auth.estaAutenticado()).toBe(false);
  });
});
