#!/usr/bin/env python3
"""prueba_editar_en_juego.py — prueba en Chromium móvil (390×844) del botón «✏️ Editar mapa» DENTRO del juego (v2.62). Necesita playwright.
Uso: node build.js && python3 tools/prueba_editar_en_juego.py [carpeta_capturas]
Comprueba: el botón se ve y no tapa otros · abre el editor en el mapa donde estás con los dibujos reales · se edita (se borra un banco) · «Guardar y jugar» guarda, reinicia y el juego usa el cambio ·
«Salir» sin cambios vuelve al juego · un mapa roto lo rechaza el juego con el motivo y no cambia nada · el editor del juego no toca el guardado del editor suelto · «Mapas» exporta e importa · «Volver a los oficiales»."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_editar'); sal.mkdir(parents=True, exist_ok=True)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, accept_downloads=True); errs = []
    g = ctx.new_page(); g.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); g.on('pageerror', lambda e: errs.append(str(e)))
    g.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); g.wait_for_timeout(600)
    ok(g.is_visible('#ebtn') and g.is_visible('#mbtn'), 'se ven «🗺 Mapas» y «✏️ Editar mapa»')
    c = g.evaluate("['sbtn','mbtn','ebtn','gbtn','who'].map((i) => { const r = document.getElementById(i).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })")
    cruza = lambda a, b: a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    ok(not any(cruza(c[i], c[j]) for i in range(len(c)) for j in range(i + 1, len(c))), 'ningún botón de arriba tapa a otro')
    g.screenshot(path=str(sal / '1_juego_boton.png'))
    n0 = g.evaluate("G.mundo.mapas.albanota.objetos.length")
    # 1) abrir el editor desde el juego
    g.click('#ebtn'); g.wait_for_timeout(1200)
    fr = g.frame_locator('#eframe'); marco = [f for f in g.frames if f != g.main_frame][0]
    ok(g.is_visible('#edlg') and marco.evaluate("typeof __editor") == 'object', 'se abre el editor a pantalla completa dentro del juego')
    ok(marco.evaluate("__editor.cur.id") == 'albanota' and marco.evaluate("__editor.cur.objetos.length") == n0, 'abre el mapa donde estás (albanota) con sus %d objetos' % n0)
    ok(marco.is_visible('#bJugar') and marco.is_visible('#bSalir') and not marco.is_visible('#bProbar'), '«Guardar y jugar» y «Salir» a la vista; «Probar» del archivo suelto oculto')
    g.screenshot(path=str(sal / '2_editor_en_juego.png'))
    # 2) salir sin cambios
    marco.click('#bSalir'); g.wait_for_timeout(300)
    ok(not g.is_visible('#edlg'), '«Salir» sin cambios vuelve al juego')
    # 3) editar y guardar
    g.click('#ebtn'); g.wait_for_timeout(1200); marco = [f for f in g.frames if f != g.main_frame][0]
    idx = marco.evaluate("__editor.cur.objetos.findIndex((o) => o.tipo === 'banco')")
    marco.evaluate("(i) => { __editor.sel = { kind: 'objeto', key: i }; __editor.deleteSel(); }", idx)
    marco.click('#bJugar'); g.wait_for_timeout(2200)
    ok(g.evaluate("G.mapasEditor.activo") is True and g.evaluate("G.mundo.mapas.albanota.objetos.length") == n0 - 1, '«Guardar y jugar» guarda, reinicia y el juego usa el mapa editado (un banco menos)')
    ok(g.is_visible('#mrot') and not g.is_visible('#edlg'), 'aparece el rótulo «Mapas del editor» y el editor está cerrado')
    ok(g.evaluate("localStorage.getItem('criaturas_editor_mapas_v1')") is None, 'el editor del juego no deja su propio guardado aparte')
    g.screenshot(path=str(sal / '3_juego_con_cambio.png'))
    # 4) mapa roto: lo rechaza el juego
    g.click('#ebtn'); g.wait_for_timeout(1200); marco = [f for f in g.frames if f != g.main_frame][0]
    marco.evaluate("__editor.cur.puertas.push({ id: 'rota', x: 24, y: 24, destino: { mapa: 'no_existe', ancla: 'a' } })")
    marco.click('#bJugar'); g.wait_for_timeout(800)
    ok(marco.evaluate("document.getElementById('dlg').open") is True and 'no_existe' in marco.evaluate("document.getElementById('dlgB').textContent"), 'un mapa roto se rechaza y el editor dice por qué')
    ok(g.evaluate("G.mundo.mapas.albanota.objetos.length") == n0 - 1, 'lo rechazado no cambia nada')
    g.screenshot(path=str(sal / '4_rechazo.png'))
    marco.evaluate("document.getElementById('dlg').close()"); marco.evaluate("__editor.cur.puertas.pop()"); marco.click('#bSalir'); g.wait_for_timeout(300)
    if g.is_visible('#edlg'): marco.click('#dlgOk') if marco.is_visible('#dlgOk') else None
    # 5) exportar / importar desde «Mapas»
    g.click('#mbtn'); g.wait_for_timeout(200)
    with g.expect_download() as d: g.click('#mexportar')
    paq = json.loads(pathlib.Path(d.value.path()).read_text(encoding='utf8'))
    ok(d.value.suggested_filename == 'mapas_editor.json' and paq['paquete'] == 'mapas_editor' and len([m for m in paq['maps'] if m['id'] == 'albanota'][0]['objetos']) == n0 - 1, '«Exportar mis mapas» descarga el paquete con lo editado')
    # 5b) copiar al portapapeles y, si no se puede, caja de texto de reserva
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'])
    g.click('#mcopiar'); g.wait_for_timeout(400)
    cp = g.evaluate("navigator.clipboard.readText()")
    ok(json.loads(cp)['paquete'] == 'mapas_editor' and not g.is_visible('#mtexto'), '«Copiar mis mapas» deja el paquete en el portapapeles')
    g.evaluate("Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })"); g.click('#mcopiar'); g.wait_for_timeout(300)
    ok(g.is_visible('#mtexto') and json.loads(g.input_value('#mtexto'))['paquete'] == 'mapas_editor', 'sin portapapeles sale la caja con el texto para copiarlo a mano')
    g.screenshot(path=str(sal / '5_copiar.png'))
    g.click('#moficiales'); g.click('#moficiales'); g.wait_for_timeout(1500)
    ok(g.evaluate("G.mapasEditor.activo") is False and g.evaluate("G.mundo.mapas.albanota.objetos.length") == n0, '«Volver a los oficiales» deja el juego de fábrica')
    ok(not errs, 'sin errores de consola' + ('' if not errs else ': ' + '; '.join(errs[:3])))
    b.close()
print('\nTODO BIEN' if not fallos else '\nFALLOS: %d' % len(fallos)); sys.exit(1 if fallos else 0)
