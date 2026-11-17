import { Norma } from '../models';

/** Normas del foro: exactamente las del microservicio foro-moderacion. */
export const crearNormasSemilla = (): Norma[] => [
  {
    id: 1,
    codigo: 'N1',
    nombre: 'Respeto entre cuberos',
    descripcion: 'Trata a todos con respeto: sin insultos, burlas ni ataques personales por método o tiempo.',
    gravedad: 'GRAVE',
    activa: true,
  },
  {
    id: 2,
    codigo: 'N2',
    nombre: 'Sin spam ni publicidad',
    descripcion: 'No publiques ventas, enlaces de afiliado ni mensajes repetidos con fines comerciales.',
    gravedad: 'GRAVE',
    activa: true,
  },
  {
    id: 3,
    codigo: 'N3',
    nombre: 'Contenido en la categoría correcta',
    descripcion: 'Publica cada tema en la categoría que corresponde y revisa si ya existe antes de abrir otro.',
    gravedad: 'LEVE',
    activa: true,
  },
  {
    id: 4,
    codigo: 'N4',
    nombre: 'Sin información personal',
    descripcion: 'No compartas datos personales tuyos o de terceros: teléfonos, direcciones ni documentos.',
    gravedad: 'GRAVE',
    activa: true,
  },
  {
    id: 5,
    codigo: 'N5',
    nombre: 'Sin contenido ofensivo',
    descripcion: 'Está prohibido el contenido discriminatorio, violento, sexual o de odio.',
    gravedad: 'CRITICA',
    activa: true,
  },
  {
    id: 6,
    codigo: 'N6',
    nombre: 'Sin piratería ni contenido ilegal',
    descripcion: 'No compartas software pirata, material con derechos de autor sin permiso ni actividades ilegales.',
    gravedad: 'CRITICA',
    activa: true,
  },
];
