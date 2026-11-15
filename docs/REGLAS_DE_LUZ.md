# REGLAS DE LUZ Y SOMBRA · Criaturas de Lali y Oli (v2.21; plan del sistema en v2.22; B1 hecho en v2.23)

Documento corto de estilo: la dirección artística elegida por el usuario (2 nov 2026) es **el estilo actual (contorno oscuro, colores por bandas) con sombreado**, no una dirección nueva. Sustituye a las «2 o 3 direcciones» que proponía ID-1 en `PLAN_IDENTIDAD.md`. El código está en `src/sombreado.js`.

## Reglas
1. **Luz fija ARRIBA-IZQUIERDA; sombra ABAJO-DERECHA**, igual en criaturas, suelo y árboles (y, más adelante, en Oli, Lali y edificios).
2. **Rampas con cambio de tono:** la luz se acerca al amarillo cálido y la sombra al violeta/azul frío. No se sombrea con gris ni con negro.
3. **Contorno selectivo** (solo criaturas): el contorno toma el tono de lo que rodea; más claro arriba-izquierda y más oscuro abajo-derecha. Los detalles oscuros de dentro (ojos, bocas) y los blancos no se tocan.
4. **Suelo limpio:** hierba de UN solo verde con matas pequeñas; camino de arena lisa con 2 guijarros y una línea más oscura donde toca la hierba; agua de dos azules con ondas sueltas y borde azul oscuro.
5. **Árbol:** copa en 5 tonos con luz arriba-izquierda, contorno claro arriba-izquierda y oscuro abajo-derecha, tronco con luz a la izquierda.
6. **Lo que el usuario NO quiere (v2.21):** manchas de varios tonos en el césped; línea blanca (espuma) alrededor del lago; sombras proyectadas en el suelo junto a cada árbol. No se vuelven a poner sin que lo pida.

## Paleta (G.sombreado.COL)
- Hierba: sombra fría #2c7351 · #3b8d50 · base #5dae5a · luz #76c363 · #93d46f
- Arena: #b58f58 · #cfad72 · base #e8cf98 · luz #f3e2b6
- Agua: borde #2a4f9c · hondo #35629f · base #4580d4 · onda #6aa5ee · brillo #d3e8ff
- Copa: #a3de7c · #78c866 · #4cab57 · #36904f · #256249 · contorno luz #2d7a52 · contorno sombra #1b4440
- Tronco: luz #9a6238 · base #6b4226 · sombra #4a2e24

## Interruptor y comprobaciones
- `G.SOMBREADO.ACTIVO` (true por defecto). En el juego: botón «Sombras» (arriba a la izquierda) o `?sombras=0` en la dirección. Apagado = el dibujo de la v2.20, idéntico píxel a píxel.
- `node tools/huella.js` (sin sombreado) debe dar `f455420d…efad · 656 sprites` desde la v2.23 (hasta la v2.22 era `666a07f5…2d0bdc3`; el cambio es solo la cara de Cuarvel, arreglada a propósito en `src/formas_roca.js` con aprobación del usuario); `node tools/huella.js --sombreado` da la huella de los sprites sombreados.
- El sombreado nunca cambia la silueta (el canal alfa no se toca) ni el estado de la partida.

## Pendiente (no hecho en la v2.21)
- Retoque a mano del volumen de cada criatura (hoy es una pasada automática en los bordes), línea por línea.
- Oli y Lali (hace falta permiso del usuario; hoy no se tocan).
- Borde hierba-camino, agua animada y paso de Lali y Oli por detrás de las copas (ID-2, motor con capas).

## 7. Sistema de sombreado para TODAS las criaturas (plan v2.22 · B1 HECHO en v2.23, aprobado por el usuario con las 3 pilotos; B2.x y B3 pendientes)
Objetivo del usuario (2 nov): sombrear las 41 formas y que todas las criaturas futuras (≈ 370 formas) salgan con el mismo sombreado, de la forma más profesional. Idea: el estilo sale de un sistema, no del ojo en cada dibujo. Hoy: pasada automática solo en los bordes (v2.21) y cada dibujo lleva colores a mano (p. ej. `VOL` en `src/formas_electrico.js`).

