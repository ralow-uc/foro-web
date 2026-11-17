import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/*
 * Validadores generales de formularios (complementan a los de Angular).
 */

/** El valor debe coincidir con el de otro control hermano (ej. confirmar contraseña). */
export function coincideCon(nombreOtroControl: string, mensaje = 'Las contraseñas no coinciden.'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const otro = control.parent?.get(nombreOtroControl);
    if (!otro || !control.value) return null;
    return control.value === otro.value ? null : { noCoincide: { mensaje } };
  };
}

/** El valor debe ser distinto al de otro control (ej. contraseña nueva ≠ actual). */
export function distintoDe(nombreOtroControl: string, mensaje: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const otro = control.parent?.get(nombreOtroControl);
    if (!otro || !control.value || !otro.value) return null;
    return control.value === otro.value ? { igualAOtro: { mensaje } } : null;
  };
}

/** Rechaza textos formados solo por espacios en blanco. */
export function sinSoloEspacios(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (typeof valor !== 'string' || valor.length === 0) return null;
    return valor.trim().length === 0 ? { soloEspacios: { mensaje: 'No puede contener solo espacios.' } } : null;
  };
}

/** Largo mínimo contando el texto sin espacios al inicio ni al final. */
export function largoMinimoSinEspacios(minimo: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (typeof valor !== 'string' || valor.length === 0) return null;
    return valor.trim().length < minimo
      ? { largoMinimoReal: { mensaje: `Debe tener al menos ${minimo} caracteres (sin contar espacios).` } }
      : null;
  };
}

/** Fecha (yyyy-MM-dd) de alguien con al menos `anios` años cumplidos. Vacío = válido (campo opcional). */
export function edadMinima(anios: number, hoy: () => Date = () => new Date()): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as string | null;
    if (!valor) return null;
    const nacimiento = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime())) return { fechaInvalida: { mensaje: 'Ingresa una fecha válida.' } };
    const actual = hoy();
    if (nacimiento > actual) return { fechaFutura: { mensaje: 'La fecha no puede estar en el futuro.' } };
    if (nacimiento.getFullYear() < 1900) return { fechaInvalida: { mensaje: 'Ingresa un año desde 1900.' } };
    let edad = actual.getFullYear() - nacimiento.getFullYear();
    const m = actual.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && actual.getDate() < nacimiento.getDate())) edad--;
    return edad >= anios ? null : { edadMinima: { mensaje: `Debes tener al menos ${anios} años.`, edad } };
  };
}

/** Al menos un elemento seleccionado en un control cuyo valor es un arreglo (ej. roles). */
export function alMenosUno(mensaje = 'Selecciona al menos una opción.'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as unknown[] | null;
    return Array.isArray(valor) && valor.length > 0 ? null : { alMenosUno: { mensaje } };
  };
}

/** Fecha máxima (yyyy-MM-dd) para el atributo HTML `max` de un input date según edad mínima. */
export function fechaMaximaParaEdad(anios: number, hoy = new Date()): string {
  const f = new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate());
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  const dd = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${mm}-${dd}`;
}
