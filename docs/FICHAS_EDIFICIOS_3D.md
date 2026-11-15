# FICHAS DE EDIFICIOS 3D (v2.65 paso A · v2.66 decisiones cerradas · SOLO DOCUMENTOS)

Estado: **CERRADAS por delegación del usuario (5 nov: «decide todo de la forma más profesional»).** Las puede cambiar cuando quiera. No se ha tocado código ni `dist/`; el 2D y el HD-2D se ven igual que en la v2.64.
Objetivo: que en HD-2D las casas sean **volúmenes reales** (paredes, tejado, puerta, chimenea) cuya forma coincide con lo que bloquea en el motor, en lugar de láminas. Lo pequeño (farolas, bancos…) sigue en láminas.
Los pasos B-E (código) no empiezan hasta tu «hazlo». Medidas y posiciones salen de `maps/albanota.json` y `src/albanota_objetos.js` (v2.64).

## 0. Reglas comunes a todos los edificios

1. **Unidad:** 1 u = 1 casilla = 16 px (la del pintor HD-2D). Las alturas se copian del dibujo 2D (1 u de alto ≈ 16 px de pared).
2. **La huella 3D = la colisión.** El volumen cubre EXACTAMENTE las casillas de `huella` de la pieza, ni una más ni una menos. Todos los edificios son su rectángulo con **un nicho de entrada de 1×1** en el centro de la fila sur (esa es la casilla de la puerta, que queda libre). La puerta está en el fondo del nicho (cara norte del nicho). Un test comparará el volumen con las casillas sólidas del motor.
3. **Cuatro caras + tejado.** La cámara gira 45°, así que se ve todo el edificio. La fachada sur es el dibujo 2D de hoy; los lados y la trasera se dibujan nuevos por código con los mismos materiales, **sin puerta**: lados con 1-2 ventanas y trasera casi lisa con un detalle.
4. **Texturas de píxel por código**, filtro nítido (sin suavizar), 1 texel = 1 px del 2D, paleta de la biblia visual y contorno `#2a1b30` solo en aristas y bordes del tejado.
5. **Luz fija arriba-izquierda** (como el 2D), con solo los tonos que ya usa el estilo limpio (luz, base, sombra): cara oeste = luz, sur = base (el dibujo de hoy), este = sombra, norte = sombra. Sin más colores.
6. **Sombra en el suelo:** huella suave y baja (como la de las criaturas), nunca junto a árboles. Sombras proyectadas de verdad = Fase 4 (ID-2b-3).
7. **Losa de entrada plana:** el escalón del dibujo 2D pasa a ser una losa de piedra pintada a nivel del suelo, dentro del nicho (así nadie «sube» nada y no cambia la colisión).
8. **Oclusión (paso E):** si Oli, Lali o una criatura queda tapada por un edificio, el tejado y el tercio alto de la pared norte se atenúan con trama (transición de medio segundo). **Hecho en la v2.88 (E1):** trama de Bayer 4×4, tejado entero + tercio alto de los muros, visibilidad 0,3 al taparse, 0,5 s de transición; vale para pies y cabeza de jugadores y criaturas, con la cámara en cualquier giro.
9. **Datos en el catálogo:** cada pieza de `G.capas` ganará un campo `vol` (alto de muros, tipo de tejado y sentido de la cumbrera, vuelo, nicho, chimenea, textura por cara). Lo que coloques con «✏️ Editar mapa» sale solo en 3D. Una pieza sin `vol` sigue como lámina.
10. **Sin humo ni animación de edificios** hasta la Fase 4 (partículas). El 2D no cambia (huella del juego `e12c9485…`).

## 1. Resumen

