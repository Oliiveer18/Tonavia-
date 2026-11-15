// sonido_combate.js — SONIDO del combate (v2.301): efectos sintetizados con Web Audio (sin archivos, sin licencias), uno por elemento y por fase del movimiento.
// Fases: carga (inicio) → lanzamiento (efecto) → impacto (golpe, con crítico y bloqueo) + defensa, apoyo, cura, esquiva, quemadura, KO y fin. Se dispara con los MISMOS eventos que usan los pintores (cada uno una sola vez, en su tick),
// así suena a la vez que se ve. Usa el motor de audio del juego (G.audio.motor(): contexto, bus de efectos y ruido), respeta el volumen y el silencio, y baja la música mientras dura el combate.
// Cadena: voz → panorama (según el bando) → [reverb corta en paralelo] → compresor → bus de efectos. Sin Math.random: el ruido y la reverb salen de una semilla fija.
(function (root) {
  'use strict';
  const G = root.G, MOV = G.COMBATE_DATOS.MOV, cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const S = { k: null, vistos: new Set(), c: null, out: null, rev: null, duck: false, imp: 0, nimp: 0 };
  const MP = { p: 1, b: 1 };   // afinación (p) y brillo (b) propios del movimiento que suena: las primitivas los aplican a todas las frecuencias
  let sem = 20241109; const azar = () => { sem = (Math.imul(sem, 1664525) + 1013904223) >>> 0; return sem / 4294967296; };

  // ── cadena maestra (una vez por contexto) ──
  function cadena(m) {
    if (S.c === m.c) return;
    const c = m.c, comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.18; comp.connect(m.bus);
    const out = c.createGain(); out.gain.value = 0.9; out.connect(comp);
    const n = Math.floor(c.sampleRate * 0.9), ir = c.createBuffer(2, n, c.sampleRate);   // reverb corta: ruido con caída exponencial
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (azar() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    const cv = c.createConvolver(); cv.buffer = ir; const rg = c.createGain(); rg.gain.value = 0.55; cv.connect(rg); rg.connect(comp);
    S.c = c; S.out = out; S.rev = cv; S.duck = false;
  }
  function voz(m, pan, rev, pan1, dur, t) {   // entrada de una voz: ganancia → panorama (con barrido de un lado a otro si hay pan1) → salida (+ envío a la reverb)
    const c = m.c, g = c.createGain(); let o = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = cl(pan, -1, 1); if (pan1 !== undefined) { p.pan.setValueAtTime(cl(pan, -1, 1), t); p.pan.linearRampToValueAtTime(cl(pan1, -1, 1), t + dur); } g.connect(p); o = p; }
    o.connect(S.out); if (rev > 0) { const s = c.createGain(); s.gain.value = rev; o.connect(s); s.connect(S.rev); }
    return g;
  }
  // ── primitivas ──
  function rui(m, d, t, dur, o) {   // ruido filtrado con barrido de frecuencia y envolvente (att = tiempo de subida)
    const c = m.c, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); n.buffer = m.ruido; n.loop = true; f.type = o.tipo || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f0 * MP.b, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1 * MP.b, t + dur);
    const a = Math.min(o.att || 0.004, dur * 0.9); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(d); n.start(t, azar() * 0.8); n.stop(t + dur + 0.05);
  }
  function osc(m, d, t, dur, o) {   // oscilador con glissando; fm = { f, i } añade modulación de frecuencia (metal, electricidad)
    const c = m.c, x = c.createOscillator(), g = c.createGain(); x.type = o.onda || 'sine'; x.frequency.setValueAtTime(o.f0 * MP.p, t); if (o.f1) x.frequency.exponentialRampToValueAtTime(o.f1 * MP.p, t + dur);
    const a = Math.min(o.att || 0.006, dur * 0.9); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (o.fm) { const mo = c.createOscillator(), mg = c.createGain(); mo.frequency.value = o.fm.f; mg.gain.value = o.fm.i; mo.connect(mg); mg.connect(x.frequency); mo.start(t); mo.stop(t + dur + 0.05); }
    x.connect(g); g.connect(d); x.start(t); x.stop(t + dur + 0.05);
  }
  const crepitar = (m, d, t, n, v, f) => { for (let i = 0; i < n; i++) rui(m, d, t + 0.03 + i * (0.03 + azar() * 0.05), 0.025, { tipo: 'highpass', f0: f * (0.8 + azar() * 0.5), vol: v * (0.6 + azar() * 0.6) }); };

  // ── recetas por elemento: carga(g), lanzar(g, dur), impacto(g) ── (g = grandeza del movimiento 0,7–1,5)
  const R = {
    fuego: {
      carga: (m, d, t, g) => { rui(m, d, t, 0.3 + 0.2 * g, { f0: 500, f1: 2400, q: 2, vol: 0.1, att: 0.25 }); crepitar(m, d, t, 4 + Math.round(g * 2), 0.1, 3500); },
      lanzar: (m, d, t, g, u) => { rui(m, d, t, u, { f0: 800, f1: 220, q: 0.8, vol: 0.2, att: u * 0.15 }); osc(m, d, t, u, { onda: 'sawtooth', f0: 190, f1: 70, vol: 0.06 }); },
      impacto: (m, d, t, g) => { osc(m, d, t, 0.1 + 0.28 * g, { f0: 150, f1: 42, vol: 0.5 * g }); rui(m, d, t, 0.2 + 0.1 * g, { tipo: 'lowpass', f0: 3500, f1: 300, vol: 0.35 * g }); crepitar(m, d, t + 0.03, 5, 0.1, 4000); },
    },
    agua: {
      carga: (m, d, t, g) => { for (let i = 0; i < 4 + Math.round(g * 2); i++) { const f = 350 + azar() * 450; osc(m, d, t + i * 0.07, 0.09, { f0: f, f1: f * 1.8, vol: 0.08 }); } },
      lanzar: (m, d, t, g, u) => { rui(m, d, t, u, { f0: 1400, f1: 500, q: 1.2, vol: 0.17, att: u * 0.3 }); rui(m, d, t, u * 0.6, { tipo: 'highpass', f0: 4200, vol: 0.05, att: u * 0.3 }); },
      impacto: (m, d, t, g) => { rui(m, d, t, 0.3, { f0: 1100, f1: 400, q: 0.9, vol: 0.38 * g }); osc(m, d, t, 0.15, { f0: 520, f1: 160, vol: 0.3 * g }); rui(m, d, t, 0.14, { tipo: 'highpass', f0: 5000, vol: 0.1 }); },
    },
    hoja: {
      carga: (m, d, t, g) => { rui(m, d, t, 0.3, { tipo: 'highpass', f0: 2500, f1: 4500, q: 0.7, vol: 0.09, att: 0.15 }); crepitar(m, d, t, 3, 0.05, 5000); },
      lanzar: (m, d, t, g, u) => { rui(m, d, t, Math.max(0.12, u * 0.8), { tipo: 'highpass', f0: 2500, f1: 6000, vol: 0.14, att: 0.025 }); },
      impacto: (m, d, t, g) => { rui(m, d, t, 0.09, { f0: 1600, f1: 700, vol: 0.4 * g }); osc(m, d, t, 0.13, { onda: 'triangle', f0: 260, f1: 110, vol: 0.36 * g }); },
    },
    electrico: {
      carga: (m, d, t, g) => { osc(m, d, t, 0.4, { onda: 'sawtooth', f0: 70, f1: 420, vol: 0.08, att: 0.3, fm: { f: 31, i: 40 } }); rui(m, d, t, 0.4, { tipo: 'highpass', f0: 6000, vol: 0.05, att: 0.3 }); },
      lanzar: (m, d, t, g, u) => { osc(m, d, t, Math.max(0.12, Math.min(u, 0.5)), { onda: 'square', f0: 2200, f1: 180, vol: 0.12 }); rui(m, d, t, 0.15, { tipo: 'highpass', f0: 5000, vol: 0.12 }); },
      impacto: (m, d, t, g) => { rui(m, d, t, 0.09, { tipo: 'highpass', f0: 6000, vol: 0.4 * g }); osc(m, d, t, 0.18, { f0: 900, f1: 500, vol: 0.2 * g, fm: { f: 233, i: 600 } }); crepitar(m, d, t + 0.05, 6, 0.08, 7000); },
    },
    aire: {
      carga: (m, d, t, g) => { rui(m, d, t, 0.4, { f0: 350, f1: 1100, q: 0.6, vol: 0.1, att: 0.3 }); },
      lanzar: (m, d, t, g, u) => { rui(m, d, t, Math.max(0.2, u), { f0: 300, f1: 1800, q: 0.7, vol: 0.22, att: Math.max(0.2, u) * 0.45 }); },
      impacto: (m, d, t, g) => { rui(m, d, t, 0.3, { tipo: 'lowpass', f0: 2000, f1: 250, vol: 0.3 * g }); osc(m, d, t, 0.2, { f0: 95, f1: 60, vol: 0.3 * g }); },
    },
    roca: {
      carga: (m, d, t, g) => { rui(m, d, t, 0.5, { tipo: 'lowpass', f0: 220, q: 0.7, vol: 0.2, att: 0.35 }); osc(m, d, t, 0.5, { onda: 'sawtooth', f0: 52, f1: 60, vol: 0.08, att: 0.3 }); },
      lanzar: (m, d, t, g, u) => { rui(m, d, t, Math.max(0.2, u), { f0: 220, f1: 700, q: 0.8, vol: 0.2, att: Math.max(0.2, u) * 0.3 }); osc(m, d, t, Math.max(0.2, u), { f0: 70, f1: 50, vol: 0.18 }); },
      impacto: (m, d, t, g) => { osc(m, d, t, 0.15 + 0.3 * g, { f0: 95, f1: 32, vol: 0.6 * g }); rui(m, d, t, 0.25, { f0: 450, f1: 200, q: 0.7, vol: 0.45 * g }); for (let i = 0; i < 6; i++) rui(m, d, t + 0.05 + i * 0.04, 0.03, { f0: 1500 + azar() * 900, vol: 0.12 }); },
    },
    sombra: {
      carga: (m, d, t, g) => { osc(m, d, t, 0.5, { f0: 700, f1: 280, vol: 0.08, att: 0.2 }); osc(m, d, t, 0.5, { f0: 709, f1: 284, vol: 0.08, att: 0.2 }); },
      lanzar: (m, d, t, g, u) => { const w = Math.max(0.25, u); rui(m, d, t, w, { f0: 200, f1: 1500, q: 1.5, vol: 0.2, att: w * 0.85 }); osc(m, d, t, w, { f0: 60, f1: 60, vol: 0.14 }); },
      impacto: (m, d, t, g) => { osc(m, d, t, 0.45, { f0: 80, f1: 38, vol: 0.5 * g }); osc(m, d, t, 0.3, { onda: 'sawtooth', f0: 110, f1: 55, vol: 0.1 * g }); rui(m, d, t, 0.4, { f0: 900, f1: 150, q: 0.8, vol: 0.25 * g, att: 0.01 }); },
    },
    neutro: {
      carga: (m, d, t) => { rui(m, d, t, 0.3, { f0: 600, f1: 1500, vol: 0.08, att: 0.2 }); },
      lanzar: (m, d, t, g, u) => { rui(m, d, t, Math.max(0.12, u), { f0: 900, f1: 400, vol: 0.14, att: 0.04 }); },
      impacto: (m, d, t, g) => { osc(m, d, t, 0.15, { f0: 120, f1: 50, vol: 0.3 * g }); rui(m, d, t, 0.1, { f0: 900, vol: 0.2 * g }); },
    },
  };
  const NOTA = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const arpegio = (m, d, t, notas, paso, dur, vol) => notas.forEach((n, i) => { osc(m, d, t + i * paso, dur, { f0: NOTA(n), vol, att: 0.008 }); osc(m, d, t + i * paso, dur * 0.7, { onda: 'triangle', f0: NOTA(n) * 2, vol: vol * 0.4, att: 0.008 }); });

  // API de bajo nivel (la usan el despachador y la demo): tipo = carga | lanzar | impacto | golpe_critico | bloqueo | defensa | apoyo | cura | esquiva | quemadura | ko | listo | reaccion | victoria | derrota
  function tocar(m, tipo, el, t, o) {
    o = o || {}; cadena(m); const g = o.g || 1, pan = o.pan || 0, r = R[el] || R.neutro;
    if (tipo === 'carga') r.carga(m, voz(m, pan, 0.12), t, g);
    else if (tipo === 'lanzar') r.lanzar(m, voz(m, pan, 0.15), t, g, o.dur || 0.3);
    else if (tipo === 'impacto') { r.impacto(m, voz(m, -pan * 0 + (o.pan || 0), 0.3 * g), t, g); if (o.crit) { const d = voz(m, pan, 0.2); rui(m, d, t, 0.07, { tipo: 'highpass', f0: 5500, vol: 0.22 }); osc(m, d, t, 0.13, { f0: 2000, f1: 900, vol: 0.12 }); } }
    else if (tipo === 'bloqueo') { const d = voz(m, pan, 0.1); osc(m, d, t, 0.09, { onda: 'square', f0: 320, f1: 250, vol: 0.11 }); rui(m, d, t, 0.07, { f0: 2800, vol: 0.2 }); osc(m, d, t, 0.13, { f0: 110, f1: 70, vol: 0.22 }); }
    else if (tipo === 'defensa') { const d = voz(m, pan, 0.3); [[660, 0.35, 0.16], [990, 0.35, 0.12], [1320, 0.4, 0.09]].forEach(([f, du, v]) => osc(m, d, t, du, { f0: f, vol: v, att: 0.015 })); rui(m, d, t, 0.2, { tipo: 'highpass', f0: 6000, vol: 0.05, att: 0.1 }); }
    else if (tipo === 'apoyo') arpegio(m, voz(m, pan, 0.3), t, [72, 76, 79, 84], 0.06, 0.25, 0.09);
    else if (tipo === 'cura') arpegio(m, voz(m, pan, 0.25), t, [84, 88], 0.07, 0.2, 0.1);
    else if (tipo === 'esquiva') rui(m, voz(m, -pan, 0.05), t, 0.18, { f0: 1800, f1: 500, q: 1, vol: 0.28, att: 0.05 });
    else if (tipo === 'quemadura') { const d = voz(m, pan, 0); rui(m, d, t, 0.05, { tipo: 'highpass', f0: 4500, vol: 0.07 }); rui(m, d, t + 0.06, 0.05, { tipo: 'highpass', f0: 5200, vol: 0.05 }); }
    else if (tipo === 'ko') { const d = voz(m, pan, 0.35); osc(m, d, t, 0.55, { f0: 420, f1: 55, vol: 0.3, att: 0.01 }); rui(m, d, t, 0.45, { tipo: 'lowpass', f0: 1200, f1: 150, vol: 0.25 }); }
    else if (tipo === 'listo') { const d = voz(m, pan, 0.2); osc(m, d, t, 0.15, { f0: NOTA(84), vol: 0.09 }); osc(m, d, t + 0.08, 0.25, { f0: NOTA(91), vol: 0.09 }); }
    else if (tipo === 'reaccion') { const d = voz(m, pan, 0.25); osc(m, d, t, 0.15, { f0: 880, f1: 1760, vol: 0.09 }); osc(m, d, t + 0.07, 0.2, { f0: 1320, vol: 0.07 }); }
    else if (tipo === 'victoria') { arpegio(m, voz(m, 0, 0.3), t, [72, 76, 79, 84, 88, 91], 0.1, 0.32, 0.12); }
    else if (tipo === 'derrota') { arpegio(m, voz(m, 0, 0.3), t, [67, 64, 60], 0.28, 0.5, 0.1); }
  }

  // ── variedad por movimiento: timbre propio (afinación/brillo según el id) + capas según forma y etiqueta ──
  const hash = (x) => { let h = 2166136261; for (let i = 0; i < x.length; i++) h = Math.imul(h ^ x.charCodeAt(i), 16777619); return h >>> 0; };
  function perfil(mov) { const h = hash(mov || '-'), mv = MOV[mov]; MP.p = 0.86 + ((h & 255) / 255) * 0.3 + (mv ? cl(((mv.pot || 0) - 40) / 400, -0.08, 0.12) * -1 : 0); MP.b = 0.8 + (((h >>> 8) & 255) / 255) * 0.5; }
  const ELNOTA = { fuego: 62, agua: 67, hoja: 64, electrico: 74, aire: 79, roca: 55, sombra: 58, neutro: 60 };
  function capa(m, fase, mov, el, t, pan, g) {   // sonidos añadidos que distinguen un movimiento de otro del mismo elemento
    const mv = MOV[mov]; if (!mv) return; const d = voz(m, pan, 0.18), tag = mv.tag || '', f = mv.forma;
    if (fase === 'lanzar') {
      if (f === 'proyectil') osc(m, voz(m, pan, 0.1, -pan, 0.3, t), t, 0.3, { onda: 'triangle', f0: 900, f1: 500, vol: 0.05 });
      else if (f === 'linea' || f === 'haz') { rui(m, voz(m, pan, 0.15, -pan, 0.35, t), t, 0.4, { f0: 700, f1: 2600, q: 3, vol: 0.12, att: 0.1 }); osc(m, d, t, 0.4, { onda: 'sawtooth', f0: 140, f1: 220, vol: 0.05, att: 0.1 }); }
      else if (f === 'zona' || f === 'area') { osc(m, d, t, 0.5, { f0: 70, f1: 45, vol: 0.12, att: 0.05 }); rui(m, d, t, 0.45, { tipo: 'lowpass', f0: 500, vol: 0.09, att: 0.15 }); }
      else if (f === 'contacto') rui(m, d, t, 0.08, { tipo: 'highpass', f0: 3000, vol: 0.1 });
      if (tag === 'veloz') { rui(m, d, t + 0.05, 0.05, { tipo: 'highpass', f0: 4500, vol: 0.1 }); rui(m, d, t + 0.1, 0.05, { tipo: 'highpass', f0: 5200, vol: 0.08 }); }
      if (tag === 'embiste') { osc(m, d, t, 0.22, { onda: 'sawtooth', f0: 70, f1: 140, vol: 0.12, att: 0.12 }); }
    } else if (fase === 'impacto') {
      if (tag === 'embiste') { osc(m, d, t, 0.2, { f0: 90, f1: 45, vol: 0.3 }); rui(m, d, t, 0.12, { tipo: 'lowpass', f0: 700, vol: 0.2 }); }
      else if (tag === 'roba') { osc(m, d, t + 0.05, 0.25, { f0: 300, f1: 1200, vol: 0.1, att: 0.02 }); osc(m, d, t + 0.25, 0.1, { f0: NOTA(84), vol: 0.07 }); }
      else if (tag === 'debilita') osc(m, d, t, 0.35, { onda: 'sawtooth', f0: 520, f1: 130, vol: 0.09, att: 0.01 });
      else if (tag === 'cadena') [0, 0.07, 0.14].forEach((dt, i) => rui(m, d, t + dt, 0.05, { tipo: 'highpass', f0: 3500 + i * 900, vol: 0.14 }));
      else if (tag === 'provoca') { osc(m, d, t, 0.22, { onda: 'square', f0: 233, vol: 0.09, att: 0.02 }); osc(m, d, t, 0.22, { onda: 'square', f0: 247, vol: 0.07, att: 0.02 }); }
      else if (tag === 'espalda') { rui(m, d, t, 0.05, { tipo: 'highpass', f0: 6000, vol: 0.2 }); osc(m, d, t, 0.1, { f0: 2400, f1: 1500, vol: 0.1 }); }
      else if (tag === 'limpia') arpegio(m, d, t + 0.05, [88, 93], 0.06, 0.2, 0.07);
      if (f === 'zona' || f === 'area') osc(m, d, t, 0.3, { f0: 80, f1: 40, vol: 0.12 });
    }
  }
  const ESTSON = { quemado: [1900, 900, 'highpass'], mojado: [500, 900, 'bandpass'], enredado: [300, 200, 'bandpass'], aturdido: [800, 400, 'sine'], ralentizado: [500, 120, 'saw'], maldito: [220, 110, 'saw'], miedo: [1200, 1900, 'sine'], empujado: [400, 150, 'bandpass'], ciego: [1500, 300, 'sine'], debil: [600, 200, 'saw'] };
  function estadoSon(m, est, t, pan) {
    const x = ESTSON[est]; if (!x) return; const d = voz(m, pan, 0.2), w = x[2] === 'saw' ? 'sawtooth' : 'sine';
    if (x[2] === 'highpass' || x[2] === 'bandpass') rui(m, d, t, 0.25, { tipo: x[2], f0: x[0], f1: x[1], q: 2, vol: 0.14, att: 0.04 });
    else osc(m, d, t, 0.3, { onda: w, f0: x[0], f1: x[1], vol: 0.09, att: 0.01 });
    if (est === 'aturdido') [0, 0.09, 0.18].forEach((dt, i) => osc(m, d, t + dt, 0.08, { f0: 1500 + i * 300, vol: 0.06 }));
  }

  // ── despachador: eventos del combate → sonidos ──
  const GR = { b: 0.8, h: 1.1, e: 1.5, d: 0.9, a: 0.9 };
  const elDe = (mov) => (MOV[mov] ? MOV[mov].el : 'neutro'), hueco = (mov) => (MOV[mov] ? MOV[mov].hueco || 'b' : 'b');
  function evento(m, e, U, v) {
    const u = U[e.id], pan = u ? (u.side === 0 ? -0.35 : 0.35) : 0, t = m.c.currentTime + 0.005, el = elDe(e.mov), h = e.hueco || hueco(e.mov), g = GR[h] || 1;
    perfil(e.mov);
    try { despacha(m, e, U, v, u, pan, t, el, h, g); } finally { MP.p = 1; MP.b = 1; }
  }
  function despacha(m, e, U, v, u, pan, t, el, h, g) {
    switch (e.e) {
      case 'inicio': if (e.mov && (h === 'h' || h === 'e')) tocar(m, 'carga', el, t, { g, pan }); break;
      case 'efecto': tocar(m, 'lanzar', e.el || el, t, { g, pan, dur: e.forma === 'contacto' ? 0.12 : e.forma === 'proyectil' ? cl((e.dt || 3) / 20, 0.15, 0.8) : e.forma === 'zona' ? 0.5 : 0.3 }); capa(m, 'lanzar', e.mov, el, t, pan, g); break;
      case 'golpe': { const now = m.c.currentTime; if (now - S.imp > 0.12) { S.imp = now; S.nimp = 0; } if (++S.nimp > 5) break;
        if (e.bl) tocar(m, 'bloqueo', el, t, { pan }); else tocar(m, 'impacto', el, t, { g: g * (0.85 + cl(((e.d || 0) / (e.mx || 100)) * 2, 0, 0.6)), pan, crit: e.crit }); if (!e.bl) capa(m, 'impacto', e.mov, el, t, pan, g); break; }
      case 'defensa': tocar(m, 'defensa', el, t, { pan }); if (e.tag === 'esq') tocar(m, 'esquiva', el, t + 0.05, { pan }); break;
      case 'apoyo': { const n0 = ELNOTA[el] || 60; arpegio(m, voz(m, pan, 0.3), t, e.tag === 'regen' || e.tag === 'curaAliados' ? [n0 + 12, n0 + 16, n0 + 19] : [n0 + 12, n0 + 19, n0 + 24, n0 + 28], 0.06, 0.25, 0.14); break; }
      case 'estado': if (e.on) estadoSon(m, e.est, t, pan); break;
      case 'interrumpe': tocar(m, 'bloqueo', 'neutro', t, { pan }); break;
      case 'cambio': rui(m, voz(m, 0, 0.1), t, 0.25, { f0: 600, f1: 2200, q: 1.5, vol: 0.16, att: 0.08 }); break;
      case 'zona': osc(m, voz(m, 0, 0.3), t, 0.4, { f0: 90, f1: 40, vol: 0.2 }); break;
      case 'cura': tocar(m, 'cura', el, t, { pan }); break;
      case 'esquiva': tocar(m, 'esquiva', el, t, { pan }); break;
      case 'dot': tocar(m, 'quemadura', el, t, { pan }); break;
      case 'ko': tocar(m, 'ko', el, t, { pan }); break;
      case 'reaccion': tocar(m, 'reaccion', el, t, { pan }); break;
      case 'especial_listo': if (u && u.side === 0) tocar(m, 'listo', el, t, { pan }); break;
      case 'fin': if (v.fin && typeof v.fin.ganador === 'number' && !v.fin.corte) tocar(m, v.fin.ganador === 0 ? 'victoria' : 'derrota', el, t + 0.25, {}); break;
      default: break;
    }
  }
  // Cada cuadro: v = vista del combate (o null). Reproduce los eventos recientes aún no sonados y baja la música mientras haya combate.
  function seguir(est, v) {
    const A = G.audio, m = A && A.motor && A.motor();
    if (!m) { S.duck = false; return; }
    cadena(m);
    const en = !!(est && est.combate && v);
    if (en !== S.duck) { S.duck = en; try { m.mus.gain.setTargetAtTime(en ? 0.5 : 1, m.c.currentTime, 0.4); } catch (e) { /* sin ajuste */ } }
    if (!en) { if (S.k) { S.k = null; S.vistos.clear(); } return; }
    if (S.k !== est.combate) { S.k = est.combate; S.vistos.clear(); }
    const U = {}; v.unidades.forEach((u) => { U[u.id] = u; });
    v.ev.forEach((e) => {
      if (v.tick - e.t > 6) return; const key = e.t + '|' + e.e + '|' + e.id + '|' + (e.mov || '') + '|' + (e.de || '') + '|' + (e.obj || ''); if (S.vistos.has(key)) return; S.vistos.add(key);
      try { evento(m, e, U, v); } catch (er) { /* un sonido que falla no para el combate */ }
    });
    const pr = est.combate.premio; if (pr && pr.sube && S.kp !== est.combate) { S.kp = est.combate; try { const t = m.c.currentTime + 0.9; arpegio(m, voz(m, 0, 0.3), t, [72, 76, 79, 84, 88, 91, 96], 0.07, 0.3, 0.11); osc(m, voz(m, 0, 0.3), t + 0.5, 0.7, { f0: NOTA(96), vol: 0.07, att: 0.02 }); } catch (er) { /* sin sonido */ } }   // v2.303: sube de nivel
    if (S.vistos.size > 600) S.vistos.clear();
  }
  // v2.308: sonido del botón ⚡ al pulsarlo con el especial listo: golpe grave + «zing» ascendente + arpegio brillante de do mayor + destello + resplandor final. Corto (≈0,8 s), recompensa inmediata. Devuelve false si no hay audio.
  function pulsa() {
    const m = G.audio && G.audio.motor && G.audio.motor(); if (!m) return false;
    try { cadena(m); const t = m.c.currentTime + 0.005, d = voz(m, 0, 0.35, undefined, 0, t);
      osc(m, d, t, 0.16, { f0: 150, f1: 52, vol: 0.2, att: 0.003 });
      osc(m, d, t, 0.14, { onda: 'triangle', f0: 600, f1: 2400, vol: 0.09, att: 0.004 });
      arpegio(m, d, t + 0.02, [84, 88, 91, 96], 0.045, 0.2, 0.12);
      rui(m, d, t, 0.2, { tipo: 'highpass', f0: 3500, f1: 11000, vol: 0.07, att: 0.01 });
      osc(m, d, t + 0.2, 0.55, { f0: NOTA(96), vol: 0.05, att: 0.01 }); osc(m, d, t + 0.2, 0.55, { f0: NOTA(103), vol: 0.04, att: 0.01 });
      return true; } catch (e) { return false; }
  }
  G.sonidoC = { seguir, tocar, evento, pulsa, ELEMENTOS: Object.keys(R) };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.sonidoC;
})(typeof window !== 'undefined' ? window : globalThis);
