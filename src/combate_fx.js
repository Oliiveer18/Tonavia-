// combate_fx.js — EFECTOS del combate como cuadritos de píxel (v2.272, solo HD-2D). PURO: sin Three, sin DOM, sin Math.random; cada efecto es una función del tick actual y del evento que lo causó (misma entrada → mismos píxeles).
// Plantillas por FORMA del movimiento (proyectil, haz, línea, área, zona, contacto, defensa, apoyo) y por ELEMENTO (paleta y detalles), más los estados sobre cada criatura. Los 56 efectos a medida de tools/prototipo_fx se portarán después sobre esta base.
// cuadritos(v, reloj, h0) → lista { x, y, z, dx, dy, c, k } para G.particulas3d.armar (x, z en casillas; y en u; 1 cuadrito = 1/16 u). ui(v) → rótulos para el lienzo 2D (barras, números, reacciones, final).
(function (root) {
  'use strict';
  const G = root.G, T = 16, D = G.COMBATE_DATOS, MOV = D.MOV, TOPE = 1400;
  const PAL = { fuego: ['#7a1d12', '#f0603e', '#ffb347', '#fff3c0'], agua: ['#1c4f86', '#3f9bd6', '#8fd4f5', '#ffffff'], hoja: ['#245a2a', '#5dae5a', '#a8e063', '#f0ffc8'], electrico: ['#8a6a00', '#f7d54a', '#fff08a', '#ffffff'], aire: ['#6a93aa', '#bfe3f5', '#e8f7ff', '#ffffff'], roca: ['#5a4a3a', '#8a7f72', '#b9a98f', '#e8dcc6'], sombra: ['#241638', '#6a46a0', '#a878d8', '#e0c8ff'] };
  const VERDE = ['#2e8b57', '#6fdc8c', '#c8ffd4', '#ffffff'], GRIS = ['#555555', '#8a8a8a', '#c4c4c4', '#eeeeee'];
  const hh = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }; // 0..1 determinista
  const eo = (t) => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3, cl = (t) => Math.max(0, Math.min(1, t));
  const elDe = (mov) => (MOV[mov] ? MOV[mov].el : 'fuego');
  const NOMBRES = { vapor: 'Vapor', sobrecarga: 'Sobrecarga', incendio: 'Incendio', tormenta_electrica: 'Tormenta eléctrica', lodo: 'Lodo', noche_voraz: 'Noche voraz' };
  const WIND = { b: 4, h: 8, e: 14, d: 4, a: 6 };

  function cuadritos(v, reloj, h0) {
    const out = [], K = v.k, U = {}; v.unidades.forEach((u) => { U[u.id] = u; });
    const Q = (xp, yp, hp, dx, dy, c) => { if (out.length < TOPE) out.push({ x: xp / T, y: h0 + hp / T, z: yp / T, dx, dy, c, k: 'v' }); };     // cuadrito vertical (mira a la cámara): posición de pies en px y altura en px
    const Gd = (xp, yp, dx, dz, c) => { if (out.length < TOPE) out.push({ x: xp / T, y: h0 + 0.035, z: yp / T, dx, dy: dz, c, k: 'h' }); };      // cuadrito tumbado en el suelo
    const bloque = (xp, yp, hp, n, c) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Q(xp, yp, hp, i - (n - 1) / 2, j - (n - 1) / 2, c); };
    const FL = v.fl || 1, ax = (x) => v.ax + FL * ((x - 80) * K + (v.off ? v.off(x) : 0)), mid = (u) => u.h * 0.5;
    const anillo = (xp, yp, rx, n, c, fase, a) => { for (let i = 0; i < n; i++) { const an = fase + (i / n) * 6.2832; Gd(xp + Math.cos(an) * rx, yp + Math.sin(an) * rx * 0.45, 0, 0, c); } };
    v.ev.forEach((e) => {
      const a = v.tick - e.t, u = U[e.id], pal = PAL[e.el || elDe(e.mov)] || PAL.fuego; if (a < 0) return;
      if (e.mov && G.fxPro && G.fxPro.tiene(e.mov) && (e.e === 'inicio' || e.e === 'efecto' || e.e === 'golpe' || e.e === 'defensa' || e.e === 'apoyo')) return;   // v2.274: esos movimientos ya tienen su efecto diseñado (combate_fx_pro.js)
      if (e.e === 'inicio' && u) {                                   // carga: motas que giran hacia el cuerpo (más y con anillo en el suelo para los especiales)
        const dur = WIND[e.hueco] || 6, f = a / dur; if (a > dur + 1) return; const pe = PAL[elDe(e.mov)] || PAL.fuego, n = e.hueco === 'e' ? 12 : 6;
        for (let i = 0; i < n; i++) { const an = a * 0.55 + i * 6.2832 / n, r = (u.w * 0.5 + 6) * (1 - 0.6 * f); Q(u.x + Math.cos(an) * r, u.y, mid(u) + Math.sin(an) * r * 0.7, 0, 0, pe[1 + (i & 1)]); }
        if (e.hueco === 'e') anillo(u.x, u.y, 10 + 4 * f, 18, pe[2], a * 0.2);
      } else if (e.e === 'efecto') {
        const c = U[e.id], t = U[e.obj], sg = (c ? (c.side === 0 ? 1 : -1) : 1) * FL; if (!c) return; const el = e.el, p = PAL[el] || PAL.fuego, X0 = ax(e.x0), X1 = ax(e.x1), Y0 = c.y, Y1 = t ? t.y : c.y;
        if (e.forma === 'proyectil') {
          const f = a / Math.max(1, e.dt); if (f > 1.05) return; const px = X0 + (X1 - X0) * cl(f), py = Y0 + (Y1 - Y0) * cl(f), hp = mid(c) + ((t ? mid(t) : mid(c)) - mid(c)) * cl(f) + 8 * Math.sin(Math.PI * cl(f));
          for (let i = 6; i >= 1; i--) { const ff = cl(f - i * 0.06); Q(X0 + (X1 - X0) * ff, Y0 + (Y1 - Y0) * ff, mid(c) + ((t ? mid(t) : mid(c)) - mid(c)) * ff + 8 * Math.sin(Math.PI * ff) + (hh(e.t, i) - 0.5) * 2, 0, 0, p[i > 3 ? 0 : 1]); }
          bloque(px, py, hp, 3, p[1]); Q(px, py, hp, 0, 0, p[3]); if (el === 'electrico') Q(px - sg * 3, py, hp + (hh(e.t, a | 0) - 0.5) * 6, 0, 0, p[2]);
        } else if (e.forma === 'haz') {
          if (a > 9) return; const n = Math.max(6, Math.round(Math.abs(X1 - X0) / 2)), h1 = mid(c), h2 = t ? mid(t) : h1, ff = a < 2 ? a / 2 : 1 - (a - 2) / 7;
          for (let i = 0; i <= n; i++) { const u2 = i / n, jit = el === 'electrico' ? (hh(e.t + (a | 0), i) - 0.5) * 7 : Math.sin(u2 * 12 - a * 2) * 1.6; const xx = X0 + sg * c.w * 0.4 + (X1 - X0 - sg * c.w * 0.4) * u2, hp = h1 + (h2 - h1) * u2 + jit; Q(xx, Y0 + (Y1 - Y0) * u2, hp, 0, 0, p[2]); if (ff > 0.5) { Q(xx, Y0 + (Y1 - Y0) * u2, hp, 0, -1, p[1]); Q(xx, Y0 + (Y1 - Y0) * u2, hp, 0, 1, p[1]); } }
        } else if (e.forma === 'linea') {
          if (a > 9) return; const f = eo(a / 6), xx = X0 + (X1 - X0) * f; for (let i = -3; i <= 3; i++) { Gd(xx - sg * Math.abs(i), Y0 + i * 1.5, 0, 0, p[1 + (Math.abs(i) < 2 ? 1 : 0)]); } for (let i = 0; i < 6; i++) Q(xx - sg * i * 4 * hh(e.t, i), Y0 + (hh(e.t, i + 9) - 0.5) * 8, 2 + 6 * hh(e.t, i + 3) * (1 - a / 9), 0, 0, p[2]);
        } else if (e.forma === 'area') {
          if (a > 14) return; const R = (e.r || 24) * K * eo(a / 10), fade = 1 - a / 14; anillo(X1, Y1, R, Math.max(14, (R * 1.4) | 0), p[1 + (a < 4 ? 1 : 0)], 0); if (a < 10) anillo(X1, Y1, R * 0.7, 12, p[2], 0.5);
          for (let i = 0; i < 10; i++) { const an = hh(e.t, i) * 6.2832, rr = R * 0.9 * hh(e.t, i + 20); Q(X1 + Math.cos(an) * rr, Y1 + Math.sin(an) * rr * 0.45, 3 + a * 1.4 * (0.5 + hh(e.t, i + 5)) * fade, 0, 0, p[2]); }
        } else if (e.forma === 'zona') {
          const R = (e.r || 28) * K;
          if (a < e.dt) { if (((a | 0) & 1) === 0) anillo(X1, Y1, R, Math.max(16, (R * 1.4) | 0), p[2], 0); anillo(X1, Y1, R * (0.4 + 0.6 * a / e.dt), 10, p[1], a * 0.3); }
          else if (a < e.dt + 14) { const b = a - e.dt, f = eo(b / 6), fade = 1 - b / 14; anillo(X1, Y1, R * (0.6 + 0.4 * f), Math.max(16, (R * 1.4) | 0), p[1], 0);
            for (let i = 0; i < 9; i++) { const an = hh(e.t, i) * 6.2832, rr = R * 0.85 * Math.sqrt(hh(e.t, i + 11)), xx = X1 + Math.cos(an) * rr, yy = Y1 + Math.sin(an) * rr * 0.45, alto = (8 + 14 * hh(e.t, i + 2)) * f * fade; for (let hp = 0; hp < alto; hp += 1) Q(xx, yy, hp, 0, 0, hp > alto * 0.75 ? p[3] : hp > alto * 0.4 ? p[2] : p[1]); } }
        } else if (e.forma === 'contacto') {
          if (a > 7 || !t) return; const L = 12 * eo(a / 2.5), an = (el === 'sombra' ? -0.9 : el === 'aire' ? 0.2 : 0.8) * sg, cx = ax(e.x1), cy = mid(t);
          for (let i = -L; i <= L; i += 1) { Q(cx, t.y, cy + Math.sin(an) * i, Math.cos(an) * i * sg, 0, p[a < 3 ? 3 : 2]); if (Math.abs(i) < L * 0.6) Q(cx, t.y, cy + Math.sin(an) * i + 1, Math.cos(an) * i * sg, 0, p[1]); }
        }
      } else if (e.e === 'golpe' && U[e.id]) {                       // impacto: destello, chispas radiales (más con crítico) y anillo corto
        const t = U[e.id], p = PAL[elDe(e.mov)] || PAL.fuego, cx = t.x, cy = mid(t); if (a > 9) return; const n = e.crit ? 16 : 9, vel = e.crit ? 2.6 : 1.9;
        if (a < 2) { for (let i = -4; i <= 4; i++) { Q(cx, t.y, cy, i, 0, p[3]); Q(cx, t.y, cy, 0, i, p[3]); } }
        for (let i = 0; i < n; i++) { const an = (i / n) * 6.2832 + hh(e.t, i) * 0.6, r = a * vel * (0.7 + hh(e.t, i + 7)) + 2; Q(cx + Math.cos(an) * r, t.y, cy + Math.sin(an) * r * 0.9 - a * a * 0.12, 0, 0, a < 4 ? p[2] : p[1]); }
        if (a < 5) anillo(cx, t.y, 4 + a * 3, 12, p[2], 0);
      } else if (e.e === 'defensa' && u) {
        if (a > 14) return; const pe = PAL[e.el] || PAL.roca, r = (u.w * 0.5 + 4 + a * 0.4), n = 16; for (let i = 0; i < n; i++) { const an = i / n * 6.2832; Q(u.x + Math.cos(an) * r, u.y, mid(u) + Math.sin(an) * (u.h * 0.55 + 2), 0, 0, pe[(i + (a | 0)) & 1 ? 2 : 1]); }
      } else if (e.e === 'apoyo') {
        const t = U[e.a] || u; if (!t || a > 26) return; const pe = e.tag === 'regen' || e.tag === 'limpia' ? VERDE : e.tag === 'debilita' ? PAL.sombra : PAL[e.el] || PAL.hoja;
        for (let i = 0; i < 8; i++) { const ph = (a * 0.9 + hh(e.t, i) * 20) % 18; Q(t.x + (hh(e.t, i + 4) - 0.5) * t.w, t.y, 2 + ph * (e.tag === 'debilita' ? -0.0 : 1) * (e.tag === 'debilita' ? 0 : 1) + (e.tag === 'debilita' ? (t.h - ph) : 0), 0, 0, pe[1 + (i & 1)]);
          if (i < 3) { Q(t.x + (hh(e.t, i + 12) - 0.5) * t.w, t.y, 3 + ph, -1, 0, pe[3]); Q(t.x + (hh(e.t, i + 12) - 0.5) * t.w, t.y, 3 + ph, 1, 0, pe[3]); Q(t.x + (hh(e.t, i + 12) - 0.5) * t.w, t.y, 4 + ph, 0, 0, pe[3]); Q(t.x + (hh(e.t, i + 12) - 0.5) * t.w, t.y, 2 + ph, 0, 0, pe[3]); } }
      } else if (e.e === 'reaccion' && U[e.id]) {
        const t = U[e.id]; if (a > 12) return; anillo(t.x, t.y, 6 + a * 2.4, 20, PAL.fuego[2], a * 0.3); anillo(t.x, t.y, 4 + a * 2, 16, PAL.agua[2], -a * 0.3); anillo(t.x, t.y, 2 + a * 1.6, 12, PAL.electrico[2], 0);
      } else if (e.e === 'ko' && u) {
        if (a > 22) return; for (let i = 0; i < 8; i++) Q(u.x + (hh(e.t, i) - 0.5) * u.w, u.y, a * 0.8 + hh(e.t, i + 5) * 6, 0, 0, GRIS[1 + (i & 1)]);
      }
    });
    v.unidades.forEach((u) => {                                      // estados y defensas que duran: se dibujan mientras la criatura los tenga
      const t = reloj, tt = (reloj * 20) | 0, top = u.h + 3, s = (n) => u.estados.indexOf(n) >= 0;
      if (u.esc) { const r = u.w * 0.5 + 5; for (let i = 0; i < 18; i++) { if ((i + tt) % 3 === 0) continue; const an = i / 18 * 6.2832; Q(u.x + Math.cos(an) * r, u.y, mid(u) + Math.sin(an) * (u.h * 0.55 + 2), 0, 0, PAL[u.el][2]); } }
      if (u.esq) { for (let i = 0; i < 6; i++) Q(u.x - (u.side === 0 ? 1 : -1) * (3 + ((tt + i * 3) % 12)), u.y, 3 + i * (u.h / 7), 0, 0, PAL[u.el][1]); }
      if (u.ko) return;
      if (s('quemado')) for (let i = 0; i < 4; i++) { const ph = (t * 3 + i * 0.37) % 1; Q(u.x + (hh(i, tt >> 2) - 0.5) * u.w * 0.8, u.y, u.h * 0.4 + ph * u.h * 0.5, 0, 0, PAL.fuego[ph < 0.5 ? 2 : 1]); }
      if (s('mojado')) for (let i = 0; i < 3; i++) { const ph = (t * 1.6 + i * 0.33) % 1; Q(u.x + (i - 1) * u.w * 0.3, u.y, u.h * (0.9 - ph * 0.8), 0, 0, PAL.agua[2]); }
      if (s('enredado')) { anillo(u.x, u.y, u.w * 0.55, 12, PAL.hoja[1], 0); for (let i = 0; i < 4; i++) { Q(u.x + (i - 1.5) * u.w * 0.3, u.y, 1 + i % 2 * 3, 0, 0, PAL.hoja[2]); Q(u.x + (i - 1.5) * u.w * 0.3, u.y, 2 + i % 2 * 3, 0, 0, PAL.hoja[1]); } }
      if (s('aturdido')) for (let i = 0; i < 3; i++) { const an = t * 5 + i * 2.094; Q(u.x + Math.cos(an) * 6, u.y, top + 3 + Math.sin(an) * 1.5, 0, 0, PAL.electrico[2]); Q(u.x + Math.cos(an) * 6, u.y, top + 4 + Math.sin(an) * 1.5, 0, 0, PAL.electrico[3]); }
      if (s('ralentizado')) for (let i = 0; i < 5; i++) { const an = t * 2 + i * 1.256; Q(u.x + Math.cos(an) * (u.w * 0.5), u.y, mid(u) + Math.sin(an) * u.h * 0.4, 0, 0, PAL.agua[2]); }
      if (s('maldito')) for (let i = 0; i < 3; i++) { const ph = (t * 1.4 + i * 0.33) % 1; Q(u.x + (i - 1) * u.w * 0.3, u.y, u.h * (0.3 + ph * 0.7), 0, 0, PAL.sombra[ph < 0.5 ? 2 : 1]); }
      if (s('miedo')) { for (let i = 0; i < 2; i++) { Q(u.x - 3 + i * 6, u.y, top + 6, 0, 0, PAL.sombra[3]); Q(u.x - 3 + i * 6, u.y, top + 5, 0, 0, PAL.sombra[3]); Q(u.x - 3 + i * 6, u.y, top + 4, 0, 0, PAL.sombra[3]); Q(u.x - 3 + i * 6, u.y, top + 2, 0, 0, PAL.sombra[3]); } }
      if (s('ciego')) for (let i = 0; i < 4; i++) Q(u.x + (hh(i, tt >> 3) - 0.5) * u.w, u.y, u.h * (0.5 + 0.4 * hh(i + 3, tt >> 3)), 0, 0, GRIS[1 + (i & 1)]);
      if (s('debil')) for (let i = -1; i <= 1; i++) { Q(u.x + i * 3, u.y, top + 2 + (1 - Math.abs(i)), 0, 0, '#d0504a'); Q(u.x, u.y, top + 3, 0, 0, '#d0504a'); Q(u.x, u.y, top + 5, 0, 0, '#d0504a'); }
    });
    return out;
  }

  // rótulos para el lienzo 2D: { t:'barra', x, y, h, hpF, med } · { t:'num', x, y, h, txt, crit } · { t:'reac', x, y, h, txt } · { t:'final', txt }
  function ui(v) {
    const L = [], U = {}; (v.ko || []).forEach((u) => { U[u.id] = u; }); v.unidades.forEach((u) => { U[u.id] = u; });
    v.unidades.forEach((u) => { if (!u.ko) L.push({ t: 'barra', id: u.id, el: u.el, est: u.estados, x: u.x, y: u.y, h: u.h + 6, hpF: u.hpF, med: u.side === 0 ? u.med : null, lado: u.side, nom: u.nom }); });
    v.ev.forEach((e) => { const a = v.tick - e.t, t = U[e.id];
      if (e.e === 'inicio' && t && a >= 0 && a < 22 && MOV[e.mov]) L.push({ t: 'mov', id: e.id, lado: t.side, x: t.x, y: t.y, h: t.h + 40, txt: MOV[e.mov].nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), el: MOV[e.mov].el, hueco: e.hueco, a: a < 16 ? 1 : 1 - (a - 16) / 6 });   // nombre del movimiento al lanzarlo
      if (e.e === 'golpe' && t && a >= 0 && a < 14) L.push({ t: 'num', id: e.id, tk: e.t, x: t.x, y: t.y, h: t.h * 0.5, txt: String(e.d), crit: !!e.crit, fr: e.mx ? e.d / e.mx : 0.1, ef: e.ef === undefined ? 1 : e.ef, a: 1 - a / 14 });
      if (e.e === 'dot' && t && a >= 0 && a < 14) L.push({ t: 'num', dot: 1, id: e.id, tk: e.t, x: t.x, y: t.y, h: t.h * 0.5, txt: String(e.d), crit: false, fr: 0.01, ef: 1, a: 1 - a / 14 });
      if (e.e === 'cura' && t && a >= 0 && a < 16) L.push({ t: 'cura', id: e.id, tk: e.t, x: t.x, y: t.y, h: t.h * 0.5, txt: '+' + e.d, a: 1 - a / 16 });
      if (e.e === 'esquiva' && t && a >= 0 && a < 22) L.push({ t: 'reac', x: t.x, y: t.y, h: t.h + 22 + a * 0.4, txt: 'Esquiva', a: 1 - a / 22, c: '#9fd8ff' });
      if (e.e === 'golpe' && e.bl && t && a >= 0 && a < 22) L.push({ t: 'reac', x: t.x, y: t.y, h: t.h + 12 + a * 0.3, txt: 'Bloqueo', a: 1 - a / 22, c: '#c8d0e0' });
      if (e.e === 'fallo' && t && a >= 0 && a < 22) L.push({ t: 'reac', x: t.x, y: t.y, h: t.h + 22 + a * 0.4, txt: 'Fallo', a: 1 - a / 22, c: '#c8d0e0' });
      if (e.e === 'reaccion' && t && a >= 0 && a < 26) L.push({ t: 'reac', x: t.x, y: t.y, h: t.h + 22 + a * 0.4, txt: NOMBRES[e.r] || e.r, a: 1 - a / 26 }); });
    if (v.fin && (!v.cap || v.finT < 1.8)) L.push({ t: 'final', txt: v.fin.corte ? 'Fin del combate' : v.fin.ganador === 0 ? 'Victoria' : v.fin.ganador === 1 ? 'Derrota' : 'Empate' });
    return L;
  }
  G.combateFx = { PAL, cuadritos, ui, TOPE };
})(typeof window !== 'undefined' ? window : globalThis);
