
;/* PROPUESTA HD-2D · capa inyectada tras Three.js r128 (NO es código del proyecto; el proyecto no se modifica).
   Se engancha a WebGLRenderer.render para ver la escena REAL del pintor HD-2D y le añade, solo cuando window.__HD.on = true:
   · una luz direccional que proyecta un MAPA DE SOMBRAS REAL de Three.js (misma dirección que la sombra del 2D: luz arriba-izquierda → sombra abajo-derecha),
   · un suelo receptor (ShadowMaterial, transparente: solo se ve la sombra) sobre las casillas de hierba, camino y puente — nunca sobre agua ni árboles,
   · emisores: los edificios y la fuente (mallas en volumen reales) y, para láminas (farolas, bancos, macetas, personajes, criaturas…), un «proxy» invisible con
     la MISMA textura y recorte alfa, siempre de cara al sur, para que la sombra no cambie al girar la cámara,
   · se oculta la sombra suave horneada de los edificios (la sustituye la proyectada). La sombra de contacto bajo los pies de personajes y criaturas se mantiene. */
;(function () {
  const TH = window.THREE; if (!TH) return;
  const Orig = TH.WebGLRenderer;   // en r128 `render` es una propiedad de cada instancia (no del prototipo): se envuelve el constructor
  const S = window.__HD = { on: false, R: null, scene: null, cam: null, suelo: null, refrescar: true, cada: 6, f: 0, err: [],
    cfg: { dir: [0.45, -1, 0.225], color: 0x2a2070, opacidad: 0.36, mapa: 2048, ext: 12, sesgo: -0.0004, normal: 0.01 } };
  let ST = null; S.dbg = () => ST;

  function vertical(g) { if (g.__vert === undefined) { g.computeBoundingBox(); g.__vert = g.boundingBox.max.y > 0.5; } return g.__vert; }

  function crear(scene) {
    const C = S.cfg, sol = new TH.DirectionalLight(0xffffff, 0); sol.castShadow = true;
    sol.shadow.mapSize.set(C.mapa, C.mapa); const sc = sol.shadow.camera; sc.left = -C.ext; sc.right = C.ext; sc.top = C.ext; sc.bottom = -C.ext; sc.near = 1; sc.far = 90; sol.shadow.bias = C.sesgo; sol.shadow.normalBias = C.normal;
    scene.add(sol); scene.add(sol.target);
    // suelo receptor: un quad por casilla de hierba ('.'), camino ('=') o puente ('b')
    const P = [], I = [], rows = S.suelo; let n = 0;
    rows.forEach((r, z) => { for (let x = 0; x < r.length; x++) { const c = r[x]; if (c !== '.' && c !== '=' && c !== 'b') continue; P.push(x, 0.012, z, x + 1, 0.012, z, x + 1, 0.012, z + 1, x, 0.012, z + 1); I.push(n, n + 2, n + 1, n, n + 3, n + 2); n += 4; } });
    const g = new TH.BufferGeometry(); g.setAttribute('position', new TH.Float32BufferAttribute(P, 3)); g.setIndex(I); const nr = []; for (let k = 0; k < n; k++) nr.push(0, 1, 0); g.setAttribute('normal', new TH.Float32BufferAttribute(nr, 3));
    const rec = new TH.Mesh(g, new TH.ShadowMaterial({ color: C.color, opacity: C.opacidad })); rec.receiveShadow = true; rec.renderOrder = 0.5; rec.frustumCulled = false; rec.__hd = true; scene.add(rec);
    return { sol, rec, proxys: new Map(), emisores: new Set(), ocultos: [], vivo: false };
  }

  function encender(R) { R.shadowMap.enabled = true; R.shadowMap.type = TH.PCFSoftShadowMap; R.shadowMap.autoUpdate = false; ST.sol.castShadow = true; ST.rec.visible = true; ST.vivo = true; S.refrescar = true; }
  function apagar(R) {
    ST.sol.castShadow = false; ST.rec.visible = false; ST.proxys.forEach((p) => { p.visible = false; });
    ST.emisores.forEach((m) => { m.castShadow = false; m.material.shadowSide = null; }); ST.emisores.clear();
    ST.ocultos.forEach((m) => { m.visible = true; }); ST.ocultos = []; R.shadowMap.enabled = false; ST.vivo = false;
  }

  function sincronizar(scene) {
    scene.children.forEach((m) => {
      if (!m.isMesh || m.__hd || m.__proxy) return; const g = m.geometry, mat = m.material; if (!g || !mat) return;
      if (g.type === 'PlaneGeometry' && mat.map && mat.side === TH.DoubleSide) { // lámina (objeto, personaje o criatura)
        if (!vertical(g)) return; let p = ST.proxys.get(m);
        if (!p) { p = new TH.Mesh(g, new TH.MeshBasicMaterial({ map: mat.map, alphaTest: 0.5, side: TH.DoubleSide, colorWrite: false, depthWrite: false })); p.castShadow = true; p.__proxy = true; p.frustumCulled = false; scene.add(p); ST.proxys.set(m, p); }
        p.visible = m.visible && m.position.y > -0.1; p.position.copy(m.position); p.scale.copy(m.scale); p.rotation.set(0, 0, 0); p.updateMatrix(); if (p.material.map !== mat.map) p.material.map = mat.map; // de cara al sur siempre
        return;
      }
      if (g.type === 'CircleGeometry') return; // sombra de contacto de personajes y criaturas: se mantiene
      if (mat.isMeshBasicMaterial && mat.map && mat.side === TH.FrontSide) { if (!m.castShadow) { m.castShadow = true; mat.shadowSide = TH.DoubleSide; ST.emisores.add(m); } return; } // edificios y fuente en volumen
      if (mat.isMeshBasicMaterial && mat.transparent && mat.color && mat.color.getHex() === 0x1e1428 && m.visible) { m.visible = false; ST.ocultos.push(m); } // sombra suave horneada del edificio: la sustituye la proyectada
    });
  }

  function enganchar(R) {
    const orig = R.render;
    R.render = function (scene, camera) {
      if (scene && scene.isScene && !S.R && camera && camera.isPerspectiveCamera) { S.R = this; S.scene = scene; S.cam = camera; }
      if (this === S.R) {
        try {
          if (!S.on) { if (ST && ST.vivo) apagar(this); }
          else {
            if (!ST) ST = crear(scene); if (!ST.vivo) encender(this);
            const v = window.G.hd2d.estado().vista, C = S.cfg, L = Math.hypot(C.dir[0], C.dir[1], C.dir[2]), d = [C.dir[0] / L, C.dir[1] / L, C.dir[2] / L];
            ST.sol.position.set(v.tx - d[0] * 40, -d[1] * 40, v.tz - d[2] * 40); ST.sol.target.position.set(v.tx, 0, v.tz); ST.sol.target.updateMatrixWorld(); ST.sol.updateMatrixWorld();
            sincronizar(scene); if (S.refrescar || (++S.f % S.cada) === 0) { this.shadowMap.needsUpdate = true; S.refrescar = false; }
          }
        } catch (e) { S.err.push(String(e && e.stack || e)); }
      }
      return orig.apply(this, arguments);
    };
  }
  function Envuelto() { const R = new Orig(...arguments); enganchar(R); return R; }
  Envuelto.prototype = Orig.prototype; TH.WebGLRenderer = Envuelto;
})();
