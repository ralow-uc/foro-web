import { NIVEL_ROL, Rol } from '../models';

/** ¿Tiene alguno de los roles requeridos? */
export function tieneAlgunRol(roles: readonly Rol[], requeridos: readonly Rol[]): boolean {
  return roles.some((r) => requeridos.includes(r));
}

/** MODERADOR o ADMIN: pueden moderar contenido. */
export function puedeModerar(roles: readonly Rol[]): boolean {
  return tieneAlgunRol(roles, ['MODERADOR', 'ADMIN']);
}

export function esAdministrador(roles: readonly Rol[]): boolean {
  return roles.includes('ADMIN');
}

/** Rol de mayor jerarquía (para mostrar la insignia en la navbar). */
export function rolPrincipal(roles: readonly Rol[]): Rol | null {
  if (roles.length === 0) return null;
  return [...roles].sort((a, b) => NIVEL_ROL[b] - NIVEL_ROL[a])[0];
}
