#!/usr/bin/env node
// componer_mapa.js — COMPOSITOR DE TERRENOS puro y determinista: receta (plantillas/receta_*.json) → maps/<id>.json; valida y responde UNA línea («OK …» / «FALLA: motivo»). Uso: node tools/componer_mapa.js [receta] [--comprobar]
'use strict';
const fs = require('fs'), path = require('path'), raiz = path.join(__dirname, '..');
const SOLIDO = { t: 1, '~': 1, r: 1, l: 1, '#': 1, h: 1, m: 1, x: 1 }, CASILLAS = '.fgt~=srclb#hd_mx'; // igual que src/mapas.js
const hs = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
const cheb = (x, y, r) => Math.max(r.x - x, x - (r.x + r.w - 1), r.y - y, y - (r.y + r.h - 1), 0); // distancia (casillas) de un punto a un rectángulo

function componer(rc) { // receta → mapa (formato 2). Sin azar: todo sale de rc.semilla y de la posición
  const W = rc.ancho, H = rc.alto, sem = rc.semilla | 0, g = Array.from({ length: H }, () => Array(W).fill(rc.base)), objetos = [], solares = [];
  const ruido = (x, y, p, k) => { const gx = Math.floor(x / p), gy = Math.floor(y / p), fx = x / p - gx, fy = y / p - gy, v = (i, j) => (hs(gx + i + k * 7919 + sem * 104729, gy + j) & 1023) / 1023, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), a = v(0, 0), b = v(1, 0); return a + (b - a) * sx + (v(0, 1) + (v(1, 1) - v(0, 1)) * sx - a - (b - a) * sx) * sy; };
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H, cada = (fn) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fn(x, y); };
  const pon = (x, y, c, op) => { if (dentro(x, y) && (!op.solo_sobre || op.solo_sobre.indexOf(g[y][x]) >= 0)) g[y][x] = c; };
  const ocupada = new Set(), libre = (x, y) => dentro(x, y) && !SOLIDO[g[y][x]] && !ocupada.has(x + ',' + y);
  const alcanzables = (desde) => { const v = new Set([desde[0] + ',' + desde[1]]), q = [desde]; for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ',' + (y + dy); if (libre(x + dx, y + dy) && !v.has(k)) { v.add(k); q.push([x + dx, y + dy]); } }); } return v; };
  rc.pasos.forEach((op, n) => {
    if (op.op === 'relleno') cada((x, y) => pon(x, y, op.casilla, op));
    else if (op.op === 'rect' || op.op === 'solar') { for (let y = op.y; y < op.y + op.h; y++) for (let x = op.x; x < op.x + op.w; x++) pon(x, y, op.casilla, op); if (op.op === 'solar') solares.push(op); }
    else if (op.op === 'borde') cada((x, y) => { if (Math.min(x, y, W - 1 - x, H - 1 - y) < Math.max(1, op.grosor + op.rugoso * (ruido(x, y, 4, n) - 0.5) * 2)) pon(x, y, op.casilla, op); });
    else if (op.op === 'mancha') cada((x, y) => { const a = (x - op.centro[0]) / op.radio[0], b = (y - op.centro[1]) / op.radio[1]; if (a * a + b * b < 1 + (op.rugoso || 0) * (ruido(x, y, 3, n) - 0.5) * 2) pon(x, y, op.casilla, op); });
    else if (op.op === 'rio') cada((x, y) => { let d = 1e9; for (let i = 0; i + 1 < op.puntos.length; i++) { const [ax, ay] = op.puntos[i], [bx, by] = op.puntos[i + 1], ux = bx - ax, uy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * ux + (y - ay) * uy) / (ux * ux + uy * uy))); d = Math.min(d, Math.hypot(x - ax - t * ux, y - ay - t * uy)); } if (d < op.ancho / 2 + (op.rugoso || 0) * (ruido(x, y, 3, n) - 0.5)) pon(x, y, op.casilla, op); });
    else if (op.op === 'camino') for (let i = 0; i + 1 < op.puntos.length; i++) { // tramos rectos; estampa un cuadrado de «ancho» y pone puente sobre el fluido
      const [ax, ay] = op.puntos[i], [bx, by] = op.puntos[i + 1]; if (ax !== bx && ay !== by) throw new Error('camino ' + n + ': los tramos deben ser horizontales o verticales');
      const pasos = Math.max(Math.abs(bx - ax), Math.abs(by - ay)), sx = Math.sign(bx - ax), sy = Math.sign(by - ay);
      for (let k = 0; k <= pasos; k++) for (let b = 0; b < op.ancho; b++) for (let a = 0; a < op.ancho; a++) { const x = ax + sx * k + a, y = ay + sy * k + b; if (dentro(x, y)) g[y][x] = op.puente && (g[y][x] === 'l' || g[y][x] === op.puente) ? op.puente : op.casilla; }
    }
    else if (op.op === 'sellar') { const v = alcanzables(rc.anclas[op.desde]); cada((x, y) => { if (libre(x, y) && !v.has(x + ',' + y)) g[y][x] = op.casilla; }); }
    else if (op.op === 'dispersar') { // candidatas ordenadas por un número fijo de su posición; nunca pegadas a caminos, solares, anclas ni a otra pieza
      const cerca = (x, y, c, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dentro(x + dx, y + dy) && c.indexOf(g[y + dy][x + dx]) >= 0) return true; return false; };
      const cand = []; cada((x, y) => { if (op.sobre.indexOf(g[y][x]) >= 0) cand.push([hs(x * 7919 + y, n * 31 + sem), x, y]); }); cand.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
      let puestos = 0;
      for (const [, x, y] of cand) {
        if (puestos >= op.cantidad) break;
        if (cerca(x, y, '=b', 1) || solares.some((s) => cheb(x, y, s) <= 1) || Object.values(rc.anclas).some(([ax, ay]) => Math.max(Math.abs(ax - x), Math.abs(ay - y)) <= 2) || objetos.some((o) => Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) <= 2)) continue;
        if (op.cerca_de && !cerca(x, y, op.cerca_de.casilla, op.cerca_de.max)) continue;
        if (op.lejos_de && cerca(x, y, op.lejos_de.casilla, op.lejos_de.min)) continue;
        if (op.solido) { let ok = true; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!libre(x + dx, y + dy)) ok = false; if (!ok) continue; ocupada.add(x + ',' + y); } // con las 8 vecinas libres nunca corta el paso
        objetos.push({ tipo: op.objeto, x, y }); puestos++;
      }
    } else throw new Error('paso ' + n + ': operación desconocida «' + op.op + '»');
  });
  return { formato: 2, id: rc.id, nombre: rc.nombre, region: rc.region, ancho: W, alto: H, base: rc.base, capas: { suelo: g.map((f) => f.join('')) }, objetos, animar: true, anclas: rc.anclas, puertas: Array.isArray(rc.puertas) ? rc.puertas : [], conexiones: { norte: null, sur: null, este: null, oeste: null }, zonas: [], npcs: [], pesca: [] };
}

