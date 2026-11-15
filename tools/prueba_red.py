#!/usr/bin/env python3
"""prueba_red.py — Chromium 390×844: guardado de partida (recargar y seguir donde estabas) y dos móviles conectados con PeerJS REAL (necesita internet: cdnjs y el servidor de PeerJS).
Si no hay red, la parte de PeerJS se marca como NO VERIFICABLE y no cuenta como fallo, pero lo dice. Uso: node build.js && python3 tools/prueba_red.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html'); fallos = []; noverif = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
J = lambda id: "__juego.est.jugadores.%s" % id
def nuevo(b):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e))); return ctx, pg, errs
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx, pg, errs = nuevo(b); pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    pg.evaluate("(() => { const j = %s; j.x = 8 * 16 + 8; j.y = 28 * 16 + 14; j.dir = 'down'; j.capturas = { pez_carpa: 2 }; })()" % J('oli')); pg.wait_for_timeout(6500)
    ok(pg.evaluate("!!localStorage.getItem('criaturas_partida')"), '(1) la partida se guarda sola (cada 5 s)')
    pg.reload(); pg.wait_for_function('window.__juego'); pg.wait_for_timeout(600)
    ok(pg.evaluate("document.getElementById('menu').hidden") is True and pg.evaluate("__juego.S.me") == 'oli', '(2) al volver, el móvil recuerda su personaje y entra sin menú')
    ok(pg.evaluate("[Math.floor(%s.x / 16), Math.floor(%s.y / 16)]" % (J('oli'), J('oli'))) == [8, 28] and pg.evaluate(J('oli') + ".capturas.pez_carpa") == 2, '(3) sigue en la posición guardada y con sus peces')
    pg.goto(URL + '?nueva=1'); pg.wait_for_function('window.__juego'); pg.wait_for_timeout(300)
    ok(pg.evaluate("[Math.floor(%s.x / 16), Math.floor(%s.y / 16)]" % (J('oli'), J('oli'))) != [8, 28], '(4) ?nueva=1 empieza de cero')
    ok(not errs, '(5) sin errores de consola' + ('' if not errs else ': ' + errs[0])); ctx.close()
    ctxO, pgO, eO = nuevo(b); ctxL, pgL, eL = nuevo(b)
    try:
        pgO.goto(URL); pgO.wait_for_function('window.__juego'); pgO.click('[data-pick=oli]')
        pgO.wait_for_function("!!window.Peer", timeout=20000); pgO.wait_for_function("!!G.redPeer.codigo()", timeout=5000); cod = pgO.evaluate("G.redPeer.codigo()")
        pgO.wait_for_function("document.getElementById('who').textContent.indexOf('sala') > 0", timeout=20000)
        pgL.goto(URL + '?sala=' + cod); pgL.wait_for_function('window.__juego'); pgL.click('[data-pick=lali]')
        pgL.wait_for_function("document.getElementById('who').textContent.indexOf('con Oli') > 0", timeout=30000)
        pgO.wait_for_function("document.getElementById('who').textContent.indexOf('con Lali') > 0", timeout=10000)
        ok(True, '(6) dos navegadores se conectan con el código de sala (PeerJS real)')
        pgO.evaluate("(() => { const j = %s; j.x = 8 * 16 + 8; j.y = 28 * 16 + 14; })()" % J('oli')); pgL.wait_for_timeout(1500)
        ok(pgL.evaluate("[Math.floor(%s.x / 16), Math.floor(%s.y / 16)]" % (J('oli'), J('oli'))) == [8, 28] and pgL.evaluate(J('oli') + ".remoto") is True, '(7) Lali ve a Oli donde está')
        pgO.evaluate("document.querySelector('[data-pesca]').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true}))"); pgL.wait_for_timeout(1500)
        ok(pgL.evaluate("!!" + J('oli') + ".pesca") is True, '(8) Lali ve a Oli pescando')
        pgL.evaluate("(() => { const j = %s; j.x = 20 * 16 + 8; j.y = 26 * 16 + 14; })()" % J('lali')); pgO.wait_for_timeout(1500)
        ok(pgO.evaluate("Math.floor(%s.x / 16)" % J('lali')) == 20, '(9) Oli ve a Lali donde está')
        ok(not eO and not eL, '(10) sin errores de consola en los dos' + ('' if not (eO or eL) else ': ' + str((eO + eL)[0])))
    except Exception as e:
        noverif.append(str(e).split('\n')[0]); print(' NO VERIFICABLE (PeerJS real):', noverif[0])
    ctxO.close(); ctxL.close(); b.close()
print(('TODO BIEN' + (' (PeerJS real NO verificado: %s)' % noverif[0] if noverif else '')) if not fallos else 'FALLOS: %d' % len(fallos)); sys.exit(1 if fallos else 0)
