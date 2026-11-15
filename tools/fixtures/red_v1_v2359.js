// red.js — v2.188 (1.3d): QUÉ viaja entre los dos móviles, sin red ni DOM. Cada móvil manda SU jugador (autoridad por jugador) y el otro lo pinta; el mundo sale de la semilla.
// resumen(est, id) → mensaje; aplicar(est, id, msg) → true si era válido y se aplicó (valida TODO lo que llega: un mensaje roto o tramposo no puede romper la partida).
// El jugador remoto lleva `remoto = true`: el motor no lo simula (motor.moverRemoto lo acerca suavemente a lo recibido), así no gasta azar ni se desincroniza.
(function (root) {
  'use strict';
  const G = root.G, T = 16, VERSION = 1, DIRS = ['up', 'down', 'left', 'right'], FASES = ['lanzar', 'espera', 'pique', 'forcejeo', 'salto', 'fallo'], esNum = Number.isFinite, r1 = (n) => Math.round(n * 10) / 10, r3 = (n) => Math.round(n * 1000) / 1000;
  const red = G.red = {
    VERSION,
    resumen(est, id) {
      const j = est.jugadores[id], f = j.pesca;
      return { v: VERSION, id, mapa: j.mapa, x: r1(j.x), y: r1(j.y), dir: j.dir, ang: r3(j.ang), moving: !!j.moving, tm: r3(j.tm), pesca: f ? { id: f.id, fase: f.fase, t: r3(f.t || 0), pez: f.pez || null } : null, capturas: Object.assign({}, j.capturas), prof: G.profundidades ? G.profundidades.red(est, id) : null };   // v2.320: + la expedición de las Profundidades (se funde, ver profundidades.js)
    },
    aplicar(est, id, m) {
      const j = est.jugadores[id]; if (!j || !m || typeof m !== 'object' || m.v !== VERSION || m.id !== id) return false;
      let mapa = null; try { mapa = typeof m.mapa === 'string' ? G.mundo.mapa(m.mapa) : null; } catch (e) { mapa = null; } if (!mapa || !esNum(m.x) || !esNum(m.y) || m.x < 0 || m.y < 0 || m.x > mapa.W * T || m.y > mapa.H * T || DIRS.indexOf(m.dir) < 0 || !esNum(m.ang) || !esNum(m.tm) || m.tm < 0 || typeof m.moving !== 'boolean') return false;
      const p = m.pesca; if (p !== null && !(p && typeof p === 'object' && typeof p.id === 'string' && FASES.indexOf(p.fase) >= 0 && esNum(p.t) && p.t >= 0 && (p.pez === null || p.pez === undefined || (G.PECES && G.PECES[p.pez])))) return false;
      const c = {}; if (m.capturas && typeof m.capturas === 'object') Object.keys(m.capturas).forEach((k) => { if (G.PECES && G.PECES[k] && Number.isInteger(m.capturas[k]) && m.capturas[k] > 0 && m.capturas[k] < 100000) c[k] = m.capturas[k]; });
      const nuevo = !j.remoto || j.mapa !== m.mapa; j.remoto = true;
      if (nuevo) { j.mapa = m.mapa; j.x = m.x; j.y = m.y; G.motor.estadoMapa(est, m.mapa); G.motor.liberarDimensiones(est); }
      j.obj = { x: m.x, y: m.y }; j.dir = m.dir; j.ang = m.ang; j.moving = m.moving; j.tm = m.tm; j.capturas = c;
      j.pesca = p ? { id: p.id, fase: p.fase, t: p.t, pez: p.pez || undefined } : null;
      if (G.profundidades && m.prof) G.profundidades.redAplicar(est, id, m.prof);
      return true;
    },
    soltar(est, id) { const j = est.jugadores[id]; if (!j) return; j.remoto = false; j.obj = null; j.moving = false; j.pesca = null; j.keys = { up: 0, down: 0, left: 0, right: 0 }; }, // se perdió la conexión: se queda quieto donde estaba
  };
})(typeof window !== 'undefined' ? window : globalThis);
