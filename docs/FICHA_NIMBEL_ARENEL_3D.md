# FICHA DE CRIATURAS 3D · NIMBEL (`nubecin`) Y ARENEL (`arenel`) (v2.226 · paso 2)

> **v2.227 (9 nov 2026): el diseño de bultos y elipsoides de esta ficha (§1 y §2) queda DESCARTADO por el usuario** (no era coherente con el 2D: Nimbel no son bolas y Arenel en planta parecía una bola). Sustituido por el **modelado por piezas fiel al 2D** (`docs/nimbel3d_propuestas_por_piezas.png` y `docs/arenel3d_propuestas_por_piezas.png`, `tools/prototipo_piezas_nimbel_arenel.py`): cada parte del dibujo se extruye con su propio fondo y posición, la cara frontal es el sprite tal cual, ≈ 370-560 triángulos según la variante A-D tras fusionar caras → el presupuesto pasa de 300 a **≤ 1200**. **HECHO en la v2.229 (ver `docs/GUIA_MODELADO_3D.md`). Superado en la v2.228** por el modelo a mano con renders reales (`docs/nimbel3d_modelo_a_mano.png`, `docs/arenel3d_modelo_a_mano.png`, `tools/modelo3d_nimbel_arenel.js`). Pendiente de aprobación; los §0, §3-§5 siguen valiendo salvo el presupuesto.

Hoja de vistas: `docs/nimbel_arenel3d_hoja_de_vistas.png` (sprites 2D reales + alzados y planta propuestos; generada con `tools/hoja_vistas_nimbel_arenel.py` a partir de `G.creatureSprite`). El 2D no cambia; colisión, combate y motor tampoco. Método: **modelado a mano** (decidido el 9 nov 2026; la extrusión automática de vóxeles, v2.224, se descartó para criaturas protagonistas).

## 0. Reglas (heredadas de `FICHA_ZEFIRAX_3D.md`)
1. 1 u = 1 casilla = 16 px. Textura de píxel con filtro nítido, luz fija arriba-izquierda; lo que emite luz (ojos, destellos) no se sombrea.
2. Sin azar: todo movimiento es función pura del reloj y de la pose; `Math.random` prohibido; módulos puros que se prueban en node (norma «listo para online»).
3. Cada criatura es un módulo registrado con `G.criatura3d.registrar(id, fábrica)` (hecho en la v2.225). Interruptor común `AJUSTES.CRIATURAS3D`; apagado o con cualquier fallo = lámina 2D de hoy.
4. Presupuesto: **≤ 300 triángulos por criatura**, atlas ≤ 256×256. El 2D no se toca (la huella debe seguir igual).
5. **Una sola malla 3D por tipo de criatura a la vez** (límite actual del pintor, `vistos[k]`): si hay varios ejemplares a la vez, solo el primero es 3D y el resto siguen en lámina. Se anota como pendiente aparte (ver §5).

## 1. Nimbel · Aire · Común · 20×12 px = 1,25 × 0,75 u · 0,1 kg · fase única
- **Hoy (2D):** nube blanca baja y ancha, parte baja azulada, ojos oscuros, mofletes rosas y boca pequeña. Rasgo: flota; el fotograma B sube 1 px.
- **Diseño:** 5 bultos de nube (esferas bajas de 6 lados × 3 anillos, aplastadas ×0,9 en y) sacados de los círculos del propio 2D, sobre una base plana azulada de sombra (≈ 0,12 u). La cara es una **lámina recortada del 2D** pegada al bulto central, sin sombrear.

| Bulto | x | y | z | radio (u) |
|---|---|---|---|---|
| izquierda baja | −0,31 | 0,30 | −0,10 | 0,20 |
| derecha baja | 0,30 | 0,30 | 0,10 | 0,19 |
| izquierda alta | −0,14 | 0,44 | 0,00 | 0,22 |
| derecha alta | 0,15 | 0,45 | 0,00 | 0,23 |
| central | 0,00 | 0,31 | 0,04 | 0,27 |

