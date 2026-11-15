# FICHA DE PERSONAJE 3D · OLI (v2.111 · paso 1 hecho: solo documentos)

Estado: **paso 1 hecho (esta ficha)**. Siguiente: paso 2 (volumen con colores lisos), solo con «hazlo». Primera pieza de la serie «personajes 3D» (Lali va después con el mismo sistema). Mismo método que el banco (`docs/FICHA_BANCO_3D.md`) y la farola, pero con una diferencia: **Oli se mueve**, así que no vale un `vol` estático; hace falta un módulo de personaje articulado (ver sección 4).

Objetivo: que Oli, en el **HD-2D**, deje de ser una lámina plana que siempre mira a la cámara y pase a ser un **volumen con textura de píxel**, que gira con la cámara, mira hacia donde anda y mueve brazos y piernas. **El juego en 2D no cambia** (el sprite 2D de Oli no se toca).

## 0. Reglas (las del banco, adaptadas)

1. **Unidad:** 1 u = 1 casilla = 16 px. Medidas sacadas del sprite 2D `rex_down_0` (16×23 px de dibujo, lienzo 18×24, pies en `j.y`, `feet: 3`).
2. **La colisión no cambia** (el motor no se toca): la posición `j.x`, `j.y` son los pies, como hoy.
3. **Texturas de píxel por código**, filtro nítido, 1 texel = 1 px del 2D, paleta de `G.PAL`/`CHARS.rex.pal`. Las caras salen **recortadas del propio sprite 2D** (frente = `down`, espalda = `up`, costados = `side` y `sideL`), así que es el mismo Oli. Lo que el 2D no dibuja (arriba de la cabeza, suelas, hombros vistos de costado…) se pinta por código con los mismos colores.
4. **Luz fija arriba-izquierda** (como edificios, farola y banco): oeste = luz, sur = base, este y norte = sombra, arriba = brillo.
5. **El 2D no cambia** (huella del juego igual). Todo detrás de un interruptor: `G.hd2d.AJUSTES.PERSONAJES3D` y `?personajes3d=0` (apagado = lámina como hoy).
6. **Solo Oli** en esta serie. **Lali sigue como lámina** hasta su propia ficha; mientras tanto, en pantalla pueden verse un Oli 3D y una Lali plana (se avisa; es temporal).

## 1. Cómo es Oli hoy (lo que hay que conservar)

- **Chibi:** cabeza grande, ≈ 12 de 23 filas (52 % de la altura). Se conserva la proporción.
- **Vista de frente (16×23 px):** filas 0-1 mechones de pelo (rojo y castaño); filas 2-4 capa oscura de arriba (pelo oscuro o gorro, `e` y `f`); fila 5 frente (piel); filas 6-8 **gafas oscuras** con un destello blanco y azul en cada cristal; filas 8-10 mejillas y boca; fila 11 barbilla y cuello; filas 12-17 torso con chaqueta rosa (`o`, `s`) con un estampado naranja, marrón y blanco (`p`, `q`, `r`), brazos pegados a los lados y manos de piel en la fila 17; filas 18-19 pantalón; fila 20 calcetines blancos; fila 21 zapatillas (crema `t` con verde `u`); fila 22 contorno.
- **Pelo bicolor:** la mitad **izquierda de Oli** (su izquierda, no la de la imagen) es **roja** y la derecha **castaña**. De espaldas se ve el mismo pelo con una trama de 1 px. En el perfil izquierdo se ve el lado rojo (`swapL`).
- **Vistas del 2D:** `down` (frente, 16 px), `up` (espalda, 16 px), `side` (perfil derecho, 12 px) y `sideL` (perfil izquierdo, 12 px). Animación: 3 fotogramas (quieto, pie derecho arriba, pie izquierdo arriba), cambia cada 0,18 s al andar.
- **Sombra 2D:** óvalo de 10 × 3 px bajo los pies.

## 2. Piezas y medidas (1 px = 0,0625 u)

