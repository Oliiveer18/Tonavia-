// entrenadores.js — FÁBRICA DE ENTRENADORES (v2.332). Dibuja, con las mismas reglas que Oli y Lali (rejilla de letras, contorno oscuro, rampas de 3 tonos con sombra violeta,
// 4 vistas × 3 pasos), a cada entrenador NPC con un diseño propio: complexión + peinado + ropa + complemento + paleta, elegidos con su ambición y una semilla fija.
// PURO y determinista (sin Math.random): el mismo entrenador se ve igual en todos los dispositivos. Solo dibujo: no toca el estado de la partida.
// API: G.entrenadores.disenar(a) → diseño · .rejillas(d) → { down, side, back, pal } · .sprite(a) → id de sprite (lo registra en G.NAMES) · .PIEZAS (catálogo)
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  // ── color: rampas luz/base/sombra (la sombra vira a violeta, la luz a crema: como Oli y Lali) ──
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  const luz = (c, t) => mix(c, '#fff4d6', t === undefined ? 0.3 : t), osc = (c, t) => mix(c, '#2a1b50', t === undefined ? 0.4 : t);
  // ── catálogo ──
  const PIELES = ['#f6d3b3', '#efc09a', '#d9a273', '#c28a5e', '#a56b44', '#7d4a2e'];
  const PELOS = ['#2b2230', '#4a3426', '#7a4a2b', '#b9803a', '#e8c46a', '#a8322f', '#e8e4ea'];
  const PELOS_RAROS = ['#8e5bc4', '#3fb5b0', '#4d7fd6', '#d9788a', '#5dae5a', '#f09a3e'];
  const FAMILIAS = {   // paletas diseñadas a mano por ambición: t = prenda principal, r = ribete/camisa, n = pantalón, x = complemento
    campeon: [{ t: '#c8372f', r: '#f2c94c', n: '#2f2f45', x: '#f2c94c' }, { t: '#2d4fa8', r: '#e8e4ea', n: '#252a45', x: '#d94a3f' }, { t: '#2a2740', r: '#d94a3f', n: '#3b3555', x: '#f7d54a' }],
    coleccionista: [{ t: '#3d8446', r: '#e8c46a', n: '#5b4636', x: '#c48b52' }, { t: '#2a8187', r: '#f7e9cb', n: '#4a3b5c', x: '#8f5c33' }, { t: '#8a5a33', r: '#5dae5a', n: '#33405a', x: '#c99a3e' }],
    explorador: [{ t: '#b27a45', r: '#3fb5b0', n: '#4a4258', x: '#3d8446' }, { t: '#6f8a4a', r: '#e8c46a', n: '#5a4535', x: '#c48b52' }, { t: '#4d7fd6', r: '#f7e9cb', n: '#3b3a52', x: '#f09a3e' }],
    criador: [{ t: '#e8a0b4', r: '#fff4d6', n: '#6b5a8a', x: '#f09a3e' }, { t: '#f2d88a', r: '#5dae5a', n: '#7a5a6a', x: '#d9788a' }, { t: '#a6d4c8', r: '#e47a9a', n: '#5b6a8a', x: '#c99a3e' }],
    mercader: [{ t: '#8e5bc4', r: '#f7d54a', n: '#3b2f55', x: '#d9a23e' }, { t: '#a8322f', r: '#e8c46a', n: '#4a3040', x: '#7a4a2b' }, { t: '#35559a', r: '#f09a3e', n: '#2f3550', x: '#e8c46a' }],
  };
  const ROPA_DE = { campeon: ['chaleco', 'abrigo'], coleccionista: ['mono', 'camiseta'], explorador: ['capa', 'abrigo'], criador: ['tunica', 'camiseta'], mercader: ['abrigo', 'chaleco'] };
  const COMP_DE = { campeon: ['cinta', 'bufanda'], coleccionista: ['mochila', 'red'], explorador: ['sombrero', 'mochila'], criador: ['cesto', 'gorro'], mercader: ['bolsa', 'sombrero'] };
  const EXTRAS = ['gafas', 'bufanda', 'cinta', 'botas', 'ninguno'];
  const PIEZAS = {
    cuerpo: ['esbelta', 'media', 'robusta', 'menuda'], pelo: ['corto', 'flequillo', 'melena', 'coleta', 'trenzas', 'mono', 'rizos', 'capucha'],
    ropa: ['camiseta', 'abrigo', 'chaleco', 'capa', 'mono', 'tunica'], comp: ['gafas', 'cinta', 'gorro', 'sombrero', 'bufanda', 'mochila', 'red', 'cesto', 'bolsa', 'botas'], ojos: ['normal', 'grande', 'rasgado'],
  };
  const CUERPOS = { esbelta: { half: 3, tr: 4, lr: 4 }, media: { half: 4, tr: 5, lr: 3 }, robusta: { half: 5, tr: 5, lr: 2 }, menuda: { half: 4, tr: 4, lr: 2 } };
  // ── hash determinista ──
  const mez = (x) => { x = Math.imul(x ^ (x >>> 16), 0x7feb352d); x = Math.imul(x ^ (x >>> 15), 0x846ca68b); return (x ^ (x >>> 16)) >>> 0; };
  // ── el DISEÑO de un entrenador (a: { i, asp, amb }): ambición → ropa/complemento/paleta; semilla → complexión, peinado, ojos, piel, pelo y un rasgo llamativo ──
  function disenar(a) {
    const amb = FAMILIAS[a.amb] ? a.amb : 'campeon', H = (k) => mez(((a.asp | 0) * 7919 + (a.i | 0) * 104729 + k * 15485863) | 0) / 4294967296, pick = (arr, k) => arr[Math.floor(H(k) * arr.length) % arr.length];
    const d = { amb, cuerpo: pick(PIEZAS.cuerpo, 1), pelo: pick(PIEZAS.pelo, 2), ojos: pick(PIEZAS.ojos, 3), ropa: pick(ROPA_DE[amb], 4), comp: [pick(COMP_DE[amb], 5)], pal: pick(FAMILIAS[amb], 6), piel: pick(PIELES, 7), colPelo: H(8) < 0.22 ? pick(PELOS_RAROS, 9) : pick(PELOS, 9) };
    const ex = pick(EXTRAS, 10); if (ex !== 'ninguno' && d.comp.indexOf(ex) < 0 && !(ex === 'cinta' && (d.comp[0] === 'sombrero' || d.comp[0] === 'gorro')) && !(ex === 'bufanda' && d.ropa === 'capa')) d.comp.push(ex);
    const sombrero = d.comp.indexOf('sombrero') >= 0 || d.comp.indexOf('gorro') >= 0;
    if (d.pelo === 'capucha' && !(d.ropa === 'capa' || d.ropa === 'abrigo')) d.pelo = 'corto';
    if (d.pelo === 'capucha' && sombrero) d.comp = d.comp.filter((c) => c !== 'sombrero' && c !== 'gorro');
    if (sombrero && (d.pelo === 'mono' || d.pelo === 'rizos')) d.pelo = 'flequillo';
    return d;
  }
  // ── rejillas: cada una es un array de filas de caracteres. Letras: a contorno · b/c/d piel (base/sombra/luz) · k rubor/boca · e ojo · w brillo del ojo · h/i/j pelo (base/luz/sombra) ·
  //    t/u/v prenda · r/s ribete · n/o pantalón · f/g calzado · x/y/z complemento · m metal ──
  const mk = (W, Hh) => { const g = []; for (let y = 0; y < Hh; y++) g.push(new Array(W).fill('.')); return g; };
  const put = (g, x, y, ch) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch; };
  const span = (g, y, x0, x1, ch) => { for (let x = x0; x <= x1; x++) put(g, x, y, ch); };
  const rect = (g, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) span(g, y, x0, x1, ch); };
  function contorno(g) {
    const W = g[0].length, Hh = g.length, o = g.map((r) => r.slice());
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.' && ((x > 0 && g[y][x - 1] !== '.') || (x < W - 1 && g[y][x + 1] !== '.') || (y > 0 && g[y - 1][x] !== '.') || (y < Hh - 1 && g[y + 1][x] !== '.'))) o[y][x] = 'a';
    return o;
  }
  const tiene = (d, c) => d.comp.indexOf(c) >= 0;
  const relleno = (d) => { const C = CUERPOS[d.cuerpo], tr = C.tr, sombrero = tiene(d, 'sombrero') || tiene(d, 'gorro'); let P = 0; if (d.pelo === 'mono') P = 2; else if (d.pelo === 'rizos' || tiene(d, 'gorro')) P = 1; if (sombrero && tiene(d, 'gorro')) P = 1;
    return { C, tr, P, lr: Math.max(1, Math.min(C.lr, 23 - P - 15 - tr)) }; };
  // cabeza (frontal): cráneo, cara, ojos y rubor
  const HS = { 1: [5, 10], 2: [3, 12], 3: [3, 12], 4: [2, 13], 5: [2, 13], 6: [2, 13], 7: [2, 13], 8: [2, 13], 9: [3, 12], 10: [5, 10] };
  function pelo(g, d, Y, vista) {   // peinado frontal (vista 'f') o trasero (vista 'b': todo el cráneo es pelo)
    const s = d.pelo, hc = (x, y, ch) => { const r = HS[y]; if (r && x >= r[0] && x <= r[1]) put(g, x, Y(y), ch || 'h'); }, fillH = (y, x0, x1, ch) => { for (let x = x0; x <= x1; x++) hc(x, y, ch); };
    if (vista === 'b') { for (let y = 1; y <= 9; y++) fillH(y, 2, 13, 'h'); fillH(10, 5, 10, 'h'); span(g, Y(2), 4, 6, 'i'); put(g, 4, Y(3), 'i'); span(g, Y(3), 10, 11, 'i'); put(g, 7, Y(4), 'j'); put(g, 8, Y(5), 'j'); put(g, 7, Y(6), 'j'); span(g, Y(9), 3, 12, 'j'); put(g, 2, Y(8), 'j'); put(g, 13, Y(8), 'j'); span(g, Y(8), 3, 4, 'j'); span(g, Y(8), 11, 12, 'j');
      if (s === 'melena') { for (let y = 10; y <= 14; y++) { span(g, Y(y), 3, 12, 'h'); put(g, 4 + (y % 2), Y(y), 'j'); put(g, 9 + (y % 2), Y(y), 'i'); } span(g, Y(15), 4, 11, 'j'); }
      if (s === 'coleta') { rect(g, 6, Y(10), 9, Y(15), 'h'); span(g, Y(10), 6, 9, 'r'); put(g, 7, Y(12), 'i'); put(g, 8, Y(14), 'j'); }
      if (s === 'trenzas') { for (let y = 8; y <= 14; y++) { span(g, Y(y), 3, 4, y % 2 ? 'h' : 'j'); span(g, Y(y), 11, 12, y % 2 ? 'h' : 'j'); } span(g, Y(15), 3, 4, 'r'); span(g, Y(15), 11, 12, 'r'); }
      if (s === 'mono') { rect(g, 6, Y(-1), 9, Y(0), 'h'); put(g, 7, Y(-1), 'i'); put(g, 8, Y(0), 'j'); }
      if (s === 'rizos') { span(g, Y(0), 4, 11, 'h'); for (let y = 1; y <= 8; y++) { put(g, 1, Y(y), 'h'); put(g, 14, Y(y), 'h'); } span(g, Y(1), 2, 13, 'h'); }
      if (s === 'capucha') { for (let y = 1; y <= 10; y++) { const r = HS[y]; span(g, Y(y), r[0], r[1], 't'); } span(g, Y(9), 4, 11, 'v'); put(g, 7, Y(5), 'v'); put(g, 8, Y(6), 'v'); }
      return; }
    // frontal
    if (s === 'capucha') { for (let y = 1; y <= 3; y++) fillH(y, HS[y][0], HS[y][1], 't'); for (let y = 4; y <= 9; y++) { fillH(y, 2, 3, 't'); fillH(y, 12, 13, 't'); put(g, 4, Y(y), 'v'); put(g, 11, Y(y), 'v'); } fillH(4, 4, 11, 'v'); fillH(4, 5, 10, 'h'); put(g, 7, Y(2), 'u'); put(g, 8, Y(2), 'u'); return; }
    for (let y = 1; y <= 3; y++) fillH(y, HS[y][0], HS[y][1], 'h');
    fillH(4, 2, 13, 'h');
    if (s === 'corto') { fillH(5, 2, 3, 'h'); fillH(5, 12, 13, 'h'); fillH(6, 2, 2, 'h'); fillH(6, 13, 13, 'h'); fillH(7, 2, 2, 'h'); fillH(7, 13, 13, 'h'); fillH(5, 6, 6, 'j'); fillH(5, 9, 9, 'j'); }
    else if (s === 'flequillo') { fillH(5, 2, 6, 'h'); fillH(5, 11, 13, 'h'); fillH(6, 2, 4, 'h'); fillH(6, 12, 13, 'h'); fillH(7, 2, 3, 'h'); fillH(7, 13, 13, 'h'); fillH(8, 2, 2, 'h'); fillH(6, 2, 3, 'j'); fillH(5, 5, 6, 'j'); }
    else if (s === 'melena' || s === 'trenzas') { for (let y = 5; y <= 9; y++) { fillH(y, 2, 3, 'h'); fillH(y, 12, 13, 'h'); } fillH(5, 4, 5, 'h'); fillH(5, 10, 11, 'h'); fillH(5, 6, 6, 'j'); fillH(5, 9, 9, 'j'); }
    else if (s === 'coleta') { fillH(5, 2, 4, 'h'); fillH(5, 11, 13, 'h'); fillH(6, 2, 2, 'h'); fillH(6, 13, 13, 'h'); fillH(7, 2, 2, 'h'); fillH(7, 13, 13, 'h'); put(g, 13, Y(3), 'r'); put(g, 13, Y(4), 'r'); }
    else if (s === 'mono') { fillH(5, 2, 3, 'h'); fillH(5, 12, 13, 'h'); fillH(6, 2, 2, 'h'); fillH(6, 13, 13, 'h'); fillH(5, 6, 6, 'j'); fillH(5, 9, 9, 'j'); rect(g, 6, Y(-1), 9, Y(0), 'h'); put(g, 7, Y(-1), 'i'); put(g, 8, Y(0), 'j'); }
    else if (s === 'rizos') { span(g, Y(0), 4, 11, 'h'); span(g, Y(1), 2, 13, 'h'); for (let y = 2; y <= 8; y++) { put(g, 1, Y(y), 'h'); put(g, 14, Y(y), 'h'); } fillH(5, 2, 4, 'h'); fillH(5, 11, 13, 'h'); fillH(6, 2, 3, 'h'); fillH(6, 12, 13, 'h'); fillH(7, 2, 2, 'h'); fillH(7, 13, 13, 'h'); fillH(4, 5, 6, 'j'); fillH(4, 9, 10, 'j'); }
    for (let x = 4; x <= 11; x++) if (x % 3 === 1) put(g, x, Y(2), 'i');   // brillo del pelo
    if (s === 'rizos') for (let x = 4; x <= 12; x += 3) put(g, x, Y(0), 'i');
  }
  function cara(g, d, Y) {
    const o = d.ojos;
    if (o === 'grande') { for (const x0 of [4, 10]) { rect(g, x0, Y(6), x0 + 1, Y(8), 'e'); put(g, x0, Y(6), 'w'); } }
    else if (o === 'rasgado') { for (const x0 of [4, 10]) { span(g, Y(7), x0, x0 + 1, 'e'); put(g, x0 + (x0 < 7 ? 1 : 0), Y(8), 'e'); span(g, Y(6), x0 - (x0 < 7 ? 0 : 0), x0 + 1, 'j'); } }
    else { for (const x0 of [5, 10]) { put(g, x0, Y(6), 'e'); put(g, x0, Y(7), 'e'); put(g, x0 + (x0 < 7 ? 0 : 0), Y(6), 'e'); } put(g, 5, Y(6), 'w'); put(g, 10, Y(6), 'w'); }
    if (o !== 'grande') { span(g, Y(5), 4, 5, 'j'); span(g, Y(5), 10, 11, 'j'); }
    put(g, 3, Y(8), 'k'); put(g, 12, Y(8), 'k'); span(g, Y(9), 7, 8, 'k');
  }
  // ropa y cuerpo (frontal y trasero comparten silueta)
  function cuerpo(g, d, Y, vista, R, pose) {
    const { C, tr, lr } = R, half = C.half, bx0 = 8 - half, bx1 = 7 + half, t0 = 12, t1 = 11 + tr, l0 = 12 + tr, l1 = 11 + tr + lr, ropa = d.ropa, larga = ropa !== 'camiseta';
    const brazoTop = (d.pelo === 'melena' || d.pelo === 'trenzas') && vista === 'f' ? 13 : 13, a1 = t1 + 1, mono = ropa === 'mono', tunica = ropa === 'tunica';
    const pant = mono ? 't' : 'n', pantO = mono ? 'v' : 'o';
    span(g, Y(11), 7, 8, 'c');   // cuello
    // torso
    for (let y = t0; y <= t1; y++) { const a = y === t0 ? bx0 + 1 : bx0, b = y === t0 ? bx1 - 1 : bx1; span(g, Y(y), a, b, 't'); if (y > t0) { put(g, a, Y(y), 'u'); put(g, b, Y(y), 'v'); } }
    // brazos
    for (const lado of [0, 1]) { const x0 = lado ? bx1 + 1 : bx0 - 2, xin = lado ? x0 : x0 + 1, xout = lado ? x0 + 1 : x0;
      if (pose === 'g') { const mang = ropa === 'chaleco' || mono ? 'r' : 't'; span(g, Y(12), x0, x0 + 1, ropa === 'camiseta' ? 'b' : mang); rect(g, x0, Y(10), x0 + 1, Y(11), 'b'); put(g, xin, Y(10), 'c'); put(g, xin, Y(11), 'c'); put(g, xin, Y(12), ropa === 'camiseta' ? 'c' : mang === 'r' ? 's' : 'v'); continue; }
      for (let y = brazoTop; y <= a1; y++) { const mano = y >= a1 - 1, corto = ropa === 'camiseta' && y >= 15;
        const base = mano || corto ? 'b' : (ropa === 'chaleco' || mono ? 'r' : 't'); span(g, Y(y), x0, x0 + 1, base); put(g, xin, Y(y), base === 'b' ? 'c' : base === 'r' ? 's' : 'v'); if (!mano && !corto) put(g, xout, Y(y), base === 'r' ? 'q' : 'u'); }
      if (ropa === 'camiseta') span(g, Y(14), x0, x0 + 1, 'r'); }
    // piernas
    const lx0 = bx0 + 1, lx1 = bx1 - 1;
    for (let y = l0; y <= l1; y++) { span(g, Y(y), lx0, lx1, pant); put(g, lx0, Y(y), mono ? 'u' : 'n'); put(g, 7, Y(y), pantO); put(g, 8, Y(y), pantO); put(g, lx1, Y(y), pantO); }
    const bota = tiene(d, 'botas');
    if (bota) for (let y = l0 + Math.max(0, lr - 2); y <= l1; y++) { span(g, Y(y), lx0, lx1, 'f'); put(g, 7, Y(y), 'g'); put(g, 8, Y(y), 'g'); put(g, lx1, Y(y), 'g'); }
    for (let y = l1 + 1; y <= l1 + 2; y++) { span(g, Y(y), bx0, bx1, y === l1 + 2 ? 'g' : 'f'); put(g, bx0, Y(y), y === l1 + 2 ? 'g' : 'f'); }
    span(g, Y(l1 + 2), 7, 8, '.'); put(g, 7, Y(l1 + 1), 'g'); put(g, 8, Y(l1 + 1), 'g');
    // prenda
    if (ropa === 'camiseta') { span(g, Y(t1), bx0, bx1, 'r'); put(g, 7, Y(t0), 'b'); put(g, 8, Y(t0), 'b'); put(g, 7, Y(t0 + 1), 'u'); put(g, 8, Y(t0 + 1), 'u'); span(g, Y(t0 + 2), bx0 + 1, bx1 - 1, 'u'); put(g, bx1, Y(t0 + 2), 'v'); }
    if (ropa === 'abrigo') {
      for (let y = t0; y <= t1; y++) { put(g, 7, Y(y), 'v'); put(g, 8, Y(y), 'u'); } if (vista === 'f') { for (let y = t0 + 1; y <= t1 - 1; y += 2) put(g, 8, Y(y), 'm'); }
      span(g, Y(t0), 6, 9, 'r'); span(g, Y(t0 + 1), 6, 6, 'r'); span(g, Y(t0 + 1), 9, 9, 'r');
      for (let y = l0; y <= l0 + 1; y++) { span(g, Y(y), bx0 - 1, bx1 + 1, 't'); put(g, bx0 - 1, Y(y), 'u'); put(g, bx1 + 1, Y(y), 'v'); put(g, 7, Y(y), 'v'); put(g, 8, Y(y), 'u'); } span(g, Y(l0 + 1), bx0 - 1, bx1 + 1, 'r'); put(g, 7, Y(l0 + 1), 's'); }
    if (ropa === 'chaleco') {
      rect(g, bx0 + 3, Y(t0 + 1), bx1 - 3, Y(t1), 'r'); span(g, Y(t0), bx0 + 3, bx1 - 3, 'q'); put(g, 7, Y(t0 + 1), 's'); put(g, 8, Y(t0 + 1), 's');
      for (let y = t0 + 1; y <= t1; y++) { put(g, bx0 + 2, Y(y), 'v'); put(g, bx1 - 2, Y(y), 'v'); } span(g, Y(t1), bx0, bx1, 'm'); put(g, 7, Y(t1), 'y'); put(g, 8, Y(t1), 'y'); }
    if (ropa === 'capa') {
      rect(g, bx0 + 3, Y(t0 + 1), bx1 - 3, Y(t1), 'r'); for (let y = t0; y <= t1 + 1; y++) { span(g, Y(y), bx0 - 2, bx0 + 1, 't'); span(g, Y(y), bx1 - 1, bx1 + 2, 't'); put(g, bx0 - 2, Y(y), 'u'); put(g, bx1 + 2, Y(y), 'v'); put(g, bx0 + 1, Y(y), 'v'); put(g, bx1 - 1, Y(y), 'u'); }
      span(g, Y(t0), bx0 - 1, bx1 + 1, 't'); span(g, Y(t0), 6, 9, 'v'); put(g, 7, Y(t0 + 1), 'm'); put(g, 8, Y(t0 + 1), 'm'); put(g, 7, Y(t0 + 1), 'y');
      for (let lado = 0; lado <= 1; lado++) { const x0 = lado ? bx1 + 1 : bx0 - 2; span(g, Y(a1), x0, x0 + 1, 'b'); span(g, Y(a1 + 0), x0, x0 + 1, 'b'); }
      span(g, Y(t1 + 1), bx0 - 2, bx0 + 1, 'v'); span(g, Y(t1 + 1), bx1 - 1, bx1 + 2, 'v'); }
    if (mono) { span(g, Y(t0), bx0 + 1, bx0 + 2, 't'); span(g, Y(t0), bx1 - 2, bx1 - 1, 't'); rect(g, bx0 + 1, Y(t0 + 1), bx1 - 1, Y(t1), 't'); put(g, bx0 + 1, Y(t0 + 1), 'u'); put(g, bx1 - 1, Y(t0 + 1), 'v'); span(g, Y(t0 + 2), bx0 + 3, bx0 + 4, 'v'); put(g, 7, Y(t0 + 2), 'm'); put(g, 8, Y(t0 + 2), 'm'); put(g, bx0 + 1, Y(t0 + 3), 'y'); }
    if (tunica) { for (let y = l0; y <= l0 + 1; y++) { span(g, Y(y), bx0 - 1, bx1 + 1, 't'); put(g, bx0 - 1, Y(y), 'u'); put(g, bx1 + 1, Y(y), 'v'); } span(g, Y(l0 + 1), bx0 - 1, bx1 + 1, 'r'); span(g, Y(t1), bx0, bx1, 'm'); put(g, 7, Y(t1), 'y'); put(g, 8, Y(t1), 'y'); span(g, Y(t0), 6, 9, 'r'); }
    // cuello alto / bufanda
    if (tiene(d, 'bufanda')) { span(g, Y(11), 5, 10, 'x'); span(g, Y(12), 5, 10, 'x'); put(g, 5, Y(12), 'y'); put(g, 6, Y(11), 'y'); put(g, 10, Y(12), 'z'); if (vista === 'f') { rect(g, 10, Y(13), 11, Y(15), 'x'); put(g, 11, Y(13), 'z'); put(g, 11, Y(14), 'z'); put(g, 10, Y(15), 'z'); put(g, 11, Y(15), 'z'); span(g, Y(15), 10, 11, 'z'); } }
  }
  function complementos(g, d, Y, vista, R, Yh) {
    Yh = Yh || Y;
    const { C, tr, lr } = R, half = C.half, bx0 = 8 - half, bx1 = 7 + half, t0 = 12, t1 = 11 + tr;
    if (tiene(d, 'mochila')) { if (vista === 'b') { rect(g, bx0 + 1, Y(t0), bx1 - 1, Y(t1), 'x'); span(g, Y(t0), bx0 + 1, bx1 - 1, 'y'); span(g, Y(t0 + 1), bx0 + 1, bx1 - 1, 'y'); rect(g, 7, Y(t0 + 3), 8, Y(t0 + 3), 'm'); span(g, Y(t1), bx0 + 1, bx1 - 1, 'z'); put(g, bx1 - 1, Y(t0 + 2), 'z'); put(g, bx1 - 1, Y(t0 + 3), 'z'); } else { for (let y = t0; y <= t1; y++) { put(g, bx0 + 1, Y(y), 'x'); put(g, bx1 - 1, Y(y), 'x'); } put(g, bx0 + 1, Y(t0 + 1), 'y'); put(g, bx1 - 1, Y(t1), 'z'); } }
    if (tiene(d, 'bolsa')) { if (vista === 'f') { for (let k = 0; k < tr - 1; k++) put(g, bx0 + k + 1, Y(t0 + k), 'x'); rect(g, bx1 - 1, Y(t1 - 1), bx1 + 1, Y(t1 + 1), 'x'); span(g, Y(t1 - 1), bx1 - 1, bx1 + 1, 'y'); put(g, bx1, Y(t1), 'm'); put(g, bx1 + 1, Y(t1 + 1), 'z'); put(g, bx1, Y(t1 + 1), 'z'); } else { rect(g, bx0, Y(t1 - 1), bx0 + 2, Y(t1 + 1), 'x'); span(g, Y(t1 - 1), bx0, bx0 + 2, 'y'); put(g, bx0 + 2, Y(t1 + 1), 'z'); put(g, bx0 + 1, Y(t1 + 1), 'z'); } }
    if (tiene(d, 'cesto')) { if (vista === 'f') { rect(g, 5, Y(t1 - 1), 10, Y(t1 + 2), 'x'); span(g, Y(t1 - 1), 5, 10, 'y'); for (let x = 5; x <= 10; x++) if (x % 2) put(g, x, Y(t1 + 1), 'z'); put(g, 5, Y(t1 + 2), 'z'); put(g, 10, Y(t1 + 2), 'z'); span(g, Y(t1 - 2), 6, 9, 'z'); span(g, Y(t1 - 3), 7, 8, 'z'); put(g, 7, Y(t1 - 3), 'y'); } else { rect(g, bx0 - 1, Y(t1 - 1), bx0 + 1, Y(t1 + 1), 'x'); span(g, Y(t1 - 1), bx0 - 1, bx0 + 1, 'y'); } }
    if (tiene(d, 'red')) { const xx = vista === 'f' ? bx0 - 2 : bx1 + 2; for (let y = 5; y <= t1 + 1; y++) put(g, xx, Y(y), 'z'); span(g, Y(4), xx - 1, xx + 1, 'x'); span(g, Y(3), xx - 1, xx + 1, 'y'); put(g, xx - 1, Y(5), 'x'); put(g, xx + 1, Y(5), 'x'); }
    if (tiene(d, 'cinta')) { span(g, Yh(3), 2, 13, 'x'); span(g, Yh(3), 4, 5, 'y'); if (vista === 'f') { put(g, 14, Yh(3), 'x'); put(g, 14, Yh(4), 'z'); put(g, 14, Yh(5), 'z'); put(g, 13, Yh(4), 'z'); } else { put(g, 14, Yh(3), 'x'); put(g, 14, Yh(4), 'z'); put(g, 1, Yh(3), 'x'); } }
    if (tiene(d, 'gafas') && vista === 'f') { span(g, Yh(5), 3, 12, 'm'); rect(g, 4, Yh(5), 6, Yh(8), 'm'); rect(g, 9, Yh(5), 11, Yh(8), 'm'); rect(g, 5, Yh(6), 5, Yh(7), 'b'); rect(g, 10, Yh(6), 10, Yh(7), 'b'); put(g, 5, Yh(6), 'e'); put(g, 5, Yh(7), 'e'); put(g, 10, Yh(6), 'e'); put(g, 10, Yh(7), 'e'); span(g, Yh(8), 4, 6, 'm'); span(g, Yh(8), 9, 11, 'm'); put(g, 7, Yh(5), 'm'); put(g, 8, Yh(5), 'm'); }
    if (tiene(d, 'gorro')) { for (let y = 1; y <= 3; y++) span(g, Yh(y), HS[y][0], HS[y][1], 'x'); span(g, Yh(3), 2, 13, 'z'); put(g, 4, Yh(2), 'y'); put(g, 5, Yh(2), 'y'); put(g, 7, Yh(1), 'y'); rect(g, 7, Yh(0), 8, Yh(0), 'y'); put(g, 7, Yh(0), 'y'); put(g, 8, Yh(0), 'z'); span(g, Yh(2), 6, 9, 'z'); if (vista === 'f') { span(g, Yh(4), 2, 13, 'h'); } }
    if (tiene(d, 'sombrero')) { for (let y = 1; y <= 2; y++) span(g, Yh(y), 4, 11, 'x'); span(g, Yh(2), 4, 11, 'z'); span(g, Yh(3), 1, 14, 'x'); span(g, Yh(3), 1, 3, 'y'); put(g, 7, Yh(1), 'y'); put(g, 8, Yh(1), 'y'); span(g, Yh(4), 3, 12, 'h'); if (vista === 'f') { put(g, 2, Yh(4), '.'); put(g, 13, Yh(4), '.'); } }
  }
  function frente(d, vista, pose) {
    const R = relleno(d), P = R.P, Hh = P + 15 + R.tr + R.lr, g = mk(16, Hh), Y = (y) => y + P, Yh = pose === 'p' ? (y) => y + P + 1 : Y;   // pose 'p' (derrota): la cabeza cae una fila; 'g' (victoria): puños arriba
    cuerpo(g, d, Y, vista, R, pose);
    for (let y = 1; y <= 10; y++) { const r = HS[y]; span(g, Yh(y), r[0], r[1], 'b'); if (y >= 4 && y <= 9) put(g, r[1], Yh(y), 'c'); } span(g, Yh(10), 8, 10, 'c');
    if (vista === 'f') { cara(g, d, Yh); if (pose) { const o = d.ojos; for (const x0 of o === 'normal' ? [5, 10] : [4, 10]) { rect(g, x0, Yh(6), x0 + 1, Yh(8), 'b'); } if (pose === 'g') { for (const x0 of [4, 10]) { put(g, x0, Yh(7), 'e'); put(g, x0 + 1, Yh(6), 'e'); put(g, x0 + 2, Yh(7), 'e'); } span(g, Yh(9), 7, 8, 'e'); put(g, 7, Yh(10), 'k'); put(g, 8, Yh(10), 'k'); } else { for (const x0 of [4, 10]) span(g, Yh(7), x0, x0 + 1, 'e'); put(g, 5, Yh(8), 'w'); put(g, 10, Yh(8), 'w'); span(g, Yh(10), 7, 8, 'k'); span(g, Yh(9), 7, 8, 'b'); } } }
    pelo(g, d, Yh, vista); complementos(g, d, Y, vista, R, Yh);
    return contorno(g);
  }
  // ── perfil (mira a la derecha; la izquierda es el espejo) ──
  const HSS = { 1: [4, 9], 2: [2, 10], 3: [2, 10], 4: [1, 10], 5: [1, 10], 6: [1, 10], 7: [1, 10], 8: [1, 10], 9: [2, 10], 10: [3, 8] };
  function perfil(d) {
    const R = relleno(d), { C, tr } = R, P = R.P, Hh = P + 15 + tr + R.lr, g = mk(13, Hh), Y = (y) => y + P, ropa = d.ropa, s = d.pelo;
    const hc = (x, y, ch) => { const r = HSS[y]; if (r && x >= r[0] && x <= r[1]) put(g, x, Y(y), ch || 'h'); }, fh = (y, x0, x1, ch) => { for (let x = x0; x <= x1; x++) hc(x, y, ch); };
    for (let y = 1; y <= 10; y++) { const r = HSS[y]; span(g, Y(y), r[0], r[1], 'b'); if (y >= 4) put(g, r[0] + 3, Y(y), 'b'); } put(g, 11, Y(7), 'b'); span(g, Y(10), 5, 8, 'c');
    put(g, 8, Y(6), 'e'); put(g, 8, Y(7), 'e'); put(g, 8, Y(6), d.ojos === 'grande' ? 'w' : 'e'); if (d.ojos === 'grande') { put(g, 9, Y(6), 'e'); put(g, 9, Y(7), 'e'); put(g, 8, Y(8), 'e'); put(g, 9, Y(8), 'e'); } if (d.ojos === 'rasgado') { span(g, Y(5), 7, 9, 'j'); } put(g, 7, Y(8), 'k'); put(g, 9, Y(9), 'k'); put(g, 5, Y(7), 'c');
    const ws = Math.min(6, 4 + (C.half - 3)), tx0 = Math.round(5.5 - ws / 2), tx1 = tx0 + ws - 1, t0 = 12, t1 = 11 + tr, l0 = 12 + tr, l1 = 11 + tr + R.lr;
    span(g, Y(11), 5, 7, 'c');
    for (let y = t0; y <= t1; y++) { span(g, Y(y), y === t0 ? tx0 + 1 : tx0, tx1, 't'); put(g, tx0, Y(y), 'v'); put(g, tx1, Y(y), 'u'); }
    const mono = ropa === 'mono', pant = mono ? 't' : 'n', pantO = mono ? 'v' : 'o';
    for (let y = l0; y <= l1; y++) { span(g, Y(y), tx0 + 1, tx1 - 1, pant); put(g, tx0 + 1, Y(y), pantO); }
    if (tiene(d, 'botas')) for (let y = l0 + Math.max(0, R.lr - 2); y <= l1; y++) { span(g, Y(y), tx0 + 1, tx1 - 1, 'f'); put(g, tx0 + 1, Y(y), 'g'); }
    for (let y = l1 + 1; y <= l1 + 2; y++) { span(g, Y(y), tx0 + 1, tx1 + 2, y === l1 + 2 ? 'g' : 'f'); } put(g, tx1 + 2, Y(l1 + 2), 'g');
    const ac = tx0 + Math.floor((ws - 2) / 2), a1 = t1 + 1;
    for (let y = 13; y <= a1; y++) { const mano = y >= a1 - 1, corto = ropa === 'camiseta' && y >= 15, base = mano || corto ? 'b' : (ropa === 'chaleco' || mono ? 'r' : 't'); span(g, Y(y), ac, ac + 1, base === 't' ? 'u' : base); put(g, ac + 1, Y(y), base === 'b' ? 'c' : base === 'r' ? 's' : 'v'); }
    if (ropa === 'camiseta') { span(g, Y(14), ac, ac + 1, 'r'); span(g, Y(t1), tx0, tx1, 'r'); }
    if (ropa === 'abrigo') { span(g, Y(t0), tx0 + 1, tx1, 'r'); for (let y = l0; y <= l0 + 1; y++) { span(g, Y(y), tx0 - 1, tx1 + 1, 't'); put(g, tx0 - 1, Y(y), 'u'); put(g, tx1 + 1, Y(y), 'v'); } span(g, Y(l0 + 1), tx0 - 1, tx1 + 1, 'r'); }
    if (ropa === 'chaleco') { span(g, Y(t0), tx0 + 1, tx1, 'q'); span(g, Y(t1), tx0, tx1, 'm'); put(g, ac, Y(t0 + 1), 'r'); }
    if (ropa === 'capa') { for (let y = t0; y <= t1 + 1; y++) { span(g, Y(y), tx0 - 2, tx0 + 1, 't'); put(g, tx0 - 2, Y(y), 'u'); put(g, tx0 + 1, Y(y), 'v'); } span(g, Y(t0), tx0 - 1, tx1, 't'); put(g, tx1, Y(t0 + 1), 'm'); span(g, Y(t1 + 1), tx0 - 2, tx0 + 1, 'v'); }
    if (mono) { span(g, Y(t0), tx1 - 1, tx1, 't'); span(g, Y(t0 + 2), tx1 - 2, tx1, 't'); put(g, tx1, Y(t0 + 2), 'm'); }
    if (ropa === 'tunica') { for (let y = l0; y <= l0 + 1; y++) { span(g, Y(y), tx0 - 1, tx1 + 1, 't'); put(g, tx0 - 1, Y(y), 'u'); put(g, tx1 + 1, Y(y), 'v'); } span(g, Y(l0 + 1), tx0 - 1, tx1 + 1, 'r'); span(g, Y(t1), tx0, tx1, 'm'); }
    if (tiene(d, 'bufanda')) { span(g, Y(11), 4, 8, 'x'); span(g, Y(12), 4, 8, 'x'); put(g, 5, Y(11), 'y'); put(g, 4, Y(12), 'z'); rect(g, 3, Y(13), 4, Y(15), 'x'); put(g, 3, Y(15), 'z'); put(g, 4, Y(15), 'z'); }
    if (tiene(d, 'mochila')) { rect(g, tx0 - 2, Y(t0), tx0 + 1, Y(t1), 'x'); rect(g, tx0 - 2, Y(t0), tx0 + 1, Y(t0 + 1), 'y'); span(g, Y(t1), tx0 - 2, tx0 + 1, 'z'); put(g, tx0 - 2, Y(t0 + 3), 'm'); put(g, tx0 + 1, Y(t0 + 2), 'z'); }
    if (tiene(d, 'bolsa')) { rect(g, tx1 - 1, Y(t1 - 1), tx1 + 1, Y(t1 + 1), 'x'); span(g, Y(t1 - 1), tx1 - 1, tx1 + 1, 'y'); put(g, tx1, Y(t1 + 1), 'z'); put(g, tx1 + 1, Y(t1 + 1), 'z'); }
    if (tiene(d, 'cesto')) { rect(g, tx1, Y(t1 - 1), tx1 + 2, Y(t1 + 2), 'x'); span(g, Y(t1 - 1), tx1, tx1 + 2, 'y'); put(g, tx1 + 1, Y(t1 + 1), 'z'); put(g, tx1, Y(t1 + 2), 'z'); put(g, tx1 + 2, Y(t1 + 2), 'z'); span(g, Y(t1 - 2), tx1, tx1 + 2, 'z'); }
    if (tiene(d, 'red')) { const xx = tx1 + 2; for (let y = 5; y <= t1 + 1; y++) put(g, xx, Y(y), 'z'); span(g, Y(4), xx - 1, xx + 1, 'x'); span(g, Y(3), xx - 1, xx + 1, 'y'); }
    // peinado de perfil
    if (s === 'capucha') { for (let y = 1; y <= 3; y++) fh(y, HSS[y][0], HSS[y][1], 't'); for (let y = 4; y <= 9; y++) fh(y, 1, 5, 't'); fh(4, 6, 9, 'v'); fh(4, 6, 8, 'h'); for (let y = 5; y <= 9; y++) put(g, 6, Y(y), 'v'); for (let y = 10; y <= 12; y++) span(g, Y(y), 3, 8, 't'); put(g, 4, Y(2), 'u'); put(g, 5, Y(2), 'u'); }
    else {
      for (let y = 1; y <= 3; y++) fh(y, HSS[y][0], HSS[y][1], 'h'); fh(4, 1, 8, 'h'); fh(4, 9, 10, 'h');
      if (s === 'flequillo') { fh(5, 1, 8, 'h'); fh(5, 6, 8, 'j'); fh(6, 1, 4, 'h'); fh(7, 1, 4, 'h'); fh(8, 1, 3, 'h'); }
      else if (s === 'melena') { for (let y = 5; y <= 9; y++) fh(y, 1, 4, 'h'); for (let y = 10; y <= 14; y++) { span(g, Y(y), 1, 5, 'h'); put(g, 2 + (y % 2), Y(y), 'j'); } span(g, Y(15), 2, 5, 'j'); fh(5, 5, 7, 'h'); }
      else if (s === 'trenzas') { for (let y = 5; y <= 8; y++) fh(y, 1, 4, 'h'); for (let y = 8; y <= 14; y++) span(g, Y(y), 2, 3, y % 2 ? 'h' : 'j'); span(g, Y(15), 2, 3, 'r'); }
      else { for (let y = 5; y <= 8; y++) fh(y, 1, 4, 'h'); fh(5, 5, 6, 'h'); fh(4, 6, 6, 'j'); }
      if (s === 'coleta') { span(g, Y(3), 0, 1, 'r'); rect(g, 0, Y(4), 1, Y(10), 'h'); put(g, 0, Y(5), 'j'); put(g, 1, Y(8), 'j'); put(g, 0, Y(4), 'i'); }
      if (s === 'mono') { rect(g, 2, Y(-1), 5, Y(0), 'h'); put(g, 3, Y(-1), 'i'); put(g, 5, Y(0), 'j'); }
      if (s === 'rizos') { span(g, Y(0), 3, 9, 'h'); span(g, Y(1), 1, 10, 'h'); for (let y = 2; y <= 8; y++) { put(g, 0, Y(y), 'h'); } fh(5, 1, 6, 'h'); put(g, 9, Y(0), 'i'); put(g, 4, Y(0), 'i'); }
      for (let x = 3; x <= 9; x += 3) hc(x, 2, 'i');
    }
    if (tiene(d, 'cinta')) { span(g, Y(3), 1, 10, 'x'); span(g, Y(3), 7, 8, 'y'); put(g, 0, Y(3), 'x'); put(g, 0, Y(4), 'z'); }
    if (tiene(d, 'gafas')) { rect(g, 7, Y(5), 10, Y(8), 'm'); put(g, 8, Y(6), 'e'); put(g, 8, Y(7), 'e'); span(g, Y(5), 4, 7, 'm'); put(g, 9, Y(6), 'b'); put(g, 9, Y(7), 'b'); }
    if (tiene(d, 'gorro')) { for (let y = 1; y <= 3; y++) span(g, Y(y), HSS[y][0], HSS[y][1], 'x'); span(g, Y(3), 1, 10, 'z'); put(g, 4, Y(2), 'y'); put(g, 5, Y(2), 'y'); rect(g, 5, Y(0), 6, Y(0), 'y'); put(g, 6, Y(0), 'z'); span(g, Y(4), 1, 5, 'h'); }
    if (tiene(d, 'sombrero')) { for (let y = 1; y <= 2; y++) span(g, Y(y), 3, 8, 'x'); span(g, Y(2), 3, 8, 'z'); span(g, Y(3), 0, 12, 'x'); span(g, Y(3), 0, 2, 'y'); put(g, 5, Y(1), 'y'); span(g, Y(4), 1, 4, 'h'); }
    return contorno(g);
  }
  // ── paleta final de un diseño: cada material con luz / base / sombra ──
  function paleta(d) {
    const p = d.pal, pel = d.colPelo, sk = d.piel, T = [p.t, luz(p.t), osc(p.t)], Rr = [p.r, luz(p.r), osc(p.r)], N = [p.n, luz(p.n, 0.18), osc(p.n, 0.45)], X = [p.x, luz(p.x), osc(p.x)];
    const calz = d.amb === 'explorador' ? '#6b4226' : d.amb === 'mercader' ? '#3b2630' : d.amb === 'criador' ? '#8a5a4a' : '#4a3426';
    return { a: '#2a1b30', b: sk, c: mix(sk, '#8a3f56', 0.34), d: luz(sk, 0.45), k: mix(sk, '#e0607a', 0.5), e: '#241c26', w: '#ffffff', h: pel, i: luz(pel, 0.38), j: osc(pel, 0.4), t: T[0], u: T[1], v: T[2], r: Rr[0], q: Rr[1], s: Rr[2], n: N[0], o: N[2], f: calz, g: osc(calz, 0.4), x: X[0], y: X[1], z: X[2], m: '#d9c89a' };
  }
  function rejillas(d) {
    const down = frente(d, 'f'), back = frente(d, 'b'), side = perfil(d), pal = paleta(d);
    return { down: down.map((r) => r.join('')), side: side.map((r) => r.join('')), back, pal, feet: 2 };
  }
  // ── registro en el juego: crea los sprites <id>_<vista>_<paso> (4 vistas × 3 pasos) y los asocia a G.NAMES ──
  function sprite(a) {
    const id = 'ag' + (a.i | 0) + '_' + (a.asp | 0); if (G.NAMES && G.NAMES[id]) return id; if (!G.NAMES) return 'oli';
    if (!G.defChar) return 'oli';
    const d = disenar(a), r = rejillas(d); G.defChar(id, { pal: r.pal, feet: r.feet, down: r.down, side: r.side, back: () => r.back, swapL: {} }); G.NAMES[id] = id;
    ['g', 'p'].forEach((po) => { const q = frente(d, 'f', po).map((f) => f.join('')); G.defChar(id + '_' + po, { pal: r.pal, feet: r.feet, down: q, side: q, back: () => frente(d, 'f', po), swapL: {} }); G.NAMES[id + '_' + po] = id + '_' + po; }); (G.diseno = G.diseno || {})[id] = d; return id;
  }
  G.entrenadores = { disenar, rejillas, pose: (d, po) => frente(d, 'f', po).map((f) => f.join('')), sprite, paleta, PIEZAS, FAMILIAS, PIELES, PELOS, PELOS_RAROS };
})(typeof window !== 'undefined' ? window : globalThis);
