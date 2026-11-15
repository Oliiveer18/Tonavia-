#!/usr/bin/env python3
"""Demostración visual de sombras proyectadas · Criaturas de Lali y Oli.
NO modifica el proyecto: abre dist/criaturas.html (solo lectura) en Chromium, coloca a los personajes por el estado del motor
y captura el lienzo REAL del juego. «AHORA» = juego tal cual (sin ninguna inyección). «PROPUESTA» = el mismo juego + una capa de sombras
inyectada solo en la página en ejecución (inject2d.js para el 2D, injecthd.js sobre Three.js r128 real para el HD-2D)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
AQUI = pathlib.Path(__file__).resolve().parent
PROY = AQUI.parent.parent
import os
THREE = pathlib.Path(os.environ.get('THREE_MIN', 'node_modules/three/build/three.min.js'))
URL = 'file://' + str(PROY / 'dist' / 'criaturas.html') + '?mapa=albanota'
MAPA = json.loads((PROY / 'maps' / 'albanota.json').read_text(encoding='utf8'))
J2D = (AQUI / 'inject2d.js').read_text(encoding='utf8'); JHD = (AQUI / 'injecthd.js').read_text(encoding='utf8')
CSS = '#minib,#mbtn,#ebtn,#hbtn,#mrot,#hcam,#flecha,#sbtn{visibility:hidden !important}'

# Posiciones en casillas (x, y de los PIES). Oli es el jugador (la cámara le sigue).
VISTAS = {
  'plaza':   dict(titulo='Plaza · fuente, farolas, bancos, macetas', oli=(23.6, 21.2, 'down'), lali=(25.6, 20.4, 'left'), cre=[('aguacato', 21.4, 19.2, 'right'), ('ferrel', 27.2, 22.8, 'down'), ('forjel', 26.6, 17.0, 'left')]),
  'barrio':  dict(titulo='Barrio · casas de Lali y Oli, tejados, farolas, banco', oli=(8.8, 17.3, 'down'), lali=(5.6, 16.6, 'right'), cre=[('cenel', 10.9, 17.4, 'left')]),
  'laboratorio': dict(titulo='Laboratorio · edificio con cúpula y orilla del agua', oli=(13.6, 26.4, 'up'), lali=(11.0, 26.2, 'right'), cre=[('dandel', 16.0, 26.0, 'left')]),
  'centro': dict(titulo='Centro PC y Tienda · edificios', oli=(29.6, 10.2, 'down'), lali=(27.4, 10.9, 'right'), cre=[('ondavar', 31.5, 10.6, 'left')]),
  'orilla':  dict(titulo='Orilla y puente · sombra que se corta en el agua', oli=(24.5, 28.2, 'down'), lali=(21.2, 26.9, 'right'), cre=[('aguacato', 26.9, 27.6, 'left')]),
  'huerto':  dict(titulo='Huerto · vallas, espantapájaros, barril, tierra', oli=(35.0, 23.2, 'down'), lali=(37.4, 24.0, 'left'), cre=[('ferrel', 39.8, 23.4, 'left')]),
}

def stage_js():
    return """(s) => {
      const J = window.__juego, e = J.est, T = 16, oli = e.jugadores.oli, lali = e.jugadores.lali;
      J.motor.moverCriaturas = () => {};   // las criaturas se quedan donde las pongo
      const poner = (j, p) => { j.x = p[0] * T; j.y = p[1] * T; j.dir = p[2]; j.moving = false; j.mapa = 'albanota'; };
      poner(oli, s.oli); poner(lali, s.lali);
      const cs = J.creatures; cs.forEach((c, i) => { const q = s.cre[i]; if (!q) { c.x = c.y = -999; return; } c.id = q[0]; c.x = q[1] * T; c.y = q[2] * T; c.dir = q[3]; c.moving = false; c.wait = 999; c.vx = c.vy = 0; });
      return cs.length;
    }"""

def abrir(b, modo, inyectar):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    if modo == 'hd':
        js = THREE.read_text(encoding='utf8') + (('\n' + JHD) if inyectar else '')
        pg.route('**/three.min.js', lambda r: r.fulfill(body=js, content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.add_style_tag(content=CSS)
    pg.click('[data-pick=oli]'); pg.wait_for_timeout(400)
    if modo == '2d' and inyectar: pg.evaluate(J2D)
    if modo == 'hd':
        pg.evaluate("__juego.irAHD()"); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(800)
        if inyectar: pg.evaluate("(r) => { window.__HD.suelo = r; }", MAPA['capas']['suelo'])
    return ctx, pg, errs

def captura(pg, modo, inyectar, vista, ruta, espera=1500):
    pg.evaluate(stage_js(), VISTAS[vista])
    if modo == '2d' and inyectar: pg.evaluate('(v) => { window.__SOMB.on = v; }', True)
    if modo == 'hd' and inyectar: pg.evaluate('() => { window.__HD.on = true; window.__HD.refrescar = true; }')
    pg.wait_for_timeout(espera)
    if modo == 'hd' and inyectar: pg.evaluate('() => { window.__HD.refrescar = true; }'); pg.wait_for_timeout(500)
    pg.locator('#stage').screenshot(path=str(ruta))

if __name__ == '__main__':
    args = sys.argv[1:]; vistas = [a for a in args if a in VISTAS] or list(VISTAS); salida = AQUI / 'out'; salida.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for modo in ('2d', 'hd'):
            if modo not in args and any(a in ('2d', 'hd') for a in args): continue
            for inyectar in (False, True):
                ctx, pg, errs = abrir(b, modo, inyectar)
                for v in vistas:
                    ruta = salida / ('%s_%s_%s.png' % (v, modo, 'propuesta' if inyectar else 'ahora')); captura(pg, modo, inyectar, v, ruta); print(ruta.name)
                if modo == 'hd' and inyectar: print('errores de la capa:', pg.evaluate('window.__HD.err'))
                print(modo, 'propuesta' if inyectar else 'ahora', 'errores de consola:', errs or 'ninguno'); ctx.close()
        b.close()
