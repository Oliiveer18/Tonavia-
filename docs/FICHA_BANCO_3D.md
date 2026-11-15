# FICHA DE OBJETOS 3D · BANCO (v2.110 · pasos 1-5 hechos: CERRADO)

Estado: **paso 1 hecho (esta ficha, v2.104) y paso 2 hecho (v2.105: volumen con colores lisos, ver sección 8)**. Paso 3 hecho (v2.106: asiento y listones; v2.107: montantes; v2.108: patas, ver secciones 9-11). Pasos 4 (v2.109, sombra rectangular) y 5 (v2.110, prueba con Three.js real) hechos: ficha cerrada (secciones 12-13). Segunda pieza de la serie «objetos pequeños» (la primera fue la farola, `docs/FICHAS_OBJETOS_3D.md`) y con el mismo método: `vol` en `src/albanota_objetos.js`, estilo propio en `src/volumenes_tex.js`, pintor HD-2D sin cambios de flujo. Las decisiones de diseño las toma Claude (el usuario las delegó) y se pueden cambiar con un número.
Objetivo: que los **3 bancos** de Albanota (casillas 8,16 · 20,16 · 27,16) dejen de ser láminas planas en el HD-2D y pasen a ser un **volumen de madera con textura de píxel**, que gira bien con la cámara y se lee como un banco de parque de verdad.

## 0. Reglas (las de la farola, adaptadas)

1. **Unidad:** 1 u = 1 casilla = 16 px. Las medidas salen del dibujo 2D (`banco()`, sprite 26×16, `ox: 3`, `pieY: 14`).
2. **La huella 3D = la colisión:** 2×1 casillas (`huella: [[0, 0, 2, 1]]`); el motor no cambia y todo el volumen cabe dentro de ella.
3. **Texturas de píxel por código**, filtro nítido, 1 texel = 1 px del 2D, paleta del juego, contorno `#2a1b30` solo en las aristas. Sin imágenes.
4. **Luz fija arriba-izquierda:** oeste = luz, sur = base (el 2D de hoy), este y norte = sombra. El 2D solo dibuja el banco de frente (mirando al sur) y ningún banco del mapa lleva giro: **el volumen mira al sur** y la cámara gira a su alrededor.
5. **El 2D no cambia** (huella del juego igual). Una pieza sin `vol` sigue como lámina; el banco gana `vol`, así que los que se coloquen con «✏️ Editar mapa» salen solos en 3D.
6. **Nada fino que parpadee:** ninguna pieza de menos de 2 px (0,125 u) en ninguna dirección; los detalles de 1 px van en la textura, no en la geometría.

## 1. Volumen (origen en la esquina de la huella; x a lo largo, z hacia el sur, y hacia arriba)

Largo total 1,625 u (26 px), centrado en x = 1,0 (de 0,1875 a 1,8125). El borde sur del asiento y el de las patas está a z = 0,875 (los 14 de 16 px de `pieY`: el banco queda hacia el sur de su casilla, como en el 2D). Fondo del asiento **0,5 u** (8 px; proporción largo : fondo ≈ 3,3 : 1, la de un banco de parque real).

| Pieza | Material | x (u) | z (u) | y (u) | Caja | Medida en 2D |
|---|---|---|---|---|---|---|
| 4 patas | madera oscura | 0,25–0,4375 y 1,5625–1,75 | delanteras 0,6875–0,8125 · traseras 0,4375–0,5625 | 0 → 0,25 | 0,1875 × 0,125 | 3 px de ancho, 4 px de alto |
| Asiento | madera | 0,1875–1,8125 | 0,375–0,875 | 0,25 → 0,4375 | 1,625 × 0,5 | 26 px de largo, frente de 3 px |
| 2 montantes del respaldo | madera oscura | 0,3125–0,4375 y 1,5625–1,6875 | 0,4375–0,5625 | 0,4375 → 1,0 | 0,125 × 0,125 | 2 px de ancho, hasta arriba del todo |
| Listón alto | madera | 0,25–1,75 | 0,375–0,5 | 0,8125 → 0,9375 | 1,5 × 0,125 | 24 px de largo, 2 px de alto |
| Listón bajo | madera | 0,25–1,75 | 0,375–0,5 | 0,625 → 0,75 | 1,5 × 0,125 | 24 px de largo, 2 px de alto |

