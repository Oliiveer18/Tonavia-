# F5 · Portales, Nexus técnico y tablón global (contrato v2.356)
## Portal (dato)
Una puerta de mapa con campo extra: `{ id, x, y, destino: { mapa, ancla }, portal: { color:'#rrggbb', icono?:'eco', nombre?:'…', requisitos?:[{ t, … }] } }`.
- **Dimensión de destino:** sale del prefijo del id del mapa (`nexus/plaza_cruce` → nexus; sin prefijo → tonavia). `destino.dim` es opcional y, si está, debe coincidir. NO existe `j.dim` guardado: la dimensión de un jugador es la de su `j.mapa` (así la huella de estado y los guardados no cambian).
- **Requisitos:** todos deben cumplirse. Tipos: `nivelEntrenador {n}` (1..nivel máximo). Un tipo desconocido se rechaza al validar y un requisito mal formado CIERRA el portal. F6 añadirá tipos (marcas de progreso) en `G.portales.REQ` sin tocar el motor.
- **Cuándo se comprueban:** al cruzar la puerta (`motor.cruzar`). La orden interna `colocar` (arranque, pruebas) no los exige; en red (F8) el servidor debe validar el cruce. Un portal no da objetos ni criaturas.
- **Volver:** `destino.ancla = 'volver'` saca de la pila `j.volver`; sin pila (partida cargada dentro) sale por la puerta de otro mapa que lleve a este.
## Carga y validación
El destino puede estar en una dimensión no cargada: `validarMapas` lo resuelve por los proveedores sin cargarla (y suelta la caché). Cruzar carga la dimensión; salir del último jugador la descarga (F4). Los proveedores existen antes de arrancar el mundo para poder validar paquetes del editor al arrancar.
## Nexus técnico
`datos/dimensiones/nexus.json` + `maps/nexus/plaza_cruce.json`: plaza pequeña sin zonas de aparición (sin salvajes), fuente, farolas, bancos, tablón y portal de vuelta. Entrada desde la Ermita (`portal_nexus`, nivel 5 por dato). El Nexus REAL (5 mapas, mercado, archivo, observatorio, portales a las otras dimensiones) es trabajo de contenido (Sonnet) sobre este contrato. `regiones` va vacío hasta que F6 defina el nivel base por región.
## Tablón global
Un único `est.tablon`; se usa junto a cualquier personaje `tablon` de cualquier mapa (Tienda de Albanota y mercado del Nexus). El mapa de mercado real debe incluir ese personaje.
## Editor
No crea ni cambia portales. Conserva los oficiales al abrir/reexportar (para poder editar el resto de la Ermita) y rechaza portales nuevos, cambiados o destinos con prefijo de dimensión (importar dimensiones: F8).
## Visual (coordinado con el trabajo de contenido, sin adelantarlo)
`src/portales_ui.js` pinta solo lo mínimo común a todo portal: marco y halo del `color`, destellos, apagado si no cumples el requisito, y un velo con el nombre de la dimensión al cambiar de dimensión (color del portal cruzado). `icono` se valida pero aún no se dibuja: el arte por portal (iconos, mapas, luz, música y tema de cada mundo) lo hace Sonnet leyendo `portal.color/icono` sin tocar el motor. No se ha tocado HD-2D.
## Para F6+
Requisitos nuevos = entradas en `REQ`. Marcas de progreso (F6) viven en `est.dim.<dim>`. Entrenadores del Nexus: población propia 0, visitantes (F7). Red: `cruzar` debe validarse en el anfitrión (F8).


## Actualización F6 (v2.357)
`REQ.cumple/texto` y `G.portales.comprobar(j, portal, est)` reciben el estado. Nuevo requisito `marca` `{ t, dim, k, n?, texto? }` (marcas de progreso, `src/marcas.js`). Ver `13_GANCHOS_F6.md` §4.
