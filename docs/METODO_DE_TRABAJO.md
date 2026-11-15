# MÉTODO DE TRABAJO · Criaturas de Lali y Oli (v2.9)

Método fijo, eficaz y profesional. Lo fija el usuario; Claude lo sigue en cada paso y no lo cambia sin permiso.

Para retomar el proyecto en una sesión nueva, leer primero `CONTINUAR.md`.

## Reglas de oro
1. **ZIP tras cada subpaso**, con los documentos incluidos. El ZIP es el checkpoint: si la sesión se pierde o cambia de cuenta, solo sobrevive el ZIP. Claude lo recuerda siempre.
2. **Los subpasos no se agrandan ni se juntan.** Un subpaso = un cambio con su ZIP.
3. **Solo las pruebas del paso en curso.** Nada de suites largas ni cierres largos salvo que el usuario los pida. Si una medición usa muestras, se indica siempre la muestra usada (≈40 casos por nivel en subpasos intermedios; ≥100 en cierres de bloque).
4. **Cierre de hito:** comprobación completa pero acotada (tests del juego, test de equilibrio y revisión del reparto del `PLAN_200.md`). Un rango no se da por bueno si no llega a su mínimo.
5. **Solo se implementa lo que el usuario pide**, avisando antes. Condiciones de evolución, combate y captura están decididos (v2.13, `HISTORIA_Y_MUNDO.md`) pero se programan en su paso, no antes.
6. **Documentarlo todo** en cada subpaso: `SESION.md` (diario), `CATALOGO.md` (inventario), `ROADMAP.md` (siguiente) y, si cambia el plan, `PLAN_200.md`.
7. **Respuestas en español y cortas** (el usuario lee en el móvil).
8. **Equilibrio:** ninguna criatura ni elemento puede ser abusivo; equilibrados aunque no iguales.
9. **Todo efecto o animación se prueba en TODAS las formas donde puede aparecer, no solo en la más cómoda** (v2.44; salió de la v2.42, cuyas olas no llegaban a las partes verticales del lago). Antes de entregar: (a) listar las formas (ancho, estrecho de 1 casilla, esquinas, estanque suelto, borde del mapa, vista cortada); (b) medir la cobertura de cada una (mapa de calor, p. ej. `tools/cobertura_agua.py`) y dejar un control automático en `test.js` que falle si una forma se queda sin efecto; (c) enseñar una captura de cada forma, no solo del caso grande; (d) decir en la entrega qué formas se probaron y cuáles no. Un efecto que solo se ve en una parte del mapa no está terminado.

## Cómo se hace una línea evolutiva
1. **Ficha de identidad** (plantilla en `PLAN_200.md`, sección 11; nombres según `GUIA_DE_NOMBRES.md`). Se esperan los retoques y la aprobación del usuario **antes de dibujar**.
2. **Datos:** UNA entrada en `src/lineas.js` (Nº, raíz, elementos, rareza, nombres, frases, tamaño y peso por fase, rasgos de movimiento y casilla donde aparece; la leyenda está en la cabecera del archivo). De ella salen solos `G.LINE_PLAN`, `G.PHASES_PLAN`, `G.TRAITS` y `G.SPAWN`; si falta o sobra un campo, el juego no arranca y dice cuál (`G.validarLineas`). Después `node tools/catalogo.js` para actualizar `CATALOGO.md`.
3. **Dibujo** en `src/formas_<elemento>.js` (el del elemento principal de la línea): una forma propia por fase, con frente, perfil y espalda, y 2 pasos; se enlaza con su entrada del registro con `def2('id', dibujo)` (el `id` debe existir en `src/lineas.js`). Los ayudantes de un solo elemento viven en su archivo; si dos elementos distintos necesitan el mismo, se mueve a `src/formas_base.js` y se añade a `G.F`.
4. **Vista previa** (4 direcciones × 2 pasos) con `tools/render_sprites.js` y `tools/hoja_sprites.py`, revisada **antes de empaquetar**.
5. **Pruebas del paso:** `node tools/equilibrio.js` (0 alertas) y bloque nuevo al final de `test.js` (línea, tamaño y peso, sprites, movimiento propio, evolución en pantalla).
6. **Documentos, build y ZIP** (+ enlace de prueba: ✨ evoluciona a la criatura más cercana).
7. **PARAR** y esperar a que el usuario diga.

## Errores a evitar
- La vista de espaldas no dibuja cara (`front = dir === 'down'`, `sym = !side`).
- Los apéndices del perfil (cola, capa) deben sobresalir de la silueta.
- Redibujar a la medida de la fase; no reescalar.
- Cada fase se distingue por silueta, paleta y rasgo propio; no basta con agrandar.
- Al cambiar diseños o tamaños, actualizar los tests y los documentos.
- Desde Zefirax (v2.1) el sprite legendario es 30×30; el lienzo es tamaño de la forma más 1 px de contorno por lado.

