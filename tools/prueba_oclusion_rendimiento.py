#!/usr/bin/env python3
"""prueba_oclusion_rendimiento.py — paso E2 (v2.89): coste de la oclusión con los 6 edificios y 24 criaturas, con la CPU 4× más lenta.
Uso: node build.js && python3 tools/prueba_oclusion_rendimiento.py
Con Three falso: mide solo el trabajo de JavaScript del pintor (ocluir + dibujar), no la GPU. Presupuesto: oclusión ≤ 1,5 ms por cuadro con CPU 4× más lenta; +1 llamada de dibujo por edificio (≤ +12)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
falso = (raiz / 'tools' / 'three_falso.js').read_text(encoding='utf8')
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html'); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(body=falso, content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=8000); pg.wait_for_timeout(500)
    cdp = ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    r = pg.evaluate("""() => { const H = G.hd2d, M = G.mundo.mapa('albanota'), eds = H.plan(M).objetos.filter((o) => o.modo === 'volumen').map((o) => { const d = G.OBJETOS[o.tipo]; return { geo: G.volumenes.geometria(d.huella, d.vol), x: o.x, y: o.y, z: o.z }; }).filter((e) => G.volumenes.tieneTecho(e.geo));
      const cam = [20, 12, 30], pts = []; for (let i = 0; i < 26; i++) pts.push({ x: 4 + (i * 1.7) % 40, y: 0, z: 6 + (i * 2.3) % 24 });
      const t0 = performance.now(); const N = 300; let tapados = 0; for (let k = 0; k < N; k++) eds.forEach((e) => { if (H.tapado(e, [cam[0] + (k % 7), cam[1], cam[2]], pts)) tapados++; }); const ms = (performance.now() - t0) / N;
      return { edificios: eds.length, ms, tapados }; }""")
    ok(r['edificios'] == 6, 'edificios con oclusión: %d' % r['edificios'])
    ok(r['ms'] <= 1.5, 'oclusión: %.3f ms por cuadro (6 edificios × 26 criaturas/jugadores, CPU 4× más lenta; presupuesto 1,5 ms)' % r['ms'])
    r2 = pg.evaluate("""() => { const t = []; for (let i = 0; i < 120; i++) { const a = performance.now(); G.hd2d.dibujar(); t.push(performance.now() - a); } t.sort((x, y) => x - y); return { med: t[60], p95: t[114], reg: window.__falso.renders }; }""")
    print('  dibujar() con CPU 4× más lenta: mediana %.2f ms · p95 %.2f ms (Three falso: sin GPU)' % (r2['med'], r2['p95']))
    ok(r2['p95'] < 16, 'dibujar() completo (JS) p95 < 16 ms con CPU 4× más lenta')
    ok(not errs, 'sin errores: %s' % errs[:2]); b.close()
print('\nTODO BIEN' if not fallos else '\n%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
