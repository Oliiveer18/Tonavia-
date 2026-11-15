# Prueba en Chromium del tablón y el buzón (v2.345). Uso: python3 tools/prueba_tablon.py
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); docs = os.path.join(raiz, 'docs'); os.makedirs(docs, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + raiz + '/dist/criaturas.html?menu=1&nueva=1&sonido=0&ciclo=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1000)
    pg.evaluate("""() => { const e = __juego.est, j = e.jugadores.oli; j.mapa = 'tienda'; j.x = 3*16+8; j.y = 3*16+8; j.dir = 'up';
      Object.keys(G.CREATURES).slice(0, 3).forEach(f => G.equipo.agregar(j, { forma: f, mapa: 'x', xp: 0 })); }""")
    pg.wait_for_timeout(700)
    pg.evaluate("() => __juego.talk()"); pg.wait_for_timeout(500)
    assert pg.evaluate("() => G.tablonUI.abierto()"), 'el tablón no se abre'
    pg.screenshot(path=docs + '/tablon_ofertas.png')
    pg.evaluate("() => { __juego.est.reloj += 300; }"); pg.wait_for_timeout(1700)
    pg.click('#tb-tabs [data-tab=mias]'); pg.wait_for_timeout(200); pg.click('#tb-lista .tb-b'); pg.wait_for_timeout(300)
    pg.screenshot(path=docs + '/tablon_publicar.png')
    pg.locator('.tb-sheet .tb-op').first.click(); pg.click('.tb-sheet .tb-b.ok'); pg.wait_for_timeout(400)
    n = pg.evaluate("() => G.tablon.ofertas(__juego.est).filter(o => o.aut.t === 'j').length"); assert n == 1, 'oferta no publicada: %s' % n
    pg.screenshot(path=docs + '/tablon_mias.png')
    pg.evaluate("""() => { const e = __juego.est, o = G.tablon.ofertas(e).find(o => o.aut.t === 'j'); const a = e.agentes && (e.agentes.lista || e.agentes)[0]; o.props.push({ id: ++e.tablon.sig, aut: o.aut.id === 'oli' ? { t: 'j', id: 'lali' } : { t: 'j', id: 'oli' }, cr: { forma: Object.keys(G.CREATURES)[3], xp: 0, hp: 5, id: 99 }, t: e.reloj }); }""")
    pg.click('#tb-tabs [data-tab=props]'); pg.wait_for_timeout(1800); pg.screenshot(path=docs + '/tablon_props.png')
    pg.click('#tb-lista .tb-b.ok'); pg.wait_for_timeout(300); pg.screenshot(path=docs + '/tablon_aceptar.png')
    pg.click('.tb-sheet .tb-b.ok'); pg.wait_for_timeout(300)
    assert pg.evaluate("() => G.tablon.ofertas(__juego.est).length") == 0, 'el intercambio no se confirmó'
    pg.click('#tablon .x'); pg.wait_for_timeout(200)
    pg.evaluate("() => G.buzon.avisar(__juego.est, __juego.est.jugadores.oli, 'propuesta', 'Marta te propone Ondel (Nv 3) por Bulbo', 1)"); pg.evaluate("() => G.tablonUI.badge(__juego.est.jugadores.oli)")
    pg.screenshot(path=docs + '/tablon_hud.png'); pg.click('#nbtn'); pg.wait_for_timeout(300); pg.screenshot(path=docs + '/buzon.png')
    print('errores:', errs or 'ninguno'); b.close()
sys.exit(1 if errs else 0)
