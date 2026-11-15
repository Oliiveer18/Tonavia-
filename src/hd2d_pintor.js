// hd2d_pintor.js — PINTOR HD-2D del juego (v2.64: HD-B1 2.ª mitad, HD-B2, HD-B3 y HD-C2). Es el segundo «pintor» del contrato de docs/ARQUITECTURA_2D_HD2D.md: lee el mundo (mapa y estado del motor) y G.vista, y lo dibuja con Three.js.
// NO decide posiciones, colisiones, azar ni evoluciones (eso es de src/motor.js) y no cambia el 2D: game.js solo le pasa un «host» (qué mapa, qué jugadores y criaturas, cómo se hornea el suelo) y le pide dibujar cada cuadro.
// Three.js (r128, ≈600 KB) NO viaja en el juego: se pide a cdnjs solo al elegir HD-2D (activar). Si no carga, no hay WebGL o va lento (vigilante), game.js vuelve al 2D y el 2D sigue donde estaba.
// Tres partes: (1) lo PURO (relieve, plan de objetos, vigilante de velocidad, elección guardada): sin Three ni DOM, se prueba en node; (2) la construcción de la escena de un mapa; (3) el cuadro: entidades, cámara, suelo animado, nombres.
// v2.70 (paso B2b de docs/FICHAS_EDIFICIOS_3D.md): las piezas del catálogo con `vol` y estilo de textura (hoy la casa: Casa de Lali, Casa de Oli y Laboratorio) se dibujan como VOLUMEN real (G.volumenes + G.volTex: muros, tejado, chimenea, veleta, un atlas de 256 px y una sombra suave en el suelo) en vez de como lámina; el resto de piezas sigue como lámina. Interruptor: G.hd2d.AJUSTES.VOLUMENES.
// Medidas: 1 casilla = 1 unidad del mundo = 16 px del dibujo. x, z = casillas (x a la derecha, z hacia el sur), y = altura.
(function (root) {
  'use strict';
  const G = root.G, T = 16;
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', ESPERA_MS = 12000, CLAVE = 'criaturas.graficos.v1';
  const ALT = { '~': -0.3, t: 0 },   // v2.199: el bosque 't' ya NO es un bloque más alto (a petición del usuario): el árbol (tronco y copa) se apoya en el suelo a nivel
    BAJO = -1.2, PITCH = 0.98, ZOOMS = [['cerca', 20], ['media', 30], ['lejos', 44]];
  const TIERRA = [0x8a / 255, 0x6a / 255, 0x4a / 255], BOSQUE = [0x3f / 255, 0x5f / 255, 0x38 / 255], MADERA = [0xa8 / 255, 0x79 / 255, 0x3e / 255], BLANCO = [1, 1, 1], TINTE = [0xa9 / 255, 0xc2 / 255, 0xa0 / 255];

  // ───────────── 1 · PURO (sin Three ni DOM) ─────────────
  // altura del suelo de una casilla (null fuera del mapa): agua más baja (arroyo), bosque de borde «t» más alto, el resto a nivel; el puente «b» queda a nivel sobre el agua
  const alt = (m, x, z) => (x < 0 || z < 0 || x >= m.W || z >= m.H ? null : (ALT[m.suelo[z][x]] ?? 0));
  const altEn = (m, px, py) => { const a = alt(m, Math.floor(px / T), Math.floor(py / T)); return a === null ? 0 : a; }; // altura bajo un punto del mundo en píxeles del juego
  const AJUSTES = { VOLUMENES: true, OCLUSION: true, OCLUSION_ARBOLES: false, VIS_TAPADO: 0.3, SEGUNDOS: 0.5, PARTICULAS: true, PERSONAJES3D: true, PERSONAJES3D_LALI: true, CRIATURAS3D: false, CRIATURAS_GLB: true, OBJETOS3D: true, AGUA3D: true }; // VOLUMENES false = todos los edificios como láminas del 2D (como en la v2.64-v2.68); sirve para comparar y como salida de emergencia · OCLUSION (v2.88, paso E1) false = el tejado nunca se atenúa · VIS_TAPADO = cuánto se ve el tejado cuando tapa a alguien (0-1) · SEGUNDOS = lo que tarda la transición · PARTICULAS (v2.93, F3) false = sin humo, gotas, destellos ni hojas en el HD-2D
  const conVolumen = (d) => !!(AJUSTES.VOLUMENES && d && d.vol && G.volTex && G.volTex.soporta(d.vol));

  // v2.88 (paso E1): trama de Bayer 4×4 para atenuar el tejado y el tercio alto de los muros cuando tapan a alguien. `vis` 1 = se ve entero, 0 = invisible; la trama descarta píxeles (sin transparencia, así no hay problemas de orden de dibujo).
  const GLSL_TRAMA = 'if (uVis < 0.999 && vAltura > uCorte) { vec2 pb = mod(floor(gl_FragCoord.xy / uBloque), 4.0); float bx0 = mod(pb.x, 2.0); float bx1 = floor(pb.x / 2.0); float by0 = mod(pb.y, 2.0); float by1 = floor(pb.y / 2.0); float um = (8.0 * abs(bx0 - by0) + 4.0 * by0 + 2.0 * abs(bx1 - by1) + by1 + 0.5) / 16.0; if (um >= uVis) discard; }';
  // acerca `vis` a `meta` a razón de 1/segundos por segundo (transición lineal); puro
  const acercar = (vis, meta, dt, segundos) => { const paso = Math.max(0, dt) / Math.max(0.01, segundos); return vis < meta ? Math.min(meta, vis + paso) : Math.max(meta, vis - paso); };
  // ¿queda tapado algún punto (x, z en casillas; y = suelo) por la estructura de este edificio, visto desde la cámara cam [x, y, z]? Mira los pies y la cabeza.
  const tapado = (ed, cam, puntos) => puntos.some((q) => [0.3, 1.1].some((h) => G.volumenes.tapa(ed.geo, ed.x, ed.z, ed.y, cam, [q.x, q.y + h, q.z])));
  const FLAT = new Set(['nenufar', 'nenufar_flor', 'valla_v']); // dibujos «vistos desde arriba»: se tumban sobre el suelo
  const FIJO = new Set(['valla_ni', 'valla_nd', 'valla_9']);    // vallas de lado: láminas fijas mirando al sur (no giran con la cámara)
  // Qué hay que poner en 3D además del suelo: los árboles de las casillas «t» y los objetos normales del mapa. Los de capa «bajo» (puente, huerto) ya van en el suelo horneado.
  // modo: 'volumen' (v2.70: edificio con `vol`; x, z = casilla de la pieza en el mapa), 'cartel' (lámina vertical que mira a la cámara: edificios sin volumen, farolas, bancos…), 'fijo' (lámina vertical mirando al sur), 'plano' (tumbada sobre el suelo).
  function plan(m) {
    const arboles = [], objetos = [];
    for (let z = 0; z < m.H; z++) for (let x = 0; x < m.W; x++) if (m.suelo[z][x] === 't') arboles.push([x, z]);
    m.objetos.forEach((o) => {
      const d = G.OBJETOS[o.tipo]; if (!d || (d.capa === 'bajo' && !(AJUSTES.OBJETOS3D && G.objeto3d && G.objeto3d.de(o.tipo)))) return;   // v2.252: huerto y puente con modelo 3D se ponen encima del suelo horneado
      if (G.arboles3d && G.arboles3d.TIPOS[o.tipo]) { arboles.push([o.x, o.y, o.tipo]); return; }   // v2.198: los árboles del catálogo (arbol_pequeno, arbol_mediano, abeto, roble_hito) van en la malla de árboles 3D
      const izq = o.x * T + d.ox, arr = o.y * T + d.oy, modo = (AJUSTES.OBJETOS3D && G.objeto3d && G.objeto3d.de(o.tipo)) ? 'modelo' : FLAT.has(o.tipo) ? 'plano' : FIJO.has(o.tipo) ? 'fijo' : conVolumen(d) ? 'volumen' : 'cartel';
      const cx = (izq + d.w / 2) / T, cz = (modo === 'plano' ? arr + d.h / 2 : arr + d.h) / T; // cartel y fijo: los pies del dibujo son su borde de abajo; plano: su centro
      objetos.push({ tipo: o.tipo, modo, x: o.x, z: o.y, cx, cz, ancho: d.w / T, alto: d.h / T, y: alt(m, Math.floor(cx), Math.floor(modo === 'plano' ? cz : cz - 0.01)) ?? 0 });
    });
    return { arboles, objetos };
  }
  // vigilante de velocidad: dado el tiempo de los últimos cuadros (ms), ¿va demasiado lento para jugar? (más de la mitad de los cuadros por encima de 55 ms ≈ menos de 18 por segundo). Los cuadros de más de 600 ms (pestaña en segundo plano) no cuentan.
  const lento = (dts) => { const v = dts.filter((d) => d <= 600); return v.length >= 60 && v.filter((d) => d > 55).length > v.length * 0.5; };
  const ls = () => { try { return root.localStorage || null; } catch (e) { return null; } };
  const elegido = () => { try { const l = ls(); return l ? l.getItem(CLAVE) : null; } catch (e) { return null; } }; // '2d' | 'hd' | null (nunca elegido)
  const recordar = (v) => { try { const l = ls(); if (l) l.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento: no se recuerda y ya */ } };

  // ───────────── 2 · CARGA DE THREE.JS ─────────────
  let promesa = null;
  function cargarThree() { // true si THREE está disponible; pide el archivo una sola vez y a los 12 s se rinde
    if (root.THREE) return Promise.resolve(true);
    if (promesa) return promesa;
    promesa = new Promise((ok) => {
      let s; const fin = (v) => { clearTimeout(t); if (!v) { promesa = null; try { s && s.remove && s.remove(); } catch (e) { /* nada */ } } ok(v); };
      const t = setTimeout(() => fin(false), ESPERA_MS);
      try { s = document.createElement('script'); s.src = CDN; s.async = true; s.onload = () => fin(!!root.THREE); s.onerror = () => fin(false); document.head.appendChild(s); } catch (e) { fin(false); }
    });
    return promesa;
  }

  // ───────────── 3 · ESCENA DE UN MAPA ─────────────
  let E = null; // estado del pintor mientras está activo (null = apagado)
  const buf = () => ({ p: [], n: [], u: [], c: [], i: [] });
  function quad(b, P, N, U, C, inv) { const o = b.p.length / 3; P.forEach((v) => b.p.push(v[0], v[1], v[2])); for (let k = 0; k < 4; k++) { b.n.push(N[0], N[1], N[2]); if (U) b.u.push(U[k][0], U[k][1]); b.c.push(C[0], C[1], C[2]); } b.i.push(...(inv ? [o, o + 2, o + 1, o, o + 3, o + 2] : [o, o + 1, o + 2, o, o + 2, o + 3])); } // inv: las caras de arriba miran hacia +Y
  function geo(b, uv) { const Th = root.THREE, g = new Th.BufferGeometry(); g.setAttribute('position', new Th.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new Th.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new Th.Float32BufferAttribute(b.c, 3)); if (uv) g.setAttribute('uv', new Th.Float32BufferAttribute(b.u, 2)); g.setIndex(b.i); return g; }
  function lienzo(w, h) { const c = G.makeCanvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
  function pixelart(canvas) { const Th = root.THREE, t = new Th.CanvasTexture(canvas); t.magFilter = Th.NearestFilter; t.minFilter = Th.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; }

  function limpiar() { // quita de la escena y libera lo de un mapa
    if (!E) return;
    E.fijos.forEach((o) => { E.scene.remove(o); if (o.geometry && !o.geometry.__compartida) o.geometry.dispose(); if (o.material && !o.material.__compartida) o.material.dispose(); });
    E.fijos = []; E.edificios = []; E.texObj.forEach((t) => t.dispose()); E.texObj.clear(); ['suelo', 'arboles', 'aguaTex'].forEach((k) => { if (E[k]) { E[k].dispose(); E[k] = null; } }); E.agua = null;
  }
  function construir(M) {
    const Th = root.THREE, host = E.host; limpiar(); E.M = M; E.n = -1;
    const W = M.W, H = M.H, real = host.fondo(M), Mhd = Object.assign({}, M, { id: M.id + '·hd', suelo: M.suelo.map((r) => r.replace(/t/g, '.')) }), base = host.fondo(Mhd); // suelo real del 2D y el mismo con hierba donde hay bosque (los árboles son láminas aparte)
    E.mod3d = {}; const pl = plan(M), st = E.st = { arriba: 0, agua: 0, bosque: 0, puente: 0, paredes: 0, arboles: pl.arboles.length, objetos: pl.objetos.length };
    // 1 · suelo con relieve: caras de arriba (con la textura del 2D) y paredes donde un vecino es más bajo
    const tops = buf(), walls = buf(), VOL = !!(AJUSTES.AGUA3D && G.agua3d && G.agua3d.ESTILO === 'volumen');
    if (G.agua3d) G.agua3d.RIO_VOLUMEN = VOL;   // lo lee el pintor de partículas: con el río en volumen no hay destellos en cruz
    const cota = (x, z) => { if (VOL && M.suelo[z] && M.suelo[z][x] === '~') return ALT['~'] - 0.28; return alt(M, x, z); };   // v2.172: con el agua en volumen, la casilla '~' es el LECHO del río (plano, sin escalones: no sale la línea oscura) y el agua es una superficie aparte
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const c = M.suelo[z][x], h = cota(x, z), u0 = x / W, u1 = (x + 1) / W, v0 = 1 - z / H, v1 = 1 - (z + 1) / H;
      if (VOL && c === '~') { const q = (x * 7 + z * 13) % 3, k = 0.96 + 0.04 * q; quad(walls, [[x, h, z], [x + 1, h, z], [x + 1, h, z + 1], [x, h, z + 1]], [0, 1, 0], null, [0.80 * k, 0.69 * k, 0.50 * k], true); }   // lecho de arena, un poco más oscuro con la profundidad
      else quad(tops, [[x, h, z], [x + 1, h, z], [x + 1, h, z + 1], [x, h, z + 1]], [0, 1, 0], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], c === 't' ? TINTE : BLANCO, true);
      st.arriba++; if (c === '~') st.agua++; if (c === 't') st.bosque++; if (c === 'b') st.puente++;
      [[0, -1, [[x + 1, z], [x, z]], [0, 0, -1]], [1, 0, [[x + 1, z + 1], [x + 1, z]], [1, 0, 0]], [0, 1, [[x, z + 1], [x + 1, z + 1]], [0, 0, 1]], [-1, 0, [[x, z], [x, z + 1]], [-1, 0, 0]]].forEach(([dx, dz, e, n]) => {
        let hn = (x + dx < 0 || z + dz < 0 || x + dx >= W || z + dz >= H) ? null : cota(x + dx, z + dz); if (hn === null) hn = BAJO; if (h <= hn + 0.001) return;
        quad(walls, [[e[0][0], hn, e[0][1]], [e[1][0], hn, e[1][1]], [e[1][0], h, e[1][1]], [e[0][0], h, e[0][1]]], n, null, c === 't' ? BOSQUE : c === 'b' ? MADERA : TIERRA); st.paredes++;
      });
    }
    // suelo animado: se parte del horneado y, cuando cambia el cuadro del reloj visual (4 por segundo), se vuelven a pintar ENCIMA las matas, flores, olas y la luz de región con el mismo código del 2D (G.capas)
    const [anim, actx] = lienzo(W * T, H * T); E.base = base; E.anim = anim; E.actx = actx; E.sueloTex = pixelart(anim); E.suelo = E.sueloTex;
    const mSuelo = new Th.MeshLambertMaterial({ map: E.sueloTex, vertexColors: true }), mPared = new Th.MeshLambertMaterial({ vertexColors: true });
    [new Th.Mesh(geo(tops, true), mSuelo), new Th.Mesh(geo(walls, false), mPared)].forEach((o) => { E.scene.add(o); E.fijos.push(o); });
    // 1b · AGUA 3D (v2.171): superficie propia sobre las casillas '~' (un solo plano de quads, una malla), con 3 zonas de profundidad y olas por el reloj visual (src/agua3d.js). Si falla, se vuelve al agua del suelo.
    E.agua = null; E.aguaReal = null; E.rio = null;
    if (AJUSTES.AGUA3D && G.agua3d && (G.agua3d.ESTILO === 'real3d' || VOL)) { try {   // EXPERIMENTAL: superficie con olas de verdad (vértices animados, normales exactas y brillo especular del sol)
      const prep = G.agua3d.preparar(M.suelo, T), N = 4, nt = prep.tiles.length, pos = new Float32Array(nt * (N + 1) * (N + 1) * 3), nor = new Float32Array(pos.length), col = new Float32Array(pos.length), idx = [], D = G.agua3d.distancias(M.suelo).d;
      prep.tiles.forEach(([x, z], ti) => { const o = ti * (N + 1) * (N + 1);
        for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const k = (o + j * (N + 1) + i) * 3, wx = x + i / N, wz = z + j / N; pos[k] = wx; pos[k + 2] = wz; pos[k + 1] = (VOL ? ALT['~'] : alt(M, x, z)) + 0.01; }
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = o + j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); } });
      const g = new Th.BufferGeometry(), aP = new Th.BufferAttribute(pos, 3), aN = new Th.BufferAttribute(nor, 3), aC = new Th.BufferAttribute(col, 3);
      g.setAttribute('position', aP); g.setAttribute('normal', aN); g.setAttribute('color', aC); g.setIndex(idx);
      let tex = null, extra = {};
      if (VOL) {   // v2.172: relieve ondulado HD — mapa de normales y de luz procedurales, teselables y animados (se desplazan lento): la luz y los brillos ondulan sobre toda la superficie
        const S = 128, [cv, cx] = lienzo(S, S), [cn, cnx] = lienzo(S, S), h = new Float32Array(S * S), im = cx.createImageData(S, S), inn = cnx.createImageData(S, S), TP = Math.PI * 2;
        const ON = [[3, 1, 0.0, 1], [1, 3, 1.3, 1], [4, 2, 2.1, 0.8], [2, 5, 0.7, 0.7], [5, 3, 4.0, 0.6], [6, 1, 2.6, 0.5], [2, 7, 5.1, 0.4], [7, 4, 3.3, 0.3]];
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let v = 0; ON.forEach(([a, b, f, w]) => { v += w * Math.sin(TP * (a * x + b * y) / S + f); }); h[y * S + x] = v / 4; }
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          const i = (y * S + x) * 4, hx = h[y * S + (x + 1) % S] - h[y * S + (x + S - 1) % S], hy = h[((y + 1) % S) * S + x] - h[((y + S - 1) % S) * S + x], l = Math.hypot(hx * 3, hy * 3, 1), v = h[y * S + x];
          inn.data[i] = (-hx * 3 / l * 0.5 + 0.5) * 255; inn.data[i + 1] = (-hy * 3 / l * 0.5 + 0.5) * 255; inn.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; inn.data[i + 3] = 255;
          const b = 0.74 + 0.26 * Math.pow(1 - Math.min(1, Math.abs(v) * 1.5), 3);   // líneas finas de luz donde las ondas se cruzan (como cáusticas suaves), el resto algo más hondo
          im.data[i] = im.data[i + 1] = im.data[i + 2] = Math.max(0, Math.min(255, b * 255)); im.data[i + 3] = 255;
        }
        cx.putImageData(im, 0, 0); cnx.putImageData(inn, 0, 0);
        tex = new Th.CanvasTexture(cv); const nt2 = new Th.CanvasTexture(cn);
        [tex, nt2].forEach((q) => { q.wrapS = q.wrapT = Th.RepeatWrapping; });
        const uv = new Float32Array(nt * (N + 1) * (N + 1) * 2); for (let q = 0, k = 0; q < pos.length; q += 3, k += 2) { uv[k] = pos[q] / 2.2; uv[k + 1] = pos[q + 2] / 2.2; }
        g.setAttribute('uv', new Th.BufferAttribute(uv, 2));
        extra = { transparent: true, opacity: 0.7, depthWrite: false, map: tex, normalMap: nt2, normalScale: new Th.Vector2(0.7, 0.7) };
      }
      const matA = new Th.MeshPhongMaterial(Object.assign({ vertexColors: true, shininess: 120, specular: new Th.Color(0xd8f0ff) }, extra)), uT = { value: 0 };
      if (VOL) {   // dos capas de ondas (distinta escala y dirección) que se cruzan y se deforman con el tiempo: el dibujo cambia, no solo se desliza
        matA.onBeforeCompile = (sh) => { sh.uniforms.uT = uT;
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uT;')
            .replace('#include <map_fragment>', 'vec2 wu1 = vUv + vec2(uT * 0.055, uT * 0.035) + 0.02 * vec2(sin(vUv.y * 7.0 + uT * 1.6), cos(vUv.x * 7.0 + uT * 1.3));\nvec2 wu2 = vUv * 1.43 + vec2(-uT * 0.045, uT * 0.065) + 0.018 * vec2(cos(vUv.y * 9.0 - uT * 1.4), sin(vUv.x * 8.0 + uT * 1.7));\nfloat wa = texture2D(map, wu1).r, wb = texture2D(map, wu2).r;\ndiffuseColor.rgb *= clamp((wa + wb) * 0.5 * 1.08, 0.0, 1.0);')
            .replace('vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;', 'vec3 mapN = texture2D( normalMap, wu1 ).xyz + texture2D( normalMap, wu2 ).xyz - 1.0;'); };
        matA.customProgramCacheKey = () => 'agua_dos_capas';
      }
      const mesh = new Th.Mesh(g, matA); mesh.frustumCulled = false; mesh.renderOrder = 2; E.scene.add(mesh); E.fijos.push(mesh);
      E.aguaReal = { prep, N, pos, nor, col, aP, aN, aC, D, M, y0: VOL ? ALT['~'] : null, k: VOL ? 0.55 : 1, tex, g: VOL ? 1.25 : 1, uT, v: VOL ? 2 : 1 }; st.aguaTiles = nt;
    } catch (err) { AJUSTES.AGUA3D = false; E.aguaReal = null; } } else
    if (AJUSTES.AGUA3D && G.agua3d) { try {
      const prep = G.agua3d.preparar(M.suelo, T);
      if (prep.tiles.length) {
        const [ac, actx2] = lienzo(W * T, H * T), img = actx2.createImageData(W * T, H * T), wb = buf();
        prep.tiles.forEach(([x, z]) => { const hh = alt(M, x, z) + 0.01, u0 = x / W, u1 = (x + 1) / W, v0 = 1 - z / H, v1 = 1 - (z + 1) / H; quad(wb, [[x, hh, z], [x + 1, hh, z], [x + 1, hh, z + 1], [x, hh, z + 1]], [0, 1, 0], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], BLANCO, true); });
        E.aguaTex = pixelart(ac); const mA = new Th.MeshLambertMaterial({ map: E.aguaTex, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), mesh = new Th.Mesh(geo(wb, true), mA);
        E.scene.add(mesh); E.fijos.push(mesh); E.agua = { prep, ctx: actx2, img, mesh, w: W * T, h: H * T }; st.aguaTiles = prep.tiles.length;
      }
    } catch (err) { AJUSTES.AGUA3D = false; E.agua = null; } }
    // 2 · árboles. v2.198: volúmenes reales (src/arboles3d.js): tronco + una copa de caras planas, TODOS en una malla (más otra con las sombras suaves del suelo); si algo falla se vuelve a las láminas de siempre
    E.arb3 = null; let arb3 = false;
    if (pl.arboles.length && G.arboles3d && !E.arbol3dOff) {
      try {
        const lista = pl.arboles.map(([tx, tz, tipo]) => ({ tipo: tipo || 'arbol_pequeno', x: tx + 0.5, y: tipo ? (alt(M, tx, tz) ?? 0) : ALT.t, z: tz + 0.5 })), B = G.arboles3d.build(lista), S3 = G.arboles3d.sombras(lista);
        const g3 = new Th.BufferGeometry(); g3.setAttribute('position', new Th.BufferAttribute(B.pos, 3)); g3.setAttribute('color', new Th.BufferAttribute(B.col, 3)); g3.setIndex(new Th.BufferAttribute(B.idx, 1));
        const vis3 = new Float32Array(B.pos.length / 3).fill(1); g3.setAttribute('aVis', new Th.BufferAttribute(vis3, 1)); const mat3 = new Th.MeshBasicMaterial({ vertexColors: true, side: Th.DoubleSide }), ub = { value: Math.max(1, Math.round(2 * E.R.getPixelRatio())) };
        mat3.onBeforeCompile = (sh) => { sh.uniforms.uBloque = ub; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aVis;\nvarying float vVis;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvVis = aVis;'); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vVis;\nuniform float uBloque;').replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\n' + GLSL_TRAMA.replace(/uVis/g, 'vVis').replace('&& vAltura > uCorte', '')); };
        mat3.customProgramCacheKey = () => 'trama_arboles';
        const m3 = new Th.Mesh(g3, mat3); m3.frustumCulled = false; E.scene.add(m3); E.fijos.push(m3);
        const gs = new Th.BufferGeometry(); gs.setAttribute('position', new Th.BufferAttribute(S3.pos, 3)); gs.setIndex(new Th.BufferAttribute(S3.idx, 1));
        const ms = new Th.Mesh(gs, new Th.MeshBasicMaterial({ color: 0x14301f, transparent: true, opacity: 0.26, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); ms.frustumCulled = false; ms.renderOrder = 1; E.scene.add(ms); E.fijos.push(ms);
        E.arbGeo = g3; E.arbBase = Float32Array.from(B.pos); E.arb3 = B.items; E.arb3.forEach((it) => { it.vis = it.meta = 1; it.r = G.arboles3d.modelo(it.tipo).radio; }); E.arbVis = vis3; E.arbUb = ub; E.vivos = []; arb3 = true; st.arboles3d = B.n;
      } catch (err) { E.arbol3dOff = true; E.arb3 = null; arb3 = false; }
    }
    if (!arb3) {
    // (respaldo) árboles: la capa de píxeles del árbol (lo que el suelo con árboles tiene distinto del suelo sin ellos, casilla a casilla) en láminas cruzadas, todas en UNA malla
    const [arb, a2] = lienzo(W * T, H * T), A = real.getContext('2d').getImageData(0, 0, W * T, H * T), B = base.getContext('2d').getImageData(0, 0, W * T, H * T), O = a2.createImageData(W * T, H * T);
    pl.arboles.forEach(([tx, tz]) => { for (let py = tz * T; py < tz * T + T; py++) for (let px = tx * T; px < tx * T + T; px++) { const i = (py * W * T + px) * 4; if (A.data[i] !== B.data[i] || A.data[i + 1] !== B.data[i + 1] || A.data[i + 2] !== B.data[i + 2]) { O.data[i] = A.data[i]; O.data[i + 1] = A.data[i + 1]; O.data[i + 2] = A.data[i + 2]; O.data[i + 3] = 255; } } });
    a2.putImageData(O, 0, 0);
    const tb = buf(), vivos = []; // vivos: [índice del primer vértice, tx, tz] para el viento
    pl.arboles.forEach(([tx, tz]) => {
      const y = ALT.t, cx = tx + 0.5, cz = tz + 0.5, u0 = tx / W, u1 = (tx + 1) / W, vb = 1 - (tz + 1) / H, vt = 1 - tz / H, U = [[u0, vb], [u1, vb], [u1, vt], [u0, vt]];
      vivos.push([tb.p.length / 3, tx, tz]);
      quad(tb, [[cx - 0.5, y, cz], [cx + 0.5, y, cz], [cx + 0.5, y + 1, cz], [cx - 0.5, y + 1, cz]], [0, 0, 1], U, BLANCO);
      quad(tb, [[cx, y, cz + 0.5], [cx, y, cz - 0.5], [cx, y + 1, cz - 0.5], [cx, y + 1, cz + 0.5]], [1, 0, 0], U, BLANCO);
    });
    if (pl.arboles.length) {
      E.arbTex = pixelart(arb); const g = geo(tb, true), mt = new Th.MeshBasicMaterial({ map: E.arbTex, alphaTest: 0.5, side: Th.DoubleSide });
      const malla = new Th.Mesh(g, mt); E.scene.add(malla); E.fijos.push(malla); E.arboles = E.arbTex; E.vivos = vivos; E.arbGeo = g; E.arbBase = Float32Array.from(g.getAttribute('position').array);
    } else { E.vivos = []; E.arbGeo = null; }
    }
    // 3 · objetos del mapa (farolas, bancos, fuente, vallas, edificios sin volumen…): láminas con el dibujo del 2D; cada tipo se dibuja una sola vez en su lienzo
    const tex = (tipo) => { let t = E.texObj.get(tipo); if (!t) { const d = G.OBJETOS[tipo], [c, x] = lienzo(d.w, d.h), o = { tipo, x: 0, y: 0 }, cam = { x: d.ox, y: d.oy }; G.capas.dibujarBase(x, o, cam); if (d.encima !== false) G.capas.dibujarEncima(x, [{ objeto: o }], cam); t = pixelart(c); E.texObj.set(tipo, t); } return t; };
    // 3b · edificios con volumen (v2.70): geometría y atlas UNA vez por tipo de pieza (las tres casas comparten malla, textura y material); cada edificio es una sola malla (1 llamada de dibujo) y su sombra suave en el suelo otra
    const vols = new Map(), permiteSombra = (x, z) => { const c = M.suelo[z] && M.suelo[z][x]; return !!c && c !== 't' && c !== '~' && c !== 'b'; }; // nunca sombra sobre árboles, agua ni puente
    const volDe = (tipo) => {
      let v = vols.get(tipo); if (v) return v;
      const d = G.OBJETOS[tipo], geo = G.volumenes.geometria(d.huella, d.vol), at = G.volTex.atlas(tipo, geo), b = G.volumenes.buferes(geo, 0, 0, 0), u = [];
      geo.poligonos.forEach((q, i2) => q.v.forEach((_, k) => u.push(at.uv[i2][k][0], at.uv[i2][k][1]))); // mismo orden de vértices que los búferes
      const g = new Th.BufferGeometry(); g.setAttribute('position', new Th.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new Th.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new Th.Float32BufferAttribute(u, 2)); g.setIndex(b.i);
      const tx = pixelart(at.canvas); E.texObj.set('vol|' + tipo, tx); st.atlas.push({ tipo, w: at.w, h: at.h, texturas: at.texturas, triangulos: geo.triangulos });
      const oc = AJUSTES.OCLUSION && G.volumenes.tieneTecho(geo), ix = oc ? G.volumenes.repartirIndices(b) : null, gx = (i) => { const h = new Th.BufferGeometry(); ['position', 'normal', 'uv'].forEach((n) => h.setAttribute(n, g.getAttribute(n))); h.setIndex(i); return h; };
      v = { geo, g, at, tx, oc, gFijo: oc ? gx(ix.fijos) : null, gAlto: oc ? gx(ix.altos) : null, mat: new Th.MeshBasicMaterial({ map: tx, alphaTest: 0.5 }) }; vols.set(tipo, v); return v; // la luz ya viene pintada en la textura (luz / base / sombra): material sin iluminar
    };
    E.vols = vols; E.edificios = []; st.volumenes = 0; st.sombras = 0; st.triangulosVol = 0; st.volFallos = 0; st.atlas = []; E.carteles = [];
    E.rio = null;
    if (VOL && G.rio3d) { try {   // v2.172d: nenúfares y juncos del río como mallas 3D (UNA malla); sus láminas del 2D no se dibujan en HD-2D
      const props = pl.objetos.filter((o) => G.rio3d.TIPOS.indexOf(o.tipo) >= 0).map((o) => { const bajoAgua = M.suelo[Math.floor(o.cz - 0.01)] && M.suelo[Math.floor(o.cz - 0.01)][Math.floor(o.cx)] === '~'; return { tipo: o.tipo, x: o.cx, z: o.cz, y: /^nenufar/.test(o.tipo) ? ALT['~'] + 0.03 : (bajoAgua ? ALT['~'] - 0.28 : (o.y || 0)) }; });
      G.rio3d.pilotes(M.suelo).forEach((q) => { const yb = ALT['~'] - 0.28, top = (alt(M, q.bx, q.bz) || 0) - 0.04; props.push({ tipo: 'pilote', x: q.x, z: q.z, y: yb, h: Math.max(0.3, top - yb), yw: ALT['~'] + 0.045 }); });   // pilotes del puente con anillos de onda
      G.rio3d.extras(M.suelo, props).forEach((q) => props.push({ tipo: q.tipo, x: q.x, z: q.z, s: q.s, y: q.tipo === 'juncoSuelto' ? ALT['~'] - 0.28 : ALT['~'] + 0.03 }));
      if (props.length) { const mo = G.rio3d.modelo(props), g = new Th.BufferGeometry(), aP = new Th.BufferAttribute(mo.pos, 3);
        g.setAttribute('position', aP); g.setAttribute('color', new Th.BufferAttribute(mo.col, 3)); g.setIndex(mo.idx); G.rio3d.animar(mo, 0); g.computeVertexNormals();
        const mesh = new Th.Mesh(g, new Th.MeshLambertMaterial({ vertexColors: true, side: Th.DoubleSide })); mesh.frustumCulled = false; E.scene.add(mesh); E.fijos.push(mesh); E.rio = { mo, aP, tipos: new Set(pl.objetos.filter((o) => G.rio3d.TIPOS.indexOf(o.tipo) >= 0).map((o) => o.tipo)) }; }
    } catch (err) { E.rio = null; } }
    pl.objetos.forEach((o) => {
      if (E.rio && E.rio.tipos.has(o.tipo)) return;
      if (o.modo === 'modelo') {   // v2.246: pieza de decoración con modelo 3D (src/objeto3d.js): geometría compartida por tipo, una malla por ejemplar, sombra de contacto
        try {
          const mo = modeloObj(o.tipo), Th = E.Th, mesh = new Th.Mesh(mo.g, mo.mat), hh = ((o.x * 73856093) ^ (o.z * 19349663)) >>> 0;
          mesh.position.set(o.x + 0.5, o.y, o.z + 0.5); mesh.rotation.y = mo.fijo ? 0 : (hh % 4) * (Math.PI / 2); /* los carteles miran siempre al sur */ mesh.frustumCulled = false; E.scene.add(mesh); E.fijos.push(mesh);
          const sb = new Th.Mesh(E.gSombra, E.mSombra); sb.scale.set(mo.sombra.rw, 1, mo.sombra.rd); sb.position.set(o.x + 0.5, o.y + 0.02, o.z + 0.55); E.scene.add(sb); E.fijos.push(sb);
          st.modelos = (st.modelos || 0) + 1; st.triangulosModelos = (st.triangulosModelos || 0) + mo.triangulos; return;
        } catch (e) { st.modeloFallos = (st.modeloFallos || 0) + 1; o.modo = 'cartel'; }   // si algo falla, vuelve la lámina y el HD-2D sigue
      }
      if (o.modo === 'volumen') {
        try {
          const v = volDe(o.tipo); let mesh;
          if (v.oc) { // edificio con tejado: dos mallas (muros y tejado) con material propio y trama, para atenuarlas cuando tapan a alguien
            const ed = { tipo: o.tipo, geo: v.geo, x: o.x, y: o.y, z: o.z, vis: 1, meta: 1, u: { uVis: { value: 1 }, uCorte: { value: v.geo.altoTotal * 0 }, uBloque: { value: 2 } }, uAlto: { uVis: { value: 1 }, uCorte: { value: -1 }, uBloque: { value: 2 } } };
            ed.u.uCorte.value = ((G.OBJETOS[o.tipo].vol || {}).muros || 0) * 2 / 3; // de los muros solo se atenúa el tercio alto
            ed.mMuros = ocluible(Th, v.tx, ed.u); ed.mTecho = ocluible(Th, v.tx, ed.uAlto);
            mesh = new Th.Mesh(v.gFijo, ed.mMuros); const mt = new Th.Mesh(v.gAlto, ed.mTecho); mt.position.set(o.x, o.y, o.z); E.scene.add(mt); E.fijos.push(mt); E.edificios.push(ed);
          } else mesh = new Th.Mesh(v.g, v.mat);
          mesh.position.set(o.x, o.y, o.z); E.scene.add(mesh); E.fijos.push(mesh); st.volumenes++; st.triangulosVol += v.geo.triangulos;
          const red = G.volumenes.redonda(G.OBJETOS[o.tipo].vol), quads = (G.OBJETOS[o.tipo].vol || {}).sombra === false ? [] : G.volumenes.sombraSuelo(v.geo.rect, o.x, o.z, permiteSombra, red);   // v2.92: la fuente redonda da una sombra redonda
          const grupos = new Map();   // v2.167: una malla por intensidad `k` (la fuente lleva dos bandas: contacto y halo); sin quad[4] se usa el k de la pieza (o el material por defecto)
          quads.forEach(([xa, za, xb, zb, kq]) => { const k = kq !== undefined ? kq : (red && red.k) || 0, sb = grupos.get(k) || grupos.set(k, buf()).get(k), y = (alt(M, Math.floor((xa + xb) / 2), Math.floor((za + zb) / 2)) ?? 0) + 0.015; quad(sb, [[xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb]], [0, 1, 0], null, BLANCO, true); });
          grupos.forEach((sb, k) => { const mS = k ? (E.mSombraK[k] = E.mSombraK[k] || Object.assign(new Th.MeshBasicMaterial({ color: 0x1e1428, transparent: true, opacity: E.mSombra.opacity * k, depthWrite: false }), { __compartida: true })) : E.mSombra, sm = new Th.Mesh(geo(sb, false), mS); /* v2.102: la sombra suave de la farola (k = 0,75) usa su propio material, compartido */ sm.renderOrder = 1; E.scene.add(sm); E.fijos.push(sm); st.sombras++; });
          return;
        } catch (e) { st.volFallos++; o.modo = 'cartel'; } // si algo falla con un edificio, se dibuja como lámina y el HD-2D sigue
      }
      const mat = new Th.MeshBasicMaterial({ map: tex(o.tipo), alphaTest: 0.5, side: Th.DoubleSide }), mesh = new Th.Mesh(o.modo === 'plano' ? E.gPlano : E.gVert, mat);
      if (o.modo === 'plano') { mesh.scale.set(o.ancho, 1, o.alto); mesh.position.set(o.cx, o.y + 0.03, o.cz); } // tumbada: la geometría ya está girada, el «alto» del dibujo es su fondo (eje z)
      else { mesh.scale.set(o.ancho, o.alto, 1); mesh.position.set(o.cx, o.y, o.cz); }
      if (o.modo === 'cartel') E.carteles.push(mesh);
      E.scene.add(mesh); E.fijos.push(mesh);
    });
    // 4 · luz pequeña de las farolas (v2.102, paso 5; src/luz_farolas.js): UNA malla con todos los charcos de luz en el suelo y UNA con todos los halos del cristal; sin luces reales
    E.farolas = null; const LF = G.luzFarolas, pts = LF && LF.AJUSTES.ACTIVO ? LF.puntos(pl.objetos) : [];
    if (pts.length) {
      const A = LF.AJUSTES, cb = buf(), hb = buf(), r = A.RADIO, tc = pixelart(LF.charco()), th2 = pixelart(LF.halo()); E.texObj.set('luz|charco', tc); E.texObj.set('luz|halo', th2);
      pts.forEach((q) => { quad(cb, [[q.x - r, q.y + A.ALTO, q.z - r], [q.x + r, q.y + A.ALTO, q.z - r], [q.x + r, q.y + A.ALTO, q.z + r], [q.x - r, q.y + A.ALTO, q.z + r]], [0, 1, 0], [[0, 1], [1, 1], [1, 0], [0, 0]], BLANCO, true); quad(hb, [[q.x, q.y + A.HALO_Y, q.z], [q.x, q.y + A.HALO_Y, q.z], [q.x, q.y + A.HALO_Y, q.z], [q.x, q.y + A.HALO_Y, q.z]], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], BLANCO); });
      const mat = (map, op) => new Th.MeshBasicMaterial({ map, transparent: true, opacity: op, depthWrite: false, blending: Th.AdditiveBlending }), mc = new Th.Mesh(geo(cb, true), mat(tc, A.INTENSIDAD)), mh = new Th.Mesh(geo(hb, true), mat(th2, A.HALO_INT));
      mc.renderOrder = 2; mh.renderOrder = 3; mh.frustumCulled = false; E.scene.add(mc); E.scene.add(mh); E.fijos.push(mc, mh); E.farolas = { pts, mc, mh, yaw: null }; st.luces = pts.length;
    } else st.luces = 0;
    pintarSuelo(true);
  }
  // los halos son láminas que miran a la cámara: se recolocan los 4 vértices de cada uno cuando cambia el giro; y el parpadeo sube y baja la intensidad de los dos (sin parpadeo con «menos movimiento»)
  function luzFarolas(yaw) {
    const F = E.farolas; if (!F) return; const A = G.luzFarolas.AJUSTES, C = G.capas, f = G.luzFarolas.parpadeo(C.reloj || 0, C.REDUCIDO);
    const nc = Math.max(0, Math.min(1, A.NOCHE)); F.mc.visible = F.mh.visible = A.ACTIVO !== false && nc > 0; F.mc.material.opacity = A.INTENSIDAD * f * nc; F.mh.material.opacity = A.HALO_INT * f * nc;
    if (F.yaw === yaw) return; F.yaw = yaw; const pos = F.mh.geometry.getAttribute('position'), a = A.HALO / 2, rx = Math.cos(yaw) * a, rz = -Math.sin(yaw) * a;
    F.pts.forEach((q, k) => { const y = q.y + A.HALO_Y; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], j) => pos.setXYZ(k * 4 + j, q.x + sx * rx, y + sy * a, q.z + sx * rz)); }); pos.needsUpdate = true;
  }
  // vuelve a pintar el suelo animado si cambió el cuadro del reloj visual (o forzado). Con «menos movimiento» (G.capas.REDUCIDO) solo se pinta una vez.
  function pintarSuelo(fuerza) {
    const M = E.M, C = G.capas, n = C.REDUCIDO ? 0 : Math.floor(C.reloj * 4); if (!fuerza && (n === E.n || !M.animar || C.REDUCIDO)) return;
    E.n = n; if (E.vols && !C.REDUCIDO) E.vols.forEach((v) => { if (G.volTex.animar(v.at, n)) v.tx.needsUpdate = true; });   // v2.86: el agua de la fuente (textura del atlas) se mueve con el mismo reloj visual que las olas
    const x = E.actx, w = M.W * T, h = M.H * T, cam0 = { x: 0, y: 0 };
    x.drawImage(E.base, 0, 0); C.matas(x, M, cam0, w, h); C.flores(x, M, cam0, w, h); if (!E.agua) C.agua(x, M, cam0, w, h); C.luzRegion(x, M, w, h); // las mismas capas que el 2D, encima del suelo horneado (que lleva hierba donde hay bosque)
    E.sueloTex.needsUpdate = true;
    if (E.agua) { try { const A = E.agua; G.agua3d.pintar(A.prep, n, A.img.data); A.ctx.putImageData(A.img, 0, 0); A.ctx.globalCompositeOperation = 'source-atop'; C.luzRegion(A.ctx, M, A.w, A.h); A.ctx.globalCompositeOperation = 'source-over'; E.aguaTex.needsUpdate = true; } catch (err) { AJUSTES.AGUA3D = false; E.scene.remove(E.agua.mesh); E.agua = null; pintarSuelo(true); return; } }   // si algo falla se apaga solo el agua 3D y vuelve la del suelo
    // v2.199: los árboles están QUIETOS (sin viento), a petición del usuario
  }

  function iniciar(host) {
    const Th = root.THREE, cv = document.createElement('canvas'); cv.id = 'hd'; cv.setAttribute('aria-label', 'Mapa del juego en HD-2D'); cv.style.cssText = 'display:block;touch-action:none';
    host.stage.insertBefore(cv, host.stage.firstChild);
    let R; try { R = new Th.WebGLRenderer({ canvas: cv, antialias: true }); } catch (e) { cv.remove(); throw e; }
    R.setPixelRatio(Math.min(root.devicePixelRatio || 1, 3));   // v2.196: hasta 3 (antes 2): en un móvil de densidad 3 el 3D se pintaba a 2 y el navegador lo estiraba 1,5× (borroso y con píxeles desiguales) R.setClearColor(0x1b1424);
    const scene = new Th.Scene(), cam = new Th.PerspectiveCamera(30, 1, 0.5, 300);
    scene.add(new Th.AmbientLight(0xffffff, 0.52)); const sol = new Th.DirectionalLight(0xfff3dc, 0.58); sol.position.set(-6, 10, 4); scene.add(sol);
    const gVert = new Th.PlaneGeometry(1, 1); gVert.translate(0, 0.5, 0); gVert.__compartida = true; // lámina vertical con el origen en el centro de su borde de abajo (los pies)
    const gPlano = new Th.PlaneGeometry(1, 1); gPlano.rotateX(-Math.PI / 2); gPlano.__compartida = true; // lámina tumbada
    const gSombra = new Th.CircleGeometry(0.5, 18); gSombra.rotateX(-Math.PI / 2); gSombra.__compartida = true;
    const vacio = (() => { const [c] = lienzo(1, 1); return new Th.CanvasTexture(c); })(), mSombra = new Th.MeshBasicMaterial({ color: 0x1e1428, transparent: true, opacity: 0.28, depthWrite: false }); mSombra.__compartida = true; // la comparten las sombras de las criaturas y las de los edificios
    E = { host, Th, cv, R, scene, cam, sol, gVert, gPlano, gSombra, vacio, mSombra, mSombraK: {}, M: null, n: -1, fijos: [], texObj: new Map(), tex: new Map(), pool: [], carteles: [], vista: { yaw: 0, yawT: 0, dist: ZOOMS[0][1], distT: ZOOMS[0][1], tx: 0, tz: 0, zi: 0 }, vec: new Th.Vector3(), dts: [], ultimo: 0, cuadros: 0, avisos: 0 };
    E.part = crearParticulas(Th); if (E.part) scene.add(E.part.mesh);
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (E) host.alFallar('se perdió el dibujo 3D'); });
    const f = host.estado(); construir(f.M); centrar(f);
  }
  const centrar = (f) => { const j = f.yo; if (j) { E.vista.tx = j.x / T; E.vista.tz = j.y / T; } };

  // ───────────── 4 · UN CUADRO ─────────────
  function textura(clave, s) { // una textura por sprite (clave = personaje+vista+fotograma o criatura+dirección+fotograma); si el 2D rehízo el lienzo, se actualiza
    let t = E.tex.get(clave);
    if (!t) { t = pixelart(s.c); E.tex.set(clave, t); if (E.tex.size > 500) { const k = E.tex.keys().next().value; E.tex.get(k).dispose(); E.tex.delete(k); } }
    else if (t.image !== s.c) { t.image = s.c; t.needsUpdate = true; }
    return t;
  }
  function entidad(i) {
    let e = E.pool[i];
    if (!e) {
      const Th = E.Th, mat = new Th.MeshBasicMaterial({ map: E.vacio, alphaTest: 0.5, side: Th.DoubleSide }), mesh = new Th.Mesh(E.gVert, mat), sombra = new Th.Mesh(E.gSombra, E.mSombra);
      sombra.renderOrder = 1; E.scene.add(mesh); E.scene.add(sombra); e = E.pool[i] = { mesh, sombra };
    }
    return e;
  }
  // Pone un sprite en el mundo: (x, y) son los pies en píxeles del juego, subePx lo separa del suelo (flotar, saltar), sombra = { ancho, alto, separacion } de G.vista
  function poner(e, clave, s, x, y, subePx, espejo, sombra) {
    const h0 = altEn(E.M, x, y); e.mesh.material.map = textura(clave, s); e.mesh.visible = e.sombra.visible = true;
    e.mesh.scale.set((espejo ? -1 : 1) * s.w / T, s.h / T, 1); e.mesh.position.set(x / T, h0 + subePx / T, y / T); e.mesh.rotation.y = E.vista.yaw;
    e.sombra.scale.set(Math.max(0.2, sombra.ancho / T), 1, Math.max(0.12, sombra.alto / T * 1.6)); e.sombra.position.set(x / T, h0 + 0.02, y / T + 0.03);
    return h0;
  }

  // ── Personajes 3D (v2.126 Oli · v2.130 Lali; paso 4 de docs/FICHA_OLI_3D.md y docs/FICHA_LALI_3D.md) ──  Con su interruptor (AJUSTES.PERSONAJES3D = Oli, AJUSTES.PERSONAJES3D_LALI = Lali; independientes), cada personaje deja de ser lámina y pasa a UNA malla suya (1 llamada de dibujo) con los vértices recalculados cada cuadro por G.personaje3d.de(id) (pose, giro suave, atlas propio). Las criaturas siguen como láminas. La sombra es el óvalo de siempre. Si algo falla se apaga solo ESE personaje y vuelve su lámina.
  const AJUSTE_3D = { rex: 'PERSONAJES3D', luna: 'PERSONAJES3D_LALI' };   // id del sprite -> interruptor (personajes); las criaturas 3D ('c_' + id, v2.225) usan todas AJUSTES.CRIATURAS3D y salen de G.criatura3d.ids()
  const ajuste3d = (k) => (k.slice(0, 2) === 'c_' ? 'CRIATURAS3D' : AJUSTE_3D[k]);
  const id3d = (j) => { const k = G.NAMES && G.NAMES[j.id]; return k && AJUSTE_3D[k] && AJUSTES[AJUSTE_3D[k]] && G.personaje3d && G.personaje3d.de && G.personaje3d.de(k) && G.CHARS && G.CHARS[k] ? k : null; };   // 'rex' | 'luna' | null (sin 3D: lámina)
  const esOli = (j) => id3d(j) === 'rex';
  // v2.246 · decoración con modelo 3D: una geometría y un material por tipo (se rehacen al reconstruir el mapa: E.mod3d se vacía en cada plan); el brillo va por quad (q.k) y por vértice (q.kv / q.cvs) como en las criaturas
  function modeloObj(tipo) {
    const mm = E.mod3d || (E.mod3d = {}); if (mm[tipo]) return mm[tipo];
    const Th = E.Th, P = G.objeto3d.de(tipo), at = P.atlas(), g0 = P.geometria(), [c, x] = lienzo(at.w, at.h), B = P.BRILLO;
    at.celdas.forEach((ce) => ce.px.forEach((fila, yy) => fila.forEach((col, xx) => { if (col) { x.fillStyle = col; x.fillRect(ce.x + xx, ce.y + yy, 1, 1); } })));
    const tx = pixelart(c), hexRgb = (h) => [parseInt(h.slice(1, 3), 16) / 255 / B, parseInt(h.slice(3, 5), 16) / 255 / B, parseInt(h.slice(5, 7), 16) / 255 / B];
    const pos = [], col = [], uv = [], idx = [];
    g0.poligonos.forEach((q, i) => {
      const r = P.uvPoligono(q, at), f = r.tex ? (typeof q.k === 'number' ? q.k : P.TONO_TEX[q.tono]) : null;
      for (let m = 0; m < 4; m++) { const cm = f !== null ? (q.kv ? [q.kv[m], q.kv[m], q.kv[m]] : [f, f, f]) : hexRgb(q.cvs ? q.cvs[m] : q.color); pos.push(q.v[m][0], q.v[m][1], q.v[m][2]); col.push(cm[0], cm[1], cm[2]); uv.push(r.uv[m][0], r.uv[m][1]); }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const g = new Th.BufferGeometry(); g.setAttribute('position', new Th.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new Th.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new Th.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const mat = new Th.MeshBasicMaterial({ map: tx, vertexColors: true, alphaTest: 0.5, side: P.doble ? Th.DoubleSide : Th.FrontSide }); if (mat.color && mat.color.setRGB) mat.color.setRGB(B, B, B);
    E.texObj.set('obj3d|' + tipo, tx);
    return (mm[tipo] = { g, mat, fijo: !!P.fijo, triangulos: g0.triangulos, sombra: P.sombra || { rw: 0.9, rd: 0.6 } });
  }
  function crear3d(k) {
    const Th = E.Th, P = k.slice(0, 2) === 'c_' ? G.criatura3d.de(k.slice(2)) : G.personaje3d.de(k), at = P.atlas(), g0 = P.geometria(), n = g0.poligonos.length, [c, x] = lienzo(at.w, at.h);
    at.celdas.forEach((ce) => ce.px.forEach((fila, yy) => fila.forEach((col, xx) => { if (col) { x.fillStyle = col; x.fillRect(ce.x + xx, ce.y + yy, 1, 1); } })));
    const uv = [], idx = [], tex = [], tx = pixelart(c);
    g0.poligonos.forEach((q, i) => { const r = P.uvPoligono(q, at); tex.push(r.tex); r.uv.forEach((t) => uv.push(t[0], t[1])); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); });
    const pos = new Float32Array(n * 12), col = new Float32Array(n * 12), g = new Th.BufferGeometry(), aP = new Th.BufferAttribute(pos, 3), aC = new Th.BufferAttribute(col, 3);
    if (aP.setUsage && Th.DynamicDrawUsage) { aP.setUsage(Th.DynamicDrawUsage); aC.setUsage(Th.DynamicDrawUsage); }
    g.setAttribute('position', aP); g.setAttribute('color', aC); g.setAttribute('uv', new Th.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const mat = new Th.MeshBasicMaterial({ map: tx, vertexColors: true, alphaTest: 0.5, side: P.doble ? Th.DoubleSide : Th.FrontSide }); if (mat.color && mat.color.setRGB) mat.color.setRGB(P.BRILLO, P.BRILLO, P.BRILLO);
    const mesh = new Th.Mesh(g, mat); mesh.frustumCulled = false; E.scene.add(mesh);
    (E.p3d = E.p3d || {})[k] = { mesh, g, mat, tx, aP, aC, pos, col, tex, n, yaw: null, t: 0, triangulos: g0.triangulos, rgb: new Map(), P };
  }
  const rgbDe = (o, hex) => { let v = o.rgb.get(hex); if (!v) { const B = G.personaje3d.BRILLO; v = [parseInt(hex.slice(1, 3), 16) / 255 / B, parseInt(hex.slice(3, 5), 16) / 255 / B, parseInt(hex.slice(5, 7), 16) / 255 / B]; o.rgb.set(hex, v); } return v; };
  function resumen3d() { if (!E.st) return; const ks = Object.keys(E.p3d || {}); E.st.personaje3d = ks.length ? ks.reduce((r, k) => { r[k] = E.p3d[k].triangulos; r.triangulos += E.p3d[k].triangulos; return r; }, { triangulos: 0 }) : null; }   // { triangulos: suma, rex: n, luna: n } de los personajes que son malla
  function poner3d(e, j, k) {   // j.x, j.y = pies en px; k = 'rex' | 'luna'; false = no se pudo (se usa la lámina)
    try {
      if (!E.p3d || !E.p3d[k]) crear3d(k);
      const o = E.p3d[k], P = o.P, h0 = altEn(E.M, j.x, j.y), ahora = (root.performance || Date).now(), dt = o.t ? Math.min(0.1, (ahora - o.t) / 1000) : 0, YAW = G.personaje3d.YAW, objetivo = typeof j.ang === 'number' ? j.ang : YAW[j.dir] !== undefined ? YAW[j.dir] : 0; o.t = ahora;
      o.mt = P.meta(o.mt, objetivo, dt); o.amp = P.amplitud(typeof o.amp === 'number' ? o.amp : (j.moving ? 1 : 0), j.moving, dt);   // v2.135: giro hacia la esquina con histéresis y paso con arranque/parada suaves
      o.yaw = o.yaw === null ? o.mt.meta : P.girar(o.yaw, o.mt.meta, dt);
      const po = P.pose(j.tm, j.moving, j.dir, o.yaw, o.mt.meta, o.amp); if (j.pesca && G.vista.pesca) { const pv = G.vista.pesca(j, ahora / 1000); if (pv) { po.brazoI = pv.brazo[0]; po.brazoD = 0.4; po.rebote = 0; } }   // v2.181 (Pesca 3): pose de pesca: los dos brazos al frente sujetando la caña (los ángulos salen de G.vista.pesca)
      const g = P.geometria(po); if (g.poligonos.length !== o.n) throw new Error('personaje 3D: cambió el número de caras');
      g.poligonos.forEach((q, i) => { const f = o.tex[i] ? P.TONO_TEX[q.tono] : null, c = f === null || f === undefined ? rgbDe(o, q.color) : [f, f, f];
        for (let m = 0; m < 4; m++) { const b = (i * 4 + m) * 3; o.pos[b] = q.v[m][0]; o.pos[b + 1] = q.v[m][1]; o.pos[b + 2] = q.v[m][2]; o.col[b] = c[0]; o.col[b + 1] = c[1]; o.col[b + 2] = c[2]; } });
      o.mano = j.pesca && G.personaje3d.manoDe ? G.personaje3d.manoDe(g, 'mano_i') : null;   // v2.208: la caña va en la mano IZQUIERDA del personaje (la misma que en el 2D)   // v2.184: la caña sale de la mano real (centro de la mano derecha ya posada)
      o.aP.needsUpdate = true; o.aC.needsUpdate = true; o.mesh.position.set(j.x / T, h0, j.y / T); o.mesh.visible = true;
      e.mesh.visible = false; e.sombra.visible = true; e.sombra.scale.set(10 / T, 1, Math.max(0.12, 3 / T * 1.6)); e.sombra.position.set(j.x / T, h0 + 0.02, j.y / T + 0.03);
      resumen3d();
      return true;
    } catch (err) { AJUSTES[AJUSTE_3D[k]] = false; quitar3d(k); return false; }   // salida de emergencia: vuelve la lámina del 2D (solo la de ese personaje)
  }
  // v2.169 · Zefirax 3D (criatura): misma malla dinámica que los personajes; la fase de la onda se acumula aquí (sin saltos al arrancar o parar). false = se usa la lámina.
  const idc3d = (c) => (AJUSTES.CRIATURAS3D && G.criatura3d && G.criatura3d.de && G.criatura3d.de(c.id) ? 'c_' + c.id : null);
  function poner3dC(e, c, v, k) {
    try {
      if (!E.p3d || !E.p3d[k]) crear3d(k);
      const o = E.p3d[k], P = o.P, h0 = altEn(E.M, c.x, c.y), ahora = (root.performance || Date).now(), dt = o.t ? Math.min(0.1, (ahora - o.t) / 1000) : 0, meta = P.YAW[c.dir] !== undefined ? P.YAW[c.dir] : 0; o.t = ahora;
      o.yaw = o.yaw === null ? meta : P.girar(o.yaw, meta, dt); o.fase = (o.fase || 0) + dt * P.velocidad(c.moving);
      const g = P.geometria(P.pose(o.fase, o.yaw, E.vista.yaw, c.moving)); if (g.poligonos.length !== o.n) throw new Error('criatura 3D: cambió el número de caras');
      g.poligonos.forEach((q, i) => { const f = o.tex[i] ? (typeof q.k === 'number' ? q.k : P.TONO_TEX[q.tono]) : null, cc = f === null || f === undefined ? rgbDe(o, q.color) : [f, f, f];
        for (let m = 0; m < 4; m++) { const b = (i * 4 + m) * 3; o.pos[b] = q.v[m][0]; o.pos[b + 1] = q.v[m][1]; o.pos[b + 2] = q.v[m][2]; const cm = f !== null && f !== undefined ? (q.kv ? [q.kv[m], q.kv[m], q.kv[m]] : cc) : (q.cvs ? rgbDe(o, q.cvs[m]) : cc); o.col[b] = cm[0]; o.col[b + 1] = cm[1]; o.col[b + 2] = cm[2]; } });   // v2.233: q.kv / q.cvs = brillo o color por vértice (degradados suaves)
      o.aP.needsUpdate = true; o.aC.needsUpdate = true; const sb = v.sombra;
      o.mesh.position.set((c.x + v.sway) / T, h0 + (v.up + sb.separacion - v.nod) / T, c.y / T); o.mesh.visible = true;
      e.mesh.visible = false; e.sombra.visible = true; const t0 = G.traits(c.id).shadow, fs = Math.max(0.5, Math.min(1, t0 && t0[0] ? sb.ancho / t0[0] : 1)); e.sombra.scale.set(0.55 * fs, 1, 0.35 * fs * 1.6); e.sombra.position.set(c.x / T, h0 + 0.02, c.y / T + 0.03);   // sombra elíptica ~0,55×0,35 u que encoge al subir
      if (P.chispas) E.chis = { fase: o.fase, yaw: o.yaw, o: [o.mesh.position.x, o.mesh.position.y, o.mesh.position.z] };   // solo las criaturas con chispas (Zefirax); una sin ellas no borra las de otra resumen3d(); return h0;
    } catch (err) { AJUSTES.CRIATURAS3D = false; quitar3d(k); return null; }
  }
  // v2.297 · criaturas con malla animada (GLB, p. ej. Ignel): sustituye a la lámina mientras el archivo esté cargado; si no hay archivo o falla, sigue la lámina. Animaciones: Idle, Walking, Dead (ataque y defensa: movimiento procedural de E.proAct).
  function poner3dG(e, id, x, y, sH, dir, est, up, ac) {   // devuelve la altura del suelo, o null (= usar la lámina)
    if (!AJUSTES.CRIATURAS_GLB || !G.glb || !G.glb.tiene(id)) return null;
    E.glb = E.glb || {}; E.glbN = E.glbN || {}; const slot = E.glbN[id] = (E.glbN[id] || 0) + 1; if (slot > 3) return null;
    const Th = E.Th, k = id + '|' + slot; let o = E.glb[k];
    if (!o) { o = E.glb[k] = { listo: false }; G.glb.instancia(id, Th).then((r) => { if (!E || E.glb[k] !== o) { r.mesh.geometry.dispose(); return; } o.r = r; o.mixer = new Th.AnimationMixer(r.raiz); o.acc = {}; Object.keys(r.clips).forEach((n) => { o.acc[n] = o.mixer.clipAction(r.clips[n]); }); o.acc.Dead.setLoop(Th.LoopOnce, 1); o.acc.Dead.clampWhenFinished = true; r.raiz.visible = false; E.scene.add(r.raiz); o.listo = true; }).catch(() => { o.fallo = true; }); }
    if (!o.listo) return null;
    const ahora = (root.performance || Date).now(), dt = o.t ? Math.min(0.1, (ahora - o.t) / 1000) : 0, h0 = altEn(E.M, x, y), P = G.personaje3d, meta = P.YAW[dir] !== undefined ? P.YAW[dir] : 0, nom = est === 'dead' ? 'Dead' : est === 'walk' ? 'Walking' : 'Idle'; o.t = ahora; o.uso = E.glbF;
    if (o.est !== nom) { const a = o.acc[nom], b = o.est && o.acc[o.est]; if (a) { a.reset().fadeIn(0.18).play(); if (b) b.fadeOut(0.18); o.est = nom; } }
    o.mixer.update(dt); o.yaw = typeof o.yaw === 'number' ? P.girar(o.yaw, meta, dt) : meta;
    const R = o.r.raiz, sc = (sH / T) / o.r.alto * (G.glb.REG[id].k || 1), ax = ac ? ac.dx / T : 0, ay = ac ? -ac.dy / T : 0;
    R.rotation.y = o.yaw; R.scale.set(sc * (ac ? ac.sx : 1), sc * (ac ? ac.sy : 1), sc * (ac ? ac.sx : 1)); R.position.set(x / T + ax, h0 + (up || 0) / T + ay, y / T); R.visible = true;
    e.mesh.visible = false; e.sombra.visible = true; e.sombra.scale.set(0.55, 1, 0.56); e.sombra.position.set(x / T, h0 + 0.02, y / T + 0.03);
    return h0;
  }
  function quitarG() { Object.keys(E.glb || {}).forEach((k) => { const o = E.glb[k]; if (o.r) { E.scene.remove(o.r.raiz); o.r.mesh.geometry.dispose(); o.r.mesh.material.map.dispose(); o.r.mesh.material.dispose(); } }); E.glb = {}; }
  function quitar3d(k) { const o = E && E.p3d && E.p3d[k]; if (!o) return; E.scene.remove(o.mesh); o.g.dispose(); o.mat.dispose(); o.tx.dispose(); delete E.p3d[k]; resumen3d(); }
  function entidades(f) {
    let n = 0; const vistos = {}, nombres = []; E.chis = null; E.glbN = {}; E.glbF = (E.glbF || 0) + 1;
    if (f.me) {
      f.jugadores.forEach((j) => { const k3 = id3d(j); if (k3) { const e3 = entidad(n); if (poner3d(e3, j, k3)) { n++; vistos[k3] = true; return; } } const v = G.vista.persona(j.id, j.dir, j.moving, j.tm), s = G.spr[v.clave]; if (s) poner(entidad(n++), 'p|' + v.clave, s, j.x, j.y, 0, v.espejo, { ancho: 10, alto: 3, separacion: 0 }); });
      f.criaturas.forEach((c) => {
        if (c.enCombate) return;   // v2.272: la que pelea se dibuja como unidad del combate (abajo)
        const v = G.vista.criatura(c, f.reloj), s = G.creatureSprite(c.id, c.dir, v.frame), sb = v.sombra; if (!s) return;
        { const e3 = entidad(n), h3 = poner3dG(e3, c.id, c.x + v.sway, c.y, s.h, c.dir, c.moving ? 'walk' : 'idle', v.up + sb.separacion - v.nod); if (h3 !== null) { n++; nombres.push({ nombre: G.CREATURES[c.id].name, x: c.x, y: c.y, h: h3 + (s.h + v.up + sb.separacion - v.nod) / T, ancho: s.w / T }); return; } }
        const kc = idc3d(c); if (kc && !vistos[kc]) { const e3 = entidad(n), h3 = poner3dC(e3, c, v, kc); if (h3 !== null) { n++; vistos[kc] = true; nombres.push({ nombre: G.CREATURES[c.id].name, x: c.x, y: c.y, h: h3 + (s.h + v.up + sb.separacion - v.nod) / T, ancho: s.w / T }); return; } }
        const h0 = poner(entidad(n++), 'c|' + c.id + '|' + c.dir + '|' + v.frame, s, c.x + v.sway, c.y, v.up + sb.separacion - v.nod, false, sb);
        nombres.push({ nombre: G.CREATURES[c.id].name, x: c.x, y: c.y, h: h0 + (s.h + v.up + sb.separacion - v.nod) / T, ancho: s.w / T });
      });
    }
    if (f.acomp) { const a = f.acomp, v = G.vista.criatura({ id: a.forma, dir: a.dir, moving: a.moving, tm: a.tm }, f.reloj), s = G.creatureSprite(a.forma, a.dir, v.frame);   // acompañante provisional: lámina 2D
      if (s) { const eg = entidad(n), hg = poner3dG(eg, a.forma, a.x, a.y, s.h, a.dir, a.moving ? 'walk' : 'idle', v.up + v.sombra.separacion); if (hg !== null) { n++; nombres.push({ nombre: G.CREATURES[a.forma].name, x: a.x, y: a.y, h: hg + (s.h + v.up + v.sombra.separacion) / T, ancho: s.w / T }); } else {
        const h0 = poner(entidad(n++), 'c|' + a.forma + '|' + a.dir + '|' + v.frame, s, a.x, a.y, v.up + v.sombra.separacion, false, v.sombra); nombres.push({ nombre: G.CREATURES[a.forma].name, x: a.x, y: a.y, h: h0 + (s.h + v.up + v.sombra.separacion) / T, ancho: s.w / T }); } } }
    if (f.combate) f.combate.unidades.forEach((u) => {   // v2.272 · combate: cada unidad es la lámina 2D de su criatura (decisión: en combate se usan los sprites 2D); el KO la encoge y la apaga
      const c = { id: u.forma, dir: u.dir, moving: u.moving, tm: u.tm }, v = G.vista.criatura(c, f.reloj), s = G.creatureSprite(u.forma, u.dir, v.frame); if (!s) return;
      { const eg = entidad(n), hg = poner3dG(eg, u.forma, u.x, u.y, s.h, u.dir, u.hpF <= 0 ? 'dead' : u.moving ? 'walk' : 'idle', v.up + v.sombra.separacion + u.up, E.proAct && E.proAct[u.id]); if (hg !== null) { n++; return; } }
      const e = entidad(n++), h0 = poner(e, 'c|' + u.forma + '|' + u.dir + '|' + v.frame, s, u.x, u.y, v.up + v.sombra.separacion + u.up, false, v.sombra);
      const ac = E.proAct && E.proAct[u.id]; if (ac) { e.mesh.position.x += ac.dx / T; e.mesh.position.y -= ac.dy / T; e.mesh.scale.x *= ac.sx; e.mesh.scale.y *= ac.sy; }   // los 56 efectos mueven a quien los lanza y a quien los recibe (embestida, encogerse, saltar)
    });
    Object.keys(E.p3d || {}).forEach((k) => { if (!AJUSTES[ajuste3d(k)]) quitar3d(k); else if (!vistos[k]) E.p3d[k].mesh.visible = false; });   // interruptor apagado: se libera esa malla y vuelve la lámina; un personaje 3D que ya no está en este mapa no se dibuja
    Object.keys(E.glb || {}).forEach((k) => { const o = E.glb[k]; if (o.r && o.uso !== E.glbF) o.r.raiz.visible = false; });
    for (let i = n; i < E.pool.length; i++) E.pool[i].mesh.visible = E.pool[i].sombra.visible = false;
    return nombres;
  }
  // v2.194: manchas y ondas de la pesca como calcomanías translúcidas con textura suave generada por código (degradado radial con contorno orgánico y anillo suave); una rejilla de 5×5 vértices por calcomanía sigue la altura de las olas
  const DEC_MAX = 24, DEC_N = 4;
  function decales(ds, reloj) {
    const Th = E.Th, n = Math.min(ds.length, DEC_MAX), V = (DEC_N + 1) * (DEC_N + 1);
    if (!E.pescaD) {
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const cx = cv.getContext('2d'), im = cx.createImageData(128, 64), sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
      for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) { const ring = x >= 64, dx = ((ring ? x - 64 : x) + 0.5 - 32) / 32, dy = (y + 0.5 - 32) / 32, r = Math.hypot(dx, dy), th = Math.atan2(dy, dx); let a;
        if (!ring) { const rr = r / (1 + 0.08 * Math.sin(2 * th + 0.7) + 0.05 * Math.sin(3 * th + 2.1)); a = rr >= 1 ? 0 : Math.pow(1 - rr * rr, 2.2); }
        else a = Math.exp(-Math.pow((r - 0.8) / 0.11, 2)) * (1 - sm(0.9, 1, r));
        const k = (y * 128 + x) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = Math.round(a * 255); }
      cx.putImageData(im, 0, 0); const tex = new Th.CanvasTexture(cv); tex.minFilter = Th.LinearFilter; tex.magFilter = Th.LinearFilter; tex.generateMipmaps = false;
      const pos = new Float32Array(DEC_MAX * V * 3), uv = new Float32Array(DEC_MAX * V * 2), alfa = new Float32Array(DEC_MAX * V), col = new Float32Array(DEC_MAX * V * 3), idx = [];
      for (let d = 0; d < DEC_MAX; d++) for (let j = 0; j < DEC_N; j++) for (let i = 0; i < DEC_N; i++) { const a = d * V + j * (DEC_N + 1) + i, b = a + 1, c = a + DEC_N + 1, e = c + 1; idx.push(a, c, b, b, c, e); }
      const g = new Th.BufferGeometry(), aP = new Th.BufferAttribute(pos, 3), aU = new Th.BufferAttribute(uv, 2), aA = new Th.BufferAttribute(alfa, 1), aC = new Th.BufferAttribute(col, 3);
      if (Th.DynamicDrawUsage) [aP, aU, aA, aC].forEach((q) => q.setUsage && q.setUsage(Th.DynamicDrawUsage));
      g.setAttribute('position', aP); g.setAttribute('uv', aU); g.setAttribute('aAlfa', aA); g.setAttribute('aCol', aC); g.setIndex(idx);
      const mat = new Th.ShaderMaterial({ uniforms: { mapa: { value: tex } }, transparent: true, depthWrite: false, side: Th.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: 'attribute vec3 aCol; attribute float aAlfa; varying vec2 vUv; varying vec3 vC; varying float vA; void main() { vUv = uv; vC = aCol; vA = aAlfa; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform sampler2D mapa; varying vec2 vUv; varying vec3 vC; varying float vA; void main() { gl_FragColor = vec4(vC, texture2D(mapa, vUv).a * vA); }' });
      const mesh = new Th.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 10; E.scene.add(mesh); E.pescaD = { mesh, g, aP, aU, aA, aC, pos, uv, alfa, col };
    }
    const D = E.pescaD, A = E.aguaReal, base = (A && A.y0 !== null ? A.y0 : ALT['~']) + 0.01;
    for (let d = 0; d < n; d++) { const q = ds[d]; for (let j = 0; j <= DEC_N; j++) for (let i = 0; i <= DEC_N; i++) { const o = d * V + j * (DEC_N + 1) + i, u = i / DEC_N, w = j / DEC_N, x = q.x + (u - 0.5) * 2 * q.hx, z = q.z + (w - 0.5) * 2 * q.hz;
      D.pos[o * 3] = x; D.pos[o * 3 + 1] = base + (A && A.ola ? A.ola(x, z) : 0) + 0.03; D.pos[o * 3 + 2] = z; D.uv[o * 2] = (q.k ? 0.5 : 0) + 0.004 + u * 0.492; D.uv[o * 2 + 1] = w; D.alfa[o] = q.a; D.col[o * 3] = q.c[0]; D.col[o * 3 + 1] = q.c[1]; D.col[o * 3 + 2] = q.c[2]; } }
    [D.aP, D.aU, D.aA, D.aC].forEach((a) => { a.needsUpdate = true; }); if (D.g.setDrawRange) D.g.setDrawRange(0, n * DEC_N * DEC_N * 6); D.mesh.visible = n > 0;
  }
  // v2.200: los peces dibujados a mano (`sprite3d`) son una lámina con su dibujo (textura nítida) que siempre mira a la cámara; se vuelve según el sentido en que nadan respecto a la pantalla y se inclina con el salto. Una lámina por jugador pescando.
  function pezSprites(lista) {
    const Th = E.Th; if (!E.pezS) E.pezS = { pool: [], tex: {} };
    const P = E.pezS, d = new Th.Vector3(); E.cam.getWorldDirection(d); const hl = Math.hypot(d.x, d.z) || 1, rx = -d.z / hl, rz = d.x / hl, PX = 0.032;
    lista.forEach((q, i) => {
      const fr = Math.floor(q.fase) % 2 ? 1 : 0, key = q.id + fr; let t = P.tex[key];
      if (!t) { const m = G.pesca.matriz(q.id, fr), c = root.document.createElement('canvas'); c.width = m.w; c.height = m.h; const x = c.getContext('2d'); m.px.forEach((fila, yy) => fila.forEach((col, xx) => { if (col) { x.fillStyle = col; x.fillRect(xx, yy, 1, 1); } })); t = P.tex[key] = { tex: pixelart(c), w: m.w, h: m.h }; }
      let o = P.pool[i]; if (!o) { o = P.pool[i] = new Th.Mesh(new Th.PlaneGeometry(1, 1), new Th.MeshBasicMaterial({ transparent: true, alphaTest: 0.5, side: Th.DoubleSide })); o.frustumCulled = false; E.scene.add(o); }
      o.material.map = t.tex; o.material.needsUpdate = true; o.visible = true; o.position.set(q.x, q.y, q.z); o.quaternion.copy(E.cam.quaternion);
      if (q.colgado && G.PECES[q.id].colgar === 'erguido') { o.scale.set(t.w * PX, t.h * PX, 1); o.position.set(q.x, q.y - t.h * PX / 2, q.z); o.material.opacity = q.sumergido ? 0.6 : 1; }   // v2.210: Pulpo, cuelga derecho de lo alto del cuerpo
      else if (q.colgado) { o.scale.set(t.w * PX, t.h * PX, 1); o.rotateZ(Math.PI / 2); o.position.set(q.x, q.y - t.w * PX / 2, q.z); o.material.opacity = q.sumergido ? 0.6 : 1; }   // v2.203: colgado del hilo, cabeza arriba (la boca en el extremo del hilo)
      else { o.material.opacity = 1; o.scale.set((t.w * PX) * ((q.rx * rx + q.rz * rz) >= 0 ? 1 : -1), t.h * PX, 1); o.rotateZ(((q.rx * rx + q.rz * rz) >= 0 ? -1 : 1) * q.pitch * 0.5); }
    });
    for (let i = lista.length; i < P.pool.length; i++) P.pool[i].visible = false;
  }
  function pescas3d(f) {   // v2.181 (Pesca 2-4): caña, hilo, corcho, ondas y pez que salta, en UNA malla dinámica (src/pesca3d.js) que solo se dibuja mientras alguien pesca; si algo falla se apaga y el 2D sigue entero
    const lista = [], marcas = []; if (f.me && G.pesca3d && !E.pescaOff) {
      f.jugadores.forEach((j) => { if (j.pesca) { const v = G.vista.pesca(j, f.reloj); if (v) { const k3 = id3d(j), o3 = k3 && E.p3d && E.p3d[k3]; lista.push({ x: j.x / T, y: altEn(E.M, j.x, j.y), z: j.y / T, v, reloj: f.reloj, mano: o3 && o3.mano || null }); } } });
      const yo = f.yo; if (yo && E.M.pesca) E.M.pesca.forEach((p) => {   // v2.184: marca de los puntos a menos de 3,5 casillas (como en el 2D): se atenúa con la distancia, se apaga al pescar ahí y queda tenue al pisar la casilla
        if ((yo.pesca && yo.pesca.id === p.id) || marcas.length >= G.pesca3d.MAX_MARCAS) return; const d = Math.hypot(p.x * T + 8 - yo.x, p.y * T + 8 - yo.y), a = Math.max(0, Math.min(1, (56 - d) / 16)) * (Math.floor(yo.x / T) === p.x && Math.floor(yo.y / T) === p.y ? 0.6 : 1);
        if (a > 0) marcas.push({ x: p.x + 0.5, y: altEn(E.M, p.x * T + 8, p.y * T + 8), z: p.y + 0.5, k: Math.max(0.35, a), reloj: f.reloj }); }); }
    if (!lista.length && !marcas.length) { if (E.pesca) E.pesca.mesh.visible = false; if (E.pescaD) E.pescaD.mesh.visible = false; if (E.pezS) E.pezS.pool.forEach((o) => { o.visible = false; }); return; }
    try {
      const r = G.pesca3d.build(lista, ALT['~'] + 0.045, marcas);
      if (!E.pesca) { const Th = E.Th, cap = 2 * G.pesca3d.MAX_POR_JUGADOR + G.pesca3d.MARCA_QUADS * G.pesca3d.MAX_MARCAS + 8, pos = new Float32Array(cap * 12), col = new Float32Array(cap * 12), idx = [], g = new Th.BufferGeometry(), aP = new Th.BufferAttribute(pos, 3), aC = new Th.BufferAttribute(col, 3);
        for (let i = 0; i < cap; i++) idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
        if (aP.setUsage && Th.DynamicDrawUsage) { aP.setUsage(Th.DynamicDrawUsage); aC.setUsage(Th.DynamicDrawUsage); }
        g.setAttribute('position', aP); g.setAttribute('color', aC); g.setIndex(idx);
        const mesh = new Th.Mesh(g, new Th.MeshBasicMaterial({ vertexColors: true, side: Th.DoubleSide })); mesh.frustumCulled = false; E.scene.add(mesh); E.pesca = { mesh, g, aP, aC, pos, col, cap }; }
      const P = E.pesca; if (r.n > P.cap) throw new Error('pesca 3D: demasiadas caras');
      decales(r.decals || [], f.reloj); pezSprites(r.sprites || []);
      P.pos.set(r.pos); P.col.set(r.col); P.aP.needsUpdate = true; P.aC.needsUpdate = true; if (P.g.setDrawRange) P.g.setDrawRange(0, r.n * 6); P.mesh.visible = true;
    } catch (err) { E.pescaOff = true; if (E.pesca) E.pesca.mesh.visible = false; if (E.pescaD) E.pescaD.mesh.visible = false; if (E.pezS) E.pezS.pool.forEach((o) => { o.visible = false; }); }
  }
  function rioReal(reloj) { const R = E.rio; if (!R) return; G.rio3d.animar(R.mo, reloj); R.aP.needsUpdate = true; }
  function aguaReal(reloj) {   // olas de verdad: altura = suma de 3 senos; normal exacta por derivadas; color = profundidad (claro en la orilla, hondo en el centro) + cresta más clara
    const A = E.aguaReal; if (!A) return; const t = reloj * A.v,  N = A.N, pos = A.pos, nor = A.nor, col = A.col, D = A.D, M = A.M, s = (v) => Math.max(0, Math.min(1, v));
    const PV = G.agua3d.PAL_VOL || {}, C0 = PV.c0 || [0.50, 0.82, 1.0], C1 = PV.c1 || [0.10, 0.50, 0.98], C2 = PV.c2 || [0.04, 0.28, 0.80];   // C «azul vivo» (elegida al final); la B «azul cielo» está en G.agua3d.PALETAS   // PAL_VOL: solo para probar paletas
    const dt = (i, j) => { i = Math.max(0, Math.min(M.W - 1, i)); j = Math.max(0, Math.min(M.H - 1, j)); return D[j] && D[j][i] > 0 ? D[j][i] : 0.3; };
    const prof = (x, z) => { const fx = x - 0.5, fz = z - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j; return (dt(i, j) * (1 - u) + dt(i + 1, j) * u) * (1 - w) + (dt(i, j + 1) * (1 - u) + dt(i + 1, j + 1) * u) * w; };   // profundidad interpolada entre centros de casilla: degradado continuo, sin bandas
    A.ola = (x, z) => { const d0 = prof(x, z), amp = (0.007 + 0.011 * s((d0 - 0.5) / 2)) * A.k; return amp * (Math.sin(x * 3.1 + t * 1.15) + Math.sin(z * 2.6 - t * 0.95) + 0.5 * Math.sin((x + z) * 5.3 + t * 1.9) + 0.4 * Math.sin((x - z) * 4.1 - t * 1.4)); };   // v2.194: altura de la ola en un punto (la misma fórmula que la malla) para que las manchas de la pesca suban y bajen con el agua
    for (let k = 0; k < pos.length; k += 3) {
      const x = pos[k], z = pos[k + 2], tx = Math.min(M.W - 1, Math.floor(x)), tz = Math.min(M.H - 1, Math.floor(z)), d0 = prof(x, z), amp = (0.007 + 0.011 * s((d0 - 0.5) / 2)) * A.k;
      const a1 = x * 3.1 + t * 1.15, a2 = z * 2.6 - t * 0.95, a3 = (x + z) * 5.3 + t * 1.9, a4 = (x - z) * 4.1 - t * 1.4;
      const y = amp * (Math.sin(a1) + Math.sin(a2) + 0.5 * Math.sin(a3) + 0.4 * Math.sin(a4)), dx = amp * (3.1 * Math.cos(a1) + 5.3 * 0.5 * Math.cos(a3) + 4.1 * 0.4 * Math.cos(a4)), dz = amp * (2.6 * Math.cos(a2) + 5.3 * 0.5 * Math.cos(a3) - 4.1 * 0.4 * Math.cos(a4));
      pos[k + 1] = (A.y0 !== null ? A.y0 : alt(M, tx, tz)) + 0.01 + y; const l = Math.hypot(dx, 1, dz); nor[k] = -dx / l; nor[k + 1] = 1 / l; nor[k + 2] = -dz / l;
      const v = s((d0 - 0.4) / 2.2), c = v < 0.5 ? C0.map((q, i) => q + (C1[i] - q) * v * 2) : C1.map((q, i) => q + (C2[i] - q) * (v - 0.5) * 2), br = 1 + y * 3;
      let e = 0; if (A.y0 !== null) e = s((1.0 - d0) / 0.5) * (0.78 + 0.22 * Math.sin(t * 1.3 + x * 3.1 + z * 2.3));   // v2.172c: orilla — franja clara y espuma que «respira» donde el agua toca tierra (d0 pequeño = junto a la orilla)
      col[k] = (c[0] * br * A.g) * (1 - e) + 1.25 * e; col[k + 1] = (c[1] * br * A.g) * (1 - e) + 1.3 * e; col[k + 2] = (c[2] * br * A.g) * (1 - e) + 1.35 * e;
    }
    A.uT.value = reloj;
    A.aP.needsUpdate = A.aN.needsUpdate = A.aC.needsUpdate = true;
  }
  function camara(f) {
    const v = E.vista, j = f.yo, cp = Math.cos(PITCH), M = E.M;
    if (j && f.me) { v.tx += (j.x / T - v.tx) * 0.25; v.tz += (j.y / T - v.tz) * 0.25; if (Math.abs(j.x / T - v.tx) < 0.01) v.tx = j.x / T; if (Math.abs(j.y / T - v.tz) < 0.01) v.tz = j.y / T; }
    v.tx = Math.max(0, Math.min(M.W, v.tx)); v.tz = Math.max(0, Math.min(M.H, v.tz));
    const dy = v.yawT - v.yaw, dd = v.distT - v.dist; v.yaw += Math.abs(dy) > 0.001 ? dy * 0.2 : dy; v.dist += Math.abs(dd) > 0.01 ? dd * 0.2 : dd;
    E.cam.position.set(v.tx + Math.sin(v.yaw) * cp * v.dist, Math.sin(PITCH) * v.dist, v.tz + Math.cos(v.yaw) * cp * v.dist); E.cam.lookAt(v.tx, 0.4, v.tz);
    if (typeof f.noche === 'number' && !/[?&]farolas=1/.test((root.location && root.location.search) || '')) G.luzFarolas.AJUSTES.NOCHE = f.noche;   // v2.244: las farolas se encienden con el ciclo de día y noche (src/ciclo.js)
    luzFarolas(v.yaw);
    E.carteles.forEach((m) => { m.rotation.y = v.yaw; }); // los carteles (edificios, farolas…) miran a la cámara; las vallas y lo tumbado no
  }

  // material de un edificio con la trama: mismo MeshBasicMaterial de siempre más tres uniformes (uVis, uCorte, uBloque) y un «varying» con la altura local; si el shader no se pudiera compilar basta poner AJUSTES.OCLUSION = false
  function ocluible(Th, tx, u) {
    const m = new Th.MeshBasicMaterial({ map: tx, alphaTest: 0.5 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uVis = u.uVis; sh.uniforms.uCorte = u.uCorte; sh.uniforms.uBloque = u.uBloque;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vAltura;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAltura = position.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAltura;\nuniform float uVis;\nuniform float uCorte;\nuniform float uBloque;').replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\n' + GLSL_TRAMA);
    };
    m.customProgramCacheKey = () => 'trama_ocluible';
    return m;
  }
  // oclusión (paso E1): para cada edificio con tejado mira si tapa a algún jugador o criatura desde la cámara y acerca su `vis` a la meta en medio segundo
  // v2.198: oclusión de los árboles 3D (como los edificios): si la copa de un árbol queda entre la cámara y un jugador o criatura, se atenúa con la misma trama en medio segundo; la trama va por vértice (`aVis`)
  function ocluirArboles(f, dt) {
    if (!E.arb3 || !E.arb3.length || !f.me) return;
    const cp = E.cam.position, cam = [cp.x, cp.y, cp.z], pts = [], on = AJUSTES.OCLUSION && AJUSTES.OCLUSION_ARBOLES; let cambio = false;
    if (on) { f.jugadores.forEach((j) => pts.push({ x: j.x / T, y: altEn(E.M, j.x, j.y), z: j.y / T })); f.criaturas.forEach((c) => pts.push({ x: c.x / T, y: altEn(E.M, c.x, c.y), z: c.y / T })); }
    E.arbUb.value = Math.max(1, Math.round(2 * E.R.getPixelRatio()));
    E.arb3.forEach((it) => {
      let meta = 1;
      if (on) for (const q of pts) { if (Math.abs(q.x - it.x) > 7 || Math.abs(q.z - it.z) > 7) continue; let t = false;
        for (const h of [0.3, 1.1]) { const A = [q.x, q.y + h, q.z], len = Math.hypot(A[0] - cam[0], A[1] - cam[1], A[2] - cam[2]) || 1, u0 = Math.max(0, 1 - 5 / len); for (let k = 1; k <= 50 && !t; k++) { const u = u0 + (1 - u0) * (k / 52), X = cam[0] + (A[0] - cam[0]) * u, Y = cam[1] + (A[1] - cam[1]) * u, Z = cam[2] + (A[2] - cam[2]) * u; if (Y > it.y + it.troncoH && Y < it.y + it.alto && Math.hypot(X - it.x, Z - it.z) < it.r * 0.9) t = true; } if (t) break; }
        if (t) { meta = AJUSTES.VIS_TAPADO; break; } }
      const nv = acercar(it.vis, meta, dt, AJUSTES.SEGUNDOS); if (nv !== it.vis) { it.vis = nv; cambio = true; for (let k = 0; k < it.nv; k++) E.arbVis[it.v0 + k] = nv; } });
    if (cambio) E.arbGeo.getAttribute('aVis').needsUpdate = true;
  }
  function ocluir(f, dt) {
    if (!E.edificios || !E.edificios.length || !f.me) return;
    if (!AJUSTES.OCLUSION) { E.edificios.forEach((ed) => { if (ed.vis !== 1) { ed.vis = ed.meta = 1; ed.u.uVis.value = ed.uAlto.uVis.value = 1; } }); return; } // interruptor apagado: todo vuelve a verse entero
    const puntos = []; f.jugadores.forEach((j) => puntos.push({ x: j.x / T, y: altEn(E.M, j.x, j.y), z: j.y / T })); f.criaturas.forEach((c) => puntos.push({ x: c.x / T, y: altEn(E.M, c.x, c.y), z: c.y / T }));
    const cp = E.cam.position, cam = [cp.x, cp.y, cp.z], bloque = Math.max(1, Math.round(2 * E.R.getPixelRatio()));
    E.edificios.forEach((ed) => {
      ed.meta = tapado(ed, cam, puntos) ? AJUSTES.VIS_TAPADO : 1; ed.vis = acercar(ed.vis, ed.meta, dt, AJUSTES.SEGUNDOS);
      [ed.u, ed.uAlto].forEach((u) => { u.uVis.value = ed.vis; u.uBloque.value = bloque; });
    });
  }
  // v2.93 (F3): partículas del HD-2D = UNA malla de cuadritos de 1/16 u (humo de las chimeneas, gotas y salpicaduras de la fuente redonda, destellos del agua y hojas). Lo que hay en cada cuadro lo calcula lo puro (src/particulas3d.js, 4 cuadros por segundo con el reloj visual);
  // aquí solo se reparten los vértices (los cuadritos verticales miran a la cámara, así que se recolocan cada cuadro) y se cambia el rango de dibujo. +1 llamada de dibujo. Interruptor: AJUSTES.PARTICULAS.
  function crearParticulas(Th) {
    const P3 = G.particulas3d; if (!P3) return null; const max = P3.AJUSTES.MAX_PIXELES, g = new Th.BufferGeometry();
    g.setAttribute('position', new Th.Float32BufferAttribute(new Float32Array(max * 12), 3)); g.setAttribute('color', new Th.Float32BufferAttribute(new Float32Array(max * 12), 3)); g.setIndex(P3.indices(max)); g.setDrawRange(0, 0);
    const mat = new Th.MeshBasicMaterial({ vertexColors: true, side: Th.DoubleSide }), mesh = new Th.Mesh(g, mat); mesh.frustumCulled = false; mesh.visible = false;   // sin frustumCulled: la esfera de la malla se calcularía con los vértices del primer cuadro
    return { g, mat, mesh, n: -1, M: null, tx: 0, tz: 0, lista: [], cuadritos: 0 };
  }
  function particulas() {
    const P = E.part; if (!P) return; const A = G.particulas, v = E.vista;
    if (!AJUSTES.PARTICULAS || !A || !A.activo(E.M)) { P.mesh.visible = false; P.lista = []; P.cuadritos = 0; P.n = -1; return; }
    const n = A.cuadro();
    if (n !== P.n || E.M !== P.M || Math.hypot(v.tx - P.tx, v.tz - P.tz) > 3) { // lo calculado se repite si cambia el cuadro del reloj, el mapa o la cámara se aleja 3 casillas
      const r = Math.max(G.particulas3d.AJUSTES.RADIO_MIN, v.dist * 0.8) * T;
      P.lista = G.particulas3d.pixeles(E.M, n, { x0: v.tx * T - r, x1: v.tx * T + r, y0: v.tz * T - r, y1: v.tz * T + r }); P.n = n; P.M = E.M; P.tx = v.tx; P.tz = v.tz;
    }
    const pos = P.g.getAttribute('position'), col = P.g.getAttribute('color');
    const lis = E.chis && G.criatura3d && G.criatura3d.chispas ? P.lista.concat(G.criatura3d.chispas(n, E.chis.fase, E.chis.yaw, E.chis.o)) : P.lista;
    P.cuadritos = G.particulas3d.armar(lis, v.yaw, pos.array, col.array); pos.needsUpdate = col.needsUpdate = true; P.g.setDrawRange(0, P.cuadritos * 6); P.mesh.visible = P.cuadritos > 0;
  }
  // v2.272 · efectos del combate: una malla de cuadritos de píxel (src/combate_fx.js), con tope fijo; solo se arma mientras hay combate
  function combateFx3d(f) {
    const v = f.combate, P3 = G.particulas3d, FX = G.combateFx; if (!v || !P3 || !FX) { if (E.cfx) E.cfx.mesh.visible = false; return; }
    if (!E.cfx) { const Th = E.Th, g = new Th.BufferGeometry(); g.setAttribute('position', new Th.Float32BufferAttribute(new Float32Array(FX.TOPE * 12), 3)); g.setAttribute('color', new Th.Float32BufferAttribute(new Float32Array(FX.TOPE * 12), 3)); g.setIndex(P3.indices(FX.TOPE)); g.setDrawRange(0, 0);
      const mat = new Th.MeshBasicMaterial({ vertexColors: true, side: Th.DoubleSide }), mesh = new Th.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 12; E.scene.add(mesh); E.cfx = { g, mat, mesh }; }
    const h0 = altEn(E.M, v.ax, v.ay), lis = FX.cuadritos(v, f.reloj, h0), pos = E.cfx.g.getAttribute('position'), col = E.cfx.g.getAttribute('color');
    const n = P3.armar(lis, E.vista.yaw, pos.array, col.array); pos.needsUpdate = col.needsUpdate = true; E.cfx.g.setDrawRange(0, n * 6); E.cfx.mesh.visible = n > 0; E.st.combateCuadritos = n;
  }
  // v2.274 · los 56 efectos diseñados (src/combate_fx_pro.js): cada movimiento arranca su escena de 128×80 px al empezar el lanzamiento y se pinta en dos láminas (color y luz aditiva) sobre la arena.
  // Escena = arena (160 u × 0,8 px/u = 128 px); si lanza el bando derecho, la escena se refleja. Los actores (lanzador/objetivo) devuelven desplazamiento y escala que aplica `entidades`.
  const PRO_STEP = 1 / 120;
  function proCrear(Th, espejo) {
    const F = G.fxPro, mk = (add) => { const c = G.makeCanvas(F.W, F.H), tex = new Th.CanvasTexture(c); tex.magFilter = tex.minFilter = Th.NearestFilter; tex.generateMipmaps = false;
      const mat = new Th.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, side: Th.DoubleSide, blending: add ? Th.AdditiveBlending : Th.NormalBlending }), mesh = new Th.Mesh(E.gVert, mat);
      mesh.renderOrder = add ? 14 : 13; mesh.frustumCulled = false; mesh.visible = false; E.scene.add(mesh); const cx = c.getContext('2d'), im = cx.createImageData(F.W, F.H); return { c, tex, mat, mesh, cx, im, i32: new Uint32Array(im.data.buffer) }; };
    return { espejo, P: new F.Painter(), col: mk(false), luz: mk(true), inst: [] };
  }
  function proSprite(forma, dir) {
    const k = forma + '|' + dir; E.proSp = E.proSp || {}; if (E.proSp[k]) return E.proSp[k]; const s = G.creatureSprite(forma, dir, 0); if (!s) return null;
    const cv = s.c || s.canvas || s, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height); return (E.proSp[k] = { w: cv.width, h: cv.height, data: new Uint32Array(d.data.buffer) });
  }
  function combateProFx(f) {
    const v = f.combate, F = G.fxPro; E.proAct = {};
    if (!F || !v || !E.Th) { if (E.pro) E.pro.forEach((q) => { q.col.mesh.visible = q.luz.mesh.visible = false; q.inst = []; }); E.proVistos = null; return; }
    if (!E.pro) { E.pro = [proCrear(E.Th, false), proCrear(E.Th, true)]; E.proVistos = new Set(); E.proT = f.reloj; }
    if (!E.proVistos) { E.proVistos = new Set(); E.proT = f.reloj; }
    const U = {}; v.unidades.forEach((u) => { U[u.id] = u; }); const x0 = v.ax - F.W / 2, dt = Math.max(0, Math.min(0.05, f.reloj - E.proT)); E.proT = f.reloj;
    v.ev.forEach((e) => {
      if (e.e !== 'inicio' || !F.tiene(e.mov)) return; const key = e.t + '|' + e.id + '|' + e.mov; if (E.proVistos.has(key) || v.tick - e.t > 6) return; E.proVistos.add(key);
      const c = U[e.id]; if (!c) return; let t = e.obj ? U[e.obj] : null; if (!t || t === c) t = v.unidades.find((q) => q.side !== c.side && !q.ko) || c;   // v2.310: las defensas/apoyos propios apuntan a la propia criatura; el efecto debe orientarse hacia el RIVAL (si no, el muro de la criatura de la derecha salía a su espalda)
      const esp = c.x > t.x, sx = (u) => { const q = u.x - x0; return esp ? F.W - q : q; }, q = E.pro[esp ? 1 : 0];
      const inst = F.crear(e.mov, { semilla: (e.t * 7919 + e.mov.length * 131 + c.w) >>> 0, from: { x: sx(c), w: c.w, h: c.h }, to: { x: sx(t), w: t.w, h: t.h }, sprites: { caster: proSprite(c.forma, 'right'), target: proSprite(t.forma, 'left') } });
      q.inst.push({ inst, cid: c.id, tid: t.id, frz: 0, ac: 0, acc: 0 });
    });
    const h0 = altEn(E.M, v.ax, v.ay), Tn = T;
    E.pro.forEach((q) => {
      q.inst.forEach((o) => { o.acc += dt; let n = 0; while (o.acc >= PRO_STEP && n < 12) { o.acc -= PRO_STEP; n++; if (o.frz > 0) { o.frz -= PRO_STEP; continue; } o.inst.update(PRO_STEP); if (o.inst.stop > 0) o.frz = o.inst.stop; } });
      q.inst = q.inst.filter((o) => !(o.inst.dur && o.inst.timeNow() >= o.inst.dur + 0.4));
      q.inst.forEach((o) => { [['caster', o.cid], ['target', o.tid]].forEach(([rol, id]) => { const a = o.inst.actor(rol); if (!E.proAct[id]) E.proAct[id] = { dx: a.dx * (q.espejo ? -1 : 1), dy: a.dy, sx: a.sx, sy: a.sy }; }); });
      const on = q.inst.length > 0; q.col.mesh.visible = q.luz.mesh.visible = on; if (!on) return;
      const P = q.P, W = F.W, H = F.H; P.clear(); q.inst.forEach((o) => { o.inst.draw(P, 'back'); o.inst.draw(P, 'front'); });
      const c32 = q.col.i32, l32 = q.luz.i32, col = P.color, lt = P.light, dk = P.dk;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, j = y * W + (q.espejo ? W - 1 - x : x); let c = col[i]; if (!(c >>> 24)) c = dk[i] > 0 ? (((dk[i] * 150) | 0) << 24) >>> 0 : 0; c32[j] = c;
        const k = i * 3, r = lt[k] > 255 ? 255 : lt[k], g = lt[k + 1] > 255 ? 255 : lt[k + 1], b = lt[k + 2] > 255 ? 255 : lt[k + 2]; l32[j] = (0xff000000 | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0; }
      [q.col, q.luz].forEach((m) => { m.cx.putImageData(m.im, 0, 0); m.tex.needsUpdate = true; m.mesh.scale.set(W / Tn, H / Tn, 1); m.mesh.position.set(v.ax / Tn, h0 - (H - F.GY) / Tn, v.ay / Tn); m.mesh.rotation.y = E.vista.yaw; });
    });
    E.st.proInst = E.pro[0].inst.length + E.pro[1].inst.length;
  }
  function combateUI(f) {   // barras de vida y de especial, números de daño, nombre de la reacción y rótulo final, en el lienzo #ui (después de los nombres)
    const v = f.combate, FX = G.combateFx; if (!v || !FX) return;
    const ui = E.host.ui, ctx = ui.getContext('2d'), dpr = root.devicePixelRatio || 1, u = Math.max(2, Math.round(1.5 * dpr)), h0 = altEn(E.M, v.ax, v.ay);
    FX.ui(v).forEach((it) => {
      if (it.t === 'final') { const w = G.pixelTextWidth(it.txt, u * 2); G.drawPixelText(ctx, it.txt, Math.round((ui.width - w) / 2), Math.round(ui.height * 0.22), u * 2, '#fff9ee', '#2a1b30'); return; }
      E.vec.set(it.x / T, h0 + it.h / T, it.y / T).project(E.cam); if (E.vec.z > 1) return; const sx = (E.vec.x * 0.5 + 0.5) * ui.width, sy = (-E.vec.y * 0.5 + 0.5) * ui.height;
      if (it.t === 'barra') {
        const bw = Math.round(30 * dpr), bh = Math.max(3, Math.round(4 * dpr)), x = Math.round(sx - bw / 2), y = Math.round(sy - bh);
        ctx.fillStyle = '#2a1b30'; ctx.fillRect(x - 1, y - 1, bw + 2, bh + 2); ctx.fillStyle = '#5b4a63'; ctx.fillRect(x, y, bw, bh); ctx.fillStyle = it.hpF > 0.5 ? '#6fdc8c' : it.hpF > 0.25 ? '#f7d54a' : '#e0524a'; ctx.fillRect(x, y, Math.round(bw * it.hpF), bh);
        if (it.med !== null) { const my = y + bh + 2, mh = Math.max(2, Math.round(2.5 * dpr)); ctx.fillStyle = '#2a1b30'; ctx.fillRect(x - 1, my - 1, bw + 2, mh + 2); ctx.fillStyle = it.med >= 100 ? '#ffd84a' : '#4aa3e8'; ctx.fillRect(x, my, Math.round(bw * Math.min(1, it.med / 100)), mh); }
        const w = G.pixelTextWidth(it.nom, u); G.drawPixelText(ctx, it.nom, Math.round(sx - w / 2), y - G.PIXEL_TEXT_HEIGHT * u - 2, u, '#fff9ee', '#2a1b30');
      } else { ctx.globalAlpha = Math.max(0, it.a); const k = it.t === 'num' ? (it.crit ? 2 : 1) : 1, w = G.pixelTextWidth(it.txt, u * k); G.drawPixelText(ctx, it.txt, Math.round(sx - w / 2), Math.round(sy), u * k, it.t === 'reac' ? '#ffd84a' : it.crit ? '#ffd84a' : '#fff9ee', '#2a1b30'); ctx.globalAlpha = 1; }
    });
  }
  function placas(nombres) { // nombres sobre las criaturas: la misma letra de píxel del 2D (src/font.js) en el lienzo #ui, colocados con la proyección de la cámara
    const ui = E.host.ui, ctx = ui.getContext('2d'), dpr = root.devicePixelRatio || 1, u = Math.max(2, Math.round(1.5 * dpr)), puestos = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ui.width, ui.height);
    nombres.sort((a, b) => a.x - b.x).forEach((p) => {
      E.vec.set(p.x / T, p.h + 0.15, p.y / T).project(E.cam); if (E.vec.z > 1) return;
      const sx = (E.vec.x * 0.5 + 0.5) * ui.width, sy = (-E.vec.y * 0.5 + 0.5) * ui.height, w = G.pixelTextWidth(p.nombre, u), h = G.PIXEL_TEXT_HEIGHT * u, x = Math.round(sx - w / 2);
      let y = Math.round(sy - h);
      while (puestos.some((r) => x < r.x + r.w + u && x + w + u > r.x && y < r.y + h + 2 * u && y + h + 2 * u > r.y)) y -= h + 2 * u;
      puestos.push({ x, y, w }); if (x + w < 0 || x > ui.width || y + h < 0 || y > ui.height) return;
      G.drawPixelText(ctx, p.nombre, x, y, u, '#fff9ee', '#2a1b30');
    });
  }
  function vigilar() { // si el HD-2D va a menos de ~18 cuadros por segundo de forma sostenida, se pide volver al 2D (el host apaga este pintor: después de pedirlo no se toca más E)
    const t = (root.performance || Date).now(); let mal = false;
    if (E.ultimo) { E.cuadros++; if (E.cuadros > 90) E.dts.push(t - E.ultimo); if (E.dts.length >= 120) { E.avisos = lento(E.dts) ? E.avisos + 1 : 0; E.dts = []; if (E.avisos >= 2) { E.avisos = 0; mal = true; } } }
    E.ultimo = t; if (mal) E.host.alFallar('el HD-2D iba lento');
  }
  function ajustar() {
    if (!E) return; const { w, h } = E.host.tam(), pr = E.R.getPixelRatio();
    if (E.cv.width !== Math.round(w * pr) || E.cv.height !== Math.round(h * pr) || E.cv.style.width !== w + 'px') { E.R.setSize(w, h, false); E.cv.style.width = w + 'px'; E.cv.style.height = h + 'px'; E.cam.aspect = w / h; E.cam.updateProjectionMatrix(); }
  }

  G.hd2d = {
    CDN, ZOOMS, ALT, AJUSTES, GLSL_TRAMA, esOli, id3d, alt, altEn, plan, lento, elegido, recordar, acercar, tapado,
    get activo() { return !!E; },
    proyectar(tx, ty) { if (!E) return null; const t = E.host.tam(), v = E.vec.set(tx + 0.5, 0.4, ty + 0.5).project(E.cam), k = v.z > 1 ? -1 : 1; return { x: (k * v.x * 0.5 + 0.5) * t.w, y: (-k * v.y * 0.5 + 0.5) * t.h, w: t.w, h: t.h }; }, // v2.75: casilla → px CSS de la vista (para la flecha del mapa grande); detrás de la cámara se invierte para que la flecha apunte hacia ahí
    activar(host) { // → { ok } o { ok: false, motivo }; nunca lanza: si algo falla se queda en 2D
      if (E) return Promise.resolve({ ok: true });
      return cargarThree().then((hay) => {
        if (!hay) return { ok: false, motivo: 'No se pudo cargar el HD-2D (hace falta internet): sigues en 2D' };
        try { iniciar(host); ajustar(); return { ok: true }; } catch (e) { G.hd2d.desactivar(); return { ok: false, motivo: 'Este móvil no puede dibujar el HD-2D: sigues en 2D' }; }
      });
    },
    desactivar() { if (!E) return; try { quitarG(); Object.keys(E.p3d || {}).forEach(quitar3d); if (E.pesca) { E.scene.remove(E.pesca.mesh); E.pesca.g.dispose(); E.pesca = null; } limpiar(); E.pool.forEach((p) => { E.scene.remove(p.mesh); E.scene.remove(p.sombra); p.mesh.material.dispose(); }); E.tex.forEach((t) => t.dispose()); [E.gVert, E.gPlano, E.gSombra].forEach((g) => g.dispose()); E.mSombra.dispose(); Object.values(E.mSombraK).forEach((m) => m.dispose()); E.vacio.dispose(); if (E.part) { E.scene.remove(E.part.mesh); E.part.g.dispose(); E.part.mat.dispose(); } if (E.cfx) { E.scene.remove(E.cfx.mesh); E.cfx.g.dispose(); E.cfx.mat.dispose(); } E.R.dispose(); E.cv.remove(); const ui = E.host.ui; if (ui) ui.getContext('2d').clearRect(0, 0, ui.width, ui.height); } catch (e) { /* ya está apagado */ } E = null; },
    ajustar,
    reconstruir() { if (E) { E.M = null; } }, // tras encender o apagar «Sombras»: el suelo horneado cambió; se rehace en el siguiente cuadro
    dibujar() { // un cuadro: lee el motor (vía host.estado) y G.vista; no cambia nada del mundo
      if (!E) return; const f = E.host.estado();
      if (f.M !== E.M) { construir(f.M); centrar(f); } // mapa nuevo (puerta, borde o «Sombras»): escena nueva y cámara de golpe sobre el jugador
      pintarSuelo(false); aguaReal(G.capas.reloj); rioReal(G.capas.reloj); const nombres = entidades(f); pescas3d(f); camara(f); particulas(); combateFx3d(f); combateProFx(f); const ahora = (root.performance || Date).now(); { const dtO = E.tOcl ? Math.min(0.1, (ahora - E.tOcl) / 1000) : 0; ocluir(f, dtO); ocluirArboles(f, dtO); } E.tOcl = ahora; ajustar(); E.R.render(E.scene, E.cam); placas(nombres); combateUI(f); vigilar();
    },
    girar(s) { if (E) E.vista.yawT += s * Math.PI / 4; },
    zoom() { if (!E) return ZOOMS[0][0]; E.vista.zi = (E.vista.zi + 1) % ZOOMS.length; E.vista.distT = ZOOMS[E.vista.zi][1]; return ZOOMS[E.vista.zi][0]; },
    // para pruebas y depuración
    estado() { const inf = E && E.R && E.R.info && E.R.info.render; return E ? { st: E.st, llamadas: inf ? inf.calls : null, triangulos: inf ? inf.triangles : null, vista: E.vista, mapa: E.M && E.M.id, entidades: E.pool.filter((p) => p.mesh.visible).length, particulas: E.part ? E.part.cuadritos : 0, farolas: E.farolas ? { n: E.farolas.pts.length, charco: E.farolas.mc.material.opacity, halo: E.farolas.mh.material.opacity, visibles: E.farolas.mc.visible && E.farolas.mh.visible } : null, escena: E.scene.children.length, texturas: E.tex.size } : null; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