Origen en los pies (centro de la casilla, y = 0 en el suelo). Todas las medidas son múltiplos de 0,0625 u y ninguna baja de 0,125 u (mínimo del banco, para que no parpadeen al girar la cámara en el móvil).

| Pieza | Qué es | Ancho × alto × fondo (u) | Posición (centro; y = base) | Mueve |
|---|---|---|---|---|
| **cabeza** | caja de piel con la cara delante | 0,8125 × 0,6875 × 0,6875 | y 0,6875–1,375 | gira un poco hacia donde mira (opcional, paso 4) |
| **pelo** | casquete sobre la cabeza (mitad izquierda roja, derecha castaña) + capa oscura de arriba | 0,875 × 0,3125 × 0,75 | y 1,125–1,4375 | con la cabeza |
| **mechones** | 2 cajitas de 0,125 u sobre el casquete (como las filas 0-1) | 0,125 × 0,125 × 0,125 | y 1,4375–1,5625 | con la cabeza |
| **gafas** | lámina fina delante de la cara (solo textura, con relieve de 0,03 u) | 0,625 × 0,1875 × 0,03 | y 1,0–1,1875 | con la cabeza |
| **torso** | chaqueta rosa con estampado | 0,625 × 0,5 × 0,4375 | y 0,375–0,875 | rebote leve |
| **brazos** ×2 | manga rosa y mano de piel | 0,1875 × 0,4375 × 0,1875 | a los lados del torso, y 0,4375–0,875 | balanceo (pivote en el hombro) |
| **piernas** ×2 | pantalón y calcetín blanco | 0,25 × 0,3125 × 0,25 | y 0,125–0,4375 | balanceo (pivote en la cadera) |
| **zapatillas** ×2 | crema con suela verde | 0,25 × 0,125 × 0,375 | y 0–0,125, sobresalen 0,0625 por delante | con la pierna |

Total: **Oli mide 1,4375 u de alto** (23 px, como el 2D) sin los mechones y ≈ 1,5 u con ellos; ancho máximo 0,875 u (cabeza con pelo). Cabe de sobra en una casilla.

Notas:
- Los números son una primera propuesta calculada del sprite y se **ajustan en el paso 2 mirando el rasterizador** (como se hizo con el banco, que salió con 82 triángulos en vez de ~110).
- La cabeza es más ancha que el torso (chibi), igual que en el 2D.
- Las gafas van como relieve mínimo para que no se «cuelen» dentro de la cara al girar.

## 3. Texturas (paso 3)

| Pieza y cara | Cómo se hace |
|---|---|
| Cara (frente) | recorte de `rex_down_0`, filas 5-11 (frente, gafas, mejillas, boca) |
| Cabeza, atrás | recorte de `rex_up_0` (pelo de espaldas con la trama) |
| Cabeza, costados | recorte de `rex_side_0` (derecho) y `rex_sideL_0` (izquierdo, lado rojo) |
| Pelo, arriba | por código: mitad izquierda roja, derecha castaña, 1 px de contorno |
| Torso | recorte de frente y espalda; costados de `side`; estampado como en el 2D |
| Brazos | franja de 2-3 px del torso del sprite (manga rosa) y 2 px de mano de piel abajo |
| Piernas y zapatillas | filas 18-21 del sprite (pantalón, calcetín blanco, zapatilla); la suela se pinta por código |
| Tonos | luz / base / sombra como el banco (oeste, sur, este y norte) con la rampa de cada color |

Un solo atlas de **256 px de ancho** con todas las caras de las piezas (≈ 40 texturas); se hace una vez y se comparte. **Sin azar.** Si el sprite 2D cambia, las texturas cambian solas (salen de él).

## 4. Qué hay que ampliar en el motor (paso 2 y 4)

