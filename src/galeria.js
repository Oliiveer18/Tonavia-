// galeria.js — Galería de criaturas (v2.8, paso 1.4): todas las líneas por Nº, con filtros combinables (elemento, rareza, fases), búsqueda por nombre, páginas de 20 líneas y sprites que se dibujan al verlos.
// Solo lectura: no toca los datos ni los dibujos. La lógica pura (lista, filtros, páginas) está en G.galeria y se prueba sin navegador; la pantalla va debajo.
(function () {
  'use strict';
  const G = window.G;
  const POR_PAG = 20;
  // Líneas evolutivas por Nº de línea: [{ n, family, stages: [id fase 1, id fase 2, ...], elements, rarity, phases }]
  G.lineList = function () {
    const num = {}; G.LINEAS.forEach((L) => { num[L.fam] = L.n; });
    const out = [];
    Object.keys(G.CREATURES).forEach((id) => {
      const d = G.CREATURES[id]; if (d.stage !== 1) return;
      const stages = [id]; let n = d.evolvesTo; while (n && stages.length < 4) { stages.push(n); n = G.CREATURES[n].evolvesTo; }
      out.push({ n: num[d.family], family: d.family, stages, elements: d.elements.slice(), rarity: d.rarity, phases: d.phases });
    });
    return out.sort((a, b) => a.n - b.n);
  };
  const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); // sin mayúsculas ni tildes
  G.galeria = {
    POR_PAG,
    fuente: null, // para pruebas: una función que devuelve otra lista de líneas (p. ej. una muestra simulada de 200)
    lista() { return (G.galeria.fuente || G.lineList)(); },
    norm,
    // f = { el, rar, fases, q }; '' = sin filtro. Una línea con dos elementos sale en los dos. La búsqueda mira el nombre de cualquiera de sus formas.
    filtrar(lista, f) {
      const q = norm(f.q);
      return lista.filter((ln) => (!f.el || ln.elements.includes(f.el)) && (!f.rar || ln.rarity === f.rar) && (!f.fases || ln.phases === Number(f.fases)) &&
        (!q || ln.stages.some((id) => norm(G.CREATURES[id].name).includes(q))));
    },
    // Una página (empieza en 0; si se pasa de rango se ajusta): { items, pag, pags, total }
    paginar(lista, pag, por) {
      por = por || POR_PAG; const pags = Math.max(1, Math.ceil(lista.length / por)); const p = Math.min(Math.max(0, pag | 0), pags - 1);
      return { items: lista.slice(p * por, (p + 1) * por), pag: p, pags, total: lista.length };
    },
    evolucion(id) { const n = G.CREATURES[id].evolvesTo; return n || null; }, // id de la siguiente fase, o null si es la última
    dibujados: 0, // sprites de tarjeta dibujados hasta ahora (para comprobar que se dibujan al verlos)
  };
  const root = document.getElementById('gal'); if (!root || !root.querySelector) return; // en los tests (sin navegador) solo existe la lógica
  const list = root.querySelector('#gal-list'), det = root.querySelector('#gal-det'), chips = root.querySelector('#gal-chips'), count = root.querySelector('#gal-count');
  const qin = root.querySelector('#gal-q'), clear = root.querySelector('#gal-clear'), prev = root.querySelector('#gp-prev'), next = root.querySelector('#gp-next'), info = root.querySelector('#gp-info');
  const f = { el: '', rar: '', fases: '', q: '' }; let pag = 0, obs = null;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  // v2.29 (ID-1, contraste): el color de un chip o filtro se aclara hasta que su borde se vea sobre el fondo (≥ 3:1) y se elige el texto (oscuro o claro) que llegue a ≥ 4,5:1 sobre él.
  // Solo cambia la INTERFAZ de la galería; G.ELEMENTS y G.RARITIES (los colores del juego) no se tocan. Antes fallaban Roca y Sombra.
  const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const FONDO_UI = '#2d2540', TEXTO_OSC = '#2a1b30', TEXTO_CLARO = '#fff9ee';
  const uiColor = (hex) => {
    let c = hex;
    for (let i = 0; i < 4; i++) { if (ratio(c, FONDO_UI) >= 3.2 && (ratio(c, TEXTO_OSC) >= 4.5 || ratio(c, TEXTO_CLARO) >= 4.5)) break; const [h, sa, l] = G.color.rgb2hsl([1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16))); c = '#' + G.color.hsl2rgb([h, sa, Math.min(0.9, l + 0.05)]).map((v) => (v < 16 ? '0' : '') + v.toString(16)).join(''); } // se aclara solo la luminosidad: el tono del elemento no cambia
    return { c, t: ratio(c, TEXTO_OSC) >= 4.5 || ratio(c, TEXTO_OSC) >= ratio(c, TEXTO_CLARO) ? TEXTO_OSC : TEXTO_CLARO };
  };
  const pon = (e, color) => { const u = uiColor(color); e.style.setProperty('--c', u.c); e.style.setProperty('--t', u.t); };
  const chip = (txt, color) => { const e = el('span', 'chip', txt); pon(e, color); return e; };
  const fmtKg = (kg) => (kg == null ? '–' : String(kg).replace('.', ',') + ' kg');
  const nn = (n) => 'Nº ' + String(n).padStart(3, '0');
  const draw = (cv, id, dir, fr, k) => { const s = G.creatureSprite(id, dir, fr); cv.width = s.w * k; cv.height = s.h * k; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(s.c, 0, 0, s.w * k, s.h * k); };
  const pintar = (cv) => { const s = G.creatureSprite(cv.dataset.id, 'down', 0); draw(cv, cv.dataset.id, 'down', 0, Math.max(1, Math.floor(80 / Math.max(s.w, s.h)))); G.galeria.dibujados++; }; // zoom entero que cabe en la caja de 80 px
  function render() {
    if (obs) obs.disconnect();
    obs = typeof IntersectionObserver === 'function' ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { obs.unobserve(e.target); pintar(e.target); } }), { root: list, rootMargin: '240px 0px' }) : null;
    const todas = G.galeria.lista(), fl = G.galeria.filtrar(todas, f), p = G.galeria.paginar(fl, pag); pag = p.pag;
    list.textContent = ''; let forms = 0; fl.forEach((ln) => { forms += ln.stages.length; });
    p.items.forEach((ln) => {
      const row = el('section', 'line'), cards = el('div', 'cards'); row.appendChild(el('div', 'lh', nn(ln.n)));
      ln.stages.forEach((id, i) => {
        const d = G.CREATURES[id];
        const b = el('button', 'card'); b.type = 'button'; b.dataset.id = id; b.setAttribute('aria-label', d.name + ', fase ' + d.stage + ' de ' + d.phases);
        const sp = el('div', 'sp'), cv = el('canvas'); cv.dataset.id = id; sp.appendChild(cv); b.appendChild(sp); b.appendChild(el('b', null, d.name)); b.appendChild(el('small', null, 'Fase ' + d.stage + ' de ' + d.phases));
        b.addEventListener('click', () => open(id, ln)); cards.appendChild(b);
        if (i < ln.stages.length - 1) cards.appendChild(el('span', 'arrow', '→'));
        if (obs) obs.observe(cv); else pintar(cv);
      });
      row.appendChild(cards); list.appendChild(row);
    });
    if (!fl.length) list.appendChild(el('p', 'empty', 'Ninguna línea con estos filtros.'));
    count.textContent = fl.length + (fl.length === 1 ? ' línea · ' : ' líneas · ') + forms + (forms === 1 ? ' forma' : ' formas');
    info.textContent = 'Pág. ' + (p.pag + 1) + ' de ' + p.pags; prev.disabled = p.pag <= 0; next.disabled = p.pag >= p.pags - 1;
    clear.style.visibility = (f.el || f.rar || f.fases || f.q) ? 'visible' : 'hidden';
    list.scrollTop = 0;
  }
  function open(id, ln) {
    const d = G.CREATURES[id], r = G.RARITIES[d.rarity], sz = G.traits(id).size, sig = G.galeria.evolucion(id);
    det.textContent = '';
    const head = el('div', 'dh'); head.appendChild(el('h2', null, d.name));
    const cl = el('button', 'x'); cl.innerHTML = '<i class="ic s i-cerrar"></i>'; cl.type = 'button'; cl.setAttribute('aria-label', 'Cerrar ficha'); cl.addEventListener('click', () => { det.hidden = true; }); head.appendChild(cl); det.appendChild(head);
    const tags = el('div', 'tags'); d.elements.forEach((x) => tags.appendChild(chip(G.ELEMENTS[x].name, G.ELEMENTS[x].color))); tags.appendChild(chip(r.name, r.color)); tags.appendChild(chip('Fase ' + d.stage + ' de ' + d.phases, '#b9b4c4')); det.appendChild(tags);
    const views = el('div', 'views');
    [['down', 'Frente'], ['left', 'Izquierda'], ['right', 'Derecha'], ['up', 'Espalda']].forEach(([dir, lab]) => { const fg = el('figure'); const cv = el('canvas'); draw(cv, id, dir, 0, 6); fg.appendChild(cv); fg.appendChild(el('figcaption', null, lab)); views.appendChild(fg); });
    det.appendChild(views);
    const anim = el('div', 'views');
    [[1, 'Paso'], [2, 'Reposo']].forEach(([fr, lab]) => { const fg = el('figure'); const cv = el('canvas'); draw(cv, id, 'down', fr, 6); fg.appendChild(cv); fg.appendChild(el('figcaption', null, lab)); anim.appendChild(fg); });
    det.appendChild(anim);
    const info2 = el('dl'); const add = (k, v) => { info2.appendChild(el('dt', null, k)); info2.appendChild(typeof v === 'string' ? el('dd', null, v) : v); };
    add('Línea', nn(ln.n));
    if (sig) { const dd = el('dd'), b = el('button', 'lnk', G.CREATURES[sig].name + ' →'); b.type = 'button'; b.addEventListener('click', () => open(sig, ln)); dd.appendChild(b); add('Evoluciona a', dd); } else add('Evoluciona a', 'Nada: es la última fase');
    add('Tamaño', sz[0] + '×' + sz[1] + ' px'); add('Peso', fmtKg(G.stageWeight(id, d.stage))); add('Diseño', d.by); add('Dice', '«' + d.line + '»');
    det.appendChild(info2); det.hidden = false; det.scrollTop = 0;
  }
  // filas de filtros: cada una es una fila que se desliza de lado (nunca salta de alto) con su opción «Todos»
  const fila = (titulo, key, opciones) => {
    const row = el('div', 'fr'); row.appendChild(el('span', 'fl', titulo));
    [['', 'Todos', '#b9b4c4']].concat(opciones).forEach(([v, name, col]) => {
      const b = el('button', 'f' + (v === '' ? ' on' : ''), name); b.type = 'button'; b.dataset.v = v; pon(b, col);
      b.addEventListener('click', () => { f[key] = v; pag = 0; row.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); render(); }); row.appendChild(b);
    }); chips.appendChild(row);
  };
  fila('Elemento', 'el', Object.keys(G.ELEMENTS).map((k) => [k, G.ELEMENTS[k].name, G.ELEMENTS[k].color]));
  fila('Rareza', 'rar', Object.keys(G.RARITIES).map((k) => [k, G.RARITIES[k].name, G.RARITIES[k].color]));
  fila('Fases', 'fases', [['1', '1 fase', '#b9b4c4'], ['2', '2 fases', '#b9b4c4'], ['3', '3 fases', '#b9b4c4']]);
  qin.addEventListener('input', () => { f.q = qin.value; pag = 0; render(); });
  clear.addEventListener('click', () => { f.el = f.rar = f.fases = f.q = ''; qin.value = ''; pag = 0; chips.querySelectorAll('.fr').forEach((r) => r.querySelectorAll('button').forEach((x, i) => x.classList.toggle('on', i === 0))); render(); });
  prev.addEventListener('click', () => { pag--; render(); }); next.addEventListener('click', () => { pag++; render(); });
  const toggle = (show) => { root.hidden = !show; if (show) { render(); det.hidden = true; } };
  document.getElementById('gbtn').addEventListener('click', () => toggle(true));
  root.querySelector('#gal-close').addEventListener('click', () => toggle(false));
  window.addEventListener && window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !root.hidden) { if (!det.hidden) det.hidden = true; else toggle(false); } });
})();
