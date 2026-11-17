import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { CONTRASENA_DEMO } from '../data';
import { AutenticacionFacade } from '../facades/autenticacion.facade';
import { authGuard, invitadoGuard } from './auth.guard';
import { rolGuard } from './rol.guard';

describe('Guards', () => {
  let auth: AutenticacionFacade;
  let router: Router;
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = { url: '/moderacion' } as RouterStateSnapshot;

  const ejecutar = (guard: typeof authGuard) => TestBed.runInInjectionContext(() => guard(ruta, estado));
  const url = (resultado: unknown) => router.serializeUrl(resultado as UrlTree);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AutenticacionFacade);
    router = TestBed.inject(Router);
  });

  it('authGuard redirige a /login con la URL de retorno si no hay sesión', () => {
    expect(url(ejecutar(authGuard))).toBe('/login?volver=%2Fmoderacion');
  });

  it('authGuard deja pasar con sesión', () => {
    auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    expect(ejecutar(authGuard)).toBe(true);
  });

  it('rolGuard niega a un USUARIO el panel de moderación', () => {
    auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    expect(url(ejecutar(rolGuard(['MODERADOR', 'ADMIN'])))).toBe('/acceso-denegado');
  });

  it('rolGuard permite moderación a MODERADOR y ADMIN', () => {
    auth.iniciarSesion('moderadora@foro.cl', CONTRASENA_DEMO);
    expect(ejecutar(rolGuard(['MODERADOR', 'ADMIN']))).toBe(true);
    auth.iniciarSesion('admin@foro.cl', CONTRASENA_DEMO);
    expect(ejecutar(rolGuard(['MODERADOR', 'ADMIN']))).toBe(true);
  });

  it('rolGuard de administración solo permite ADMIN', () => {
    auth.iniciarSesion('moderadora@foro.cl', CONTRASENA_DEMO);
    expect(url(ejecutar(rolGuard(['ADMIN'])))).toBe('/acceso-denegado');
    auth.iniciarSesion('admin@foro.cl', CONTRASENA_DEMO);
    expect(ejecutar(rolGuard(['ADMIN']))).toBe(true);
  });

  it('rolGuard sin sesión envía a /login', () => {
    expect(url(ejecutar(rolGuard(['ADMIN'])))).toBe('/login?volver=%2Fmoderacion');
  });

  it('invitadoGuard saca de /login a quien ya inició sesión', () => {
    expect(ejecutar(invitadoGuard)).toBe(true);
    auth.iniciarSesion('feliks@foro.cl', CONTRASENA_DEMO);
    expect(url(ejecutar(invitadoGuard))).toBe('/');
  });
});