- **No cabe en `vol`:** el sistema de volúmenes (`src/volumenes.js`) es estático (edificios, farola, banco). Oli necesita **piezas con pivote que cambian cada cuadro**.
- **Módulo nuevo `src/personaje3d.js` (`G.personaje3d`, puro, sin DOM y sin `Math.random`):** `piezas()` (las cajas de la sección 2 con sus pivotes), `pose(t, moving, dir)` (ángulos de brazos y piernas, rebote, giro del cuerpo) y `geometria(pose)` (vértices colocados). Dos móviles ven lo mismo porque depende solo de `j.tm`, `j.moving` y `j.dir`, que ya viajan en el estado.
- **Una sola malla por personaje** (no una por pieza): los vértices se **recalculan cada cuadro**, como las partículas 3D de la v2.93. Coste: **+1 llamada de dibujo por jugador** y ≈ 150 triángulos recalculados por cuadro.
- **Pintor (`src/hd2d_pintor.js`):** `entidades()` dibuja hoy a los jugadores como láminas con `G.vista.persona`. Con el interruptor encendido, Oli pasa a la malla 3D y Lali sigue como lámina. La sombra sigue siendo el óvalo del pintor (se mueve con él), no va dentro del volumen.

## 5. Movimiento (decisiones de diseño)

- **Mira hacia donde anda:** `down` = hacia el sur (+z), `up` = norte, `left` = oeste, `right` = este. El cuerpo gira con suavidad (≈ 0,12 s) al cambiar de dirección, sin saltos; la cámara gira aparte (los 4 giros).
- **Ciclo de andar de 0,36 s** (el 2D cambia de pie cada 0,18 s): piernas ±28°, brazos al contrario ±22°, rebote vertical de 0,03 u (2 px) en cada paso. Parado: pose quieta, sin animación (como el 2D).
- **Hablar:** se queda quieto mirando a la criatura (como hoy; el botón 💬 no cambia).
- **Puertas, cámara y colisión:** no cambian.
- **Oclusión de edificios (paso E del 3D):** hoy mira «pies y cabeza» del jugador; Oli 3D usa su altura real (1,5 u). Si el tejado lo tapa, se atenúa igual que ahora.

## 6. Presupuestos (se miden en el paso 5)

- ≤ 200 triángulos por personaje, atlas ≤ 256×256, +1 llamada de dibujo por jugador (máximo +2 en total hasta que exista Lali 3D).
- Recalcular los vértices ≤ 0,3 ms por cuadro con CPU 4× más lenta (se medirá como la oclusión de la v2.89).
- Objetivo: el HD-2D no pierde más de un 2 % de fotogramas con Oli 3D en pantalla.

## 7. Pasos y qué recibes

| Paso | Qué | Esfuerzo | ZIP |
|---|---|---|---|
| 1 | Esta ficha | LOW | **ZIP 1** (solo documentos) · hecho en la v2.111 |
| 2 | `src/personaje3d.js`: piezas con pivote, pose de andar y geometría con **colores lisos**; ves la forma (imagen con 4 giros y 3 poses) | MEDIUM | ZIP 2 |
| 3 | Texturas de píxel por pieza y cara, recortadas del sprite 2D, y atlas (puede ir en dos mitades) | MEDIUM | ZIP 3 |
| 4 | Integrar en el pintor HD-2D: malla animada, giro suave, sombra, oclusión, interruptor `PERSONAJES3D` y pruebas en `test.js` | MEDIUM | ZIP 4 (funcionando) |
| 5 | Prueba con Three.js real (`npm install three@0.128.0`), capturas antes y después desde los 4 giros, presupuesto y ajuste fino | LOW | ZIP 5 (todo cerrado) |

Cada paso se hace solo con tu «hazlo» y se dice antes si es LOW o MEDIUM. Un ZIP por paso y paro.

## 8. Decisiones (todas de Claude, cámbialas cuando quieras)

