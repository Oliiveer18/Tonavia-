# FICHAS DE OBJETOS 3D · FAROLA (v2.103 · pasos 1 a 6 hechos · FAROLA CERRADA)

Estado: **paso 2 hecho (ZIP 1): la farola ya es un volumen 3D con colores lisos** (`vol` con torno de 12 lados, cajas y pirámide truncada; estilo `farola` con un color liso por cara y tono). Sin texturas de píxel todavía (paso 3), sin sombra de suelo propia ni luz (pasos 4 y 5). El 2D se ve igual que en la v2.101; la huella no cambia. Lo marcado «propuesta» lo decide Claude y se puede cambiar sin rehacer nada.
Objetivo: que las **12 farolas** de Albanota dejen de ser láminas planas en el HD-2D y pasen a ser **volúmenes con textura propia y una luz pequeña**, con el mismo método de las casas (`G.volumenes` + `G.volTex`). Es la primera pieza de la serie «objetos pequeños»: bancos, macetas, carteles y barriles saldrán como variaciones.

## 0. Reglas (las mismas que las casas, adaptadas a lo pequeño)

1. **Unidad:** 1 u = 1 casilla = 16 px. Alturas copiadas del dibujo 2D (`farola()` en `src/albanota_objetos.js`, sprite 10×38).
2. **La huella 3D = la colisión.** La farola ocupa 1×1 casilla (`huella: [[0, 0, 1, 1]]`) y el motor no cambia. El poste va en el **centro de la casilla** (los pies del 2D están a media casilla, `pieY: 8`).
3. **Texturas de píxel por código**, filtro nítido, 1 texel = 1 px del 2D, paleta del juego y contorno `#2a1b30` solo en aristas. Sin imágenes.
4. **Luz fija arriba-izquierda** con los tres tonos de siempre: oeste = luz, sur = base (el 2D de hoy), este y norte = sombra.
5. **Excepción: el cristal del farol no se oscurece.** Lleva siempre el tono «base» en sus cuatro caras, para que se lea como luz encendida desde cualquier giro de cámara.
6. **El 2D no cambia** (huella del juego igual). Una pieza sin `vol` sigue como lámina; la farola gana su campo `vol`, así que las que coloques con «✏️ Editar mapa» salen solas en 3D.

## 1. Volumen (medidas sacadas del dibujo 2D, de abajo arriba)

| Pieza | Material | De → a (u) | Forma | Medida en 2D |
|---|---|---|---|---|
| Base | hierro | 0 → 0,25 | torno, radio 0,16 → 0,11 (con moldura de 0,04 en la cara) | 4 px de alto |
| Poste | hierro | 0,25 → 1,63 | torno, radio 0,07 → 0,06 | 2 px de ancho, 22 px de alto |
| Collarín | hierro claro | 1,63 → 1,81 | torno, radio 0,09 | 4 px de alto |
| Plato | hierro | 1,81 → 1,88 | caja 0,50 × 0,50 | 1 px |
| Cuerpo del farol | oro (marco) + vidrio | 1,88 → 2,19 | caja 0,375 × 0,375, 4 caras con cristal y marco dorado | 5 px de alto, 6 px de ancho con marco |
| Tejadillo | hierro | 2,19 → 2,31 | pirámide de 4 caras, de 0,50 a 0,25 | 2 px |
| Remate | hierro claro | 2,31 → 2,375 | torno, radio 0,19 → 0,06 | 1 px |

**Alto total: 2,375 u** (= 38 px, igual que el sprite). Centro de la pieza: (x + 0,5; z + 0,5).
Propuesta: el poste sale **algo más grueso que en el 2D** (radio 0,07 u ≈ 2,2 px, en el 2D son 2 px) y la base también, porque una línea de 2 px en 3D parpadea al girar y al reducir la imagen en el móvil.

## 2. Texturas por cara

