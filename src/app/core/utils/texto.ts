/** Quita tildes, pasa a minúsculas y recorta espacios. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Genera un slug URL-amigable: "Métodos y algoritmos" → "metodos-y-algoritmos". */
export function generarSlug(texto: string): string {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Extracto de un texto largo para listados. */
export function extracto(texto: string, maximo = 90): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length <= maximo ? limpio : `${limpio.slice(0, maximo - 1).trimEnd()}…`;
}