**Alto total: 1,0 u** (= los 16 px del sprite). 9 cajas, unos 110 triángulos (objetivo ≤ 120).
Decisiones de diseño (de Claude):
- Las patas traseras y los montantes van en la misma línea (z 0,4375–0,5625): se leen como un solo poste, como en un banco real.
- Los montantes quedan **0,0625 u por delante** de los listones, igual que el 2D los dibuja encima; así no hay caras coplanares que parpadeen.
- Las patas van 0,0625 u metidas respecto al frente del asiento (no a ras), para que el asiento tenga sombra propia y no parezca un bloque.
- El respaldo sube recto (sin inclinar) y el banco no lleva reposabrazos: es lo que dice el 2D. Un respaldo inclinado o con reposabrazos sería una variante futura, no un retoque.
- Los listones son 1 px más bajos que en el 2D (la parte de arriba la ocupan los montantes) para no tener caras de arriba coplanares; diferencia de 1 px, invisible.

## 2. Texturas por cara (madera: cadena de 6 colores, de claro a oscuro)

Material `madera`: `#d9a574` (brillo) · `wood1 #c48b52` · `wood2 #b27a45` · `wood3 #8f5c33` · `woodD #6b4226` · contorno `#2a1b30`.

| Cara | Qué lleva | Tono |
|---|---|---|
| Asiento, arriba (26×8 texels) | 3 tablones de 2 texels con una línea oscura de 1 texel entre ellos (2+1+2+1+2), color `wood1`, borde sur con el brillo `#d9a574` (como la fila clara del 2D) y 2 o 3 vetas cortas de `wood2` por tablón en posiciones fijas (sin azar) | luz / base / sombra |
| Asiento, frente y costados | `wood3` con el filo de arriba 1 texel más claro y el de abajo 1 texel más oscuro (`woodD`) | luz / base / sombra |
| Listones, frente | `wood3` con la fila de arriba en `wood1` (como el 2D) y una veta | luz / base / sombra |
| Listones, arriba y costados | `wood1` / `wood3`; las cabezas de los listones, `woodD` | luz / base / sombra |
| Montantes y patas | `woodD` con un filo claro de 1 texel a la izquierda y un brillo arriba | luz / base / sombra |

Los tres tonos por cara hacen el trabajo del volumen en las piezas estrechas (igual que el poste de la farola); la textura solo lleva las vetas, las líneas entre tablones y los filos. Estilo nuevo `banco` junto a `casa`, `centro`, `tienda`, `ermita`, `fuente` y `farola`; entra en el atlas de 256 px que ya usa el pintor.

## 3. Sombra de suelo

Rectángulo suave de unos 1,75 × 0,55 u, empujado 0,10 u al este y 0,12 u al sur, en cuadritos de 0,125 u, al **75 %** de intensidad (`SUAVE.banco` del 2D). Hoy el motor de volúmenes solo sabe hacer óvalos (`vol.sombra` con `rx`, `rz`) y el disco de la fuente: hace falta **un modo rectangular** en `sombraSuelo` (paso 4), sin tocar los otros dos. Sombras proyectadas de verdad en HD-2D siguen en pausa.

## 4. Lo que hay que ampliar en el motor (paso 2)

- `vol.cajas` solo admite cajas cuadradas (`w`). El banco necesita **`d`** (fondo en z; si no está, `d = w`) para cajas rectangulares. Los volúmenes existentes no cambian.
- `V.validar` comprueba que todo cabe en la huella 2×1 y que ninguna pieza mide menos de 0,125 u.
- No hace falta torno ni luz: el banco no lleva luz y no tiene piezas redondas.

## 5. Presupuesto (móvil)

- Geometría: unos 110 triángulos por banco; el volumen se genera una vez por tipo y se comparte (3 mallas, una llamada de dibujo cada una).
- Sin luces, sin shaders nuevos, sin partículas. Atlas y material compartidos con las demás piezas.
- Con los 3 bancos pasan a ser **22 piezas en volumen** en Albanota (hoy 19): se actualizan las cuentas de `test.js` y de `tools/prueba_hd2d_juego.py`.
- Objetivo: el HD-2D no pierde más de un 2 % de fotogramas con los 3 bancos en pantalla (se mide en el paso 5).

## 6. Pasos y qué recibes

| Paso | Qué | Esfuerzo | ZIP |
|---|---|---|---|
| 1 | Esta ficha | LOW | **ZIP 1** (solo documentos) · hecho en la v2.104 |
| 2 | Volumen 3D del banco con colores lisos (`vol` + cajas con fondo `d`) | MEDIUM | ZIP 2 (ves la forma) · **hecho en la v2.105** |
| 3 | Estilo `banco` en `src/volumenes_tex.js`: texturas por cara y tres tonos | MEDIUM | — · **hecho en la v2.106** (asiento y listones), **la v2.107** (montantes) **y la v2.108** (patas): CERRADO |
| 4 | Integración en el pintor HD-2D, sombra de suelo rectangular y pruebas en `test.js` | LOW | **hecho en la v2.109** |
| 5 | Prueba con Three.js real, capturas antes y después, presupuesto y ajuste fino | LOW | **hecho en la v2.110** (ZIP único de 4 y 5) |

