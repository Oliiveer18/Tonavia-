# FICHA DE PERSONAJE 3D · LALI (v2.132 · TERMINADA)

Estado: **terminada (pasos 1 a 6)**. Lo que queda: verlo en un móvil real y el movimiento en diagonal (`docs/PLAN_MOVIMIENTO_PERSONAJES.md`). Segunda pieza de la serie «personajes 3D»; misma mecánica que Oli (`docs/FICHA_OLI_3D.md`, secciones 4, 5 y 21), con otra paleta, otras piezas y otros recortes. Plan de pasos: `docs/PLAN_LALI_3D.md`.

Objetivo: que Lali, en el **HD-2D**, deje de ser una lámina plana que siempre mira a la cámara y pase a ser un **volumen con textura de píxel**, que gira con la cámara, mira hacia donde anda y mueve brazos y piernas, igual que Oli. **El juego en 2D no cambia** (el sprite 2D de Lali no se toca). **Oli no cambia** (su geometría, sus texturas y su huella deben salir idénticas).

## 0. Reglas (las de Oli, adaptadas)

1. **Unidad:** 1 u = 1 casilla = 16 px = 1 texel. Medidas sacadas del sprite 2D `luna_down_0` (16×21 px de dibujo, lienzo 18×24, pies en `j.y`, `feet: 2`).
2. **La colisión no cambia** (el motor no se toca): `j.x`, `j.y` son los pies.
3. **Texturas de píxel por código**, filtro nítido, paleta `CHARS.luna.pal`. Las caras salen **recortadas del propio sprite 2D** (frente = `down`, espalda = `up`, costado derecho = `side`); lo que el 2D no dibuja (arriba de la cabeza, suelas…) se pinta por código con los mismos colores. Sin azar.
4. **Luz fija arriba-izquierda** (igual que Oli, edificios, farola y banco): oeste = luz, sur = base, este y norte = sombra, arriba = brillo.
5. **El 2D no cambia** (huella del juego igual). Interruptor propio: `G.hd2d.AJUSTES.PERSONAJES3D_LALI` (apagado = lámina como hoy; el de Oli, `PERSONAJES3D`, es independiente). No hay parámetro de URL (Oli tampoco lo tiene): se cambia desde la consola. Si algo falla, solo Lali vuelve a la lámina.
6. Mientras dure la serie puede verse un Oli 3D y una Lali plana (o al revés si se apaga uno): es temporal y normal.

## 1. Cómo es Lali hoy (hechos leídos de `src/chars.js`, `CHARS.luna`)

- **Tamaño:** vista de frente de **16×21 px** (Oli: 16×23). Lali mide **1,3125 u** de alto (21 px); Oli, 1,4375 u. Es más baja y se conserva.
- **Vistas del 2D:** `down` (frente, 16 px), `up` (espalda, 16 px, derivada con `back()`) y `side` (**solo perfil derecho**, 12 px). **No tiene `sideL`** ni `swapL`: el perfil izquierdo es el **espejo** del derecho (`vista.js` lo hace con `espejo`). Como su pelo es simétrico, el costado izquierdo de la cabeza 3D es el espejo del derecho sin cambiar colores.
- **Animación del 2D:** 3 fotogramas (quieto, pie derecho arriba, pie izquierdo arriba); `feet: 2`.
- **Sombra 2D:** óvalo bajo los pies (la de siempre, la pone el pintor).
- **Cabeza (filas 0-9):** filas 0-3 pelo rubio (`b`, con raya `c` en las columnas 7-8 de las filas 1-2 y contorno `a` en la fila 0); filas 4-9 cara de piel (`d`) de **6 px de ancho** (columnas 5-10) enmarcada por pelo (`b`, `c`) a cada lado: fila 6 cejas oscuras, fila 7 **ojos verdes** (`e`, 2 px por ojo), fila 8 mejillas, fila 9 boca rosa (`f`). La cabeza mide **12 px de ancho** (columnas 2-13) y **10 px de alto** (cabeza = 48 % de la altura; sigue siendo chibi).
- **Cuerpo (filas 10-18):** filas 10-14 chaqueta azul claro (`g`) con camisa crema (`h`) en el centro (columnas 6-9) y un botón/insignia amarillo (`i`, `j`) a un lado; el cuello (`d`) en la fila 10. **Brazos** en las columnas 0-2 y 13-15 (3 px con contorno), de la fila 10 a la 17: manga azul (`g`), puño azul medio (`k`, fila 15), mano de piel (`d`, fila 16), contorno (fila 17). Filas 15-18 **pantalón o falda corta azul oscuro (`l`)** de 6 px de ancho: en el sprite **no se ven dos piernas separadas**. Fila 19 **zapatillas blancas (`n`) con detalle rosa (`o`)**, 8 px de ancho en total; fila 20 contorno.
- **Pelo largo:** dos **mechones** (`c`, `b`) cuelgan junto al torso, columnas 3-4 y 11-12, de la fila 10 a la 17, con un **lazo rosa** (`m`, fila 16) cerca de la punta. No tiene gafas, durag ni trenzas.
- **Espalda (`back()`):** pelo sobre toda la cabeza (rejilla `c`/`b` en las filas 4-9) y sobre el cuello (fila 10, columnas 6-9); chaqueta lisa (`g`) con dos rayas azul oscuro (`l`) en las columnas 6 y 9 (filas 11-14).
- **Perfil (`side`, 12 px):** cabeza de 10 px de fondo (columnas 1-10) con la nariz en la columna 11 de las filas 8-9; el pelo largo queda detrás (columnas 2-4, filas 10-17) y el brazo a media altura.

