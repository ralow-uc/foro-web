import { Categoria } from '../models';

/** Categorías semilla: mismos nombres, slugs y descripciones que foro-temas. */
export const crearCategoriasSemilla = (): Categoria[] => [
  {
    id: 1,
    nombre: 'Cubo 3x3',
    slug: 'cubo-3x3',
    descripcion: 'El clásico de 3x3x3: métodos, tiempos y primeros pasos.',
    fechaCreacion: new Date('2026-08-01T09:10:00'),
  },
  {
    id: 2,
    nombre: 'Big cubes',
    slug: 'big-cubes',
    descripcion: '4x4, 5x5 y superiores: reducción, paridades y hardware.',
    fechaCreacion: new Date('2026-08-01T09:11:00'),
  },
  {
    id: 3,
    nombre: 'Métodos y algoritmos',
    slug: 'metodos-y-algoritmos',
    descripcion: 'CFOP, Roux, ZZ, Petrus y la discusión eterna sobre cuál es mejor.',
    fechaCreacion: new Date('2026-08-01T09:12:00'),
  },
  {
    id: 4,
    nombre: 'Puzzles no cúbicos',
    slug: 'puzzles-no-cubicos',
    descripcion: 'Megaminx, Pyraminx, Skewb, Square-1 y todo lo que no es un cubo.',
    fechaCreacion: new Date('2026-08-01T09:13:00'),
  },
  {
    id: 5,
    nombre: 'Competencias WCA',
    slug: 'competencias-wca',
    descripcion: 'Torneos oficiales, reglamento, récords y experiencias compitiendo.',
    fechaCreacion: new Date('2026-08-01T09:14:00'),
  },
  {
    id: 6,
    nombre: 'Hardware y mods',
    slug: 'hardware-y-mods',
    descripcion: 'Cubos magnéticos, lubricantes, tensiones y modificaciones.',
    fechaCreacion: new Date('2026-08-01T09:15:00'),
  },
];
