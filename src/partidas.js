// partidas.js — v2.371. PARTIDAS MÚLTIPLES: índice de ranuras (localStorage 'criaturas_partidas') y claves de guardado por ranura. Cada partida es COMPLETA (Oli y Lali). La ranura «p1» usa las claves de siempre (la partida anterior a la v2.371 es la Partida 1, sin mover nada); las demás, «criaturas_partida_pN…».
// Lógica sin DOM (la pantalla está en partidas_ui.js). Las partidas se guardan en ESTE dispositivo. La partida de pruebas (tipo 'pruebas') parte con nivel de entrenador y Brillos elegidos y NO vale para validar visitas reales ni nada «oficial».
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), CLAVE = 'criaturas_partidas', MAX = 6, BASE = 'criaturas_partida', NOMBRE_MAX = 20;
  const TIPOS = ['normal', 'pruebas'], esId = (s) => typeof s === 'string' && /^p[0-9]{1,3}$/.test(s);
  const ls = () => { try { return root.localStorage || null; } catch (e) { return null; } };
  const limpiarNombre = (s, def) => { s = typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, NOMBRE_MAX) : ''; return s || def; };
  const porDefecto = () => ({ v: 1, activa: 'p1', sig: 2, lista: [{ id: 'p1', nombre: 'Partida 1', tipo: 'normal' }] });
  function normal(d) { // índice legible o el de por defecto; nunca lanza
    if (!d || typeof d !== 'object' || d.v !== 1 || !Array.isArray(d.lista)) return porDefecto();
    const vistos = {}, lista = []; d.lista.forEach((e) => { if (!e || !esId(e.id) || vistos[e.id] || lista.length >= MAX) return; vistos[e.id] = 1; const t = TIPOS.indexOf(e.tipo) >= 0 ? e.tipo : 'normal', o = { id: e.id, nombre: limpiarNombre(e.nombre, 'Partida ' + e.id.slice(1)), tipo: t }; if (t === 'pruebas' && e.prep && Number.isInteger(e.prep.nivel) && Number.isInteger(e.prep.brillos)) o.prep = { nivel: e.prep.nivel, brillos: e.prep.brillos }; lista.push(o); });
    if (!lista.length) return porDefecto();
    const mx = lista.reduce((m, e) => Math.max(m, +e.id.slice(1)), 1);
    return { v: 1, activa: vistos[d.activa] ? d.activa : lista[0].id, sig: Math.max(mx + 1, Number.isInteger(d.sig) ? d.sig : 0), lista };
  }
  let idx = null;
  function leer() { if (idx) return idx; let d = null; try { const t = ls() && ls().getItem(CLAVE); d = t ? JSON.parse(t) : null; } catch (e) { d = null; } idx = normal(d); return idx; }
  function escribir() { try { if (ls()) ls().setItem(CLAVE, JSON.stringify(idx)); return true; } catch (e) { return false; } }
  const sufijo = (id) => (id === 'p1' ? '' : '_' + id);
  const buscar = (id) => leer().lista.find((e) => e.id === id) || null;
  const activa = () => buscar(leer().activa);
  function crear(nombre, tipo, prep) { // → { ok, id } | { ok:false, motivo }
    const d = leer(); if (d.lista.length >= MAX) return { ok: false, motivo: 'llena' };
    let n = d.sig, id = 'p' + n; while (d.lista.some((e) => e.id === id) && n < 999) id = 'p' + ++n;
    if (!esId(id)) return { ok: false, motivo: 'llena' };
    const t = tipo === 'pruebas' ? 'pruebas' : 'normal', e = { id, nombre: limpiarNombre(nombre, t === 'pruebas' ? 'Pruebas' : 'Partida ' + n), tipo: t };
    if (t === 'pruebas') { const MX = G.entrenador ? G.entrenador.MAX : 50, TP = G.tienda ? G.tienda.TOPE : 99999; const nv = prep && Number.isFinite(+prep.nivel) ? Math.floor(+prep.nivel) : 1, br = prep && Number.isFinite(+prep.brillos) ? Math.floor(+prep.brillos) : 0; e.prep = { nivel: Math.min(MX, Math.max(1, nv)), brillos: Math.min(TP, Math.max(0, br)) }; }
    d.lista.push(e); d.sig = n + 1; return escribir() ? { ok: true, id } : (d.lista.pop(), { ok: false, motivo: 'sin_sitio' });
  }
  function renombrar(id, nombre) { const e = buscar(id); if (!e) return false; e.nombre = limpiarNombre(nombre, e.nombre); return escribir(); }
  function elegir(id) { if (!buscar(id)) return false; leer().activa = id; return escribir(); }
  // Borra una partida (la interfaz pide confirmación antes). No se puede borrar la última. Deja UNA copia de su guardado en «criaturas_partida_borrada» (la última borrada) por si fue un error.
  function borrar(id) {
    const d = leer(), e = buscar(id); if (!e || d.lista.length <= 1) return false;
    const L = ls(), suf = sufijo(id), K = BASE + suf;
    try { if (L) { const t = L.getItem(K); if (t) L.setItem(BASE + '_borrada', t); ['', '_bak', '_premig', '_corrupta', '_corrupta2', '_corrupta3'].forEach((s) => L.removeItem(K + s)); L.removeItem(BASE + '_exceso' + suf); } } catch (x) { /* sin almacenamiento */ }
    d.lista = d.lista.filter((q) => q.id !== id); if (d.activa === id) d.activa = d.lista[0].id; return escribir();
  }
  // La partida de pruebas aplica su preparación UNA vez, sobre una partida nueva, a los dos personajes.
  function aplicarPrep(est) {
    const e = activa(); if (!e || e.tipo !== 'pruebas' || !e.prep || !est) return false;
    const E = G.entrenador, T = G.tienda, p = e.prep;
    Object.keys(est.jugadores).forEach((id) => { const j = est.jugadores[id]; if (E && p.nivel > 1) E.dar(est, j, E.xpPara(p.nivel) - E.xpDe(j), 'pruebas'); if (T) j.brillos = Math.min(T.TOPE, Math.max(0, p.brillos)); });
    if (est.avisos) est.avisos.length = 0;
    delete e.prep; escribir(); return true;
  }
  G.partidas = { MAX, NOMBRE_MAX, sufijo, leer, lista: () => leer().lista.slice(), activa, buscar, crear, renombrar, elegir, borrar, aplicarPrep, _normal: normal, _reset() { idx = null; } };
  if (G.guardado && G.guardado.fijarRanura) G.guardado.fijarRanura(sufijo(leer().activa));   // ANTES de que el juego cargue nada
})(typeof window !== 'undefined' ? window : globalThis);
