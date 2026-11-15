# 19 · SANTUARIO UNIVERSAL · ETAPA A (núcleo jugable) · v2.364
Parte de `criaturas_v2_363.zip` (intacta). Concepto: ficha `18`. Aquí solo lo construido y su contrato. **[V]** ejecutado y comprobado · **[?]** sin verificar.

## 1. Qué hay
- Dimensión `santuario` (`datos/dimensiones/santuario.json`). Único mapa de archivo: `maps/santuario/umbral.json` (Guardiana Sela, puerta `hogar`, portal de vuelta).
- Acceso: puerta provisional `portal_santuario` en `nexus/plaza_cruce` (arriba, en el eje), **nivel de entrenador 8** por datos (`portal.requisitos`). El anillo de portales no existe aún y no se toca.
- **Hogar por jugador, generado desde su id**: `santuario/hogar_<nivel>_<claves de hábitat>_<jugador>` (p. ej. `santuario/hogar_1_p_oli`). Sin archivos de mapa por jugador; el mismo id da el mismo mapa en cualquier móvil; si el trazado cambia, cambia el id (no hay cachés viejas).
- Estado: `est.dim.santuario = { v:1, jugadores: { <id>: { n, hab:[tipo…], res:{ <idEjemplar>: hueco } } } }`. Solo asignaciones. 300 residentes = 2,4 KB.
- Residentes = ejemplares de `j.sinId` (ID permanente). No se copia nada. Si el ejemplar sale de la caja (equipo, liberar, intercambio), deja el hogar solo (se revisa cada segundo de juego); `equipo.js`/`tablon.js` no se tocan.
- Órdenes: `santuario.acoger {id,h?}`, `santuario.retirar {id}`, `santuario.mover {id,h}` (solo dentro del hogar propio).
- Comportamiento **sin estado**: función pura de (semilla, ejemplar, `est.reloj`). Tramos de tiempo; en cada uno pasea / descansa / mira / duerme según temperamento (datos: base ← elemento ← línea ← forma) y hora. No se guarda, no gasta `est.rnd`, no necesita puesta al día. Diurnas duermen 21–6 h; nocturnas (sombra) 8–18 h.
- Dentro no se combate ni se captura. Hablar a una residente: se para, te mira y dice qué hace.
- Cuidador Brezo (en cada hogar) abre el panel de residentes. Señal «z z» sobre quien duerme (2D y clásico).
- HD-2D: dentro del Santuario el juego se queda en 2D (aviso). **[?]** no probado en HD.

## 2. Datos (`datos/santuario.json`, validador `node tools/validar_santuario.js`)
`acceso` · `niveles` (5: tamaño, filas, parcela, solares, hábitats, residentes) · `habitats` (7; `clave` de una letra que **no se cambia nunca**: viaja en el id) · `ritmo` · `temperamentos` · `frases`.
Añadir un hábitat o el carácter de una especie = añadir una entrada. Los cinco niveles ya se generan y están probados; **subir de nivel y elegir hábitat no tienen aún orden ni coste** (Etapa B).

## 3. Trazado del hogar
Bosque de 2 casillas · cabaña arriba en el eje · placita · avenida hasta la puerta sur · parcelas a ambos lados por filas. Las primeras son **solares** (reservados a instalaciones, hoy jardines); el resto, hábitats. Cada hábitat: suelo, borde y rincón característico de 2 columnas al fondo; las criaturas pasean por la zona libre.

## 4. Integración (sin editar módulos sensibles)
`src/santuario.js` envuelve `motor.estadoMapa`, `cruzar`, `moverCriaturas` y `aplicar` (patrón de Profundidades) y añade un proveedor a `mundo.proveedores`. `guardado.js`, `motor.js`, `mapas.js`, `red*.js`, `equipo.js` **no cambian**. El registro se valida la primera vez que se lee tras cargar (nivel, hábitats, cupos, claves); sección `v>1` ni se lee ni se pisa.
`game.js`: 4 enganches (panel del cuidador, pintado de señales, dos guardas de HD-2D). Sprites de Sela y Brezo: se crean al entrar (huellas iguales).

## 5. Decisiones respecto a la ficha 18
- Mapa por id en vez de «generador desde el estado del dueño»: una visita futura solo necesita el id (ya viaja en el mensaje de posición).
- Umbral como antesala: cumple el contrato de dimensión y es donde irán las puertas de visita.
- «Volver» del Umbral: si la pila no tiene la puerta del Nexus (partida cargada dentro: el guardado solo conserva puertas de mapas cargados), se repone. Sin esto el jugador saltaba a la Ermita o quedaba atrapado.
- `test.js`: el contrato de portales usaba una puerta de un mapa ya descargado cuando el origen no es Tonavia; ahora toma la puerta viva. Era un fallo del arnés, no del juego.

## 6. Pendiente (Etapa B/C)
Subir de nivel (Brillos) y elegir/cambiar hábitat · interacciones entre criaturas (el motor de tramos admite emparejarlas por hábitat) · instalaciones en los solares · entrenamiento acotado por día · decoración (ampliar el id con una huella de contenido) · visitas de solo lectura (resumen de red) · mote en el rótulo de la residente · HD-2D · medición en iPhone y red real **[?]**.

> Continúa en `20_SANTUARIO_ETAPA_B.md` (v2.365). Lo de «pendiente» de arriba ya no está al día para: subir de nivel, elegir hábitat, interacciones y mote en el rótulo.
