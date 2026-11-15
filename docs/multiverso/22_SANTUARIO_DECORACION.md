# 22 · Santuario: personalización y decoración (Etapa B, bloque 4, v2.368)

**Principio:** solo estética. Sin efectos, sin moneda nueva, sin ingresos. Solo se pagan Brillos al colocar.

## Contrato
- Datos: `datos/santuario.json` → `decoracion.piezas` (clave letra única, objeto 1×1 del catálogo, `nivel`, `coste` {combates, minimo}, `donde`: `plaza`/`borde`, `origen`/`req` opcionales: mismo mecanismo que los aportes del doc 21).
- Huecos por nivel: `nHuecos(n) = 4 + 2·filas`: 4 de plaza (junto al camino central) y 2 por fila de hábitats (`borde`, junto a la avenida).
- Estado: `rec.dec` (array de claves de pieza o null) y `rec.nom` (nombre ≤ 20 caracteres, saneado).
- Id del hogar: `santuario/hogar_<n>_<hábitats>[_i<inst>][_d<piezas>]_<jugador>`. Sin piezas no hay tramo `_d` (los ids anteriores siguen valiendo). El trazado sigue puro y determinista; al cambiar el id no hay cachés viejas.
- Órdenes: `santuario.decorar {d, tipo|null}` (colocar cuesta; cambiar cuesta la nueva pieza; quitar es gratis y no devuelve nada; solo el hogar propio) y `santuario.nombrar {nom}`.
- Guardado: `limpiarRec` conserva lo válido y completa los registros antiguos.
- Panel: sección «Decoración y nombre» (nombre, huecos, selector de piezas con coste o aporte pendiente).

## Piezas y costes (PROPUESTOS, pendientes de aprobación)
maceta N1 1/40 · barril N1 2/60 · farola N1 3/90 · roca N2 2/60 · árbol N2 3/90 · abeto N2 3/90 · espantapájaros N3 4/120 (combates/mínimo ✦).

## Verificación
`prueba_santuario.js` §22-24 (ids, validador, 5 niveles con todos los huecos llenos: 100 % alcanzables y piezas en su sitio, órdenes, guardado, vista) y `prueba_santuario.py` (panel + capturas `santuario_v2368_*`).
