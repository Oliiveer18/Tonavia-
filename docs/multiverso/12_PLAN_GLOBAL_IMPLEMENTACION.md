# PLAN GLOBAL DE IMPLEMENTACIÓN (propuesta para aprobar)
**Estado: APROBADO (14 nov 2026).** Solo organiza lo ya estudiado (`05`, `09`, `10`, `11`). No se ha tocado código, mapas, documentos existentes ni la hoja de ruta, y no se abre ninguna entrega. «FN» y «C0-C6» son las entregas ya nombradas en `10` y `11`; aquí no se crean fases nuevas. Fuentes de los defectos: lectura del código y de `docs/SESION.md`; lo que no he podido verificar está marcado.

## 0. Lo que doy por resuelto (no se vuelve a preguntar)
- **Diseño** `09`: D1-D12 aprobadas. **Pendientes de decidir al preparar el contenido de cada dimensión (no bloquean nada):** banda de nivel del Cerezo (18-38 es solo una propuesta, **no aprobada**), rarezas, nº de entrenadores y nombres.
- **Navegación** `10`: adopto sus recomendaciones técnicas (mosaico 3×3 de 64×64; barco = modo del jugador + dato «amarrado»; sección `est.dim.pirata` por jugador; rutas marcadas; faros gratuitos e inmediatos entre faros propios; descubrimiento individual; mareas solo como condición de puerta; eventos por hash; travesías 15-35 s). Todas son **recomendaciones aún no aprobadas por ti**: quedan resueltas *si apruebas este plan*; no hay que contestar una a una.
- **Crafteo** `11`: no hay decisión que cerrar ahora; sus 15 decisiones se toman cuando se abra su etapa (tras las dimensiones). Hoy solo se reservan huecos (§4).
- **Reglas de trabajo** (`05`): Sonnet no toca los archivos del núcleo; Fable no inventa contenido; huellas 2D/clásico iguales salvo cambio justificado; cada entrega = un ZIP con versión nueva.

## 1. Decisiones pendientes imprescindibles (solo 4)
1. **Aprobar el alcance de la hoja de ruta:** insertar **FN entre F7 y F8** (cabe sin reordenar F6→F7→F8) y aceptar las 4 peticiones: a **F6** (registro de órdenes con acceso al estado y validación propia; marcas de progreso por jugador en `est.dim.<dim>` con validador por módulo; `REQ` de portales recibe `est`) y a **F8** (campos del barco en el mensaje de red, `red.js` v2, medir el mar). Tras tu OK, la actualización de `05` la haces tú o me la pides; yo no la toco.
2. **Presupuesto de peso: pendiente de medición, sin límite nuevo.** Dato medido hoy: `dist/criaturas.html` = 2.216.309 B frente al tope actual de `test.js` (2.300.000), con ~84 KB de margen, y aún faltan F6, FN, el crafteo y los mapas de tres dimensiones (que viajan en el mismo HTML). **No se fija ninguna cifra ni solución ahora.** Se decide con dos datos: (a) el peso real tras cerrar F6 (F6 lo mide e informa) y (b) el rendimiento real en iPhone. Hasta entonces F6 debe caber en el tope actual; si no cabe, se para y se consulta.
3. **Alcance de pintado en FN:** 2D y clásico obligatorios (son los de las huellas); HD-2D «cuando se pueda», como ya se hizo con cuevas y luces (que solo existen en 2D). Recomiendo esto; si quieres HD-2D obligatorio, FN crece bastante.
4. **Prueba en iPhone real** (necesaria para decidir el peso, §1.2, y antes de cerrar FN y F8). Depende de ti: ¿puedes probar las versiones que te mande?

*(Menores, no bloquean: ¿Fable puede empezar C0 —análisis sin código— mientras Sonnet hace contenido? Recomiendo que sí.)*

