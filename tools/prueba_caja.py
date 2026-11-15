#!/usr/bin/env python3
# tools/prueba_caja.py — v2.339: panel Equipo con la caja del Centro PC (solo lectura fuera; edición con la enfermera). Capturas: docs/caja_v2339_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0&ciclo=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; G.equipo.agregar(j, { forma: 'zefirax', mapa: 'albanota', hp: 40, xp: G.nivel.xpPara(6) }); G.equipo.agregar(j, { forma: 'zefirax', mapa: 'albanota' }); G.equipoUI.abrir(j, G.equipo.actual(j)); }"); pg.wait_for_timeout(500)
    pg.click('#eq-tabs button[data-tab=todas]'); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(raiz, 'docs', 'caja_v2339_lista_390x844.png'))
    ok('caja 2/50' in pg.inner_text('#eq-n'), 'el panel muestra la caja 2/50: ' + pg.inner_text('#eq-n'))
    ok(pg.evaluate("() => document.querySelectorAll('#eq-lista .eq-card').length") == 3, 'una tarjeta por ejemplar (equipo + 2 en la caja)')
    pg.evaluate("() => G.equipoUI.cerrar()"); pg.wait_for_timeout(200)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.mapa = 'centro_pc'; j.x = 6 * 16 + 8; j.y = 5 * 16 + 8; j.brillos = 500; }"); pg.wait_for_timeout(300)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; G.equipoUI.abrir(j, null, { editar: true, guardar: (f, i) => { const r = !!__juego.motor.aplicar(__juego.est, { j: 'oli', t: 'equipo', formas: f, ids: i }); return r; } }); }"); pg.wait_for_timeout(400)
    pg.click('#eq-tabs button[data-tab=todas]'); pg.wait_for_timeout(300)
    pg.locator('#eq-lista .eq-card').nth(1).click(); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(raiz, 'docs', 'caja_v2339_ficha_390x844.png'))
    pg.click('.eq-btn.pri'); pg.wait_for_timeout(400)
    r = pg.evaluate("() => { const j = __juego.est.jugadores.oli; return JSON.stringify({ eq: j.equipo, caja: j.sinId.length, vida: j.vida }); }"); print(r)
    ok('"zefirax"' in r and '"caja":1' in r, 'añadir al equipo saca la ejemplar de la caja con su vida')
    pg.screenshot(path=os.path.join(raiz, 'docs', 'caja_v2339_equipo_390x844.png'))
    pg.wait_for_timeout(300); pg.click('#eq-tabs button[data-tab=todas]'); pg.wait_for_timeout(300)
    pg.locator('#eq-lista .eq-card', has_text='En la caja').first.click() if False else pg.locator('#eq-lista .eq-card').last.click(); pg.wait_for_timeout(300); pg.click('.eq-btn.pri'); pg.wait_for_timeout(400)
    r = pg.evaluate("() => { const j = __juego.est.jugadores.oli; return JSON.stringify({ eq: j.equipo, caja: j.sinId.length, vida: j.vida }); }"); print(r)
    ok('"zefirax#2"' in r and '"caja":0' in r, 'v2.340 se pueden llevar dos de la misma especie, cada una con su vida')
    pg.click('#eq-tabs button[data-tab=equipo]'); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(raiz, 'docs', 'caja_v2340_duplicadas_390x844.png'))
    ok(not err, 'sin errores de página %s' % err[:2]); b.close()
print('FALLOS' if fallos else 'OK'); sys.exit(1 if fallos else 0)
