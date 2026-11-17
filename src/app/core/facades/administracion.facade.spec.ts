import { TestBed } from '@angular/core/testing';
import { CONTRASENA_DEMO } from '../data';
import { AdministracionFacade, MENSAJE_SOLO_ADMIN } from './administracion.facade';
import { AutenticacionFacade, MENSAJES_AUTENTICACION } from './autenticacion.facade';

describe('AdministracionFacade', () => {
  let admin: AdministracionFacade;
  let auth: AutenticacionFacade;
  const ingresar = (usuario: string) => auth.iniciarSesion(`${usuario}@foro.cl`, CONTRASENA_DEMO);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    admin = TestBed.inject(AdministracionFacade);
    auth = TestBed.inject(AutenticacionFacade);
  });

  it('un MODERADOR no administra cuentas, categorías ni normas', () => {
    ingresar('moderadora');
    for (const r of [
      admin.cambiarRoles(3, ['USUARIO', 'MODERADOR']),
      admin.cambiarActivo(3, false),
      admin.crearCategoria({ nombre: 'Blindfolded', descripcion: 'Resolución a ciegas y memorización.' }),
      admin.crearNorma({ codigo: 'N7', nombre: 'Sin trampas', descripcion: 'No inventes tiempos.', gravedad: 'LEVE', activa: true }),
    ]) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe(MENSAJE_SOLO_ADMIN);
    }
  });

  describe('cuentas', () => {
    beforeEach(() => ingresar('admin'));

    it('filtra por texto, rol y estado', () => {
      expect(admin.filtrarUsuarios({ rol: 'MODERADOR' }).map((u) => u.nombreUsuario)).toEqual(['moderadora']);
      expect(admin.filtrarUsuarios({ estado: 'inactivos' }).map((u) => u.nombreUsuario)).toEqual(['tymon']);
      expect(admin.filtrarUsuarios({ texto: 'FELIKS' }).length).toBe(1);
    });

    it('promueve a MODERADOR y exige al menos un rol', () => {
      expect(admin.cambiarRoles(3, ['USUARIO', 'MODERADOR']).ok).toBe(true);
      ingresar('feliks');
      expect(auth.puedeModerar()).toBe(true);
      ingresar('admin');
      expect(admin.cambiarRoles(3, []).ok).toBe(false);
    });

    it('un ADMIN no puede quitarse su rol, desactivarse ni eliminarse', () => {
      expect(admin.cambiarRoles(1, ['USUARIO']).ok).toBe(false);
      expect(admin.cambiarActivo(1, false).ok).toBe(false);
      expect(admin.eliminarUsuario(1).ok).toBe(false);
    });

    it('desactivar una cuenta le impide iniciar sesión; reactivarla lo permite', () => {
      expect(admin.cambiarActivo(4, false).ok).toBe(true);
      const r = auth.iniciarSesion('yiheng@foro.cl', CONTRASENA_DEMO);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe(MENSAJES_AUTENTICACION.inactivo);
      ingresar('admin');
      expect(admin.cambiarActivo(5, true).ok).toBe(true);
      expect(auth.iniciarSesion('tymon@foro.cl', CONTRASENA_DEMO).ok).toBe(true);
    });
  });

  describe('categorías', () => {
    beforeEach(() => ingresar('admin'));

    it('crea con slug automático y rechaza nombres repetidos sin distinguir tildes', () => {
      const r = admin.crearCategoria({ nombre: 'Resolución a ciegas', descripcion: 'Blindfolded, memo y ejecución.' });
      expect(r.ok && r.valor.slug).toBe('resolucion-a-ciegas');
      expect(admin.crearCategoria({ nombre: 'metodos y ALGORITMOS', descripcion: 'Duplicada con otra forma.' }).ok).toBe(false);
    });

    it('no elimina una categoría con temas', () => {
      expect(admin.eliminarCategoria(1).ok).toBe(false);
    });
  });

  describe('normas', () => {
    beforeEach(() => ingresar('admin'));

    it('valida el código N1..N999 y su unicidad', () => {
      const base = { nombre: 'Sin trampas', descripcion: 'No publiques tiempos falsos.', gravedad: 'GRAVE' as const, activa: true };
      expect(admin.crearNorma({ ...base, codigo: 'X1' }).ok).toBe(false);
      expect(admin.crearNorma({ ...base, codigo: 'n2' }).ok).toBe(false); // N2 ya existe
      const r = admin.crearNorma({ ...base, codigo: 'n7' });
      expect(r.ok && r.valor.codigo).toBe('N7');
      expect(r.ok && admin.eliminarNorma(r.valor.id).ok).toBe(true);
    });

    it('una norma citada en reportes no se elimina, pero se puede desactivar', () => {
      const n3 = admin.listaNormas().find((n) => n.codigo === 'N3')!;
      expect(n3.usos).toBeGreaterThan(0);
      expect(admin.eliminarNorma(n3.id).ok).toBe(false);
      expect(admin.editarNorma(n3.id, { ...n3, activa: false }).ok).toBe(true);
    });
  });
});
