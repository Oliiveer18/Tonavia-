#!/usr/bin/env python3
# tools/prueba_luces.py — v2.328: la iluminación 2D (src/luces2d.js) funciona a varias horas, sin errores, y se apaga con ?luces=0. Capturas: docs/luces_v2328_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def pon(pg, h, mapa, tx, ty):
    pg.evaluate("([h,m,tx,ty]) => { const e = __juego.est, j = e.jugadores.oli; e.reloj = (h / 24 - G.ciclo.AJUSTES.FASE0) * G.ciclo.AJUSTES.DIA_S; j.mapa = m; j.x = tx * 16 + 8; j.y = ty * 16 + 8; }", [h, mapa, tx, ty]); pg.wait_for_timeout(700)
def px(pg):
    return pg.evaluate("() => { const c = document.getElementById('game') || document.querySelector('canvas'); const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 64) { s += d[i] + d[i+1] + d[i+2]; n++; } return s / n / 3; }")
with sync_playwright() as p:
    b = p.chromium.launch()
    for q, tag in (('', 'luz'), ('&luces=0', 'viejo')):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0' + q); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
        if tag == 'luz':
            for nom, h, m, tx, ty in (('mediodia', 12, 'albanota', 26, 18), ('atardecer', 17.9, 'albanota', 26, 18), ('noche_plaza', 23, 'albanota', 26, 18), ('noche_centro', 22, 'albanota', 26, 8), ('noche_carbuna', 22, 'pueblo_carbuna', 40, 20), ('madrugada', 3, 'albanota', 12, 16), ('noche_casas', 20, 'albanota', 6, 14), ('noche_hierba', 23.5, 'albanota', 20, 13), ('noche_lab', 21, 'albanota', 12, 20), ('noche_ermita', 21, 'albanota', 41, 7)):
                pon(pg, h, m, tx, ty); pg.screenshot(path=os.path.join(raiz, 'docs', 'luces_v2328_%s_390x844.png' % nom)); print(nom, round(px(pg), 1))
            pon(pg, 12, 'albanota', 26, 18); dia = px(pg); pon(pg, 23, 'albanota', 26, 18); noche = px(pg)
            ok(noche < dia * 0.75, 'de noche la pantalla es más oscura que de día (%.0f < %.0f)' % (noche, dia))
            pon(pg, 22, 'albanota', 26, 8); ok(pg.evaluate("() => G.luces2d.activo(__juego.mundo.mapa('albanota'), false)"), 'luces2d activo en exteriores')
            ok(not pg.evaluate("() => G.luces2d.activo(__juego.mundo.mapa('tienda'), false)"), 'no activo en interiores')
            pg.evaluate("() => { __juego.est.jugadores.oli.mapa = 'tienda'; }"); pg.wait_for_timeout(500)
            ok(pg.evaluate("() => document.getElementById('noche').style.background") in ('rgb(255, 255, 255)', 'rgb(255,255,255)'), 'interior siempre iluminado (velo blanco)')
        else:
            pon(pg, 23, 'albanota', 26, 18); ok(not pg.evaluate("() => G.luces2d.activo(__juego.mundo.mapa('albanota'), false)"), '?luces=0 vuelve al velo antiguo')
        ctx.close()
    b.close()
ok(not err, 'sin errores de página %s' % err[:2]); print('OK' if not fallos else 'FALLA: %d' % len(fallos)); sys.exit(1 if fallos else 0)
