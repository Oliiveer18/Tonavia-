#!/usr/bin/env python3
"""F2 (v2.92): revisión visual de la fuente redonda del HD-2D SIN Three.js (aquí no hay red). Dibuja la geometría real (G.volumenes) con el atlas real (G.volTex) con un rasterizador de triángulos de Canvas2D (orden por profundidad, sin caras de espaldas) desde 4 giros de cámara y 2 cuadros del agua, y la hoja de contacto del atlas.
Uso: python3 tools/prueba_fuente_f2.py [dist/criaturas.html] [salida.png]   (necesita playwright)"""
import base64, json, os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(raiz, 'dist', 'criaturas.html')
salida = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raiz, 'docs', 'fuente_f2_390x844.png')
GRANDE = len(sys.argv) > 3 and sys.argv[3] == 'grande'   # una sola vista a gran tamaño (para mirar el detalle)
JS = r"""
(GRANDE) => {
  const G = window.G, V = G.volumenes, TX = G.volTex, d = G.OBJETOS.fuente, geo = V.geometria(d.huella, d.vol), at = TX.atlas('fuente', geo), b = V.buferes(geo, 0, 0, 0);
  const info = { triangulos: geo.triangulos, atlas: [at.w, at.h, at.texturas], animadas: at.animadas.length, altoTotal: geo.altoTotal, errores: [] };
  const Z = GRANDE ? 10 : 4, PITCH = 0.98, CW = GRANDE ? 380 : 190, CH = GRANDE ? 400 : 190;
  function vista(yawDeg, cuadro) {
    TX.animar(at, cuadro);
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#e8cd96'; x.fillRect(0, 0, CW, CH);
    const yaw = yawDeg * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(PITCH), sp = Math.sin(PITCH), S = 16 * Z * 0.5, cxm = 0.5, czm = 1.0;
    const proj = (px, py, pz) => { const X = px - cxm, Zc = pz - czm, xr = X * cy - Zc * sy, zr = X * sy + Zc * cy; return [CW / 2 + xr * S, CH * 0.62 - (py * cp - zr * sp * -1) * S + 0, zr * cp + py * sp * 0]; };
    // proyección ortográfica: x de pantalla = xr; y de pantalla = -(py*cos(p)) + zr*sin(p) (zr hacia la cámara = más abajo en pantalla); profundidad = -zr*cos(p) + py*sin(p)... se usa para ordenar
    const P = (px, py, pz) => { const X = px - cxm, Zc = pz - czm, xr = X * cy - Zc * sy, zr = X * sy + Zc * cy; return [CW / 2 + xr * S, CH * 0.66 + (zr * sp - py * cp) * S, -(zr * cp + py * sp)]; };
    // sombra redonda en el suelo (disco gris translúcido, la misma forma que la del pintor)
    const R = V.redonda(d.vol), tris = [];
    for (let i = 0; i < b.i.length; i += 3) {
      const ia = b.i[i], ib = b.i[i + 1], ic = b.i[i + 2], pos = (k) => [b.p[k * 3], b.p[k * 3 + 1], b.p[k * 3 + 2]], A = pos(ia), B = pos(ib), C = pos(ic);
      const n = [b.n[ia * 3], b.n[ia * 3 + 1], b.n[ia * 3 + 2]], nz = n[0] * sy + n[2] * cy, ny = n[1];   // componente de la normal hacia la cámara
      if (nz * sp * -1 * -1 + ny * cp <= -1e-6 && false) continue;
      const hacia = (n[0] * sy + n[2] * cy) * sp + n[1] * cp; if (hacia <= 0.001) continue;   // cara de espaldas
      const pa = P(...A), pb = P(...B), pc = P(...C), t = (k) => [at.uv[0] ? 0 : 0];
      tris.push({ pa, pb, pc, ia, ib, ic, z: (pa[2] + pb[2] + pc[2]) / 3 });
    }
    tris.sort((p, q) => q.z - p.z);
    // uv por vértice (mismo orden que los búferes)
    const U = []; geo.poligonos.forEach((q, i2) => q.v.forEach((_, k) => U.push(at.uv[i2][k])));
    // sombra
    x.fillStyle = 'rgba(70,50,90,0.28)'; x.beginPath(); for (let a = 0; a <= 32; a++) { const t = a / 32 * Math.PI * 2, q = P(cxm + 0.3 + (R.r + 0.08) * Math.cos(t), 0.0, czm + 0.3 + (R.r + 0.08) * Math.sin(t)); if (a) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.fill();
    tris.forEach((t) => {
      const s = [t.pa, t.pb, t.pc], u = [U[t.ia], U[t.ib], U[t.ic]].map((q) => [q[0] * at.w, (1 - q[1]) * at.h]);
      const cxs = (s[0][0] + s[1][0] + s[2][0]) / 3, cys = (s[0][1] + s[1][1] + s[2][1]) / 3, e = (p) => { const dx = p[0] - cxs, dy = p[1] - cys, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * 0.5, p[1] + dy / l * 0.5]; };
      const [x0, y0] = s[0], [x1, y1] = s[1], [x2, y2] = s[2], [u0, v0] = u[0], [u1, v1] = u[1], [u2, v2] = u[2];
      const den = (u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1)); if (Math.abs(den) < 1e-9) return;
      const a = (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / den, bb = (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / den;
      const cc = (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / den, dd = (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / den;
      const ee = (x0 * (u1 * v2 - u2 * v1) + x1 * (u2 * v0 - u0 * v2) + x2 * (u0 * v1 - u1 * v0)) / den, ff = (y0 * (u1 * v2 - u2 * v1) + y1 * (u2 * v0 - u0 * v2) + y2 * (u0 * v1 - u1 * v0)) / den;
      x.save(); x.beginPath(); s.map(e).forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.clip(); x.setTransform(a, bb, cc, dd, ee, ff); x.drawImage(at.canvas, 0, 0); x.restore();
    });
    return c;
  }
  const hoja = document.createElement('canvas'); hoja.width = 390; hoja.height = GRANDE ? 844 : 844; const h = hoja.getContext('2d'); h.imageSmoothingEnabled = false; h.fillStyle = '#1f1b2e'; h.fillRect(0, 0, 390, 844);
  h.font = '12px monospace'; h.fillStyle = '#f0e6c8'; h.fillText('Fuente redonda HD-2D · F2 · giros 0/90/180/270 · cuadro de agua 0 y 2', 8, 14);
  if (GRANDE) { [[0, 0], [180, 2]].forEach(([yaw, n], k) => { h.drawImage(vista(yaw, n), 5, 22 + k * 410); }); info.png = hoja.toDataURL('image/png'); return info; }
  [[0, 0], [90, 0], [180, 2], [270, 2]].forEach(([yaw, n], k) => { const c = vista(yaw, n); h.drawImage(c, (k % 2) * 195, 22 + Math.floor(k / 2) * 195); h.fillText('giro ' + yaw + '°, agua ' + n, 6 + (k % 2) * 195, 34 + Math.floor(k / 2) * 195); });
  h.fillStyle = '#f0e6c8'; h.fillText('atlas ' + at.w + '×' + at.h + ' · ' + at.texturas + ' texturas (×2)', 8, 424);
  TX.animar(at, 0); h.fillStyle = '#2d2540'; h.fillRect(8, 432, 374, 400); h.drawImage(at.canvas, 0, 0, at.w, at.h, 8, 436, at.w * 1.45, at.h * 1.45);
  info.png = hoja.toDataURL('image/png'); return info;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + html); pg.wait_for_timeout(500)
    r = pg.evaluate(JS, GRANDE); b.close()
open(salida, 'wb').write(base64.b64decode(r.pop('png').split(',')[1]))
print(json.dumps(r, ensure_ascii=False)); print('errores de consola:', errs or 'ninguno'); print(salida)
sys.exit(1 if (r['errores'] or errs) else 0)
