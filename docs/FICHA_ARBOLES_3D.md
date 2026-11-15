# FICHA DE ÁRBOLES 3D (v2.197 · Fase 1 · SOLO DOCUMENTOS · propuesta v2, pendiente de tu aprobación)

Estado: **propuesta**. No se ha tocado código ni `dist/`. Imagen de referencia: `docs/arboles3d_propuesta.png` (alzado y planta con las medidas). Las Fases 2-5 no empiezan hasta tu «hazlo».
Objetivo: que en HD-2D los árboles sean **volúmenes reales** (tronco y copa en 3D, con luz y sombra) en vez de láminas planas, con el mismo carácter del catálogo aprobado (`docs/arboles_final_cuatro.png`, `src/arboles.js`): un solo diseño por tipo.

## 1. Reglas comunes
1. **Unidad:** 1 u = 1 casilla = 16 px. Alturas coherentes con los edificios (muros de 3 u) y con Oli (1,31 u).
2. **Colisión intacta:** en el motor solo bloquea el TRONCO de 1 casilla (como hoy). La copa es solo visual y puede sobresalir.
3. **UNA sola copa por árbol, limpia y simple** (v2: la primera propuesta apilaba bolas y no parecían árboles). La copa es un **sólido de revolución de 8 caras planas (10 en el roble)**, como el octógono escalonado del 2D, con 5-6 anillos de perfil: ancha en el medio y estrechándose arriba y abajo. Sin texturas: el color sale de la normal de cada cara con **luz arriba-izquierda** y los **5 tonos del 2D** (`G.sombreado.COL.copa`: c4 luz · c3 · c2 · c1 · c0 sombra), cada cara plana lleva un solo tono (estilo «low-poly» cuidado). La cara de abajo, la más oscura; la tapa de arriba, la más clara.
4. **Tronco:** prisma de 8 lados, 3 tonos (`COL.tronco`: luz · base · sombra); el roble lleva 3 raíces.
5. **Abeto:** tres conos de 8 lados apilados, un verde más oscuro (c0-c3), como el 2D.
6. **Sin contorno** negro en 3D (como los edificios, que solo lo llevan en aristas).
7. **Sombra en el suelo:** óvalo suave bajo la copa (como las criaturas), nunca junto a otros árboles.
8. **Viento:** solo se mueve la copa (amplitud 0,015 u por unidad de altura, fase por posición); el tronco no. Respeta «menos movimiento».
9. **Oclusión:** si la copa tapa a Oli, Lali o una criatura, se atenúa con trama medio segundo (misma función `ocluir` de los edificios).
10. **Datos y online:** cada tipo gana un campo `vol` en `G.capas` (`src/arboles.js`) con sus medidas; los árboles siguen siendo datos del mapa (casilla `t` o pieza). Nada de estado nuevo: el pintor solo lee. Ligero, generado por código.

## 2. Los cuatro árboles
| Tipo | Alto total | Tronco (alto × ancho) | Copa | Triángulos máx. |
|---|---|---|---|---|
| A · pequeño (`arbol_pequeno`, el de las casillas `t`) | 1,0 u | 0,375 × 0,25 | revolución, 8 caras: radios 0,30 / 0,50 / 0,50 / 0,36 / 0,14 a alturas 0,30 / 0,42 / 0,72 / 0,92 / 1,0 | 70 |
| B · mediano | 1,5 u | 0,50 × 0,25 | revolución, 8 caras, más alta: radios 0,30 / 0,46 / 0,50 / 0,44 / 0,28 / 0,12 a 0,45 / 0,60 / 0,95 / 1,25 / 1,42 / 1,5 | 90 |
| C · abeto | 2,0 u | 0,44 × 0,19 | 3 conos: r 0,46 (0,35-1,05) · r 0,37 (0,80-1,55) · r 0,27 (1,25-2,0) | 90 |
| D · roble hito (uno por zona) | 2,5 u | 0,80 × 0,375 + raíces | revolución, 10 caras, copa redonda y simétrica: radios 0,45 / 0,78 / 0,90 / 0,90 / 0,76 / 0,44 / 0,16 a 0,78 / 0,98 / 1,35 / 1,85 / 2,20 / 2,42 / 2,5 | 160 |

Copa de A y B: ~1,0 u de ancho. Copa de D: ~1,8 u (sobresale de su casilla; solo el tronco bloquea). El abeto (C) no cambia.

**2D del roble (v2.197, hecho):** la copa de `roble_hito` es ahora UN solo círculo simétrico (antes cuatro lóbulos), con el mismo sombreado de 5 tonos.

## 3. Rendimiento
Un solo modelo por tipo y **una malla con instancias** para todos los árboles del mapa. Presupuesto: ≤ 60 árboles → < 10.000 triángulos en pantalla. Si no llega a 30 fps, el HD-2D baja a las láminas actuales (ya existen como respaldo).

## 4. Fases (las Fases 2-5 esperan tu «hazlo»)
| Fase | Esfuerzo | Qué |
|---|---|---|
| 1 | LOW | **Esta ficha** (hecha). |
| 2 | MEDIUM | **HECHA (v2.198).** Modelo 3D por código (`src/arboles3d.js`, puro) con tests. |
| 3 | MEDIUM | **HECHA (v2.198).** Integración en el HD-2D: una malla con todos los árboles, viento en la copa, sombra suave, oclusión con trama y respaldo a láminas. |
| 4 | LOW | Colocación en los mapas / editor (decidir dónde van; hoy Albanota no tiene árboles). |
| 5 | LOW | Pruebas, capturas a 390×844, documentos y ZIP. |

## 5. A decidir por ti
1. ¿Te valen las alturas (1 / 1,5 / 2 / 2,5 u) respecto a Oli y los edificios?
2. ¿Te gusta la copa limpia de caras planas (como en `docs/arboles3d_propuesta.png`)? Si la quieres más redonda, subo las caras (12) o más suave.
3. ¿Quieres viento en las copas o árboles quietos?
4. La regla de Albanota (3 nov) dice «sin árboles nuevos»: ¿la mantenemos o los colocamos en la Fase 4?

## 6. Estado v2.198 (fases 2 y 3 hechas; las 4 preguntas sin responder: se aplicaron los valores recomendados)
- Aplicado: alturas 1 / 1,5 / 2 / 2,5 u; copa limpia de caras planas; viento en la copa (respeta «menos movimiento»); la regla de Albanota queda para la Fase 4.
- `src/arboles3d.js` (puro): `TIPOS` (medidas en el propio módulo, no en un campo `vol` de `G.capas`: más sencillo), `modelo`, `build`, `sombras`. Triángulos: pequeño 72+16, etc. (tope por tipo en `test.js`).
- `src/hd2d_pintor.js`: los árboles de casillas `t` (y los objetos del catálogo `arbol_*`, `abeto`, `roble_hito` si se colocan en un mapa) van en UNA malla con color por vértice; sombras suaves en otra malla translúcida; viento solo en la copa; **oclusión** con la misma trama de los edificios (`ocluirArboles`, trama por vértice `aVis`). Si algo falla (`E.arbol3dOff`) vuelven las láminas de siempre.
- Medido en `pueblo_inicial` (289 árboles): 27.744 triángulos de árboles, 14 llamadas de dibujo. Albanota hoy no muestra árboles en pantalla (su mapa no tiene casillas `t` visibles en la plaza).
