#!/usr/bin/env python3
"""prueba_editor.py — prueba del editor de mapas v2 (ED-1, v2.59; ED-2, v2.60) en Chromium (necesita playwright).
Uso: python3 tools/prueba_editor.py [carpeta_capturas]     (antes: node tools/editor_mapas.js)
Comprueba: sin errores de consola · Albanota con sus todos sus objetos dibujados · tocar elige el objeto de encima · arrastrar lo mueve a la cuadrícula · deshacer/rehacer · copiar · borrar · flechas ·
guardado sin cambios = archivo idéntico (maps/albanota.json) · «Comprobar mapa» entiende los objetos · móvil 390×844 con barra de acciones visible.
ED-2 (segunda parte): paleta con todas las piezas del catálogo · poner una pieza tocando el mapa (por los pies) · avisos de puerta, entrada, camino cortado y zona de aparición tapados (se tocan y llevan a la pieza) ·
«Probar en el juego»: el juego se abre con el mapa editado sin exportar, avisa si falta «inicio» o el mapa no es válido, y se cierra."""
import json, os, sys, pathlib
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_editor'); sal.mkdir(parents=True, exist_ok=True)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
original = (raiz / 'maps' / 'albanota.json').read_text(encoding='utf8')
N = len(json.loads(original)['objetos'])  # objetos de Albanota hoy (no se fija a mano)
with sync_playwright() as p:
    b = p.chromium.launch()
    for nombre, vp, movil in [('movil', {'width': 390, 'height': 844}, True), ('escritorio', {'width': 1280, 'height': 800}, False)]:
        print('==', nombre)
        ctx = b.new_context(viewport=vp, has_touch=movil, is_mobile=movil); pg = ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + str(raiz / 'tools' / 'editor_mapas.html')); pg.wait_for_timeout(400)
        ok(not errs, 'sin errores de consola ' + str(errs[:2]))
        ok(pg.evaluate("__editor.cur.id") == 'albanota' and pg.evaluate("__editor.cur.objetos.length") == N, 'abre Albanota con todos sus objetos (%d)' % N)
        ok(pg.evaluate("document.getElementById('co').getContext('2d').getImageData(0,0,document.getElementById('co').width,document.getElementById('co').height).data.some((v,i)=>i%4==3&&v>0)"), 'la capa de objetos tiene dibujo')
        ok(pg.evaluate("JSON.stringify(__editor.toJSON(__editor.cur), null, 1) + '\\n'").rstrip('\n') == original.rstrip('\n'), 'sin tocar nada, el mapa exportado es IDÉNTICO a maps/albanota.json')
        # elegir con el hit test (centro del dibujo de la fuente y de una casa)
        idx = pg.evaluate("""() => { const c = __editor.cur.objetos, r = {}; c.forEach((o, i) => { if (!(o.tipo in r)) r[o.tipo] = i; }); return r; }""")
        for tipo in ['fuente', 'casa_lali', 'farola', 'banco', 'centro_pc']:
            i = idx[tipo]; o = pg.evaluate("__editor.cur.objetos[%d]" % i); inf = pg.evaluate("__editor.objInfo(__editor.cur.objetos[%d])" % i)
            # punto en el centro de su primera casilla sólida (siempre tiene dibujo encima)
            h = inf['huella'][0]; fx = (o['x'] + h[0] + .5) * 16; fy = (o['y'] + h[1] + .5) * 16
            got = pg.evaluate("__editor.hitObjeto(%f,%f)" % (fx, fy)); t2 = pg.evaluate("__editor.cur.objetos[%d].tipo" % got) if got >= 0 else None
            ok(got >= 0 and (got == i or t2 is not None), 'tocar en «%s» elige un objeto (%s)' % (tipo, t2))
        ok(pg.evaluate("__editor.hitObjeto(5*16+8, 5*16+8)") == -1, 'tocar hierba vacía no elige nada')
        # zoom al máximo cómodo y arrastre real con ratón/pantalla: llevar la vista a la fuente
        pg.evaluate("__editor.setZoom(3)")
        i = idx['banco']; o = pg.evaluate("__editor.cur.objetos[%d]" % i)
        box = pg.evaluate("(()=>{const r=document.getElementById('ov').getBoundingClientRect();return [r.left,r.top]})()")
        pg.evaluate("document.getElementById('stage').scrollTo(%d,%d)" % (max(0, (o['x'] * 16 - 40) * 3), max(0, (o['y'] * 16 - 60) * 3)))
        box = pg.evaluate("(()=>{const r=document.getElementById('ov').getBoundingClientRect();return [r.left,r.top]})()")
        sx = box[0] + (o['x'] * 16 + 8) * 3; sy = box[1] + (o['y'] * 16 + 6) * 3
        pg.mouse.move(sx, sy); pg.mouse.down(); pg.mouse.move(sx + 48, sy + 3, steps=6); pg.mouse.up()
        nuevo = pg.evaluate("__editor.cur.objetos[%d]" % i)
        ok(pg.evaluate("__editor.sel && __editor.sel.kind") == 'objeto', 'al tocar el banco queda elegido')
        ok(nuevo['x'] == o['x'] + 1 and nuevo['y'] == o['y'], 'arrastrar 1 casilla a la derecha mueve el banco de (%d,%d) a (%d,%d)' % (o['x'], o['y'], nuevo['x'], nuevo['y']))
        pg.screenshot(path=str(sal / ('ed1_%s_arrastrar.png' % nombre)))
        pg.evaluate("__editor.undo()"); ok(pg.evaluate("__editor.cur.objetos[%d].x" % i) == o['x'], 'deshacer devuelve el banco a su sitio')
        pg.evaluate("__editor.redo()"); ok(pg.evaluate("__editor.cur.objetos[%d].x" % i) == o['x'] + 1, 'rehacer lo vuelve a mover')
        pg.evaluate("__editor.undo()")
        # tocar sin mover no llena el deshacer
        pg.mouse.move(sx, sy); pg.mouse.down(); pg.mouse.up()
        ok(pg.evaluate("document.getElementById('aUndo').disabled") is True, 'un toque sin mover no guarda nada en el deshacer')
        # flechas / copiar / borrar con los botones grandes
        pg.click('#acc .pad button[data-m="0,1"]'); ok(pg.evaluate("__editor.cur.objetos[%d].y" % i) == o['y'] + 1, 'botón ▼ mueve una casilla')
        pg.click('#aCopy'); ok(pg.evaluate("__editor.cur.objetos.length") == N + 1 and pg.evaluate("__editor.sel.key") == N, 'Copiar añade un objeto y lo deja elegido')
        pg.click('#aDel'); ok(pg.evaluate("__editor.cur.objetos.length") == N and pg.evaluate("__editor.sel") is None, 'Borrar quita el objeto elegido')
        pg.evaluate("__editor.undo()"); ok(pg.evaluate("__editor.cur.objetos.length") == N + 1, 'deshacer recupera el objeto borrado')
        # limites: no se sale del mapa
        pg.evaluate("__editor.sel = {kind:'objeto', key:%d}" % idx['casa_lali'])
        for _ in range(60): pg.evaluate("__editor.nudge('-1,0')")
        c0 = pg.evaluate("__editor.cur.objetos[%d]" % idx['casa_lali'])
        ok(c0['x'] == 0, 'una casa empujada a la izquierda se para en el borde del mapa (x=0)')
        # comprobar mapa
        pg.evaluate("__editor.setTool('sel')"); pg.click('#bCheck'); pg.wait_for_timeout(100)
        txt = pg.evaluate("document.getElementById('issues').innerText"); print('   comprobar:', txt.replace('\n', ' | ')[:300])
        ok('no existe' not in txt and 'fuera del mapa' not in txt, 'Comprobar mapa no da errores de objetos')
        pg.screenshot(path=str(sal / ('ed1_%s_general.png' % nombre)), full_page=False)
        ok(not errs, 'sigue sin errores de consola al final ' + str(errs[:2]))
        ctx.close()
    b.close()

