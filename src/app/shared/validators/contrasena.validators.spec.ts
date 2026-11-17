import { FormControl, FormGroup } from '@angular/forms';
import { ContrasenaValidators, REGLAS_CONTRASENA, calcularFortaleza, validadoresContrasena } from './contrasena.validators';
import { coincideCon, edadMinima, sinSoloEspacios } from './formulario.validators';

describe('Validadores de contraseña', () => {
  const validar = (valor: string, usuario = 'feliks') =>
    new FormControl(valor, validadoresContrasena(() => usuario)).errors ?? {};

  it('acepta una contraseña que cumple todas las reglas', () => {
    expect(validar('Cubo12345*')).toEqual({});
  });

  it('ignora el valor vacío (eso lo valida required)', () => {
    expect(validar('')).toEqual({});
  });

  it('exige mínimo 8 caracteres', () => {
    expect(validar('Cu1*a')).toHaveProperty('contrasenaCorta');
    expect(ContrasenaValidators.longitudMinima(8)(new FormControl('Abcdef1*'))).toBeNull();
  });

  it('exige máximo 20 caracteres', () => {
    expect(validar('Cubo12345*Cubo12345*X')).toHaveProperty('contrasenaLarga');
  });

  it('exige una mayúscula', () => {
    expect(validar('cubo12345*')).toHaveProperty('sinMayuscula');
  });

  it('exige una minúscula', () => {
    expect(validar('CUBO12345*')).toHaveProperty('sinMinuscula');
  });

  it('exige un número', () => {
    expect(validar('CuboCubo*')).toHaveProperty('sinNumero');
  });

  it('exige un carácter especial', () => {
    expect(validar('Cubo123456')).toHaveProperty('sinEspecial');
  });

  it('rechaza espacios', () => {
    expect(validar('Cubo 12345*')).toHaveProperty('conEspacios');
  });

  it('rechaza contraseñas que contienen el nombre de usuario (sin importar mayúsculas)', () => {
    expect(validar('Feliks123*', 'feliks')).toHaveProperty('contieneUsuario');
    expect(validar('Cubo12345*', 'feliks')).not.toHaveProperty('contieneUsuario');
  });

  it('cada error trae un mensaje en español', () => {
    const errores = validar('abc');
    for (const clave of Object.keys(errores)) {
      expect(typeof errores[clave].mensaje).toBe('string');
    }
  });

  it('las reglas visuales coinciden con los validadores', () => {
    const valor = 'cubo 1';
    const incumplidas = REGLAS_CONTRASENA.filter((r) => !r.cumple(valor, 'yiheng')).map((r) => r.clave);
    expect(incumplidas.sort()).toEqual(Object.keys(validar(valor, 'yiheng')).sort());
  });

  it('calcula la fortaleza', () => {
    expect(calcularFortaleza('').nivel).toBe(0);
    expect(calcularFortaleza('abc').etiqueta).toBe('Débil');
    expect(calcularFortaleza('Cubo12345*').etiqueta).toBe('Fuerte');
    expect(calcularFortaleza('CuboClub2026*!x').etiqueta).toBe('Muy fuerte');
  });
});

describe('Validadores de formulario', () => {
  it('coincideCon detecta confirmaciones distintas', () => {
    const form = new FormGroup({
      contrasena: new FormControl('Cubo12345*'),
      confirmacion: new FormControl('Cubo12345-', [coincideCon('contrasena')]),
    });
    // Al construirse el control aún no tiene padre: se revalida ya dentro del grupo.
    form.controls.confirmacion.updateValueAndValidity();
    expect(form.controls.confirmacion.hasError('noCoincide')).toBe(true);
    form.controls.confirmacion.setValue('Cubo12345*');
    expect(form.controls.confirmacion.valid).toBe(true);
  });

  it('edadMinima exige 13 años y rechaza fechas futuras', () => {
    const hoy = () => new Date('2026-11-17T12:00:00');
    const v = edadMinima(13, hoy);
    expect(v(new FormControl('2013-11-17'))).toBeNull();
    expect(v(new FormControl('2013-11-18'))).toHaveProperty('edadMinima');
    expect(v(new FormControl('2030-01-01'))).toHaveProperty('fechaFutura');
    expect(v(new FormControl(''))).toBeNull();
  });

  it('sinSoloEspacios rechaza texto en blanco', () => {
    expect(sinSoloEspacios()(new FormControl('   '))).toHaveProperty('soloEspacios');
    expect(sinSoloEspacios()(new FormControl(' hola '))).toBeNull();
  });
});
