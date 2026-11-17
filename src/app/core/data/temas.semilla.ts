import { Tema } from '../models';

const d = (iso: string): Date => new Date(iso);

/**
 * Temas semilla. Los ids 1–9 siguen el mismo orden que el seed de foro-temas;
 * del 10 en adelante se agregan para que cada categoría tenga al menos dos temas
 * y la paginación de "Cubo 3x3" sea visible.
 * Categorías: 1 cubo-3x3 · 2 big-cubes · 3 métodos · 4 no cúbicos · 5 WCA · 6 hardware.
 * Autores: 1 admin · 2 moderadora · 3 feliks · 4 yiheng · 5 tymon.
 */
export const crearTemasSemilla = (): Tema[] => [
  {
    id: 1,
    titulo: 'Por fin bajé de 20 segundos',
    contenido:
      'Después de cuatro meses practicando todos los días logré un promedio de 5 bajo 20 segundos (19,42).\n\nLo que más me ayudó fue dejar de mirar el cubo durante el F2L y hacer sesiones cortas de 30 resoluciones con descanso. ¿Qué rutina usan ustedes para seguir bajando?',
    categoriaId: 1,
    autorId: 3,
    cerrado: false,
    fechaCreacion: d('2026-09-02T19:20:00'),
    fechaActualizacion: null,
  },
  {
    id: 2,
    titulo: '¿CFOP o Roux para bajar de 15?',
    contenido:
      'Llevo un año con CFOP y estoy estancado en 17 segundos. Veo que Roux tiene menos movimientos y menos rotaciones.\n\n¿Vale la pena cambiar de método a estas alturas o es mejor pulir el lookahead y aprender full OLL?',
    categoriaId: 3,
    autorId: 4,
    cerrado: false,
    fechaCreacion: d('2026-09-10T21:05:00'),
    fechaActualizacion: null,
  },
  {
    id: 3,
    titulo: 'Memorizar las 57 OLL en un mes',
    contenido:
      'Me propuse aprender las 57 OLL en 30 días. Mi plan: agruparlas por forma (puntos, líneas, L, cuadrados, peces) y aprender dos por día con repaso espaciado.\n\nVoy en el día 12 con 24 casos. Comparto mi planilla si a alguien le sirve.',
    categoriaId: 3,
    autorId: 3,
    cerrado: false,
    fechaCreacion: d('2026-09-18T17:40:00'),
    fechaActualizacion: d('2026-09-30T10:00:00'),
  },
  {
    id: 4,
    titulo: 'La paridad del 4x4 me sigue costando',
    contenido:
      'Puedo reducir el 4x4 sin problema, pero cuando aparece la paridad de OLL me pierdo en el algoritmo largo y termino desarmando todo.\n\n¿Algún truco para memorizar el algoritmo o reconocer la paridad antes?',
    categoriaId: 2,
    autorId: 4,
    cerrado: false,
    fechaCreacion: d('2026-09-25T22:10:00'),
    fechaActualizacion: null,
  },
  {
    id: 5,
    titulo: 'Megaminx: cómo memorizar la última capa',
    contenido:
      'La última capa del Megaminx tiene muchos casos. Yo la divido en 2-look: primero orientar con 4 algoritmos y después permutar.\n\nDejo los algoritmos que uso y los errores típicos de los primeros días.',
    categoriaId: 4,
    autorId: 2,
    cerrado: false,
    fechaCreacion: d('2026-10-01T16:30:00'),
    fechaActualizacion: null,
  },
  {
    id: 6,
    titulo: 'Nacional WCA Chile 2026: organización',
    contenido:
      'Estamos organizando el Nacional WCA Chile 2026. Necesitamos jueces, mezcladores y ayuda con la logística del recinto.\n\nSi quieres ser voluntario, comenta con tu ciudad y en qué categorías puedes ayudar.',
    categoriaId: 5,
    autorId: 1,
    cerrado: false,
    fechaCreacion: d('2026-10-06T12:00:00'),
    fechaActualizacion: null,
  },
  {
    id: 7,
    titulo: 'Las tres reglas que más descalifican',
    contenido:
      '1) Tocar el cubo antes de terminar la inspección.\n2) Detener el cronómetro sin las dos manos.\n3) Pasarse de los 15 segundos de inspección (+2 o DNF).\n\nLean el reglamento antes de su primera competencia. Cierro el tema para que quede como referencia.',
    categoriaId: 5,
    autorId: 2,
    cerrado: true,
    fechaCreacion: d('2026-10-12T09:45:00'),
    fechaActualizacion: null,
  },
  {
    id: 8,
    titulo: 'Reseña del GAN 14 con MagLev',
    contenido:
      'Lo usé dos semanas. Muy liviano, el MagLev se siente suave y el corner cutting es excelente. Lo malo: el precio y que las tensiones vienen muy sueltas de fábrica.\n\nNota personal: 8,5/10.',
    categoriaId: 6,
    autorId: 3,
    cerrado: false,
    fechaCreacion: d('2026-10-20T20:00:00'),
    fechaActualizacion: null,
  },
  {
    id: 9,
    titulo: 'Lubricantes: Angstrom contra DNM-37',
    contenido:
      'Probé ambos en el mismo cubo durante una semana cada uno. El DNM-37 lo deja muy rápido pero dura poco; Angstrom es más controlado.\n\n¿Cuál prefieren para competencia?',
    categoriaId: 6,
    autorId: 4,
    cerrado: false,
    fechaCreacion: d('2026-10-28T18:25:00'),
    fechaActualizacion: null,
  },
  {
    id: 10,
    titulo: 'Mi primer cubo: ¿por dónde empiezo?',
    contenido:
      'Me regalaron un cubo y quiero aprender a resolverlo. ¿Recomiendan aprender primero el método por capas o ir directo a algo más avanzado?',
    categoriaId: 1,
    autorId: 4,
    cerrado: false,
    fechaCreacion: d('2026-11-02T13:15:00'),
    fechaActualizacion: null,
  },
  {
    id: 11,
    titulo: 'Ejercicios para planificar la cruz en inspección',
    contenido:
      'Comparto una rutina: 20 mezclas al día, planificar la cruz completa en inspección y resolverla con los ojos cerrados. Al principio cuesta, después se vuelve natural.',
    categoriaId: 1,
    autorId: 2,
    cerrado: false,
    fechaCreacion: d('2026-11-05T10:00:00'),
    fechaActualizacion: null,
  },
  {
    id: 12,
    titulo: '5x5: ¿método Yau o reducción clásica?',
    contenido:
      'Quiero empezar en serio con el 5x5. ¿Yau5 vale la pena o la reducción clásica es suficiente para bajar de dos minutos?',
    categoriaId: 2,
    autorId: 3,
    cerrado: false,
    fechaCreacion: d('2026-11-08T19:50:00'),
    fechaActualizacion: null,
  },
  {
    id: 13,
    titulo: 'Square-1: la paridad que nadie explica bien',
    contenido:
      'Todos los tutoriales del Square-1 pasan rápido por la paridad. ¿Alguien tiene una explicación clara de cómo reconocerla durante la resolución?',
    categoriaId: 4,
    autorId: 4,
    cerrado: false,
    fechaCreacion: d('2026-11-10T21:30:00'),
    fechaActualizacion: null,
  },
  {
    id: 14,
    titulo: 'Lookahead: dejar de pausar entre pares del F2L',
    contenido:
      'Mi problema son las pausas entre pares. Estoy practicando resolver lento sin detenerme, buscando el siguiente par mientras inserto el actual. ¿Más ideas?',
    categoriaId: 1,
    autorId: 3,
    cerrado: false,
    fechaCreacion: d('2026-11-12T08:40:00'),
    fechaActualizacion: null,
  },
  {
    id: 15,
    titulo: 'VENDO CUBOS BARATOS, ESCRIBE AL PRIVADO',
    contenido: 'Tengo cubos de todas las marcas a mitad de precio. Escríbeme al privado o a mi teléfono para comprar.',
    categoriaId: 1,
    autorId: 5,
    cerrado: false,
    fechaCreacion: d('2026-11-14T23:10:00'),
    fechaActualizacion: null,
  },
];
