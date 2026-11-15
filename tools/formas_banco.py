#!/usr/bin/env python3
"""Rasterizador con z-buffer de la geometría REAL del banco (v2.105, paso 2): 4 vistas (cámara a 0, 45, 90 y 180 grados) con los colores lisos del estilo «banco».
Uso: node tools/volcar_banco.js > /tmp/banco_geo.json && python3 tools/formas_banco.py /tmp/banco_geo.json salida.png [--liso]   (necesita numpy y PIL)
v2.106: por defecto pinta las TEXTURAS de píxel del estilo (asiento y listones desde el paso 3); con --liso, un color por cara (paso 2)."""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw
geo = json.load(open(sys.argv[1])); salida = sys.argv[2]; LISO = '--liso' in sys.argv
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
S, W, H = 150, 360, 300 if False else 300   # píxeles por unidad y tamaño de cada vista
def vista(yaw_deg, pitch_deg=32):
    yaw, pit = math.radians(yaw_deg), math.radians(pitch_deg)
    img = np.zeros((H, W, 3), np.uint8); img[:] = (122, 190, 110); zb = np.full((H, W), 1e9)
    cx, cy, cz = 1.0, 0.45, 0.5   # centro del banco
    def proy(p):   # cámara en el SUR (z+) a 0 grados, mirando al norte, desde arriba; el este queda a la derecha (imagen sin espejo)
        x, y, z = p[0] - cx, p[1] - cy, p[2] - cz
        x, z = x * math.cos(yaw) - z * math.sin(yaw), x * math.sin(yaw) + z * math.cos(yaw)
        prof = -(z * math.cos(pit) + y * math.sin(pit)); yy = y * math.cos(pit) - z * math.sin(pit)
        return (W / 2 + x * S, H / 2 + 20 - yy * S, prof)
    for q in geo['poly']:
        n = q['n']; nx, nz = n[0] * math.cos(yaw) - n[2] * math.sin(yaw), n[0] * math.sin(yaw) + n[2] * math.cos(yaw)
        if nz * math.cos(pit) + n[1] * math.sin(pit) <= 1e-6: continue   # cara de espaldas
        P = [proy(v) for v in q['v']]; col = hexrgb(q['c'])
        for tri in ([0, 1, 2], [0, 2, 3]) if len(P) == 4 else ([0, 1, 2],):
            a, b, c = (P[i] for i in tri)
            x0, x1 = int(max(0, min(a[0], b[0], c[0]))), int(min(W - 1, max(a[0], b[0], c[0])) + 1); y0, y1 = int(max(0, min(a[1], b[1], c[1]))), int(min(H - 1, max(a[1], b[1], c[1])) + 1)
            uvs = [q['uv'][i] for i in tri]
            den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(den) < 1e-9: continue
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    l1 = ((b[1] - c[1]) * (x + .5 - c[0]) + (c[0] - b[0]) * (y + .5 - c[1])) / den; l2 = ((c[1] - a[1]) * (x + .5 - c[0]) + (a[0] - c[0]) * (y + .5 - c[1])) / den; l3 = 1 - l1 - l2
                    if l1 < -1e-6 or l2 < -1e-6 or l3 < -1e-6: continue
                    z = l1 * a[2] + l2 * b[2] + l3 * c[2]
                    if z < zb[y, x]:
                        zb[y, x] = z; img[y, x] = col
                        if not LISO and q.get('px'):
                            u = l1 * uvs[0][0] + l2 * uvs[1][0] + l3 * uvs[2][0]; v = l1 * uvs[0][1] + l2 * uvs[1][1] + l3 * uvs[2][1]
                            tx = min(q['tw'] - 1, max(0, int(u * 16))); ty = min(q['th'] - 1, max(0, int(q['th'] - v * 16 - 1e-6)))
                            cc = q['px'][ty * q['tw'] + tx]
                            if cc: img[y, x] = hexrgb(cc)
    return Image.fromarray(img)
vs = [(0, 'camara a 0 grados (de frente, sur)'), (45, '45 grados'), (90, '90 grados'), (180, '180 grados (por detras)')]
lienzo = Image.new('RGB', (W * 2, H * 2 + 28), (30, 20, 36)); dib = ImageDraw.Draw(lienzo)
for i, (a, t) in enumerate(vs):
    lienzo.paste(vista(a), ((i % 2) * W, (i // 2) * H)); dib.text(((i % 2) * W + 6, (i // 2) * H + 4), t, fill=(255, 255, 255))
dib.text((6, H * 2 + 8), ('Banco - paso 2 - colores lisos' if LISO else 'Banco v2.107 - paso 3: asiento, listones y montantes con textura (patas lisas)') + ' - %d triangulos' % geo['tri'], fill=(255, 255, 255))
lienzo.save(salida); print('guardado', salida)
