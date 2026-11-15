#!/usr/bin/env python3
# tools/prueba_volumenes_tex.py — prueba en Chromium (móvil) las TEXTURAS por cara de los volúmenes (v2.68, paso B2a): dibuja las de la Casa de Lali con el código real del juego,
# comprueba píxeles (opacas, luz > base > sombra, la fachada sur es el recorte exacto del 2D) y guarda la hoja de contacto en docs/volumenes_tex_casa.png.
# Uso: node build.js && python3 tools/prueba_volumenes_tex.py [dist/criaturas.html] [salida.png]   (necesita playwright)
import sys, os, base64, json
from playwright.sync_api import sync_playwright
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(aqui)
html = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'dist', 'criaturas.html'))
salida = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raiz, 'docs', 'volumenes_tex_casa.png')
JS = r"""
() => {
  const G = window.G, V = G.volumenes, TX = G.volTex, d = G.OBJETOS.casa, geo = V.geometria(d.huella, d.vol), Z = 3, errores = [], info = {};
  const brillo = (c) => { const x = c.getContext('2d'), im = x.getImageData(0, 0, c.width, c.height).data; let s = 0, opacos = 0; for (let i = 0; i < im.length; i += 4) { s += (im[i] * 3 + im[i + 1] * 6 + im[i + 2]) / 10; if (im[i + 3] === 255) opacos++; } return [s / (im.length / 4), opacos / (im.length / 4)]; };
  // 1 · todas las caras de la casa tienen textura con el tamaño de su uv y totalmente opaca
  const lista = geo.poligonos.map((p) => { const t = TX.textura('casa', p); return { p, t }; });
  info.polis = lista.length; info.sin = lista.filter((q) => !q.t).length;
  lista.forEach(({ p, t }) => { if (!t) { errores.push('sin textura: ' + p.parte + ' ' + (p.cara || '')); return; } const [b, op] = brillo(t.c); if (p.parte === 'veleta') { if (!(op > 0.35 && op < 0.95)) errores.push('la campana de la veleta debe tener fondo transparente y campana opaca (' + op.toFixed(3) + ')'); } else if (op < 0.999) errores.push('hay píxeles transparentes en ' + t.clave + ' (' + op.toFixed(3) + ')'); });
  // 2 · la fachada sur (tramo izquierdo) es el recorte exacto del dibujo 2D
  const izq = lista.find(({ p }) => p.parte === 'muro' && p.cara === 's' && Math.min(...p.v.map((q) => q[0])) === 0), c2 = G.makeCanvas(d.w, d.h), x2 = c2.getContext('2d'); d.dibujar(x2);
  { const t = izq.t, a = t.c.getContext('2d').getImageData(0, 0, t.w, t.h).data, b = x2.getImageData(d.vol.fachada[0], d.vol.fachada[1], t.w, t.h).data; let dif = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) dif++; info.difFachada = dif; if (dif) errores.push('la fachada sur no es el recorte del 2D (' + dif + ' valores distintos)'); info.fachadaPx = [t.w, t.h]; }
  // 3 · luz fija: para el mismo dibujo, luz > base > sombra en brillo medio (lateral y faldón)
  const mid = (parte, cara, tono) => { const p0 = geo.poligonos.find((p) => p.parte === parte && p.cara === cara), p = Object.assign({}, p0, { tono }), t = TX.textura('casa', p); return brillo(t.c)[0]; };
  info.lateral = ['luz', 'base', 'sombra'].map((t) => +mid('muro', 'o', t).toFixed(1)); info.faldon = ['luz', 'base', 'sombra'].map((t) => +mid('faldon', 'n', t).toFixed(1)); info.hastial = ['luz', 'base', 'sombra'].map((t) => +mid('hastial', 'o', t).toFixed(1));
  [info.lateral, info.faldon, info.hastial].forEach((v, i) => { if (!(v[0] > v[1] && v[1] > v[2])) errores.push('el brillo no baja de luz a sombra en ' + ['lateral', 'faldón', 'hastial'][i] + ': ' + v.join(' > ')); });
  // 4 · cada textura se pide una sola vez (caché) y las de tono distinto son distintas
  info.usadas = TX.usadas; const n0 = TX.usadas; geo.poligonos.forEach((p) => TX.textura('casa', p)); if (TX.usadas !== n0) errores.push('la caché no reutiliza las texturas');
  // 5 · hoja de contacto: una columna por tono para lateral, faldón y hastial; debajo las caras reales de la casa (las 13)
  const W = 1260, H = 900, hoja = document.createElement('canvas'); hoja.width = W; hoja.height = H; const h = hoja.getContext('2d'); h.imageSmoothingEnabled = false; h.fillStyle = '#2d2540'; h.fillRect(0, 0, W, H);
  h.font = '14px monospace'; h.fillStyle = '#fff9ee';
  let y = 8; [['muro', 'o', 'lateral'], ['faldon', 'n', 'faldón'], ['hastial', 'o', 'hastial']].forEach(([parte, cara, nom]) => { let x = 8; ['luz', 'base', 'sombra'].forEach((tono) => { const p0 = geo.poligonos.find((p) => p.parte === parte && p.cara === cara), t = TX.textura('casa', Object.assign({}, p0, { tono })); h.drawImage(t.c, x, y + 16, t.w * Z, t.h * Z); h.fillText(nom + ' · ' + tono, x, y + 12); x += t.w * Z + 16; }); y += 16 + Math.max(...['luz'].map(() => { const p0 = geo.poligonos.find((p) => p.parte === parte && p.cara === cara); return TX.medida(p0)[1]; })) * Z + 12; });
  let x = 8; lista.forEach(({ p, t }) => { if (x + t.w * 2 > W - 8) { x = 8; y += 0; } });
  y += 8; h.fillStyle = '#fff9ee'; h.fillText('las caras de la Casa de Lali (muros, tejado, chimenea, veleta), tal como las pide el volumen (×2)', 8, y); y += 8; x = 8; let fila = 0;
  lista.forEach(({ p, t }) => { if (x + t.w * 2 > W - 8) { x = 8; y += fila + 22; fila = 0; } h.drawImage(t.c, x, y + 12, t.w * 2, t.h * 2); h.fillStyle = '#fff9ee'; h.font = '11px monospace'; h.fillText(p.parte + (p.cara ? ' ' + p.cara : '') + ' ' + p.tono, x, y + 9); x += t.w * 2 + 10; fila = Math.max(fila, t.h * 2); });
  // 6 · v2.69 · el ATLAS de la casa: una textura, cada polígono lee de su rectángulo y ahí está su dibujo exacto
  const A = TX.atlas('casa', geo); info.atlas = [A.w, A.h, A.texturas];
  if (A.w !== 256 || A.h > 256) errores.push('el atlas de la casa no cabe en 256×256: ' + A.w + '×' + A.h);
  const axc = A.canvas.getContext('2d'); let malUv = 0; const ax2 = (x, y) => axc.getImageData(x, y, 1, 1).data;
  const med = (a, k) => a.reduce((m, q) => m + q[k], 0) / a.length, e = 1e-6;
  lista.forEach(({ p, t }, i) => { // el píxel del centro del polígono leído por sus uv del atlas debe ser el de la textura sola (las texturas van alineadas por ABAJO: v = 0 es su fila de abajo)
    const us = A.uv[i], ax = Math.floor(med(us, 0) * A.w + e), ay = Math.floor(A.h - med(us, 1) * A.h + e), a = ax2(ax, ay);
    const tx = Math.min(t.w - 1, Math.max(0, Math.floor(med(p.uv, 0) * 16 + e))), ty = Math.min(t.h - 1, Math.max(0, Math.floor(t.h - med(p.uv, 1) * 16 + e))), b = t.c.getContext('2d').getImageData(tx, ty, 1, 1).data;
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3]) { malUv++; (info.malLista = info.malLista || []).push(p.parte + ' ' + (p.cara || '') + ' a=' + [...a] + ' b=' + [...b]); } });
  info.uvMal = malUv; if (malUv > 0) errores.push('hay ' + malUv + ' polígonos cuya uv no apunta a su textura en el atlas');
  info.atlasPng = (() => { const c = document.createElement('canvas'); c.width = A.w * 3; c.height = A.h * 3; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#2d2540'; x.fillRect(0, 0, c.width, c.height); x.drawImage(A.canvas, 0, 0, c.width, c.height); return c.toDataURL('image/png'); })();
  info.png = hoja.toDataURL('image/png'); info.altoUsado = y + fila + 24; info.errores = errores; return info;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(500)
    r = pg.evaluate(JS); b.close()
png = r.pop('png'); open(salida, 'wb').write(base64.b64decode(png.split(',')[1]))
atl = r.pop('atlasPng'); open(os.path.join(os.path.dirname(salida), 'volumenes_atlas_casa.png'), 'wb').write(base64.b64decode(atl.split(',')[1]))
try:
    from PIL import Image
    im = Image.open(salida); im.crop((0, 0, im.width, min(im.height, r['altoUsado']))).save(salida)
except Exception: pass
print(json.dumps({k: v for k, v in r.items() if k != 'altoUsado'}, ensure_ascii=False))
mal = r['errores'] + errs
print('TODO BIEN' if not mal else 'FALLA: ' + '; '.join(mal)); sys.exit(1 if mal else 0)
