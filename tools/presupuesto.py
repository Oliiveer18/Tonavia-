#!/usr/bin/env python3
"""Presupuestos del juego (paso 1.5): peso, arranque, memoria y caché de sprites, medidos con una MUESTRA SIMULADA de 410 formas.
Uso: python3 tools/presupuesto.py [--rapido]      (necesita playwright + Chromium; desde la carpeta del proyecto; antes: node build.js)
MUESTRA SIMULADA (siempre se indica): las 20 líneas reales (41 formas) clonadas 10 veces = 200 líneas / 410 formas, con ids nuevos (id__k) que reutilizan el mismo dibujo.
  Para que pese y se parsee como un juego real de 410 formas, el HTML de la muestra lleva además 9 copias del código de dibujo y del registro dentro de funciones que nunca se llaman.
  En el mapa solo salen las 20 criaturas reales (el máximo activo del 1.3 será 24).
PRESUPUESTO (fijado en el paso 1.5): dist ≤ 3 MB con 410 formas · caché de sprites ≤ 300 · arranque con la muestra ≤ 1 s con la CPU 4× más lenta · ningún sprite de la galería sin dibujar · sin errores de consola."""
import sys, os, json, re, gzip, time, statistics
from playwright.sync_api import sync_playwright
root = os.getcwd(); RAPIDO = '--rapido' in sys.argv; N = 3 if RAPIDO else 7
rd = lambda f: open(os.path.join(root, f), encoding='utf8').read()
orden = json.loads(rd('src/orden.json')); archivos = orden['datos'] + orden['juego']
dist_real = os.path.join(root, 'dist/criaturas.html')
assert os.path.exists(dist_real), 'falta dist/criaturas.html (ejecuta node build.js)'
MB = 1024 * 1024
# ---------- 1) peso real y extrapolado ----------
tam = {f: len(rd(f).encode('utf8')) for f in archivos}; html = rd('index.html')
dibujo = sum(v for f, v in tam.items() if re.search(r'formas_(?!base)', f)); registro = tam['src/lineas.js']; real = os.path.getsize(dist_real)
fijo = real - dibujo - registro; extra = fijo + dibujo * 410 / 41 + registro * 200 / 20
print('PESO\n  dist real (41 formas, 20 líneas): %d bytes (gzip %d)\n  dibujos: %d bytes (%.1f KB por forma) · registro: %d bytes (%.2f KB por línea) · resto: %d bytes' % (real, len(gzip.compress(open(dist_real, 'rb').read())), dibujo, dibujo / 41 / 1024, registro, registro / 20 / 1024, fijo))
print('  extrapolado a 410 formas / 200 líneas: %.2f MB (presupuesto 3 MB) -> %s' % (extra / MB, 'DENTRO' if extra <= 3 * MB else 'FUERA'))
# ---------- 2) muestra simulada de 410 formas ----------
A = """;(function () { const G = window.G, base = G.LINEAS.slice(); for (let k = 1; k < 10; k++) base.forEach((L) => { const c = JSON.parse(JSON.stringify(L)); c.n = L.n + 20 * k; c.fam = L.fam + '__' + k; c.formas.forEach((f, i) => { f.id = f.id + '__' + k; }); G.LINEAS.push(c); }); })();"""
B = ""  # (v2.17: ya no hay G.SPAWN; la aparición sale de las zonas de maps/)
C = """;(function () { const G = window.G; G.LINEAS.slice(20).forEach((L) => L.formas.forEach((f) => { const o = G.CREATURES[f.id.replace(/__\\d+$/, '')]; G.defCreature(f.id, { draw: o.draw, native: o.native }); })); })();"""
parts = []; src = lambda f: rd(f)
for f in orden['datos']:
    parts.append(src(f))
    if f == 'src/lineas.js': parts.append(A)
    if f == 'src/creatures.js': parts.append(B)
