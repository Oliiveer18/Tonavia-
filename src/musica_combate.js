// musica_combate.js — MÚSICA DE TENSIÓN DEL COMBATE (v2.305). Sin archivos: todo se sintetiza con Web Audio, igual que el resto del sonido.
// Es música ADAPTATIVA: un bucle de 8 compases (148 bpm, re menor/frigio con dominante armónica) con 4 niveles de intensidad que suman capas:
//   0 bajo en corcheas + bombo + charles + pad grave y golpe de taiko · 1 caja, arpegio, charles en semicorcheas y clúster disonante (b9) · 2 melodía principal (2.ª mitad), golpes de cuerda y riser · 3 melodía completa a la octava, bombo doble, redobles cada compás.
// El nivel solo SUBE durante un combate y cambia en la barra del compás (nunca a mitad de frase). Sube con el tiempo (6 s) y cuando alguna criatura baja del 60 % o del 30 % de vida.
// Al empezar el combate la música de la zona se funde a silencio (G.audio.zona) y entra un golpe de impacto; al terminar se corta rápido (suena la fanfarria/derrota de sonido_combate.js) y la de la zona vuelve despacio.
// Parte PURA (evPaso, intensidad, LEAD) probada en test.js; parte MOTOR con el contexto de G.audio.motor(). Sin azar, sin DOM, sin estado de juego. Si algo falla, el combate sigue en silencio.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), cl = (x, a, b) => Math.max(a, Math.min(b, x)), hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const AJ = { ACTIVO: true, BPM: 148, ANTICIPO: 0.35, TONICA: 38, LEAD: 62, T_NIVEL1: 6, VIDA2: 0.6, VIDA3: 0.3, SALIDA: 0.12, RETORNO: 1.8, VOL: 0.85 };   // TONICA = re2 (MIDI 38) · LEAD = re4 (62) · RETORNO = s tras acabar hasta que vuelve la música de la zona
  const RAIZ = [0, 0, 1, 0, 0, 8, 7, 7], TERCERA = [3, 3, 4, 3, 3, 4, 4, 4];   // semitonos sobre re por compás: Dm Dm Eb Dm | Dm Bb A A (la dominante lleva do# en la melodía)
  const BAJO_A = 'r.r.r.rrr.r.r.o.', BAJO_B = 'r.r.r.rrr.r.rrm.';   // r = raíz · o = octava · m = segunda menor (cromatismo) ; los compases 4 y 8 usan B
  const KICK = [[0, 8], [0, 6, 8, 10], [0, 6, 8, 10, 14], [0, 3, 6, 8, 10, 11, 14]];
  const FILTRO = [2600, 4800, 8000, 15000];   // corte del filtro general por nivel: la música «se abre» al subir la tensión
  // Melodía: «n:pasos» (n = semitonos sobre re4; 16 pasos por compás; «-» = silencio).
  const LEAD_TXT = ['7:3 8:1 7:2 5:2 7:4 -:4', '7:3 8:1 7:2 5:2 3:6 -:2', '8:3 10:1 8:2 7:2 8:4 -:4', '7:2 5:2 3:2 5:2 7:8', '12:3 10:1 12:2 7:2 8:4 -:4', '10:3 8:1 10:2 5:2 8:4 -:4', '11:2 12:2 14:2 12:2 11:2 9:2 7:2 5:2', '11:6 -:2 11:1 12:1 11:1 9:1 7:4'];
  function parsear(txt) { let s = 0; const out = []; txt.trim().split(/\s+/).forEach((tk) => { const [a, b] = tk.split(':'), d = parseInt(b, 10); if (a !== '-') out.push({ s, n: parseInt(a, 10), d }); s += d; }); return { notas: out, total: s }; }
  const LEAD = LEAD_TXT.map((t) => parsear(t));

  // ── PARTE PURA ──
  // Eventos del paso absoluto n (16 por compás, bucle de 8 compases) al nivel L (0-3). Cada evento: { v, ... } con la duración d en pasos.
  function evPaso(n, L) {
    L = cl(L | 0, 0, 3); const b = Math.floor(n / 16) % 8, s = ((n % 16) + 16) % 16, pc = RAIZ[b], t3 = TERCERA[b], raiz = AJ.TONICA + pc, fin4 = b % 4 === 3, ev = [];
    const pat = fin4 ? BAJO_B : BAJO_A, ch = pat[s];
    if (ch !== '.') ev.push({ v: 'bajo', midi: raiz + (ch === 'o' ? 12 : ch === 'm' ? 1 : 0), d: pat[(s + 1) % 16] === '.' ? 1.8 : 0.9, vol: L >= 2 ? 0.3 : 0.26 });
    if (KICK[L].indexOf(s) >= 0) ev.push({ v: 'bombo', vol: s === 0 ? 1 : 0.8 });
    if (L >= 1) {
      if ((s === 4 || (s === 12 && !fin4)) ) ev.push({ v: 'caja', vol: 0.5 });
      if (fin4 && s >= 12) ev.push({ v: 'caja', vol: 0.2 + (s - 12) * 0.1 });   // redoble de cierre de frase
      else if (L >= 3 && s >= 14) ev.push({ v: 'caja', vol: 0.18 + (s - 14) * 0.12 });
      if (L >= 2 && s === 15 && !fin4) ev.push({ v: 'caja', vol: 0.07 });
    }
    if (L >= 2 && (s === 6 || s === 14)) ev.push({ v: 'charles', vol: 0.07, abierto: true }); else ev.push({ v: 'charles', vol: L === 0 ? (s % 2 ? 0 : 0.05) : (s % 2 ? 0.04 : 0.08), abierto: false });
    if (s === 0 && b % 4 === 0) ev.push({ v: 'tom', f: 95, d: 0.7, vol: 0.6 });   // taiko al inicio de cada frase de 4 compases
    if (fin4 && L >= 2 && (s === 8 || s === 10)) ev.push({ v: 'tom', f: s === 8 ? 150 : 118, d: 0.3, vol: 0.34 });
    if (s === 0) { const m = [raiz + 12, raiz + 12 + t3, raiz + 19]; if (L >= 1 && t3 === 3) m.push(raiz + 25); ev.push({ v: 'pad', midis: m, d: 16, vol: 0.034 }); }
    if (L >= 1 && (L >= 3 || s % 2 === 0)) { const T = [0, t3, 7, 12, 7, t3]; ev.push({ v: 'arpegio', midi: raiz + 24 + T[Math.floor(n / (L >= 3 ? 1 : 2)) % 6], d: 0.9, vol: L >= 3 ? 0.024 : 0.03 }); }
    if (L >= 2 && (L >= 3 || b >= 4)) LEAD[b].notas.forEach((q) => { if (q.s === s) { ev.push({ v: 'lead', midi: AJ.LEAD + q.n, d: q.d * 0.95, vol: 0.07 }); if (L >= 3) ev.push({ v: 'lead', midi: AJ.LEAD + 12 + q.n, d: q.d * 0.9, vol: 0.026 }); } });
    if (L >= 2 && (s === 6 || s === 14)) ev.push({ v: 'golpe', midis: [raiz + 12, raiz + 12 + t3, raiz + 31], d: 1, vol: 0.04 });
    if (L >= 2 && b === 7 && s === 0) ev.push({ v: 'riser', d: 16, vol: 0.15 });
    return ev;
  }
  // Nivel de tensión que pide el combate: sube con el tiempo y con lo bajo que esté la vida de cualquier criatura en pie (v = vista del combate).
  function intensidad(v) {
    if (!v) return 0; const TPS = (G.COMBATE_DATOS && G.COMBATE_DATOS.TPS) || 20; let mn = 1; (v.unidades || []).forEach((u) => { if (!u.ko) mn = Math.min(mn, u.hpF); });
    let L = (v.tick || 0) / TPS >= AJ.T_NIVEL1 ? 1 : 0; if (mn < AJ.VIDA2) L = Math.max(L, 2); if (mn < AJ.VIDA3) L = 3; return L;
  }

  // ── MOTOR ──
  const S = { c: null, activo: false, k: null, L: 0, Lq: 0, n: 0, t0: 0, fin: 0, retorno: false, entrada: false };
  function env(g, t, a, d, v) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + Math.min(a, d * 0.9)); g.gain.exponentialRampToValueAtTime(0.0001, t + d); }
  function ruido(m, dest, t, d, o) { const c = m.c, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); n.buffer = m.ruido; n.loop = true; f.type = o.tipo || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f0, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + d); env(g, t, o.att || 0.003, d, o.vol); n.connect(f); f.connect(g); g.connect(dest); n.start(t, (o.off || 0) % 0.8); n.stop(t + d + 0.05); }
  function sint(m, dest, o) {   // voz de síntesis sustractiva: osciladores (tipo, desafinación en cents, multiplicador) → filtro paso bajo → envolvente
    const c = m.c, f = c.createBiquadFilter(), g = c.createGain(), t = o.t, fin = t + o.d; f.type = 'lowpass'; f.Q.value = o.q || 0.8; f.frequency.setValueAtTime(o.f0, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, fin); env(g, t, o.a || 0.01, o.d, o.vol);
    o.osc.forEach((q) => { const x = c.createOscillator(); x.type = q[0]; x.frequency.value = hz(o.midi) * (q[2] || 1); if (q[1]) x.detune.value = q[1];
      if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.6; lg.gain.value = o.vib; l.connect(lg); lg.connect(x.detune); l.start(t); l.stop(fin + 0.05); }
      x.connect(f); x.start(t); x.stop(fin + 0.05); });
    f.connect(g); g.connect(o.dest); if (o.eco && S.eco) { const e = c.createGain(); e.gain.value = o.eco; g.connect(e); e.connect(S.eco); }
  }
  function bombo(m, t, vol) { const c = m.c, x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(165, t); x.frequency.exponentialRampToValueAtTime(42, t + 0.13); g.gain.setValueAtTime(0.9 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); x.connect(g); g.connect(S.p); x.start(t); x.stop(t + 0.24); ruido(m, S.p, t, 0.02, { tipo: 'highpass', f0: 2500, vol: 0.12 * vol }); }
  function caja(m, t, vol) { const c = m.c, x = c.createOscillator(), g = c.createGain(); x.type = 'triangle'; x.frequency.setValueAtTime(210, t); x.frequency.exponentialRampToValueAtTime(130, t + 0.09); env(g, t, 0.002, 0.11, 0.35 * vol); x.connect(g); g.connect(S.p); x.start(t); x.stop(t + 0.14); ruido(m, S.p, t, 0.16, { f0: 1900, q: 0.8, vol: 0.55 * vol, off: t * 7 }); }
  function tom(m, t, f, d, vol) { const c = m.c, x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(f * 1.5, t); x.frequency.exponentialRampToValueAtTime(f * 0.55, t + d); env(g, t, 0.004, d, 0.7 * vol); x.connect(g); g.connect(S.p); x.start(t); x.stop(t + d + 0.05); ruido(m, S.p, t, d * 0.5, { tipo: 'lowpass', f0: 900, vol: 0.2 * vol }); }
  function voz(m, e, t, seg) {
    switch (e.v) {
      case 'bajo': sint(m, S.t, { t, d: e.d * seg, midi: e.midi, vol: e.vol, a: 0.006, f0: 1400, f1: 260, q: 2.5, dest: S.t, osc: [['sawtooth', 0], ['square', -6, 1], ['sine', 0, 0.5]] }); break;
      case 'bombo': bombo(m, t, e.vol); break;
      case 'caja': caja(m, t, e.vol); break;
      case 'charles': if (e.vol > 0) ruido(m, S.p, t, e.abierto ? 0.17 : 0.04, { tipo: 'highpass', f0: 7500, vol: e.vol, off: t * 13 }); break;
      case 'tom': tom(m, t, e.f, e.d, e.vol); break;
      case 'pad': e.midis.forEach((mi, i) => sint(m, S.t, { t, d: e.d * seg, midi: mi, vol: e.vol * (i === 3 ? 0.8 : 1), a: 0.5, f0: 600, f1: 1500, q: 0.7, dest: S.t, osc: [['sawtooth', -9], ['sawtooth', 9]] })); break;
      case 'arpegio': sint(m, S.t, { t, d: e.d * seg, midi: e.midi, vol: e.vol, a: 0.004, f0: 2600, f1: 900, q: 1.2, dest: S.t, eco: 0.25, osc: [['square', 0]] }); break;
      case 'lead': sint(m, S.t, { t, d: e.d * seg, midi: e.midi, vol: e.vol, a: 0.03, f0: 3600, f1: 2200, q: 1.5, vib: 7, dest: S.t, eco: 0.3, osc: [['sawtooth', -5], ['square', 5]] }); break;
      case 'golpe': e.midis.forEach((mi) => sint(m, S.t, { t, d: e.d * seg + 0.1, midi: mi, vol: e.vol, a: 0.004, f0: 3200, f1: 700, q: 1, dest: S.t, osc: [['sawtooth', -7], ['sawtooth', 7]] })); break;
      case 'riser': ruido(m, S.t, t, e.d * seg, { f0: 400, f1: 7000, q: 2.2, vol: e.vol, att: e.d * seg * 0.92, off: 0.1 }); break;
      default: break;
    }
  }
  function cadena(m) {   // buses: tonal (filtro general + eco) y percusión → compresor → ganancia de entrada/salida → bus de música
    if (S.c === m.c) return;
    const c = m.c, comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    const g = c.createGain(); g.gain.value = 0; comp.connect(g); g.connect(m.mus);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.5; f.frequency.value = FILTRO[0]; f.connect(comp);
    const p = c.createGain(); p.gain.value = 1; p.connect(comp);
    S.c = c; S.g = g; S.f = f; S.t = f; S.p = p; S.eco = null;
    if (c.createDelay) { const d = c.createDelay(1), fb = c.createGain(), w = c.createGain(); d.delayTime.value = (60 / AJ.BPM / 4) * 3; fb.gain.value = 0.34; w.gain.value = 0.9; d.connect(fb); fb.connect(d); d.connect(w); w.connect(f); S.eco = d; }
    S.activo = false;
  }
  // Programa los pasos [a, b) al nivel L; el paso 0 suena en t0. Se usa en el juego (por cuadro) y en la demo fuera de línea.
  function programar(m, a, b, L, t0) { const seg = 60 / AJ.BPM / 4; for (let n = a; n < b; n++) evPaso(n, L).forEach((e) => voz(m, e, t0 + n * seg, seg)); return seg; }
  function entrada(m, t) {   // impacto de entrada: bombo grave largo + barrido de ruido
    const c = m.c, x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(130, t); x.frequency.exponentialRampToValueAtTime(30, t + 1.0); env(g, t, 0.005, 1.1, 0.55); x.connect(g); g.connect(S.p); x.start(t); x.stop(t + 1.15);
    ruido(m, S.p, t, 0.7, { tipo: 'bandpass', f0: 5200, f1: 320, q: 1.2, vol: 0.2, att: 0.004 });
  }
  function iniciar(m, k) {
    const c = m.c, now = c.currentTime; S.activo = true; S.t0 = now + 0.06; S.n = 0; S.fin = 0; S.retorno = false;
    if (S.k !== k) { S.k = k; S.L = 0; S.Lq = 0; S.entrada = false; }
    S.g.gain.cancelScheduledValues(now); S.g.gain.setValueAtTime(S.g.gain.value, now); S.g.gain.setTargetAtTime(AJ.VOL, now, 0.04);
    S.f.frequency.setValueAtTime(FILTRO[S.L], now);
    if (G.audio && G.audio.zona) G.audio.zona(0);
    if (!S.entrada) { S.entrada = true; entrada(m, S.t0); }
  }
  function parar(m, ahora) {   // fin del combate: corte rápido; la música de la zona vuelve pasado un rato
    S.activo = false; S.fin = ahora; S.retorno = true;
    try { S.g.gain.setTargetAtTime(0, ahora, AJ.SALIDA); } catch (e) { /* sin ajuste */ }
  }
  // Cada cuadro: v = vista del combate (o null) — la misma que recibe sonido_combate.seguir.
  function seguir(est, v) {
    if (!AJ.ACTIVO) return;
    try {
      const A = G.audio, m = A && A.motor && A.motor(), en = !!(m && est && est.combate && v && !v.fin);
      if (!m) { S.activo = false; S.retorno = false; return; }   // en silencio o con la pestaña oculta no se programa nada; al volver se re-engancha
      cadena(m); const c = m.c, now = c.currentTime;
      if (en) {
        if (!S.activo) iniciar(m, est.combate);
        const seg = 60 / AJ.BPM / 4; S.Lq = Math.max(S.Lq, intensidad(v));
        if (S.t0 + S.n * seg < now - 0.05) S.n = Math.ceil((now - S.t0) / seg);   // se quedó atrás (cuadros perdidos): salta al paso actual sin perder el compás
        while (S.t0 + S.n * seg < now + AJ.ANTICIPO) {
          if (S.n % 16 === 0 && S.Lq > S.L) { S.L = S.Lq; try { S.f.frequency.setTargetAtTime(FILTRO[S.L], S.t0 + S.n * seg, 0.25); } catch (e) { /* sin ajuste */ } }
          programar(m, S.n, S.n + 1, S.L, S.t0); S.n++;
        }
      } else if (S.activo) parar(m, now);
      else if (S.retorno && now - S.fin >= AJ.RETORNO) { S.retorno = false; if (A.zona) A.zona(1); }
    } catch (e) { S.activo = false; /* un fallo de la música nunca para el combate */ }
  }
  G.musicaC = { cadena, entrada, AJ, RAIZ, TERCERA, LEAD, LEAD_TXT, parsear, evPaso, intensidad, programar, seguir, estado: S };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.musicaC;
})(typeof window !== 'undefined' ? window : globalThis);