## Herramientas (carpeta `tools/`)
- `node tools/equilibrio.js [--detalle] [--cierre]`: test de equilibrio (v2.4). Revisa E1 E2 E3 E5 E6 E7b E8 E9, T1-T6 y N1 N4 N5 N6 N7; sale con código 1 si hay alertas. `--cierre` compara con la meta del hito (solo en cierres de hito).
- `node tools/bloques.js` (v2.24.6): cuenta los píxeles de sombra fuera de un bloque 2×2 en las criaturas con `limpio` (debe dar 0).
- `python3 tools/cobertura_agua.py [dist/criaturas.html]` (v2.44): mapa de calor del agua; falla si alguna casilla de agua tiene muy pocas olas. El control sin navegador es el grupo 30 de `test.js` (mapa real + formas sueltas: 1 casilla, tira vertical, tira horizontal).
- `node tools/catalogo.js [--comprobar]`: genera `docs/CATALOGO.md` desde `src/lineas.js` (v2.6); `test.js` falla si el catálogo está desfasado. **No se edita `CATALOGO.md` a mano.**
- `node tools/snapshot_datos.js [--guardar f.json]`: hash de todos los datos del juego (`G.CREATURES` sin dibujo, planes, rasgos y `SPAWN`). Se guarda el «antes» y se compara con el «después» en cualquier refactorización que no deba cambiar nada (v2.6).
- `node tools/render_sprites.js . salida.json id1,id2 [0,1,2]` (ejecutar desde la carpeta del proyecto).
- `python3 tools/hoja_sprites.py salida.json hoja.png 7 [vistas]` (necesita PIL); luego mirar la hoja PNG.
- `python3 tools/ojos.py`: mide si los ojos de la vista frontal están centrados.
- **Lista única de archivos: `src/orden.json`** (`datos` = lo que hace falta sin navegador; `juego` = galería y mapa). La usan `build.js`, `test.js` y todas las herramientas. Al añadir un archivo a `src/` se añade ahí, en su orden de carga (`lineas` → `creatures` → `formas_base` → `formas_<elemento>`); `test.js` falla si falta alguno.
- `python3 tools/prueba_galeria.py [dist/criaturas.html] [carpeta_capturas]`: prueba la galería en un Chromium de móvil (390×780, necesita `playwright`): contadores, filtros combinados, páginas, sprites dibujados al verse, botones de ≥ 44 px, sin saltos de diseño, búsqueda, ficha y botón «Galería»; con las 20 líneas reales y con una **muestra simulada de 200** (las 20 reales repetidas 10 veces con Nº 1-200; se inyecta en `G.galeria.fuente`). Lo que no necesita navegador (lista por Nº, filtros, páginas, búsqueda) está en el grupo 20 de `test.js` (v2.8).
- `python3 tools/presupuesto.py [--rapido]`: presupuestos del juego (v2.9). Mide peso (real, extrapolado a 410 formas y de la **muestra simulada de 410 formas**: las 20 líneas reales clonadas 10 veces con ids `id__k`, más 9 copias del código dentro de funciones sin llamar para que pese y se parsee como un juego real), arranque (mediana de 7 cargas, también con la CPU 4× más lenta), memoria, sprites en caché con la galería recorrida de arriba abajo y un estrés con la caché en 1 sprite. **Presupuesto:** dist ≤ 3 MB con 410 formas · caché ≤ 300 sprites · arranque ≤ 1 s con la CPU 4× más lenta · ningún sprite de galería sin dibujar · sin errores de consola. Se pasa al cerrar cada hito y siempre que cambie el dibujo, la caché o la galería; **indicar siempre la muestra usada**.
- `node tools/huella.js --cache N`: como `huella.js`, con la caché de sprites limitada a N y dos vueltas; el hash de la 2.ª (todo descartado y redibujado) debe ser idéntico al normal (v2.9).
- `node tools/huella.js`: hash de todos los sprites (ordenados por id). Se guarda el «antes» y se compara con el «después» cuando se mueve código de dibujo y no debe cambiar ni un píxel (v2.7).
- Helpers en `src/formas_base.js` (`G.F`) y en cada `src/formas_<elemento>.js`: `inEll`, `ell`, `mk`, `h97`, `earTri`, `keyBow`, `scanL`, `scanR`; rasgos de movimiento en `G.TRAITS`: `hop`, `float`, `nod`, `sway`, `flick`, `eye`.

## Ficha de luz de cada criatura (desde la v2.23)
Cada criatura que use el sistema de sombreado lleva su ficha en `src/luz_criaturas.js` (`G.LUZ_CRIATURAS`):
- `mat`: material por defecto (`piel`, `roca`, `metal`, `cristal`).
- `colores`: reglas por zona (tono `h` 0-360, saturación `s` 0-1, luminosidad `l` 0-1) que cambian el material (p. ej. cristales en una criatura de roca).
- `emite`: zonas que emiten luz y no se sombrean (electricidad, brillos mágicos).
- `alcance`: píxeles desde el borde que cuentan como volumen (3 por defecto; 4 en las grandes).
- `columnas`: solo si el dibujo es de 16 y se estira; hace el estirado simétrico (mejor: dibujar directamente al tamaño final).
Antes de enseñar una criatura: `node tools/luz.js`, `node tools/simetria.js --sombreado` y mirar los ojos (`tools/ojos.py`).
