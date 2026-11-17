import { Comentario } from '../models';

const c = (
  id: number,
  temaId: number,
  autorId: number,
  contenido: string,
  fecha: string,
): Comentario => ({ id, temaId, autorId, contenido, fechaCreacion: new Date(fecha), fechaActualizacion: null });

/** Comentarios semilla (en orden cronológico por tema). */
export const crearComentariosSemilla = (): Comentario[] => [
  c(1, 1, 4, '¡Felicitaciones! ¿Qué cambiaste en tu rutina para dar el salto?', '2026-09-02T20:01:00'),
  c(2, 1, 3, 'Planificar la cruz completa en inspección y dejar de mirar el cubo entre pares. Eso me dio casi dos segundos.', '2026-09-02T20:30:00'),
  c(3, 1, 2, 'Excelente progreso. Si quieres, comparte tu promedio de 12 en el próximo hilo de tiempos.', '2026-09-03T09:12:00'),
  c(4, 2, 3, 'CFOP tiene mucho más material y tutoriales. Yo seguiría puliendo lookahead antes de cambiar.', '2026-09-10T22:00:00'),
  c(5, 2, 5, 'Roux es para los que no saben hacer F2L, así de simple. Ni lo pienses.', '2026-09-11T00:15:00'),
  c(6, 2, 2, 'Ambos métodos llegan a sub-15 sin problema. Lo importante es la práctica deliberada, no el método.', '2026-09-11T08:40:00'),
  c(7, 3, 4, 'Agrupar por forma funciona muy bien. Yo además practicaba el reconocimiento con un generador de casos.', '2026-09-19T12:00:00'),
  c(8, 4, 3, 'El algoritmo de paridad de OLL se aprende mejor en partes: r2 B2 U2 l U2 r\' U2 r U2 F2 r F2 l\' B2 r2.', '2026-09-26T10:05:00'),
  c(9, 4, 1, 'Truco: si al llegar a OLL tienes un número impar de aristas orientadas, hay paridad. Así la detectas antes.', '2026-09-26T15:30:00'),
  c(10, 5, 4, 'Yo hago lo mismo. Al principio tardaba tres minutos solo en la última capa, ahora menos de uno.', '2026-10-02T18:00:00'),
  c(11, 6, 3, '¡Me apunto como juez! Soy de Concepción. ¿Habrá categoría de 3x3 a ciegas?', '2026-10-06T13:10:00'),
  c(12, 6, 1, 'Sí, 3BLD está confirmado. Publicaremos el horario completo en noviembre.', '2026-10-06T16:45:00'),
  c(13, 8, 4, '¿Qué tal se siente comparado con la versión anterior? Estoy pensando en comprarlo.', '2026-10-21T09:30:00'),
  c(14, 8, 3, 'Más estable y menos ruidoso. Si ya tienes el anterior, no es un cambio enorme.', '2026-10-21T11:00:00'),
  c(15, 9, 3, 'Uso Angstrom en el núcleo y DNM-37 en las piezas. Para competencia me quedo con esa mezcla.', '2026-10-28T19:40:00'),
  c(16, 10, 3, 'Empieza con el método por capas. Cuando lo resuelvas en menos de dos minutos, pasa a CFOP de 4 pasos.', '2026-11-02T14:00:00'),
  c(17, 12, 4, 'Yau5 es muy bueno para bajar de dos minutos. Las primeras semanas cuesta, pero vale la pena.', '2026-11-08T21:15:00'),
  c(18, 13, 2, 'La clave es contar los intercambios de bordes y esquinas en la forma cúbica. Haré una guía con imágenes.', '2026-11-11T10:20:00'),
];
