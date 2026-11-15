// peces_ui.js — v2.192: ficha de captura (aparece al sacar un pez) y colección de peces (botón 🐟). Solo DOM; lo que muestra sale de G.PECES y de lo que ya guarda cada jugador (j.capturas, j.records): nada se guarda aquí.
// Los dibujos de los peces son los de G.pesca.matriz (los mismos del 2D), ampliados en un lienzo.
(function (root) {
  'use strict';
  const G = root.G, TINTA = '#2a1b30';
  function dibujo(id, k, desc) { // lienzo con el pez (versión de mayor detalle) ampliado k veces CSS; `desc` = sin descubrir: silueta oscura. Escala ENTERA de pantalla (v2.196): nítido con cualquier densidad
    const m = G.pesca.matriz(id, 0, true), dpr = root.devicePixelRatio || 1, kd = Math.max(1, Math.floor(k * dpr + 1e-6)), c = root.document.createElement('canvas'); c.width = m.w * kd; c.height = m.h * kd; c.style.width = (m.w * kd / dpr) + 'px'; c.style.height = (m.h * kd / dpr) + 'px'; const x = c.getContext('2d');
    m.px.forEach((fila, yy) => fila.forEach((col, xx) => { if (col) { x.fillStyle = desc ? '#1b1626' : col; x.fillRect(xx * kd, yy * kd, kd, kd); } })); c.setAttribute('aria-hidden', 'true'); return c;
  }
  const el = (t, cls, txt) => { const e = root.document.createElement(t); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  let tCarta = 0;
  const ui = G.pecesUI = {
    carta(j) { // ficha de la última captura de `j` (el jugador local)
      const f = j && j.pesca, d = root.document.getElementById('pcard'); if (!f || !f.pez || !d) return; const E = G.PECES[f.pez];
      d.textContent = ''; const im = el('div', 'pc-im'); im.appendChild(dibujo(f.pez, 5, false)); d.appendChild(im); const t = el('div', 'pc-t'); t.appendChild(el('b', '', E.nombre)); t.appendChild(el('span', '', G.pesca.pesoTexto(f.kg)));
      if (f.nuevo) t.appendChild(el('em', '', '¡Nuevo!')); else if (f.rec) t.appendChild(el('em', '', '¡Récord!')); d.appendChild(t); d.hidden = false; d.classList.add('ver');
      clearTimeout(tCarta); tCarta = setTimeout(() => { d.classList.remove('ver'); d.hidden = true; }, 3200);
    },
    abrir(j) { // colección: los 5 peces (los no descubiertos, en silueta y sin nombre), cuántos y el récord de peso
      const d = root.document.getElementById('peces'), l = root.document.getElementById('peces-lista'); if (!d || !l) return; l.textContent = ''; let n = 0;
      Object.keys(G.PECES).filter((id) => !G.PECES[id].oculto).forEach((id) => { const E = G.PECES[id], cant = (j.capturas && j.capturas[id]) | 0, rec = j.records && j.records[id], f = el('div', 'pz' + (cant ? '' : ' no')); if (cant) n++;
        const im = el('div', 'pz-im'); im.appendChild(dibujo(id, 5, !cant)); f.appendChild(im); const t = el('div', 'pz-t'); t.appendChild(el('b', '', cant ? E.nombre : '???')); t.appendChild(el('span', '', cant ? cant + (cant === 1 ? ' pescado' : ' pescados') + (rec ? ' · récord ' + G.pesca.pesoTexto(rec) : '') : ['Orilla', 'Aguas medias', 'Aguas hondas'][E.zona]));
        f.appendChild(t); l.appendChild(f); });
      root.document.getElementById('peces-n').textContent = n + ' de ' + Object.keys(G.PECES).filter((id) => !G.PECES[id].oculto).length; d.hidden = false;
    },
    cerrar() { const d = root.document.getElementById('peces'); if (d) d.hidden = true; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
