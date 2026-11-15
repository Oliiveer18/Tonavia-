// audio.js — MÚSICA Y SONIDO POR CÓDIGO (v2.136, ID-4). Sin archivos de audio: todo se sintetiza con Web Audio. No toca el motor, el estado ni el dibujo (la huella del juego no cambia) y sirve igual en el 2D y en el HD-2D.
// Dos partes: (1) PURA y probada en test.js: temas (datos), parseo de notas, plan de eventos por pulso, elección de tema según la zona donde se está y efectos (SFX);
//             (2) MOTOR de Web Audio: se crea al primer gesto del jugador (los móviles lo exigen), planifica notas con anticipo, funde entre temas, se calla con la pestaña oculta y recuerda «silencio».
// Si Web Audio no existe o falla, el juego sigue sin sonido (nunca lanza). Se apaga con ?sonido=0 o G.audio.AJUSTES.ACTIVO = false.
// Un tema = bucle de 16 pulsos (4 compases de 4): melodía (`mel`, grados de la escala), bajo (`acordes`, 1 grado por compás: raíz y quinta) y percusión opcional (`perc`, 8 corcheas por compás: k bombo · s caja · h hi-hat).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const URL_OFF = (() => { try { return typeof location !== 'undefined' && /[?&]sonido=0/.test(location.search || ''); } catch (e) { return false; } })();
  const AJUSTES = { ACTIVO: !URL_OFF, VOLUMEN: 0.5, MUSICA: 0.45, EFECTOS: 0.8, ANTICIPO: 0.3, FUNDIDO: 1.5, RETARDO: 0.6, CLAVE: 'criaturas.sonido' }; // RETARDO = segundos que hay que estar en una zona para que cambie la música (evita parpadeo en los bordes)
  const ESCALAS = { mayor: [0, 2, 4, 5, 7, 9, 11], lidio: [0, 2, 4, 6, 7, 9, 11], mixolidio: [0, 2, 4, 5, 7, 9, 10], menor: [0, 2, 3, 5, 7, 8, 10], dorica: [0, 2, 3, 5, 7, 9, 10], frigia: [0, 1, 3, 5, 7, 8, 10], armonica: [0, 2, 3, 5, 7, 8, 11] };
  // Un tema por zona de aparición (su elemento) + el de la región por defecto. Para una región nueva basta con añadir un tema con el id de la región (mapa.region).
  const TEMAS = {
    albanota: { bpm: 92, tonica: 60, escala: 'mayor', onda: 'square', vol: 0.10, acordes: [0, 3, 4, 0], perc: null, mel: '4:1 2:.5 4:.5 5:1 4:1 | 2:1 0:.5 2:.5 4:2 | 5:1 4:.5 5:.5 7:1 5:1 | 4:1 2:1 0:2' },
    hoja:     { bpm: 104, tonica: 67, escala: 'mayor', onda: 'triangle', vol: 0.20, acordes: [0, 4, 3, 0], perc: null, mel: '7:.5 6:.5 4:1 2:1 4:1 | 5:1 4:.5 2:.5 0:2 | 2:.5 4:.5 5:.5 6:.5 7:2 | 6:1 4:1 0:2' },
    aire:     { bpm: 72, tonica: 62, escala: 'lidio', onda: 'sine', vol: 0.22, acordes: [0, 1, 4, 0], perc: null, mel: '4:2 6:1 7:1 | 9:2 7:1 6:1 | 4:2 2:1 4:1 | 0:3 -:1' },
    agua:     { bpm: 80, tonica: 57, escala: 'menor', onda: 'triangle', vol: 0.20, acordes: [0, 5, 3, 4], perc: null, mel: '0:1 2:1 4:1 2:1 | 3:1.5 2:.5 1:1 0:1 | 2:1 4:1 6:1 4:1 | 3:2 0:2' },
    electrico: { bpm: 132, tonica: 64, escala: 'mixolidio', onda: 'square', vol: 0.08, acordes: [0, 1, 3, 4], perc: 'kh.hkh.h', mel: '0:.5 4:.5 7:.5 4:.5 0:.5 4:.5 7:.5 4:.5 | 1:.5 5:.5 8:.5 5:.5 1:.5 5:.5 8:.5 5:.5 | 2:.5 6:.5 9:.5 6:.5 4:.5 7:.5 9:.5 7:.5 | 7:1 6:1 4:1 -:1' },
    sombra:   { bpm: 64, tonica: 53, escala: 'frigia', onda: 'triangle', vol: 0.20, acordes: [0, 1, 0, 4], perc: null, mel: '0:2 1:1 0:1 | -:1 2:1 1:1 0:1 | 4:2 3:1 2:1 | 1:2 0:2' },
    roca:     { bpm: 88, tonica: 50, escala: 'dorica', onda: 'square', vol: 0.09, acordes: [0, 0, 3, 4], perc: 'k.h.s.h.', mel: '0:1 -:.5 0:.5 2:1 4:1 | 3:1 -:.5 2:.5 0:2 | 0:1 -:.5 0:.5 4:1 5:1 | 4:1 3:1 2:.5 0:.5 -:1' },
    centro_pc: { bpm: 100, tonica: 65, escala: 'mayor', onda: 'triangle', vol: 0.20, acordes: [0, 3, 4, 0], perc: null, mel: '0:1 2:1 4:1 7:1 | 6:1 4:1 2:2 | 0:1 2:1 4:1 5:1 | 4:2 2:1 0:1' }, // interior del Centro PC: el tema se elige por el id del mapa
    tienda:   { bpm: 112, tonica: 60, escala: 'mayor', onda: 'triangle', vol: 0.20, acordes: [0, 4, 3, 0], perc: null, mel: '0:1 4:1 2:1 4:1 | 5:1 4:1 2:2 | 0:1 4:1 7:1 4:1 | 2:1 3:.5 2:.5 0:2' }, // interior de la Tienda
    laboratorio: { bpm: 92, tonica: 62, escala: 'lidio', onda: 'sine', vol: 0.20, acordes: [0, 3, 4, 0], perc: null, mel: '2:1 4:1 6:2 | 4:1 2:1 0:2 | 2:1 4:1 7:1 6:1 | 4:2 2:1 0:1' }, // interior del Laboratorio
    casa:     { bpm: 84, tonica: 60, escala: 'mayor', onda: 'triangle', vol: 0.18, acordes: [0, 5, 3, 4], perc: null, mel: '4:1 2:1 0:2 | 2:1 4:1 5:2 | 4:1 5:.5 4:.5 2:1 0:1 | 2:1 -:.5 0:.5 0:2' }, // v2.186 (ID-5m, online): UN tema para todas las casas; un mapa lo pide con «tema»: «casa» en su JSON (escala a cualquier casa nueva)
    ermita:   { bpm: 66, tonica: 55, escala: 'dorica', onda: 'sine', vol: 0.20, acordes: [0, 3, 5, 4], perc: null, mel: '0:2 2:1 4:1 | 3:2 2:1 1:1 | 0:1 2:1 4:1 7:1 | 6:2 4:1 0:1' }, // interior de la Ermita del Primer Eco
    fuego:    { bpm: 120, tonica: 52, escala: 'armonica', onda: 'square', vol: 0.09, acordes: [0, 5, 3, 4], perc: 'k.hhk.sh', mel: '4:.5 4:.5 5:.5 4:.5 3:1 2:1 | 0:.5 0:.5 2:.5 0:.5 -:1 4:1 | 4:.5 5:.5 6:.5 5:.5 4:1 2:1 | 3:1 2:1 0:2' }
  };
  const BEATS = 16;
  // Efectos: [nota MIDI, duración s] seguidos. Suenan encima de la música.
  const SFX = { curar: { onda: 'sine', vol: 0.15, n: [[72, 0.09], [76, 0.09], [79, 0.09], [84, 0.1], [88, 0.26]] }, pique: { onda: 'triangle', vol: 0.16, n: [[88, 0.06], [84, 0.06], [88, 0.1]] }, captura: { onda: 'square', vol: 0.1, n: [[72, 0.07], [76, 0.07], [79, 0.07], [84, 0.16]] }, lanzar: { onda: 'sine', vol: 0.09, n: [[84, 0.05], [72, 0.1]] }, hablar: { onda: 'square', vol: 0.12, n: [[76, 0.07], [79, 0.1]] }, evolucionar: { onda: 'triangle', vol: 0.22, n: [[60, 0.1], [64, 0.1], [67, 0.1], [72, 0.1], [76, 0.3]] },
    puerta: { onda: 'triangle', vol: 0.2, n: [[72, 0.08], [67, 0.08], [60, 0.18]] }, cambiar: { onda: 'square', vol: 0.1, n: [[67, 0.06], [72, 0.09]] }, ui: { onda: 'square', vol: 0.08, n: [[79, 0.05]] } };

  // ── PARTE PURA ──
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const grado = (T, g) => T.tonica + ESCALAS[T.escala][((g % 7) + 7) % 7] + 12 * Math.floor(g / 7); // grado de la escala (0 = tónica, 7 = octava) → nota MIDI
  // «4:1 2:.5 -:1 | …» → [{ t, d, g }] (t y d en pulsos; g = grado o null si es silencio). Los «|» solo separan compases.
  function parsear(txt) {
    let t = 0; const out = [];
    txt.replace(/\|/g, ' ').trim().split(/\s+/).forEach((tok) => { const [a, b] = tok.split(':'), d = parseFloat(b); if (!(d > 0)) throw new Error('duración inválida «' + tok + '»'); if (a !== '-') out.push({ t, d, g: parseInt(a, 10) }); t += d; });
    return { notas: out, total: t };
  }
  const memo = {};
  // Plan completo de un tema: { bpm, beats, porBeat: [[evento…]×16] } con eventos { v: 'mel'|'bajo'|'perc', t, d, midi? , p? } (t en pulsos dentro del bucle).
  function eventos(nombre) {
    if (memo[nombre]) return memo[nombre];
    const T = TEMAS[nombre]; if (!T) throw new Error('tema desconocido: ' + nombre);
    const m = parsear(T.mel); if (m.total !== BEATS) throw new Error('el tema ' + nombre + ' dura ' + m.total + ' pulsos (deben ser ' + BEATS + ')');
    const ev = m.notas.map((n) => ({ v: 'mel', t: n.t, d: n.d, midi: grado(T, n.g) }));
    T.acordes.forEach((a, c) => [0, 2].forEach((p) => ev.push({ v: 'bajo', t: c * 4 + p, d: 1.8, midi: grado(T, a - 7 + (p ? 4 : 0)) }))); // raíz en el 1.º pulso y quinta en el 3.º, una octava abajo
    if (T.perc) for (let c = 0; c < 4; c++) T.perc.split('').forEach((x, i) => { if (x !== '.') ev.push({ v: 'perc', t: c * 4 + i / 2, d: 0.25, p: x }); });
    const porBeat = Array.from({ length: BEATS }, () => []); ev.forEach((e) => porBeat[Math.floor(e.t)].push(e));
    return (memo[nombre] = { bpm: T.bpm, beats: BEATS, porBeat });
  }
  // Tema que toca en una casilla: la zona de aparición que la contiene (por su elemento) o, si no hay, el del propio mapa (interiores), la región del mapa o el tema por defecto.
  function temaEn(m, tx, ty) {
    if (m && m.prof && m.tema && TEMAS[m.tema]) return m.tema; // v2.320: en las Profundidades manda el tema del bioma
    const z = m && (m.zonas || []).find((q) => tx >= q.x && tx < q.x + q.w && ty >= q.y && ty < q.y + q.h);
    if (z && TEMAS[z.elemento]) return z.elemento;
    if (m && TEMAS[m.id]) return m.id; // interiores con tema propio (por id de mapa)
    if (m && m.tema && TEMAS[m.tema]) return m.tema; // v2.186: tema compartido que pide el propio mapa (datos, no código)
    return m && m.region && TEMAS[m.region] ? m.region : 'albanota';
  }

  // ── MOTOR DE WEB AUDIO ──
  const E = { ctx: null, fallo: false, pistas: [], deseado: null, silenciado: false, oculto: false, actual: null, cand: null, t: 0, montado: false };
  try { E.silenciado = root.localStorage && root.localStorage.getItem(AJUSTES.CLAVE) === '0'; } catch (e) { /* sin almacenamiento: se arranca con sonido */ }
  const fallar = (e) => { E.fallo = true; AJUSTES.ACTIVO = false; try { if (E.ctx) E.ctx.close(); } catch (x) { /* ya cerrado */ } E.ctx = null; };
  function crear() {
    if (E.ctx || E.fallo || !AJUSTES.ACTIVO) return E.ctx;
    try {
      const AC = root.AudioContext || root.webkitAudioContext; if (!AC) { E.fallo = true; return null; }
      const c = new AC(), g = (v, a) => { const n = c.createGain(); n.gain.value = v; n.connect(a || c.destination); return n; };
      E.master = g(AJUSTES.VOLUMEN); E.mus = g(AJUSTES.MUSICA, E.master); E.mz = g(1, E.mus); E.sfx = g(AJUSTES.EFECTOS, E.master); // E.mz = bus de la música de zona: la de combate (musica_combate.js) lo baja con A.zona()
      const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = buf.getChannelData(0); let s = 12345; for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; } // ruido propio, reproducible
      E.ruido = buf; E.ctx = c; E.timer = setInterval(tick, 80);
    } catch (e) { fallar(e); }
    return E.ctx;
  }
  function tono(bus, onda, midi, t, d, vol) {
    const c = E.ctx, o = c.createOscillator(), g = c.createGain(); o.type = onda; o.frequency.value = hz(midi);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, d));
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + Math.max(0.05, d) + 0.03);
  }
  function percusion(bus, p, t, vol) {
    const c = E.ctx, g = c.createGain(); g.connect(bus);
    if (p === 'k') { const o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(vol * 2.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g); o.start(t); o.stop(t + 0.2); return; }
    const n = c.createBufferSource(), f = c.createBiquadFilter(), dur = p === 's' ? 0.13 : 0.045; n.buffer = E.ruido; f.type = p === 's' ? 'bandpass' : 'highpass'; f.frequency.value = p === 's' ? 1800 : 7000;
    g.gain.setValueAtTime(vol * (p === 's' ? 1.6 : 0.9), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(f); f.connect(g); n.start(t, 0, dur + 0.02);
  }
  function programar(p, n) { // todas las notas del pulso n (absoluto) de la pista p
    const seg = 60 / p.ev.bpm, T = TEMAS[p.nombre], b = n % BEATS, base = p.t0 + n * seg, ahora = E.ctx.currentTime;
    p.ev.porBeat[b].forEach((e) => { const t = base + (e.t - b) * seg; if (t < ahora - 0.05) return; if (e.v === 'perc') percusion(p.g, e.p, t, 0.18); else tono(p.g, e.v === 'bajo' ? 'triangle' : T.onda, e.midi, t, e.d * seg * (e.v === 'bajo' ? 0.9 : 0.95), e.v === 'bajo' ? 0.28 : T.vol * 2.2); });
  }
  function cambiar(nombre) { // funde la música actual y entra la nueva
    const c = E.ctx, t = c.currentTime, F = AJUSTES.FUNDIDO;
    E.pistas.forEach((p) => { if (p.fin) return; p.fin = true; p.tfin = t + F + 0.2; p.g.gain.cancelScheduledValues(t); p.g.gain.setValueAtTime(p.g.gain.value, t); p.g.gain.linearRampToValueAtTime(0, t + F); });
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + F); g.connect(E.mz || E.mus);
    E.pistas.push({ nombre, ev: eventos(nombre), t0: t + 0.05, n: 0, g, fin: false, tfin: 0 });
  }
  function tick() {
    try {
      const c = E.ctx; if (!c || c.state !== 'running') return;
      const viva = E.pistas.find((p) => !p.fin);
      if (E.deseado && (!viva || viva.nombre !== E.deseado)) cambiar(E.deseado);
      const hasta = c.currentTime + AJUSTES.ANTICIPO;
      E.pistas = E.pistas.filter((p) => { if (p.fin && c.currentTime > p.tfin) { try { p.g.disconnect(); } catch (x) { /* ya suelto */ } return false; } return true; });
      E.pistas.forEach((p) => { if (p.fin) return; const seg = 60 / p.ev.bpm; while (p.t0 + p.n * seg < hasta) programar(p, p.n++); });
    } catch (e) { fallar(e); }
  }
  function estado() { // el contexto solo corre si hay sonido y la pestaña está visible (ahorra batería)
    const c = E.ctx; if (!c) return; const debe = !E.silenciado && !E.oculto;
    try { if (debe && c.state === 'suspended') c.resume(); else if (!debe && c.state === 'running') c.suspend(); } catch (e) { fallar(e); }
  }
  // Desbloqueo: móviles (sobre todo iOS) solo aceptan reanudar el audio dentro de click/touchend/keydown, no de pointerdown; y el contexto puede seguir «suspended» tras el primer intento.
  // Por eso se intenta en cada gesto y solo se dejan de escuchar cuando el contexto de verdad corre. Un buffer mudo dentro del gesto termina de abrir el audio en iOS.
  function desbloquear() {
    if (!AJUSTES.ACTIVO) return false; const c = crear(); if (!c) return false;
    try { if (!E.silenciado && !E.oculto && c.state !== 'running') { c.resume(); const b = c.createBuffer(1, 1, 22050), f = c.createBufferSource(); f.buffer = b; f.connect(c.destination); f.start(0); } else estado(); } catch (e) { fallar(e); }
    return !!E.ctx && E.ctx.state === 'running';
  }

  const A = (G.audio = {
    AJUSTES, TEMAS, SFX, ESCALAS, BEATS, hz, grado, parsear, eventos, temaEn,
    get silenciado() { return E.silenciado; },
    get tema() { return E.actual; },
    get sonando() { return !!(E.ctx && E.ctx.state === 'running' && E.pistas.some((p) => !p.fin)); },
    // Se llama cada cuadro con el tema que toca. Cambia la música tras RETARDO s seguidos en otra zona (el primero entra al instante).
    seguir(nombre, dt) {
      if (!AJUSTES.ACTIVO) return;
      if (!E.actual) { E.actual = E.deseado = nombre; return; }
      if (nombre === E.actual) { E.cand = null; return; }
      if (nombre !== E.cand) { E.cand = nombre; E.t = 0; return; }
      if ((E.t += dt) >= AJUSTES.RETARDO) { E.actual = E.deseado = nombre; E.cand = null; }
    },
    // Motor para otros módulos de sonido (combate): contexto, bus de efectos, bus de música y ruido; null si no suena nada (sin audio, en silencio, pestaña oculta o contexto parado).
    motor() { const c = E.ctx; return c && c.state === 'running' && !E.silenciado && !E.oculto && E.sfx && E.ruido ? { c, bus: E.sfx, mus: E.mus, ruido: E.ruido } : null; },
    sfx(nombre) {
      const S = SFX[nombre], c = E.ctx; if (!AJUSTES.ACTIVO || !S || !c || c.state !== 'running') return;
      try { let t = c.currentTime + 0.01; S.n.forEach(([m, d]) => { tono(E.sfx, S.onda, m, t, d, S.vol); t += d * 0.9; }); } catch (e) { fallar(e); }
    },
    // Nivel (0-1) de la música de zona: 0 durante la música de combate, 1 en exploración. Fundido suave; sin contexto no hace nada.
    zona(n) { const c = E.ctx; if (!c || !E.mz) return; try { E.mz.gain.setTargetAtTime(n, c.currentTime, n ? 0.9 : 0.25); } catch (e) { /* sin ajuste */ } },
    silenciar(si) {
      E.silenciado = si === undefined ? !E.silenciado : !!si;
      try { if (root.localStorage) root.localStorage.setItem(AJUSTES.CLAVE, E.silenciado ? '0' : '1'); } catch (e) { /* sin almacenamiento */ }
      if (!E.silenciado) crear(); estado(); A.pintar();
    },
    // Botón de silencio y desbloqueo con el primer gesto. `btn` puede faltar (pruebas sin DOM).
    montar(btn) {
      E.btn = btn || null;
      if (!AJUSTES.ACTIVO) { if (btn) btn.hidden = true; return; }
      if (!E.montado && typeof root.addEventListener === 'function') { E.montado = true;
        const EV = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'], un = () => { if (desbloquear() || E.fallo || E.silenciado) quitar(); else if (E.ctx) { const r = E.ctx.resume && E.ctx.resume(); if (r && r.then) r.then(() => { if (E.ctx && E.ctx.state === 'running') quitar(); }, () => {}); } };
        const quitar = () => { if (E.silenciado && !E.fallo) return; EV.forEach((e) => root.removeEventListener(e, un, true)); };
        EV.forEach((e) => root.addEventListener(e, un, true));
        if (root.document && root.document.addEventListener) root.document.addEventListener('visibilitychange', () => { E.oculto = !!root.document.hidden; estado(); });
      }
      if (btn && btn.addEventListener) btn.addEventListener('click', () => { A.silenciar(); });
      A.pintar();
    },
    pintar() { const b = E.btn; if (!b) return; b.textContent = E.silenciado ? '🔇' : '🔊'; b.setAttribute('aria-pressed', String(!E.silenciado)); b.setAttribute('aria-label', E.silenciado ? 'Activar el sonido' : 'Silenciar el sonido'); }
  });
}(typeof window !== 'undefined' ? window : globalThis));
