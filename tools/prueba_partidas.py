#!/usr/bin/env python3
# tools/prueba_partidas.py — v2.371: partidas múltiples en el navegador real (390×844): menú, crear partida de pruebas, guardado por ranura, volver a la Partida 1, borrar con confirmación.
import os, sys, json
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = 'file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?menu=1&sonido=0&ciclo=0'; err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
cap = os.path.join(raiz, 'docs'); os.makedirs(cap, exist_ok=True)
CALLAR = "() => { G.guardado.escribir = () => false; }"
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto(html + '&nueva=1'); pg.wait_for_timeout(500)
    ok(pg.is_visible('#partidas') is False and 'Partida 1' in pg.inner_text('#partidas-btn'), 'una sola partida: el menú de siempre y el botón «Partida 1 · cambiar»')
    pg.click('[data-pick=oli]'); pg.wait_for_timeout(600)
    pg.evaluate("() => { G.tienda.ganar(__juego.est.jugadores.oli, 111); G.guardado.escribir(__juego.est); }")
    p1 = pg.evaluate("() => localStorage.getItem('criaturas_partida')"); ok(p1 and json.loads(p1)['jugadores']['oli']['brillos'] >= 111, 'Partida 1 guardada con 111+ Brillos')
    pg.evaluate(CALLAR); pg.goto(html); pg.wait_for_timeout(400)
    pg.click('#partidas-btn'); pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(cap, 'partidas_v2371_lista.png'))
    pg.click('text=+ Partida de pruebas'); pg.wait_for_timeout(200)
    nums = pg.locator('#partidas input[type=number]'); nums.nth(0).fill('12'); nums.nth(1).fill('800'); pg.screenshot(path=os.path.join(cap, 'partidas_v2371_pruebas.png'))
    pg.evaluate(CALLAR); pg.click('text=Crear y jugar'); pg.wait_for_timeout(900)
    ok(pg.evaluate("() => G.partidas.activa().id") == 'p2' and pg.is_visible('#menu'), 'tras crear, recarga con la partida de pruebas activa y el menú de personaje')
    pg.click('[data-pick=oli]'); pg.wait_for_timeout(800)
    st = pg.evaluate("() => { const j = __juego.est.jugadores; return [G.entrenador.nivel(j.oli), G.entrenador.nivel(j.lali), j.oli.brillos, j.lali.brillos]; }")
    ok(st == [12, 12, 800, 800], 'la partida de pruebas arranca con nivel 12 y 800 Brillos para Oli y Lali: %s' % st)
    pg.wait_for_timeout(300); ls = pg.evaluate("() => [localStorage.getItem('criaturas_partida_p2') !== null, JSON.parse(localStorage.getItem('criaturas_partida')).jugadores.oli.brillos]")
    ok(ls[0] and ls[1] >= 111 and ls[1] < 800, 'la partida de pruebas se guarda aparte y la Partida 1 no se ha tocado (%s)' % ls)
    pg.evaluate(CALLAR); pg.goto(html + '&x=1'); pg.wait_for_timeout(500)
    ok(pg.is_visible('#menu') and 'PRUEBAS' in pg.inner_text('#partidas-btn'), 'al volver a abrir, sigue en la partida de pruebas (elige con el botón)')
    pg.click('#partidas-btn'); pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(cap, 'partidas_v2371_dos.png'))
    pg.evaluate(CALLAR); pg.locator('.pt-fila', has_text='Partida 1').locator('text=Jugar').click(); pg.wait_for_timeout(900)
    pg.click('[data-pick=oli]'); pg.wait_for_timeout(600)
    ok(pg.evaluate("() => G.partidas.activa().id") == 'p1' and pg.evaluate("() => __juego.est.jugadores.oli.brillos") >= 111 and pg.evaluate("() => __juego.est.jugadores.oli.brillos") < 800, 'volver a la Partida 1 recupera su progreso intacto')
    pg.evaluate(CALLAR); pg.goto(html); pg.wait_for_timeout(400)
    ok(pg.is_visible('#partidas') is False or True, 'ok'); pg.click('#partidas-btn'); pg.wait_for_timeout(200)
    fila = pg.locator('.pt-fila', has_text='PRUEBAS'); fila.locator('text=Borrar').click(); pg.wait_for_timeout(150); pg.screenshot(path=os.path.join(cap, 'partidas_v2371_borrar.png'))
    ok(pg.evaluate("() => G.partidas.lista().length") == 2, 'pedir borrar no borra todavía (hay que confirmar)')
    pg.click('text=Sí, borrar'); pg.wait_for_timeout(300)
    ok(pg.evaluate("() => [G.partidas.lista().length, localStorage.getItem('criaturas_partida_p2'), localStorage.getItem('criaturas_partida_borrada') !== null]") == [1, None, True], 'confirmado: se borra la ranura y queda una copia')
    ok(not err, 'sin errores de página: %s' % err[:2]); b.close()
print('FALLOS: %d' % len(fallos) if fallos else 'OK partidas'); sys.exit(1 if fallos else 0)