| Edificio | Esquina (x,y) | Rect | Casillas sólidas | Puerta | Muros | Tejado | Cumbrera | Alto total |
|---|---|---|---|---|---|---|---|---|
| Casa de Lali | 2,10 | 5×5 | 24 | (4,14) | 3,0 u | dos aguas | este-oeste | ≈ 5,0 u |
| Casa de Oli | 11,10 | 5×5 | 24 | (13,14) | 3,0 u | dos aguas | este-oeste | ≈ 5,0 u |
| Laboratorio | 12,22 | 5×5 | 24 | (14,26) | 3,0 u | plano con peto 0,56 u (v2.82) | — | ≈ 5,4 u (cúpula, cristales y escáner, v2.84) |
| Centro PC | 23,5 | 7×5 | 34 | (26,9) | 4,0 u | plano con peto | — | ≈ 4,4 u |
| Tienda | 32,5 | 5×4 | 19 | (34,8) | 2,8 u | dos aguas bajo + toldo | este-oeste | ≈ 3,8 u |
| Ermita del Primer Eco | 41,4 | 5×5 | 24 | (43,8) | 3,4 u | dos aguas con frontón | norte-sur | ≈ 6,0 u |

**Corregido en la v2.67:** la tabla decía 22 / 32 / 17 / 22 casillas sólidas; el motor bloquea el rectángulo menos el nicho: 24 / 34 / 19 / 24 (lo comprueba el grupo 49 de `test.js`). Vuelo del alero de Tienda y Ermita: 0,4 u como la casa (la ficha no lo decía).
Las alturas son propuesta de Claude (sacadas del dibujo 2D); se pueden cambiar sin rehacer nada.

## 2. Fichas

### Casa de Lali y Casa de Oli (pieza `casa`, hoy idénticas)
- **Volumen:** cuerpo 5×5 con nicho de entrada en (x+2, y+4). Muros de 3,0 u.
- **Tejado:** a dos aguas, cumbrera este-oeste a +2,0 u sobre el alero, vuelo de 0,4 u, escamas rojas (luz a la izquierda, sombra a la derecha). Hastiales este y oeste de yeso con el entramado.
- **Chimenea** de piedra sobre el faldón norte (+0,8 u sobre la cumbrera). **Ventana redonda del desván** en el hastial oeste y en el este, no solo en el frente. **Veleta** con la campana de dos mitades.
- **Fachada sur (dibujo 2D de hoy):** yeso crema con entramado de madera, zócalo de piedra, dos ventanas con postigos azul verdoso y jardinera, puerta de madera con arco en el fondo del nicho, cartel de la campana y farol.
- **Lados:** una ventana con postigos por lado. **Trasera:** yeso liso, entramado, una ventana pequeña.
- **DECIDIDO (v2.66): sí.** Mismo volumen, tejado y paredes; solo cambian **los postigos y las flores de la jardinera: azules en la de Lali y rosas en la de Oli** (las dos mitades de la campana). Piezas `casa_lali` y `casa_oli`, y el cambio entra **también en el 2D** para que ambos modos coincidan (cambio de huella del juego a propósito, en el paso C). Por qué: cada jugador reconoce «su» casa de lejos sin leer nada, es un cambio de paleta barato y refuerza la campana como emblema.

### Laboratorio (hoy es la pieza `casa`)
- **DECIDIDO (v2.66): pieza propia `laboratorio`**, con la misma huella y puerta (el mapa no se mueve; en el paso C el objeto de (12,22) pasa de `casa` a `laboratorio`). Por qué: un lugar clave debe reconocerse por silueta y color antes que por el cartel. También se dibuja en el 2D (mismo criterio: los dos modos iguales).
- **Volumen:** igual que la casa (5×5, muros 3,0 u, dos aguas este-oeste).
- **Distinto:** tejado de pizarra azul verdosa (en vez de teja roja); chimenea más alta (+1,4 u) con una boca ancha; ventana redonda del desván más grande, a modo de lente; el cartel de la fachada lleva un matraz en vez de la campana.

