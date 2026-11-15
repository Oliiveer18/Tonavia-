# GUÍA DE CONTENIDO · Multiverso (entregada en F8, v2.363)

Manual para crear **contenido** (dimensiones, mapas, portales, entrenadores, mar) sin romper el núcleo ni inventar estructuras. Está escrita contra el código real: cada regla se comprueba con una herramienta o con `test.js`. Si algo de aquí y el código discrepan, **manda el código**; anótalo en `docs/SESION.md`.

> Regla de oro: **no inventes formatos, claves ni archivos.** Todo lo que no esté en esta guía o en los contratos (`06`, `08`, `13`, `14`, `15`, `16`) o no existe o se pide al núcleo (§10). Una clave desconocida en una dimensión se RECHAZA; un portal con requisito desconocido se CIERRA.

## 1. Qué se toca y qué no

| Se crea / modifica (contenido) | NO se toca (núcleo; si hace falta algo, §10) |
|---|---|
| `datos/dimensiones/<id>.json` (una por dimensión) | `src/guardado.js`, `src/mapas.js`, `src/motor.js`, `src/aparicion.js` |
| `maps/<dim>/*.json` (ids `<dim>/<mapa>`) | `src/agentes*.js`, `src/red*.js`, `src/nivel.js`, `src/dimensiones.js` (esquema) |
| Puertas/portales nuevas **dentro de mapas** (también las que salen de Tonavia o del Nexus) | `src/portales.js`, `src/navegacion.js`, `src/marcas.js` (se USAN, no se editan) |
| `datos/*.json` de contenido (criaturas `datos/crias/`, textos, tablas) | `build.js`, `test.js` (salvo lo indicado en §8), `tools/_cargar.js` |
| Módulos nuevos de contenido `src/<modulo>.js` (+ alta en `src/orden.json`, §7) | Los mapas oficiales de Tonavia y sus huellas (`docs/HUELLA_JUEGO*.txt`) salvo que se toquen a propósito |
| Entradas en `docs/SESION.md` | `docs/multiverso/05_HOJA_DE_RUTA.md` |

Normas permanentes que el contenido también cumple (`CLAUDE.md`): estado nuevo SIEMPRE en `est` (serializable, con versión), motor puro y determinista (sin `Math.random`, sin DOM, sin reloj de pared), jugadores por id, contenido como datos, todo ligero y generado por código. Diseño espacial intencional y transitable al 100 %.

## 2. Estado actual del multiverso (qué ya existe)

| Dimensión | Archivo | Esquema | Contenido |
|---|---|---|---|
| `tonavia` | `datos/dimensiones/tonavia.json` | v1 | Todo `maps/*.json` (ids sin barra). Siempre cargada. **No admite** `entrenadores` (conserva los suyos). |
| `nexus` | `datos/dimensiones/nexus.json` | v1 | `maps/nexus/plaza_cruce.json` (plaza provisional con tablón y portal de vuelta). Entrada desde la Ermita (`portal_nexus`, nivel 5). |
| `pirata` | `datos/dimensiones/pirata.json` | v4 | Solo el mar: 9 mapas 64×64 (`maps/pirata/mar_*_*.json`) y 3 balizas de prueba. **Sin portal de entrada todavía** (exenta en el contrato, §8). |
| `santuario` | `datos/dimensiones/santuario.json` | v1 | Santuario Universal (v2.364). `maps/santuario/umbral.json` es su único mapa de archivo; el hogar de cada jugador lo GENERA `src/santuario.js` desde su id (`santuario/hogar_…`) y su contenido son datos (`datos/santuario.json`). Entrada desde el Nexus (`portal_santuario`, nivel 8, puerta provisional). Contrato: `19_SANTUARIO_ETAPA_A.md`. **No se le añaden mapas a mano.** |

**Aportes al Santuario (v2.367):** una dimensión nueva puede ofrecer instalaciones al hogar de cada jugador SIN tocar código: añade una entrada en `datos/santuario.json` con `origen` (tu dimensión), `req` (al menos un hito tuyo: `marca` de tu dimensión) y un efecto existente. Contrato, reglas y plantilla: `21_SANTUARIO_APORTES.md` §5. Los hábitats nuevos esperan a tener casillas u objetos propios.