Cada paso se hace solo con tu «hazlo» y se dice antes si es LOW o MEDIUM.

## 7. Decisiones (todas de Claude, cámbialas cuando quieras)

1. Fondo del asiento 0,5 u y largo 1,625 u (proporción de banco de parque real, fiel al 2D).
2. Listones y patas con grosor mínimo de 0,125 u para que no parpadeen al girar la cámara en el móvil.
3. Tablones del asiento dibujados en la textura (líneas de 1 texel), no en la geometría.
4. Respaldo recto y sin reposabrazos: fiel al 2D. Variantes (inclinado, con reposabrazos, de piedra) quedan para después.
5. Después del banco, orden sugerido: macetas → carteles → barriles → espantapájaros → vallas → fuente (revisar su sombra de suelo en HD-2D).

## 8. Paso 2 · volumen con colores lisos (v2.105)

- `src/volumenes.js`: nuevo **volumen solo de cajas** (`V.esDeCajas(vol)`: sin `torno`, sin `muros` y con `vol.cajas`). Las cajas con fondo `d` ya existían desde la v2.102 (solo dentro del torno); ahora también valen solas. `V.validar` comprueba que cada caja cabe en la huella y que ninguna medida baja de 0,125 u (`V.MIN_PIEZA`). Los volúmenes existentes (casas, fuente, farola) no cambian.
- `src/albanota_objetos.js`: `VOL_BANCO` con las 9 cajas de la tabla de la sección 1 (cada una centrada en su (x, z); las medidas de la ficha van en comentarios). Piezas: `pata` ×4, `asiento`, `montante` ×2, `listonAlto` y `listonBajo`. Patas sin tapa (las tapa el asiento); asiento, montantes y listones con tapa.
- `src/volumenes_tex.js`: estilo `banco` con un color liso por cara, material y tono. Materiales: `madera` (luz = wood1, base = wood3, sombra = woodD) y `maderaOsc` (luz = wood3, base = woodD, sombra = #4a2c18). El paso 3 los cambia por texturas de píxel.
- `src/hd2d_pintor.js`: `vol.sombra === false` = sin sombra de suelo. Hasta el paso 4 el banco no lleva sombra (la de edificio, un anillo alrededor de la huella, no vale para un banco).
- Los 3 bancos de Albanota (8,16 · 20,16 · 27,16) y los que se coloquen con «✏️ Editar mapa» salen ya en 3D: **22 piezas con volumen** (antes 19). Las cuentas de `test.js` y de `tools/prueba_hd2d_juego.py` ya están actualizadas (esto estaba previsto para el paso 4).
- **Triángulos: 82**, no los ~110 de la sección 1: la ficha contaba bajos y tapas que no se ven (36 caras laterales × 2 + 5 tapas × 2). Mejor, el objetivo era ≤ 120.
- `test.js` = 63 grupos (grupo nuevo v2.105: medidas de cada pieza contra la tabla, huella 2×1, alto 1,0 u, mínimo 0,125 u, caras hacia fuera, luz fija, colores lisos, 3 bancos como «volumen» en Albanota y vuelta a lámina con el interruptor apagado).
- Sin Three.js real en este entorno: la forma se revisó con un rasterizador con z-buffer sobre la geometría real (`node tools/volcar_banco.js > /tmp/banco_geo.json && python3 tools/formas_banco.py /tmp/banco_geo.json docs/banco_paso2_formas.png`). La prueba con Three.js real es del paso 5.
- Lo que se ve y se puede ajustar: los montantes asoman 0,0625 u por delante de los listones (como el 2D) y las patas traseras quedan en línea con ellos; de espaldas se lee el respaldo como en un banco de parque real.

## 9. Paso 3 · 1.ª mitad: asiento y listones con textura de píxel (v2.106)

- `bancoTex` en `src/volumenes_tex.js` (también en `G.volTex`): una textura por pieza, parte, cara y tono; 1 texel = 1 px del 2D; la fila 0 del lienzo es el borde de arriba de la cara (en una tapa, el borde sur). Sin azar.
- **Asiento, arriba (26×8):** madera con tono luz (wood1), 3 tablones de 2 texels con una línea de 1 texel (wood3) en las filas 2 y 5, borde sur en `#d9a574` y vetas cortas de wood2 (2 en el tablón del sur, 2 en el del medio y 3 en el del norte; posiciones fijas).
- **Asiento, frente y costados (alto de 3 texels):** el color de su tono (frente wood3; oeste wood1; este woodD) con el filo de arriba 1 texel más claro y el de abajo 1 texel más oscuro.
- **Listones:** frente (24×2) con la fila de arriba clara (wood1) y una veta oscura en la de abajo (en distinto sitio en el alto y en el bajo); detrás igual sin veta; arriba madera clara con borde sur claro; cabezas (2×2) con el color oscuro de su tono.
- **Falta (2.ª mitad):** montantes y patas (`woodD` con filo claro de 1 texel a la izquierda y brillo arriba). Siguen con color liso.
- `test.js` = 64 grupos. El grupo nuevo comprueba píxel a píxel (con un lienzo que anota los `fillRect`) filas de tablones, borde sur, vetas, filos de frente y costados, listones y cabezas, que no hay azar y que el atlas sigue cabiendo en 256 px.
- Imagen: `docs/banco_paso3a_texturas.png` (4 vistas con las texturas reales). `docs/banco_paso2_formas.png` se regeneró: el rasterizador salía en espejo y la vista «0°» salía por detrás.
- Dudas de diseño que se pueden cambiar con un número: las vetas del asiento (wood2) se ven poco desde lejos; el listón alto y el bajo llevan la veta en sitios distintos para que no parezcan copiados.

## 10. Paso 3 · 2.ª mitad, parte 1: montantes (v2.107)

- `bancoTex`, rama `montante`: color de su tono en madera oscura (`maderaOsc`: luz wood3, base woodD, sombra #4a2c18), **filo claro de 1 texel a la izquierda** de quien mira la cara y **brillo arriba** (fila 0); la tapa (2×2) es todo brillo. Las caras miden 2×9 texels.
- Detalle técnico: en las caras sur y norte el eje u de la textura va de este a oeste, así que «izquierda» es el último texel; en este y oeste es el primero. Lo comprueba `test.js`.
- **Falta:** las 4 patas (mismo recetario que los montantes). Siguen con color liso.
- `test.js` = 65 grupos. Imagen: `docs/banco_paso3b_montantes.png`.

## 11. Paso 3 · 2.ª mitad, parte 2: patas (v2.108) · PASO 3 CERRADO

- `bancoTex`, rama `montante`/`pata`: las 4 patas usan la receta de los montantes (madera oscura `maderaOsc`, **filo claro de 1 texel a la izquierda** de quien mira y **brillo arriba**). Caras de 3×4 texels (sur y norte) y 2×4 (este y oeste); sin tapa (la cubre el asiento).
- Ya no queda ninguna pieza del banco con color liso. Geometría y sombra sin cambios (82 triángulos, `vol.sombra === false`).
- `test.js` = 66 grupos. Imagen: `docs/banco_paso3c_patas.png`.
- **Siguiente:** paso 4 (sombra rectangular del banco), solo con «hazlo».

## 12. Paso 4 · sombra de suelo rectangular (v2.109)

- `sombraSuelo` (en `src/volumenes.js`) tiene un modo rectangular: `vol.sombra = { x, z, rw, rd, dx, dz, q, k }` (centro desde la esquina de la huella, ancho y fondo, empuje al este y al sur, rejilla y intensidad). Banco: 1,75 × 0,55 u centrado en (1,0, 0,625), empujado 0,10 al este y 0,12 al sur, cuadritos de 0,125 u, al 75 %. Solo entran los cuadritos con el centro dentro y donde el mapa lo permite (nunca sobre árboles, agua ni puente). Fuente, farola y edificios no cambian.
- `test.js` = 67 grupos.

## 13. Paso 5 · prueba con Three.js real (v2.110)

- `python3 tools/prueba_banco_hd2d.py --three /ruta/three.min.js [carpeta] [--docs]` (`npm install three@0.128.0`). TODO BIEN: 3 bancos en volumen, 82 triángulos, atlas 256×12, +3 sombras, +1 llamada de dibujo (máx. +12), madera visible en 4 giros, sombra visible en 3 de 4 giros (nunca aclara), 29,5 ms con volumen frente a 27,2 con láminas en software (no es un móvil), sin errores.
- Imagen: `docs/banco_paso5_antes_despues_390x844.png` (arriba láminas, abajo volumen, 4 giros).
- **Pendiente del usuario:** mirarlo en el móvil y decir si algo no gusta (largo y oscuridad de la sombra, tonos de la madera).