- **v2.76 (solo documentos, 5 nov): el Laboratorio se rediseña y tiene función.** El usuario vio que «no parece un laboratorio de verdad» (el dibujo de la v2.72 es una casa con tejado azul, chimenea ancha, ventana-lente y matraz en el cartel: se lee como casa, no como laboratorio). **Decidido (por delegación: «hazlo profesional»; Claude decide, el usuario puede cambiar):** (1) la **silueta** debe decir «laboratorio» sin leer el cartel; líneas de diseño a probar, para elegir con vista previa: cúpula o cristalera grande en el tejado, tuberías/chimeneas con vapor de colores, antena o pararrayos, ventanales con luz de matraces y aparatos, fachada más moderna y limpia (blanco/gris azulado con acentos de color) que la de las casas; (2) misma huella, misma puerta (14,26) y mismo mapa (no se mueve nada); (3) sigue siendo pieza propia `laboratorio` y se dibuja igual en 2D y 3D (`vol` y atlas de `src/volumenes_tex.js`); (4) el rediseño **sustituye** lo descrito arriba como «Distinto» cuando se haga. **Función del laboratorio (las tres, aprobadas por el usuario):** (a) **primera criatura:** allí Lali y Oli reciben su primer compañero; (b) **evolución y estudio:** allí se evolucionan y se «analizan» las criaturas capturadas (las condiciones siguen en `HISTORIA_Y_MUNDO.md` 4 ter); (c) **misiones:** un NPC científico da encargos (traer ciertas criaturas). Todo ello es **decisión de diseño sin código**: el interior, el NPC y las pantallas no existen todavía y se harán como parte del paso de interiores (ID-5, junto al Centro PC); hasta entonces el laboratorio es solo exterior. **Rediseño visual: v2.77 hecho, pero el usuario lo vio demasiado «laboratorio de ciencia»; nuevo diseño decidido en la v2.78 (ver abajo, «NUEVO DISEÑO»).**

- **v2.77 (HECHO, MEDIUM; SUSTITUIDO por el diseño de la v2.78, ver abajo «NUEVO DISEÑO»): rediseño visual del laboratorio.** Elegido por delegación (sin votación de siluetas, el usuario dijo «hazlo profesional»; puede cambiarse): **2D:** `laboratorio()` en `src/albanota_objetos.js` (94×114, mismo `ox/oy/huella/puerta`): tejado plano de acero con peto, **cúpula de cristal con nervios**, **antena con pararrayos y baliza roja**, **dos tuberías con vapor de colores**, unidad de ventilación; fachada de paneles claros con franja turquesa, **dos ventanales con matraces de colores**, puerta de cristal de dos hojas, cartel oscuro con matraz y «LAB», piloto verde y escalones de hormigón (paleta `LAB`). **3D:** el volumen sigue siendo el de la casa (dos aguas + chimenea), pero la variante `lab` de `src/volumenes_tex.js` cambia los materiales: paredes de panel, marcos de acero, zócalo de hormigón, franja turquesa y tejado de acero; la fachada sur sigue siendo el recorte exacto del 2D. **Límite:** la cúpula, la antena, las tuberías y el tejado plano **solo están en el 2D**; en 3D la silueta sigue siendo de tejado a dos aguas. Para tenerlos en 3D hace falta un estilo 3D propio con tejado plano (cubierta, peto, cúpula), que se haría junto al paso D. Lo descrito arriba como «Distinto» (pizarra azul verdosa, ventana-lente, matraz en el cartel de madera) queda **sustituido** por esto. Pruebas: `node test.js` = 55 grupos OK; `python3 tools/prueba_casas.py` TODO BIEN (adaptada al nuevo dibujo); capturas `docs/laboratorio_v277_con_casa.png` y `docs/laboratorio_v277_390x844.png`. Huella del juego `e12c9485…` igual (la partida simulada no dibuja el laboratorio); el 2D cambia a propósito solo en esta pieza.


