import { Signal, WritableSignal, computed, signal } from '@angular/core';
import { Entidad } from '../models';

/**
 * Patrón Repository genérico en memoria.
 *
 * Reemplaza esta semana a los microservicios: guarda la colección en un
 * `signal<T[]>` (patrón Observer: cualquier `computed` o plantilla que lo lea
 * se actualiza sola) y expone un CRUD con id autoincremental.
 * Todas las escrituras son inmutables (se crea un arreglo nuevo) para que
 * los signals notifiquen el cambio. Los datos se pierden al recargar la página.
 */
export class RepositorioEnMemoria<T extends Entidad> {
  private readonly coleccion: WritableSignal<T[]>;
  private siguienteId: number;

  /** Vista de solo lectura y reactiva de la colección completa. */
  readonly elementos: Signal<readonly T[]>;

  /** Cantidad de elementos (reactivo). */
  readonly total: Signal<number>;

  constructor(semilla: T[] = []) {
    this.coleccion = signal<T[]>([...semilla]);
    this.siguienteId = this.calcularSiguienteId(semilla);
    this.elementos = this.coleccion.asReadonly();
    this.total = computed(() => this.coleccion().length);
  }

  /** Devuelve todos los elementos. */
  listar(): T[] {
    return [...this.coleccion()];
  }

  buscarPorId(id: number): T | undefined {
    return this.coleccion().find((e) => e.id === id);
  }

  /** Filtra con un predicado arbitrario. */
  buscar(predicado: (elemento: T) => boolean): T[] {
    return this.coleccion().filter(predicado);
  }

  buscarUno(predicado: (elemento: T) => boolean): T | undefined {
    return this.coleccion().find(predicado);
  }

  existe(predicado: (elemento: T) => boolean): boolean {
    return this.coleccion().some(predicado);
  }

  /** Inserta un elemento asignándole el siguiente id disponible. */
  crear(datos: Omit<T, 'id'>): T {
    const nuevo = { ...datos, id: this.siguienteId++ } as T;
    this.coleccion.update((lista) => [...lista, nuevo]);
    return nuevo;
  }

  /** Aplica cambios parciales. Devuelve el elemento actualizado o `undefined` si no existe. */
  actualizar(id: number, cambios: Partial<Omit<T, 'id'>>): T | undefined {
    let actualizado: T | undefined;
    this.coleccion.update((lista) =>
      lista.map((e) => {
        if (e.id !== id) return e;
        actualizado = { ...e, ...cambios, id } as T;
        return actualizado;
      }),
    );
    return actualizado;
  }

  /** Elimina por id. Devuelve `true` si existía. */
  eliminar(id: number): boolean {
    const antes = this.coleccion().length;
    this.coleccion.update((lista) => lista.filter((e) => e.id !== id));
    return this.coleccion().length < antes;
  }

  /** Elimina todos los elementos que cumplan el predicado y devuelve cuántos fueron. */
  eliminarDonde(predicado: (elemento: T) => boolean): number {
    const antes = this.coleccion().length;
    this.coleccion.update((lista) => lista.filter((e) => !predicado(e)));
    return antes - this.coleccion().length;
  }

  /** Restablece la colección (útil en pruebas). */
  reiniciar(semilla: T[]): void {
    this.coleccion.set([...semilla]);
    this.siguienteId = this.calcularSiguienteId(semilla);
  }

  private calcularSiguienteId(semilla: T[]): number {
    return semilla.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  }
}