| Cara | Qué lleva | Tono |
|---|---|---|
| Base y poste | hierro oscuro `ink2` con filo claro a la izquierda y canal oscuro a la derecha; moldura de la base con un brillo de 1 px | luz / base / sombra |
| Collarín y plato | hierro algo más claro con un anillo de 1 px | luz / base / sombra |
| Cristal (4 caras) | `#fff3b0` con un núcleo más claro y un marco de oro de 1 px (arriba, abajo y a los lados), como el 2D | **siempre base** (no se oscurece) |
| Tejadillo | placas de hierro con arista clara arriba | luz / base / sombra |
| Remate | gris `greyD` con punta de oro | luz / base / sombra |

Los materiales son cadenas de 6 colores de claro a oscuro, como las de `src/volumenes_tex.js`. Se añade el estilo `farola` junto a `casa`, `centro`, `tienda`, `ermita` y `fuente`, y entra en el atlas de 256 px de ancho que ya usa el pintor.

## 3. Sombra de suelo y luz

- **Sombra de suelo en HD-2D:** óvalo pequeño y suave bajo la base (como el de las criaturas), con la intensidad que ya tiene `SUAVE.farola` en el 2D (75 %). Sombras proyectadas de verdad en HD-2D siguen en pausa.
- **Luz pequeña (paso 5), sin luces reales.** Con 12 farolas y materiales sin iluminación en edificios y objetos, una luz real pesaría y solo afectaría al suelo. Por eso:
  - **Charco de luz:** un cuadrado plano por farola sobre el suelo, radio ≈ 1,5 u, degradado radial cálido (`#ffd98a`) en **4 escalones** para que case con el pixel art, intensidad máxima ≈ 0,22 en el centro, mezcla aditiva suave, sin escribir en profundidad y 0,02 u por encima del suelo.
  - **Halo:** sprite de ≈ 0,9 u alrededor del cristal, 3 escalones, intensidad ≈ 0,5.
  - **Parpadeo:** ±4 % lento, que `?movimiento=0` apaga.
  - **Interruptor:** `?farolas=0` quita charco y halo (la farola 3D se queda).
  - Todas las farolas comparten textura y material; los 12 charcos van fundidos en **una sola malla**.
  - Limite honesto: es un efecto de suelo; no ilumina a Oli, Lali ni a los bancos al pasar al lado.

## 4. Presupuesto (para el móvil)

- Geometría por farola: unos 150 triángulos (torno de 12 lados en 4 piezas más dos cajas); el volumen se genera una vez por tipo y se comparte (12 mallas, una llamada de dibujo cada una).
- Charcos: 1 llamada de dibujo en total; halos: 1.
- Sin luces nuevas ni shaders nuevos, así que no hay recompilaciones.
- Objetivo: el HD-2D no pierde más de un 2 % de fotogramas con las 12 farolas en pantalla (se mide en el paso 6 con `tools/presupuesto.py`).

## 5. Pasos y qué recibes

| Paso | Qué | Esfuerzo | ZIP |
|---|---|---|---|
| 1 | Esta ficha | LOW | — (hecho) |
| 2 | Volumen 3D de la farola con colores lisos (`vol` + torno) | MEDIUM | **ZIP 1** (ves la forma) · **hecho en la v2.102** |
| 3 | Estilo `farola` en `src/volumenes_tex.js`: texturas por cara y tres tonos | MEDIUM | — (hecho en la v2.102) |
| 4 | Integración en el pintor HD-2D, sombra de suelo y pruebas en `test.js` | LOW | **ZIP 2** (con texturas y funcionando) · **hecho en la v2.102** |
| 5 | Charco de luz, halo, parpadeo e interruptor `?farolas=0` | LOW | — (hecho en la v2.103) |
| 6 | Capturas antes y después con Three.js real, presupuesto y ajuste fino | LOW | **ZIP 3** (todo cerrado) · **hecho en la v2.103** |

## 6. Decisiones tuyas (cámbialas cuando quieras)

1. Poste algo más grueso que en el 2D (radio 0,07 u): propuesta de Claude, para que no parpadee.
2. Cristal que no se oscurece según la cara: propuesta, para que se lea siempre encendido.
3. Charco de luz en 4 escalones, cálido y de intensidad baja (0,22): propuesta; se puede subir o bajar con un número.
4. La luz no ilumina a los personajes: límite del método, no del gusto.
5. Después de la farola, orden sugerido: bancos → macetas → carteles → barriles → espantapájaros → vallas → fuente (revisar su sombra de suelo en HD-2D).

