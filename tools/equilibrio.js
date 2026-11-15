// equilibrio.js — TEST DE EQUILIBRIO (paso 1.0 del PLAN_200). Revisa que todas las líneas cumplan las reglas E1-E9, T1-T6 y N1-N10 (las que se pueden medir).
// Uso (desde la carpeta del proyecto):  node tools/equilibrio.js            -> informe corto; sale con código 1 si hay alertas
//                                       node tools/equilibrio.js --cierre   -> además compara el reparto con la meta del hito (solo en cierres de hito)
//                                       node tools/equilibrio.js --detalle  -> muestra también las medidas (silueta, colores, nombres)
// No necesita navegador: usa un lienzo falso que guarda píxeles (como tools/render_sprites.js). No cambia nada del juego.
const path = require('path'), fs = require('fs');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2), CIERRE = args.includes('--cierre'), DETALLE = args.includes('--detalle');
const t0 = Date.now();

// ---------- lienzo falso con píxeles ----------
function hex(s) { const m = /^#([0-9a-f]{6})$/i.exec(s); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : [0, 0, 0]; }
function mkCanvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4); let tx = 0, ty = 0; const st = [];
  const ctx = { fillStyle: '#000', imageSmoothingEnabled: false,
    save() { st.push([tx, ty]); }, restore() { [tx, ty] = st.pop(); }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, ww, hh) { const [r, g, b] = hex(this.fillStyle); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i + tx, Y = y + j + ty; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const o = (Y * w + X) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; } },
    getImageData(x, y, ww, hh) { const out = new Uint8ClampedArray(ww * hh * 4); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const o = ((y + j) * w + x + i) * 4, p = (j * ww + i) * 4; for (let k = 0; k < 4; k++) out[p + k] = data[o + k]; } return { data: out }; },
    putImageData(id) { data.set(id.data); }, createImageData(ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4) }; },
    drawImage() {}, clearRect() {}, measureText: () => ({ width: 40 }) };
  return { width: w, height: h, getContext: () => ctx, _data: data };
}
const noop = () => {};
global.window = global;
global.document = { getElementById: () => ({ getContext: () => mkCanvas(10, 10).getContext(), hidden: false }), querySelectorAll: () => [] };
global.document.createElement = () => { const c = mkCanvas(1, 1); return new Proxy(c, { set(t, p, v) { t[p] = v; if (p === 'height' || p === 'width') { const nc = mkCanvas(t.width || 1, t.height || 1); t._data = nc._data; t.getContext = nc.getContext; } return true; } }); };
global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800; global.setTimeout = () => 0; global.clearTimeout = noop;
require(path.join(root, 'src/orden.json')).datos.forEach((f) => require(path.join(root, f))); // lista única: src/orden.json
const G = window.G;
// Dónde puede aparecer cada línea (v2.17, paso 1.3b): elementos con zona de aparición y guaridas fijas, leídos de maps/*.json
const ZONAS = new Set(), GUARIDAS = new Set();
fs.readdirSync(path.join(root, 'maps')).filter((f) => /\.json$/.test(f)).forEach((f) => { const j = JSON.parse(fs.readFileSync(path.join(root, 'maps', f), 'utf8')); (j.zonas || []).forEach((z) => ZONAS.add(z.elemento)); (j.npcs || []).filter((n) => n.tipo === 'guarida').forEach((n) => GUARIDAS.add(n.id)); });
{ const sin = G.formasSinDibujo(); if (sin.length) { console.log('E9 · formas sin dibujo (en src/lineas.js, sin def2): ' + sin.join(', ')); process.exit(1); } }

