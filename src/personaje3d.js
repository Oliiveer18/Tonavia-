// personaje3d.js — PERSONAJES 3D del HD-2D (v2.113 · OLI 3D, paso 2 de docs/FICHA_OLI_3D.md: volumen con COLORES LISOS; v2.114: + 4 trenzas laterales y tope de 240 triángulos; v2.115: paso 3b-1, textura de la CARA de la cabeza; v2.126: atlas y UV (paso 4; ya sin la lámina de gafas); v2.125: texturas de las trenzas (3d); v2.120: DURAG negro completo con banda en la frente y trenzas rojas/castañas alternadas).
// PURO: sin Three.js, sin DOM, sin Math.random; se prueba en node (grupo 69 de test.js) y se mira con tools/volcar_oli.js + tools/formas_oli.py.
// Diferencia con src/volumenes.js: Oli SE MUEVE, así que no vale un volumen estático. Aquí las piezas son cajas rígidas con PIVOTE (hombro, cadera) y la geometría se recalcula con la pose de cada cuadro.
// Este paso NO enchufa nada al pintor (src/hd2d_pintor.js): eso es el paso 4. El 2D y los sprites (src/chars.js) no se tocan.
//
// Medidas (ficha, sección 2): 1 u = 1 casilla = 16 px. Origen en los pies (centro de la casilla, y = 0 en el suelo). Marco LOCAL de Oli: +z = hacia donde mira, +x = SU izquierda (al mirar al sur, su izquierda es el este), y = arriba.
// Mundo: down = sur (+z) · right = este (+x) · up = norte (−z) · left = oeste (−x). El cuerpo gira (yaw) alrededor de la vertical por los pies.
// Luz fija arriba-izquierda (como edificios, farola y banco): oeste = luz, sur = base, este y norte = sombra, arriba = brillo. El tono de cada cara se calcula con su normal YA girada (Oli gira, la luz no).
//
// API:  G.personaje3d.piezas()            → las cajas de la ficha con sus pivotes (datos, sin pose)
//       G.personaje3d.pose(t, moving, dir, yaw?) → { yaw, yawMeta, fase, rebote, brazoI, brazoD, piernaI, piernaD, cabeza }  (depende solo de j.tm, j.moving y j.dir)
//       G.personaje3d.girar(yaw, meta, dt) → yaw suavizado (≈ 0,12 s por cuarto de vuelta) para el paso 4
//       G.personaje3d.textura(id)       → { id, w, h, px: [fila][columna] = '#rrggbb' | null }  (v2.115: recorte del sprite 2D; hoy solo 'cabeza_sur')
//       G.personaje3d.geometria(pose)   → { poligonos: [{ pieza, cara, tono, col, color, n, v }], triangulos, altoTotal, ancho }   (Oli)
//       G.personaje3d.de('rex' | 'luna') → { id, PAL, PIEZAS, ALTO_2D, piezas(), geometria(pose), pose, girar, tono, ids(), textura(id), atlas(), region(pieza, cara), uvPoligono(poligono, atlas) }   (v2.128: Lali con colores lisos; mismas funciones, otros datos)
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});

  const U = 1 / 16;   // 1 px = 0,0625 u
  const MIN_PIEZA = 0.125;       // como el banco: ninguna caja sólida baja de 2 px en ninguna medida (si no, parpadea al girar la cámara)
  const MAX_TRIANGULOS = 240;    // presupuesto de la ficha (sección 6): 200 hasta la v2.113; subido a 240 en la v2.114 para las 4 trenzas laterales (recalcular ≈ 0,04 ms con un límite de 0,3 ms)
  const ALTO_2D = 1.4375;        // 23 px del sprite 2D (sin mechones)

  // Colores lisos: los de la paleta del sprite 2D de Oli (G.CHARS.rex.pal en src/chars.js; test.js comprueba que siguen siendo esos).
  const PAL = { rojo: '#d9453d', castano: '#3d2a1e', capa: '#241c26', banda: '#2e2535', piel: '#f3d9c0', gafas: '#14101a', chaqueta: '#c9747f', pantalon: '#a85a66', calcetin: '#ffffff', zapatilla: '#f7f2e6' };   // la suela verde y el estampado de la chaqueta se pintan en el paso 3 (texturas)

  // ── Piezas ──  caja: ancho (x) × alto (y) × fondo (z), `c` = centro en x y z respecto al origen del cuerpo, `y0` = base. `grupo` = a qué se mueve; `pivote` = [x, y, z] del giro (en el marco local, sin pose).
  //   `sin` = caras que no se dibujan (nunca se ven con la cámara por encima del suelo: ahorra triángulos); `suave` = rampa de poco contraste; `libre` = pieza fina exenta del mínimo de 0,125 u (la ficha lo permite para las gafas: relieve de 0,03).
  const A = 0.40625, L = 0.1875;
  const PIEZAS = [
    { id: 'cabeza', grupo: 'cabeza', w: 0.875, h: 0.4375, d: 0.6875, x: 0, z: 0, y0: 0.6875, col: PAL.piel, sin: ['abajo', 'arriba'], pivote: [0, 0.6875, 0] },   // el casquete (más ancho y más hondo) tapa la cara de arriba
    // v2.120 (a petición del usuario, con foto de referencia): DURAG negro que cubre TODA la parte alta de la cabeza (de la frente, y 1.125 u, a lo más alto, 1.4375 u) y que ya no deja ver pelo encima; antes eran dos mitades de pelo rojo/castaño con un durag fino encima. El pelo solo se ve en las TRENZAS finas.
    { id: 'durag', grupo: 'cabeza', w: 0.875, h: 0.3125, d: 0.75, x: 0, z: 0, y0: 1.125, col: PAL.capa, suave: true, mate: true, sin: ['abajo'], pivote: [0, 0.6875, 0] },   // `mate`: la cara de arriba usa el tono de luz y no el de brillo (si no, el durag negro se ve gris claro, como una chistera); el casquete del durag: tela oscura y lisa, tirante
    { id: 'durag_banda', grupo: 'cabeza', w: 0.9375, h: 0.0625, d: 0.8125, x: 0, z: 0, y0: 1.125, col: PAL.banda, suave: true, mate: true, libre: true, sin: ['abajo', 'arriba'], pivote: [0, 0.6875, 0] },   // la BANDA con costura que rodea la frente y la nuca (1 px más ancha que el casquete: se ve como un borde marcado; `libre`: 1 px de alto, menos que el mínimo de 2 px)
    // v2.177 (a petición del usuario, mirando el 2D): DOS TRENZAS que caen POR DETRÁS de la cabeza, una al lado de la otra: ROJA a +x (de espaldas se ve a la izquierda) y CASTAÑA a −x, de 0,25 u de ancho (4 px, como las mitades del sprite de espaldas), saliendo de debajo del durag (borde en y 1,1875) y colgando a la altura de la nuca. Antes (v2.176) estaban a los lados de la cara.
    { id: 'trenza_roja', grupo: 'cabeza', w: 0.25, h: 0.4375, d: 0.125, x: 0.25, z: -0.40625, y0: 0.75, col: PAL.rojo, sin: ['abajo', 'arriba', 'sur'], pivote: [0, 0.6875, 0] },
    { id: 'trenza_castana', grupo: 'cabeza', w: 0.25, h: 0.4375, d: 0.125, x: -0.25, z: -0.40625, y0: 0.75, col: PAL.castano, sin: ['abajo', 'arriba', 'sur'], pivote: [0, 0.6875, 0] },
    { id: 'torso', grupo: 'torso', w: 0.6875, h: 0.3125, d: 0.4375, x: 0, z: 0, y0: 0.375, col: PAL.chaqueta, sin: ['abajo'], pivote: [0, 0.375, 0] },
    { id: 'manga_i', grupo: 'brazoI', w: L, h: 0.3125, d: L, x: A, z: 0, y0: 0.375, col: PAL.chaqueta, sin: ['abajo'], pivote: [A, 0.6875, 0] },     // brazo = manga + mano, pivote en el hombro
    { id: 'mano_i', grupo: 'brazoI', w: L, h: 0.125, d: L, x: A, z: 0, y0: 0.25, col: PAL.piel, sin: ['abajo', 'arriba'], pivote: [A, 0.6875, 0] },
    { id: 'manga_d', grupo: 'brazoD', w: L, h: 0.3125, d: L, x: -A, z: 0, y0: 0.375, col: PAL.chaqueta, sin: ['abajo'], pivote: [-A, 0.6875, 0] },
    { id: 'mano_d', grupo: 'brazoD', w: L, h: 0.125, d: L, x: -A, z: 0, y0: 0.25, col: PAL.piel, sin: ['abajo', 'arriba'], pivote: [-A, 0.6875, 0] },
    { id: 'pantalon_i', grupo: 'piernaI', w: 0.25, h: 0.1875, d: 0.25, x: 0.1875, z: 0, y0: 0.25, col: PAL.pantalon, sin: ['abajo'], pivote: [0.1875, 0.4375, 0] },  // pierna = pantalón + calcetín + zapatilla, pivote en la cadera
    { id: 'calcetin_i', grupo: 'piernaI', w: 0.25, h: 0.125, d: 0.25, x: 0.1875, z: 0, y0: 0.125, col: PAL.calcetin, sin: ['abajo', 'arriba'], pivote: [0.1875, 0.4375, 0] },
    { id: 'zapatilla_i', grupo: 'piernaI', w: 0.25, h: 0.125, d: 0.375, x: 0.1875, z: 0.0625, y0: 0, col: PAL.zapatilla, sin: ['abajo'], pivote: [0.1875, 0.4375, 0] },     // sobresale 0,0625 por delante
    { id: 'pantalon_d', grupo: 'piernaD', w: 0.25, h: 0.1875, d: 0.25, x: -0.1875, z: 0, y0: 0.25, col: PAL.pantalon, sin: ['abajo'], pivote: [-0.1875, 0.4375, 0] },
    { id: 'calcetin_d', grupo: 'piernaD', w: 0.25, h: 0.125, d: 0.25, x: -0.1875, z: 0, y0: 0.125, col: PAL.calcetin, sin: ['abajo', 'arriba'], pivote: [-0.1875, 0.4375, 0] },
    { id: 'zapatilla_d', grupo: 'piernaD', w: 0.25, h: 0.125, d: 0.375, x: -0.1875, z: 0.0625, y0: 0, col: PAL.zapatilla, sin: ['abajo'], pivote: [-0.1875, 0.4375, 0] },
  ];
  const copiar = (lista) => lista.map((p) => Object.assign({}, p, { sin: p.sin.slice(), pivote: p.pivote.slice() }));
  const piezas = () => copiar(PIEZAS);

  // ── LALI (v2.128 · LALI 3D, paso 2 de docs/FICHA_LALI_3D.md: volumen con COLORES LISOS) ──  Mismo sistema que Oli (misma pose, mismo giro, misma geometría), solo cambian los datos: paleta, piezas y altura. Marco local igual: +z = hacia donde mira, +x = SU izquierda.
  //   Medidas de la ficha (sección 3): 21 px = 1,3125 u de alto, cabeza de 12 × 10 px (0,75 × 0,625 × 0,625 u) que empieza justo donde acaba el torso (y 0,6875: SIN solape, lección de Oli, sección 16 de su ficha), torso de 6 px (0,375 u), brazos de 3 px en el borde de la casilla, 2 mechones largos, 2 piernas de 3 px (el sprite no las separa: hacen falta para andar) y zapatillas de 4 px que se tocan en el centro (como en el sprite, 8 px seguidos).
  //   Colores lisos = los de G.CHARS.luna.pal (test.js lo comprueba). Ojos, cejas, boca, camisa crema, botón, raya del pelo, lazos rosas y detalle rosa de las zapatillas van en las texturas (v2.129, paso 3: RECORTES_LALI). Con colores lisos (v2.128) la cara era una lámina `cara` de piel; la sustituye `cabeza_sur`.
  const PAL_LALI = { pelo: '#e8c46a', piel: '#f8dfcb', chaqueta: '#7fb3e0', pantalon: '#35559a', zapatilla: '#ffffff' };
  const AL = 0.40625, PIE = 0.09375;   // brazos a ±0,40625 (columnas 0-2 y 13-15 del sprite: de ±0,3125 a ±0,5); piernas a ±0,09375 (3 px cada una)
  const PIEZAS_LALI = [
    { id: 'cabeza', grupo: 'cabeza', w: 0.75, h: 0.625, d: 0.625, x: 0, z: 0, y0: 0.6875, col: PAL_LALI.pelo, sin: ['abajo'], pivote: [0, 0.6875, 0] },   // toda la cabeza en color de pelo (en el sprite la cara de piel es solo 6 de los 12 px de ancho); en el paso 3 lleva la textura con la cara, el pelo de los lados, la nuca y la tapa
    { id: 'torso', grupo: 'torso', w: 0.375, h: 0.3125, d: 0.3125, x: 0, z: 0, y0: 0.375, col: PAL_LALI.chaqueta, sin: ['abajo'], pivote: [0, 0.375, 0] },
    { id: 'mechon_i', grupo: 'torso', w: 0.125, h: 0.5, d: 0.1875, x: 0.25, z: -0.0625, y0: 0.1875, col: PAL_LALI.pelo, sin: ['abajo', 'arriba'], pivote: [0.25, 0.6875, 0] },   // pelo largo junto al torso (columnas 3-4 y 11-12, filas 10-17); rígido; el lazo rosa va en la textura
    { id: 'mechon_d', grupo: 'torso', w: 0.125, h: 0.5, d: 0.1875, x: -0.25, z: -0.0625, y0: 0.1875, col: PAL_LALI.pelo, sin: ['abajo', 'arriba'], pivote: [-0.25, 0.6875, 0] },
    { id: 'manga_i', grupo: 'brazoI', w: L, h: 0.375, d: L, x: AL, z: 0, y0: 0.3125, col: PAL_LALI.chaqueta, sin: ['abajo'], pivote: [AL, 0.6875, 0] },     // brazo = manga + mano, pivote en el hombro
    { id: 'mano_i', grupo: 'brazoI', w: L, h: 0.125, d: L, x: AL, z: 0, y0: 0.1875, col: PAL_LALI.piel, sin: ['abajo', 'arriba'], pivote: [AL, 0.6875, 0] },
    { id: 'manga_d', grupo: 'brazoD', w: L, h: 0.375, d: L, x: -AL, z: 0, y0: 0.3125, col: PAL_LALI.chaqueta, sin: ['abajo'], pivote: [-AL, 0.6875, 0] },
    { id: 'mano_d', grupo: 'brazoD', w: L, h: 0.125, d: L, x: -AL, z: 0, y0: 0.1875, col: PAL_LALI.piel, sin: ['abajo', 'arriba'], pivote: [-AL, 0.6875, 0] },
    { id: 'pierna_i', grupo: 'piernaI', w: 0.1875, h: 0.25, d: 0.25, x: PIE, z: 0, y0: 0.125, col: PAL_LALI.pantalon, sin: ['abajo'], pivote: [PIE, 0.375, 0] },   // pierna = pantalón/falda azul oscuro, pivote en la cadera (y 0,375 = base del torso)
    { id: 'zapatilla_i', grupo: 'piernaI', w: 0.25, h: 0.125, d: 0.3125, x: 0.125, z: 0.03125, y0: 0, col: PAL_LALI.zapatilla, sin: ['abajo'], pivote: [PIE, 0.375, 0] },   // sobresale 0,0625 por delante; las dos zapatillas se tocan en x = 0
    { id: 'pierna_d', grupo: 'piernaD', w: 0.1875, h: 0.25, d: 0.25, x: -PIE, z: 0, y0: 0.125, col: PAL_LALI.pantalon, sin: ['abajo'], pivote: [-PIE, 0.375, 0] },
    { id: 'zapatilla_d', grupo: 'piernaD', w: 0.25, h: 0.125, d: 0.3125, x: -0.125, z: 0.03125, y0: 0, col: PAL_LALI.zapatilla, sin: ['abajo'], pivote: [-PIE, 0.375, 0] },
  ];
  const ALTO_2D_LALI = 1.3125;   // 21 px del sprite 2D

  // ── Movimiento (ficha, sección 5) ──
  const CICLO = 0.36;                          // el 2D cambia de pie cada 0,18 s
  const PIERNA = 28 * Math.PI / 180, BRAZO = 22 * Math.PI / 180, REBOTE = 0.03;
  const GIRO_S = 0.12;                         // un cuarto de vuelta en ≈ 0,12 s
  const YAW = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };   // hacia dónde mira el cuerpo según j.dir
  const envolver = (a) => { if (a > -Math.PI && a <= Math.PI) return a; a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };   // → (−π, π]; ±π cae siempre del mismo lado (determinista)

  // Pose de un cuadro. t = j.tm (s), moving = j.moving, dir = j.dir; `yaw` = el giro actual ya suavizado (paso 4); sin él, el cuerpo ya mira a la meta.
  // `rebote` = lo que SUBE el cuerpo (torso, cabeza, brazos) sobre su altura de parado: 0 o negativo. Con las piernas abiertas (±28°) el cuerpo baja hasta 0,03 u (2 px) y al cruzarlas vuelve a su altura: así no empieza con un salto y nunca pasa de 1,4375 u (sin mechones).
  // Fase 0-0,5 del ciclo = fotograma 1 del 2D (pie DERECHO arriba: la pierna derecha de Oli, −x, adelante y el brazo derecho atrás); 0,5-1 = fotograma 2 (al revés). Parado: pose quieta.
  // v2.135: `ang` = ángulo real de la marcha (motor: atan2(vx, vy), 8 direcciones); si no viene, el giro usa las 4 de `dir`. `amp` (0..1) = amplitud del paso: sube al arrancar y baja al parar (si no viene, 1 andando y 0 parado, como antes).
  function pose(t, moving, dir, yaw, ang, amp) {
    const meta = typeof ang === 'number' ? envolver(ang) : YAW[dir] !== undefined ? YAW[dir] : 0, a = typeof amp === 'number' ? amp : moving ? 1 : 0, fase = moving || a > 0 ? (((t % CICLO) + CICLO) % CICLO) / CICLO : 0, s = a * Math.sin(fase * 2 * Math.PI);
    return { yawMeta: meta, yaw: typeof yaw === 'number' ? yaw : meta, fase, rebote: -REBOTE * Math.abs(s), piernaD: PIERNA * s, piernaI: -PIERNA * s, brazoD: -BRAZO * s, brazoI: BRAZO * s, cabeza: 0 };
  }
  // v2.135 (histéresis): la meta del giro solo cambia cuando la nueva dirección lleva `ESTABLE_S` seguida. Así, pulsar dos teclas "a la vez" (con 10-40 ms de diferencia) no gira primero a un eje y luego a la esquina, y soltar una tecla en diagonal no da un bandazo. `st` = { meta, cand, t } (null al empezar).
  const ESTABLE_S = 0.05, AMP_S = 0.1;   // AMP_S: segundos para pasar del paso parado al paso completo (arranque y parada suaves)
  function meta(st, ang, dt) {
    if (!st) return { meta: ang, cand: ang, t: 0 };
    if (Math.abs(envolver(ang - st.meta)) < 1e-6) return { meta: st.meta, cand: st.meta, t: 0 };
    const t = Math.abs(envolver(ang - st.cand)) < 1e-6 ? st.t + Math.max(0, dt) : 0;
    return t >= ESTABLE_S ? { meta: ang, cand: ang, t: 0 } : { meta: st.meta, cand: ang, t };
  }
  function amplitud(a, moving, dt) { const paso = Math.max(0, dt) / AMP_S; return moving ? Math.min(1, a + paso) : Math.max(0, a - paso); }
  // Un paso de giro suave: la vía más corta hacia la meta, a velocidad constante (90° en GIRO_S segundos).
  function girar(yaw, meta, dt) {
    const d = envolver(meta - yaw), paso = (Math.PI / 2) / GIRO_S * Math.max(0, dt);
    return Math.abs(d) <= paso ? envolver(meta) : envolver(yaw + Math.sign(d) * paso);
  }

  // ── Texturas (paso 3, ficha sección 3) ──  Se RECORTAN del mapa de letras del sprite 2D de Oli (G.CHARS.rex, src/chars.js): si el sprite cambia, la textura cambia sola. 1 texel = 1 px del 2D. Sin azar, sin lienzo.
  //   v2.115 (3b-1): solo la CARA de la cabeza (frente = `down`, filas 5-11: frente, gafas con destello, mejillas, boca y barbilla; las filas 0-4 las tapan el durag y el pelo). Es de 14 px de ancho (columnas 1-14 con el contorno), 1 px más que la caja de la cabeza (13 px): ver docs/FICHA_OLI_3D.md, sección 10.
  const RECORTES = { cabeza_sur: { vista: 'down', f0: 5, f1: 11, c0: 1, c1: 14, gafasFinas: true, sinPelo: true, sinBorde: 'g' }, cabeza_norte: { vista: 'back', f0: 1, f1: 11, c0: 1, c1: 14 },
    // v2.122 (3c, mitad 1): CUERPO. Chaqueta con su estampado (filas 12-16 del sprite: 4 de chaqueta y la de abajo con el pantalón asomando). Torso de 11 px: se recortan 12 columnas (2-13) y se centran (sobra 1 px, como en la cabeza). Mangas de 3 px: columnas 0-2 (brazo derecho, x −) y 13-15 (izquierdo, x +), solo de frente; la espalda de los brazos, las piernas y la suela verde de las zapatillas quedaron para 3c-2 (hecho en v2.123)
    torso_sur: { vista: 'down', f0: 12, f1: 16, c0: 2, c1: 13 }, torso_norte: { vista: 'back', f0: 12, f1: 16, c0: 2, c1: 13 }, manga_d_sur: { vista: 'down', f0: 12, f1: 16, c0: 0, c1: 2, sinBorde: 'o' }, manga_i_sur: { vista: 'down', f0: 12, f1: 16, c0: 13, c1: 15, sinBorde: 'o' },   // v2.179: sin el contorno oscuro del borde exterior (de frente se veía como un «nudo» a cada lado de la cara)
   
    // v2.123 (3c-2): ESPALDA de los brazos (de `back`, visto desde fuera: el brazo derecho de Oli, x −, queda a la derecha de quien mira) y PIERNAS enteras de 4×7 texels = pantalón 3 + calcetín 2 + zapatilla 2 (`filas` = fila del sprite de cada fila de la textura; la 19 se repite 3 veces porque el sprite tiene 1 sola fila de pantalón visible; la 22 es el contorno inferior, el borde oscuro de la suela). Columnas: pierna derecha (x −) 3-6 y pierna izquierda (x +) 9-12 de frente; de espalda al revés. La suela verde (`u`) sale sola del recorte.
    manga_d_norte: { vista: 'back', f0: 12, f1: 16, c0: 13, c1: 15 }, manga_i_norte: { vista: 'back', f0: 12, f1: 16, c0: 0, c1: 2 },
    // v2.123 (3b-3, mitad 2): COSTADOS de la cabeza, 11×11 texels (profundidad 11 px, filas 1-11 del sprite). Oeste = costado derecho de Oli (`side`, mira a la derecha), este = costado izquierdo (`sideL`, espejado: columnas 0-10).
    cabeza_oeste: { vista: 'side', f0: 1, f1: 11, c0: 1, c1: 11, sinPelo: true, sinBorde: 'g' }, cabeza_este: { vista: 'sideL', f0: 1, f1: 11, c0: 0, c1: 10, sinPelo: true, sinBorde: 'g' },
    pierna_d_sur: { vista: 'down', filas: [19, 19, 19, 20, 20, 21, 22], c0: 3, c1: 6 }, pierna_i_sur: { vista: 'down', filas: [19, 19, 19, 20, 20, 21, 22], c0: 9, c1: 12 },
    pierna_d_norte: { vista: 'back', filas: [19, 19, 19, 20, 20, 21, 22], c0: 9, c1: 12 }, pierna_i_norte: { vista: 'back', filas: [19, 19, 19, 20, 20, 21, 22], c0: 3, c1: 6 } };   // v2.119 (3b-3, mitad 1): + espalda de la cabeza (de `back`, filas 1-11)
  // v2.125 (3d): TRENZAS con textura en ZIGZAG y punta con transparencia. No se recortan del sprite (en el 2D las trenzas son 1 px sueltos): se generan con la paleta de Oli. Ids `trenza_roja_N` / `trenza_castana_N`, con N = alto en px (5 las laterales, 7 y 9 las traseras); ancho 2 texels (la caja mide 0,125 u). Fila 0 = arriba (junto al durag, color liso); luego el tono claro (`i` rojo claro, `d` castaño claro) salta de lado cada fila (zigzag del trenzado) y la última fila pierde un texel (punta; null = transparente).
  const TREN_ALTOS = [5, 7, 9], TREN_COLORES = { roja: ['c', 'i'], castana: ['b', 'd'] };
  const generadasOli = () => [].concat(...Object.keys(TREN_COLORES).map((k) => TREN_ALTOS.map((n) => 'trenza_' + k + '_' + n)));
  function texturaTrenza(id, C) {
    const m = /^trenza_(roja|castana)_(\d+)$/.exec(id); if (!m || !C || TREN_ALTOS.indexOf(+m[2]) < 0) return null;
    const [base, claro] = TREN_COLORES[m[1]], h = +m[2], px = [];
    for (let y = 0; y < h; y++) {
      const fila = y === 0 ? [base, base] : (y % 2 ? [claro, base] : [base, claro]);   // zigzag: el tono claro cambia de lado en cada fila
      if (y === h - 1) fila[y % 2 ? 1 : 0] = null;                                         // punta: pierde un texel
      px.push(fila.map((ch) => (ch ? C.pal[ch] : null)));
    }
    return { id, w: 2, h, px };
  }
  // v2.129 (Lali 3D, paso 3): las texturas, el atlas y las uv son GENÉRICOS: cada personaje trae un descriptor `ch` = { chars (id en G.CHARS), recortes, generadas() (ids pintados por código), generada(id, C), pad(id, px)?, region(pieza, cara) }. Oli = OLI (sin cambios: mismas texturas, mismo atlas, mismas uv); Lali = LALI (más abajo).
  //   `relleno` (letra de la paleta) pinta de ese color los texels transparentes del recorte (esquinas sin pixel en el sprite): para caras que tienen que salir opacas.
  const idsDe = (ch) => Object.keys(ch.recortes).concat(ch.generadas());
  function texturaDe(ch, id) {
    const r = ch.recortes[id], C = G.CHARS && G.CHARS[ch.chars];
    if (!r && C && ch.generada) return ch.generada(id, C);
    if (!r || !C) return null;
    const filas = r.vista === 'sideL' ? C.side.map((f) => f.split('').reverse().map((ch2) => (C.swapL && C.swapL[ch2]) || ch2)) : typeof C[r.vista] === 'function' ? C[r.vista](C.down, true) : C[r.vista], px = [];   // v2.123: `sideL` = `side` espejado con `swapL`, como en chars.js (Lali no tiene `swapL`: espejo tal cual)   // 'back' es una función que saca la espalda de `down`
    const ys = r.filas || Array.from({ length: r.f1 - r.f0 + 1 }, (_, i) => r.f0 + i);
    for (const y of ys) { const fila = []; for (let x = r.c0; x <= r.c1; x++) { let l = filas[y][x]; if (r.sinPelo && /[bcdilnp]/.test(l) && l !== 'a') l = 'g'; if (r.sinBorde && (x === r.c0 || x === r.c1) && l === 'a') l = r.sinBorde === true ? 'g' : r.sinBorde; fila.push(l !== '.' && C.pal[l] ? C.pal[l] : r.relleno ? C.pal[r.relleno] : null); } px.push(fila); }
    if (r.gafasFinas) gafasFinas(px, C.pal);
    if (ch.sinContorno) quitarContorno(px, C.pal[ch.sinContorno]);
    return { id, w: r.c1 - r.c0 + 1, h: ys.length, px };
  }
  // v2.134 (a petición del usuario): Lali sin líneas negras. El contorno oscuro del sprite (`a`) en el borde del recorte se sustituye por el color vecino de dentro; el `a` interior (cejas) se queda. Solo se usa si el personaje declara `sinContorno`.
  function quitarContorno(px, ol) {
    const h = px.length, w = px[0].length, o = px.map((f) => f.slice());
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (o[y][x] !== ol || !(x === 0 || x === w - 1 || y === 0 || y === h - 1)) continue;
      let c = null;   // el texel de color más cercano (distancia Manhattan; a igual distancia, el de dentro del recorte primero)
      for (let d = 1; d < w + h && !c; d++) for (let dy = -d; dy <= d && !c; dy++) { const r = d - Math.abs(dy); for (const dx of r ? [-r, r] : [0]) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < h && xx >= 0 && xx < w && o[yy][xx] !== ol && o[yy][xx] !== null) { c = o[yy][xx]; break; } } }
      if (c) px[y][x] = c;
    }
  }
  const OLI = { chars: 'rex', recortes: RECORTES, generadas: generadasOli, generada: (id, C) => (/^trenza_/.test(id) ? texturaTrenza(id, C) : null), pad: (id, px) => (id === 'cabeza_sur' ? [0, 1, 2, 3].map(() => px[0].map(() => PAL.piel)).concat(px) : px), region: (pieza, cara) => regionOli(pieza, cara) };
  const ids = () => idsDe(OLI);
  const textura = (id) => texturaDe(OLI, id);
  // GAFAS DE SOL (v2.116, a petición del usuario: las finas clásicas de la v2.115 parecían gafas de graduar; quiere gafas de sol como las del sprite 2D, pero con la unión central más fina: en el 2D la banda oscura mide 8×4 px y la unión de 2×4 px le comía mucha cara a Oli). Se PINTAN POR CÓDIGO sobre el recorte, solo en la textura 3D: el sprite 2D no cambia. Opción 4 («más bajas») elegida por el usuario.
  //   Dos lentes oscuras (`h`) de 3×3 texels con el brillo del sprite en la fila de en medio y la de abajo (blanco `z` y azul claro `y` arriba, azul claro `y` y oscuro `e` debajo; el mismo dibujo en las dos lentes, como en el 2D), unión de 1 fila × 2 px por arriba (la cara queda a la vista debajo) y patillas de 1 px a la altura de la fila de arriba. La fila 4 (la de debajo de las lentes) queda de piel. Coordenadas de la textura de 14×7 (fila 0 = fila 5 del sprite). Lo demás de la cara (frente, mejillas, boca) queda tal cual.
  const GAFAS_FINAS_CAJA = { f0: 1, f1: 4, c0: 1, c1: 12 };   // zona que repintan las gafas; fuera de ella la textura es el recorte exacto del sprite
  function gafasFinas(px, pal) {
    const M = pal.h, Z = pal.z, Y = pal.y, E = pal.e, S = pal.g;
    for (let y = 1; y <= 4; y++) for (let x = 3; x <= 10; x++) px[y][x] = S;   // se quita la banda oscura: queda la piel
    const lente = (x0) => {
      for (let y = 1; y <= 3; y++) for (let x = x0; x < x0 + 3; x++) px[y][x] = M;   // lente oscura de 3×3
      px[2][x0] = Z; px[2][x0 + 1] = Y; px[3][x0] = Y; px[3][x0 + 1] = E;           // brillo del sprite 2D
    };
    lente(3); lente(8);
    px[1][6] = M; px[1][7] = M;                                                  // unión fina: 1 fila
    px[1][2] = M; px[1][11] = M;                                                 // patillas
  }

  // ── Atlas y UV (v2.126, paso 4) ──  Todas las texturas de Oli en UNA imagen pequeña (datos puros; el pintor la dibuja en un lienzo). `cabeza_sur` se rellena con 4 filas de piel arriba para cubrir la cara entera (las filas 1-4 del sprite quedan bajo el durag). Celda blanca 1×1 (`blanco`) para las caras lisas (llevan su color en el vértice).
  const BRILLO = 1.12;                                              // el material multiplica por 1,12: así «luz» puede ser más clara que «base» (= paleta exacta del 2D)
  const TONO_TEX = { arriba: 1, luz: 0.95, base: 0.89, sombra: 0.72 };   // × BRILLO = tono de las caras con textura
  function atlasDe(ch) {
    const celdas = [{ id: 'blanco', w: 1, h: 1, px: [['#ffffff']] }];
    idsDe(ch).forEach((id) => { const t = texturaDe(ch, id); if (!t) return; const px = ch.pad ? ch.pad(id, t.px) : t.px; celdas.push({ id, w: t.w, h: px.length, px }); });
    const AW = 64, rects = {}; let x = 0, y = 0, fila = 0;
    celdas.forEach((c) => { if (x + c.w > AW) { x = 0; y += fila + 1; fila = 0; } c.x = x; c.y = y; rects[c.id] = { x, y, w: c.w, h: c.h }; x += c.w + 1; fila = Math.max(fila, c.h); });
    return { w: AW, h: y + fila, celdas, rects };
  }
  const atlas = () => atlasDe(OLI);
  const PIEZA = {}; PIEZAS.forEach((p) => { PIEZA[p.id] = p; });
  function regionOli(pieza, cara) {
    const sn = cara === 'sur' || cara === 'norte', lados = sn || cara === 'este' || cara === 'oeste', m = /^(pantalon|calcetin|zapatilla)_([di])$/.exec(pieza);
    if (pieza === 'cabeza' && lados) return { id: 'cabeza_' + cara, fy: 4, fh: 7, cw: sn ? 14 : 11 };   // v2.195: la cabeza de piel termina donde empieza el durag (y 1,125; 7 px): solo se usan las 7 filas de abajo de la textura de 11 (las 4 de arriba quedaban bajo la tela negra)
    if (pieza === 'torso' && sn) return { id: 'torso_' + cara, fy: 0, fh: 5, cw: 11 };
    if (/^manga_[di]$/.test(pieza) && sn) return { id: pieza + '_' + cara, fy: 0, fh: 5, cw: 3 };
    if (m && sn) { const f = { pantalon: [0, 3], calcetin: [3, 2], zapatilla: [5, 2] }[m[1]]; return { id: 'pierna_' + m[2] + '_' + cara, fy: f[0], fh: f[1], cw: 4 }; }
    if (/^trenza/.test(pieza) && lados) { const b = PIEZA[pieza]; return { id: 'trenza_' + (b.col === PAL.rojo ? 'roja' : 'castana') + '_' + Math.round(b.h * 16), fy: 0, fh: Math.round(b.h * 16), cw: 2 }; }
    return null;
  }
  const region = (pieza, cara) => regionOli(pieza, cara);
  function uvDe(ch, q, at) {
    const R = ch.region(q.pieza, q.cara), E = 0.02, e4 = CARAS.find((c) => c[0] === q.cara)[2];
    if (!R || !at.rects[R.id]) { const b = at.rects.blanco; return { tex: false, uv: e4.map(() => [(b.x + 0.5) / at.w, 1 - (b.y + 0.5) / at.h]) }; }
    const r = at.rects[R.id], arriba = q.cara === 'arriba';
    const uv = e4.map(([sx, sy, sz]) => {
      const fx = q.cara === 'sur' || arriba ? (sx + 1) / 2 : q.cara === 'norte' ? (1 - sx) / 2 : q.cara === 'este' ? (1 - sz) / 2 : (1 + sz) / 2, fv = arriba ? (1 - sz) / 2 : 1 - (sy + 1) / 2;   // v2.129: la cara de arriba (hoy solo la tapa del pelo de Lali) lee la textura con el frente arriba
      return [(r.x + E + fx * (R.cw - 2 * E)) / at.w, 1 - (r.y + R.fy + E + fv * (R.fh - 2 * E)) / at.h];
    });
    return { tex: true, uv };
  }
  const uvPoligono = (q, at) => uvDe(OLI, q, at);

  // ── Texturas de Lali (v2.129, paso 3 de docs/FICHA_LALI_3D.md) ──  Recortes de G.CHARS.luna (frente `down`, espalda `back(down)`, costado derecho `side`, izquierdo = espejo sin cambiar colores). Coordenadas = filas y columnas del mapa de letras. 1 texel = 1 px del 2D.
  //   Derecha de Lali = x − = a la izquierda de la imagen de frente (columnas 0-2); de espalda al revés (13-15). Las caras de los costados de torso, brazos, mechones, piernas y zapatillas se quedan en el color liso de su caja (como el torso de Oli).
  const RECORTES_LALI = {
    cabeza_sur: { vista: 'down', f0: 0, f1: 9, c0: 2, c1: 13, relleno: 'a' }, cabeza_norte: { vista: 'back', f0: 0, f1: 9, c0: 2, c1: 13, relleno: 'a' },   // 12×10; las esquinas de la fila 0 (sin pixel en el sprite) salen del color del contorno
    cabeza_oeste: { vista: 'side', f0: 0, f1: 9, c0: 1, c1: 10, relleno: 'a' }, cabeza_este: { vista: 'sideL', f0: 0, f1: 9, c0: 1, c1: 10, relleno: 'a' },   // 10×10; la punta de la nariz (columna 11) no cabe en la caja
    torso_sur: { vista: 'down', f0: 10, f1: 14, c0: 5, c1: 10 }, torso_norte: { vista: 'back', f0: 10, f1: 14, c0: 5, c1: 10 },   // 6×5: chaqueta, camisa crema, cuello y botón (de espalda, pelo en la nuca y rayas)
    manga_d_sur: { vista: 'down', f0: 10, f1: 15, c0: 0, c1: 2, relleno: 'a' }, manga_i_sur: { vista: 'down', f0: 10, f1: 15, c0: 13, c1: 15, relleno: 'a' }, manga_d_norte: { vista: 'back', f0: 10, f1: 15, c0: 13, c1: 15, relleno: 'a' }, manga_i_norte: { vista: 'back', f0: 10, f1: 15, c0: 0, c1: 2, relleno: 'a' },   // 3×6: manga azul y puño
    mano_d_sur: { vista: 'down', f0: 16, f1: 17, c0: 0, c1: 2, relleno: 'a' }, mano_i_sur: { vista: 'down', f0: 16, f1: 17, c0: 13, c1: 15, relleno: 'a' }, mano_d_norte: { vista: 'back', f0: 16, f1: 17, c0: 13, c1: 15, relleno: 'a' }, mano_i_norte: { vista: 'back', f0: 16, f1: 17, c0: 0, c1: 2, relleno: 'a' },   // 3×2: mano de piel y contorno
    mechon_d_sur: { vista: 'down', f0: 10, f1: 17, c0: 3, c1: 4 }, mechon_i_sur: { vista: 'down', f0: 10, f1: 17, c0: 11, c1: 12 }, mechon_d_norte: { vista: 'back', f0: 10, f1: 17, c0: 11, c1: 12 }, mechon_i_norte: { vista: 'back', f0: 10, f1: 17, c0: 3, c1: 4 },   // 2×8: pelo largo con el lazo rosa en la fila 6
    pierna_d_sur: { vista: 'down', f0: 15, f1: 18, c0: 5, c1: 7 }, pierna_i_sur: { vista: 'down', f0: 15, f1: 18, c0: 8, c1: 10 }, pierna_d_norte: { vista: 'back', f0: 15, f1: 18, c0: 8, c1: 10 }, pierna_i_norte: { vista: 'back', f0: 15, f1: 18, c0: 5, c1: 7 },   // 3×4: pantalón azul oscuro
    zapatilla_d_sur: { vista: 'down', f0: 19, f1: 20, c0: 4, c1: 7 }, zapatilla_i_sur: { vista: 'down', f0: 19, f1: 20, c0: 8, c1: 11 }, zapatilla_d_norte: { vista: 'back', f0: 19, f1: 20, c0: 8, c1: 11 }, zapatilla_i_norte: { vista: 'back', f0: 19, f1: 20, c0: 4, c1: 7 },   // 4×2: blanca con detalle rosa y borde oscuro de la suela
  };
  // Lo que el sprite NO dibuja se pinta por código con la paleta del sprite (sin azar): la TAPA del pelo (12×10: rubio `b` con la raya `c` de 2 px, columnas 5-6 de la tapa = 7-8 del sprite, de delante atrás) y los COSTADOS y las tapas de torso, brazos, mechones, piernas y zapatillas (así toda la figura recibe el mismo tono de luz que las caras de frente y de espalda y no se mezclan colores lisos con texturas al girar la cámara). Una textura por familia de piezas, compartida por izquierda y derecha (`torso_oeste`, `manga_arriba`…).
  const FAMILIAS_LALI = {   // lado = filas de letras (de arriba abajo) del costado; arriba = [letra] de la tapa (`null`: la tapa no se ve y queda lisa)
    torso: { lado: ['ggggg', 'ggggg', 'ggggg', 'ggggg', 'ggggg'], arriba: 'g' }, manga: { lado: ['ggg', 'ggg', 'ggg', 'ggg', 'ggg', 'kkk'], arriba: 'g' }, mano: { lado: ['ddd', 'ddd'], arriba: null },
    mechon: { lado: null, arriba: null }, pierna: { lado: ['llll', 'llll', 'llll', 'llll'], arriba: null }, zapatilla: { lado: ['nnnnn', 'nnnnn'], arriba: 'n' } };
  const FAMILIAS_IDS = [].concat(...Object.keys(FAMILIAS_LALI).map((f) => ['oeste', 'este'].concat(FAMILIAS_LALI[f].arriba ? ['arriba'] : []).map((c) => f + '_' + c)));
  function tapaLali(C) { const px = []; for (let y = 0; y < 10; y++) px.push(Array.from({ length: 12 }, (_, x) => C.pal[x === 5 || x === 6 ? 'c' : 'b'])); return { id: 'cabeza_arriba', w: 12, h: 10, px }; }
  function generadaLali(id, C) {
    if (id === 'cabeza_arriba') return tapaLali(C);
    const m = /^(torso|manga|mano|mechon|pierna|zapatilla)_(oeste|este|arriba)$/.exec(id); if (!m) return null;
    const F = FAMILIAS_LALI[m[1]], col = (l) => C.pal[l];
    if (m[2] === 'arriba') { if (!F.arriba) return null; const d = PIEZA_LALI[m[1] === 'torso' ? 'torso' : m[1] + '_d'], w = Math.round(d.w * 16), h = Math.round(d.d * 16); return { id, w, h, px: Array.from({ length: h }, () => Array(w).fill(col(F.arriba))) }; }
    let filas = F.lado; if (m[1] === 'mechon') filas = C.down.slice(10, 18).map((f) => (f[3] === 'c' ? 'bcb' : f[3] === 'm' ? 'mmm' : 'bbb'));   // el costado del mechón: como el frente (la raya `c` y el lazo `m` de la fila 6), simétrico
    return { id, w: filas[0].length, h: filas.length, px: filas.map((f) => f.split('').map(col)) };
  }
  const PIEZA_LALI = {}; PIEZAS_LALI.forEach((p) => { PIEZA_LALI[p.id] = p; });
  function regionLali(pieza, cara) {
    const sn = cara === 'sur' || cara === 'norte', lados = sn || cara === 'este' || cara === 'oeste', b = PIEZA_LALI[pieza]; if (!b) return null;
    if (pieza === 'cabeza') return cara === 'arriba' ? { id: 'cabeza_arriba', fy: 0, fh: 10, cw: 12 } : lados ? { id: 'cabeza_' + cara, fy: 0, fh: 10, cw: sn ? 12 : 10 } : null;
    const fam = pieza.replace(/_[di]$/, ''), F = FAMILIAS_LALI[fam]; if (!F) return null;
    if (sn) return { id: pieza + '_' + cara, fy: 0, fh: Math.round(b.h * 16), cw: Math.round(b.w * 16) };
    if (cara === 'este' || cara === 'oeste') return F.lado || fam === 'mechon' ? { id: fam + '_' + cara, fy: 0, fh: Math.round(b.h * 16), cw: Math.round(b.d * 16) } : null;
    return cara === 'arriba' && F.arriba ? { id: fam + '_arriba', fy: 0, fh: Math.round(b.d * 16), cw: Math.round(b.w * 16) } : null;
  }
  const LALI = { chars: 'luna', sinContorno: 'a', recortes: RECORTES_LALI, generadas: () => ['cabeza_arriba'].concat(FAMILIAS_IDS), generada: generadaLali, region: regionLali };

  // ── Geometría ──
  const CARAS = [   // cara, normal local, 4 esquinas (signos de x, y, z sobre el semiancho), en el orden que mira hacia fuera (antihorario visto desde fuera)
    ['sur', [0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
    ['norte', [0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]],
    ['este', [1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]]],
    ['oeste', [-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]],
    ['arriba', [0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]]],
    ['abajo', [0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
  ];
  // giro alrededor de x (swing de brazos y piernas): con a > 0 lo que cuelga bajo el pivote se va hacia delante (+z)
  const rotX = (p, c, a) => { const dy = p[1] - c[1], dz = p[2] - c[2], co = Math.cos(a), si = Math.sin(a); return [p[0], c[1] + co * dy + si * dz, c[2] - si * dy + co * dz]; };
  const rotXn = (n, a) => { const co = Math.cos(a), si = Math.sin(a); return [n[0], co * n[1] + si * n[2], -si * n[1] + co * n[2]]; };
  const rotY = (p, a) => { const co = Math.cos(a), si = Math.sin(a); return [p[0] * co + p[2] * si, p[1], -p[0] * si + p[2] * co]; };   // yaw: el «adelante» local (0, 0, 1) pasa a (sin a, 0, cos a)
  // tono de una cara según hacia dónde mira EN EL MUNDO (mismo reparto que el torno de volumenes.js)
  function tono(n) { if (n[1] > 0.7) return 'arriba'; const s = -n[0] + 0.5 * n[2]; return s >= 0.75 ? 'luz' : s >= -0.25 ? 'base' : 'sombra'; }
  const K = { arriba: 'l2', luz: 'l1', base: 'base', sombra: 's1' };
  const RAMPAS = {};   // una rampa por color, calculada una sola vez (se pide 160 veces por cuadro)
  const color = (col, tn, suave) => { if (!G.rampa) return col; const k = col + (suave ? '|s' : ''); return (RAMPAS[k] || (RAMPAS[k] = G.rampa(col, suave ? { contraste: 0.5 } : undefined)))[K[tn]]; };   // `suave`: rampa de poco contraste (el durag oscuro no se vuelve violeta arriba)   // la rampa del juego (src/rampas.js); sin ella (pruebas muy sueltas) el color base

  // v2.184 (caña desde la mano): centro de una pieza (p. ej. 'mano_d') en la geometría ya posada y girada, respecto a los pies; null si no está
  function manoDe(g, pieza) { let n = 0; const s = [0, 0, 0]; g.poligonos.forEach((q) => { if (q.pieza === pieza) q.v.forEach((p) => { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; n++; }); }); return n ? [s[0] / n, s[1] / n, s[2] / n] : null; }
  function geometria(po) { return geometriaDe(PIEZAS, po); }   // Oli (como siempre)
  function geometriaDe(lista, po) {   // v2.128: la misma cuenta para cualquier personaje (Oli: PIEZAS; Lali: PIEZAS_LALI)
    po = po || pose(0, false, 'down');
    const ang = { cabeza: po.cabeza || 0, torso: 0, brazoI: po.brazoI, brazoD: po.brazoD, piernaI: po.piernaI, piernaD: po.piernaD };
    const poligonos = [], minY = { piernaI: 0, piernaD: 0 };
    lista.forEach((p) => {
      const sube = p.grupo.indexOf('pierna') === 0 ? 0 : po.rebote;   // rebota todo lo que va sobre las caderas (torso, cabeza, brazos); las piernas siguen pisando el suelo (el torso baja 0,0625 sobre ellas: tapa el hueco)
      CARAS.forEach(([cara, n, esq]) => {
        if (p.sin.indexOf(cara) >= 0) return;
        const a = ang[p.grupo] || 0, nl = a ? rotXn(n, a) : n;
        const v = esq.map(([sx, sy, sz]) => {
          let q = [p.x + sx * p.w / 2, p.y0 + (sy + 1) * p.h / 2, p.z + sz * p.d / 2];
          if (a) q = rotX(q, p.pivote, a);
          q[1] += sube;
          return rotY(q, po.yaw);
        });
        const nm = rotY(nl, po.yaw), tn = tono(nm), col = p.col;
        poligonos.push({ pieza: p.id, grupo: p.grupo, cara, tono: tn, col, color: color(col, p.mate && tn === 'arriba' ? 'luz' : tn, p.suave), n: nm, v });
        if (minY[p.grupo] !== undefined) v.forEach((q) => { minY[p.grupo] = Math.min(minY[p.grupo], q[1]); });
      });
    });
    // al abrir la pierna la punta (o el talón) de la zapatilla se hundiría en el suelo: se sube esa pierna lo justo para que pise (como mucho 0,066 u; sube hacia dentro del torso, que la tapa)
    poligonos.forEach((q) => { const h = -minY[q.grupo]; if (h > 0) q.v.forEach((w) => { w[1] += h; }); });
    let alto = 0, ancho = 0; poligonos.forEach((q) => q.v.forEach((w) => { alto = Math.max(alto, w[1]); ancho = Math.max(ancho, Math.abs(w[0]), Math.abs(w[2])); }));
    return { poligonos, triangulos: poligonos.length * 2, altoTotal: alto, ancho: ancho * 2 };
  }

  // v2.128: el personaje por id del sprite ('rex' = Oli, 'luna' = Lali). Comparten pose, giro, tono y geometría; cada uno trae su paleta, sus piezas y su altura. v2.129: + ids, textura, atlas, region y uvPoligono del personaje.
  const DATOS = { rex: { id: 'rex', PAL, PIEZAS, ALTO_2D, ch: OLI }, luna: { id: 'luna', PAL: PAL_LALI, PIEZAS: PIEZAS_LALI, ALTO_2D: ALTO_2D_LALI, ch: LALI } };
  function de(id) {
    const d = DATOS[id]; if (!d) return null;
    return { id: d.id, PAL: d.PAL, PIEZAS: d.PIEZAS, ALTO_2D: d.ALTO_2D, MIN_PIEZA, MAX_TRIANGULOS, BRILLO, TONO_TEX, RECORTES: d.ch.recortes, piezas: () => copiar(d.PIEZAS), pose, girar, meta, amplitud, tono, geometria: (po) => geometriaDe(d.PIEZAS, po),
      ids: () => idsDe(d.ch), textura: (t) => texturaDe(d.ch, t), atlas: () => atlasDe(d.ch), region: d.ch.region, uvPoligono: (q, at) => uvDe(d.ch, q, at) };   // v2.129: texturas, atlas y uv de cada personaje
  }

  G.personaje3d = { manoDe, meta, amplitud, ESTABLE_S, AMP_S, PAL, PIEZAS, MIN_PIEZA, MAX_TRIANGULOS, ALTO_2D, CICLO, GIRO_S, YAW, piezas, pose, girar, geometria, tono, textura, ids, atlas, region, uvPoligono, BRILLO, TONO_TEX, RECORTES, GAFAS_FINAS_CAJA, de };
})(typeof window !== 'undefined' ? window : globalThis);