### Laboratorio · NUEVO DISEÑO «CENTRO DE ESTUDIO DE CRIATURAS» (v2.78, solo documentos; decidido por delegación, el usuario lo confirmó como «la idea más profesional»)
**Por qué.** El usuario vio que el laboratorio de la v2.77 (matraces, tuberías con vapor, ventanales de cristal frío) «no tiene que ver con el juego»: es un laboratorio de ciencia en general, y aquí el laboratorio es donde nacen, evolucionan y se estudian las criaturas. **Idea central:** el edificio habla de criaturas y de los 7 elementos; de lejos debe leerse «aquí se estudian criaturas» y solo podría ser de este juego. **Esto sustituye al diseño de la v2.77** (cúpula con nervios fría, antena con pararrayos, tuberías con vapor, matraces, puerta de cristal) y al de la v2.72.

**Silueta (lo que se ve de lejos):**
1. **Cúpula de cristal con luz cálida dentro** (la incubadora o «nido» central), con un brillo que late despacio (como las otras animaciones del juego; sin latido con `G.capas.REDUCIDO`).
2. **Siete cristales elementales** en el tejado o en un aro alrededor de la cúpula, uno por elemento con su color: Hoja, Fuego, Agua, Eléctrico, Aire, Roca y Sombra (colores de `docs/biblia_paletas.png` y `REGLAS_DE_LUZ.md`; el de Agua es base `#4580d4`). El edificio enseña así el sistema de elementos.
3. **Antena o plato pequeño** de tamaño medio: es el escáner que «lee» criaturas. **Sin** pararrayos grande.
4. **Desaparecen** las tuberías con vapor de colores, los matraces y los frascos (química clásica, no encaja).

**Fachada:**
5. **Ventanal grande con una cápsula de cristal y un HUEVO que brilla dentro** (siempre igual; decisión del usuario-delegada para no depender del estado de la partida). Más adelante, con el interior, podría mostrar la criatura de cada jugador.
6. **Dos cápsulas o incubadoras de cristal** a los lados de la puerta, con un huevo o un brillo dentro.
7. **Cartel con símbolo propio:** una huella de criatura o un huevo con chispa (en vez del matraz), con «LAB» (o el nombre del lugar en Tonavia).
8. **Puerta con arco y brillo cálido**, más cercana al estilo acogedor de Albanota que el cristal frío de la v2.77.

**Colores:** paredes en crema o blanco cálido con acento turquesa (encaja con las casas); los colores vivos SOLO en los cristales elementales, la cúpula y los huevos, para que la vista vaya a lo importante.

**Función visible (señales, como el resto de funciones del laboratorio):** la cúpula se enciende más fuerte cuando hay algo que hacer (primera criatura sin recoger, criatura lista para evolucionar, misión nueva). El minimapa ya marca el laboratorio; podría pulsar con un punto de color cuando haya algo pendiente. **Esas señales NO existen todavía:** dependen del interior y de las funciones (ID-5); en el primer paso la cúpula solo late de forma suave y constante.

**Medidas que no cambian:** pieza `laboratorio`, 94×114, `ox -6, oy -26, pieY 70`, huella `HUELLA_CASA`, puerta (14,26), casilla (12,22), `lugar` (🧪 → se puede cambiar el icono a 🥚, a decidir); la pared sur sigue en y 58-106 (`vol.fachada`).

**En 3D:** lo ideal es que cúpula y cristales salgan también en 3D; para eso hace falta un **estilo 3D propio con tejado plano** (cubierta, peto, cúpula y cristales), que se haría junto al paso D. Mientras tanto el 3D se queda con el tejado a dos aguas y los materiales de la v2.77 (panel, acero, hormigón, franja turquesa), que habrá que **calentar** (crema en lugar de blanco frío) para que cuadren con el nuevo 2D.