## 2. Diferencias con Oli (lo que NO se puede copiar)

| | Oli | Lali |
|---|---|---|
| Alto | 23 px (1,4375 u) | 21 px (1,3125 u) |
| Cabeza | 14 × 11 px, 12 de 23 filas | 12 × 10 px, 10 de 21 filas |
| Pelo | durag negro + 6 trenzas traseras y 4 laterales (rojo/castaño) | pelo rubio con raya, 2 mechones largos con lazo rosa |
| Cara | gafas de sol | ojos verdes, cejas, boca rosa |
| Piernas | dos visibles (4 px cada una) | un bloque azul oscuro de 6 px (sin separación visible) |
| Perfil izquierdo | `swapL` (lado rojo) | espejo del derecho |
| Texturas generadas por código | trenzas | tapa del pelo; opcional el lazo |

## 3. Piezas y medidas (propuesta; 1 px = 0,0625 u; se ajusta en el paso 2 mirando el rasterizador)

Origen en los pies (centro de la casilla, y = 0 en el suelo). Ninguna medida baja de 0,125 u (para que no parpadeen al girar la cámara en el móvil). Fila *r* del sprite (0 arriba) ↔ borde superior a y = (21 − *r*)/16 u.

| Pieza | Qué es | Ancho × alto × fondo (u) | y (base–techo) | x (centro) | Mueve |
|---|---|---|---|---|---|
| **cabeza** | caja con la cara delante, pelo en caras laterales, trasera y tapa | 0,75 × 0,625 × 0,625 | 0,6875–1,3125 | 0 | gira un poco hacia donde mira (opcional) |
| **torso** | chaqueta azul, camisa crema | 0,375 × 0,3125 × 0,3125 | 0,375–0,6875 | 0 | rebote leve |
| **brazos** ×2 | manga azul, puño y mano de piel | 0,1875 × 0,5 × 0,1875 | 0,1875–0,6875 | ±0,40625 | balanceo (pivote en el hombro) |
| **mechones** ×2 | pelo largo junto al torso, con el lazo rosa en la textura | 0,125 × 0,5 × 0,1875 | 0,1875–0,6875 | ±0,25 | leve balanceo o rígidos (decide el paso 2) |
| **piernas** ×2 | pantalón/falda azul oscuro | 0,1875 × 0,25 × 0,25 | 0,125–0,375 | ±0,09375 | balanceo (pivote en la cadera) |
| **zapatillas** ×2 | blancas con detalle rosa | 0,25 × 0,125 × 0,3125 | 0–0,125 | ±0,125 | con la pierna |

Total previsto: 10 cajas y ≈ 90-110 triángulos. **Real tras el paso 2: 13 cajas y 114 triángulos** (ver sección 11), muy por debajo del tope de 240. **Lali mide 1,3125 u de alto**, ancho máximo 1,0 u (brazos de borde a borde de la casilla, como las trenzas de Oli). Cabe en una casilla.