function validar(j, rc) { // motivo del primer fallo, o null. Lee las piezas reales del juego (src/capas.js + src/terreno.js)
  require(path.join(raiz, 'src/capas.js')); require(path.join(raiz, 'src/terreno.js'));
  const G = globalThis.G, W = j.ancho, H = j.alto, s = j.capas.suelo, solares = rc.pasos.filter((p) => p.op === 'solar'), th = G.terreno.TEMAS[j.region];
  if (!th) return 'la región «' + j.region + '» no tiene tema de terreno';
  if (s.length !== H || s.some((f) => f.length !== W)) return 'el suelo no mide ' + W + '×' + H;
  for (const f of s) for (const c of f) if (CASILLAS.indexOf(c) < 0) return 'casilla desconocida «' + c + '»';
  const mal = G.capas.validar(j, W, H); if (mal.length) return mal[0];
  const bl = G.capas.bloqueos(j, W, H), libre = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !SOLIDO[s[y][x]] && !bl.has(x + ',' + y);
  for (const k of Object.keys(j.anclas)) if (!libre(j.anclas[k][0], j.anclas[k][1])) return 'el ancla «' + k + '» está sobre una casilla sólida';
  const v = new Set([j.anclas.inicio.join(',')]), q = [j.anclas.inicio]; for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ',' + (y + dy); if (libre(x + dx, y + dy) && !v.has(k)) { v.add(k); q.push([x + dx, y + dy]); } }); }
  let libres = 0, aislada = null; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (libre(x, y)) { libres++; if (!v.has(x + ',' + y) && !aislada) aislada = [x, y]; }
  if (aislada) return 'casilla libre no alcanzable desde el inicio en ' + aislada + ' (' + v.size + '/' + libres + ')';
  const cam = (x, y) => x >= 0 && y >= 0 && x < W && y < H && '=b'.indexOf(s[y][x]) >= 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cam(x, y) && ![[0, 0], [-1, 0], [0, -1], [-1, -1]].some(([a, b]) => cam(x + a, y + b) && cam(x + a + 1, y + b) && cam(x + a, y + b + 1) && cam(x + a + 1, y + b + 1))) return 'camino de menos de 2 casillas de ancho en ' + [x, y];
  for (const o of j.objetos) { // decoración solo en sitios lógicos
    const r = rc.pasos.find((p) => p.op === 'dispersar' && p.objeto === o.tipo), en = o.tipo + ' en ' + [o.x, o.y];
    if (!r || r.sobre.indexOf(s[o.y][o.x]) < 0) return en + ' no está sobre su terreno';
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (cam(o.x + dx, o.y + dy)) return en + ' está pegado a un camino';
    if (solares.some((z) => cheb(o.x, o.y, z) <= 1)) return en + ' está dentro o pegado a un solar';
    if (j.objetos.some((p) => p !== o && Math.max(Math.abs(p.x - o.x), Math.abs(p.y - o.y)) <= 1)) return en + ' está pegado a otra pieza';
  }
  if (JSON.stringify(componer(rc)) !== JSON.stringify(j)) return 'el compositor no es determinista (dos pasadas dan mapas distintos)';
  const azar = 'Math' + '.random'; for (const f of [__filename, path.join(raiz, 'src/terreno.js')]) if (fs.readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '').indexOf(azar) >= 0) return path.basename(f) + ' usa azar';
  return { libres, objetos: j.objetos.length };
}

