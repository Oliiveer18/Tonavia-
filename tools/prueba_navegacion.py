#!/usr/bin/env python3
"""prueba_navegacion.py — prueba en Chromium móvil (390×844) de la navegación marítima FN sobre dist/criaturas.html. Necesita playwright.
Uso: node build.js && python3 tools/prueba_navegacion.py [carpeta_capturas]   (sin red: PeerJS/Three.js se sustituyen por un stub de cdnjs; la red real NO se prueba aquí)
Comprueba: colocado en el mar (no hay portal todavía: se usa la orden «colocar») sin errores · el barco avanza a 80 px/s · rumbo automático por la ruta del panel ⚓ · faro · HD-2D cae a 2D · tiempo de fotograma y memoria en el mar · clásico."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_nav'); sal.mkdir(parents=True, exist_ok=True)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
    ctx.route('**/cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body='/*stub*/')); errs = []
    def pagina(q):
        pg = ctx.new_page(); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html') + q); pg.wait_for_timeout(1200)
        bj = pg.get_by_text('Jugar con Oli')
        if bj.count() and bj.first.is_visible(): bj.first.click(); pg.wait_for_timeout(400)
        pg.evaluate("() => { const J = window.__juego; J.motor.aplicar(J.est, { j: 'oli', t: 'colocar', mapa: 'pirata/mar_1_1', ancla: 'inicio' }); J.sincronizar(); }"); pg.wait_for_timeout(600); return pg
    for nombre, q in (('2d', '?clasico=0'), ('clasico', '')):
        pg = pagina(q)
        info = pg.evaluate("() => { const J = window.__juego; return { mapa: J.mapa.id, mar: !!J.mapa.mar, me: J.S.me, nav: window.G.navegacion.navegando(J.est.jugadores[J.S.me || 'oli']) }; }")
        ok(info['mar'] and info['nav'], nombre + ': se coloca en el mar y navega (' + info['mapa'] + ')')
        x0 = pg.evaluate("() => window.__juego.est.jugadores[window.__juego.S.me || 'oli'].x"); pg.evaluate("() => { window.__juego.keys.right = 1; }"); pg.wait_for_timeout(1000); pg.evaluate("() => { window.__juego.keys.right = 0; }")
        x1 = pg.evaluate("() => window.__juego.est.jugadores[window.__juego.S.me || 'oli'].x"); ok(60 < x1 - x0 < 100, nombre + ': el barco avanza ~80 px en 1 s (%.0f)' % (x1 - x0))
        pg.screenshot(path=str(sal / ('mar_' + nombre + '.png')))
        # fotograma medio en el mar (200 fotogramas)
        ms = pg.evaluate("() => new Promise((res) => { let n = 0, t0 = performance.now(); const f = () => { if (++n >= 200) res((performance.now() - t0) / n); else requestAnimationFrame(f); }; requestAnimationFrame(f); })")
        mem = pg.evaluate("() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1"); print('      %s: %.1f ms/fotograma · memoria JS %s MB' % (nombre, ms, mem)); ok(ms < 40, nombre + ': fotograma < 40 ms en el mar')
        if nombre == '2d':
            # rumbo por el panel ⚓: se descubren las balizas por la API y se usa el botón real
            pg.evaluate("() => { const J = window.__juego, j = J.est.jugadores[J.S.me || 'oli'], N = window.G.navegacion; ['baliza_a', 'baliza_b', 'baliza_c'].forEach((i) => N.descubrir(J.est, j, i)); window.G.mundo.mapa('pirata/mar_0_0'); j.mapa = 'pirata/mar_0_0'; j.x = 24 * 16 + 8; j.y = 24 * 16 + 14; J.sincronizar(); }"); pg.wait_for_timeout(600)
            bt = pg.locator('#navpanel button'); ok(bt.count() >= 2, '2d: el panel ⚓ ofrece rutas y faros junto a la baliza (%d botones)' % bt.count()); pg.screenshot(path=str(sal / 'panel.png'))
            pg.locator('#navpanel button', has_text='Rumbo').first.click(); pg.wait_for_timeout(1500)
            ok(pg.evaluate("() => { const j = window.__juego.est.jugadores[window.__juego.S.me || 'oli']; return !!(j.nav && j.nav.rumbo); }"), '2d: el botón fija el rumbo y el barco navega solo'); pg.screenshot(path=str(sal / 'rumbo.png'))
            pg.locator('#navpanel button', has_text='Parar').first.click(); pg.wait_for_timeout(300); ok(not pg.evaluate("() => { const j = window.__juego.est.jugadores[window.__juego.S.me || 'oli']; return !!(j.nav && j.nav.rumbo); }"), '2d: «Parar rumbo» lo cancela')
            pg.evaluate("() => window.__juego.irAHD()"); pg.wait_for_timeout(300); ok(not pg.evaluate("() => window.__juego.hd"), '2d: HD-2D no se activa en el mar (cae a 2D)')
        pg.close()
    ok(not errs, 'sin errores de consola/página' + ((': ' + '; '.join(errs[:3])) if errs else ''))
    b.close()
print('FALLOS: %d' % len(fallos) if fallos else 'Todo en orden'); sys.exit(1 if fallos else 0)
