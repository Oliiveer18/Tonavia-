#!/usr/bin/env python3
"""ID-2a: prueba visual de las capas dentro del juego real (Chromium móvil 390x844). Registra un árbol de PRUEBA (tronco = base, copa = «encima»), lo pone en pueblo_inicial
y coloca a Oli detrás del tronco (la copa lo tapa) y a Lali delante (pasa por delante). No cambia el juego ni los archivos de maps/. Uso: python3 tools/prueba_capas.py [salida.png]"""
import sys, os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
salida = next((a for a in sys.argv[1:] if not a.startswith('--')), os.path.join(raiz, 'docs', 'capas_prueba_390x844.png'))
JS = r"""
() => {
  const G = window.G, J = window.__juego, m = J.mundo.mapa('pueblo_inicial'), T = 16;
  G.capas.registrar('prueba_arbol', { w: 32, h: 40, ox: -8, oy: -24, pieY: 16, huella: [[0, 0, 1, 1]], dibujar(b, e) {
    b.fillStyle = '#2a1b30'; b.fillRect(12, 27, 8, 13); b.fillStyle = '#7a4a2b'; b.fillRect(13, 28, 6, 12); b.fillStyle = '#a96f46'; b.fillRect(13, 28, 2, 12);   // tronco: va con las entidades
    e.fillStyle = '#2a1b30'; e.fillRect(1, 2, 30, 24); e.fillRect(4, 0, 24, 28); e.fillStyle = '#3f8f4a'; e.fillRect(2, 3, 28, 22); e.fillRect(5, 1, 22, 26); e.fillStyle = '#5dae5a'; e.fillRect(4, 4, 16, 12); e.fillRect(6, 2, 12, 16); // copa: va ENCIMA
  } });
  const ox = 16, oy = 17; // casilla libre (hierba) cerca del inicio
  m.objetos.push({ tipo: 'prueba_arbol', x: ox, y: oy });
  G.capas.limpiar();
  J.S.x = ox * T + 8; J.S.y = oy * T - 2;                         // Oli: al norte de los pies del árbol → detrás del tronco, bajo la copa
  const lali = J.est.jugadores.lali; lali.mapa = m.id; lali.x = ox * T + 20; lali.y = oy * T + 24; lali.dir = 'up'; // Lali: al sur → por delante del tronco
  J.S.dir = 'down'; J.follow(0, true);
  return [J.S.x, J.S.y, lali.x, lali.y, m.suelo[oy][ox]];
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); err = []
    pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?mapa=pueblo_inicial'); pg.wait_for_timeout(400)
    pg.evaluate("G.aparicion.AJUSTES.VISIBLES = false"); pg.click('[data-pick=oli]'); pg.wait_for_timeout(200)
    print(pg.evaluate(JS)); pg.wait_for_timeout(300)
    pg.evaluate("() => { window.__juego.keys.up = 0; }")
    pg.screenshot(path=salida, clip={'x': 0, 'y': 0, 'width': 390, 'height': 600})
    b.close()
print('ERRORES' if err else 'sin errores de consola', err[:3])