// ---------- utilidades ----------
const alertas = []; const avisa = (regla, msg) => alertas.push(regla + ' · ' + msg);
const info = []; const nota = (s) => { if (DETALLE) info.push(s); };
const ids = Object.keys(G.CREATURES), C = (id) => G.CREATURES[id];
const lev = (a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const prefijo = (xs) => { let p = xs[0].toLowerCase(); xs.forEach((x) => { x = x.toLowerCase(); while (!x.startsWith(p)) p = p.slice(0, -1); }); return p; };

// ---------- líneas (agrupadas por familia, ordenadas por fase) ----------
const familias = {};
ids.forEach((id) => { const f = C(id).family; (familias[f] = familias[f] || []).push(id); });
const lineas = Object.keys(familias).map((f) => { const formas = familias[f].sort((a, b) => C(a).stage - C(b).stage); return { fam: f, formas, base: C(formas[0]), n: formas.length }; });
const N = lineas.length, FORMAS = ids.length;

// ---------- E1 · rareza y fases · E9 · datos completos ----------
const RANGO = { comun: [1, 2], rara: [2, 3], epica: [3, 3], legendaria: [1, 1] };
const fichasSrc = ['FICHAS_IDENTIDAD.md', 'BLOQUE_2.md', 'PLAN_200.md'].map((f) => { try { return fs.readFileSync(path.join(root, 'docs', f), 'utf8').toLowerCase(); } catch (e) { return ''; } }).join('\n');
lineas.forEach((L) => {
  const b = L.base, r = RANGO[b.rarity];
  if (!r) return avisa('E1', b.name + ': rareza desconocida');
  if (L.n < r[0] || L.n > r[1]) avisa('E1', b.name + ': ' + L.n + ' fases no caben en ' + b.rarity + ' (' + r.join('-') + ')');
  if (b.phases !== L.n) avisa('E9', b.name + ': phases=' + b.phases + ' pero hay ' + L.n + ' formas');
  const plan = G.LINE_PLAN[L.fam]; if (!plan || plan.length !== L.n) avisa('E9', b.name + ': G.LINE_PLAN no tiene ' + L.n + ' fases');
  L.formas.forEach((id, i) => {
    const d = C(id);
    if (d.stage !== i + 1) avisa('E9', d.name + ': fase ' + d.stage + ' fuera de orden');
    if ((i < L.n - 1) !== (d.evolvesTo === L.formas[i + 1] || false) && !(i < L.n - 1 && d.evolvesTo === L.formas[i + 1])) avisa('E9', d.name + ': evolvesTo no apunta a la fase siguiente');
    if (i === L.n - 1 && d.evolvesTo) avisa('E9', d.name + ': la última fase no puede evolucionar');
    if (typeof d.weight !== 'number' || !(d.weight > 0)) avisa('E9', d.name + ': sin peso');
    if (!d.elements || !d.elements.length || !d.elements.every((e) => G.ELEMENTS[e])) avisa('E9', d.name + ': elementos no válidos');
    if (!d.name || !d.line || !d.by) avisa('E9', d.name + ': falta nombre, frase o autor');
    if (!G.TRAITS[id] && !G.TRAITS[L.fam]) avisa('E9', d.name + ': sin rasgos en G.TRAITS');
    let s = null; try { s = G.creatureSprite(id, 'down', 0); } catch (e) { /* se avisa abajo */ }
    if (!s || !s.c) avisa('E9', d.name + ': no tiene dibujo');
  });
  if (!(b.rarity === 'legendaria' ? GUARIDAS.has(b.family) : b.elements.some((e) => ZONAS.has(e)))) avisa('E9', b.name + ': no puede aparecer en ningún mapa (' + (b.rarity === 'legendaria' ? 'una legendaria necesita su guarida: npc «guarida» con id «' + b.family + '» en maps/' : 'ningún mapa de maps/ tiene una zona de aparición de ' + b.elements.join(' o ')) + ')');
  if (!fichasSrc.includes(b.name.toLowerCase())) avisa('E8', b.name + ': no se encuentra su ficha en docs/');
});

// ---------- E2/E3 · reparto por elemento y rareza (casillas del PLAN_200, sección 3) ----------
const ELS = ['hoja', 'fuego', 'agua', 'electrico', 'aire', 'roca', 'sombra'];
const META = { // C1 C2 R2 R3 E L X
  hoja: [5, 7, 4, 4, 5, 2, 1], fuego: [5, 7, 4, 4, 5, 2, 1], agua: [5, 7, 5, 3, 5, 2, 1], electrico: [5, 7, 4, 4, 5, 2, 1],
  aire: [6, 6, 5, 3, 5, 2, 1], roca: [5, 7, 4, 4, 5, 2, 1], sombra: [5, 7, 5, 3, 5, 2, 1] };
const CEL = ['C1', 'C2', 'R2', 'R3', 'E', 'L', 'X'];
const casilla = (L) => { const r = L.base.rarity, n = L.n; return r === 'comun' ? (n === 1 ? 0 : 1) : r === 'rara' ? (n === 2 ? 2 : 3) : r === 'epica' ? 4 : 5; };
const elemento = (L) => L.base.elements[0];
const hecho = {}; ELS.forEach((e) => { hecho[e] = [0, 0, 0, 0, 0, 0, 0]; });
lineas.forEach((L) => { const e = elemento(L); if (!hecho[e]) return avisa('E2', L.base.name + ': elemento principal desconocido (' + e + ')'); hecho[e][casilla(L)]++; });
// Siempre: ninguna casilla pasa de su meta (las X son libres: una línea de más en una casilla se cuenta en X solo si la meta de esa casilla está llena)
ELS.forEach((e) => { let libres = META[e][6]; for (let k = 0; k < 6; k++) { const sobra = hecho[e][k] - META[e][k]; if (sobra > 0) { if (libres >= sobra) libres -= sobra; else avisa('E3', e + ' ' + CEL[k] + ': ' + hecho[e][k] + ' líneas y la meta es ' + META[e][k]); } } });
const totalMeta = ELS.reduce((s, e) => s + META[e].reduce((a, b) => a + b, 0), 0) + 4;
const dobles = lineas.filter((L) => L.base.elements.length > 1);
if (CIERRE) { // solo en cierres de hito: ±1 respecto al avance proporcional (PLAN_200, secciones 8 y 9)
  const prog = N / 200;
  ELS.forEach((e) => { const meta = META[e].reduce((a, b) => a + b, 0) * prog, real = hecho[e].reduce((a, b) => a + b, 0); if (Math.abs(real - meta) > 1) avisa('E2', e + ': ' + real + ' líneas, lo esperado con ' + N + ' líneas es ' + meta.toFixed(1) + ' (±1)'); });
  for (let k = 0; k < 6; k++) { const meta = ELS.reduce((s, e) => s + META[e][k], 0) * prog, real = ELS.reduce((s, e) => s + hecho[e][k], 0); if (Math.abs(real - meta) > 1) avisa('E3', CEL[k] + ': ' + real + ' líneas, lo esperado con ' + N + ' líneas es ' + meta.toFixed(1) + ' (±1)'); }
  const f = [0, 0, 0]; lineas.forEach((L) => f[L.n - 1]++); [0.25, 0.45, 0.30].forEach((p, i) => { if (Math.abs(f[i] / N - p) > 0.06) avisa('E3', (i + 1) + ' fase(s): ' + Math.round(100 * f[i] / N) + ' % y el objetivo es ' + Math.round(100 * p) + ' % (±6)'); });
}

// ---------- T1-T6 · tamaño y peso ----------
const T3 = { // [rareza, fase]: [ancho mín, máx, alto mín, máx, kg mín, máx]
  'comun1': [12, 20, 12, 20, 0.05, 5], 'comun2': [14, 20, 12, 20, 0.5, 10],
  'rara1': [14, 20, 14, 20, 1, 30], 'rara2': [16, 22, 16, 24, 2, 60], 'rara3': [20, 24, 22, 28, 10, 150],
  'epica1': [16, 22, 14, 22, 3, 20], 'epica2': [20, 28, 20, 24, 5, 60], 'epica3': [24, 28, 26, 30, 8, 150] };
const T2 = { comun: [150, 340], rara: [340, 600], epica: [600, 760], legendaria: [900, 900] };
const PESO_BAJA_OK = ['somnin']; // Somnaris (2 kg) pesa menos que Somnel (3 kg) porque flota (PLAN_200, T5)
lineas.forEach((L) => {
  const r = L.base.rarity;
  L.formas.forEach((id, i) => {
    const d = C(id), [w, h] = G.stageSize(id, d.stage), kg = d.weight;
    if (w % 2 || h % 2) avisa('T1', d.name + ': medida ' + w + '×' + h + ' no es par');
    if (r === 'legendaria') { if (w !== 30 || h !== 30) avisa('T6', d.name + ': la legendaria debe medir 30×30'); }
    else { const t = T3[r + d.stage]; if (!t) avisa('T3', d.name + ': no hay rango para ' + r + ' fase ' + d.stage); else if (w < t[0] || w > t[1] || h < t[2] || h > t[3] || kg < t[4] || kg > t[5]) avisa('T3', d.name + ' (' + r + ', fase ' + d.stage + '): ' + w + '×' + h + ' · ' + kg + ' kg fuera de rango ' + t[0] + '-' + t[1] + '×' + t[2] + '-' + t[3] + ' · ' + t[4] + '-' + t[5] + ' kg'); }
    if (i > 0) { const [pw, ph] = G.stageSize(L.formas[i - 1], i); if (pw === w && ph === h) avisa('T4', d.name + ': mide lo mismo que la fase anterior (' + w + '×' + h + '); hay que justificarlo en la ficha'); if (kg < C(L.formas[i - 1]).weight && !PESO_BAJA_OK.includes(L.fam)) avisa('T5', d.name + ': pesa menos que la fase anterior sin estar en la lista de excepciones'); }
  });
  const u = L.formas[L.n - 1], [w, h] = G.stageSize(u, C(u).stage), a = w * h, t2 = T2[r];
  if (t2 && (a < t2[0] || a > t2[1])) avisa('T2', C(u).name + ': área ' + a + ' px² fuera del rango de ' + r + ' (' + t2[0] + '-' + t2[1] + ')');
});

// ---------- E5/E6 · siluetas y paleta (medidas sobre el sprite de frente, frame 0) ----------
const GRID = 16;
function medida(id) {
  const s = G.creatureSprite(id, 'down', 0), W = s.c.width, H = s.c.height, px = s.c._data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : px[(y * W + x) * 4 + 3]);
  let x0 = W, y0 = H, x1 = -1, y1 = -1; const cont = {}, borde = {};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4; if (!px[o + 3]) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    const k = (px[o] >> 3) + ',' + (px[o + 1] >> 3) + ',' + (px[o + 2] >> 3);
    if (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1)) borde[k] = (borde[k] || 0) + 1; // el contorno: color de los píxeles que tocan el vacío
    cont[k] = (cont[k] || 0) + 1;
  }
  const tinta = Object.keys(borde).sort((a, b) => borde[b] - borde[a])[0];
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, m = new Uint8Array(GRID * GRID);
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { const X = x0 + Math.min(bw - 1, Math.floor((i + 0.5) * bw / GRID)), Y = y0 + Math.min(bh - 1, Math.floor((j + 0.5) * bh / GRID)); m[j * GRID + i] = A(X, Y) > 0 ? 1 : 0; }
  const top = Object.keys(cont).filter((k) => k !== tinta).sort((a, b) => cont[b] - cont[a])[0] || tinta, col = top.split(',').map((v) => v * 8 + 4);
  return { m, ar: bw / bh, col };
}
const dSil = (a, b) => { let x = 0; for (let k = 0; k < GRID * GRID; k++) if (a.m[k] !== b.m[k]) x++; return x / (GRID * GRID); };
const dAsp = (a, b) => Math.abs(Math.log(a.ar / b.ar));
const dCol = (a, b) => Math.hypot(a.col[0] - b.col[0], a.col[1] - b.col[1], a.col[2] - b.col[2]);
const MED = {}; ids.forEach((id) => { try { MED[id] = medida(id); } catch (e) { /* ya avisado en E9 */ } });
const E5_SIL = 0.04, E5_ASP = 0.04; // alarma de clon: una fase solo se avisa si su silueta cambia < 4 % de la rejilla Y su proporción < 4 % (las más cercanas hoy, aprobadas: Aguacarax 5 %, Aguacaryn 6 %, Perlorix 9 %)
const E6_SIL = 0.06, E6_COL = 40;   // alarma de clon: dos líneas distintas no pueden tener a la vez silueta casi igual (< 6 %) y color dominante casi igual (< 40)
lineas.forEach((L) => L.formas.forEach((id, i) => {
  if (!i || !MED[id] || !MED[L.formas[i - 1]]) return;
  const a = MED[L.formas[i - 1]], b = MED[id], s = dSil(a, b), p = dAsp(a, b);
  nota('E5 ' + C(L.formas[i - 1]).name + ' → ' + C(id).name + ': silueta ' + (100 * s).toFixed(0) + ' % · proporción ' + (100 * p).toFixed(0) + ' %');
  if (s < E5_SIL && p < E5_ASP) avisa('E5', C(id).name + ' se parece demasiado a ' + C(L.formas[i - 1]).name + ' (silueta ' + (100 * s).toFixed(0) + ' %, proporción ' + (100 * p).toFixed(0) + ' %)');
}));
let minSil = 9, minPar = '';
for (let i = 0; i < N; i++) for (let k = i + 1; k < N; k++) {
  const a = MED[lineas[i].formas[0]], b = MED[lineas[k].formas[0]]; if (!a || !b) continue;
  const s = dSil(a, b), c = dCol(a, b); if (s < minSil) { minSil = s; minPar = lineas[i].base.name + '/' + lineas[k].base.name; }
  if (s < E6_SIL && c < E6_COL) avisa('E6', lineas[i].base.name + ' y ' + lineas[k].base.name + ' comparten silueta (' + (100 * s).toFixed(0) + ' %) y color dominante');
}
nota('E6 silueta más parecida entre fases 1: ' + minPar + ' (' + (100 * minSil).toFixed(0) + ' %)');

