// luz.js — v2.23 (B1, capa 3 del sistema de sombreado): vigila las criaturas que usan el volumen calculado (G.LUZ_CRIATURAS en src/luz_criaturas.js).
const path = require('path');
const root = path.resolve(__dirname, '..');
function hex(s) { const m = /^#([0-9a-f]{6})$/i.exec(s); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : [0, 0, 0]; }
function mkCanvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4); let tx = 0, ty = 0; const st = [];
  const ctx = { fillStyle: '#000', imageSmoothingEnabled: false, save() { st.push([tx, ty]); }, restore() { [tx, ty] = st.pop(); }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, ww, hh) { const [r, g, b] = hex(this.fillStyle); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i + tx, Y = y + j + ty; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const o = (Y * w + X) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; } },
    getImageData(x, y, ww, hh) { const out = new Uint8ClampedArray(ww * hh * 4); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const o = ((y + j) * w + x + i) * 4, p = (j * ww + i) * 4; for (let k = 0; k < 4; k++) out[p + k] = data[o + k]; } return { data: out }; },
    putImageData(id) { data.set(id.data); }, createImageData(ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4) }; }, drawImage() {}, clearRect() {}, measureText: () => ({ width: 40 }) };
  return { width: w, height: h, getContext: () => ctx, _data: data };
}
const noop = () => {};
global.window = global; global.document = { getElementById: () => ({ getContext: () => mkCanvas(10, 10).getContext(), hidden: false }), querySelectorAll: () => [] };
global.document.createElement = () => { const c = mkCanvas(1, 1); return new Proxy(c, { set(t, p, v) { t[p] = v; if (p === 'height' || p === 'width') { const nc = mkCanvas(t.width || 1, t.height || 1); t._data = nc._data; t.getContext = nc.getContext; } return true; } }); };
global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800; global.setTimeout = () => 0; global.clearTimeout = noop;
require(path.join(root, 'src/orden.json')).datos.forEach((f) => require(path.join(root, f)));

