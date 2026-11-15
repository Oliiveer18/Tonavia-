// entrenador.js — NIVEL DE ENTRENADOR del jugador (v2.343): XP propia (j.xpE) con curva suave, recompensas por nivel y ranuras del tablón. PURO: sin DOM ni azar, listo para online.
// Da XP: ganar combates, capturar, pescar (y, más adelante, intercambiar). Cada nivel da Brillos; cada 5 niveles, +10 huecos de caja y una ranura más de oferta en el tablón (máx. 5).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), MAX = 50, BASE = 60, EXP = 1.5, TOPE_RANURAS = 5, PASO_RECOMPENSA = 5;
  const xpPara = (n) => (n <= 1 ? 0 : Math.round(BASE * Math.pow(Math.min(n, MAX) - 1, EXP)));
  function nivelDe(xp) { let n = 1; xp = Number.isFinite(xp) ? xp : 0; while (n < MAX && xp >= xpPara(n + 1)) n++; return n; }
  const xpDe = (j) => (j && Number.isInteger(j.xpE) && j.xpE > 0 ? j.xpE : 0);
  const nivel = (j) => nivelDe(xpDe(j));
  function info(j) { const xp = xpDe(j), n = nivelDe(xp), d = xpPara(n), h = n >= MAX ? d : xpPara(n + 1); return { nivel: n, xp, desde: d, hasta: h, max: n >= MAX }; }
  // ranuras de oferta del tablón: 1 al empezar, +1 cada 5 niveles, hasta 5
  const ranurasTablon = (j) => Math.min(TOPE_RANURAS, 1 + Math.floor(nivel(j) / PASO_RECOMPENSA));
  // suma XP; si sube de nivel, reparte la recompensa y avisa. Devuelve { ganada, antes, despues, sube } o null
  function dar(est, j, n, motivo) {
    n = Math.floor(n); if (!j || !(n > 0)) return null; const antes = nivel(j), tope = xpPara(MAX); j.xpE = Math.min(tope, xpDe(j) + n); const despues = nivel(j), av = (t) => { if (est && est.avisos) est.avisos.push({ j: j.id, texto: t }); };
    if (est && est.avisos) est.avisos.push({ j: j.id, texto: '+' + n + ' XP de entrenador' + (motivo ? ' · ' + motivo : ''), suave: motivo === 'pesca' });   // v2.346: siempre se informa de la XP ganada
    for (let l = antes + 1; l <= despues; l++) {
      const b = G.tienda ? G.tienda.ganar(j, 6 * l) : 0; av('¡Entrenador nivel ' + l + '!' + (b ? ' +' + b + ' ✦' : ''));
      if (l % PASO_RECOMPENSA === 0) { const E = G.equipo; if (E && E.cajaMax(j) < E.CAJA_TOPE) { j.cajaMax = Math.min(E.CAJA_TOPE, E.cajaMax(j) + 10); av('Tu caja del Centro PC crece a ' + j.cajaMax); } if (ranurasTablon(j) > ranurasTablon({ xpE: xpPara(l - 1) })) av('Nueva ranura de oferta en el tablón'); }
    }
    return { ganada: n, antes, despues, sube: despues > antes };
  }
  G.entrenador = { MAX, xpPara, nivelDe, xpDe, nivel, info, ranurasTablon, dar };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.entrenador;
})(typeof window !== 'undefined' ? window : globalThis);