Orden de creación acordado después de F8: Chuches → Isla Pirata → Cerezo, y después el crafteo. **No existe todavía** ningún contenido de esas dimensiones.

## 3. Convenciones y formatos

### 3.1 Ids y archivos
- Dimensión: `[a-z][a-z0-9_]{0,23}`; el archivo `datos/dimensiones/<id>.json` se llama como el id. `tonavia` está reservado.
- Mapa de otra dimensión: id `<dim>/<nombre>` con `<nombre>` en minúsculas, dígitos y `_`; archivo `maps/<dim>/<nombre>.json`. El id DEBE empezar por el nombre de la carpeta (build.js lo comprueba). Un id **sin barra** es siempre de Tonavia. `tonavia/x`, `x/` y `/x` no valen.
- JSON con sangría de 1 espacio (`JSON.stringify(x, null, 1)`). Los mapas se guardan **sin salto de línea final** (convención del editor y de `componer_mapa`). Las claves que empiezan por `_` son comentarios y no viajan al juego.

### 3.2 Dimensión (`datos/dimensiones/<id>.json`)
Contrato completo: `06_ESQUEMA_DIMENSION.md`. Resumen verificado:

| `v` | Claves que añade | Detalle |
|---|---|---|
| 1 | `id, nombre (1-60), entrada {mapa, ancla}, regiones [], reglas {ciclo:'global'}` | `entrada.mapa` debe ser de la dimensión y tener esa ancla |
| 2 | `apariciones`, `nivel`, `economia` | `13_GANCHOS_F6.md` §1 (rareza, multiplicador por línea, nivel base por región, premios/precios) |
| 3 | `entrenadores` | `14_ENTRENADORES_F7.md` §1 (hasta 48 autónomos + 16 fijos; grafo propio; solo fuera de Tonavia) |
| 4 | `navegacion` | `15_NAVEGACION_FN.md` (mar 3×3, barco, puntos, rutas, mareas, eventos) |

Usa la `v` MÁS BAJA que cubra lo que declaras (una clave de una versión mayor se rechaza). Un `v` mayor que el que entiende el juego = dimensión futura (inválida). Toda región que declare un mapa debe estar en `regiones`.

### 3.3 Mapa (formato 2)
Claves, en el orden en que las escribe el editor: `formato:2, id, nombre, region (o null), mar?:true, tema?, ancho, alto, base?, capas:{suelo:[filas]}, colision?, objetos:[], animar, anclas:{}, puertas:[], conexiones:{norte,sur,este,oeste}, zonas:[], npcs:[], pesca?:[]`.
- `capas.suelo`: exactamente `alto` filas de exactamente `ancho` caracteres, todos de las **17 casillas** (símbolos estables, jamás se renumeran): transitables `. f g = s c b d _`; sólidas `t ~ r l # h m x` (`~` es agua; en mapas `mar:true` la colisión se INVIERTE: solo `~` se cruza).
- `objetos`: `{tipo, x, y, …}` con `tipo` del catálogo `G.capas.OBJETOS` (hoy 78: `node -e "console.log(Object.keys(require('./tools/_cargar.js')().capas.OBJETOS).join(' '))"`). La huella de cada objeto debe caber en el mapa. Un tipo nuevo exige código (registrar en `capas`) = módulo de contenido (§7), no se inventa en el JSON.
- `anclas`: `{nombre: [x, y]}`; no pueden estar sobre una casilla sólida (salvo `npc`). Todo mapa de entrada necesita `inicio` (el editor y el juego lo usan) y, si hay portal, el ancla a la que apunta.
- `puertas`: `{id, x, y, destino:{mapa, ancla}, portal?}`; la casilla no puede ser sólida; `destino.mapa` y `destino.ancla` deben existir. `ancla:'volver'` = salir por la puerta de la que se entró (pila `j.volver`). **No pongas `dim`**: la dimensión sale del prefijo del id.
- `conexiones`: bordes `{mapa, desplazamiento}` o `null`; el vecino debe existir. Un mapa de mar conecta con sus 4 vecinos del mosaico.
- `zonas` (aparición de criaturas): `{id, x, y, w, h, elemento, …}` dentro del mapa, con al menos una casilla libre y un `elemento` que exista. **Prohibidas en mar.**
- `npcs`: `{id, x, y, tipo:'npc'|…, nombre?, dir?, alcance?, dy?}`; un `npc` bloquea su casilla. `pesca`: `{id, x, y, mira}` con `mira` ∈ up/down/left/right y la casilla frontal de agua (`~`).
- Interiores: transitables al 100 %, pasillos ≥ 1 casilla, casilla `anclas.npc` para el NPC de servicio (norma de `CLAUDE.md`).

