#!/usr/bin/env python3
"""Rasterizador con z-buffer de un personaje 3D CON TEXTURAS, leyendo el atlas y las uv REALES del módulo (v2.129, Lali 3D paso 3; sirve también para Oli).
Uso: node tools/volcar_personaje_tex.js luna > /tmp/lali_tex.json && python3 tools/texturado.py /tmp/lali_tex.json salida.png   (necesita PIL)
Caras con textura: texel del atlas (vecino más cercano) × tono de luz fija × brillo del material, como el pintor; caras lisas: su color con rampa.
Filas 1-3: las 3 poses con la cámara a 0, 90, 180 y 270 grados. Fila 4: andando hacia el sur, el este, el norte y el oeste (cámara 0)."""
import json, math, sys
from PIL import Image, ImageDraw
geo = json.load(open(sys.argv[1])); salida = sys.argv[2]; AT = geo['atlas']; BR = geo['brillo']; TT = geo['tonoTex']
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
S, W, H, PIT = 120, 200, 250, math.radians(32)
def vista(fig, yaw_deg):
    yaw = math.radians(yaw_deg); img = Image.new('RGB', (W, H), (122, 190, 110)); px = img.load(); zb = [[1e9] * W for _ in range(H)]
    def proy(p):   # cámara en el SUR (z+) a 0 grados, mirando al norte desde arriba; el este queda a la derecha
        x, y, z = p[0], p[1] - 0.75, p[2]
        x, z = x * math.cos(yaw) - z * math.sin(yaw), x * math.sin(yaw) + z * math.cos(yaw)
        return (W / 2 + x * S, H / 2 + 10 - (y * math.cos(PIT) - z * math.sin(PIT)) * S, -(z * math.cos(PIT) + y * math.sin(PIT)))
    d = ImageDraw.Draw(img); cx, cy, _ = proy((0, 0, 0)); d.ellipse((cx - 0.31 * S, cy - 0.09 * S, cx + 0.31 * S, cy + 0.09 * S), fill=(86, 150, 86))
    for q in fig['poly']:
        n = q['n']; nz = n[0] * math.sin(yaw) + n[2] * math.cos(yaw)
        if nz * math.cos(PIT) + n[1] * math.sin(PIT) <= 1e-6: continue   # cara de espaldas
        P = [proy(v) for v in q['v']]; col = hexrgb(q['c']); k = TT[q['tono']] * BR; uv = q['uv']
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
                    if z >= zb[y][x]: continue
                    if q['tex']:
                        i0, i1, i2 = tri; u = l1 * uv[i0][0] + l2 * uv[i1][0] + l3 * uv[i2][0]; v = l1 * uv[i0][1] + l2 * uv[i1][1] + l3 * uv[i2][1]
                        tx = min(AT['w'] - 1, max(0, int(u * AT['w']))); ty = min(AT['h'] - 1, max(0, int((1 - v) * AT['h']))); t = AT['px'][ty][tx]
                        if not t: continue   # texel transparente
                        zb[y][x] = z; px[x, y] = tuple(min(255, int(ch * k)) for ch in hexrgb(t))
                    else:
                        zb[y][x] = z; px[x, y] = col
    return img
lienzo = Image.new('RGB', (W * 4, H * 4 + 28), (30, 20, 36)); dib = ImageDraw.Draw(lienzo)
for r, fig in enumerate(geo['poses']):
    for c, ang in enumerate((0, 90, 180, 270)):
        lienzo.paste(vista(fig, ang), (c * W, r * H)); dib.text((c * W + 6, r * H + 4), '%s · camara %d°' % (fig['nombre'], ang), fill=(255, 255, 255))
for c, fig in enumerate(geo['dirs']):
    lienzo.paste(vista(fig, 0), (c * W, 3 * H)); dib.text((c * W + 6, 3 * H + 4), 'anda hacia: %s' % {'down': 'sur', 'right': 'este', 'up': 'norte', 'left': 'oeste'}[fig['nombre']], fill=(255, 255, 255))
nom = {'rex': 'Oli', 'luna': 'Lali'}.get(geo.get('personaje', 'rex'), 'Oli'); p0 = geo['poses'][0]
dib.text((6, H * 4 + 8), '%s 3D - con texturas (atlas %dx%d, uv reales) - %d triangulos - alto %.4f u - ancho %.4f u' % (nom, AT['w'], AT['h'], p0['tri'], p0['alto'], p0['ancho']), fill=(255, 255, 255))
lienzo.save(salida); print('guardado', salida)
