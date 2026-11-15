// crianza.js — CRIANZA GENÉRICA (v2.320): genes, herencia, mutación, talento, habilidad, huevos que eclosionan andando y sintetizador de sprites por capas. PURO: sin DOM, sin azar del sistema, sin relojes.
// Todo sale de DATOS: datos/crianza.json (números) y datos/crias/<linea>.json (ficha de cría: papeles de color, genes, marcas, adornos y el indicador «lista»). Añadir una ficha válida con lista:true
// da huevos a esa línea SIN tocar código. Guía: docs/GUIA_CRIANZA.md. Validador: tools/validar_crianza.js.
// Estado por jugador (serializable): j.huevos [{ id, sem, a, b, coop, socio, pasos, meta, hallado }] · j.crias [{ id, forma, genes, tal, hab, mut, padres, coop }] · j.criaAct { forma: idCria } · j.descanso { clave: pasos } · j.criaN.
// Órdenes (G.motor.aplicar): { j, t:'criar', a:{forma,cria?}, b:{forma,cria?}, socio? } (junto a la Doctora Nora) · { j, t:'cria_activa', forma, cria } (qué cría representa a su especie: aspecto, talento y habilidad).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, TINTA = '#2a1b30';
  let C = G.DATOS && G.DATOS.crianza, FICHAS = G.DATOS && G.DATOS.crias;
  if (!C && typeof require === 'function') { const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'datos'); C = JSON.parse(fs.readFileSync(path.join(dir, 'crianza.json'), 'utf8')); FICHAS = {}; fs.readdirSync(path.join(dir, 'crias')).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { const j = JSON.parse(fs.readFileSync(path.join(dir, 'crias', f), 'utf8')); FICHAS[j.linea] = j; }); }
  if (!C) throw new Error('crianza.js: faltan los datos (datos/crianza.json)');
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const azar = (s) => { let a = s >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const HEX = /^#[0-9a-f]{6}$/i, STATS = ['ps', 'atq', 'def', 'vel'], VISTAS = ['down', 'up', 'side'];
  const famDe = (forma) => (G.FORMAS && G.FORMAS[forma] ? G.FORMAS[forma].linea.fam : null);
  const ficha = (fam) => (FICHAS && FICHAS[fam]) || null;
  const genesDe = (F) => (F.genes || []).filter((g) => g && g.id);

  // ───────── validador de fichas ─────────
  function validarFicha(F) {   // lista de problemas (vacía = ficha completa)
    const e = [], w = 'ficha «' + (F && F.linea) + '»: '; if (!F || typeof F.linea !== 'string') return ['ficha sin «linea»'];
    const R = G.FORMAS && G.FORMAS[F.linea]; if (!R || R.stage !== 1) return [w + '«linea» debe ser el id de la fase 1 de una línea de src/lineas.js'];
    const def = G.CREATURES[F.linea]; if (!def || !def.native) e.push(w + 'la fase 1 debe tener dibujo nativo (def2/set)');
    if (typeof F.lista !== 'boolean') e.push(w + 'falta «lista» (true o false)');
    const roles = F.roles || {}; if (!Object.keys(roles).length) e.push(w + 'faltan «roles» (papel → color del dibujo)'); Object.keys(roles).forEach((r) => { if (!HEX.test(roles[r])) e.push(w + 'el papel «' + r + '» no es un color #rrggbb'); });
    if (!Array.isArray(F.cuerpo) || !F.cuerpo.length || F.cuerpo.some((r) => !roles[r])) e.push(w + '«cuerpo» debe listar papeles que existan en «roles»');
    if (def && def.native && !e.length) { const usados = coloresDe(F.linea); Object.keys(roles).forEach((r) => { if (!usados[roles[r].toLowerCase()]) e.push(w + 'el color del papel «' + r + '» (' + roles[r] + ') no aparece en el dibujo'); }); }
    const gs = genesDe(F); if (gs.length < 2) e.push(w + 'hacen falta al menos 2 genes'); const vistos = {};
    const color = (c) => HEX.test(c || '') || !!roles[c];
    gs.forEach((g) => { const wg = w + 'gen «' + g.id + '»: '; if (vistos[g.id]) e.push(wg + 'repetido'); vistos[g.id] = 1; if (!g.nombre) e.push(wg + 'falta «nombre»');
      if (!Array.isArray(g.alelos) || g.alelos.length < 2) { e.push(wg + 'necesita al menos 2 alelos'); return; } if (g.alelos[0].mut) e.push(wg + 'el primer alelo es el aspecto original y no puede ser una mutación'); if (g.alelos.every((a) => a.mut)) e.push(wg + 'todos sus alelos son mutaciones');
      const ids = {}; g.alelos.forEach((a) => { const wa = wg + 'alelo «' + a.id + '»: '; if (!a.id || ids[a.id]) e.push(wa + 'id vacío o repetido'); ids[a.id] = 1; if (!a.nombre) e.push(wa + 'falta «nombre»');
        Object.keys(a.colores || {}).forEach((r) => { if (!roles[r]) e.push(wa + 'colorea un papel que no existe («' + r + '»)'); else if (!HEX.test(a.colores[r])) e.push(wa + 'color inválido en «' + r + '»'); });
        if (a.patron) { if (!Array.isArray(a.patron) || !a.patron.length || a.patron.some((r) => typeof r !== 'string' || r.length !== a.patron[0].length)) e.push(wa + '«patron» debe ser filas del mismo ancho'); if (!Array.isArray(a.sobre) || a.sobre.some((r) => !roles[r])) e.push(wa + '«sobre» debe listar papeles existentes'); if (!color(a.color)) e.push(wa + '«color» debe ser un papel o #rrggbb'); }
        if (a.capas) { Object.keys(a.capas).forEach((v) => { const c = a.capas[v]; if (VISTAS.indexOf(v) < 0) e.push(wa + 'vista desconocida «' + v + '» (down, up, side)'); else if (!Array.isArray(c) || !c.length || c.some((r) => r.length !== c[0].length)) e.push(wa + 'la capa «' + v + '» debe ser filas del mismo ancho'); else { c.join('').split('').forEach((ch) => { if (ch !== '.' && !(a.clave && color(a.clave[ch]))) e.push(wa + 'la letra «' + ch + '» de la capa «' + v + '» no está en «clave»'); }); const p = a.pos && a.pos[v]; if (!Array.isArray(p) || ['arriba', 'abajo', 'detras'].indexOf(p[0]) < 0) e.push(wa + 'falta pos.' + v + ' = [arriba|abajo|detras, dx, dy]'); } }); } }); });
    if (!gs.some((g) => (g.alelos || []).some((a) => a.mut))) e.push(w + 'ningún gen tiene una mutación («mut»: true)');
    return e.filter((t, i, a) => a.indexOf(t) === i);
  }
  let memoVal = null;
  // { listas: [fam…], apagadas: [fam…], sin: [fam…], errores: [texto…] }: qué líneas pueden criar
  function validar() {
    if (memoVal) return memoVal; const r = { listas: [], apagadas: [], sin: [], errores: [] };
    (G.LINEAS || []).forEach((L) => { const F = ficha(L.fam); if (!F) { r.sin.push(L.fam); return; } const e = validarFicha(F); if (e.length) { r.errores.push.apply(r.errores, e); return; } (F.lista ? r.listas : r.apagadas).push(L.fam); });
    Object.keys(FICHAS || {}).forEach((k) => { if (!(G.LINEAS || []).some((L) => L.fam === k)) r.errores.push('ficha «' + k + '»: no es ninguna línea de src/lineas.js'); });
    return (memoVal = r);
  }
  const lista = (fam) => validar().listas.indexOf(fam) >= 0;

  // ───────── sintetizador de sprites por capas (puro: matriz de colores) ─────────
  function lienzo(forma, dir, f) {   // el dibujo ORIGINAL hecho a mano, píxel a píxel, sin tocar el lienzo del juego
    const def = G.CREATURES[forma], [tw, th] = G.traits(forma).size, PAD = 4, W = tw + PAD * 2, H = th + PAD * 2, px = []; for (let y = 0; y < H; y++) px.push(new Array(W).fill(null));
    const nada = new Proxy({}, { get: () => () => {}, set: () => true });
    def.draw(nada, dir, f, (col, x, y, w, h) => { w = w || 1; h = h || 1; for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) { const X = Math.round(x) + a + PAD, Y = Math.round(y) + b + PAD; if (X >= 0 && Y >= 0 && X < W && Y < H) px[Y][X] = String(col).toLowerCase(); } }, tw, th);
    return { px, W, H, PAD, tw, th };
  }
  function coloresDe(forma) { const u = {}; ['down', 'up', 'left'].forEach((d) => [0, 1].forEach((f) => lienzo(forma, d, f).px.forEach((r) => r.forEach((c) => { if (c) u[c] = (u[c] || 0) + 1; })))); return u; }
  // Matriz de una cría: { w, h, px[y][x] (color o null), tw, th, pad }. genes = { idGen: idAlelo }; lo que falte usa el primer alelo (aspecto original).
  function matriz(forma, dir, f, genes) {
    const fam = famDe(forma), F = ficha(fam), L = lienzo(forma, dir, f), px = L.px, W = L.W, H = L.H; if (!F) return { w: W, h: H, px, tw: L.tw, th: L.th, pad: L.PAD };
    const inv = {}; Object.keys(F.roles).forEach((r) => { inv[F.roles[r].toLowerCase()] = r; }); const col = Object.assign({}, F.roles), elegidos = [];
    genesDe(F).forEach((g) => { const a = g.alelos.find((q) => q.id === (genes || {})[g.id]) || g.alelos[0]; elegidos.push(a); Object.assign(col, a.colores || {}); });
    const rol = px.map((r) => r.map((c) => (c ? inv[c] || null : null))); let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rol[y][x] && F.cuerpo.indexOf(rol[y][x]) >= 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rol[y][x]) px[y][x] = col[rol[y][x]].toLowerCase();
    const tono = (c) => (col[c] || c).toLowerCase(), der = dir === 'right', vista = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'side';
    if (x1 >= 0) elegidos.forEach((a) => {
      if (a.patron) { const ph = a.patron.length, pw = a.patron[0].length; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const u = der ? x1 - x : x - x0; if (rol[y][x] && a.sobre.indexOf(rol[y][x]) >= 0 && a.patron[(y - y0) % ph][u % pw] === 'x') px[y][x] = tono(a.color); } }
      const c = a.capas && a.capas[vista]; if (c) { const p = a.pos[vista], h = c.length, w = c[0].length, cx = (x0 + x1 + 1) / 2;
        let ox = p[0] === 'detras' ? x1 + (p[1] | 0) : Math.round(cx - w / 2) + (p[1] | 0), oy = p[0] === 'arriba' ? y0 - h + (p[2] | 0) : p[0] === 'abajo' ? y1 - h + 1 + (p[2] | 0) : Math.round((y0 + y1) / 2) + (p[2] | 0);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = c[y][x]; if (ch === '.') continue; let X = ox + x; if (der) X = x0 + x1 - X; const Y = oy + y; if (X >= 0 && Y >= 0 && X < W && Y < H) px[Y][X] = tono(a.clave[ch]); } }
    });
    const lleno = px.map((r) => r.map((c) => !!c));   // contorno de tinta de 1 px alrededor de la silueta, como el resto de criaturas
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!lleno[y][x] && ((x > 0 && lleno[y][x - 1]) || (x < W - 1 && lleno[y][x + 1]) || (y > 0 && lleno[y - 1][x]) || (y < H - 1 && lleno[y + 1][x]))) px[y][x] = TINTA;
    return { w: W, h: H, px, tw: L.tw, th: L.th, pad: L.PAD };
  }

  // ───────── genética ─────────
  const tal1 = () => ({ ps: 1, atq: 1, def: 1, vel: 1 });
  function habBase(forma, clave) { const st = G.combate.statsDe({ forma }), kit = G.combate.kitDe(st.el, st.rar, String(clave || forma)); return kit[1]; }
  const habOk = (h) => !!(G.COMBATE_DATOS && G.COMBATE_DATOS.MOV[h] && G.COMBATE_DATOS.MOV[h].hueco === 'h');
  // lo que un padre aporta: { forma, genes, tal, hab, nombre }. ref = { forma, cria? }
  function aporte(j, ref) {
    const cr = ref && ref.cria ? (j.crias || []).find((q) => q.id === ref.cria && q.forma === ref.forma) : null, forma = ref.forma, F = ficha(famDe(forma)), genes = {};
    genesDe(F).forEach((g) => { genes[g.id] = cr && g.alelos.some((a) => a.id === cr.genes[g.id]) ? cr.genes[g.id] : g.alelos[0].id; });
    return { forma: G.FORMAS[forma].linea.fam, genes, tal: cr ? Object.assign(tal1(), cr.tal) : tal1(), hab: cr && habOk(cr.hab) ? cr.hab : habBase(G.FORMAS[forma].linea.fam, 'j_' + j.id), nombre: G.CREATURES[forma].name + (cr ? ' nº ' + cr.id : '') };
  }
  // Nace la cría de un huevo: función PURA del huevo (su semilla y lo que aportó cada padre), para que un servidor pueda repetirla
  function nacer(h) {
    const r = azar(h.sem), pa = h.a, pb = h.b, de = r() < 0.5 ? pa : pb, F = ficha(de.forma), genes = {}, mut = [], gs = genesDe(F);
    gs.forEach((g) => { const cands = [pa, pb].map((p) => p.genes && p.genes[g.id]).filter((id) => g.alelos.some((a) => a.id === id)); genes[g.id] = cands.length ? cands[(r() * cands.length) | 0] : g.alelos[0].id; });
    const pm = h.hallado ? C.mutacionHallado : h.coop ? C.mutacionCoop : C.mutacion;
    if (r() < pm) { const gm = gs.filter((g) => g.alelos.some((a) => a.mut)), g = gm[(r() * gm.length) | 0], ms = g.alelos.filter((a) => a.mut); genes[g.id] = ms[(r() * ms.length) | 0].id; mut.push(g.id); } else { r(); r(); }
    const tal = {}, Tn = C.talento; STATS.forEach((s) => { tal[s] = Math.round(Math.max(Tn.min, Math.min(Tn.max, ((pa.tal[s] || 1) + (pb.tal[s] || 1)) / 2 + (r() * 2 - 1) * Tn.variacion)) * 1000) / 1000; });
    const hab = (r() < 0.5 ? pa : pb).hab;
    return { forma: de.forma, genes, tal, hab: habOk(hab) ? hab : habBase(de.forma, de.forma), mut, padres: [pa.nombre, pb.nombre], coop: !!h.coop };
  }
  // ───────── estado del jugador ─────────
  const clave = (ref) => ref.forma + (ref.cria ? '#' + ref.cria : '');
  const aviso = (est, j, texto) => { if (est && est.avisos) est.avisos.push({ j: j.id, texto }); };
  const no = (est, j, motivo) => { aviso(est, j, motivo); return { ok: false, motivo }; };
  const silvestres = (j, forma) => Math.max(0, ((G.equipo.propias(j)[forma]) | 0) - (j.crias || []).filter((q) => q.forma === forma).length);
  // candidatos a padre de un jugador: [{ forma, cria (id o null), nombre, descanso (pasos que le quedan), genes }]
  function candidatos(j) {
    const out = [], p = G.equipo.propias(j);
    Object.keys(p).forEach((forma) => { const fam = famDe(forma); if (!lista(fam) || G.FORMAS[forma].stage !== 1) return; const n = silvestres(j, forma);
      for (let i = 0; i < Math.min(n, 2); i++) out.push({ forma, cria: null, nombre: G.CREATURES[forma].name, descanso: Math.ceil((j.descanso || {})[forma + (i ? '~2' : '')] || 0), n: i, genes: aporte(j, { forma }).genes }); });
    (j.crias || []).forEach((q) => { if (lista(famDe(q.forma))) out.push({ forma: q.forma, cria: q.id, nombre: G.CREATURES[q.forma].name + ' nº ' + q.id, descanso: Math.ceil((j.descanso || {})[q.forma + '#' + q.id] || 0), genes: q.genes, mut: q.mut }); });
    return out;
  }
  const claveDesc = (ref) => ref.forma + (ref.cria ? '#' + ref.cria : ref.n ? '~2' : '');
  function validoRef(j, ref) { if (!ref || typeof ref.forma !== 'string' || !G.FORMAS[ref.forma] || !lista(famDe(ref.forma)) || G.FORMAS[ref.forma].stage !== 1) return false; return ref.cria ? (j.crias || []).some((q) => q.id === ref.cria && q.forma === ref.forma) : silvestres(j, ref.forma) > (ref.n ? 1 : 0); }
  function criar(est, j, o) {
    const n = G.npc && G.npc.cercano(est, j); if (!n || n.id !== 'doctora') return no(est, j, 'Para criar, habla con la Doctora Nora en el Laboratorio');
    const socio = o.socio && o.socio !== j.id ? est.jugadores[o.socio] : null, db = socio || j; if (o.socio && !socio) return no(est, j, 'Ese compañero no existe');
    if (socio && socio.mapa !== j.mapa) return no(est, j, 'Tu compañero tiene que estar contigo en el Laboratorio');
    if (!validoRef(j, o.a) || !validoRef(db, o.b)) return no(est, j, 'Esas criaturas no pueden criar');
    if (!socio && clave(o.a) === clave(o.b) && (o.a.cria || !!o.a.n === !!o.b.n)) return no(est, j, 'Hacen falta dos criaturas distintas');
    const ka = claveDesc(o.a), kb = claveDesc(o.b); if (((j.descanso || {})[ka] || 0) > 0 || ((db.descanso || {})[kb] || 0) > 0) return no(est, j, 'Una de las dos todavía está descansando');
    if ((j.huevos || []).length >= C.incubadoras) return no(est, j, 'Tus ' + C.incubadoras + ' incubadoras están ocupadas');
    if (!G.tienda.gastar(j, C.coste)) return no(est, j, 'Criar cuesta ' + C.coste + ' ✦ y tienes ' + G.tienda.saldo(j));
    j.criaN = (j.criaN | 0) + 1; const a = aporte(j, o.a), b = aporte(db, o.b);
    const h = { id: j.criaN, sem: hash([est.semilla, j.id, j.criaN, ka, kb, socio ? socio.id : ''].join('|')), a, b, coop: !!socio, socio: socio ? socio.id : null, pasos: 0, meta: C.pasosEclosion };
    (j.huevos = j.huevos || []).push(h); (j.descanso = j.descanso || {})[ka] = C.descansoPasos; (db.descanso = db.descanso || {})[kb] = C.descansoPasos;
    aviso(est, j, '¡Un huevo! Queda en la incubadora (-' + C.coste + ' ✦). Eclosionará andando ' + h.meta + ' pasos'); if (socio) aviso(est, socio, 'Tu criatura ha ayudado a poner un huevo: tus pasos también cuentan');
    return { ok: true, huevo: h.id };
  }
  function eclosionar(est, j, h) {
    const c = nacer(h); j.huevos.splice(j.huevos.indexOf(h), 1); if ((j.crias = j.crias || []).length >= C.maxCrias) { aviso(est, j, 'No caben más crías: el huevo se queda con la Doctora Nora'); return null; }
    const cr = Object.assign({ id: h.id }, c); j.crias.push(cr); G.equipo.agregar(j, { forma: cr.forma, mapa: 'laboratorio' });
    j.criaAct = j.criaAct || {}; if (!j.criaAct[cr.forma]) j.criaAct[cr.forma] = cr.id; j.criaNueva = cr.id;
    aviso(est, j, '¡El huevo eclosiona! Ha nacido ' + G.CREATURES[cr.forma].name + ' nº ' + cr.id + (cr.mut.length ? ' ¡con una mutación!' : '')); return cr;
  }
  // Un huevo hallado (cofres de las Profundidades): de una línea lista al azar de la semilla, con más probabilidad de mutación. false si no hay sitio o ninguna línea lista.
  function huevoHallado(est, j, sem) {
    const ls = validar().listas; if (!ls.length || (j.huevos || []).length >= C.incubadoras) return false; const fam = ls[(sem >>> 0) % ls.length], F = ficha(fam), genes = {}; genesDe(F).forEach((g) => { genes[g.id] = g.alelos[0].id; });
    j.criaN = (j.criaN | 0) + 1; const p = { forma: fam, genes, tal: tal1(), hab: habBase(fam, fam), nombre: 'Silvestre' };
    (j.huevos = j.huevos || []).push({ id: j.criaN, sem: hash('hallado|' + sem + '|' + j.id + '|' + j.criaN), a: p, b: JSON.parse(JSON.stringify(p)), coop: false, socio: null, pasos: 0, meta: C.pasosEclosion, hallado: true }); return true;
  }
  // pasos andados este cuadro: avanzan los huevos (los propios y, en cooperativo, los del compañero) y el descanso de los padres
  function andar(est) {
    Object.values(est.jugadores).forEach((j) => {
      const u = j.criaPos; j.criaPos = [j.mapa, j.x, j.y]; if (!u || u[0] !== j.mapa || j.remoto) return; const d = Math.hypot(j.x - u[1], j.y - u[2]); if (!(d > 0) || d > 12) return; const p = d / T;
      if (j.descanso) Object.keys(j.descanso).forEach((k) => { j.descanso[k] -= p; if (j.descanso[k] <= 0) delete j.descanso[k]; });
      Object.values(est.jugadores).forEach((o) => { (o.huevos || []).slice().forEach((h) => { if (o !== j && h.socio !== j.id) return; h.pasos += p; if (h.pasos >= h.meta && !o.remoto) eclosionar(est, o, h); }); });
    });
  }
  const activa = (j, forma) => { const id = j && j.criaAct && j.criaAct[forma]; return id ? (j.crias || []).find((q) => q.id === id && q.forma === forma) || null : null; };
  const talDe = (j, forma) => { const c = activa(j, forma); return c ? c.tal : null; };
  // lo que cambia en combate la cría activa de una especie: { tal, kit } o null
  function unidad(j, forma, idUnidad) { const c = activa(j, forma); if (!c) return null; const st = G.combate.statsDe({ forma }), kit = G.combate.kitDe(st.el, st.rar, idUnidad); if (habOk(c.hab)) kit[1] = c.hab; return { tal: c.tal, kit }; }
  function ponerActiva(est, j, o) { if (!G.FORMAS[o.forma]) return null; j.criaAct = j.criaAct || {}; if (!o.cria) { delete j.criaAct[o.forma]; return { ok: true, cria: null }; } if (!(j.crias || []).some((q) => q.id === o.cria && q.forma === o.forma)) return null; j.criaAct[o.forma] = o.cria; return { ok: true, cria: o.cria }; }
  // ───────── guardado ─────────
  const entero = (v, a, b) => (Number.isInteger(v) && v >= a && v <= b);
  function aporteOk(p) { if (!p || typeof p !== 'object' || !lista(p.forma)) return null; const F = ficha(p.forma), genes = {}; genesDe(F).forEach((g) => { genes[g.id] = g.alelos.some((a) => a.id === (p.genes || {})[g.id]) ? p.genes[g.id] : g.alelos[0].id; }); const tal = {}; STATS.forEach((s) => { const v = p.tal && p.tal[s]; tal[s] = Number.isFinite(v) ? Math.max(C.talento.min, Math.min(C.talento.max, v)) : 1; }); return { forma: p.forma, genes, tal, hab: habOk(p.hab) ? p.hab : habBase(p.forma, p.forma), nombre: typeof p.nombre === 'string' ? p.nombre.slice(0, 40) : '' }; }
  function serializarJ(j) { if (!j.huevos && !j.crias && !j.criaN) return undefined; return JSON.parse(JSON.stringify({ v: 1, n: j.criaN | 0, huevos: j.huevos || [], crias: j.crias || [], act: j.criaAct || {}, descanso: j.descanso || {} })); }
  function restaurarJ(j, d) {
    if (!d || typeof d !== 'object' || d.v !== 1) return false; j.criaN = entero(d.n, 0, 1e6) ? d.n : 0; j.huevos = []; j.crias = []; j.criaAct = {}; j.descanso = {};
    (Array.isArray(d.huevos) ? d.huevos : []).slice(0, C.incubadoras).forEach((h) => { const a = aporteOk(h && h.a), b = aporteOk(h && h.b); if (!a || !b || !entero(h.id, 1, 1e6) || !entero(h.sem, 0, 4294967295) || !Number.isFinite(h.pasos) || h.pasos < 0) return; j.huevos.push({ id: h.id, sem: h.sem, a, b, coop: !!h.coop, socio: typeof h.socio === 'string' ? h.socio.slice(0, 20) : null, pasos: Math.min(h.pasos, 1e6), meta: entero(h.meta, 1, 1e6) ? h.meta : C.pasosEclosion, hallado: h.hallado ? true : undefined }); });
    (Array.isArray(d.crias) ? d.crias : []).slice(0, C.maxCrias).forEach((c) => { const p = aporteOk(c); if (!p || !entero(c.id, 1, 1e6) || j.crias.some((q) => q.id === c.id)) return; j.crias.push({ id: c.id, forma: p.forma, genes: p.genes, tal: p.tal, hab: p.hab, mut: (Array.isArray(c.mut) ? c.mut : []).filter((g) => p.genes[g] !== undefined).slice(0, 8), padres: (Array.isArray(c.padres) ? c.padres : []).slice(0, 2).map((t) => String(t).slice(0, 40)), coop: !!c.coop }); });
    if (d.act && typeof d.act === 'object') Object.keys(d.act).slice(0, 200).forEach((f) => { if (j.crias.some((q) => q.forma === f && q.id === d.act[f])) j.criaAct[f] = d.act[f]; });
    if (d.descanso && typeof d.descanso === 'object') Object.keys(d.descanso).slice(0, 200).forEach((k) => { if (/^[a-z0-9_]{1,40}(#\d{1,7}|~2)?$/.test(k) && Number.isFinite(d.descanso[k]) && d.descanso[k] > 0) j.descanso[k] = Math.min(d.descanso[k], 1e6); });
    return true;
  }
  // ───────── simulador: reparto de rasgos y frecuencia de mutaciones al cruzar dos silvestres de una línea n veces ─────────
  function simular(fam, n, modo) {
    const F = ficha(fam), genes = {}; genesDe(F).forEach((g) => { genes[g.id] = g.alelos[0].id; }); const p = { forma: fam, genes, tal: tal1(), hab: habBase(fam, fam), nombre: 'A' }, r = { n, mut: 0, genes: {}, tal: { min: 9, max: 0, media: 0 } };
    let pa = p, pb = JSON.parse(JSON.stringify(p));
    for (let i = 0; i < n; i++) { const c = nacer({ sem: hash('sim|' + fam + '|' + i), a: pa, b: pb, coop: modo === 'coop', hallado: modo === 'hallado' }); if (c.mut.length) r.mut++; Object.keys(c.genes).forEach((g) => { (r.genes[g] = r.genes[g] || {})[c.genes[g]] = ((r.genes[g] || {})[c.genes[g]] || 0) + 1; });
      STATS.forEach((s) => { r.tal.min = Math.min(r.tal.min, c.tal[s]); r.tal.max = Math.max(r.tal.max, c.tal[s]); r.tal.media += c.tal[s] / (n * 4); });
      if (modo === 'linaje' && i % 2) { pa = Object.assign({}, c, { nombre: 'A' }); } else if (modo === 'linaje') pb = Object.assign({}, c, { nombre: 'B' }); }
    return r;
  }

  G.crianza = { C, STATS, hash, azar, ficha, fichas: () => FICHAS, famDe, validarFicha, validar, lista, lienzo, coloresDe, matriz, aporte, nacer, candidatos, criar, eclosionar, huevoHallado, andar, activa, talDe, unidad, ponerActiva, serializarJ, restaurarJ, simular, _olvidar: () => { memoVal = null; } };
  if (G.motor) {
    const aplicar0 = G.motor.aplicar;
    G.motor.aplicar = function (est, o) {
      if (o && (o.t === 'criar' || o.t === 'cria_activa')) { const j = est.jugadores[o.j]; if (!j) throw new Error('orden de un jugador que no existe: ' + o.j); return o.t === 'criar' ? criar(est, j, o) : ponerActiva(est, j, o); }
      return aplicar0.call(G.motor, est, o);
    };
    const jugadores0 = G.motor.moverJugadores; G.motor.moverJugadores = function (est, dt) { jugadores0.call(G.motor, est, dt); andar(est); };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = G.crianza;
})(typeof window !== 'undefined' ? window : globalThis);