// Uso: node tools/luz.js [--detalle]   (sale con código 1 si alguna criatura no pasa). Compara, por cada criatura de G.LUZ_CRIATURAS y cada vista (4 direcciones × frames 0-1), el sprite con volumen frente al mismo sin sombreado.
// Comprobaciones: (1) la silueta (alfa) no cambia [excepción declarada: criaturas con `columnas`, de frente y de espaldas, que cambian 1 columna] · (2) máximo de colores por criatura ·
// (3) las rampas están ordenadas: lo que se aclara sube de luminosidad y lo que se oscurece baja · (4) hay más luz arriba-izquierda que abajo-derecha (el centro de lo claro queda arriba-izquierda del de lo oscuro) ·
// (5) sin efecto «almohadilla»: en el borde de arriba-izquierda no hay más sombra que en el de abajo-derecha · (6) se lee a tamaño real: hay contraste entre luz y sombra, sin pasarse.
const G = window.G, DET = process.argv.includes('--detalle');
const MAX_BASE_LIMPIO = +(process.env.MAX_BASE_LIMPIO || 24), MAX_BASE = 24, MAX_FACTOR = 5, MIN_DELTA = 0.05, MAX_DELTA = 0.5; // por VISTA: colores de base ≤ 24 y con luz ≤ 5 × los de base (la rampa da 4 variantes por color + los tonos del contorno). Medido: base 8-22, sombreado de la v2.21 ×3-3,5, volumen ×3-4. La propuesta de ≤ 16 colores no era realista: ya la v2.21 da 31-66 por vista (ver docs/REGLAS_DE_LUZ.md)
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const ids = Object.keys(G.LUZ_CRIATURAS || {}).sort(), fallos = [];
const sprite = (id, dir, f, on) => { G.SOMBREADO.ACTIVO = on; G.SOMBREADO.VOLUMEN = on; G.spriteCacheClear(); const s = G.creatureSprite(id, dir, f); return { w: s.c.width, h: s.c.height, d: Uint8ClampedArray.from(s.c._data) }; };
ids.forEach((id) => {
  const cfg = G.LUZ_CRIATURAS[id]; let maxBase = 0, maxLuz = 0, peorFactor = 0;
  const nCol = (X) => { const S = new Set(); for (let i = 0; i < X.d.length; i += 4) if (X.d[i + 3]) S.add(X.d[i] + ',' + X.d[i + 1] + ',' + X.d[i + 2]); return S.size; };
  let inkMal = 0, lit = 0, sh = 0, dl = 0, ds = 0, rimTL = 0, rimTLd = 0, rimBR = 0, rimBRd = 0, ordenMal = 0, alfaMal = 0, cLit = [0, 0, 0], cSh = [0, 0, 0], vistas = 0;
  ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1].forEach((f) => {
    const A = sprite(id, dir, f, false), B = sprite(id, dir, f, true); vistas++;
    const nA = nCol(A), nB = nCol(B); maxBase = Math.max(maxBase, nA); maxLuz = Math.max(maxLuz, nB); peorFactor = Math.max(peorFactor, nB / nA);
    const excepcion = cfg.columnas && (dir === 'down' || dir === 'up'); // el estirado simétrico cambia 1 columna de la silueta
    for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) {
      const i = (y * A.w + x) * 4;
      if (!excepcion && A.w === B.w && A.d[i + 3] !== B.d[i + 3]) alfaMal++;
      if (excepcion || !A.d[i + 3]) continue;
      const la = lum(A.d[i], A.d[i + 1], A.d[i + 2]), lb = lum(B.d[i], B.d[i + 1], B.d[i + 2]), cambia = A.d[i] !== B.d[i] || A.d[i + 1] !== B.d[i + 1] || A.d[i + 2] !== B.d[i + 2];
      const ink = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= A.w || yy >= A.h) return true; const j = (yy * A.w + xx) * 4; return !A.d[j + 3] || (A.d[j] === 0x2a && A.d[j + 1] === 0x1b && A.d[j + 2] === 0x30); };
      const borde = (dx, dy) => ink(x + dx, y + dy);
      const esInk = A.d[i] === 0x2a && A.d[i + 1] === 0x1b && A.d[i + 2] === 0x30; if (esInk) { if (cfg.limpio && (B.d[i] !== A.d[i] || B.d[i + 1] !== A.d[i + 1] || B.d[i + 2] !== A.d[i + 2])) inkMal++; continue; } // el contorno tiene su propia regla (selectivo)
      const tl = borde(0, -1) || borde(-1, 0), br = borde(0, 1) || borde(1, 0);
      if (tl && !br) { rimTL++; if (lb < la - 0.01) rimTLd++; }
      if (br && !tl) { rimBR++; if (lb < la - 0.01) rimBRd++; }
      if (!cambia) continue;
      if (lb > la) { lit++; cLit[0] += x; cLit[1] += y; dl += lb - la; } else if (lb < la) { sh++; cSh[0] += x; cSh[1] += y; ds += la - lb; } else ordenMal++;
    }
  }));
  const err = [];
  if (alfaMal) err.push('la silueta cambia en ' + alfaMal + ' píxeles');
  if (maxBase > MAX_BASE) err.push('demasiados colores de base en una vista: ' + maxBase + ' (máximo ' + MAX_BASE + ')');
  if (peorFactor > MAX_FACTOR) err.push('el sombreado multiplica los colores ×' + peorFactor.toFixed(1) + ' (máximo ×' + MAX_FACTOR + ')');
  if (ordenMal) err.push(ordenMal + ' píxeles cambiados sin cambiar de luminosidad (rampa desordenada)');
  if (!sh || (!lit && !cfg.limpio)) err.push('falta luz o sombra (luz ' + lit + ', sombra ' + sh + ')'); // limpio (v2.24.1): puede no haber luz (solo base y sombra)
  else if (!lit) { const ps = ds / sh; if (ps < MIN_DELTA) err.push('contraste muy bajo (' + ps.toFixed(3) + ')'); if (ps > MAX_DELTA) err.push('contraste excesivo (' + ps.toFixed(3) + ')'); }
  else {
    const gl = (cLit[0] + cLit[1]) / lit, gs = (cSh[0] + cSh[1]) / sh;
    if (!(gl < gs)) err.push('la luz no queda arriba-izquierda de la sombra (centro luz ' + gl.toFixed(1) + ' · centro sombra ' + gs.toFixed(1) + ')');
    const pl0 = dl / lit, pl = cfg.limpio ? Math.min(pl0, 0.25) : pl0, ps = ds / sh; /* limpio (v2.24.1): la luz es solo un brillo de 1-2 px; su salto no cuenta por encima de 0,25 */ if (pl + ps < MIN_DELTA) err.push('contraste muy bajo (' + (pl + ps).toFixed(3) + ')'); if (pl + ps > MAX_DELTA) err.push('contraste excesivo (' + (pl + ps).toFixed(3) + ')');
  }
  // v2.24.6 (paso 2b, reglas 5, 6 y 2 del estándar), solo con `limpio`: un solo contorno · brillo solo en metal/cristal · colores de base
  if (cfg.limpio) {
    if (inkMal) err.push('el contorno cambia de tono en ' + inkMal + ' píxeles (regla 5: un solo contorno)');
    const brilla = ['metal', 'cristal'].includes(cfg.mat) || (cfg.colores || []).some((r) => ['metal', 'cristal'].includes(r.mat));
    if (lit && !brilla) err.push('hay ' + lit + ' px de brillo en una criatura sin material metal/cristal (regla 2)');
    if (maxBase > MAX_BASE_LIMPIO) err.push('demasiados colores de base: ' + maxBase + ' (máximo ' + MAX_BASE_LIMPIO + ' con limpio, regla 6)');
  }
  const fTL = rimTL ? rimTLd / rimTL : 0, fBR = rimBR ? rimBRd / rimBR : 0;
  if (fTL > fBR) err.push('efecto almohadilla: más sombra en el borde arriba-izquierda (' + (fTL * 100).toFixed(0) + ' %) que abajo-derecha (' + (fBR * 100).toFixed(0) + ' %)');
  if (DET || err.length) console.log((err.length ? 'x ' : 'ok ') + id.padEnd(10) + cfg.mat.padEnd(8) + 'colores por vista: base ' + maxBase + ' → ' + maxLuz + ' (×' + peorFactor.toFixed(1) + ') · luz ' + lit + ' px / sombra ' + sh + ' px · sombra en borde arriba-izq ' + (fTL * 100).toFixed(0) + ' % / abajo-der ' + (fBR * 100).toFixed(0) + ' %' + (cfg.columnas ? ' · estirado simétrico (vistas de frente y espaldas sin comparar silueta)' : ''));
  err.forEach((e) => { fallos.push(id + ': ' + e); console.log('   ' + e); });
});
console.log(fallos.length ? 'AVISO: ' + fallos.length + ' fallo(s) de luz.' : 'TODO BIEN: ' + ids.length + ' criaturas con volumen pasan el test de luz (base ≤ ' + MAX_BASE + ' colores por vista, ≤ ×' + MAX_FACTOR + ' al sombrear).');
process.exitCode = fallos.length ? 1 : 0;
