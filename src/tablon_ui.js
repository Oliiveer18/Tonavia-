// tablon_ui.js — interfaz del TABLÓN de intercambios (v2.345) y del BUZÓN de notificaciones. Solo pide cosas al motor por órdenes (api.orden) y LEE el estado; no guarda nada.
// PARTE PURA (datos, probada en test.js): qué ofertas ve el jugador, cuáles son suyas, qué propuestas tiene. PARTE DOM: panel #tablon (Ofertas · Mis ofertas · Propuestas) y panel #buzon.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const mia = (j, a) => a && a.t === 'j' && a.id === j.id;
  const libre = (est, e) => !(e.bloq > est.reloj);
  // ── PARTE PURA ──
  function dias(est, o) { const r = G.tablon.restante(est, o); return r >= G.tablon.DIA_S ? Math.floor(r / G.tablon.DIA_S) + ' d' : r >= 60 ? Math.ceil(r / 60) + ' min' : '<1 min'; }
  function elegibles(est, j, pide) { return (j.sinId || []).filter((e) => G.CREATURES[e.forma] && libre(est, e) && (!pide || G.tablon.cumple({ forma: e.forma, xp: e.xp | 0 }, pide))); }
  function datos(est, j) {
    const T = G.tablon, of = T.ofertas(est), ra = G.entrenador ? G.entrenador.ranurasTablon(j) : 1;
    const resumen = (o) => ({ id: o.id, cr: o.cr, nom: T.nombreCr(o.cr), nivel: G.nivel.nivelDe(o.cr.xp || 0), dueno: T.nombreAut(est, o.aut), pide: T.descripcionPide(o.pide), pideRaw: o.pide, queda: dias(est, o), dur: o.dur });
    const ajenas = of.filter((o) => !mia(j, o.aut)).map((o) => { const p = o.props.find((q) => mia(j, q.aut)); return Object.assign(resumen(o), { miProp: p ? { id: p.id, nom: T.nombreCr(p.cr) } : null, llena: o.props.length >= T.MAX_PROPS_OFERTA }); });
    const mias = of.filter((o) => mia(j, o.aut)).map((o) => Object.assign(resumen(o), { props: o.props.map((p) => ({ id: p.id, cr: p.cr, nom: T.nombreCr(p.cr), nivel: G.nivel.nivelDe(p.cr.xp || 0), de: T.nombreAut(est, p.aut), cumple: T.cumple(p.cr, o.pide) })) }));
    const enviadas = []; of.forEach((o) => o.props.forEach((p) => { if (mia(j, p.aut)) enviadas.push({ of: o.id, prop: p.id, nom: T.nombreCr(p.cr), por: T.nombreCr(o.cr), dueno: T.nombreAut(est, o.aut) }); }));
    return { ajenas, mias, enviadas, recibidas: mias.reduce((n, o) => n + o.props.length, 0), ranuras: ra, usadas: mias.length, libres: elegibles(est, j).length, noLeidas: G.buzon.noLeidas(j) };
  }
  // ── PARTE DOM ──
  const d = root.document, U = { j: null, api: null, tab: 'ofertas', t: 0, previo: null, alCerrar: null };
  const el = (t, c, x) => { const e = d.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
  const btn = (txt, fn, c) => { const b = el('button', 'tb-b' + (c ? ' ' + c : ''), txt); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const spr = (f, k) => (G.equipoUI ? G.equipoUI.sprite(f, k) : el('span'));
  const est = () => U.api.est();
  function hacer(o) { const r = U.api.orden(o); pintar(); badge(U.j); return r; }
  function montar() {
    if (d.getElementById('tablon')) return; const p = el('div'); p.id = 'tablon'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'tb-t');
    const h = el('header'), w = el('div'); const t = el('h1', '', 'Tablón de intercambios'); t.id = 'tb-t'; const s = el('span'); s.id = 'tb-n'; w.appendChild(t); w.appendChild(s); h.appendChild(w);
    const x = el('button', 'x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.addEventListener('click', cerrar); h.appendChild(x); p.appendChild(h);
    const tabs = el('div'); tabs.id = 'tb-tabs'; tabs.setAttribute('role', 'tablist'); [['ofertas', 'Ofertas'], ['mias', 'Mis ofertas'], ['props', 'Propuestas']].forEach(([k, n]) => { const b = el('button', '', n); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = k; b.addEventListener('click', () => { U.tab = k; pintar(); }); tabs.appendChild(b); }); p.appendChild(tabs);
    const l = el('div'); l.id = 'tb-lista'; p.appendChild(l); const hoja = el('div'); hoja.id = 'tb-hoja'; hoja.hidden = true; hoja.addEventListener('click', (e) => { if (e.target === hoja) hoja.hidden = true; }); p.appendChild(hoja);
    d.body.appendChild(p);
    const b = el('div'); b.id = 'buzon'; b.hidden = true; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('aria-labelledby', 'bz-t');
    const h2 = el('header'), w2 = el('div'); const t2 = el('h1', '', 'Buzón'); t2.id = 'bz-t'; w2.appendChild(t2); h2.appendChild(w2); const x2 = el('button', 'x', '✕'); x2.type = 'button'; x2.setAttribute('aria-label', 'Cerrar'); x2.addEventListener('click', cerrarBuzon); h2.appendChild(x2); b.appendChild(h2);
    const l2 = el('div'); l2.id = 'bz-lista'; b.appendChild(l2); d.body.appendChild(b);
  }
  function tarjeta(forma, nom, sub, extra) { const c = el('div', 'tb-card'), im = el('div', 'tb-im'); im.appendChild(spr(forma, 56)); c.appendChild(im); const tx = el('div', 'tb-tx'); tx.appendChild(el('b', '', nom)); sub.forEach((s) => tx.appendChild(el('span', '', s))); c.appendChild(tx); if (extra) { const a = el('div', 'tb-ac'); extra.forEach((b) => a.appendChild(b)); c.appendChild(a); } return c; }
  function hoja(titulo, cuerpo) { const h = d.getElementById('tb-hoja'); h.textContent = ''; const b = el('div', 'tb-sheet'); b.appendChild(el('h2', '', titulo)); b.appendChild(cuerpo); b.appendChild(btn('Cancelar', () => { h.hidden = true; }, 'sec')); h.appendChild(b); h.hidden = false; return h; }
  function cierraHoja() { const h = d.getElementById('tb-hoja'); if (h) h.hidden = true; }
  function lista(cr, ok) {   // lista elegible de criaturas de la caja; ok(e) al elegir
    const w = el('div', 'tb-sel'); const L = elegibles(est(), U.j, cr);
    if (!L.length) { w.appendChild(el('p', 'tb-vacio', 'No tienes criaturas en la caja que sirvan. Las del equipo deben pasar antes a la caja.')); return w; }
    L.forEach((e) => { const n = G.combate.statsDe({ forma: e.forma, nivel: G.nivel.nivelDe(e.xp | 0) }); const b = btn('', () => ok(e), 'tb-op'); b.appendChild(spr(e.forma, 40)); b.appendChild(el('span', '', (e.mote || n.nom) + ' · Nv ' + G.nivel.nivelDe(e.xp | 0) + ' · Nº ' + String(e.id).padStart(4, '0'))); w.appendChild(b); }); return w;
  }
  function ofrecer(o) { hoja('Ofrecer por ' + o.nom + ' (pide ' + o.pide + ')', lista(o.pideRaw, (e) => { cierraHoja(); const r = hacer({ t: 'tablon_ofrecer', of: o.id, id: e.id }); if (r && r.ok) U.tab = 'ofertas'; pintar(); })); }
  function ampliar(o) { const w = el('div', 'tb-sel'); G.tablon.DURACIONES.forEach((n) => w.appendChild(btn(n + (n === 1 ? ' día' : ' días') + ' desde ahora', () => { cierraHoja(); hacer({ t: 'tablon_ampliar', of: o.id, dur: n }); }, 'tb-op'))); hoja('Ampliar «' + o.nom + '»', w); }
  function aceptar(o, p) {
    const w = el('div', 'tb-sel'); const cuadro = (tit, c, n) => { const q = el('div', 'tb-par'); q.appendChild(el('small', '', tit)); q.appendChild(spr(c.forma, 56)); q.appendChild(el('b', '', n.nom + ' · Nv ' + n.nivel)); return q; };
    const par = el('div', 'tb-pares'); par.appendChild(cuadro('Das', o.cr, o)); par.appendChild(cuadro('Recibes', p.cr, p)); w.appendChild(par); w.appendChild(el('p', 'tb-vacio', 'Al confirmar, el intercambio se hace y no se puede deshacer. Las demás propuestas de esta oferta se devuelven.'));
    w.appendChild(btn('Aceptar el intercambio', () => { cierraHoja(); hacer({ t: 'tablon_aceptar', of: o.id, prop: p.id }); }, 'ok')); hoja('¿Aceptar la propuesta de ' + p.de + '?', w);
  }
  function publicar() {
    const E = { id: null, modo: 'cualquiera', forma: '', el: '', rar: '', nivelMin: '', dur: G.tablon.DUR_DEF }, w = el('div', 'tb-sel'), lis = lista(null, (e) => { E.id = e.id; });
    [].forEach.call(lis.querySelectorAll('.tb-op'), (b) => b.addEventListener('click', () => { [].forEach.call(lis.querySelectorAll('.tb-op'), (q) => q.classList.remove('on')); b.classList.add('on'); }));
    w.appendChild(el('small', 'tb-lbl', '1. Criatura que ofreces')); w.appendChild(lis);
    const sel = (lbl, ops, k) => { const l = el('label', 'tb-lbl', lbl), s = el('select'); ops.forEach(([v, n]) => { const o = el('option', '', n); o.value = v; s.appendChild(o); }); s.value = E[k]; s.addEventListener('change', () => { E[k] = s.value; vista(); }); l.appendChild(s); return l; };
    const filtro = el('div'); const vista = () => { filtro.hidden = E.modo !== 'filtro'; };
    w.appendChild(el('small', 'tb-lbl', '2. Qué pides a cambio')); w.appendChild(sel('Pides', [['cualquiera', 'Cualquier criatura'], ['filtro', 'Una concreta…']], 'modo'));
    const esp = Object.keys(G.CREATURES).map((f) => [f, G.CREATURES[f].name]).sort((a, b) => a[1].localeCompare(b[1], 'es')), els = Object.keys((G.COMBATE_DATOS && G.COMBATE_DATOS.PLANTILLAS) || {});
    filtro.appendChild(sel('Especie', [['', 'Cualquiera']].concat(esp), 'forma')); filtro.appendChild(sel('Tipo', [['', 'Cualquiera']].concat(els.map((e) => [e, e.charAt(0).toUpperCase() + e.slice(1)])), 'el')); filtro.appendChild(sel('Rareza', [['', 'Cualquiera'], ['comun', 'Común'], ['rara', 'Rara'], ['epica', 'Épica'], ['legendaria', 'Legendaria']], 'rar'));
    const ln = el('label', 'tb-lbl', 'Nivel mínimo'), ni = el('input'); ni.type = 'number'; ni.min = 1; ni.max = 50; ni.placeholder = '—'; ni.addEventListener('input', () => { E.nivelMin = ni.value; }); ln.appendChild(ni); filtro.appendChild(ln); w.appendChild(filtro); vista();
    w.appendChild(el('small', 'tb-lbl', '3. Duración')); const ds = el('div', 'tb-dur'); G.tablon.DURACIONES.forEach((n) => { const b = btn(n + (n === 1 ? ' día' : ' días'), () => { E.dur = n; [].forEach.call(ds.children, (q) => q.classList.toggle('on', q === b)); }, 'tb-op'); if (n === E.dur) b.classList.add('on'); ds.appendChild(b); }); w.appendChild(ds);
    const err = el('p', 'tb-err'); w.appendChild(err);
    w.appendChild(btn('Publicar oferta', () => {
      if (E.id === null) { err.textContent = 'Elige la criatura que ofreces'; return; }
      let pide = { modo: 'cualquiera' }; if (E.modo === 'filtro') { pide = { modo: 'filtro' }; if (E.forma) pide.forma = E.forma; if (E.el) pide.el = E.el; if (E.rar) pide.rar = E.rar; if (E.nivelMin) pide.nivelMin = parseInt(E.nivelMin, 10); if (Object.keys(pide).length < 2) { err.textContent = 'Indica qué pides o elige «Cualquier criatura»'; return; } }
      cierraHoja(); const r = hacer({ t: 'tablon_publicar', id: E.id, pide, dur: E.dur }); if (r && r.ok) { U.tab = 'mias'; pintar(); }
    }, 'ok')); hoja('Publicar una oferta', w);
  }
  function pintar() {
    const p = d.getElementById('tablon'); if (!p || p.hidden || !U.j) return; const D = datos(est(), U.j), L = d.getElementById('tb-lista'), y = L.scrollTop; L.textContent = '';
    d.getElementById('tb-n').textContent = 'Nivel de entrenador ' + G.entrenador.nivel(U.j) + ' · ofertas ' + D.usadas + '/' + D.ranuras;
    [].forEach.call(d.getElementById('tb-tabs').children, (b) => { const k = b.dataset.tab; b.setAttribute('aria-selected', String(k === U.tab)); b.textContent = k === 'props' ? 'Propuestas' + (D.recibidas ? ' (' + D.recibidas + ')' : '') : k === 'mias' ? 'Mis ofertas' : 'Ofertas'; });
    if (U.tab === 'ofertas') {
      if (!D.ajenas.length) L.appendChild(el('p', 'tb-vacio', 'Ahora mismo no hay ofertas de otros entrenadores. Vuelve en un rato.'));
      D.ajenas.forEach((o) => L.appendChild(tarjeta(o.cr.forma, o.nom, ['Nv ' + o.nivel + ' · de ' + o.dueno, 'Pide: ' + o.pide, 'Caduca en ' + o.queda], o.miProp ? [el('span', 'tb-est', 'Propuesta: ' + o.miProp.nom), btn('Retirar', () => hacer({ t: 'tablon_retirar_prop', of: o.id, prop: o.miProp.id }), 'sec')] : [btn(o.llena ? 'Llena' : 'Ofrecer', () => ofrecer(o), o.llena ? 'sec' : '')])));
    } else if (U.tab === 'mias') {
      L.appendChild(btn(D.usadas >= D.ranuras ? 'Sin ranuras (sube de nivel)' : 'Publicar una oferta', publicar, D.usadas >= D.ranuras ? 'sec' : 'ok'));
      if (!D.mias.length) L.appendChild(el('p', 'tb-vacio', 'Solo se pueden ofrecer criaturas de la caja. Si está en tu equipo, quítala primero del equipo.'));
      D.mias.forEach((o) => L.appendChild(tarjeta(o.cr.forma, o.nom, ['Nv ' + o.nivel, 'Pides: ' + o.pide, 'Caduca en ' + o.queda + ' · ' + o.props.length + (o.props.length === 1 ? ' propuesta' : ' propuestas')], [btn('Ampliar', () => ampliar(o), 'sec'), btn('Retirar', () => hacer({ t: 'tablon_retirar', of: o.id }), 'sec')])));
      if (D.enviadas.length) { L.appendChild(el('h3', 'tb-h', 'Mis propuestas enviadas')); D.enviadas.forEach((q) => { const c = el('div', 'tb-fila'); c.appendChild(el('span', '', q.nom + ' → ' + q.por + ' (' + q.dueno + ')')); c.appendChild(btn('Retirar', () => hacer({ t: 'tablon_retirar_prop', of: q.of, prop: q.prop }), 'sec')); L.appendChild(c); }); }
    } else {
      if (!D.recibidas) L.appendChild(el('p', 'tb-vacio', 'Aún no te han propuesto nada. Cuando alguien lo haga te llegará un aviso al buzón; nada se intercambia hasta que aceptes.'));
      D.mias.forEach((o) => { if (!o.props.length) return; L.appendChild(el('h3', 'tb-h', 'Por ' + o.nom + ' (pides: ' + o.pide + ')')); o.props.forEach((q) => L.appendChild(tarjeta(q.cr.forma, q.nom, ['Nv ' + q.nivel + ' · de ' + q.de, q.cumple ? 'Cumple lo que pides' : 'No es lo que pedías'], [btn('Aceptar', () => aceptar(o, q), 'ok'), btn('Rechazar', () => hacer({ t: 'tablon_rechazar', of: o.id, prop: q.id }), 'sec')]))); });
    }
    L.scrollTop = y;
  }
  function abrir(j, api, opc) {
    montar(); const p = d.getElementById('tablon'); if (!p || !j || !api) return; U.j = j; U.api = api; U.alCerrar = opc && opc.alCerrar || null; U.previo = d.activeElement; U.tab = U.tab || 'ofertas'; p.hidden = false; cierraHoja(); pintar();
    clearInterval(U.t); U.t = setInterval(() => { pintar(); badge(U.j); }, 1500); const x = p.querySelector('.x'); if (x) x.focus();
  }
  function cerrar() { const p = d.getElementById('tablon'); if (p) p.hidden = true; clearInterval(U.t); const f = U.alCerrar; U.alCerrar = null; if (U.previo && U.previo.focus) { try { U.previo.focus(); } catch (e) { /* sin foco */ } } if (f) f(); }
  // ── Buzón ──
  const ICO = { propuesta: '🔔', confirmada: '✅', rechazada: '✖', caducada: '⌛', retirada: '↩', oferta: '📌' };
  function pintarBuzon() {
    const L = d.getElementById('bz-lista'), j = U.j; if (!L || !j) return; L.textContent = ''; const b = G.buzon.lista(j).slice().reverse();
    if (!b.length) L.appendChild(el('p', 'tb-vacio', 'No tienes avisos.'));
    b.forEach((q) => { const c = el('div', 'tb-fila bz' + (q.l ? '' : ' nuevo')); c.appendChild(el('i', '', ICO[q.k] || '•')); const t = el('span', '', q.x); c.appendChild(t); c.appendChild(btn('✕', () => { U.api.orden({ t: 'buzon_borrar', i: q.i }); pintarBuzon(); badge(j); }, 'sec')); L.appendChild(c); });
  }
  function abrirBuzon(j, api) { montar(); if (!j || !api) return; U.j = j; U.api = api; U.previo = d.activeElement; const p = d.getElementById('buzon'); p.hidden = false; pintarBuzon(); api.orden({ t: 'buzon_leer' }); badge(j); const x = p.querySelector('.x'); if (x) x.focus(); }
  function cerrarBuzon() { const p = d.getElementById('buzon'); if (p) p.hidden = true; if (U.previo && U.previo.focus) { try { U.previo.focus(); } catch (e) { /* sin foco */ } } }
  function badge(j) { const b = d && d.getElementById && d.getElementById('nbtn'); if (!b || !j) return; const n = G.buzon.noLeidas(j), t = G.buzon.lista(j).length; b.hidden = !t; const c = d.getElementById('nn'); if (c) { const v = n ? String(n) : ''; if (c.textContent !== v) c.textContent = v; c.hidden = !n; } }
  G.tablonUI = { datos, elegibles, dias, abrir, cerrar, abrirBuzon, cerrarBuzon, badge, abierto: () => { const p = d && d.getElementById && d.getElementById('tablon'), b = d && d.getElementById && d.getElementById('buzon'); return !!((p && !p.hidden) || (b && !b.hidden)); } };
})(typeof window !== 'undefined' ? window : globalThis);