**Capa 1 · Rampas de color compartidas.** Una función (propuesta: `G.rampa(colorBase, opciones)` en `src/rampas.js`) genera 4-5 tonos por color: sombra profunda, sombra (más fría), base, luz (más cálida), brillo. Los dibujos piden «piel», «vientre», «metal» a la rampa en vez de escribir hex. Una sola regla de cambio de tono para todo el juego (la de `REGLAS_DE_LUZ.md`).
**Capa 2 · Volumen calculado por el motor.** La pasada pasa de «solo bordes» a calcular desde la silueta qué zonas miran a la luz (arriba-izquierda) y pintar 3 bandas duras (sin degradados ni tramado). Cada criatura marca el material: piel suave (poco contraste) · metal (contraste duro y brillo) · cristal/fuego/electricidad (emite luz: no se sombrea). Lo automático da la base homogénea; el retoque a mano (ojos, barriga, brillos) va en una lista corta de ajustes por criatura.
**Capa 3 · Test que lo vigila** (propuesto `tools/luz.js`, como `tools/equilibrio.js`): máximo de colores por criatura (propuesta ≤ 16), rampas ordenadas de oscuro a claro, más luz arriba-izquierda que abajo-derecha, sin sombreado «almohadilla» (bordes oscurecidos por igual), legible a tamaño real. Si una forma no pasa, avisa antes de enseñarla.
**Ficha de diseño:** se añaden dos campos a cada criatura nueva: materiales y tratamiento de luz (se anotan en `METODO_DE_TRABAJO.md` al hacer B1).

**Orden propuesto**
- **B1:** infraestructura (capas 1-3) + piloto con 3 criaturas de materiales distintos (propuesta: Aguacato = piel, Voltorax = metal/electricidad, Cuarzoth = cristal/roca; ids `aguacato`, `voltorax`, `cuarzoth`). Vista previa 4 direcciones × 2 pasos y ESPERAR la aprobación del usuario antes de empaquetar. Un ZIP.
- **B2.x:** migrar las 41 formas por elemento (Hoja, Fuego, Agua, Eléctrico, Aire, Roca, Sombra), un ZIP por elemento, vista previa y aprobación en cada uno.
- **B3:** toda criatura nueva (los +160 líneas) se hace ya con el sistema; el test la comprueba.
**Reglas de seguridad:** todo sigue detrás de `G.SOMBREADO.ACTIVO` (apagado = huella `f455420d…` desde la v2.23, 656 sprites, sin cambios; antes `666a07f5…`); el sombreado no cambia la silueta (alfa idéntico); `node test.js`, `tools/equilibrio.js` y presupuestos (`tools/presupuesto.py`) deben seguir en orden; Oli y Lali no se tocan sin permiso.
**Riesgos:** lo automático no iguala a un retoque a mano (por eso la lista de ajustes); los sprites sombreados cambian de huella (se calcula la nueva con `--sombreado`); migrar una línea puede cambiar su aspecto: siempre con aprobación.

