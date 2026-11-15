// santuario_ui.js — SANTUARIO UNIVERSAL · interfaz (Etapa A, v2.364). Solo LEE el estado (G.santuario.vista) y pide ÓRDENES («santuario.acoger/retirar/mover»): no guarda nada ni toca el motor.
// Partes: 1) personajes (Guardiana Sela en el Umbral y Cuidador Brezo en cada hogar: sprite + guion de datos) · 2) señales sobre el mapa (las «z» de quien duerme; 2D y clásico) · 3) panel de residentes.
(function (root) {
  'use strict';
  const G = root.G, S = G.santuario; if (!S || !S.activo) return;
  // ── 1) PERSONAJES: misma silueta que los del pueblo (dibujos de src/npc.js) con paleta propia ──
  const PAL_SELA = { a: '#2a1b30', b: '#cfd6e6', c: '#e9b79c', d: '#f8dfcb', e: '#3a2a50', f: '#f5a8bd', m: '#b5564a', p: '#e6ecf7', q: '#ffffff', j: '#3f8f6a', k: '#f7c948', y: '#f7c948', n: '#2f6b50', o: '#5a3a2a' };   // moño plateado, túnica verde con ribete dorado
  const PAL_BREZO = { a: '#2a1b30', b: '#8a5a34', c: '#e9b79c', d: '#f8dfcb', e: '#3a2a50', f: '#f5a8bd', m: '#b5564a', p: '#e8c46a', q: '#f7e6a8', j: '#5cb85c', k: '#8a5a34', l: '#6b4426', y: '#f7e6a8', n: '#3a2a50', o: '#5a3a2a' };   // sombrero de paja, camisa verde y delantal de cuero
  const PAL_LIRIO = { a: '#2a1b30', b: '#5a3a2a', c: '#e9b79c', d: '#f8dfcb', e: '#3a2a50', f: '#f5a8bd', m: '#b5564a', p: '#d9cde8', q: '#ffffff', j: '#6a8fd6', k: '#f7c948', y: '#f7c948', n: '#35559a', o: '#5a3a2a' };   // pelo castaño, blusa azul y chaleco violeta pálido (la archivera de la cabaña)
  function sprites(pref, filas, pal) {
    if (!G.defSprite || !filas || G.spr[pref + '_down_0']) return;
    ['down', 'up', 'side', 'sideL'].forEach((v) => [0, 1, 2].forEach((f) => {
      const name = pref + '_' + v + '_' + f, oy = 24 - filas.length, ox = Math.floor((18 - filas[0].length) / 2);
      G.defSprite(name, 18, 24, (c) => { filas.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch !== '.' && pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x + ox, y + oy, 1, 1); } } }); });
      const s = G.spr[name]; s.ox = 1; s.oy = 1; s.tw = 16; s.th = 22; s.top = Math.max(0, oy - 1);
    }));
  }
  let listos = false;
  function personajes() {   // se crean la primera vez que hacen falta (al entrar en el Santuario): fuera de él no se crea ningún lienzo
    if (listos) return; listos = true; sprites('sela', G.NPC_NORA, PAL_SELA); sprites('brz', G.NPC_TEO, PAL_BREZO); sprites('lir', G.NPC_NORA, PAL_LIRIO);
  }
  G.NAMES = G.NAMES || {}; G.NAMES.guardiana = 'sela'; G.NAMES.cuidador = 'brz'; G.NAMES.archivera = 'lir';
  if (G.npc) {
    const lista0 = G.npc.lista; G.npc.lista = function (m, reloj) { if (m && S.enSantuario(m.id)) personajes(); return lista0(m, reloj); };   // quien va a dibujar a los personajes de un mapa pasa por aquí: sus sprites existen antes del primer dibujo
    G.npc.GUION.guardiana = {
      tipo: 'datos', nombre: 'Guardiana Sela', rol: 'Umbral del Santuario',
      saludo: ['Bienvenido al Umbral. Soy Sela y guardo la puerta del Santuario Universal.', 'Al otro lado hay un claro para ti: allí pueden vivir las criaturas de tu caja, vengan de la dimensión que vengan.', '¿Qué quieres saber?'],
      mas: ['¿Algo más?'], adios: ['La puerta del norte te lleva a tu claro. Cuídalas bien.'],
      menu: [
        { id: 'como', txt: '¿Cómo funciona?', sub: 'Tu claro y tus criaturas', frases: [
          ['Cruza la puerta del norte: cada entrenador llega a SU claro, no al de otro.', 'Dentro, habla con Brezo, el cuidador. Él instala en un hábitat a las criaturas que tengas en la caja.'],
          ['Una criatura del Santuario sigue siendo tuya y sigue en tu caja: puedes volver a llevártela al equipo cuando quieras.', 'Si se va de la caja, deja el claro sin que tengas que hacer nada.'],
          ['Aquí no se combate ni se captura. Cada una pasea, mira o descansa según su carácter… y de noche duermen.', 'Las de sombra, al revés: duermen de día.'] ] },
        { id: 'prisa', txt: '¿Tengo que venir a menudo?', sub: 'Sin obligaciones', frases: [['No. Aquí nada caduca ni se pierde por no venir.', 'El Santuario te espera tal como lo dejaste.']] },
      ],
    };
    G.npc.GUION.archivera = {
      tipo: 'datos', nombre: 'Archivera Lirio', rol: 'Cabaña del Santuario',
      saludo: ['Bienvenido a la cabaña. Soy Lirio: llevo el registro de quién vive en el claro.', '¿Qué necesitas?'],
      mas: ['¿Algo más?'], adios: ['Aquí estaré. Hay un libro en el estante y una vitrina junto a la ventana, por si quieres mirarlos.'],
      menu: [
        { id: 'residentes', txt: 'Residentes', sub: 'El registro del claro', panel: 'residentes', di: ['Es el mismo registro que lleva Brezo fuera. Aquí, con la puerta cerrada, se piensa mejor.'] },
        { id: 'cabana', txt: 'La cabaña', sub: 'Qué hay aquí dentro', frases: [
          ['El libro del estante resume tu Santuario: su nombre, cuántas criaturas viven y qué has levantado.', 'La vitrina guarda lo que otras dimensiones han traído a tu claro.'],
          ['Aquí no se cura ni se entrena: para eso están la Doctora y tus vivencias. La cabaña es para estar y para mirar.'],
          ['La cama es tuya. Si la ves vacía, es que las criaturas la respetan.'] ] },
      ],
    };
    G.npc.GUION.cuidador = {
      tipo: 'datos', nombre: 'Cuidador Brezo', rol: 'Santuario',
      saludo: ['¡Hola! Soy Brezo. Yo me ocupo de que a tus criaturas no les falte de nada.', '¿Qué hacemos?'],
      mas: ['¿Algo más?'], adios: ['¡Aquí estaremos! Ven cuando quieras.'],
      menu: [
        { id: 'residentes', txt: 'Residentes', sub: 'Quién vive aquí', panel: 'residentes', di: ['Elige quién se queda a vivir aquí. Siguen en tu caja: yo solo les busco sitio.'] },
        { id: 'charlar', txt: 'Charlar', sub: 'Brezo cuenta cosas', frases: [
          ['Fíjate bien: no hay dos que se porten igual. Las de fuego y las eléctricas no paran quietas; las de roca prefieren una buena siesta.'],
          ['Si te acercas a una que está curioseando, se gira para mirarte.', 'Y si le hablas, te cuenta qué anda haciendo.'],
          ['Los dos jardines de flores que ves vacíos son solares. Algún día levantaremos algo ahí.'],
          ['Con el tiempo se hacen amigas. Las que llevan días viviendo juntas juegan, descansan pegadas… y de noche duermen una al lado de la otra.', 'No todas congenian: agua y fuego, por ejemplo, se miran de reojo.'],
          ['Cada una tiene su carácter: juguetona, tímida, dormilona… Eso no cambia nunca, es suyo.'],
          ['Aquí no se aprende por estar sentado. Aprenden de lo que TÚ vives fuera: cada combate que ganas es un relato que les traes.', 'Cada una escucha un rato al día, no más. Y ninguna va a saber más que la mejor de tu equipo.'],
          ['Cada hábitat sirve para algo: en el Prado se curan, en la Charca hacen amigas antes, en el Brasal aprenden más…', 'Y en los solares podemos levantar instalaciones.'],
          ['Este claro puede crecer. En «Residentes» verás cuánto cuesta ampliarlo y qué hábitats nuevos trae.'] ] },
      ],
    };
  }

  // ── 2) SEÑALES SOBRE EL MAPA (2D y clásico comparten este pintado): «z z» sobre quien duerme ──
  const Z = ['##.', '.#.', '.##'];
  const EMO = { afecto: { c: '#ff7a9a', g: ['.#.#.', '#####', '#####', '.###.', '..#..'] }, juego: { c: '#f7d54a', g: ['..##.', '..#.#', '..#..', '###..', '###..'] }, hola: { c: '#fff9ee', g: ['..#..', '..#..', '..#..', '.....', '..#..'] }, recelo: { c: '#b9c0d0', g: ['.....', '.....', '.....', '#.#.#', '.....'] },
    flor: { c: '#ff9ad5', g: ['.#.#.', '#####', '.###.', '#####', '.#.#.'] }, gota: { c: '#6fc3ff', g: ['..#..', '..#..', '.###.', '#####', '.###.'] }, llama: { c: '#ff9a3c', g: ['..#..', '.##..', '.###.', '#####', '.###.'] }, piedra: { c: '#c9b79a', g: ['.....', '.###.', '#####', '#####', '.....'] },
    viento: { c: '#bfeaf5', g: ['###..', '....#', '#####', '.....', '.###.'] }, rayo: { c: '#ffe14a', g: ['..##.', '.##..', '####.', '..##.', '.##..'] }, luna: { c: '#c9b0ff', g: ['.###.', '##...', '##...', '##...', '.###.'] }, estrella: { c: '#fff3a0', g: ['..#..', '.###.', '#####', '.###.', '.#.#.'] } };
  function zeta(ctx, x, y, k, alfa) { ctx.globalAlpha = alfa; ctx.fillStyle = '#2a1b30'; ctx.fillRect(x - 1, y - 1, 3 * k + 2, 3 * k + 2); ctx.fillStyle = '#fff9ee'; Z.forEach((f, j) => { for (let i = 0; i < 3; i++) if (f[i] === '#') ctx.fillRect(x + i * k, y + j * k, k, k); }); ctx.globalAlpha = 1; }
  function pintar(ctx, M, cam, VW, VH, reloj, est) {
    if (!S.esHogar(M.id)) return;
    const em = est.mapas[M.id]; if (!em) return;
    for (const c of em.criaturas) {
      if (c.emo && EMO[c.emo]) { const x = Math.round(c.x - cam.x), y = Math.round(c.y - cam.y); if (x > -16 && y > -8 && x < VW + 16 && y < VH + 40) { const E = EMO[c.emo], alto = (G.traits(c.id).size || [14, 14])[1], by = y - alto - 9 - Math.round(Math.abs(Math.sin(reloj * 4 + c.res)) * 2), bx = x - 2;
        ctx.fillStyle = '#2a1b30'; E.g.forEach((f, j) => { for (let i = 0; i < 5; i++) if (f[i] === '#') ctx.fillRect(bx + i - 1, by + j - 1, 3, 3); }); ctx.fillStyle = E.c; E.g.forEach((f, j) => { for (let i = 0; i < 5; i++) if (f[i] === '#') ctx.fillRect(bx + i, by + j, 1, 1); }); } }
      if (!c.dur) continue; const x = Math.round(c.x - cam.x), y = Math.round(c.y - cam.y); if (x < -16 || y < -8 || x > VW + 16 || y > VH + 40) continue;
      const alto = (G.traits(c.id).size || [14, 14])[1], f = (reloj * 0.5 + (c.res % 7) / 7) % 1, f2 = (f + 0.5) % 1;
      zeta(ctx, x + 4 + Math.round(f * 4), y - alto - 4 - Math.round(f * 8), 1, Math.sin(f * Math.PI)); zeta(ctx, x + 6 + Math.round(f2 * 5), y - alto - 6 - Math.round(f2 * 10), 2, Math.sin(f2 * Math.PI) * 0.9);
    }
  }

  // ── 3) PANEL DE RESIDENTES ──
  const d = root.document, EL = { fuego: '#e8632b', agua: '#3f9bd6', hoja: '#5cb85c', electrico: '#f0c419', aire: '#8fd3e8', roca: '#b09a78', sombra: '#8a6ab8' };
  const P = { est: null, j: null, api: null, alCerrar: null, raiz: null };
  const el = (t, cls, txt) => { const e = d.createElement(t); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const CSS = '#santu{position:fixed;inset:0;z-index:8;display:flex;flex-direction:column;background:#14201a;color:var(--ink,#fff9ee)}#santu[hidden]{display:none}#santu,#santu *{touch-action:pan-y}' +
    '#santu header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) max(16px,env(safe-area-inset-right,0px)) 8px max(16px,env(safe-area-inset-left,0px))}' +
    '#santu h1{margin:0;font-size:22px;letter-spacing:.05em;color:var(--crema,#fff9ee);text-shadow:0 3px 0 var(--tinta,#2a1b30)}#santu header span{display:block;font-size:13px;opacity:.85}' +
    '#santu .x{width:44px;height:44px;flex:none;border:3px solid var(--tinta,#2a1b30);background:#3b2330;color:var(--ink,#fff9ee);font-size:20px}' +
    '#santu-l{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px max(16px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 20px) max(16px,env(safe-area-inset-left,0px))}' +
    '#santu h2{margin:14px 0 6px;font-size:15px;letter-spacing:.04em;display:flex;align-items:center;gap:8px}#santu h2 i{width:10px;height:10px;border-radius:50%;display:inline-block}#santu h2 small{margin-left:auto;font-size:12px;opacity:.8;font-weight:normal}' +
    '.sa-c{display:flex;align-items:center;gap:10px;padding:8px 10px;margin:0 0 6px;background:#24352b;border:3px solid var(--tinta,#2a1b30);box-shadow:0 3px 0 rgba(0,0,0,.35)}.sa-c canvas{flex:none;image-rendering:pixelated}' +
    '.sa-c .t{flex:1;min-width:0}.sa-c b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sa-c small{font-size:12px;opacity:.8}' +
    '.sa-c button{flex:none;min-height:40px;padding:0 12px;border:3px solid var(--tinta,#2a1b30);background:var(--oro,#f7d54a);color:var(--tinta,#2a1b30);font-size:14px}.sa-c button.s{background:#3b2330;color:var(--ink,#fff9ee)}.sa-c button:disabled{opacity:.45}' +
    '#santu p.v{margin:4px 0 8px;font-size:13px;opacity:.75}' +
    '.sa-a{margin:6px 0 4px;padding:10px;background:#2c2a1c;border:3px solid var(--tinta,#2a1b30)}.sa-a b{display:block;font-size:15px}.sa-a small{display:block;font-size:12px;opacity:.85;margin:2px 0 8px}.sa-a button,.sa-h button{min-height:40px;padding:0 12px;border:3px solid var(--tinta,#2a1b30);background:var(--oro,#f7d54a);color:var(--tinta,#2a1b30);font-size:14px}.sa-a button:disabled,.sa-h button:disabled{opacity:.45}' +
    '.sa-h{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.sa-h button.s{background:#3b2330;color:var(--ink,#fff9ee)}#santu h2 button{margin-left:8px;min-height:32px;padding:0 10px;border:2px solid var(--tinta,#2a1b30);background:#3b2330;color:var(--ink,#fff9ee);font-size:12px}';
  function raiz() {
    if (P.raiz) return P.raiz; const st = el('style'); st.textContent = CSS; d.head.appendChild(st);
    const r = el('div'); r.id = 'santu'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Residentes del Santuario');
    const h = el('header'), t = el('div'); t.appendChild(el('h1', null, 'SANTUARIO')); t.appendChild(el('span', 'sub', '')); h.appendChild(t);
    const x = el('button', 'x', '✕'); x.setAttribute('aria-label', 'Cerrar'); x.addEventListener('click', cerrar); h.appendChild(x); r.appendChild(h);
    const l = el('div'); l.id = 'santu-l'; r.appendChild(l); d.body.appendChild(r); return (P.raiz = r);
  }
  function retrato(forma) { const s = G.creatureSprite(forma, 'down', 0), k = Math.max(1, Math.floor(40 / Math.max(s.w, s.h))), c = d.createElement('canvas'); c.width = 40; c.height = 40; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s.c, (40 - s.w * k) >> 1, (40 - s.h * k) >> 1, s.w * k, s.h * k); c.setAttribute('aria-hidden', 'true'); return c; }
  function tarjeta(f, botones) {
    const c = el('div', 'sa-c'); c.appendChild(retrato(f.forma)); const t = el('div', 't'); t.appendChild(el('b', null, f.mote || f.nom)); t.appendChild(el('small', null, (f.mote ? f.nom + ' · ' : '') + 'Nv ' + f.nivel + ' · ' + f.rasgo + (f.tope ? ' · hoy ' + f.hoy + '/' + f.tope + ' XP' : '') + (f.herida ? ' · herida' : '') + (f.amiga ? ' · ' + (f.amiga.nivel >= 1 ? '♥ ' : '') + f.amiga.nom : ''))); c.appendChild(t);
    botones.forEach(([txt, cls, fn, off]) => { const b = el('button', cls, txt); b.disabled = !!off; b.addEventListener('click', () => { fn(); pintarPanel(); }); c.appendChild(b); }); return c;
  }
  let derribando = -1;
  let eligiendo = -1;   // parcela cuyo selector de hábitat está abierto
  let decorando = false, hueco = -1;   // B4: sección de decoración abierta · hueco cuyo selector de piezas está abierto
  function pintarPanel() {
    const r = raiz(), v = S.vista(P.est, P.j), l = r.querySelector('#santu-l'), lleno = v.total >= v.max, pedir = (o) => P.api.orden(o);
    r.querySelector('.sub').textContent = (v.nom ? v.nom + ' · ' : '') + v.nombre + ' · ' + v.total + ' de ' + v.max + ' criaturas · ' + v.brillos + ' ✦'; l.textContent = '';
    { const a = el('div', 'sa-a'); a.appendChild(el('b', null, 'Vivencias: ' + v.vivencias.hay + ' / ' + v.vivencias.tope)); a.appendChild(el('small', null, 'Lo que vives fuera (combates, pesca, intercambios) llena esta reserva. Cuando estás en casa, cada residente aprende de ella su dosis del día. Ninguna pasa del nivel ' + v.techo + ' (tu mejor criatura).')); l.appendChild(a); }
    if (v.ampliar) { const a = el('div', 'sa-a'); a.appendChild(el('b', null, 'Ampliar a ' + v.ampliar.nombre)); a.appendChild(el('small', null, 'Hasta ' + v.ampliar.residentes + ' criaturas · ' + v.ampliar.habitats + ' hábitats' + (v.ampliar.nuevos.length ? ' · nuevos: ' + v.ampliar.nuevos.join(', ') : '')));
      const b = el('button', null, 'Ampliar · ' + v.ampliar.coste + ' ✦'); b.disabled = v.brillos < v.ampliar.coste; b.addEventListener('click', () => { pedir({ t: 'santuario.ampliar' }); pintarPanel(); }); a.appendChild(b); l.appendChild(a); }
    v.solares.forEach((so) => {
      const t = el('h2'); const p = el('i'); p.style.background = so.tipo ? '#f7d54a' : '#666'; t.appendChild(p); t.appendChild(d.createTextNode(so.nombre));
      if (so.tipo) { const c = el('button', null, 'Derribar'); c.addEventListener('click', () => { if (derribando === so.s) { derribando = -1; pedir({ t: 'santuario.derribar', s: so.s }); } else derribando = so.s; pintarPanel(); }); if (derribando === so.s) c.textContent = '¿Seguro? No se devuelve nada'; t.appendChild(c); l.appendChild(t); l.appendChild(el('p', 'v', so.texto)); return; }
      l.appendChild(t); const f = el('div', 'sa-h'); v.instalaciones.filter((q) => !q.hecha).forEach((q) => { const b = el('button', q.abierta ? '' : 's', q.abierta ? q.nombre + ' · ' + q.coste + ' ✦' : q.nombre + ' (' + (q.nivel > v.nivel ? 'nivel ' + q.nivel : 'aporte de ' + q.origen) + ')'); b.disabled = !q.abierta || v.brillos < q.coste; b.title = q.texto; b.addEventListener('click', () => { pedir({ t: 'santuario.construir', s: so.s, tipo: q.tipo }); pintarPanel(); }); f.appendChild(b); }); l.appendChild(f);
      l.appendChild(el('p', 'v', v.instalaciones.filter((q) => !q.hecha && q.abierta).map((q) => q.nombre + ': ' + q.texto.toLowerCase()).join(' · ') || 'No hay más instalaciones por ahora.'));
    });
    if (v.solares.some((so) => !so.tipo)) v.instalaciones.filter((q) => !q.hecha && !q.abierta && q.origen).forEach((q) => { const a = el('div', 'sa-a'); a.appendChild(el('b', null, q.nombre + ' · aporte de ' + q.origen)); a.appendChild(el('small', null, q.texto + '. Te falta: ' + q.falta.join(' y ') + '.')); l.appendChild(a); });   // B3: lo que aún no se puede construir, con su origen y lo que falta (una vez, no por solar)
    v.habitats.forEach((h) => {
      const t = el('h2'); const p = el('i'); p.style.background = EL[h.elemento] || '#666'; t.appendChild(p); t.appendChild(d.createTextNode(h.nombre));
      const c = el('button', null, h.tipo ? 'Cambiar' : 'Elegir hábitat'); c.addEventListener('click', () => { eligiendo = eligiendo === h.slot ? -1 : h.slot; pintarPanel(); }); t.appendChild(c); if (h.tipo) t.appendChild(el('small', null, h.residentes.length + ' / ' + h.cupo)); l.appendChild(t);
      if (eligiendo === h.slot) { const f = el('div', 'sa-h'); v.tipos.filter((q) => q.tipo !== h.tipo).forEach((q) => { const b = el('button', q.abierto ? '' : 's', q.abierto ? q.nombre + (h.cambiar ? ' · ' + h.cambiar + ' ✦' : '') : q.nombre + ' (' + (q.nivel > v.nivel ? 'nivel ' + q.nivel : 'aporte de ' + q.origen) + ')'); b.disabled = !q.abierto || v.brillos < h.cambiar; b.title = q.don; b.addEventListener('click', () => { if (pedir({ t: 'santuario.habitat', h: h.slot, tipo: q.tipo })) eligiendo = -1; pintarPanel(); }); f.appendChild(b); }); l.appendChild(f); }
      if (!h.tipo) { l.appendChild(el('p', 'v', 'Parcela libre: elige qué hábitat quieres aquí (gratis).')); return; }
      l.appendChild(el('p', 'v', h.don));
      if (!h.residentes.length) l.appendChild(el('p', 'v', 'Nadie vive aquí todavía.'));
      h.residentes.forEach((f) => { const bs = [], otros = v.habitats.filter((q) => q.tipo && q.slot !== h.slot); if (otros.length) { let sig = otros.find((q) => q.slot > h.slot) || otros[0]; bs.push(['A ' + sig.nombre, 's', () => pedir({ t: 'santuario.mover', id: f.id, h: sig.slot }), sig.residentes.length >= sig.cupo]); } bs.push(['A la caja', 's', () => pedir({ t: 'santuario.retirar', id: f.id })]); l.appendChild(tarjeta(f, bs)); });
    });
    { const t = el('h2'); t.appendChild(d.createTextNode('Decoración y nombre')); const c = el('button', null, decorando ? 'Cerrar' : 'Abrir'); c.addEventListener('click', () => { decorando = !decorando; hueco = -1; pintarPanel(); }); t.appendChild(c); l.appendChild(t);
      if (decorando) {
        const f = el('div', 'sa-h'), inp = el('input'); inp.type = 'text'; inp.maxLength = 20; inp.value = v.nom; inp.placeholder = 'Nombre de tu Santuario'; inp.style.cssText = 'flex:1;min-width:0;font:inherit;padding:6px'; const g = el('button', null, 'Guardar nombre'); g.addEventListener('click', () => { pedir({ t: 'santuario.nombrar', nom: inp.value }); pintarPanel(); }); f.appendChild(inp); f.appendChild(g); l.appendChild(f);
        l.appendChild(el('p', 'v', 'Solo es estético: las piezas no dan ventajas. Quitar es gratis (no se devuelve nada).'));
        v.decoracion.huecos.forEach((h) => {
          const a = el('div', 'sa-a'); a.appendChild(el('b', null, h.nombre)); a.appendChild(el('small', null, h.pieza ? h.nombrePieza : 'Vacío'));
          const c2 = el('button', null, hueco === h.d ? 'Cancelar' : h.pieza ? 'Cambiar' : 'Colocar'); c2.addEventListener('click', () => { hueco = hueco === h.d ? -1 : h.d; pintarPanel(); }); a.appendChild(c2);
          if (h.pieza) { const q = el('button', 's', 'Quitar'); q.addEventListener('click', () => { pedir({ t: 'santuario.decorar', d: h.d, tipo: null }); hueco = -1; pintarPanel(); }); a.appendChild(q); }
          if (hueco === h.d) { const g2 = el('div', 'sa-h'); v.decoracion.piezas.filter((q) => q.donde.indexOf(h.donde) >= 0 && q.tipo !== h.pieza).forEach((q) => { const b = el('button', q.abierta ? '' : 's', q.abierta ? q.nombre + ' · ' + q.coste + ' ✦' : q.nombre + ' (' + (q.nivel > v.nivel ? 'nivel ' + q.nivel : 'aporte de ' + q.origen) + ')'); b.disabled = !q.abierta || v.brillos < q.coste; b.title = q.falta.join(' y '); b.addEventListener('click', () => { if (pedir({ t: 'santuario.decorar', d: h.d, tipo: q.tipo })) hueco = -1; pintarPanel(); }); g2.appendChild(b); }); a.appendChild(g2); }
          l.appendChild(a); });
      } }
    const t = el('h2'); t.appendChild(d.createTextNode('En tu caja')); t.appendChild(el('small', null, String(v.caja.length))); l.appendChild(t);
    if (!v.caja.length) l.appendChild(el('p', 'v', v.total ? 'Todas las criaturas de tu caja viven ya aquí.' : 'Tu caja está vacía. Las criaturas que captures irán a ella; las de tu equipo viajan contigo.'));
    v.caja.forEach((f) => l.appendChild(tarjeta(f, [['Acoger', '', () => pedir({ t: 'santuario.acoger', id: f.id }), lleno]])));
  }
  function leer(est, j, lec) {   // B5: el libro y la vitrina de la cabaña. Solo lectura: el motor ya trae el texto (G.santuario.lectura); aquí solo se pinta
    const r = raiz(), l = r.querySelector('#santu-l'); P.est = est; P.j = j; P.api = null; P.alCerrar = null; r.querySelector('h1').textContent = lec.titulo.toUpperCase(); r.querySelector('.sub').textContent = lec.sub; l.textContent = '';
    lec.secciones.forEach((q) => { const t = el('h2'); t.appendChild(d.createTextNode(q.h)); l.appendChild(t); q.filas.forEach((f) => { const a = el('div', 'sa-a'); a.appendChild(el('b', null, f.x)); if (f.e === 'ok') a.appendChild(el('small', null, 'Hecho')); else if (f.e === 'falta') a.appendChild(el('small', null, 'Aún no')); l.appendChild(a); }); });
    l.scrollTop = 0; r.hidden = false; return true;
  }
  function abrir(est, j, opc) { raiz().querySelector('h1').textContent = 'SANTUARIO'; eligiendo = -1; derribando = -1; decorando = false; hueco = -1; P.est = est; P.j = j; P.api = opc.api; P.alCerrar = opc.alCerrar || null; pintarPanel(); raiz().hidden = false; return true; }
  function cerrar() { if (!P.raiz || P.raiz.hidden) return; P.raiz.hidden = true; P.raiz.querySelector('h1').textContent = 'SANTUARIO'; const f = P.alCerrar; P.alCerrar = null; if (f) f(); }
  G.santuarioUI = { pintar, abrir, leer, cerrar, abierto: () => !!(P.raiz && !P.raiz.hidden), personajes };
})(typeof window !== 'undefined' ? window : globalThis);