**Plan por pasos (MEDIUM cada uno; solo con «hazlo»):**
- **L1 · HECHO (v2.79, MEDIUM) · dibujo 2D nuevo** (cúpula cálida, 7 cristales, escáner, ventanal con cápsula y huevo, 2 incubadoras, cartel con huella/huevo, puerta con arco). Adaptar `tools/prueba_casas.py` (hoy comprueba acero, cristal frío, antena como punto más alto y matraz verde: cambian) y las capturas; `node test.js` (grupo 52 y el de la v2.72 miran huella, tamaño y puerta, que no cambian). Huella del juego anotada si cambia. **Resultado (v2.79):** todo lo anterior hecho; `prueba_casas.py` adaptada; huella del juego igual; el latido de la cúpula es 2D (`anima` + `G.capas.animar`). Cambios respecto a la ficha: la ventana de la derecha es una **ventana de estudio con barras de elemento** (el escáner solo está en el tejado); el eléctrico (amarillo) corona la cúpula y los otros seis van tres a cada lado; icono del minimapa sin tocar (🧪).
- **L2 · materiales 3D cálidos** (HECHO: v2.80 paredes, zócalo y marcos; v2.81 tejado turquesa y cadenas frías quitadas) para la variante `lab` (`src/volumenes_tex.js`) y fachada = recorte del nuevo 2D.
- **L3 (con el paso D):** estilo 3D con tejado plano, cúpula y cristales. **1.ª MITAD HECHA (v2.82):** azotea plana con peto (cubierta de arena, peto con franja turquesa, cara sur = recorte del 2D); sin chimenea ni veleta. **2.ª mitad, parte 1 HECHA (v2.83):** cúpula con luz cálida sobre tambor turquesa. **Parte 2 HECHA (v2.84):** 7 cristales elementales y escáner. **L3 CERRADO.**
- **L4 (con ID-5, interiores):** las señales de la cúpula y del minimapa según lo pendiente.
**Riesgos:** (1) mucho detalle en 94×114 px: puede leerse como «adorno»; se resuelve con vista previa y menos elementos si hace falta; (2) siete cristales + huevos + cúpula pueden cargar la silueta: prioridad cúpula > cristales > escáner; (3) en 3D la silueta seguirá siendo de casa hasta L3.

### Centro PC
- **Volumen:** rect 7×5 con nicho en (26, 9). Muros de 4,0 u, crema con luz a la izquierda.
- **Tejado:** plano, de tejas azul verdosas, con **peto** de 0,4 u alrededor (borde azul verdoso oscuro). Sin cumbrera.
- **Fachada sur (v2.258, fachada propia en el 3D, no recorte del 2D):** dos ventanas, una en cada bloque de pared (las de fuera), hueco central con la puerta azul en el nicho, zócalo de piedra, alféizares y dinteles claros, cornisa bajo el peto, dos peldaños y el rótulo «CENTRO PC» en la pared sobre la puerta (`vol.rotulo`). El dibujo 2D conserva sus cuatro ventanas y su letrero (no cambia).
- **Lados:** tres ventanas por lado. **Trasera:** lisa con cuatro ventanas altas.
- **Definitivo en el 3D desde la v2.258** (la v2.257 puso una marquesina que tapaba la puerta y se quitó). Los interiores van aparte (Fase 5, hechos).

### Tienda
- **Volumen:** rect 5×4 con nicho en (34, 8). Muros de 2,8 u, tablas de madera clara.
- **Tejado:** a dos aguas bajo, cumbrera este-oeste (+1,0 u), tejas de madera.
- **Toldo** a rayas rojas y crema, con borde festoneado, que sobresale 0,6 u sobre los dos escaparates (ventanas con mostrador); en 3D es una pieza inclinada pegada a la fachada.
- **Lados:** una ventana con postigos. **Trasera:** tablas con una puerta de servicio cerrada (solo dibujo, sin hueco).
- **Definitivo en el 3D desde la v2.254:** fachada propia con dos vitrinas a los lados de la puerta (marco, cristal, frascos de colores sobre el mostrador), dos toldos a rayas rojas y crema pegados al muro de fuera (uno sobre cada vitrina, 1,5 u de ancho y 0,8 de vuelo, a 2,8 u) y el rótulo «TIENDA» sobre la puerta entre los toldos (`vol.toldo` lista, `vol.rotulo`).