### B1 hecho (v2.23): lo que existe ahora
- **`src/rampas.js`** · `G.rampa(color, {contraste})` da 5 tonos (`s0` sombra profunda · `s1` sombra fría · `base` · `l1` luz cálida · `l2` brillo). Luz hacia amarillo (52°), sombra hacia violeta (275°). Con texto devuelve texto, con `[r,g,b]` devuelve arrays (`G.rampa.rgb` / `G.rampa.hex`). También expone `G.color.rgb2hsl/hsl2rgb/towards`.
- **Volumen calculado** (`src/sombreado.js`, sección 1b): distancia de cada píxel al borde → pendiente → producto con la luz arriba-izquierda → 3 bandas duras con la rampa del propio color, y una limpieza que quita puntos sueltos. Nunca toca el alfa. Materiales (`G.sombreado.MAT`): `piel` (suave) · `roca` · `metal` (contraste duro + brillo) · `cristal` (facetas + brillo).
- **`src/luz_criaturas.js`** · ficha de luz por criatura (`G.LUZ_CRIATURAS`): `mat`, `colores` (cambia el material por zona según tono/saturación/luminosidad), `emite` (zonas que no se sombrean: electricidad, brillos), `alcance`, `columnas` (estirado simétrico). Solo las criaturas listadas usan el sistema; las otras 38 siguen con la pasada de bordes de la v2.21 (sin cambios) hasta B2.x.
- **Interruptores:** `G.SOMBREADO.ACTIVO` (todo) y `G.SOMBREADO.VOLUMEN` (`?volumen=0`: las pilotos vuelven a la pasada de la v2.21, solo para comparar).
- **Pilotos:** `aguacato` (piel), `voltorax` (metal; la electricidad cian no se sombrea), `cuarzoth` (roca + cristales + cúpula dorada como metal).
- **Tests:** `tools/luz.js` (silueta, colores por vista, rampas, luz arriba-izquierda, sin «almohadilla», contraste; sabe fallar: con la luz invertida da error) y `tools/simetria.js` (el estirado no mete asimetría). Los dos están dentro del grupo 26 de `node test.js`.
- **Huellas:** sin sombreado `f455420d1fbca46d133f1040029803dfa9e00734c60af2bb9481d4bbe6adefad` · con sombreado (`--sombreado`) `db202bccc941dadc27cc09f8ea5e347e59297c7b338aed39ad89816df7d4caca`.

### Cambios hechos a propósito en B1 (con aprobación del usuario, 2 nov)
1. **Aguacato, ojos iguales.** Se dibuja a 16 px y se estira a 18; el estirado duplicaba una columna solo por el lado izquierdo y el ojo izquierdo salía más ancho (fallo ya presente en la v2.21). Con el sistema nuevo, `columnas` hace el estirado simétrico (duplica las columnas 3 y 12, junto a las orejas). Cambia la silueta de frente y de espaldas en 1 columna (excepción declarada en `tools/luz.js`). Con el volumen apagado sigue el estirado antiguo. **Pendiente (paso aparte):** redibujar Aguacato directamente a 18×18 en `src/formas_hoja.js` y quitar `columnas`.
2. **Cuarvel, cara legible.** Corregido en el dibujo (`src/formas_roca.js`), no como parche detrás del interruptor: cara de frente y de perfil con la pizarra clara (`sL`) y brillo de ojo blanco puro; de espaldas no cambia. Solo cambia Cuarvel (41 formas comprobadas), silueta idéntica. La huella sin sombreado pasa de `666a07f5…` a `55f969d2…` (y a `f455420d…` tras corregir Voltorax en la v2.23.1).

3. **Voltorax, ojos legibles** (`src/formas_electrico.js`): los ojos blancos 2×2 sin pupila se mezclaban con la esfera (blanca y cian). Ahora la cara es azul noche (`VOL.n`), cada ojo es blanco 2×2 con pupila oscura abajo-derecha (los dos idénticos) y la boca pasa de blanco a cian. Se probaron amarillo (se confundía con la gema y las chispas), rojo y blanco con pupila roja; el usuario eligió **blanco con pupila oscura**. Solo cambia Voltorax, silueta idéntica.

