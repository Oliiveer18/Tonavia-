#!/usr/bin/env python3
# tools/prueba_tienda.py — prueba en Chromium móvil (v2.319) la economía: HUD con ✦, Tienda con el tendero Teo (diálogo, comprar, vender), Bolsa (usar poción sobre una criatura herida),
# curar con Alba (cuesta Brillos) y sin errores de consola. Guarda capturas en docs/ (390×844).
# Uso: node build.js && python3 tools/prueba_tienda.py [dist/criaturas.html] [carpeta_capturas]   (necesita playwright)
import sys, os
from playwright.sync_api import sync_playwright
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(aqui)
html = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'dist', 'criaturas.html'))
sal = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raiz, 'docs')
err = []; fallos = []
J = "__juego.est.jugadores.oli"
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def foto(pg, n): pg.screenshot(path=os.path.join(sal, 'tienda_v2319_%s_390x844.png' % n))
def pon(pg, mapa, cx, cy):
    pg.evaluate("(() => { const j = %s; j.mapa = '%s'; j.x = %d * 16 + 8; j.y = %d * 16 + 14; j.moving = false; __juego.est.avisos.length = 0; })()" % (J, mapa, cx, cy)); pg.wait_for_timeout(500)
def sig(pg):   # pasa las frases del diálogo hasta que salen las opciones
    for _ in range(14):
        if pg.is_visible('.dlg-op'): return
        pg.click('#dlg', position={'x': 195, 'y': 300}); pg.wait_for_timeout(120)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and err.append('consola: ' + m.text)); pg.on('pageerror', lambda e: err.append('error de página: ' + str(e)))
    pg.goto('file://' + html + '?menu=1'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(800)
    ok(pg.is_visible('#bbtn') and pg.inner_text('#bril') == '100', 'el HUD muestra la Bolsa con 100 ✦')
    r = pg.eval_on_selector('#hud', 'e => { const a = e.getBoundingClientRect(); return [a.left, a.right, a.top, a.bottom, innerWidth]; }'); ok(r[0] >= 0 and r[1] <= r[4] + 1, 'el HUD cabe en 390 px de ancho')
    foto(pg, 'hud')
    # ── Tienda ──
    pon(pg, 'tienda', 7, 4); foto(pg, 'interior')
    pg.evaluate("__juego.talk()"); pg.wait_for_timeout(300); ok(pg.is_visible('#dlg'), 'hablar junto al mostrador abre el diálogo de Teo'); sig(pg); foto(pg, 'dialogo')
    ops = pg.eval_on_selector_all('.dlg-op b', 'els => els.map(e => e.textContent)'); ok(ops == ['Comprar', 'Vender', 'Charlar', 'Despedirme'], 'menú del tendero: ' + str(ops))
    pg.click('.dlg-op >> text=Charlar'); sig(pg); pg.wait_for_timeout(200)
    ok(pg.is_visible('.dlg-op') or pg.is_visible('#dlg'), 'Charlar da un consejo y vuelve al menú')
    for _ in range(8):
        if pg.is_visible('.dlg-op'): break
        pg.click('#dlg', position={'x': 195, 'y': 300}); pg.wait_for_timeout(150)
    pg.click('.dlg-op >> text=Comprar');
    for _ in range(6):
        if pg.is_visible('#bolsa'): break
        pg.click('#dlg', position={'x': 195, 'y': 300}); pg.wait_for_timeout(150)
    pg.wait_for_timeout(300); ok(pg.is_visible('#bolsa'), 'Comprar abre la Tienda'); foto(pg, 'comprar')
    pg.click('.bl-fila:nth-child(1) .bl-btn >> nth=0'); pg.wait_for_timeout(200)
    ok(pg.evaluate(J + ".mochila && " + J + ".mochila.pocion") == 1 and pg.evaluate(J + ".brillos") == 60, 'comprar una Poción: 1 en la mochila y 60 ✦')
    pg.click('.bl-fila:nth-child(4) .bl-btn >> nth=0'); pg.wait_for_timeout(200); ok(pg.evaluate(J + ".esferas") == 6 and pg.evaluate(J + ".brillos") == 30, 'comprar una esfera: 6 esferas y 30 ✦')
    ok(pg.is_disabled('.bl-fila:nth-child(2) .bl-btn >> nth=0') and pg.evaluate(J + ".brillos") == 30, 'sin saldo para la Superpoción el botón está desactivado')
    # pescado para vender
    pg.evaluate("G.tienda.meter(%s, 'pez_loro', 2)" % J); pg.click('#bl-tabs button >> text=Vender'); pg.wait_for_timeout(250); foto(pg, 'vender')
    pg.click('.bl-fila >> text=Pez loro >> xpath=ancestor::div[contains(@class,"bl-fila")]//button >> nth=1'); pg.wait_for_timeout(250)
    ok(pg.evaluate(J + ".brillos") > 30 and not pg.evaluate("!!" + J + ".mochila.pez_loro"), 'vender todo el pez loro lo quita de la mochila y suma Brillos')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); ok(not pg.is_visible('#bolsa') and pg.is_visible('#dlg'), 'Esc cierra la Tienda y vuelve al diálogo')
    pg.click('.dlg-op >> text=Despedirme'); pg.wait_for_timeout(300)
    for _ in range(6):
        if not pg.is_visible('#dlg'): break
        pg.click('#dlg', position={'x': 195, 'y': 300}); pg.wait_for_timeout(150)
    ok(not pg.is_visible('#dlg'), 'Despedirme cierra el diálogo')
    # ── Bolsa: usar poción ──
    pg.evaluate("(() => { const j = %s; j.vida = { pompon: 20 }; })()" % J); pon(pg, 'albanota', 20, 14)
    pg.click('#bbtn'); pg.wait_for_timeout(300); ok(pg.is_visible('#bolsa'), 'el botón ✦ abre la Bolsa'); foto(pg, 'bolsa')
    pg.click('.bl-fila >> text=Poción >> xpath=ancestor::div[contains(@class,"bl-fila")]//button'); pg.wait_for_timeout(300); foto(pg, 'usar')
    pg.click('.bl-fila >> text=Nv >> xpath=ancestor::div[contains(@class,"bl-fila")]//button >> nth=0'); pg.wait_for_timeout(300)
    ok(pg.evaluate(J + ".vida && " + J + ".vida.pompon") > 20 or not pg.evaluate("!!" + J + ".vida"), 'la Poción cura a la criatura herida')
    pg.keyboard.press('Escape'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    if pg.is_visible('#bolsa'): pg.click('#bl-x'); pg.wait_for_timeout(200)
    # ── Alba cobra ──
    pg.evaluate("(() => { const j = %s; j.vida = { pompon: 0 }; j.brillos = 5; })()" % J); pon(pg, 'centro_pc', 6, 5)
    pg.evaluate("__juego.talk()"); pg.wait_for_timeout(300); sig(pg); foto(pg, 'alba')
    sub = pg.eval_on_selector_all('.dlg-op small', 'els => els.map(e => e.textContent)'); ok(any('20 ✦' in t for t in sub), 'Alba muestra el precio de curar: ' + str(sub))
    pg.click('.dlg-op >> text=Curar'); pg.wait_for_timeout(400); ok(pg.evaluate("!!" + J + ".vida") and pg.evaluate(J + ".brillos") == 5, 'con 5 ✦ Alba no cura y avisa'); foto(pg, 'alba_sin')
    ok(not err, 'sin errores de consola: ' + str(err[:3]))
    b.close()
print('\n' + ('TODO EN ORDEN' if not fallos else str(len(fallos)) + ' FALLO(S)')); sys.exit(1 if fallos else 0)
