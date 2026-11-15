#!/usr/bin/env python3
"""prueba_oclusion.py — paso E1 (v2.88): el tejado y el tercio alto de los muros se atenúan con trama cuando un edificio tapa a Oli o Lali.
Uso: node build.js && python3 tools/prueba_oclusion.py
Con Three.js falso (tools/three_falso.js) prueba la LÓGICA en el juego real: cada edificio con tejado lleva dos mallas (muros y tejado), el jugador detrás de la Casa de Lali baja `uVis` a 0,3 en ~0,35 s y delante vuelve a 1;
y con WebGL de verdad (Chromium + SwiftShader) compila el trozo de shader de la trama (`G.hd2d.GLSL_TRAMA`) para asegurarse de que es GLSL válido. NO prueba cómo se ve con Three.js real: eso hay que mirarlo en el móvil."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
falso = (raiz / 'tools' / 'three_falso.js').read_text(encoding='utf8')
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html')
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'ERR_FAILED' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(body=falso, content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(200)
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=8000); pg.wait_for_timeout(500)
    # 1 · estructura: dos mallas por edificio con tejado, una sola por la fuente
    r = pg.evaluate("""() => { const M = __juego.est.mapas[__juego.est.jugadores.oli.mapa] || null; const esc = window.__falso.escena, ms = []; (function rec(o) { (o.children || []).forEach((c) => { if (c.material && c.material.onBeforeCompile && !(c.material.customProgramCacheKey && c.material.customProgramCacheKey() === 'trama_arboles')) ms.push(c); rec(c); }); })(esc); return { n: ms.length }; }""")
    ok(r['n'] == 12, 'los 6 edificios con tejado llevan 2 mallas con shader de trama (12 en total): %s' % r['n'])
    # 2 · el shader parchea bien (con un «shader» de mentira que lleva los puntos de enganche de Three.js r128)
    r = pg.evaluate("""() => { const esc = window.__falso.escena, ms = []; (function rec(o) { (o.children || []).forEach((c) => { if (c.material && c.material.onBeforeCompile && !(c.material.customProgramCacheKey && c.material.customProgramCacheKey() === 'trama_arboles')) ms.push(c); rec(c); }); })(esc);
      const sh = { uniforms: {}, vertexShader: '#include <common>\\n#include <begin_vertex>', fragmentShader: '#include <common>\\n#include <alphatest_fragment>' }; ms[0].material.onBeforeCompile(sh);
      return { u: Object.keys(sh.uniforms).sort(), v: sh.vertexShader, f: sh.fragmentShader, clave: ms[0].material.customProgramCacheKey() }; }""")
    ok(r['u'] == ['uBloque', 'uCorte', 'uVis'] and 'varying float vAltura' in r['v'] and 'vAltura = position.y' in r['v'] and 'discard' in r['f'] and 'uniform float uVis' in r['f'] and r['f'].index('alphatest_fragment') < r['f'].index('discard'), 'el parche del shader añade 3 uniformes, la altura local y el descarte con trama tras el alphaTest')
    # 3 · shader de verdad: compila en WebGL
    r = pg.evaluate("""() => { const c = document.createElement('canvas'), gl = c.getContext('webgl'); if (!gl) return { sinGL: true };
      const f = 'precision mediump float;\\nvarying float vAltura;\\nuniform float uVis;\\nuniform float uCorte;\\nuniform float uBloque;\\nvoid main() {\\n vec4 diffuseColor = vec4(1.0);\\n' + G.hd2d.GLSL_TRAMA + '\\n gl_FragColor = diffuseColor;\\n}';
      const s = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(s, f); gl.compileShader(s); return { ok: gl.getShaderParameter(s, gl.COMPILE_STATUS), log: gl.getShaderInfoLog(s) }; }""")
    ok(r.get('sinGL') or r.get('ok') is True, 'el trozo de shader de la trama compila en WebGL%s' % ('' if r.get('ok') else ' (sin WebGL aquí: no se pudo comprobar)') + ((' · ' + r['log']) if r.get('log') else ''))
    # 4 · oclusión en vivo: detrás de la Casa de Lali baja, delante vuelve
    pos = pg.evaluate("""() => { const o = G.hd2d.plan(G.mundo.mapa('albanota')).objetos.find((q) => q.tipo === 'casa_lali'), d = G.OBJETOS.casa_lali, g = G.volumenes.geometria(d.huella, d.vol), R = g.rect; return { det: [(o.x + R.x0 + R.w / 2) * 16, (o.z + R.z0 - 1.3) * 16], del: [(o.x + R.x0 + R.w / 2) * 16, (o.z + R.z1 + 1.6) * 16] }; }""")
    vis = lambda: pg.evaluate("""() => { const ms = []; (function rec(o) { (o.children || []).forEach((c) => { if (c.material && c.material.onBeforeCompile && !(c.material.customProgramCacheKey && c.material.customProgramCacheKey() === 'trama_arboles')) ms.push(c); rec(c); }); })(window.__falso.escena); const r = ms.map((m) => { const sh = { uniforms: {}, vertexShader: '', fragmentShader: '' }; m.material.onBeforeCompile(sh); return sh.uniforms.uVis ? Math.round(sh.uniforms.uVis.value * 100) / 100 : null; }).filter((v) => v !== null); return r; }""")
    pg.evaluate("() => { __juego.est.sinAparicion = true; Object.values(__juego.est.mapas).forEach((m) => { m.criaturas.length = 0; }); }") # sin criaturas: solo cuenta quien juega
    def ir(xy):
        pg.evaluate('([x, y]) => { const j = __juego.est.jugadores.oli; j.x = x; j.y = y; }', xy); pg.wait_for_timeout(120)
    ir(pos['del']); pg.wait_for_timeout(900); v0 = vis()
    ok(all(x == 1 for x in v0), 'delante de la casa, todo se ve entero: %s' % v0)
    ir(pos['det']); pg.wait_for_timeout(150); v1 = vis()
    ok(any(0.3 < x < 1 for x in v1), 'a mitad de transición el tejado está entre 0,3 y 1: %s' % v1)
    pg.wait_for_timeout(900); v2 = vis()
    ok(sum(1 for x in v2 if x == 0.3) == 2 and sum(1 for x in v2 if x == 1) == len(v2) - 2, 'detrás de la casa solo se atenúan sus dos mallas (muros y tejado) y las demás siguen enteras: %s' % v2)
    ir(pos['del']); pg.wait_for_timeout(1200); v3 = vis()
    ok(all(x == 1 for x in v3), 'al volver delante, vuelve a verse entero: %s' % v3)
    # 5 · interruptor de emergencia
    pg.evaluate('G.hd2d.AJUSTES.OCLUSION = false'); ir(pos['det']); pg.wait_for_timeout(1000); v4 = vis()
    ok(all(x == 1 for x in v4), 'con AJUSTES.OCLUSION = false nada se atenúa')
    pg.evaluate('G.hd2d.AJUSTES.OCLUSION = true')
    ok(not errs, 'sin errores de consola: %s' % errs[:3])
    b.close()
print('\nTODO BIEN' if not fallos else '\n%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
