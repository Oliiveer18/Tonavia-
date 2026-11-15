#!/usr/bin/env python3
"""paletas.py — comprueba las paletas por región y la interfaz (v2.29, ID-1; docs/BIBLIA_VISUAL.md).
Lee tools/paletas_regiones.json (8 regiones × 7 materiales), calcula cada rampa con src/rampas.js (G.rampa) y comprueba:
  1. cada rampa va de oscuro a claro (s0 < s1 < base < l1 < l2) en luminosidad CIELAB;
  2. daltonismo (protanopia, deuteranopia, tritanopia; Machado 2009): dos regiones se distinguen si su suelo o su tejado difieren ΔE ≥ 14;
  3. los 7 elementos no se confunden entre sí con daltonismo (ΔE ≥ 12);
  4. contraste de la interfaz (WCAG): texto ≥ 4,5:1 y bordes de chips ≥ 3:1, con los colores que de verdad usa la galería (aclarados como en src/galeria.js).
Sale con código 1 si algo falla. Uso: python3 tools/paletas.py   (necesita node y numpy)"""
import itertools, json, os, subprocess, sys
import numpy as np
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(raiz, 'tools/paletas_regiones.json'), encoding='utf-8'))['regiones']
js = ("global.window=global;window.G={};require(%r);const P=JSON.parse(process.argv[1]);"
      "console.log(JSON.stringify(P.map(r=>Object.fromEntries(Object.entries(r.colores).map(([k,v])=>[k,window.G.rampa(v)])))))" % os.path.join(raiz, 'src/rampas.js'))
RAMPAS = json.loads(subprocess.check_output(['node', '-e', js, json.dumps(P)]))
h2r = lambda h: np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float) / 255
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
gam = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
def Y(h): r, g, b = lin(h2r(h)); return 0.2126 * r + 0.7152 * g + 0.0722 * b
def contraste(a, b): x, y = Y(a), Y(b); return (max(x, y) + 0.05) / (min(x, y) + 0.05)
M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
def lab(rgb):
    xyz = (M @ lin(rgb)) / np.array([0.95047, 1, 1.08883]); f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    fx, fy, fz = f(xyz); return np.array([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)])
CVD = {'protanopia': np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]),
       'deuteranopia': np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]),
       'tritanopia': np.array([[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]])}
def de(a, b, k=None):
    ca = gam(np.clip(CVD[k] @ lin(h2r(a)), 0, 1)) if k else h2r(a); cb = gam(np.clip(CVD[k] @ lin(h2r(b)), 0, 1)) if k else h2r(b)
    return float(np.linalg.norm(lab(ca) - lab(cb)))
fallos = []
# 1 · rampas
n = 0
for r, rp in zip(P, RAMPAS):
    for m, ramp in rp.items():
        ls = [float(lab(h2r(ramp[t]))[0]) for t in ('s0', 's1', 'base', 'l1', 'l2')]; n += 1
        if not all(ls[i] < ls[i + 1] for i in range(4)): fallos.append(f'rampa desordenada: {r["id"]}/{m} {[round(x) for x in ls]}')
print(f'{n} rampas ({len(P)} regiones × {len(P[0]["colores"])} materiales) ordenadas de oscuro a claro')
# 2 · regiones con daltonismo
for k in (None, 'protanopia', 'deuteranopia', 'tritanopia'):
    for a, b in itertools.combinations(P, 2):
        if max(de(a['colores'][c], b['colores'][c], k) for c in ('suelo', 'tejado')) < 14: fallos.append(f'regiones confundibles ({k or "visión normal"}): {a["id"]} y {b["id"]}')
print('regiones distinguibles en visión normal, protanopia, deuteranopia y tritanopia')
# 3 · elementos
EL = {'hoja': '#5dae5a', 'fuego': '#f0603e', 'agua': '#3f9bd6', 'electrico': '#f7d54a', 'aire': '#bfe3f5', 'roca': '#8a7f72', 'sombra': '#7a4cb0'}
for k in CVD:
    for a, b in itertools.combinations(EL, 2):
        if de(EL[a], EL[b], k) < 12: fallos.append(f'elementos confundibles ({k}): {a} y {b}')
print('los 7 elementos no se confunden entre sí con daltonismo')
# 4 · interfaz: se replica uiColor() de src/galeria.js
FONDO, OSC, CLARO = '#2d2540', '#2a1b30', '#fff9ee'
def hsl(rgb):
    r, g, b = [v / 255 for v in rgb]; M_, m = max(r, g, b), min(r, g, b); l = (M_ + m) / 2; h = s = 0
    if M_ != m:
        d = M_ - m; s = d / (2 - M_ - m) if l > 0.5 else d / (M_ + m); h = (((g - b) / d) % 6 if M_ == r else (b - r) / d + 2 if M_ == g else (r - g) / d + 4) * 60
    return h, s, l
def rgbh(h, s, l):
    c = (1 - abs(2 * l - 1)) * s; x = c * (1 - abs((h / 60) % 2 - 1)); m = l - c / 2
    r, g, b = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][int(h // 60) % 6]
    return '#%02x%02x%02x' % tuple(round((v + m) * 255) for v in (r, g, b))
def ui(hx):
    c = hx
    for _ in range(4):
        if contraste(c, FONDO) >= 3.2 and (contraste(c, OSC) >= 4.5 or contraste(c, CLARO) >= 4.5): break
        h, s, l = hsl([int(c[i:i+2], 16) for i in (1, 3, 5)]); c = rgbh(h, s, min(0.9, l + 0.05))
    return c
CHIPS = dict(EL, comun='#b9b4c4', rara='#4d9bf0', epica='#b06be8', legendaria='#f7d54a', todos='#b9b4c4')
for nom, hx in CHIPS.items():
    c = ui(hx)
    if contraste(c, FONDO) < 3: fallos.append(f'chip {nom}: borde {c} sobre fondo {contraste(c, FONDO):.2f}:1 (< 3)')
    if max(contraste(c, OSC), contraste(c, CLARO)) < 4.5: fallos.append(f'chip {nom}: texto sobre {c} {max(contraste(c, OSC), contraste(c, CLARO)):.2f}:1 (< 4,5)')
for nom, a, b in (('texto sobre fondo', CLARO, FONDO), ('texto sobre panel', CLARO, '#40294a'), ('texto sobre acento', OSC, '#f7d54a')):
    if contraste(a, b) < 4.5: fallos.append(f'{nom}: {contraste(a, b):.2f}:1 (< 4,5)')
print(f'interfaz: {len(CHIPS)} chips y 3 pares de texto con contraste suficiente')
if fallos:
    print('FALLOS:'); [print(' -', f) for f in fallos]; sys.exit(1)
print('TODO BIEN: paletas por región e interfaz.')