## 2. Orden definitivo propuesto
| # | Entrega | Quién | Entregable clave |
|---|---|---|---|
| 0 | **Aprobación de este plan** + actualizar `05` (línea de estado desactualizada y FN) | tú | plan aprobado |
| 1 | **F6** Ganchos de contenido (+ las 3 peticiones de FN, §1.1) | Fable | apariciones con multiplicadores, nivel base, factor de economía, marcas de progreso, registro de órdenes; medición de peso |
| 2 | **F7** Entrenadores por dimensión + test intermitente de agentes | Fable | poblaciones por dimensión, puesta al día, causa del test intermitente |
| 3 | **FN** Navegación (núcleo) | Fable | mapas de mar, modo navegación, barco/descubrimiento guardados, rumbo, faros, eventos, validador, pintado mínimo |
| 4 | **F8** Red, rendimiento, límites, paquete de transferencia (+ barco en la red, + paquete del contenido de mar) | Fable | `red.js` v2, límites por sección, editor con dimensiones, guía de contenido |
| 5 | **Contenido** Chuches → Isla Pirata → Cerezo (D11) | Sonnet | guiones a datos → luz/música → Nexus real → universos → eventos/misiones |
| 5b | **C0** equilibrio y comprobación del combate cooperativo (solo análisis) | Fable | topes numéricos; respuesta a D15 |
| 6 | **Crafteo C1→C4** (núcleo, consumibles, accesorios, descubrimiento) | Fable | según `11` §10 |
| 7 | **C5** contenido de crafteo por dimensión | Sonnet | `datos/crafteo/<dim>.json` |
| 8 | **C6** extras (herramientas, cápsulas, cebos de pesca) | Fable+Sonnet | según navegación terminada |
Tonavia (6 regiones sin mapas, D12) se diseña después del punto 5, sin bloquear nada.

**Por qué este orden:** F7 no depende de FN y F6 sí es previo a ambas; FN antes de F8 evita rehacer la red y la medición de rendimiento; el contenido de Isla Pirata necesita FN y el paquete completo de F8; el crafteo necesita F6 (órdenes/marcas), F8 (límites del guardado) y se beneficia de que ya existan las dimensiones.

## 3. Dependencias (sin duplicidades ni roturas)
- **F6 ← F5 (hecha).** Aporta: órdenes de módulos, marcas por jugador, `REQ` con estado, multiplicadores y economía por dimensión.
- **F7 ← F6** (nivel base y economía por región). Independiente de FN.
- **FN ← F6, F5, F4.** Usa puertas (subir/bajar), carga por dimensión, `est.dim`; **no** usa nada de F7.
- **F8 ← F7 y FN** (la red lleva el barco y el mar se mide aquí). Cierra límites que F2/F3 dejaron abiertos (tamaño de `est.dim`).
- **Contenido ← F8.** Chuches y Cerezo no necesitan FN; Pirata sí. Si FN se retrasa, se puede adelantar Chuches/Cerezo **solo** con el paquete de F8 listo.
- **Crafteo ← F6, F8**, y necesita antes la decisión de peso (§1.2). Las herramientas de exploración dependen de FN (brújula) y de un sistema de secretos que **ningún plan define todavía** (queda fuera hasta que se diseñe).
- **Hueco que cuesta cero reservar hoy:** al diseñar los mapas de cada dimensión, dejar un solar/ancla para estación y puntos de recolección, para no reabrir mapas después. (Lo anota Sonnet en el contenido; no se hace ahora.)

## 4. Reparto Sonnet / Fable
**Fable (núcleo, nada de contenido):** F6, F7, FN (mapas `mar`, modo navegación, validador, pintado mínimo), F8 y su paquete de transferencia, crafteo C1-C4 y C6-núcleo, ajustes de contrato, guardado/red/rendimiento, arreglo de los defectos de §5. 
**Sonnet (contenido, sin tocar `guardado.js`, `mapas.js`, `motor.js`, `aparicion.js`, `agentes*.js`, `red*.js`, `nivel.js`, esquema de dimensión):** guiones y luz/música a datos, Nexus real, mapas e interiores de las tres dimensiones, tablas de aparición, economía y tiendas, nombres de entrenadores, eventos y misiones, arte final del barco/siluetas/mar, `datos/crafteo/*` (C5).
**Fable libre mientras Sonnet hace contenido (sin interferir):** C0 (análisis), arreglo de herramientas/pruebas (§5), y atender lo que Sonnet anote en `docs/SESION.md`. **No** programa crafteo en paralelo salvo que tú lo autorices (por defecto, tras el contenido).
**Antes de F8 Sonnet no entra** en código ni contenido (`05`); solo documentos si se los pides.

