// Genera los SVG propios de CuboClub (logo isométrico + ilustración del hero).
const fs = require('fs');
const out = process.argv[2];
const r = (n) => +n.toFixed(4);
function cara(colores, gap = 0.04) {
  let s = `<rect x="0" y="0" width="1" height="1" rx="0.06" fill="#17162b"/>`;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const c = Array.isArray(colores) ? colores[j * 3 + i] : colores;
    s += `<rect x="${r(i / 3 + gap)}" y="${r(j / 3 + gap)}" width="${r(1 / 3 - 2 * gap)}" height="${r(1 / 3 - 2 * gap)}" rx="0.045" fill="${c}"/>`;
  }
  return s;
}
const k = 0.8660254;
function cubo(cx, cy, s, sup, izq, der) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">` +
    `<g transform="matrix(${k},-0.5,${k},0.5,${-k},-0.5)">${cara(sup)}</g>` +
    `<g transform="matrix(${k},0.5,0,1,${-k},-0.5)">${cara(izq)}</g>` +
    `<g transform="matrix(${k},-0.5,0,1,0,0)">${cara(der)}</g></g>`;
}
const N = '#ff7a3d', A = '#f4b92b', T = '#14a394', B = '#fffdf8', Z = '#2b50d6', R = '#e0464f';
// Logo: cara superior crema, izquierda naranja, derecha turquesa
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="CuboClub">` +
  cubo(32, 32, 29, [B, B, B, B, A, B, B, B, B], N, T) + `</svg>`;
fs.writeFileSync(out + '/logo-cuboclub.svg', logo);
fs.writeFileSync(out + '/../favicon.svg', logo);

// Ilustración del hero: cubo grande "mezclado", pirámide, cronómetro y flechas de giro
const mezSup = [B, N, A, B, A, T, Z, B, A];
const mezIzq = [N, N, R, T, N, A, N, Z, N];
const mezDer = [T, Z, T, T, T, N, A, T, T];
function piramide(x, y, l) {
  // triángulo equilátero subdividido en 9 (pyraminx de un lado)
  const h = l * k;
  const p = (a, b) => [x + a * l / 3 + b * l / 6, y + h - b * h / 3];
  const cols = [A, A, Z, A, A, A, R, A, A];
  let s = `<polygon points="${x - 6},${y + h + 4} ${x + l + 6},${y + h + 4} ${x + l / 2},${y - 7}" fill="#17162b" stroke="#17162b" stroke-linejoin="round" stroke-width="4"/>`;
  let n = 0;
  for (let fila = 0; fila < 3; fila++) {
    for (let i = 0; i < 3 - fila; i++) {
      const [ax, ay] = p(i, fila), [bx, by] = p(i + 1, fila), [cx2, cy2] = p(i, fila + 1);
      s += `<polygon points="${r(ax + 3)},${r(ay - 2)} ${r(bx - 3)},${r(by - 2)} ${r(cx2)},${r(cy2 + 3.5)}" fill="${cols[n++ % 9]}" stroke-linejoin="round"/>`;
      if (i < 2 - fila) {
        const [dx, dy] = p(i + 1, fila + 1);
        s += `<polygon points="${r(cx2 + 3)},${r(cy2 + 2)} ${r(dx - 3)},${r(dy + 2)} ${r(bx)},${r(by - 3.5)}" fill="${cols[n++ % 9]}"/>`;
      }
    }
  }
  return s;
}
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 440" role="img" aria-label="Ilustración: cubo mezclado, pirámide y cronómetro">
<defs><pattern id="pp" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#17162b" opacity=".18"/></pattern></defs>
<circle cx="270" cy="220" r="190" fill="url(#pp)"/>
<ellipse cx="250" cy="400" rx="150" ry="18" fill="#17162b" opacity=".12"/>
${cubo(250, 235, 150, mezSup, mezIzq, mezDer)}
<path d="M95 120 A170 170 0 0 1 220 50" fill="none" stroke="#17162b" stroke-width="6" stroke-linecap="round"/>
<path d="M212 34 L232 50 L208 62 Z" fill="#17162b"/>
<path d="M430 300 A170 170 0 0 1 350 385" fill="none" stroke="#17162b" stroke-width="6" stroke-linecap="round"/>
<path d="M362 396 L340 390 L356 372 Z" fill="#17162b"/>
<g transform="translate(18 300) rotate(-8)">${piramide(0, 0, 92)}</g>
<g transform="translate(360 40) rotate(6)">
<rect x="0" y="0" width="148" height="66" rx="14" fill="#17162b"/>
<rect x="8" y="8" width="132" height="50" rx="9" fill="#fffdf8"/>
<text x="74" y="44" text-anchor="middle" font-family="'Bricolage Grotesque', monospace" font-weight="800" font-size="30" fill="#17162b">09.86</text>
<rect x="58" y="-12" width="32" height="12" rx="4" fill="#17162b"/>
<circle cx="18" cy="18" r="4" fill="#e0464f"/>
</g>
</svg>`;
fs.writeFileSync(out + '/ilustracion-hero.svg', hero);

// Ilustración de error / 404: cubo con una pieza fuera
const p404 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" role="img" aria-label="Ilustración: cubo al que le falta una pieza">
<ellipse cx="160" cy="235" rx="100" ry="12" fill="#17162b" opacity=".12"/>
${cubo(150, 135, 92, [B, B, B, B, B, B, B, B, '#17162b'], [N, N, N, N, N, N, N, N, N], [T, T, T, T, T, T, T, T, T])}
${cubo(270, 60, 26, A, N, T)}
<path d="M236 92 q-20 20 -40 22" fill="none" stroke="#17162b" stroke-width="4" stroke-dasharray="6 6" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(out + '/ilustracion-pieza-perdida.svg', p404);

// Candado (acceso denegado): cubo con candado
const candado = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" role="img" aria-label="Ilustración: cubo con candado">
<ellipse cx="160" cy="235" rx="100" ry="12" fill="#17162b" opacity=".12"/>
${cubo(150, 140, 88, B, N, T)}
<g transform="translate(205 110)">
<path d="M22 40 V26 a22 22 0 0 1 44 0 V40" fill="none" stroke="#17162b" stroke-width="10"/>
<rect x="8" y="38" width="72" height="58" rx="10" fill="#f4b92b" stroke="#17162b" stroke-width="5"/>
<circle cx="44" cy="62" r="8" fill="#17162b"/><rect x="40" y="64" width="8" height="18" rx="3" fill="#17162b"/>
</g>
</svg>`;
fs.writeFileSync(out + '/ilustracion-acceso.svg', candado);
