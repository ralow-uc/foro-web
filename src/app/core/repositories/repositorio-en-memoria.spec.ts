import { computed } from '@angular/core';
import { Entidad } from '../models';
import { RepositorioEnMemoria } from './repositorio-en-memoria';

interface Cubo extends Entidad {
  nombre: string;
  capas: number;
}

describe('RepositorioEnMemoria', () => {
  let repo: RepositorioEnMemoria<Cubo>;

  beforeEach(() => {
    repo = new RepositorioEnMemoria<Cubo>([
      { id: 1, nombre: '3x3', capas: 3 },
      { id: 4, nombre: '4x4', capas: 4 },
    ]);
  });

  it('lista los elementos de la semilla', () => {
    expect(repo.listar().map((c) => c.nombre)).toEqual(['3x3', '4x4']);
    expect(repo.total()).toBe(2);
  });

  it('busca por id y devuelve undefined si no existe', () => {
    expect(repo.buscarPorId(4)?.nombre).toBe('4x4');
    expect(repo.buscarPorId(99)).toBeUndefined();
  });

  it('crea con id autoincremental a partir del mayor id existente', () => {
    const a = repo.crear({ nombre: '5x5', capas: 5 });
    const b = repo.crear({ nombre: '2x2', capas: 2 });
    expect(a.id).toBe(5);
    expect(b.id).toBe(6);
    expect(repo.total()).toBe(4);
  });

  it('actualiza parcialmente sin cambiar el id', () => {
    const actualizado = repo.actualizar(1, { nombre: '3x3 magnético' });
    expect(actualizado).toEqual({ id: 1, nombre: '3x3 magnético', capas: 3 });
    expect(repo.actualizar(99, { nombre: 'x' })).toBeUndefined();
  });

  it('elimina por id y por predicado', () => {
    expect(repo.eliminar(1)).toBe(true);
    expect(repo.eliminar(1)).toBe(false);
    repo.crear({ nombre: '6x6', capas: 6 });
    expect(repo.eliminarDonde((c) => c.capas > 3)).toBe(2);
    expect(repo.total()).toBe(0);
  });

  it('notifica a los computed (patrón Observer) en cada escritura', () => {
    const totalCapas = computed(() => repo.elementos().reduce((s, c) => s + c.capas, 0));
    expect(totalCapas()).toBe(7);
    repo.crear({ nombre: '7x7', capas: 7 });
    expect(totalCapas()).toBe(14);
    repo.eliminar(4);
    expect(totalCapas()).toBe(10);
  });

  it('las escrituras son inmutables (nuevo arreglo)', () => {
    const antes = repo.elementos();
    repo.actualizar(1, { capas: 33 });
    expect(repo.elementos()).not.toBe(antes);
    expect(antes[0].capas).toBe(3);
  });

  it('reinicia la colección y el contador de ids', () => {
    repo.reiniciar([{ id: 10, nombre: 'Megaminx', capas: 0 }]);
    expect(repo.total()).toBe(1);
    expect(repo.crear({ nombre: 'Skewb', capas: 2 }).id).toBe(11);
  });
});
