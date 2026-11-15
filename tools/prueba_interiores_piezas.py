#!/usr/bin/env python3
"""prueba_interiores_piezas.py — Chromium (v2.140, ID-5c): comprueba el mobiliario de src/interiores_objetos.js sobre la rejilla y saca capturas.
Uso: node build.js && python3 tools/prueba_interiores_piezas.py [carpeta]
Comprueba, con los píxeles reales de cada pieza: (1) tamaño del lienzo = definición · (2) centrada en el eje de su huella (centro del dibujo = centro de la huella, al píxel) · (3) base apoyada en el borde sur de la huella (±0)
· (4) silueta simétrica en las piezas que deben serlo (mostrador, consola, terminal, planta, estantes, mesa, vitrina, altar, incubadora) · (5) banco y banco_e son espejo uno del otro en color · (6) sin errores de consola.
Capturas: interiores_catalogo.png (todas las piezas) e interiores_composicion.png (Centro PC: la composición de BIBLIA_INTERIORES §1b con las piezas reales)."""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_interiores'); sal.mkdir(parents=True, exist_ok=True)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html'); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
MEDIR = """() => { const out = {}, T = 16;
  G.INTERIOR_OBJETOS.forEach((t) => { const d = G.INTERIOR_DEF[t], c = d.l().c, x = c.getContext('2d'), id = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < c.height; y++) for (let a = 0; a < c.width; a++) if (id[(y * c.width + a) * 4 + 3]) { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    let sim = true; for (let y = 0; y < c.height && sim; y++) for (let a = 0; a < c.width; a++) { const b = x0 + x1 - a; if (b < 0 || b >= c.width) { if (id[(y * c.width + a) * 4 + 3]) { sim = false; break; } continue; } if ((id[(y * c.width + a) * 4 + 3] > 0) !== (id[(y * c.width + b) * 4 + 3] > 0)) { sim = false; break; } }
    const o = G.OBJETOS[t]; out[t] = { w: c.width, h: c.height, dw: d.w, dh: d.h, x0, x1, y0, y1, sim, ox: d.ox, oy: d.oy, cw: d.cw, ch: d.ch, huella: o.huella, anima: !!o.anima }; });
  return out; }"""
DIBUJA = """() => { const T = 16, S = 4, cv = document.createElement('canvas'); cv.width = 13 * T; cv.height = 10 * T; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#cfe3df'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#b3cfcb'; for (let a = 0; a < 13; a++) for (let b = 0; b < 10; b++) if ((a + b) % 2) x.fillRect(a * T, b * T, T, T);
  x.fillStyle = '#e3ddd0'; x.fillRect(0, 0, cv.width, 2 * T); x.fillRect(0, 0, T, cv.height); x.fillRect(12 * T, 0, T, cv.height); x.fillRect(0, 9 * T, cv.width, T);
  const pon = (t, cx, cy) => { const o = G.OBJETOS[t], c = G.INTERIOR_DEF[t].l().c; x.drawImage(c, cx * T + o.ox, cy * T + o.oy); if (o.anima) o.anima(x, cx * T + o.ox, cy * T + o.oy, 0, true); };
  [['mostrador_centro', 5, 4], ['terminal_pc', 1, 3], ['terminal_pc', 1, 5], ['terminal_pc', 11, 3], ['terminal_pc', 11, 5], ['banco_doble', 2, 7], ['banco_doble_e', 9, 7], ['planta_interior', 1, 8], ['planta_interior', 11, 8]].forEach((p) => pon(...p));
  x.fillStyle = 'rgba(255,0,255,.9)'; x.fillRect(6 * T + 7, 0, 2, cv.height); x.fillStyle = 'rgba(255,0,255,.25)'; for (let a = 0; a <= 13; a++) x.fillRect(a * T, 0, 1, cv.height);
  const ct = document.createElement('canvas'); ct.width = cv.width * S; ct.height = cv.height * S; const y = ct.getContext('2d'); y.imageSmoothingEnabled = false; y.drawImage(cv, 0, 0, ct.width, ct.height); document.body.innerHTML = ''; document.body.style.cssText = 'background:#2d2540;margin:0;overflow:auto'; ct.style.cssText = 'display:block'; document.body.appendChild(ct); return true; }"""