Notas y decisiones abiertas para el paso 2 (las toma quien implemente, y las deja escritas aquí):
- **Piernas separadas:** el sprite no las separa. Hace falta separarlas para el andar; la propuesta es 2 piernas de 3 px (0,1875 u) con la textura del bloque azul partida por la mitad.
- **Volumen del pelo:** la cabeza lleva el pelo en las texturas (caras laterales, trasera y tapa), sin caja de pelo aparte. Si se ve plana, añadir un casquete de 1 px de grosor sobre la tapa y la nuca, y cuidar el z-fighting (sesgo de profundidad, como se hizo con el durag de Oli).
- **Cabeza sobre el torso sin solape:** la cabeza empieza en y 0,6875 y el torso termina en 0,6875. Es la lección de Oli (`FICHA_OLI_3D.md`, sección 16): **comprobar proporciones con captura antes de pintar texturas**.
- **Profundidades** (torso 0,3125, mechones 0,1875, zancada) son una primera cuenta desde el perfil; ajustar mirando el rasterizador.

## 4. Texturas (paso 3)

Coordenadas en la rejilla de letras de `G.CHARS.luna` (`down`, `C.back(C.down)` y `side`, igual que Oli). Los recortes salen del sprite; si el sprite cambia, la textura cambia sola.

| Textura | Cómo se hace |
|---|---|
| `cabeza_sur` | recorte de `down`, filas 0-9, columnas 2-13 (12×10); las esquinas transparentes de la fila 0 se rellenan por código con el contorno `a` |
| `cabeza_norte` | recorte de `back(down)`, filas 0-9, columnas 2-13 |
| `cabeza_oeste` | recorte de `side`, filas 0-9, columnas 1-10 (10×10); la nariz (columna 11) no cabe en la caja y se descarta o se pinta en `cabeza_sur` si se ve necesaria |
| `cabeza_este` | espejo de `cabeza_oeste`, sin cambio de colores (no hay `swapL`) |
| `cabeza_arriba` | por código: rubio `b`, raya `c` en el centro, contorno `a` |
| `torso_sur`, `torso_norte` | `down` y `back(down)`, filas 10-14, columnas 5-10 (6×5) |
| `brazo_d_sur`, `brazo_i_sur`, `brazo_d_norte`, `brazo_i_norte` | columnas 0-2 y 13-15, filas 10-17 (3×8): manga, puño, mano y contorno |
| `mechon_*` (frente, espalda, costado) | columnas 3-4 y 11-12, filas 10-17 (2×8), con el lazo rosa de la fila 16; costado de `side`, columnas 2-4 (3×8) |
| `pierna_*` | bloque `l` de las filas 15-18, partido en dos mitades de 3 px |
| `zapatilla_*` | filas 19-20, columnas 4-7 y 8-11 (4×2): blancas con detalle rosa |
| Tonos | luz / base / sombra como Oli y el banco (oeste, sur, este y norte) con la rampa de cada color |

Atlas: **uno por personaje** (el de Lali aparte del de Oli), mismo formato que `G.personaje3d.atlas()` (celda blanca para lo liso). Así Oli no cambia ni un texel.

## 5. Qué hay que ampliar en el código

- **`src/personaje3d.js`:** hoy es de Oli (`PIEZAS`, `RECORTES`, `PAL`, `YAW`…). Hay que parametrizarlo por personaje (`G.personaje3d.de('rex' | 'luna')` o equivalente) sin copiar el módulo y **sin cambiar el resultado de Oli**: la geometría de Oli (204 triángulos) y sus texturas deben seguir igual (`test.js` grupo 69 y la huella del juego lo vigilan). Lo común (pose de andar, giro suave, tono por cara, atlas, uv) se comparte; lo propio de Lali (piezas, recortes, tapa del pelo, mechones) son datos.
- **`src/hd2d_pintor.js`:** hoy tiene `esOli`, `crearOli3d`, `poner3d`, `quitarOli3d` y `E.oli3d` fijos a Oli. En el paso 4 se generalizan a un conjunto de personajes 3D (una malla por personaje, mismo código) y se añade el interruptor `PERSONAJES3D_LALI`. La sombra sigue siendo el óvalo del pintor. Cualquier error apaga solo ese personaje y vuelve la lámina.
- **Montaje:** el módulo ya está en `src/orden.json`; no se añaden dependencias.
- **No se tocan:** `src/motor.js`, `src/chars.js` (solo lectura de `G.CHARS`), el 2D, las criaturas, ni los edificios.

