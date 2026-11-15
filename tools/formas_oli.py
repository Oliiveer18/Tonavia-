#!/usr/bin/env python3
"""Rasterizador con z-buffer de la geometría REAL de Oli 3D (v2.113, paso 2): colores lisos, sin texturas.
Uso: node tools/volcar_oli.js > /tmp/oli_geo.json && python3 tools/formas_oli.py /tmp/oli_geo.json salida.png   (necesita PIL)
Filas 1-3: las 3 poses (quieto, pie derecho arriba, pie izquierdo arriba) con la cámara a 0, 90, 180 y 270 grados (los 4 giros). Fila 4: el personaje andando hacia el sur, el este, el norte y el oeste, con la cámara a 0 grados."""
import json, math, sys
from PIL import Image, ImageDraw
geo = json.load(open(sys.argv[1])); salida = sys.argv[2]
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
S, W, H, PIT = 120, 200, 250, math.radians(32)   # píxeles por unidad, tamaño de cada vista y cabeceo de la cámara
def vista(fig, yaw_deg):
    yaw = math.radians(yaw_deg); img = Image.new('RGB', (W, H), (122, 190, 110)); px = img.load(); zb = [[1e9] * W for _ in range(H)]
    def proy(p):   # cámara en el SUR (z+) a 0 grados, mirando al norte desde arriba; el este queda a la derecha
        x, y, z = p[0], p[1] - 0.75, p[2]
        x, z = x * math.cos(yaw) - z * math.sin(yaw), x * math.sin(yaw) + z * math.cos(yaw)
        prof = -(z * math.cos(PIT) + y * math.sin(PIT)); yy = y * math.cos(PIT) - z * math.sin(PIT)
        return (W / 2 + x * S, H / 2 + 10 - yy * S, prof)
    # sombra de suelo (óvalo del pintor, solo de referencia)
    d = ImageDraw.Draw(img); cx, cy, _ = proy((0, 0, 0)); d.ellipse((cx - 0.31 * S, cy - 0.09 * S, cx + 0.31 * S, cy + 0.09 * S), fill=(86, 150, 86))
    for q in fig['poly']:
        n = q['n']; nz = n[0] * math.sin(yaw) + n[2] * math.cos(yaw)
        if nz * math.cos(PIT) + n[1] * math.sin(PIT) <= 1e-6: continue   # cara de espaldas
        P = [proy(v) for v in q['v']]; col = hexrgb(q['c'])
        for tri in ((0, 1, 2), (0, 2, 3)):
            a, b, c = (P[i] for i in tri)
            x0, x1 = int(max(0, min(a[0], b[0], c[0]))), int(min(W - 1, max(a[0], b[0], c[0])) + 1); y0, y1 = int(max(0, min(a[1], b[1], c[1]))), int(min(H - 1, max(a[1], b[1], c[1])) + 1)
            den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(den) < 1e-9: continue
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    l1 = ((b[1] - c[1]) * (x + .5 - c[0]) + (c[0] - b[0]) * (y + .5 - c[1])) / den; l2 = ((c[1] - a[1]) * (x + .5 - c[0]) + (a[0] - c[0]) * (y + .5 - c[1])) / den; l3 = 1 - l1 - l2
                    if l1 < -1e-6 or l2 < -1e-6 or l3 < -1e-6: continue
                    z = l1 * a[2] + l2 * b[2] + l3 * c[2]
                    if z < zb[y][x]: zb[y][x] = z; px[x, y] = col
    return img
tri = [geo['poses'][0]['tri']]
lienzo = Image.new('RGB', (W * 4, H * 4 + 28), (30, 20, 36)); dib = ImageDraw.Draw(lienzo)
for r, fig in enumerate(geo['poses']):
    for c, ang in enumerate((0, 90, 180, 270)):
        lienzo.paste(vista(fig, ang), (c * W, r * H)); dib.text((c * W + 6, r * H + 4), '%s · camara %d°' % (fig['nombre'], ang), fill=(255, 255, 255))
for c, fig in enumerate(geo['dirs']):
    lienzo.paste(vista(fig, 0), (c * W, 3 * H)); dib.text((c * W + 6, 3 * H + 4), 'anda hacia: %s' % {'down': 'sur', 'right': 'este', 'up': 'norte', 'left': 'oeste'}[fig['nombre']], fill=(255, 255, 255))
dib.text((6, H * 4 + 8), '%s 3D - paso 2 - colores lisos - %d triangulos - alto %.4f u - ancho %.4f u' % ({'rex': 'Oli', 'luna': 'Lali'}.get(geo.get('personaje', 'rex'), 'Oli'), geo['poses'][0]['tri'], geo['poses'][0]['alto'], geo['poses'][0]['ancho']), fill=(255, 255, 255))
lienzo.save(salida); print('guardado', salida)
