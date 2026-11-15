// buzon.js — BUZÓN de notificaciones del jugador (v2.344): avisos que NO se pierden (j.buzon), con «no leídas». Los usa el tablón (propuestas, intercambios…). PURO: sin DOM ni azar.
// Cada aviso: { i (nº correlativo), t (reloj), k (tipo), x (texto), o (oferta o 0), l (1 = leída) }. Además del buzón, se emite el aviso emergente normal (est.avisos).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), MAX = 30, TIPOS = ['propuesta', 'confirmada', 'rechazada', 'caducada', 'retirada', 'oferta'];
  const lista = (j) => (j && Array.isArray(j.buzon) ? j.buzon : []);
  function avisar(est, j, tipo, texto, oferta) {
    if (!j || !texto) return null; const b = (j.buzon = Array.isArray(j.buzon) ? j.buzon : []); let i = 0; b.forEach((q) => { if (q.i > i) i = q.i; });
    const n = { i: i + 1, t: Math.round((est && est.reloj) || 0), k: TIPOS.indexOf(tipo) >= 0 ? tipo : 'oferta', x: String(texto).slice(0, 160), o: Number.isInteger(oferta) ? oferta : 0, l: 0 }; b.push(n);
    while (b.length > MAX) { const k = b.findIndex((q) => q.l); b.splice(k >= 0 ? k : 0, 1); }
    if (est && est.avisos) est.avisos.push({ j: j.id, texto }); return n;
  }
  const noLeidas = (j) => lista(j).filter((q) => !q.l).length;
  function leer(j, i) { let n = 0; lista(j).forEach((q) => { if (!q.l && (i === undefined || q.i === i)) { q.l = 1; n++; } }); return n; }
  function borrar(j, i) { const b = lista(j), k = b.findIndex((q) => q.i === i); if (k < 0) return false; b.splice(k, 1); if (!b.length) delete j.buzon; return true; }
  // limpia lo que viene de un guardado
  function limpiar(a) { return (Array.isArray(a) ? a : []).filter((q) => q && Number.isInteger(q.i) && q.i > 0 && typeof q.x === 'string').slice(-MAX).map((q) => ({ i: q.i, t: Number.isFinite(q.t) ? Math.max(0, Math.round(q.t)) : 0, k: TIPOS.indexOf(q.k) >= 0 ? q.k : 'oferta', x: q.x.slice(0, 160), o: Number.isInteger(q.o) && q.o > 0 ? q.o : 0, l: q.l ? 1 : 0 })); }
  G.buzon = { MAX, TIPOS, lista, avisar, noLeidas, leer, borrar, limpiar };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.buzon;
})(typeof window !== 'undefined' ? window : globalThis);
