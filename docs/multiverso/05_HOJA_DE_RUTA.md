# MULTIVERSO · HOJA DE RUTA OFICIAL (aprobada por el usuario, 13 nov 2026)
**Diseño de dimensiones: aprobado (`09_DISENO_MULTIVERSO.md`). Plan global aprobado (`12_PLAN_GLOBAL_IMPLEMENTACION.md`, 14 nov 2026). Orden: F6 → F7 → FN → F8.** Estudios: navegación `10`, crafteo `11` (etapa posterior, aún sin decidir).
No se trabaja en paralelo: primero Fable termina F1-F8; después Sonnet continúa con el contenido. Cada entrega = un ZIP, y no se pasa a la siguiente hasta cumplir sus criterios (build → `test.js` → huellas 2D y clásico iguales → pruebas de navegador).

## Decisiones aprobadas
1. Tablón **global**, con sede en el mercado del Nexus (sigue funcionando en la Tienda de Albanota).
2. Entrada al Nexus desde la **Ermita**, con nivel 5 de entrenador, configurable por datos.
3. **Un único reloj** día/noche para todas las dimensiones.
4. `dim` ausente en un jugador = `tonavia` (así la huella de estado no cambia).

## Entregas de Fable (ingeniería del núcleo)
| # | Entrega | Estado |
|---|---|---|
| F1 | Seguridad del guardado | **Hecha (v2.351)** |
| F2 | Guardado v2, migración v1→v2, `est.dim` por secciones | **Hecha (v2.352)** |
| F3 | Registro de dimensiones, esquema, validador; `tonavia` por datos | **Hecha (v2.354)** · esquema en `06_ESQUEMA_DIMENSION.md` |
| F4 | Proveedores de mapas, ids `dim/mapa`, carga/descarga, empaquetado bajo demanda; **persistir la semilla** | **Hecha (v2.355)** · decisiones y contrato en `07_CARGA_DIMENSIONES.md` |
| F5 | Portales con requisitos, transiciones, Nexus técnico (un mapa de prueba), tablón global | **Hecha (v2.356)** · contrato y decisiones en `08_PORTALES.md` |
| F6 | Ganchos de contenido: apariciones con multiplicadores, nivel base por región, factor de economía por dimensión, marcas de progreso guardadas, registro de órdenes para módulos de contenido. **Ampliación aprobada (necesaria para FN y el crafteo):** (1) el registro de órdenes admite módulos con acceso al estado y validación propia; (2) las marcas de progreso se guardan por jugador en `est.dim.<dim>` con validador por módulo; (3) los requisitos de portal (`REQ`) reciben `est`. Debe caber en el tope vigente de `dist` (2.300.000) o se detiene y se consulta | **Hecha (v2.357), pendiente de aprobación** · contrato en `13_GANCHOS_F6.md` |
| F7 | Entrenadores por dimensión + puesta al día de las dormidas; **investigar el test intermitente de agentes (ya fallaba en v2.350)** | **Hecha (v2.358), pendiente de aprobación** · contrato en `14_ENTRENADORES_F7.md` (causa del intermitente en su §7) |
| FN | **Navegación (núcleo)** de la Isla Pirata, según `10_ESTUDIO_NAVEGACION.md` (recomendaciones aprobadas): mapas de mar (mosaico 3×3 de 64×64), modo navegación del barco, estado de barco y descubrimiento en `est.dim.pirata`, rumbo automático por rutas marcadas, faros-baliza, eventos del mar deterministas, validador y pintado mínimo en **2D y clásico** (HD-2D solo si es viable, sin ampliar el alcance). Depende de F6 (no de F7) | pendiente |
| F8 | Red (`dim` en mensajes; **+ campos del barco en el mensaje, `red.js` v2**), rendimiento (incluido el mar), límites y paquete de transferencia (incluye lo necesario para el contenido del mar) | pendiente |

**Dependencias:** F7 ← F6 · FN ← F6 (también usa F4 y F5) · F8 ← F7 y FN · contenido ← F8 · crafteo (`11`) ← F6 y F8, tras el contenido de las dimensiones. **Peso:** se mide al cerrar F6; el tope de `dist` no se cambia sin decisión del usuario. **Pruebas en iPhone real:** las hace el usuario con las versiones entregadas (necesarias antes de cerrar FN y F8). Los fallos SIN VERIFICAR del plan se investigan antes de darlos por defectos.

## Trabajo de Sonnet (después de F8)
Luz, música y tema por región leídos de datos (`capas.js`, `luces2d.js`, `audio.js`, `terreno.js`) · guiones de `npc.js` a datos y guiones nuevos · mapas del Nexus y de los tres universos · tablas de aparición · valores de economía y tiendas · nombres y frases de entrenadores · eventos, actividades y misiones sobre los ganchos de F6.
Orden recomendado: guiones a datos → luz y música → Nexus real → universos (Chuches → Isla Pirata → Cerezo) → eventos y misiones. Después, el crafteo según `11`.

## Qué recibirá Sonnet (se entrega en F8)
`datos/dimensiones/<id>.json` (esquema versionado) · mapas en el formato actual con id `dim/mapa` · `node tools/validar_dimension.js <id>` · plantilla y dimensión de prueba · pruebas de contrato en `test.js` que se aplican a toda dimensión nueva · `docs/multiverso/GUIA_CONTENIDO.md`.

## Punto de transferencia
Al cerrar F8 con: `test.js` completo, huellas iguales, un guardado v1 real migrado sin pérdida, dimensión de prueba recorrida ida y vuelta por portal, validador y guía entregados.
Después Fable solo interviene si Sonnet anota en `docs/SESION.md` una necesidad del núcleo o aparece un fallo de guardado, red o rendimiento. Sonnet no toca `guardado.js`, `mapas.js`, `motor.js`, `aparicion.js`, `agentes*.js`, `red*.js`, `nivel.js` ni el esquema de dimensiones.
