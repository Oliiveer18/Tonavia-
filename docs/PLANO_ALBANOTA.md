# PLANO DE ALBANOTA 48×36 · v2.31 (aprobado el 3 nov) · REVISADO en la v2.53 (auditoría urbanística, 5 nov)

Imagen: `docs/plano_albanota_48x36.png` (generada con `tools/historico/plano_albanota.py` (plano ORIGINAL v2.53), que también mide huecos, reparto y pantallas de móvil). Casilla = 16 px. Referencias y reglas: `REFERENCIAS_MAPAS.md`.

## 0. Revisión v2.53 (auditoría urbanística, 5 nov) · decisiones tomadas por Claude por delegación del usuario
Imágenes: `albanota_v253_auditoria_actual.png` (problemas numerados 1-9 sobre la escena v2.32), `albanota_v253_propuesta_anotada.png` y `albanota_v253_propuesta_limpia.png` (48×36 con el motor y las piezas reales; se regenera con `tools/propuesta_albanota3.py`). Centro PC, Tienda y Ermita son **volúmenes provisionales** (sin sprite); los Huertos usan piezas que ya existen (parcela, cultivos, espantapájaros, valla, barril).

**Lo que está bien y no se toca:** plaza y sus 4 entradas centradas, avenidas de 3, río recto, puente, ramales con jardineras de Lali y Oli, Lali y Oli en su sitio.

**Problemas medidos en la escena v2.32:** (1) puerta del laboratorio fuera de eje (col. 10; Lali 4, Oli 13); (2) tejado a 12 px de la avenida oeste; (3) sendero del laboratorio de 14 casillas pegado al río; (4) 4 juncos sobre el camino; (5) farolas oeste y este asimétricas (26 px arriba, 44 abajo); (6) cartel flotando lejos del cruce; (7) segundo par de farolas sur sin función; (8) hueco visual Lali–Oli 3,1 casillas; (9) calle norte sin salida en el plano aprobado.

**Cambios aplicados al plano (todos con `PLANO` regenerado):**
1. Laboratorio 3 casillas a la derecha (x 8→11), 5×5 (el sprite real mide 5; el 6×5 del plano no se dibuja), puerta en la columna 13 bajo Oli. Hueco con la plaza: 4.
2. Sendero del laboratorio: de 14 a 11 casillas, 2 de ancho (camino secundario), cruce limpio con la avenida sur.
3. Calle norte prolongada hasta el camino de la Ermita (x 26-43): sin punto muerto, bucle plaza–Centro PC–Tienda–Ermita–avenida este, y dos accesos a la Ermita (lugar cooperativo). Entrada de la Tienda de 3 (x 33-35).
4. Farolas oeste y este simétricas respecto a su avenida (±26 px).
5. Cartel en el cruce avenida sur / sendero del laboratorio y segundo par de farolas sur en ese cruce.
6. Juncos fuera de los caminos (x 40, 100, 160, 432, 474, 560, 640, 720).
7. Huertos con valla con hueco en la entrada (x 35-37).

**Decisiones de método:** (a) los sprites de casa miden 94×108 px (≈5,9×6,75 casillas) y no 5×5: el plano se sigue midiendo con el rectángulo 5×5 (regla de 4 casillas entre casas), pero el hueco visual real es ≈3,1; se acepta en el barrio porque el borde oeste (bosque) y la plaza impiden abrirlo sin empeorar el otro lado. (b) No se añaden árboles, miradores ni edificios. (c) La escena de referencia dibuja las 48 columnas (la v2.32 solo 32).

**Medidas tras los cambios (`tools/plano_albanota.py`):** huecos entre piezas ≥ 4; prado 45 %, caminos 15 %, bosque de borde 17 %, edificios 9 %, agua 8 %; libre o poco decorado 64 %; ventana móvil 8×17: 1 cosa 316, 2 → 359, 3 → 112, 4 → 16.

