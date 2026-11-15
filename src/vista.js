// vista.js — QUÉ se ve de cada personaje y criatura, sin dibujar nada (v2.51b, paso A2 del plan 2D / HD-2D).
// Es el contrato entre el mundo (src/motor.js: posiciones y estado) y cualquier «pintor»: el 2D de src/game.js y, más adelante, el HD-2D.
// Aquí solo hay cuentas (qué fotograma, cuánto se separa del suelo, cuánto se balancea); los dos pintores las leen y cada uno las dibuja a su manera.
// No toca el DOM, ni el lienzo, ni el estado de la partida. `reloj` es el reloj de animación del pintor (segundos).
(function (root) {
  'use strict';
  const G = root.G;
  const MANOS = { rex: { down: [13, 17], up: [13, 17], side: [5, 17], sideL: [5, 17], h: 23 }, luna: { down: [13, 16], up: [13, 16], side: [6, 15], sideL: [6, 15], h: 21 } };   // [columna, fila] de la mano en el mapa de letras de src/chars.js; h = filas del mapa
  G.vista = {
    // cuánto se separa del suelo la criatura ahora mismo (px del juego, hacia arriba)
    altura(c, reloj) {
      const t = G.traits(c.id);
      if (t.float) return t.float[0] * (0.6 + 0.4 * Math.sin(reloj * t.float[1] * 2 * Math.PI / 2));
      if (t.hop && c.moving) return Math.abs(Math.sin(c.tm * t.hop[1] * 0.5)) * t.hop[0];
      return 0;
    },
    // todo lo que hace falta para dibujar una criatura: fotograma, altura, balanceo, cabeceo y sombra
    criatura(c, reloj) {
      const t = G.traits(c.id), idle = t.flick && !c.moving && Math.sin(reloj * t.flick) > 0.7 ? 2 : 0; // Aguacarax mueve la cola cuando está parado (fotograma 2)
      const ojo = t.eye && c.talk > 0 ? 3 : null; // Somnaris abre un ojo (fotograma 3) mientras le hablas
      const frame = ojo !== null ? ojo : c.moving && !t.hop ? ((c.tm / 0.2) | 0) % 2 : idle, up = G.vista.altura(c, reloj);
      const sway = t.sway && c.moving ? Math.round(Math.sin(c.tm * t.sway[1]) * t.sway[0]) : 0; // Aguacaryn anda contoneándose (1 px a cada lado)
      const nod = t.nod && !c.moving && !(c.talk > 0) ? (Math.sin(reloj * t.nod * 2) > 0.55 ? 1 : 0) : 0; // Somnel cabecea cuando está parada
      const sh = t.shadow, shrink = t.float || t.hop ? Math.max(0.55, 1 - up / 9) : 1; // la sombra encoge cuando se separa del suelo
      return { id: c.id, dir: c.dir, frame, up, sway, nod, sombra: { ancho: Math.round(sh[0] * shrink), alto: sh[1], separacion: t.float ? sh[2] : 0 } };
    },
    // v2.181 (Pesca 2-4): qué se ve mientras alguien pesca, sin dibujar nada. Distancias en px respecto a los pies (x a la derecha, y hacia abajo); `s` y `r` van de 0 a 1.
    //   M = hacia dónde mira · cx, cy = centro de la casilla de agua de delante (donde cae el corcho) · s = avance del lanzamiento (1 = ya está en el agua) · vuelta = recogida tras un fallo
    //   hund = cuánto se hunde el corcho (0-1) · bob = vaivén del corcho (−1…1) · anillos = ondas [{ r }] · pez = null | { s } (el salto) · senal = «¡ha picado!» · brazo = [derecho, izquierdo] en radianes (0 = colgando, π/2 = al frente)
    radioSombra(id, th) { const E = G.PECES && G.PECES[id], L = E ? E.forma.L : 12; return 1 + 0.08 * Math.sin(2 * th + L) + 0.04 * Math.sin(3 * th + 2 * L); },   // v2.194: contorno orgánico y fijo por especie de la mancha de pesca (lo usan los dos pintores)
    pesca(j, reloj) {
      const f = j.pesca; if (!f) return null;
      const T = 16, M = G.mundo.MIRAS[j.dir] || [0, 1], c = (u) => Math.max(0, Math.min(1, u)), t = f.t || 0;
      const v = { fase: f.fase, M, cx: (Math.floor(j.x / T) + M[0]) * T + 8 - j.x, cy: (Math.floor(j.y / T) + M[1]) * T + 8 - j.y, s: 1, vuelta: 0, hund: 0, bob: Math.sin(reloj * 2.4), anillos: [], pez: null, sombra: null, senal: false, ventana: false, brazo: [1.1, 1.0] };
      // v2.194: UNA mancha oscura y redonda bajo el corcho, sin forma de pez: aparece con fundido en los 2 últimos segundos de la espera (aviso), y en el pique y el forcejeo vibra con el tirón; su tamaño es el de la especie (rx, ry en casillas). anillos con `entra` se CIERRAN hacia el corcho: el toque va cuando llegan a 0
      const sombra = (a) => { if (!f.pez || a <= 0.01) return; const E = G.PECES && G.PECES[f.pez], rx = (E ? E.forma.L : 12) * 0.028; v.sombra = { id: f.pez, rx, ry: rx * 0.55, a, resp: 1 + 0.05 * Math.sin(reloj * 3) }; };
      if (f.fase === 'lanzar') { v.s = c(t / 0.7); v.brazo = [2.1 - 1.0 * v.s, 1.95 - 1.0 * v.s]; }
      else if (f.fase === 'espera') { const av = c((t - (f.espera || 6) + 2) / 2); sombra(0.55 * av * av * (3 - 2 * av));
        (f.tirones || []).forEach((ti) => { const w = (t - ti) / 0.5; if (w >= 0 && w <= 1) { v.hund = Math.max(v.hund, 0.35 * Math.sin(Math.PI * w)); v.anillos.push({ r: w }); v.brazo = [1.18, 1.08]; } }); }
      else if (f.fase === 'pique') { v.hund = c(t / 0.12); v.senal = true; sombra(0.62 + 0.08 * Math.sin(t * 28)); v.anillos.push({ r: (t * 1.6) % 1 }, { r: (t * 1.6 + 0.5) % 1 }); v.brazo = [1.32 + 0.06 * Math.sin(t * 30), 1.22]; }
      else if (f.fase === 'forcejeo') { v.hook = { id: f.pez, fase: t * 8 }; v.hund = 0.3 + 0.25 * Math.sin(t * 14); sombra(0.62 + 0.08 * Math.sin(t * 14)); v.brazo = [1.35 + 0.1 * Math.sin(t * 16), 1.25];
        const mg = (f.pez && G.PECES && G.PECES[f.pez] && G.PECES[f.pez].margen) || 0.3; (f.beats || []).forEach((b, n) => { const w = b - t; if (!f.hechos[n] && w <= 0.8 && w >= -mg) { v.anillos.push({ r: c(1 - w / 0.8), entra: true }); if (Math.abs(w) <= mg) v.ventana = true; } else if (f.hechos[n] && t - b < 0.4 && t >= b - 0.3) v.anillos.push({ r: c((t - b + 0.3) / 0.7) }); }); }
      else if (f.fase === 'salto') { sombra(0.62 * (1 - c(t / 0.3))); const u = c(t / 1.3), E = f.pez && G.PECES ? G.PECES[f.pez] : null; v.pez = { s: u, id: f.pez || null, color: E ? E.color : '#9fd0e8', pitch: Math.cos(Math.PI * u) * 1.1, fase: u * 22 }; if (u > 0.8) v.anillos.push({ r: (u - 0.8) / 0.2 }); if (u < 0.15) v.anillos.push({ r: u / 0.15 }); v.brazo = [1.9, 1.8]; }
      else if (f.fase === 'listo') { v.s = 0; v.vuelta = 1; v.brazo = [1.5, 1.4]; }   // v2.222: caña en la mano, hilo recogido, esperando a que se vuelva a lanzar
      else if (f.fase === 'fallo') { sombra(0.62 * (1 - c(t / 0.3))); v.vuelta = c(t / 0.9); v.s = 1 - v.vuelta; v.brazo = [1.5, 1.4]; }
      return v;
    },
    // v2.184: dónde está la mano que sujeta la caña en cada sprite (bloque de 2×1 px de la mano que queda más cerca de la cámara/del lado de la caña) y cómo repintarla encima de la caña.
    //   x, y = centro respecto a los pies (px; +x derecha, +y abajo) · clave, sx, sy, w, h = bloque en el lienzo del sprite · espejo = el sprite se dibuja espejado (Lali mirando a la izquierda)
    manoPesca2D(id, dir) {
      const p = G.vista.persona(id, dir, false, 0), look = G.NAMES[id], H = MANOS[look]; if (!H) return null;
      const w = p.vista === 'side' || p.vista === 'sideL' ? 12 : 16, [gx, gy] = H[p.vista], sx = gx + Math.floor((18 - w) / 2), sy = gy + 24 - H.h;
      return { clave: p.clave, espejo: p.espejo, sx, sy, w: 2, h: 1, x: p.espejo ? -(sx + 1 - 9) : sx + 1 - 9, y: sy + 0.5 - 22 };
    },
    // v2.324: entrenadores autónomos visibles en un mapa: [{ id (sprite), x, y, dir, mv, tm, nom, ag }] (los calcula src/agentes_cuerpo.js; aquí solo se leen)
    agentes(est, mapaId) { return G.agentes && G.agentes.cuerpo ? G.agentes.cuerpo.cuerpos(est, mapaId) : []; },
    // qué sprite usa un jugador (Oli o Lali): 'down' | 'up' | 'side' | 'sideL', fotograma (0 quieto, 1 y 2 pasos) y si hay que espejarlo
    persona(id, dir, moving, tm) {
      const look = G.NAMES[id], tieneIzq = !!G.spr[`${look}_sideL_0`], vista = dir === 'left' ? (tieneIzq ? 'sideL' : 'side') : dir === 'right' ? 'side' : dir;
      const frame = moving ? 1 + (((tm / 0.18) | 0) % 2) : 0;
      return { id, vista, frame, clave: `${look}_${vista}_${frame}`, espejo: dir === 'left' && !tieneIzq }; // Lali solo trae perfil derecho: el izquierdo es el espejo
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
