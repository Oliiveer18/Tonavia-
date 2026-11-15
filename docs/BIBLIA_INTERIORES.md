# BIBLIA DE INTERIORES · Criaturas de Lali y Oli (v2.139, paso ID-5b) · DIRECCIÓN B ELEGIDA; resto pendiente de tu aprobación

Fija **una vez** cómo se ven por dentro el Centro PC, la Tienda, el Laboratorio, las casas y la Ermita, para dibujar cada interior sin rehacer nada. Manda, por este orden: tus palabras → `BIBLIA_VISUAL.md` (§2 fundamentos, §3 paleta) → `REGLAS_DE_LUZ.md` → este documento. Nada del juego cambia con este paso (solo documentos e imágenes); la huella del 2D no se toca.

**Decidido (6 nov): Centro PC en dirección B (clínico tecnológico), con la composición simétrica de la sección 1b.** Las demás reglas siguen como propuesta.

**Imágenes** (hechas con `python3 tools/biblia_interiores.py`, con los colores de `G.PAL`): `biblia_int_centro_B.png` (**elegida**, composición simétrica) · `biblia_int_centro_A.png` (descartada, misma composición, solo de referencia) · `biblia_int_catalogo.png` (paletas por edificio y mobiliario).

## 1. Dirección del Centro PC · ELEGIDA: B
Los demás interiores heredan la elección (A queda como alternativa descartada).
| | **A · Hogar acogedor** (recomendada) | **B · Clínico tecnológico** |
|---|---|---|
| Suelo y paredes | listones de madera `#c48b52`, pared crema `#f7e9cb`, zócalo de madera | baldosa verde claro `#cfe3df`, pared blanca cálida, zócalo azul verdoso `#2a8187` |
| Mostrador | madera con tapa crema | blanco con tapa blanca |
| Por qué | encaja con las casas y el cascabel; el mundo es cálido (`BIBLIA_VISUAL` §1) | se lee «centro de curación» más rápido, pero choca con el resto del pueblo |
| Riesgo | puede parecer una casa más (se evita con cartel, máquina de curación y alfombra) | más frío; hay que cuidar que no parezca un hospital real |
Elegida **B** por el usuario. Para que no choque con Albanota: pared blanca cálida (no blanca pura), zócalo azul verdoso como el cartel y la fachada del Centro PC, madera en bancos y puerta, y los colores de Lali y Oli en los bancos. Cuidar que no parezca un hospital real (cartel con el logo del juego, plantas, campana de dos mitades).


## 1b. Composición del Centro PC (B): rejilla y eje central
Principio: **todo se coloca sobre la rejilla de 16 px y respecto al eje central**; nada «a ojo». La luz es la única asimetría permitida (siempre arriba-izquierda: las bandas de luz de las ventanas y las sombras de los muebles caen abajo-derecha en los dos lados).
- **Sala 13×10 casillas** (era 12×9: con ancho par la puerta de una casilla no puede quedar centrada). Columnas 0 y 12 = pared; fila 9 = pared delantera con la puerta; filas 0-1 = pared trasera (cara visible); suelo = 11×7 casillas (columnas 1-11, filas 2-8). **Eje central: columna 6 (x = 104 px).**
- **Reglas:** piezas únicas centradas en el eje (su centro = 104 px exacto); piezas dobles en pareja espejo (`x2 = 208 − x1 − ancho`, comprobado por `tools/biblia_interiores.py`); un pasillo libre de al menos 1 casilla entre piezas y hasta la puerta; muebles pegados a pared a ras (sin hueco de 1-2 px); medidas en múltiplos de casilla salvo detalles.
| Pieza | Casillas (col × fila) | Medida | Posición |
|---|---|---|---|
| Puerta | col 6, fila 9 | 1 casilla | en el eje |
| Alfombra de entrada | cols 5-7, filas 7-8 | 3×2 | centrada, pegada a la puerta |
| Mostrador | cols 4-8, fila 4 | 3 casillas de frente (48 px) | centrado (x 80-128) |
| Máquina de curación | sobre el mostrador | 24 px | centrada (x 92-116) |
| Cartel del Centro PC | pared trasera | 28 px | centrado (x 90-118) |
| Ventanas (2) | pared trasera, cols 2 y 10 | 14 px | espejo (x 33 y 161) |
| Terminales PC (4) | cols 1 y 11, filas 3 y 5 | 1 casilla | pegados a las paredes laterales, espejo, 1 casilla de aire entre ellos |
| Bancos dobles (2) | cols 2-3 y 9-10, fila 7 | 2 casillas | espejo (mitades de color invertidas: azul-rosa / rosa-azul) |
| Plantas (2) | cols 1 y 11, fila 8 | ~1 casilla | esquinas delanteras, espejo |
Imagen: `docs/biblia_int_centro_B.png` (con `--ejes` se dibujan la rejilla y el eje para comprobarlo). **Mapa:** `maps/centro_pc.json` es 13×10 desde la v2.141 (ID-5d), con la puerta y el ancla en la columna 6 y exactamente esta tabla; capturas en `docs/centro_pc_ingame_*.png`.

