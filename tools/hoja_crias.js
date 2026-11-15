// hoja_crias.js — hoja de contacto de 8 crías de una línea con el sintetizador puro (sin navegador). Uso: node tools/hoja_crias.js <linea> [semilla]
// Fila de arriba: los padres silvestres y 3 crías normales; el resto mezcla linajes y fuerza mutaciones para verlas. Escribe docs/hoja_crias_<linea>.png. Salida de UNA línea: «OK …» o «FALLA: motivo».
const fs = require('fs'), path = require('path'), zlib = require('zlib');
let G; try { G = require('./_cargar.js')(); } catch (e) { console.log('FALLA: ' + e.message); process.exit(1); }
const K = G.crianza, fam = process.argv[2], sem = process.argv[3] || 'hoja', F = fam && K.ficha(fam);
if (!F) { console.log('FALLA: no hay ficha de cría para «' + fam + '» (datos/crias/<linea>.json)'); process.exit(1); }
const err = K.validarFicha(F); if (err.length) { console.log('FALLA: ' + err[0]); process.exit(1); }
// 8 crías: se cruzan generaciones para que aparezcan mezclas; cada gen recorre sus alelos y las 3 últimas llevan mutación
const gs = F.genes, crias = [];
for (let i = 0; i < 8; i++) { const genes = {}, r = K.azar(K.hash(sem + '|' + fam + '|' + i)); gs.forEach((g, k) => { const norm = g.alelos.filter((a) => !a.mut), mut = g.alelos.filter((a) => a.mut); genes[g.id] = norm[(i + k * 3 + ((r() * 2) | 0)) % norm.length].id; if (i >= 5 && mut.length && (i - 5) % gs.length === k % 3) genes[g.id] = mut[(r() * mut.length) | 0].id; }); crias.push(genes); }
const E = 6, VIS = [['down', 0], ['left', 0], ['up', 0], ['right', 1]], m0 = K.matriz(fam, 'down', 0, crias[0]), cw = m0.w * E, ch = m0.h * E, W = VIS.length * cw + 8, H = 8 * (ch + 4) + 4, buf = Buffer.alloc(W * H * 4);
const fondo = [0xea, 0xd7, 0xae]; for (let i = 0; i < W * H; i++) { buf[i * 4] = fondo[0]; buf[i * 4 + 1] = fondo[1]; buf[i * 4 + 2] = fondo[2]; buf[i * 4 + 3] = 255; }
crias.forEach((genes, n) => VIS.forEach(([dir, f], v) => { const m = K.matriz(fam, dir, f, genes), ox = 4 + v * cw, oy = 4 + n * (ch + 4);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const c = m.px[y][x]; if (!c) continue; const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); for (let b2 = 0; b2 < E; b2++) for (let a = 0; a < E; a++) { const o = ((oy + y * E + b2) * W + ox + x * E + a) * 4; buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; } } }));
const crc = (b) => { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; };
const trozo = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6; const raw = Buffer.alloc((W * 4 + 1) * H); for (let y = 0; y < H; y++) buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
const sal = path.join(__dirname, '..', 'docs', 'hoja_crias_' + fam + '.png'); fs.writeFileSync(sal, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ih), trozo('IDAT', zlib.deflateSync(raw)), trozo('IEND', Buffer.alloc(0))]));
console.log('OK docs/hoja_crias_' + fam + '.png · 8 crías: ' + crias.map((g) => Object.values(g).join('+')).join(' | '));