1. Se **conserva el chibi** (cabeza = 52 % de la altura) y la altura de 1,4375 u del 2D.
2. **Texturas recortadas del sprite 2D**, no dibujadas aparte: es el mismo Oli y no hay que mantener dos dibujos.
3. **Una malla por personaje con vértices recalculados** (1 llamada de dibujo), no 8 mallas con huesos.
4. **El 2D no cambia** y todo va detrás de un interruptor; Lali sigue plana hasta su ficha.
5. Brazos y piernas **sin rodillas ni codos** (cajas rígidas con pivote en hombro y cadera): fiel al estilo de píxel.
6. **Sin animación parado** (como el 2D); respiración o parpadeo quedan para después.
7. Después de Oli: Lali con el mismo módulo (solo cambian paleta y recortes), luego criaturas si se quiere.

## 9. Pendiente del usuario

- Decir si le gusta la dirección (Oli cuerpo rígido con cabeza grande, texturas del sprite) o qué cambiar.
- Confirmar que Lali queda plana por ahora.
- **Paso 2 solo con «hazlo»** (MEDIUM).


## 10. Paso 3 · checkpoint 1 (v2.114): 4 trenzas laterales y tope de 240
- Pedido del usuario: trenzas que cuelgan junto a las orejas y la cara (2 por lado). Hechas como 4 cajas de 2×5×2 px (`trenza_lado_roja_1/2` a +x, `trenza_lado_castana_1/2` a −x), z = 0,21875 (junto a la cara) y −0,0625 (junto a la oreja), de 0,875 a 1,1875 u: cuelgan del pelo sin bajar de los hombros (no chocan con los brazos) y llegan justo al borde de la casilla (x = ±0,5).
- Presupuesto: **222 triángulos** (antes 182); el tope de la ficha pasa de 200 a **240** (`MAX_TRIANGULOS`). Recalcular ≈ 0,04 ms frente al límite de 0,3 ms (se mide de verdad en el paso 5).
- 26 cajas. `test.js` = 69 grupos (3 pruebas cambiadas y 1 nueva de las trenzas laterales). Imagen: `docs/oli_paso2_formas.png` (regenerada).
- Sigue: 3b (texturas de la cabeza), 3c (torso, brazos, piernas, zapatillas), 3d (textura de trenza en zigzag con transparencia, sobre las 6 trenzas de atrás y las 4 laterales).


## 11. Paso 3 · checkpoint 2 (v2.115): 3b-1, textura de la CARA de la cabeza
- Hecho: `G.personaje3d.textura('cabeza_sur')` → 14×7 texels recortados de `rex_down` (filas 5-11, columnas 1-14: frente, gafas con destello, mejillas, boca, barbilla). Salen del mapa de letras de `src/chars.js` (ahora expuesto como `G.CHARS`, solo lectura); si el sprite cambia, la textura cambia sola. Imagen ampliada: `docs/oli_paso3b_cara.png` (`node tools/volcar_oli_tex.js > /tmp/oli_tex.json && python3 tools/texturas_oli.py /tmp/oli_tex.json docs/oli_paso3b_cara.png`).
- **Todavía NO se pinta en el modelo**: la geometría, los 222 triángulos y los colores lisos no cambian; el 2D y el pintor tampoco.
- **Hallazgo para decidir:** la cara del sprite mide **14 px** de ancho (con contorno) y la caja de la cabeza mide **13 px** (0,8125 u). Para que 1 texel = 1 px hay que ensanchar la cabeza a 14 px (0,875 u, igual que el casquete del pelo). Propuesta de Claude: ensancharla en el siguiente subpaso (3b-2), junto con la cara pintada en el rasterizador.
- Sigue: 3b-2 (ensanchar cabeza y ver la cara puesta en el rasterizador), 3b-3 (espalda y costados de la cabeza), 3c, 3d.
- **Gafas de sol (v2.116, sustituyen a las «gafas finas clásicas» de la v2.115, que parecían de graduar):** pedido del usuario: como las del sprite 2D (lentes oscuras con brillo blanco y azul) pero con la unión central más fina. Elegida la opción 4 de 4 propuestas: dos lentes de 3×3 texels, unión de 1 fila × 2 px por arriba, patillas de 1 px, fila 4 de piel; mismo brillo del 2D en las dos lentes. Texto anterior (v2.115, ya no vigente):
- **Gafas finas (pedido del usuario, v2.115):** las del sprite 2D son una banda oscura de 8×4 px («muy gordas»). En la textura 3D se pintan por código unas **gafas finas clásicas**: montura de 1 px, dos cristales de 4×4 px con destello blanco y tinte azul claro (colores del sprite), puente de 2 px y patillas. **El sprite 2D no cambia** (huella igual). La pieza `gafas` del volumen (lámina oscura de 10×3 px, colores lisos) sigue igual por ahora: se adapta en 3b-2 al ponerle la textura (cristales transparentes). Si también las quieres finas en el 2D, es otro pedido (cambia la huella).

