// profundidades.js — LAS PROFUNDIDADES (v2.320): cuevas generadas por semilla, puzles para dos, estado y órdenes. PURO: sin DOM, sin azar del sistema, sin relojes.
// Contenido = DATOS (datos/profundidades.json): salas prefabricadas, biomas, pisos especiales, modificadores, cofres. Guía: docs/GUIA_PROFUNDIDADES.md.
// Un piso es un MAPA normal del juego con id «prof_<bioma>_<semillaHex>_<piso>»: se genera solo a partir de su id (G.mundo.mapa lo pide a G.mundo.generador), así dos móviles ven lo mismo.
// Estado (serializable, con versión): est.prof = { v, n, exp: { n, sem, bioma0, dia, piso, mods, llaves, miembros, pisos: { n: { pal, bot, blo, hoy, cof, ok, sec, ven, abi, usa, visto } } } } · j.prof = { record, diaria }.
// Órdenes (G.motor.aplicar): { j, t:'prof', a:'accion'|'elegir'|'salir'|'reiniciar', … }. «hablar» junto a un objeto de la cueva equivale a 'accion'.
// Partes: A) datos y salas · B) resolutor de puzles · C) generador · D) verificador · E) estado, órdenes y avance · F) ganchos en el motor.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  const D = (G.DATOS && G.DATOS.profundidades) || (typeof require === 'function' ? require('../datos/profundidades.json') : null);
  if (!D) throw new Error('profundidades.js: faltan los datos (datos/profundidades.json)');
  const AJ = D.ajustes, BIOMAS = Object.keys(D.biomas).filter((k) => k[0] !== '_');
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const azar = (s) => { let a = s >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const h2 = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const SOLIDOS = { palanca: 1, cofre: 1, estela: 1, altar: 1, hoguera: 1, evento: 1, cristal_mapa: 1, estalagmita: 1 };   // elementos que ocupan su casilla
  const ACCION = { palanca: 1, cofre: 1, estela: 1, altar: 1, hoguera: 1, evento: 1, cristal_mapa: 1, cerradura: 1, grieta: 1, portal: 1 };

  // ───────────────────────── A) SALAS PREFABRICADAS ─────────────────────────
  const espejo = (filas, fh, fv) => { let f = filas.slice(); if (fv) f = f.reverse(); if (fh) f = f.map((r) => r.split('').reverse().join('')); return f; };
  // sala de datos → { id, w, h, g (filas de # . : i), els [{t,x,y,…}], E [x,y], S [x,y], canales }
  function prepararSala(s, fh, fv) {
    const filas = espejo(s.filas, fh, fv), h = filas.length, w = filas[0].length, g = [], els = []; let E = null, S = null;
    filas.forEach((r, y) => {
      if (r.length !== w) throw new Error('sala «' + s.id + '»: la fila ' + y + ' no mide ' + w);
      let o = '';
      for (let x = 0; x < w; x++) {
        const ch = r[x], L = (s.leyenda && s.leyenda[ch]) || D.leyenda[ch]; if (!L || !L.t) throw new Error('sala «' + s.id + '»: letra desconocida «' + ch + '»');
        if (L.t === 'roca') o += '#'; else if (L.t === 'foso') o += ':'; else if (L.t === 'hielo') o += 'i';
        else if (L.t === 'puerta' && L.estilo === 'puente') { o += ':'; els.push(Object.assign({ x, y }, L)); }
        else { o += '.'; if (L.t === 'entrada') E = [x, y]; else if (L.t === 'salida') S = [x, y]; else if (L.t !== 'suelo') els.push(Object.assign({ x, y }, L)); }
      }
      g.push(o);
    });
    return { id: s.id, tipo: s.tipo, dif: s.dif || 0, pista: s.pista || '', w, h, g, els, E, S, canales: s.canales || {}, cofres: s.cofres || null, fh: !!fh, fv: !!fv };
  }
  const SALAS = {}; D.salas.forEach((s) => { SALAS[s.id] = s; });
  function validarSala(s) {   // problemas de forma de una sala (lista vacía = bien)
    const e = []; let p;
    try { p = prepararSala(s); } catch (x) { return [x.message]; }
    const c = AJ.celda, borde = (q) => q && (q[0] === 0 || q[1] === 0 || q[0] === p.w - 1 || q[1] === p.h - 1);
    if (s.tipo !== 'campamento' && (p.w > c[0] - 4 || p.h > c[1] - 4)) e.push('sala «' + s.id + '»: mide ' + p.w + '×' + p.h + ' y el máximo es ' + (c[0] - 4) + '×' + (c[1] - 4));
    if (s.tipo !== 'campamento') { if (!borde(p.E)) e.push('sala «' + s.id + '»: falta la entrada E en el borde'); if (!borde(p.S)) e.push('sala «' + s.id + '»: falta la salida S en el borde'); }
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if ((x === 0 || y === 0 || x === p.w - 1 || y === p.h - 1) && p.g[y][x] !== '#' && !(p.E && p.E[0] === x && p.E[1] === y) && !(p.S && p.S[0] === x && p.S[1] === y)) e.push('sala «' + s.id + '»: el borde debe ser roca (' + x + ',' + y + ')');
    const fuentes = {}, puertas = {};
    p.els.forEach((q) => { if (q.t === 'placa' || q.t === 'boton' || q.t === 'palanca') fuentes[q.canal] = 1; if (q.t === 'puerta') puertas[q.canal] = 1; });
    Object.keys(puertas).forEach((k) => { if (k !== 'jefe' && !fuentes[k]) e.push('sala «' + s.id + '»: la puerta del canal «' + k + '» no tiene placa, botón ni palanca'); });
    Object.keys(fuentes).forEach((k) => { if (!puertas[k]) e.push('sala «' + s.id + '»: el canal «' + k + '» no abre ninguna puerta'); });
    const tp = {}; p.els.forEach((q) => { if (q.t === 'teleporte') tp[q.par] = (tp[q.par] || 0) + 1; }); Object.keys(tp).forEach((k) => { if (tp[k] !== 2) e.push('sala «' + s.id + '»: el teleporte «' + k + '» necesita exactamente 2 círculos'); });
    if (s.tipo === 'puzle' && !(s.dif >= 1 && s.dif <= 3)) e.push('sala «' + s.id + '»: un puzle necesita dif 1, 2 o 3');
    if (s.tipo === 'puzle' && !s.pista) e.push('sala «' + s.id + '»: un puzle necesita «pista»');
    return e;
  }

  // ───────────────────────── B) RESOLUTOR DE PUZLES ─────────────────────────
  // Búsqueda en anchura sobre (posición de cada jugador, rocas, palancas, botones, secuencias, fosos tapados). Meta: un jugador pisa la salida S.
  // opciones.solo = 0 | 1 → juega un único jugador con esa runa (para demostrar que hacen falta los dos). Devuelve { ok, pasos, estados }.
  function resolver(p, op) {
    op = op || {}; const w = p.w, h = p.h, N = w * h, id = (x, y) => y * w + x, solo = op.solo, MAX = op.max || 400000;
    const en = new Array(N).fill(null); p.els.forEach((q) => { if (q.t !== 'bloque') en[id(q.x, q.y)] = q; });
    const pal = p.els.filter((q) => q.t === 'palanca'), bot = p.els.filter((q) => q.t === 'boton'), plc = p.els.filter((q) => q.t === 'placa');
    const canales = {}; p.els.forEach((q) => { if (q.t === 'placa' || q.t === 'boton' || q.t === 'palanca') (canales[q.canal] = canales[q.canal] || []).push(q); });
    const nsec = {}; Object.keys(canales).forEach((k) => { if (p.canales[k] === 'sec') nsec[k] = canales[k].filter((q) => q.t === 'palanca').length; });
    const ini = { pj: solo === undefined ? [id(p.E[0], p.E[1]), id(p.E[0], p.E[1])] : [id(p.E[0], p.E[1])], bl: p.els.filter((q) => q.t === 'bloque').map((q) => id(q.x, q.y)).sort((a, b) => a - b), pa: 0, bo: 0, sec: {}, hoy: [] };
    const clave = (s) => s.pj.join(',') + '|' + s.bl.join(',') + '|' + s.pa + '|' + s.bo + '|' + Object.keys(s.sec).map((k) => k + s.sec[k]).join('') + '|' + s.hoy.join(',');
    const fuente = (s, q) => q.t === 'placa' ? (s.pj.indexOf(id(q.x, q.y)) >= 0 || s.bl.indexOf(id(q.x, q.y)) >= 0) : q.t === 'boton' ? !!(s.bo >> bot.indexOf(q) & 1) : !!(s.pa >> pal.indexOf(q) & 1);
    const activo = (s, k) => { const f = canales[k] || []; if (p.canales[k] === 'sec') return (s.sec[k] | 0) >= nsec[k]; if (p.canales[k] === 'and') return f.length > 0 && f.every((q) => fuente(s, q)); return f.some((q) => fuente(s, q)); };
    const abierta = (s, q) => activo(s, q.canal) !== !!q.inv;
    const slotDe = (k) => (solo === undefined ? k : solo);
    const libre = (s, i, k) => {   // ¿puede el jugador k estar en la casilla i?
      const x = i % w, y = (i / w) | 0, b = p.g[y][x], q = en[i]; if (b === '#') return false;
      if (b === ':' && s.hoy.indexOf(i) < 0 && !(q && q.t === 'puerta' && abierta(s, q))) return false;
      if (q) { if (q.t === 'palanca' || SOLIDOS[q.t]) return false; if (q.t === 'puerta' && b !== ':' && !abierta(s, q)) return false; if (q.t === 'runa' && q.slot !== slotDe(k)) return false; }
      return true;
    };
    const meta = id(p.S[0], p.S[1]); const vistos = new Set([clave(ini)]); let cola = [ini], pasos = 0;
    const llegar = (s, k, i) => { const q = en[i]; if (q && q.t === 'boton') s.bo |= 1 << bot.indexOf(q); if (q && q.t === 'teleporte') { const o = p.els.find((z) => z.t === 'teleporte' && z.par === q.par && z !== q); s.pj[k] = id(o.x, o.y); } };
    while (cola.length) {
      const sig = [];
      for (const s of cola) {
        if (s.pj.indexOf(meta) >= 0) return { ok: true, pasos, estados: vistos.size };
        for (let k = 0; k < s.pj.length; k++) {
          const i0 = s.pj[k], x0 = i0 % w, y0 = (i0 / w) | 0;
          for (const [dx, dy] of DIR4) {
            let x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue; let i = id(x, y);
            const n = { pj: s.pj.slice(), bl: s.bl, pa: s.pa, bo: s.bo, sec: s.sec, hoy: s.hoy }, bi = s.bl.indexOf(i);
            if (bi >= 0) {   // empujar una roca
              const bx = x + dx, by = y + dy; if (bx < 0 || by < 0 || bx >= w || by >= h) continue; const j = id(bx, by), bb = p.g[by][bx], q = en[j];
              if (bb === '#' || bb === 'i' || s.bl.indexOf(j) >= 0 || s.pj.indexOf(j) >= 0) continue;
              if (q && (q.t === 'palanca' || SOLIDOS[q.t] || q.t === 'runa' || q.t === 'teleporte' || (q.t === 'puerta' && !abierta(s, q)))) continue;
              n.bl = s.bl.slice();
              if (bb === ':' && s.hoy.indexOf(j) < 0 && !(q && q.t === 'puerta')) { n.bl.splice(bi, 1); n.hoy = s.hoy.concat(j).sort((a, b) => a - b); } else { n.bl[bi] = j; n.bl.sort((a, b) => a - b); }
              if (!libre(n, i, k)) continue; n.pj[k] = i;
            } else {
              if (!libre(s, i, k)) continue; n.pj[k] = i;
              while (p.g[y][x] === 'i') {   // hielo: resbala hasta chocar (pared, roca o compañero) o salir del hielo
                const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) break; const j = id(nx, ny);
                if (!libre(s, j, k) || s.bl.indexOf(j) >= 0 || s.pj.some((q, kk) => kk !== k && q === j)) break; x = nx; y = ny; i = j; n.pj[k] = i;
              }
              llegar(n, k, i);
            }
            const c = clave(n); if (!vistos.has(c)) { vistos.add(c); sig.push(n); }
          }
          for (const [dx, dy] of DIR4) {   // accionar una palanca vecina
            const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue; const q = en[id(x, y)]; if (!q || q.t !== 'palanca') continue;
            const n = { pj: s.pj, bl: s.bl, pa: s.pa, bo: s.bo, sec: s.sec, hoy: s.hoy };
            if (p.canales[q.canal] === 'sec') { const v = s.sec[q.canal] | 0; n.sec = Object.assign({}, s.sec); n.sec[q.canal] = q.orden === v + 1 ? v + 1 : q.orden <= v ? v : 0; } else n.pa = s.pa ^ (1 << pal.indexOf(q));
            const c = clave(n); if (!vistos.has(c)) { vistos.add(c); sig.push(n); }
          }
        }
        if (vistos.size > MAX) return { ok: false, pasos, estados: vistos.size, limite: true };
      }
      cola = sig; pasos++;
    }
    return { ok: false, pasos, estados: vistos.size };
  }
  const memoPuzle = {};
  // ¿El puzle (con su espejo) tiene solución con dos jugadores y NO la tiene con uno solo? → { ok, motivo?, pasos }
  function comprobarPuzle(idSala, fh, fv) {
    const k = idSala + (fh ? 'h' : '') + (fv ? 'v' : ''); if (memoPuzle[k]) return memoPuzle[k];
    const p = prepararSala(SALAS[idSala], fh, fv), duo = resolver(p), s0 = resolver(p, { solo: 0 }), s1 = resolver(p, { solo: 1 });
    const r = duo.limite || s0.limite || s1.limite ? { ok: false, motivo: 'demasiado grande para el resolutor' } : !duo.ok ? { ok: false, motivo: 'no tiene solución con dos jugadores' } : s0.ok || s1.ok ? { ok: false, motivo: 'lo resuelve un jugador solo' } : { ok: true, pasos: duo.pasos };
    return (memoPuzle[k] = r);
  }

  // ───────────────────────── C) GENERADOR ─────────────────────────
  const RE_ID = /^prof_([a-z]+)_([0-9a-f]{1,8})_(\d{1,4})$/;
  const idMapa = (bioma0, sem, piso) => 'prof_' + bioma0 + '_' + (sem >>> 0).toString(16) + '_' + piso;
  function analizar(id) { const m = RE_ID.exec(id || ''); if (!m || BIOMAS.indexOf(m[1]) < 0) return null; return { bioma0: m[1], sem: parseInt(m[2], 16) >>> 0, piso: +m[3] }; }
  // Qué toca en un piso: bioma (uno por tramo de «jefeCada» pisos, barajados por la semilla y empezando por el de la entrada), tipo (normal | jefe | especial) y cuál especial.
  function plan(sem, bioma0, piso) {
    const C = AJ.jefeCada, tramo = Math.floor((piso - 1) / C), pos = (piso - 1) % C + 1, r = azar(hash('orden|' + sem));
    const resto = BIOMAS.filter((b) => b !== bioma0); for (let i = resto.length - 1; i > 0; i--) { const k = (r() * (i + 1)) | 0; [resto[i], resto[k]] = [resto[k], resto[i]]; }
    const orden = [bioma0].concat(resto), bioma = orden[tramo % orden.length], rt = azar(hash('tramo|' + sem + '|' + tramo)), posEsp = 2 + ((rt() * (C - 2)) | 0);
    let tipo = pos === C ? 'jefe' : 'normal', especial = null;
    if (tipo === 'normal' && pos === posEsp) { const c = D.pisosEspeciales.filter((e) => piso >= (e.desde || 1)); if (c.length) { let t = rt() * c.reduce((s, e) => s + e.peso, 0); especial = c[c.length - 1]; for (const e of c) { if ((t -= e.peso) < 0) { especial = e; break; } } tipo = 'especial'; } }
    return { bioma, tipo, especial: especial ? especial.id : null, sala: especial ? especial.sala : null, tramo, pos, nombre: especial ? especial.nombre : tipo === 'jefe' ? 'Guarida del jefe' : D.biomas[bioma].nombre };
  }
  const memoPisos = new Map();
  function generar(id) {
    if (memoPisos.has(id)) return memoPisos.get(id);
    const a = analizar(id); if (!a) return null; let j = null;
    if (a.piso === 0) j = construir(id, a, { bioma: a.bioma0, tipo: 'campamento', nombre: 'Campamento' }, azar(hash(id)), false);
    else { const pl = plan(a.sem, a.bioma0, a.piso);
      for (let k = 0; k < 40 && !j; k++) { let c = null; try { c = construir(id, a, pl, azar(hash(id + '|' + k)), k >= 30); } catch (e) { if (!/^gen:/.test(e.message)) throw e; if (prof.depura) prof.depura(e.message); } if (c) { const pr = verificar(c); if (!pr.length) { j = c; j.prof.intento = k; } else if (prof.depura) prof.depura('verificar: ' + pr[0]); } }
      if (!j) throw new Error('profundidades: no se pudo generar ' + id); }
    memoPisos.set(id, j); if (memoPisos.size > 12) memoPisos.delete(memoPisos.keys().next().value);
    return j;
  }
  const falla = (t) => { throw new Error('gen:' + t); };
  function construir(id, a, pl, rnd, recto) {
    const [CW, CH] = AJ.celda, [GX, GY] = AJ.rejilla, B = D.biomas[pl.bioma], mec = B.mecanica || {};
    const esCamp = pl.tipo === 'campamento', W = esCamp ? 15 : GX * CW + 2, H = esCamp ? 12 : GY * CH + 2;
    const g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill('#'));
    const res = new Uint8Array(W * H), I = (x, y) => y * W + x, dentro = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1;
    const els = [], salas = [], zonas = [], npcs = [], luces = [], deco = [], lazos = [];
    const ent = (a0, b0) => a0 + ((rnd() * (b0 - a0 + 1)) | 0), mezcla = (l) => { for (let i = l.length - 1; i > 0; i--) { const k = (rnd() * (i + 1)) | 0; [l[i], l[k]] = [l[k], l[i]]; } return l; };
    const elegir = (l) => l[(rnd() * l.length) | 0];
    // estampa una sala prefabricada con su esquina en (x0, y0)
    function estampar(p, x0, y0) {
      const si = salas.length, sala = { i: si, id: p.id, tipo: p.tipo, x: x0, y: y0, w: p.w, h: p.h, pista: p.pista, canales: p.canales, E: p.E ? [x0 + p.E[0], y0 + p.E[1]] : null, S: p.S ? [x0 + p.S[0], y0 + p.S[1]] : null, fh: p.fh, fv: p.fv };
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { g[y0 + y][x0 + x] = p.g[y][x]; res[I(x0 + x, y0 + y)] = 1; }
      let nc = 0; p.els.forEach((q) => { const e = Object.assign({}, q, { x: x0 + q.x, y: y0 + q.y, sala: si }); if (e.canal && e.canal !== 'jefe') e.canal = si + ':' + e.canal; if (e.t === 'cofre') e.rar = (p.cofres && p.cofres[nc++]) || null; els.push(e); });
      const fuera = (q) => { const lx = q[0] - x0, ly = q[1] - y0; return lx === 0 ? [q[0] - 1, q[1]] : lx === p.w - 1 ? [q[0] + 1, q[1]] : ly === 0 ? [q[0], q[1] - 1] : [q[0], q[1] + 1]; };
      if (sala.E) sala.pe = fuera(sala.E); if (sala.S) sala.ps = fuera(sala.S);
      salas.push(sala); return sala;
    }
    const meta = { v: 1, sem: a.sem, bioma0: a.bioma0, piso: a.piso, bioma: pl.bioma, tipo: pl.tipo, especial: pl.especial || null, nombre: pl.nombre, mecanica: mec.tipo || null };
    const cerrar = (extra) => {
      const suelo = g.map((r) => r.map((c) => (c === '#' ? 'x' : 'c')).join(''));
      return { formato: 1, id, nombre: pl.nombre, region: null, tema: 'prof_' + pl.bioma, ancho: W, alto: H, suelo, anclas: extra.anclas, puertas: [], conexiones: { norte: null, sur: null, este: null, oeste: null }, zonas, npcs,
        prof: Object.assign(meta, { g: g.map((r) => r.join('')), els, salas, luces, deco, lazos, entrada: extra.anclas.entrada, salida: extra.salida || null, largo: extra.largo || 0, celdas: extra.celdas || [] }) };
    };
    if (esCamp) {
      const p = prepararSala(SALAS.campamento), s = estampar(p, 2, 2), sub = els.find((e) => e.t === 'subida');
      els.forEach((e) => { if (e.t === 'hoguera') luces.push({ x: e.x, y: e.y, r: 4.5, c: '#ffb347', f: 1 }); if (e.t === 'portal') luces.push({ x: e.x, y: e.y, r: 2.5, c: B.paleta.acento }); });
      decorar(); return cerrar({ anclas: { entrada: [sub.x, sub.y - 1], inicio: [sub.x, sub.y - 1] } });
    }
    // 1) camino por la rejilla de huecos
    const esp = pl.tipo === 'especial', jefe = pl.tipo === 'jefe';
    const L = esp ? 3 : jefe ? 4 : Math.max(AJ.caminoMin, Math.min(AJ.caminoMax, AJ.caminoMin + Math.min(2, Math.floor(a.piso / 4)) + (rnd() < 0.5 ? 0 : 1)));
    let cam = null;
    for (let t = 0; t < 60 && !cam; t++) {
      const usado = {}, c = [recto ? [0, ent(0, GY - 1)] : [ent(0, GX - 1), ent(0, GY - 1)]]; usado[c[0]] = 1;
      while (c.length < L) { const [x, y] = c[c.length - 1], v = mezcla((recto ? [[1, 0]] : DIR4.slice()).map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < GX && ny < GY && !usado[[nx, ny]])); if (!v.length) break; c.push(v[0]); usado[v[0]] = 1; }
      if (c.length === L) cam = c;
    }
    if (!cam) falla('camino');
    // 2) papel de cada hueco (ritmo: entrada → combate → puzle → tesoro → minijefe → … → llave → salida)
    const RITMO = ['combate', 'puzle', 'tesoro', 'minijefe', 'puzle', 'combate'];
    const papeles = cam.map((c, i) => (i === 0 ? 'entrada' : i === L - 1 ? 'salida' : esp ? 'especial' : jefe ? (i === 1 ? 'descanso' : 'jefe') : RITMO[(i - 1) % RITMO.length]));
    const celdas = cam.map((c, i) => ({ cx: c[0], cy: c[1], x0: 1 + c[0] * CW, y0: 1 + c[1] * CH, papel: papeles[i], n: i }));
    const ocup = {}; celdas.forEach((c) => { ocup[[c.cx, c.cy]] = c; });
    const libreJunto = (c) => mezcla(DIR4.slice()).map(([dx, dy]) => [c.cx + dx, c.cy + dy]).find(([x, y]) => x >= 0 && y >= 0 && x < GX && y < GY && !ocup[[x, y]]);
    const rama = (desde, papel) => { const q = libreJunto(desde); if (!q) return null; const c = { cx: q[0], cy: q[1], x0: 1 + q[0] * CW, y0: 1 + q[1] * CH, papel, n: celdas.length, de: desde.n }; celdas.push(c); ocup[q] = c; return c; };
    let cLlave = null, cSecreto = null; const hayMini = papeles.indexOf('minijefe') >= 0, conLlave = !esp && !jefe && a.piso >= AJ.llaveEnPisoDesde;
    if (!esp && !jefe && !recto) {
      const cand = mezcla(celdas.slice(1, L - 1).filter((c) => c.papel !== 'puzle'));
      for (const c of cand) { if (!cLlave) { cLlave = rama(c, hayMini ? 'cofre' : 'llave'); continue; } if (!cSecreto && rnd() < 0.75) { cSecreto = rama(c, 'secreto'); break; } }
    }
    // 3) salas: prefabricadas (puzle, jefe, especiales) o cavernas orgánicas
    const difMax = a.piso <= 2 ? 1 : a.piso <= 6 ? 2 : 3, puzles = D.salas.filter((s) => s.tipo === 'puzle' && s.dif <= difMax && s.dif >= (a.piso > 12 ? 2 : 1));
    const dirA = (c, o) => (o ? [o.cx - c.cx, o.cy - c.cy] : null), usadas = {};
    celdas.forEach((c, i) => {
      const previo = i > 0 && i < L ? celdas[i - 1] : null, sig = i < L - 1 ? celdas[i + 1] : null;
      let idSala = c.papel === 'puzle' ? null : c.papel === 'jefe' ? 'arena_jefe' : c.papel === 'especial' ? pl.sala : c.papel === 'descanso' ? 'refugio' : null;
      if (c.papel === 'puzle') { const disp = puzles.filter((s) => !usadas[s.id]); idSala = elegir(disp.length ? disp : puzles).id; usadas[idSala] = 1; }
      if (idSala) {
        const dp = dirA(c, previo), ds = dirA(c, sig), fh = ds && ds[0] ? ds[0] < 0 : dp && dp[0] ? dp[0] > 0 : rnd() < 0.5, fv = rnd() < 0.5;
        const p = prepararSala(SALAS[idSala], fh, fv); if (p.tipo === 'puzle' && !comprobarPuzle(idSala, fh, fv).ok) falla('puzle sin solución: ' + idSala);
        c.sala = estampar(p, c.x0 + ent(2, CW - 2 - p.w), c.y0 + ent(2, CH - 2 - p.h));
      } else caverna(c);
    });
    function caverna(c) {   // mancha orgánica dentro del hueco (con 1 casilla de roca alrededor): elipse con ruido + un pase de suavizado; se conserva la parte unida al centro
      const x1 = c.x0 + 1, y1 = c.y0 + 1, x2 = c.x0 + CW - 2, y2 = c.y0 + CH - 2, mx = (x1 + x2) >> 1, my = (y1 + y2) >> 1, grande = c.papel === 'combate' || c.papel === 'minijefe' || c.papel === 'entrada';
      const rx = (grande ? 4.6 : 3.3) + rnd() * 1.5, ry = (grande ? 3.5 : 2.6) + rnd() * 1.1, ox = (rnd() - 0.5) * 1.4, oy = (rnd() - 0.5) * 1, k = (rnd() * 1000) | 0, f = {};
      for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) { const d = Math.hypot((x - mx - ox) / rx, (y - my - oy) / ry), ang = Math.atan2(y - my, x - mx); if (d < 0.78 + 0.3 * Math.sin(ang * 3 + k) * 0.5 + (h2(x, y, k) - 0.5) * 0.42) f[I(x, y)] = 1; }
      const cuenta = (x, y) => { let n = 0; for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) if ((a2 || b) && f[I(x + a2, y + b)]) n++; return n; };
      const f2 = {}; for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) { const n = cuenta(x, y); if (f[I(x, y)] ? n >= 3 : n >= 5) f2[I(x, y)] = 1; }
      for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) f2[I(mx + a2, my + b)] = 1;
      const vis = {}, pila = [[mx, my]]; vis[I(mx, my)] = 1; const lista = [];
      while (pila.length) { const [x, y] = pila.pop(); lista.push([x, y]); g[y][x] = '.'; DIR4.forEach(([dx, dy]) => { const q = I(x + dx, y + dy); if (f2[q] && !vis[q]) { vis[q] = 1; pila.push([x + dx, y + dy]); } }); }
      c.centro = [mx, my]; c.suelo = lista; c.caja = [x1, y1, x2, y2];
    }
    // 4) pasillos: camino más corto con ruido (sinuoso) dentro de los dos huecos que une, sin tocar salas prefabricadas ni otros pasillos de un hueco con sala
    const puertoDe = (c, hacia) => (c.sala ? (hacia === 'S' ? c.sala.ps : c.sala.pe) : c.centro);
    const veto = new Set();
    celdas.forEach((c) => { if (c.sala) [c.sala.pe, c.sala.ps].forEach((q) => { if (q) for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) veto.add(I(q[0] + a2, q[1] + b)); }); });
    function pasillo(ca, cb, pa, pb) {
      const zona = (x, y) => [ca, cb].some((c) => x > c.x0 && y > c.y0 && x < c.x0 + CW - 1 && y < c.y0 + CH - 1) || enPuente(x, y);
      const hx = ca.cx !== cb.cx, enPuente = (x, y) => { if (hx) { const xb = Math.max(ca.x0, cb.x0); return (x === xb || x === xb - 1) && y > ca.y0 + 1 && y < ca.y0 + CH - 2; } const yb = Math.max(ca.y0, cb.y0); return (y === yb || y === yb - 1) && x > ca.x0 + 1 && x < ca.x0 + CW - 2; };
      const propio = new Set(); [pa, pb].forEach((q) => { for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) propio.add(I(q[0] + a2, q[1] + b)); });
      const k = (rnd() * 1000) | 0, dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1), s = I(pa[0], pa[1]), t = I(pb[0], pb[1]); dist[s] = 0; const ab = [s];
      while (ab.length) {
        let bi = 0; for (let i = 1; i < ab.length; i++) if (dist[ab[i]] < dist[ab[bi]]) bi = i; const u = ab.splice(bi, 1)[0]; if (u === t) break; const ux = u % W, uy = (u / W) | 0;
        for (const [dx, dy] of DIR4) { const x = ux + dx, y = uy + dy, v = I(x, y); if (!dentro(x, y) || !zona(x, y) || res[v] === 1 || (res[v] === 2 && v !== t) || (veto.has(v) && !propio.has(v))) continue;
          const c = dist[u] + (g[y][x] === '#' ? 1 + 4.5 * h2(x >> 1, y >> 1, k) : 0.35); if (c < dist[v]) { if (dist[v] === Infinity) ab.push(v); dist[v] = c; prev[v] = u; } }
      }
      if (dist[t] === Infinity) falla('pasillo');
      const cam2 = []; for (let u = t; u !== -1; u = prev[u]) cam2.push([u % W, (u / W) | 0]); cam2.reverse();
      const nuevos = cam2.filter(([x, y]) => g[y][x] === '#'); nuevos.forEach(([x, y]) => { g[y][x] = '.'; });
      [ca, cb].forEach((c) => { if (c.sala) cam2.forEach(([x, y]) => { if (x >= c.x0 && y >= c.y0 && x < c.x0 + CW && y < c.y0 + CH) for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) if (res[I(x + a2, y + b)] === 0) res[I(x + a2, y + b)] = 2; }); });
      return { cam: cam2, nuevos, enPuente, a: ca, b: cb };
    }
    // casilla del pasillo que hace de cuello de botella (solo toca a su anterior y a su siguiente): ahí van rejas, cerraduras y grietas
    function cuello(pas) { const c = pas.cam; for (let i = 1; i < c.length - 1; i++) { const [x, y] = c[i]; if (!pas.enPuente(x, y) || !pas.nuevos.some((q) => q[0] === x && q[1] === y)) continue; const v = DIR4.filter(([dx, dy]) => g[y + dy][x + dx] !== '#').length; if (v === 2 && !els.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) <= 1)) return { x, y, i }; } return null; }
    const enlaces = [];
    for (let i = 0; i < L - 1; i++) { const ca = celdas[i], cb = celdas[i + 1]; enlaces.push({ a: ca, b: cb, pas: pasillo(ca, cb, puertoDe(ca, 'S'), puertoDe(cb, 'E')) }); }
    celdas.slice(L).forEach((c) => { const de = celdas[c.de]; if (de.sala) falla('rama desde sala'); enlaces.push({ a: de, b: c, pas: pasillo(de, c, de.centro, c.centro), rama: true }); });
    // 4b) ensanche orgánico de los pasillos entre cavernas: lejos del cuello (donde van las puertas) y siempre dentro del hueco
    const ensanchar = (pas) => { if (pas.a.sala || pas.b.sala) return; pas.nuevos.forEach(([x, y], n) => { if (pas.enPuente(x, y) || h2(x, y, 11) > 0.55) return; const c = [pas.a, pas.b].find((q) => x > q.x0 + 1 && y > q.y0 + 1 && x < q.x0 + CW - 2 && y < q.y0 + CH - 2); if (!c) return;
      const [dx, dy] = DIR4[(h2(x, y, 5) * 4) | 0], nx = x + dx, ny = y + dy; if (nx > c.x0 + 1 && ny > c.y0 + 1 && nx < c.x0 + CW - 2 && ny < c.y0 + CH - 2 && g[ny][nx] === '#' && res[I(nx, ny)] === 0 && !DIR4.some(([ex, ey]) => pas.enPuente(nx + ex, ny + ey))) g[ny][nx] = '.'; }); };
    enlaces.forEach((e) => ensanchar(e.pas));
    // 5) elementos de cada hueco
    const interior = (c) => mezcla(c.suelo.filter(([x, y]) => { for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) if (g[y + b][x + a2] === '#') return false; return Math.abs(x - c.centro[0]) + Math.abs(y - c.centro[1]) >= 2; }));
    const ocupadas = [], sitio = (c, sep, centro) => { let q = interior(c).find(([x, y]) => ocupadas.every(([a2, b]) => Math.max(Math.abs(a2 - x), Math.abs(b - y)) >= (sep || 3))); if (!q && centro && ocupadas.every(([a2, b]) => a2 !== c.centro[0] || b !== c.centro[1])) q = c.centro.slice(); if (q) ocupadas.push(q); return q || null; };
    const elem = B.elementos, fams = (rar, fase) => (G.LINEAS || []).filter((Ln) => Ln.elements.some((e) => elem.indexOf(e) >= 0) && (rar.indexOf(Ln.rarity) >= 0) && Ln.formas.length >= fase);
    function guarida(x, y, tipo) {   // jefe de piso: una línea rara o épica del elemento del bioma, en su fase más alta
      let c = fams(tipo === 'minijefe' ? ['comun', 'rara'] : ['rara', 'epica'], 2); if (!c.length) c = fams(['comun', 'rara', 'epica'], 2); if (!c.length) c = (G.LINEAS || []).filter((Ln) => Ln.rarity !== 'legendaria' && Ln.formas.length >= 2); const Ln = c.length ? elegir(c) : null; if (!Ln) return null;
      const forma = Ln.formas[tipo === 'minijefe' ? 1 : Ln.formas.length - 1].id; npcs.push({ id: Ln.fam, x, y, tipo: 'guarida', forma, jefe: tipo }); return 'guarida:' + Ln.fam;
    }
    let grupoJefe = null, grupoMini = null;
    celdas.forEach((c) => {
      if (c.sala) { els.forEach((e) => { if (e.sala !== c.sala.i) return; if (e.t === 'jefe') grupoJefe = guarida(e.x, e.y, pl.especial === 'jefe_oculto' ? 'oculto' : 'jefe'); if (e.t === 'mercader') npcs.push({ id: 'tendero', tipo: 'npc', nombre: 'Buhonero', x: e.x, y: e.y, dir: 'down', alcance: 2.2 }); if (e.t === 'hoguera') luces.push({ x: e.x, y: e.y, r: 4, c: '#ffb347', f: 1 }); if (e.t === 'altar' || e.t === 'evento') luces.push({ x: e.x, y: e.y, r: 3, c: B.paleta.acento }); }); return; }
      const [mx, my] = c.centro;
      if (c.papel === 'entrada') els.push({ t: 'subida', x: mx, y: my });
      if (c.papel === 'salida') { els.push({ t: 'bajada', x: mx, y: my }); if (jefe) { const q = sitio(c); if (q) els.push({ t: 'cofre', x: q[0], y: q[1], rar: 'epica' }); } }
      if (c.papel === 'combate' || c.papel === 'minijefe') { zonas.push({ id: 'z' + c.n, x: c.caja[0], y: c.caja[1], w: c.caja[2] - c.caja[0] + 1, h: c.caja[3] - c.caja[1] + 1, elemento: elegir(elem) }); c.zona = 'z' + c.n; }
      if (c.papel === 'minijefe') { const q = sitio(c); if (q) grupoMini = guarida(q[0], q[1], 'minijefe'); }
      if (c.papel === 'tesoro' || c.papel === 'cofre') { const q = sitio(c, 3, true); if (q) els.push({ t: 'cofre', x: q[0], y: q[1], rar: null }); }
      if (c.papel === 'secreto') { const q = sitio(c, 3, true); if (q) els.push({ t: 'cofre', x: q[0], y: q[1], rar: rnd() < 0.3 ? 'epica' : 'rara' }); }
      if (c.papel === 'llave') { const q = sitio(c, 2, true); if (q) els.push({ t: 'llave', x: q[0], y: q[1] }); else falla('llave'); }
    });
    if (conLlave && !cLlave && !hayMini) { const c = celdas.find((q) => q.papel === 'tesoro') || celdas[1]; if (c.sala) falla('sin sitio para la llave'); const q = sitio(c, 2); if (!q) falla('llave'); els.push({ t: 'llave', x: q[0], y: q[1] }); }
    if (hayMini && !grupoMini) falla('minijefe');
    if (grupoMini) meta.mini = grupoMini; if (grupoJefe) meta.jefe = grupoJefe;
    // 6) puertas en los pasillos: reja de combate, cerradura antes de la salida, grieta del secreto
    enlaces.forEach((e) => {
      const q = () => cuello(e.pas) || falla('cuello');
      if (!e.rama && e.b.papel === 'salida' && conLlave) { const c = q(); els.push({ t: 'cerradura', x: c.x, y: c.y }); }
      else if (!e.rama && (e.a.papel === 'combate' || e.a.papel === 'minijefe') && e.a.zona) { const c = q(); els.push({ t: 'puerta', x: c.x, y: c.y, canal: 'vencer:' + (e.a.papel === 'minijefe' ? grupoMini : e.a.zona), estilo: 'sello' }); }
      else if (e.rama && e.b.papel === 'secreto') { const c = q(); els.push({ t: 'grieta', x: c.x, y: c.y }); }
    });
    // 7) atajo: un pasillo extra entre dos cavernas vecinas del camino que no son consecutivas, cerrado por una reja cuya palanca está en el lado lejano
    if (!esp && !jefe && !recto) for (let i = 0; i < L && !lazos.length; i++) for (let k = L - 1; k >= i + 3; k--) {
      const ca = celdas[i], cb = celdas[k]; if (ca.sala || cb.sala || Math.abs(ca.cx - cb.cx) + Math.abs(ca.cy - cb.cy) !== 1) continue; if (k === L - 1 && conLlave) continue;
      const pas = pasillo(ca, cb, ca.centro, cb.centro), c = cuello(pas); if (!c) falla('atajo');
      let pal = null; for (let n = c.i + 1; n < pas.cam.length - 1 && !pal; n++) { const [x, y] = pas.cam[n]; for (const [dx, dy] of DIR4) { const px = x + dx, py = y + dy; if (g[py][px] === '#' && res[I(px, py)] !== 1 && dentro(px, py) && !els.some((e) => e.x === px && e.y === py) && DIR4.filter(([ex, ey]) => g[py + ey][px + ex] !== '#').length === 1) { pal = [px, py]; break; } } }
      if (!pal) falla('palanca del atajo');
      els.push({ t: 'puerta', x: c.x, y: c.y, canal: 'atajo', estilo: 'reja' }); els.push({ t: 'palanca', x: pal[0], y: pal[1], canal: 'atajo', pared: true }); lazos.push([i, k]); break;
    }
    // 8) mecánica ambiental del bioma (hielo, charcos, esporas, cristales del mapa): solo en cavernas, nunca en la de entrada ni bajo un elemento
    const hayEl = (x, y) => els.some((e) => e.x === x && e.y === y);
    celdas.forEach((c) => {
      if (c.sala || c.papel === 'entrada' || !mec.tipo) return; const k = (rnd() * 1000) | 0;
      if (mec.tipo === 'hielo' || mec.tipo === 'charcos' || mec.tipo === 'esporas') { const ch = mec.tipo === 'hielo' ? 'i' : mec.tipo === 'charcos' ? 'w' : 'e'; c.suelo.forEach(([x, y]) => { const v = (Math.sin((x + k) * 0.9) + Math.cos((y - k) * 1.1) + h2(x, y, k)) / 3; if (v > 0.5 - (mec.densidad || 0.1) * 2.2 && !hayEl(x, y) && !(x === c.centro[0] && y === c.centro[1])) g[y][x] = ch; }); }
      if (mec.tipo === 'revela' && rnd() < 0.5) { const q = sitio(c); if (q) { els.push({ t: 'cristal_mapa', x: q[0], y: q[1] }); luces.push({ x: q[0], y: q[1], r: 3.2, c: B.paleta.acento }); } }
    });
    // 9) estalagmitas en cavernas amplias (solo con sus 8 vecinas libres y lejos de todo: no cortan el paso)
    celdas.forEach((c) => { if (c.sala || c.papel === 'entrada' || c.papel === 'salida') return; const n = rnd() < 0.6 ? 1 : 0; for (let i = 0; i < n; i++) { const q = sitio(c, 3); if (q && g[q[1]][q[0]] === '.') els.push({ t: 'estalagmita', x: q[0], y: q[1] }); } });
    function decorar() {   // adornos y luces SOLO en paredes que dan a suelo por el sur (se ven de frente); nunca sobre el paso
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (g[y][x] !== '#' || g[y + 1][x] === '#' || res[I(x, y)] === 1 && h2(x, y, 3) < 0.5 || els.some((e) => e.x === x && (e.y === y || e.y === y + 1))) continue;
        const r = h2(x, y, a.sem & 1023); if (r > 0.2 || deco.some((d) => Math.abs(d.x - x) + Math.abs(d.y - y) < 4)) continue;
        const t = B.deco[(h2(x, y, 7) * B.deco.length) | 0]; deco.push({ t, x, y });
        if (t === 'antorcha') luces.push({ x, y: y + 0.4, r: 3.4, c: '#ffb347', f: 1 }); else if (t === 'cristal') luces.push({ x, y: y + 0.4, r: 2.6, c: B.paleta.acento }); else if (t === 'seta') luces.push({ x, y: y + 0.4, r: 2.4, c: B.paleta.acento2 });
      }
    }
    decorar();
    els.forEach((e) => { if (e.t === 'subida' || e.t === 'bajada') luces.push({ x: e.x, y: e.y, r: 2.6, c: e.t === 'bajada' ? B.paleta.acento : '#ffe9b0' }); if (e.t === 'cofre') luces.push({ x: e.x, y: e.y, r: 1.6, c: '#ffd86b' }); });
    const sub = els.find((e) => e.t === 'subida'), baj = els.find((e) => e.t === 'bajada'); if (!sub || !baj) falla('escaleras');
    const libreV = DIR4.map(([dx, dy]) => [sub.x + dx, sub.y + dy]).find(([x, y]) => g[y][x] !== '#' && !hayEl(x, y)) || falla('entrada');
    return cerrar({ anclas: { entrada: libreV, inicio: libreV }, salida: [baj.x, baj.y], celdas: celdas.map((c) => ({ papel: c.papel, x: c.x0, y: c.y0, sala: c.sala ? c.sala.i : -1 })) });
  }

  // ───────────────────────── D) VERIFICADOR ─────────────────────────
  // Lista de problemas de un piso generado (vacía = jugable): todo el suelo alcanzable, todos los objetos alcanzables y el recorrido lógico posible
  // (llave antes de la cerradura, combate antes del sello, puzle desde su entrada, jefe antes de su reja). En el hielo se comprueba resbalando.
  function verificar(j) {
    const P = j.prof, g = P.g, W = j.ancho, H = j.alto, I = (x, y) => y * W + x, out = [], en = {}; P.els.forEach((e, i) => { en[I(e.x, e.y)] = e; e._i = i; });
    const suelo = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g[y][x] !== '#';
    const ini = P.entrada; if (!suelo(ini[0], ini[1])) return ['la entrada no es suelo'];
    // a) conectividad total (todas las puertas abiertas, fosos como suelo)
    const todo = new Set([I(ini[0], ini[1])]); let pila = [ini.slice()];
    const tele = (e) => (e && e.t === 'teleporte' ? P.els.find((q) => q.t === 'teleporte' && q.par === e.par && q.sala === e.sala && q !== e) : null);
    while (pila.length) { const [x, y] = pila.pop(), tp = tele(en[I(x, y)]); if (tp && !todo.has(I(tp.x, tp.y))) { todo.add(I(tp.x, tp.y)); pila.push([tp.x, tp.y]); } DIR4.forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = I(nx, ny), e = en[k]; if (!suelo(nx, ny) || todo.has(k) || (e && SOLIDOS[e.t])) return; todo.add(k); pila.push([nx, ny]); }); }
    let aisladas = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (suelo(x, y) && !todo.has(I(x, y)) && !(en[I(x, y)] && SOLIDOS[en[I(x, y)].t])) aisladas++;
    if (aisladas) out.push(aisladas + ' casillas de suelo aisladas');
    P.els.forEach((e) => { if (!(todo.has(I(e.x, e.y)) || DIR4.some(([dx, dy]) => todo.has(I(e.x + dx, e.y + dy))))) out.push('objeto aislado: ' + e.t + ' en ' + e.x + ',' + e.y); });
    (j.npcs || []).forEach((n) => { if (!DIR4.some(([dx, dy]) => todo.has(I(n.x + dx, n.y + dy)))) out.push('personaje o jefe aislado en ' + n.x + ',' + n.y); });
    // b) recorrido lógico hasta un punto fijo
    const abiertas = {}, resueltas = {}, vencidos = {}; let llaves = 0, cambia = true, alc = new Set(), usadas = 0; const cogidas = {};
    const pasa = (k) => { const e = en[k]; if (!e) return true; if (SOLIDOS[e.t]) return false; if (e.t === 'cerradura' || e.t === 'grieta') return !!abiertas[e._i];
      if (e.t === 'puerta') { if (e.sala !== undefined && resueltas[e.sala]) return true; if (e.canal === 'jefe') return !!vencidos[P.jefe]; if (/^vencer:/.test(e.canal)) return !!vencidos[e.canal.slice(7)]; if (e.canal === 'atajo') return !!abiertas.atajo; return e.sala !== undefined ? !!resueltas[e.sala] : false; }
      if (e.t === 'runa') return true; return true; };
    const hielo = P.mecanica === 'hielo';
    while (cambia) {
      cambia = false; alc = new Set([I(ini[0], ini[1])]); pila = [ini.slice()];
      while (pila.length) { const [x, y] = pila.pop(), tp = tele(en[I(x, y)]); if (tp && !alc.has(I(tp.x, tp.y))) { alc.add(I(tp.x, tp.y)); pila.push([tp.x, tp.y]); } DIR4.forEach(([dx, dy]) => { let nx = x + dx, ny = y + dy; if (!suelo(nx, ny) || !pasa(I(nx, ny))) return; const e0 = en[I(nx, ny)]; if (g[ny][nx] === ':' && !(e0 && e0.t === 'puerta') && e0 === undefined && P.salas.every((s) => !(nx >= s.x && ny >= s.y && nx < s.x + s.w && ny < s.y + s.h && resueltas[s.i]))) return;
        if (hielo) while (g[ny][nx] === 'i' && suelo(nx + dx, ny + dy) && pasa(I(nx + dx, ny + dy))) { nx += dx; ny += dy; }
        const k = I(nx, ny); if (alc.has(k)) return; alc.add(k); pila.push([nx, ny]); }); }
      const junto = (e) => alc.has(I(e.x, e.y)) || DIR4.some(([dx, dy]) => alc.has(I(e.x + dx, e.y + dy)));
      P.salas.forEach((s) => { if (!resueltas[s.i] && s.E && alc.has(I(s.E[0], s.E[1]))) { resueltas[s.i] = 1; cambia = true; } });
      P.els.forEach((e) => { if (e.t === 'llave' && !cogidas[e._i] && alc.has(I(e.x, e.y))) { cogidas[e._i] = 1; llaves++; cambia = true; } if (e.t === 'grieta' && !abiertas[e._i] && junto(e)) { abiertas[e._i] = 1; cambia = true; } if (e.t === 'palanca' && e.canal === 'atajo' && !abiertas.atajo && junto(e)) { abiertas.atajo = 1; cambia = true; } });
      (j.zonas || []).forEach((z) => { if (!vencidos[z.id]) for (let y = z.y; y < z.y + z.h && !vencidos[z.id]; y++) for (let x = z.x; x < z.x + z.w; x++) if (alc.has(I(x, y))) { vencidos[z.id] = 1; cambia = true; break; } });
      (j.npcs || []).forEach((n) => { if (n.tipo !== 'guarida') return; const gk = 'guarida:' + n.id; if (!vencidos[gk] && DIR4.some(([dx, dy]) => alc.has(I(n.x + dx, n.y + dy)))) { vencidos[gk] = 1; if (gk === P.mini) llaves++; cambia = true; } });
      if (!cambia) P.els.forEach((e) => { if (e.t === 'cerradura' && !abiertas[e._i] && junto(e) && llaves - usadas > 0 && !cambia) { abiertas[e._i] = 1; usadas++; cambia = true; } });
    }
    P.els.forEach((e) => { delete e._i; });
    if (P.salida && !alc.has(I(P.salida[0], P.salida[1]))) out.push('la escalera de bajada no es alcanzable');
    if (!hielo && alc.size < todo.size) out.push((todo.size - alc.size) + ' casillas no alcanzables en el recorrido lógico');
    if (hielo && P.els.some((e) => !(alc.has(I(e.x, e.y)) || DIR4.some(([dx, dy]) => alc.has(I(e.x + dx, e.y + dy)))))) out.push('objeto no alcanzable resbalando por el hielo');
    return out;
  }
  // Medidas de un piso (para el banco de semillas): largo del recorrido entrada → bajada en casillas y tiempo estimado
  function medir(j) {
    const P = j.prof, g = P.g, W = j.ancho, I = (x, y) => y * W + x, d = new Map([[I(P.entrada[0], P.entrada[1]), 0]]), cola = [P.entrada.slice()]; let largo = 0;
    for (let i = 0; i < cola.length; i++) { const [x, y] = cola[i], v = d.get(I(x, y)); if (P.salida && x === P.salida[0] && y === P.salida[1]) { largo = v; break; } DIR4.forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (g[ny][nx] === '#' || d.has(I(nx, ny)) || P.els.some((e) => SOLIDOS[e.t] && e.x === nx && e.y === ny)) return; d.set(I(nx, ny), v + 1); cola.push([nx, ny]); }); }
    const t = AJ.tiempo, n = (f) => P.els.filter(f).length, puz = P.salas.filter((s) => s.tipo === 'puzle').length;
    const seg = largo * 1.5 / t.casillasPorSegundo + (j.zonas || []).length * t.combate * 1.5 + puz * t.puzle + n((e) => e.t === 'cofre') * t.cofre + (P.jefe ? t.jefe : 0) + (P.mini ? t.combate : 0);
    let suelo = 0; g.forEach((r) => { for (const c of r) if (c !== '#') suelo++; });
    return { largo, segundos: Math.round(seg), puzles: puz, cofres: n((e) => e.t === 'cofre'), suelo, firma: P.celdas.map((c) => c.papel[0] + c.x + '.' + c.y).join('') + '|' + P.salas.map((s) => s.id).join(',') };
  }

  // ───────────────────────── E) ESTADO, ÓRDENES Y AVANCE ─────────────────────────
  const motor = G.motor, mundo = G.mundo;
  const estado = (est) => est.prof || (est.prof = { v: 1, n: 0, exp: null });
  const aviso = (est, j, texto) => { if (est.avisos) est.avisos.push({ j: j.id, texto }); };
  const pj = (j) => j.prof || (j.prof = { record: 0 });
  const esProf = (id) => typeof id === 'string' && id.indexOf('prof_') === 0;
  const mapaDe = (id) => { try { return mundo.mapa(id); } catch (e) { return null; } };
  const casilla = (j) => [Math.floor(j.x / T), Math.floor(j.y / T)];
  const enMapa = (est, id) => Object.values(est.jugadores).filter((j) => j.mapa === id);
  const mods = (est) => { const e = estado(est).exp; return e ? e.mods.map((id) => D.modificadores.find((m) => m.id === id)).filter(Boolean) : []; };
  function mod(est, clave, base) { let v = base; mods(est).forEach((m) => { const x = m.efecto && m.efecto[clave]; if (x === undefined) return; v = clave === 'brillos' || clave === 'radioMapa' ? v * x : v + x; }); return v; }
  // estado de un piso de la expedición en curso (null si el mapa no es de ella)
  function ps(est, m) {
    const e = estado(est).exp, P = m && m.prof; if (!e || !P || P.piso === 0 || P.sem !== e.sem) return null;
    return e.pisos[P.piso] || (e.pisos[P.piso] = nuevoPiso());
  }
  const nuevoPiso = () => ({ pal: {}, bot: {}, blo: {}, hoy: {}, sec: {}, nv: 0, cof: {}, ok: {}, ven: {}, abi: {}, usa: {}, lla: {}, cer: {}, visto: '' });   // pal…sec: lo que puede deshacerse (versión nv); cof…cer: conjuntos que solo crecen
  const cuenta = (o) => Object.keys(o || {}).length;
  // llaves en mano = recogidas (del suelo, de guardianes y de modificadores) − cerraduras abiertas. Se DERIVA de conjuntos que solo crecen: así dos móviles nunca discrepan.
  function llaves(est) { const e = estado(est).exp; if (!e) return 0; let n = 0; Object.values(e.pisos).forEach((q) => { n += cuenta(q.lla) - cuenta(q.cer); }); e.mods.forEach((id) => { const m = D.modificadores.find((z) => z.id === id); if (m && m.efecto && m.efecto.llaves) n += m.efecto.llaves; }); return Math.max(0, n); }
  const slotDe = (est, j) => { const e = estado(est).exp, i = e ? e.miembros.slice().sort().indexOf(j.id) : 0; return (i < 0 ? 0 : i) % 2; };   // por orden alfabético de id: igual en los dos móviles
  const posBloque = (s, e, i) => (s && s.blo[i]) || [e.x, e.y];
  // Señales y puertas de un piso AHORA (derivado de est; no se guarda): { abierta: {iEl: true}, blo: {"x,y": iEl}, firma }
  function dinamica(est, m) {
    const P = m.prof, s = ps(est, m), jug = enMapa(est, m.id), ocup = {}, blo = {}; jug.forEach((j) => { const c = casilla(j); ocup[c[0] + ',' + c[1]] = 1; });
    if (s) P.els.forEach((e, i) => { if (e.t === 'bloque' && !s.hoy['b' + i]) { const q = posBloque(s, e, i); blo[q[0] + ',' + q[1]] = i; } });
    const fuentes = {}; P.els.forEach((e, i) => { if (e.t !== 'placa' && e.t !== 'boton' && e.t !== 'palanca') return; const k = e.x + ',' + e.y, on = e.t === 'placa' ? !!(ocup[k] || blo[k] !== undefined) : e.t === 'boton' ? !!(s && s.bot[i]) : !!(s && s.pal[i]); (fuentes[e.canal] = fuentes[e.canal] || []).push(on); });
    const activo = (e) => { const c = e.canal; if (!s) return false; if (e.sala !== undefined && s.ok[e.sala]) return !e.inv; if (c === 'jefe') return !!s.ven[P.jefe]; if (c.indexOf('vencer:') === 0) return !!s.ven[c.slice(7)];
      const f = fuentes[c] || [], sala = e.sala !== undefined ? P.salas[e.sala] : null, modo = sala && sala.canales[c.split(':')[1]]; if (modo === 'sec') return (s.sec[c] | 0) >= P.els.filter((q) => q.t === 'palanca' && q.canal === c).length; return modo === 'and' ? f.length > 0 && f.every(Boolean) : f.some(Boolean); };
    const abierta = {}; let firma = '';
    P.els.forEach((e, i) => { let a = false; if (e.t === 'puerta') a = activo(e) !== !!e.inv || (s && e.sala !== undefined && !!s.ok[e.sala]); else if (e.t === 'cerradura' || e.t === 'grieta') a = !!(s && s.abi[i]); else return; if (a) abierta[i] = true; firma += a ? '1' : '0'; });
    return { abierta, blo, ocup, firma: firma + '|' + Object.keys(blo).join(';') + '|' + (s ? Object.keys(s.hoy).join(';') + Object.keys(s.ok).join('') + Object.keys(s.cof).join('') : '') };
  }
  // Casillas cerradas para el jugador j en su piso (Set «x,y»): objetos fijos + puertas cerradas + rocas + fosos + runas ajenas (+ compañeros si resbala)
  function bloqueosDe(est, m, j) {
    const P = m.prof, s = ps(est, m), d = dinamica(est, m), slot = slotDe(est, j), k = d.firma + '|' + slot + '|' + (j.profDesl ? Object.keys(d.ocup).join(';') : '');
    const cache = m._pb || (m._pb = {}); if (cache[j.id] && cache[j.id].k === k) return cache[j.id].set;
    const set = new Set(m._pbase || (m._pbase = new Set(m.bloqueos)));
    P.els.forEach((e, i) => {
      const c = e.x + ',' + e.y;
      if (SOLIDOS[e.t]) { if (!(e.t === 'cofre' && false)) set.add(c); }
      else if (e.t === 'puerta' || e.t === 'cerradura' || e.t === 'grieta') { if (!d.abierta[i] && !d.ocup[c]) set.add(c); }
      else if (e.t === 'runa') { if (e.slot !== slot && !(s && s.ok[e.sala])) set.add(c); }
    });
    Object.keys(d.blo).forEach((c) => set.add(c));
    for (let y = 0; y < m.H; y++) { const r = P.g[y]; for (let x = 0; x < m.W; x++) if (r[x] === ':') { const c = x + ',' + y, e = P.els.findIndex((q) => q.x === x && q.y === y && q.t === 'puerta'); if (!(s && s.hoy[c]) && !(e >= 0 && d.abierta[e]) && !d.ocup[c]) set.add(c); } }
    if (j.profDesl) Object.values(est.jugadores).forEach((o) => { if (o !== j && o.mapa === m.id) { const c = casilla(o); set.add(c[0] + ',' + c[1]); } });
    cache[j.id] = { k, set }; return set;
  }
  // ── expedición ──
  function colocar(est, j, m, q) { motor.estadoMapa(est, m.id); j.mapa = m.id; j.x = q[0] * T + 8; j.y = q[1] * T + 14; j.moving = false; j.enPuerta = null; j.profDesl = null; j.profEn = m.id + ':' + q[0] + ',' + q[1]; if (j.pesca) j.pesca = null; if (m.prof.piso > 0) { const r = pj(j); if (m.prof.piso > r.record) r.record = m.prof.piso; const e = estado(est).exp; if (e) { if (m.prof.piso > e.piso) e.piso = m.prof.piso; if (e.dia) { if (!r.diaria || r.diaria.dia !== e.dia) r.diaria = { dia: e.dia, piso: 0 }; if (m.prof.piso > r.diaria.piso) r.diaria.piso = m.prof.piso; } } } }
  const junto = (m, x, y) => { for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) { const a = x + dx, b = y + dy; if (m.prof.g[b][a] !== '#' && !m.prof.els.some((e) => e.x === a && e.y === b)) return [a, b]; } return [x, y]; };
  const campamento = (bioma0) => mapaDe(idMapa(bioma0, 0, 0));
  function entrarCampamento(est, j, bioma0) { const m = campamento(BIOMAS.indexOf(bioma0) >= 0 ? bioma0 : BIOMAS[0]); colocar(est, j, m, m.anclas.entrada); j.dir = 'up'; }
  function dejar(est, j) {   // el jugador deja la expedición; si era el último, se cierra
    const st = estado(est), e = st.exp; if (!e) return; const i = e.miembros.indexOf(j.id); if (i >= 0) e.miembros.splice(i, 1);
    if (!e.miembros.length) { st.ult = { n: e.n, piso: e.piso, dia: e.dia || 0 }; st.exp = null; }
  }
  function empezar(est, j, bioma0, dia) {
    const st = estado(est); let e = st.exp;
    const lejos = Object.values(est.jugadores).map((o) => (o !== j && o.remoto && esProf(o.mapa) ? analizar(o.mapa) : null)).find((q) => q && q.piso > 0);   // el compañero del otro móvil ya está dentro: se entra en SU cueva
    if (lejos && !dia && (!e || e.sem !== lejos.sem)) { st.n++; e = st.exp = { n: st.n, sem: lejos.sem, bioma0: lejos.bioma0, dia: 0, piso: lejos.piso, mods: [], miembros: [j.id], pisos: {} }; }
    if (e && e.miembros.length && (!!e.dia === !!dia)) { if (e.miembros.indexOf(j.id) < 0) e.miembros.push(j.id); }   // se une a la expedición en curso
    else {
      if (e) e.miembros.slice().forEach((id) => { const o = est.jugadores[id]; if (o && esProf(o.mapa) && o !== j) entrarCampamento(est, o, e.bioma0); });
      st.n++; const sem = dia ? hash('diaria|' + dia) : hash(est.semilla + '|' + bioma0 + '|' + st.n), r = azar(hash('mods|' + sem));
      e = st.exp = { n: st.n, sem, bioma0: dia ? BIOMAS[sem % BIOMAS.length] : bioma0, dia: dia || 0, piso: 1, mods: [], miembros: [j.id], pisos: {} };
      if (dia) { const be = D.modificadores.filter((q) => q.tipo === 'bendicion'), ma = D.modificadores.filter((q) => q.tipo === 'maldicion'); darMod(est, be[(r() * be.length) | 0].id); darMod(est, ma[(r() * ma.length) | 0].id); }
      aviso(est, j, dia ? 'Expedición diaria: la misma cueva para todos hoy' : 'Expedición nº ' + e.n);
    }
    const otro = e.miembros.map((id) => est.jugadores[id]).find((o) => o && o !== j && esProf(o.mapa) && mapaDe(o.mapa) && mapaDe(o.mapa).prof.sem === e.sem && mapaDe(o.mapa).prof.piso > 0);
    const m = otro ? mapaDe(otro.mapa) : mapaDe(idMapa(e.bioma0, e.sem, 1)); colocar(est, j, m, m.anclas.entrada); anunciar(est, j, m);
  }
  function anunciar(est, j, m) { const P = m.prof, B = D.biomas[P.bioma]; aviso(est, j, 'Piso ' + P.piso + ' · ' + P.nombre + (P.pos === 1 || P.piso === 1 ? '' : '')); if (P.piso % AJ.jefeCada === 1 && B.mecanica && B.mecanica.texto) aviso(est, j, B.mecanica.texto); }
  function darMod(est, id) { const e = estado(est).exp, m = D.modificadores.find((q) => q.id === id); if (!e || !m || e.mods.indexOf(id) >= 0) return false; e.mods.push(id); return true; }
  function grupo(est, m) { const e = estado(est).exp; return enMapa(est, m.id).filter((j) => !e || e.miembros.indexOf(j.id) >= 0 || m.prof.piso === 0); }
  function bajar(est, j, m) { const e = estado(est).exp; if (!e) return; const sig = mapaDe(idMapa(e.bioma0, e.sem, m.prof.piso + 1)); grupo(est, m).forEach((o) => { colocar(est, o, sig, sig.anclas.entrada); anunciar(est, o, sig); }); }
  function subir(est, j, m) {
    const e = estado(est).exp;
    if (m.prof.piso === 0) { const r = j.volver.pop() || puertaFuera(); if (!r) return; const mr = mundo.mapa(r.mapa), q = mundo.vecinaLibre(mr, r.tx, r.ty); motor.estadoMapa(est, mr.id); j.mapa = mr.id; j.x = q[0] * T + 8; j.y = q[1] * T + 14; j.enPuerta = null; j.profEn = null; return; }
    if (m.prof.piso === 1 || !e) { grupo(est, m).forEach((o) => salir(est, o)); return; }
    const ant = mapaDe(idMapa(e.bioma0, e.sem, m.prof.piso - 1)), b = ant.prof.salida, q = junto(ant, b[0], b[1]); grupo(est, m).forEach((o) => colocar(est, o, ant, q));
  }
  function puertaFuera() { const q = Object.values(mundo.mapas).find((mp) => mp.puertas.some((p) => p.destino && p.destino.mapa === '@prof')); if (!q) return null; const p = q.puertas.find((x) => x.destino && x.destino.mapa === '@prof'); return { mapa: q.id, tx: p.x, ty: p.y }; }
  function salir(est, j) { const m = mapaDe(j.mapa), e = estado(est).exp, b0 = (m && m.prof && m.prof.bioma0) || (e && e.bioma0) || BIOMAS[0]; dejar(est, j); const c = campamento(b0), baj = c.prof.els.find((q) => q.t === 'bajada'); colocar(est, j, c, junto(c, baj.x, baj.y)); }
  // ── recompensas ──
  function botin(est, m, e, i, forzada) {
    const r = azar(hash(m.id + '|cofre|' + i)), C = D.cofres, pr = r(); let rar = forzada || e.rar || (pr < C.probEpica + mod(est, 'rareza', 0) * 0.3 ? 'epica' : pr < C.probRara + mod(est, 'rareza', 0) ? 'rara' : 'comun');
    const t = C[rar], k = Math.pow(1.12, Math.max(0, m.prof.piso - 1)) * mod(est, 'brillos', 1), brillos = Math.round((t.brillos[0] + r() * (t.brillos[1] - t.brillos[0])) * k);
    let w = r() * t.objetos.reduce((s, o) => s + o[1], 0), obj = null; for (const o of t.objetos) { if ((w -= o[1]) < 0) { obj = o[0]; break; } }
    return { rar, brillos, obj, sem: hash(m.id + '|huevo|' + i) };
  }
  function premiar(est, m, b, quien, soloLocales) {
    const NOM = { comun: 'Cofre', rara: 'Cofre raro', epica: 'Cofre épico' };
    grupo(est, m).forEach((j) => {
      if (soloLocales && j.remoto) return;
      let txt = NOM[b.rar] + ': +' + (G.tienda ? G.tienda.ganar(j, b.brillos) : 0) + ' ✦';
      if (b.obj === 'huevo') { if (j === quien && G.crianza && G.crianza.huevoHallado(est, j, b.sem)) txt += ' y ¡un huevo! (va a tu incubadora)'; else if (G.tienda) txt += ' y +' + G.tienda.ganar(j, 60) + ' ✦'; }
      else if (b.obj && G.tienda) { if (G.tienda.OBJ[b.obj].tipo === 'esfera') j.esferas = Math.min(G.tienda.MAX_ESF, G.motor.combate.esferas(j) + 1); else G.tienda.meter(j, b.obj, 1); txt += ' y ' + G.tienda.nombre(b.obj); }
      aviso(est, j, txt);
    });
  }
  // ── acciones ──
  function elementoCerca(est, j, m) {   // objeto accionable más cercano (a ≤ 1,5 casillas), con preferencia por el que se mira
    const P = m.prof, s = ps(est, m), c = casilla(j), mira = mundo.MIRAS[j.dir] || [0, 1]; let mejor = -1, md = 1e9;
    P.els.forEach((e, i) => {
      if (!ACCION[e.t]) return; if (e.t === 'portal') { if (e.x !== c[0] || e.y !== c[1]) return; } else if (Math.abs(e.x - c[0]) + Math.abs(e.y - c[1]) !== 1) return;
      if (s && ((e.t === 'cofre' && s.cof[i]) || ((e.t === 'cerradura' || e.t === 'grieta') && s.abi[i]) || ((e.t === 'altar' || e.t === 'evento' || e.t === 'hoguera' || e.t === 'cristal_mapa') && s.usa[i]))) return;
      const d = (e.x - c[0] === mira[0] && e.y - c[1] === mira[1]) ? 0 : 1; if (d < md) { md = d; mejor = i; }
    });
    return mejor;
  }
  function opciones(est, m, e, i) {   // qué ofrece un altar o una encrucijada
    const r = azar(hash(m.id + '|elige|' + i)), ex = estado(est).exp;
    if (e.t === 'altar') { const c = D.modificadores.filter((q) => q.tipo === 'bendicion' && ex.mods.indexOf(q.id) < 0); for (let k = c.length - 1; k > 0; k--) { const z = (r() * (k + 1)) | 0; [c[k], c[z]] = [c[z], c[k]]; } return { titulo: 'Santuario', texto: 'Elige una bendición para esta expedición.', ops: c.slice(0, 3).map((q) => ({ txt: q.nombre, sub: q.desc, mod: q.id })).concat([{ txt: 'Ahora no', sub: '' }]) }; }
    const ev = D.eventos[(r() * D.eventos.length) | 0]; return { titulo: 'Encrucijada', texto: ev.texto, ops: ev.opciones };
  }
  function accion(est, j, o) {
    const m = mapaDe(j.mapa); if (!m || !m.prof) return null; const P = m.prof, s = ps(est, m), i = o.el !== undefined ? o.el : elementoCerca(est, j, m); if (i < 0) return null; const e = P.els[i]; if (!e || !ACCION[e.t]) return null;
    if (o.el !== undefined && Math.abs(e.x - casilla(j)[0]) + Math.abs(e.y - casilla(j)[1]) > 2) return null;
    if (e.t === 'portal') { if (!(o.dia > 0)) { aviso(est, j, 'El portal diario solo se abre con la fecha de hoy'); return null; } empezar(est, j, P.bioma0, Math.floor(o.dia)); return { prof: 'portal' }; }
    if (e.t === 'estela') { const r = pj(j), st = estado(est); return { prof: 'estela', record: r.record | 0, diaria: r.diaria || null, exp: st.n, ult: st.ult || null }; }
    if (!s) return null;
    if (e.t === 'palanca') {
      const sala = e.sala !== undefined ? P.salas[e.sala] : null, modo = sala && sala.canales[e.canal.split(':')[1]];
      if (modo === 'sec') { const v = s.sec[e.canal] | 0; if (e.orden === v + 1) { s.sec[e.canal] = v + 1; aviso(est, j, 'Clac: ' + (v + 1) + ' de ' + P.els.filter((q) => q.t === 'palanca' && q.canal === e.canal).length); } else if (e.orden > v) { s.sec[e.canal] = 0; aviso(est, j, 'Orden equivocado: las palancas vuelven a su sitio'); } }
      else { if (s.pal[i]) delete s.pal[i]; else s.pal[i] = 1; if (e.canal === 'atajo' && s.pal[i]) aviso(est, j, 'Una reja se abre a lo lejos: ¡un atajo!'); }
      s.nv++; return { prof: 'palanca', el: i };
    }
    if (e.t === 'cofre') { s.cof[i] = 1; premiar(est, m, botin(est, m, e, i), j); return { prof: 'cofre', el: i }; }
    if (e.t === 'cerradura') { if (llaves(est) < 1) { aviso(est, j, 'Cerrado: hace falta una llave'); return { prof: 'cerrado', el: i }; } s.cer[i] = 1; s.abi[i] = 1; aviso(est, j, 'La llave abre la puerta'); return { prof: 'abre', el: i }; }
    if (e.t === 'grieta') { s.abi[i] = 1; aviso(est, j, '¡La pared agrietada cede: un pasadizo secreto!'); return { prof: 'grieta', el: i }; }
    if (e.t === 'hoguera') { s.usa[i] = 1; grupo(est, m).forEach((q) => { if (!motor.combate.curar(est, q.id)) aviso(est, q, 'Descansáis junto al fuego'); }); return { prof: 'hoguera', el: i }; }
    if (e.t === 'cristal_mapa') { s.usa[i] = 1; revelar(m, s, e.x, e.y, (D.biomas[P.bioma].mecanica.radio || 9)); aviso(est, j, 'El cristal resuena y dibuja el mapa a su alrededor'); return { prof: 'cristal', el: i }; }
    if (e.t === 'altar' || e.t === 'evento') return { prof: 'elige', el: i, elige: opciones(est, m, e, i) };
    return null;
  }
  function elegir2(est, j, o) {
    const m = mapaDe(j.mapa), s = m && ps(est, m), e = s && m.prof.els[o.el]; if (!e || (e.t !== 'altar' && e.t !== 'evento') || s.usa[o.el]) return null; const op = opciones(est, m, e, o.el).ops[o.op]; if (!op) return null;
    if (!op.mod && !op.cofre && !op.coste) return { prof: 'nada' };
    if (op.coste) { if (!G.tienda || !G.tienda.gastar(j, op.coste)) { aviso(est, j, 'No tienes suficientes Brillos'); return null; } }
    s.usa[o.el] = 1; let idm = op.mod;
    if (idm === 'maldicion' || idm === 'bendicion') { const ex = estado(est).exp, c = D.modificadores.filter((q) => q.tipo === idm && ex.mods.indexOf(q.id) < 0), r = azar(hash(m.id + '|mod|' + o.el)); idm = c.length ? c[(r() * c.length) | 0].id : null; }
    if (idm && darMod(est, idm)) { const q = D.modificadores.find((z) => z.id === idm); grupo(est, m).forEach((z) => aviso(est, z, (q.tipo === 'maldicion' ? 'Maldición: ' : 'Bendición: ') + q.nombre + '. ' + q.desc)); }
    if (op.cofre) premiar(est, m, botin(est, m, {}, o.el, op.cofre), j);
    return { prof: 'elegido', mod: idm || null };
  }
  const salaEn = (m, x, y) => m.prof.salas.find((q) => x >= q.x && y >= q.y && x < q.x + q.w && y < q.y + q.h) || null;
  function reiniciar(est, j) {   // deja el puzle sin resolver donde está el jugador como al principio y devuelve al grupo a su entrada
    const m = mapaDe(j.mapa), s = m && ps(est, m); if (!s) return null; const c = casilla(j), sala = salaEn(m, c[0], c[1]); if (!sala || sala.tipo !== 'puzle' || s.ok[sala.i]) return null;
    m.prof.els.forEach((e, i) => { if (e.sala !== sala.i) return; delete s.pal[i]; delete s.bot[i]; delete s.blo[i]; delete s.hoy['b' + i]; if (e.canal) delete s.sec[e.canal]; });
    Object.keys(s.hoy).forEach((k) => { const q = k.split(',').map(Number); if (q.length === 2 && salaEn(m, q[0], q[1]) === sala) delete s.hoy[k]; });
    enMapa(est, m.id).forEach((o) => { const q = casilla(o); if (salaEn(m, q[0], q[1]) === sala) { o.x = sala.E[0] * T + 8; o.y = sala.E[1] * T + 14; o.profDesl = null; o.profTp = null; } });
    s.nv++; aviso(est, j, 'La sala vuelve a su estado inicial'); return { prof: 'reinicio' };
  }
  function empujar(est, m, s, i, dx, dy) {   // mueve una roca una casilla si puede (misma regla que el resolutor)
    const P = m.prof, e = P.els[i], q = posBloque(s, e, i), x = q[0] + dx, y = q[1] + dy, d = dinamica(est, m), b = P.g[y] && P.g[y][x], k = x + ',' + y;
    if (!b || b === '#' || b === 'i' || b === 'w' || d.blo[k] !== undefined || d.ocup[k]) return false; const sala = salaEn(m, q[0], q[1]); if (!sala || salaEn(m, x, y) !== sala) return false;
    const en = P.els.findIndex((z) => z.x === x && z.y === y && z !== e && z.t !== 'bloque'), z = en >= 0 ? P.els[en] : null;
    if (z && (SOLIDOS[z.t] || z.t === 'runa' || z.t === 'teleporte' || z.t === 'cerradura' || z.t === 'grieta' || (z.t === 'puerta' && !d.abierta[en]))) return false;
    if (b === ':' && !s.hoy[k] && !(z && z.t === 'puerta')) { s.hoy[k] = 1; s.hoy['b' + i] = 1; } else s.blo[i] = [x, y];
    s.nv++; return true;
  }
  // ── minimapa: bloques de 2×2 casillas vistos, como texto hexadecimal ──
  const VB = 2;
  function visto(m, s) { const w = Math.ceil(m.W / VB), h = Math.ceil(m.H / VB), n = w * h, a = new Uint8Array(n); for (let i = 0; i < n && (i >> 2) < s.visto.length; i++) if (parseInt(s.visto[i >> 2], 16) >> (i & 3) & 1) a[i] = 1; return { w, h, a }; }
  function revelar(m, s, tx, ty, radio) {
    const v = visto(m, s); let cambia = false;
    for (let y = Math.max(0, Math.floor((ty - radio) / VB)); y <= Math.min(v.h - 1, Math.floor((ty + radio) / VB)); y++) for (let x = Math.max(0, Math.floor((tx - radio) / VB)); x <= Math.min(v.w - 1, Math.floor((tx + radio) / VB)); x++) if (!v.a[y * v.w + x] && Math.hypot(x * VB + 1 - tx, y * VB + 1 - ty) <= radio) { v.a[y * v.w + x] = 1; cambia = true; }
    if (cambia) { let t = ''; for (let i = 0; i < v.a.length; i += 4) t += ((v.a[i] | 0) | ((v.a[i + 1] | 0) << 1) | ((v.a[i + 2] | 0) << 2) | ((v.a[i + 3] | 0) << 3)).toString(16); s.visto = t; }
  }
  // ── avance de cada cuadro ──
  function avanzar(est, dt) {
    const hechos = {};
    Object.values(est.jugadores).forEach((j0) => {
      if (!esProf(j0.mapa) || hechos[j0.mapa]) return; hechos[j0.mapa] = 1; const m = mapaDe(j0.mapa); if (!m || !m.prof) return; const P = m.prof, s = ps(est, m), ex = estado(est).exp;
      enMapa(est, m.id).forEach((j) => {
        const c = casilla(j), k = m.id + ':' + c[0] + ',' + c[1], e = P.els.find((q) => q.x === c[0] && q.y === c[1]), i = e ? P.els.indexOf(e) : -1;
        if (j.profEn && j.profEn !== k) j.profEn = null;
        if (j.profEsp > 0) j.profEsp = Math.max(0, j.profEsp - dt);
        if (!e || e.t !== 'teleporte') j.profTp = null;
        if (j.remoto || j.mapa !== m.id) return;
        if (e && (e.t === 'subida' || e.t === 'bajada') && j.profEn !== k) { if (e.t === 'bajada') { if (P.piso === 0) empezar(est, j, P.bioma0, 0); else if (s) bajar(est, j, m); } else subir(est, j, m); return; }
        if (!s) return;
        if (ex && ex.miembros.indexOf(j.id) < 0) ex.miembros.push(j.id);
        if (e && e.t === 'boton' && !s.bot[i]) { s.bot[i] = 1; s.nv++; aviso(est, j, 'Clic: el botón queda hundido'); }
        if (e && e.t === 'llave' && !s.cof[i]) { s.cof[i] = 1; s.lla[i] = 1; grupo(est, m).forEach((q) => aviso(est, q, '¡Una llave!')); }
        if (e && e.t === 'teleporte' && !j.profTp) { const o = P.els.find((q) => q.t === 'teleporte' && q.par === e.par && q.sala === e.sala && q !== e); if (o) { j.x = o.x * T + 8; j.y = o.y * T + 14; j.profTp = 1; } }
        if (P.g[c[1]][c[0]] === 'e' && P.mecanica === 'esporas') j.profEsp = D.biomas[P.bioma].mecanica.segundos || 3;
        const sala = salaEn(m, c[0], c[1]); if (sala && sala.tipo === 'puzle' && !s.ok[sala.i] && sala.S[0] === c[0] && sala.S[1] === c[1]) { s.ok[sala.i] = 1; grupo(est, m).forEach((q) => aviso(est, q, '¡Sala resuelta entre los dos!')); }
        revelar(m, s, c[0], c[1], mod(est, 'revela', 0) ? 99 : mod(est, 'radioMapa', AJ.radioMapa));
        // empujar rocas: andar contra una roca un momento
        const kx = j.keys.right - j.keys.left, ky = j.keys.down - j.keys.up, dx = kx && !ky ? kx : 0, dy = ky && !kx ? ky : 0, d = (dx || dy) ? dinamica(est, m).blo[(c[0] + dx) + ',' + (c[1] + dy)] : undefined;
        if (d !== undefined) { j.profEmp = (j.profEmp || 0) + dt; if (j.profEmp >= AJ.empujar) { j.profEmp = 0; empujar(est, m, s, d, dx, dy); } } else j.profEmp = 0;
      });
      if (s && est.mapas[m.id]) {   // zonas y jefes vencidos (se recuerdan en el estado de la expedición)
        const em = est.mapas[m.id], gr = em.grupos || (em.grupos = G.aparicion.grupos(em.plan));
        const lista = (m.zonas || []).map((z) => z.id).concat(P.jefe ? [P.jefe] : [], P.mini ? [P.mini] : []);
        lista.forEach((gid) => { if (s.ven[gid]) return; const gq = gr.find((q) => q.id === gid), ok = !gq || gq.idx.every((ix) => em.vencidas && em.vencidas[ix]); if (!ok) return; s.ven[gid] = 1;
          if (gid === P.mini) { s.lla.m = 1; grupo(est, m).forEach((q) => aviso(est, q, '¡El guardián suelta una llave!')); } else if (gid === P.jefe) grupo(est, m).forEach((q) => aviso(est, q, '¡Jefe vencido! El camino se abre')); else if (gq) grupo(est, m).forEach((q) => aviso(est, q, 'Sala despejada: el sello se abre')); });
      }
    });
  }
  // nivel extra de los rivales de un piso (lo usa combate_motor.js)
  function nivelExtra(est, mapaId, c) {
    const m = mapaDe(mapaId); if (!m || !m.prof || !m.prof.piso) return 0; const P = m.prof, n = (m.npcs || []).find((q) => q.tipo === 'guarida' && c && q.forma === c.id);
    return Math.round((P.piso - 1) * AJ.nivelPorPiso + mod(est, 'nivel', 0) + (n ? (n.jefe === 'jefe' ? AJ.nivelJefe : n.jefe === 'oculto' ? AJ.nivelJefeOculto : AJ.nivelMiniJefe) : 0));
  }
  // Lo que la interfaz necesita saber (solo lectura)
  function resumen(est, j) {
    const m = mapaDe(j.mapa); if (!m || !m.prof) return null; const P = m.prof, s = ps(est, m), ex = estado(est).exp, c = casilla(j), sala = salaEn(m, c[0], c[1]), i = elementoCerca(est, j, m);
    return { piso: P.piso, nombre: P.nombre, bioma: P.bioma, tipo: P.tipo, llaves: llaves(est), mods: mods(est).map((q) => ({ id: q.id, tipo: q.tipo, nombre: q.nombre, desc: q.desc })), diaria: !!(ex && ex.dia), record: pj(j).record | 0, slot: slotDe(est, j),
      puzle: sala && sala.tipo === 'puzle' && s && !s.ok[sala.i] ? { id: sala.id, pista: sala.pista } : null, cerca: i >= 0 ? P.els[i].t : null, luz: Math.max(1.6, mod(est, 'luz', D.biomas[P.bioma].luz.radio) * (j.profEsp > 0 ? (D.biomas[P.bioma].mecanica.factor || 0.5) : 1)) };
  }
  // Estado visible de los objetos de un piso (para el pintor): [{ i, t, x, y, abierta, on, oculto, … }]
  function vista(est, m) {
    const P = m.prof, s = ps(est, m), d = dinamica(est, m);
    return P.els.map((e, i) => { const o = { i, t: e.t, x: e.x, y: e.y, e }; if (e.t === 'bloque') { if (s && s.hoy['b' + i]) o.oculto = true; else { const q = posBloque(s, e, i); o.x = q[0]; o.y = q[1]; } } else if (e.t === 'puerta' || e.t === 'cerradura' || e.t === 'grieta') o.abierta = !!d.abierta[i]; else if (e.t === 'palanca') o.on = !!(s && (s.pal[i] || (s.sec[e.canal] | 0) >= e.orden)); else if (e.t === 'boton') o.on = !!(s && s.bot[i]); else if (e.t === 'placa') o.on = !!(d.ocup[e.x + ',' + e.y] || d.blo[e.x + ',' + e.y] !== undefined); else if (e.t === 'cofre') o.abierta = !!(s && s.cof[i]); else if (e.t === 'llave') o.oculto = !!(s && s.cof[i]); else if (e.t === 'runa') o.oculto = !!(s && s.ok[e.sala]); else if (e.t === 'altar' || e.t === 'evento' || e.t === 'hoguera' || e.t === 'cristal_mapa') o.on = !(s && s.usa[i]); return o; })
      .concat(s ? Object.keys(s.hoy).filter((k) => k[0] !== 'b').map((k) => { const q = k.split(',').map(Number); return { i: -1, t: 'tapado', x: q[0], y: q[1] }; }) : []);
  }
  // ── guardado ──
  const objOk = (o, max) => { const r = {}; if (o && typeof o === 'object' && !Array.isArray(o)) Object.keys(o).slice(0, max || 400).forEach((k) => { if (/^[a-z0-9:,_]{1,24}$/i.test(k)) { const v = o[k]; if (v === 1 || v === true) r[k] = 1; else if (Number.isInteger(v) && v >= 0 && v < 99) r[k] = v; else if (Array.isArray(v) && v.length === 2 && v.every(Number.isInteger)) r[k] = [v[0], v[1]]; } }); return r; };
  function serializar(est) { const st = est.prof; if (!st) return undefined; return JSON.parse(JSON.stringify({ v: 1, n: st.n | 0, ult: st.ult || undefined, exp: st.exp || null })); }
  function restaurar(est, d) {
    if (!d || typeof d !== 'object' || d.v !== 1) return false; const st = estado(est); st.n = Number.isInteger(d.n) && d.n >= 0 ? Math.min(d.n, 1e6) : 0; st.exp = null; const e = d.exp;
    if (e && typeof e === 'object' && Number.isInteger(e.sem) && BIOMAS.indexOf(e.bioma0) >= 0 && Array.isArray(e.miembros) && e.pisos && typeof e.pisos === 'object') {
      const pisos = {}; Object.keys(e.pisos).slice(0, 300).forEach((k) => { const q = e.pisos[k]; if (!/^\d{1,4}$/.test(k) || !q || typeof q !== 'object') return; pisos[k] = Object.assign(nuevoPiso(), { pal: objOk(q.pal), bot: objOk(q.bot), blo: objOk(q.blo), hoy: objOk(q.hoy), cof: objOk(q.cof), ok: objOk(q.ok), sec: objOk(q.sec), ven: objOk(q.ven), abi: objOk(q.abi), usa: objOk(q.usa), lla: objOk(q.lla), cer: objOk(q.cer), nv: Number.isInteger(q.nv) && q.nv >= 0 ? Math.min(q.nv, 1e9) : 0, visto: typeof q.visto === 'string' && /^[0-9a-f]{0,400}$/.test(q.visto) ? q.visto : '' }); });
      st.exp = { n: e.n | 0, sem: e.sem >>> 0, bioma0: e.bioma0, dia: Number.isInteger(e.dia) && e.dia > 0 ? e.dia : 0, piso: Math.max(1, Math.min(9999, e.piso | 0)), mods: (Array.isArray(e.mods) ? e.mods : []).filter((id, i, a2) => D.modificadores.some((q) => q.id === id) && a2.indexOf(id) === i), miembros: e.miembros.filter((id) => est.jugadores[id]), pisos };
    }
    return true;
  }
  // ── dos móviles (src/red.js): cada uno envía la cabecera de la expedición y el piso donde está; el otro FUNDE: los conjuntos que solo crecen se unen, lo reversible lo decide la versión más alta ──
  const BUCLE = ['pal', 'bot', 'blo', 'hoy', 'sec'], CRECEN = ['cof', 'ok', 'ven', 'abi', 'usa', 'lla', 'cer'];
  function red(est, id) {
    const e = estado(est).exp, j = est.jugadores[id]; if (!e || !j || j.remoto || e.miembros.indexOf(id) < 0) return null; const m = esProf(j.mapa) ? mapaDe(j.mapa) : null, s = m && ps(est, m);
    return { sem: e.sem, bioma0: e.bioma0, dia: e.dia || 0, piso: e.piso, mods: e.mods.slice(), miembros: e.miembros.slice(), k: s ? m.prof.piso : 0, s: s ? JSON.parse(JSON.stringify(s)) : null };
  }
  function redAplicar(est, id, r) {
    if (!r || typeof r !== 'object' || !Number.isInteger(r.sem) || BIOMAS.indexOf(r.bioma0) < 0) return false; const st = estado(est), locales = Object.values(est.jugadores).filter((j) => !j.remoto);
    if (!st.exp || st.exp.sem !== (r.sem >>> 0)) { if (st.exp && locales.some((j) => { const a = esProf(j.mapa) ? analizar(j.mapa) : null; return a && a.piso > 0 && a.sem === st.exp.sem; })) return false; st.n++; st.exp = { n: st.n, sem: r.sem >>> 0, bioma0: r.bioma0, dia: Number.isInteger(r.dia) && r.dia > 0 ? r.dia : 0, piso: 1, mods: [], miembros: [], pisos: {} }; }
    const e = st.exp; (Array.isArray(r.mods) ? r.mods : []).forEach((m) => darMod(est, m)); (Array.isArray(r.miembros) ? r.miembros : []).forEach((q) => { if (est.jugadores[q] && e.miembros.indexOf(q) < 0) e.miembros.push(q); }); if (Number.isInteger(r.piso) && r.piso > e.piso) e.piso = Math.min(9999, r.piso);
    if (!r.s || typeof r.s !== 'object' || !Number.isInteger(r.k) || r.k < 1 || r.k > 9999) return true; const s = e.pisos[r.k] || (e.pisos[r.k] = nuevoPiso()), m = mapaDe(idMapa(e.bioma0, e.sem, r.k));
    CRECEN.forEach((c) => { const q = objOk(r.s[c]); Object.keys(q).forEach((i) => { if (s[c][i]) return; s[c][i] = q[i]; const el = m && m.prof.els[i];   // lo que hizo el compañero en su móvil también premia y cura aquí
      if (c === 'cof' && el && el.t === 'cofre') premiar(est, m, botin(est, m, el, +i), null, true); if (c === 'usa' && el && el.t === 'hoguera') locales.forEach((j) => { if (j.mapa === m.id) motor.combate.curar(est, j.id); }); }); });
    const nv = Number.isInteger(r.s.nv) ? r.s.nv : 0, mio = JSON.stringify(BUCLE.map((c) => s[c])), suyo = BUCLE.map((c) => objOk(r.s[c]));
    if (nv > s.nv || (nv === s.nv && JSON.stringify(suyo) > mio)) { BUCLE.forEach((c, i) => { s[c] = suyo[i]; }); s.nv = nv; }
    if (typeof r.s.visto === 'string' && /^[0-9a-f]{0,400}$/.test(r.s.visto)) { let t = ''; const n = Math.max(s.visto.length, r.s.visto.length); for (let i = 0; i < n; i++) t += ((parseInt(s.visto[i] || '0', 16)) | (parseInt(r.s.visto[i] || '0', 16))).toString(16); s.visto = t; }
    return true;
  }
  const jugOk = (p) => (p && typeof p === 'object' ? { record: Math.max(0, Math.min(9999, p.record | 0)), diaria: p.diaria && Number.isInteger(p.diaria.dia) ? { dia: p.diaria.dia, piso: Math.max(0, Math.min(9999, p.diaria.piso | 0)) } : undefined } : undefined);

  const prof = G.profundidades = { D, AJ, BIOMAS, SALAS, SOLIDOS, VB, hash, azar, prepararSala, validarSala, resolver, comprobarPuzle, idMapa, analizar, plan, generar, verificar, medir, estado, ps, dinamica, bloqueosDe, vista, visto, resumen, nivelExtra, mod, mods, slotDe, accion, empezar, salir, entrarCampamento, serializar, restaurar, jugOk, red, redAplicar, llaves, avanzar, esProf, elementoCerca, darMod, salaEn };

  // ───────────────────────── F) GANCHOS EN EL MOTOR ─────────────────────────
  if (mundo && motor) {
    mundo.generador = (id) => (esProf(id) ? generar(id) : null);
    const estadoMapa0 = motor.estadoMapa;
    motor.estadoMapa = function (est, id) {   // el plan de criaturas de un piso sale de la semilla de la EXPEDICIÓN (no de la partida) y recuerda lo ya vencido
      if (!esProf(id) || est.mapas[id]) return estadoMapa0.call(motor, est, id);
      const m = mundo.mapa(id), P = m.prof; m._pbase = m._pbase || new Set(m.bloqueos); const base = new Set(m._pbase); P.els.forEach((e) => { if (SOLIDOS[e.t] || e.t === 'puerta' || e.t === 'cerradura' || e.t === 'grieta' || e.t === 'bloque' || e.t === 'subida' || e.t === 'bajada' || e.t === 'llave') base.add(e.x + ',' + e.y); }); m.bloqueos = base;
      const pl = G.aparicion.plan(P.sem ^ (P.piso * 7919), m); m.bloqueos = m._pbase;
      pl.huecos.forEach((h) => { if (h.guarida) { const n = m.npcs.find((q) => q.tipo === 'guarida' && q.id === h.linea); if (n && n.forma) h.actual = n.forma; } });
      const em = est.mapas[id] = { criaturas: [], plan: pl, activas: {} }, s = ps(est, m);
      if (s) { const gr = G.aparicion.grupos(pl); gr.forEach((q) => { if (s.ven[q.id]) { em.vencidas = em.vencidas || {}; q.idx.forEach((ix) => { em.vencidas[ix] = true; }); } }); }
      return em;
    };
    const mover0 = motor.moverJugador;
    motor.moverJugador = function (est, j, dt) {   // en una cueva: puertas, rocas y runas cierran el paso; el hielo resbala; los charcos frenan
      const m = esProf(j.mapa) ? mapaDe(j.mapa) : null; if (!m || !m.prof || j.remoto) return mover0.call(motor, est, j, dt);
      m.bloqueos = bloqueosDe(est, m, j);
      const g = m.prof.g, tile = () => { const r = g[Math.floor(j.y / T)]; return r ? r[Math.floor(j.x / T)] : '#'; }, k0 = j.keys; let f = 1;
      if (!j.profDesl && tile() === 'i' && m.prof.mecanica !== null) { const vx = k0.right - k0.left, vy = k0.down - k0.up; if (vx || vy) { j.profDesl = vx ? [vx, 0] : [0, vy]; if (vx) j.y = Math.floor(j.y / T) * T + 12; else j.x = Math.floor(j.x / T) * T + 8; m.bloqueos = bloqueosDe(est, m, j); } }
      if (j.profDesl) { const d = j.profDesl; j.keys = { up: d[1] < 0 ? 1 : 0, down: d[1] > 0 ? 1 : 0, left: d[0] < 0 ? 1 : 0, right: d[0] > 0 ? 1 : 0 }; f = 1.6; }
      else if (tile() === 'w') f = (D.biomas[m.prof.bioma].mecanica.factor || 0.55);
      const x0 = j.x, y0 = j.y; mover0.call(motor, est, j, dt * f);
      if (j.profDesl) { j.keys = k0; if (j.mapa !== m.id || Math.abs(j.x - x0) + Math.abs(j.y - y0) < 0.01 || tile() !== 'i') j.profDesl = null; }
      else if (j.mapa === m.id && tile() === 'i') { const mx = j.x - x0, my = j.y - y0; if (Math.abs(mx) + Math.abs(my) > 0.01) { j.profDesl = Math.abs(mx) >= Math.abs(my) ? [mx > 0 ? 1 : -1, 0] : [0, my > 0 ? 1 : -1]; if (j.profDesl[0]) j.y = Math.floor(j.y / T) * T + 12; else j.x = Math.floor(j.x / T) * T + 8; } }   // al entrar andando en el hielo se sigue resbalando aunque se suelte la tecla
    };
    const jugadores0 = motor.moverJugadores;
    motor.moverJugadores = function (est, dt) { jugadores0.call(motor, est, dt); avanzar(est, dt); };
    const cruzar0 = motor.cruzar;
    motor.cruzar = function (est, j, m) {   // la boca de una cueva es una puerta con destino.mapa «@prof» (destino.ancla = bioma de entrada)
      const tx = Math.floor(j.x / T), ty = Math.floor(j.y / T), p = mundo.puertaEn(m, tx, ty);
      if (p && p.destino && p.destino.mapa === '@prof') { if (j.enPuerta === m.id + ':' + tx + ',' + ty) return; j.volver.push({ mapa: m.id, tx, ty }); entrarCampamento(est, j, p.destino.ancla); return; }
      return cruzar0.call(motor, est, j, m);
    };
    const aplicar0 = motor.aplicar;
    motor.aplicar = function (est, o) {
      if (o && (o.t === 'prof' || o.t === 'hablar')) {
        const j = est.jugadores[o.j]; if (!j) throw new Error('orden de un jugador que no existe: ' + o.j);
        if (esProf(j.mapa) && !(est.combate && est.combate.jid === j.id)) {
          if (o.t === 'hablar') { if (!(G.npc && G.npc.cercano(est, j))) { const r = accion(est, j, o); if (r) return r; } }
          else return o.a === 'accion' ? accion(est, j, o) : o.a === 'elegir' ? elegir2(est, j, o) : o.a === 'salir' ? (salir(est, j), { prof: 'salir' }) : o.a === 'reiniciar' ? reiniciar(est, j) : null;
        } else if (o.t === 'prof') return null;
      }
      return aplicar0.call(motor, est, o);
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = prof;
})(typeof window !== 'undefined' ? window : globalThis);