## 6. Movimiento (heredado de Oli; no se inventa nada nuevo)

- Mira hacia donde anda (`down` = sur, `up` = norte, `left` = oeste, `right` = este) con giro suave de ≈ 0,12 s.
- Ciclo de andar de 0,36 s: piernas ±28°, brazos al contrario ±22°, rebote de 0,03 u. Parada: pose quieta, sin animación (como el 2D). Los mechones pueden balancearse poco o ir rígidos.
- Hablar, puertas, cámara y colisión: no cambian.
- Oclusión de edificios: usa la altura real de Lali (1,3125 u).
- **Diagonales:** este plan NO las toca. Se hacen después, para Lali y Oli a la vez, según `docs/PLAN_MOVIMIENTO_PERSONAJES.md`.

## 7. Presupuestos (se miden en el paso 5)

- ≤ 240 triángulos por personaje (`MAX_TRIANGULOS`; se espera ≈ 100 para Lali), atlas ≤ 256×256 (se espera ≈ 64×30).
- +1 llamada de dibujo por jugador: con Oli y Lali en 3D son **+2 en total**. La ficha de Oli decía «máximo +2 en total hasta que exista Lali 3D»: al medir en el paso 5, comprobar la cifra real (`G.hd2d.estado().llamadas`) y dejarla escrita aquí y en `FICHA_OLI_3D.md`.
- Recalcular los vértices ≤ 0,3 ms por cuadro por personaje con CPU 4× más lenta; el HD-2D no debe perder más de un 2 % de fotogramas con los dos personajes 3D en pantalla.

## 8. Pasos y qué recibes

| Paso | Qué | Esfuerzo | ZIP |
|---|---|---|---|
| 1 | Esta ficha | LOW | **ZIP 1** (solo documentos) · hecho en la v2.127 |
| 2 | Piezas con pivote, pose y geometría con **colores lisos** para Lali (módulo parametrizado, Oli idéntico); ves la forma (imagen con 3 poses y 4 giros) y revisas proporciones | MEDIUM | **ZIP 2** · hecho en la v2.128 |
| 3 | Texturas recortadas del sprite y atlas: 3a cabeza, 3b cuerpo y chaqueta, 3c piernas y zapatillas, 3d pelo y mechones (un checkpoint por sesión si hace falta) | MEDIUM | **ZIP 3** · hecho entero en la v2.129 (los 4 sub-pasos juntos) |
| 4 | Integrar en el pintor HD-2D: malla animada, giro suave, interruptor `PERSONAJES3D_LALI` y pruebas en `test.js` | MEDIUM | **ZIP 4** · hecho en la v2.130 |
| 5 | Prueba con Three.js real (`npm install three@0.128.0`), capturas desde los 4 giros, presupuestos y ajuste de brillo | LOW | **ZIP 5** · hecho en la v2.131 |
| 6 | Cierre: retirar la lámina de Lali si todo va bien, documentos y ZIP final | LOW | **ZIP 6** · hecho en la v2.132 |

Cada paso se hace solo con tu «hazlo» y se dice antes si es LOW o MEDIUM. Un ZIP por paso y paro.

## 9. Decisiones (todas de Claude, cámbialas cuando quieras)

1. Se **conserva el chibi** y la altura de 21 px (1,3125 u); Lali no se iguala a Oli.
2. **Texturas recortadas del sprite 2D**, no dibujadas aparte.
3. **Módulo parametrizado**, no una copia de `personaje3d.js`; Oli no cambia.
4. **Una malla por personaje con vértices recalculados** (1 llamada de dibujo por jugador), como Oli.
5. **Un atlas por personaje** para no tocar el de Oli.
6. Brazos y piernas **rígidos con pivote** (sin codos ni rodillas), fiel al estilo de píxel.
7. Piernas separadas en dos de 3 px aunque el sprite no las separe (hace falta para andar).
8. Interruptor propio `PERSONAJES3D_LALI`, independiente del de Oli.