## 12. Paso 3 · 3b-2, MITAD 1 (v2.117): cabeza ensanchada a 14 px
- Hecho: la caja `cabeza` pasa de 0,8125 a **0,875 u** (14 px, igual que el casquete del pelo y que la cara del sprite: 1 texel = 1 px). Triángulos igual (222). Las trenzas laterales quedan pegadas a la cabeza.
- Falta (2.ª mitad de 3b-2): ver la cara puesta en el rasterizador. `test.js` = 69 grupos OK (1 prueba cambiada: ancho de la cabeza); equilibrio 0 alertas; huella del juego igual (`77a1889f…`).

## 13. Paso 3 · 3b-2, MITAD 2 (v2.118): cara puesta en el rasterizador
- Herramienta nueva `tools/cara_oli.py` (`node tools/volcar_oli.js > /tmp/g.json && node tools/volcar_oli_tex.js > /tmp/t.json && python3 tools/cara_oli.py /tmp/g.json docs/oli_paso3b2_cara_puesta.png /tmp/t.json`): geometría real de Oli quieto con la textura `cabeza_sur` sobre la cara sur de la cabeza (14×7 texels, 1 texel = 1 px), 4 giros de cámara. La lámina lisa `gafas` no se dibuja (la sustituye la textura).
- Resultado: la cara encaja a ancho completo con las gafas de sol y la boca; solo toca la vista de frente (los otros lados siguen lisos). Código del juego sin cambios; `test.js` 69 grupos OK. 3b-2 CERRADO.
- Siguiente: 3b-3 (espalda y costados de la cabeza; ahí se quita la lámina `gafas`), solo con «hazlo».

## 14. Paso 3 · 3b-3, MITAD 1 (v2.119): textura de la ESPALDA de la cabeza
- Hecho: `G.personaje3d.textura('cabeza_norte')` → 14×11 texels recortados de la espalda de `rex` (`C.back(C.down)`, filas 1-11, columnas 1-14: pelo rojo a la izquierda y castaño a la derecha visto desde atrás, con la trama y las trenzas, y la nuca). Imagen: `docs/oli_paso3b3_espalda.png`.
- Todavía NO se pinta en el modelo (geometría, 222 triángulos y 2D sin cambios). `test.js` 69 grupos OK.
- Falta (mitad 2 de 3b-3): los costados (`side` / `sideL`) y ponerlos en el rasterizador; ahí se quita la lámina `gafas`.

## 15. Arreglo de la cabeza (v2.120)
- Referencia del usuario: durag negro ajustado con banda en la frente que cubre toda la parte alta (no se ve pelo encima) y trenzas finas rojas y castaño oscuro que caen por los lados y por detrás, mezcladas. Hecho: durag completo + banda, 6 trenzas traseras y 4 laterales alternadas, 214 triángulos. Imagen: `docs/oli_paso3c_durag_trenzas.png`. Los costados y la espalda de la cabeza siguen lisos hasta que se pinten sus texturas.