## 1. Decisiones del usuario que lo fijan
- Albanota es el **pueblo inicial: en el juego final NO habrá criaturas salvajes**. Las 7 zonas de aparición son un **banco de pruebas temporal** (ocultas con `AJUSTES.VISIBLES`); no condicionan el diseño. Tamaño **48×36**, sin ampliar.
- Los caminos entran **centrados** en cada lado de la plaza (N, S, O, E); sin esquinas ni ensanches.
- **Río completamente horizontal**, sin desvíos.
- **Sin mirador** (no hay vista que lo justifique). El banco doble irá como adorno en la escena.
- **Sin arboledas ni árboles nuevos.** Por ahora **no se colocan árboles sueltos**; cuando vuelvan, solo el árbol original del juego con su sombra. Los 3 árboles de la imagen v2.30 (roble grande, mediano, abeto) **no están aprobados**.
- Juego cooperativo: la **Ermita del Primer Eco** es el lugar cooperativo (puerta de dos hojas; las dos mitades del cascabel).

## 2. Piezas (x, y, ancho, alto en casillas; puerta = casilla)
| Pieza | Rect | Puerta / nota |
|---|---|---|
| Plaza del Cascabel | 20,15,9,7 | fuente en el centro (24,18); 4 entradas de 3 casillas (centradas) con farolas |
| Casa de Lali | 2,10,5,5 | puerta (4,14) |
| Casa de Oli | 11,10,5,5 | puerta (13,14) |
| Laboratorio | 12,22,5,5 | puerta (14,26), misma columna que la puerta de Oli; sendero de 2 casillas (x 12-22, y 27-28) hasta la avenida sur (v2.53; antes 8,22,6,5) |
| Centro PC | 23,5,7,5 | puerta (26,9) |
| Tienda | 32,5,5,4 | puerta (34,8) |
| Ermita del Primer Eco | 41,4,5,5 | puerta (43,8) |
| Huertos | 33,21,7,6 | puerta a la avenida este (35–37,20) |
| Arroyo | 0,29,48,3 | recto; puente 23,29,3,3 |
| Entrada al bosque | 0,17,3,3 | borde oeste, en el eje de la plaza |
| Salida a Ruta 1 | 23,34,3,2 | borde sur, tras el puente |

**Caminos (3 casillas los principales):** avenida N–S x 23–25 (Centro PC ↔ plaza ↔ puente ↔ Ruta 1); avenida O–E y 17–19 (bosque ↔ plaza ↔ giro al norte en x 42–44); camino a la ermita x 42–44, y 8–16, recto; calle norte y 10–11 desde la avenida norte hasta el camino de la ermita (x 26-43; cierra un bucle y deja dos accesos a la Ermita); ramales de las casas (3 de ancho) a la avenida oeste; sendero del laboratorio y 27–28 (2 de ancho) hasta la avenida sur.

**Anclas:** `inicio` (24,24); `volver` por puerta; `guarida_zefirax` (prueba) (4,22).
**Zonas de aparición TEMPORALES (rect):** Hoja 1,2,6,7 · Aire 1,20,6,6 · Eléctrico 41,22,5,5 · Agua 41,27,5,2 · Sombra 38,32,8,3 · Roca 29,32,8,3 · Fuego 1,32,8,3.

## 3. Medidas (por `tools/plano_albanota.py`)
- Huecos entre piezas ≥ 4 casillas (casas entre sí 4; casa–plaza 4 a 13; plaza–huertos 4; Tienda–Ermita 4).
- Reparto: prado 45 %, caminos 15 %, bosque de borde 17 %, edificios 9 %, agua 8 %, plaza 4 %, huertos 2 %. **Libre o poco decorado 63 %.**
- Ventana de móvil 8×17: 1 cosa importante 312 posiciones, 2 → 360, 3 → 128, 4 → 8 (solo el tramo norte: Centro PC, Tienda, plaza, huertos).