## 10. Pendiente del usuario

- Decir si le gusta la dirección (Lali con cabeza grande, texturas del sprite, 10 cajas) o qué cambiar.
- **Paso 2 solo con «hazlo»** (MEDIUM).

## 11. Paso 2 (v2.128): volumen con colores lisos
- **Módulo:** `src/personaje3d.js` ahora tiene `G.personaje3d.de('rex' | 'luna')` → `{ id, PAL, PIEZAS, ALTO_2D, piezas(), geometria(pose), pose, girar, tono }`. Pose, giro, tono y geometría son los mismos de Oli (la cuenta se movió a `geometriaDe(lista, pose)`); Lali solo aporta datos (`PAL_LALI`, `PIEZAS_LALI`, `ALTO_2D_LALI`). **Oli no cambia**: huella de piezas, geometría (4 direcciones × 3 poses), texturas, atlas y uv idéntica antes y después (`7137ea2c…`), 204 triángulos. Texturas y atlas siguen siendo solo de Oli hasta el paso 3.
- **Resultado:** 13 cajas, **114 triángulos**, alto 1,3125 u, ancho 1 u, los pies pisan el suelo (y = 0) en las 4 direcciones y 5 instantes del andar. Imagen: `docs/lali_paso2_formas.png` (`node tools/volcar_oli.js luna > /tmp/lali_geo.json && python3 tools/formas_oli.py /tmp/lali_geo.json docs/lali_paso2_formas.png`; sin argumento, `volcar_oli.js` sigue volcando a Oli). Los tonos naranjas y azules oscuros de las vistas a 90°/180°/270° son la rampa de color del juego sobre una geometría con la luz de siempre; no es un fallo.
- **Cajas:** `cabeza` (0,75 × 0,625 × 0,625, entera en color de pelo), `cara` (lámina de piel 6 × 6 px, relieve de 1/32 u), `torso`, `mechon_i/d`, `manga_i/d` + `mano_i/d`, `pierna_i/d`, `zapatilla_i/d`. Medidas como en la sección 3, salvo lo de abajo.
- **Decisiones tomadas en este paso:**
  1. **Lámina `cara` temporal** (piel, filas 4-9, columnas 5-10): con colores lisos la cabeza solo puede ser de un color y la cara de piel es 6 de los 12 px de ancho. Se QUITA en el paso 3 cuando `cabeza_sur` (textura) la sustituya, como Oli con la lámina de gafas.
  2. **Brazos en dos cajas** (manga 6 px + mano 2 px), como Oli, para que cada una tenga su color liso.
  3. **Mechones rígidos** (grupo `torso`, rebotan con el cuerpo, sin balanceo propio) y **sin lazos como cajas**: el lazo rosa, de 1 px, es solo textura (paso 3). Evita cajas por debajo de 2 px y solapes con la mano.
  4. **Pierna sin solape con el torso:** la pierna cuelga justo de la base del torso (y 0,375, pivote ahí). Con las piernas abiertas y el cuerpo en su punto más bajo (−0,03 u) queda, por detrás, una rendija de ≈ 0,03 u (medio píxel) entre la base del torso y la pierna, desde la que se ve la tapa de la pierna (azul oscuro); no se ve desde delante. Si molesta, subir el pivote y meter 1 px de pierna en el torso (cuidando el z-fighting entre las caras laterales, que coinciden en x = ±0,1875).
  5. **Medidas en z:** las cajas de profundidad impar (torso 5 px, brazos 3 px) quedan centradas en z = 0 y tienen bordes a medio píxel; no afecta a las texturas (que van por cara, no por borde). Zapatillas: z = 0,03125 para que sobresalgan 0,0625 u por delante.
