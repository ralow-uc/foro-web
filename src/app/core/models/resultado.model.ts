/**
 * Resultado de una operación de negocio de los facades.
 * Evita lanzar excepciones hacia los componentes.
 */
export type Resultado<T = void> = { ok: true; valor: T } | { ok: false; error: string };

export const exito = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
export const fallo = <T = never>(error: string): Resultado<T> => ({ ok: false, error });
