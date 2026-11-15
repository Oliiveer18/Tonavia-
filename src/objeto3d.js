// objeto3d.js — REGISTRO DE OBJETOS 3D (decoración fija del HD-2D; v2.246). PURO: sin Three.js, sin DOM, sin Math.random. Igual que G.criatura3d pero para piezas del catálogo (G.OBJETOS) que no tienen `vol`:
// cada pieza se registra con su tipo y una fábrica de módulo (misma interfaz: geometria, atlas, uvPoligono, BRILLO…), construida con src/criatura3d_modelos.js (`fabrica` y los constructores `B`). El modelo mira al sur (+z) y es
// estático; el pintor HD-2D (modo 'modelo') crea UNA geometría por tipo y una malla por ejemplar (con un giro de 90° repetible según su casilla para que no salgan todas iguales). La textura es el dibujo 2D de la pieza
// proyectado (G.CRIATURA3D_SPRITES[tipo], solo vista «f»; generado por tools/generar_sprites3d.py). Método y lecciones: docs/GUIA_MODELADO_3D.md · lista de piezas por hacer: docs/LISTA_DECORACIONES_3D.md.
// Interruptor: G.objeto3d.AJUSTES.ACTIVO = false → todas vuelven a ser láminas.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), U = 1 / 16, REG = {}, AJUSTES = { ACTIVO: true };
  function registrar(tipo, fabrica) { if (typeof tipo !== 'string' || typeof fabrica !== 'function') throw new Error('objeto3d.registrar(tipo, fabrica)'); REG[tipo] = fabrica; }
  const tipos = () => Object.keys(REG);
  const de = (tipo) => (AJUSTES.ACTIVO && Object.prototype.hasOwnProperty.call(REG, tipo) ? REG[tipo]() : null);
  const M = G.criatura3dModelos;
  if (M && M.fabrica) {
    const B = M.B, Y = (suelo) => (y) => (suelo - y) * U, S = (px) => px * U;
    // ROCA (sprite 16×12; 1 casilla, sólida): masa única de 6 cortes con 9 lados, achatada y con bultos suaves; la textura del 2D da las caras con luz y sombra
    const ROCA = { cx: 8, suelo: 12, zc: 8, sombra: { rw: 0.95, rd: 0.7 } };
    const roca = () => {
      const y = Y(ROCA.suelo), out = [], cortes = [[1.6, 6, 5], [2.6, 10, 8], [4, 14, 11], [7, 15, 12], [10, 14, 11], [11.7, 11, 9]];
      B.tubo(out, 'roca', cortes.map(([py, w, d], i) => B.anillo(S(w / 2), S(d / 2), 2.6, 9, 0, y(py), 0, { amp: 0.07, frec: 3, fase: i * 1.1 })), [0, y(6), 0], '#8d8a99', '#615e6f', true, true);
      return out;
    };
    registrar('roca', M.fabrica('roca', ROCA, roca, null, () => 0));

    // PIEDRAS (sprite 14×8): dos piedras pequeñas (una de 6 px y otra de 5 px) con la misma textura de piedra que la roca
    const PIEDRAS = { cx: 7, suelo: 8, zc: 7, sombra: { rw: 0.8, rd: 0.4 } };
    const piedras = () => {
      const y = Y(PIEDRAS.suelo), out = [], una = (nombre, ox, oz, cortes) => B.tubo(out, nombre, cortes.map(([py, w, d], i) => B.anillo(S(w / 2), S(d / 2), 2.4, 7, S(ox), y(py), S(oz), { amp: 0.06, frec: 3, fase: i })), [S(ox), y(5.5), S(oz)], '#8d8a99', '#615e6f', true, true);
      una('piedra_a', -3, 0.5, [[2.8, 3.5, 3], [3.6, 6, 5], [5.5, 7, 6], [7.4, 6, 5], [8, 4.5, 4]]); una('piedra_b', 3.5, -0.8, [[4.4, 3, 2.6], [5.2, 5, 4.2], [6.6, 6, 5], [7.7, 5, 4.2], [8, 4, 3.4]]);
      return out;
    };
    registrar('piedras', M.fabrica('piedras', PIEDRAS, piedras, null, () => 0));
    // HIERBA ALTA (v2.250, simplificada a petición del usuario): una mata GRANDE y fácil de ver, de bajo polígono como las rocas: cinco hojas anchas en forma de pirámide (una alta en el centro y cuatro abiertas alrededor),
    // sin textura, en solo DOS verdes con corte duro (oscuro abajo, claro en la mitad de arriba) y sombreado plano por caras. Sin finuras: se lee de un vistazo desde la cámara.
    const HIERBA = { cx: 8, suelo: 14, zc: 8, sinTextura: true, sombra: { rw: 0.7, rd: 0.35 } };
    const hierbaAlta = () => {
      const out = [], OSC = '#3b8d50', CLA = '#8fd36e', hojas = [[0, 0, 0.78, 0], [0.2, 0.05, 0.55, 0.2], [-0.2, 0.08, 0.5, -0.2], [0.05, 0.22, 0.52, 0.15], [-0.05, -0.2, 0.46, -0.15]];   // [x, z, alto, abertura] en u
      hojas.forEach(([x, z, h, ab], k) => {
        const n0 = out.length, ax = ab, az = k % 2 ? -ab * 0.6 : ab * 0.6;
        B.tubo(out, 'hoja' + k, [[0, 0.3, 0.2, 0], [h * 0.5, 0.2, 0.14, 0.5], [h, 0.02, 0.02, 1]].map(([py, w, d, f]) => B.anillo(w / 2, d / 2, 2, 4, x + ax * f * f, py, z + az * f * f)), [x, h / 2, z], CLA, OSC, true, false, { liso: true });
        for (let i = n0; i < out.length; i++) out[i].cv = out[i].v.map((v) => (v[1] < h * 0.45 ? OSC : CLA));
      });
      return out;
    };
    registrar('hierba_alta', M.fabrica('hierba_alta', HIERBA, hierbaAlta, null, () => 0));
    // BARRIL (sprite 14×16): cuerpo de 10 lados con la panza de un barril; la textura del 2D da las duelas y los aros; tapa azul
    const BARRIL = { cx: 7, suelo: 16, zc: 7, sombra: { rw: 0.8, rd: 0.5 } };
    const barril = () => {
      const y = Y(BARRIL.suelo), out = [], cortes = [[3, 11, 11], [5, 13, 13], [9, 14, 14], [13, 13.5, 13.5], [15.6, 11.5, 11.5]];
      B.tubo(out, 'barril', cortes.map(([py, w, d]) => B.anillo(S(w / 2), S(d / 2), 2, 10, 0, y(py), 0)), [0, y(9), 0], '#4d7fd6', '#35559a', true, true);
      return out;
    };
    registrar('barril', M.fabrica('barril', BARRIL, barril, null, () => 0));
    // CARTEL (sprite 56×40, v2.248): poste y dos tablones de madera en color liso (todas las caras) y, delante, dos paneles con la textura del 2D (letrero con el NOMBRE del pueblo y la flecha azul); por detrás es madera lisa
    const CARTEL = { cx: 28, suelo: 40, zc: 4, fijo: true, sombra: { rw: 1.0, rd: 0.4 } };
    const cartel = () => {
      const y = Y(CARTEL.suelo), out = [], X = (px) => S(px - CARTEL.cx), W = '#c48b52', WD = '#6b4226', WM = '#8f5c33';
      const caja = (nom, x0, x1, y0, y1, z0, z1, col, colB) => B.caja(out, nom, X((x0 + x1) / 2), y((y0 + y1) / 2), S((z0 + z1) / 2), S(x1 - x0), S(y1 - y0), S(z1 - z0), S(0.3), col, colB, false, { liso: true });
      const panel = (nom, x0, x1, y0, y1, z) => B.quad(out, nom, [[X(x0), y(y1), S(z)], [X(x1), y(y1), S(z)], [X(x1), y(y0), S(z)], [X(x0), y(y0), S(z)]], [X((x0 + x1) / 2), y((y0 + y1) / 2), S(z - 2)], W, WD);
      caja('poste', 25, 31, 14, 40, -1.5, 1.5, WM, WD); caja('letrero', 2, 54, 3, 16, -1.2, 1.4, W, WD); caja('flecha', 13, 41, 20, 28, -1, 1.2, W, WD);
      panel('letrero_texto', 2, 54, 3, 16, 1.42); panel('flecha_texto', 13, 41, 20, 28, 1.22);
      return out;
    };
    registrar('cartel', M.fabrica('cartel', CARTEL, cartel, null, () => 0));
    // JUNCOS (2 y 3 tallos; sprite 12×20) y NENÚFARES (sprite 10×5), lote 2 (v2.251): formas simples de bajo polígono, sin textura, en pocos colores como el resto
    const juncos = (n) => () => {
      const out = [], TALLO = '#5aa05a', OSC = '#3b7a45', ESP = '#8b5a2b', ESPO = '#5c3a1e', xs = n === 2 ? [-0.16, 0.14] : [-0.22, 0.02, 0.22], hs = n === 2 ? [1.15, 0.9] : [1.05, 1.25, 0.85];
      xs.forEach((x, k) => {
        const h = hs[k], lean = (k - (n - 1) / 2) * 0.07, e0 = out.length;
        B.tubo(out, 'tallo' + k, [[0, 0.13, 0.13, 0], [h * 0.5, 0.1, 0.1, 0.5], [h, 0.05, 0.05, 1]].map(([py, w, d, f]) => B.anillo(w / 2, d / 2, 2, 4, x + lean * f, py, 0)), [x, h / 2, 0], TALLO, OSC, true, false, { liso: true });
        B.tubo(out, 'espiga' + k, [[h * 0.62, 0.12, 0.12, 0.62], [h * 0.76, 0.2, 0.2, 0.76], [h * 0.9, 0.16, 0.16, 0.9], [h * 0.98, 0.06, 0.06, 0.98]].map(([py, w, d, f]) => B.anillo(w / 2, d / 2, 2, 6, x + lean * f, py, 0)), [x, h * 0.8, 0], ESP, ESPO, true, true, { liso: true });
      });
      return out;
    };
    registrar('juncos2', M.fabrica('juncos2', { cx: 6, suelo: 20, zc: 6, sinTextura: true, sombra: { rw: 0.01, rd: 0.01 } }, juncos(2), null, () => 0));
    registrar('juncos3', M.fabrica('juncos3', { cx: 6, suelo: 20, zc: 6, sinTextura: true, sombra: { rw: 0.01, rd: 0.01 } }, juncos(3), null, () => 0));
    const nenufar = (flor) => () => {
      const out = [], H = 0.03;
      B.tubo(out, 'hoja', [[H + 0.05, 0.1, 0.1], [H + 0.05, 0.62, 0.56], [H, 0.7, 0.64]].map(([py, w, d]) => B.anillo(w / 2, d / 2, 2, 10, 0, py, 0)), [0, H, 0], '#4aa05a', '#2f7a4a', true, true, { liso: true });
      if (flor) B.tubo(out, 'flor', [[H + 0.34, 0.04, 0.04], [H + 0.2, 0.26, 0.26], [H + 0.07, 0.2, 0.2]].map(([py, w, d]) => B.anillo(w / 2, d / 2, 2, 6, 0.05, py, 0)), [0.05, H + 0.2, 0], '#f5a8bd', '#d9708f', true, true, { liso: true });
      return out;
    };
    registrar('nenufar', M.fabrica('nenufar', { cx: 5, suelo: 5, zc: 3, sinTextura: true, sombra: { rw: 0.01, rd: 0.01 } }, nenufar(false), null, () => 0));
    registrar('nenufar_flor', M.fabrica('nenufar_flor', { cx: 5, suelo: 5, zc: 3, sinTextura: true, sombra: { rw: 0.01, rd: 0.01 } }, nenufar(true), null, () => 0));

    // ───── LOTE 3 (v2.252): vallas, espantapájaros, huerto y puente. Todo de bajo polígono, sin textura, con la paleta de madera del 2D. Origen local = centro de la PRIMERA casilla de la pieza (el pintor coloca la malla ahí). ─────
    const WL = '#c48b52', WM = '#8f5c33', WD = '#6b4226', INKC = '#2b2233';
    const bloque = (out, nom, x0, x1, y0, y1, z0, z1, col) => {   // caja sin base (5 caras), colores lisos; la normal se orienta sola respecto al centro
      const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], q = (v) => B.quad(out, nom, v, c, col, col, { liso: true });
      q([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]); q([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]); q([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]);
      q([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]); q([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]);
    };
    // VALLAS (sprites 43×14, 132×14 y 6×96; 1 casilla de grosor): postes en los extremos, listones cada 6 px y dos travesaños detrás. Se miran de lado, fijas al sur (cfg.fijo). `eje` 'x' = tendida de oeste a este, 'z' = de norte a sur.
    const valla = (len, postes, eje, desde) => () => {
      const out = [], A = (px) => (px + desde) * U, bl = (nom, a0, a1, h0, h1, c0, c1, col) => (eje === 'x' ? bloque(out, nom, A(a0), A(a1), h0 * U, h1 * U, c0 * U, c1 * U, col) : bloque(out, nom, c0 * U, c1 * U, h0 * U, h1 * U, A(a0), A(a1), col));
      bl('trav_alto', 0, len, 8, 10, -3.2, -0.6, WM); bl('trav_bajo', 0, len, 3, 5, -3.2, -0.6, WM);
      for (let x = 1; x + 4 <= len; x += 6) { bl('listón' + x, x, x + 4, 0, 11, -1, 1, WL); bl('punta' + x, x + 1, x + 3, 11, 12.4, -1, 1, WL); }
      postes.forEach((p, i) => { bl('poste' + i, p, p + 4, 0, 14, -2, 2, WM); bl('capa' + i, p - 0.4, p + 4.4, 14, 15, -2.4, 2.4, WL); });
      return out;
    };
    const VALLA = { cx: 0, suelo: 0, zc: 0, fijo: true, sinTextura: true, sombra: { rw: 0.01, rd: 0.01 } };
    registrar('valla_ni', M.fabrica('valla_ni', VALLA, valla(41, [0, 39], 'x', -2), null, () => 0));   // sprite ox 6: el primer píxel cae a (6 - 8) px del centro de la casilla
    registrar('valla_nd', M.fabrica('valla_nd', VALLA, valla(41, [0, 39], 'x', -9), null, () => 0));   // ox -1
    registrar('valla_9', M.fabrica('valla_9', VALLA, valla(130, [0, 128], 'x', -2), null, () => 0));
    registrar('valla_v', M.fabrica('valla_v', VALLA, valla(94, [0, 90], 'z', -8), null, () => 0));
    // ESPANTAPÁJAROS (sprite 22×32, 1 casilla): poste y travesaño de madera, camisa mitad azul (Lali) y mitad rosa (Oli) con una franja dorada, cabeza con ojos y sombrero de paja con cinta rosa
    const espantapajaros = () => {
      const out = [], X = (px) => (px - 11) * U, H = (py) => py * U, R = '#f5a8bd', Z = '#4d7fd6', PAJA = '#e9c470', PAJAS = '#b8903e';
      bloque(out, 'poste', X(10), X(13), 0, H(26), -0.07, 0.07, WM); bloque(out, 'brazos', X(1), X(21), H(18), H(21), -0.06, 0.06, WM);
      B.caja(out, 'camisa_a', X(8), H(16.5), 0, 6 * U, 11 * U, 0.4, 0.05, Z, '#35559a'); B.caja(out, 'camisa_r', X(14), H(16.5), 0, 6 * U, 11 * U, 0.4, 0.05, R, '#e47a9a');
      bloque(out, 'franja', X(10), X(12), H(11), H(22), 0.2, 0.215, '#f7d54a');
      bloque(out, 'manga_a', X(1), X(5.5), H(17), H(20), -0.1, 0.1, Z); bloque(out, 'manga_r', X(16.5), X(21), H(17), H(20), -0.1, 0.1, R);
      bloque(out, 'mano_a', X(0), X(2), H(16), H(18.5), -0.08, 0.08, PAJA); bloque(out, 'mano_r', X(20), X(22), H(16), H(18.5), -0.08, 0.08, PAJA);
      B.esfera(out, 'cabeza', [0, H(27), 0], 0.26, 8, 6, '#f2c9a0', '#d9a273', { liso: true });
      bloque(out, 'ojo_a', X(8.6), X(10), H(26.2), H(27.6), 0.23, 0.27, INKC); bloque(out, 'ojo_b', X(12), X(13.4), H(26.2), H(27.6), 0.23, 0.27, INKC); bloque(out, 'boca', X(9.4), X(12.6), H(24.4), H(25.2), 0.23, 0.27, INKC);
      B.tubo(out, 'ala', [[H(29.2), 0.44, 0.44], [H(28.2), 0.5, 0.5]].map(([py, w, d]) => B.anillo(w, d, 2, 10, 0, py, 0)), [0, H(28.7), 0], PAJA, PAJAS, true, true, { liso: true });
      B.tubo(out, 'copa', [[H(32), 0.17, 0.17], [H(31), 0.25, 0.25], [H(29.2), 0.27, 0.27]].map(([py, w, d]) => B.anillo(w, d, 2, 9, 0, py, 0)), [0, H(30.5), 0], PAJA, PAJAS, true, false, { liso: true });
      B.tubo(out, 'cinta', [[H(30.2), 0.275, 0.275], [H(29.2), 0.275, 0.275]].map(([py, w, d]) => B.anillo(w, d, 2, 9, 0, py, 0)), [0, H(29.7), 0], R, '#e47a9a', false, false, { liso: true });
      return out;
    };
    registrar('espantapajaros', M.fabrica('espantapajaros', { cx: 0, suelo: 0, zc: 0, fijo: true, sinTextura: true, sombra: { rw: 0.5, rd: 0.25 } }, espantapajaros, null, () => 0));
    // HUERTO (sprite 112×96 = 7×6 casillas, pieza de suelo): losa de tierra, seis caballones elevados y 54 plantas (9 por fila; col, zanahoria, tomate con tutor, calabaza y lechuga, como en el 2D)
    const huerto = () => {
      const out = [], X = (px) => (px - 8) * U, ZZ = (py) => (py - 8) * U, TOP = 0.13, G1 = '#5dae5a', G2 = '#3d8446', G3 = '#7cc972';
      bloque(out, 'tierra', X(0), X(112), 0, 0.04, ZZ(0), ZZ(96), '#7a4a2b');
      for (let r = 0; r < 6; r++) {
        const y = 4 + r * 15; bloque(out, 'camino' + r, X(4), X(108), 0.04, 0.06, ZZ(y), ZZ(y + 2), '#a96f46'); bloque(out, 'cabellón' + r, X(4), X(108), 0.04, TOP, ZZ(y + 2), ZZ(y + 9), '#8f5c33');
        for (let c = 0; c < 9; c++) {
          const px = X(7 + c * 11 + 5), pz = ZZ(3 + r * 15 + 6), t = r % 5, nom = 'p' + r + '_' + c, ring = (arr, cx, cz, n) => arr.map(([py, w]) => B.anillo(w, w, 2, n || 6, cx, py, cz));
          if (t === 0) { B.tubo(out, nom + 'h', ring([[TOP + 0.04, 0.2], [TOP, 0.28]], px, pz, 7), [px, TOP, pz], G2, G2, true, false, { liso: true }); B.esfera(out, nom, [px, TOP + 0.16, pz], 0.2, 7, 4, '#8fd0b8', '#5d9e8f', { liso: true }); }
          else if (t === 1) { for (let k = 0; k < 3; k++) { const a = k * 2.1 + c, lx = px + Math.cos(a) * 0.09, lz = pz + Math.sin(a) * 0.09; B.tubo(out, nom + 'f' + k, [[TOP + 0.4, 0.015, lx + Math.cos(a) * 0.1, lz + Math.sin(a) * 0.1], [TOP + 0.2, 0.05, lx + Math.cos(a) * 0.04, lz + Math.sin(a) * 0.04], [TOP, 0.06, lx, lz]].map(([py, w, x2, z2]) => B.anillo(w, w, 2, 4, x2, py, z2)), [lx, TOP + 0.2, lz], k === 1 ? G1 : G2, G2, true, false, { liso: true }); } B.tubo(out, nom + 'z', ring([[TOP + 0.07, 0.07], [TOP, 0.1]], px, pz, 6), [px, TOP, pz], '#f09a3e', '#d4781f', true, false, { liso: true }); }
          else if (t === 2) { bloque(out, nom + 't', px - 0.02, px + 0.02, TOP, TOP + 0.62, pz - 0.02, pz + 0.02, WM); B.esfera(out, nom + 'h', [px, TOP + 0.22, pz], 0.2, 7, 4, G1, G2, { liso: true }); B.esfera(out, nom + 'a', [px - 0.14, TOP + 0.2, pz + 0.16], 0.075, 6, 3, '#d94a3f', '#a8322f', { liso: true }); B.esfera(out, nom + 'b', [px + 0.15, TOP + 0.32, pz + 0.12], 0.075, 6, 3, '#d94a3f', '#a8322f', { liso: true }); }
          else if (t === 3) { B.tubo(out, nom, ring([[TOP + 0.36, 0.05], [TOP + 0.3, 0.26], [TOP + 0.16, 0.34], [TOP + 0.02, 0.24]], px, pz, 8), [px, TOP + 0.18, pz], '#f09a3e', '#d4781f', true, true, { liso: true }); bloque(out, nom + 'r', px - 0.03, px + 0.03, TOP + 0.34, TOP + 0.46, pz - 0.03, pz + 0.03, WM); }
          else { B.tubo(out, nom + 'o', ring([[TOP + 0.1, 0.2], [TOP + 0.02, 0.36]], px, pz, 7), [px, TOP, pz], G2, G2, true, false, { liso: true }); B.tubo(out, nom, ring([[TOP + 0.3, 0.1], [TOP + 0.18, 0.24], [TOP + 0.06, 0.28]], px, pz, 7), [px, TOP + 0.15, pz], G3, G1, true, false, { liso: true }); }
        }
      }
      return out;
    };
    registrar('huerto', M.fabrica('huerto', { cx: 0, suelo: 0, zc: 0, fijo: true, sinTextura: true, sombra: { rw: 0.01, rd: 0.01 } }, huerto, null, () => 0));
    // PUENTE (sprite 50×50 = 3×3 casillas «b»): cubierta de tablones con huecos, dos vigas laterales bajas y barandilla (3 postes y pasamanos por lado)
    const puente = () => {
      const out = [], X = (px) => (px - 9) * U, DK = 0.03;
      bloque(out, 'viga_base', X(1), X(49), 0, DK, X(1), X(49), WM);
      for (let y = 0; y < 48; y += 4) bloque(out, 'tablón' + y, X(6), X(44), DK, DK + 0.05, X(1 + y), X(1 + y + 3), y % 8 ? WL : '#b27a45');
      [[1, 6], [44, 49]].forEach(([a, b], i) => {
        bloque(out, 'viga' + i, X(a), X(b), 0, 0.3, X(1), X(49), WL);
        [3, 25, 47].forEach((z, k) => bloque(out, 'poste' + i + k, X(a), X(b), 0.3, 0.78, X(z - 1.6), X(z + 1.6), WM));
        bloque(out, 'pasamanos' + i, X(a - 0.4), X(b + 0.4), 0.78, 0.9, X(1), X(49), WL);
      });
      return out;
    };
    registrar('puente_albanota', M.fabrica('puente_albanota', { cx: 0, suelo: 0, zc: 0, fijo: true, sinTextura: true, sombra: { rw: 0.01, rd: 0.01 } }, puente, null, () => 0));
  }
  G.objeto3d = { AJUSTES, registrar, tipos, de };
})(typeof window !== 'undefined' ? window : globalThis);