**v2.54:** el mapa real `maps/albanota.json` (solo suelo) ya existe. Zonas de prueba Sombra, Roca y Fuego movidas a prado libre (Sombra 9,3,8,5 · Roca 17,22,5,5 · Fuego 27,22,5,6) porque la franja sur no admite criaturas; el resto del plano, igual.

**v2.55:** los objetos que ya existen están colocados en `maps/albanota.json` (52, por `tools/crear_albanota.js`; piezas en `src/albanota_objetos.js`). Ajustados a la cuadrícula de 16 px: cada pieza se mueve unos píxeles respecto a `albanota_v253_propuesta_limpia.png` (hasta ≈ 10 px). Posiciones en casillas: casas (2,10), (11,10), (11,22); fuente (24,18); bancos (20,16), (27,16), (8,16); farolas (22,14), (26,14), (22,22), (26,22), (22,26), (26,26), (19,16), (19,20), (29,16), (29,20), (7,16), (10,16); macetas (20,21), (27,21) y a los lados de los ramales (2,15), (6,15), (11,15), (15,15); cartel (20,26); huerto (33,21) con valla (anillo x 32-40, y 20-27, entrada x 35-37) y espantapájaros (36,25); barril (41,21); puente (23,29); 8 juncos y 9 nenúfares en el arroyo. Centro PC, Tienda y Ermita siguen pendientes (paso D).

## 4. Siguiente
1. ~~Aprobar el plano~~ hecho.
2. ID-1d (v2.32, hecho, pendiente de aprobar las imágenes): redibujar la escena de prueba con este espaciado, trozo más grande, 390×844, motor y paleta reales, árbol original; **otra aprobación** antes de ID-2.

**v2.56:** Centro PC (21,5,7,5), Tienda (32,5,5,4) y Ermita del Primer Eco (41,3,5,5) ya están en `maps/albanota.json` como volúmenes provisionales (55 objetos en total; piezas `centro_pc`, `tienda` y `ermita` en `src/albanota_objetos.js`; puertas en (24,9), (34,8) y (43,7), con camino delante). Sin interiores. Se sustituirán por los dibujos definitivos con los interiores (Fase 5).

**v2.57:** Albanota es ya el mapa donde empieza la partida (`INICIAL` en `src/mapas.js`); `pueblo_inicial` queda solo como mapa de pruebas (`?mapa=pueblo_inicial`). Las zonas de prueba y la guarida de Zefirax de Albanota siguen siendo temporales.

**v2.59 (ED-1):** `maps/albanota.json` es ya la **fuente única** y se edita con `tools/editor_mapas.html` (ver y mover objetos); `tools/crear_albanota.js` solo sirve para «rehacer desde cero» (`--forzar`) o ver el plano original (`--salida`). Este plano queda como referencia del diseño inicial.

**v2.58 (solo documentos):** el usuario ve fallos en Albanota y quiere editarlos él mismo; se planifica el editor de mapas v2 (Fase 2b de `ROADMAP.md`: ED-1 ver y mover objetos, ED-2 añadir y pulir). Cuando exista, `maps/albanota.json` será la fuente única y este plano quedará como referencia histórica del diseño inicial.

**v2.62b (mapa editado por el usuario en el juego, ahora OFICIAL):** `maps/albanota.json` es la fuente única y refleja su edición: laboratorio (12,22) con puerta (14,26) [antes (11,22)/(13,26)], Centro PC (23,5) con puerta (26,9) [antes (21,5)/(24,9)], Ermita (41,4) con puerta (43,8) [antes (41,3)/(43,7)] y suelo de las filas 8-9 retocado para llegar a la Ermita. Los 55 objetos siguen. Hueco Centro PC–Tienda: 2 casillas (el plano pedía 4; se acepta ≥2). Las tablas de arriba muestran ya estas posiciones; `tools/plano_albanota.py` y `tools/crear_albanota.js` conservan el plano ORIGINAL v2.53 (solo para «rehacer desde cero»). Una casa duplicada en (13,23) que venía en el paquete pegado se quitó (tapaba la puerta del laboratorio).

