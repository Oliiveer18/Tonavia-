// equipo.js — EL EQUIPO del jugador (v2.312): qué criaturas lleva (hasta 6) y cuál va al frente (la que lo acompaña y pelea). PURO: sin DOM ni azar, listo para online.
// Criaturas propias = las capturadas (j.sinId) + la inicial (Ondel). El equipo es una lista de especies en j.equipo (sin él: solo la inicial). La de delante es la primera que no esté debilitada.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), MAX = 6, INICIAL = 'pompon';
  const existe = (f) => typeof f === 'string' && !!(G.CREATURES && G.CREATURES[f]);
  // v2.339 · CAJA del Centro PC: j.sinId = ejemplares guardados { id, forma, mapa, n, hp?, xp? } (hp absoluto: sin él = completa; xp: sin él = nivel 1). El equipo (j.equipo, ≤6 especies sin repetir) lleva su vida y XP en j.vida / j.prog (por especie); al salir del equipo se depositan en la caja y al entrar se recuperan.
  const CAJA_BASE = 50, CAJA_PASO = 10, CAJA_TOPE = 300, PRECIO_BASE = 120, PRECIO_SUBE = 80;
  const caja = (j) => (j && Array.isArray(j.sinId) ? j.sinId : []);
  const cajaMax = (j) => (j && Number.isInteger(j.cajaMax) && j.cajaMax > CAJA_BASE ? Math.min(j.cajaMax, CAJA_TOPE) : CAJA_BASE);
  const cajaLlena = (j) => caja(j).length >= cajaMax(j);
  const precioAmpliar = (j) => (cajaMax(j) >= CAJA_TOPE ? 0 : PRECIO_BASE + PRECIO_SUBE * ((cajaMax(j) - CAJA_BASE) / CAJA_PASO));   // 120, 200, 280… por cada ampliación de +10
  function ampliar(est, j) {   // paga y amplía; { ok, max, coste } o { ok:false, motivo }
    const T = G.tienda, pr = precioAmpliar(j), aviso = (t) => { if (est && est.avisos) est.avisos.push({ j: j.id, texto: t }); };
    if (!pr) { aviso('La caja ya tiene el tamaño máximo'); return { ok: false, motivo: 'tope' }; }
    if (!T || !T.gastar(j, pr)) { aviso('Ampliar la caja cuesta ' + pr + ' ✦'); return { ok: false, motivo: 'brillos', coste: pr }; }
    j.cajaMax = cajaMax(j) + CAJA_PASO; aviso('Caja ampliada a ' + j.cajaMax + ' · -' + pr + ' ✦'); return { ok: true, max: j.cajaMax, coste: pr };
  }
  // guarda un ejemplar en la caja (la captura lo manda aquí con la vida y el nivel que tenía)
  // v2.340 · MOTE (nombre propio opcional): las criaturas se llaman como su especie; el jugador puede ponerles un mote (máx. 12 letras latinas, cifras, espacio . ' -). Del equipo: j.motes[clave]; de la caja: ejemplar.mote.
  const moteOk = (t) => String(t === undefined || t === null ? '' : t).replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 '.\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12).trim();
  const moteDe = (j, clave) => (j && j.motes && typeof j.motes[clave] === 'string' ? j.motes[clave] : '');
  function renombrar(est, j, ref, texto) {   // ref = { clave } (del equipo) o { id } (de la caja); texto vacío = quita el mote
    const t = moteOk(texto);
    if (ref && typeof ref.clave === 'string') { if (actual(j).indexOf(ref.clave) < 0) return null; if (t) { j.motes = j.motes || {}; j.motes[ref.clave] = t; } else if (j.motes) { delete j.motes[ref.clave]; if (!Object.keys(j.motes).length) delete j.motes; } return { mote: t }; }
    const e = ref && Number.isInteger(ref.id) ? caja(j).find((q) => q.id === ref.id) : null; if (!e) return null; if (t) e.mote = t; else delete e.mote; return { mote: t };
  }
  // v2.342 · ID PERMANENTE (Nº 0042): contador j.sigId del jugador; se asigna una vez (captura, cría o equipo inicial) y no cambia ni se reutiliza. Equipo: j.ids[clave]; caja: ejemplar.id.
  function asegurar(j) {
    let m = j.sigId | 0; caja(j).forEach((e) => { if (e.id > m) m = e.id; }); Object.keys(j.ids || {}).forEach((k) => { if (j.ids[k] > m) m = j.ids[k]; });
    actual(j).forEach((k) => { if (!(j.ids && j.ids[k] > 0)) { j.ids = j.ids || {}; j.ids[k] = ++m; } }); caja(j).forEach((e) => { if (!(e.id > 0)) e.id = ++m; }); j.sigId = m;
  }
  const idDe = (j, clave) => (j && j.ids && j.ids[clave] > 0 ? j.ids[clave] : (!j || (!j.ids && !(j.sigId > 0) && !caja(j).length)) && clave === INICIAL ? 1 : 0);
  function agregar(j, q) {
    asegurar(j); const c = (j.sinId = j.sinId || []), id = q.id > 0 ? q.id : ++j.sigId;
    const e = { id, forma: q.forma, mapa: q.mapa || '', n: c.length + 1 }; if (Number.isFinite(q.hp) && q.hp >= 0) e.hp = Math.round(q.hp); if (Number.isFinite(q.xp) && q.xp > 0) e.xp = Math.round(q.xp); if (moteOk(q.mote)) e.mote = moteOk(q.mote); if (q.bloq > 0) e.bloq = Math.round(q.bloq); c.push(e); return e;
  }
  // v2.340 · el equipo son «claves» de criatura: la especie para la primera copia y «especie#2», «especie#3»… para las repetidas (hasta 6 iguales). j.vida y j.prog van por clave.
  const especie = (k) => String(k).split('#')[0];
  const claveOk = (k) => typeof k === 'string' && /^[a-z0-9_]+(#[2-6])?$/.test(k) && existe(especie(k));
  function claveLibre(usadas, forma) { if (usadas.indexOf(forma) < 0) return forma; for (let n = 2; n <= MAX; n++) { const k = forma + '#' + n; if (usadas.indexOf(k) < 0) return k; } return forma + '#' + MAX; }
  const equipoRaw = (j) => { const e = Array.isArray(j && j.equipo) ? j.equipo.filter(claveOk) : []; return e.length ? e : (existe(INICIAL) ? [INICIAL] : []); };
  // { forma: cantidad } de todo lo que posee el jugador (caja + equipo)
  function propias(j) { const c = {}; caja(j).forEach((q) => { if (q && existe(q.forma)) c[q.forma] = (c[q.forma] || 0) + 1; }); equipoRaw(j).forEach((k) => { const f = especie(k); c[f] = (c[f] || 0) + 1; }); return c; }
  // lista limpia de claves (sin repetir, ≤ MAX); la pertenencia la garantiza poner()
  function validas(j, claves) { return (Array.isArray(claves) ? claves : []).filter((k, i, a) => claveOk(k) && a.indexOf(k) === i).slice(0, MAX); }
  function actual(j) { const v = validas(j, equipoRaw(j)); return v.length ? v : (existe(INICIAL) ? [INICIAL] : []); }
  const debil = (j, f) => !!(j && j.vida && typeof j.vida[f] === 'number' && j.vida[f] <= 0);
  function lider(j) { return actual(j).find((f) => !debil(j, f)) || null; }
  // criaturas del equipo con heridas (vida guardada)
  function heridas(j) { return actual(j).filter((f) => j.vida && typeof j.vida[f] === 'number').length; }
  // el acompañante pasa a ser la criatura de delante (no cambia nada en pleno combate)
  function sincronizar(est, j) {
    if (!est || !j || est.combate) return; const l = lider(j);
    if (!l) { if (est.acomp && est.acomp.j === j.id) delete est.acomp; return; }
    if (!est.acomp || est.acomp.j !== j.id || (est.acomp.clave || est.acomp.forma) !== l) G.motor.combate.acompanar(est, j.id, l);
  }
  const hpMaxDe = (forma, xp) => G.combate.statsDe({ forma, nivel: G.nivel ? G.nivel.nivelDe(xp || 0) : 1 }).hpMax;
  // fija el equipo. claves[i] = una del equipo que se queda, o una especie/clave nueva; ids[i] = ejemplar de la caja que entra en ese puesto (sin id: la de más nivel de esa especie).
  // Lo que sale del equipo se deposita en la caja con su vida y XP; lo que entra se saca de ella (puede haber hasta 6 de la misma especie). false si no cabe o no es válido.
  function poner(est, j, claves, ids) {
    asegurar(j); const antes = actual(j), want = [];
    (Array.isArray(claves) ? claves : []).forEach((k, i) => {
      if (want.length >= MAX || !claveOk(k)) return; const id = ids && Number.isInteger(ids[i]) ? ids[i] : null;
      if (id !== null) want.push({ forma: especie(k), id }); else if (antes.indexOf(k) >= 0) { if (!want.some((w) => w.key === k)) want.push({ key: k }); } else want.push({ forma: especie(k), id: null });
    });
    if (!want.length) return false;
    const cj = caja(j), elegidos = [];
    for (const w of want) {
      if (w.key) continue;
      if (w.id !== null) { const e = cj.find((q) => q.id === w.id && q.forma === w.forma); if (!e || elegidos.indexOf(e) >= 0) return false; w.e = e; }
      else { const cand = cj.filter((q) => q.forma === w.forma && elegidos.indexOf(q) < 0).sort((a, b) => (b.xp | 0) - (a.xp | 0) || a.id - b.id); if (!cand.length) return false; w.e = cand[0]; }
      elegidos.push(w.e);
    }
    const quedan = want.filter((w) => w.key).map((w) => w.key), salen = antes.filter((k) => quedan.indexOf(k) < 0), nuevo = cj.length - elegidos.length + salen.length;
    if (nuevo > cajaMax(j) && nuevo > cj.length) { if (est && est.avisos) est.avisos.push({ j: j.id, texto: 'La caja está llena' }); return false; }
    j.sinId = cj.filter((q) => elegidos.indexOf(q) < 0);
    salen.forEach((k) => { const xp = j.prog && j.prog[k] ? j.prog[k].xp : 0, hp = j.vida && typeof j.vida[k] === 'number' ? j.vida[k] : undefined; agregar(j, { id: j.ids[k], forma: especie(k), mapa: '', hp, xp, mote: moteDe(j, k) }); delete j.ids[k]; if (j.vida) delete j.vida[k]; if (j.prog) delete j.prog[k]; if (j.motes) delete j.motes[k]; });
    const usadas = quedan.slice(); j.prog = j.prog || {}; j.vida = j.vida || {};
    want.forEach((w) => { if (w.key) return; const k = claveLibre(usadas, w.forma); usadas.push(k); w.key = k; const e = w.e; j.ids = j.ids || {}; j.ids[k] = e.id;
      if (e.xp > 0) j.prog[k] = { xp: e.xp }; else delete j.prog[k];
      if (typeof e.hp === 'number' && e.hp < hpMaxDe(w.forma, e.xp)) j.vida[k] = e.hp; else delete j.vida[k]; if (e.mote) { j.motes = j.motes || {}; j.motes[k] = e.mote; } });
    if (j.motes && !Object.keys(j.motes).length) delete j.motes;
    if (!Object.keys(j.vida).length) delete j.vida; if (!Object.keys(j.prog).length) delete j.prog;
    j.equipo = want.map((w) => w.key); sincronizar(est, j); return true;
  }
  // liberar una criatura de la caja (vuelve a la naturaleza; su ID no se reutiliza)
  function liberar(est, j, id) {
    const i = Number.isInteger(id) ? caja(j).findIndex((q) => q.id === id) : -1; if (i < 0) return null;
    const e = j.sinId[i]; j.sinId.splice(i, 1); if (!j.sinId.length) delete j.sinId; const nom = e.mote || G.combate.statsDe({ forma: e.forma }).nom;
    if (est && est.avisos) est.avisos.push({ j: j.id, texto: nom + ' (Nº ' + String(e.id).padStart(4, '0') + ') vuelve a la naturaleza' }); return { id: e.id, forma: e.forma };
  }
  // guardados anteriores a la v2.342: numeración por orden de captura (equipo primero)
  function renumerar(j) { let m = 0; j.ids = {}; actual(j).forEach((k) => { j.ids[k] = ++m; }); caja(j).slice().sort((a, b) => (a.n | 0) - (b.n | 0) || (a.id | 0) - (b.id | 0)).forEach((e) => { e.id = ++m; }); j.sigId = m; }
  // guardados anteriores a la v2.339: los del equipo salían también de la caja y la inicial, si no iba en el equipo, pasa a la caja
  function migrar(j) {
    const eq = Array.isArray(j.equipo) ? j.equipo.filter(existe) : null; if (!eq || !eq.length) return;
    eq.forEach((f) => { if (f === INICIAL) return; const i = caja(j).findIndex((q) => q.forma === f); if (i >= 0) j.sinId.splice(i, 1); });
    if (eq.indexOf(INICIAL) < 0) { const xp = j.prog && j.prog[INICIAL] ? j.prog[INICIAL].xp : 0, hp = j.vida && typeof j.vida[INICIAL] === 'number' ? j.vida[INICIAL] : undefined; agregar(j, { forma: INICIAL, mapa: '', hp, xp }); if (j.vida) delete j.vida[INICIAL]; if (j.prog) delete j.prog[INICIAL]; if (j.vida && !Object.keys(j.vida).length) delete j.vida; if (j.prog && !Object.keys(j.prog).length) delete j.prog; }
    j.equipo = eq; (j.sinId || []).forEach((q, i) => { if (!q.id) q.id = i + 1; });
  }
  G.equipo = { MAX, INICIAL, asegurar, idDe, liberar, renumerar, especie, moteOk, moteDe, renombrar, CAJA_BASE, CAJA_TOPE, propias, validas, actual, lider, heridas, sincronizar, poner, caja, cajaMax, cajaLlena, precioAmpliar, ampliar, agregar, migrar };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.equipo;
})(typeof window !== 'undefined' ? window : globalThis);
