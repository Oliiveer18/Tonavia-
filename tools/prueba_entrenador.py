#!/usr/bin/env python3
# tools/prueba_entrenador.py — v2.343: nivel de entrenador en el HUD y en el panel Equipo. Capturas: docs/entrenador_v2343_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0&ciclo=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    ok('Nv 1' in pg.inner_text('#nvE'), 'el HUD muestra Nv 1 en el botón Equipo')
    pg.evaluate("() => { const e = __juego.est; G.entrenador.dar(e, e.jugadores.oli, 200); }"); pg.wait_for_timeout(900)
    ok('Nv 3' in pg.inner_text('#nvE'), 'sube a Nv 3 con 200 XP (HUD actualizado): ' + pg.inner_text('#nvE'))
    pg.screenshot(path=os.path.join(raiz, 'docs', 'entrenador_v2343_hud_390x844.png'))
    pg.evaluate("() => G.equipoUI.abrir(__juego.est.jugadores.oli)"); pg.wait_for_timeout(400)
    ok('Entrenador · Nivel 3' in pg.inner_text('#eq-ent'), 'el panel Equipo muestra el nivel y la barra: ' + pg.inner_text('#eq-ent').replace('\n', ' '))
    pg.screenshot(path=os.path.join(raiz, 'docs', 'entrenador_v2343_panel_390x844.png'))
    ok(not err, 'sin errores de página %s' % err[:2]); b.close()
print('FALLOS' if fallos else 'OK'); sys.exit(1 if fallos else 0)
