#!/usr/bin/env python3
"""demo_musica_combate.py — renderiza FUERA DE LÍNEA (OfflineAudioContext en Chromium) la música de tensión del combate (v2.305): el golpe de entrada y los 4 niveles de intensidad (8 compases cada uno) a un WAV estéreo, y mide pico, RMS, NaN y recorte.
Uso: node build.js && python3 tools/demo_musica_combate.py [salida.wav]"""
import base64, pathlib, sys, wave
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; sal = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/musica_combate_demo.wav')
JS = """async () => {
  const SR = 44100, M = G.musicaC, seg = 60 / M.AJ.BPM / 4, dur = 128 * seg, total = 1.5 + 4 * (dur + 0.6), c = new OfflineAudioContext(2, Math.ceil(SR * total), SR);
  const b = c.createBuffer(1, SR, SR), d = b.getChannelData(0); let s = 12345; for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
  const mus = c.createGain(); mus.connect(c.destination); const m = { c, bus: c.destination, ruido: b, mus };
  M.cadena(m); M.estado.g.gain.value = 1; M.entrada(m, 0.1); const marcas = [['entrada', 0.1, 1.4]];
  for (let L = 0; L < 4; L++) { const t0 = 1.5 + L * (dur + 0.6); M.programar(m, 0, 128, L, t0); marcas.push(['nivel ' + L, t0, t0 + dur]); }
  const r = await c.startRendering(), Lc = r.getChannelData(0), R = r.getChannelData(1), out = new Int16Array(Lc.length * 2); let pico = 0, nan = 0, rec = 0;
  for (let i = 0; i < Lc.length; i++) for (const [k, x] of [[0, Lc[i]], [1, R[i]]]) { if (!isFinite(x)) { nan++; continue; } const a = Math.abs(x); if (a > pico) pico = a; if (a > 1) rec++; out[i * 2 + k] = Math.max(-1, Math.min(1, x)) * 32767; }
  const seg2 = marcas.map(([n, a, z]) => { let p = 0, q = 0, N = 0; for (let j = Math.floor(a * SR); j < Math.min(Lc.length, Math.floor(z * SR)); j++) { const x = Math.abs(Lc[j]); if (x > p) p = x; q += x * x; N++; } return [n, p, Math.sqrt(q / Math.max(1, N))]; });
  let bin = ''; const u8 = new Uint8Array(out.buffer); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return { b64: btoa(bin), SR, pico, nan, rec, seg: seg2, total };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_function('window.G && window.G.musicaC'); r = pg.evaluate(JS); b.close()
w = wave.open(str(sal), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(r['SR']); w.writeframes(base64.b64decode(r['b64'])); w.close()
print('WAV', sal, round(sal.stat().st_size / 1e6, 1), 'MB · %.0f s · pico %.2f · NaN %d · muestras fuera de rango %d · errores de página %s' % (r['total'], r['pico'], r['nan'], r['rec'], errs or 'ninguno'))
for n, pk, rms in r['seg']: print('  %-9s pico %.3f  rms %.4f' % (n, pk, rms))
