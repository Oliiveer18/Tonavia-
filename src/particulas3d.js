// particulas3d.js — PARTÍCULAS DEL HD-2D (v2.93, F3). Lo PURO: qué píxeles hay en el mundo 3D en cada cuadro del reloj visual (4 por segundo). Sin Three, sin DOM y sin Math.random (usa el hash de src/particulas.js: dos móviles ven lo mismo).
// El 2D ya tiene sus partículas (src/particulas.js, v2.90); aquí se REUSAN su reloj, sus ciclos y su azar (humo, destellos del agua y hojas salen de las mismas funciones) y se colocan en 3D. La fuente es nueva: gotas y salpicaduras
// siguen las piezas del torno redondo de dos niveles (VOL_FUENTE, v2.92), de la taza pequeña a la grande y de la grande al estanque, y los destellos caen sobre las tres aguas.
// Medidas: 1 píxel del dibujo = 1/16 u (igual que los sprites y las casas). Un «píxel» de partícula = un cuadrito de 1/16 u:
//   { x, y, z (mundo, en u), dx, dy (desplazamiento en píxeles), c (color hex), k: 'v' | 'h', t (qué es: 'gota' | 'salpicadura' | 'destello' | 'humo' | 'agua' | 'hoja') }
//   k 'v' = cuadrito VERTICAL que mira a la cámara: dx a lo largo de la cámara (derecha), dy hacia abajo (como en el 2D). k 'h' = cuadrito TUMBADO sobre el agua: dx a lo largo de x y dy a lo largo de z (hacia el sur).
// `armar()` convierte la lista en vértices para el pintor (src/hd2d_pintor.js, una sola malla con un tope fijo de cuadritos). Se apaga con G.hd2d.AJUSTES.PARTICULAS = false, con ?particulas=0, con «menos movimiento» (G.capas.REDUCIDO) o en mapas sin `animar`.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, PX = 1 / T;
  const AJUSTES = { MAX_PIXELES: 480, RADIO_MIN: 14 };      // MAX_PIXELES = cuadritos a la vez (tope de la malla); RADIO_MIN = casillas alrededor de la cámara que se calculan (crece con el zoom)
  const ALT = { '~': -0.3, t: 0 };                          // mismas alturas del suelo que el pintor (G.hd2d.ALT); un test lo vigila
  const CHIMENEAS = { casa_lali: 1, casa_oli: 2 };            // k de cada chimenea (el mismo que el `anima: humoK(k)` del 2D: así las dos chimeneas no van acompasadas)
  const FUENTE = { JETS: 4, GOTAS: 4, CICLO: 8, ARCO: 0.12, LISTON: 0.03, ORILLA: 0.06, SOBRE: 0.02 }; // 4 chorros por nivel, 4 gotas por chorro, 8 cuadros de caída (2 s), 0,12 u de arco, 3 cm sobre el borde, margen de 0,06 u dentro del agua
  const snap = (v) => Math.round(v * T) / T;
  const alt1 = (m, tx, tz) => { const f = m.suelo[Math.min(m.H - 1, Math.max(0, tz))]; const c = f && f[Math.min(m.W - 1, Math.max(0, tx))]; return ALT[c] || 0; };
  // altura del suelo suavizada (interpolación entre los centros de las casillas): una hoja que sale de un árbol (0,6 u) y entra en la hierba (0 u) no pega un salto al cruzar el borde
  function altSuave(m, x, z) {
    const fx = x - 0.5, fz = z - 0.5, x0 = Math.floor(fx), z0 = Math.floor(fz), u = fx - x0, v = fz - z0;
    return alt1(m, x0, z0) * (1 - u) * (1 - v) + alt1(m, x0 + 1, z0) * u * (1 - v) + alt1(m, x0, z0 + 1) * (1 - u) * v + alt1(m, x0 + 1, z0 + 1) * u * v;
  }
  const centroDe = (d) => { const R = G.volumenes.rectDe(G.volumenes.celdas(d.huella)); return R; };
  const pz = (T3, nombre) => T3.piezas.find((q) => q.pz === nombre);
  const px = (out, x, y, z, lista, k, t) => lista.forEach(([dx, dy, c]) => out.push({ x, y, z, dx, dy, c, k, t }));

  // ── 1 · Fuente redonda ── (centro y piezas salen de vol.torno; si faltan taza2, taza1 o estanque, no hay chorros)
  // Un chorro nace en el borde de la taza de arriba, sube un poco, y cae en parábola al agua de la de abajo: r = radio desde el centro, y = altura. s = 0 al salir y 1 al llegar.
  const SALPICADURA = [[[-1, 0], [0, 0], [1, 0]], [[0, -1], [-1, 0], [1, 0], [0, 0]], [[-2, -1], [2, -1]]]; // las mismas 3 poses del 2D (frente de la salpicadura, corona, gotas sueltas)
  function niveles(T3) { // [{ r0, y0, rL, yL, agua }] de arriba abajo
    const a = pz(T3, 'taza2'), b = pz(T3, 'taza1'), c = pz(T3, 'estanque'); if (!a || !b || !c) return [];
    return [[a, b], [b, c]].map(([de, a2]) => ({ r0: de.r1 + 0.02, y0: de.y1 + FUENTE.LISTON, rL: Math.min(a2.ri - FUENTE.ORILLA, de.r1 + 0.12), yL: a2.agua, pieza: a2 }));
  }
  const enArco = (nv, s) => { const yS = nv.y0, yL = nv.yL + FUENTE.SOBRE, v = FUENTE.ARCO; return { r: nv.r0 + (nv.rL - nv.r0) * s, y: yS + v * s - (v + yS - yL) * s * s }; };
  function fuente3d(n, cx, cz, y0, T3, out) {
    const P = G.particulas, col = P.COL;
    niveles(T3).forEach((nv, l) => {
      for (let q = 0; q < FUENTE.JETS; q++) {
        const ang = (45 + 90 * q) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
        for (let j = 0; j < FUENTE.GOTAS; j++) { // gota 1×2 (arriba brillo, abajo chispa), como la del 2D; cada gota va 2 cuadros por detrás de la anterior
          const a = (n + j * 2 + q + l) % FUENTE.CICLO, p = enArco(nv, a / FUENTE.CICLO);
          const x = snap(cx + p.r * ca), y = snap(y0 + p.y), z = snap(cz + p.r * sa);
          out.push({ x, y, z, dx: 0, dy: 0, c: col.brillo, k: 'v', t: 'gota' }, { x, y, z, dx: 0, dy: 1, c: col.chispa, k: 'v', t: 'gota' });
        }
        const s = (n + q + l) % FUENTE.CICLO; // la gota que sale con a = 0 cierra a la anterior: la salpicadura sigue al cuadro 0, 1 y 2 (como en el 2D)
        if (s < 3) { const x = snap(cx + nv.rL * ca), z = snap(cz + nv.rL * sa), y = y0 + nv.yL + FUENTE.SOBRE + PX / 2; SALPICADURA[s].forEach(([dx, dy]) => out.push({ x, y, z, dx, dy, c: s === 1 && dx === 0 && dy === 0 ? col.chispa : col.brillo, k: 'v', t: 'salpicadura' })); }
      }
    });
    // destellos sobre las aguas (estanque ×2 y taza grande ×1): tumbados, en un anillo que no toca ni la columna ni el borde; ciclo de 16 cuadros y 3 de duración, como los del agua del 2D
    [[pz(T3, 'estanque'), 0], [pz(T3, 'estanque'), 1], [pz(T3, 'taza1'), 2]].forEach(([w, q]) => {
      if (!w) return; const a0 = n + q * 7 + 3, a = a0 % 16, e = Math.floor(a0 / 16); if (a > 2) return;
      const h = P.hv(q * 31 + 7, e + 400); if (h % 100 >= 60) return;
      const lo = w.rc + 0.1, hi = w.ri - 0.1, r = lo + ((h >>> 4) % 100) / 100 * (hi - lo), ang = ((h >>> 11) % 360) * Math.PI / 180;
      const x = snap(cx + r * Math.cos(ang)), z = snap(cz + r * Math.sin(ang)), y = y0 + w.agua + FUENTE.SOBRE;
      px(out, x, y, z, a === 1 ? [[0, 0, col.chispa], [-1, 0, col.brillo], [1, 0, col.brillo], [0, -1, col.brillo], [0, 1, col.brillo]] : [[0, 0, col.brillo]], 'h', 'destello');
    });
  }

  // ── 2 · Humo ── la boca de la chimenea (corona + 4 cm) y las mismas bocanadas del 2D (P.humo); suben ≤ 14 px = 0,9 u. Los píxeles de la bocanada van a lo largo de la cámara (el desvío es de 6 px, no se nota).
  function humo3d(n, ox, oz, y0, d, k, out) {
    const c = d.vol.chimenea, R = centroDe(d), V = G.volumenes;
    const x = ox + R.x0 + c.x + c.w / 2, z = oz + R.z0 + c.z + c.d / 2, y = y0 + V.techoMax(d.vol) + c.sobre + 0.04;
    px(out, x, y, z, G.particulas.humo(n, k), 'v', 'humo');
  }

  // ── 3 · Destellos del agua y hojas ── los mismos del 2D, puestos en 3D: los destellos tumbados sobre el agua (a 0,3 u por debajo de la hierba) y las hojas a la altura del suelo de debajo + lo que vuelan
  function destellos3d(m, n, r, out) {
    if (G.agua3d && G.agua3d.RIO_VOLUMEN) return;   // v2.172: el río en volumen ya tiene su propio brillo (olas y especular); los cuadritos en cruz sobran
    G.particulas.destellos(m, n, r.x0, r.x1, r.y0, r.y1).forEach((d) => px(out, (d.x + 0.5) / T, ALT['~'] + 0.02, (d.y + 0.5) / T, d.px, 'h', 'agua'));
  }
  function hojas3d(m, n, r, out) {
    G.particulas.hojas(m, n, r.x0, r.x1, r.y0, r.y1).forEach((h) => { const x = (h.x + 0.5) / T, z = h.suelo / T, y = altSuave(m, x, z) + Math.max(0.05, (h.suelo - h.y) / T); px(out, x, y, z, h.px, 'v', 'hoja'); });
  }

  // ── Todo junto ── m = mapa; n = cuadro del reloj visual (G.particulas.cuadro()); r = rectángulo del mundo en píxeles del juego { x0, x1, y0, y1 } (lo que rodea a la cámara).
  // Devuelve la lista de «píxeles» (ver arriba), como mucho AJUSTES.MAX_PIXELES. Si las partículas están apagadas o el mapa no es `animar`, lista vacía.
  function pixeles(m, n, r) {
    const out = []; if (!G.particulas || !G.particulas.activo(m)) return out;
    (m.objetos || []).forEach((o) => {
      const d = G.OBJETOS[o.tipo]; if (!d || !d.vol) return;
      const cx = o.x * T, cy = o.y * T; if (cx < r.x0 - 6 * T || cx > r.x1 + 6 * T || cy < r.y0 - 6 * T || cy > r.y1 + 6 * T) return;
      const y0 = alt1(m, o.x, o.y);
      if (d.vol.torno && d.vol.estilo === 'fuente') { const R = centroDe(d); fuente3d(n, o.x + R.x0 + d.vol.torno.x, o.y + R.z0 + d.vol.torno.z, y0, d.vol.torno, out); }
      if (d.vol.chimenea && CHIMENEAS[o.tipo]) humo3d(n, o.x, o.y, y0, d, CHIMENEAS[o.tipo], out);
    });
    destellos3d(m, n, r, out); hojas3d(m, n, r, out);
    return out.length > AJUSTES.MAX_PIXELES ? out.slice(0, AJUSTES.MAX_PIXELES) : out;
  }

  // ── Vértices ── cada píxel = un cuadrito de 1/16 u: 4 vértices (posición y color). yaw = giro de la cámara (el mismo de los sprites): la derecha de la cámara es (cos yaw, 0, −sin yaw).
  // pos y col son Float32Array de al menos 12 × lista.length; devuelve cuántos cuadritos escribió.
  const colores = new Map();
  const rgb = (hex) => { let v = colores.get(hex); if (!v) { const n = parseInt(hex.slice(1), 16); v = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; colores.set(hex, v); } return v; };
  function armar(lista, yaw, pos, col) {
    const rx = Math.cos(yaw), rz = -Math.sin(yaw), h = PX / 2, n = Math.min(lista.length, Math.floor(pos.length / 12));
    for (let i = 0; i < n; i++) {
      const p = lista[i], c = rgb(p.c), o = i * 12; let cx, cy, cz, ax, ay, az, bx, by, bz;
      if (p.k === 'h') { cx = p.x + p.dx * PX; cy = p.y; cz = p.z + p.dy * PX; ax = h; ay = 0; az = 0; bx = 0; by = 0; bz = h; }                    // tumbado: ejes x y z del mundo
      else { cx = p.x + rx * p.dx * PX; cy = p.y - p.dy * PX; cz = p.z + rz * p.dx * PX; ax = rx * h; ay = 0; az = rz * h; bx = 0; by = h; bz = 0; }  // vertical: eje «derecha» de la cámara y eje y
      pos[o] = cx - ax - bx; pos[o + 1] = cy - ay - by; pos[o + 2] = cz - az - bz;
      pos[o + 3] = cx + ax - bx; pos[o + 4] = cy + ay - by; pos[o + 5] = cz + az - bz;
      pos[o + 6] = cx + ax + bx; pos[o + 7] = cy + ay + by; pos[o + 8] = cz + az + bz;
      pos[o + 9] = cx - ax + bx; pos[o + 10] = cy - ay + by; pos[o + 11] = cz - az + bz;
      for (let k = 0; k < 4; k++) { col[o + k * 3] = c[0]; col[o + k * 3 + 1] = c[1]; col[o + k * 3 + 2] = c[2]; }
    }
    return n;
  }
  // índices fijos de los cuadritos (dos triángulos cada uno), para el máximo de la malla
  const indices = (max) => { const i = []; for (let q = 0; q < max; q++) { const o = q * 4; i.push(o, o + 1, o + 2, o, o + 2, o + 3); } return i; };

  G.particulas3d = { AJUSTES, ALT, CHIMENEAS, FUENTE, SALPICADURA, snap, altSuave, niveles, enArco, fuente3d, humo3d, destellos3d, hojas3d, pixeles, armar, indices, rgb };
})(typeof window !== 'undefined' ? window : globalThis);
