import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/*
 * Validaciones de seguridad de contraseñas, reutilizables (ValidatorFn).
 * Se usan en Registro, Recuperar contraseña y Cambiar contraseña (Perfil).
 * Cada error incluye un `mensaje` en español que muestra <app-campo-error>.
 */

export const CONTRASENA_MIN = 8;
export const CONTRASENA_MAX = 20;

const MAYUSCULA = /[A-ZÁÉÍÓÚÜÑ]/;
const MINUSCULA = /[a-záéíóúüñ]/;
const NUMERO = /\d/;
const ESPECIAL = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/;
const ESPACIO = /\s/;

/**
 * Patrón equivalente para el atributo HTML `pattern` (validación nativa del input).
 * Angular lo envuelve en ^...$ automáticamente.
 */
export const PATRON_CONTRASENA_HTML =
  '(?=.*[A-ZÁÉÍÓÚÜÑ])(?=.*[a-záéíóúüñ])(?=.*\\d)(?=.*[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\\s])\\S{8,20}';

/** Definición de una regla: la usan tanto los validadores como la lista visual en vivo. */
export interface ReglaContrasena {
  clave: string;
  descripcion: string;
  cumple: (valor: string, nombreUsuario?: string | null) => boolean;
}

export const REGLAS_CONTRASENA: readonly ReglaContrasena[] = [
  {
    clave: 'contrasenaCorta',
    descripcion: `Al menos ${CONTRASENA_MIN} caracteres`,
    cumple: (v) => v.length >= CONTRASENA_MIN,
  },
  {
    clave: 'contrasenaLarga',
    descripcion: `Máximo ${CONTRASENA_MAX} caracteres`,
    cumple: (v) => v.length > 0 && v.length <= CONTRASENA_MAX,
  },
  { clave: 'sinMayuscula', descripcion: 'Una letra mayúscula', cumple: (v) => MAYUSCULA.test(v) },
  { clave: 'sinMinuscula', descripcion: 'Una letra minúscula', cumple: (v) => MINUSCULA.test(v) },
  { clave: 'sinNumero', descripcion: 'Un número', cumple: (v) => NUMERO.test(v) },
  {
    clave: 'sinEspecial',
    descripcion: 'Un carácter especial (!@#$%*…)',
    cumple: (v) => ESPECIAL.test(v),
  },
  { clave: 'conEspacios', descripcion: 'Sin espacios', cumple: (v) => v.length > 0 && !ESPACIO.test(v) },
  {
    clave: 'contieneUsuario',
    descripcion: 'No contiene tu nombre de usuario',
    cumple: (v, usuario) => v.length > 0 && !contieneUsuario(v, usuario),
  },
];

function contieneUsuario(valor: string, usuario?: string | null): boolean {
  const u = (usuario ?? '').trim().toLowerCase();
  return u.length >= 3 && valor.toLowerCase().includes(u);
}

/** Crea un ValidatorFn que ignora valores vacíos (de eso se encarga `required`). */
function crearValidador(clave: string, mensaje: string, esValido: (valor: string) => boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = (control.value ?? '') as string;
    if (valor === '') return null;
    return esValido(valor) ? null : { [clave]: { mensaje } };
  };
}

export const ContrasenaValidators = {
  /** Largo mínimo (por defecto 8). */
  longitudMinima(min = CONTRASENA_MIN): ValidatorFn {
    return crearValidador('contrasenaCorta', `Debe tener al menos ${min} caracteres.`, (v) => v.length >= min);
  },

  /** Largo máximo (por defecto 20). */
  longitudMaxima(max = CONTRASENA_MAX): ValidatorFn {
    return crearValidador('contrasenaLarga', `No puede superar los ${max} caracteres.`, (v) => v.length <= max);
  },

  mayuscula(): ValidatorFn {
    return crearValidador('sinMayuscula', 'Debe incluir al menos una letra mayúscula.', (v) => MAYUSCULA.test(v));
  },

  minuscula(): ValidatorFn {
    return crearValidador('sinMinuscula', 'Debe incluir al menos una letra minúscula.', (v) => MINUSCULA.test(v));
  },

  numero(): ValidatorFn {
    return crearValidador('sinNumero', 'Debe incluir al menos un número.', (v) => NUMERO.test(v));
  },

  caracterEspecial(): ValidatorFn {
    return crearValidador('sinEspecial', 'Debe incluir al menos un carácter especial (!@#$%*…).', (v) =>
      ESPECIAL.test(v),
    );
  },

  sinEspacios(): ValidatorFn {
    return crearValidador('conEspacios', 'No puede contener espacios.', (v) => !ESPACIO.test(v));
  },

  /**
   * La contraseña no puede contener el nombre de usuario.
   * Recibe una función para leer el usuario actual (puede cambiar mientras se escribe).
   */
  sinNombreUsuario(obtenerUsuario: () => string | null | undefined): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = (control.value ?? '') as string;
      if (valor === '') return null;
      return contieneUsuario(valor, obtenerUsuario())
        ? { contieneUsuario: { mensaje: 'No puede contener tu nombre de usuario.' } }
        : null;
    };
  },
};

/** Conjunto completo de validadores de seguridad para una contraseña nueva. */
export function validadoresContrasena(obtenerUsuario: () => string | null | undefined = () => null): ValidatorFn[] {
  return [
    ContrasenaValidators.longitudMinima(),
    ContrasenaValidators.longitudMaxima(),
    ContrasenaValidators.mayuscula(),
    ContrasenaValidators.minuscula(),
    ContrasenaValidators.numero(),
    ContrasenaValidators.caracterEspecial(),
    ContrasenaValidators.sinEspacios(),
    ContrasenaValidators.sinNombreUsuario(obtenerUsuario),
  ];
}

export interface Fortaleza {
  /** 0 a 4 */
  nivel: number;
  etiqueta: string;
  porcentaje: number;
  clase: string;
}

/** Calcula la fortaleza de una contraseña según las reglas cumplidas y su largo. */
export function calcularFortaleza(valor: string, usuario?: string | null): Fortaleza {
  if (!valor) return { nivel: 0, etiqueta: 'Sin contraseña', porcentaje: 0, clase: 'bg-secondary' };
  const cumplidas = REGLAS_CONTRASENA.filter((r) => r.cumple(valor, usuario)).length;
  const total = REGLAS_CONTRASENA.length;
  let nivel = cumplidas <= 3 ? 1 : cumplidas < total ? 2 : 3;
  if (nivel === 3 && valor.length >= 12) nivel = 4;
  const niveles = [
    { etiqueta: 'Sin contraseña', clase: 'bg-secondary' },
    { etiqueta: 'Débil', clase: 'bg-danger' },
    { etiqueta: 'Media', clase: 'bg-warning' },
    { etiqueta: 'Fuerte', clase: 'bg-success' },
    { etiqueta: 'Muy fuerte', clase: 'bg-success' },
  ];
  return { nivel, porcentaje: nivel * 25, ...niveles[nivel] };
}
