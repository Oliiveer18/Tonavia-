// dialogo_ui.js — DIÁLOGO con un personaje (v2.312): caja inferior con retrato, nombre, texto que se escribe y opciones grandes. Sirve a la enfermera Alba (curar —cuesta Brillos— y preparar el equipo) y al tendero Teo (comprar, vender, charlar).
// Solo PINTA y pregunta: todo cambio de estado se pide al motor con órdenes a través de `api` (curar, equipo). Sin azar. Accesible: role=dialog, foco en las opciones, Esc cierra, texto completo para lectores de pantalla.
(function (root) {
  'use strict';
  const G = root.G, d = root.document, D = { npc: null, j: null, api: null, g: null, cola: [], i: 0, ops: null, fin: null, texto: '', pos: 0, timer: 0, espera: 0, activo: false, previo: null, viendo: false };
  const el = (t, cls, txt) => { const e = d.createElement(t); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const quieto = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const caja = () => d.getElementById('dlg');

  function retrato() {   // la cara y el cuello del personaje, ampliados a escala entera
    const s = G.spr && G.spr[(G.NAMES[D.npc] || 'enf') + '_down_0']; const c = d.createElement('canvas'); c.width = 90; c.height = 70; c.setAttribute('aria-hidden', 'true'); if (!s) return c;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const look = G.NAMES[D.npc] || '', y0 = /^ag/.test(look) && s.top !== undefined ? Math.max(0, Math.min(3, s.top + 1)) : 3; x.drawImage(s.c, 0, y0, 18, 14, 0, 0, 90, 70); /* v2.332: los entrenadores NPC empiezan donde empieza su cabeza */ return c;
  }
  function montarCaja() {
    let b = caja(); if (b) b.remove(); b = el('div'); b.id = 'dlg'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('aria-labelledby', 'dlg-n');
    const c = el('div', 'dlg-caja'), r = el('div', 'dlg-ret'); r.appendChild(retrato()); c.appendChild(r);
    const t = el('div', 'dlg-tag'); const n = el('b', '', D.g.nombre); n.id = 'dlg-n'; t.appendChild(n); t.appendChild(el('span', '', D.g.rol)); c.appendChild(t);
    const tx = el('p', 'dlg-txt'); tx.setAttribute('role', 'status'); tx.appendChild(el('span', 'dlg-vis')); const sr = el('span', 'dlg-sr'); tx.appendChild(sr); c.appendChild(tx);
    c.appendChild(el('span', 'dlg-sig', '▼')); c.appendChild(el('div', 'dlg-ops'));
    const x = el('button', 'dlg-x'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar la conversación'); x.textContent = '✕'; x.addEventListener('click', cerrar); c.appendChild(x);
    b.appendChild(c); b.addEventListener('click', (e) => { if (e.target.closest && (e.target.closest('.dlg-op') || e.target.closest('.dlg-x'))) return; avanzar(); }); d.body.appendChild(b); return b;
  }
  const vis = () => caja().querySelector('.dlg-vis'), sr = () => caja().querySelector('.dlg-sr');
  function pararTexto() { clearTimeout(D.timer); D.timer = 0; }
  function poner(t) { vis().textContent = t; }
  function escribir() {   // una letra cada ~22 ms (instantáneo con «reducir movimiento»)
    pararTexto(); if (D.pos >= D.texto.length) { terminarLinea(); return; }
    D.pos += 1; poner(D.texto.slice(0, D.pos)); const ch = D.texto[D.pos - 1]; if (ch !== ' ' && D.pos % 3 === 1 && G.audio) G.audio.sfx('hablar');
    D.timer = setTimeout(escribir, /[.,!?…]/.test(ch) ? 110 : 22);
  }
  function linea() {
    const caj = caja(); if (!caj) return; D.texto = D.cola[D.i]; D.pos = 0; caj.querySelector('.dlg-ops').textContent = ''; caj.classList.remove('lista'); sr().textContent = D.texto;
    if (quieto()) { D.pos = D.texto.length; poner(D.texto); terminarLinea(); } else { poner(''); escribir(); }
  }
  function terminarLinea() {   // texto entero en pantalla: opciones (última línea) o ▼ para seguir
    pararTexto(); poner(D.texto); const caj = caja(), ult = D.i >= D.cola.length - 1; caj.classList.add('lista');
    if (ult && D.ops) {
      const w = caj.querySelector('.dlg-ops'); w.textContent = ''; caj.classList.add('conops');
      D.ops.forEach((o, k) => { const b = el('button', 'dlg-op'); b.type = 'button'; b.appendChild(el('b', '', o.txt)); if (o.sub) b.appendChild(el('small', '', o.sub)); b.addEventListener('click', () => elegir(o.id)); w.appendChild(b); if (k === 0) setTimeout(() => { try { b.focus(); } catch (e) { /* sin foco */ } }, 0); });
    }
  }
  function avanzar() {
    if (!D.activo) return;
    if (D.pos < D.texto.length) { D.pos = D.texto.length; terminarLinea(); return; }          // 1.º toque: termina de escribir
    if (D.i < D.cola.length - 1) { D.i += 1; linea(); return; }                                // 2.º: siguiente frase
    if (!D.ops && D.fin) { const f = D.fin; D.fin = null; f(); }                               // última frase sin opciones: sigue el guion
  }
  // Muestra unas frases; al final, opciones (ops) o una acción (fin) tras un toque.
  function decir(lineas, ops, fin) { D.cola = lineas.slice(); D.i = 0; D.ops = ops || null; D.fin = fin || null; const c = caja(); if (c) { c.classList.remove('conops'); c.classList.remove('curando'); } linea(); }

  const heridas = () => { const v = D.j && D.j.vida; return (v ? Object.keys(v).length : 0) + ((D.j && D.j.sinId) || []).filter((q) => typeof q.hp === 'number').length; };   // v2.339: + las de la caja
  const fmt = (t, o) => t.replace(/\{(\w+)\}/g, (m, k) => (o[k] !== undefined ? o[k] : m));
  function menuTienda(primera) {   // v2.317: el tendero (Comprar, Vender, Charlar, Despedirme)
    const n = G.tienda ? G.tienda.saldo(D.j) : 0;
    decir(primera ? D.g.saludo : D.g.mas, [
      { id: 'comprar', txt: 'Comprar', sub: 'Pociones, Revivir y esferas · tienes ✦ ' + n },
      { id: 'vender', txt: 'Vender', sub: 'Pescados y objetos' },
      { id: 'charlar', txt: 'Charlar', sub: 'Un consejo de Teo' },
      { id: 'adios', txt: 'Despedirme' },
    ]);
  }
  function menu(primera) {
    if (D.g.tipo === 'tienda') { menuTienda(primera); return; }
    if (D.g.tipo === 'datos') { decir(primera ? D.g.saludo : D.g.mas, D.g.menu.map((o) => ({ id: o.id, txt: o.txt, sub: (D.api.sub && D.api.sub(D.npc, o.id)) || o.sub })).concat([{ id: 'adios', txt: 'Despedirme' }])); return; }   // v2.320: menú guiado por datos (npc.js)
    const eq = G.equipo.actual(D.j).length, h = heridas(), coste = G.tienda ? G.tienda.precioCurar(D.j) : 0;
    decir(primera ? D.g.saludo : ['¿Algo más?'], [
      { id: 'curar', txt: 'Curar a mis criaturas', sub: h ? 'Hay criaturas heridas · ' + coste + ' ✦' : 'Todas están en plena forma' },
      { id: 'equipo', txt: 'Gestionar mi equipo y mi caja', sub: eq + ' de ' + G.equipo.MAX + ' en el equipo · caja ' + G.equipo.caja(D.j).length + '/' + G.equipo.cajaMax(D.j) },
      { id: 'ampliar', txt: 'Ampliar mi caja', sub: G.equipo.precioAmpliar(D.j) ? '+10 huecos · ' + G.equipo.precioAmpliar(D.j) + ' ✦' : 'Ya está al máximo' },
      { id: 'adios', txt: 'Despedirme' },
    ]);
  }
  function elegir(id) {
    if (!D.activo) return;
    const od = D.g.tipo === 'datos' && id !== 'adios' ? D.g.menu.find((o) => o.id === id) : null;
    if (od && od.panel) { decir(od.di || ['…'], null, () => { const c = caja(); c.hidden = true; D.viendo = true; D.api.panel(D.npc, od.panel, () => { D.viendo = false; const k = caja(); if (!k || !D.activo) return; k.hidden = false; menu(false); }); }); return; }
    if (od && od.frases) { D.cons = ((D.cons | 0) + 1) % od.frases.length; decir(od.frases[D.cons], null, () => menu(false)); return; }
    if (id === 'comprar' || id === 'vender') {
      decir(D.g[id], null, () => { const c = caja(); c.hidden = true; D.viendo = true; D.api.bolsa(id === 'comprar' ? 'comprar' : 'vender', () => { D.viendo = false; const k = caja(); if (!k || !D.activo) return; k.hidden = false; menu(false); }); });
    } else if (id === 'charlar') {
      const c = D.g.consejos; D.cons = ((D.cons | 0) + 1) % c.length; decir(c[D.cons], null, () => menu(false));
    } else if (id === 'curar') {
      if (!heridas()) { decir(D.g.curarNada, null, () => menu(false)); return; }
      { const coste = G.tienda ? G.tienda.precioCurar(D.j) : 0, saldo = G.tienda ? G.tienda.saldo(D.j) : 0; if (coste > saldo) { decir(D.g.sinBrillos.map((t) => fmt(t, { coste, saldo })), null, () => menu(false)); return; } }
      decir(D.g.curando, null, null); caja().classList.add('curando');
      clearTimeout(D.espera); D.espera = setTimeout(() => {   // (temporizador propio: el del texto se reinicia en cada letra)
        // la enfermera trabaja un momento: brillo en el retrato y sonido
        if (G.audio) G.audio.sfx('curar'); const r = D.api.curar();
        if (r && r.curadas === false && r.falta) decir(D.g.sinBrillos.map((t) => fmt(t, { coste: G.tienda.precioCurar(D.j), saldo: G.tienda.saldo(D.j) })), null, () => menu(false)); else decir(D.g.curado, null, () => menu(false));
      }, quieto() ? 200 : 1500);
    } else if (id === 'ampliar') {
      const pr = G.equipo.precioAmpliar(D.j), saldo = G.tienda ? G.tienda.saldo(D.j) : 0;
      if (!pr) { decir(D.g.ampliarTope, null, () => menu(false)); return; }
      if (pr > saldo) { decir(D.g.ampliarNo.map((t) => fmt(t, { coste: pr, saldo })), null, () => menu(false)); return; }
      const r = D.api.ampliar(); if (r && r.ok) { if (G.audio) G.audio.sfx('curar'); decir(D.g.ampliado.map((t) => fmt(t, { max: r.max })), null, () => menu(false)); } else decir(D.g.ampliarNo.map((t) => fmt(t, { coste: pr, saldo })), null, () => menu(false));
    } else if (id === 'equipo') {
      decir(D.g.equipo, null, () => { const c = caja(); c.hidden = true; D.viendo = true; D.api.equipo(() => { D.viendo = false; const k = caja(); if (!k || !D.activo) return; k.hidden = false; decir(D.g.equipoHecho, null, () => menu(false)); }); });
    } else decir(D.g.adios, null, cerrar);
  }
  function abrir(npcId, j, api) {
    const g = G.npc && G.npc.GUION[npcId]; if (!g || !d || !j) return false; if (D.activo) return false;
    D.npc = npcId; D.j = j; D.api = api; D.g = g; D.activo = true; D.previo = d.activeElement; D.viendo = false; montarCaja(); menu(true); return true;
  }
  function cerrar() { pararTexto(); clearTimeout(D.espera); const c = caja(); if (c) c.remove(); const era = D.activo, api0 = D.api, npc0 = D.npc; D.activo = false; if (era && api0 && api0.cerrado) api0.cerrado(npc0);   /* v2.325: avisa al juego (un entrenador autónomo sigue su camino) */ D.cola = []; D.ops = null; D.fin = null; if (D.previo && D.previo.focus) { try { D.previo.focus(); } catch (e) { /* sin foco */ } } }
  if (d && d.addEventListener) d.addEventListener('keydown', (e) => {
    if (!D.activo || D.viendo) return;
    if (/^(Arrow(Up|Down|Left|Right)|[wasdWASD])$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); return; }   // mientras hablas, no caminas
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    else if ((e.key === 'Enter' || e.key === ' ') && !(e.target && e.target.closest && e.target.closest('.dlg-op'))) { e.preventDefault(); e.stopPropagation(); avanzar(); }
  }, true);
  G.dialogoUI = { abrir, cerrar, abierto: () => D.activo, _estado: () => ({ i: D.i, n: D.cola.length, ops: !!D.ops, viendo: D.viendo }) };
})(typeof window !== 'undefined' ? window : globalThis);