parts.append(C)
relleno = [src(f) for f in orden['datos'] if f == 'src/lineas.js' or re.search(r'formas_(?!base)', f)]
for k in range(1, 10): parts.append('window.__relleno%d = function () {\n%s\n};' % (k, '\n'.join(relleno)))
import glob
mapas = {}
for f in sorted(glob.glob(os.path.join(root, 'maps', '*.json'))):
    j = json.load(open(f, encoding='utf8')); mapas[j['id']] = j
parts.append('window.G.MAPAS = ' + json.dumps(mapas) + ';')
parts += [src(f) for f in orden['juego']]
sim_html = html.replace('<!--SRC-->', '<script>\n' + '\n'.join(parts) + '\n</script>')
sim = '/tmp/criaturas_muestra410.html'; open(sim, 'w', encoding='utf8').write(sim_html)
print('  muestra simulada 410 formas (medida de verdad): %d bytes = %.2f MB (gzip %.2f MB) -> %s' % (len(sim_html.encode('utf8')), len(sim_html.encode('utf8')) / MB, len(gzip.compress(sim_html.encode('utf8'))) / MB, 'DENTRO' if len(sim_html.encode('utf8')) <= 3 * MB else 'FUERA'))
# ---------- 3) navegador ----------
def nuevo(b, lento=1):
    ctx = b.new_context(viewport={'width': 390, 'height': 780}, device_scale_factor=2, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    cdp = ctx.new_cdp_session(pg)
    if lento > 1: cdp.send('Emulation.setCPUThrottlingRate', {'rate': lento})
    return ctx, pg, cdp, errs
def heap(cdp):
    cdp.send('HeapProfiler.collectGarbage'); cdp.send('Performance.enable'); m = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}; return m['JSHeapUsedSize'] / MB
def arranque(b, ruta, lento):
    ts = []
    for _ in range(N):
        ctx, pg, cdp, errs = nuevo(b, lento); pg.goto('file://' + ruta, wait_until='load')
        ts.append(pg.evaluate("(() => { const n = performance.getEntriesByType('navigation')[0]; return n.domContentLoadedEventEnd - n.responseEnd; })()")); ctx.close()
    return statistics.median(ts), min(ts), max(ts)
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--js-flags=--expose-gc'])
    print('\nARRANQUE (hasta que el menú está listo; mediana de %d cargas; min-max)' % N)
    for nombre, ruta in [('real 41 formas', dist_real), ('muestra 410 formas', sim)]:
        for lento, etq in [(1, 'este equipo'), (4, 'CPU 4× más lenta (móvil medio)')]:
            m, lo, hi = arranque(b, ruta, lento); res[(nombre, lento)] = m; print('  %-20s %-32s %6.0f ms  (%0.f-%0.f)' % (nombre, etq, m, lo, hi))
    print('\nMEMORIA Y SPRITES EN CACHÉ (límite %s)' % '300')
    for nombre, ruta in [('real 41 formas', dist_real), ('muestra 410 formas', sim)]:
        ctx, pg, cdp, errs = nuevo(b); pg.goto('file://' + ruta); pg.wait_for_timeout(400)
        st0 = pg.evaluate('G.spriteStats()'); h0 = heap(cdp)
        pg.tap('[data-pick=oli]'); pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(2500); pg.keyboard.up('ArrowRight'); pg.keyboard.down('ArrowDown'); pg.wait_for_timeout(2500); pg.keyboard.up('ArrowDown'); pg.keyboard.press('e'); pg.wait_for_timeout(500)
        st1 = pg.evaluate('G.spriteStats()'); fps = pg.evaluate("new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); })")
        print('  %-20s tras cargar: %3d sprites (%4.0f KB) · heap JS %.1f MB | partida típica (andar 5 s): %3d sprites (%4.0f KB), %.0f fps' % (nombre, st0['size'], st0['bytes'] / 1024, h0, st1['size'], st1['bytes'] / 1024, fps))
        ok_errs = errs[:]
        if nombre.startswith('muestra'):
            # galería abierta de arriba abajo con la muestra de 410 formas: con el límite normal y sin límite
            for lim, etq in [(300, 'límite 300'), (10 ** 9, 'sin límite')]:
                pg.evaluate('G.spriteCacheClear(); G.SPRITE_LIMIT = %d' % lim)
                pg.evaluate("document.getElementById('menu').hidden = true"); pg.tap('#gbtn'); pg.wait_for_timeout(300)
                pg.evaluate("document.getElementById('gal-clear').click()")
                tarjetas = 0; vacias = 0
                for pagina in range(10):
                    alto = pg.evaluate("document.getElementById('gal-list').scrollHeight"); y = 0
                    while y < alto:
                        pg.evaluate('document.getElementById("gal-list").scrollTop = %d' % y); pg.wait_for_timeout(40); y += 330
                    pg.evaluate('document.getElementById("gal-list").scrollTop = 1e6'); pg.wait_for_timeout(120)
                    vacias += pg.evaluate("[...document.querySelectorAll('#gal-list canvas')].filter(c => c.width === 0).length"); tarjetas += pg.locator('#gal-list .card').count()
                    if pagina < 9: pg.tap('#gp-next'); pg.wait_for_timeout(80)
                st = pg.evaluate('G.spriteStats()'); hh = heap(cdp)
                print('  galería de arriba abajo, 10 páginas, %-11s: %d tarjetas vistas, %d sin dibujar | en caché %3d (pico %3d, %4.0f KB), %d dibujados (los de la galería y los del mapa de fondo), %d descartados, %d aciertos | heap JS %.1f MB' % (etq, tarjetas, vacias, st['size'], st['peak'], st['bytes'] / 1024, st['misses'], st['evictions'], st['hits'], hh))
                res[('gal', lim)] = (st, vacias, tarjetas)
                pg.evaluate("document.getElementById('gal-close').click()")
            pg.evaluate('G.SPRITE_LIMIT = 300')
        res[('errs', nombre)] = ok_errs + errs; ctx.close()
    # estrés: el juego con el límite en 1 (todo se descarta a cada paso) no debe fallar
    ctx, pg, cdp, errs = nuevo(b); pg.goto('file://' + dist_real); pg.evaluate('G.SPRITE_LIMIT = 1'); pg.tap('[data-pick=oli]'); pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(3000); pg.keyboard.up('ArrowRight'); pg.keyboard.press('e'); pg.wait_for_timeout(300)
    fps1 = pg.evaluate("new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); })")
    print('\nESTRÉS: juego real con la caché en 1 sprite (se redibuja todo a cada fotograma): %.0f fps, %d descartes, errores: %s' % (fps1, pg.evaluate('G.spriteStats().evictions'), errs or 'ninguno')); res[('errs', 'estres')] = errs; ctx.close(); b.close()
