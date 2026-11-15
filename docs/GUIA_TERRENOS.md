# GUÍA · Terrenos 2D (motor `src/terreno.js` + compositor `tools/componer_mapa.js`)

Probado con `pueblo_carbuna` (v2.321). Solo 2D clásico; el HD-2D no dibuja estos terrenos (pendiente).

## Hacer un mapa nuevo de una región ya con tema (Carbuna)
1. Copia `plantillas/receta_pueblo_carbuna.json` a `plantillas/receta_<id>.json`; cambia `id`, `nombre`, tamaño, `semilla`, `anclas` y `pasos`.
2. `node tools/componer_mapa.js plantillas/receta_<id>.json` → escribe `maps/<id>.json` y una línea «OK …» o «FALLA: …» (transitable al 100 %, caminos ≥ 2, piezas en su terreno, determinista).
3. Revisa con una captura 390×844 (`?mapa=<id>`) y retoca con el editor de mapas si hace falta.
4. Edificios, puertas y bordes conectados NO los pone el compositor: los `solar` son huecos con ancla; se rellenan con las fachadas del juego y se conectan según `datos/mundo.json` (`node tools/validar_mundo.js`).

## Casillas de la receta (Carbuna)
`c` ceniza · `r` roca · `l` lava · `=` camino · `.` hierba · `b` puente.

## Operaciones de `pasos` (se aplican en orden)
`relleno` · `mancha` (centro, radio [rx, ry], rugoso, solo_sobre) · `borde` (grosor, rugoso) · `rio` (puntos, ancho, rugoso) · `camino` (puntos, ancho, puente) · `rect` · `solar` (id, x, y, w, h; deja un hueco para un edificio) · `sellar` (cierra lo inalcanzable desde un ancla) · `dispersar` (objeto, sobre, cantidad, solido, cerca_de/lejos_de). Todo es determinista (semilla + posición).

## Añadir una región nueva (hielo, bosque oscuro, desierto…)
Cada región lleva un tema en `TEMAS` (`src/terreno.js`): `PRIO` (qué terreno se derrama sobre el vecino), `SANGRA` (píxeles de mezcla), `FLUIDO` (el terreno animado: lava, agua), `RECTO` (el que no se mezcla: puente), `BRASAS` (partículas), `luz` y una función `color` que da el color de cada píxel. Hay que escribir esa función de color y la paleta (no es solo datos), usando `colorCarbuna` como modelo. Luego: receta nueva con el `region` correspondiente, y la luz de ambiente en `src/capas.js` (línea de `luz` por región). Pide a Fable solo el primer tema nuevo; los demás se copian de este.

## Lista de comprobación
- [ ] `node tools/componer_mapa.js …` en OK; mismo resultado dos veces.
- [ ] Captura a 390×844: sin cuadrícula visible, transiciones suaves, decoración solo en sitios lógicos.
- [ ] `node build.js && node test.js` y `node tools/huella_juego.js --comprobar` (si cambia a propósito: `--escribir` y `--clasico --escribir`).
- [ ] Anotar en `docs/SESION.md` y, si el HD-2D no lo dibuja, como pendiente.