### Límites conocidos y notas
- **Límite de colores:** la propuesta de ≤ 16 colores por criatura no era realista (la v2.21 ya daba 31-66 por vista por los tonos del contorno). El test mide **por vista**: ≤ 24 colores de base y ≤ ×5 al sombrear (medido: base 8-22, v2.21 ×3-3,5, volumen ×3-4).
- **Rampa en colores muy oscuros (corregido en v2.23.1):** con luminosidad HSL < ≈0,21 la sombra profunda (`s0`, suelo 0,09) quedaba más clara que la sombra (`s1`). Ahora, si `s1 ≤ s0`, `s1 = min(l − 0,01, s0 + 0,035)`: siempre profunda < sombra < base. Cambió 140 px de Voltorax (aprobado por el usuario); Aguacato y Cuarzoth no cambian. El test de rampas incluye colores oscuros (`#2a1b30`, `#201830`, `#35282f`).
- **Ojos de la forja (v2.23.2):** Forjel con ceño (B); Forjavel y Forjadrax con blanco cálido, pupila y párpado de brasa debajo (A). Solo píxeles de ojos, alfa idéntico. Huellas actualizadas arriba.
- **7 formas a mirar** (medidor de ojos `tools/ojos.py`; ids del código): `aguacaton` (Aguacaryn), `caracolin` (Espirel), `cuarvel`, `voltavar`, `lunaroth`, `zumbarix`, `zefirax`. Solo Cuarvel era un fallo real (arreglado); el usuario vio bien las otras 6.
- El usuario quiere revisar en las migraciones B2.x también simetría y legibilidad de ojos (`tools/simetria.js` y `tools/ojos.py`).

- **v2.23.5 (B2.1c parcial):** llaves de bronce (Aguacaryn) y oro (Aguacarax) con material `metal` por `colores` en `src/luz_criaturas.js`. Huella con `--sombreado`: `4d26bb72e495a2cbe602b4d97d52bc4f515533df2e3fe4c49c5a2a8a6f3c6215`; sin sombreado sin cambios (`f455420d…efad`). La llave de Aguacato se queda como `piel` (decisión del usuario).
- **v2.24.0 (B2.2 Fuego, aprobado):** hierro de la forja = `metal`; brasas, llamas y ojos de brasa en `emite`; `cenel` = `roca`; `ignavar` = `piel`. Huella con `--sombreado`: `55cbd0d45241c2e88cbe19a150550c7ddbf2f19cb01a1e4868f25d6ecd1e6ba5`.

### Decision v2.24.1: sombreado compacto y limpio (usuario, 2 nov)
Paleta corta y constante: base + sombra (2 tonos) para piel y roca; metal y cristal con un brillo de 1-2 px; un solo tono de contorno por criatura; sombra en banda continua abajo-derecha sin pixeles sueltos. Interruptor `G.SOMBREADO.LIMPIO`. Piloto: `aguacaton`, `forjadrax`, `cuarzoth`.
- **v2.24.1 (sombreado limpio, piloto aprobado):** `limpio: true` en `aguacaton`, `forjadrax`, `cuarzoth`. Huella con `--sombreado`: `5e0cb5ecb7bdafd08174e10ac04636353cf7341da3cd089c3bb071b730e724c8`.
- **v2.24.2:** sombreado limpio aprobado y aplicado a las 15 criaturas migradas. Huella con `--sombreado`: `ed2a8ea6cc254099a1b36c535ea6ee95b6dcf9493932e4f71ef4a13517e84f9f`. Criaturas visibles en el mapa (`AJUSTES.VISIBLES = true`).
- **v2.24.3:** Somnaris sin punto claro en los ojos cerrados. Huella sin sombreado `b55c33cd7bdae2224342123652c077ed453347a349fa15bdb7be17592196b1f1`; con `--sombreado` `430ea28ea7df183417fd55817334eb0720154884c136995584cf3649e1f09798`.
- **v2.24.4:** Somnaris sin blanco en el ojo abierto (frame 3). Huella sin sombreado `24c8696b78dbf859d581c3ab0a702987a045075b668841dc395f1099ad88c4a6`; con `--sombreado` `0ef843a310db59a9397722f264fa67e6d05aa8abb65273a2dd805eefb808eee9`.
