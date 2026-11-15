// formas_base.js — ayudantes comunes de dibujo (paso 1.2, v2.7): los que usan varias líneas de elementos distintos, y def2/set, que enlazan un dibujo con su entrada de src/lineas.js.
// Se exponen en G.F; cada src/formas_<elemento>.js los toma de ahí. Se carga ANTES que los archivos de elemento (orden en src/orden.json).
// Si un ayudante pasa a usarse en dos elementos, se mueve aquí; si lo usa uno solo, vive en el archivo de ese elemento.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const mk = (dir, px0, W) => ({ side: dir === 'left' || dir === 'right', px: dir === 'right' ? (col, x, y, w, h) => px0(col, W - x - (w || 1), y, w, h) : px0 });

  const inEll = (x, y, cx, cy, rx, ry, egg) => { const dy = (y + 0.5 - cy) / ry; if (Math.abs(dy) > 1) return false; return Math.abs(x + 0.5 - cx) <= rx * Math.sqrt(1 - dy * dy) * (1 + (egg || 0) * dy); };

  const ell = (px, W, H, cx, cy, rx, ry, egg, col) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inEll(x, y, cx, cy, rx, ry, egg)) px(typeof col === 'function' ? col(x, y) : col, x, y); };

  const set = (id, size, draw) => { G.defCreature(id, { native: true, draw }); if (G.TRAITS[id].size[0] !== size[0] || G.TRAITS[id].size[1] !== size[1]) throw new Error('tamaño distinto en ' + id); }; // como def2, pero comprueba que el tamaño del dibujo es el del registro

  const def2 = (id, draw) => G.defCreature(id, { native: true, draw }); // los datos de la criatura salen de src/lineas.js (paso 1.1); aquí solo el dibujo

  const sym = (px, W, col, x, y, w, h) => { px(col, x, y, w || 1, h || 1); px(col, W - x - (w || 1), y, w || 1, h || 1); };

  const rows = (px, list, colFn) => list.forEach(([y, a, b]) => { for (let x = a; x <= b; x++) px(colFn(x, y, a, b), x, y); });

  const vfill = (px, y, a, b, col) => { for (let x = a; x <= b; x++) px(typeof col === 'function' ? col(x) : col, x, y); };

  // ═══ Bloque 2 · lote B1 (v1.6, rehecho en v1.6b tras las críticas del usuario): Zumbel → Zumbarix (Eléctrico) y Arenel → Arenax (Roca). ═══
  // Reglas de la v1.6b (investigadas): una sola cara clara por criatura; ojos GRANDES (3×3, en cúpula, con pupila y brillo) y SIMÉTRICOS (se dibujan con `sym` sobre el eje del lienzo: el ojo derecho es el reflejo exacto del izquierdo);
  // la cabeza se separa del cuerpo; la silueta debe decir «abejorro» y «cangrejo» sin color. tools/ojos.py mide el desfase de los ojos de la vista frontal (debe ser ≈ 0).
  // Dos estilos de ojo (v1.6b), los dos GRANDES, planos y centrados: Ei = ojo oscuro de 2×3 con un brillo (para caras de color: abejorros); Ew = ojo blanco de 3×3 en cúpula con pupila (ojos de cangrejo en pedúnculo; look −1/0/+1 mueve la pupila).
  const Ei = (px, x, y, INK) => { px(INK, x, y, 2, 3); px('#ffffff', x, y); };

  const Ew = (px, x, y, INK, look) => { px('#fffdf5', x + 1, y); px('#fffdf5', x, y + 1, 3, 2); px(INK, x + 1 + (look || 0), y + 1, 1, 2); };

  // ═══ Bloque 2 · lote B2 (v1.7): Perlel → Perlorix (Agua, Rara) y Arcel → Arcarex (Eléctrico, Rara). Mismas reglas que la v1.6b: una sola cara clara, ojos grandes y simétricos (con `sym`), silueta que dice qué es sin color. ═══
  // Ayudantes del lote: eli = elipse recortada a un rango de filas; scal = media concha «de abanico» (columnas de relieve que sobresalen 1 px).
  const eli = (px, cx, cy, rx, ry, y1, y2, W, col) => { for (let y = y1; y <= y2; y++) for (let x = 0; x < W; x++) if (inEll(x, y, cx, cy, rx, ry, 0)) px(col(x, y), x, y); };

  const scal = (px, W, cx, cy, rx, ry, valley, y1, y2, col) => { for (let x = 0; x < W; x++) { const d = (x + 0.5 - cx) / rx; if (Math.abs(d) > 1) continue; const h = ry * Math.sqrt(1 - d * d), v = valley(x); for (let y = y1; y <= y2; y++) { const t = y + 0.5 - cy; if (t >= -h + Math.max(v, 0) && t <= h + Math.min(v, 0)) px(col(x, y), x, y); } } };

  G.F = { mk, inEll, ell, set, def2, sym, rows, vfill, Ei, Ew, eli, scal };
})();
