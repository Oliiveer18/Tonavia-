// volumenes_tex.js — TEXTURAS POR CARA de los volúmenes del HD-2D (v2.68, paso B2a de docs/FICHAS_EDIFICIOS_3D.md). Dibujadas por código con Canvas2D y la paleta del juego (G.PAL): sin imágenes, sin Three.js, sin azar.
// Para cada polígono que saca G.volumenes.geometria (muro, nicho, faldón, hastial, losa) devuelve un lienzo de píxeles: 1 u = 16 px (1 texel = 1 px del 2D) y el eje v del polígono hacia arriba (la parte de abajo del lienzo es el suelo / el alero).
// Luz FIJA arriba-izquierda con los tres tonos de la ficha: «luz» (oeste), «base» (sur: el dibujo de hoy) y «sombra» (este y norte). Cada material es una cadena de 6 colores de claro a oscuro y el tono la desplaza un paso: así «base» es exactamente la paleta del 2D y «luz» / «sombra» solo usan colores vecinos de la misma cadena.
// v2.72 (paso C): `vol.variante` ('lali' | 'oli' | 'lab', ver VARIANTES) cambia materiales sobre el mismo estilo `casa`: postigos y flores azules (Lali) o rosas (Oli); pizarra azul verdosa y ventana de lente (laboratorio).
// Estilo `casa` (la Casa de Lali, paso de prueba): paredes de yeso con entramado y zócalo de piedra, dos ventanas con postigos en cada lado, trasera con ventana pequeña, tejado de escamas rojas con cumbrera y alero, hastiales con ventana redonda del desván.
// v2.69 (B2b): además chimenea, corona, boca, poste y la campana de la veleta, y `atlas(tipo, geo)` que junta todas las texturas de un edificio en un lienzo de 256 px de ancho (lo que usa el pintor HD-2D).
// La fachada sur NO se redibuja: se recorta del dibujo 2D de la pieza (campo `vol.fachada` = [x, y, ancho, alto] de la pared en ese dibujo), tal como pide la ficha («la fachada sur es el dibujo 2D de hoy»).
(function (root) {
  'use strict';
  const G = root.G, P = G.PAL, PX = 16;
  const ESTILOS = ['casa', 'centro', 'tienda', 'ermita', 'fuente', 'farola', 'banco', 'maceta'], SIN_FACHADA = ['fuente', 'farola', 'banco', 'maceta'];   // v2.86 (paso D): + Centro PC, Tienda, Ermita y Fuente
  const K = { luz: 0, base: 1, sombra: 2 }; // cuánto se desplaza cada tono dentro de la cadena de un material
  const CADENAS = { // de claro a oscuro; con el tono «base» el color principal es el 3.º (índice 2), «hi» el 2.º, «lo» el 4.º y «ln» el 5.º
    yeso:   ['#fffbea', '#fff6dc', P.cream, P.cream2, '#d3bb86', '#b9a06c'],
    madera: ['#d9a574', P.wood1, P.wood3, P.woodD, '#4a2c18', '#2f1b0f'],
    piedra: ['#b2afbf', P.stone1, P.stone2, P.stone3, '#4a475a', '#35323f'],
    teja:   ['#f5a899', '#ea6a58', P.red, P.red2, '#7c2a28', '#5a1d1c'],
    azul:   ['#8ae0dc', P.teal, P.teal2, '#1f6065', '#154347', '#0e2f32'],       // postigos azul verdoso
    cristal: ['#c9defa', '#8fb4f0', '#6fa4e8', P.blue, P.blue2, '#2f4a86'],
    hoja:   ['#9ad88f', '#7cc972', P.green, P.green2, '#2c6335', '#20482a'],
    rosa:   ['#fbc7d5', '#f8b6c9', P.pink, P.pink2, '#c25a7c', '#9c4263'],
    oro:    ['#fbe58a', '#f9dd67', P.yellow, '#d9a52e', '#b08420', '#8a6616'],
    // v2.72 (paso C): materiales de las variantes (postigos y flores de Lali y Oli, pizarra del laboratorio); con el tono «base» salen EXACTAMENTE los colores del 2D (src/albanota_objetos.js, CASA_V)
    postigoAzul:    ['#b9d3f7', '#8fb4f0', '#4d7fd6', '#35559a', '#2f4a86', '#1f3466'],
    postigoRosa:    ['#fbc7d5', P.pink, '#e47a9a', '#c25a7c', '#9c4263', '#6f2d47'],
    florAzulClara:  ['#ffffff', '#e4eefd', '#cfe0fa', '#a9c6f2', '#7f9fd8', '#5e7cb8'],
    florAzulOscura: ['#4d6fb8', '#3a5aa0', '#2a3f7a', '#22336a', '#1a2858', '#121c3e'],
    florRosaClara:  ['#fff0f4', '#ffe0ea', '#fbc7d5', P.pink, '#e47a9a', '#c25a7c'],
    florRosaOscura: ['#f08bab', '#e9739a', '#e04f7f', '#c23c68', '#9c2c52', '#721e3b'],
    pizarra:        ['#8cc0c8', '#6aa0aa', '#3f7681', '#2d5a65', '#1f3f48', '#14292f'],
    // v2.80 · L2 (1.ª mitad): arena clara del zócalo y los escalones del laboratorio nuevo (colores `arena*` de LABC en src/albanota_objetos.js)
    // v2.86 · paso D: tablas claras de la Tienda (el color principal es el wood1 del 2D) y pizarra azul de la Ermita (hi = el azul claro y md = el azul del dibujo 2D)
    tablas:         ['#f0cca2', '#d9a574', P.wood1, P.wood2, P.wood3, P.woodD],
    pizarraE:       ['#9ab9ea', '#6f9ae0', P.blue2, '#2f4a86', '#223863', '#16264a'],
    // v2.92 · F2: azul de la campana del 2D (hi = BELL_BL, md = BELL_B, lo = WA_S, ln = WA_D con el tono «base») para las piezas redondas de la fuente
    azulCampana:    ['#c9defa', '#8fb4f0', '#4d7fd6', '#35559a', '#2f4a86', '#1f3466'],
    azulTaza:       ['#8fb4f0', '#5b86d6', '#3a5fae', '#2b4688', '#1f3466', '#15244a'],   // la taza grande: más oscura que el agua (WA = #4d7fd6) para que no se confunda con ella
    // v2.102 · objetos pequeños, paso 2 (la farola, colores lisos): hierro oscuro del 2D (ink2 con el tono «base»), hierro claro (greyD) para collarín y remate, y el vidrio amarillo del farol (#fff3b0; el cuerpo lleva siempre el tono «base»)
    hierro:         ['#7a6a8a', '#5a4868', P.ink2, '#33203c', P.ink, '#1d1222'],
    hierroC:        ['#a29cb0', P.grey2, P.greyD, '#48435a', '#383347', P.ink2],
    vidrio:         ['#fffbe0', '#fff8cc', '#fff3b0', '#ffec8a', '#f7d54a', '#d9a52e'],
    // v2.105 · objetos pequeños, banco, paso 2 (colores lisos): madera del 2D (con el tono «luz» sale wood1, con «base» wood3 y con «sombra» woodD) y madera oscura de patas y montantes (luz = wood3, base = woodD, sombra = #4a2c18). Ficha: docs/FICHA_BANCO_3D.md; el paso 3 pone las texturas de píxel (tablones, vetas, filos)
    maderaOsc:      [P.wood1, P.wood3, P.woodD, '#4a2c18', '#2f1b0f', '#1d1222'],
    arenaLab:       ['#f0e6cc', '#e2d2ae', '#c9b48c', '#a8946b', '#7d6a4a', '#5a4a32'],
  };
  // v2.72 · variantes de un mismo estilo (campo `vol.variante`): qué material sustituye a cuál. flA / flB = las dos flores de la jardinera (pares e impares, como en el 2D); redonda = ventana redonda del hastial (r, lente = sin cruz).
  const VARIANTES = {
    lali: { azul: 'postigoAzul', flA: 'florAzulClara', flB: 'florAzulOscura' },
    oli:  { azul: 'postigoRosa', flA: 'florRosaClara', flB: 'florRosaOscura' },
    lab:  { piedra: 'arenaLab', madera: 'arenaLab', redonda: { r: 8, lente: true }, teja: 'azul' }, // v2.80 (L2): paredes de yeso crema (las de siempre), zócalo y marcos de arena clara, franja y tejado turquesa (el color del parapeto del 2D)
  };
  function rampa(mat, tono) { const c = CADENAS[mat], k = K[tono]; if (!c || k === undefined) throw new Error('textura: material o tono desconocido (' + mat + ', ' + tono + ')'); return { hi: c[k], md: c[k + 1], lo: c[k + 2], ln: c[k + 3] }; }
  function rampas(t, vr) {
    const o = {}; Object.keys(CADENAS).forEach((m) => { o[m] = rampa(m, t); }); o.flA = o.oro; o.flB = o.rosa;   // sin variante: flores doradas y rosas, postigos azul verdoso y teja roja
    const V = vr && VARIANTES[vr]; if (V) Object.keys(V).forEach((k) => { if (typeof V[k] === 'string') o[k] = rampa(V[k], t); });
    o.redonda = (V && V.redonda) || { r: 6, lente: false }; return o;
  }

  function lienzo(w, h) { const c = G.makeCanvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false; return { c, x, w, h, f(col, a, b, ww, hh) { x.fillStyle = col; x.fillRect(a, b, ww, hh); }, p(col, a, b) { x.fillStyle = col; x.fillRect(a, b, 1, 1); } }; }
  function disco(l, col, cx, cy, r) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r) l.p(col, x, y); } }

  // ───────────── piezas sueltas (se dibujan con el origen en la esquina de arriba-izquierda de la pared de 48 px) ─────────────
  function poste(l, R, x, y, w, h) { l.f(R.madera.md, x, y, w, h); l.f(R.madera.hi, x, y, 1, h); l.f(R.madera.lo, x + w - 1, y, 1, h); }
  function zocalo(l, R, w, y) { l.f(R.piedra.md, 0, y, w, 6); l.f(R.piedra.hi, 0, y, w, 1); l.f(R.piedra.lo, 0, y + 5, w, 1); for (let x = 2; x < w; x += 7) { l.f(R.piedra.lo, x, y + 1, 1, 2); if (x + 3 < w) l.f(R.piedra.lo, x + 3, y + 3, 1, 2); } }
  function ventana(l, R, vx, gy) { // ventana con postigos y jardinera: las mismas medidas que la fachada del 2D (gy = fila de arriba del marco menos 2)
    const az = R.azul, md = R.madera, cr = R.cristal, ho = R.hoja;
    l.f(az.md, vx - 11, gy - 1, 4, 14); l.f(az.md, vx + 7, gy - 1, 4, 14); [2, 6].forEach((dy) => { l.f(az.lo, vx - 10, gy + dy, 2, 1); l.f(az.lo, vx + 8, gy + dy, 2, 1); }); l.f(az.hi, vx - 11, gy - 1, 1, 14);
    l.f(md.md, vx - 7, gy - 2, 14, 14); l.f(cr.md, vx - 6, gy - 1, 12, 12); l.f(cr.hi, vx - 6, gy - 1, 3, 4); l.f(cr.lo, vx + 2, gy + 6, 4, 5); l.f(md.md, vx - 1, gy - 1, 1, 12); l.f(md.md, vx - 6, gy + 4, 12, 1);
    l.f(md.md, vx - 8, gy + 11, 16, 5); l.f(md.lo, vx - 8, gy + 14, 16, 2); l.f(md.hi, vx - 8, gy + 11, 16, 1); l.f(ho.lo, vx - 7, gy + 8, 14, 3);
    [-6, -2, 2, 5].forEach((dx, i) => { l.f(ho.md, vx + dx - 1, gy + 8, 3, 3); l.f(i % 2 ? R.flB.md : R.flA.md, vx + dx - 1, gy + 6, 2, 2); });
  }
  function ventanaPeq(l, R, vx, y) { const md = R.madera, cr = R.cristal; l.f(md.md, vx - 5, y, 10, 10); l.f(cr.md, vx - 4, y + 1, 8, 8); l.f(cr.hi, vx - 4, y + 1, 2, 3); l.f(md.md, vx, y + 1, 1, 8); l.f(md.md, vx - 4, y + 4, 8, 1); l.f(md.lo, vx - 5, y + 9, 10, 1); }
  function ventanaRedonda(l, R, cx, cy, r, lente) {
    if (lente) { disco(l, R.madera.lo, cx, cy, r + 0.6); disco(l, R.madera.md, cx, cy, r - 0.4); disco(l, R.cristal.md, cx, cy, r - 2); l.f(R.cristal.lo, Math.round(cx + 1), Math.round(cy + 3), 4, 2); l.f(R.cristal.lo, Math.round(cx + 3), Math.round(cy + 1), 2, 2); l.f(R.cristal.hi, Math.round(cx - 4), Math.round(cy - 4), 4, 2); l.f(R.cristal.hi, Math.round(cx - 5), Math.round(cy - 2), 2, 3); return; } // lente del laboratorio: aro grueso, cristal grande con reflejo, sin cruz
    disco(l, R.madera.md, cx, cy, r); disco(l, R.cristal.md, cx, cy, r - 1.7); l.f(R.madera.md, Math.round(cx - r + 1), Math.round(cy), Math.round(2 * r - 2), 1); l.f(R.madera.md, Math.round(cx), Math.round(cy - r + 1), 1, Math.round(2 * r - 2)); l.f(R.cristal.hi, Math.round(cx - r + 3), Math.round(cy - r + 3), 2, 2);
  }

  // ───────────── caras ─────────────
  // Pared de yeso con entramado: alto total h (si h > 48 lo de más es yeso liso por encima), alineada con el suelo abajo. opciones: { ventana: x del centro | null, peq: ventana pequeña en x | null, postes: [x…] }
  function pared(w, h, tono, o, vr) {
    const R = rampas(tono, vr), l = lienzo(w, h), y0 = h - 48, ye = R.yeso;
    l.f(ye.md, 0, 0, w, h); l.f(ye.lo, 0, y0, w, 4);                        // yeso y banda de sombra bajo el alero
    (o.postes || []).forEach(([x, pw]) => poste(l, R, x, y0, pw, 48));
    l.f(R.madera.md, 0, y0 + 4, w, 3); l.f(R.madera.hi, 0, y0 + 4, w, 1); l.f(R.madera.lo, 0, y0 + 6, w, 1); // travesaño
    zocalo(l, R, w, h - 6);
    if (o.ventana != null) ventana(l, R, o.ventana, y0 + 15);
    if (o.peq != null) ventanaPeq(l, R, o.peq, y0 + 14);
    return l;
  }
  const lateral = (w, h, tono, vr) => pared(w, h, tono, { ventana: Math.round(w / 2), postes: [[0, 4], [Math.round(w / 2) - 17, 3], [Math.round(w / 2) + 14, 3], [w - 4, 4]] }, vr);
  const trasera = (w, h, tono, vr) => pared(w, h, tono, { peq: Math.round(w / 2), postes: [[0, 4], [Math.round(w / 3) - 2, 3], [Math.round(w * 2 / 3) - 1, 3], [w - 4, 4]] }, vr);
  const nicho = (w, h, tono, vr) => pared(w, h, tono, { postes: [[0, 4]] }, vr);

  function faldon(w, h, tono, vr) { // escamas por bandas de 4 px: la cumbrera arriba del lienzo y el alero abajo
    const R = rampas(tono, vr), te = R.teja, l = lienzo(w, h);
    for (let y = 0; y < h; y++) { const k = (y / 4) | 0, ly = y % 4, off = (k % 2) * 4; for (let x = 0; x < w; x++) { const lx = (x + off) % 8; let col = te.md; if (ly === 3 && lx !== 0) col = te.lo; else if (lx === 7) col = te.lo; else if (ly === 0 && lx < 7) col = te.hi; l.p(col, x, y); } }
    l.f(te.ln, 0, 0, w, 1); l.f(te.hi, 0, 1, w, 1); l.f(te.lo, 0, 2, w, 2);   // cumbrera
    l.f(R.madera.md, 0, h - 3, w, 2); l.f(R.madera.lo, 0, h - 1, w, 1);       // alero de madera
    return l;
  }
  function hastial(w, h, tono, vr) { // triángulo de yeso con tablas de borde, poste central, viga de abajo y ventana redonda del desván
    const R = rampas(tono, vr), l = lienzo(w, h), md = R.madera;
    l.f(R.yeso.md, 0, 0, w, h);
    for (let y = 0; y < h; y++) { const m = (y / h) * (w / 2); l.f(md.md, Math.floor(w / 2 - m), y, 2, 1); l.f(md.md, Math.ceil(w / 2 + m) - 2, y, 2, 1); }
    poste(l, R, Math.round(w / 2) - 1, 0, 2, h); l.f(md.md, 0, h - 3, w, 3); l.f(md.hi, 0, h - 3, w, 1); l.f(md.lo, 0, h - 1, w, 1);
    ventanaRedonda(l, R, w / 2, h * 0.5, R.redonda.r, R.redonda.lente);
    return l;
  }
  function losa(w, h, tono) { const R = rampas(tono), pi = R.piedra, l = lienzo(w, h); l.f(pi.md, 0, 0, w, h); l.f(pi.hi, 0, 0, w, 1); l.f(pi.lo, 0, h / 2, w, 1); l.f(pi.lo, 0, h - 1, w, 1); l.f(pi.lo, 4, 1, 1, h / 2 - 1); l.f(pi.lo, 11, h / 2 + 1, 1, h / 2 - 2); return l; }

  // ───────────── tejado plano (v2.82 · L3, 1.ª mitad): azotea de arena con juntas, y peto con franja turquesa (el parapeto del 2D) ─────────────
  function cubierta(w, h, tono) { // losas de arena clara de 16 px: junta oscura y filo de luz arriba-izquierda de cada losa
    const R = rampas(tono), ar = R.arenaLab, l = lienzo(w, h);
    l.f(ar.md, 0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { l.f(ar.hi, x + 1, y + 1, Math.min(15, w - x - 1), 1); l.f(ar.hi, x + 1, y + 1, 1, Math.min(15, h - y - 1)); }
    for (let x = 0; x < w; x += 16) l.f(ar.lo, x, 0, 1, h);
    for (let y = 0; y < h; y += 16) l.f(ar.lo, 0, y, w, 1);
    return l;
  }
  function petoCara(w, h, tono) { // 9 px como la franja del 2D (filas 49-57): arriba crema clara, banda turquesa de 5 filas con rayitas de luz, abajo crema
    const R = rampas(tono), ye = R.yeso, az = R.azul, l = lienzo(w, h);
    l.f(ye.lo, 0, 0, w, h); l.f(ye.hi, 0, 0, w, Math.min(2, h)); if (h > 2) l.f(ye.ln, 0, 2, w, 1);
    if (h > 7) { l.f(az.md, 0, 3, w, 5); l.f(az.hi, 0, 3, w, 1); l.f(az.lo, 0, 7, w, 1); for (let x = 3; x < w - 4; x += 10) l.f(az.hi, x, 5, 4, 1); }
    return l;
  }
  function petoCanto(w, h, tono) { const R = rampas(tono), l = lienzo(w, h); l.f(R.yeso.hi, 0, 0, w, h); l.f(R.yeso.md, 0, h - 1, w, 1); return l; }

  // ───────────── cúpula (v2.83 · L3, 2.ª mitad, parte 1): UNA textura para toda la media esfera (equirrectangular: u alrededor, v hacia arriba) y el aro turquesa del tambor ─────────────
  // Mismos colores que la cúpula del 2D: vidrio cálido en tres bandas (#f5a64a abajo, #ffc45e, #ffe08a arriba), luz del nido (#ffe9a8, #fffbe0), nervios turquesa (8 meridianos y un anillo a media altura) y 4 huevos entre los nervios. Es luz propia: no cambia con el tono.
  function domoTex(w, h, r) {
    const l = lienzo(w, h), TQ = P.teal2, nerv = 8, circ = w;
    for (let y = 0; y < h; y++) { const f = Math.sin(Math.min(1, (h - y - 0.5) / PX / r)); // 0 en el borde de abajo, 1 en la punta
      const col = f > 0.62 ? '#ffe08a' : f > 0.3 ? '#ffc45e' : '#f5a64a'; l.f(col, 0, y, w, 1);
      if (f > 0.14 && f < 0.78) l.f(f > 0.3 && f < 0.6 ? '#fffbe0' : '#ffe9a8', 0, y, w, 1); }
    const yAnillo = Math.round(h - 0.34 * PX * r * 1.2); l.f(TQ, 0, yAnillo, w, 1); l.f(TQ, 0, h - 1, w, 1);          // nervio horizontal y borde de abajo
    for (let k = 0; k < nerv; k++) l.f(TQ, Math.round(circ * k / nerv) % w, 0, 1, h);                                  // nervios verticales
    for (let k = 0; k < 4; k++) { const cx = Math.round(circ * (2 * k + 0.5) / nerv); /* entre dos nervios */ const hv = [1, 3, 5, 5, 5, 5, 3]; hv.forEach((ww, i) => { const x0 = cx - ((ww - 1) >> 1), y = yAnillo + 2 + i; l.f('#f0d9a8', x0, y, ww, 1); if (ww >= 3) { l.p('#fff6dc', x0, y); l.p('#d9b87a', x0 + ww - 1, y); } }); l.p('#ffffff', cx - 1, yAnillo + 3); }
    return l;
  }
  function anilloTex(w, h) { const l = lienzo(w, h); l.f(P.teal2, 0, 0, w, h); l.f('#5fc3c9', 0, 0, w, 1); l.f('#1f6065', 0, h - 2, w, 2); for (let x = 3; x < w; x += 8) l.f('#1f6065', x, 2, 1, h - 5); return l; }

  // ───────────── cristales y escáner (v2.84 · L3, 2.ª mitad, parte 2) ─────────────
  // Cristal: color base del elemento con la rampa del juego (G.rampa); cada cara toma el tono de su luz (oeste = luz, sur = base, este y norte = sombra) con un filo claro a la izquierda y otro oscuro a la derecha.
  function cristalTex(w, h, tono, col, punta) {
    const l = lienzo(w, h), r = G.rampa(col), main = tono === 'luz' ? r.l1 : tono === 'sombra' ? r.s1 : r.base, hi = tono === 'luz' ? r.l2 : tono === 'sombra' ? r.base : r.l1, lo = tono === 'luz' ? r.base : tono === 'sombra' ? r.s0 : r.s1;
    l.f(main, 0, 0, w, h); if (punta) { l.f(hi, Math.floor((w - 1) / 2), 0, 1, h); return l; }
    l.f(hi, 0, 0, 1, h); l.f(lo, w - 1, 0, 1, h); if (h > 4) l.f(hi, 1, Math.floor(h / 2), 1, 2);
    return l;
  }
  function platoTex(w, h, tono) { const R = rampas(tono), az = R.azul, l = lienzo(w, h); l.f(az.md, 0, 0, w, h); l.f(az.hi, 0, h - 1, w, 1); return l; }
  function puntaTex(w, h) { const l = lienzo(w, h); l.f('#f7d54a', 0, 0, w, h); l.f('#d9a52e', Math.max(0, w - 1), 0, 1, h); return l; }

  // ───────────── piezas sueltas del tejado (v2.69, B2b): chimenea, corona, boca, poste y campana de la veleta ─────────────
  function chimenea(w, h, tono) { // piedra con hiladas contadas DESDE ARRIBA (así las juntas casan en las cuatro caras)
    const R = rampas(tono), pi = R.piedra, l = lienzo(w, h); l.f(pi.md, 0, 0, w, h); l.f(pi.hi, 0, 0, 1, h); l.f(pi.lo, w - 1, 0, 1, h);
    for (let y = 3, k = 0; y < h; y += 4, k++) { l.f(pi.lo, 0, y, w, 1); for (let x = k % 2 ? 2 : 6; x < w - 1; x += 8) l.f(pi.lo, x, y - 3, 1, 3); }
    return l;
  }
  function corona(w, h, tono) { const R = rampas(tono), pi = R.piedra, l = lienzo(w, h); l.f(pi.hi, 0, 0, w, h); l.f(pi.md, 0, h - 2, w, 1); l.f(pi.lo, 0, h - 1, w, 1); return l; }
  function coronaTapa(w, h, tono) { const R = rampas(tono), pi = R.piedra, l = lienzo(w, h); l.f(pi.hi, 0, 0, w, h); l.f(pi.md, 0, 0, w, 1); l.f(pi.md, 0, h - 1, w, 1); l.f(pi.md, 0, 0, 1, h); l.f(pi.md, w - 1, 0, 1, h); return l; }
  function boca(w, h) { const l = lienzo(w, h); l.f(P.ink2, 0, 0, w, h); l.f(P.ink, 0, 0, w, 1); return l; }
  function poste(w, h, tono) { const l = lienzo(w, h); l.f(P.greyD, 0, 0, w, h); if (w > 1) l.f(tono === 'sombra' ? P.ink2 : P.grey2, 0, 0, 1, h); return l; }
  // campana pequeña de dos mitades (la misma del 2D, 8 × 9 px) sobre fondo transparente; en la sombra las dos mitades toman su color oscuro
  function veleta(w, h, tono) {
    const l = lienzo(w, h), cb = tono === 'sombra' ? P.blue2 : '#4d7fd6', cp = tono === 'sombra' ? P.pink2 : P.pink, cbl = tono === 'sombra' ? '#3f68b0' : '#8fb4f0', cps = tono === 'sombra' ? '#c25a7c' : '#e47a9a', oro = '#f7d54a', oro2 = '#d9a52e', cx = 4;
    const fil = [[2, 0], [4, 1], [4, 2], [6, 3], [6, 4], [8, 5], [8, 6]], top = 0, n = fil.length;
    fil.forEach(([ww, r]) => { l.f(cb, cx - ww / 2, top + r, ww / 2, 1); l.f(cp, cx, top + r, ww / 2, 1); });
    fil.forEach(([ww, r], i) => { if (i >= 1) { l.f(cbl, cx - ww / 2, top + r, 1, 1); l.f(cps, cx + ww / 2 - 1, top + r, 1, 1); } });
    l.f(oro, cx - 1, top, 2, n); l.f(oro, 0, top + n, 8, 1); l.f(oro2, 1, top + n, 7, 1); l.f(oro, cx - 1, top + n + 1, 2, 1);
    return l;
  }

  // ───────────── v2.86 · PASO D: estilos «centro», «tienda», «ermita» y «fuente» ─────────────
  // Mismas reglas que la casa: tres tonos de luz (oeste luz · sur base · este y norte sombra), colores = cadenas del 2D, fachada sur = recorte del dibujo 2D (vol.fachada) y el resto dibujado por código. La fuente no recorta nada del 2D.
  const AGUA = { base: '#4d7fd6', luz: '#8fb4f0', sombra: '#35559a' };                       // los WA, WA_L y WA_S del dibujo 2D
  const VENT = (l, R, x, y, w, h) => { const md = R.madera, cr = R.cristal; l.f(md.md, x - 1, y - 1, w + 2, h + 2); l.f(cr.md, x, y, w, h); l.f(cr.hi, x + 1, y + 1, Math.min(3, w - 1), 2); l.f(md.md, x + (w >> 1), y, 1, h); l.f(md.md, x, y + (h >> 1), w, 1); l.f(md.lo, x - 1, y + h + 1, w + 2, 1); };   // la VENTANA del Centro PC y la Tienda
  const plinto = (l, R, w, h, alto) => { const p = R.piedra, y = h - alto; l.f(p.md, 0, y, w, alto); l.f(p.hi, 0, y, w, 1); l.f(p.lo, 0, h - 1, w, 1); for (let x = 3; x < w; x += 8) l.f(p.lo, x, y + 1, 1, 2); };
  // Centro PC: paredes crema con cornisa de sombra y zócalo; 3 ventanas por lado y 4 altas atrás; azotea de tejas azul verdoso con peto oscuro
  function paredCP(w, h, tono, tipo) {
    const R = rampas(tono), ye = R.yeso, l = lienzo(w, h);
    l.f(ye.md, 0, 0, w, h); l.f(ye.lo, 0, 0, w, 3); l.f(R.azul.lo, 0, 0, w, 1);
    if (tipo === 'lat') [7, 31, 55].forEach((x) => VENT(l, R, x, 11, 18, 16));
    if (tipo === 'tras') [8, 34, 60, 86].forEach((x) => VENT(l, R, x, 8, 18, 22));
    plinto(l, R, w, h, 5); return l;
  }
  function cubiertaCP(w, h, tono) { const az = rampas(tono).azul, l = lienzo(w, h); l.f(az.hi, 0, 0, w, h); for (let y = 0, k = 0; y < h; y += 5, k++) { l.f(az.md, 0, y + 4, w, 1); for (let x = (k % 2) * 8; x < w; x += 16) l.f(az.md, x, y, 1, 4); } l.f(CADENAS.azul[0], 0, 0, w, 2); return l; }
  function petoCP(w, h, tono, dentro) { const az = rampas(tono).azul, l = lienzo(w, h); l.f(dentro ? az.md : az.lo, 0, 0, w, h); l.f(dentro ? az.hi : az.md, 0, 0, w, 1); l.f(az.ln, 0, h - 1, w, 1); for (let x = 7; x < w - 1; x += 16) l.f(az.ln, x, 1, 1, Math.max(1, h - 2)); return l; }
  function cantoCP(w, h) { const l = lienzo(w, h); l.f(CADENAS.azul[0], 0, 0, w, h); l.f(rampas('base').azul.hi, 0, h - 1, w, 1); return l; }
  // Tienda: tablas de madera clara con zócalo; una ventana con postigos por lado; trasera con puerta de servicio cerrada; tejado de tejas de madera; toldo de rayas rojas y crema
  function paredTI(w, h, tono, tipo) {
    const R = rampas(tono), tb = R.tablas, l = lienzo(w, h);
    l.f(tb.md, 0, 0, w, h); for (let y = 5; y < h - 6; y += 6) l.f(tb.lo, 0, y, w, 1);
    zocalo(l, R, w, h - 6);
    if (tipo === 'lat') ventana(l, R, Math.round(w / 2), h - 33);
    if (tipo === 'tras') { const dx = Math.round(w / 2) - 7, dy = h - 27, md = R.madera; l.f(md.lo, dx - 1, dy - 1, 16, 27); l.f(md.md, dx, dy, 14, 26); l.f(md.hi, dx, dy, 1, 26); l.f(md.lo, dx + 7, dy, 1, 26); l.f('#f7d54a', dx + 10, dy + 13, 1, 2); }
    return l;
  }
  function faldonTI(w, h, tono) { const m = rampas(tono).madera, l = lienzo(w, h); l.f(m.md, 0, 0, w, h); for (let y = 3, k = 0; y < h; y += 4, k++) { l.f(m.lo, 0, y, w, 1); for (let x = (k % 2) * 4; x < w; x += 8) l.f(m.lo, x, y - 3, 1, 3); } l.f(m.hi, 0, 0, w, 2); l.f(m.lo, 0, h - 1, w, 1); return l; }
  function hastialTI(w, h, tono) { const R = rampas(tono), tb = R.tablas, l = lienzo(w, h); l.f(tb.md, 0, 0, w, h); for (let x = 5; x < w; x += 6) l.f(tb.lo, x, 0, 1, h); l.f(R.madera.lo, 0, h - 2, w, 2); return l; }
  // v2.258 · fachada propia del Centro PC (ya no es un recorte del 2D, que cortaba las dos ventanas interiores contra el nicho): cada bloque de pared lleva UNA ventana (la de fuera) y el hueco central es la puerta
  function paredCP(w, h, tono) { const R = rampas(tono), l = lienzo(w, h); l.f(R.yeso.md, 0, 0, w, h); l.f(R.yeso.lo, 0, 1, w, 3); zocalo(l, R, w, h - 6); return l; }
  function fachadaCPmuro(w, h, tono, der) {
    const R = rampas(tono), md = R.madera, cr = R.cristal, l = paredCP(w, h, tono), x = der ? 22 : 8, y = 11;
    l.f(md.md, x - 1, y - 1, 20, 18); l.f(cr.md, x, y, 18, 16); l.f(cr.hi, x + 1, y + 1, 3, 2); l.f(md.md, x + 9, y, 1, 16); l.f(md.md, x, y + 8, 18, 1); l.f(md.lo, x - 1, y + 17, 20, 1);
    return l;
  }
  function puertaCP(w, h, tono) {
    const R = rampas(tono), cr = R.cristal, l = paredCP(w, h, tono), x = (w - 12) >> 1, y = h - 16;
    l.f(R.piedra.lo, x - 1, y - 1, 14, 17); l.f(cr.ln, x, y, 12, 16); l.f(cr.hi, x + 2, y + 2, 8, 5); l.f(cr.md, x + 2, y + 7, 8, 1); l.f('#f7d54a', x + 9, y + 9, 1, 2); l.f(R.piedra.hi, 0, h - 1, w, 1);
    return l;
  }
  // v2.254 · fachada propia de la Tienda (ya no es un recorte del 2D): dos bloques de pared de 32×45 px con una vitrina a la altura de los ojos (marco, cristal con brillo, travesaño, tres frascos de colores sobre el mostrador y alféizar) y, en el hueco central, la puerta con su marco
  function vitrinaTI(w, h, tono, der) {
    const R = rampas(tono), tb = R.tablas, md = R.madera, cr = R.cristal, l = lienzo(w, h), wx = der ? 6 : 2, fy = 12, fw = 24, fh = 22, gx = wx + 2, gy = fy + 2, gw = fw - 4, gh = 14;
    l.f(tb.md, 0, 0, w, h); for (let y = 5; y < h - 6; y += 6) l.f(tb.lo, 0, y, w, 1); zocalo(l, R, w, h - 6);
    l.f(md.lo, wx - 1, fy - 1, fw + 2, fh + 2); l.f(md.md, wx, fy, fw, fh); l.f(md.hi, wx, fy, fw, 1); l.f(md.hi, wx, fy, 1, fh);
    l.f(cr.md, gx, gy, gw, gh); l.f(cr.hi, gx + 1, gy + 1, 3, 2); l.p(cr.hi, gx + 1, gy + 3); l.f(cr.lo, gx, gy + gh - 1, gw, 1);
    [[2, '#d94a3f'], [6, '#f7d54a'], [12, '#4d7fd6'], [16, '#5dae5a']].forEach(([dx, col]) => { l.f(col, gx + dx, gy + gh - 5, 3, 4); l.p('#ffffff', gx + dx, gy + gh - 5); });
    l.f(md.md, gx + (gw >> 1) - 1, gy, 2, gh); l.f(md.lo, gx + (gw >> 1), gy, 1, gh); l.f(md.md, gx, gy + 4, gw, 1);
    l.f(md.hi, wx - 2, fy + fh + 1, fw + 4, 1); l.f(md.lo, wx - 2, fy + fh + 2, fw + 4, 1);
    return l;
  }
  function puertaTI(w, h, tono) {
    const R = rampas(tono), tb = R.tablas, md = R.madera, l = lienzo(w, h), x = (w - 12) >> 1, y = h - 16;
    l.f(tb.md, 0, 0, w, h); for (let yy = 5; yy < h - 6; yy += 6) l.f(tb.lo, 0, yy, w, 1); zocalo(l, R, w, h - 6);
    l.f(md.lo, x - 1, y - 1, 14, 17); l.f(md.md, x, y, 12, 16); l.f(md.hi, x, y, 1, 16); l.f(md.hi, x + 2, y + 2, 8, 5); l.f(md.lo, x + 2, y + 7, 8, 1); l.f('#f7d54a', x + 9, y + 9, 1, 2); l.f(R.piedra.hi, 0, h - 1, w, 1);
    return l;
  }
  // rótulo con el nombre: placa oscura con marco claro y letras crema de 3×5 px (T I E N D A; N es de 5 de ancho), 1 px de marco y 1 de margen
  const GLIFOS = { T: '###|.#.|.#.|.#.|.#.', I: '###|.#.|.#.|.#.|###', E: '###|#..|##.|#..|###', N: '#...#|##..#|#.#.#|#..##|#...#', D: '##.|#.#|#.#|#.#|##.', A: '.#.|#.#|###|#.#|#.#', C: '###|#..|#..|#..|###', R: '##.|#.#|##.|#.#|#.#', O: '###|#.#|#.#|#.#|###', P: '##.|#.#|##.|#..|#..', ' ': '.|.|.|.|.' };
  function rotuloTex(w, h, tono, texto, est) {
    const R = rampas(tono), l = lienzo(w, h), cr = R.yeso.hi, fondo = est === 'centro' ? R.azul : R.madera; l.f(fondo.hi, 0, 0, w, h); l.f(fondo.lo, 1, 1, w - 2, h - 2);
    const filas = (texto || '').split('').map((c) => (GLIFOS[c] || '').split('|')), ancho = filas.reduce((n, g) => n + (g[0] ? g[0].length + 1 : 0), -1);
    let x = Math.floor((w - ancho) / 2); const y0 = Math.floor((h - 5) / 2);
    filas.forEach((g) => { g.forEach((fila, j) => fila.split('').forEach((ch, i) => { if (ch === '#') l.p(cr, x + i, y0 + j); })); x += (g[0] ? g[0].length : 0) + 1; });
    [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]].forEach(([a, b]) => l.p(fondo.hi, a, b));   // tornillos
    return l;
  }
  // v2.256 · sillería clara de los adornos de la Ermita (arco, peldaños, dinteles, alféizares, cornisa): piedra más clara que el muro, con luz arriba y a la izquierda y juntas cada 8 px
  function adornoER(w, h, tono, mat) { const R = rampas(tono), pi = R[mat] || R.piedra, l = lienzo(w, h); l.f(pi.hi, 0, 0, w, h); l.f(pi.md, 0, h - 1, w, 1); for (let x = 7; x < w; x += 8) l.f(pi.md, x, 0, 1, h); if (h > 4) l.f(pi.md, 0, h >> 1, w, 1); return l; }
  function toldoTex(w, h) { const R = rampas('base'), rj = R.teja, cr = R.yeso, l = lienzo(w, h); for (let x = 0; x < w; x += 8) { const c = (x >> 3) % 2; l.f(c ? cr.md : rj.md, x, 0, 8, h); l.f(c ? cr.hi : rj.hi, x, 0, 8, 1); l.f(c ? cr.lo : rj.lo, x, Math.max(0, h - 3), 8, Math.min(3, h)); } return l; }
  function flecoTex(w, h) { const R = rampas('base'), rj = R.teja, cr = R.yeso, l = lienzo(w, h); for (let x = 0; x < w; x += 8) { const col = ((x >> 3) % 2 ? cr : rj).md; l.f(col, x, 0, 8, Math.max(1, h - 2)); l.f(col, x + 2, h - 2, 4, 2); } return l; }
  // Ermita: muros de sillares de piedra con zócalo, tres ventanas estrechas por lado; tejado de pizarra azul; frontón con la hornacina y la campana (recorte del 2D); trasera con óculo
  function ventanaER(l, R, x, y) { const pi = R.piedra, cr = R.cristal; l.f(pi.lo, x - 1, y, 10, 21); l.f(cr.md, x, y + 1, 8, 19); l.f(cr.hi, x + 1, y + 2, 2, 3); l.f(pi.lo, x + 3, y + 1, 1, 19); }
  function paredER(w, h, tono, tipo) {
    const R = rampas(tono), pi = R.piedra, l = lienzo(w, h); l.f(pi.hi, 0, 0, w, h);
    for (let y = 4, k = 0; y < h - 6; y += 8, k++) { l.f(pi.lo, 0, y, w, 1); for (let x = (k % 2) * 6 + 3; x < w - 3; x += 12) l.f(pi.lo, x, y - 7, 1, 7); }
    if (tipo === 'lat') [10, 28, 46].forEach((x) => ventanaER(l, R, x, 12));
    zocalo(l, R, w, h - 6); return l;
  }
  function faldonER(w, h, tono) { const s = rampas(tono).pizarraE, l = lienzo(w, h); l.f(s.md, 0, 0, w, h); for (let y = 0, k = 0; y < h; y += 5, k++) { l.f(s.lo, 0, y + 4, w, 1); for (let x = (k % 2) * 5; x < w; x += 10) l.f(s.lo, x, y, 1, 4); } l.f(s.hi, 0, 0, w, 2); l.f(s.ln, 0, h - 1, w, 1); return l; }
  function hastialER(w, h, tono, sur, dib) {
    const R = rampas(tono), pi = R.piedra, sl = R.pizarraE, l = lienzo(w, h), cx = w / 2;
    for (let y = 0; y < h; y++) { const hw = Math.max(1, Math.round((y + 1) / h * cx)), b = Math.min(5, hw); l.f(pi.hi, cx - hw, y, 2 * hw, 1); l.f(sl.hi, cx - hw, y, b, 1); l.f(sl.md, cx + hw - b, y, b, 1); }
    if (sur && dib) l.x.drawImage(dib, 30, 14, 22, 24, cx - 11, 14, 22, 24);              // hornacina con la campana: recorte del dibujo 2D
    else if (!sur) { disco(l, pi.lo, cx, 26, 4.5); disco(l, P.ink2, cx, 26, 3); }          // óculo de la trasera
    return l;
  }
  // ───────────── v2.92 · F2: FUENTE REDONDA (piezas de revolución, G.volumenes torno) ─────────────
  // Una textura por anillo (no una por cara). La luz fija (oeste luz · sur base · este y norte sombra) se pinta COLUMNA a COLUMNA según el ángulo de la cara, con una trama de tablero de ajedrez de 1 px en el cambio de un tono al siguiente: así el cilindro se ve redondo con solo tres tonos. El agua (estanque y las dos tazas) se redibuja 4 veces por segundo.
  const TH = Math.PI;
  // tono de una cara cuya normal horizontal apunta al ángulo `a` (x = cos, z = sin; z+ = sur); `par` (0/1) decide de qué lado cae un píxel pegado al límite entre dos tonos
  function tonoAng(a, par) {
    const s = -0.9 * Math.cos(a) + 0.45 * Math.sin(a), i = s > 0.5 ? 0 : s > -0.35 ? 1 : 2, cerca = (t) => Math.abs(s - t) < 0.08;
    if (par) { if (i === 0 && cerca(0.5)) return 'base'; if (i === 1 && cerca(0.5)) return 'luz'; if (i === 1 && cerca(-0.35)) return 'sombra'; if (i === 2 && cerca(-0.35)) return 'base'; }
    return ['luz', 'base', 'sombra'][i];
  }
  const rampasMat = (mat) => ({ luz: rampa(mat, 'luz'), base: rampa(mat, 'base'), sombra: rampa(mat, 'sombra') });
  // pared de un anillo (por fuera): sillares de piedra (el estanque), aros de piedra (pedestal y columna) o cerámica lisa con estrías (tazas, campana, remate)
  function ladoFU(w, h, p) {
    const l = lienzo(w, h), RM = rampasMat(p.mat), estanque = p.pz === 'estanque', aros = p.pz === 'pedestal' || p.pz === 'columna', nb = Math.max(3, Math.round(w / 11)), ne = 8;
    for (let x = 0; x < w; x++) {
      const a = (x + 0.5) / (PX * p.rM);
      const f = (a / (2 * TH)) * ne, estria = Math.abs(f - Math.round(f)) * w / ne < 0.5;                                // columna de una estría (8 por vuelta)
      for (let y = 0; y < h; y++) {
        const T = RM[tonoAng(a, (x + y) & 1)]; let col = T.md;
        if (estanque) { // hiladas de 5 px con las juntas verticales a tresbolillo
          const hil = Math.floor(y / 5), off = (hil % 2) * 0.5, g = (x / w * nb - off), junta = Math.abs(g - Math.round(g)) * w / nb < 0.5;
          if (y === 0) col = T.hi; else if (y % 5 === 4 || junta) col = T.lo; if (y === h - 1) col = T.ln;
        } else if (aros) { if (y === 0) col = T.hi; else if (y % 6 === 5 || y === h - 1) col = T.lo; }
        else { if (y === 0) col = T.hi; else if (y === h - 1) col = T.ln; else if (estria && y > 1) col = T.lo; }
        l.p(col, x, y);
      }
    }
    return l;
  }
  // los discos (borde de la boca, agua, tapa) se pintan con su centro en el centro del cuadrado de su textura: (dx, dz) en u, z+ = sur (v = 0 abajo del lienzo = norte)
  const centroPx = (w, h, x, y) => [(x + 0.5) / PX - w / (2 * PX), (h - y - 0.5) / PX - h / (2 * PX)];
  function bordeFU(w, h, p) { // cara de arriba de la boca: de ri a R; filete dorado por fuera y una raya de sombra pegada al agua
    const l = lienzo(w, h), M = rampasMat(p.mat), O = rampasMat('oro');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [dx, dz] = centroPx(w, h, x, y), d = Math.hypot(dx, dz); if (d > p.R + 0.5 / PX || d < p.ri - 0.5 / PX) continue;
      const luz = dx + dz < 0; let col = (luz ? M.luz : M.base).md;
      if (d > p.R - 1.1 / PX) col = p.filete ? (luz ? O.luz.hi : O.base.md) : (luz ? M.luz.hi : M.base.hi);   // filete: 1 px por fuera
      else if (d > p.R - 2.1 / PX) col = (luz ? M.luz : M.base).hi;
      else if (d < p.ri + 1 / PX) col = M.sombra.lo;
      l.p(col, x, y);
    }
    return l;
  }
  function dentroFU(w, h, p) { // pared de dentro de la boca: la luz le da por el lado contrario (su cara mira hacia dentro); la última fila es la línea del agua
    const l = lienzo(w, h), RM = rampasMat(p.mat);
    for (let x = 0; x < w; x++) {
      const a = (x + 0.5) / (PX * p.ri);
      for (let y = 0; y < h; y++) { const T = RM[tonoAng(a + TH, (x + y) & 1)]; l.p(y === h - 1 ? AGUA.sombra : y === 0 ? T.md : T.lo, x, y); }
    }
    return l;
  }
  function aguaFU(w, h, p, n) { // disco de agua: sombra de la pared en el lado noroeste, dos ondas que giran alrededor de lo que sube por el centro, y reflejos que se mueven
    const l = lienzo(w, h), ri = p.ri;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [dx, dz] = centroPx(w, h, x, y), d = Math.hypot(dx, dz); if (d > ri) continue;
      let col = AGUA.base; const t = d > 0 ? Math.max(0, -(dx + dz) / (1.414 * d)) : 0;
      if (d > ri - (3 / PX) * t) col = AGUA.sombra;
      if (p.rc > 0) [0.09, 0.19].forEach((e, k) => { const rr = p.rc + e; if (rr < ri - 0.04 && Math.abs(d - rr) < 0.5 / PX && (Math.floor((Math.atan2(dz, dx) + TH) / (TH / 6)) + n + k * 2) % 3 !== 0) col = AGUA.luz; });
      if (d > ri - 1 / PX) col = AGUA.sombra;
      l.p(col, x, y);
    }
    for (let k = 0; k < 3; k++) { const sx = Math.floor(w * (0.2 + 0.3 * k) + ((n * 3 + k * 5) % 4)), sy = Math.floor(h * (0.3 + 0.2 * k)); for (let q = 0; q < 3; q++) { const [dx, dz] = centroPx(w, h, sx + q, sy), d = Math.hypot(dx, dz); if (d < ri - 2.5 / PX && (!p.rc || d > p.rc + 0.28)) l.p(AGUA.luz, sx + q, sy); } }
    return l;
  }
  function tapaFU(w, h, p) { // punta dorada: un disco liso
    const l = lienzo(w, h), O = rampasMat('oro');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [dx, dz] = centroPx(w, h, x, y); if (Math.hypot(dx, dz) <= p.R + 0.5 / PX) l.p(dx + dz < 0 ? O.luz.hi : O.base.hi, x, y); }
    return l;
  }

  // ───────────── v2.102 · objetos 3D, paso 3 · texturas de píxel de la FAROLA (docs/FICHAS_OBJETOS_3D.md, sección 2) ─────────────
  // 1 texel = 1 px del 2D. Las piezas de torno de 12 lados miden menos de 2 px por cara, así que el filo claro / canal oscuro del poste lo hacen los TRES TONOS por cara (luz, base, sombra: ver G.volumenes, torno.luz); aquí van los anillos y brillos en horizontal. El cristal ignora el tono: el pintor ya lo fija en «base».
  function farolaTex(p, w, h, tono) {
    const l = lienzo(w, h), R = rampa(p.mat, tono), O = rampa('oro', 'base'), cl = (n) => Math.max(0, Math.min(n, h - 1));
    l.f(R.md, 0, 0, w, h);
    if (p.pz === 'base' && p.sub === 'lado') { l.f(R.hi, 0, 0, w, 1); l.f(R.lo, 0, h - 1, w, 1); if (h > 3) l.f(R.lo, 0, 1, w, 1); }                            // moldura: brillo arriba, sombra abajo
    else if (p.pz === 'poste') { l.f(R.lo, 0, h - 1, w, 1); l.f(R.lo, 0, 0, w, 1); for (let y = 6; y < h - 6; y += 12) l.f(R.hi, 0, y, w, 1); }                  // sombra bajo el collarín y sobre la base; un brillo cada 12 px
    else if (p.pz === 'collarin') { l.f(R.lo, 0, h - 1, w, 1); l.f(R.hi, 0, 0, w, 1); }                                                                          // anillo: filo claro arriba y sombra abajo
    else if (p.pz === 'plato' && p.parte === 'caja') { l.f(R.hi, 0, 0, w, 1); l.f(R.lo, 0, h - 1, w, 1); }
    else if (p.sub === 'tapa' && p.pz === 'base') { disco(l, R.hi, w / 2, w / 2, w / 2); disco(l, R.md, w / 2, w / 2, Math.max(0, w / 2 - 1)); }                  // la corona de la base, con un anillo claro
    else if (p.parte === 'caja_tapa') { l.f(R.hi, 0, 0, w, 1); l.f(R.hi, 0, h - 1, w, 1); l.f(R.hi, 0, 0, 1, h); l.f(R.hi, w - 1, 0, 1, h); }                  // borde del plato
    else if (p.pz === 'cuerpo') {                                                                                                                                 // cristal #fff3b0 con marco dorado de 1 px y núcleo claro
      const Cr = rampa('vidrio', 'base'); l.f(Cr.md, 0, 0, w, h); l.f(Cr.hi, 1, 1, Math.max(0, w - 2), Math.max(0, h - 2));
      if (w >= 4 && h >= 4) { l.f(Cr.hi, Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, 2, 2); l.f(Cr.md, 1, 1, w - 2, 1); l.f(Cr.md, 1, h - 2, w - 2, 1); l.f(Cr.md, 1, 1, 1, h - 2); l.f(Cr.md, w - 2, 1, 1, h - 2); l.f(Cr.hi, Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, 2, 2); }
      l.f(O.md, 0, 0, w, 1); l.f(O.md, 0, h - 1, w, 1); l.f(O.md, 0, 0, 1, h); l.f(O.md, w - 1, 0, 1, h); l.f(O.lo, 0, h - 1, w, 1);
    }
    else if (p.pz === 'tejadillo') { l.f(R.hi, 0, 0, w, 1); l.f(R.lo, 0, cl(h - 1), w, 1); for (let y = 1; y < h - 1; y++) for (let x = (y % 2) * 2; x < w; x += 4) l.p(R.lo, x, y); }   // placas con la arista clara arriba
    else if (p.pz === 'remate' && p.sub === 'lado') { l.f(R.hi, 0, 0, w, 1); l.f(R.lo, 0, h - 1, w, 1); }
    else if (p.pz === 'remate' && p.sub === 'tapa') { l.f(O.md, 0, 0, w, h); l.p(O.hi, 0, 0); }                                                                 // punta de oro
    return l;
  }

  // v2.106 · objetos pequeños, banco, paso 3 (1.ª MITAD): texturas de píxel del ASIENTO y los dos LISTONES (ficha docs/FICHA_BANCO_3D.md, sección 2); los montantes (v2.107) y las patas (aún lisas) se resuelven aparte. 1 texel = 1 px del 2D; la fila 0 del lienzo es el borde de arriba de la cara (en una tapa, el borde SUR). Sin azar: las vetas están en posiciones fijas. Colores: R = rampa del material con el tono de la cara (hi = filo claro, md = color, lo = filo oscuro); las vetas del asiento usan wood2 (#b27a45).
  const VETAS_ASIENTO = [[1, [3, 4], [14, 4]], [4, [8, 4], [19, 5]], [6, [2, 4], [12, 3], [20, 3]]];   // [fila del lienzo, [x, largo]…]: 2 o 3 vetas cortas por tablón (la fila 6 es la de en medio del tablón del norte: sus 2 filas son 6 y 7)
  function bancoTex(p, w, h, tono) {
    const l = lienzo(w, h), R = rampa(p.mat, tono);
    l.f(R.md, 0, 0, w, h);
    if (p.pz === 'asiento' && p.parte === 'caja_tapa') {   // arriba: 3 tablones de 2 texels con una línea oscura de 1 texel entre ellos (2+1+2+1+2), borde sur claro y vetas cortas
      const V2 = P.wood2; l.f(R.lo, 0, 2, w, 1); l.f(R.lo, 0, 5, w, 1); l.f(R.hi, 0, 0, w, 1);
      VETAS_ASIENTO.forEach(([y, ...vs]) => vs.forEach(([x, n]) => l.f(V2, Math.min(x, w - 1), Math.min(y, h - 1), Math.max(0, Math.min(n, w - x)), 1)));
    } else if (p.pz === 'asiento') { l.f(R.hi, 0, 0, w, 1); l.f(R.lo, 0, h - 1, w, 1); }   // frente y costados: filo de arriba 1 texel más claro y el de abajo 1 más oscuro
    else if (p.pz === 'listonAlto' || p.pz === 'listonBajo') {
      if (p.parte === 'caja_tapa') { l.f(R.hi, 0, 0, w, 1); }                                   // arriba: madera con el borde sur claro
      else if (p.cara === 'e' || p.cara === 'o') l.f(R.lo, 0, 0, w, h);                         // las cabezas, más oscuras
      else { l.f(R.hi, 0, 0, w, 1); if (p.cara === 's') { const x0 = p.pz === 'listonAlto' ? 5 : 15; l.f(R.lo, x0, h - 1, 4, 1); l.f(R.lo, x0 + 9, h - 1, 3, 1); } }   // frente y detrás: la fila de arriba clara (como el 2D) y, en el frente, una veta
    } else if (p.pz === 'montante' || p.pz === 'pata') {   // v2.108 (paso 3, 2.ª mitad, parte 2): las patas usan la misma receta que los montantes. v2.107 (paso 3, 2.ª mitad, parte 1): madera oscura con un filo claro de 1 texel a la IZQUIERDA de quien mira la cara y un brillo arriba; la tapa es todo brillo
      if (p.parte === 'caja_tapa') l.f(R.hi, 0, 0, w, h);
      else { l.f(R.hi, (p.cara === 's' || p.cara === 'n') ? w - 1 : 0, 0, 1, h); l.f(R.hi, 0, 0, w, 1); }   // en las caras sur y norte el eje u de la textura va de este a oeste, así que «izquierda» es el último texel
    } else l.f(R.md, 0, 0, w, h);                                                                // resto: color liso
    return l;
  }
  // v2.165 · MACETA (jardinera de piedra con flores), paso 3 de 5: una textura por pieza (cuerpo, hierba, tallo, flor), cara y tono; 16 texels por unidad. Cuerpo: sillares de piedra en dos hiladas (filo claro arriba, junta a media altura, juntas verticales alternadas); hierba con motas; flores con su color y filo claro.
  function macetaTex(p, w, h, tono) {
    const l = lienzo(w, h), R = rampa(p.mat, tono), tapa = p.parte === 'caja_tapa';
    l.f(R.md, 0, 0, w, h);
    if (p.pz === 'cuerpo') {
      if (tapa) { l.f(R.hi, 0, 0, w, h); l.f(R.md, 1, 1, Math.max(0, w - 2), Math.max(0, h - 2)); }                 // arriba: borde claro de 1 texel (asoma bajo el seto)
      else { l.f(R.hi, 0, 0, w, 1); l.f(R.lo, 0, h - 1, w, 1); const m = h >> 1; l.f(R.lo, 0, m, w, 1);              // filo de arriba claro, pie oscuro y junta a media altura
        const cara = p.cara; if (cara === 's' || cara === 'n') { for (let x = 5; x < w - 1; x += 8) l.f(R.lo, x, 1, 1, m - 1); for (let x = 1; x < w - 1; x += 8) l.f(R.lo, x, m + 1, 1, h - m - 2); } else l.f(R.lo, w >> 1, 1, 1, m - 1); }   // juntas verticales alternadas
    } else if (p.pz === 'hierba') {
      if (tapa) l.f(R.hi, 0, 0, w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if ((x * 7 + y * 3) % 5 === 0) l.p(tapa ? R.md : R.hi, x, y); else if ((x * 3 + y * 5) % 7 === 0) l.p(R.lo, x, y); }   // motas repartidas con una fórmula fija (sin azar)
      if (!tapa) l.f(R.lo, 0, h - 1, w, 1);
    } else if (p.pz === 'tallo') { if (tapa) l.f(R.hi, 0, 0, w, h); else { l.f(R.hi, p.cara === 'o' || p.cara === 's' ? 0 : w - 1, 0, 1, h); l.f(R.lo, p.cara === 'o' || p.cara === 's' ? w - 1 : 0, 0, 1, h); } }
    else if (p.pz === 'flor') { if (tapa) { l.f(R.hi, 0, 0, w, h); l.p(rampa('oro', tono).md, w >> 1, h >> 1); } else { l.f(R.hi, 0, 0, w, 1); l.f(R.lo, 0, h - 1, w, 1); } }   // cabeza: arriba clara con un grano dorado al centro
    return l;
  }
  // → [clave, hacer, anim?] o null si ese polígono lo resuelve el estilo «casa» (losa, veleta…). `anim(n)` devuelve el lienzo del cuadro n (el agua)
  function porEstilo(est, tipo, vol, p, w, h, tono, minx) {
    const parte = p.parte, cara = p.cara || '', k = [est, parte, cara, tono, w, h].join('|'), r = (f, a) => [k, f, a];
    if (est === 'centro' && cara === 's' && parte === 'muro') return ['centro|fachada|' + minx + '|' + tono + '|' + w + '|' + h, () => fachadaCPmuro(w, h, tono, minx > 1)];   // v2.258
    if (est === 'centro' && cara === 's' && parte === 'nicho') return ['centro|puerta|' + tono + '|' + w + '|' + h, () => puertaCP(w, h, tono)];
    if (est === 'tienda' && cara === 's' && parte === 'muro') return ['tienda|vitrina|' + minx + '|' + tono + '|' + w + '|' + h, () => vitrinaTI(w, h, tono, minx > 1)];   // v2.254: fachada propia (dos vitrinas y la puerta)
    if (est === 'tienda' && cara === 's' && parte === 'nicho') return ['tienda|puerta|' + tono + '|' + w + '|' + h, () => puertaTI(w, h, tono)];
    if (est !== 'fuente' && (parte === 'muro' || parte === 'nicho') && cara === 's') { // fachada: recorte del dibujo 2D; lo que sobra por arriba (el nicho sube hasta el tejado) se rellena con el material de la pared
      const fondo = est === 'centro' ? rampa('yeso', tono).md : est === 'tienda' ? rampa('tablas', tono).md : rampa('piedra', tono).hi;
      return ['fachada|' + est + '|' + minx + '|' + w + '|' + h, () => { const l = lienzo(w, h), [fx, fy, , fh] = vol.fachada, y0 = h - fh; l.f(fondo, 0, 0, w, h); l.x.drawImage(dibujoDe(tipo), fx + Math.round(minx * PX), fy, w, fh, 0, y0, w, fh); return l; }];
    }
    const lado = parte === 'muro' ? (cara === 'n' ? 'tras' : 'lat') : parte === 'nicho' ? 'nicho' : null;
    if (est === 'centro') {
      if (parte === 'rotulo') return r(() => rotuloTex(w, h, tono, vol.rotulo.texto, est));
      if (parte === 'rotulo_canto') return r(() => { const l = lienzo(w, h); l.f(rampas(tono).azul.hi, 0, 0, w, h); return l; });
      if (parte === 'adorno' || parte === 'adorno_alto') return [['adorno|' + p.mat + '|' + tono + '|' + w + '|' + h, () => adornoER(w, h, tono, p.mat)]][0];
      if (lado) return r(() => paredCP(w, h, tono, lado));
      if (parte === 'cubierta') return r(() => cubiertaCP(w, h, tono));
      if (parte === 'peto' || parte === 'peto_dentro') return r(() => petoCP(w, h, tono, parte === 'peto_dentro'));
      if (parte === 'peto_canto') return r(() => cantoCP(w, h));
    } else if (est === 'tienda') {
      if (lado) return r(() => paredTI(w, h, tono, lado));
      if (parte === 'faldon') return r(() => faldonTI(w, h, tono));
      if (parte === 'hastial') return r(() => hastialTI(w, h, tono));
      if (parte === 'rotulo') return r(() => rotuloTex(w, h, tono, vol.rotulo.texto, est));
      if (parte === 'rotulo_canto') return r(() => { const l = lienzo(w, h); l.f(rampas(tono).madera.hi, 0, 0, w, h); return l; });
      if (parte === 'toldo') return r(() => toldoTex(w, h));
      if (parte === 'toldo_fleco') return r(() => flecoTex(w, h));
    } else if (est === 'ermita') {
      if (parte === 'adorno' || parte === 'adorno_alto') return [['adorno|' + p.mat + '|' + tono + '|' + w + '|' + h, () => adornoER(w, h, tono, p.mat)]][0];
      if (lado) return r(() => paredER(w, h, tono, lado));
      if (parte === 'faldon') return r(() => faldonER(w, h, tono));
      if (parte === 'hastial') return r(() => hastialER(w, h, tono, cara === 's', cara === 's' ? dibujoDe(tipo) : null));
    } else if (est === 'banco') {   // v2.105 (banco, paso 2): color liso por pieza, material y tono; v2.106 (paso 3, 1.ª mitad): asiento y listones con textura de píxel (bancoTex)
      return [['banco', p.pz, p.mat, p.parte, p.cara || '', tono, w, h].join('|'), () => bancoTex(p, w, h, tono)];
    } else if (est === 'maceta') {   // v2.165 (maceta, paso 3): una textura de píxel por pieza, material, parte, cara y tono (ver macetaTex)
      return [['maceta', p.pz, p.mat, p.parte, p.cara || '', tono, w, h].join('|'), () => macetaTex(p, w, h, tono)];
    } else if (est === 'farola') {   // v2.102 (objetos 3D, paso 3): una textura de píxel por pieza, parte y tono (ver farolaTex)
      return [['farola', p.pz, p.sub || p.parte, p.cara || '', tono, w, h].join('|'), () => farolaTex(p, w, h, tono)];
    } else if (est === 'fuente') {   // v2.92 (F2): todos los polígonos son del torno; una textura por anillo (clave = pieza + parte)
      if (parte !== 'torno') return null;
      const kf = ['fuente', p.pz, p.sub, w, h].join('|');
      if (p.sub === 'lado') return [kf, () => ladoFU(w, h, p)];
      if (p.sub === 'borde') return [kf, () => bordeFU(w, h, p)];
      if (p.sub === 'dentro') return [kf, () => dentroFU(w, h, p)];
      if (p.sub === 'agua') return [kf, () => aguaFU(w, h, p, 0), (n) => aguaFU(w, h, p, n)];
      if (p.sub === 'tapa') return [kf, () => tapaFU(w, h, p)];
    }
    return null;
  }

  // ───────────── API ─────────────
  const cache = new Map(), base2d = new Map();
  const soporta = (vol) => !!(vol && ESTILOS.includes(vol.estilo));
  function dibujoDe(tipo) { // el dibujo 2D completo de la pieza (para recortar la fachada); se dibuja una sola vez
    let c = base2d.get(tipo); if (!c) { const d = G.OBJETOS[tipo]; c = G.makeCanvas(d.w, d.h); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; d.dibujar(x); base2d.set(tipo, c); } return c;
  }
  // Tamaño de la textura de un polígono: 16 px por u en cada eje (lo que cubre su uv)
  function medida(p) { const mu = Math.max(...p.uv.map((q) => q[0])), mv = Math.max(...p.uv.map((q) => q[1])); return [Math.max(1, Math.ceil(mu * PX - 1e-9)), Math.max(1, Math.ceil(mv * PX - 1e-9))]; }
  // → { c: lienzo, w, h, clave } o null si ese polígono no lleva textura en este estilo
  function textura(tipo, p) {
    const d = G.OBJETOS[tipo], vol = d && d.vol; if (!soporta(vol)) return null;
    let [w, h] = p.tex || medida(p); if (p.parte === 'domo') { const D = vol.domo; w = Math.ceil(2 * Math.PI * D.r * PX - 1e-9); h = Math.ceil(Math.PI / 2 * D.r * PX - 1e-9); }   // la cúpula entera es UNA textura
    const minx = Math.min(...p.v.map((q) => q[0])), tono = p.tono, cara = p.cara, vr = vol.variante || null;
    let clave = null, hacer = null, anim = null;
    if (vol.estilo !== 'casa') { const o = porEstilo(vol.estilo, tipo, vol, p, w, h, tono, minx); if (o) { clave = o[0]; hacer = o[1]; anim = o[2] || null; } }
    if (hacer) { /* lo ha resuelto su estilo (v2.86) */ }
    else if ((p.parte === 'muro' || p.parte === 'nicho') && cara === 's') { // fachada: recorte del dibujo 2D (tono base, el dibujo de hoy)
      clave = 'fachada|' + minx + '|' + w + '|' + h;
      hacer = () => { const l = lienzo(w, h), [fx, fy, , fh] = vol.fachada, y0 = h - fh; l.f(rampa('yeso', tono).md, 0, 0, w, h); l.x.drawImage(dibujoDe(tipo), fx + Math.round(minx * PX), fy, w, fh, 0, y0, w, fh); return l; };
    } else if (p.parte === 'muro' && cara === 'n') { clave = 'trasera|' + tono + '|' + w + '|' + h; hacer = () => trasera(w, h, tono, vr); }
    else if (p.parte === 'muro') { clave = 'lateral|' + tono + '|' + w + '|' + h; hacer = () => lateral(w, h, tono, vr); }
    else if (p.parte === 'nicho') { clave = 'nicho|' + tono + '|' + w + '|' + h; hacer = () => nicho(w, h, tono, vr); }
    else if (p.parte === 'faldon') { clave = 'faldon|' + tono + '|' + w + '|' + h; hacer = () => faldon(w, h, tono, vr); }
    else if (p.parte === 'hastial') { clave = 'hastial|' + tono + '|' + w + '|' + h; hacer = () => hastial(w, h, tono, vr); }
    else if (p.parte === 'losa') { clave = 'losa|' + tono + '|' + w + '|' + h; hacer = () => losa(w, h, tono); }
    else if (p.parte === 'domo') { const r = vol.domo.r; clave = 'domo|' + w + '|' + h; hacer = () => domoTex(w, h, r); }
    else if (p.parte === 'cristal') { clave = 'cristal|' + p.col + '|' + tono + '|' + w + '|' + h; hacer = () => cristalTex(w, h, tono, p.col, false); }
    else if (p.parte === 'cristal_punta') { clave = 'cristalp|' + p.col + '|' + tono + '|' + w + '|' + h; hacer = () => cristalTex(w, h, tono, p.col, true); }
    else if (p.parte === 'plato') { clave = 'plato|' + tono + '|' + w + '|' + h; hacer = () => platoTex(w, h, tono); }
    else if (p.parte === 'punta') { clave = 'punta|' + w + '|' + h; hacer = () => puntaTex(w, h); }
    else if (p.parte === 'anillo') { clave = 'anillo|' + w + '|' + h; hacer = () => anilloTex(w, h); }
    else if (p.parte === 'cubierta') { clave = 'cubierta|' + tono + '|' + w + '|' + h; hacer = () => cubierta(w, h, tono); }
    else if (p.parte === 'peto' && cara === 's' && vol.fachada) { // la cara sur del peto es el recorte del 2D justo encima de la fachada (la franja del parapeto), como la fachada misma
      clave = 'petoS|' + minx + '|' + w + '|' + h;
      hacer = () => { const l = lienzo(w, h), [fx, fy] = vol.fachada; l.f(rampa('yeso', tono).lo, 0, 0, w, h); l.x.drawImage(dibujoDe(tipo), fx + Math.round(minx * PX), fy - h, w, h, 0, 0, w, h); return l; };
    }
    else if (p.parte === 'peto' || p.parte === 'peto_dentro') { clave = p.parte + '|' + tono + '|' + w + '|' + h; hacer = () => petoCara(w, h, tono); }
    else if (p.parte === 'peto_canto') { clave = 'petocanto|' + w + '|' + h; hacer = () => petoCanto(w, h, 'luz'); }
    else if (p.parte === 'chimenea') { clave = 'chimenea|' + tono + '|' + w + '|' + h; hacer = () => chimenea(w, h, tono); }
    else if (p.parte === 'corona') { clave = 'corona|' + tono + '|' + w + '|' + h; hacer = () => corona(w, h, tono); }
    else if (p.parte === 'corona_tapa') { clave = 'coronatapa|' + w + '|' + h; hacer = () => coronaTapa(w, h, 'luz'); }
    else if (p.parte === 'boca') { clave = 'boca|' + w + '|' + h; hacer = () => boca(w, h); }
    else if (p.parte === 'poste') { clave = 'poste|' + tono + '|' + w + '|' + h; hacer = () => poste(w, h, tono); }
    else if (p.parte === 'veleta') { clave = 'veleta|' + tono + '|' + w + '|' + h; hacer = () => veleta(w, h, tono); }
    if (!hacer) return null;
    const k = tipo + '|' + clave; let t = cache.get(k);
    if (!t) { const l = hacer(); t = { c: l.c, w, h, clave, anim: anim ? (n) => anim(n).c : null }; cache.set(k, t); }
    return t;
  }
  // uv del polígono en 0..1 sobre su textura (v = 0 abajo): lo que se le da al pintor
  const uvTextura = (p, t) => p.uv.map(([u, v]) => [u * PX / t.w, v * PX / t.h]);
  const limpiar = () => { cache.clear(); base2d.clear(); atlases.clear(); };
  // ATLAS de un edificio (v2.69): TODAS las texturas de sus caras en UN lienzo de 256 px de ancho (ficha: «una textura de hasta 256×256 por edificio»), con 1 px de hueco entre ellas y las repetidas guardadas una sola vez.
  // → { canvas, w, h, texturas, uv: [ [[u, v], …] por polígono, 0..1 sobre el atlas, v = 0 abajo (como espera Three con flipY) ] } o null si el estilo no está soportado. Se hace una vez por tipo de pieza.
  const atlases = new Map(), ATLAS_ANCHO = 256;
  function atlas(tipo, geo) {
    const d = G.OBJETOS[tipo]; if (!d || !soporta(d.vol)) return null;
    if (atlases.has(tipo)) return atlases.get(tipo);
    const lista = geo.poligonos.map((p) => ({ p, t: textura(tipo, p) })), unicas = new Map();
    lista.forEach(({ p, t }) => { if (!t) throw new Error('atlas: el polígono ' + p.parte + ' ' + (p.cara || '') + ' no tiene textura'); unicas.set(t.clave, t); });
    const emp = G.volumenes.empaquetar([...unicas.values()].map((t) => ({ k: t.clave, w: t.w, h: t.h })), ATLAS_ANCHO, 1);
    if (!emp.ok) throw new Error('atlas: las texturas de «' + tipo + '» no caben en ' + ATLAS_ANCHO + '×' + ATLAS_ANCHO + ' (' + emp.alto + ' px de alto)');
    const W = ATLAS_ANCHO, H = emp.alto, c = G.makeCanvas(W, H), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const animadas = []; unicas.forEach((t, k) => { const [px, py] = emp.pos[k]; x.drawImage(t.c, px, py); if (t.anim) animadas.push({ t, px, py }); });
    const uv = lista.map(({ p, t }) => { const [px, py] = emp.pos[t.clave]; return p.uv.map(([u, v]) => [(px + u * PX) / W, (H - (py + t.h) + v * PX) / H]); });
    const a = { canvas: c, w: W, h: H, texturas: unicas.size, uv, animadas }; atlases.set(tipo, a); return a;
  }

  // v2.86: redibuja en el atlas las texturas animadas (el agua de la fuente) para el cuadro n del reloj visual; true si hay algo que subir a la tarjeta gráfica
  function animar(at, n) { if (!at || !at.animadas || !at.animadas.length) return false; const x = at.canvas.getContext('2d'); at.animadas.forEach(({ t, px, py }) => { x.clearRect(px, py, t.w, t.h); x.drawImage(t.anim(n), px, py); }); return true; }
  G.volTex = { PX, bancoTex, ESTILOS, SIN_FACHADA, animar, VARIANTES, ATLAS_ANCHO, CADENAS, K, rampa, soporta, medida, textura, uvTextura, atlas, limpiar, get usadas() { return cache.size; } };
})(typeof window !== 'undefined' ? window : globalThis);