## 7. Paso 2 · qué se hizo (v2.102)

- `src/volumenes.js`: el torno admite `lados` (12 en la farola), `centrado` (una cara justo al sur, al este, al norte y al oeste) y `luz` (cada cara lleva su tono según hacia dónde mira). Nuevos campos `vol.cajas` (con `tapa` y `fijo`) y `vol.troncos` (pirámide truncada) y su validación.
- `src/albanota_objetos.js`: `VOL_FAROLA` (7 piezas, 2,375 u de alto, 146 triángulos); la farola gana `vol`, así que las 12 de Albanota y las que se coloquen con «✏️ Editar mapa» salen en 3D.
- `src/volumenes_tex.js`: estilo `farola` con un color liso por cara (materiales `hierro`, `hierroC` y `vidrio`); el paso 3 los cambia por texturas de píxel.
- `src/particulas3d.js`: el chorro de la fuente ahora exige estilo `fuente` (la farola también es un torno y, sin esto, echaría agua).
- El cristal del farol (`cuerpo`) lleva `fijo`: siempre tono «base». Oeste = luz, sur = base, este y norte = sombra en el resto.
- `test.js` = 61 grupos (nuevo grupo v2.102; se actualizaron las cuentas de piezas con volumen: 9 tipos, 19 piezas en Albanota).
- Sin Three.js real en este entorno: la forma se revisó con un rasterizador con z-buffer sobre la geometría real (`docs/farola_paso2_formas.png`). La prueba con Three.js real es del paso 6.
- Lo que se ve y se puede ajustar: el remate (radio 0,19 u) es más ancho que la cara de arriba del tejadillo (0,25 u), así que hace de capuchón; es lo que dice la ficha y los 6 px del 2D.

## 8. Paso 3 · texturas de píxel (v2.102)

- `farolaTex` en `src/volumenes_tex.js`: una textura por pieza, parte y tono (1 texel = 1 px del 2D). Base: brillo arriba y sombra abajo, con corona de anillo claro. Poste: sombra en los extremos y un brillo cada 12 px. Collarín y plato: filo claro arriba y sombra abajo. Cristal: `#fff3b0` con núcleo claro y marco de oro de 1 px (siempre tono base). Tejadillo: placas con arista clara arriba. Remate: gris con punta de oro.
- Desviación de la ficha: el «filo claro a la izquierda y canal oscuro a la derecha» del poste lo hacen los tres tonos por cara (12 caras de menos de 2 px de ancho no admiten una columna propia); en la textura van los anillos y brillos horizontales.
- Vista de comprobación: `docs/farola_paso3_texturas.png` (rasterizador propio con z-buffer; los puntitos negros en los bordes son de ese rasterizador, no del juego). Three.js real, en el paso 6.

## 9. Paso 4 · pintor y sombra de suelo (v2.102)

- El pintor ya dibujaba cualquier pieza con `vol` y estilo soportado, así que las 12 farolas salen en 3D sin tocar su flujo (una malla por farola, geometría, atlas y material compartidos).
- Sombra de suelo: óvalo de 0,30 × 0,17 u, empujado 0,10 u al este y 0,12 u al sur, en cuadritos de 0,125 u (`vol.sombra` en `VOL_FAROLA`). Intensidad al 75 % de la sombra de siempre, con un material propio compartido (`E.mSombraK`). La fuente conserva su disco.
- `test.js` = 61 grupos (el grupo v2.102 crece con las comprobaciones de la sombra). Pendiente: Three.js real (paso 6), charco de luz y halo (paso 5).

## 10. Paso 5 · luz pequeña (v2.103)