- **Pruebas:** `node test.js` = **70 grupos OK** (grupo 70 nuevo: `de(id)`, Oli idéntico, 13 cajas, medidas, colores = `CHARS.luna.pal`, alto y ancho, cabeza sobre el torso sin solape, espejo izquierda-derecha, pies en el suelo, 114 triángulos, el pintor aún no usa a Lali, módulo puro, `volcar_oli.js luna`); `tools/huella_juego.js --comprobar` igual (`77a1889f…`); `python3 tools/prueba_hd2d_juego.py` (Three de pega) TODO BIEN; `node tools/equilibrio.js` 0 alertas; `dist/criaturas.html` reconstruido.
- **LÍMITE:** el pintor HD-2D NO usa todavía a Lali 3D (sigue la lámina); no se ha visto con Three.js real. Lo visto es el rasterizador de la herramienta.
- **Siguiente: paso 3** (texturas recortadas del sprite, MEDIUM, solo con «hazlo»). Pendiente: quitar la lámina `cara` y poner la textura en la cabeza; mechones con lazo; camisa crema, botón y detalle rosa de las zapatillas.

## 12. Paso 3 (v2.129): texturas, atlas y uv (3a-3d hechos juntos)
- **Módulo:** `src/personaje3d.js` generaliza las texturas con un descriptor por personaje (`texturaDe`, `atlasDe`, `uvDe`, `idsDe`); Oli es el descriptor `OLI` y **no cambia**: huella completa (piezas, geometría, 20 texturas, atlas 64×33, uv) idéntica antes y después (`00fe7364…`, comprobada con los sprites reales). `G.personaje3d.de('luna')` ahora también da `ids()`, `textura(id)`, `atlas()`, `region(pieza, cara)`, `uvPoligono(poligono, atlas)`, `RECORTES`, `BRILLO`, `TONO_TEX`.
- **Lali:** 42 texturas, atlas de **64×39**, 112 triángulos (se quitó la lámina `cara` de la v2.128: 12 cajas), **54 de 56 caras con textura** (solo la tapa de las piernas, que queda bajo el torso, es lisa).
  - **26 recortes del sprite** (`RECORTES_LALI`, coordenadas en el mapa de letras de `G.CHARS.luna`): cabeza de frente (12×10, filas 0-9, columnas 2-13), de espalda y costados (10×10; el izquierdo es el espejo del derecho, sin `swapL`); torso (6×5, filas 10-14, columnas 5-10) de frente y de espalda; mangas (3×6) y manos (3×2) por los dos lados, de frente y de espalda; mechones (2×8, con el lazo rosa en la fila 6); piernas (3×4) y zapatillas (4×2, con el detalle rosa y el borde oscuro de la suela). `relleno: 'a'` pinta con el contorno los huecos sin pixel del sprite (esquinas de la fila 0, hombros), para que las caras salgan opacas.
  - **16 pintadas por código con la paleta del sprite**: la tapa del pelo (12×10, rubia con raya de 2 px de delante atrás) y los costados y tapas de torso, brazos, mechones, piernas y zapatillas (una textura por familia, compartida por izquierda y derecha). **Cambio respecto a lo previsto en la sección 4:** la ficha dejaba esos costados en color liso, pero así, al girar la cámara, se mezclaban colores lisos con rampa (azul saturado, naranja en sombra) con texturas; con textura toda la figura recibe el mismo tono de luz.
- **Tonos:** como Oli: textel × `TONO_TEX[tono]` × `BRILLO` (1,12).
- **Herramienta nueva** (sirve para Oli y Lali): `node tools/volcar_personaje_tex.js luna > /tmp/lali_tex.json && python3 tools/texturado.py /tmp/lali_tex.json docs/lali_paso3_texturas.png`. Dibuja la geometría con el atlas y las uv REALES del módulo (las que usará el pintor), con 3 poses × 4 giros y andando en 4 direcciones. Imagen: `docs/lali_paso3_texturas.png`. (La herramienta antigua `tools/cara_oli.py` sigue siendo solo de Oli.)
- **Pruebas:** `node test.js` = **71 grupos OK** (grupo 71 nuevo: 42 texturas, paleta, los 26 recortes son el trozo exacto del sprite, cara con ojos verdes y boca rosa, espejo de la cabeza, lazos, torso, manos y zapatillas, tapa, atlas sin solapes, 54 caras texturadas, uv en 0..1, Oli sin cambios, herramienta de volcado, módulo puro); huella del juego igual (`77a1889f…`); `python3 tools/prueba_hd2d_juego.py` (Three de pega) TODO BIEN; `dist/criaturas.html` reconstruido.
- **LÍMITE:** el pintor HD-2D NO usa todavía a Lali 3D (sigue la lámina) y no se ha visto con Three.js real; lo visto es el rasterizador de la herramienta (vecino más cercano, sin filtrado ni mipmaps de Three).
- **Pendiente para el paso 4:** atlas a un lienzo, material con `BRILLO`, malla recalculada por cuadro, interruptor `PERSONAJES3D_LALI`, generalizar `esOli`/`crearOli3d`/`poner3d`/`quitarOli3d`/`E.oli3d` del pintor sin cambiar a Oli. Decisión abierta para el paso 4: la tapa del pelo sale muy clara (tono «arriba» ×1,12, igual que cualquier tapa); si en el juego se ve demasiado, bajar su tono o la raya.