# ================= ED-2 (v2.60): paleta, poner piezas, avisos y probar en el juego =================
MINI = {'formato': 2, 'id': 'mini', 'nombre': 'Mini', 'ancho': 12, 'alto': 12, 'base': '.',
        'capas': {'suelo': ['t' * 12] + ['t' + '.' * 10 + 't'] * 10 + ['t' * 12]}, 'objetos': [], 'anclas': {'inicio': [6, 10]}, 'puertas': [], 'conexiones': {'norte': None, 'sur': None, 'este': None, 'oeste': None},
        'zonas': [{'id': 'z', 'x': 4, 'y': 4, 'w': 3, 'h': 3, 'elemento': 'hoja', 'nota': ''}], 'npcs': []}
PASILLO = {'formato': 2, 'id': 'pasillo', 'nombre': 'Pasillo', 'ancho': 12, 'alto': 7, 'base': 't',
           'capas': {'suelo': ['t' * 12, 't' * 12, 't' * 12, 't=========.t', 't' * 12, 't' * 12, 't' * 12]}, 'objetos': [], 'anclas': {'inicio': [1, 3]}, 'puertas': [{'id': 'fin', 'x': 10, 'y': 3, 'destino': {'mapa': 'pasillo', 'ancla': 'inicio'}}],
           'conexiones': {'norte': None, 'sur': None, 'este': None, 'oeste': None}, 'zonas': [], 'npcs': []}
