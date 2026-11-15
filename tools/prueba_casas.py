#!/usr/bin/env python3
# tools/prueba_casas.py — prueba en Chromium (v2.72, paso C) las casas de Albanota: dibujo 2D (colores de postigos, flores, teja; v2.79: el laboratorio es el centro de estudio de criaturas) y texturas 3D (fachada = recorte del 2D, variantes, atlas).
# Uso: node build.js && python3 tools/prueba_casas.py [dist/criaturas.html] [salida.png]   (necesita playwright)
import sys, os, json, base64
from playwright.sync_api import sync_playwright
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(aqui)
html = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'dist', 'criaturas.html'))
salida = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raiz, 'docs', 'casas_v272.png')
JS = r"""
() => {
  const G = window.G, V = G.volumenes, TX = G.volTex, T = ['casa', 'casa_lali', 'casa_oli', 'laboratorio'], R = {}, err = [];
  const px = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  const cuenta = (c, col, x0 = 0, y0 = 0, x1 = c.width, y1 = c.height) => { const d = px(c); let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (hex(d, (y * c.width + x) * 4) === col && d[(y * c.width + x) * 4 + 3] === 255) n++; return n; };
  const dib = {}; T.forEach((t) => { const d = G.OBJETOS[t], c = G.makeCanvas(d.w, d.h), x = c.getContext('2d'); x.imageSmoothingEnabled = false; d.dibujar(x); dib[t] = c; });
  const rb = { casa: 52, casa_lali: 52, casa_oli: 52, laboratorio: 58 };
  // 1 · 2D: postigo izquierdo de la ventana (x 11-14), teja y pizarra
  const post = { casa: '#2a8187', casa_lali: '#4d7fd6', casa_oli: '#e47a9a', laboratorio: '#2a8187' };   // laboratorio: en 3D, la franja turquesa de los laterales (v2.77); en 2D no lleva postigos
  T.filter((t) => t !== 'laboratorio').forEach((t) => { const c = dib[t], y = rb[t] + 25, d = px(c); if (hex(d, (y * c.width + 12) * 4) !== post[t]) err.push('2D ' + t + ': postigo ' + hex(d, (y * c.width + 12) * 4) + ' en vez de ' + post[t]); });
  const teja = (t, col) => cuenta(dib[t], col);
  ['casa', 'casa_lali', 'casa_oli'].forEach((t) => { if (teja(t, '#d94a3f') < 400 || teja(t, '#3f7681') !== 0) err.push('2D ' + t + ': tejado rojo esperado'); });
  // v2.79 (L1): laboratorio = centro de estudio de criaturas: parapeto turquesa, cúpula de luz cálida, 7 cristales elementales, huevos, sin tejado rojo ni nada del diseño de ciencia de la v2.77 (acero, cristal frío, vapor, matraces)
  { const L = dib.laboratorio, v277 = ['#7fd3e0', '#4fb0c8', '#d7f5d0', '#bfeab5', '#e6d4f5', '#cdb4ec', '#5dae5a'];
    if (cuenta(L, '#d94a3f') !== 0 || cuenta(L, '#2a8187') < 250) err.push('2D laboratorio: parapeto y marcos turquesa esperados, sin teja roja');
    if (cuenta(L, '#ffe08a') < 3 || cuenta(L, '#ffc45e') < 15 || cuenta(L, '#f5a64a') < 30 || cuenta(L, '#ffe9a8') < 60 || cuenta(L, '#fffbe0') < 30) err.push('2D laboratorio: falta la luz cálida de la cúpula');
    v277.slice(0, 6).forEach((c) => { if (cuenta(L, c) !== 0) err.push('2D laboratorio: quedan colores del diseño de la v2.77 (' + c + ')'); });
    const el = { hoja: '#5dae5a', fuego: '#f0603e', agua: '#4580d4', electrico: '#f7d54a', aire: '#bfe3f5', roca: '#8a7f72', sombra: '#7a4cb0' };
    Object.keys(el).forEach((e) => { if (cuenta(L, el[e], 0, 0, 94, 52) < 3) err.push('2D laboratorio: falta el cristal de ' + e + ' en el tejado'); }); // el verde de Hoja solo cuenta en el tejado (no hay matraz)
    if (cuenta(L, '#fff6dc') < 40) err.push('2D laboratorio: faltan los huevos (ventanal, incubadora, cartel, cúpula)');
    // latido de la cúpula: en reposo el dibujo base no cambia; en el pico se aclara la luz del nido; con movimiento reducido no se pinta nada
    const o = { tipo: 'laboratorio', x: 0, y: 0 }, cam = { x: G.OBJETOS.laboratorio.ox, y: G.OBJETOS.laboratorio.oy }, base = G.makeCanvas(94, 114), cn = G.makeCanvas(94, 114), red = G.makeCanvas(94, 114), r0 = G.capas.reloj, rd = G.capas.REDUCIDO;
    G.capas.dibujarBase(base.getContext('2d'), o, cam); G.capas.dibujarBase(cn.getContext('2d'), o, cam); G.capas.dibujarBase(red.getContext('2d'), o, cam);
    G.capas.REDUCIDO = false; G.capas.reloj = 0; G.capas.animar(base.getContext('2d'), o, cam); G.capas.reloj = 1.6; G.capas.animar(cn.getContext('2d'), o, cam); G.capas.REDUCIDO = true; G.capas.animar(red.getContext('2d'), o, cam); G.capas.reloj = r0; G.capas.REDUCIDO = rd;
    const dif = (a, b) => { const x = px(a), y = px(b); let n = 0; for (let i = 0; i < x.length; i += 4) if (x[i] !== y[i] || x[i + 1] !== y[i + 1] || x[i + 2] !== y[i + 2]) n++; return n; };
    const plano = G.makeCanvas(94, 114); plano.getContext('2d').drawImage(dib.laboratorio, 0, 0);
    if (dif(base, plano) !== 0) err.push('latido: en el pulso 0 el laboratorio debe verse igual que el dibujo base'); if (dif(cn, plano) < 40) err.push('latido: en el pico no se aclara la luz de la cúpula (' + dif(cn, plano) + ' px)'); if (dif(red, plano) !== 0) err.push('latido: con movimiento reducido no debe pintar nada'); }
  // las flores: azules en Lali, rosas en Oli, doradas/rosas en las otras
  const flor = (t, col) => cuenta(dib[t], col, 10, rb[t] + 20, 84, rb[t] + 24); // fila de cabezas, y de la jardinera
  if (cuenta(dib.casa_lali, '#cfe0fa', 10, rb.casa_lali + 18, 84, rb.casa_lali + 24) < 4 || cuenta(dib.casa_lali, '#f5a8bd') > 60) err.push('2D Lali: flores azules');
  if (cuenta(dib.casa_oli, '#fbc7d5', 10, rb.casa_oli + 18, 84, rb.casa_oli + 24) < 4) err.push('2D Oli: flores rosas');
  // 2 · laboratorio: más alto (114); lo más alto es el cristal eléctrico que corona la cúpula (x 44-48); la casa neutra no lleva cristales de elemento
  const lab = dib.laboratorio; if (lab.height !== 114 || lab.width !== 94) err.push('laboratorio mide ' + lab.width + '×' + lab.height);
  { const d = px(lab); let top = -1; for (let y = 0; y < lab.height && top < 0; y++) for (let x = 0; x < 94; x++) if (d[(y * 94 + x) * 4 + 3]) { top = y; var tx = x; break; } if (!(top <= 20 && tx >= 44 && tx <= 48)) err.push('laboratorio: lo más alto no es el cristal de la cúpula (fila ' + top + ', x ' + tx + ')'); }
  if (cuenta(dib.casa, '#4580d4') !== 0 || cuenta(dib.casa, '#7a4cb0') !== 0) err.push('la casa neutra no debe llevar cristales de elemento');
  // 3 · 3D: todas las caras con textura, la fachada sur es el recorte exacto del 2D, variantes distintas y atlas ≤ 256
  const info = {};
  T.forEach((t) => { const d = G.OBJETOS[t], geo = V.geometria(d.huella, d.vol), lista = geo.poligonos.map((p) => ({ p, t: TX.textura(t, p) }));
    if (V.validar(t, d).length) err.push(t + ': vol no válido ' + V.validar(t, d).join(';'));
    if (lista.some((q) => !q.t)) err.push(t + ': hay caras sin textura');
    const izq = lista.find(({ p }) => p.parte === 'muro' && p.cara === 's' && Math.min(...p.v.map((q) => q[0])) === 0), a = px(izq.t.c), fx = d.vol.fachada, b = dib[t].getContext('2d').getImageData(fx[0], fx[1], izq.t.w, izq.t.h).data; let dif = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) dif++; if (dif) err.push(t + ': la fachada 3D difiere del 2D en ' + dif + ' valores');
    const lat = (tono) => TX.textura(t, Object.assign({}, geo.poligonos.find((p) => p.parte === 'muro' && p.cara === 'o'), { tono })).c;
    const baseL = lat('base'); info[t] = { postigo3d: cuenta(baseL, post[t]), atlas: (() => { const A = TX.atlas(t, geo); return [A.w, A.h, A.texturas]; })() };
    if (info[t].postigo3d < 20) err.push(t + ': lateral 3D sin postigos del color de la variante (' + info[t].postigo3d + ')');
    if (t === 'laboratorio') { // v2.82 (L3, 1.ª mitad): azotea plana: cubierta de arena (#c9b48c) y peto con franja turquesa (#2a8187); ni faldones ni hastiales
      const cu = TX.textura(t, geo.poligonos.find((p) => p.parte === 'cubierta')).c, pe = TX.textura(t, Object.assign({}, geo.poligonos.find((p) => p.parte === 'peto' && p.cara === 'o'), { tono: 'base' })).c;
      info[t].teja3d = cuenta(cu, '#c9b48c'); info[t].peto3d = cuenta(pe, '#2a8187');
      if (info[t].teja3d < 3000) err.push(t + ': la cubierta 3D no es de arena (' + info[t].teja3d + ' px)'); if (info[t].peto3d < 150) err.push(t + ': el peto 3D no lleva la franja turquesa (' + info[t].peto3d + ' px)');
      if (geo.poligonos.some((p) => ['faldon', 'hastial', 'chimenea', 'veleta'].includes(p.parte))) err.push(t + ': el laboratorio no debe llevar tejado a dos aguas, chimenea ni veleta');
      const ps = geo.poligonos.find((p) => p.parte === 'peto' && p.cara === 's'), tx = TX.textura(t, ps), a2 = px(tx.c), b2 = dib[t].getContext('2d').getImageData(d.vol.fachada[0], d.vol.fachada[1] - tx.h, tx.w, tx.h).data; let d2 = 0; for (let i = 0; i < a2.length; i++) if (a2[i] !== b2[i]) d2++; if (d2) err.push(t + ': el peto sur 3D difiere del 2D en ' + d2 + ' valores');
    } else {
      const fa = TX.textura(t, geo.poligonos.find((p) => p.parte === 'faldon' && p.cara === 's')).c; info[t].teja3d = cuenta(fa, '#d94a3f');
      if (info[t].teja3d < 300) err.push(t + ': faldón 3D sin el color de su tejado');
      const h = TX.textura(t, Object.assign({}, geo.poligonos.find((p) => p.parte === 'hastial' && p.cara === 'o'), { tono: 'base' })); info[t].lente = cuenta(h.c, '#6fa4e8');
    }
    if (info[t].atlas[0] !== 256 || info[t].atlas[1] > 256) err.push(t + ': atlas fuera de 256×256');
  });
  // 4 · hoja de contacto: 4 casas en 2D ×3 y su atlas
  const Z = 3, W = 4 * 94 * Z + 50, H = 114 * Z + 20, hoja = document.createElement('canvas'); hoja.width = W; hoja.height = H; const h = hoja.getContext('2d'); h.imageSmoothingEnabled = false; h.fillStyle = '#7cc972'; h.fillRect(0, 0, W, H);
  T.forEach((t, i) => { const c = dib[t]; h.drawImage(c, 10 + i * (94 * Z + 10), 10 + (114 - c.height) * Z, c.width * Z, c.height * Z); });
  return { err, info, png: hoja.toDataURL('image/png') };
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 780}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto('file://' + html); pg.wait_for_function('window.G && window.G.OBJETOS')
    r = pg.evaluate(JS); b.close()
open(salida, 'wb').write(base64.b64decode(r['png'].split(',')[1]))
print(json.dumps(r['info'], ensure_ascii=False))
mal = r['err'] + errs
for m in mal: print(' FALLO', m)
print('TODO BIEN (casas 2D y 3D)' if not mal else '%d fallo(s)' % len(mal)); sys.exit(1 if mal else 0)
