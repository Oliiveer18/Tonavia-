# 15 · Navegación marítima (FN) — contrato técnico

Base técnica de la navegación de Isla Pirata (v2.360). Sigue `10_ESTUDIO_NAVEGACION.md` y el plan global. **No hay contenido**: ni islas, ni muelles, ni misiones, ni NPC. El contenido (Sonnet) solo escribe datos y usa la API de aquí.

## Modelo
- **Mar = mosaico 3×3 de mapas 64×64** con `"mar": true` (`maps/<dim>/mar_<fila>_<col>.json`; los crea `node tools/crear_mar.js <dim>`). En `mapas.js` la colisión se invierte: solo `~` se cruza; tierra y objetos bloquean; fuera del borde conectado hay agua. Solo en dimensiones que no son Tonavia y sin `zonas`.
- **El barco es un MODO del jugador**, no una entidad: `navegando(j) = mapa.mar`. La posición navegando es la del jugador. El estado amarrado es un dato (`amarre`). `j.nav` es solo de ejecución (`{acc, rumbo}`), nunca se guarda.
- **Velocidades:** `barco.velocidades[nivel de velas]` = 80 / 110 px/s (a pie: 46). Travesías de 15–35 s (`navegacion.travesia`): el validador exige que cada ruta tarde ≤ máximo con las velas básicas y ≥ mínimo con las máximas.
- **Embarcar/desembarcar por puertas:** `puedeCruzar` (tierra→mar) exige el barco amarrado a ≤ 3 casillas del ancla de destino («Aún no tienes barco» / «Tu barco no está aquí…»; plan B `barco.puerto`). `alCruzar`: mar→tierra amarra donde estaba la puerta; tierra→mar pone `j.nav`. El primer barco lo da el contenido con `G.navegacion.amarrar(est, j, {mapa, tx, ty})`.
- **Rutas de datos (`navegacion.rutas`)**: lista de puntos en casillas globales del mar; sin pathfinding en tiempo real. Bidireccionales. Se inician junto al punto de partida (`radio`) con origen y destino descubiertos. Cualquier tecla cancela; si se atasca (0,5 s sin avanzar) se cancela. Órdenes (registro F6): `nav.rumbo {ruta, hacia}`, `nav.parar`, `nav.faro {destino}`.
- **Faros (`tipo:'faro'`)**: viaje directo, gratuito e inmediato entre faros que ESE jugador ha descubierto, estando junto a uno. El barco va con él.
- **Mareas:** `marea(reloj, dim)` desde el reloj puro (`G.ciclo.AJUSTES`, independiente de `?ciclo=0`). Se usan como condición de puerta con los REQ nuevos `marea {estado, dim?}` y `casco {n, dim?}` (`portales.js`). No tocan colisiones.
- **Eventos marinos:** `plan(semilla, mapa, ventana, ev)` solo usa `G.hash` (FNV-1a) sobre (semilla, mapa, ventana, n): **no gasta `est.rnd`**. Tipos: cofre/botella (se cobran al acercarse, una vez, en `cobros`; `brillos` opcionales), remolino/ballena/rival (aviso), tormenta (si `casco` < exigido, vuelve al puerto más cercano).
- **Descubrimiento y niebla** por jugador, radio `vision[catalejo]`, cada 0,25 s. Niebla: 24×24 celdas de 8×8 casillas, cadena base64url de 96 letras.

## Datos
- Dimensión: esquema **v4**, clave `navegacion` `{mar:{mapas}, barco?, puntos, rutas, mareas?, eventos?, travesia?}` (ver `06_ESQUEMA_DIMENSION.md`). `barco` por defecto: velocidades [80,110], máx. casco 2 / velas 1 / bodega 2 / catalejo 2, visión [6,9,12].
- Guardado: `est.dim.<dim>.jugadores.<id> = {casco, velas, bodega, catalejo, cos?, amarre?, desc?, niebla?, cobros?}` con `v:1`. `v>1` (futuro) no se lee ni se pisa. Se valida al cargar (`alRestaurar`): niveles, ids, amarre y claves hostiles se recortan.
- Entregado: dimensión `pirata` (solo alcanzable por la orden `colocar`; no hay portal aún), 9 mapas de agua, 3 balizas de prueba y 3 rutas.

## Red (mensaje de jugador, versión 2)
**Compatibilidad exigida por el estudio (10, §62):** versión 2 «con validación estricta y compatibilidad con la versión 1»: el código NUEVO entiende v1 y v2. Garantizado y probado con la `red.js` antigua real (`tools/fixtures/red_v1_v2359.js`): a pie, el mensaje nuevo es byte a byte el v1 y ambos clientes se aceptan; navegando, el cliente antiguo rechaza el mensaje sin romperse ni desconectarse (`red_peer` ignora lo rechazado) y deja al jugador quieto en su última posición. **No es posible mostrarlo a un cliente v1:** aunque el mensaje se etiquetara v1, el cliente antiguo no tiene los mapas de `pirata/` y lo rechaza igualmente (se probó). Ambos móviles cargan el mismo HTML, así que solo ocurre con una copia antigua en caché. `red.VERSION = 2`. Navegando, `resumen` emite `v:2` + `nav:{c,v,k?}` (casco, velas, cosmética); en tierra emite **exactamente** el `v:1` de siempre. `aplicar` acepta v1 y v2; se rechazan: `nav` en v1, `nav` mal formado o fuera de rango, `nav` en mapa que no es mar, `v` ≥ 3. El receptor guarda `j.barcoRed` (se borra al soltar). **Limitación:** un cliente antiguo (v1) ve quieto al jugador que navega (ver arriba).

## Pintado
2D y clásico (`navegacion_ui.js`: barco bajo la persona, niebla, balizas, eventos, panel de rutas/faros). **HD-2D cae a 2D en el mar** (aviso «El mar se navega en 2D por ahora»; precedente `M.prof`). `G.capas.soltar(dim)` libera los fondos horneados de una dimensión descargada (el mar = 9 lienzos de 1024²).

## Cruce tierra↔mar
`node tools/prueba_cruce_mar.js` copia el proyecto a una carpeta temporal, añade un mapa de tierra de prueba y una puerta de agua (no se tocan `maps/` ni `datos/`) y recorre el sistema real de puertas (`motor.cruzar`): sin barco, barco lejos, embarcar, desembarcar, regreso, posiciones, amarre y guardado. No hay muelles definitivos.

## Herramientas
`node tools/crear_mar.js <dim>` · `node tools/validar_dimension.js [dim]` (incluye el mar: mosaico, bordes, puntos sobre agua, rutas sin tierra, tiempos) · `python3 tools/prueba_navegacion.py` (navegador).

## No hecho (reservado)
Islas, muelles, astillero/mejoras, cartas marinas, HD-2D en el mar, red real entre móviles (F8), contenido de eventos.
