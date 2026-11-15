// rampas.js — v2.23 (B1, capa 1 del sistema de sombreado, docs/REGLAS_DE_LUZ.md sección 7): rampas de color compartidas.
// G.rampa(color, opciones) devuelve 5 tonos de UN color: s0 sombra profunda · s1 sombra (más fría) · base · l1 luz (más cálida) · l2 brillo.
// Una sola regla de cambio de tono para todo el juego: la luz se acerca al amarillo cálido (52°) y la sombra al violeta/azul frío (275°). Nunca gris ni negro.
// color: '#rrggbb' o [r,g,b]. Con color en hex devuelve hex; con [r,g,b] devuelve [r,g,b] (G.rampa.rgb siempre da arrays, G.rampa.hex siempre da texto).
// opciones.contraste (0.4-1.4, por defecto 1): cuánto se separan los tonos (piel suave 0.6, metal y cristal 1.2). Solo DIBUJO: sin DOM, sin azar.
(function () {
  'use strict';
  const G = window.G;
  const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b); let h = 0, s = 0; const l = (M + m) / 2; if (M !== m) { const d = M - m; s = l > 0.5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; };
  const hsl2rgb = ([h, s, l]) => { h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; };
  const towards = (h, t, a) => { const d = ((t - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), a); }; // acerca el tono h al tono t, como mucho a grados
  const toArr = (c) => (typeof c === 'string' ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c);
  const toHex = (a) => '#' + a.map((v) => (v < 16 ? '0' : '') + v.toString(16)).join('');
  const FRIO = 275, CALIDO = 52;
  const cache = new Map();

  function rgb(color, op) {
    const a = toArr(color), k = op && op.contraste ? op.contraste : 1, key = a.join(',') + '|' + k;
    const hit = cache.get(key); if (hit) return hit;
    const [h, s, l] = rgb2hsl(a), paso = 0.035; // paso mínimo entre tonos: siempre se distinguen (si hay hueco)
    let l1 = Math.min(0.94, l + 0.09 * k + (l < 0.25 ? 0.04 : 0)), l2 = Math.min(0.97, l + 0.20 * k + (l < 0.25 ? 0.06 : 0));
    let s1 = Math.max(0.05, l - 0.10 * k - l * 0.10 * k), s0 = Math.max(0.09, l - 0.20 * k - l * 0.22 * k); // las oscuras bajan menos en valor absoluto
    if (l1 < l + paso && l + paso <= 0.97) l1 = l + paso;
    if (l2 < l1 + paso && l1 + paso <= 0.98) l2 = Math.min(0.98, l1 + paso);
    if (s1 > l - paso && l - paso >= 0.03) s1 = l - paso;
    if (s0 > s1 - paso && s1 - paso >= 0.09) s0 = s1 - paso;
    if (s1 <= s0) s1 = Math.min(l - 0.01, s0 + paso); // v2.23.1: en colores muy oscuros el suelo de s0 (0,09) pasaba por encima de s1; siempre sombra profunda < sombra < base
    const r = {
      s0: hsl2rgb([towards(h, FRIO, 26 * k), Math.min(1, s + 0.05), s0]),
      s1: hsl2rgb([towards(h, FRIO, 14 * k), Math.min(1, s + 0.03), s1]),
      base: a.slice(),
      l1: hsl2rgb([towards(h, CALIDO, 12 * k), Math.min(1, s * 1.04), l1]),
      l2: hsl2rgb([towards(h, CALIDO, 20 * k), s * 0.85, l2]),
    };
    cache.set(key, r); return r;
  }
  function hex(color, op) { const r = rgb(color, op); return { s0: toHex(r.s0), s1: toHex(r.s1), base: toHex(r.base), l1: toHex(r.l1), l2: toHex(r.l2) }; }
  G.rampa = function (color, op) { return typeof color === 'string' ? hex(color, op) : rgb(color, op); };
  G.rampa.rgb = rgb; G.rampa.hex = hex;
  G.color = { rgb2hsl, hsl2rgb, towards }; // ayudantes de color compartidos (sombreado.js los usa)
})();
