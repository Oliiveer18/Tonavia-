# ESQUEMA DE DIMENSIÓN v1 · Multiverso F3
Contrato definitivo (sustituye a la propuesta de `03_PROPUESTAS_DATOS.md §1` en lo que define). Archivo: `datos/dimensiones/<id>.json`; el nombre del archivo ES el id. Validar: `node tools/validar_dimension.js [id…]` (una línea, código 1 si falla). `node build.js` se niega a empaquetar si alguna es inválida o falta `tonavia`.

```json
{ "v": 1, "id": "tonavia", "nombre": "Tonavia",
  "entrada": { "mapa": "albanota", "ancla": "inicio" },
  "regiones": ["silvara", "carbuna", "…"],
  "reglas": { "ciclo": "global" } }
```
| Campo | Regla |
|---|---|
| `v` | entero; 1 = este esquema. Mayor que el que entiende el juego → inválida |
| `id` | `[a-z][a-z0-9_]{0,23}`; igual al nombre del archivo |
| `nombre` | texto 1-60 |
| `entrada` | `{mapa, ancla}` (solo esas claves). El mapa debe ser de la dimensión y tener esa ancla |
| `regiones` | opcional; lista sin repetir de `[a-z][a-z0-9_]{0,31}` (máx. 64). Toda región que declare un mapa de la dimensión debe estar aquí |
| `reglas.ciclo` | opcional; solo `"global"` (un único reloj para todas las dimensiones, decisión aprobada) |
| `_*` | claves que empiezan por `_` son comentarios (no viajan al juego) |

**Cualquier otra clave se rechaza** (dificultad, apariciones, economía, entrenadores, visual, requisitos de portal…): las define la entrega que las implementa (F5 portales, F6 ganchos de contenido, F7 entrenadores). Así nada queda escrito sin efecto.

## Pertenencia de mapas (espacio de nombres)
`dim/mapa` pertenece a `dim`; un id **sin barra** pertenece a `tonavia` (compatibilidad con guardados y huellas; también los pisos generados `prof_*`). `tonavia/x`, `x/` y `/x` no son ids válidos. Un mapa cuyo prefijo no esté registrado no pertenece a ninguna dimensión (error en `comprobar`).

## API (`G.dimensiones`, `src/dimensiones.js`, puro)
`lista()` (tonavia primero) · `existe(id)` · `get(id)` / `entrada(id)` / `regiones(id)` (copias) · `deMapa(idMapa)` → id de dimensión o null · `comprobar(mapas)` → problemas contra mapas reales (entrada y ancla, pertenencia, regiones) · `validar(def, archivo?)` → problemas de esquema · `registro(fuente)` → registro aislado (para pruebas/herramientas) · `errores` = archivos inválidos y su motivo (nunca lanza). `src/mapas.js` toma `INICIAL` de `entrada('tonavia')` (si falta o es inválida, lanza un error claro al arrancar).

## No incluido en F3 (otras entregas)
Carga/descarga de mapas por dimensión, proveedores y validación de paquetes del editor con prefijos (F4) · `j.dim`, portales y Nexus (F5) · dificultad, apariciones, economía, marcas de progreso (F6) · entrenadores por dimensión (F7) · guía de contenido y plantilla (F8).


## Actualización F6 (v2.357): esquema v2
`ESQUEMA = 2`. Los archivos `v: 1` siguen valiendo tal cual (Tonavia y Nexus no cambian). Con `v: 2` se admiten las claves opcionales `apariciones`, `nivel` y `economia`; con `v: 1` se rechazan. Forma y reglas en `13_GANCHOS_F6.md` §1.


## Actualización F7 (v2.358): esquema v3
`ESQUEMA = 3`. Los archivos `v: 1` y `v: 2` siguen valiendo tal cual. Con `v: 3` se admite la clave opcional `entrenadores` (población, grafo propio, nombres, frases, pesos de ambición y fijos) en las dimensiones que no son `tonavia`; con `v` < 3 se rechaza. Forma y reglas en `14_ENTRENADORES_F7.md` §1.

## Actualización FN (v2.360): esquema v4
`ESQUEMA = 4`. Los archivos `v: 1`–`3` siguen valiendo tal cual. Con `v: 4` se admite la clave opcional `navegacion` (`mar.mapas` 3×3, `barco`, `puntos`, `rutas`, `mareas`, `eventos`, `travesia`); con `v` menor se rechaza («exige v ≥ 4»). Un archivo `v: 5` o mayor se trata como futuro. Detalle y contrato: `15_NAVEGACION_FN.md`.
