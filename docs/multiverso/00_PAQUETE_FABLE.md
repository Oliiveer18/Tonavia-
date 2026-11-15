# PAQUETE DE ENTREGA PARA FABLE 5.2 · MULTIVERSO
Proyecto «Criaturas de Lali y Oli» v2.350 (13 nov 2026). Preparado por Sonnet 5.5. **Se entrega junto con `criaturas_v2_350.zip`.** Este documento es el índice y la hoja de ruta; el detalle está enlazado, no repetido.

## 0. Cómo usar el paquete
| Orden | Archivo | Para qué |
|---|---|---|
| 1 | **este documento** | Qué hacer, en qué orden, con qué criterios |
| 2 | `01_AUDITORIA_TECNICA.md` | Diagnóstico verificado del código (referencias `[V]` verificado, `[P]` parcial, `[N]` no existe, `[?]` no verificado) |
| 3 | `02_REUTILIZACION.md` | Qué hay que reutilizar y qué falta |
| 4 | `03_PROPUESTAS_DATOS.md` | Estructuras de datos **propuestas** (no vinculantes) |
| 5 | `universos/00_comun.md` … `04_dimension_tecnologica.md` | Diseño y catálogo de los 4 universos |
| 6 | `04_DEPENDENCIAS.md` | Qué contenido espera a qué |
Las normas del proyecto están en `CLAUDE.md` (motor puro, estado serializable, jugadores por id, contenido como datos, 2D como base, una sesión = un paso = un ZIP).

## 1. Resumen de la auditoría
Motor puro y determinista (`est` + órdenes + semilla), mapas JSON unidos por nombre, aparición por plan y semilla, entrenadores autónomos por eventos con puesta al día offline, Profundidades como precedente de mundo generado, guardado con sub-versiones, economía y XP de entrenador equilibradas (v2.350). **No existe el concepto de dimensión:** un solo diccionario de mapas, un solo grafo de entrenadores (`datos/mundo.json`), un solo reloj, una población (24) y un tablón. 9 mapas reales; 8 de los 50 planificados en `datos/mundo.json`.

## 2. Problemas críticos que Fable debe resolver
1. **Pérdida de progreso por mapa inexistente** (`guardado.js` ~línea 28, reproducido en ejecución: con Brillos 777 y XP 3000 y mapa inválido, al cargar se pierden). Debe corregirse **antes** de cualquier otra cosa.
2. **Sobrescritura de guardados ilegibles/futuros** por el autoguardado de 5 s; falta copia de seguridad y migración real (`migrar` no hace nada).
3. **Nada se descarga:** `est.mapas` solo crece; todos los mapas se preparan al arrancar.
4. **Entrenadores atados a un grafo único** (`agentes.js`, `W`): hay que generalizarlo por dimensión **sin reconstruir el sistema**.
5. **Nivel de las criaturas salvajes solo depende de la rareza** (`G.nivel.nivelSalvaje`): no hay dificultad por región/dimensión.
6. **Contenido en código** que bloquea «añadir dimensiones sin tocar el núcleo»: guiones de NPC (`npc.js`), luz por región (`capas.js`), temas de terreno (`terreno.js`, solo Carbuna).
7. **Nombres a fuego** `oli`/`lali` en `motor.crear`, `red_peer.js` y otros: no contagiar la lógica nueva.

## 3. Arquitectura recomendada (resumen; detalle en auditoría §7)
Dimensiones como **datos** (`datos/dimensiones/<id>.json`) + estado `est.dim[id]` + proveedores de mapas con carga/descarga + simulación latente (puesta al día) + portales como puertas con `destino.dim`. La dimensión original pasa a ser `tonavia` **sin cambiar ids ni la huella del juego**. El Nexus es una dimensión más. Sin servidor ni reescritura del motor.

## 4. Sistemas existentes (reutilizar), a modificar y nuevos
**Reutilizar:** `G.motor.aplicar` y órdenes · `G.mundo` · `G.aparicion` · `G.agentes` (núcleo, `ponerAlDia`, forma «entrenador = jugador») · `G.profundidades` (modelo de mundo generado) · `G.guardado` (validadores) · `G.red`/`agentes_red` · `G.ciclo` · `G.tienda`/`G.entrenador`/`G.tablon` · compositor de mapas y editor · `tools/huella_juego.js` y `test.js`.
**Modificar:** `guardado.js`, `mapas.js`, `motor.js`, `aparicion.js`, `agentes*.js`, `npc.js`/`dialogo_ui.js`, `capas.js`/`luces2d.js`/`audio.js`, `red.js`/`red_peer.js`, `tienda.js`/`tablon.js`, `nivel.js` (nivel base por región).
**Nuevo:** `G.dimensiones` (registro, esquema, validador), cargador/descargador de mapas y estados, portales y requisitos, tabla de apariciones por dimensión, `est.dim` y guardado por secciones (v2), migración v1→v2, `tools/validar_dimension.js`, pruebas de contrato.
Ver tablas completas en la auditoría §8.2-8.4.