- `src/luz_farolas.js` (`G.luzFarolas`, puro salvo los dos lienzos de píxeles): `AJUSTES` con los números de la ficha (charco: radio 1,5 u, intensidad 0,22, 4 escalones, `#ffd98a`, 0,02 u sobre el suelo, lienzo de 24×24; halo: 0,9 u, intensidad 0,5, 3 escalones, `#fff3b0`, a 2,035 u de alto, lienzo de 16×16; parpadeo ±4 %), `nivel` (escalones de 1/n), `parpadeo(t, quieto)`, `charco()`, `halo()` y `puntos(objetos)` (una luz por cada farola que sale como volumen).
- `src/hd2d_pintor.js`: UNA malla con los 12 charcos (tumbados, `MeshBasicMaterial`, mezcla aditiva, `depthWrite: false`, `renderOrder` 2) y UNA con los 12 halos (láminas que miran a la cámara: se recolocan sus vértices cuando cambia el giro, `renderOrder` 3). Cada cuadro se actualiza el parpadeo (`luzFarolas(yaw)`). Sin luces reales ni shaders nuevos.
- Interruptores: `?farolas=0` (no se crean), `G.luzFarolas.AJUSTES.ACTIVO = false` (en vivo: esconde las dos mallas) y `?movimiento=0` (sin parpadeo). `G.hd2d.estado().farolas` dice cuántas luces hay y sus intensidades.
- Límite honesto, como en la ficha: es un efecto de suelo; no ilumina a Oli, Lali ni a los bancos.

## 11. Paso 6 · pruebas con Three.js real y presupuesto (v2.103)

- `tools/prueba_farolas_hd2d.py --three ruta/three.min.js [carpeta] [--docs]` (Three.js r128 real, Chromium móvil 390×844 con dibujo por software): TODO BIEN. 12 luces; charco 0,218 y halo 0,495 (intensidades de la ficha con el parpadeo); parpadeo entre 0,963 y 1,039; `?farolas=0` quita la luz y deja las 19 piezas en volumen; la luz cuesta exactamente DOS llamadas de dibujo (23 frente a 21); más luz en pantalla alrededor de una farola en los 4 giros (por ejemplo 172,9 frente a 164,2); `?movimiento=0` deja el charco fijo en 0,220; sin errores de consola.
- Imagen: `docs/farolas_paso6_antes_despues_390x844.png` (izquierda sin luz, derecha con luz).
- Rendimiento: con el dibujo por SOFTWARE de Chromium (no un móvil real) la luz sube de unos 21,8 a unos 24,6 ms por cuadro (mediana de 8 vueltas alternando). Es una medida pesimista: el software paga cada píxel de cada capa de mezcla aditiva, y los 12 charcos de 3×3 u son mucho suelo. **Pendiente del usuario:** mirar en el móvil si va fluido. Si no, bajar `RADIO` (por ejemplo a 1,2) o apagar solo el charco; son números de `src/luz_farolas.js`.
- `test.js` = 62 grupos (grupo v2.103 nuevo). `tools/prueba_hd2d_juego.py` actualizada: con las farolas en volumen hay 19 volúmenes en Albanota, no 7 (la comprobación estaba desfasada desde la v2.102); TODO BIEN con Three de mentira.
- **Siguiente (solo con «hazlo»):** bancos, según el orden sugerido de la sección 6.

## 12. Luz solo de noche (v2.103, a petición del usuario)

- De día la luz de las farolas no se nota: `G.luzFarolas.AJUSTES.NOCHE` (0 = día, 1 = noche, intermedios = atardecer) multiplica la intensidad del charco y del halo, y con 0 las dos mallas se esconden (coste cero). **Por defecto es 0**, porque el juego aún no tiene ciclo de día y noche.
- `?farolas=1` pone NOCHE = 1 para verlas encendidas; `?farolas=0` las quita del todo. Cuando exista el ciclo de día y noche, solo hay que mover `NOCHE` (sube al atardecer, 1 de noche, baja al amanecer); no hay que tocar el pintor.
- La prueba con Three.js real ahora comprueba: de día 12 luces escondidas y a 0, al atardecer (0,5) la mitad de la intensidad, y de noche (`?farolas=1`) todo lo de antes.