// ---------- E7 · nombres (N1, N4, N5, N6, N7). N2, N3, N8, N9 y N10 se revisan en la ficha ----------
const nombres = lineas.map((L) => ({ L, xs: L.formas.map((id) => C(id).name) }));
nombres.forEach(({ L, xs }) => {
  xs.forEach((x) => { if (!/^[A-Z][a-z]+$/.test(x)) avisa('N4', x + ': solo letras a-z sin tildes ni guiones y empieza en mayúscula'); if (x.length < 4 || x.length > 9) avisa('N5', x + ': tiene ' + x.length + ' letras (deben ser 4-9)'); });
  if (xs.length > 1 && prefijo(xs).length < 3) avisa('N1', xs.join(' → ') + ': no comparten 3 letras iniciales');
});
let minDist = 99, minPar2 = '';
for (let i = 0; i < N; i++) for (let k = i + 1; k < N; k++) {
  if (nombres[i].xs[0].slice(0, 4).toLowerCase() === nombres[k].xs[0].slice(0, 4).toLowerCase()) avisa('N6', nombres[i].xs[0] + ' y ' + nombres[k].xs[0] + ' empiezan por las mismas 4 letras');
  nombres[i].xs.forEach((a) => nombres[k].xs.forEach((b) => { const d = lev(a, b); if (d < minDist) { minDist = d; minPar2 = a + '/' + b; } if (d < 2) avisa('N6', a + ' y ' + b + ' se parecen demasiado (distancia ' + d + ')'); }));
}
nota('N6 distancia mínima entre nombres de líneas distintas: ' + minDist + ' (' + minPar2 + ')');
const fin = {}; nombres.forEach(({ xs }) => { const f = xs[0].slice(-2).toLowerCase(); fin[f] = (fin[f] || 0) + 1; });
Object.keys(fin).forEach((f) => { if (fin[f] > 30) avisa('N7', 'el final «-' + f + '» está en ' + fin[f] + ' líneas de fase 1 (máximo 30 de 200 = 15 %)'); });
const suf = {}; nombres.forEach(({ xs }) => xs.slice(1).forEach((x) => { const s = x.slice(prefijo([xs[0], x]).length).toLowerCase(); suf[s] = (suf[s] || 0) + 1; }));
Object.keys(suf).forEach((s) => { if (suf[s] > 12) avisa('N7', 'el sufijo de evolución «-' + s + '» está en ' + suf[s] + ' formas (máximo 12)'); });
nota('N7 finales de fase 1: ' + Object.keys(fin).map((f) => '-' + f + ' ' + fin[f]).join(', '));

