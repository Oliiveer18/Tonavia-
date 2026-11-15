// creatures.js — criaturas del juego. Los DATOS (nombre, autor, elementos, rareza, frase, tamaño, peso, rasgos de movimiento) viven en UN solo sitio: src/lineas.js (G.LINEAS, paso 1.1).
// Aquí se derivan de él G.PHASES_PLAN, G.LINE_PLAN, G.TRAITS y el índice G.FORMAS, y se enlaza cada criatura con su dibujo: G.defCreature('id', { draw(c, dir, f, px) { ... } }) (los dibujos nativos usan def2 en src/formas.js).
// Para añadir una línea nueva: una entrada en src/lineas.js + sus dibujos en src/formas_<elemento>.js (ver docs/CONTINUAR.md).
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  G.CREATURES = {};
  // Elementos y rarezas (ver docs/DISENO_CRIATURAS.md). El color del elemento y el borde de rareza se usan en la placa de nombre.
  G.ELEMENTS = {
    hoja: { name: 'Hoja', color: '#5dae5a' }, fuego: { name: 'Fuego', color: '#f0603e' }, agua: { name: 'Agua', color: '#3f9bd6' },
    electrico: { name: 'Eléctrico', color: '#f7d54a' }, aire: { name: 'Aire', color: '#bfe3f5' }, roca: { name: 'Roca', color: '#8a7f72' }, sombra: { name: 'Sombra', color: '#7a4cb0' },
  };
  G.RARITIES = { comun: { name: 'Común', color: '#b9b4c4' }, rara: { name: 'Rara', color: '#4d9bf0' }, epica: { name: 'Épica', color: '#b06be8' }, legendaria: { name: 'Legendaria', color: '#f7d54a' } };
  // Caché de sprites (v2.9, paso 1.5): como mucho G.SPRITE_LIMIT sprites a la vez (300 ≈ 0,7 MB de píxeles); al pasarse se descarta el MENOS USADO (LRU, Map: el primero es el más antiguo).
  // Un sprite descartado se vuelve a dibujar idéntico cuando se pide (el dibujo es determinista); quien ya tiene el objeto en la mano puede seguir usándolo. No se precalienta nada: solo se dibuja lo que se pide.
  const cache = new Map(), stats = { hits: 0, misses: 0, evictions: 0, peak: 0 };
  G.SPRITE_LIMIT = 300;
  const guardar = (key, s) => { cache.set(key, s); while (cache.size > Math.max(1, G.SPRITE_LIMIT)) { cache.delete(cache.keys().next().value); stats.evictions++; } if (cache.size > stats.peak) stats.peak = cache.size; return s; };
  G.spriteStats = () => { let bytes = 0; cache.forEach((s) => { bytes += s.w * s.h * 4; }); return { size: cache.size, limit: G.SPRITE_LIMIT, bytes, hits: stats.hits, misses: stats.misses, evictions: stats.evictions, peak: stats.peak }; };
  G.spriteCacheClear = () => { cache.clear(); stats.hits = stats.misses = stats.evictions = stats.peak = 0; }; // para pruebas y mediciones
  const SIZE = 16, M = 1; // lienzo 16x16 + 1 px de contorno por lado

  // ── Datos de juego (v0.8, paso 2). Solo datos: todavía no hay combate ni evolución en pantalla. ──
  // Ventajas entre elementos (propuesta de Claude): cada elemento gana a 2, pierde contra 2 y es neutral con los otros 2.
  const STRONG = { fuego: ['hoja', 'aire'], agua: ['fuego', 'roca'], hoja: ['agua', 'sombra'], electrico: ['agua', 'aire'], aire: ['hoja', 'sombra'], roca: ['fuego', 'electrico'], sombra: ['electrico', 'roca'] };
  Object.keys(STRONG).forEach((e) => { G.ELEMENTS[e].strong = STRONG[e]; G.ELEMENTS[e].weak = Object.keys(STRONG).filter((o) => STRONG[o].includes(e)); });
  G.elementEffect = (attack, defense) => (STRONG[attack] && STRONG[attack].includes(defense) ? 2 : STRONG[defense] && STRONG[defense].includes(attack) ? 0.5 : 1); // x2 ventaja, x0,5 debilidad, x1 neutral
  G.LEGENDARY_SIZE = [30, 30]; // única fase de las legendarias

  // ── Registro único (v2.6, paso 1.1): TODO se deriva de G.LINEAS (src/lineas.js); aquí no se escribe ningún dato a mano. ──
  // Comprobación del registro: devuelve la lista de problemas (vacía si está bien). Se ejecuta al cargar (si falla, el juego no arranca) y la repite test.js.
  const isNum = (v) => typeof v === 'number' && isFinite(v), isPair = (v) => Array.isArray(v) && v.length === 2 && v.every(isNum), isText = (v) => typeof v === 'string' && v.trim() !== '';
  G.validarLineas = function (lineas) {
    const err = [], ns = {}, fams = {}, ids = {};
    if (!Array.isArray(lineas) || !lineas.length) return ['G.LINEAS no es una lista con líneas'];
    lineas.forEach((L, i) => {
      const w = 'línea ' + (L && L.n !== undefined ? L.n : '#' + (i + 1)) + (L && L.fam ? ' (' + L.fam + ')' : ''), bad = (m) => err.push(w + ': ' + m);
      if (!L || typeof L !== 'object') return bad('no es un objeto');
      if (!Number.isInteger(L.n) || L.n < 1) bad('n (Nº de línea) debe ser un entero ≥ 1'); else if (ns[L.n]) bad('Nº repetido'); else ns[L.n] = 1;
      if (!isText(L.fam)) bad('falta fam'); else if (fams[L.fam]) bad('fam repetida'); else fams[L.fam] = 1;
      ['raiz', 'idea', 'by', 'lote', 'hecha'].forEach((k) => { if (!isText(L[k])) bad('falta ' + k); });
      if (!Array.isArray(L.elements) || !L.elements.length || !L.elements.every((e) => G.ELEMENTS[e])) bad('elements vacío o con un elemento desconocido');
      if (!G.RARITIES[L.rarity]) bad('rarity desconocida: ' + L.rarity);
      if (!Number.isInteger(L.hito) || L.hito < 0) bad('hito debe ser un entero ≥ 0');
      if (!Array.isArray(L.formas) || !L.formas.length || L.formas.length > 3) return bad('formas debe tener de 1 a 3 fases');
      if (L.formas[0].id !== L.fam) bad('la fase 1 debe tener como id el de fam');
      if (L.rarity === 'legendaria' && L.formas.length !== 1) bad('una legendaria tiene una sola fase');
      L.formas.forEach((f, k) => {
        const fw = w + ' fase ' + (k + 1), fb = (m) => err.push(fw + ': ' + m);
        if (!isText(f.id)) return fb('falta id'); if (ids[f.id]) fb('id repetido: ' + f.id); else ids[f.id] = 1;
        if (!isText(f.name)) fb('falta name'); else if (isText(L.raiz) && f.name.toLowerCase().indexOf(L.raiz.toLowerCase()) !== 0) fb('el nombre ' + f.name + ' no empieza por la raíz ' + L.raiz);
        if (!isText(f.line)) fb('falta line (frase)');
        if (f.by !== undefined && !isText(f.by)) fb('by vacío');
        if (!isPair(f.size) || f.size.some((v) => !Number.isInteger(v) || v < 2 || v % 2)) fb('size debe ser [ancho, alto] con enteros pares');
        else if (L.rarity === 'legendaria' && (f.size[0] !== G.LEGENDARY_SIZE[0] || f.size[1] !== G.LEGENDARY_SIZE[1])) fb('una legendaria mide ' + G.LEGENDARY_SIZE.join('×'));
        if (!isNum(f.kg) || !(f.kg > 0)) fb('kg debe ser un número mayor que 0');
        const t = f.traits;
        if (!t || typeof t !== 'object') return fb('faltan traits');
        if (t.size !== undefined) fb('traits no lleva size (sale de size)');
        if (!Array.isArray(t.shadow) || t.shadow.length !== 3 || !t.shadow.every(isNum)) fb('traits.shadow debe ser [ancho, alto, separación]');
        if (!isNum(t.speed) || !(t.speed > 0)) fb('traits.speed debe ser > 0');
        if (!isPair(t.wait) || t.wait[0] > t.wait[1]) fb('traits.wait debe ser [mín, máx]');
        ['hop', 'float', 'sway'].forEach((k2) => { if (t[k2] !== undefined && !isPair(t[k2])) fb('traits.' + k2 + ' debe ser [px, ritmo]'); });
        ['nod', 'flick'].forEach((k2) => { if (t[k2] !== undefined && !isNum(t[k2])) fb('traits.' + k2 + ' debe ser un número'); });
        if (t.eye !== undefined && t.eye !== true) fb('traits.eye solo puede ser true');
      });
    });
    return err;
  };
  { const problemas = G.validarLineas(G.LINEAS); if (problemas.length) throw new Error('src/lineas.js tiene errores:\n' + problemas.join('\n')); }
  const clone = (v) => JSON.parse(JSON.stringify(v));
  G.PHASES_PLAN = {}; G.LINE_PLAN = {}; G.TRAITS = {}; G.FORMAS = {}; // G.FORMAS[id] = { linea, forma, stage }: índice de formas para G.defCreature
  G.LINEAS.forEach((L) => {
    G.PHASES_PLAN[L.fam] = L.formas.length; // fases previstas en total (la rareza marca el rango: Común 1-2, Rara 2-3, Épica 3, Legendaria 1)
    G.LINE_PLAN[L.fam] = L.formas.map((f) => [f.size[0], f.size[1], f.kg]); // tamaño [ancho, alto] y peso (kg) de cada fase; el orden es fase 1, 2, 3
    L.formas.forEach((f, i) => {
      G.TRAITS[f.id] = Object.assign({ size: f.size.slice() }, clone(f.traits)); // rasgos de movimiento de cada forma (ver la leyenda en src/lineas.js)
      G.FORMAS[f.id] = { linea: L, forma: f, stage: i + 1, evolvesTo: i + 1 < L.formas.length ? L.formas[i + 1].id : null };
    });
  });
  // Orden de G.CREATURES (v2.7, paso 1.2): el del registro (por Nº de línea y fase), no el de carga de los archivos de dibujo. Se reservan las claves en ese orden y cada def2 rellena la suya.
  // Mandan en la galería (G.lineList) y en los tests. Una forma que se quede sin dibujo se detecta con G.formasSinDibujo().
  Object.keys(G.FORMAS).forEach((id) => { G.CREATURES[id] = undefined; });
  G.formasSinDibujo = () => Object.keys(G.CREATURES).filter((id) => !G.CREATURES[id]);
  G.stageSize = (id, stage) => { const d = G.CREATURES[id] || {}, r = d.rarity, p = (G.LINE_PLAN[d.family || id] || [])[(stage || 1) - 1]; if (r === 'legendaria') return G.LEGENDARY_SIZE; return p ? [p[0], p[1]] : G.traits(d.family || id).size; };
  G.stageWeight = (id, stage) => { const d = G.CREATURES[id] || {}, p = (G.LINE_PLAN[d.family || id] || [])[(stage || d.stage || 1) - 1]; return p ? p[2] : null; };
  // Une los datos del registro (src/lineas.js) con el dibujo: def solo trae lo que NO es dato (draw y native).
  G.defCreature = function (id, def) {
    if (G.CREATURES[id]) throw new Error('criatura repetida: ' + id);
    const r = G.FORMAS[id]; if (!r) throw new Error('criatura sin entrada en src/lineas.js: ' + id);
    const L = r.linea, f = r.forma;
    const data = { name: f.name, by: f.by || L.by, elements: L.elements.slice(), rarity: L.rarity, line: f.line, family: L.fam, stage: r.stage, evolvesTo: r.evolvesTo, phases: L.formas.length, weight: f.kg };
    G.CREATURES[id] = Object.assign(def, data);
  };

  // dir: down | up | left | right · f: 0 quieto/paso A, 1 paso B (la criatura sube 1 px)
  // Rasgos propios de cada criatura (v0.6): tamaño del sprite [ancho, alto], sombra [ancho, alto, separación del suelo], velocidad de paseo, pausas [mín, máx] y estilo de movimiento.
  // hop = salta al andar (alto en px, ritmo) · float = flota siempre (altura, ritmo) · nod = cabecea al dormitar (ritmo)
  // sway = se contonea al andar (px a cada lado, ritmo) · flick = mueve la cola al estar parada (ritmo; usa el frame 2 del sprite)
  // eye = true: mientras le hablas (c.talk > 0) se dibuja el frame 3 del sprite (Somnaris abre un ojo)
  // G.TRAITS se deriva de G.LINEAS (arriba); la leyenda de cada rasgo está en la cabecera de src/lineas.js.
  const DEFAULT_TRAITS = { size: [16, 16], shadow: [10, 3, 0], speed: 18, wait: [0.8, 2.8] };
  G.traits = (id) => G.TRAITS[id] || DEFAULT_TRAITS;

  function outline(cv, c, id) { // contorno oscuro de 1 px alrededor de la silueta
    if (!c.getImageData) return;
    const id2 = c.getImageData(0, 0, cv.width, cv.height), d = id2.data, W = cv.width, H = cv.height, src = new Uint8ClampedArray(d);
    const op = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : src[(y * W + x) * 4 + 3]);
    const rgb = [0x2a, 0x1b, 0x30];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (src[i + 3] === 0 && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; }
    }
    c.putImageData(id2, 0, 0);
    if (G.sombrearSprite) G.sombrearSprite(cv, id); // v2.21: contorno selectivo + luz y sombra (src/sombreado.js); con G.SOMBREADO.ACTIVO = false no hace nada
  }

  // Recorta el lienzo con holgura al cuadro estándar (cw×ch, a PAD de cada borde) ampliado solo lo que haga falta para que quepa todo lo opaco (contorno incluido).
  // Arriba y abajo se amplía lo que sobre; a los lados se amplía lo MISMO por los dos (el sprite se dibuja centrado: -w/2). Si no sobra nada, el resultado es el cuadro estándar de siempre.
  function recortar(big, bg, PAD, cw, ch) {
    const W = big.width, H = big.height, d = bg.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const e = Math.max(0, PAD - x0, x1 + 1 - (PAD + cw)), top = Math.max(0, PAD - y0), bot = Math.max(0, y1 + 1 - (PAD + ch));
    const sx = PAD - e, sy = PAD - top, w = cw + e * 2, h = ch + top + bot;
    const cv = G.makeCanvas(w, h), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    c.putImageData(bg.getImageData(sx, sy, w, h), 0, 0);
    return { c: cv, w, h };
  }

  // dir: down | up | left | right · f: 0 quieto/paso A, 1 paso B (la criatura sube 1 px)
  G.creatureSprite = function (id, dir, f) {
    const key = (G.__plano ? 'p:' : '') + id + '_' + dir + '_' + f; // v2.112: 'p:' = dibujo plano del 2D clásico (src/clasico2d.js); sin él la clave es la de siempre
    const hit = cache.get(key); if (hit) { stats.hits++; cache.delete(key); cache.set(key, hit); return hit; } // acierto: pasa a ser el más reciente
    stats.misses++;
    const def = G.CREATURES[id], [tw, th] = G.traits(id).size;
    const base = G.makeCanvas(SIZE + M * 2, SIZE + M * 2), bc = base.getContext('2d');
    bc.imageSmoothingEnabled = false; bc.save(); bc.translate(M, M);
    if (!def.native) def.draw(bc, dir, f, (col, x, y, w, h) => { bc.fillStyle = col; bc.fillRect(x, y, w || 1, h || 1); });
    bc.restore();
    let cv = base, c = bc;
    if (def.native) { // dibujo hecho directamente en su tamaño (src/formas.js)
      // v2.27.1 (contorno completo): se dibuja en un lienzo con HOLGURA (PAD px extra por lado), se aplica el contorno y se recorta. Así, si un frame se sale del cuadro estándar
      // (p. ej. el frame 1 «sube 1 px» y su borde superior caería fuera), el contorno se dibuja igual en vez de perderse. Si el frame cabe, el recorte es el cuadro estándar y el sprite queda idéntico.
      const PAD = 2, bw = tw + M * 2 + PAD * 2, bh = th + M * 2 + PAD * 2, big = G.makeCanvas(bw, bh), bg = big.getContext('2d');
      bg.imageSmoothingEnabled = false; bg.save(); bg.translate(M + PAD, M + PAD);
      def.draw(bg, dir, f, (col, x, y, w, h) => { bg.fillStyle = col; bg.fillRect(x, y, w || 1, h || 1); }, tw, th); bg.restore(); outline(big, bg, id);
      return guardar(key, recortar(big, bg, PAD, tw + M * 2, th + M * 2));
    }
    if ((tw !== SIZE || th !== SIZE) && bc.getImageData && bc.createImageData) { // otro tamaño: se remuestrea el dibujo de 16x16 sin suavizar (pixel art)
      cv = G.makeCanvas(tw + M * 2, th + M * 2); c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      const lz = G.SOMBREADO && G.SOMBREADO.ACTIVO && G.SOMBREADO.VOLUMEN && G.LUZ_CRIATURAS ? G.LUZ_CRIATURAS[id] : null, colmap = lz && lz.columnas && lz.columnas.length === tw && (dir === 'down' || dir === 'up') ? lz.columnas : null; // v2.23: estirado simétrico (de frente y de espaldas) para que los ojos salgan iguales
      const s = (bc.getImageData(M, M, SIZE, SIZE) || {}).data, o = c.createImageData && c.createImageData(tw + M * 2, th + M * 2);
      if (!s || !o) return guardar(key, { c: cv, w: cv.width, h: cv.height }); // entorno de pruebas sin lienzo real
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
        const sx = colmap ? colmap[x] : Math.min(SIZE - 1, Math.floor((x + 0.5) * SIZE / tw)), sy = Math.min(SIZE - 1, Math.floor((y + 0.5) * SIZE / th));
        const si = (sy * SIZE + sx) * 4, oi = ((y + M) * (tw + M * 2) + x + M) * 4;
        o.data[oi] = s[si]; o.data[oi + 1] = s[si + 1]; o.data[oi + 2] = s[si + 2]; o.data[oi + 3] = s[si + 3];
      }
      c.putImageData(o, 0, 0);
    }
    outline(cv, c, id);
    return guardar(key, { c: cv, w: cv.width, h: cv.height });
  };

  // (v2.7, paso 1.2) Los dibujos de las criaturas ya no están aquí: viven en src/formas_<elemento>.js. Aquí quedan los datos derivados, el validador y G.creatureSprite.
})();
