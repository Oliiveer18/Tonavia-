#!/usr/bin/env python3
"""v2.34: prueba visual del catálogo de árboles dentro del juego real (Chromium móvil 390x844). Pone los 4 árboles (arbol_pequeno, arbol_mediano, abeto, roble_hito) en pueblo_inicial
solo en memoria (no cambia maps/ ni el juego) con Oli por detrás de uno (la copa lo tapa) y Lali por delante de otro. Uso: python3 tools/prueba_arboles.py [salida.png]"""
import sys, os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
salida = next((a for a in sys.argv[1:] if not a.startswith('--')), os.path.join(raiz, 'docs', 'arboles_prueba_390x844.png'))
JS = r"""
() => {
  const G = window.G, J = window.__juego, m = J.mundo.mapa('pueblo_inicial'), T = 16;
  const pon = [['arbol_pequeno', 9, 21], ['arbol_mediano', 11, 21], ['abeto', 12, 21], ['roble_hito', 14, 21]];
  pon.forEach(([tipo, x, y]) => m.objetos.push({ tipo, x, y }));
  G.capas.limpiar();
  J.S.x = 11 * T + 8; J.S.y = 21 * T - 2; J.S.dir = 'down';                                       // Oli: al norte de los pies del árbol mediano → detrás, bajo la copa
  const lali = J.est.jugadores.lali; lali.mapa = m.id; lali.x = 12 * T + 8; lali.y = 22 * T + 12; lali.dir = 'up'; // Lali: al sur del abeto → por delante
  J.follow(0, true);
  return pon.map((p) => p.join(':')).join(' ');
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); err = []
    pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?mapa=pueblo_inicial'); pg.wait_for_timeout(400)
    pg.evaluate("G.aparicion.AJUSTES.VISIBLES = false"); pg.click('[data-pick=oli]'); pg.wait_for_timeout(200)
    print(pg.evaluate(JS)); pg.wait_for_timeout(300)
    pg.screenshot(path=salida, clip={'x': 0, 'y': 0, 'width': 390, 'height': 700})
    b.close()
print('ERRORES' if err else 'sin errores de consola', err[:3])
