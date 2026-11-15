# REFERENCIAS DE MAPAS · Criaturas de Lali y Oli (documento nuevo, propuesto)

Solo documentación: no cambia código ni los documentos existentes. Fuente principal: medición de 16 pueblos de Pokémon (Rojo/Azul, Cristal, Esmeralda) y de Stardew Valley, Animal Crossing y FF6, en el artículo «Pixel-Art Town Layout: Pallet to Pelican Town, Measured» (blakecrosley.com). Casilla = 16 px.

## 1. Qué enseñan los juegos (datos medidos)

| Dato | Pokémon / referencia | Para Albanota |
|---|---|---|
| Tamaño de aldea inicial | Paleta 20×18, Villa Raíz 20×20 | Albanota 48×36 es ciudad grande (Ciudad Verde 40×36): hay que llenarla con aire, no con cosas |
| Pantalla del juego | GBA 15×10 casillas (150) | Tu móvil 8×17 (136): misma superficie, pero estrecha y alta |
| Suelo transitable | 45–63 % en 11 de 16 pueblos | Objetivo: 50–60 % |
| Edificios | 5–22 %, mediana 13 % | Objetivo: 8–12 % |
| Agua | 0–21 % | Arroyo + estanque: 5–8 % |
| Casas | familiares 5×5; laboratorio 7×5; Centro y Tienda 4×4; gimnasio 6×5 | Casa 5×5, laboratorio 7×5, Centro PC 7×5, tienda 5×4 |
| Primera puerta | 5–17 casillas desde la entrada, mediana 12 | Primera puerta a ~12 casillas del inicio |
| Anchura de camino | mediana 3–7; mínimo 2 | Caminos principales 3; secundarios 2; nunca 1 |
| Rodeos | a pie ≈ línea recta (×1,0–1,3); solo unas pocas puertas con rodeo grande | Camino directo a lo cotidiano; rodeo solo a lo «especial» |
| Callejones sin salida | 0,1–2,7 por cada 100 casillas transitables | Máximo 1 por 100 y todos con premisa (cofre, vista, cartel) |
| Salidas a pie | aldeas 1; ciudades 2–4 | 2 tras el inicio (ruta + bosque) |
| Punto de vuelo | 1 casilla al sur de la puerta del Centro | Ancla `volver` igual |
| Carteles | del comercio a 1–2 casillas de su puerta; del pueblo en el cruce de caminos | Igual |
| Stardew (Pelican Town) | ~120×110 casillas, edificio ~10×11 | Referencia de «mucho espacio y caminos largos», no de tamaño |

**Lo que NO está medido en ninguna fuente:** las casillas libres alrededor de cada casa. Es una regla de diseño nuestra (ver 2), no un dato de Pokémon.

## 2. Reglas propuestas para Albanota (pendientes de aprobar con el plano)
1. **Espacio libre:** 50–60 % transitable; edificios 8–12 %; agua 5–8 %; resto arbolado y borde.
2. **Alrededor de cada casa:** 3–4 casillas libres (regla propia). Entre casas del mismo barrio, mínimo 4.
3. **Entre zonas con carácter (claros, plaza, barrio, huertos):** 6–10 casillas de paisaje con camino.
4. **Plaza:** 4 casillas abiertas por cada lado.
5. **Caminos:** 3 de ancho el principal, 2 los secundarios; sin tramos de 1.
6. **Pantalla de móvil (8×17):** 2–3 cosas importantes por pantalla; se comprobará deslizando una ventana 8×17 por el plano.
7. **Primera puerta** a ~12 casillas del inicio; ancla `inicio` en la plaza o delante de una casa.
8. **Dos salidas:** ruta (por el puente) y entrada al bosque.

## 3. Aviso de viabilidad
Con 48×36 = 1.728 casillas, 7 claros + plaza + barrio + centro cívico + huertos + 6–10 casillas entre todos **no caben** si cada pieza exige 6 de separación (el cálculo por código no encontró solución). Opciones: (a) los edificios cívicos (Centro PC, tienda, laboratorio) forman con la plaza una sola zona y entre sí se separan 4; (b) los claros se reparten por el borde; (c) ampliar Albanota (p. ej. 56×40). Se decide con el plano.

## 4. Orden de documentos y trabajo (para implementar ordenado)
| Orden | Documento / entrega | Esfuerzo |
|---|---|---|
| 1 | `REFERENCIAS_MAPAS.md` (este) | LOW |
| 2 | `PLANO_ALBANOTA.md` + imagen del plano 48×36 (zonas, distancias, anclas, puertas, 7 zonas de aparición) → **aprobación** | MEDIUM |
| 3 | Escena de prueba rehecha con ese espaciado, 390×844, motor y paleta reales → **aprobación** | MEDIUM |
| 4 | Reescribir `BIBLIA_VISUAL.md` §8 y catálogo de piezas | LOW |
| 5 | ID-2 motor con capas | MEDIUM |
| 6 | ID-3 Albanota completa | MEDIUM |

Un ZIP por paso y parar tras cada uno.

## Fuentes
- [Pixel-Art Town Layout: Pallet to Pelican Town, Measured](https://blakecrosley.com/es/blog/pixel-art-towns-on-iphone)