### 3.4 Portales y requisitos
Un portal = una puerta con `portal: { color:'#rrggbb', icono?, nombre?, requisitos?: [...] }` (máx. 8 requisitos; TODOS deben cumplirse). Tipos (`src/portales.js`, `REQ`):

| `t` | Campos | Se cumple si… | Quién lo verifica |
|---|---|---|---|
| `nivelEntrenador` | `n` 1..50 | nivel de entrenador ≥ n | su móvil **y el anfitrión** (con lo que el jugador declara) |
| `marca` | `dim, k:'modulo.clave', n?, texto?` | la marca vale ≥ n (1 por defecto) | idem |
| `casco` | `n` 1..9, `dim?` | el casco del barco en esa dimensión ≥ n | idem |
| `marea` | `estado:'baja'\|'alta', dim?` | la marea del reloj común es ese estado | idem (estado común) |
| `profundidad` | `n` 1..999 | tu récord de Profundidades ≥ n | **solo personal (Santuario, v2.367): NO vale en un portal** (el validador lo rechaza) |

Un tipo desconocido se rechaza al validar; un requisito mal formado CIERRA el portal. Para marcas: el módulo debe estar registrado (`G.marcas.registrar('modulo', {validar(clave, valor)})`, una vez por módulo).

### 3.5 Multijugador (lo que el contenido debe saber)
- Cada móvil manda SU jugador; el anfitrión (Oli) manda la población de entrenadores. Los **requisitos de portal personales** (nivel, marca, casco) se comprueban en los dos móviles: el otro jugador declara su progreso con el mensaje `prg` (lo hace `red_peer.js` solo) y el anfitrión lo usa; sin declaración, el portal se cierra.
- Un portal solo puede cruzarse desde una puerta real, junto a ella, y apareciendo junto al ancla de destino (≤ 3 casillas); si diseñas un destino, pon el ancla donde tenga sentido caminar. `volver` vale apareciendo junto a la puerta de ida del mapa de destino.
- Consecuencia práctica: **toda puerta entre dimensiones debe tener ida y vuelta** (el contrato de `test.js` lo exige, §8).

### 3.6 Guardado y límites que el contenido no debe superar
Contrato: `16_RED_LIMITES_F8.md`. Cifras vigentes (medidas): población ≤ 128 entrenadores y ≈ 16 KB por entrenador como techo de validación (real: 0,5 KB al nacer, ≈ 4,3 KB tras horas); sección `est.dim[id]`: población ≤ 1,5 MB y el resto (jugadores, marcas, navegación) ≤ 250 KB; total de dimensiones ≤ 3,5 MB; ≤ 256 secciones. Las marcas: ≤ 256 por jugador y dimensión, valor 1..1.000.000. Si no cabe en el navegador, el juego quita las poblaciones (renacen) y avisa; **nunca** el progreso del jugador. Si tu contenido necesita más, es una petición al núcleo (§10).