## 13. Paso 4 (v2.130): Lali 3D enchufada al pintor HD-2D
- **`src/hd2d_pintor.js`:** lo que era solo de Oli (`esOli`, `crearOli3d`, `poner3d`, `quitarOli3d`, `E.oli3d`) pasa a servir por id de personaje: `AJUSTE_3D = { rex: 'PERSONAJES3D', luna: 'PERSONAJES3D_LALI' }`, `id3d(jugador)` ('rex' | 'luna' | null), `crear3d(k)`, `poner3d(entidad, jugador, k)`, `quitar3d(k)` y `E.p3d[k]` (una malla por personaje, 1 llamada de dibujo cada una, atlas propio, vértices y colores recalculados cada cuadro con `G.personaje3d.de(k)`). `esOli` se conserva; `id3d` se exporta. `AJUSTES.PERSONAJES3D_LALI = true` de fábrica. La sombra sigue siendo el óvalo del pintor.
- **Interruptores independientes:** apagar uno (también en marcha) libera su malla y vuelve su lámina sin tocar al otro personaje; si una malla falla (error o cambio en el número de caras) se apaga solo ESE personaje (`AJUSTES[…] = false`) y vuelve su lámina. `entidades()` oculta la malla de un personaje que no está en el mapa.
- **Estado:** `G.hd2d.estado().st.personaje3d` = `{ triangulos: suma, rex: 204, luna: 112 }` (null si ninguno es malla).
- **Oli no cambia:** misma geometría, atlas, uv y tonos (el módulo no se tocó en este paso); la prueba de navegador sigue viendo su malla de 102 caras.
- **Pruebas:** `node test.js` = **72 grupos OK** (grupo 72 nuevo: interruptores, `id3d`, independencia, sin restos de `oli3d`; dos comprobaciones antiguas del grupo 70 y 71 pasan a decir que el pintor SÍ usa a Lali); `python3 tools/prueba_hd2d_juego.py` (Three de pega) **TODO BIEN** con 5 comprobaciones nuevas (Lali malla de 56 caras en su casilla, 5 sombras, estado 204 + 112 = 316, apagar y encender a Lali en marcha con Oli intacto); huella del juego en 2D igual (`77a1889f…`); equilibrio 0 alertas; `dist/criaturas.html` reconstruido (la prueba de navegador carga el dist: hay que reconstruirlo antes). `tools/prueba_hd2d_albanota.py` falla por tiempo de espera igual que en la v2.129 (necesita Three.js real: sin internet no carga), así que no es de este paso.
- **LÍMITE:** no se ha visto con Three.js real (no hay red): las caras, el brillo y el rendimiento reales están por comprobar. Las llamadas de dibujo (+1 por personaje, +2 con los dos) no se han medido (`estado().llamadas` solo existe con Three real).
- **Siguiente: paso 5** (LOW): con `npm install three@0.128.0` y `--three`, capturas de Oli y Lali juntos desde los 4 giros, medir llamadas y rendimiento (≤ 0,3 ms por personaje con CPU 4× más lenta), ajustar `BRILLO`/`TONO_TEX` y decidir si la tapa del pelo de Lali (muy clara) y su raya se suavizan.