## 5. Problemas técnicos, incompatibilidades y deuda
**Tipo** (tres categorías que no se mezclan):
- **CONFIRMADO:** comprobado leyendo el código o la documentación de contrato; el comportamiento es el descrito.
- **RIESGO:** previsible por el diseño o las cifras, aún no ha ocurrido ni se ha medido.
- **SIN VERIFICAR:** se observó un fallo o hay una duda, pero **no se conoce su origen** (no se afirma que sea defecto).
Nada se resuelve ahora ni se abre entrega de corrección.
### Bloqueantes (impiden avanzar con una entrega concreta)
| # | Problema | Tipo | Bloquea | Se resuelve en |
|---|---|---|---|---|
| B1 | **Peso del HTML:** 2.216.309 B con tope 2.300.000; con lo planificado puede no caber | RIESGO (cifra actual confirmada; que no quepa no está medido) | FN y contenido | medir al cerrar F6 + iPhone; decisión después (§1.2) |
| B2 | **Test intermitente de agentes** («v2.324 … simulación larga»), 1 de 8 ejecuciones, ya en v2.350 (`SESION.md`). Si fuera no-determinismo real afectaría a la red | SIN VERIFICAR (fallo observado, causa desconocida) | aceptación «test.js completo» de F6/FN (se acepta como fallo conocido, §7) y F8 | F7 (previsto en `05`) · **Resuelto en F7 (v2.358): reproducido (1 de 14) y causa confirmada** (caché de casillas que dependía de quién la pedía primero; no era azar del motor), corregido y con prueba que falla con el código antiguo: `14_ENTRENADORES_F7.md` §7 |
| B3 | **No hay registro de órdenes:** `tienda.js` envuelve `motor.aplicar` y `tablon` se cuela por prefijo; FN y crafteo añadirían más envoltorios que dependen del orden de carga | CONFIRMADO (lectura de `tienda.js`/`motor.js`) | FN, crafteo | F6 (ya en su alcance) |
| B4 | **`G.portales.comprobar(j, portal)` no recibe `est`**: no se pueden exigir marcas de progreso ni casco | CONFIRMADO (`08_PORTALES.md`) | requisitos de F6/FN | F6 |
### Previos (corregir antes del sistema que los necesita)
| # | Problema | Tipo | Antes de | En |
|---|---|---|---|---|
| P1 | **`mochilaOk` descarta ids desconocidos** y el catálogo de `tienda.js` está cerrado a 4 objetos y 3 tipos: con contenido por dimensión se perdería progreso | CONFIRMADO (código); la pérdida depende de futuros objetos | crafteo / objetos nuevos | C1 |
| P2 | **`est.dim` sin límite de tamaño** (lo dejó abierto F2) | CONFIRMADO (`SESION.md`) | cargar contenido real | F8 |
| P3 | **El anfitrión no valida cruces de portal** (`cruzar` decide en cada móvil; lo anota `08`) | CONFIRMADO | red con dimensiones | F8 |
| P4 | **`componer_mapa --comprobar` falla en Carbuna**, ya fallaba en la base F1 | CONFIRMADO (observado); origen sin analizar | primer mapa de contenido | F8 (herramientas) |
| P5 | **El editor rechaza portales y ids de otras dimensiones** | CONFIRMADO (diseño de F4/F5) | contenido | F8 (ya en `05`) |
| P6 | **Pruebas de navegador que fallan en este entorno:** `prueba_editor`, `prueba_minimapa`, `prueba_tablon`, `prueba_mapas_juego` (82/83 objetos), `prueba_red`. Se atribuyen a CDN/sin red, pero **no se ha comprobado**; podría haber algún defecto real (p. ej. el objeto que falta) | SIN VERIFICAR | cerrar F8 (red, tablón global) | verificar en un entorno con red al inicio de F8 |
| P7 | **Test «texturas: prueba de Chromium» falla** desde antes de F1 | SIN VERIFICAR (¿entorno o defecto?) | usarlo como criterio de aceptación | diagnóstico rápido al abrir F6 |
| P8 | **¿El combate cooperativo usa criaturas de ambos jugadores?** | SIN VERIFICAR (pregunta abierta) | C3 (accesorios) | C0 |
| P9 | **Sin prueba en iPhone real** de las entregas recientes (solo Node/Chromium) | RIESGO | decidir peso; FN y F8 | tú (§1.4) |
### Futuros (pueden esperar sin afectar al trabajo actual)
- CONFIRMADO: dos pestañas abiertas pueden pisarse el autoguardado (igual desde siempre).
- RIESGO: PeerJS se carga desde un CDN, así que sin red no hay cooperativo (decisión de F8 si se quiere alternativa).
- CONFIRMADO: partes de Tonavia sin terminar (Carbuna sin edificios ni puertas; 6 regiones sin mapas): diseño aparte (D12).
- CONFIRMADO: HD-2D incompleto en varias funciones (cuevas, luces, retícula): solo si se decide hacerlo obligatorio (§1.3).
- CONFIRMADO (documentación): la línea de estado que añadí en `05` está desactualizada y `05` no menciona FN ni el crafteo: se corrige cuando apruebes el plan.