## 4. Mosaico y estructura de mapas de mar (FN)
- **Mar = mosaico 3×3 de mapas 64×64** con `"mar": true`, ids `<dim>/mar_<fila>_<col>` (`mar_0_0` … `mar_2_2`), centro `mar_1_1` con ancla `inicio`. Se crea con `node tools/crear_mar.js <dim>` (no pisa los que ya existen; las islas se dibujan después sobre esos mismos archivos). Solo en dimensiones que no son Tonavia.
- Coordenadas globales del mar (rutas, niebla): casilla global = `columna·64 + tx`, `fila·64 + ty` (mosaico de 192×192). `puntos[i]` usa `mapa + tx, ty` locales; `rutas[i].puntos` son casillas globales.
- Dibujar tierra (islas, costas) en un mapa de mar = escribir casillas no-`~` en `capas.suelo` y objetos; lo no-agua bloquea al barco. Todo punto y toda ruta deben quedar sobre agua; cada ruta debe tardar entre 15 y 35 s (mín. con las velas máximas, máx. con las básicas). Lo comprueba `validar_dimension`.
- **Muelle = puerta tierra↔mar.** Tierra→mar: puerta del mapa de tierra con `destino:{mapa:'<dim>/mar_f_c', ancla:'muelle'}`; el mar necesita esa ancla y el barco amarrado a ≤ 3 casillas de ella («Aún no tienes barco» / «Tu barco no está aquí»). Mar→tierra: puerta en el mapa de mar hacia un ancla de tierra (desembarco). El modelo ejecutable es `tools/prueba_cruce_mar.js`: léelo antes de dibujar un muelle.
- El primer barco lo da el contenido con `G.navegacion.amarrar(est, j, {mapa, tx, ty})` desde un módulo (orden registrada con `G.motor.ordenes.registrar('modulo.accion', …)`); mejoras con `G.navegacion.mejorar(est, j, parte, nivel)`. Las partes y máximos salen de la dimensión (`navegacion.barco`).
- HD-2D cae a 2D en el mar (límite conocido). Estado del barco por jugador: `est.dim.<dim>.jugadores.<id>`.

## 5. Particularidades de Isla Pirata
- Dimensión ya registrada (`pirata`, v4, `entrada` = `pirata/mar_1_1 › inicio`). Pendiente de contenido: **portal de entrada** (cuando exista, quitar `pirata` de `SIN_PORTAL` en `test.js`, §8), islas, muelles, astillero, cartas, eventos.
- Mientras no haya portal se prueba con `?mapa=pirata/mar_1_1`.
- La entrada natural es por tierra: crear un mapa de muelle/puerto (`pirata/puerto`…) como `entrada` de la dimensión, y dar un portal desde el Nexus hasta él; el mar se alcanza luego desde el muelle. Si cambias `entrada`, mantén el ancla y revalida.
- Los 3 puntos `baliza_*` y 3 rutas de `pirata.json` son de PRUEBA: sustitúyelos por los reales sobre agua (los tests de FN usan los actuales: si los cambias, actualiza esos tests y anótalo).
- Mareas (`navegacion.mareas.baja` = tramos de hora), eventos (cofre, botella, remolino, ballena, rival, tormenta) y `travesia` se declaran en datos; los eventos se generan por hash (no gastan azar).

## 6. Procedimiento: incorporar una dimensión nueva sin romper las existentes

```
node tools/nueva_dimension.js <id> "<Nombre>" [--mar] [--desde <mapa_de_vuelta>]
```
Crea el esqueleto desde `plantillas/dimension/` (no toca archivos existentes; rechaza ids repetidos o inválidos): `datos/dimensiones/<id>.json` y, o bien `maps/<id>/entrada.json` (tierra), o bien el mosaico `maps/<id>/mar_*.json` (con `--mar`, esquema v4, entrada `mar_1_1`). `node tools/prueba_dimension_nueva.js [--completa]` ejecuta este mismo procedimiento sobre una copia temporal y demuestra que Tonavia no cambia.