## 2. Reglas comunes a todos los interiores
1. **Luz:** misma dirección que fuera, arriba-izquierda; sombra de los muebles abajo-derecha (banda lisa de 2 px, sin degradado). Las ventanas de la pared trasera dejan una **banda de luz dura** en el suelo, que cae hacia abajo-derecha (en las imágenes).
2. **Sin tinte de región dentro** (`region: null`): la luz interior es cálida y fija; el color lo da la paleta del edificio. Sin ciclo día/noche (igual que fuera).
3. **Contorno** `#2a1b30` de 1 px en muebles y objetos; el suelo y la pared no llevan contorno; bandas duras de dos tonos por masa; masas de al menos 2×2 px; sin ruido ni píxeles sueltos (`BIBLIA_VISUAL` §2).
4. **Todo con `G.rampa`** (5 tonos calculados); nunca gris ni negro puro para sombras.
5. **Pared trasera de 2 casillas de alto** (cara visible con ventanas y cartel) y suelo debajo; paredes laterales y delantera de 1 casilla; puerta en la pared delantera con alfombra delante. Hoy el interior tiene la pared de 1 casilla: se ajusta en ID-5d.
6. **Siempre dos:** los bancos y la campana del mostrador llevan las dos mitades (**azul de Lali, rosa de Oli**).
7. **Lo que emite luz no se sombrea:** pantallas (cian `#7dffe7`), huevos, cristales, velas.
8. **Tamaños:** mobiliario en múltiplos de casilla (16 px) salvo detalles pequeños; pasillos de al menos 1 casilla libre (el jugador mide una casilla).
9. **Sonido:** cada interior tiene tema propio en `G.audio.TEMAS` (ya existe `centro_pc`).
10. **HD-2D:** el interior se dibuja en 3D como suelo y paredes planas con los mismos colores, muebles como láminas del 2D (igual que los edificios hasta la v2.64), sin cámara nueva; se resuelve en ID-5c/d. Si algo se queda sin reflejo en HD-2D, se anota como pendiente.

## 3. Paletas por edificio (`biblia_int_catalogo.png`, fila superior)
| Edificio | Colores base | Carácter |
|---|---|---|
| Casas de Oli y Lali (v2.153: la casa azul es de **Oli**, la rosa de **Lali**) | crema `#f7e9cb`, madera `#c48b52` / `#8f5c33`; acento **azul `#4d7fd6` (Casa de Oli)** o **rosa `#f5a8bd` (Casa de Lali)** | cálido y acogedor; cada casa se reconoce por el color de sus textiles |
| Laboratorio | blanco cálido `#fff9ee`, turquesa `#3fb5b0` / `#2a8187`; color vivo solo en cristales, huevos y pantallas | centro de estudio de criaturas, no laboratorio químico (`FICHAS_EDIFICIOS_3D.md` §Laboratorio) |
| Tienda | madera clara `#c48b52`, crema, rayas rojas `#d94a3f` del toldo, dorado `#f7d54a` | comercio de pueblo |
| Ermita del Primer Eco | piedra `#8d8a99` / `#615e6f`, azul pizarra `#35559a`, dorado `#e8c47a` | recogida, la campana de dos mitades como centro |
| Centro PC | según A o B (sección 1) | hospital de criaturas amable |

