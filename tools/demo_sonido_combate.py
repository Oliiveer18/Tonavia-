#!/usr/bin/env python3
"""demo_sonido_combate.py — renderiza FUERA DE LÍNEA (OfflineAudioContext en Chromium) todos los sonidos del combate (v2.301) a un WAV estéreo y los analiza (pico, RMS, NaN, recorte).
Uso: node build.js && python3 tools/demo_sonido_combate.py [salida.wav]"""
import base64, pathlib, struct, sys, wave
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; sal = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/sonido_combate_demo.wav')
JS = """async () => {
  const SR = 44100, EL = G.sonidoC.ELEMENTOS.filter((e) => e !== 'neutro'), MISC = ['defensa', 'apoyo', 'cura', 'esquiva', 'quemadura', 'ko', 'listo', 'reaccion', 'victoria', 'derrota'];
  const total = EL.length * 3.6 + MISC.length * 1.4 + 1, c = new OfflineAudioContext(2, Math.ceil(SR * total), SR);
  const b = c.createBuffer(1, SR, SR), d = b.getChannelData(0); let s = 12345; for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
  const m = { c, bus: c.destination, ruido: b, mus: c.createGain() }, marcas = []; let t = 0.2;
  EL.forEach((el) => { marcas.push([el, t]); G.sonidoC.tocar(m, 'carga', el, t, { g: 1.5, pan: -0.35 }); G.sonidoC.tocar(m, 'lanzar', el, t + 0.8, { g: 1.1, pan: -0.35, dur: 0.4 }); G.sonidoC.tocar(m, 'impacto', el, t + 1.3, { g: 1.1, pan: 0.35 }); G.sonidoC.tocar(m, 'impacto', el, t + 2.4, { g: 1.5, pan: 0.35, crit: 1 }); t += 3.6; });
  MISC.forEach((k) => { marcas.push([k, t]); G.sonidoC.tocar(m, k, 'fuego', t, { pan: 0.2 }); t += 1.4; });
  const r = await c.startRendering(), L = r.getChannelData(0), R = r.getChannelData(1), out = new Int16Array(L.length * 2); let pico = 0, nan = 0, rec = 0;
  for (let i = 0; i < L.length; i++) { for (const [k, x] of [[0, L[i]], [1, R[i]]]) { if (!isFinite(x)) { nan++; continue; } const a = Math.abs(x); if (a > pico) pico = a; if (a > 1) rec++; out[i * 2 + k] = Math.max(-1, Math.min(1, x)) * 32767; } }
  const seg = marcas.map(([n, t0], i) => { const a = Math.floor(t0 * SR), z = Math.min(L.length, Math.floor((marcas[i + 1] ? marcas[i + 1][1] : total) * SR)); let p = 0, q = 0; for (let j = a; j < z; j++) { const x = Math.abs(L[j]); if (x > p) p = x; q += L[j] * L[j]; } return [n, +p.toFixed(3), +Math.sqrt(q / Math.max(1, z - a)).toFixed(4)]; });
  let bin = ''; const u8 = new Uint8Array(out.buffer); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return { b64: btoa(bin), SR, pico, nan, rec, seg };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_function('window.G && window.G.sonidoC'); r = pg.evaluate(JS); b.close()
w = wave.open(str(sal), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(r['SR']); w.writeframes(base64.b64decode(r['b64'])); w.close()
print('WAV', sal, round(sal.stat().st_size / 1e6, 1), 'MB · pico %.2f · NaN %d · muestras fuera de rango %d · errores de página %s' % (r['pico'], r['nan'], r['rec'], errs or 'ninguno'))
for n, pk, rms in r['seg']: print('  %-10s pico %.3f  rms %.4f' % (n, pk, rms))