Orden de trabajo (cada paso termina con su comprobación; no sigas con una en rojo):
1. **Esqueleto:** `nueva_dimension.js` → `node tools/validar_dimension.js <id>` (OK).
2. **Datos de la dimensión:** `regiones`, y las claves de la versión que necesites (`apariciones`/`nivel`/`economia`, `entrenadores`, `navegacion`) subiendo `v` lo mínimo. Valida otra vez.
3. **Mapas:** dibuja con el editor (`node tools/editor_mapas.js` → abre `tools/editor_mapas.html`; ahora lista y edita también `maps/<dim>/`; guarda idéntico lo que no tocas) o con `tools/componer_mapa.js` (terreno 2D por receta, `docs/GUIA_TERRENOS.md`). Mapas de mar: sobre el mosaico creado.
4. **Puerta de ENTRADA:** añade una puerta con `portal` en un mapa EXISTENTE que lleve a `<id>/…` (p. ej. el Nexus real), y la de VUELTA (`ancla:'volver'`) en el mapa de llegada. Es la única modificación de un mapa que no es tuyo; hazla mínima. Sin esta puerta el contrato de `test.js` falla (a propósito).
5. **Entrenadores / marcas / órdenes / objetos** (si los hay): en módulos de contenido, §7. Entrenadores: se declaran en datos (v3); nacen solos al entrar el primer jugador.
6. **Empaquetar y probar:** `node build.js` → `node test.js` (todo verde, incluido el contrato por dimensión de §8) → `node tools/huella_juego.js --comprobar` y `--clasico --comprobar` (**iguales**: una dimensión nueva no cambia Tonavia) → pruebas de navegador (`python3 tools/prueba_navegacion.py` si hay mar; captura 390×844 caminando la dimensión) → `node tools/validar_mundo.js`.
7. **Documentar:** entrada en `docs/SESION.md` (qué, qué se probó, qué queda) y, si tocas contratos, su `.md`.

## 7. Orden de incorporación de scripts, datos y recursos
- **Datos** (`datos/`, `maps/`) se leen solos: `build.js` mete `maps/*.json` en `G.MAPAS` y cada `maps/<dim>/` como UN texto JSON en `G.PAQUETES[dim]` (se analiza solo al entrar un jugador); `datos/*.json` y `datos/dimensiones/*.json` en `G.DATOS`. No hay lista que mantener.
- **Código** de contenido: crea `src/<modulo>.js` y añádelo a `src/orden.json` (una sola lista, la leen `build.js`, `test.js` y las herramientas), en `juego` y **antes de `src/game.js`**, después de lo que usa (p. ej. tras `portales.js`, `marcas.js`, `navegacion.js`, `agentes*.js`). Los pintores (2D y clásico) y la UI van después de la lógica.
- Secuencia típica de un módulo: (1) `G.marcas.registrar('modulo', …)`; (2) `G.motor.ordenes.registrar('modulo.accion', {validar, aplicar})` (el tipo lleva punto; un módulo que falla no tira el juego); (3) piezas nuevas con `G.capas.registrar`; (4) estado en `est` con versión y serialización por el mecanismo existente (marcas, `est.dim`), nunca por `localStorage` propio.
- **Recursos gráficos/sonoros:** generados por código (sin descargas pesadas). Cada efecto visual nuevo va en los dos pintores (2D clásico y HD-2D) o se anota como pendiente.
- Tope de peso: `dist/criaturas.html` < 3.200.000 caracteres (medido: base 2.383.000; cada mar 3×3 vacío añade ≈ 46 KB; 315 KB de mapas extra no cambian el arranque medible). Si lo superas, mide y propón subirlo; no recortes funcionalidad.

## 8. Validadores y pruebas (qué ejecutar y qué comprueba)

| Comando | Comprueba |
|---|---|
| `node tools/validar_dimension.js [id…]` | esquema, mapas de la dimensión, entradas, puertas, bordes, zonas, pesca y (mar) mosaico/puntos/rutas/tiempos. Una línea `OK`/`FALLA`, código 1 |
| `node tools/validar_mundo.js` | grafo de Tonavia (`datos/mundo.json`) |
| `node tools/componer_mapa.js --comprobar` | las recetas de `plantillas/` reproducen sus mapas (transitables, deterministas) |
| `node tools/nueva_dimension.js …` / `prueba_dimension_nueva.js` | el procedimiento de §6 |
| `node tools/prueba_cruce_mar.js` | cruce tierra↔mar por puertas reales |
| `node test.js` | todo lo anterior + **contrato por dimensión** (abajo) |
| `node tools/huella_juego.js --comprobar` (y `--clasico`) | que lo dibujado/estado de Tonavia no cambia |
| `tools/prueba_*.py` | navegador (necesita Playwright; PeerJS/Three.js reales requieren acceso a cdnjs) |

