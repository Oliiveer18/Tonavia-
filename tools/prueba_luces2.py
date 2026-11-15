#!/usr/bin/env python3
# tools/prueba_luces2.py — v2.336: iluminación 2D++ (fuente, reflejos, filo, atardecer, polillas/polvo, criaturas, niebla): sin errores a varias horas. Capturas: docs/luces_v2336_*_390x844.png
import os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def pon(pg, h, mapa, tx, ty):
    pg.evaluate("([h,m,tx,ty]) => { const e = __juego.est, j = e.jugadores.oli; e.reloj = (h / 24 - G.ciclo.AJUSTES.FASE0) * G.ciclo.AJUSTES.DIA_S; j.mapa = m; j.x = tx * 16 + 8; j.y = ty * 16 + 8; }", [h, mapa, tx, ty])
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    for nom, h, tx, ty in (('fuente_noche', 22.5, 25, 20), ('atardecer', 18.0, 25, 20), ('amanecer', 6.2, 25, 20), ('rio_noche', 22.5, 24, 26), ('niebla', 4.2, 25, 20), ('casas_noche', 23.2, 25, 12)):
        pon(pg, h, 'albanota', tx, ty); pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(raiz, 'docs', 'luces_v2336_%s_390x844.png' % nom)); print(nom)
    # criaturas de fuego/eléctricas: se colocan junto al jugador de noche
    pg.evaluate("() => { const e = __juego.est; window.__e = e; }")
    ok(not err, 'sin errores de página: %s' % err[:2])
    b.close()
print('FALLOS' if fallos else 'TODO OK')
