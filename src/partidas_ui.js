// partidas_ui.js — v2.371. Pantalla «Partidas» (elegir, crear, renombrar y borrar con confirmación). Solo pinta y llama a G.partidas; el estado de juego no se toca desde aquí.
// Cambiar de partida = fijar la activa y recargar la página (las claves de guardado se fijan al cargar). Con una sola partida no se ve nada nuevo salvo el botón «Partidas» del menú.
(function (root) {
  'use strict';
  const G = root.G, doc = root.document; if (!doc || !G.partidas) return;
  const P = G.partidas, FLAG = 'criaturas_partida_elegida', $ = (id) => doc.getElementById(id);
  const menu = $('menu'), box = $('partidas'), btn = $('partidas-btn'); if (!menu || !box || !btn) return;
  let modo = 'lista', pend = null, msg = '';   // 'lista' | 'nueva' | 'pruebas' | 'renombrar' ; pend = id con borrado pendiente de confirmar
  const el = (t, c, x) => { const e = doc.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
  const acc = (txt, f, c) => { const b = el('button', c || 'pt-b', txt); b.type = 'button'; b.addEventListener('click', f); return b; };
  const etiqueta = () => { const a = P.activa(); btn.textContent = 'Partida: ' + (a ? a.nombre : '—') + (a && a.tipo === 'pruebas' ? ' (PRUEBAS)' : '') + ' · cambiar'; };
  function recargar() { try { root.sessionStorage.setItem(FLAG, '1'); } catch (e) { /* sin sessionStorage */ } try { if (/[?&](nueva|recuperar)=1/.test(root.location.search)) root.location.href = root.location.pathname + root.location.hash; else root.location.reload(); } catch (e) { /* sin navegación */ } }
  function entrar(id) { if (id === P.activa().id) { cerrar(); return; } if (P.elegir(id)) recargar(); }
  function campo(lbl, tipo, val, min, max) { const w = el('label', 'pt-f', lbl), i = el('input'); i.type = tipo; i.value = val; if (tipo === 'number') { i.min = min; i.max = max; i.inputMode = 'numeric'; } else i.maxLength = P.NOMBRE_MAX; w.appendChild(i); return { w, i }; }
  function pintar() {
    box.textContent = ''; const caja = el('div', 'pt-caja'); box.appendChild(caja); caja.appendChild(el('h1', '', 'Partidas'));
    const l = P.lista(), a = P.activa();
    if (modo === 'lista') {
      l.forEach((e) => {
        const f = el('div', 'pt-fila' + (e.id === a.id ? ' act' : '')), t = el('div', 'pt-t'); t.appendChild(el('b', '', e.nombre)); t.appendChild(el('span', '', (e.id === a.id ? 'En curso' : 'Guardada en este dispositivo') + (e.tipo === 'pruebas' ? ' · PRUEBAS' : '')));
        f.appendChild(t);
        if (pend === e.id) { f.appendChild(el('div', 'pt-q', '¿Borrar «' + e.nombre + '»? No se puede deshacer.')); f.appendChild(acc('Sí, borrar', () => { P.borrar(e.id); pend = null; if (e.id === a.id) recargar(); else pintar(); }, 'pt-b pt-mal')); f.appendChild(acc('No', () => { pend = null; pintar(); })); }
        else { f.appendChild(acc(e.id === a.id ? 'Seguir' : 'Jugar', () => entrar(e.id), 'pt-b pt-ok')); f.appendChild(acc('Nombre', () => { modo = 'renombrar:' + e.id; pintar(); })); if (l.length > 1) f.appendChild(acc('Borrar', () => { pend = e.id; pintar(); })); }
        caja.appendChild(f);
      });
      if (l.length < P.MAX) { caja.appendChild(acc('+ Nueva partida', () => { modo = 'nueva'; msg = ''; pintar(); }, 'pt-b pt-ok pt-g')); caja.appendChild(acc('+ Partida de pruebas', () => { modo = 'pruebas'; msg = ''; pintar(); }, 'pt-b pt-g')); }
      else caja.appendChild(el('p', 'pt-n', 'Máximo ' + P.MAX + ' partidas: borra alguna para crear otra.'));
      caja.appendChild(el('p', 'pt-n', 'Cada partida lleva a Oli y a Lali. Se guardan en este dispositivo.')); caja.appendChild(acc('Cerrar', cerrar, 'pt-b pt-g'));
    } else if (modo.indexOf('renombrar:') === 0) {
      const id = modo.slice(10), e = P.buscar(id), c = campo('Nombre', 'text', e ? e.nombre : '');
      caja.appendChild(c.w); caja.appendChild(acc('Guardar', () => { P.renombrar(id, c.i.value); modo = 'lista'; pintar(); etiqueta(); }, 'pt-b pt-ok pt-g')); caja.appendChild(acc('Cancelar', () => { modo = 'lista'; pintar(); }, 'pt-b pt-g'));
    } else {
      const pr = modo === 'pruebas', M = G.entrenador ? G.entrenador.MAX : 50, TP = G.tienda ? G.tienda.TOPE : 99999;
      caja.appendChild(el('h2', '', pr ? 'Partida de pruebas' : 'Nueva partida'));
      const c = campo('Nombre', 'text', pr ? 'Pruebas' : 'Partida ' + (l.length + 1));
      caja.appendChild(c.w); let cn, cb;
      if (pr) { cn = campo('Nivel de entrenador (1-' + M + ')', 'number', 10, 1, M); cb = campo('Brillos ✦ (0-' + TP + ')', 'number', 500, 0, TP); caja.appendChild(cn.w); caja.appendChild(cb.w); caja.appendChild(el('p', 'pt-n', 'Marcada «PRUEBAS»: sirve para probar cosas, no para validar visitas reales entre móviles.')); }
      if (msg) caja.appendChild(el('p', 'pt-q', msg));
      caja.appendChild(acc('Crear y jugar', () => { const r = P.crear(c.i.value, pr ? 'pruebas' : 'normal', pr ? { nivel: cn.i.value, brillos: cb.i.value } : null); if (!r.ok) { msg = r.motivo === 'llena' ? 'Ya hay ' + P.MAX + ' partidas.' : 'No hay sitio para guardar en este dispositivo.'; pintar(); return; } entrar(r.id); }, 'pt-b pt-ok pt-g'));
      caja.appendChild(acc('Cancelar', () => { modo = 'lista'; pintar(); }, 'pt-b pt-g'));
    }
  }
  function abrir() { modo = 'lista'; pend = null; pintar(); box.hidden = false; }
  function cerrar() { box.hidden = true; etiqueta(); }
  btn.addEventListener('click', abrir); etiqueta();
  let visto = false; try { visto = root.sessionStorage.getItem(FLAG) === '1'; } catch (e) { visto = false; }
  if (P.lista().length > 1 && !visto) abrir();   // con más de una partida se elige antes de jugar
  G.partidasUI = { abrir, cerrar };
})(typeof window !== 'undefined' ? window : globalThis);
