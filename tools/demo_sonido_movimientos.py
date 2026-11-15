#!/usr/bin/env python3
"""demo_sonido_movimientos.py — renderiza fuera de línea (OfflineAudioContext) los 56 movimientos (carga→lanzamiento→impacto) + estados/acciones con G.sonidoC.evento y analiza pico/NaN.
Uso: node build.js && python3 tools/demo_sonido_movimientos.py [salida.wav]"""
import base64, pathlib, struct, sys, wave
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; sal = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/sonido_movs.wav')
JS = """async () => {
  const SR = 44100, MV = Object.values(G.COMBATE_DATOS.MOV), ES = Object.keys(G.COMBATE_DATOS.ESTADOS || {quemado:1,mojado:1,enredado:1,aturdido:1,ralentizado:1,maldito:1,miedo:1,empujado:1,ciego:1,debil:1});
  const total = MV.length * 1.7 + ES.length * 0.6 + 4, c = new OfflineAudioContext(2, Math.ceil(SR * total), SR);
  const b = c.createBuffer(1, SR, SR), d = b.getChannelData(0); let s = 12345; for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
  let T = 0; const cp = new Proxy(c, { get: (o, k) => k === 'currentTime' ? T : (typeof o[k] === 'function' ? o[k].bind(o) : o[k]) });
  const m = { c: cp, bus: c.destination, ruido: b, mus: c.createGain() }, U = { a: { id: 'a', side: 0 }, b: { id: 'b', side: 1 } }, v = { fin: null };
  const ev = (t, e) => { T = t; G.sonidoC.evento(m, Object.assign({ id: 'a' }, e), U, v); };
  MV.forEach((mv, i) => { const t = 0.2 + i * 1.7;
    ev(t, { e: 'inicio', mov: mv.id });
    if (mv.hueco === 'd') ev(t + 0.5, { e: 'defensa', mov: mv.id, tag: mv.tag }); else if (mv.hueco === 'a' && mv.forma !== 'enemigo') ev(t + 0.5, { e: 'apoyo', mov: mv.id, el: mv.el, tag: mv.tag });
    else { ev(t + 0.5, { e: 'efecto', mov: mv.id, forma: mv.forma, el: mv.el, dt: 4 }); ev(t + 0.9, { e: 'golpe', mov: mv.id, id: 'b', d: 30, mx: 100 }); } });
  const t0 = 0.2 + MV.length * 1.7; ES.forEach((k, i) => ev(t0 + i * 0.6, { e: 'estado', id: 'b', est: k, on: 1 }));
  const r = await c.startRendering(), L = r.getChannelData(0), R = r.getChannelData(1), out = new Int16Array(L.length * 2); let pico = 0, nan = 0;
  for (let i = 0; i < L.length; i++) for (const [k, x] of [[0, L[i]], [1, R[i]]]) { if (!isFinite(x)) { nan++; continue; } pico = Math.max(pico, Math.abs(x)); out[i * 2 + k] = Math.max(-1, Math.min(1, x)) * 32767; }
  let bin = ''; const u8 = new Uint8Array(out.buffer); for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  return { pcm: btoa(bin), pico, nan, n: MV.length, seg: total };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_timeout(1500)
    r = pg.evaluate(JS); b.close()
pcm = base64.b64decode(r['pcm'])
with wave.open(str(sal), 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(44100); w.writeframes(pcm)
print('movs', r['n'], 'pico %.2f' % r['pico'], 'NaN', r['nan'], 'errores', errs, sal)
