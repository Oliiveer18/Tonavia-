// sombras_proyectadas.js — SOMBRAS PROYECTADAS DEL 2D (v2.100). Solo el 2D: el HD-2D no las usa (queda en pausa hasta que tenga texturas) y su suelo horneado no pasa por aquí.
// Método (el de la demo tools/demo_sombras/inject2d.js, aprobada): la sombra es la SILUETA REAL de cada sprite, inclinada. Cada píxel opaco que está h píxeles por encima de la línea
// de base deja un píxel de sombra h·SX a la derecha y h·SY hacia abajo (luz arriba-izquierda → sombra abajo-derecha, pendiente 2:1). Todo va a UNA máscara y se pinta una sola vez
// (donde dos sombras se solapan NO se oscurece doble; gana la más fuerte). Nada sobre el agua. Los árboles (capa propia, no son objetos) nunca proyectan.
// Ajustes aprobados: DEGRADADO en los edificios (fuerte pegada a la pared, más suave al alejarse), tejados y cúpula con sombra más corta (corto), tono por superficie (arena más cálida y
// clara, tierra oscura más suave), vallas bajas sin sombra y personajes y criaturas sin sombra sobre el huerto.
// Se pinta justo después de la luz de región (src/game.js, draw), antes de objetos y personajes. Se apaga con ?sombrasp=0, con el botón «Sombras: no» (G.SOMBREADO.ACTIVO) o con
// G.sombrasp.AJUSTES.ACTIVO = false. Con la capa apagada no se hace NINGUNA llamada de dibujo (el juego es idéntico al de antes: huella igual).
(function (root) {
  'use strict';
  const G = root.G, T = 16;
  const OFF = (() => { try { return typeof location !== 'undefined' && /[?&]sombrasp=0/.test(location.search || ''); } catch (e) { return false; } })();
  const AJUSTES = {
    ACTIVO: !OFF, ENTIDADES: false,                // v2.101: personajes y criaturas NO proyectan (llevan su sombra de siempre bajo los pies); true los vuelve a activar
    SX: 0.45, SY: 0.225,                       // inclinación 2:1: por cada píxel de altura, 0,45 a la derecha y 0,225 hacia abajo
    mul: [168, 158, 214], mulArena: [206, 184, 224], mulTierra: [214, 204, 230], // multiplicadores (violeta frío) sobre césped, arena y tierra oscura
    g1: 20, g2: 44, fuerza: [0, 1, 0.62, 0.36, 0.75], // edificios: nivel 1 hasta h = g1 (fuerza 1), nivel 2 hasta g2 (0,62), nivel 3 más arriba (0,36)
    corto: 0.75,                               // edificios: por encima de g1 la altura de la sombra se multiplica por esto (tejado y cúpula más cortos)
  };
  const NO = { juncos2: 1, juncos3: 1, nenufar: 1, nenufar_flor: 1, puente_albanota: 1, huerto: 1, valla_v: 1, valla_ni: 1, valla_nd: 1, valla_9: 1 }; // sin sombra: lo que va en el agua, lo que se pisa y las vallas bajas
  const SUAVE = { banco: 1, farola: 0.85, cartel: 1, barril: 1, maceta: 1, maceta_i: 1, espantapajaros: 1 }; // v2.101: mobiliario con la sombra un poco más suave (nivel 4 = 75 % de fuerza); el número es el largo (farola, 85 %)
  const REDONDO = { fuente: 1 }; // v2.101: piezas de planta redonda: su suelo no es una línea recta, así que la altura de cada píxel se mide desde lo más bajo de SU columna (si no, los costados del estanque parecen elevados y la sombra se despega)
  const EDIF = { casa: 1, casa_lali: 1, casa_oli: 1, laboratorio: 1, centro_pc: 1, tienda: 1, ermita: 1 }; // edificios: sombra con degradado
  const activo = () => !!(AJUSTES.ACTIVO && G.SOMBREADO && G.SOMBREADO.ACTIVO);

  // ── Lo PURO (se prueba sin lienzo) ──
  // h = píxeles sobre el suelo; edif = es un edificio. → dónde cae el píxel (dx, dy respecto a su base) y con qué nivel de fuerza (1 fuerte · 3 muy suave).
  function proyectar(h, edif, largo) {
    const he = (edif && h > AJUSTES.g1 ? AJUSTES.g1 + (h - AJUSTES.g1) * AJUSTES.corto : h) * (largo || 1);
    return { dx: Math.round(he * AJUSTES.SX), dy: Math.round(he * AJUSTES.SY), nivel: edif ? (h <= AJUSTES.g1 ? 1 : h <= AJUSTES.g2 ? 2 : 3) : 1 };
  }
  // qué hay bajo la sombra, por el color del suelo ya pintado: 0 agua (no se pinta) · 1 césped y resto · 2 arena · 3 tierra oscura
  function claseSuelo(r, g, b) {
    if (b > r + 40 && b > g + 10) return 0;
    if (r > 200 && g > 175 && b < 200 && r - b > 40) return 2;
    if (r < 150 && r > g + 20 && g > b) return 3;
    return 1;
  }
  const rgb = (c, f) => 'rgb(' + c.map((v) => Math.round(255 - (255 - v) * f)).join(',') + ')';
  function colores() { return [null, AJUSTES.mul, AJUSTES.mulArena, AJUSTES.mulTierra].map((c) => c && [0, 1, 2, 3, 4].map((n) => rgb(c, AJUSTES.fuerza[n] || 1))); }

  // ── Siluetas (se calculan una vez y se guardan) ──
  const SIL = {}, SILC = new WeakMap();
  function silueta(tipo) { // píxeles opacos de un objeto con su altura sobre su línea de base
    if (SIL[tipo]) return SIL[tipo]; const OB = G.capas.OBJETOS, d = OB[tipo], c = G.makeCanvas(d.w, d.h), x = c.getContext('2d'), o = { tipo, x: 0, y: 0 }, cam = { x: d.ox, y: d.oy };
    G.capas.dibujarBase(x, o, cam); if (d.encima !== false) G.capas.dibujarEncima(x, [{ objeto: o }], cam);
    const im = x.getImageData(0, 0, d.w, d.h).data, pts = [], br = d.pieY - d.oy, red = !!REDONDO[tipo], fondo = [];
    if (red) for (let px = 0; px < d.w; px++) { let b = -1; for (let py = d.h - 1; py >= 0 && b < 0; py--) if (im[(py * d.w + px) * 4 + 3] > 40) b = py; fondo.push(Math.min(b + 1, br)); } // fila de suelo de cada columna (justo bajo su último píxel, sin pasar de la línea de base)
    for (let py = 0; py < d.h; py++) for (let px = 0; px < d.w; px++) { const b = red ? fondo[px] : br; if (im[(py * d.w + px) * 4 + 3] > 40 && b - py >= 1) pts.push([px, py, b - py, b]); }
    return (SIL[tipo] = { pts, br });
  }
  function siluetaSprite(cv) { // todos los píxeles opacos de un sprite (la base se decide al colocarlo)
    let s = SILC.get(cv); if (s) return s; const im = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, pts = [];
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++) if (im[(py * cv.width + px) * 4 + 3] > 40) pts.push([px, py]);
    s = { pts }; SILC.set(cv, s); return s;
  }

  // ── Pintar ──
  // ents = personajes y criaturas que se ven ahora: { s: sprite (G.spr / G.creatureSprite), x: columna del centro en pantalla, base: fila de los pies, top: fila de arriba del sprite, dx: balanceo, espejo }
  let MASK = null;
  function pintar(ctx, m, cam, VW, VH, ents) {
    if (!activo()) return;
    const OB = G.capas.OBJETOS, objetos = (m && m.objetos) || [], huertos = objetos.filter((o) => o.tipo === 'huerto' && OB.huerto);
    const hayEnt = AJUSTES.ENTIDADES && ents && ents.length; if (!objetos.length && !hayEnt) return;
    const suelo = ctx.getImageData(0, 0, VW, VH).data;
    if (!MASK || MASK.length !== VW * VH) MASK = new Uint8Array(VW * VH); else MASK.fill(0);
    const mask = MASK, poner = (X, Y, n) => { if (X >= 0 && Y >= 0 && X < VW && Y < VH) { const i = Y * VW + X, v = mask[i]; if (!v || n < v) mask[i] = n; } }; // gana el nivel más fuerte (el número más bajo)
    objetos.forEach((o) => {
      const d = OB[o.tipo]; if (!d || NO[o.tipo]) return; const S = silueta(o.tipo); if (!S.pts.length) return;
      const ox = Math.round(o.x * T + d.ox - cam.x), oy = Math.round(o.y * T + d.oy - cam.y); if (ox > VW || oy > VH || ox + d.w < -60 || oy + d.h < -60) return;
      const ed = !!EDIF[o.tipo], su = SUAVE[o.tipo]; S.pts.forEach(([px, py, h, b]) => { const p = proyectar(h, ed, su); poner(ox + px + p.dx, oy + (b === undefined ? S.br : b) + p.dy, su ? 4 : p.nivel); });
    });
    if (hayEnt) { // los personajes y criaturas no proyectan sobre el huerto (se vería como manchas sobre los cultivos)
      const R = huertos.map((o) => { const d = OB.huerto; return [o.x * T + d.ox - cam.x, o.y * T + d.oy - cam.y, d.w, d.h]; });
      const enHuerto = (X, Y) => R.some((r) => X >= r[0] - 2 && X < r[0] + r[2] + 2 && Y >= r[1] - 2 && Y < r[1] + r[3] + 2);
      ents.forEach((e) => {
        const S = siluetaSprite(e.s.c), hw = Math.floor(e.s.w / 2);
        S.pts.forEach(([px, py]) => { const h = e.base - (e.top + py); if (h < 1) return; const X = e.x + e.dx + (e.espejo ? e.s.w - 1 - px : px) - hw + Math.round(h * AJUSTES.SX), Y = e.base + Math.round(h * AJUSTES.SY); if (!enHuerto(X, Y)) poner(X, Y, 1); });
      });
    }
    const MUL = colores(); ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (let y = 0; y < VH; y++) {
      let x = 0; while (x < VW) {
        const n0 = mask[y * VW + x]; if (!n0) { x++; continue; }
        const i0 = (y * VW + x) * 4, c0 = claseSuelo(suelo[i0], suelo[i0 + 1], suelo[i0 + 2]); let x1 = x + 1;
        while (x1 < VW && mask[y * VW + x1] === n0) { const i = (y * VW + x1) * 4; if (claseSuelo(suelo[i], suelo[i + 1], suelo[i + 2]) !== c0) break; x1++; }
        if (c0) { ctx.fillStyle = MUL[c0][n0]; ctx.fillRect(x, y, x1 - x, 1); }
        x = x1;
      }
    }
    ctx.restore();
  }

  G.sombrasp = { AJUSTES, NO, EDIF, SUAVE, activo, proyectar, claseSuelo, colores, silueta, siluetaSprite, pintar };
})(typeof window !== 'undefined' ? window : globalThis);
