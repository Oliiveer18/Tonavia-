#!/usr/bin/env python3
"""ID-2b-3 · PROPUESTA (v2.94, solo imagen): sombras proyectadas de edificios y objetos sobre el suelo de Albanota. NO cambia el juego: dibuja la propuesta encima del juego real
(se engancha a G.capas.luzRegion en la página, sin tocar ningún archivo) y guarda antes/después. Luz arriba-izquierda → sombra abajo-derecha (REGLAS_DE_LUZ.md). Árboles: nunca (regla del usuario).
Uso: python3 tools/prueba_sombras_proyectadas.py [salida.png]   (necesita playwright y PIL; node build.js antes)"""
import os, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sal = sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'docs', 'sombras_proyectadas_propuesta.png')
VISTAS = [('plaza', 24, 18), ('barrio', 8, 14), ('laboratorio', 14, 25), ('centro y tienda', 29, 9)]
JS = r"""
() => {
  const T = 16, OB = G.capas.OBJETOS, orig = G.capas.luzRegion;
  // v2.94c · SOMBRA = LA SILUETA REAL DE CADA SPRITE, inclinada (técnica de los sprites con sombra proyectada): cada píxel opaco que está h píxeles por encima de la línea de base (pieY) deja un píxel de sombra
  // h·SX a la derecha y h·SY hacia abajo, en pendiente 2:1 (SX = 2·SY). Todo va a UNA máscara y se pinta una sola vez (donde dos sombras se solapan no se oscurece el doble). Va sobre el suelo, antes de objetos y personajes; nada sobre el agua.
  const SX = 0.45, SY = 0.225, NO = { juncos2: 1, juncos3: 1, nenufar: 1, nenufar_flor: 1, puente_albanota: 1, huerto: 1 };
  const SIL = {};
  function silueta(tipo) { if (SIL[tipo]) return SIL[tipo]; const d = OB[tipo], c = document.createElement('canvas'); c.width = d.w; c.height = d.h; const x = c.getContext('2d'), o = { tipo, x: 0, y: 0 }, cam = { x: d.ox, y: d.oy };
    G.capas.dibujarBase(x, o, cam); if (d.encima !== false) G.capas.dibujarEncima(x, [{ objeto: o }], cam); const im = x.getImageData(0, 0, d.w, d.h).data, pts = [];
    const br = d.pieY - d.oy; for (let py = 0; py < d.h; py++) for (let px = 0; px < d.w; px++) if (im[(py * d.w + px) * 4 + 3] > 40 && br - py >= 1) pts.push([px, py, br - py]);
    return (SIL[tipo] = { pts, br }); }
  G.capas.luzRegion = function (ctx, m, VW, VH) {
    orig.apply(this, arguments); const cam = window.__juego.cam; if (!window.__SOMBRAS) return;
    const suelo = ctx.getImageData(0, 0, VW, VH).data, mask = new Uint8Array(VW * VH);
    (m.objetos || []).forEach((o) => { const d = OB[o.tipo]; if (!d || NO[o.tipo]) return; const S = silueta(o.tipo); if (!S.pts.length) return;
      const ox = Math.round(o.x * T + d.ox - cam.x), oy = Math.round(o.y * T + d.oy - cam.y); if (ox > VW || oy > VH || ox + d.w < -40 || oy + d.h < -40) return;
      S.pts.forEach(([px, py, h]) => { const X = ox + px + Math.round(h * SX), Y = oy + S.br + Math.round(h * SY); if (X < 0 || Y < 0 || X >= VW || Y >= VH) return; mask[Y * VW + X] = 1; }); });
    ctx.fillStyle = 'rgba(38,28,92,0.24)';   // un solo tono frío (violeta-azul), liso
    for (let y = 0; y < VH; y++) { let x = 0; while (x < VW) { if (!mask[y * VW + x]) { x++; continue; } let x1 = x; while (x1 < VW && mask[y * VW + x1]) x1++;
      let a = x; for (let k = x; k <= x1; k++) { const i = (y * VW + k) * 4, agua = k < x1 && suelo[i + 2] > suelo[i] + 40 && suelo[i + 2] > suelo[i + 1] + 10; if (agua || k === x1) { if (k > a) ctx.fillRect(a, y, k - a, 1); a = k + 1; } } x = x1; } }
  };
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); err = []
    pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?mapa=albanota'); pg.wait_for_timeout(400)
    pg.evaluate("G.aparicion.AJUSTES.VISIBLES = false"); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300); pg.evaluate(JS)
    pares = []
    for nombre, x, y in VISTAS:
        pg.evaluate("([x, y]) => { const J = window.__juego; J.S.x = x * 16 + 8; J.S.y = y * 16 + 8; J.S.dir = 'down'; J.follow(0, true); }", [x, y]); fotos = []
        for on in (False, True):
            pg.evaluate('(v) => { window.__SOMBRAS = v; }', on); pg.wait_for_timeout(350); f = '/tmp/_somb_%s_%d.png' % (nombre, on); pg.screenshot(path=f, clip={'x': 0, 'y': 38, 'width': 390, 'height': 640}); fotos.append(Image.open(f).convert('RGB'))
        pares.append(fotos)
    print('errores de consola:', err or 'ninguno'); b.close()
W = 390; H = 640; hoja = Image.new('RGB', (W * 2 + 30, (H + 40) * len(pares)), (27, 20, 36)); d = ImageDraw.Draw(hoja)
for i, (a, s) in enumerate(pares):
    y = i * (H + 40); d.text((8, y + 12), 'AHORA · %s' % VISTAS[i][0], fill=(240, 230, 200)); d.text((W + 38, y + 12), 'PROPUESTA · sombras proyectadas', fill=(255, 217, 90)); hoja.paste(a, (0, y + 36)); hoja.paste(s, (W + 30, y + 36))
hoja.save(sal); print(sal)