### Ermita del Primer Eco
- **Volumen:** rect 5×5 con nicho en (43, 8). Muros de piedra con sillares, 3,4 u.
- **Tejado:** a dos aguas con **cumbrera norte-sur**: el frontón triangular (+2,6 u) mira al sur, como en el dibujo. Pizarra azul en los bordes del faldón.
- **Frontón:** hornacina oscura con la **campana de dos mitades**. **Fachada:** dos ventanas estrechas altas y puerta de dos hojas en el nicho.
- **Lados:** tres ventanas estrechas, sin más. **Trasera:** muro liso con un óculo pequeño.
- **Relieves 3D desde la v2.256** (`vol.adornos`, 13 cajas de piedra): dos peldaños, jambas y arco escalonado con clave pegados a la puerta, dinteles y alféizares en las dos ventanas, cornisa y repisa bajo la espadaña. La espadaña sigue siendo pintura plana (una campana 3D pediría una pieza de revolución).
- Es el lugar cooperativo. Desde la v2.163 el exterior es definitivo: puerta con arco azul pizarra, peldaños, espadaña con la campana, escamas de pizarra, cornisa y zócalo, y dos farolas junto al camino.

### Maceta (jardinera de piedra con flores), pieza `maceta` y `maceta_i` · v2.164, pasos 1-2 de 5
- **Origen (2D):** dibujo de 22×14 px; piedra de 22×8 (y 6–14), seto de 20×4 (y 3–7) y cinco matas (tallo 3×4, flor 2×3) a 4 px. Sobresale 6 px de su casilla (`maceta_i` va 6 px a la izquierda). Huella 1×1.
- **Volumen 3D (`VOL_MACETA`):** debe caber en la huella (regla de `G.volumenes`), así que mide **1 × 0,5 u** (16 px) y es la misma pieza en las dos variantes; el desplazamiento de 6 px es solo del dibujo 2D.
  - cuerpo `piedra`: x 0–1, z 0,5–1,0, y 0–0,5 (tapa) · seto `hoja`: 0,875 × 0,375, y 0,5–0,6875 (tapa)
  - cuatro matas a x 0,125 · 0,375 · 0,625 · 0,875: tallo `hoja` 0,125×0,125, y 0,6875–0,8125; flor 0,125×0,125, y 0,8125–0,9375 (colores `yeso`, `rosa`, `oro`, `florAzulClara`)
  - altura total 0,9375 u · sombra rectangular 1,25 × 0,55 u (como el banco)
- **Estado (v2.165, paso 3 hecho):** estilo `maceta` con texturas propias en `src/volumenes_tex.js` (piedra con sillares, seto con motas, flores). Faltan paso 4 (listas y contadores, casi hechos con el paso 2-3) y paso 5 (capturas finales).

### Fuente de la plaza (24,18), no es edificio
- **DECIDIDO (v2.66): volumen sencillo, en el paso D.** Es el centro de la Plaza del Cascabel y lo que más se mira: una lámina entre edificios con volumen rompería la coherencia, y cuesta poco. **Estanque 3×2** (casillas 23-25 × 18-19, la misma huella de hoy) con **borde bajo de 0,5 u** (se rodea andando, nada nuevo que escalar), **agua a 0,35 u** con la animación de olas del 2D y **columna central con taza hasta +1,3 u**. Chorro y salpicaduras = Fase 4 (partículas). La colisión no cambia.

## 3. Pasos siguientes (un ZIP por paso y PARAR; esfuerzo antes de cada uno)