## 16. PENDIENTE detectado tras v2.120: proporciones del cuerpo (HECHO en v2.121)
- Hallazgo (revisión a petición del usuario, que ve la cabeza «muy pegada al cuerpo»): la cabeza empieza en y 0,6875 u y el torso llega a 0,875 u, así que se solapan 0,1875 u (3 px): la barbilla queda dentro del torso, no hay cuello y los hombros (pivote de los brazos en y 0,875) quedan tapados por la cabeza, que además sobresale 0,125 u por delante del torso. El cuerpo es estrecho (0,625 u frente a 0,875 u de la cabeza) y las piernas, cortas. El solapamiento viene de la ficha original (secciones 2 y 3), no de un error de código.
- HECHO en v2.121 (imagen: `docs/oli_v121_proporciones.png`): torso de y 0,375 a 0,6875 u (0,6875 de ancho), hombros/brazos bajados a y 0,6875, sin solape con la cabeza. Propuesta original ( antes de las texturas del cuerpo, paso 3c, para no repintarlas): torso que termina justo en 0,6875 u (sin solapar la cabeza), hombros y brazos bajados a esa altura, torso algo más ancho (≈ 0,6875 u), altura total 1,4375 u igual; actualizar tests (grupo 69) y la ficha.

## 17. Paso 3c (mitad 1, v2.122): texturas del cuerpo
- `G.personaje3d.textura()` añade `torso_sur`, `torso_norte` (12×5, filas 12-16 del sprite, columnas 2-13, centradas sobre el torso de 11 px) y `manga_d_sur`, `manga_i_sur` (3×5). Imagen: `docs/oli_paso3c_cuerpo.png` (`node tools/volcar_oli.js > /tmp/g.json && node tools/volcar_oli_tex.js > /tmp/t.json && python3 tools/cara_oli.py /tmp/g.json salida.png /tmp/t.json`).
- Pendiente (3c-2): espalda de los brazos, piernas, calcetines y suela verde de las zapatillas. → HECHO en la sección 18.

## 18. Paso 3c-2 (v2.123): espalda de brazos y piernas
- Nuevas texturas en `G.personaje3d.textura()`: `manga_d_norte`, `manga_i_norte` (3×5, de `back`, filas 12-16) y `pierna_d_sur`, `pierna_i_sur`, `pierna_d_norte`, `pierna_i_norte` (4×7 = pantalón 3 + calcetín 2 + zapatilla 2). Nuevo campo `filas` en `RECORTES` (fila del sprite para cada fila de la textura): `[19,19,19,20,20,21,22]`; la fila 19 se repite 3 veces (el sprite solo tiene 1 de pantalón) y la 22 es el contorno de la suela. Columnas: pierna derecha 3-6, izquierda 9-12 (al revés de espalda). La suela verde sale del recorte.
- No cambia geometría (214 triángulos), ni el 2D, ni el juego. `test.js` 69 grupos OK. `tools/cara_oli.py` conoce las mangas de espalda.
- Pendiente: 3d trenzas con textura (los costados de la cabeza se hicieron en la sección 19).

## 19. Paso 3b-3, MITAD 2 (v2.124): costados de la cabeza
- Nuevas texturas: `cabeza_oeste` (costado derecho de Oli, de `side`, columnas 1-11) y `cabeza_este` (costado izquierdo, `side` espejado con `swapL`, columnas 0-10), 11×11 texels (filas 1-11 del sprite; la caja mide 11 px de fondo). Campo `vista: 'sideL'` nuevo en `textura()`.
- `tools/cara_oli.py` pinta ya frente, espalda y los dos costados de la cabeza (las filas 1-4 del sprite quedan bajo el durag y no se pintan; sesgo de profundidad para evitar z-fighting con el durag). Imagen: `docs/oli_paso3b3_costados.png`.
- La lámina lisa `gafas` sigue en el modelo (el rasterizador de la herramienta ya la ignora); quitarla cambia triángulos y tests y se deja para cuando el juego consuma las texturas. Geometría, 2D y juego sin cambios; `test.js` 69 grupos OK.

