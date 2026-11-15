// agentes_red.js — LOS ENTRENADORES EN DOS MÓVILES (v2.325). Sin red ni DOM: aquí solo se decide QUÉ viaja; el transporte es src/red_peer.js. Guía: docs/AGENTES.md §9.
// El ANFITRIÓN (Oli, el que crea la sala) manda: cada AJ.red.cada segundos envía su población entera ({ k:'ag', s: JSON }) y el INVITADO la adopta tal cual (pasa la misma
// validación que un guardado). Entre dos envíos el invitado sigue simulando por su cuenta: como el motor es determinista, apenas se separa, y el siguiente envío lo corrige.
// Lo que el invitado HACE con un entrenador (hablarle, retarle, el resultado del duelo) lo aplica en su copia y lo manda al anfitrión ({ k:'ago', o }), que lo valida y lo repite
// (A.trato.remoto). El combate del invitado se juega en su móvil; al anfitrión solo le llega el desenlace para el entrenador.
// F8: las poblaciones de las DIMENSIONES activas (con algún jugador dentro) viajan igual, una por mensaje ({ k:'agd', d: dim, s, n, r }). Cada instantánea lleva el contador de ticks de la población (n): una más vieja que la última adoptada
// (llegada desordenada) se ignora, así no se retrocede ni se duplica nada. El invitado nunca crea poblaciones de dimensión por su cuenta desde la red: solo adopta las que el anfitrión mande y que pasan la validación del guardado.
// El estado de red (rol, cola de salida) NO es estado de juego: vive aquí, por partida, y no se guarda.
(function (root) {
  'use strict';
  const G = root.G, A = G && G.agentes; if (!A || !A.trato) return;
  const V = 1, LIM_MSG = 2500000, CADA = (A.AJ.red && A.AJ.red.cada) || 4, S = new WeakMap();
  const de = (est) => { let s = S.get(est); if (!s) { s = { rol: null, cola: [], acc: 0, recibidas: 0, accD: {}, ult: {}, ultD: {} }; S.set(est, s); } return s; };
  function conectar(est, rol) { const s = de(est); s.rol = rol === 'anfitrion' || rol === 'invitado' ? rol : null; s.cola = []; s.acc = CADA; s.accD = {}; s.ult = {}; s.ultD = {}; }   // al conectar, el anfitrión manda la población en el primer envío
  function local(est, o) { const s = de(est); if (s.rol === 'invitado' && s.cola.length < 32) s.cola.push({ v: V, k: 'ago', o }); }
  // F8 · PRESUPUESTO DE ANCHO DE BANDA. Una población real pesa ~100 KB tras horas de juego (24 entrenadores): mandarla cada 4 s serían ~25 KB/s sostenidos. Se limita lo que sale a BPS caracteres por segundo EN TOTAL (todas las poblaciones):
  // tras un envío de L caracteres no sale otra población hasta pasar L/BPS segundos, y de las que ya tocan se manda primero la más atrasada. El invitado sigue simulando por su cuenta entre envíos (determinista), así que solo se corrige menos a menudo.
  const BPS = (A.AJ.red && A.AJ.red.bps) || 16000;
  function salida(est, dt) {   // mensajes que hay que enviar ahora
    const s = de(est); if (!s.rol || !A.cfg.ACTIVO) return []; const out = s.cola.splice(0);
    if (s.rol !== 'anfitrion') return out;
    s.libre = Math.max(0, (s.libre || 0) - dt); const act = A.activas(est);
    if (est.agentes) s.acc += dt; Object.keys(s.accD).forEach((k) => { if (act.indexOf(k) < 0) delete s.accD[k]; }); for (const dim of act) s.accD[dim] = (s.accD[dim] === undefined ? CADA : s.accD[dim]) + dt;
    if (s.libre > 0) return out;   // el último envío aún no ha «salido» del presupuesto
    let mejor = null, atraso = CADA; if (est.agentes && s.acc >= atraso) { mejor = ''; atraso = s.acc; } for (const dim of act) if (s.accD[dim] >= atraso && A.de(est, dim)) { mejor = dim; atraso = s.accD[dim]; }
    const r = Number.isFinite(est.reloj) ? Math.round(est.reloj * 100) / 100 : 0;
    if (mejor === '' && est.agentes) { s.acc = 0; const t = JSON.stringify(est.agentes); out.push({ v: V, k: 'ag', s: t, n: est.agentes.n, r }); s.libre = t.length / BPS; }
    else if (mejor) { const g = A.de(est, mejor); s.accD[mejor] = 0; const t = JSON.stringify(g); out.push({ v: V, k: 'agd', d: mejor, s: t, n: g.n, r }); s.libre = t.length / BPS; }
    return out;
  }
  function espejo(est, d, dim) {   // el invitado adopta la población del anfitrión; conserva parado al entrenador con el que ÉL está tratando si su orden aún no había llegado
    const viejo = dim ? A.de(est, dim) : est.agentes, mios = []; if (viejo && viejo.par) Object.keys(viejo.par).forEach((k) => { const p = viejo.par[k], j = est.jugadores[p.j]; if (j && !j.remoto) mios.push([k, p]); });
    if (!(dim ? A.restaurarDim(est, dim, d) : A.restaurar(est, d))) return false; const ag = dim ? A.de(est, dim) : est.agentes; if (!ag) return false; ag.deuda = 0;
    mios.forEach(([k, p]) => { const a = ag.pob[k]; if (!a || (ag.par && ag.par[k])) return; (ag.par = ag.par || {})[k] = Object.assign({}, p, { sig: a.sig, pt0: a.paso ? a.paso.t0 : null }); if (a.sig !== null) A.suspender(ag, a); });
    de(est).recibidas++; return true;
  }
  function recibir(est, m) {   // true si el mensaje era de entrenadores, válido, y se aplicó
    const s = de(est); if (!m || typeof m !== 'object' || m.v !== V || !A.cfg.ACTIVO) return false;
    if (m.k === 'ag') { if (s.rol !== 'invitado' || typeof m.s !== 'string' || m.s.length > LIM_MSG) return false; if (Number.isInteger(m.n) && s.ult.ton !== undefined && m.n < s.ult.ton) return false; let d = null; try { d = JSON.parse(m.s); } catch (e) { return false; } const ok = espejo(est, d); if (ok && Number.isInteger(m.n)) s.ult.ton = m.n; if (ok && typeof m.r === 'number' && Number.isFinite(m.r) && m.r >= 0 && m.r < 1e9) est.reloj = m.r;   /* v2.327: misma hora que el anfitrión */ return ok; }
    if (m.k === 'agd') {   // población de una dimensión (solo el invitado, solo de dimensiones con entrenadores que este juego define)
      if (s.rol !== 'invitado' || typeof m.d !== 'string' || !/^[a-z][a-z0-9_]{0,23}$/.test(m.d) || typeof m.s !== 'string' || m.s.length > LIM_MSG || !Number.isInteger(m.n) || m.n < 0) return false;
      if (s.ultD[m.d] !== undefined && m.n < s.ultD[m.d]) return false;   // instantánea más vieja que la última adoptada (llegada desordenada)
      let d = null; try { d = JSON.parse(m.s); } catch (e) { return false; } if (!d || typeof d !== 'object' || d.n !== m.n || !espejo(est, d, m.d)) return false; s.ultD[m.d] = m.n; return true;
    }
    if (m.k === 'ago') return s.rol === 'anfitrion' && A.trato.remoto(est, m.o);
    return false;
  }
  A.red = { V, conectar, local, salida, recibir, rol: (est) => de(est).rol, recibidas: (est) => de(est).recibidas };
})(typeof window !== 'undefined' ? window : globalThis);
