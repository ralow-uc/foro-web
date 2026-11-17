import { Pipe, PipeTransform } from '@angular/core';

/** Muestra una fecha como "hace 3 días", "hace 5 min", etc. */
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  private readonly formato = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' });

  transform(fecha: Date | string | null | undefined, ahora: Date = new Date()): string {
    if (!fecha) return '';
    const valor = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const segundos = Math.round((valor.getTime() - ahora.getTime()) / 1000);
    const abs = Math.abs(segundos);
    if (abs < 45) return 'recién';
    const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ];
    for (const [unidad, s] of unidades) {
      if (abs >= s) return this.formato.format(Math.round(segundos / s), unidad);
    }
    return 'recién';
  }
}