## 6. Riesgos importantes antes de cada entrega
- **F6:** diseñar bien el registro de órdenes y las marcas (de ello cuelgan FN y crafteo); que multiplicadores y nivel base **no cambien** el plan ni los niveles de Tonavia (huellas y balance); que el factor de economía conviva con las fórmulas actuales de `tienda.js` (precios ligados a combates del nivel).
- **F7:** que la causa del test intermitente no sea no-determinismo; coherencia de la puesta al día entre dimensiones.
- **FN:** peso (B1: decidir tras medir F6 e iPhone), rendimiento en iPhone (P9), coherencia barco/jugador al guardar, y que lo nuevo viva en `est.dim.pirata` para no cambiar la huella de Tonavia.
- **F8:** compatibilidad `red.js` v1↔v2, validación en anfitrión (P3), límites (P2), verificar P6 con red real, que el paquete de transferencia incluya lo de mar (mosaico, validador, guía).
- **Contenido:** herramientas de mapa sanas (P4/P5), presupuesto de peso respetado, reservar solares/anclas de crafteo.
- **Crafteo:** P1 (pérdida de progreso), equilibrio con simulación (C0), P8.

## 7. Criterios de aceptación generales (todas las entregas)
1. `node build.js` y `node test.js` completos; los fallos conocidos (B2, P7) figuran por nombre en el informe y **no aparecen otros nuevos**; cada test nuevo cubre funcionamiento, integración, errores y bordes.
2. Huellas 2D y clásico **iguales** (si cambian, solo a propósito y justificado) y `agentes_diag` igual.
3. Un guardado v1 real migra sin pérdida y un guardado nuevo vuelve a cargar idéntico; ningún dato desconocido se borra.
4. Pruebas de navegador a 390×844 de lo tocado; prueba de cruce/ida y vuelta cuando haya dimensiones o mar.
5. Peso dentro del tope vigente (hasta que se decida otro) y rendimiento medido (en iPhone real cuando exista, §1.4).
6. Contrato documentado en `docs/multiverso/` + nota en `SESION.md`; ZIP completo con versión nueva.
7. Informe final: qué se hizo, qué se comprobó, qué queda, clasificado por entrega, **defecto real** o **reservado**, y **límite del entorno**; sin marcar como terminado nada con defectos reales.
8. Nada fuera de alcance; las decisiones que afecten a entregas posteriores se consultan antes.

## 8. Qué necesito de ti para empezar
Tu **OK a este plan** (§1.1 y §2), tu respuesta a §1.3 y si puedes probar en iPhone (§1.4). El peso (§1.2) se decide más adelante, con datos. Después, el primer paso es abrir F6 (con el diagnóstico rápido de P7 y la medición de peso). **No empiezo nada hasta tu aprobación.**
