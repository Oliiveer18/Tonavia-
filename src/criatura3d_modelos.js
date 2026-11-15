// criatura3d_modelos.js — MODELOS 3D A MANO de Nimbel (nubecin) y Arenel (arenel) (v2.229). PURO: sin Three.js, sin DOM, sin Math.random; se prueba en node.
// Misma interfaz que G.criatura3d.de('zefirax'): { id, BRILLO, TONO_TEX, MAX_TRIANGULOS, doble, YAW, girar, velocidad, pose, geometria, atlas, uvPoligono }.
// Las medidas salen de los sprites 2D reales (docs/GUIA_MODELADO_3D.md): Nimbel = UNA masa (cortes con el ancho del frente y el fondo del perfil) + gotas; Arenel = acarapacho, cuerpo, ojos esféricos, pinzas y 8 patas.
// Las texturas son los sprites 2D proyectados en planta (frente/espalda/perfiles; G.CRIATURA3D_SPRITES, generado por tools/generar_sprites3d.py); los rasgos de la cara son geometría o decales propios.
// Sombreado continuo (q.k) calculado aquí con la luz fija del juego; el pintor lo usa en lugar de los 4 tonos cuando existe.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const U = 1 / 16;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  function quad(out, pieza, v, centro, col, colB, op) {   // normal hacia fuera (respecto al centro de la pieza)
    let n = norm(cruz(sub(v[1], v[0]), sub(v[3], v[0])));
    if (Math.hypot(n[0], n[1], n[2]) < 1e-9 || (n[0] === 0 && n[1] === 0 && n[2] === 0)) n = norm(cruz(sub(v[2], v[0]), sub(v[3], v[1])));
    const c = [(v[0][0] + v[1][0] + v[2][0] + v[3][0]) / 4, (v[0][1] + v[1][1] + v[2][1] + v[3][1]) / 4, (v[0][2] + v[1][2] + v[2][2] + v[3][2]) / 4];
    if (n[0] * (c[0] - centro[0]) + n[1] * (c[1] - centro[1]) + n[2] * (c[2] - centro[2]) < 0) { n = [-n[0], -n[1], -n[2]]; v = [v[0], v[3], v[2], v[1]]; }
    const q = { pieza, v, n, col, colB: colB || col }; if (op) Object.assign(q, op); out.push(q);
  }
  // anillo de superelipse (a = semiancho en x, b = semifondo en z) con K vértices; el desfase π/K deja una cara plana mirando a cada eje
  function anillo(a, b, n, K, cx, y, cz, lob) {   // lob = { amp, frec, fase }: ondulación del contorno (bultos de la nube sin separar las masas)
    const r = [];
    for (let i = 0; i < K; i++) { const t = ((i + 0.5) * 2 * Math.PI) / K, c = Math.cos(t), s = Math.sin(t), m = lob ? 1 + lob.amp * Math.cos(lob.frec * t + lob.fase) : 1; r.push([cx + m * a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y, cz + m * b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]); }
    return r;
  }
  function tubo(out, pieza, anillos, centroDe, col, colB, tapaArriba, tapaAbajo, op) {
    const K = anillos[0].length;
    for (let i = 0; i + 1 < anillos.length; i++) for (let k = 0; k < K; k++) { const k2 = (k + 1) % K; quad(out, pieza, [anillos[i][k], anillos[i][k2], anillos[i + 1][k2], anillos[i + 1][k]], centroDe, col, colB, op); }
    const tapa = (r, y) => { const c = [r.reduce((s, p) => s + p[0], 0) / K, y, r.reduce((s, p) => s + p[2], 0) / K]; for (let k = 0; k < K; k++) quad(out, pieza, [r[k], r[(k + 1) % K], c, c], centroDe, col, colB); };
    if (tapaArriba) tapa(anillos[0], anillos[0][0][1]); if (tapaAbajo) tapa(anillos[anillos.length - 1], anillos[anillos.length - 1][0][1]);
  }
  const mezcla = (a, b, t) => { const c = (h, i) => parseInt(h.slice(i, i + 2), 16), m = (i) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * t).toString(16).padStart(2, '0'); return '#' + m(1) + m(3) + m(5); };
  const centroDe = (r) => [r.reduce((s, p) => s + p[0], 0) / r.length, r[0][1], r.reduce((s, p) => s + p[2], 0) / r.length];
  function tapa(out, pieza, r, col, centro) { const c = centroDe(r), K = r.length; for (let k = 0; k < K; k++) quad(out, pieza, [r[k], r[(k + 1) % K], c, c], centro, col, col); }
  // esfera de pocos polígonos: K lados × L bandas
  function esfera(out, pieza, c, r, K, L, col, colB, op, ez) {
    const rings = []; for (let i = 0; i <= L; i++) { const lat = -Math.PI / 2 + (Math.PI * i) / L, rr = r * Math.cos(lat); rings.push(anillo(Math.max(rr, 1e-6), Math.max(rr * (ez || 1), 1e-6), 2, K, c[0], c[1] + r * Math.sin(lat), c[2])); }
    tubo(out, pieza, rings, c, col, colB, false, false, op);
  }
  // decal plano (rasgos de la cara): rectángulo en el plano z = f(x, y) del frente, sin textura proyectada (liso); e = emisivo (no se sombrea)
  function decal(out, pieza, x0, y0, x1, y1, zDe, col, e, P) {
    const v = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => P(x, y, zDe(x, y)));
    quad(out, pieza, [v[0], v[3], v[2], v[1]], [v[0][0], v[0][1], v[0][2] - 1], col, col, { liso: true, e: !!e });
  }
  // caja biselada (chaflán c): 6 caras + 12 chaflanes + 8 esquinas
  function caja(out, pieza, cx, cy, cz, sx, sy, sz, c, col, colB, sinAbajo, op) {
    const h = [sx / 2, sy / 2, sz / 2], P = (s, ax) => { const o = [0, 0, 0]; for (let i = 0; i < 3; i++) o[i] = s[i] * (i === ax ? h[i] : h[i] - c); return [cx + o[0], cy + o[1], cz + o[2]]; }, C = [cx, cy, cz], S = [-1, 1];
    for (let ax = 0; ax < 3; ax++) for (const sg of S) {   // caras
      if (sinAbajo && ax === 1 && sg < 0) continue;
      const o1 = (ax + 1) % 3, o2 = (ax + 2) % 3, q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => { const s = [0, 0, 0]; s[ax] = sg; s[o1] = u; s[o2] = v; return P(s, ax); });
      quad(out, pieza, q, C, col, ax === 1 && sg < 0 ? colB : col, op);
    }
    for (let a1 = 0; a1 < 3; a1++) for (let a2 = a1 + 1; a2 < 3; a2++) for (const s1 of S) for (const s2 of S) {   // chaflanes a lo largo del tercer eje
      if (sinAbajo && ((a1 === 1 && s1 < 0) || (a2 === 1 && s2 < 0))) continue;
      const a3 = 3 - a1 - a2, mk = (ax, s3) => { const s = [0, 0, 0]; s[a1] = s1; s[a2] = s2; s[a3] = s3; return P(s, ax); };
      quad(out, pieza, [mk(a1, -1), mk(a1, 1), mk(a2, 1), mk(a2, -1)], C, col, colB, op);
    }
    for (const sx_ of S) for (const sy_ of S) for (const sz_ of S) { if (sinAbajo && sy_ < 0) continue; const s = [sx_, sy_, sz_]; quad(out, pieza, [P(s, 0), P(s, 1), P(s, 2), P(s, 2)], C, col, colB, op); }
  }
  // ───────────────────────── NIMBEL (sprite 22×14; lienzo: x centro 11, suelo y = 14, z centro de columnas 10,5) ─────────────────────────
  const NIM = { cx: 11, suelo: 14, zc: 10.5 };
  // cortes horizontales: [y (borde, px), ancho del frente, fondo del perfil] medidos con el contorno
  const NIM_CORTES = [[1.6, 8, 6.5], [2, 12, 10], [3, 14, 12], [4, 16, 13.5], [5, 17, 14], [6, 18, 15], [7, 18, 15], [8, 18, 15], [9, 18, 15], [10, 17, 14.5], [11, 16.5, 14], [12, 15.5, 12.5]];
  function nimbel() {
    const out = [], K = 16, P = (x, y, z) => [(x - NIM.cx) * U, (NIM.suelo - y) * U, (NIM.zc - z) * U];
    const anillos = NIM_CORTES.map(([y, w, d], i) => anillo((w / 2) * U, (d / 2) * U, 3.0, K, 0, (NIM.suelo - y) * U, 0, i >= 10 ? null : { amp: i < 2 ? 0.10 : 0.06, frec: i < 2 ? 2 : 6, fase: i < 2 ? 0 : i * 0.8 }));   // 5 bultos en el contorno que giran con la altura
    tubo(out, 'cuerpo', anillos, [0, (NIM.suelo - 7) * U, 0], '#fff9ee', '#b7d5ee', true, true);
    // cara: rasgos como decales planos pegados a la superficie del frente (ojo = 3 píxeles inclinados, boca 2, mofletes 2); z de la superficie según los cortes
    const zFr = (x, y) => { let i = 0; while (i + 2 < NIM_CORTES.length && NIM_CORTES[i + 1][0] < y) i++; const A = NIM_CORTES[i], B = NIM_CORTES[i + 1], t = Math.min(1, Math.max(0, (y - A[0]) / (B[0] - A[0]))), a = (A[1] + (B[1] - A[1]) * t) / 2, b = (A[2] + (B[2] - A[2]) * t) / 2, u = Math.min(0.999, Math.abs(x - NIM.cx) / a); return NIM.zc - (b * Math.pow(1 - Math.pow(u, 3.0), 1 / 3.0) + 0.9); };   // en px de columna (z = zc - col)
    const TINTA = '#2a1b30', zD = (x, y) => zFr(x, y), PP = (x, y, zc_) => [(x - NIM.cx) * U, (NIM.suelo - y) * U, (NIM.zc - zc_) * U];
    [[8, 6, 9, 8], [7, 7, 8, 8], [14, 6, 15, 8], [13, 7, 14, 8]].forEach((r, i) => decal(out, 'ojo' + i, r[0], r[1], r[2], r[3], zD, TINTA, false, PP));
    decal(out, 'boca', 10, 8, 12, 9, zD, TINTA, false, PP); decal(out, 'moflete_i', 4, 8, 6, 9, zD, '#e47a9a', true, PP); decal(out, 'moflete_d', 16, 8, 18, 9, zD, '#e0538e', true, PP);
    // gotas de abajo (dos): cajas pequeñas bajo la nube; x/z centrados en las gotas del 2D (frente x 8-10 y 13-15; perfil columnas 8-10 y 12-14)
    [[9, 9.0], [14, 13.0]].forEach(([x, zcol], i) => { const c = P(x, 12.4, zcol); caja(out, 'gota' + i, c[0], c[1], c[2], 2 * U, 2.4 * U, 3 * U, 0.3 * U, '#b7d5ee', '#8fb4e7'); });
    return out;
  }
  // ───────────────────────── ARENEL (sprite 16×14; x centro 8, suelo y = 14, z centro de columnas 9,5) ─────────────────────────
  const ARE = { cx: 8, suelo: 14, zc: 9.5 };
  function arenel() {
    const out = [], P = (x, y, z) => [(x - ARE.cx) * U, (ARE.suelo - y) * U, (ARE.zc - z) * U];
    const S = (px) => px * U;
    // cuerpo: concha de arena (cortes: y, ancho, fondo)
    const cuerpo = [[5.6, 9, 8], [6, 12, 10], [7, 12, 11], [8, 10, 11], [9, 9, 11], [10, 9, 11], [11, 9, 10], [12, 8, 8]].map(([y, w, d]) => anillo(S(w / 2), S(d / 2), 2.8, 10, 0, (ARE.suelo - y) * U, 0));
    tubo(out, 'cuerpo', cuerpo, [0, (ARE.suelo - 8.5) * U, 0], '#e8c47a', '#9a7240', true, true);
    // ACARAPACHO / tapón de botella azul: grande, como en la espalda y el perfil del 2D (≈ 10 px de ancho y de fondo, filas 1,5-9,5), sobre la parte trasera
    // cúpula suave arriba (antes un disco plano) y degradado de color en ella; los laterales llevan degradado vertical de brillo (más claro arriba)
    const TP = [[0.3, 2.4, 2.4], [0.8, 5.6, 5.4], [1.4, 8.2, 7.8], [2.0, 9.6, 9.0], [3.0, 10.4, 9.4], [8.5, 10.4, 9.4], [9.8, 9.2, 8.6]];   // v2.236: ancho como el 2D (10,4 px) y FONDO 9 px pegado a la parte de atrás (z de +3,5 a −5,5 px): el acarapacho no avanza sobre la cara del cuerpo
    const tp = TP.map(([y, w, d]) => anillo(S(w / 2), S(d / 2), 2.4, 12, 0, (ARE.suelo - y) * U, 0));
    const tpo = P(8, 4, 10.5); const mover = (r) => r.map((p) => [p[0] + tpo[0], p[1], p[2] + tpo[2]]);
    const tpm = tp.map(mover), ctp = [tpo[0], (ARE.suelo - 5.5) * U, tpo[2]];
    const yTop = (ARE.suelo - TP[0][0]) * U, yBorde = (ARE.suelo - TP[3][0]) * U, yBase = (ARE.suelo - TP[6][0]) * U, n0 = out.length;
    const cuba = tpm.slice(0, 4), sh = (t) => t * t * (3 - 2 * t);
    tubo(out, 'tapon', cuba, ctp, '#3f7fd6', '#27559c', false, false, { liso: true }); tapa(out, 'tapon', cuba[0], '#8fb0e6', ctp);
    for (let i = n0; i < out.length; i++) { const sec = (i - n0) % 12, borde = sec % 2 ? '#4a8ae0' : '#3a74cc'; out[i] = Object.assign(out[i], { liso: true, cv: out[i].v.map((v) => mezcla(borde, '#8fb0e6', sh(Math.min(1, Math.max(0, (v[1] - yBorde) / (yTop - yBorde)))))) }); }   // degradado: borde azul → centro azul claro; los sectores alternan un tono (nervios, como las estrías del tapón del 2D) y se funden hacia el centro
    const n1 = out.length; tubo(out, 'tapon', tpm.slice(3), ctp, '#3f7fd6', '#27559c', false, false);
    for (let i = n1; i < out.length; i++) out[i].kg = out[i].v.map((v) => Math.min(1, Math.max(0, (v[1] - yBase) / (yBorde - yBase))));   // 0 abajo → 1 arriba (el brillo sube suavemente por vértice)
    // ojos: esfera blanca con pupila oscura mirando al frente y brillo (geometría propia, no sprite proyectado), sobre pedúnculos de arena
    [[3.0, 'i'], [13.0, 'd']].forEach(([x, l]) => {   // v2.234: ojos en las posiciones del 2D (10 px entre centros), pupila = ranura vertical oscura entre dos franjas blancas (como el dibujo 2D «blanco-tinta-blanco»), sin brillo
      const c = P(x, 3.5, 3.9), r = S(1.9), ez = 0.8; esfera(out, 'ojo_' + l, c, r, 10, 4, '#fffdf5', '#d3deef', { liso: true }, ez);
      const pz = c[2] + r * ez * 0.93, rx = S(0.55), ry = S(1.5), disco = []; for (let k = 0; k < 8; k++) { const t = (k * Math.PI) / 4 + Math.PI / 8; disco.push([c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t), pz]); }
      const cc = [c[0], c[1], pz]; for (let k = 0; k < 8; k++) quad(out, 'pupila_' + l, [disco[(k + 1) % 8], disco[k], cc, cc], [c[0], c[1], c[2]], '#2a1b30', '#2a1b30', { liso: true });
      const p = P(x, 5.7, 4.0); caja(out, 'pedunculo_' + l, p[0], p[1], p[2], S(1.4), S(2.0), S(1.4), S(0.2), '#e8c47a', '#c9a05a', false, { liso: true });
    });
    // boca: dos píxeles oscuros en el frente del cuerpo
    { const zF = P(8, 9.5, 9.5 - 5.9)[2]; const m = [[7, 9], [9, 9], [9, 10], [7, 10]].map(([x, y]) => P(x, y, 9.5 - 5.9)); quad(out, 'boca', [m[0], m[3], m[2], m[1]], [0, m[0][1], 0], '#2a1b30', '#2a1b30', { liso: true }); }
    // pinzas coral: bloque 4×4×4 delante, a los lados
    [[2, 'i'], [14, 'd']].forEach(([x, l]) => { const c = P(x, 9, 2.0); caja(out, 'pinza_' + l, c[0], c[1], c[2], S(4), S(4), S(4), S(0.8), '#e8624f', '#c4473b', false, { liso: true }); });
    // patas: 8 (cuatro por lado), finas
    [[3.5, 3.5], [3.5, 7.5], [5.5, 5.5], [5.5, 9.5], [12.5, 3.5], [12.5, 7.5], [10.5, 5.5], [10.5, 9.5]].forEach(([x, zcol], i) => { const c = P(x, 12.9, zcol); caja(out, 'pata' + i, c[0], c[1], c[2], S(1), S(2.2), S(1), S(0.15), '#9a7240', '#9a7240', true, { liso: true }); });
    return out;
  }


  // ───────────────────────── SOMNEL (somnin; sprite 18×22; x centro 9, suelo y = 22, z centro de columnas 9,5) · docs/FICHA_SOMNEL_3D.md ─────────────────────────
  const SOM = { cx: 9, suelo: 22, zc: 9.5 }, SOM_ESTRELLA = [6.5 * U, 6.5 * U, -2.4 * U];   // centro de la estrella flotante (x, y sobre el suelo, z) en u
  function somnel() {
    const out = [], S = (px) => px * U, Y = (y) => (SOM.suelo - y) * U, P = (x, y, zcol) => [(x - SOM.cx) * U, Y(y), (SOM.zc - zcol) * U], TINTA = '#2a1b30';
    // cuerpo: UNA masa por cortes [y, ancho del frente, fondo del perfil] (medidas con contorno)
    const cortes = [[10.0, 9, 8.5], [10.6, 10.5, 10], [11.4, 13, 11.5], [12.5, 13, 12.5], [13.5, 14, 13], [15, 14, 13], [16.2, 13, 12.5], [17.2, 12, 11.5], [17.8, 10, 9.5]];
    tubo(out, 'cuerpo', cortes.map(([y, w, d]) => anillo(S(w / 2), S(d / 2), 2.8, 14, 0, Y(y), 0)), [0, Y(14), 0], '#8e5bc4', '#5f3b8e', true, true);
    // gorro de dormir: cono caído hacia atrás (−z) y un poco a +x; banda oscura en la base; borla amarilla
    const hat = [[2.8, 0.4, 0.4, 2.6, -2.6], [3.4, 1.6, 1.6, 2.4, -2.4], [4.4, 3.4, 3.2, 1.9, -1.9], [5.8, 5.6, 5.2, 1.3, -1.3], [7.2, 7.8, 7.2, 0.8, -0.8], [8.4, 10, 9.2, 0.3, -0.3], [9.1, 12, 11, 0, 0]];
    tubo(out, 'gorro', hat.map(([y, w, d, ox, oz]) => anillo(S(w / 2), S(d / 2), 2.2, 14, S(ox), Y(y), S(oz))), [S(1), Y(6), S(-1)], '#5f3b8e', '#4a2c73', true, false, { liso: true });
    tubo(out, 'banda', [[9.1, 12.6, 11.6], [10.4, 12.6, 11.6]].map(([y, w, d]) => anillo(S(w / 2), S(d / 2), 2.2, 14, 0, Y(y), 0)), [0, Y(9.8), 0], '#4a2c73', '#41215c', false, true, { liso: true });
    esfera(out, 'borla', [S(3), Y(1.9), S(-2.8)], S(1.5), 8, 3, '#f7d54a', '#f7d54a', { e: true });
    // ojos cerrados (dos rayas de tinta) como decales sobre la superficie del frente
    const zFr = (x, y) => { let i = 0; while (i + 2 < cortes.length && cortes[i + 1][0] < y) i++; const A = cortes[i], B = cortes[i + 1], t = Math.min(1, Math.max(0, (y - A[0]) / (B[0] - A[0]))), a = (A[1] + (B[1] - A[1]) * t) / 2, b = (A[2] + (B[2] - A[2]) * t) / 2, u = Math.min(0.999, Math.abs(x - SOM.cx) / a); return SOM.zc - (b * Math.pow(1 - Math.pow(u, 2.8), 1 / 2.8) + 0.9); };
    decal(out, 'ojo_i', 5, 14, 8, 15, zFr, TINTA, false, P); decal(out, 'ojo_d', 10, 14, 13, 15, zFr, TINTA, false, P);
    // patas: cuatro bloques (2 por lado, delante y detrás); el orden alterna las diagonales para el paso
    [[6, 5.2], [12, 5.2], [12, 11.7], [6, 11.7]].forEach(([x, zcol], i) => { const c = P(x, 19.4, zcol); caja(out, 'pata' + i, c[0], c[1], c[2], S(3.4), S(4.2), S(3.4), S(0.4), '#5f3b8e', '#562e77', true, { liso: true }); });
    // estrella ✦ flotante (dos barras en cruz, emisiva) y motita amarilla suelta delante a la izquierda
    const E = SOM_ESTRELLA; caja(out, 'estrella_h', E[0], E[1] + S(9), E[2], S(3.2), S(1.1), S(1.1), S(0.15), '#f7d54a', '#f7d54a', false, { e: true }); caja(out, 'estrella_v', E[0], E[1] + S(9), E[2], S(1.1), S(3.2), S(1.1), S(0.15), '#f7d54a', '#f7d54a', false, { e: true });
    { const m = P(2.5, 11.5, 6.5); caja(out, 'motita', m[0], m[1], m[2], S(1.3), S(1.3), S(1.3), S(0.15), '#f7d54a', '#f7d54a', false, { e: true }); }
    return out;
  }

  // ───────────────────────── interfaz de módulo (misma que Zefirax) ─────────────────────────
  const MAX_TRIANGULOS = 1200, BRILLO = 1.12, TONO_TEX = { arriba: 1, luz: 0.95, base: 0.89, sombra: 0.72 };
  const rotY = (p, a) => { const co = Math.cos(a), si = Math.sin(a); return [p[0] * co + p[2] * si, p[1], -p[0] * si + p[2] * co]; };
  const hex2 = (h, k) => { const c = (i) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0'); return '#' + c(1) + c(3) + c(5); };
  // Brillo NETO de una cara (1,0 = el color del 2D tal cual): frente 1,0 · oeste ≈ 1,0 · este ≈ 0,74 · espalda ≈ 0,76 · arriba ≈ 0,94 (v2.232: antes las caras con textura salían ×1,12 más claras que las lisas y las de arriba se quemaban).
  const luzK = (n) => Math.max(0.55, Math.min(1, 0.88 - 0.14 * n[0] + 0.12 * n[2] + 0.06 * n[1]));
  const pose = (fase, yaw, cam, moving) => ({ fase: typeof fase === 'number' ? fase : 0, yaw: typeof yaw === 'number' ? yaw : 0, cam: typeof cam === 'number' ? cam : 0, moving: !!moving });
  const texDe = (n) => (Math.abs(n[1]) > 0.5 ? null : Math.abs(n[2]) >= Math.abs(n[0]) ? (n[2] > 0 ? 'f' : 'b') : (n[0] > 0 ? 'l' : 'r'));   // qué sprite se proyecta en esta cara (en local, con yaw 0): arriba/abajo = color liso
  function fabrica(id, cfg, construir, anima, vel) {
    let BASE = null, ATLAS = null;
    const base = () => BASE || (BASE = construir().map((q) => Object.assign({}, q, { tex: q.texId ? q.texId : q.liso || q.e || cfg.sinTextura ? null : (texDe(q.n) && (q.pieza === 'tapon' && G.CRIATURA3D_SPRITES && G.CRIATURA3D_SPRITES[id] && G.CRIATURA3D_SPRITES[id].vistas.ft ? texDe(q.n) + 't' : texDe(q.n))) })));
    function geometria(po) {
      po = po || pose(0, 0); const poligonos = [], ya = po.yaw;
      base().forEach((q) => {
        let v = q.v.map((p) => p.slice()); if (anima) v = anima(po, q, v);
        const n = rotY(q.n, ya), net = q.e ? 1 : luzK(n), k = q.tex ? net / BRILLO : net, tn = n[1] > 0.7 ? 'arriba' : n[0] < -0.35 ? 'luz' : n[2] > 0.35 ? 'base' : 'sombra';
        poligonos.push({ uvs: q.uvs, pieza: q.pieza, cara: 'q', tono: tn, col: q.col, color: q.tex || q.e ? q.col : hex2(q.n[1] < -0.5 ? q.colB : q.col, net), k, kv: q.kg && q.tex ? q.kg.map((t) => k * (0.84 + 0.16 * t)) : undefined, cvs: q.cv ? q.cv.map((h) => hex2(h, net)) : undefined, n, v: v.map((p) => rotY(p, ya)), vl: v, tex: q.tex, espejo: false });
      });
      return { poligonos, triangulos: poligonos.length * 2 };
    }
    function atlas() {
      if (ATLAS) return ATLAS;
      if (cfg.celdas) {   // atlas propio (v2.248): celdas generadas por código [{ id, w, h, px: filas de color|null }]; los quads piden su celda con `texId` y sus `uvs` (0..1 dentro de la celda)
        const celdas = [{ id: 'blanco', w: 1, h: 1, px: [['#ffffff']] }].concat(cfg.celdas()), AW = 64, rects = {}; let x = 0, y = 0, fila = 0;
        celdas.forEach((c) => { if (x + c.w > AW) { x = 0; y += fila + 1; fila = 0; } c.x = x; c.y = y; rects[c.id] = { x, y, w: c.w, h: c.h }; x += c.w + 1; fila = Math.max(fila, c.h); });
        return (ATLAS = { w: AW, h: y + fila, celdas, rects });
      }
      if (cfg.sinTextura) return (ATLAS = { w: 1, h: 1, celdas: [{ id: 'blanco', w: 1, h: 1, px: [['#ffffff']], x: 0, y: 0 }], rects: { blanco: { x: 0, y: 0, w: 1, h: 1 } } });   // piezas solo de colores (sin sprite)
      const S = G.CRIATURA3D_SPRITES && G.CRIATURA3D_SPRITES[id]; if (!S) throw new Error('criatura3d: faltan las texturas de ' + id + ' (G.CRIATURA3D_SPRITES)');
      const px = (rows) => rows.map((r) => r.split('').map((ch) => S.pal[ch] || null)), celdas = [{ id: 'blanco', w: 1, h: 1, px: [['#ffffff']] }];
      Object.keys(S.vistas).forEach((v) => celdas.push({ id: v, px: px(S.vistas[v]), w: S.w, h: S.h }));
      const AW = 64, rects = {}; let x = 0, y = 0, fila = 0;
      celdas.forEach((c) => { if (x + c.w > AW) { x = 0; y += fila + 1; fila = 0; } c.x = x; c.y = y; rects[c.id] = { x, y, w: c.w, h: c.h }; x += c.w + 1; fila = Math.max(fila, c.h); });
      return (ATLAS = { w: AW, h: y + fila, celdas, rects });
    }
    function uvPoligono(q, at) {   // proyección plana: cada vértice (en local, yaw 0) cae sobre el píxel del sprite que le corresponde
      const R = q.tex && (at.rects[q.tex] || at.rects[q.tex[0]] || at.rects.f);
      if (R && q.uvs) return { tex: true, uv: q.uvs.map(([u, v]) => [(R.x + u * R.w) / at.w, 1 - (R.y + v * R.h) / at.h]) };   // los objetos solo tienen la vista de frente (v2.246): las demás caras la reutilizan
      if (!R) { const b = at.rects.blanco; return { tex: false, uv: [0, 1, 2, 3].map(() => [(b.x + 0.5) / at.w, 1 - (b.y + 0.5) / at.h]) }; }
      const uv = q.vl.map((p) => {
        const xp = cfg.cx + p[0] * 16, yp = cfg.suelo - p[1] * 16, zp = cfg.zc - p[2] * 16;
        const kd = q.tex[0]; let tx = kd === 'f' ? xp : kd === 'b' ? 2 * cfg.cx - xp : kd === 'l' ? zp : R.w - zp;
        tx = Math.min(R.w - 0.02, Math.max(0.02, tx)); const ty = Math.min(R.h - 0.02, Math.max(0.02, yp));
        return [(R.x + tx) / at.w, 1 - (R.y + ty) / at.h];
      });
      return { tex: true, uv };
    }
    return () => (G.personaje3d && (cfg.sinTextura || cfg.celdas || (G.CRIATURA3D_SPRITES && G.CRIATURA3D_SPRITES[id])) ? { id, BRILLO, TONO_TEX, MAX_TRIANGULOS, doble: !!cfg.doble, fijo: !!cfg.fijo, sombra: cfg.sombra, YAW: G.personaje3d.YAW, girar: G.personaje3d.girar, velocidad: vel, pose, geometria, atlas, uvPoligono } : null);
  }
  // ── animación (misma topología siempre: solo se mueven vértices) ──
  const escala = (v, f) => v.map((p) => [p[0] * f[0], p[1] * f[1], p[2] * f[0]]);
  const animaNimbel = (po, q, v) => { const r = Math.sin(po.fase); return escala(v, [1 - 0.02 * r, 1 + 0.035 * r]); };   // respira: sube un 3,5 % y se afina un 2 %
  const animaArenel = (po, q, v) => {
    const m = /^pata(\d)/.exec(q.pieza); if (m && po.moving) { const g = (+m[1]) % 2, s = Math.sin(po.fase + g * Math.PI), dz = 0.014 * s, dy = 0.012 * Math.max(0, s); return v.map((p) => [p[0], p[1] + dy, p[2] + dz]); }
    if (/^(ojo|pupila|brillo|pedunculo)_/.test(q.pieza) && !po.moving) { const s = 0.012 * (0.5 + 0.5 * Math.sin(po.fase)); return v.map((p) => [p[0], p[1] + s, p[2]]); }   // parado: los ojos suben y bajan despacio
    return v;
  };

  const animaSomnel = (po, q, v) => {
    if (/^estrella/.test(q.pieza)) { const a = po.fase * 0.8, c = Math.cos(a), si = Math.sin(a), C = SOM_ESTRELLA, by = 0.025 * Math.sin(po.fase * 0.9); return v.map((p) => { const dx = p[0] - C[0], dz = p[2] - C[2]; return [C[0] + dx * c + dz * si, p[1] + by, C[2] - dx * si + dz * c]; }); }   // flota y gira
    const r = Math.sin(po.fase); let w = escala(v, [1 - 0.015 * r, 1 + 0.03 * r]);   // respira despacio (está dormido)
    if (/^borla/.test(q.pieza)) w = w.map((p) => [p[0] + 0.012 * Math.sin(po.fase * 1.3), p[1], p[2]]);
    const m = /^pata(\d)/.exec(q.pieza); if (m && po.moving) { const g = (+m[1]) % 2, s2 = Math.sin(po.fase + g * Math.PI); w = w.map((p) => [p[0], p[1] + 0.012 * Math.max(0, s2), p[2] + 0.014 * s2]); }
    return w;
  };
  const MODELOS = { nubecin: { cfg: NIM, construir: nimbel, anima: animaNimbel, vel: (mv) => (mv ? (2 * Math.PI) / 1.6 : (2 * Math.PI) / 3.0) }, arenel: { cfg: ARE, construir: arenel, anima: animaArenel, vel: (mv) => (mv ? (2 * Math.PI) / 0.5 : (2 * Math.PI) / 2.5) }, somnin: { cfg: SOM, construir: somnel, anima: animaSomnel, vel: (mv) => (mv ? (2 * Math.PI) / 0.7 : (2 * Math.PI) / 3.5) } };
  Object.keys(MODELOS).forEach((id) => { const M = MODELOS[id]; if (G.criatura3d && G.criatura3d.registrar) G.criatura3d.registrar(id, fabrica(id, M.cfg, M.construir, M.anima, M.vel)); });
  G.criatura3dModelos = { MODELOS, nimbel, arenel, somnel, NIM, ARE, SOM, luzK, texDe, fabrica, B: { anillo, tubo, caja, esfera, quad, decal, tapa, mezcla } };   // fabrica y B: los reutiliza src/objeto3d.js (decoración fija)
})(typeof window !== 'undefined' ? window : globalThis);
