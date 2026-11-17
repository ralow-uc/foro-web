import { Rol } from './rol.model';

/** Sesión activa del navegador (simula el JWT del backend). */
export interface Sesion {
  usuarioId: number;
  nombreUsuario: string;
  roles: Rol[];
  fechaInicio: Date;
}
