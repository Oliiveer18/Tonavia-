// bolsa_ui.js — BOLSA y TIENDA (v2.318): panel a pantalla completa con los Brillos (✦), los objetos, las esferas y los pescados del jugador. Dos modos:
//  · 'mochila' (botón ✦ del HUD): ver objetos y usar pociones SOBRE UNA CRIATURA (solo andando; el motor rechaza usarlas en combate).
//  · 'tienda' (con el tendero Teo): pestañas Comprar y Vender.
// Solo PINTA: cada cambio de estado se pide al motor con órdenes a través de `api` (comprar, vender, usar). Sin azar. Accesible: role=dialog, foco en el primer botón, Esc cierra.
(function (root) {
  'use strict';
  const G = root.G, d = root.document, B = { j: null, api: null, modo: 'mochila', tab: 'comprar', usando: null, previo: null, alCerrar: null, aviso: '' };
  const el = (t, cls, txt) => { const e = d.createElement(t); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const T = () => G.tienda;
  // ── Datos (puros, para probar sin DOM) ──
  // Filas de la mochila: objetos primero (orden del catálogo), luego pescados por nombre. `esfera` va aparte (no está en la mochila).
  function filas(j) {
    const m = (j && j.mochila) || {}, t = T(), orden = Object.keys(t.OBJ), o = [];
    orden.forEach((id) => { if (m[id] > 0) o.push({ id, nombre: t.OBJ[id].nombre, desc: t.OBJ[id].desc, n: m[id], usable: t.OBJ[id].tipo !== 'esfera', venta: t.precioVenta(id), pez: false }); });
    Object.keys(m).filter((id) => !t.OBJ[id] && m[id] > 0 && t.existe(id)).sort((a, b) => t.nombre(a).localeCompare(t.nombre(b), 'es')).forEach((id) => o.push({ id, nombre: t.nombre(id), desc: 'Pescado fresco: se vende en la Tienda.', n: m[id], usable: false, venta: t.precioVenta(id), pez: true }));
    return o;
  }
  // Estado de una criatura frente a un objeto: { ok, motivo }
  function sobre(j, id, f) {
    const o = T().OBJ[id]; if (!o) return { ok: false, motivo: '' }; if (f.debil) return o.tipo === 'revive' ? { ok: true, motivo: 'Debilitada' } : { ok: false, motivo: 'Debilitada: necesita Revivir' };
    if (f.hp >= f.hpMax) return { ok: false, motivo: 'En plena forma' }; return o.tipo === 'revive' ? { ok: false, motivo: 'No está debilitada' } : { ok: true, motivo: f.hp + ' / ' + f.hpMax + ' PS' };
  }

  // ── DOM ──
  const panel = () => d.getElementById('bolsa');
  function montar() {
    if (!d || panel()) return; const p = el('div'); p.id = 'bolsa'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'bl-t');
    const h = el('header'), w = el('div'), t = el('h1'); t.id = 'bl-t'; w.appendChild(t); const s = el('span'); s.id = 'bl-n'; w.appendChild(s); h.appendChild(w);
    const x = el('button', 'x'); x.id = 'bl-x'; x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.innerHTML = G.ic ? G.ic('cerrar', 's') : '✕'; x.addEventListener('click', cerrar); h.appendChild(x); p.appendChild(h);
    const tabs = el('div'); tabs.id = 'bl-tabs'; tabs.setAttribute('role', 'tablist');
    [['comprar', 'Comprar'], ['vender', 'Vender']].forEach(([k, n]) => { const b = el('button', '', n); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = k; b.addEventListener('click', () => { B.tab = k; B.usando = null; pintar(); }); tabs.appendChild(b); }); p.appendChild(tabs);
    const l = el('div'); l.id = 'bl-lista'; l.setAttribute('role', 'tabpanel'); p.appendChild(l); const a = el('div'); a.id = 'bl-aviso'; a.setAttribute('role', 'status'); p.appendChild(a);
    d.body.appendChild(p);
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel() && !panel().hidden) { e.preventDefault(); e.stopPropagation(); if (B.usando) { B.usando = null; pintar(); } else cerrar(); } }, true);
  }
  function avisar(txt) { B.aviso = txt || ''; const a = d.getElementById('bl-aviso'); if (a) { a.textContent = B.aviso; a.classList.remove('v'); void a.offsetWidth; if (B.aviso) a.classList.add('v'); } }
  function boton(txt, fn, off, cls) { const b = el('button', 'bl-btn' + (cls ? ' ' + cls : ''), txt); b.type = 'button'; if (off) b.disabled = true; else b.addEventListener('click', fn); return b; }
  function fila(titulo, sub, extra, botones) {
    const f = el('div', 'bl-fila'), i = el('div', 'bl-info'); i.appendChild(el('b', '', titulo)); if (sub) i.appendChild(el('small', '', sub)); if (extra) i.appendChild(extra); f.appendChild(i);
    const w = el('div', 'bl-acc'); botones.forEach((b) => w.appendChild(b)); f.appendChild(w); return f;
  }
  function accion(r, ok) { if (G.audio) G.audio.sfx(r && r.ok ? 'captura' : 'hablar'); pintar(); if (r && r.ok && ok) avisar(ok); }
  function barra(f) { const b = el('div', 'eq-bar vida ' + (f.debil ? 'mal' : f.hp / f.hpMax <= 0.25 ? 'baja' : f.hp / f.hpMax <= 0.55 ? 'media' : 'ok')), i = el('i'); i.style.width = Math.max(0, Math.min(100, f.hpMax ? (f.hp / f.hpMax) * 100 : 0)) + '%'; b.appendChild(i); return b; }

  function pintarUsar(L) {   // elegir la criatura sobre la que se usa el objeto
    const o = T().OBJ[B.usando], act = G.equipo.actual(B.j), formas = act.slice();
    formas.sort((a, b) => (act.indexOf(a) < 0 ? 9 : act.indexOf(a)) - (act.indexOf(b) < 0 ? 9 : act.indexOf(b)));
    L.appendChild(el('p', 'bl-vacio', o.nombre + ': elige una criatura. ' + o.desc));
    formas.forEach((fm) => {
      const f = G.equipoUI.ficha(B.j, fm), v = sobre(B.j, B.usando, f);
      L.appendChild(fila((f.mote || f.nom) + ' · Nv ' + f.nivel, v.motivo, barra(f), [boton('Usar', () => { const r = B.api.usar(B.usando, fm); if (!T().cuantos(B.j, B.usando)) B.usando = null; accion(r, f.nom + ' se siente mejor'); }, !v.ok)]));
    });
    L.appendChild(boton('Volver', () => { B.usando = null; pintar(); }, false, 'sec'));
  }
  function pintar() {
    const p = panel(); if (!p || !B.j) return; const t = T(), L = d.getElementById('bl-lista'), tienda = B.modo === 'tienda'; L.textContent = '';
    d.getElementById('bl-t').textContent = tienda ? 'Tienda de Teo' : 'Bolsa'; p.classList.toggle('tienda', tienda);
    const n = d.getElementById('bl-n'); n.textContent = ''; const oro = el('span', 'bl-oro', '✦ ' + t.saldo(B.j) + ' Brillos'); n.appendChild(oro); n.appendChild(el('span', 'bl-esf', 'Esferas de captura ×' + t.esferasDe(B.j)));
    d.getElementById('bl-tabs').hidden = !tienda; d.querySelectorAll('#bl-tabs button').forEach((b) => { const on = b.dataset.tab === B.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (B.usando) { pintarUsar(L); return; }
    if (tienda && B.tab === 'comprar') {
      t.TIENDA.forEach((id) => {
        const o = t.OBJ[id], ps = t.precioCompra(id, B.j), sd = t.saldo(B.j), tiene = o.tipo === 'esfera' ? t.esferasDe(B.j) : t.cuantos(B.j, id);
        L.appendChild(fila(o.nombre, o.desc + ' · Tienes ' + tiene, null, [boton('✦ ' + ps, () => accion(B.api.comprar(id, 1), 'Compraste ' + o.nombre), sd < ps), boton('×5 · ' + ps * 5, () => accion(B.api.comprar(id, 5), 'Compraste 5 ' + o.nombre), sd < ps * 5, 'sec')]));
      });
      return;
    }
    const F = filas(B.j);
    if (tienda) {   // vender
      const v = F.filter((q) => q.venta > 0); if (!v.length) L.appendChild(el('p', 'bl-vacio', 'No tienes nada que vender. ¡Prueba a pescar!'));
      v.forEach((q) => L.appendChild(fila(q.nombre + ' ×' + q.n, 'Te pago ✦ ' + q.venta + ' por cada uno', null, [boton('Vender 1', () => accion(B.api.vender(q.id, 1), 'Vendiste ' + q.nombre), false), q.n > 1 ? boton('Todo', () => accion(B.api.vender(q.id, q.n), 'Vendiste ' + q.n + ' ' + q.nombre), false, 'sec') : el('span')])));
      return;
    }
    // mochila
    L.appendChild(fila('Esferas de captura', 'Se gastan al capturar. Cómpralas en la Tienda.', null, [el('b', 'bl-cant', '×' + t.esferasDe(B.j))]));
    if (!F.length) L.appendChild(el('p', 'bl-vacio', 'Tu bolsa está vacía. Compra pociones en la Tienda o pesca para ganar Brillos.'));
    F.forEach((q) => L.appendChild(fila(q.nombre, q.desc, null, [el('b', 'bl-cant', '×' + q.n), q.usable ? boton('Usar', () => { B.usando = q.id; pintar(); }) : el('span')])));
  }
  function abrir(j, opc) {
    montar(); const p = panel(); if (!p || !j || !G.tienda) return false; B.j = j; B.api = opc.api; B.modo = opc.modo === 'tienda' ? 'tienda' : 'mochila'; B.tab = 'comprar'; B.usando = null; B.alCerrar = opc.alCerrar || null; B.previo = d.activeElement; avisar('');
    pintar(); p.hidden = false; const b = p.querySelector('.bl-btn:not([disabled])') || d.getElementById('bl-x'); try { b.focus(); } catch (e) { /* sin foco */ } return true;
  }
  function cerrar() { const p = panel(); if (p) p.hidden = true; B.usando = null; const f = B.alCerrar; B.alCerrar = null; if (f) f(); else if (B.previo && B.previo.focus) { try { B.previo.focus(); } catch (e) { /* sin foco */ } } }
  G.bolsaUI = { filas, sobre, abrir, cerrar, montar, abierto: () => !!(panel() && !panel().hidden), refrescar() { if (panel() && !panel().hidden) pintar(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.bolsaUI;
})(typeof window !== 'undefined' ? window : globalThis);
