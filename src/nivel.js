// nivel.js — NIVELES de criatura (v2.303): XP, curva, multiplicador de estadísticas y nivel de las salvajes. Funciones PURAS (sin DOM, sin Math.random, sin estado): el estado vive en j.prog[forma] = { xp }.
// El nivel del jugador por especie sale de su XP; el de la salvaje, de su rareza + un reparto determinista. Los números están en AJUSTES para equilibrarlos sin tocar la lógica.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const AJUSTES = { MAX: 50, XP_K: 30, XP_P: 1.75, MULT: 0.025, BASE: 14, POR_NIVEL: 6, RAR: { comun: 1, rara: 1.4, epica: 2, legendaria: 3 }, CAIDA: 0.07, PISO: 0.2,
    SALVAJE: { comun: [1, 6], rara: [4, 12], epica: [10, 20], legendaria: [18, 30] } };
  const A = AJUSTES, cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const xpPara = (n) => (n <= 1 ? 0 : Math.round(A.XP_K * Math.pow(Math.min(n, A.MAX) - 1, A.XP_P)));   // XP total necesaria para ESTAR en el nivel n
  function nivelDe(xp) { xp = xp > 0 ? xp : 0; let n = 1; while (n < A.MAX && xp >= xpPara(n + 1)) n++; return n; }
  const mult = (n) => 1 + (cl(n | 0 || 1, 1, A.MAX) - 1) * A.MULT;   // multiplicador de vida, ataque y defensa
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  function nivelSalvaje(rar, clave) { const r = A.SALVAJE[rar] || A.SALVAJE.comun; return r[0] + (hash(String(clave)) % (r[1] - r[0] + 1)); }
  function xpGanada(nivelProp, nivelRival, rar) {   // contra rivales más débiles que tú la recompensa cae hasta un piso
    const base = (A.BASE + A.POR_NIVEL * nivelRival) * (A.RAR[rar] || 1), d = nivelProp - nivelRival;
    return Math.max(1, Math.round(base * (d > 0 ? Math.max(A.PISO, 1 - d * A.CAIDA) : 1)));
  }
  // Suma XP al progreso de una especie: devuelve { forma, xp, antes, despues, ganada, sube } (no toca nada si no es válido)
  function sumar(j, forma, ganada) {
    if (!j || !forma || !(ganada > 0)) return null; j.prog = j.prog || {}; const p = j.prog[forma] || (j.prog[forma] = { xp: 0 }), antes = nivelDe(p.xp), tope = xpPara(A.MAX);
    p.xp = Math.min(tope, p.xp + ganada); const despues = nivelDe(p.xp); return { forma, xp: p.xp, antes, despues, ganada, sube: despues > antes };
  }
  const nivelDeEspecie = (j, forma) => nivelDe(j && j.prog && j.prog[forma] ? j.prog[forma].xp : 0);
  G.nivel = { AJUSTES, xpPara, nivelDe, mult, nivelSalvaje, xpGanada, sumar, nivelDeEspecie };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.nivel;
})(typeof window !== 'undefined' ? window : globalThis);
