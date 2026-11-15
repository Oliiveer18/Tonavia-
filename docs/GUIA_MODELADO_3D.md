# GUÍA · MODELADO 3D DE CRIATURAS A PARTIR DE SU SPRITE 2D (v2.229, 9 nov 2026)

**Para qué sirve:** que cada criatura nueva en 3D salga **coherente con su dibujo 2D a la primera**. Aquí está el método que funcionó (Nimbel y Arenel, aprobados por el usuario), y la lista de lo que falló por el camino, con su causa, para no repetirlo. Zefirax (v2.169) es un caso aparte, hecho con una curva (`FICHA_ZEFIRAX_3D.md`); esta guía es para criaturas con cuerpo «normal».

**Esfuerzo:** modelar una criatura es **MEDIUM** (no LOW). LOW solo para comprobar, documentar y empaquetar. Un paso por sesión y un ZIP por paso, como siempre.

## 1. Receta (en este orden)
1. **Leer el 2D de verdad:** volcar los sprites reales (`G.creatureSprite(id, dir, 0)` de frente `down`, espalda `up`, perfil `left`/`right`) y mirarlos en ASCII o ampliados. **Medir sobre ellos, con el contorno incluido** (el sprite completo es la silueta): ancho/alto del frente, fondo del perfil, y cada pieza (ojos, pinzas, caparazón…) en las tres vistas.
2. **Diseñar el modelo como código** en `src/criatura3d_modelos.js` (función que devuelve quads locales, ver §2) y registrarlo en `MODELOS`. Tipo de forma:
   - **Cuerpo blando de una pieza** (Nimbel): UNA masa por cortes horizontales (`tubo` de `anillo`s de superelipse): ancho del corte = ancho del frente a esa altura, fondo = fondo del perfil a esa altura; el contorno puede ondularse (`lob`) para dar bultos sin separar la masa.
   - **Cuerpo con piezas duras** (Arenel): una pieza por parte del dibujo (`tubo`, `esfera`, `caja` biselada), cada una con su propia posición y fondo.
3. **Texturas = los propios sprites** proyectados en planta (frente → caras que miran a +z, espalda → −z, perfiles → ±x; arriba/abajo = color liso). Se generan con `python3 tools/generar_sprites3d.py` (quita la tinta y rellena transparencias) y se guardan en `src/criatura3d_sprites.js` (**no editar a mano**; añadir el id a `IDS` del script).
4. **Rasgos de la cara = geometría o decales propios**, nunca el sprite proyectado sobre una superficie curva (sale roto). Ojo pequeño → decal plano pegado a la superficie (`decal`); ojo grande → esfera con pupila y brillo.
5. **Renderizar el MISMO módulo** y mirar antes de enseñar nada: `node tools/modelo3d_nimbel_arenel.js > modelos.json && python3 tools/render_modelo3d.py modelos.json sprites.json nimbel.png arenel.png` (sprites.json lo da `tools/prototipo_voxel_volcar.py`). Ver la checklist de §5.
6. **Integrar:** registro (ya automático por `MODELOS`), texturas, `src/orden.json` (datos y juego), tests (`test.js`, grupo v2.229) y prueba de navegador `tools/prueba_criaturas3d.py` (añadir el id al bucle).
7. **Cerrar:** `node build.js` → `node test.js` → `node tools/huella_juego.js --comprobar` (el 2D no cambia) → `tools/prueba_criaturas3d.py` → `tools/generar_sprites3d.py --comprobar` (texturas al día) → `docs/SESION.md`, ZIP.

