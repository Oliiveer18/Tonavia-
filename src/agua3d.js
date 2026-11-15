// agua3d.js — AGUA DEL HD-2D (v2.171, paso 1 del plan «agua en 3D»). PURO: sin Three, sin DOM, sin Math.random.
// El agua es una superficie PROPIA sobre las casillas '~' (no la textura del suelo), con tres ZONAS de profundidad que salen de la distancia a la orilla (orilla · media · honda) y que más adelante servirán a la pesca:
//   G.agua3d.distancias(suelo) → { d: matriz de distancias en casillas (0 = tierra), max }      (la tierra es todo lo que no es '~' ni 'b': el puente deja pasar el agua por debajo)
//   G.agua3d.preparar(suelo, T) → { w, h, T, tiles: [[tx,tz]], zona: Uint8Array(w*h) }           zona por píxel (0 orilla, 1 media, 2 honda): distancia interpolada entre casillas + trama de Bayer 4×4, así el límite no sigue la rejilla
//   G.agua3d.pintar(prep, n, data) escribe en `data` (Uint8ClampedArray RGBA de w*h) solo los píxeles de agua, con las olas del cuadro n del reloj visual (4 por segundo)
//   G.agua3d.zonaDe(prep, x, z) → 0 | 1 | 2 | -1 (no es agua): para la pesca (x, z en casillas)
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const AGUA = (c) => c === '~' || c === 'b';
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const paleta = (z) => z.map((t) => t.map(rgb));   // por zona (orilla, media, honda): [base, ola, brillo]
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const UMBRAL = [0.85, 2.2];   // distancia interpolada: menos de 0,85 = orilla; menos de 2,2 = media; más = honda
  function distancias(suelo) {
    const H = suelo.length, W = suelo[0].length, d = Array.from({ length: H }, () => new Array(W).fill(-1)), cola = [];
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (!AGUA(suelo[z][x])) { d[z][x] = 0; cola.push([x, z]); }
    for (let q = 0; q < cola.length; q++) { const [x, z] = cola[q]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => { const X = x + dx, Z = z + dz; if (X >= 0 && Z >= 0 && X < W && Z < H && d[Z][X] < 0) { d[Z][X] = d[z][x] + 1; cola.push([X, Z]); } }); }
    let max = 0; d.forEach((r) => r.forEach((v) => { if (v > max) max = v; }));
    return { d, max: max || 1 };
  }
  function preparar(suelo, T) {
    T = T || 16; const H = suelo.length, W = suelo[0].length, w = W * T, h = H * T, D = distancias(suelo).d, tiles = [], zona = new Uint8Array(w * h), vc = new Float32Array(w * h);
    const dv = (x, z) => (x < 0 || z < 0 || x >= W || z >= H ? 0 : D[z][x] < 0 ? 4 : D[z][x]);   // fuera del mapa cuenta como tierra
    for (let tz = 0; tz < H; tz++) for (let tx = 0; tx < W; tx++) {
      if (suelo[tz][tx] !== '~') continue; tiles.push([tx, tz]);
      for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
        const fx = (i + 0.5) / T - 0.5, fz = (j + 0.5) / T - 0.5, x0 = Math.floor(tx + fx), z0 = Math.floor(tz + fz), ax = tx + fx - x0, az = tz + fz - z0;   // centro de píxel respecto a los centros de casilla
        const v = (dv(x0, z0) * (1 - ax) + dv(x0 + 1, z0) * ax) * (1 - az) + (dv(x0, z0 + 1) * (1 - ax) + dv(x0 + 1, z0 + 1) * ax) * az;
        const px = tx * T + i, py = tz * T + j, tr = (BAYER[(py & 3) * 4 + (px & 3)] / 15 - 0.5) * 0.7, vv = v + tr;
        vc[py * w + px] = v; zona[py * w + px] = vv < UMBRAL[0] ? 0 : vv < UMBRAL[1] ? 1 : 2;
      }
    }
    return { w, h, T, W, H, tiles, zona, v: vc, suelo };
  }
  const deriva = (px, py, n, per, vel, off0) => { const fila = py >> 1, off = (fila * 7 + (fila >> 2) * 5 + (off0 || 0)) % per; return [fila, (((px + off - n * vel) % per) + per) % per]; };
  const OLAS = {
    rayas(px, py, n, z) { if (py & 1) return 0; const per = z === 2 ? 20 : 16, [fila, m] = deriva(px, py, n, per, z === 2 ? 1 : 2); if (fila % 3 === 1 && m === 0) return 2; return (fila % 2 === 0 || z === 0) && m >= 1 && m <= 4 ? 1 : 0; },
    largas(px, py, n, z) { if (py & 1) return 0; const [fila, m] = deriva(px, py, n, 24, 1); if (z === 0 && m >= 0 && m <= 7 && fila % 2 === 0) return m < 2 ? 2 : 1; return z > 0 && fila % 4 === 1 && m >= 2 && m <= 8 ? 1 : 0; },   // crestas largas; en la orilla, espuma blanca
    diagonal(px, py, n, z) { const m = (((px + py * 2 - n * 2) % 14) + 14) % 14; return m === 0 && (px >> 2) % 3 !== 0 ? 2 : m >= 1 && m <= 2 && (px + py) % 3 !== 0 ? 1 : 0; },
    destellos(px, py, n, z) { const h = ((px * 73 + py * 151 + ((n >> 1) % 6) * 311) >>> 0) % 97; return h === 0 ? 2 : (py & 1) === 0 && ((px + (py >> 1) * 5 + (n >> 3)) % 22) === 0 ? 1 : 0; },   // casi quieta: puntos de sol que parpadean
    mixta(px, py, n, z) { return OLAS.rayas(px, py, n, z) || (OLAS.destellos(px, py, n, z) === 2 ? 2 : 0); },
  };
  // ── estilos «cristal»: facetas triangulares planas (low poly) cuyo tono cambia despacio con una onda de luz que cruza la superficie; sin trama de puntos ──
  const faceta = (o) => { const T4 = o.tonos.map((z) => z.map(rgb)), L = o.lado, AR = o.aristas ? rgb(o.aristas) : null, BR = rgb(o.brillo || '#ffffff');
    return (px, py, n, z) => {
      const cx = Math.floor(px / L), cy = Math.floor(py / L), lx = px - cx * L, ly = py - cy * L, tri = ((cx + cy) & 1) ? (lx > ly ? 1 : 0) : (lx + ly < L ? 1 : 0), h = (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663) ^ Math.imul(tri + 1, 83492791)) >>> 0;
      const v = Math.sin(h % 628 * 0.01 + n * o.vel + (cx - cy) * 0.35) + 0.6 * Math.sin(n * o.vel * 0.7 + cy * 0.5 + tri * 1.7), k = Math.max(0, Math.min(3, Math.floor((v + 1.6) / 3.2 * 4)));
      if (AR && (lx === 0 || ly === 0 || lx === ly || lx + ly === L - 1) && z < 2 && (cx + cy + tri) % 2 === 0) return AR;
      if (h % 53 === 0 && ((n >> 1) + (h >> 8)) % 5 === 0) return BR;   // destello suelto: una faceta que brilla un momento
      return T4[z][k];
    }; };
  const TONOS = { a: [['#8fc8ff', '#7ab8f8', '#66a8ee', '#5598e0'], ['#5aa0ee', '#4a8ee0', '#3f7fd2', '#356fc0'], ['#3f78c8', '#356ab8', '#2c5ca8', '#244e96']],
    hielo: [['#e4f6ff', '#d2eeff', '#bfe4fb', '#a9d8f5'], ['#a9dcf8', '#93cdf2', '#7fbeea', '#6baee0'], ['#6fb0e4', '#5aa0d8', '#4a90cc', '#3c80bc']],
    zafiro: [['#6aa5ee', '#5592e0', '#4580d4', '#3a70c4'], ['#3a70c4', '#2f60b0', '#27529c', '#204488'], ['#27529c', '#204488', '#1a3874', '#142c60']],
    marina: [['#b8f0e0', '#9fe6d6', '#86dccb', '#6ed0bf'], ['#6ed0bf', '#58c2b4', '#46b0a6', '#389e98'], ['#389e98', '#2f8a88', '#287880', '#216a74']] };
  // ── estilos «limpios» (HD-2D, como las farolas): tonos planos escalonados, sin trama de puntos; la zona sale de la distancia a la orilla sin tramar ──
  const hh = (a, b) => (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0;
  const limpio = (o) => { const P = o.pal.map((z) => z.map(rgb)), U = o.umbral || [0.8, 1.9];
    return { limpio: true, umbral: U, pixel: (px, py, n, z) => o.f(px, py, n, z, P[z], P) }; };
  const cresta = (px, py, n, z, vel, sep) => { const wy = py + Math.round(1.5 * Math.sin(px * 0.18 + n * 0.3)), band = Math.floor(wy / sep); return wy % sep === 0 && hh(band, (px + Math.floor(n * vel)) >> 4) % 3 === 0; };
  const caustica = (px, py, n) => Math.sin(px * 0.36 + n * 0.3 + Math.sin(py * 0.42 + n * 0.2) * 2) + Math.sin(py * 0.31 - n * 0.25 + Math.sin(px * 0.3 + n * 0.1) * 2);
  const NEUTRO = { pal: [['#86c1f8', '#a8d6ff', '#ffffff'], ['#5c9fe8', '#80baf4', '#e4f2ff'], ['#3f7fd2', '#5f9be2', '#b8d8fa']] };
  const TONOS_L = [['#a2d4fa', '#92caf6', '#82bff0', '#74b4ea'], ['#6aaeee', '#5aa0e6', '#4d94dc', '#4188d2'], ['#4a86d6', '#3f7ac8', '#366eba', '#2d62ac']].map((z) => z.map(rgb));
  const ESTILOS = {
    // VOXEL HD: celdas de 4 px (¼ de casilla), zonas alineadas a las celdas, tres azules lisos y un rizado muy suave por celda; destello en celdas sueltas
    voxel: { limpio: true, celda: 4, umbral: [0.95, 2.0], pixel: ((P) => (px, py, n, z) => { const cx = px >> 2, cy = py >> 2, f = Math.sin(cx * 0.55 + n * 0.12) + Math.sin(cy * 0.6 - n * 0.1) + Math.sin((cx + cy) * 0.3 + n * 0.07), k = f > 1.1 ? 0 : f < -1.1 ? 2 : 1; if (hh(cx, cy) % 29 === 0 && ((n >> 2) + (hh(cx, cy) >> 6)) % 6 === 0) return P[z][3]; return P[z][k]; })([['#7ec2f5', '#6bb4ee', '#5aa6e6', '#e4f4ff'], ['#4f98e0', '#4488d6', '#3a7acc', '#cfe8ff'], ['#3470bd', '#2c64b0', '#2458a2', '#9cc4ee']].map((z) => z.map(rgb))) },
    // limpia y con textura: patrones suaves en 4 tonos muy cercanos por zona, sin ruido ni tramas (borrador)
    ondas: { limpio: true, umbral: [0.8, 1.9], pixel: ((T4) => (px, py, n, z) => { const f = Math.sin(px * 0.16 + n * 0.2 + Math.sin(py * 0.2) * 1.5) + Math.sin(py * 0.22 - n * 0.15 + Math.sin(px * 0.13) * 1.2); return T4[z][Math.max(0, Math.min(3, Math.floor((f + 2) / 4 * 4)))]; })(TONOS_L) },
    escamas: { limpio: true, umbral: [0.8, 1.9], pixel: ((T4) => (px, py, n, z) => { const fila = Math.floor(py / 6), u = ((px + (fila & 1) * 6 + Math.floor(n * 0.3)) % 12 + 12) % 12 - 6, v = py % 6 + (fila & 1 ? 0 : 0), r = Math.hypot(u, v); return T4[z][r < 3.2 ? 3 : r < 5 ? 2 : r < 6.6 ? 1 : 0]; })(TONOS_L) },
    estrias: { limpio: true, umbral: [0.8, 1.9], pixel: ((T4) => (px, py, n, z) => { const m = ((px + py * 0.5 - n * 0.8) % 24 + 24) % 24; return T4[z][m < 6 ? 0 : m < 12 ? 1 : m < 18 ? 2 : 3]; })(TONOS_L) },
    // referencias para elegir estilo (borrador)
    hd2d: limpio({ pal: [['#7fb8f2', '#b4d8ff', '#ffffff'], ['#4f8fe0', '#7fb0f0', '#e6f2ff'], ['#2f62b4', '#4a80d0', '#a8c8f4']], f: (px, py, n, z, P) => { const col = px >> 1, h = hh(col, 7), len = 3 + (h % 6), ph = ((py + (h % 11) + Math.floor(n * 0.5)) % 14); if (h % 4 === 0 && ph < len && z > 0) return P[1]; if ((px * 13 + py * 7 + n * 3) % 197 === 0) return P[2]; return (py + Math.round(Math.sin(px * 0.2 + n * 0.25) * 1.2)) % 5 === 0 && hh(px >> 4, py >> 2) % 2 ? P[1] : P[0]; } }),
    wind: limpio({ pal: [['#bff0f8', '#ffffff', '#ffffff'], ['#6fd0ee', '#ffffff', '#e8fbff'], ['#4ab4e4', '#c8f2ff', '#ffffff']], f: (px, py, n, z, P) => { const wy = py + Math.round(2.2 * Math.sin(px * 0.3 + n * 0.22)), seg = hh(wy / 10 | 0, (px + Math.floor(n * 0.8)) >> 3); if (z === 0 && ((py + Math.round(Math.sin(px * 0.5 + n * 0.3))) % 4 === 0)) return P[1]; return wy % 10 === 0 && seg % 4 === 0 ? P[1] : P[0]; } }),
    stardew: limpio({ pal: [['#5a8fe0', '#a4c8ff', '#ffffff'], ['#4a7fd0', '#8fb8ff', '#ffffff'], ['#3f6fc0', '#7aa8f0', '#ffffff']], f: (px, py, n, z, P) => { const h = hh(px >> 3, py >> 2); return (py & 3) === 1 && h % 5 === 0 && ((px + Math.floor(n * 0.6)) & 7) < 4 ? P[1] : P[0]; } }),
    real: limpio({ pal: [['#8ed3f2', '#b8e8fb', '#ffffff'], ['#5db4e6', '#8fd2f4', '#e4f8ff'], ['#3b8cd2', '#5fa8e4', '#9cd0f4']], f: (px, py, n, z, P) => { const c = caustica(px, py, n); if (c > 1.7) return P[2]; if (c > 1.3) return P[1]; return P[0]; } }),
    // 1 · Cristal limpio: tres azules planos, crestas finas de un píxel que derivan, y un borde claro en la orilla
    limpio: limpio({ pal: NEUTRO.pal, f: (px, py, n, z, P) => (cresta(px, py, n, z, 1.2, 6) ? P[1] : (px * 7 + py * 3 + n) % 211 === 0 && z > 0 ? P[2] : P[0]) }),
    // 2 · Transparente: se «ve» el fondo en las orillas con una red de luz (cáustica) que se mueve despacio; en lo hondo, azul liso
    transparente: limpio({ pal: [['#6fd3ee', '#bff0ff', '#ffffff'], ['#47b4e6', '#8fdcf8', '#e6fbff'], ['#2f8fd0', '#58b0e8', '#b8e4fa']], f: (px, py, n, z, P) => { const c = caustica(px, py, n); return z < 2 && c > 1.45 ? P[1] : z < 2 && c > 1.15 ? P[0] : z === 2 && cresta(px, py, n, z, 0.8, 8) ? P[1] : P[0]; } }),
    // 3 · Espejo: casi quieto, bandas de profundidad nítidas y destellos largos de sol en diagonal
    espejo: limpio({ pal: [['#9fcdf6', '#c4e2fc', '#ffffff'], ['#6da9ec', '#95c4f6', '#ffffff'], ['#4a86d6', '#6da3e6', '#cfe6fb']], f: (px, py, n, z, P) => { const sol = (((px - py * 0.5 - n * 0.9) % 56) + 56) % 56; return sol < 2 && z > 0 ? P[2] : cresta(px, py, n, z, 0.5, 9) && (px >> 3) % 2 === 0 ? P[1] : P[0]; } }),
    // 4 · Cristal con fondo: crestas finas + cáustica solo en lo poco profundo (la profundidad se lee a simple vista; ideal para pescar)
    fondo: limpio({ pal: [['#78c8f4', '#c0ecff', '#ffffff'], ['#52a6ea', '#8ccdf8', '#e4f4ff'], ['#3a82d4', '#5ea0e6', '#b8d8fa']], f: (px, py, n, z, P) => { const c = caustica(px, py, n); if (z === 0 && c > 1.5) return P[1]; if (z === 1 && c > 1.7) return P[1]; return cresta(px, py, n, z, 1.0, 7) ? P[1] : (px * 5 + py * 11 + n * 2) % 233 === 0 ? P[2] : P[0]; } }),
    facetas: { pixel: faceta({ tonos: TONOS.a, lado: 8, vel: 0.22 }) },
    hielo: { pixel: faceta({ tonos: TONOS.hielo, lado: 12, vel: 0.16, brillo: '#ffffff' }) },
    aristas: { pixel: faceta({ tonos: TONOS.a, lado: 8, vel: 0.2, aristas: '#bfe0ff' }) },
    zafiro: { pixel: faceta({ tonos: TONOS.zafiro, lado: 6, vel: 0.26, brillo: '#cfe4ff' }) },
    marina: { pixel: faceta({ tonos: TONOS.marina, lado: 10, vel: 0.18, aristas: '#d6fff4' }) },
    cristal: { pal: paleta([['#5b96e0', '#7cb0f0', '#d3e8ff'], ['#4580d4', '#6aa5ee', '#d3e8ff'], ['#35629f', '#4f86cf', '#9cc4f5']]), ola: OLAS.rayas },
    profundo: { pal: paleta([['#3f78c8', '#5b96e0', '#f2f8ff'], ['#2f5fa8', '#4a86d6', '#cfe4ff'], ['#1f3f78', '#2f5fa8', '#7fb0ee']]), ola: OLAS.largas },
    turquesa: { pal: paleta([['#7fe0d0', '#a8f0e2', '#ffffff'], ['#3fb5b0', '#6fd6cb', '#e6fffb'], ['#2a8187', '#3fa0a3', '#9fe0e0']]), ola: OLAS.diagonal },
    sereno: { pal: paleta([['#6aa5e8', '#7fb4ee', '#ffffff'], ['#5a90d8', '#6aa5e8', '#ffffff'], ['#4574b8', '#5a90d8', '#cfe4ff']]), ola: OLAS.destellos },
    fantasia: { pal: paleta([['#6f8cf0', '#9bb0ff', '#ffd6f5'], ['#5a6fd6', '#7a8ef0', '#ffd6f5'], ['#3d4a9e', '#5a6fd6', '#c9b8ff']]), ola: OLAS.mixta },
  };
  function pintar(prep, n, data) {
    const w = prep.w, T = prep.T, E = ESTILOS[G.agua3d.ESTILO] || ESTILOS.cristal, PAL = E.pal, ola = E.ola, pix = E.pixel;
    prep.tiles.forEach(([tx, tz]) => {
      for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
        const px = tx * T + i, py = tz * T + j, vq = E.limpio ? (E.celda ? prep.v[((py / E.celda | 0) * E.celda + (E.celda >> 1)) * w + (px / E.celda | 0) * E.celda + (E.celda >> 1)] : prep.v[py * w + px]) : 0, z = E.limpio ? (vq < E.umbral[0] ? 0 : vq < E.umbral[1] ? 1 : 2) : prep.zona[py * w + px], c = pix ? pix(px, py, n, z) : PAL[z][ola(px, py, n, z)], k = (py * w + px) * 4;
        data[k] = c[0]; data[k + 1] = c[1]; data[k + 2] = c[2]; data[k + 3] = 255;
      }
    });
    return data;
  }
  function zonaDe(prep, x, z) { if (!prep || x < 0 || z < 0 || x >= prep.W || z >= prep.H || prep.suelo[z][x] !== '~') return -1; const T = prep.T; return prep.zona[(z * T + (T >> 1)) * prep.w + x * T + (T >> 1)]; }
  G.agua3d = { ESTILO: 'volumen', PALETAS: { B: { c0: [0.58, 0.86, 1.0], c1: [0.20, 0.62, 0.95], c2: [0.08, 0.38, 0.80] }, C: { c0: [0.50, 0.82, 1.0], c1: [0.10, 0.50, 0.98], c2: [0.04, 0.28, 0.80] } }, ESTILOS, UMBRAL, distancias, preparar, pintar, zonaDe };
})(typeof window !== 'undefined' ? window : globalThis);