if (require.main === module) {
  let linea;
  try {
    const args = process.argv.slice(2), receta = args.find((a) => !a.startsWith('--')) || path.join(raiz, 'plantillas/receta_pueblo_carbuna.json'), rc = JSON.parse(fs.readFileSync(receta, 'utf8'));
    const j = componer(rc), r = validar(j, rc), destino = path.join(raiz, 'maps', rc.id + '.json'), texto = JSON.stringify(j, null, 1);   // sin salto de línea final: igual que todos los maps/*.json y que tools/crear_mar.js
    if (typeof r === 'string') linea = 'FALLA: ' + r;
    else if (args.includes('--comprobar') && (!fs.existsSync(destino) || fs.readFileSync(destino, 'utf8') !== texto)) linea = 'FALLA: maps/' + rc.id + '.json no coincide con la receta (ejecuta sin --comprobar)';
    else { if (!args.includes('--comprobar')) { fs.mkdirSync(path.dirname(destino), { recursive: true }); fs.writeFileSync(destino, texto); } /* F5: una receta con id «dim/mapa» escribe maps/dim/mapa.json */ linea = 'OK ' + rc.id + ' ' + j.ancho + '×' + j.alto + ' · ' + r.libres + ' casillas libres, 100 % alcanzables · caminos ≥ 2 · ' + r.objetos + ' piezas en su terreno · determinista'; }
  } catch (e) { linea = 'FALLA: ' + e.message; }
  console.log(linea); process.exit(linea.startsWith('OK') ? 0 : 1);
}
module.exports = { componer, validar };