malos = [k for k, v in res.items() if k[0] == 'errs' and v]
g300 = res[('gal', 300)]; gsl = res[('gal', 10 ** 9)]
print('\nVEREDICTO')
print('  peso con 410 formas: %.2f MB medido en la muestra, %.2f MB extrapolado (máx. 3 MB): %s' % (len(sim_html.encode('utf8')) / MB, extra / MB, 'OK' if len(sim_html.encode('utf8')) <= 3 * MB and extra <= 3 * MB else 'FUERA'))
print('  caché: con límite 300 nunca pasa de %d sprites (%.0f KB) frente a %d (%.0f KB) sin límite en la misma galería: %s' % (g300[0]['peak'], g300[0]['bytes'] / 1024, gsl[0]['peak'], gsl[0]['bytes'] / 1024, 'OK' if g300[0]['peak'] <= 300 else 'FUERA'))
print('  galería: %d de %d tarjetas se quedaron sin dibujar con el límite: %s' % (g300[1], g300[2], 'OK' if g300[1] == 0 else 'FALLA'))
arr = res[('muestra 410 formas', 4)]
print('  arranque con la muestra de 410 formas y CPU 4× más lenta: %.0f ms (máx. 1000 ms): %s' % (arr, 'OK' if arr <= 1000 else 'FUERA'))
print('  errores de consola: %s' % ('ninguno' if not malos else malos))
sys.exit(1 if arr > 1000 or malos or g300[1] or g300[0]['peak'] > 300 or len(sim_html.encode('utf8')) > 3 * MB else 0)