## 14. Paso 5 (v2.131): prueba con Three.js real y presupuestos
- **Three.js r128 real** (`npm install three@0.128.0`, en Chromium con SwiftShader, 390×844 móvil ×2): `python3 tools/prueba_hd2d_juego.py --three …/three.min.js` → **TODO BIEN**; y la herramienta nueva `python3 tools/medir_personajes3d.py …/three.min.js [carpeta]` (capturas, llamadas, coste de cálculo, fotogramas; límites en su cabecera). Sin errores de consola.
- **Se ve bien:** Oli y Lali salen como malla 3D desde los 4 giros de cámara, quietos y andando (hacia el este y el norte), sin caras que desaparezcan ni z-fighting visible. Imagen: `docs/lali_oli_paso5_three_real.png` (6 capturas del juego). Con la cámara casi cenital del juego se ve sobre todo la tapa: la de Oli (durag) negra y la de Lali rubia.
- **Llamadas de dibujo:** con los dos personajes 3D, solo Oli, solo Lali y ninguno (láminas) **salen igual** (26-28 según la vista; los extremos son del mismo rango en las cuatro configuraciones). Cada personaje 3D **sustituye** a la malla de su lámina (la sombra ya existía), así que el coste real es **+0 llamadas**, no +1 por jugador como preveía la sección 7: la previsión era conservadora. Triángulos de personajes: 204 (Oli) + 112 (Lali) = 316 (`estado().st.personaje3d`).
- **Cálculo por cuadro** (pose + geometría, con la CPU 4× más lenta): **Oli ≈ 0,21 ms y Lali ≈ 0,12–0,13 ms** por cuadro; el límite era 0,3 ms por personaje. Los dos juntos ≈ 0,33 ms.
- **Fotogramas:** en este Chromium sin GPU el juego va a ≈ 37 ms por fotograma con los dos personajes en 3D y ≈ 39 ms con las dos láminas: la diferencia está dentro del ruido (el dibujo del mundo domina) y **no es una cifra de un móvil**. La pérdida de fotogramas «≤ 2 %» de la sección 7 NO se ha podido comprobar en un móvil real.
- **Brillo (`BRILLO`/`TONO_TEX`):** sin cambios. No hay referencia mejor que el sprite 2D y no se retocó a ojo; la tapa rubia de Lali sale clara pero coherente con las demás tapas iluminadas. Si en el móvil molesta, el ajuste es `G.personaje3d.TONO_TEX.arriba` (solo afecta a las tapas texturadas de Lali: la tapa del pelo, los hombros y las puntas de las zapatillas).
- **Hallazgo de la herramienta:** el limitador de CPU del navegador activa la protección «móvil lento» del juego y vuelve a 2D; por eso solo se aplica durante la medida del cálculo. Y hay que elegir «Jugar con Oli» antes de pulsar HD-2D, o no hay jugador y no se dibujan personajes.
- **Pendiente:** verlo en un móvil real (GPU real) y el paso 6 (cierre).

## 15. Paso 6 (v2.132): cierre
- **Decisión: la lámina de Lali NO se retira.** El plan decía retirarla «si la prueba del paso 5 fue correcta». La prueba con Three.js real salió bien, pero solo en un Chromium sin GPU; no se ha visto en un móvil real. La lámina y el interruptor `AJUSTES.PERSONAJES3D_LALI` son la salida de emergencia (si la malla falla se apaga solo ese personaje y vuelve la lámina, ya probado) y cuestan nada. Además las láminas son el dibujo del 2D y de `G.vista.persona`, que no cambian. Retirar la lámina del HD-2D solo tendría sentido tras verlo en un móvil.
- **Estado final de la serie:** Lali y Oli son malla 3D en el HD-2D (Lali: 12 cajas, 112 triángulos, 42 texturas, atlas 64×39; Oli: 24 cajas, 204 triángulos, 20 texturas, atlas 64×33), un solo módulo (`G.personaje3d.de(id)`), un solo pintor (`E.p3d`), interruptores independientes, el 2D y las criaturas sin cambios (huella del juego `77a1889f…`), `node test.js` = 72 grupos.
- **Comprobado en el cierre:** `node build.js` deja `dist/criaturas.html` idéntico (sin cambios de código desde la v2.130), `node test.js` 72 grupos OK, huella del juego igual.
- **Pendiente:** (1) probar en un móvil real (GPU real): aspecto, brillo, tapa clara del pelo de Lali (`TONO_TEX.arriba`) y fotogramas; (2) el movimiento en diagonal de Lali y Oli (`docs/PLAN_MOVIMIENTO_PERSONAJES.md`).
