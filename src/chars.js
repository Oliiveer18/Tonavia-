// sprites_a.js — pixel art generado por código: paleta, baldosas y objetos.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});

  G.makeCanvas = function (w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
    return root.__makeCanvas(w, h); // pruebas sin navegador
  };

  const P = (G.PAL = {
    ink: '#2a1b30', ink2: '#40294a',
    wood1: '#c48b52', wood2: '#b27a45', wood3: '#8f5c33', woodD: '#6b4226',
    cream: '#f7e9cb', cream2: '#ead7ae', white: '#fff9ee', grey: '#b9b4c4', grey2: '#8a8498', greyD: '#5d576b',
    red: '#d94a3f', red2: '#a8322f', pink: '#f5a8bd', pink2: '#e47a9a', orange: '#f09a3e', yellow: '#f7d54a',
    green: '#5dae5a', green2: '#3d8446', teal: '#3fb5b0', teal2: '#2a8187', blue: '#4d7fd6', blue2: '#35559a',
    purple: '#8e5bc4', purple2: '#5f3b8e', brown: '#7a4a2b', skin1: '#f2c9a0', skin2: '#d9a273', skin3: '#a96f46',
    stone1: '#8d8a99', stone2: '#797686', stone3: '#615e6f', night: '#2d2540', glow: '#7dffe7', glow2: '#ff7df0',
  });

  const rect = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  // Registro de sprites: { c: canvas, w, h, ox, oy }
  G.spr = {};
  G.sprDup = []; // ids definidos dos veces (el segundo pisaría al primero); lo vigilan test_police.js y test_anim.js
  function S(name, w, h, fn, opts) {
    opts = opts || {};
    if (G.spr[name]) G.sprDup.push(name);
    const m = opts.outline ? 1 : 0;
    const cv = G.makeCanvas(w + m * 2, h + m * 2);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(m, m);
    fn(ctx, (col, x, y, ww, hh) => rect(ctx, col, x, y, ww, hh));
    ctx.restore();
    if (m && ctx.getImageData) {
      const id = ctx.getImageData(0, 0, cv.width, cv.height);
      const d = id.data, W = cv.width, H = cv.height;
      const oc = opts.outline;
      const rgb = [parseInt(oc.slice(1, 3), 16), parseInt(oc.slice(3, 5), 16), parseInt(oc.slice(5, 7), 16)];
      const src = new Uint8ClampedArray(d);
      const op = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : src[(y * W + x) * 4 + 3]);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (src[i + 3] === 0 && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) {
            d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
          }
        }
      ctx.putImageData(id, 0, 0);
    }
    G.spr[name] = { c: cv, w: w + m * 2, h: h + m * 2, ox: m, oy: m, tw: w, th: h };
    return G.spr[name];
  }
  G.defSprite = S;
  // ---- Oli (id 'rex') y Lali (id 'luna'): pixel art a medida, COPIADO TAL CUAL de Lali & Oli Cases (sprites_b.js)
  // ============================================================================
  // LALI (id interno 'luna') y OLI (id interno 'rex'): pixel art a medida.
  // Se dibujan a partir de mapas de letras (. = transparente). Vista frontal = el arte original;
  // espalda, perfil y pasos se derivan de él. Lienzo 18x24 con el borde ya incluido.
  // ============================================================================
  const CHARS = {
    luna: { // Lali
      pal: { a: '#2a1b30', b: '#e8c46a', c: '#c99a3e', d: '#f8dfcb', e: '#2fb06a', f: '#d9788a', g: '#7fb3e0', h: '#f7e9cb', i: '#fff2a8', j: '#ffd45a', k: '#5d8fc0', l: '#35559a', m: '#f06fa0', n: '#ffffff', o: '#e9a0b8' },
      feet: 2,
      down: [
        '...aaaaaaaaaa...',
        '..abbbbccbbbba..',
        '..abbbbccbbbba..',
        '..abbbbcbbbbba..',
        '..abbddddddbba..',
        '..abbddddddbba..',
        '..abbaaddaabba..',
        '..abbeeddeebba..',
        '..abcddddddcba..',
        '..acbddffddbca..',
        '.aabcghddhgcbaa.',
        'aggcbghhhhibcgga',
        'aggbcghhhhjcbgga',
        'aggcbghhhhgbcgga',
        'aggbcghhhhgcbgga',
        'akkcbllllllbckka',
        'addmmllllllmmdda',
        '.aabbllllllbbaa.',
        '...aallllllaa...',
        '...anonnnnona...',
        '....aaaaaaaa....',
      ],
      side: [
        '..aaaaaaaa..',
        '.abbbbbbbba.',
        '.abbbccbbba.',
        '.abbbbcbbba.',
        '.abbbbbbdda.',
        '.abbbbbbdda.',
        '.abbbbbbdaa.',
        '.abbbbbbdea.',
        '.abbbbbbddda',
        '.abbbbbbdfa.',
        '.abcbggddga.',
        '.acbcggggha.',
        '.abcbgkkgha.',
        '.acbcgkkgha.',
        '.abcbgmmgha.',
        '.acbclddlla.',
        '.ammllllllla',
        '..abbllllla.',
        '...alllllla.',
        '...annnnnnoa',
        '....aaaaaaaa',
      ],
      back(rows) {
        const g = rows.map((r) => r.split(''));
        for (let y = 4; y <= 9; y++) for (let x = 5; x <= 10; x++) g[y][x] = (x + y) % 4 === 0 ? 'c' : 'b';
        for (let x = 6; x <= 9; x++) g[10][x] = 'b';
        for (let y = 11; y <= 14; y++) { for (let x = 6; x <= 10; x++) g[y][x] = 'g'; g[y][6] = 'l'; g[y][9] = 'l'; }
        return g;
      },
    },
    rex: { // Oli
      pal: { a: '#2a1b30', b: '#3d2a1e', c: '#d9453d', d: '#54392a', e: '#241c26', f: '#3a3040', g: '#f3d9c0', h: '#14101a', i: '#f2705e', j: '#6d6578', k: '#c9755a', l: '#4a3426', m: '#d9a98a', n: '#a82f2f', o: '#c9747f', p: '#f09a3e', q: '#6b3a2a', r: '#ffffff', s: '#a85a66', t: '#f7f2e6', u: '#4a9a5a', y: '#cfeaff', z: '#ffffff', w: '#5b4b7a' },
      feet: 3,
      // mitad izquierda del pelo de Oli = roja, mitad derecha = castaña (en el dibujo: rojo a la derecha de la imagen)
      down: [
        '................',
        '....aaaaaaaa....',
        '..aeeeffffeeea..',
        '..aeffeeeeeeea..',
        '.abeeeeeeeeeeca.',
        '.adbggggggggcca.',
        '.abbhhhhhhhhcia.',
        '.adhhzyhhzyhhca.',
        '.abmhyehhyehmia.',
        '.admhhhhhhhhmca.',
        '.abbgggkkgggcia.',
        '.allmggggggmnna.',
        'aooopqoooooooooa',
        'aooooqqrrooooooa',
        'aooooopqrroooooa',
        'aoooorrqqrrooooa',
        'aoossssspqsssooa',
        'aggssssssqqssgga',
        '.aaaooossopqaaa.',
        '...aooossoooa...',
        '...arrraarrra...',
        '..atutttttttua..',
        '...aaaaaaaaaa...',
      ],
      side: [
        '...aaaaaa...',
        '.aeeeffeeeea',
        '.adeeeeeeeea',
        'eaefffffffea',
        '.abeeeeeeeea',
        '.adbggggggga',
        '.abbgggghhha',
        '.adbhhhhhyha',
        '.abbmmgghhha',
        '.adbmmggggga',
        '.abbggggggka',
        '.allmgggmaa.',
        '..aoooooooa.',
        '..aopqooooa.',
        '..aoopqoooa.',
        '..aoooqqooa.',
        '..asssspqsa.',
        '..assggsssa.',
        '...aooossoa.',
        '...aooossoa.',
        '...arrrrrrra',
        '..atutttttua',
        '...aaaaaaaa.',
      ],
      back(rows, liso) {   // liso (v2.174): solo lo pide Oli 3D: las trenzas son dos mitades lisas; el 2D conserva el sombreado de siempre
        const g = rows.map((r) => r.split('').reverse()); // espejo: el rojo (izquierda de Oli) pasa a verse a la izquierda
        for (let y = 5; y <= 10; y++) for (let x = 4; x <= 11; x++) { const t = (x + y) % 3 === 0; g[y][x] = liso ? (x <= 7 ? 'c' : 'b') : x <= 7 ? (t ? 'i' : 'c') : (t ? 'd' : 'b'); }
        [[4, 7, 'w'], [4, 8, 'w'], [5, 6, 'e'], [5, 7, 'w'], [5, 8, 'w'], [5, 9, 'e'], [6, 5, 'e'], [6, 6, 'w'], [6, 9, 'w'], [6, 10, 'e'], [7, 5, 'e'], [7, 6, 'w'], [7, 9, 'w'], [7, 10, 'e'], [8, 5, 'e'], [8, 6, 'w'], [8, 9, 'w'], [8, 10, 'e'], [9, 5, 'e'], [9, 10, 'e']].forEach(([y, x, c]) => { g[y][x] = c; });   // nudo del durag y dos colas separadas que caen sobre las trenzas
        return g;
      },
      swapL: { b: 'c', c: 'b', d: 'i', i: 'd', l: 'n', n: 'l' }, // perfil mirando a la izquierda: se ve el lado rojo
    },
  };

  // levanta un pie 1 px (mitad izquierda o derecha) para animar los pasos
  function liftFeet(g, feet, from, to) {
    const H = g.length, o = g.map((r) => r.slice());
    for (let x = from; x < to; x++) {
      for (let y = H - feet; y < H; y++) o[y - 1][x] = g[y][x];
      o[H - 1][x] = '.';
    }
    return o;
  }
  function defGrid(name, g, pal, topRow) {
    const w = g[0].length, h = g.length;
    const ox = Math.floor((18 - w) / 2), oy = 24 - h;
    G.defSprite(name, 18, 24, (c) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = g[y][x];
        if (ch !== '.' && pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x + ox, y + oy, 1, 1); }
      }
    });
    const s = G.spr[name];
    s.ox = 1; s.oy = 1; s.tw = 16; s.th = 22; s.top = Math.max(0, oy - 1) + (topRow || 0);
  }
  G.defChar = function (id, C) {   // v2.324: crea los sprites de un personaje (4 vistas × 3 pasos) a partir de sus mapas de letras y su paleta
    const down = C.down.map((r) => r.split(''));
    const side = C.side.map((r) => r.split(''));
    const views = { down, up: C.back(C.down), side };
    if (C.swapL) views.sideL = side.map((r) => r.slice().reverse().map((ch) => C.swapL[ch] || ch));
    Object.keys(views).forEach((v) => {
      const g = views[v], W = g[0].length, mid = W / 2;
      // frame 0 = quieto, 1 = pie derecho arriba, 2 = pie izquierdo arriba
      defGrid(`${id}_${v}_0`, g, C.pal);
      defGrid(`${id}_${v}_1`, liftFeet(g, C.feet, mid, W), C.pal);
      defGrid(`${id}_${v}_2`, liftFeet(g, C.feet, 0, mid), C.pal);
    });
  };
  Object.keys(CHARS).forEach((id) => G.defChar(id, CHARS[id]));

  G.NAMES = { oli: 'rex', lali: 'luna' }; // nombre en este juego -> id del sprite
  G.CHARS = CHARS; // v2.115: los mapas de letras de Oli y Lali, de solo lectura (Oli 3D recorta sus texturas de aquí: src/personaje3d.js)
})(typeof window !== 'undefined' ? window : globalThis);
