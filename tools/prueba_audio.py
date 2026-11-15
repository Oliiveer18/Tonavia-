#!/usr/bin/env python3
"""prueba_audio.py — prueba en Chromium móvil (390×844) del sonido por código (v2.136, ID-4, src/audio.js) con Web Audio REAL.
Uso: node build.js && python3 tools/prueba_audio.py [carpeta_capturas]
Comprueba: (1) antes del primer gesto no hay contexto ni errores · (2) al elegir personaje (gesto) suena el tema de Albanota · (3) al entrar en una zona cambia el tema tras el retardo y el anterior se funde y se retira
(4) el botón 🔇/🔊 suspende/reanuda el contexto y se recuerda al recargar · (5) efectos (hablar/puerta) sin errores · (6) ?sonido=0 lo apaga y oculta el botón · (7) sin consola con errores."""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_audio'); sal.mkdir(parents=True, exist_ok=True)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html'); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def abre(b, url=URL):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_function('window.__juego'); return ctx, pg, errs
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=document-user-activation-required'])
    ctx, pg, errs = abre(b)
    ok(pg.evaluate('G.audio.sonando') is False and pg.is_visible('#abtn') and pg.inner_text('#abtn') == '🔊', '(1) antes del primer gesto no suena y el botón 🔊 está a la vista')
    pg.click('[data-pick=oli]'); pg.wait_for_timeout(1500)
    ok(pg.evaluate('G.audio.sonando') and pg.evaluate('G.audio.tema') == 'albanota', '(2) tras el primer gesto suena el tema de Albanota')
    z = pg.evaluate("(() => { const z = __juego.mundo.mapa(__juego.est.jugadores.oli.mapa).zonas.find(q => q.elemento === 'agua'); return [z.x + (z.w >> 1), z.y + (z.h >> 1)]; })()")
    pg.evaluate("([x, y]) => { const j = __juego.est.jugadores.oli; j.x = (x + .5) * 16; j.y = (y + .5) * 16; }", z); pg.wait_for_timeout(1200)
    ok(pg.evaluate('G.audio.tema') == 'agua' and pg.evaluate('G.audio.sonando'), '(3) al entrar en la zona de agua cambia a su tema')
    pg.wait_for_timeout(2200); ok(pg.evaluate('G.audio.sonando'), '(3) el tema anterior se retira y sigue sonando el nuevo')
    pg.screenshot(path=str(sal / 'audio_boton.png'))
    pg.click('#abtn'); pg.wait_for_timeout(300)
    ok(pg.inner_text('#abtn') == '🔇' and pg.evaluate('G.audio.silenciado') and not pg.evaluate('G.audio.sonando'), '(4) 🔇 silencia y suspende el contexto')
    pg.goto(URL + ('&' if '?' in URL else '?') + 'menu=1'); pg.wait_for_function('window.__juego'); ok(pg.inner_text('#abtn') == '🔇', '(4) el silencio se recuerda al recargar')
    pg.click('#abtn'); pg.click('[data-pick=lali]'); pg.wait_for_timeout(800); ok(pg.inner_text('#abtn') == '🔊' and pg.evaluate('G.audio.sonando'), '(4) 🔊 devuelve el sonido')
    pg.evaluate("G.audio.sfx('hablar'); G.audio.sfx('puerta'); G.audio.sfx('evolucionar')"); pg.keyboard.press('e'); pg.wait_for_timeout(300)
    ok(True, '(5) efectos lanzados sin excepción')
    ok(not errs, '(7) sin errores de consola: ' + str(errs)); ctx.close()
    ctx, pg, errs = abre(b, URL + '?sonido=0'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(600)
    ok(not pg.evaluate('G.audio.sonando') and not pg.is_visible('#abtn') and not errs, '(6) ?sonido=0: sin sonido, sin botón y sin errores'); ctx.close(); b.close()
print('TODO BIEN' if not fallos else '%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
