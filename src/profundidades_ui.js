// profundidades_ui.js — INTERFAZ DE LAS PROFUNDIDADES (v2.320): rótulo del piso (bioma, llaves, runa, modificadores, pista del puzle), minimapa con niebla, botones «Salir» y «Reiniciar sala»,
// y los paneles de elección (santuario, encrucijada) y de la estela de récords. Solo PINTA y pide órdenes (api.prof): no toca el estado ni usa azar.
(function (root) {
  'use strict';
  const G = root.G, d = root.document; let caja = null, mini = null, modal = null, vistoTxt = '', tMini = 0, salirT = 0, api = null;
  const el = (t, cls, txt) => { const e = d.createElement(t); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const CSS = '#phud{position:absolute;left:6px;top:6px;z-index:4;max-width:62%;padding:5px 8px;background:rgba(36,18,29,.88);border:2px solid var(--pa-borde,#d9a46c);color:var(--crema,#fff4dc);font-size:13px;line-height:1.25;pointer-events:none}' +
    '#phud[hidden],#pmini[hidden],#pmodal[hidden]{display:none}#phud b{color:var(--oro,#f7c948);font-size:15px}#phud .pl{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;margin-top:2px}#phud .pm{padding:0 4px;border:1px solid currentColor;font-size:11px}#phud .pm.mal{color:#ff8a7a}#phud .pm.ben{color:#9dffb0}' +
    '#phud .pp{margin-top:3px;color:#ffe9b0;font-size:12px}#phud .pb{display:flex;gap:6px;margin-top:5px;pointer-events:auto}#phud .pb button{min-height:36px;min-width:44px;padding:0 9px;border:2px solid var(--tinta,#24121d);background:var(--oro,#f7c948);color:var(--tinta,#24121d);font:inherit;font-weight:bold}#phud .pb button.sec{background:#4a3550;color:var(--crema,#fff4dc)}' +
    '#pmini{position:absolute;right:8px;top:8px;z-index:3;width:116px;height:76px;image-rendering:pixelated;border:2px solid var(--pa-borde,#d9a46c);box-shadow:0 0 0 2px var(--tinta,#24121d);pointer-events:none}' +
    '#pmodal{position:fixed;inset:0;z-index:9;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,6,16,.6);padding:12px}#pmodal .pc{width:100%;max-width:420px;padding:14px;background:#24121d;border:3px solid var(--pa-borde,#d9a46c);color:var(--crema,#fff4dc)}#pmodal h2{margin:0 0 6px;font-size:20px;color:var(--oro,#f7c948)}#pmodal p{margin:0 0 10px;font-size:15px;line-height:1.35}' +
    '#pmodal button{display:block;width:100%;min-height:50px;margin-top:8px;padding:6px 10px;text-align:left;border:3px solid var(--tinta,#24121d);background:#4a3550;color:var(--crema,#fff4dc);font:inherit}#pmodal button b{display:block;font-size:16px;color:var(--oro,#f7c948)}#pmodal button small{font-size:13px;opacity:.9}';
  function montar() {
    if (caja || !d || !d.body || !d.getElementById) return !!caja; const st = d.getElementById('stage'); if (!st || !st.appendChild) return false;
    const s = el('style'); s.textContent = CSS; d.head.appendChild(s);
    caja = el('div'); caja.id = 'phud'; caja.hidden = true; caja.setAttribute('role', 'status'); st.appendChild(caja);
    mini = el('canvas'); mini.id = 'pmini'; mini.hidden = true; mini.setAttribute('aria-hidden', 'true'); st.appendChild(mini);
    return true;
  }
  function cerrarModal() { if (modal) { modal.remove(); modal = null; } }
  function abrirModal(titulo, texto, ops) {
    cerrarModal(); modal = el('div'); modal.id = 'pmodal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); const c = el('div', 'pc'); c.appendChild(el('h2', '', titulo)); texto.split('\n').forEach((t) => c.appendChild(el('p', '', t)));
    ops.forEach((o, i) => { const b = el('button'); b.type = 'button'; b.appendChild(el('b', '', o.txt)); if (o.sub) b.appendChild(el('small', '', o.sub)); b.addEventListener('click', () => { cerrarModal(); if (o.al) o.al(); }); c.appendChild(b); if (i === 0) setTimeout(() => { try { b.focus(); } catch (e) { /* sin foco */ } }, 0); });
    modal.appendChild(c); d.body.appendChild(modal);
  }
  // resultado de una orden «hablar»/«prof»: abre el panel que toque
  function resultado(r) {
    if (!r || !r.prof || !montar()) return;
    if (r.prof === 'elige') abrirModal(r.elige.titulo, r.elige.texto, r.elige.ops.map((o, k) => ({ txt: o.txt, sub: o.sub, al: () => api && api.prof({ a: 'elegir', el: r.el, op: k }) })));
    else if (r.prof === 'estela') abrirModal('Estela de los exploradores', 'Tu récord: piso ' + r.record + '.\n' + (r.diaria ? 'Expedición diaria: llegaste al piso ' + r.diaria.piso + '.' : 'Aún no has hecho la expedición diaria.') + '\nExpediciones empezadas: ' + r.exp + '.' + (r.ult ? ' La última llegó al piso ' + r.ult.piso + '.' : '') + '\nBaja por la escalera para una cueva nueva cada vez, o pisa el portal y pulsa «hablar» para la cueva de hoy: la misma para todos.', [{ txt: 'Cerrar' }]);
  }
  function seguir(est, j, M, t, api0) {
    api = api0; if (!M || !M.prof || !j) { if (caja && !caja.hidden) { caja.hidden = true; mini.hidden = true; vistoTxt = ''; } return; }
    if (!montar()) return; const r = G.profundidades.resumen(est, j); if (!r) return;
    const txt = [r.piso, r.nombre, r.llaves, r.slot, r.mods.map((m) => m.id).join(), r.puzle ? r.puzle.id : '', r.diaria, salirT > t ? 1 : 0, r.cerca || ''].join('|');
    if (txt !== vistoTxt) {
      vistoTxt = txt; caja.textContent = ''; caja.hidden = false;
      caja.appendChild(el('b', '', r.piso ? 'Piso ' + r.piso : 'Campamento')); caja.appendChild(d.createTextNode(' · ' + (r.piso ? r.nombre : 'Boca de las Profundidades') + (r.diaria ? ' · diaria' : '')));
      if (r.piso) { const l = el('div', 'pl'); l.appendChild(el('span', '', 'Llaves: ' + r.llaves)); l.appendChild(el('span', '', 'Tu runa: ' + (r.slot ? 'luna' : 'sol'))); l.appendChild(el('span', '', 'Récord: ' + r.record)); r.mods.forEach((m) => { const s = el('span', 'pm ' + (m.tipo === 'maldicion' ? 'mal' : 'ben'), m.nombre); s.title = m.desc; l.appendChild(s); }); caja.appendChild(l); }
      else caja.appendChild(el('div', 'pp', 'Escalera de abajo: expedición nueva. Portal: la diaria. Estela: récords.'));
      if (r.puzle) caja.appendChild(el('div', 'pp', 'Pista: ' + r.puzle.pista));
      if (r.piso) { const b = el('div', 'pb'), s = el('button', 'sec', salirT > t ? '¿Seguro? Salir' : 'Salir'); s.type = 'button'; s.setAttribute('aria-label', 'Salir de la cueva y volver al campamento'); s.addEventListener('click', () => { if (salirT > t0()) { salirT = 0; api.prof({ a: 'salir' }); } else salirT = t0() + 3; vistoTxt = ''; }); b.appendChild(s);
        if (r.puzle) { const q = el('button', '', 'Reiniciar sala'); q.type = 'button'; q.addEventListener('click', () => api.prof({ a: 'reiniciar' })); b.appendChild(q); } caja.appendChild(b); }
    }
    relojUI = t; if (t - tMini > 0.2 || t < tMini) { tMini = t; mini.hidden = !r.piso; if (r.piso) G.cueva2d.mini(mini, est, M, j, t); }
  }
  let relojUI = 0; const t0 = () => relojUI;
  if (G.audio && G.profundidades) G.profundidades.BIOMAS.forEach((b) => { G.audio.TEMAS['prof_' + b] = G.profundidades.D.biomas[b].musica; });   // música por código de cada bioma (datos)
  G.profUI = { seguir, resultado, abierto: () => !!modal, cerrar: cerrarModal };
})(typeof window !== 'undefined' ? window : globalThis);