| Paso | Esfuerzo | Qué |
|---|---|---|
| A | LOW | **HECHO (v2.65).** Estas fichas; **cerradas en la v2.66** |
| B1 | MEDIUM | **HECHO (v2.67).** Motor PURO de volúmenes (`src/volumenes.js`): caja con nicho, tejado a dos aguas y plano, tono de luz por cara, campo `vol` en el catálogo, búferes, test «volumen = casillas sólidas» (grupo 49) y `tools/volumenes.js`. Sin dibujar nada todavía |
| B2a | MEDIUM | **HECHO (v2.68).** Texturas por cara por código (`src/volumenes_tex.js`), 3 tonos de luz, fachada sur = recorte del 2D; probadas en Chromium (`tools/prueba_volumenes_tex.py`, `docs/volumenes_tex_casa.png`) |
| B2b | MEDIUM | **HECHO (v2.69-v2.71).** Enchufar el motor y las texturas al pintor HD-2D, chimenea, veleta y demás piezas 3D de la Casa de Lali, captura con Three.js real y rendimiento básico. (Texto original del paso B: motor de volúmenes en HD-2D (caja con nicho, tejado a dos aguas y plano, texturas por cara hechas por código, luz por cara, campo `vol` en el catálogo, test «volumen = casillas sólidas») **y, como pieza de prueba, la Casa de Lali completa** (se ve el resultado entero antes de producir el resto)) |
| C | MEDIUM | **HECHO (v2.72).** Casa de Oli y Laboratorio en 3D; **en el 2D:** colores de las casas de Lali y Oli y dibujo del laboratorio (huella del juego nueva, anotada) |
| D | MEDIUM | Centro PC, Tienda, Ermita (definitivos) y Fuente de la plaza. **HECHO (v2.87)** D1a Centro PC (estilo «centro», MEDIUM) · D1b Tienda con toldo 3D (estilo «tienda», MEDIUM) · D1c Ermita con frontón (estilo «ermita», MEDIUM) · D2 Fuente en volumen con estanque, columna y taza (estilo «fuente», MEDIUM) · D3 pruebas, documentos y ZIP (LOW). Decisiones de D (v2.85, por delegación): el 2D NO cambia (huella del juego igual): las fachadas sur son recortes del dibujo 2D (`vol.fachada`); alturas sacadas del 2D: Centro PC muros 4,0 u (recorte de 64 px desde la fila 33), Tienda muros 2,8 u (recorte de 45 px desde la fila 36; el toldo pasa a ser una pieza 3D inclinada), Ermita muros 3,4 u (recorte de 55 px desde la fila 42; el hastial sur se redibuja con la hornacina y la campana recortadas del 2D). Fuente: estanque 3×2 con borde de 0,5 u, agua a 0,35 u, columna con taza hasta +1,3 u y la campana pequeña encima; sin chorro (Fase 4). |
| E | MEDIUM | Tejado atenuado (E1, v2.88), rendimiento, pruebas y ZIP (E2, v2.89) · **HECHO** |

**Presupuesto técnico (para B-E):** hasta 2.000 triángulos por edificio; geometría repetida compartida entre piezas iguales; una textura de hasta 256×256 por edificio; como máximo +12 llamadas de dibujo en total en Albanota; el vigilante de velocidad (18 cuadros/s) sigue mandando al 2D si no se llega. No se añaden más elementos a esta fase: lo nuevo va a la Fase 4.

**Riesgos:** (1) el rendimiento en móviles lentos (se mide en E); (2) el HD-2D con Three.js real no está probado en todos los móviles; (3) los volúmenes viven solo en HD-2D, y los únicos cambios de 2D son los del paso C, anotados con huella nueva.

## 4. Decisiones (cerradas por delegación, 5 nov)
1. **Fichas:** aprobadas tal cual (alturas, tejados y detalles de la tabla 1). Cambiarlas después cuesta una línea de datos.
2. **Casas de Lali y Oli:** postigos y flores azules / rosas, también en el 2D.
3. **Laboratorio:** pieza propia, también en el 2D. **(v2.76) Se rediseñará para que parezca un laboratorio de verdad y tendrá tres funciones (primera criatura, evolución/estudio, misiones); ver §3 «Laboratorio».**
4. **Fuente:** volumen sencillo, paso D (de cajas, v2.86); **rehecha redonda de dos niveles en la v2.92 (F2)** con `vol.torno` (ver `SESION.md`).