// ---------- E7b · elementos dobles ----------
if (dobles.length > 40) avisa('E7b', dobles.length + ' líneas con dos elementos (máximo 40)');
const parejas = {}; dobles.forEach((L) => { const k = L.base.elements.slice().sort().join('+'); parejas[k] = (parejas[k] || 0) + 1; });
Object.keys(parejas).forEach((k) => { if (parejas[k] > 3) avisa('E7b', 'la pareja ' + k + ' está en ' + parejas[k] + ' líneas (máximo 3)'); });

// ---------- informe ----------
const ms = Date.now() - t0;
const f3 = [0, 0, 0]; lineas.forEach((L) => f3[L.n - 1]++);
console.log('TEST DE EQUILIBRIO · ' + N + ' líneas · ' + FORMAS + ' formas · meta 200 líneas (' + totalMeta + ' casillas en la tabla)');
console.log('Fases: 1 fase ' + f3[0] + ' · 2 fases ' + f3[1] + ' · 3 fases ' + f3[2] + ' (' + f3.map((x) => Math.round(100 * x / N)).join(' / ') + ' %; objetivo 25 / 45 / 30)');
console.log('Elementos: ' + ELS.map((e) => e + ' ' + hecho[e].reduce((a, b) => a + b, 0)).join(' · ') + ' · dobles ' + dobles.length);
if (DETALLE) { console.log('Casillas (hecho/meta): ' + ELS.map((e) => e + ' ' + CEL.slice(0, 6).map((c, k) => c + ' ' + hecho[e][k] + '/' + META[e][k]).join(' ')).join('\n  ')); info.forEach((s) => console.log('  · ' + s)); }
if (alertas.length) { console.log('\n' + alertas.length + ' ALERTAS:'); alertas.forEach((a) => console.log(' - ' + a)); }
else console.log('\n0 alertas' + (CIERRE ? ' (modo cierre de hito)' : '') + ' · reglas: E1 E2 E3 E5 E6 E7b E8 E9 · T1-T6 · N1 N4 N5 N6 N7');
console.log('(' + ms + ' ms; N2, N3, N8, N9 y N10 se revisan a mano en la ficha de cada línea)');
process.exit(alertas.length ? 1 : 0);
