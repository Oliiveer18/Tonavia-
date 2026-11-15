// PROPUESTA 2D PIXEL ART · capa inyectada en tiempo de ejecución (NO es código del proyecto; no se escribe ningún archivo del juego).
// Se engancha a G.capas.luzRegion (el mismo punto donde el juego pinta la luz de región: tras el suelo y antes de objetos y personajes).
// Método: SOMBRA = SILUETA REAL de cada sprite, inclinada. Cada píxel opaco que está h píxeles por encima de la línea de base deja un píxel de sombra
// h·SX a la derecha y h·SY hacia abajo (luz arriba-izquierda → sombra abajo-derecha, pendiente 2:1). Todo va a UNA máscara y se pinta una sola vez
// (donde dos sombras se solapan NO se oscurece el doble). Nada sobre el agua. Árboles: nunca.
() => {
  const T = 16, OB = G.capas.OBJETOS, orig = G.capas.luzRegion;
  const P = window.__SOMB = { on: false, SX: 0.45, SY: 0.225, modo: 'multiplicar', mul: [168, 158, 214], mulArena: [206, 184, 224], mulTierra: [214, 204, 230], alfa: 0.26, tinte: [38, 28, 92], entidades: true, g1: 20, g2: 44, fuerza: [0, 1, 0.62, 0.36], corto: 0.75 };
  const EDIF = { casa: 1, casa_lali: 1, casa_oli: 1, laboratorio: 1, centro_pc: 1, tienda: 1, ermita: 1 }; // edificios: sombra con DEGRADADO (fuerte pegada a la pared, más suave al alejarse)
  const NO = { juncos2: 1, juncos3: 1, nenufar: 1, nenufar_flor: 1, puente_albanota: 1, huerto: 1, valla_v: 1 };
  // lo último que calculó G.vista para cada persona / criatura (el juego lo llama justo después de la luz, en el mismo cuadro)
  const ultC = new WeakMap(), ultP = {}, vc = G.vista.criatura, vp = G.vista.persona;
  G.vista.criatura = function (c) { const r = vc.apply(this, arguments); ultC.set(c, r); return r; };
  G.vista.persona = function (id) { const r = vp.apply(this, arguments); ultP[id] = r; return r; };
  const SIL = {}, SILC = new WeakMap();
  function silueta(tipo) {
    if (SIL[tipo]) return SIL[tipo]; const d = OB[tipo], c = document.createElement('canvas'); c.width = d.w; c.height = d.h; const x = c.getContext('2d'), o = { tipo, x: 0, y: 0 }, cam = { x: d.ox, y: d.oy };
    G.capas.dibujarBase(x, o, cam); if (d.encima !== false) G.capas.dibujarEncima(x, [{ objeto: o }], cam);
    const im = x.getImageData(0, 0, d.w, d.h).data, pts = [], br = d.pieY - d.oy;
    for (let py = 0; py < d.h; py++) for (let px = 0; px < d.w; px++) if (im[(py * d.w + px) * 4 + 3] > 40 && br - py >= 1) pts.push([px, py, br - py]);
    return (SIL[tipo] = { pts, br });
  }
  function siluetaSprite(cv) { // todos los píxeles opacos del sprite (la base se decide al colocarlo)
    let s = SILC.get(cv); if (s) return s; const x = cv.getContext('2d'), im = x.getImageData(0, 0, cv.width, cv.height).data, pts = [];
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++) if (im[(py * cv.width + px) * 4 + 3] > 40) pts.push([px, py]);
    s = { pts, w: cv.width, h: cv.height }; SILC.set(cv, s); return s;
  }
  G.capas.luzRegion = function (ctx, m, VW, VH) {
    orig.apply(this, arguments); const cam = window.__juego.cam; if (!P.on) return;
    const suelo = ctx.getImageData(0, 0, VW, VH).data, mask = new Uint8Array(VW * VH), SX = P.SX, SY = P.SY;
    const poner = (X, Y, L) => { if (X >= 0 && Y >= 0 && X < VW && Y < VH) { const i = Y * VW + X, v = mask[i], n = L || 1; if (!v || n < v) mask[i] = n; } }; // nivel 1 = fuerte · 3 = muy suave; gana el más fuerte
    (m.objetos || []).forEach((o) => {
      const d = OB[o.tipo]; if (!d || NO[o.tipo]) return; const S = silueta(o.tipo); if (!S.pts.length) return;
      const ox = Math.round(o.x * T + d.ox - cam.x), oy = Math.round(o.y * T + d.oy - cam.y); if (ox > VW || oy > VH || ox + d.w < -60 || oy + d.h < -60) return;
      const ed = EDIF[o.tipo];
      S.pts.forEach(([px, py, h]) => { const he = ed && h > P.g1 ? P.g1 + (h - P.g1) * P.corto : h; // tejado y cúpula: por encima de g1 la sombra se acorta (corto = 0,75)
        poner(ox + px + Math.round(he * SX), oy + S.br + Math.round(he * SY), ed ? (h <= P.g1 ? 1 : h <= P.g2 ? 2 : 3) : 1); });
    });
    const sinEnt = (m.objetos || []).filter((o) => o.tipo === 'huerto').map((o) => { const d = OB.huerto; return [o.x * T + d.ox - cam.x, o.y * T + d.oy - cam.y, d.w, d.h]; });
    const enHuerto = (X, Y) => sinEnt.some((r) => X >= r[0] - 2 && X < r[0] + r[2] + 2 && Y >= r[1] - 2 && Y < r[1] + r[3] + 2);
    const ponerE = (X, Y) => { if (!enHuerto(X, Y)) poner(X, Y); };
    if (P.entidades) { // personajes y criaturas: la silueta del fotograma que se está viendo, con la base en el suelo (una criatura que flota o salta deja la sombra en el suelo, más lejos)
      const J = window.__juego;
      Object.values(J.est.jugadores).filter((j) => j.mapa === m.id).forEach((j) => {
        const v = ultP[j.id]; if (!v) return; const s = G.spr[v.clave]; if (!s) return; const S = siluetaSprite(s.c);
        const tx = Math.round(j.x - cam.x), ty = Math.round(j.y - cam.y), base = ty + 1;
        S.pts.forEach(([px, py]) => { const Y0 = ty - s.h + 2 + py, h = base - Y0; if (h < 1) return; const X0 = tx + (v.espejo ? (s.w - 1 - px) - Math.floor(s.w / 2) : px - Math.floor(s.w / 2)); ponerE(X0 + Math.round(h * SX), base + Math.round(h * SY)); });
      });
      J.creatures.forEach((c) => {
        const v = ultC.get(c); if (!v) return; const s = G.creatureSprite(c.id, c.dir, v.frame); if (!s) return; const S = siluetaSprite(s.c);
        const tx = Math.round(c.x - cam.x), ty = Math.round(c.y - cam.y), base = ty + 1, top = ty - s.h + 2 - Math.round(v.up) - v.sombra.separacion + v.nod;
        S.pts.forEach(([px, py]) => { const Y0 = top + py, h = base - Y0; if (h < 1) return; const X0 = tx + Math.round(v.sway) + px - Math.floor(s.w / 2); ponerE(X0 + Math.round(h * SX), base + Math.round(h * SY)); });
      });
    }
    ctx.save();
    const rgb = (c, f) => 'rgb(' + c.map((v) => Math.round(255 - (255 - v) * f)).join(',') + ')', MUL = [null, P.mul, P.mulArena, P.mulTierra].map((c) => c && [0, 1, 2, 3].map((n) => rgb(c, P.fuerza[n] || 1)));
    // 0 = agua (no se pinta) · 1 = césped y resto · 2 = arena (más cálida y clara) · 3 = tierra oscura (más suave)
    const clase = (i) => { const r = suelo[i], g = suelo[i + 1], b = suelo[i + 2]; if (b > r + 40 && b > g + 10) return 0; if (r > 200 && g > 175 && b < 200 && r - b > 40) return 2; if (r < 150 && r > g + 20 && g > b) return 3; return 1; };
    if (P.modo === 'multiplicar') ctx.globalCompositeOperation = 'multiply';
    for (let y = 0; y < VH; y++) {
      let x = 0; while (x < VW) {
        if (!mask[y * VW + x]) { x++; continue; }
        const c0 = clase((y * VW + x) * 4), n0 = mask[y * VW + x]; let x1 = x + 1; while (x1 < VW && mask[y * VW + x1] === n0 && clase((y * VW + x1) * 4) === c0) x1++;
        if (c0) { ctx.fillStyle = P.modo === 'multiplicar' ? MUL[c0][n0] : 'rgba(' + P.tinte.join(',') + ',' + P.alfa + ')'; ctx.fillRect(x, y, x1 - x, 1); }
        x = x1;
      }
    }
    ctx.restore();
  };
}