## 20. Paso 3d (v2.125): texturas de las trenzas · PASO 3 COMPLETO
- `G.personaje3d.textura('trenza_roja_N' | 'trenza_castana_N')`, N = alto en px: 5 (laterales), 7 y 9 (traseras). 2 texels de ancho (caja de 0,125 u). Se GENERAN con la paleta del sprite (en el 2D las trenzas son píxeles sueltos, no hay qué recortar): fila 0 lisa (rojo `c` / castaño `b`), luego el tono claro (`i` / `d`) alterna de lado cada fila (zigzag) y la última fila pierde un texel (punta transparente, `null`). Nueva `G.personaje3d.ids()` lista las 20 texturas (14 recortes + 6 de trenza); `tools/volcar_oli_tex.js` las vuelca todas.
- `tools/cara_oli.py` pinta las 10 trenzas con su textura (`docs/oli_paso3d_trenzas.png`). Geometría (214 triángulos), 2D y juego sin cambios; `test.js` 69 grupos OK (una comprobación nueva); huella del juego igual (`77a1889f…`).
- **Siguiente: paso 4**, enchufar Oli 3D al pintor HD-2D (`src/hd2d_pintor.js`): atlas con las texturas, malla con pose por cuadro, quitar la lámina lisa `gafas`, probar con Three.js real, y paso 5 (presupuestos). Solo con «hazlo»; MEDIUM.

## 21. Paso 4 (v2.126): Oli 3D enchufado al pintor HD-2D
- `src/personaje3d.js`: nuevas `atlas()` (todas las texturas en una imagen de 64×33 con celda blanca para lo liso), `region()` y `uvPoligono()` (uv de cada cara; las caras sin textura usan el color liso en el vértice), `BRILLO`/`TONO_TEX` (luz fija sobre las caras texturadas). Se QUITA la pieza lámina `gafas` (las gafas son ya textura de la cara): 24 cajas, 204 triángulos. `cabeza_sur` se completa con 4 filas de piel para cubrir la cara entera.
- `src/hd2d_pintor.js`: `AJUSTES.PERSONAJES3D` (true). Oli = UNA malla (`crearOli3d`, `poner3d`): vértices y colores recalculados cada cuadro con `G.personaje3d.pose/girar/geometria`; +1 llamada de dibujo; sombra = el óvalo de siempre; Lali y criaturas siguen como láminas. Cualquier error apaga el interruptor y vuelve la lámina.
- Pruebas: `node test.js` 69 grupos OK (2 comprobaciones nuevas y 5 adaptadas); `python3 tools/prueba_hd2d_juego.py` (Three de pega) TODO BIEN; huella del juego igual (`77a1889f…`); equilibrio sin alertas.
- **LÍMITE:** no se ha visto con Three.js real (no hay red). Pendiente (paso 5): captura con Three real desde los 4 giros, presupuesto de rendimiento y ajuste de brillo (`BRILLO`/`TONO_TEX`). Si Oli se viera mal: `G.hd2d.AJUSTES.PERSONAJES3D = false`.

## 22. Nota v2.130: el pintor ya sirve a Oli y a Lali
- El código del pintor que dibuja a Oli en 3D se generalizó por personaje (`id3d`, `E.p3d[k]`, `AJUSTES.PERSONAJES3D_LALI` para Lali). Oli sigue con `AJUSTES.PERSONAJES3D` y no cambia. Ya no existen `E.oli3d`, `crearOli3d` ni `quitarOli3d`; mira `docs/FICHA_LALI_3D.md`, sección 13.
- El presupuesto de la sección 6 («+1 llamada por jugador, máximo +2 en total hasta que exista Lali 3D») queda en **+2 con Oli y Lali en 3D**; se mide en el paso 5 de Lali.

- **v2.131 (Lali 3D, paso 5):** medido con Three.js real: los personajes 3D no añaden llamadas de dibujo (+0 respecto de las láminas con los dos 3D), el cálculo por cuadro es ≈ 0,21 ms (Oli) y ≈ 0,12 ms (Lali) con la CPU 4× más lenta. Ver `docs/FICHA_LALI_3D.md`, sección 14.
