import { Entidad } from './entidad.model';
import { Rol } from './rol.model';

export type MetodoResolucion = 'CFOP' | 'Roux' | 'ZZ' | 'Petrus' | 'Otro';

export const METODOS_RESOLUCION: readonly MetodoResolucion[] = ['CFOP', 'Roux', 'ZZ', 'Petrus', 'Otro'];

/** Colores disponibles para el avatar (pegatinas de la paleta CuboClub). */
export const COLORES_AVATAR: readonly { valor: string; nombre: string }[] = [
  { valor: '#c7421a', nombre: 'Naranja' },
  { valor: '#0b7f73', nombre: 'Turquesa' },
  { valor: '#2b50d6', nombre: 'Azul' },
  { valor: '#c22f3a', nombre: 'Rojo' },
  { valor: '#7a4fc4', nombre: 'Morado' },
  { valor: '#17162b', nombre: 'Tinta' },
];

export interface Usuario extends Entidad {
  nombreUsuario: string;
  correo: string;
  /**
   * Contraseña en texto plano SOLO porque esta semana el frontend simula el
   * backend en memoria. En el backend real se almacena con BCrypt.
   */
  contrasena: string;
  roles: Rol[];
  activo: boolean;
  nombreVisible: string;
  biografia: string;
  ciudad: string;
  cuboFavorito: string;
  metodoPrincipal: MetodoResolucion;
  colorAvatar: string;
  fechaNacimiento: string | null;
  fechaCreacion: Date;
}

/** Vista pública de un usuario (sin contraseña). */
export type UsuarioPublico = Omit<Usuario, 'contrasena'>;
