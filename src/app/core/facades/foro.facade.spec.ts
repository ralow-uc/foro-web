import { TestBed } from '@angular/core/testing';
import { CONTRASENA_DEMO } from '../data';
import { ComentarioRepositorio } from '../repositories';
import { AutenticacionFacade } from './autenticacion.facade';
import { ForoFacade } from './foro.facade';

describe('ForoFacade', () => {
  let foro: ForoFacade;
  let auth: AutenticacionFacade;
  const ingresar = (usuario: string) => auth.iniciarSesion(`${usuario}@foro.cl`, CONTRASENA_DEMO);
  const datosValidos = {
    titulo: 'Guía de cruz en inspección',
    categoriaId: 1,
    contenido: 'Planifica la cruz completa durante los 15 segundos de inspección.',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    foro = TestBed.inject(ForoFacade);
    auth = TestBed.inject(AutenticacionFacade);
  });

  describe('visibilidad del contenido baneado', () => {
    it('oculta el tema baneado (15) a visitantes y a USUARIO', () => {
      expect(foro.tema(15)).toBeNull();
      expect(foro.temaOcultoPorModeracion(15)).toBe(true);
      ingresar('feliks');
      expect(foro.tema(15)).toBeNull();
      expect(foro.temasVisibles().some((t) => t.id === 15)).toBe(false);
    });

    it('muestra el tema baneado marcado y con motivo a MODERADOR y ADMIN', () => {
      ingresar('moderadora');
      const tema = foro.tema(15);
      expect(tema?.sancion?.motivo).toContain('Publicidad');
      expect(tema?.sancion?.norma?.codigo).toBe('N2');
      ingresar('admin');
      expect(foro.tema(15)?.sancion).not.toBeNull();
    });

    it('el conteo por categoría solo considera temas visibles', () => {
      const anonimo = foro.categoriasConConteo().find((c) => c.slug === 'cubo-3x3')!.cantidadTemas;
      ingresar('moderadora');
      const moderadora = foro.categoriasConConteo().find((c) => c.slug === 'cubo-3x3')!.cantidadTemas;
      expect(moderadora).toBe(anonimo + 1);
    });
  });

  describe('permisos sobre temas', () => {
    it('un visitante no puede publicar', () => {
      expect(foro.crearTema(datosValidos).ok).toBe(false);
    });

    it('un USUARIO publica y luego edita su propio tema', () => {
      ingresar('yiheng');
      const r = foro.crearTema(datosValidos);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.valor.autorId).toBe(4);
      const editado = foro.editarTema(r.valor.id, { ...datosValidos, titulo: 'Guía de cruz (actualizada)' });
      expect(editado.ok).toBe(true);
      expect(foro.tema(r.valor.id)?.fechaActualizacion).not.toBeNull();
    });

    it('valida largo de título y contenido', () => {
      ingresar('yiheng');
      expect(foro.crearTema({ ...datosValidos, titulo: 'Corto' }).ok).toBe(false);
      expect(foro.crearTema({ ...datosValidos, contenido: 'muy corto' }).ok).toBe(false);
      expect(foro.crearTema({ ...datosValidos, categoriaId: 99 }).ok).toBe(false);
    });

    it('un USUARIO no puede editar ni eliminar temas ajenos', () => {
      ingresar('yiheng');
      const ajeno = foro.tema(1)!; // de feliks
      expect(foro.puedeEditarTema(ajeno)).toBe(false);
      expect(foro.puedeEliminarTema(ajeno)).toBe(false);
      expect(foro.editarTema(1, datosValidos).ok).toBe(false);
      expect(foro.eliminarTema(1).ok).toBe(false);
    });

    it('el ADMIN puede editar y eliminar cualquier tema (con sus comentarios)', () => {
      ingresar('admin');
      expect(foro.puedeEditarTema(foro.tema(1)!)).toBe(true);
      expect(foro.eliminarTema(1).ok).toBe(true);
      expect(foro.tema(1)).toBeNull();
      expect(TestBed.inject(ComentarioRepositorio).porTema(1)).toHaveLength(0);
    });

    it('un tema cerrado no admite comentarios ni edición del autor', () => {
      ingresar('moderadora');
      const cerrado = foro.tema(7)!; // tema cerrado de la moderadora
      expect(foro.puedeComentar(cerrado)).toBe(false);
      expect(foro.puedeEditarTema(cerrado)).toBe(false);
      expect(foro.comentar(7, 'Gracias por la info').ok).toBe(false);
    });
  });

  describe('comentarios', () => {
    it('comenta, edita y elimina su propio comentario', () => {
      ingresar('feliks');
      const r = foro.comentar(2, 'Yo me quedaría con CFOP.');
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const vista = foro.comentariosDe(2).find((c) => c.id === r.valor.id)!;
      expect(foro.puedeEditarComentario(vista)).toBe(true);
      expect(foro.editarComentario(r.valor.id, 'Yo me quedaría con CFOP, sin duda.').ok).toBe(true);
      expect(foro.eliminarComentario(r.valor.id).ok).toBe(true);
    });

    it('no puede editar ni eliminar comentarios ajenos', () => {
      ingresar('feliks');
      expect(foro.editarComentario(1, 'Texto cambiado').ok).toBe(false); // de yiheng
      expect(foro.eliminarComentario(1).ok).toBe(false);
    });

    it('MODERADOR puede eliminar comentarios ajenos', () => {
      ingresar('moderadora');
      expect(foro.eliminarComentario(5).ok).toBe(true);
    });

    it('rechaza comentarios vacíos', () => {
      ingresar('feliks');
      expect(foro.comentar(2, '   ').ok).toBe(false);
    });
  });

  describe('búsqueda y paginación', () => {
    it('filtra por categoría, texto (sin tildes) y autor', () => {
      expect(foro.buscarTemas({ categoriaId: 6, texto: 'angstrom' }).elementos.map((t) => t.id)).toEqual([9]);
      expect(foro.buscarTemas({ texto: 'PARIDAD' }).total).toBe(2);
      expect(foro.buscarTemas({ categoriaId: 1, autorId: 3 }).elementos.every((t) => t.autorId === 3)).toBe(true);
    });

    it('pagina de a 5 y ajusta la página fuera de rango', () => {
      const p1 = foro.buscarTemas({ porPagina: 5, pagina: 1, orden: 'antiguos' });
      expect(p1.elementos).toHaveLength(5);
      expect(p1.elementos[0].id).toBe(1);
      expect(p1.totalPaginas).toBe(Math.ceil(p1.total / 5));
      expect(foro.buscarTemas({ porPagina: 5, pagina: 99 }).pagina).toBe(p1.totalPaginas);
    });

    it('ordena por título', () => {
      const titulos = foro.buscarTemas({ orden: 'titulo', porPagina: 100 }).elementos.map((t) => t.titulo);
      expect(titulos).toEqual([...titulos].sort((a, b) => a.localeCompare(b, 'es')));
    });
  });
});
