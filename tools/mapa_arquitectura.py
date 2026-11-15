#!/usr/bin/env python3
"""tools/mapa_arquitectura.py — regenera docs/MAPA_ARQUITECTURA.md (módulos de src/ con líneas y su primera línea de comentario). Úsalo al acabar cada tarea. Uso: python3 tools/mapa_arquitectura.py"""
import glob, os, re
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); rows = []
for f in sorted(glob.glob(os.path.join(raiz, 'src', '*.js'))):
    s = open(f, encoding='utf8', errors='ignore').read(); m = re.search(r'^//\s*(.+)$', s, re.M); d = re.sub(r'^[\w./-]+\.js\s*[—-]\s*', '', (m.group(1) if m else '').strip())[:170]
    rows.append((os.path.basename(f), s.count('\n') + 1, d))
o = '# MAPA DE ARQUITECTURA (generado)\n\nGenerado con `python3 tools/mapa_arquitectura.py` (%d módulos, %d líneas). Orden de carga: `src/orden.json`. Datos: `maps/*.json`. Herramientas: `tools/`. Pruebas: `test.js` y `tools/prueba_*.py`.\n\n| Módulo | Líneas | Qué es |\n|---|---:|---|\n' % (len(rows), sum(r[1] for r in rows))
o += ''.join('| `%s` | %d | %s |\n' % (a, b, c.replace('|', '/')) for a, b, c in rows)
open(os.path.join(raiz, 'docs', 'MAPA_ARQUITECTURA.md'), 'w').write(o); print(len(rows), 'módulos')