## 2. Convenciones del módulo
- **Unidades:** 1 u = 1 casilla = 16 px. Ejes: x a la derecha, **y arriba (suelo = 0)**, **+z = frente** (la criatura mira a +z con `yaw` 0; `yaw` gira con `rotY` y el 2D `down` = 0).
- **`cfg = { cx, suelo, zc }`** por criatura, en coordenadas de borde del sprite: `cx` = centro horizontal del frente (px), `suelo` = y del suelo (px, alto del lienzo), `zc` = columna del perfil que corresponde a z = 0. Paso píxel → modelo: `x = (px − cx)/16`, `y = (suelo − py)/16`, `z = (zc − columna_del_perfil)/16` (el **frente está en las columnas bajas del perfil izquierdo**).
- **Quad:** `{ pieza, v:[4 puntos], n, col, colB, liso?, e?, cv?, kg? }` (`cv` = 4 colores por vértice para degradados en piezas lisas; `kg` = 4 posiciones 0-1 para un degradado de brillo por vértice en piezas con textura). `liso` = color propio sin sprite (pinzas, patas, ojos esféricos…); `e` = emisivo (no se sombrea: mofletes, brillo del ojo). `colB` = color de las caras que miran abajo.
- **Sombreado:** brillo NETO continuo `net = clamp(0,88 − 0,14·nx + 0,12·nz + 0,06·ny, 0,55, 1)` con la normal ya girada (frente 1,0 · oeste ≈ 1,0 · este ≈ 0,74 · espalda ≈ 0,76 · arriba ≈ 0,94). Colores lisos: `hex(col, net)`; con textura: `q.k = net/BRILLO` (el material multiplica por BRILLO = 1,12). El pintor usa `q.k` si existe.
- **Misma topología en toda pose** (el pintor reserva el nº de caras al crear la malla): la animación solo mueve vértices (`anima`). Nimbel respira (escala y ±3,5 %); Arenel mueve patas (solo al andar) y ojos (solo parado). `pose(fase, yaw, cam, moving)`.
- **Presupuesto:** ≤ 1200 triángulos por criatura (Nimbel 534, Arenel 978), atlas ≤ 256×256, una llamada de dibujo.
- **Puro y determinista:** sin `Math.random`, DOM ni relojes; la fase la acumula el pintor. Datos (texturas) fuera del código.

## 3. Lo que funcionó
- Partir del sprite real y **medir con el contorno** (silueta = sprite completo).
- Una **masa única** para lo blando y **piezas separadas** para lo duro; el perfil decide el fondo.
- **Proyección plana de los propios sprites** (frente/espalda/perfiles): el 3D se parece al 2D por construcción, y cuesta poco (4 texturas pequeñas).
- **Rasgos como geometría/decales** y colores lisos para lo que no necesita textura.
- Enseñar **renders del modelo real junto a los 2D de referencia** (frente, perfil, espalda) y a seis vistas.
- Tests de módulo (puro, finito, topología, UV, orientación de caras) y una prueba de navegador con el Three.js falso.

## 4. Lo que falló (cronología, causa y regla para no repetirlo)
| Fallo | Causa | Regla |
|---|---|---|
| Nimbel salió como «varias bolas»; Arenel en planta parecía una bola | Diseñé desde mi idea (5 esferas, elipsoide) y no desde el 2D; el fondo del cuerpo era el mismo que el ancho | Medir ancho (frente) y fondo (perfil) del sprite; una masa para lo blando; fondo ≠ ancho |
| El usuario nunca vio el modelo, solo un esquema | La hoja de la v2.226 eran planos con círculos y rectángulos, no un render | **Enseñar siempre un render del módulo real**, nunca un esquema |
| Prototipo de vóxeles: laterales a rayas, cara estirada, piezas finas perdidas | Un solo bloque redondeado; laterales coloreados estirando píxeles del frente | No estirar el frente; usar los sprites de perfil y espalda |
| Las vistas «3/4» y la «planta» enseñaban la parte de abajo (tres hojas con ese error) | **Signo del cabeceo de la cámara invertido** en mis herramientas | Antes de enseñar: comprobar con algo asimétrico conocido (cabeza/ojos/pinzas al frente, techo arriba) que la cámara mira desde ARRIBA; la planta debe mostrar el techo |
| Perfil y espalda no coincidían con el 2D | Colores laterales inventados y fondo de piezas a ojo | Texturas de los sprites reales; z de cada pieza sacada de las columnas del perfil |
| Ojos rotos (fragmentos oscuros) en los dos | Sprite proyectado sobre superficie curva a facetas | Rasgos = decales o esferas, no proyección |
| Acarapacho de Arenel demasiado pequeño | Lo medí en la vista de frente, donde los ojos lo tapan | Medir cada pieza grande en **las tres vistas** (en la espalda se ve entera) |
| Manchas negras que no debían estar | Bug de la herramienta: la tinta se propagaba entre vecinos | Usar copia del mapa de tinta por pasada (ya corregido en `generar_sprites3d.py`) |
| Ojos de Arenel «saltones» en el juego (v2.231) | Esferas de 4,8 px y adelantadas: se veían bien en el render a ras pero demasiado grandes desde la cámara cenital | Ojos esféricos ≈ el tamaño del ojo del 2D o menos, aplastados en z y pegados al cuerpo; revisarlos también en una captura del HD-2D real, no solo en el render |
| Parte alta y banda inferior del acarapacho «quemadas» (v2.232) | Caras con textura ×1,12 más claras que las lisas (BRILLO); aro casi blanco; el blanco de los ojos del sprite de frente se proyectaba como banda | Brillo neto único (`luzK`; textura = neto/BRILLO, lisas = neto), máx. ≈ 1,0; rebajar blancos puros con `COLOR_3D`; si una pieza tapa a otra en el 2D (ojos sobre el caparazón), quitar su color de la textura con `QUITAR_3D` |
| Parte superior del acarapacho plana y con cambios de color bruscos (v2.233) | Tapa plana (anillo + abanico) con un solo color por cara | Las tapas se hacen en cúpula (varios anillos que se cierran) y los colores/brillos que cambian con la altura se dan POR VÉRTICE (`cv` en lisas, `kg` en texturizadas), no por cara |
| «Píxeles de más» del acarapacho en el cuerpo y de arena en el acarapacho (v2.236); confundí qué lados quería | Una sola textura proyectada para dos piezas que en el 2D se tapan (cuerpo y tapón); y no pregunté qué lados eran | **Una textura por pieza** cuando se solapan en el 2D (`TAPON_3D`: el cuerpo sin los colores del tapón, el tapón solo con los suyos); ante una indicación ambigua de «lados», confirmar de qué lados (izq./der. o delante/detrás) con una imagen marcada antes de cambiar |
| Pasos mal etiquetados LOW | Cambié de método y lo seguí llamando LOW | Todo lo que implique rehacer el método o programar geometría es MEDIUM |
| Operaciones largas cortadas por el usuario | Encadenar demasiadas acciones sin informar | Avisar de lo que voy a hacer y hacer pasos más cortos |

