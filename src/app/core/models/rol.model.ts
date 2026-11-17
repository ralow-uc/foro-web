/** Roles del sistema: replican los del backend (Spring Security). */
export type Rol = 'USUARIO' | 'MODERADOR' | 'ADMIN';

export const ROLES: readonly Rol[] = ['USUARIO', 'MODERADOR', 'ADMIN'];

/** Etiquetas legibles para la interfaz. */
export const ETIQUETA_ROL: Record<Rol, string> = {
  USUARIO: 'Usuario',
  MODERADOR: 'Moderador',
  ADMIN: 'Administrador',
};

/** Jerarquía: un rol superior hereda los privilegios de los inferiores. */
export const NIVEL_ROL: Record<Rol, number> = { USUARIO: 1, MODERADOR: 2, ADMIN: 3 };
