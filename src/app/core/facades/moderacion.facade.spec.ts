import { TestBed } from '@angular/core/testing';
import { CONTRASENA_DEMO } from '../data';
import { ReporteRepositorio } from '../repositories';
import { AutenticacionFacade } from './autenticacion.facade';
import { ForoFacade } from './foro.facade';
import { MENSAJES_MODERACION, ModeracionFacade, numeroNorma } from './moderacion.facade';

describe('ModeracionFacade', () => {
  let moderacion: ModeracionFacade;
  let foro: ForoFacade;
  let auth: AutenticacionFacade;
  let reportes: ReporteRepositorio;
  const ingresar = (usuario: string) => auth.iniciarSesion(`${usuario}@foro.cl`, CONTRASENA_DEMO);
  const motivo = 'Pregunta repetida varias veces en la misma semana.';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    moderacion = TestBed.inject(ModeracionFacade);
    foro = TestBed.inject(ForoFacade);
    auth = TestBed.inject(AutenticacionFacade);
    reportes = TestBed.inject(ReporteRepositorio);
  });

  it('parte con las 6 normas del backend ordenadas y 2 reportes pendientes', () => {
    expect(moderacion.normasActivas().map((n) => n.codigo)).toEqual(['N1', 'N2', 'N3', 'N4', 'N5', 'N6']);
    expect(moderacion.reportesPendientes().length).toBe(2);
    expect(numeroNorma('N12')).toBeGreaterThan(numeroNorma('N2'));
  });

  describe('reportes', () => {
    it('un USUARIO reporta contenido ajeno y no puede repetir el reporte pendiente', () => {
      ingresar('feliks');
      const datos = { tipo: 'TEMA' as const, contenidoId: 9, normaId: 2, detalle: 'Promociona una marca de lubricante.' };
      expect(moderacion.reportar(datos).ok).toBe(true);
      expect(moderacion.reportesPendientes().length).toBe(3);
      const repetido = moderacion.reportar(datos);
      expect(repetido.ok).toBe(false);
    });

    it('no permite reportar contenido propio ni sin sesión', () => {
      const datos = { tipo: 'TEMA' as const, contenidoId: 8, normaId: 2, detalle: 'Detalle suficientemente largo.' };
      expect(moderacion.reportar(datos).ok).toBe(false);
      ingresar('feliks'); // el tema 8 es de feliks
      const r = moderacion.reportar(datos);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain('propio');
    });

    it('exige un detalle de al menos 10 caracteres', () => {
      ingresar('feliks');
      expect(moderacion.reportar({ tipo: 'TEMA', contenidoId: 9, normaId: 2, detalle: 'corto' }).ok).toBe(false);
    });

    it('solo MODERADOR o ADMIN descartan reportes', () => {
      ingresar('feliks');
      const r = moderacion.descartarReporte(1);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe(MENSAJES_MODERACION.sinPermiso);
      ingresar('moderadora');
      expect(moderacion.descartarReporte(1).ok).toBe(true);
      expect(reportes.buscarPorId(1)?.estado).toBe('DESCARTADO');
      expect(moderacion.descartarReporte(1).ok).toBe(false);
    });
  });

  describe('baneos', () => {
    it('un USUARIO no puede banear', () => {
      ingresar('feliks');
      const r = moderacion.banear({ tipo: 'TEMA', contenidoId: 2, normaId: 3, motivo });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe(MENSAJES_MODERACION.sinPermiso);
    });

    it('MODERADOR banea: el tema se oculta a los usuarios y los reportes quedan sancionados', () => {
      ingresar('moderadora');
      expect(moderacion.banear({ tipo: 'TEMA', contenidoId: 2, normaId: 3, motivo, reporteId: 1 }).ok).toBe(true);
      expect(reportes.buscarPorId(1)?.estado).toBe('SANCIONADO');
      expect(foro.tema(2)?.sancion?.motivo).toBe(motivo); // la moderadora lo ve marcado
      ingresar('feliks');
      expect(foro.tema(2)).toBeNull(); // el usuario ya no lo ve
      ingresar('moderadora');
      expect(moderacion.banear({ tipo: 'TEMA', contenidoId: 2, normaId: 3, motivo }).ok).toBe(false); // ya baneado
    });

    it('el motivo del baneo debe tener entre 10 y 400 caracteres', () => {
      ingresar('moderadora');
      expect(moderacion.banear({ tipo: 'TEMA', contenidoId: 2, normaId: 3, motivo: 'spam' }).ok).toBe(false);
      expect(moderacion.banear({ tipo: 'TEMA', contenidoId: 2, normaId: 3, motivo: 'x'.repeat(401) }).ok).toBe(false);
    });

    it('solo el ADMIN levanta un baneo y el contenido vuelve a verse', () => {
      ingresar('moderadora');
      moderacion.banear({ tipo: 'COMENTARIO', contenidoId: 5, normaId: 1, motivo: 'Burla hacia quienes usan Roux.' });
      const sancion = moderacion.sancionActiva('COMENTARIO', 5)!;
      const r = moderacion.levantarSancion(sancion.id, 'Revisado: la crítica era respetuosa.');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe(MENSAJES_MODERACION.soloAdminLevanta);

      ingresar('admin');
      expect(moderacion.levantarSancion(sancion.id, 'corto').ok).toBe(false);
      expect(moderacion.levantarSancion(sancion.id, 'Revisado: la crítica era respetuosa.').ok).toBe(true);
      expect(moderacion.sancionActiva('COMENTARIO', 5)).toBeNull();
      expect(moderacion.levantarSancion(sancion.id, 'Revisado: la crítica era respetuosa.').ok).toBe(false);
    });
  });

  it('cerrar un tema impide comentarlo; reabrirlo lo permite', () => {
    ingresar('moderadora');
    expect(moderacion.cerrarTema(1).ok).toBe(true);
    ingresar('yiheng');
    expect(foro.comentar(1, 'Felicitaciones por el avance.').ok).toBe(false);
    expect(moderacion.reabrirTema(1).ok).toBe(false); // un USUARIO no modera
    ingresar('moderadora');
    expect(moderacion.reabrirTema(1).ok).toBe(true);
    ingresar('yiheng');
    expect(foro.comentar(1, 'Felicitaciones por el avance.').ok).toBe(true);
  });
});
