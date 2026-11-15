#!/usr/bin/env python3
"""medir_personajes3d.py — Oli y Lali 3D con Three.js REAL (v2.131, Lali 3D paso 5): capturas desde los 4 giros (quieto) y andando, coste de recalcular un cuadro con la CPU 4x mas lenta, y fotogramas con los dos personajes 3D frente a las dos laminas.
Uso: node build.js && npm install three@0.128.0 && python3 tools/medir_personajes3d.py node_modules/three/build/three.min.js [carpeta_salida]   (necesita playwright)
Limite: en un Chromium sin GPU (SwiftShader) los fotogramas salen lentos con o sin 3D: sirven para comparar entre si, no son cifras de un movil. El limitador de CPU 4x se activa solo durante la medida del calculo porque el juego, al ir lento, vuelve solo al 2D."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
THREE = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else '/tmp/medir_personajes3d'); OUT.mkdir(parents=True, exist_ok=True); URL = 'file://' + str(pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'criaturas.html')
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(path=str(THREE), content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300); pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(400); pg.keyboard.up('ArrowRight'); pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(1500)
    pg.click('#hcam [data-hc=zoom]'); pg.click('#hcam [data-hc=zoom]') if pg.evaluate('G.hd2d.estado().vista.distT') > 20 else None; pg.wait_for_timeout(600)
    res['zoom'] = pg.evaluate('G.hd2d.estado().vista.distT')
    st = pg.evaluate('G.hd2d.estado()'); res['llamadas'] = st['llamadas']; res['triangulos'] = st['triangulos']; res['p3d'] = st['st'].get('personaje3d')
    for i, ang in enumerate((0, 90, 180, 270)):
        if i: pg.click('#hcam [data-hc=der]'); pg.click('#hcam [data-hc=der]'); pg.wait_for_timeout(1100)
        pg.screenshot(path=str(OUT / ('quieto_%d.png' % ang)))
    pg.click('#hcam [data-hc=der]'); pg.click('#hcam [data-hc=der]'); pg.wait_for_timeout(1100)
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(260); pg.screenshot(path=str(OUT / 'andando_este.png')); pg.keyboard.up('ArrowRight')
    pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(260); pg.screenshot(path=str(OUT / 'andando_norte.png')); pg.keyboard.up('ArrowUp')
    # presupuesto: coste de recalcular un cuadro de cada personaje (pose + geometría) con la CPU 4x más lenta
    cdp = ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    res['ms_cuadro_4x'] = pg.evaluate("""() => { const P = G.personaje3d, r = {}; for (const k of ['rex', 'luna']) { const d = P.de(k), N = 3000, t0 = performance.now(); for (let i = 0; i < N; i++) d.geometria(P.pose(i * 0.016, true, 'right', i * 0.01)); r[k] = (performance.now() - t0) / N; } return r; }"""); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1}); pg.wait_for_timeout(1500)
    # fotogramas: con los dos personajes 3D y con las dos láminas, 4x más lento
    def fotogramas():
        return pg.evaluate("""() => new Promise((ok) => { const d = []; let a = performance.now(); const f = (t) => { d.push(t - a); a = t; if (d.length < 150) requestAnimationFrame(f); else ok(d.slice(5)); }; requestAnimationFrame(f); })""")
    def resumen(d): d = sorted(d); m = sum(d) / len(d); return {'media_ms': round(m, 2), 'p95_ms': round(d[int(len(d) * .95)], 2), 'perdidos_%': round(100 * sum(1 for x in d if x > 1.5 * 16.7) / len(d), 1)}
    res['fps_3d_sin_throttle'] = resumen(fotogramas())
    pg.evaluate('G.hd2d.AJUSTES.PERSONAJES3D = false; G.hd2d.AJUSTES.PERSONAJES3D_LALI = false'); pg.wait_for_timeout(800)
    res['llamadas_laminas'] = pg.evaluate('G.hd2d.estado().llamadas'); res['fps_laminas_sin_throttle'] = resumen(fotogramas())
    pg.evaluate('G.hd2d.AJUSTES.PERSONAJES3D = true; G.hd2d.AJUSTES.PERSONAJES3D_LALI = true'); pg.wait_for_timeout(800)
    res['llamadas_3d_otra_vez'] = pg.evaluate('(G.hd2d.estado() || {}).llamadas'); res['errores'] = errs; res['hd_activo_al_final'] = pg.evaluate('G.hd2d.activo')
    b.close()
print(json.dumps(res, indent=1))