## 4. Interior de cada edificio (qué lleva y qué función tiene)
| Interior | Tamaño orientativo | Muebles | Función (sin código todavía) |
|---|---|---|---|
| **Centro PC** | 13×10 (ID-5d; hoy 12×9) | mostrador con campana, máquina de curación, 4 terminales PC, 2 bancos dobles, 2 plantas, alfombra, 2 ventanas, cartel con el logo (barra azul verdosa y círculo rojo), todo en rejilla simétrica (§1b) | curar criaturas y almacenarlas (combate y captura: Fase 7) |
| **Tienda** | 11×8 (ancho impar para centrar la puerta) | mostrador, 2 vitrinas, estantes, caja, cartel; toldo reflejado en la ventana | comprar y vender objetos |
| **Laboratorio** | 13×9 | incubadora central con luz cálida, 2 cápsulas con huevo, hilera de 7 cristales elementales, escáner, mesa de estudio, estantes | primera criatura, evolución y estudio, misiones (`HISTORIA_Y_MUNDO.md` §6) |
| **Casa de Lali / Casa de Oli** | 9×7 | cama, mesa con 2 sillas, estante, planta, alfombra (azul o rosa), ventana | descanso y guardar; sin función de juego al principio |
| **Ermita** | 11×9 | altar de piedra con campana de dos mitades y 2 velas, bancos dobles, vidrieras estrechas, alfombra central | lugar cooperativo (dos jugadores) |
Anchos impares en todos los interiores, para que la puerta y las piezas únicas queden en el eje. La Fuente es exterior: sin interior. Los tamaños se afinan en cada paso con el editor de mapas.

## 5. Catálogo de piezas por código (ID-5c · HECHO en v2.140: `src/interiores_objetos.js`, 15 piezas, ver `docs/interiores_piezas_catalogo.png`) → `biblia_int_catalogo.png`
mostrador · máquina de curación · terminal PC (1 casilla) · banco doble (2 casillas) · planta · estante · cama · mesa · incubadora (cápsula con huevo) · hilera de 7 cristales · vitrina · altar. Cada pieza: formato de `G.capas` (objeto con `huella`, dibujo base y, si procede, animación), contorno, luz y sombra según §2, y reflejo en el HD-2D. Animaciones previstas (con `G.capas.REDUCIDO` respetado): pantallas con parpadeo lento, huevo con brillo que late, velas con llama, luz de la máquina de curación.

## 6. Plan de pasos (ROADMAP, Fase 5)
ID-5b (este documento, **espera tu aprobación**) → ID-5c piezas de mobiliario (MEDIUM) → ID-5d Centro PC definitivo → ID-5e Tienda → ID-5f Laboratorio → ID-5g Casas → ID-5h Ermita. Un interior por sesión, con ZIP; las puertas de Tienda, Laboratorio, casas y Ermita se abren en su paso.

## 7. Qué falta por aprobar
1. ~~A o B~~ → **B**, con la composición de la sección 1b (mírala en `biblia_int_centro_B.png`; si algo no te convence, dímelo y se ajusta antes de dibujar piezas).
2. Las reglas de la sección 2 (sobre todo la pared trasera de 2 casillas y la luz sin tinte).
3. La lista de piezas de la sección 5 y los interiores de la sección 4 (¿falta o sobra algo?).
Mientras no lo apruebes, el interior del Centro PC sigue siendo la plantilla provisional de la v2.137.
