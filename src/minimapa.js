// minimapa.js — MINIMAPA y MAPA GRANDE (v2.73, paso 1; v2.74: zoom con el dedo en el mapa grande; v2.75: tocar un lugar → su nombre y una flecha en el borde del juego). Solo LEE el mapa y el estado de la partida; no cambia reglas, ni el dibujo del juego, ni los datos.
// Los lugares NO están escritos aquí: salen del catálogo. Una pieza de G.OBJETOS con el campo `lugar` ({ nombre, icono, punto: [dx, dy] desde su casilla, puerta: true si ese punto es la puerta, color: relleno de su huella en el minimapa })
// aparece sola en el minimapa donde esté colocada en el mapa. Con «✏️ Editar mapa» se mueve o se añade un edificio y el minimapa lo sigue sin tocar código.
// El fondo (suelo + huellas + iconos [+ nombres]) se dibuja UNA vez por mapa y tamaño y se guarda; por cuadro solo se vuelve a pegar y se pintan los puntos de los jugadores.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  const COLOR = { '.': '#6fbf5f', f: '#6fbf5f', g: '#58a850', t: '#2f7a3a', '~': '#4a86e8', '=': '#e0c48c', s: '#e8d9a8', r: '#8b8f9c', c: '#4a4260', l: '#e0563a', b: '#a8743f', '#': '#e8d9a8', h: '#c24a3a', d: '#7a4a2a', _: '#b98a52', m: '#8a5a30', x: '#1e1626' }; // una pincelada por casilla del suelo (las 17 del editor)
  const JUGADOR = { lali: '#4aa3ff', oli: '#ff6fae' }, NOMBRE = { lali: 'Lali', oli: 'Oli' };
  const FUENTE = 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const MINI_ANCHO = 96, MINI_ALTO = 82; // tamaño del minimapa en px CSS (máximo); el mapa grande ocupa la pantalla

  // Lugares de un mapa: una entrada por objeto cuyo tipo tenga `lugar`. (tx, ty) = casilla del punto (la puerta en los edificios).
  function lugares(m) {
    const out = [], OB = G.OBJETOS || {};
    (m.objetos || []).forEach((o) => { const d = OB[o.tipo], l = d && d.lugar; if (!l) return; out.push({ tipo: o.tipo, nombre: l.nombre, icono: l.icono, tx: o.x + l.punto[0], ty: o.y + l.punto[1], puerta: !!l.puerta }); });
    return out;
  }
  // Jugadores que están en este mapa, en casillas (con decimales).
  function posiciones(est, m) { return Object.values(est.jugadores).filter((j) => j.mapa === m.id).map((j) => ({ id: j.id, tx: j.x / T, ty: j.y / T })); }

  const guardado = new WeakMap(); // mapa preparado → { 'tamaño[n]': lienzo }; un mapa nuevo (por ejemplo tras «Guardar y jugar») es otro objeto y se vuelve a dibujar
  // v2.298: los lugares se dibujan con los iconos de píxel del tema (variables CSS --ic-*, una sola fuente); sin documento (node) o sin cargar aún, vale el emoji del catálogo
  const ICONO_LUGAR = { '🏠': 'casa', '🧪': 'lab', '⛲': 'fuente', '🏥': 'centro', '🏪': 'tienda', '⛪': 'ermita' }, imgsL = {};
  function iconoImg(e) {
    const n = ICONO_LUGAR[e]; if (!n || typeof document === 'undefined' || typeof getComputedStyle !== 'function' || typeof Image === 'undefined') return null;
    if (!(n in imgsL)) { imgsL[n] = null; try { const mm = /url\(([^)]*)\)/.exec(getComputedStyle(document.documentElement).getPropertyValue('--ic-' + n)); if (mm) { const im = new Image(); im.src = mm[1].replace(/^["']|["']$/g, ''); imgsL[n] = im; } } catch (er) { /* sin icono: se usa el emoji */ } }
    const im = imgsL[n]; return im && im.complete && im.naturalWidth ? im : null;
  }
  Object.keys(ICONO_LUGAR).forEach(iconoImg);   // se piden al cargar para que estén listos antes del primer dibujo
  function fondo(m, s, opc) { // s = px por casilla; opc = { nombres, dpr, icono (tamaño del icono en casillas) }
    opc = opc || {}; const clave = s + (opc.nombres ? 'n' : '') + (opc.fk && opc.fk !== 1 ? 'k' + opc.fk : ''); let porMapa = guardado.get(m); if (!porMapa) guardado.set(m, (porMapa = {}));
    if (porMapa[clave]) return porMapa[clave];
    const c = G.makeCanvas(m.W * s, m.H * s), x = c.getContext('2d'), OB = G.OBJETOS || {}; x.imageSmoothingEnabled = false;
    for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) { x.fillStyle = COLOR[m.suelo[ty][tx]] || '#000'; x.fillRect(tx * s, ty * s, s, s); }
    (m.objetos || []).forEach((o) => { const d = OB[o.tipo]; if (!d || !d.lugar || !d.lugar.color) return; x.fillStyle = d.lugar.color; d.huella.forEach(([dx, dy, w, h]) => x.fillRect((o.x + dx) * s, (o.y + dy) * s, w * s, h * s)); }); // la huella del edificio, con su color
    const ls = lugares(m), f = Math.round(s * (opc.icono || 3.4)), dpr = opc.dpr || 1, fn = Math.round(11 * dpr * (opc.fk || 1)), puestos = [];
    x.textAlign = 'center'; x.textBaseline = 'middle';
    ls.forEach((l) => { const cx = (l.tx + 0.5) * s, cy = (l.ty + 0.5) * s, r = f * 0.62; // disco oscuro detrás para que el icono se lea sobre hierba, agua o tejado
      x.fillStyle = 'rgba(30,20,40,0.6)'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      { const im = iconoImg(l.icono), fs = Math.max(9, Math.round(f / 9) * 9); if (im) { x.imageSmoothingEnabled = false; x.drawImage(im, Math.round(cx - fs / 2), Math.round(cy - fs / 2), fs, fs); } else { x.font = f + 'px ' + FUENTE; x.fillStyle = '#fff'; x.fillText(l.icono, cx, cy + f * 0.04); } } puestos.push({ x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, l }); });
    if (opc.nombres) { // nombres en el mapa grande: debajo del icono; si chocan con otro, encima o a un lado
      x.font = '700 ' + fn + 'px ' + FUENTE; x.lineJoin = 'round'; x.lineWidth = Math.max(3, Math.round(fn / 3));
      const hay = (r) => puestos.some((p) => r.x < p.x + p.w && r.x + r.w > p.x && r.y < p.y + p.h && r.y + r.h > p.y);
      ls.forEach((l, i) => { const ic = puestos[i], w = x.measureText(l.nombre).width + 4, h = fn + 2, cx = ic.x + ic.w / 2, sep = 2 * dpr;
        const cand = [{ x: cx - w / 2, y: ic.y + ic.h + sep }, { x: cx - w / 2, y: ic.y - h - sep }, { x: ic.x + ic.w + sep, y: ic.y + ic.h / 2 - h / 2 }, { x: ic.x - w - sep, y: ic.y + ic.h / 2 - h / 2 }];
        let r = null; cand.forEach((q) => { q.x = Math.max(1, Math.min(m.W * s - w - 1, q.x)); q.y = Math.max(1, Math.min(m.H * s - h - 1, q.y)); q.w = w; q.h = h; if (!r && !hay(q)) r = q; }); r = r || cand[0];
        puestos.push({ x: r.x, y: r.y, w, h }); x.strokeStyle = '#2a1b30'; x.strokeText(l.nombre, r.x + w / 2, r.y + h / 2); x.fillStyle = '#fff9ee'; x.fillText(l.nombre, r.x + w / 2, r.y + h / 2); });
    }
    return (porMapa[clave] = c);
  }
  // Puntos de los jugadores encima del fondo ya pegado. El del móvil (me) es más grande, con anillo blanco que late; el otro, más pequeño. u = px por px CSS (dpr); grande = mapa grande.
  function puntos(x, est, m, me, s, u, reloj, grande) {
    const k = grande ? 1.5 : 1, quieto = G.capas && G.capas.REDUCIDO, orden = posiciones(est, m).sort((a, b) => (a.id === me) - (b.id === me)); // el propio al final: queda encima
    orden.forEach((p) => { const propio = p.id === me, cx = p.tx * s, cy = p.ty * s, r = (propio ? 3.4 : 2.8) * u * k;
      if (propio) { const lat = quieto ? 0 : 0.5 + 0.5 * Math.sin(reloj * 5); x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 1.2 * u; x.beginPath(); x.arc(cx, cy, r + (2 + 2 * lat) * u * k, 0, Math.PI * 2); x.stroke(); }
      x.fillStyle = JUGADOR[p.id] || '#fff'; x.strokeStyle = '#fff'; x.lineWidth = (propio ? 2 : 1.5) * u; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); x.stroke();
      if (grande) { x.font = '700 ' + Math.round(11 * u) + 'px ' + FUENTE; x.textAlign = 'center'; x.textBaseline = 'bottom'; x.lineJoin = 'round'; x.lineWidth = 3 * u; x.strokeStyle = '#2a1b30'; x.strokeText(NOMBRE[p.id] || p.id, cx, cy - r - 3 * u); x.fillStyle = JUGADOR[p.id] || '#fff'; x.fillText(NOMBRE[p.id] || p.id, cx, cy - r - 3 * u); }
    });
  }

  // Vista del mapa grande (v2.74, paso 2, 1.ª mitad): v = { z (1 a ZOOM_MAX), x, y (casilla de la esquina de arriba a la izquierda) }. Funciones puras, sin DOM.
  const ZOOM_MAX = 4;
  function limitar(v, m) { const z = Math.max(1, Math.min(ZOOM_MAX, v.z)); return { z, x: Math.max(0, Math.min(m.W - m.W / z, v.x)), y: Math.max(0, Math.min(m.H - m.H / z, v.y)) }; }
  function zoomEn(v, f, fx, fy, m) { const z2 = Math.max(1, Math.min(ZOOM_MAX, v.z * f)); return limitar({ z: z2, x: fx - (fx - v.x) * v.z / z2, y: fy - (fy - v.y) * v.z / z2 }, m); } // (fx, fy) = casilla bajo los dedos: se queda bajo ellos al acercar

  // v2.75 (paso 2, 2.ª mitad): tocar un lugar. Funciones puras, sin DOM.
  // lugarEn: el lugar más cercano al toque (tx, ty en casillas) dentro de `radio` casillas, o null. La casilla del lugar se cuenta por su centro.
  function lugarEn(ls, tx, ty, radio) { let mejor = null, dm = radio * radio; ls.forEach((l) => { const d = (l.tx + 0.5 - tx) ** 2 + (l.ty + 0.5 - ty) ** 2; if (d <= dm) { dm = d; mejor = l; } }); return mejor; }
  // borde: dónde dibujar la flecha. (px, py) = el lugar en px de la vista (w × h); m = margen. Dentro de la vista → { dentro: true }; fuera → el punto del borde (menos el margen) por donde sale la recta del centro al lugar, y el ángulo (rad, 0 = derecha, hacia abajo = π/2).
  function borde(px, py, w, h, m) {
    if (px >= m && px <= w - m && py >= m && py <= h - m) return { dentro: true, x: px, y: py };
    const cx = w / 2, cy = h / 2, dx = px - cx, dy = py - cy, ang = Math.atan2(dy, dx); if (!dx && !dy) return { dentro: true, x: px, y: py };
    const k = Math.min(dx ? (cx - m) / Math.abs(dx) : Infinity, dy ? (cy - m) / Math.abs(dy) : Infinity);
    return { dentro: false, x: cx + dx * k, y: cy + dy * k, ang };
  }
  const DIST_LLEGADA = 1.5; // a menos de 1,5 casillas de la puerta (o del punto) del lugar se da por llegado y la flecha se quita

  // Montaje en la página: el botón-minimapa (#minib con #mini) y el mapa grande (#mapa con #mapa-cv). h = { est, M(), me(), reloj(), alAbrir(), proyectar(tx, ty) → { x, y, w, h } en px CSS de la vista (o null) }. Sin esos elementos (pruebas en node) devuelve null.
  function montar(h) {
    const d = root.document; if (!d || !d.getElementById) return null;
    const btn = d.getElementById('minib'), cv = d.getElementById('mini'), pan = d.getElementById('mapa'), cg = d.getElementById('mapa-cv'), cerrar = d.getElementById('mapa-x'), tit = d.getElementById('mapa-t');
    if (!btn || !cv || !pan || !cg || !cerrar || !btn.addEventListener) return null;
    let abierto = false, mMini = null, sMini = 0, bgMini = null, sGr = 0, mGr = null, vista = { z: 1, x: 0, y: 0 };
    const info = d.getElementById('mapa-info'), quitar = d.getElementById('mapa-quitar'), fl = d.getElementById('flecha'); let destino = null, gesto = null;
    const mas = d.getElementById('mapa-mas'), menos = d.getElementById('mapa-menos'), dedos = new Map();
    const dpr = () => Math.max(1, root.devicePixelRatio || 1);
    function abrir() { if (abierto || !h.me()) return; abierto = true; vista = { z: 1, x: 0, y: 0 }; pan.hidden = false; if (h.alAbrir) h.alAbrir(); dibujar(); }
    function cerrarMapa() { if (!abierto) return; abierto = false; pan.hidden = true; }
    btn.addEventListener('click', abrir); cerrar.addEventListener('click', cerrarMapa); pan.addEventListener('click', (e) => { if (e.target === pan) cerrarMapa(); });
    root.addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; if (e.key === 'm' || e.key === 'M') { abierto ? cerrarMapa() : abrir(); e.preventDefault(); } else if (e.key === 'Escape') cerrarMapa(); });
    // gestos sobre el mapa grande: un dedo arrastra (si hay zoom), dos dedos pellizcan, la rueda del ratón y los botones ＋ / － también. El tamaño del lienzo no cambia: solo qué parte del mapa se ve.
    const tam = () => ({ s: sGr, W: mGr ? mGr.W : 1, rect: cg.getBoundingClientRect() }), cambiar = (v) => { if (mGr) vista = limitar(v, mGr); };
    const enTile = (cx, cy) => { const { s, rect } = tam(), k = cg.width / rect.width; return [vista.x + (cx - rect.left) * k / (s * vista.z), vista.y + (cy - rect.top) * k / (s * vista.z)]; };
    const distancia = () => { const q = [...dedos.values()]; return Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]) || 1; }, medio = () => { const q = [...dedos.values()]; return [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2]; };
    let dPrev = 0;
    cg.addEventListener('pointerdown', (e) => { dedos.set(e.pointerId, [e.clientX, e.clientY]); try { cg.setPointerCapture(e.pointerId); } catch (x) { /* sin captura: sigue valiendo */ } if (dedos.size === 2) dPrev = distancia(); gesto = dedos.size === 1 ? { x: e.clientX, y: e.clientY } : null; e.preventDefault(); });
    cg.addEventListener('pointermove', (e) => {
      if (!dedos.has(e.pointerId) || !mGr) return; if (gesto && Math.hypot(e.clientX - gesto.x, e.clientY - gesto.y) > 8) gesto = null; const antes = dedos.get(e.pointerId), { s, rect } = tam(), k = cg.width / rect.width; dedos.set(e.pointerId, [e.clientX, e.clientY]);
      if (dedos.size >= 2) { const dn = distancia(), [mx, my] = medio(), [fx, fy] = enTile(mx, my); if (dPrev > 0) cambiar(zoomEn(vista, dn / dPrev, fx, fy, mGr)); dPrev = dn; }
      else if (vista.z > 1) cambiar({ z: vista.z, x: vista.x - (e.clientX - antes[0]) * k / (s * vista.z), y: vista.y - (e.clientY - antes[1]) * k / (s * vista.z) });
      e.preventDefault();
    });
    cg.addEventListener('pointerup', (e) => { if (gesto && mGr && dedos.size === 1) { const [tx, ty] = enTile(e.clientX, e.clientY), k = cg.width / tam().rect.width, radio = 24 * k / (sGr * vista.z); elegir(lugarEn(lugares(mGr), tx, ty, radio)); } gesto = null; }); // un toque (sin arrastrar y con un solo dedo): elige el lugar más cercano (radio ≈ 24 px de pantalla) o, si no hay ninguno, quita la flecha
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => cg.addEventListener(ev, (e) => { dedos.delete(e.pointerId); dPrev = dedos.size === 2 ? distancia() : 0; }));
    cg.addEventListener('wheel', (e) => { if (!mGr) return; const [fx, fy] = enTile(e.clientX, e.clientY); cambiar(zoomEn(vista, e.deltaY < 0 ? 1.25 : 0.8, fx, fy, mGr)); e.preventDefault(); }, { passive: false });
    const centro = () => (mGr ? [vista.x + mGr.W / vista.z / 2, vista.y + mGr.H / vista.z / 2] : [0, 0]);
    if (mas) mas.addEventListener('click', () => { const [fx, fy] = centro(); if (mGr) cambiar(zoomEn(vista, 2, fx, fy, mGr)); });
    if (menos) menos.addEventListener('click', () => { const [fx, fy] = centro(); if (mGr) cambiar(zoomEn(vista, 0.5, fx, fy, mGr)); });
    function elegir(l) { destino = l ? { tipo: l.tipo, nombre: l.nombre, icono: l.icono, tx: l.tx, ty: l.ty, mapa: mGr.id } : null; textoInfo(); }
    function textoInfo() {
      if (!info) return; const j = h.est.jugadores[h.me()];
      if (!destino) { info.textContent = 'Toca un lugar para ver su nombre y que una flecha te guíe.'; if (quitar) quitar.hidden = true; return; }
      const n = j ? Math.round(Math.hypot(destino.tx - j.x / T + 0.5, destino.ty - j.y / T + 0.5)) : 0;
      info.textContent = ''; { const nc = ICONO_LUGAR[destino.icono]; if (nc && document.createElement) { const ii = document.createElement('i'); ii.className = 'ic i-' + nc; info.appendChild(ii); } } info.appendChild(document.createTextNode((ICONO_LUGAR[destino.icono] ? '' : destino.icono + ' ') + destino.nombre + ' · a ' + n + (n === 1 ? ' casilla' : ' casillas') + ' · cierra el mapa y sigue la flecha')); if (quitar) quitar.hidden = false;
    }
    if (quitar) quitar.addEventListener('click', () => elegir(null));
    // la flecha: un lienzo encima de la vista del juego (2D o HD-2D). Fuera de la pantalla → flecha en el borde hacia el lugar; dentro → un marcador que rebota encima del lugar.
    let flecha = false;
    function pintarFlecha(me, m, u) {
      if (!fl || !fl.getContext) return; const j = h.est.jugadores[me];
      if (destino && (destino.mapa !== m.id || !j || Math.hypot(destino.tx - j.x / T + 0.5, destino.ty - j.y / T + 0.5) < DIST_LLEGADA)) { destino = null; textoInfo(); } // otro mapa, o ya llegaste: se quita
      const g = fl.getContext('2d'), P = destino && h.proyectar ? h.proyectar(destino.tx, destino.ty) : null;
      if (!P) { if (flecha) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fl.width, fl.height); flecha = false; } return; }
      const W = Math.round(P.w * u), H = Math.round(P.h * u); if (fl.width !== W || fl.height !== H) { fl.width = W; fl.height = H; } fl.style.width = P.w + 'px'; fl.style.height = P.h + 'px';
      g.setTransform(u, 0, 0, u, 0, 0); g.clearRect(0, 0, P.w, P.h); flecha = true;
      const q = G.capas && G.capas.REDUCIDO ? 0 : Math.abs(Math.sin(h.reloj() * 4)), b = borde(P.x, P.y, P.w, P.h, 30), F = '700 12px ' + FUENTE;
      g.lineJoin = 'round'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const etiqueta = (txt, x, y) => { g.font = F; const w = g.measureText(txt).width + 12; x = Math.max(w / 2 + 2, Math.min(P.w - w / 2 - 2, x)); g.fillStyle = 'rgba(30,20,40,.82)'; g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, y - 10, w, 20, 8) : g.rect(x - w / 2, y - 10, w, 20); g.fill(); g.fillStyle = '#fff9ee'; g.fillText(txt, x, y); };
      if (b.dentro) { const y = b.y - 22 - 5 * q; g.fillStyle = '#ffd24a'; g.strokeStyle = '#2a1b30'; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x - 9, y - 9); g.lineTo(b.x + 9, y - 9); g.lineTo(b.x, y + 3); g.closePath(); g.stroke(); g.fill(); etiqueta(destino.icono + ' ' + destino.nombre, b.x, y - 24); }
      else {
        g.save(); g.translate(b.x, b.y); g.rotate(b.ang); g.fillStyle = '#ffd24a'; g.strokeStyle = '#2a1b30'; g.lineWidth = 3; g.beginPath(); g.moveTo(16 + 3 * q, 0); g.lineTo(-9, -13); g.lineTo(-4, 0); g.lineTo(-9, 13); g.closePath(); g.stroke(); g.fill(); g.restore();
        const n = Math.round(Math.hypot(destino.tx - j.x / T + 0.5, destino.ty - j.y / T + 0.5)), ex = b.x - Math.cos(b.ang) * 44, ey = b.y - Math.sin(b.ang) * 26; etiqueta(destino.icono + ' ' + destino.nombre + ' · ' + n, ex, ey);
      }
    }
    function dibujar() {
      const me = h.me(), m = h.M(), u = dpr(), interior = (m.objetos || []).some((o) => G.OBJETOS[o.tipo] && G.OBJETOS[o.tipo].interior); // v2.141: un interior se ve entero en pantalla; el minimapa solo taparía muebles (norma de diseño espacial)
      btn.hidden = !me || interior || !!m.prof; if (!me || interior || m.prof) return;   // v2.320: las cuevas tienen su propio minimapa con niebla (src/cueva2d.js)
      if (m !== mMini) { mMini = m; sMini = Math.max(2, Math.min(Math.round(MINI_ANCHO * u / m.W), Math.round(MINI_ALTO * u / m.H))); bgMini = fondo(m, sMini, { dpr: u, icono: 3.6 }); cv.width = m.W * sMini; cv.height = m.H * sMini; cv.style.width = (m.W * sMini / u) + 'px'; cv.style.height = (m.H * sMini / u) + 'px'; }
      const x = cv.getContext('2d'); x.drawImage(bgMini, 0, 0); puntos(x, h.est, m, me, sMini, u, h.reloj(), false); pintarFlecha(me, m, u);
      if (!abierto) return;
      const s = Math.max(3, Math.floor(Math.min(((root.innerWidth || 390) - 24) * u / m.W, ((root.innerHeight || 800) - 110) * u / m.H)));
      if (m !== mGr || s !== sGr) { vista = { z: 1, x: 0, y: 0 }; mGr = m; sGr = s; cg.width = m.W * s; cg.height = m.H * s; cg.style.width = (m.W * s / u) + 'px'; cg.style.height = (m.H * s / u) + 'px'; if (tit) tit.textContent = 'Mapa · ' + m.nombre; textoInfo(); }
      const g = cg.getContext('2d'); vista = limitar(vista, m);
      if (vista.z === 1) { g.drawImage(fondo(m, s, { nombres: true, dpr: u, icono: 2.4 }), 0, 0); puntos(g, h.est, m, me, s, u, h.reloj(), true); }
      else { // con zoom: se recorta del fondo dibujado a 4× (ZOOM_MAX), así los iconos y los nombres no se ven borrosos; los puntos se pintan encima con el mismo desplazamiento
        const s4 = s * ZOOM_MAX, bg4 = fondo(m, s4, { nombres: true, dpr: u, icono: 2.4, fk: 2 }) /* letra doble: se ve de 11 px con 2× y crece con el zoom */, k = s4 / vista.z; g.imageSmoothingEnabled = true; g.clearRect(0, 0, cg.width, cg.height);
        g.drawImage(bg4, vista.x * s4, vista.y * s4, cg.width * ZOOM_MAX / vista.z, cg.height * ZOOM_MAX / vista.z, 0, 0, cg.width, cg.height);
        g.save(); g.translate(-vista.x * s * vista.z, -vista.y * s * vista.z); puntos(g, h.est, m, me, s * vista.z, u, h.reloj(), true); g.restore(); }
      if (destino && destino.mapa === m.id) { const dx = (destino.tx + 0.5 - vista.x) * s * vista.z, dy = (destino.ty + 0.5 - vista.y) * s * vista.z, lat = (G.capas && G.capas.REDUCIDO) ? 0.5 : 0.5 + 0.5 * Math.sin(h.reloj() * 6); g.strokeStyle = '#ffd24a'; g.lineWidth = 2.5 * u; g.beginPath(); g.arc(dx, dy, (11 + 4 * lat) * u, 0, Math.PI * 2); g.stroke(); textoInfo(); }
      if (mas) mas.disabled = vista.z >= ZOOM_MAX; if (menos) menos.disabled = vista.z <= 1;
    }
    const vivo = { dibujar, abrir, cerrar: cerrarMapa, get abierto() { return abierto; }, get vista() { return vista; }, get destino() { return destino; }, elegir: (l) => { if (mGr || h.M()) { mGr = mGr || h.M(); elegir(l); } } }; G.minimapa.vivo = vivo; return vivo;
  }
  G.minimapa = { lugares, posiciones, fondo, puntos, limitar, zoomEn, lugarEn, borde, DIST_LLEGADA, ZOOM_MAX, montar, COLOR, JUGADOR, MINI_ANCHO, MINI_ALTO };
})(typeof window !== 'undefined' ? window : globalThis);
