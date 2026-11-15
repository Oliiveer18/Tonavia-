// equipo_ui.js — pestaña EQUIPO (v2.310): el equipo del jugador y todas sus criaturas, con nivel, XP, vida y ficha de detalle. Solo LEE lo que ya guarda cada jugador (j.prog, j.vida, j.sinId): no guarda nada ni toca el motor.
// Parte PURA (datos/datosEquipo, probada en test.js): fichas y listas ordenadas, sin DOM. Parte DOM: panel #equipo con dos pestañas (Equipo · Criaturas), tarjetas con sprite, chips de elemento y rareza, barras de vida y XP, y hoja de detalle.
(function (root) {
  'use strict';
  const G = root.G, MAX_EQUIPO = 6;
  const EL = { fuego: ['Fuego', '#e8632b'], agua: ['Agua', '#3f9bd6'], hoja: ['Hoja', '#5cb85c'], electrico: ['Eléctrico', '#f0c419'], aire: ['Aire', '#8fd3e8'], roca: ['Roca', '#b09a78'], sombra: ['Sombra', '#8a6ab8'] };
  const RAR = { comun: ['Común', 1], rara: ['Rara', 2], epica: ['Épica', 3], legendaria: ['Legendaria', 4] };
  const STAT = [['Vida máx.', 'hpMax', 1], ['Ataque', 'atk', 1], ['Defensa', 'def', 1], ['Velocidad', 'vel', 100]];

  // ── PARTE PURA ──
  // Ficha de una especie para el jugador j: nivel por XP, estadísticas a ese nivel y vida actual (sin entrada en j.vida = completa; 0 = debilitada).
  function ficha(j, clave, ej) {   // clave = especie o «especie#2» (copias repetidas del equipo)
    const forma = String(clave).split('#')[0];   // v2.339: con ej (ejemplar de la caja) usa su XP y su vida; sin él, los del equipo (j.prog / j.vida)
    const N = G.nivel, xp = ej ? ej.xp | 0 : j && j.prog && j.prog[clave] ? j.prog[clave].xp : 0, nv = N.nivelDe(xp), st = G.combate.statsDe({ forma, nivel: nv });
    const hv = ej ? ej.hp : j && j.vida ? j.vida[clave] : undefined, v = typeof hv === 'number' ? Math.min(hv, st.hpMax) : st.hpMax, d0 = N.xpPara(nv), d1 = nv >= N.AJUSTES.MAX ? d0 : N.xpPara(nv + 1);
    return { forma, clave, nom: st.nom, num: ej ? ej.id | 0 : (G.equipo ? G.equipo.idDe(j, clave) : 0), mote: ej ? ej.mote || '' : (G.equipo && G.equipo.moteDe(j, clave)) || '', el: st.el, rar: st.rar, fase: st.fase, kg: st.kg, nivel: nv, xp, xpDesde: d0, xpHasta: d1, maxNivel: nv >= N.AJUSTES.MAX, hp: Math.max(0, Math.round(v)), hpMax: st.hpMax, debil: v <= 0, atk: st.atk, def: st.def, vel: st.vel };
  }
  // Datos del panel: equipo (MAX_EQUIPO huecos; null = libre) y todas las criaturas (una fila por especie, con cuántas hay), ordenadas por rareza, nivel y nombre.
  function datos(j, formasEquipo) {   // v2.339: «todas» = una fila por ejemplar (los del equipo y los de la caja)
    const eq = (formasEquipo || []).filter((f, i, a) => G.CREATURES && G.CREATURES[String(f).split('#')[0]] && a.indexOf(f) === i).slice(0, MAX_EQUIPO), caja = G.equipo ? G.equipo.caja(j) : [];
    const equipo = eq.map((f) => ficha(j, f)); while (equipo.length < MAX_EQUIPO) equipo.push(null);
    const todas = eq.map((f) => Object.assign(ficha(j, f), { enEquipo: true })).concat(caja.filter((q) => G.CREATURES && G.CREATURES[q.forma]).map((q) => Object.assign(ficha(j, q.forma, q), { id: q.id, enEquipo: false, enCaja: true })));
    todas.sort((a, b) => (b.enEquipo ? 1 : 0) - (a.enEquipo ? 1 : 0) || (RAR[b.rar] ? RAR[b.rar][1] : 0) - (RAR[a.rar] ? RAR[a.rar][1] : 0) || b.nivel - a.nivel || a.nom.localeCompare(b.nom, 'es') || (a.id | 0) - (b.id | 0));
    return { equipo, todas, total: todas.length, enEquipo: eq.length, max: MAX_EQUIPO, caja: caja.length, cajaMax: G.equipo ? G.equipo.cajaMax(j) : 0 };
  }
  const numTxt = (n) => 'Nº ' + String(n).padStart(4, '0');   // v2.342: ID permanente
  const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);
  // Movimientos de una criatura del equipo (mismo kit que usa en combate): [{ nombre, hueco, el }]
  function movimientos(j, f) { try { const kit = G.combate.kitDe(f.el, f.rar, 'j_' + (j.id || 'oli')), H = G.COMBATE_DATOS.HUECOS; return kit.map((k) => G.COMBATE_DATOS.MOV[k]).filter(Boolean).map((m) => ({ nombre: m.nombre, hueco: H[m.hueco] || m.hueco, el: m.el })); } catch (e) { return []; } }

  // ── PARTE DOM ──
  const d = root.document, E = { j: null, formas: [], tab: 'equipo', previo: null, edit: false, guardar: null, mote: null, liberar: null, alCerrar: null };
  const el = (t, cls, txt) => { const e = d.createElement(t); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  function sprite(forma, tope) {   // lienzo con la criatura de frente, ampliada a escala entera
    const s = G.creatureSprite(forma, 'down', 0), k = Math.max(1, Math.floor(tope / Math.max(s.w, s.h))), c = d.createElement('canvas'); c.width = s.w * k; c.height = s.h * k; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s.c, 0, 0, c.width, c.height); c.setAttribute('aria-hidden', 'true'); return c;
  }
  function chips(f) {
    const w = el('div', 'eq-chips'), e = EL[f.el] || [f.el, '#aaa'], r = RAR[f.rar] || [f.rar, 1];
    const a = el('span', 'eq-chip'); const p = el('i', 'eq-dot'); p.style.background = e[1]; a.appendChild(p); a.appendChild(d.createTextNode(e[0])); w.appendChild(a);
    const b = el('span', 'eq-chip r' + r[1], r[0]); w.appendChild(b); return w;
  }
  function barra(cls, valor, max, texto) {
    const b = el('div', 'eq-bar ' + cls), i = el('i'); i.style.width = pct(valor, max) + '%'; b.appendChild(i); const w = el('div', 'eq-barw'); w.appendChild(b); if (texto) w.appendChild(el('span', '', texto)); return w;
  }
  function estadoVida(f) { const p = pct(f.hp, f.hpMax); return f.debil ? 'mal' : p <= 25 ? 'baja' : p <= 55 ? 'media' : 'ok'; }
  function tarjeta(f, grande) {
    const t = el('button', 'eq-card' + (grande ? ' slot' : ' fila') + (f.debil ? ' debil' : '')); t.type = 'button'; t.setAttribute('aria-label', (f.mote || f.nom) + ', nivel ' + f.nivel + (f.debil ? ', debilitada' : ', vida ' + f.hp + ' de ' + f.hpMax));
    const im = el('div', 'eq-im'); im.style.setProperty('--tono', (EL[f.el] || [0, '#aaa'])[1]); im.appendChild(sprite(f.forma, grande ? 84 : 56)); t.appendChild(im);
    const c = el('div', 'eq-info'); const n = el('div', 'eq-nom'); n.appendChild(el('b', '', f.mote || f.nom)); n.appendChild(el('span', 'eq-nv', 'Nv ' + f.nivel)); if (f.num) n.appendChild(el('span', 'eq-num', numTxt(f.num))); if (!grande && f.enEquipo) n.appendChild(el('span', 'eq-en', 'En equipo')); c.appendChild(n); c.appendChild(chips(f));
    c.appendChild(barra('vida ' + estadoVida(f), f.hp, f.hpMax, f.debil ? 'Debilitada' : f.hp + ' / ' + f.hpMax)); if (grande) c.appendChild(barra('xp', f.maxNivel ? 1 : f.xp - f.xpDesde, f.maxNivel ? 1 : f.xpHasta - f.xpDesde, f.maxNivel ? 'Nivel máximo' : 'XP ' + (f.xp - f.xpDesde) + ' / ' + (f.xpHasta - f.xpDesde)));
    t.appendChild(c); t.addEventListener('click', () => detalle(f)); return t;
  }
  function hueco() { const t = el(E.edit ? 'button' : 'div', 'eq-card slot libre'); if (E.edit) { t.type = 'button'; t.addEventListener('click', () => { E.tab = 'todas'; pintar(); }); } t.appendChild(el('div', 'eq-mas', '+')); t.appendChild(el('span', '', E.edit ? 'Añadir una criatura' : 'Hueco libre')); return t; }
  function detalle(f) {
    const h = d.getElementById('eq-det'); if (!h) return; h.textContent = ''; E.previo = d.activeElement;
    const box = el('div', 'eq-hoja'), top = el('div', 'eq-dtop'), im = el('div', 'eq-dim'); im.style.setProperty('--tono', (EL[f.el] || [0, '#aaa'])[1]); im.appendChild(sprite(f.forma, 132)); top.appendChild(im);
    const c = el('div', 'eq-dinfo'); c.appendChild(el('h2', '', f.mote || f.nom)); if (f.mote) c.appendChild(el('span', 'eq-esp', f.nom)); c.appendChild(el('span', 'eq-nv', 'Nivel ' + f.nivel + (f.enCaja ? ' · En la caja' : ''))); if (f.num) c.appendChild(el('span', 'eq-num', numTxt(f.num))); c.appendChild(chips(f)); top.appendChild(c);
    const x = el('button', 'x'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar la ficha'); x.innerHTML = G.ic ? G.ic('cerrar', 's') : '✕'; x.addEventListener('click', cerrarDetalle); top.appendChild(x); box.appendChild(top);
    box.appendChild(barra('vida ' + estadoVida(f), f.hp, f.hpMax, f.debil ? 'Debilitada: llévala al Centro PC' : 'Vida ' + f.hp + ' / ' + f.hpMax)); box.appendChild(barra('xp', f.maxNivel ? 1 : f.xp - f.xpDesde, f.maxNivel ? 1 : f.xpHasta - f.xpDesde, f.maxNivel ? 'Nivel máximo' : 'XP ' + (f.xp - f.xpDesde) + ' / ' + (f.xpHasta - f.xpDesde)));
    const g = el('dl', 'eq-stats'); STAT.forEach(([n, k, m]) => { g.appendChild(el('dt', '', n)); g.appendChild(el('dd', '', String(Math.round(f[k] * m)))); }); g.appendChild(el('dt', '', 'Peso')); g.appendChild(el('dd', '', f.kg + ' kg')); g.appendChild(el('dt', '', 'Fase')); g.appendChild(el('dd', '', String(f.fase))); box.appendChild(g);
    if (f.enEquipo) { const mv = movimientos(E.j, f); if (mv.length) { box.appendChild(el('h3', '', 'Movimientos')); const l = el('ul', 'eq-movs'); mv.forEach((m) => { const li = el('li'); li.appendChild(el('b', '', m.nombre)); li.appendChild(el('span', '', m.hueco)); l.appendChild(li); }); box.appendChild(l); } }
    if (E.mote) {   // v2.340: mote opcional (por defecto se llama como su especie)
      const ref = f.enCaja ? { id: f.id } : { clave: f.clave }, fm = el('form', 'eq-mote'), lb = el('label', '', 'Nombre'), ip = el('input'), gd = el('button', 'eq-btn pri', 'Guardar'), q = el('button', 'eq-btn sec', 'Quitar');
      ip.type = 'text'; ip.maxLength = 12; ip.value = f.mote || ''; ip.placeholder = f.nom; ip.autocomplete = 'off'; ip.spellcheck = false; ip.id = 'eq-mote-in'; lb.htmlFor = 'eq-mote-in'; gd.type = 'submit'; q.type = 'button'; q.hidden = !f.mote;
      const poner = (t) => { const r = E.mote(ref, t); if (!r) { aviso('No se pudo cambiar el nombre'); return; } cerrarDetalle(); pintar(); aviso(r.mote ? 'Ahora se llama ' + r.mote : 'Vuelve a llamarse ' + f.nom); };
      fm.addEventListener('submit', (e) => { e.preventDefault(); poner(ip.value); }); q.addEventListener('click', () => poner(''));
      const fila = el('div', 'eq-mote-f'); fila.appendChild(ip); fila.appendChild(gd); fila.appendChild(q); fm.appendChild(lb); fm.appendChild(fila); fm.appendChild(el('small', '', 'Hasta 12 letras, cifras, espacios, . \' -'));
      box.appendChild(fm);
    }
    if (E.edit && E.guardar) {   // v2.312: con la enfermera se puede editar el equipo
      const eq = G.equipo.actual(E.j), acc = el('div', 'eq-acc');
      const btn = (txt, cls, fn, off) => { const b = el('button', 'eq-btn ' + cls, txt); b.type = 'button'; if (off) b.disabled = true; else b.addEventListener('click', fn); acc.appendChild(b); };
      if (f.enCaja) {
        if (E.liberar) { const lb = el('button', 'eq-btn peligro', 'Liberar'); lb.type = 'button'; lb.addEventListener('click', () => { if (!lb.dataset.seguro) { lb.dataset.seguro = '1'; lb.textContent = 'Seguro: liberar para siempre'; lb.setAttribute('aria-live', 'polite'); return; } const r = E.liberar(f.id); if (!r) { aviso('No se pudo liberar'); return; } cerrarDetalle(); pintar(); aviso((f.mote || f.nom) + ' vuelve a la naturaleza'); }); acc.appendChild(lb); }
        btn(eq.length >= G.equipo.MAX ? 'Equipo completo (' + G.equipo.MAX + ')' : 'Añadir al equipo', 'pri', () => cambiar(eq.concat([f.forma]), eq.map(() => null).concat([f.id]), f.nom + ' se une al equipo'), eq.length >= G.equipo.MAX);
      } else {
        if (eq[0] !== f.clave) btn('Poner al frente', 'pri', () => cambiar([f.clave].concat(eq.filter((q) => q !== f.clave)), null, f.nom + ' va al frente'));
        btn(eq.length <= 1 ? 'Debe quedar una' : 'Guardar en la caja', 'sec', () => cambiar(eq.filter((q) => q !== f.clave), null, f.nom + ' va a la caja'), eq.length <= 1);
      }
      box.appendChild(acc);
    }
    h.appendChild(box); h.hidden = false; (box.querySelector('.eq-btn:not([disabled])') || x).focus();
  }
  function aviso(txt) { let a = d.getElementById('eq-aviso'); if (!a) { a = el('div'); a.id = 'eq-aviso'; a.setAttribute('role', 'status'); const p = d.getElementById('equipo'); if (p) p.appendChild(a); } a.textContent = txt; a.classList.remove('v'); void a.offsetWidth; a.classList.add('v'); }
  function cambiar(formas, ids, txt) { if (!E.guardar || !E.guardar(formas, ids)) { aviso(E.j && G.equipo && G.equipo.cajaLlena(E.j) ? 'La caja está llena: amplíala' : 'No se pudo cambiar el equipo'); return; } cerrarDetalle(); pintar(); aviso(txt); if (G.audio) G.audio.sfx('captura'); }
  function cerrarDetalle() { const h = d.getElementById('eq-det'); if (h) h.hidden = true; if (E.previo && E.previo.focus) { try { E.previo.focus(); } catch (e) { /* sin foco */ } } }
  function pintar() {
    const L = d.getElementById('eq-lista'), N = d.getElementById('eq-n'); if (!L || !E.j) return; E.formas = G.equipo ? G.equipo.actual(E.j) : E.formas; const D = datos(E.j, E.formas); L.textContent = ''; const P = d.getElementById('equipo'); if (P) P.classList.toggle('editando', E.edit);
    { const T = d.getElementById('eq-ent'); if (T && G.entrenador) { const I = G.entrenador.info(E.j); T.textContent = ''; T.appendChild(el('div', 'eq-ent-t', 'Entrenador · Nivel ' + I.nivel + (I.max ? ' (máximo)' : ' · XP ' + (I.xp - I.desde) + ' / ' + (I.hasta - I.desde)))); const b = el('div', 'eq-ent-b'), i = el('i'); i.style.width = (I.max ? 100 : pct(I.xp - I.desde, I.hasta - I.desde)) + '%'; b.appendChild(i); T.appendChild(b); } }   // v2.343
    N.textContent = (E.edit ? 'Toca una criatura para moverla entre equipo y caja · ' : '') + D.enEquipo + ' de ' + D.max + ' en el equipo · caja ' + D.caja + '/' + D.cajaMax + (E.edit ? '' : ' (se gestiona en el Centro PC)');
    d.querySelectorAll('#eq-tabs button').forEach((b) => { const on = b.dataset.tab === E.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (b.dataset.tab === 'todas') b.textContent = 'Criaturas · ' + D.todas.length; });
    L.className = E.tab === 'equipo' ? 'eq-grid' : 'eq-col';
    if (E.tab === 'equipo') D.equipo.forEach((f, i) => { const t = f ? tarjeta(Object.assign(f, { enEquipo: true }), true) : hueco(); if (f && i === 0) { t.classList.add('frente'); t.appendChild(el('span', 'eq-frente', 'Al frente')); } L.appendChild(t); });
    else if (!D.todas.length) L.appendChild(el('p', 'eq-vacio', 'Todavía no tienes criaturas.')); else D.todas.forEach((f) => L.appendChild(tarjeta(f, false)));
  }
  function abrir(j, formasEquipo, opc) { const p = d.getElementById('equipo'); if (!p || !j) return; E.j = j; E.formas = formasEquipo || E.formas; E.edit = !!(opc && opc.editar && opc.guardar); E.guardar = E.edit ? opc.guardar : null; E.mote = opc && opc.mote || null; E.liberar = E.edit && opc.liberar || null; E.alCerrar = opc && opc.alCerrar || null; if (E.edit) E.tab = 'equipo'; E.previo = d.activeElement; pintar(); p.hidden = false; const b = d.querySelector('#eq-tabs button[aria-selected=true]'); if (b) b.focus(); }
  function cerrar() { const p = d.getElementById('equipo'); if (p) p.hidden = true; cerrarDetalle(); const f = E.alCerrar; E.alCerrar = null; E.edit = false; E.guardar = null; if (f) f(); else if (E.previo && E.previo.focus) { try { E.previo.focus(); } catch (e) { /* sin foco */ } } }
  function montar() {
    if (!d || !d.getElementById) return; const tabs = d.getElementById('eq-tabs'), x = d.getElementById('eq-x'); if (!tabs) return;
    tabs.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button[data-tab]'); if (b) { E.tab = b.dataset.tab; pintar(); } });
    tabs.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { E.tab = E.tab === 'equipo' ? 'todas' : 'equipo'; pintar(); const b = d.querySelector('#eq-tabs button[aria-selected=true]'); if (b) b.focus(); } });
    if (x) x.addEventListener('click', cerrar);
    d.addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; const h = d.getElementById('eq-det'), p = d.getElementById('equipo'); if (h && !h.hidden) cerrarDetalle(); else if (p && !p.hidden) cerrar(); });
    const h = d.getElementById('eq-det'); if (h) h.addEventListener('click', (e) => { if (e.target === h) cerrarDetalle(); });
  }
  G.equipoUI = { MAX_EQUIPO, EL, RAR, sprite, chips, barra, estadoVida, numTxt, ficha, datos, movimientos, abrir, cerrar, montar, refrescar() { const p = d && d.getElementById && d.getElementById('equipo'); if (p && !p.hidden) pintar(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.equipoUI;
})(typeof window !== 'undefined' ? window : globalThis);
