#!/usr/bin/env python3
"""prueba_mapas_juego.py — prueba en Chromium móvil (390×844) del camino completo editor → juego (v2.61). Necesita playwright.
Uso: node build.js && node tools/editor_mapas.js && python3 tools/prueba_mapas_juego.py [carpeta_capturas]
Comprueba: el editor exporta mapas_editor.json con marcador de versión · el botón «Mapas» y su ventana · un archivo malo se rechaza con el motivo y no cambia nada · uno bueno se guarda y el juego arranca con él (rótulo «Mapas del editor»)
· sigue ahí al recargar · se puede jugar · «Volver a los oficiales» (dos pulsaciones) deja el juego de fábrica · un paquete guardado que ya no vale no rompe el arranque."""
import json, pathlib, sys, tempfile
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
N = len(json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8'))['objetos'])  # objetos oficiales de Albanota hoy
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_mapas'); sal.mkdir(parents=True, exist_ok=True)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
tmp = pathlib.Path(tempfile.mkdtemp())
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); errs = []
    def pagina(url):
        pg = ctx.new_page(); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(500); return pg
    # 1) el editor exporta el paquete (con una edición: se borra un banco)
    ed = pagina('file://' + str(raiz / 'tools' / 'editor_mapas.html'))
    idx = ed.evaluate("__editor.cur.objetos.findIndex((o) => o.tipo === 'banco')")
    ed.evaluate("(i) => { __editor.sel = { kind: 'objeto', key: i }; __editor.deleteSel(); }", idx)
    texto = ed.evaluate("__editor.paqueteJuego()"); paq = json.loads(texto)
    ok(paq.get('paquete') == 'mapas_editor' and paq.get('version') == 1 and paq.get('formato') == 2 and len(paq['maps']) >= 2, 'el editor exporta un paquete con marcador de versión (paquete=mapas_editor, version=1) y todos los mapas')
    ok(len([m for m in paq['maps'] if m['id'] == 'albanota'][0]['objetos']) == N - 1, 'la edición (un banco menos) viaja en el paquete')
    ed.click('#bExp'); ed.wait_for_timeout(200)
    with ed.expect_download() as d: ed.click('#eJuego')
    ok(d.value.suggested_filename == 'mapas_editor.json', 'el botón «Exportar al juego» descarga mapas_editor.json')
    bueno = tmp / 'mapas_editor.json'; d.value.save_as(str(bueno)); ok(json.loads(bueno.read_text(encoding='utf8')).get('paquete') == 'mapas_editor', 'el archivo descargado es el paquete')
    malo_j = json.loads(texto); [m for m in malo_j['maps'] if m['id'] == 'albanota'][0]['puertas'] = [{'id': 'p', 'x': 24, 'y': 24, 'destino': {'mapa': 'no_existe', 'ancla': 'a'}}]
    malo = tmp / 'malo.json'; malo.write_text(json.dumps(malo_j), encoding='utf8')
    sinmarca = tmp / 'viejo.json'; sinmarca.write_text(json.dumps({'formato': 2, 'maps': paq['maps']}), encoding='utf8')
    ed.close()
    # 2) el juego de fábrica
    url = 'file://' + str(raiz / 'dist' / 'criaturas.html')
    g = pagina(url)
    ok(g.evaluate("G.mapasEditor.activo") is False and g.evaluate("G.mundo.mapas.albanota.objetos.length") == N, 'el juego de fábrica arranca con Albanota oficial (%d objetos)' % N)
    ok(g.is_visible('#mbtn') and not g.is_visible('#mrot'), 'se ve el botón «Mapas» y todavía no el rótulo «Mapas del editor»')
    cajas = g.evaluate("['sbtn','mbtn','gbtn','who'].map((i) => { const r = document.getElementById(i).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })")
    cruza = lambda a, c: a[0] < c[2] and c[0] < a[2] and a[1] < c[3] and c[1] < a[3]
    ok(not cruza(cajas[1], cajas[0]) and not cruza(cajas[1], cajas[2]) and cajas[1][0] >= 0 and cajas[1][2] <= 390, 'el botón «Mapas» no tapa «Sombras» ni «Galería» y cabe en pantalla %s' % cajas[1])
    ok(not cruza(cajas[1], [cajas[3][0] + 120, cajas[3][1], cajas[3][2] - 120, cajas[3][3]]), 'ni el texto de quién juega (centro de la fila de arriba)')
    g.screenshot(path=str(sal / 'mapas_1_fabrica.png'))
    g.click('#mbtn'); g.wait_for_timeout(200); g.screenshot(path=str(sal / 'mapas_2_ventana.png'))
    ok(g.is_visible('#mdlg') and 'oficiales' in g.inner_text('#mestado') and g.is_disabled('#moficiales'), 'la ventana dice que se juega con los oficiales y «Volver a los oficiales» está apagado')
    # 3) archivos malos: se rechazan con el motivo y no cambia nada
    for nombre, f, re in [('con una puerta a un mapa que no existe', malo, 'no existe'), ('sin el marcador de versión', sinmarca, 'marcador')]:
        g.set_input_files('#marchivo', str(f)); g.wait_for_timeout(300)
        ok(g.is_visible('#mmsg') and 'No se cargó nada' in g.inner_text('#mmsg') and re in g.inner_text('#mmsg'), 'archivo %s: se rechaza y dice por qué (%s)' % (nombre, g.inner_text('#mmsg').replace('\n', ' ')[:110]))
        ok(g.evaluate("localStorage.getItem(G.almacenMapas.CLAVE)") is None, '  … y no se guarda nada')
    g.screenshot(path=str(sal / 'mapas_3_rechazo.png'))
    # 4) archivo bueno: se guarda y el juego se reinicia con él
    with g.expect_navigation(): g.set_input_files('#marchivo', str(bueno))
    g.wait_for_timeout(600)
    ok(g.evaluate("G.mapasEditor.activo") is True and g.evaluate("G.mundo.mapas.albanota.objetos.length") == N - 1, 'tras elegir el archivo bueno el juego arranca con los mapas del editor (Albanota con %d objetos)' % (N - 1))
    ok(g.is_visible('#mrot') and g.inner_text('#mrot').strip() == 'Mapas del editor', 'el rótulo «Mapas del editor» se ve')
    g.screenshot(path=str(sal / 'mapas_4_del_editor.png'))
    g.click('[data-pick=oli]'); g.wait_for_timeout(700); g.screenshot(path=str(sal / 'mapas_5_jugando.png'))
    ok(g.evaluate("__juego.mapa.id") == 'albanota' and g.evaluate("__juego.mapa.objetos.length") == N - 1, 'se puede jugar con los mapas del editor (empieza en Albanota editada)')
    g.reload(); g.wait_for_timeout(500)
    ok(g.evaluate("G.mapasEditor.activo") is True and g.is_visible('#mrot'), 'al recargar la página siguen los mapas del editor (guardados en el navegador)')
    g.click('#mbtn'); g.wait_for_timeout(200); g.screenshot(path=str(sal / 'mapas_6_ventana_editor.png'))
    ok('2 mapas' in g.inner_text('#mestado') or 'mapas del editor' in g.inner_text('#mestado'), 'la ventana lo dice (%s)' % g.inner_text('#mestado'))
    # 5) volver a los oficiales (dos pulsaciones)
    g.click('#moficiales'); ok('Seguro' in g.inner_text('#moficiales') and g.evaluate("G.mapasEditor.activo") is True, 'la primera pulsación pide confirmar y no borra nada')
    with g.expect_navigation(): g.click('#moficiales')
    g.wait_for_timeout(600)
    ok(g.evaluate("G.mapasEditor.activo") is False and g.evaluate("G.mundo.mapas.albanota.objetos.length") == N and g.evaluate("localStorage.getItem(G.almacenMapas.CLAVE)") is None and not g.is_visible('#mrot'), 'la segunda pulsación borra lo importado: el juego vuelve de fábrica (%d objetos, sin rótulo)' % N)
    # 6) un paquete guardado que ya no vale no rompe el arranque
    g.evaluate("(t) => localStorage.setItem(G.almacenMapas.CLAVE, t)", malo.read_text(encoding='utf8')); g.reload(); g.wait_for_timeout(600)
    ok(g.is_visible('#mdlg') and 'no se pudieron usar' in g.inner_text('#mmsg') and 'no existe' in g.inner_text('#mmsg'), 'con un paquete guardado que no vale, el juego arranca igual, usa los oficiales y dice por qué')
    ok(g.evaluate("G.mundo.mapas.albanota.objetos.length") == N and g.evaluate("localStorage.getItem(G.almacenMapas.CLAVE)") is None, '  … y aparta el paquete malo (no se repite el aviso)')
    g.screenshot(path=str(sal / 'mapas_7_arranque_malo.png'))
    g.reload(); g.wait_for_timeout(500); ok(not g.is_visible('#mdlg'), 'el aviso sale una sola vez')
    ok(not errs, 'sin errores de consola %s' % errs[:3])
    b.close()
print('\nTODO BIEN' if not fallos else '\n%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