**Contrato por dimensión** (bloque «F8 CONTRATO DE DIMENSIÓN» de `test.js`, se aplica solo a TODA dimensión de `D.lista()`): esquema y mapas pertenecientes; validador del mundo; entrada existente; todos los portales con formato válido; al menos una puerta de entrada desde otra dimensión; guardar/cargar con un jugador dentro (y su población, si tiene); **ida y vuelta por cada portal** en solitario (con barco amarrado si el destino es mar) y en **multijugador** (el anfitrión rechaza sin progreso declarado y acepta con él).
- `SIN_PORTAL` (en ese bloque) lista las dimensiones aún sin puerta de entrada (hoy `['pirata']`). Cuando añadas el portal de una, **quítala** de la lista. Una dimensión nueva que no esté ahí y no tenga portal hace fallar el test (a propósito).
- Tests que dependen de listas concretas: «F3 registro» comprueba que las tres primeras son `tonavia, nexus, pirata` (las nuevas van detrás, orden alfabético); «hd2d» limita el peso de `dist`. Si un test antiguo cuenta cosas que tu contenido cambia legítimamente (objetos de Albanota, balizas de `pirata`), actualiza el número en el test y anótalo en `SESION.md`; nunca lo desactives.

## 9. Errores frecuentes
- `portal.color debe ser #rrggbb`: usa 6 dígitos (`#88aadd`), no `#8ad`.
- Puerta con `dim:`: sobra, la dimensión sale del prefijo del id.
- Portal directo de tierra a un mapa de mar: exige barco amarrado junto al ancla; el normal es tierra → muelle (tierra) → mar.
- Id de mapa sin el prefijo de su carpeta: `build.js` se niega a empaquetar.
- Zona de aparición en un mapa de mar: prohibido.
- Subir `v` más de lo necesario o declarar `entrenadores` en `tonavia`: se rechaza.
- Entrenadores: el grafo propio debe ser conexo (todo pueblo/ruta alcanzable desde todo pueblo/ruta) y tener ≥ 1 pueblo; los ids del grafo llevan el prefijo de la dimensión.
- Guardar estado fuera de `est` (variables globales, `localStorage` propio): se pierde en red y rompe los guardados.
- Cambiar una huella sin querer: si Tonavia cambia, algo se mezcló. Si es a propósito (lienzos nuevos desplazan los números de serie): `--escribir` y `--clasico --escribir`, y anótalo en `SESION.md`.

## 10. Cuando el contenido necesita algo del núcleo
No edites los archivos de §1 (derecha). Anota en `docs/SESION.md` la necesidad (qué falta, para qué contenido, qué archivo se tocaría) y para ahí; Fable la resuelve y entrega una versión nueva. Intervienen también ante cualquier fallo de guardado, red o rendimiento.

## 11. Lista de comprobación de una entrega de contenido
- [ ] `validar_dimension.js` y `validar_mundo.js` en OK.
- [ ] `node build.js` y `node test.js` en verde (contrato por dimensión incluido).
- [ ] Huellas 2D y clásico iguales (o regeneradas a propósito y anotadas).
- [ ] Cada portal tiene ida y vuelta y se recorrió a mano (captura 390×844 caminando).
- [ ] Peso de `dist` dentro del tope; guardado y carga con un jugador dentro de la dimensión.
- [ ] `docs/SESION.md` actualizado; nada del núcleo modificado.
- [ ] Lo no verificable (red real entre móviles, iPhone) anotado como pendiente físico, nunca como probado.