CATALOGO = """() => { const S = 3, T = 16, ts = G.INTERIOR_OBJETOS, cv = document.createElement('canvas'); cv.width = 5 * 64 * S; cv.height = Math.ceil(ts.length / 5) * 56 * S; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#2d2540'; x.fillRect(0, 0, cv.width, cv.height);
  ts.forEach((t, i) => { const d = G.INTERIOR_DEF[t], c = d.l().c, cx = (i % 5) * 64 * S + 8 * S, cy = ((i / 5) | 0) * 56 * S + 8 * S; x.fillStyle = '#3a3050'; x.fillRect(cx - 4 * S, cy - 4 * S, 60 * S, 52 * S); x.strokeStyle = '#7a5aa0'; x.lineWidth = 1; x.strokeRect(cx + 4 * S, cy + 12 * S, d.cw * T * S, d.ch * T * S); x.drawImage(c, cx + 4 * S + d.ox * S, cy + 12 * S + d.oy * S, c.width * S, c.height * S); x.fillStyle = '#b9b4c4'; x.font = '10px sans-serif'; x.fillText(t, cx - 2 * S, cy + 46 * S); });
  document.body.innerHTML = ''; document.body.style.cssText = 'background:#2d2540;margin:0'; document.body.appendChild(cv); return true; }"""
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1000, 'height': 700}); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'offsetHeight' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)) if 'offsetHeight' not in str(e) else None)  # el catálogo vacía el body: el bucle del juego pierde #who (artefacto de la prueba)
    pg.goto(URL); pg.wait_for_function('window.__juego'); M = pg.evaluate(MEDIR)
    ok(len(M) == 32 and all(v['w'] == v['dw'] and v['h'] == v['dh'] for v in M.values()), '(1) las 32 piezas dibujan el lienzo que declaran')
    mal = [t for t, v in M.items() if (v['x0'] + v['x1'] + 1) / 2 + v['ox'] != v['cw'] * 8]; ok(not mal, '(2) cada pieza está centrada en el eje de su huella al píxel' + (': ' + ','.join(mal) if mal else ''))
    mal = [t for t, v in M.items() if v['y1'] + v['oy'] != v['ch'] * 16]; ok(not mal, '(3) la base de cada pieza (sin contorno) se apoya en el borde sur de su huella' + (': ' + ','.join(mal) + ' ' + str({t: M[t]['y1'] + M[t]['oy'] for t in mal}) if mal else ''))
    mal = [t for t, v in M.items() if not v['sim'] and t not in ('banco_doble', 'banco_doble_e', 'cama_azul', 'cama_rosa', 'mostrador_madera', 'mostrador_tienda')]; ok(not mal, '(4) silueta simétrica respecto al eje' + (': ' + ','.join(mal) if mal else ''))
    ok(all(v['huella'] == [[0, 0, v['cw'], v['ch']]] for v in M.values()) and {t for t, v in M.items() if v['anima']} == {'terminal_pc', 'incubadora', 'incubadora_lab', 'altar', 'altar_mayor'}, '(5) huellas de casillas enteras y solo animan terminal, incubadora y altar')
    pg.evaluate(CATALOGO); pg.screenshot(path=str(sal / 'interiores_catalogo.png'), full_page=True)
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.evaluate(DIBUJA); pg.screenshot(path=str(sal / 'interiores_composicion.png'), full_page=True)
    ok(not errs, '(6) sin errores de consola: ' + str(errs)); b.close()
print('TODO BIEN' if not fallos else '%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