## 5. Checklist ANTES de enseñar un modelo
1. Render del **mismo módulo** que irá al juego (no un esquema), 6 vistas (frente, ¾ der., ¾ izq., perfil, espalda, planta) + los 3 sprites 2D al lado.
2. La cámara mira desde arriba (planta = techo); el frente se parece al 2D de frente; el perfil se parece al 2D de perfil (frente a la izquierda); la espalda, a la espalda 2D.
3. Cada pieza grande medida en las tres vistas; proporciones y tamaño total = los del 2D (el test comprueba el ancho ±).
4. Ojos y rasgos legibles; sin manchas; sin piezas flotando; sin agujeros.
5. Triángulos dentro del presupuesto; topología constante.
6. Decir con franqueza lo que NO se ha comprobado (Three.js real, luz y sombras del juego).

## 6. Limitaciones conocidas y pendientes
- **Una malla 3D por tipo de criatura a la vez** (`vistos[k]` en `entidades`): si salen dos Nimbel a la vez, solo el primero es 3D y el otro se ve en lámina 2D. Pendiente (MEDIUM): instancias múltiples compartiendo textura.
- **Sin comprobar con Three.js real** ni con la luz, sombras y HD-2D reales del juego en el móvil (aquí solo hay el Three.js falso): lo ve el usuario en el juego.
- Efectos del 2D no portados aún: granitos de arena de Arenel (`flick`) con las partículas del 3D; la sombra usa la elipse del 2D.
- El tamaño del juego (`dist`) está cerca del tope de `test.js` (1,15 MB): vigilar al añadir criaturas (cada una suma texturas y geometría de código).
- Si cambia el 2D de una criatura, hay que volver a ejecutar `tools/generar_sprites3d.py` (y revisar el modelo).

## 7 · Decoración fija (objetos 3D, v2.246)
Para piezas del catálogo (`G.OBJETOS`) que no tienen `vol`: `src/objeto3d.js` (registro puro). Una pieza = una función que devuelve quads (con `B.anillo`, `B.tubo`, `B.caja`, `B.esfera`, `B.decal`…, los mismos de las criaturas) + `M.fabrica(tipo, cfg, construir, null, () => 0)` + `registrar(tipo, …)`. La textura es su dibujo 2D de frente (`OBJ_IDS` de `tools/generar_sprites3d.py`; las demás caras la reutilizan). `cfg = { cx, suelo, zc, sombra: { rw, rd } }` (como en las criaturas; `sombra` = elipse de contacto en u). El pintor HD-2D (modo `'modelo'`, interruptor `G.hd2d.AJUSTES.OBJETOS3D`) crea una geometría por tipo y una malla por ejemplar, con un giro de 90° repetible según la casilla. Prueba: `tools/prueba_objetos3d.py` (Three falso o `--three` con capturas). Primera pieza: la roca; el resto, en lotes (`docs/LISTA_DECORACIONES_3D.md`).