## 5. Responsabilidades exactas
**Fable (ingeniería):** todo lo de arriba «Modificar» y «Nuevo», el contrato de datos, los motores de tablas de aparición/eventos/actividades/portales, la migración de guardado, el rendimiento y las pruebas. Es dueño de `guardado.js`, `mapas.js`, `motor.js`, `aparicion.js`, `agentes*.js`, `red*.js`, `nivel.js` y del esquema de `datos/dimensiones/`. Contenido mínimo propio: un Nexus y una dimensión de prueba.
**Sonnet (contenido, después del contrato):** mapas, interiores, piezas decorativas, temas de terreno, NPC y guiones, nombres/frases de entrenadores, tablas de aparición, actividades y eventos, peces y materiales, criaturas nuevas opcionales, ambientación e integración visual en 2D y HD-2D, equilibrio con `equilibrio.js`.
**Regla:** Sonnet no toca los archivos de Fable; si necesita algo del núcleo lo anota en `docs/SESION.md`. Fable no inventa contenido de juego. Ninguno reimplementa sistemas del otro.

## 6. Diseño de los primeros universos (resumen)
| Universo | Idea | Regiones | Mapas | Dificultad (propuesta) | Pesos de rareza |
|---|---|---|---|---|---|
| **Nexus** | Hub seguro sin combate: portales, Centro PC, mercado, tablón | 1 (El Cruce) | 5 | — | — |
| **Reino de las Chuches** | Reino de golosinas; misión «La Receta Real» | 4 | 14 | 8-22 | 62/28/10 |
| **Mundo Salvaje** | Naturaleza sin domar: captura, pesca, exploración, ciclo día/noche | 4 | 14 | 12-30 | 50/32/14 |
| **Dimensión Tecnológica** | Ciudad-circuito retrofuturista; combate; «Restaurar el Núcleo» | 4 | 14 | 22-42 | 55/30/12 |
Las criaturas **no se limitan al tema:** cada zona usa multiplicadores sobre las 20 líneas actuales (lo no nombrado = ×1; 0 solo si se excluye a propósito). Las 4 fichas tienen tablas completas.

## 7. Contenido preparado y pendiente
- **Preparado (en papel):** diseño completo de las 4 dimensiones, catálogo de ≈47 mapas con tipo/tamaño/plantilla, NPC con rol, misiones/eventos, comercio y tablas de aparición por zona, estructuras de datos propuestas.
- **Pendiente (A, puede empezar ya):** crear los mapas con el formato actual, piezas temáticas, temas de terreno, aspectos de NPC.
- **Pendiente (B):** todo lo que depende del contrato; **(C):** lo que depende del motor funcionando. Ver `04_DEPENDENCIAS.md`.

## 8. Orden de implementación recomendado (Fable)
1. **Seguridad del guardado** (problemas 1 y 2) + pruebas.
2. `VERSION 2` y migración v1 → v2 (todo en `tonavia`, huellas iguales).
3. Registro y esquema de dimensiones + validador; `tonavia` declarada por datos.
4. Proveedores de mapas, ids con espacio de nombres, carga y descarga.
5. `j.dim`, portales, Nexus mínimo de prueba. *Aquí Sonnet puede empezar la fase B de contenido.*
6. Apariciones por dimensión y nivel base por región.
7. Entrenadores por dimensión + puesta al día de dormidas.
8. Economía por dimensión; luz/música/tema por región; guiones a datos.
9. Preparación de red (`dim` en mensajes, jugadores por id).
10. Rendimiento, límites y cierre de pruebas.

## 9. Pruebas y criterios de aceptación
Regresión: `node build.js` → `node test.js` (121 grupos, hoy solo pasa todo) → `node tools/huella_juego.js --comprobar` y `--clasico --comprobar` **iguales** → pruebas de navegador. Criterios:
- **Guardado:** guardado v1 se migra sin pérdida; un mapa/dimensión inexistente no pierde progreso; versión futura o archivo corrupto no sobrescriben; ida y vuelta serializar-restaurar conserva el hash; tamaño por dimensión acotado.
- **Dimensiones:** el validador rechaza datos rotos; los ids con espacio de nombres no chocan con paquetes del editor; carga y descarga conservan lo que difiere del plan; el plan es determinista por dimensión y `tonavia` queda idéntica.
- **Portales:** requisitos, ida y vuelta, `volver`, jugador en dimensión descargada.
- **Apariciones:** pesos multiplicativos; ninguna línea desaparece sin exclusión explícita; `MAX_IGUALES` respetado; reproducible con semilla.
- **Entrenadores:** población por dimensión; puesta al día de dormidas; conservación de criaturas (fuzz como el del tablón); determinista.
- **Economía:** precios y premios por dimensión sin regalar (tabla v2.350 y `tools/equilibrio.js`).
- **Rendimiento:** coste de simulación y guardado con N dimensiones; medir en móvil real (hoy **[?]**).
- **Red:** mensajes con `dim` validados; dos clientes en dimensiones distintas.
- **Contenido:** los mapas de las fichas pasan `validarMapas`; las tablas de aparición se convierten sin error.

## 10. Reglas que se han respetado en esta preparación
No se ha tocado código ni datos del juego; no se han rediseñado sistemas existentes (entrenadores autónomos incluidos); lo no verificado está marcado `[?]`; las estructuras de datos son propuestas, no contrato.
