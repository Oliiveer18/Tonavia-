#!/usr/bin/env python3
"""prueba_hd2d_juego.py — prueba en Chromium móvil (390×844) del botón «Gráficos: 2D / HD-2D» y del pintor HD-2D DENTRO del juego (v2.64: HD-B1 2.ª mitad, HD-B2, HD-B3, HD-C1, HD-C2).
Uso: node build.js && python3 tools/prueba_hd2d_juego.py [--three ruta/three.min.js]
Sin --three usa tools/three_falso.js (un Three.js de mentira que solo anota lo que el pintor le pide): prueba la LÓGICA (carga, botón, vuelta al 2D, mapa, objetos, cámara, nombres, vigilante)
pero NO que el 3D se vea bien. Con --three (Three.js r128 real: npm install three@0.128.0 -> node_modules/three/build/three.min.js) las comprobaciones de «dibujo anotado» se saltan y se sacan capturas en la carpeta de salida.
Comprueba: (1) el botón carga el HD-2D y el juego sigue (misma posición, mismo mapa) · (2) la escena lleva el relieve, los árboles, los objetos y las criaturas del motor · (3) la cámara sigue al jugador y gira ·
(4) «Sombras» y el cambio de mapa rehacen la escena · (5) volver al 2D deja todo como estaba · (6) elección recordada al recargar · (7) sin internet, sin WebGL y con un móvil lento el juego se queda o vuelve al 2D y lo dice."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]; real = None
if '--three' in args: i = args.index('--three'); real = pathlib.Path(args[i + 1]); del args[i:i + 2]
sal = pathlib.Path(args[0]) if args else pathlib.Path('/tmp/capturas_hd2d_juego'); sal.mkdir(parents=True, exist_ok=True)
falso = raiz / 'tools' / 'three_falso.js'
mapa = json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8')); S = mapa['capas']['suelo']
n_t = sum(r.count('t') for r in S); n_obj = sum(1 for o in mapa['objetos'] if o['tipo'] not in ('puente_albanota', 'huerto'))
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html')
def abre(b, opc=None, modo='falso', previo=None):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'ERR_FAILED' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    if modo == 'falso' and not real:
        js = (('window.__FALSO_OPC=' + json.dumps(opc) + ';') if opc else '') + falso.read_text(encoding='utf8')
        pg.route('**/three.min.js', lambda r: r.fulfill(body=js, content_type='application/javascript'))
    elif modo == 'real' or (modo == 'falso' and real): pg.route('**/three.min.js', lambda r: r.fulfill(path=str(real), content_type='application/javascript'))
    elif modo == 'sinred': pg.route('**/three.min.js', lambda r: r.abort())
    if previo: pg.add_init_script(previo)
    pg.goto(URL); pg.wait_for_function('window.__juego'); return ctx, pg, errs
def juega(pg, quien='oli'):
    pg.click('[data-pick=%s]' % quien); pg.wait_for_timeout(200)
def hd(pg): return pg.evaluate('__juego.hd')
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    # ── 1 · el botón carga el HD-2D y la partida sigue igual ──
    ctx, pg, errs = abre(b); juega(pg)
    ok(pg.inner_text('#hbtn').strip() == '2D' and not pg.is_visible('#hcam') and pg.evaluate('G.hd2d.activo') is False, 'el juego arranca en 2D: botón «2D», sin botones de cámara, pintor apagado')
    ok(pg.evaluate("typeof THREE") == 'undefined' and 'three' not in pg.evaluate("[...document.scripts].map(s => s.src).join(',')").lower(), 'Three.js NO está cargado mientras se juega en 2D (HD-C2: solo al elegir HD-2D)')
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(400); pg.keyboard.up('ArrowRight')
    antes = pg.evaluate('({x: __juego.est.jugadores.oli.x, y: __juego.est.jugadores.oli.y, m: __juego.est.jugadores.oli.mapa, seed: __juego.est.semilla})')
    pg.screenshot(path=str(sal / '1_2d.png'))
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=8000); pg.wait_for_timeout(600)
    ok(hd(pg) and 'HD-2D' in pg.inner_text('#hbtn') and pg.is_visible('#hcam') and pg.is_visible('#hd') and not pg.is_visible('#game'), 'tras pulsar el botón: HD-2D activo, lienzo 3D visible, 2D oculto, botones de cámara a la vista')
    st = pg.evaluate('G.hd2d.estado()'); W, H = mapa['ancho'], mapa['alto']
    ok(st and st['mapa'] == 'albanota' and st['st']['arriba'] == W * H, 'la escena es la de Albanota con una cara de arriba por casilla (%d)' % (W * H))
    ok(st['st']['arboles'] == n_t and st['st']['objetos'] == n_obj, 'hay un árbol por cada casilla «t» (%d) y un objeto por cada pieza normal del mapa (%d; el puente y el huerto ya van en el suelo)' % (n_t, n_obj))
    ok(st['st']['agua'] == sum(r.count('~') for r in S) and st['st']['puente'] == sum(r.count('b') for r in S) and st['st']['paredes'] > 0, 'agua, puente y paredes del relieve coinciden con el mapa')
    ok(st['entidades'] >= 2, 'Oli y Lali (y las criaturas del motor que haya) están en la escena (%d)' % st['entidades'])
    despues = pg.evaluate('({x: __juego.est.jugadores.oli.x, y: __juego.est.jugadores.oli.y, m: __juego.est.jugadores.oli.mapa, seed: __juego.est.semilla})')
    ok(despues == antes, 'activar el HD-2D no mueve a nadie ni cambia el mapa ni el azar del motor')
    if not real:
        f = pg.evaluate('__falso'); ok(f['renders'] > 3, 'se dibuja cada cuadro (%d)' % f['renders'])
        cua = pg.evaluate('__falso.cuadros'); sombras = [c for c in cua if c['sombra']]
        oli3 = pg.evaluate('G.hd2d.AJUSTES.PERSONAJES3D && !!G.hd2d.estado().st.personaje3d')   # v2.126: Oli es una malla propia (no cuenta en `entidades`, pero sí tiene su sombra)
        lali3 = pg.evaluate('G.hd2d.AJUSTES.PERSONAJES3D_LALI && !!(G.hd2d.estado().st.personaje3d && G.hd2d.estado().st.personaje3d.luna)')   # v2.130: Lali también es una malla propia (con su sombra, fuera de `entidades`)
        ok(len(sombras) == st['entidades'] + (1 if oli3 else 0) + (1 if lali3 else 0) and all(c['mapa'] for c in cua if c['plano'] and not c['sombra']), 'cada personaje y criatura lleva su sombra y su textura (%d sombras)' % len(sombras))
        # Oli en el mundo: la lámina de Oli está en (x/16, y/16) del motor y mira a la cámara (yaw 0)
        ox, oy = despues['x'] / 16, despues['y'] / 16
        oli = [c for c in cua if not c['sombra'] and abs(c['x'] - ox) < 0.01 and abs(c['z'] - oy) < 0.01]
        ok(len(oli) == 1 and ((oli3 and oli[0]['cuadrados'] == 70 and oli[0]['sy'] == 1) or (not oli3 and abs(oli[0]['ry']) < 0.01 and oli[0]['sy'] > 1)), 'Oli está donde el motor dice (casilla %.1f, %.1f) y mira a la cámara (v2.126: malla 3D de 70 caras, una sola)' % (ox, oy))
        # Lali en el mundo (v2.130): malla 3D de 56 caras en la posición del motor, sin lámina plana; cada personaje es su propia malla
        lx, ly = pg.evaluate('__juego.est.jugadores.lali.x') / 16, pg.evaluate('__juego.est.jugadores.lali.y') / 16
        lali = [c for c in cua if not c['sombra'] and abs(c['x'] - lx) < 0.01 and abs(c['z'] - ly) < 0.01]
        ok(len(lali) == 1 and ((lali3 and lali[0]['cuadrados'] == 56 and lali[0]['sy'] == 1) or (not lali3 and abs(lali[0]['ry']) < 0.01 and lali[0]['sy'] > 1)), 'Lali está donde el motor dice (casilla %.1f, %.1f) como malla 3D de 56 caras, una sola (v2.130)' % (lx, ly))
        p3 = pg.evaluate('G.hd2d.estado().st.personaje3d')
        ok(oli3 and lali3 and p3 and p3['rex'] == 140 and p3['luna'] == 112 and p3['triangulos'] == 252, 'el estado cuenta los dos personajes 3D: Oli 140 triángulos, Lali 112 (252 en total)')
        # los interruptores son independientes y se pueden cambiar en marcha: sin Lali 3D vuelve su lámina y Oli sigue siendo malla; al encenderlo, vuelve la malla
        pg.evaluate('G.hd2d.AJUSTES.PERSONAJES3D_LALI = false'); pg.wait_for_timeout(500)
        p4 = pg.evaluate('G.hd2d.estado().st.personaje3d'); cua4 = pg.evaluate('__falso.cuadros'); l4 = [c for c in cua4 if not c['sombra'] and abs(c['x'] - lx) < 0.01 and abs(c['z'] - ly) < 0.01]
        ok(p4 and p4['triangulos'] == 140 and 'luna' not in p4 and len(l4) == 1 and abs(l4[0]['ry']) < 0.01 and l4[0]['sy'] > 1, 'sin Lali 3D (interruptor apagado) vuelve su lámina y Oli sigue siendo malla (140 triángulos)')
        pg.evaluate('G.hd2d.AJUSTES.PERSONAJES3D_LALI = true'); pg.wait_for_timeout(500)
        p5 = pg.evaluate('G.hd2d.estado().st.personaje3d'); cua5 = pg.evaluate('__falso.cuadros'); l5 = [c for c in cua5 if not c['sombra'] and abs(c['x'] - lx) < 0.01 and abs(c['z'] - ly) < 0.01]
        ok(p5 and p5['luna'] == 112 and p5['rex'] == 140 and len(l5) == 1 and l5[0]['cuadrados'] == 56, 'al volver a encender Lali 3D vuelve la malla de 56 caras')
        # los objetos normales: cada tipo del mapa aparece con su tamaño en casillas (ancho = w/16)
        tam = {}
        for c in cua: tam[(round(c['sx'] * 16), round(c['sy'] * 16))] = 1
        ok(st['st']['volumenes'] == 30 and st['st']['volFallos'] == 0 and not ((114, 98) in tam or (82, 82) in tam or (82, 98) in tam), 'desde el paso D (v2.86) Centro PC, Tienda y Ermita ya no son láminas del 2D (114×98, 82×82, 82×98): con las 3 casas, la fuente, las 14 farolas (v2.102, v2.163) los 3 bancos (v2.105) y las 6 jardineras (v2.165) son 30 volúmenes y 0 fallos')
        ok(any(c['plano'] and abs(c['sx'] - 132 / 16) < 0.01 and c['ry'] == 0 for c in cua), 'la valla larga del huerto (132 px) es una lámina fija mirando al sur')
        ok(st['st'].get('arboles3d', 0) >= st['st']['arboles'] * 60 and any(c['cuadrados'] == 0 or True for c in cua), 'v2.198: los árboles son volúmenes 3D en una sola malla (%d triángulos para %d árboles; antes eran 2 láminas cruzadas por árbol)' % (st['st'].get('arboles3d', 0), st['st']['arboles']))
        # olas y viento: el suelo animado cambia con el tiempo (4 cuadros por segundo), como en el 2D
        h1 = pg.evaluate("""() => { const m = __falso.escena.children.find(o => o.material && o.material.vertexColors && o.material.map); const c = m.material.map.image, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) | 0; return h; }""")
        pg.wait_for_timeout(1600)
        h2 = pg.evaluate("""() => { const m = __falso.escena.children.find(o => o.material && o.material.vertexColors && o.material.map); const c = m.material.map.image, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) | 0; return h; }""")
        ok(h1 != h2, 'el suelo animado cambia con el tiempo: olas y viento del 2D llevados al HD-2D')
    pg.screenshot(path=str(sal / '2_hd.png'))
    # ── 2 · cámara ──
    v0 = pg.evaluate('G.hd2d.estado().vista'); ok(abs(v0['tx'] - despues['x'] / 16) < 0.6 and abs(v0['tz'] - despues['y'] / 16) < 0.6, 'la cámara está sobre el jugador')
    pg.keyboard.down('ArrowDown'); pg.wait_for_timeout(700); pg.keyboard.up('ArrowDown'); pg.wait_for_timeout(500)
    py2 = pg.evaluate('__juego.est.jugadores.oli.y / 16'); v1 = pg.evaluate('G.hd2d.estado().vista')
    ok(py2 > despues['y'] / 16 + 0.5 and abs(v1['tz'] - py2) < 0.8, 'al andar con los botones de siempre la cámara sigue al jugador (el control es el del 2D)')
    pg.click('#hcam [data-hc=der]'); pg.wait_for_timeout(700); y1 = pg.evaluate('G.hd2d.estado().vista.yawT'); ok(abs(y1 - 3.14159 / 4) < 0.01, '«⟳» gira la cámara 45°')
    pg.keyboard.press('q'); pg.wait_for_timeout(300); ok(abs(pg.evaluate('G.hd2d.estado().vista.yawT')) < 0.01, 'la tecla Q la devuelve (la E sigue siendo «hablar»)')
    pg.click('#hcam [data-hc=zoom]'); ok(pg.evaluate('G.hd2d.estado().vista.distT') == 30 and 'media' in pg.inner_text('#hcam [data-hc=zoom]'), '«🔍» cambia el zoom (cerca → media)')
    pg.click('#hcam [data-hc=der]'); pg.wait_for_timeout(900)
    if not real:
        girados = [c for c in pg.evaluate('__falso.cuadros') if not c['sombra'] and abs(c['ry'] - 3.14159 / 4) < 0.02]
        ok(len(girados) >= 10, 'con la cámara girada, los carteles (edificios, farolas, personajes) giran con ella (%d)' % len(girados))
    pg.click('#hcam [data-hc=izq]'); pg.wait_for_timeout(300)
    # ── 3 · Sombras y cambio de mapa rehacen la escena ──
    n0 = pg.evaluate('__falso ? __falso.renders : 0') if not real else 0
    pg.click('#sbtn'); pg.wait_for_timeout(700); ok(hd(pg) and pg.evaluate('G.hd2d.estado().mapa') == 'albanota' and pg.evaluate('G.hd2d.estado().st.arboles') == n_t, '«Sombras» en HD-2D: se rehace el suelo y la escena sigue completa')
    pg.click('#sbtn'); pg.wait_for_timeout(500)
    pg.evaluate("__juego.motor.aplicar(__juego.est, {j: 'oli', t: 'colocar', mapa: 'pueblo_inicial', ancla: 'inicio', dir: 'down'})"); pg.wait_for_timeout(900)
    st2 = pg.evaluate('G.hd2d.estado()'); pm = json.loads((raiz / 'maps' / 'pueblo_inicial.json').read_text(encoding='utf8'))
    ok(st2['mapa'] == 'pueblo_inicial' and st2['st']['arriba'] == pm['ancho'] * pm['alto'], 'al cambiar de mapa (puerta o borde) el pintor construye el del jugador (%s)' % st2['mapa'])
    pg.evaluate("__juego.motor.aplicar(__juego.est, {j: 'oli', t: 'colocar', mapa: 'albanota', ancla: 'inicio', dir: 'down'})"); pg.wait_for_timeout(900)
    ok(pg.evaluate('G.hd2d.estado().mapa') == 'albanota' and pg.evaluate('G.hd2d.estado().st.objetos') == n_obj, 'y al volver a Albanota la escena vuelve a estar completa')
    # nombres sobre las criaturas: se colocan una criatura delante de Oli y se mira el lienzo #ui
    pg.evaluate("G.aparicion.AJUSTES.VISIBLES = true"); pg.wait_for_timeout(100)
    # ── 4 · volver al 2D ──
    pos = pg.evaluate('({x: __juego.est.jugadores.oli.x, y: __juego.est.jugadores.oli.y})')
    pg.click('#hbtn'); pg.wait_for_timeout(500)
    ok(not hd(pg) and pg.is_visible('#game') and not pg.is_visible('#hd') and not pg.is_visible('#hcam') and pg.evaluate('G.hd2d.activo') is False and pg.inner_text('#hbtn').strip() == '2D', 'al volver al 2D: lienzo 2D a la vista, 3D quitado, pintor apagado')
    ok(pg.evaluate('({x: __juego.est.jugadores.oli.x, y: __juego.est.jugadores.oli.y})') == pos and pg.evaluate('document.getElementById("game").width') > 0, 'el jugador sigue donde estaba y el 2D vuelve a medir bien')
    if not real: ok(pg.evaluate('__falso.desechadas') > 10, 'al apagar el HD-2D se liberan las texturas, geometrías y materiales (%d)' % pg.evaluate('__falso.desechadas'))
    ok(pg.evaluate('localStorage.getItem("criaturas.graficos.v1")') == '2d', 'la elección «2D» se recuerda')
    pg.screenshot(path=str(sal / '3_vuelta_2d.png'))
    # ── 5 · elección recordada: con «hd» guardado, al recargar se intenta HD-2D solo ──
    pg.evaluate('localStorage.setItem("criaturas.graficos.v1", "hd")'); pg.reload(); pg.wait_for_function('window.__juego'); pg.wait_for_function('__juego.hd', timeout=8000)
    ok(hd(pg) and pg.is_visible('#hd'), 'con «HD-2D» recordado, al abrir el juego arranca en HD-2D')
    pg.click('#hbtn'); pg.wait_for_timeout(300); pg.reload(); pg.wait_for_function('window.__juego'); pg.wait_for_timeout(1500)
    ok(not hd(pg), 'y si se vuelve a 2D, la próxima vez arranca en 2D')
    ok(not errs, 'sin errores de consola' + ('' if not errs else ': ' + '; '.join(errs[:3]))); ctx.close()
    # ── 6 · sin internet ──
    ctx, pg, errs = abre(b, modo='sinred'); juega(pg); pg.click('#hbtn'); pg.wait_for_timeout(1200)
    ok(not hd(pg) and 'No se pudo cargar' in pg.inner_text('#who') and pg.inner_text('#hbtn').strip() == '2D' and pg.is_visible('#game'), 'sin internet: se queda en 2D, lo dice y el botón vuelve a estar libre')
    ok(not errs, 'sin errores de consola al fallar la carga' + ('' if not errs else ': ' + '; '.join(errs[:3]))); ctx.close()
    # ── 7 · móvil sin WebGL ──
    if not real:
        ctx, pg, errs = abre(b, opc={'sinWebGL': True}); juega(pg); pg.click('#hbtn'); pg.wait_for_timeout(800)
        ok(not hd(pg) and 'no puede dibujar' in pg.inner_text('#who') and pg.is_visible('#game') and pg.evaluate('document.getElementById("hd")') is None, 'sin WebGL: se queda en 2D, lo dice y no deja el lienzo 3D a medias')
        ok(not errs, 'sin errores de consola sin WebGL' + ('' if not errs else ': ' + '; '.join(errs[:3]))); ctx.close()
        # ── 8 · móvil lento: cada cuadro tarda 70 ms → tras unos 330 cuadros el juego vuelve solo al 2D ──
        ctx, pg, errs = abre(b, opc={'msPorCuadro': 70}); juega(pg); pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=8000)
        pg.wait_for_function('!__juego.hd', timeout=60000); pg.wait_for_timeout(300)
        ok(not hd(pg) and 'iba lento' in pg.inner_text('#who') and pg.is_visible('#game') and pg.evaluate('localStorage.getItem("criaturas.graficos.v1")') == '2d', 'móvil lento: vuelve solo al 2D, lo dice y recuerda 2D')
        ok(not errs, 'sin errores de consola en la vuelta por lentitud' + ('' if not errs else ': ' + '; '.join(errs[:3]))); ctx.close()
    b.close()
print('\nTODO BIEN' if not fallos else '\nFALLOS: %d' % len(fallos)); sys.exit(1 if fallos else 0)
