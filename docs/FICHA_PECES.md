# FICHA DE PECES (v2.222, 8 nov 2026)

La ficha anterior (v2.191, cinco peces generados por fórmula) está en `docs/archivo/FICHA_PECES_v2_191_formula.md`: esos peces no quedaron bien y se sustituyeron por criaturas **dibujadas a mano** (método y estilo: `docs/GUIA_PECES_A_MANO.md`). Datos en `src/peces.js` (`PIXELES` = dibujo, `PECES` = datos).

## Especies vivas: 20 criaturas
Lotes: 0 = Cirujano azul (referencia), 1 = Sardina, Pez payaso, Dorada, Pez globo, Pulpo; 2 = Salmonete, Pez ángel, Lubina, Pez loro, Morena, Pez espada, Mero, Raya; 3 = Pez volador, Bagre, Pez león, Bacalao, Barracuda, Cazón.
Zonas de pesca (por la profundidad del agua de la casilla que se mira): **0 orilla** (1 casilla de tierra), **1 media** (2), **2 honda** (3 o más). La probabilidad es `peso / suma de pesos de la zona` (zona 0 = 138, zona 1 = 138, zona 2 = 105). El peso en kg se tira entre el mínimo y el máximo (más probable un ejemplar pequeño). Todas se sueltan a los 3 fallos del forcejeo.

| id | Nombre | Lote | Zona | Peso | Prob. en su zona | Kg | Tirones | Margen | Tamaño |
|---|---|---|---|---|---|---|---|---|---|
| `pez_sardina` | Sardina | 1 | 0 | 40 | 29,0 % | 0,03–0,12 | 1 | ±0,55 s | 17×8 |
| `pez_cirujano` | Cirujano azul | 0 (ref.) | 0 | 22 | 15,9 % | 0,15–0,9 | 1 | ±0,55 s | 19×15 |
| `pez_salmonete` | Salmonete | 2 | 0 | 20 | 14,5 % | 0,1–0,5 | 1 | ±0,55 s | 18×11 |
| `pez_payaso` | Pez payaso | 1 | 0 | 18 | 13,0 % | 0,05–0,25 | 1 | ±0,5 s | 16×10 |
| `pez_volador` | Pez volador | 3 | 0 | 14 | 10,1 % | 0,1–0,5 | 1 | ±0,5 s | 19×11 |
| `pez_bagre` | Bagre | 3 | 0 | 14 | 10,1 % | 0,3–2 | 2 | ±0,45 s | 19×11 |
| `pez_angel` | Pez ángel | 2 | 0 | 10 | 7,2 % | 0,1–0,6 | 1 | ±0,5 s | 16×17 |
| `pez_dorada` | Dorada | 1 | 1 | 30 | 21,7 % | 0,5–2,5 | 2 | ±0,45 s | 17×12 |
| `pez_lubina` | Lubina | 2 | 1 | 26 | 18,8 % | 0,5–3 | 2 | ±0,45 s | 19×11 |
| `pez_loro` | Pez loro | 2 | 1 | 20 | 14,5 % | 0,4–2,5 | 2 | ±0,45 s | 19×14 |
| `pez_bacalao` | Bacalao | 3 | 1 | 18 | 13,0 % | 0,8–5 | 2 | ±0,45 s | 19×12 |
| `pez_leon` | Pez león | 3 | 1 | 16 | 11,6 % | 0,3–1,2 | 2 | ±0,45 s | 19×15 |
| `pez_globo` | Pez globo | 1 | 1 | 14 | 10,1 % | 0,3–1,5 | 2 | ±0,45 s | 14×14 |
| `pez_morena` | Morena | 2 | 1 | 14 | 10,1 % | 0,8–3,5 | 2 | ±0,45 s | 20×12 |
| `cri_pulpo` | Pulpo común | 1 | 2 | 25 | 23,8 % | 1–6 | 3 | ±0,4 s | 15×15 |
| `pez_mero` | Mero | 2 | 2 | 20 | 19,0 % | 2–9 | 3 | ±0,4 s | 18×13 |
| `pez_espada` | Pez espada | 2 | 2 | 18 | 17,1 % | 2–10 | 3 | ±0,4 s | 20×12 |
| `pez_raya` | Raya | 2 | 2 | 16 | 15,2 % | 1–6 | 3 | ±0,4 s | 18×11 |
| `pez_barracuda` | Barracuda | 3 | 2 | 14 | 13,3 % | 1–5 | 3 | ±0,4 s | 20×10 |
| `pez_cazon` | Cazón | 3 | 2 | 12 | 11,4 % | 2–8 | 3 | ±0,4 s | 20×11 |

## En Albanota (pueblo inicial)
| Punto de pesca | Casilla que mira | Zona | Sale |
|---|---|---|---|
| Orilla norte 1, 2, 3 y 4 | la de abajo | 0 | las 7 de la zona 0 |
| Puente oeste y puente este | la de izquierda / derecha | 1 | las 7 de la zona 1 |
| (ninguno) | — | 2 | las 6 de la zona 2 quedan **reservadas a propósito** para mapas futuros con agua honda |

## Ocultas (se conservan por los guardados antiguos)
`pez_plateado` (Alburno), `pez_gobio` (Gobio ámbar), `pez_carpa` (Carpa espejo), `pez_trucha` (Trucha salmonada) y `pez_anguila` (Anguila negra): generadas por fórmula, `oculto: true`; no salen ni en la colección. Se pueden borrar cuando ya no importen los guardados antiguos.

## Reservas sin usar
Lenguado, Pez cofre, Pez luna, Atún, Pez aguja y Pez ballesta. Imagen: `docs/lote3_reserva_6.png`; sprites en `docs/lote3_reserva_sprites.json`. Las imágenes intermedias de todo el proceso están en `docs/archivo/capturas/fauna_marina_propuestas/`.

## Dibujos aprobados
- Cirujano azul: `docs/pez_cirujano_20x15.png` (19×15, referencia de calidad).
- Lote 1: `docs/lote1_revision2_x14.png` (+ `_tamano`, `_enganchadas`). Lote 2: `docs/bloque_final_8.png` (+ `bloque_final_8_sprites.json`). Lote 3: `docs/lote3_final_6c.png` (+ `lote3_final_6_sprites.json`).
- Capturas en el juego: `docs/lote1_2d_*`, `lote1_hd_*`, `lote2_2d_*`, `lote2_hd_*`, `lote3_2d_*`, `lote3_hd_*`, `pesca_listo_2d_hd.png`.

## Reglas de las fichas de criaturas nuevas
Nombre real y reconocible; id interno estable; **un solo tamaño y un solo dibujo a mano por especie**; solo criaturas que se pescan de verdad con caña; peso y zona; dificultad del forcejeo ajustada para que SE PUEDA sacar (probado con tests); sin copiar arte de otros juegos (la lámina de referencia sirve solo para el estilo); perfil mirando a la derecha; ojo y boca como el Cirujano; contorno de 1 px de un solo color.