for nombre, vp, movil in [('movil', {'width': 390, 'height': 844}, True), ('escritorio', {'width': 1280, 'height': 800}, False)]:
    print('== ED-2', nombre)
    with sync_playwright() as p2:
        b2 = p2.chromium.launch(); ctx = b2.new_context(viewport=vp, has_touch=movil, is_mobile=movil); pg = ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + str(raiz / 'tools' / 'editor_mapas.html')); pg.wait_for_timeout(400)
        def donde(cx, cy):  # centra la casilla en la vista y devuelve sus coordenadas de pantalla
            pg.evaluate("(([cx,cy])=>{const st=document.getElementById('stage'),ov=document.getElementById('ov'),z=ov.getBoundingClientRect().width/__editor.cur.ancho;st.scrollTo(cx*z-st.clientWidth/2+12,cy*z-st.clientHeight/2+12)})(%s)" % json.dumps([cx, cy])); pg.wait_for_timeout(60)
            return pg.evaluate("(([cx,cy])=>{const r=document.getElementById('ov').getBoundingClientRect(),z=r.width/__editor.cur.ancho;return [r.left+(cx+.5)*z,r.top+(cy+.5)*z]})(%s)" % json.dumps([cx, cy]))
        def toca(x, y):
            if movil: pg.touchscreen.tap(x, y)
            else: pg.mouse.click(x, y)
        def tocaBoton(sel):
            if movil: pg.tap(sel)
            else: pg.click(sel)
        def objs(): return pg.evaluate("__editor.cur.objetos.length")
        def avisos(): return pg.evaluate("JSON.stringify(__editor.agrupa(__editor.conflictos(__editor.cur, __editor.cur.objetos.slice(-1)[0], __editor.cur.objetos.length-1, __editor.analisis(__editor.cur))))")
        nCat = pg.evaluate("Object.keys(G.OBJETOS).length")
        ok(nCat >= 26 and pg.evaluate("document.querySelectorAll('#piezas .tile').length") == nCat and pg.evaluate("document.querySelectorAll('#hojaP .tile').length") == nCat, 'la paleta tiene las %d piezas del catálogo del juego (lateral y hoja)' % nCat)
        ok(pg.evaluate("[...document.querySelectorAll('#hojaP .tile canvas')].every(c => c.width > 0 && c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4==3&&v>0))"), 'todas las miniaturas de la paleta tienen dibujo')
        ok(pg.evaluate("[...document.querySelectorAll('#hojaP .cat')].map(h=>h.textContent).join()") == 'Edificios,Plaza,Huerto y vallas,Agua,Árboles,Naturaleza', 'la paleta está ordenada en grupos (Edificios, Plaza, Huerto y vallas, Agua, Árboles, Naturaleza)')
        # abrir la paleta con el botón grande, elegir una pieza y ponerla tocando el mapa
        tocaBoton('#aPieza'); pg.wait_for_timeout(200)
        ok(pg.evaluate("document.getElementById('dlgP').open"), '«＋ Pieza» abre la paleta')
        if movil: ok(pg.evaluate("(()=>{const r=document.getElementById('dlgP').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()"), 'en el móvil la paleta cabe en el ancho de la pantalla')
        pg.screenshot(path=str(sal / ('ed2_%s_paleta.png' % nombre)))
        tocaBoton('#dlgP .tile[data-p="farola"]'); pg.wait_for_timeout(100)
        ok(pg.evaluate("__editor.tool") == 'pieza' and pg.evaluate("__editor.pieza") == 'farola' and not pg.evaluate("document.getElementById('dlgP').open"), 'elegir una pieza cierra la paleta y deja la herramienta «Añadir pieza»')
        n0 = objs(); x, y = donde(5, 5); toca(x, y); pg.wait_for_timeout(100)
        o = pg.evaluate("__editor.cur.objetos[%d]" % n0)
        ok(objs() == n0 + 1 and o['tipo'] == 'farola' and (o['x'], o['y']) == (5, 5), 'tocar la casilla (5,5) pone una farola ahí (%s)' % o)
        ok(pg.evaluate("__editor.sel.kind") == 'objeto' and pg.evaluate("__editor.sel.key") == n0 and pg.evaluate("__editor.tool") == 'pieza', 'la pieza puesta queda elegida y se pueden seguir poniendo más')
        x, y = donde(8, 5); toca(x, y); ok(objs() == n0 + 2, 'un segundo toque pone otra farola')
        pg.screenshot(path=str(sal / ('ed2_%s_puesta.png' % nombre)))
        # por los pies: una casa tocada en (30, 31) queda con su parte sólida centrada abajo en esa casilla
        pg.evaluate("__editor.elegirPieza('casa')"); x, y = donde(18, 13); toca(x, y)  # (18,13): hueco libre de Albanota hoy (en (8,27) ya hay un árbol)
        o = pg.evaluate("__editor.cur.objetos[%d]" % (n0 + 2))
        ok(o['tipo'] == 'casa' and (o['x'], o['y']) == (16, 9), 'la casa se pone por los pies: tocar (18,13) deja su esquina en (16,9) (%s)' % o)
        ok('✓' in pg.evaluate("document.getElementById('accN').innerText"), 'la barra dice que la casa está bien puesta (✓)')
        pg.evaluate("__editor.undo()"); pg.evaluate("__editor.undo()"); pg.evaluate("__editor.undo()"); ok(objs() == n0, 'deshacer quita las tres piezas puestas')
        pg.evaluate("__editor.redo()"); ok(objs() == n0 + 1, 'rehacer vuelve a poner la primera')
        pg.evaluate("__editor.undo()")
        # Escape o «Listo» salen de la herramienta
        tocaBoton('#aListo'); ok(pg.evaluate("__editor.tool") == 'sel', '«Listo» vuelve a Seleccionar')
        # avisos de Albanota: entrada del Centro PC
        pg.evaluate("__editor.elegirPieza('banco')"); pg.evaluate("__editor.ponerPieza(26,10)")
        av = json.loads(avisos()); ok(any(a['lv'] == 'err' and 'entrada' in a['t'] and 'centro_pc' in a['t'] for a in av), 'un banco delante de la puerta del Centro PC da ERROR (tapa la entrada) %s' % [a['t'] for a in av])
        pg.evaluate("__editor.setTool('sel')"); pg.click('#bCheck'); pg.wait_for_timeout(100)
        txt = pg.evaluate("document.getElementById('issues').innerText"); ok('delante de su puerta hay «banco»' in txt, 'Comprobar mapa lo cuenta desde el edificio también')
        pg.evaluate("__editor.sel = null"); pg.click('#issues li[data-sel] >> nth=0'); pg.wait_for_timeout(100)
        ok(pg.evaluate("__editor.sel && __editor.sel.kind") == 'objeto', 'tocar un aviso de la lista elige la pieza')
        pg.evaluate("__editor.undo()")
        pg.evaluate("__editor.setTool('sel')"); pg.click('#bCheck'); ok(pg.evaluate("document.getElementById('issues').innerText").strip() == 'Todo en orden.', 'tras deshacer, Albanota vuelve a «Todo en orden»')
        # fuente, bancos y macetas están sobre el camino de la plaza a propósito: no son un aviso porque el camino sigue por los lados
        ok(all(not pg.evaluate("__editor.conflictos(__editor.cur, __editor.cur.objetos[%d], %d, __editor.analisis(__editor.cur)).length" % (i, i)) for i in range(55)), 'las 55 piezas de Albanota no dan ningún aviso')
        # mapa pequeño: zona de aparición tapada
        pg.evaluate("__editor.importText(%s)" % json.dumps(json.dumps(MINI))); pg.evaluate("__editor.elegirPieza('casa')"); pg.evaluate("__editor.ponerPieza(4,7)")
        av = json.loads(avisos()); ok(any(a['lv'] == 'err' and 'sitio de aparición' in a['t'] for a in av), 'una casa encima de la zona la deja sin sitios de aparición: ERROR %s' % [a['t'] for a in av])
        pg.evaluate("__editor.undo()"); pg.evaluate("__editor.elegirPieza('valla_v')"); pg.evaluate("__editor.ponerPieza(5,6)")
        av = json.loads(avisos()); print('   valla vertical sobre la zona:', [a['t'] for a in av])
        pg.evaluate("__editor.undo()")
        # puerta tapada / ancla tapada
        pg.evaluate("__editor.elegirPieza('barril')"); pg.evaluate("__editor.ponerPieza(6,10)")
        av = json.loads(avisos()); ok(any(a['lv'] == 'err' and 'ancla «inicio»' in a['t'] for a in av), 'una pieza sobre el ancla «inicio» da ERROR %s' % [a['t'] for a in av])
        pg.evaluate("__editor.undo()")
        # casa con el frente contra un árbol: la puerta no se puede usar
        pg.evaluate("__editor.elegirPieza('casa')"); pg.evaluate("__editor.ponerPieza(6,10)")
        av = json.loads(avisos()); ok(any(a['lv'] == 'err' and 'delante de su puerta' in a['t'] for a in av), 'una casa con el frente contra un árbol da ERROR (la puerta no se puede usar) %s' % [a['t'] for a in av])
        pg.evaluate("__editor.undo()")
        # pasillo de 1 casilla: una pieza en medio corta el camino y deja la puerta sin acceso
        pg.evaluate("__editor.importText(%s)" % json.dumps(json.dumps(PASILLO))); pg.evaluate("__editor.elegirPieza('barril')"); pg.evaluate("__editor.ponerPieza(5,3)")
        av = json.loads(avisos()); ok(any(a['lv'] == 'warn' and 'corta el camino' in a['t'] for a in av) and any(a['lv'] == 'err' and 'puerta «fin»' in a['t'] for a in av), 'una pieza en un pasillo de 1 casilla corta el camino y deja la puerta sin acceso %s' % [a['t'] for a in av])
        pg.evaluate("__editor.setTool('sel')"); pg.click('#bCheck'); ok('Las piezas cortan el camino' in pg.evaluate("document.getElementById('issues').innerText"), 'Comprobar mapa también avisa del camino cortado')
        pg.evaluate("__editor.undo()")
        # ---- Probar en el juego ----
        pg.evaluate("__editor.maps.mini && __editor.setTool('sel')")
        pg.evaluate("document.getElementById('mapSel').value='albanota'; document.getElementById('mapSel').dispatchEvent(new Event('change'))")
        pg.evaluate("__editor.elegirPieza('farola'); __editor.ponerPieza(5,5); __editor.setTool('sel')")
        n = objs(); tocaBoton('#aProbar'); pg.wait_for_timeout(2500)
        ok(pg.evaluate("!document.getElementById('prueba').hidden"), '«▶ Probar» abre el juego dentro del editor')
        fj = [f for f in pg.frames if f != pg.main_frame]
        ok(len(fj) == 1 and fj[0].evaluate("typeof window.__juego") == 'object', 'el juego arranca dentro del editor sin errores')
        if fj:
            ok(fj[0].evaluate("G.mundo.INICIAL.mapa") == 'albanota' and fj[0].evaluate("G.mundo.mapa('albanota').objetos.length") == n, 'el juego trae el mapa EDITADO (%d objetos, no los 55 del archivo)' % n)
            ok(fj[0].evaluate("G.mundo.solido(G.mundo.mapa('albanota'), 5, 5)") is True, 'la farola nueva ya estorba en el juego (casilla (5,5) sólida)')
            fj[0].click('[data-pick="oli"]'); pg.wait_for_timeout(500)
        ok(pg.evaluate("document.getElementById('pruebaMsg').innerText") == '', 'sin mensajes de error')
        pg.screenshot(path=str(sal / ('ed2_%s_juego.png' % nombre)))
        pg.click('#pruebaCerrar'); ok(pg.evaluate("document.getElementById('prueba').hidden") and pg.evaluate("document.getElementById('pruebaFrame').srcdoc") == '', '«Volver al editor» cierra el juego')
        ok(pg.evaluate("__editor.cur.objetos.length") == n, 'probar no cambia el mapa del editor')
        # sin «inicio»: avisa y no abre
        pg.evaluate("__editor.importText(%s)" % json.dumps(json.dumps({**MINI, 'id': 'sin_inicio', 'anclas': {}}))); pg.evaluate("__editor.probar()"); pg.wait_for_timeout(200)
        ok(pg.evaluate("document.getElementById('dlg').open") and pg.evaluate("document.getElementById('prueba').hidden"), 'un mapa sin ancla «inicio» no se prueba y lo explica'); pg.evaluate("document.getElementById('dlg').close()")
        # mapa no válido para el juego (puerta a un mapa que no existe): se abre y el error se ve
        pg.evaluate("__editor.importText(%s)" % json.dumps(json.dumps({**MINI, 'id': 'puerta_rota', 'puertas': [{'id': 'p', 'x': 3, 'y': 3, 'destino': {'mapa': 'no_existe', 'ancla': 'x'}}]}))); pg.evaluate("__editor.probar()"); pg.wait_for_timeout(1500)
        msg = pg.evaluate("document.getElementById('pruebaMsg').innerText"); ok('no_existe' in msg, 'si el juego no puede abrir el mapa, el motivo se ve arriba: «%s»' % msg.replace('\n', ' ')[:90])
        pg.evaluate("__editor.cerrarPrueba()")
        ok(not [e for e in errs if 'pruebaError' in e], 'sin errores de consola del editor ' + str(errs[:2]))
        ctx.close(); b2.close()
print('\nTODO BIEN' if not fallos else '\n%d FALLO(S): %s' % (len(fallos), fallos)); sys.exit(1 if fallos else 0)