- **Colores (del 2D):** blanco `#fff9ee` · sombra `#b7d5ee` · `#8fb4e7` · rosa `#e47a9a` / `#e0538e` · tinta `#2a1b30`.
- **Movimiento:** vaivén de 0,04 u (periodo ≈ 3 s); cada bulto «respira» ±3 % desfasado; al moverse los bultos traseros se retrasan un poco; gira con el yaw igual que Zefirax. Sombra: elipse 0,55 × 0,3 u. Sin partículas nuevas.
- **Triángulos (estimado):** 5 × 36 + base 4 + cara 2 + 2 gotas ≈ **190**.

## 2. Arenel · Roca · Común · 14×12 px = 0,875 × 0,75 u · 2 kg (evoluciona a Arenax, fuera de este plan)
- **Hoy (2D):** cangrejo ermitaño de arena, bajo y ancho; dos ojos grandes en pedúnculo, tapón de botella azul como casa, dos pinzas coral, patitas. Anda de lado; parado alza los ojos y suelta granitos de arena (fotograma 2).
- **Diseño** (medidas en u: x lateral, y arriba, z hacia delante):

| Pieza | Forma | Medida / posición |
|---|---|---|
| Cuerpo | elipsoide aplastado, 8 lados × 3 anillos | semiejes 0,35 × 0,19 × 0,28; centro y = 0,26 |
| Tapón | prisma de 6 lados que se estrecha + aro claro | radio 0,19 → 0,15; y 0,31 a 0,62; en la parte trasera (z ≈ −0,08) |
| Ojos | pedúnculo de 4 caras + cubo blanco + pupila | x = ±0,28; pedúnculo y 0,40–0,50; cubo 0,19 u, y 0,50–0,68 |
| Pinzas | brazo + dos mandíbulas de prisma | x = ±0,34; y ≈ 0,22; hacia delante |
| Patas | 3 por lado, 2 tramos, arena oscura | x = ±0,30; z = −0,15 · 0 · 0,15; altura 0,11 |

- **Colores (del 2D):** arena `#e8c47a` / `#f7dfa6` / `#c9a05a` / `#9a7240` · tapón `#3f7fd6` / `#78aaf2` / `#27559c` · aro `#d3deef` · coral `#e8624f` / `#a8352f` / `#e41921` · ojo `#fffdf5` · tinta `#2a1b30`.
- **Movimiento:** anda de LADO (patas en dos grupos de tres que alternan); parado alza los ojos +0,06 u y suelta granitos de arena con las partículas existentes (sin partículas nuevas). Sombra: elipse 0,5 × 0,3 u.
- **Triángulos (estimado):** cuerpo 48 + tapón 26 + ojos 2 × 20 + pinzas 2 × 32 + patas 6 × 8 ≈ **230**.

## 3. Pasos (un ZIP por paso, PARAR tras cada uno)
| Paso | Esfuerzo | Qué |
|---|---|---|
| 1 | MEDIUM | Registro de criaturas 3D (HECHO, v2.225) |
| 2 | LOW | Esta ficha y hoja de vistas (HECHO, v2.226) |
| 3 | MEDIUM | **Nimbel** completa: bultos, cara recortada, texturas, movimiento, interruptor, tests y captura |
| 4 | MEDIUM | **Arenel** completa (si es larga, en dos sesiones: cuerpo + tapón + ojos, y luego pinzas + patas + movimiento) |
| 5 | LOW | Integración de las dos, tests, capturas a 390×844 con Three.js real y documentos |

## 4. Pruebas previstas
`node test.js` (grupo nuevo por criatura: módulo puro, presupuesto ≤ 300, sin azar, geometría finita), `node tools/huella_juego.js --comprobar` (2D sin cambios), `tools/prueba_hd2d_juego.py`, y capturas con Three.js real a 390×844 (frente, perfil y espalda).

## 5. Riesgos y decisiones por aprobar
1. **Una malla por tipo (regla 5):** hoy, si salen dos Nimbel a la vez, solo uno sería 3D. Propuesta: tratarlo en el paso 5 (un pequeño grupo de mallas por id) si te molesta; no cambia el diseño.
2. **Fidelidad:** el 3D es la misma criatura, no una copia píxel a píxel de cada vista; prioridad frente y 3/4.
3. **Aspecto facetado:** esferas de 6 lados pueden verse angulosas; se sube a 8 lados dentro del presupuesto si la captura lo pide.
4. **Aprobación:** propuesta. Hasta tu «hazlo» (y tus cambios a la hoja) no se escribe la forma de ninguna criatura.
