#!/usr/bin/env python3
# tools/prueba_minimapa.py — prueba en Chromium móvil (v2.73, paso 1) el minimapa y el mapa grande: botón táctil de 44 px que no tapa el mando, puntos de los DOS jugadores (el propio más grande),
# el punto se mueve al andar, un toque abre el mapa grande con nombres y cabe en la pantalla, se cierra con ✕, con tocar fuera y con la tecla M, y no hay errores de consola.
# Uso: node build.js && python3 tools/prueba_minimapa.py [dist/criaturas.html] [carpeta_capturas]   (necesita playwright)
import sys, os
from playwright.sync_api import sync_playwright
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(aqui)
html = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'dist', 'criaturas.html'))
sal = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raiz, 'docs')
err = []; log = []
def ok(c, m):
    if not c: err.append(m)
    log.append(('  ok  ' if c else '  MAL ') + m)
PIX = """(id) => { const c = document.getElementById(id), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, R = {};
  const cerca = (i, r, g, b) => Math.abs(d[i] - r) < 8 && Math.abs(d[i+1] - g) < 8 && Math.abs(d[i+2] - b) < 8;
  const col = { oli: [255, 111, 174], lali: [74, 163, 255], blanco: [255, 249, 238] };
  for (const k in col) { let n = 0, sx = 0, sy = 0; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (cerca(i, ...col[k])) { n++; sx += x; sy += y; } } R[k] = { n, x: n ? sx / n : -1, y: n ? sy / n : -1 }; }
  R.w = c.width; R.h = c.height; R.cssW = c.getBoundingClientRect().width; R.cssH = c.getBoundingClientRect().height; return R; }"""
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.on('console', lambda m: m.type == 'error' and err.append('consola: ' + m.text)); pg.on('pageerror', lambda e: err.append('error de página: ' + str(e)))
    pg.goto('file://' + html + '?menu=1'); pg.wait_for_timeout(400)
    ok(pg.is_hidden('#minib'), 'antes de elegir jugador no hay minimapa (el menú está abierto)')
    pg.click('[data-pick=oli]'); pg.wait_for_timeout(700)
    ok(pg.is_visible('#minib'), 'al elegir a Oli aparece el minimapa')
    r = pg.eval_on_selector('#minib', 'e => { const a = e.getBoundingClientRect(), s = document.getElementById("stage").getBoundingClientRect(), p = document.getElementById("pad").getBoundingClientRect(); return { a: [a.x, a.y, a.width, a.height], s: [s.x, s.y, s.width, s.height], p: [p.x, p.y, p.width, p.height] }; }')
    a, s, pd = r['a'], r['s'], r['p']
    ok(a[2] >= 44 and a[3] >= 44, 'el botón mide al menos 44×44 px (mide %.0f×%.0f)' % (a[2], a[3]))
    ok(a[0] >= s[0] and a[1] >= s[1] and a[0] + a[2] <= s[0] + s[2] + 1 and a[1] + a[3] <= s[1] + s[3] + 1, 'el minimapa está dentro de la vista del juego')
    ok(a[1] + a[3] <= pd[1], 'el minimapa no tapa el mando (termina en y=%.0f; el mando empieza en y=%.0f)' % (a[1] + a[3], pd[1]))
    ok(a[2] <= 160 and a[3] <= 130, 'el minimapa no se come la pantalla (%.0f×%.0f px CSS)' % (a[2], a[3]))
    m0 = pg.evaluate(PIX, 'mini')
    ok(m0['oli']['n'] > 20 and m0['lali']['n'] > 10, 'se ven los puntos de Oli (rosa) y Lali (azul): %d y %d px' % (m0['oli']['n'], m0['lali']['n']))
    ok(m0['oli']['n'] > m0['lali']['n'], 'el punto propio (Oli) es más grande que el del otro (Lali)')
    pg.screenshot(path=os.path.join(sal, 'minimapa_v273_mini_390x844.png'))
    pg.keyboard.down('ArrowLeft'); pg.wait_for_timeout(1300); pg.keyboard.up('ArrowLeft'); pg.wait_for_timeout(150)
    m1 = pg.evaluate(PIX, 'mini')
    ok(m1['oli']['x'] < m0['oli']['x'] - 1.5, 'al andar a la izquierda el punto de Oli se mueve a la izquierda (%.1f → %.1f px)' % (m0['oli']['x'], m1['oli']['x']))
    pg.keyboard.down('ArrowLeft'); pg.wait_for_timeout(900); pg.keyboard.up('ArrowLeft'); pg.wait_for_timeout(150); m2 = pg.evaluate(PIX, 'mini')   # Oli ya se ha separado de Lali: sus puntos no se tapan
    pg.keyboard.down('ArrowLeft'); pg.wait_for_timeout(500); pg.keyboard.up('ArrowLeft'); pg.wait_for_timeout(150); m3 = pg.evaluate(PIX, 'mini')
    ok(m3['oli']['x'] < m2['oli']['x'] - 1 and abs(m3['lali']['x'] - m2['lali']['x']) < 0.6 and abs(m3['lali']['y'] - m2['lali']['y']) < 0.6, 'el punto de Lali no se mueve si ella no anda (Oli sí: %.1f → %.1f px)' % (m2['oli']['x'], m3['oli']['x']))
    pg.click('#minib'); pg.wait_for_timeout(300)
    ok(pg.is_visible('#mapa'), 'un toque en el minimapa abre el mapa grande')
    g = pg.evaluate(PIX, 'mapa-cv'); sz = pg.eval_on_selector('#mapa-cv', 'e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }')
    ok(sz[0] >= 0 and sz[0] + sz[2] <= 390.5 and sz[1] >= 0 and sz[1] + sz[3] <= 844, 'el mapa grande cabe en la pantalla (%.0f×%.0f px CSS)' % (sz[2], sz[3]))
    ok(g['blanco']['n'] > 300, 'hay nombres escritos en el mapa grande (%d px de letra)' % g['blanco']['n'])
    ok(g['oli']['n'] > 60 and g['lali']['n'] > 60, 'se ven los dos jugadores en el mapa grande')
    ok(pg.eval_on_selector('#mapa-x', 'e => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }'), 'el botón ✕ mide al menos 44×44 px')
    ok('Albanota' in pg.inner_text('#mapa-t'), 'el título dice en qué mapa estás')
    pg.screenshot(path=os.path.join(sal, 'minimapa_v273_mapa_390x844.png'))
    # v2.74 · zoom con el dedo
    V = "() => { const v = window.G.minimapa.vivo.vista; return [v.z, v.x, v.y]; }"
    ok(pg.is_disabled('#mapa-menos') and not pg.is_disabled('#mapa-mas'), 'sin zoom el botón － está apagado y ＋ activo')
    HASH = "() => { const c = document.getElementById('mapa-cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) | 0; return h; }"; h1 = pg.evaluate(HASH)
    pg.click('#mapa-mas'); pg.wait_for_timeout(200); z1 = pg.evaluate(V); ok(z1[0] == 2, 'el botón ＋ acerca a 2× (%s)' % z1[0])
    g2 = pg.evaluate(PIX, 'mapa-cv'); h2 = pg.evaluate(HASH)
    ok(h2 != h1 and g2['blanco']['n'] > 100 and abs(g2['oli']['n'] - g['oli']['n']) <= g['oli']['n'] * 0.15, 'con zoom el dibujo cambia, siguen los nombres y los puntos de los jugadores mantienen su tamaño (Oli %d → %d px)' % (g['oli']['n'], g2['oli']['n']))
    pg.screenshot(path=os.path.join(sal, 'minimapa_v273_zoom2_390x844.png'))
    pg.click('#mapa-mas'); pg.wait_for_timeout(150); ok(pg.evaluate(V)[0] == 4 and pg.is_disabled('#mapa-mas'), 'el zoom se para en 4× y ＋ se apaga')
    ARR = "(a) => { const c = document.getElementById('mapa-cv'), r = c.getBoundingClientRect(), e = (t, id, x, y) => c.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: r.left + x * r.width, clientY: r.top + y * r.height, bubbles: true, isPrimary: id === 1 })); a.forEach(([t, id, x, y]) => e(t, id, x, y)); }"
    v4 = pg.evaluate(V); pg.evaluate(ARR, [['pointerdown', 1, .8, .5], ['pointermove', 1, .3, .5], ['pointerup', 1, .3, .5]]); v5 = pg.evaluate(V)
    ok(v5[1] > v4[1] + 0.5 and v5[0] == 4, 'arrastrar con un dedo mueve la vista (x %.1f → %.1f casillas)' % (v4[1], v5[1]))
    pg.click('#mapa-menos'); pg.click('#mapa-menos'); pg.wait_for_timeout(150); v6 = pg.evaluate(V); ok(v6 == [1, 0, 0], 'el botón － vuelve al mapa entero (%s)' % v6)
    pg.evaluate(ARR, [['pointerdown', 1, .45, .5], ['pointerdown', 2, .55, .5], ['pointermove', 2, .75, .5], ['pointermove', 1, .25, .5], ['pointerup', 1, .25, .5], ['pointerup', 2, .75, .5]]); v7 = pg.evaluate(V)
    ok(v7[0] > 2, 'pellizcar con dos dedos acerca el mapa (%.1f×)' % v7[0])
    pg.evaluate("() => { const c = document.getElementById('mapa-cv'), r = c.getBoundingClientRect(); c.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true })); c.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true })); }"); ok(pg.evaluate(V)[0] < v7[0], 'la rueda del ratón aleja')
    pg.click('#mapa-x'); pg.click('#minib'); pg.wait_for_timeout(200); ok(pg.evaluate(V)[0] == 1, 'al volver a abrir el mapa empieza sin zoom')
    # v2.75 · tocar un lugar: nombre + flecha en el borde del juego
    pg.evaluate("() => { const c = document.getElementById('mapa-cv'); c.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, clientX: 0, clientY: 0, bubbles: true })); }"); pg.evaluate("() => document.getElementById('mapa-cv').dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, clientX: 0, clientY: 0, bubbles: true }))")
    ok(pg.evaluate("() => window.G.minimapa.vivo.destino") is None and 'Toca un lugar' in pg.inner_text('#mapa-info'), 'al abrir el mapa no hay lugar elegido y el pie explica qué hacer')
    LUG = "(n) => { const m = window.__juego.mapa, l = window.G.minimapa.lugares(m).find((q) => q.nombre === n), c = document.getElementById('mapa-cv'), r = c.getBoundingClientRect(), v = window.G.minimapa.vivo.vista; return [r.left + (l.tx + 0.5 - v.x) / (m.W / v.z) * r.width, r.top + (l.ty + 0.5 - v.y) / (m.H / v.z) * r.height]; }"
    TOQUE = "([x, y]) => { const c = document.getElementById('mapa-cv'); c.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 5, clientX: x, clientY: y, bubbles: true, isPrimary: true })); c.dispatchEvent(new PointerEvent('pointerup', { pointerId: 5, clientX: x, clientY: y, bubbles: true, isPrimary: true })); }"
    pg.evaluate(TOQUE, pg.evaluate(LUG, 'Ermita')); pg.wait_for_timeout(250)
    d = pg.evaluate("() => window.G.minimapa.vivo.destino"); ok(d and d['nombre'] == 'Ermita', 'un toque en la Ermita la elige (%s)' % (d and d['nombre']))
    ok('Ermita' in pg.inner_text('#mapa-info') and 'casillas' in pg.inner_text('#mapa-info') and pg.is_visible('#mapa-quitar'), 'el pie dice su nombre y a cuántas casillas está, y sale «Quitar flecha»')
    pg.screenshot(path=os.path.join(sal, 'minimapa_v275_elegido_390x844.png'))
    pg.evaluate("() => { const c = document.getElementById('mapa-cv'), r = c.getBoundingClientRect(); const e = (t, x, y) => c.dispatchEvent(new PointerEvent(t, { pointerId: 6, clientX: r.left + x, clientY: r.top + y, bubbles: true, isPrimary: true })); e('pointerdown', 50, 50); e('pointermove', 90, 50); e('pointerup', 90, 50); }")
    ok(pg.evaluate("() => window.G.minimapa.vivo.destino") is not None, 'arrastrar con un dedo no cuenta como toque (no cambia ni quita el lugar)')
    pg.click('#mapa-x'); pg.wait_for_timeout(400)
    FL = "() => { const c = document.getElementById('flecha'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, y = 0, sx = 0, sy = 0; for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) { const k = (j * c.width + i) * 4; if (d[k+3] > 200 && d[k] > 240 && d[k+1] > 190 && d[k+1] < 230 && d[k+2] < 100) { n++; sx += i; sy += j; } } return { n, x: n ? sx / n / c.width : -1, y: n ? sy / n / c.height : -1, w: c.width, h: c.height }; }"
    f = pg.evaluate(FL); ok(f['n'] > 60, 'con el mapa cerrado se ve la flecha amarilla en la pantalla del juego (%d px)' % f['n'])
    ok(f['x'] > 0.6, 'la Ermita está al este de Oli y la flecha está en la mitad derecha (x = %.2f de la pantalla)' % f['x'])
    pg.screenshot(path=os.path.join(sal, 'minimapa_v275_flecha_390x844.png'))
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(1200); pg.keyboard.up('ArrowRight'); pg.wait_for_timeout(200)
    j = pg.evaluate("() => { const J = window.__juego, o = J.est.jugadores.oli; return [o.x / 16, o.y / 16, J.mapa.id]; }"); f2 = pg.evaluate(FL)
    ok(f2['n'] > 60, 'al andar hacia allí la flecha sigue (Oli en la casilla %.0f,%.0f)' % (j[0], j[1]))
    # teletransporte junto al lugar: la flecha se quita sola al llegar
    pg.evaluate("() => { const d = window.G.minimapa.vivo.destino, o = window.__juego.est.jugadores.oli; o.x = d.tx * 16; o.y = d.ty * 16; }"); pg.wait_for_timeout(300)
    ok(pg.evaluate("() => window.G.minimapa.vivo.destino") is None and pg.evaluate(FL)['n'] == 0, 'al llegar al lugar la flecha se quita sola')
    # volver a elegir, «Quitar flecha» y tocar sitio vacío
    pg.click('#minib'); pg.wait_for_timeout(200); pg.evaluate(TOQUE, pg.evaluate(LUG, 'Tienda')); pg.wait_for_timeout(150); pg.click('#mapa-quitar'); pg.wait_for_timeout(150)
    ok(pg.evaluate("() => window.G.minimapa.vivo.destino") is None and pg.is_hidden('#mapa-quitar') and 'Toca un lugar' in pg.inner_text('#mapa-info'), '«Quitar flecha» borra el lugar elegido')
    pg.evaluate(TOQUE, pg.evaluate(LUG, 'Tienda')); pg.wait_for_timeout(150); r = pg.eval_on_selector('#mapa-cv', 'e => { const r = e.getBoundingClientRect(); return [r.left + 4, r.top + 4]; }'); pg.evaluate(TOQUE, r); pg.wait_for_timeout(150)
    ok(pg.evaluate("() => window.G.minimapa.vivo.destino") is None, 'tocar un sitio sin lugares también quita la elección')
    pg.evaluate(TOQUE, pg.evaluate(LUG, 'Tienda')); pg.wait_for_timeout(100)
    pg.click('#mapa-mas'); pg.wait_for_timeout(100); pg.evaluate(TOQUE, pg.evaluate(LUG, 'Tienda')); pg.wait_for_timeout(100)
    ok(pg.evaluate("() => window.G.minimapa.vivo.destino && window.G.minimapa.vivo.destino.nombre") == 'Tienda', 'con zoom también se puede tocar un lugar')
    pg.click('#mapa-quitar'); pg.click('#mapa-x'); pg.click('#minib'); pg.wait_for_timeout(200); ok(pg.evaluate(V)[0] == 1, 'al volver a abrir el mapa empieza sin zoom')
    pg.click('#mapa-x'); pg.wait_for_timeout(150); ok(pg.is_hidden('#mapa'), 'la ✕ cierra el mapa grande')
    pg.keyboard.press('m'); pg.wait_for_timeout(150); ok(pg.is_visible('#mapa'), 'la tecla M lo abre'); pg.keyboard.press('m'); pg.wait_for_timeout(150); ok(pg.is_hidden('#mapa'), 'y la tecla M lo cierra')
    pg.click('#minib'); pg.wait_for_timeout(150); pg.mouse.click(3, 400); pg.wait_for_timeout(150); ok(pg.is_hidden('#mapa'), 'tocar fuera del mapa lo cierra')
    # el propio punto cambia de jugador: con Lali el grande es el azul
    pg.goto('file://' + html + '?menu=1'); pg.wait_for_timeout(300); pg.click('[data-pick=lali]'); pg.wait_for_timeout(600)
    ml = pg.evaluate(PIX, 'mini'); ok(ml['lali']['n'] > ml['oli']['n'] and ml['oli']['n'] > 0, 'jugando con Lali, el punto grande es el de Lali (%d contra %d px)' % (ml['lali']['n'], ml['oli']['n']))
    b.close()
print('\n'.join(log)); print('RESULTADO:', 'TODO BIEN' if not err else str(len(err)) + ' problema(s)')
for e in err: print(' -', e)
sys.exit(1 if err else 0)
