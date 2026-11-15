#!/usr/bin/env python3
"""Prueba de la galería en un navegador de verdad (Chromium, móvil 390x780). Uso: python3 tools/prueba_galeria.py [dist/criaturas.html] [carpeta_capturas]
Comprueba: sin errores de consola, filtros combinados, páginas, sprites dibujados al verlos, tamaño de botones, sin saltos de diseño, búsqueda, ficha y botón «Galería».
Muestra simulada de 200 líneas: las 20 reales repetidas 10 veces con Nº 1-200 (se inyecta en G.galeria.fuente)."""
import sys, os, json
from playwright.sync_api import sync_playwright
ruta = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'dist/criaturas.html'); out = sys.argv[2] if len(sys.argv) > 2 else None
if out: os.makedirs(out, exist_ok=True)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else 'FALLA ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 780}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + ruta); pg.wait_for_timeout(300)
    shot = lambda n: pg.screenshot(path=os.path.join(out, n)) if out else None
    txt = lambda s: pg.inner_text(s).strip()
    # --- botón Galería desde el menú de inicio
    pg.tap('#gbtn'); pg.wait_for_timeout(300)
    ok(pg.is_visible('#gal'), 'el botón «Galería» del menú de inicio abre la galería')
    # --- 20 líneas reales
    ok(txt('#gal-count') == '20 líneas · 41 formas', '20 reales: contador «%s»' % txt('#gal-count'))
    ok(txt('#gp-info') == 'Pág. 1 de 1' and pg.is_disabled('#gp-prev') and pg.is_disabled('#gp-next'), '20 reales: una sola página')
    filas = pg.locator('#gal-list .line').count(); cards = pg.locator('#gal-list .card').count()
    ok(filas == 20 and cards == 41, '20 reales: %d líneas y %d tarjetas' % (filas, cards))
    d0 = pg.evaluate('G.galeria.dibujados')
    ok(0 < d0 < cards, '20 reales: al abrir solo se dibujan los visibles (%d de %d)' % (d0, cards))
    pg.evaluate("document.getElementById('gal-list').scrollTop = 1e6"); pg.wait_for_timeout(300)
    d1 = pg.evaluate('G.galeria.dibujados'); ok(d1 > d0, '20 reales: al bajar se dibujan más (%d)' % d1)
    pg.evaluate("document.getElementById('gal-list').scrollTop = 0"); pg.wait_for_timeout(200)
    n_vacios = pg.evaluate("[...document.querySelectorAll('#gal-list canvas')].filter(c => !c.dataset.id).length"); ok(n_vacios == 0, 'tarjetas con su id')
    shot('1_galeria_20.png')
    # --- diseño: anchos, botones táctiles, sin saltos
    ok(pg.evaluate('document.documentElement.scrollWidth <= 390 && document.getElementById("gal").scrollWidth <= 390'), 'sin desbordamiento horizontal de la pantalla')
    peque = pg.evaluate("[...document.querySelectorAll('#gal button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 44 && b.id !== 'gal-close' && !b.classList.contains('x')).map(b => b.textContent)")
    ok(not peque, 'botones de filtros, páginas y tarjetas de al menos 44 px de alto' + (' (pequeños: %s)' % peque if peque else ''))
    cierra = pg.evaluate("(() => { const r = document.getElementById('gal-close').getBoundingClientRect(); return [r.width, r.height]; })()"); ok(cierra[0] >= 44 and cierra[1] >= 44, 'botón ✕ de %dx%d px' % tuple(cierra))
    alturas = lambda: pg.evaluate("['gal-bar','gal-chips','gal-list','gal-pag'].map(i => Math.round(document.getElementById(i).getBoundingClientRect().height)*1000 + Math.round(document.getElementById(i).getBoundingClientRect().top))")
    base = alturas()
    filas_chips = pg.evaluate("[...document.querySelectorAll('#gal-chips .fr')].map(r => [Math.round(r.getBoundingClientRect().height), r.scrollWidth > r.clientWidth, Math.max(...[...r.querySelectorAll('button')].map(b => Math.round(b.getBoundingClientRect().top - r.getBoundingClientRect().top)))])")
    ok(all(h == 48 for h, _, _ in filas_chips), 'las 3 filas de filtros miden lo mismo (48 px) y no se parten en dos líneas: %s' % filas_chips)
    # --- filtros combinados (reales)
    def ch(fila, nombre): pg.locator('#gal-chips .fr').nth(fila).get_by_role('button', name=nombre, exact=True).tap(); pg.wait_for_timeout(150)
    ch(0, 'Roca'); ok(txt('#gal-count').startswith('4 líneas'), 'Roca: %s (Cuarel, Ferrel, Arenel y Forjel, que es fuego+roca)' % txt('#gal-count'))
    ch(1, 'Rara'); ok(txt('#gal-count').startswith('1 línea'), 'Roca + Rara: %s' % txt('#gal-count'))
    ch(2, '3 fases'); ok(txt('#gal-count').startswith('1 línea'), 'Roca + Rara + 3 fases: %s' % txt('#gal-count'))
    ch(2, '1 fase'); ok(txt('#gal-count').startswith('0 líneas') and pg.is_visible('.empty'), 'Roca + Rara + 1 fase: sin resultados y lo dice')
    ok(alturas() == base, 'al filtrar no se mueven ni cambian de alto la barra, los filtros, la lista ni las páginas')
    shot('2_filtros_vacio.png')
    pg.tap('#gal-clear'); pg.wait_for_timeout(150); ok(txt('#gal-count') == '20 líneas · 41 formas' and pg.evaluate("getComputedStyle(document.getElementById('gal-clear')).visibility") == 'hidden', 'Limpiar vuelve a las 20 líneas y se esconde')
    # --- búsqueda por nombre (teclado: ni «e», ni espacio ni w/a/s/d deben ser robados por el juego)
    pg.tap('#gal-q'); pg.keyboard.type('ondEl'); pg.wait_for_timeout(200)
    ok(pg.input_value('#gal-q') == 'ondEl' and txt('#gal-count').startswith('1 línea'), 'búsqueda «ondEl» (con mayúscula y letra e): %s' % txt('#gal-count'))
    pg.fill('#gal-q', ''); pg.keyboard.type('a s d w'); ok(pg.input_value('#gal-q') == 'a s d w', 'se puede escribir espacio y w/a/s/d en la búsqueda')
    pg.fill('#gal-q', 'cuarz'); pg.wait_for_timeout(150); ok(txt('#gal-count').startswith('1 línea'), 'búsqueda en otra fase (Cuarzoth → línea de Cuarel)')
    pg.tap('#gal-clear'); pg.wait_for_timeout(150)
    # --- ficha
    pg.locator('#gal-list .card').first.tap(); pg.wait_for_timeout(200)
    f = txt('#gal-det'); ok('Nº 001' in f and 'Ondavar' in f and pg.is_visible('#gal-det .lnk'), 'ficha de Ondel: Nº de línea y a qué evoluciona')
    shot('3_ficha.png')
    pg.locator('#gal-det .lnk').tap(); pg.wait_for_timeout(200); f = txt('#gal-det'); ok(f.startswith('Ondavar') and 'Nada: es la última fase' in f and 'Nº 001' in f, 'el botón de la ficha abre Ondavar, que es la última fase')
    pg.tap('#gal-det .x'); ok(not pg.is_visible('#gal-det'), 'se cierra la ficha')
    # --- 200 simuladas
    pg.evaluate("(() => { const L = G.lineList(), s = []; for (let i = 0; i < 200; i++) s.push(Object.assign({}, L[i % 20], { n: i + 1 })); G.galeria.fuente = () => s; })()")
    pg.tap('#gal-close'); pg.tap('#gbtn'); pg.wait_for_timeout(300); pg.evaluate('G.galeria.dibujados = 0')
    pg.tap('#gal-close'); pg.tap('#gbtn'); pg.wait_for_timeout(300)
    ok(txt('#gal-count') == '200 líneas · 410 formas' and txt('#gp-info') == 'Pág. 1 de 10', '200 simuladas: «%s», %s' % (txt('#gal-count'), txt('#gp-info')))
    ok(pg.locator('#gal-list .line').count() == 20 and pg.is_disabled('#gp-prev') and not pg.is_disabled('#gp-next'), '200 simuladas: 20 líneas por página; «Anterior» apagado en la primera')
    d = pg.evaluate('G.galeria.dibujados'); ok(0 < d < 60, '200 simuladas, página 1: %d sprites dibujados de las ~41 tarjetas de la página, no de 410' % d)
    shot('4_galeria_200.png')
    suma = 0; nums = []
    for i in range(10):
        suma += pg.locator('#gal-list .line').count(); nums.append(txt('#gal-list .lh >> nth=0'))
        if i < 9: pg.tap('#gp-next'); pg.wait_for_timeout(120)
    ok(suma == 200 and nums[0] == 'Nº 001' and nums[9] == 'Nº 181', '200 simuladas: las 10 páginas suman %d líneas (primeras de página: %s…%s)' % (suma, nums[0], nums[9]))
    ok(pg.is_disabled('#gp-next') and not pg.is_disabled('#gp-prev') and pg.locator('#gal-list .line').count() == 20, 'última página: «Siguiente» apagado')
    ch(1, 'Épica'); ok(txt('#gal-count').startswith('20 líneas') and txt('#gp-info') == 'Pág. 1 de 1', '200 simuladas: Épica (Lunel y Forjel ×10) = %s' % txt('#gal-count'))
    ch(1, 'Todos'); ch(0, 'Sombra'); ch(2, '2 fases'); ok(txt('#gal-count').startswith('10 líneas'), '200 simuladas: Sombra + 2 fases (Somnel ×10) = %s' % txt('#gal-count')); shot('5_filtros_200.png')
    pg.fill('#gal-q', 'forj'); pg.wait_for_timeout(150); ok(txt('#gal-count').startswith('0 líneas'), 'Sombra + 2 fases + «forj» = nada (Forjel es fuego+roca de 3 fases)')
    pg.tap('#gal-clear'); pg.wait_for_timeout(150); pg.tap('#gal-close'); pg.wait_for_timeout(200)
    # --- el juego sigue funcionando tras cerrar
    ok(pg.is_visible('#menu') and not pg.is_visible('#gal'), 'al cerrar la galería se vuelve al menú de inicio')
    pg.tap('[data-pick=oli]'); pg.wait_for_timeout(300); ok('Oli' in txt('#who') and pg.is_visible('#gbtn'), 'se puede jugar con Oli y el botón «Galería» sigue ahí')
    pg.keyboard.press('e'); pg.keyboard.press('d'); pg.wait_for_timeout(100)
    ok(not errs, 'sin errores de consola' + (': %s' % errs[:3] if errs else ''))
    b.close()
print('\n%s' % ('TODO BIEN' if not fallos else '%d FALLO(S)' % len(fallos))); sys.exit(1 if fallos else 0)
