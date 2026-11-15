# F6 · Ganchos de contenido (contrato v2.357)
Qué ofrece el núcleo a los módulos y al contenido. Todo es **opcional y neutro por defecto**: Tonavia (esquema v1, sin ajustes) se comporta y se guarda exactamente igual que antes (huellas 2D/clásico y `agentes_diag` sin cambios).

## 1. Ajustes por dimensión y región (esquema de dimensión **v2**)
`datos/dimensiones/<id>.json` con `"v": 2` admite tres claves nuevas (con `v: 1` se rechazan; las demás reglas del esquema no cambian):
```
"apariciones": { "rareza": {"comun":60,"rara":28,"epica":10},        // pesos 0..1000 (parciales: el resto hereda)
                 "lineas": {"pompon": 3, "zefirax": 0},               // multiplicador por línea 0..10 (0 = no sale; 1 = igual)
                 "regiones": { "<región>": { "rareza": {…}, "lineas": {…} } } },   // la región pisa a la dimensión clave a clave
"nivel":        { "base": 0, "regiones": { "<región>": 5 } },         // se SUMA al nivel de las salvajes (entero 0..40; tope final 50)
"economia":     { "premios": 1, "precios": 1 }                        // 0,1..10: Brillos ganados en combate · precio de compra y de curar
```
- Las líneas deben existir en `G.LINEAS`; las regiones, estar en `regiones`. `G.dimensiones.ajustesDe(mapa)` → `{ rareza, lineas, nivel, premios, precios }` (`G.dimensiones.NEUTRO` si no hay nada: Tonavia, prefijo desconocido, mapas generados).
- **Aparición** (`aparicion.plan(semilla, mapa, lineas?, reglas?)`): sin reglas, el plan es idéntico al de siempre (mismas llamadas al azar). Con ellas: los pesos de rareza pisan a `PESOS`; el multiplicador pondera la elección dentro de la rareza (una sola llamada al azar, como antes); `0` excluye la línea y quita su guarida; el máximo de iguales por zona se respeta. Las legendarias solo salen en guarida.
- **Nivel base** (`combate_motor.iniciar`): `nivelSalvaje + nivelExtra(Profundidades) + nivel base de la región`, tope 50.
- **Economía** (`tienda.js`): `premioDe(j, np, ne, rar)` = `premioCombate` × `premios` de la dimensión del jugador (mín. 1 ✦); `precioCompra(id, j)` y `costeCurar(j)` × `precios`. Los entrenadores autónomos (sin jugador) no escalan: es asunto de F7. `precioVenta` no cambia.

## 2. Marcas de progreso (`src/marcas.js`, `G.marcas`)
Entero 1..1.000.000 con nombre `modulo.clave`, por jugador y dimensión. `dar(est, j, dim, clave, valor=1)` (0 la quita), `valor`, `tiene(…, n)`, `lista`. Máx. 256 por jugador y dimensión; la dimensión debe estar registrada; `registrar(modulo, { validar(clave, valor) })` valida las marcas de un módulo (una vez por módulo).
- Viven en `est.marcas[dim][jugador]` (no existe hasta que se usa: el estado no cambia para quien no las usa).
- **Guardado:** dentro de la sección de su dimensión (`dim.<id>.marcas`; Tonavia en `dim.tonavia.marcas`). La sección de Tonavia sube a **v2 solo si lleva marcas**; sin ellas se sigue escribiendo v1. `SECCION_TONAVIA` (máxima que se entiende) pasa a 2, así una versión anterior (≤ v2.356) que encuentre marcas de Tonavia lo trata como «versión futura» y no las pisa. Las secciones de otras dimensiones ya se conservaban tal cual.
- **Carga:** se sacan de la sección a `est.marcas` y se limpian (forma, rango, límites). Las de un módulo no registrado o de una dimensión no instalada **se conservan**; las rotas se descartan sin romper la carga.

## 3. Registro de órdenes para módulos (`G.motor.ordenes`)
`registrar('modulo.accion', { validar?(est, j, o) → null | motivo, aplicar(est, j, o) → resultado })`. El tipo lleva punto (las órdenes internas nunca lo llevan, así no chocan). `motor.aplicar` consulta primero el registro; `validar` con motivo ⇒ aviso al jugador y no se aplica; si el módulo falla, la orden se descarta con un aviso y queda en `ordenes.ultimoError` (un módulo roto no tira el juego). Registrar dos veces o con definición inválida lanza. Las órdenes internas (tienda, tablón, buzón…) **no se migran**: siguen como estaban.

## 4. Requisitos de portal con estado
`REQ.<tipo>.cumple(j, r, est)`, `texto(r, j, est)` y `G.portales.comprobar(j, portal, est)` reciben el estado (`motor.cruzar` y `portales_ui` se lo pasan). Sin `est`, los tipos que lo necesitan no se cumplen. Nuevo tipo `{ t:'marca', dim, k:'modulo.clave', n?, texto? }`: se cumple si la marca vale ≥ `n` (1 por defecto). `texto` es lo que ve el jugador en «El portal no se abre: necesitas …».

## 5. Qué NO incluye (otras entregas)
Entrenadores y su economía (F7) · barco, mar y descubrimiento (FN) · `dim` y barco en el mensaje de red, límites de tamaño de `est.dim`/marcas por sección, importar dimensiones en el editor (F8) · contenido real (Sonnet). No hay datos de juego nuevos: ninguna dimensión usa aún estos ajustes.

> v2.367 · Tipo personal `{ t:'profundidad', n }` (récord de Profundidades): solo para hitos del Santuario (`validar(p, {local:true})`); en un portal se rechaza. `G.portales.origenDe(r)` dice a qué dimensión pertenece el hito. Ver `21_SANTUARIO_APORTES.md`.