// ciclo.js — CICLO DE DÍA Y NOCHE (v2.244, idea 5 de pokesurvivor.com). PURO: sin DOM, sin Math.random, sin relojes de pared. Solo calcula, a partir del reloj de la partida (est.reloj, segundos que ya avanza el motor),
// qué hora del día es y con qué color se multiplica la pantalla. No guarda estado propio: dos móviles con el mismo est.reloj ven la misma hora (norma «listo para online»). Lo dibujan igual los dos pintores (2D y HD-2D):
// game.js pone un velo de mezcla «multiplicar» (#noche) sobre el juego, y el HD-2D enciende además los charcos de luz de las farolas con `noche` (src/luz_farolas.js).
// Hora: t en [0,1): 0 = medianoche, 0,25 = amanecer, 0,5 = mediodía, 0,75 = atardecer. Un día dura DIA_S segundos; la partida empieza a t = FASE0 (por la mañana). Interruptores: ?ciclo=0 (sin ciclo: siempre de día); #dia, #atardecer o #noche
// en la dirección fijan la hora para revisar el aspecto.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const OFF = (() => { try { return typeof location !== 'undefined' && /[?&]ciclo=0/.test(location.search || ''); } catch (e) { return false; } })();
  const FIJA = (() => { try { const h = (typeof location !== 'undefined' && location.hash || '').slice(1); return { dia: 0.5, atardecer: 0.715, noche: 0.0 }[h]; } catch (e) { return undefined; } })();
  const AJUSTES = { ACTIVO: !OFF, DIA_S: 600, FASE0: 0.4, FORZAR: FIJA === undefined ? null : FIJA, NOCHE_RGB: [0.30, 0.38, 0.70], ATARDECER_RGB: [1, 0.84, 0.7] };
  const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mezcla = (a, b, k) => a + (b - a) * k;
  // → { t, noche (0 día … 1 noche cerrada), calor (0 … 1, atardecer y amanecer), mult: [r, g, b] 0-255 }: el color por el que se multiplica la pantalla (255,255,255 = no cambia nada)
  function estado(reloj) {
    if (!AJUSTES.ACTIVO) return { t: 0.5, noche: 0, calor: 0, mult: [255, 255, 255] };
    const t = AJUSTES.FORZAR !== null ? AJUSTES.FORZAR : ((((AJUSTES.FASE0 + (reloj || 0) / AJUSTES.DIA_S) % 1) + 1) % 1);
    const s = Math.sin(2 * Math.PI * (t - 0.25));                 // +1 al mediodía, −1 a medianoche
    const noche = 1 - suave(-0.18, 0.22, s), calor = Math.exp(-Math.pow(s / 0.22, 2)) * 0.9 * (1 - 0.6 * noche);
    const N = AJUSTES.NOCHE_RGB, A = AJUSTES.ATARDECER_RGB, mult = [0, 1, 2].map((i) => { const c = mezcla(mezcla(1, A[i], calor * 0.75), N[i], noche); return Math.round(Math.max(0, Math.min(1, c)) * 255); });
    return { t, noche, calor, mult };
  }
  // v2.327: hora y horarios. hora(reloj) = 0-24 (6 = amanecer, 12 = mediodía, 18 = atardecer); abierta(clave, reloj): ¿está abierto ese servicio? El Centro PC no tiene horario (siempre abierto). Sin ciclo (?ciclo=0) todo está abierto.
  const HORARIO = { tienda: [6, 21] };
  const hora = (reloj) => estado(reloj).t * 24;
  const abierta = (clave, reloj) => { const h = HORARIO[clave]; if (!h || !AJUSTES.ACTIVO) return true; const x = hora(reloj); return x >= h[0] && x < h[1]; };
  G.ciclo = { AJUSTES, estado, suave, HORARIO, hora, abierta };
})(typeof window !== 'undefined' ? window : globalThis);
