# Partidas (v2.371)
- Índice: `localStorage['criaturas_partidas']` = `{ v:1, activa, sig, lista:[{ id:'pN', nombre, tipo:'normal'|'pruebas', prep? }] }` (máx. 6). Se sanea al leer.
- Claves de guardado por ranura: `p1` → `criaturas_partida` (+ `_bak`, `_premig`, `_corrupta*`, `_exceso`); `pN` → `criaturas_partida_pN` (+ los mismos sufijos). `G.guardado.fijarRanura(sufijo)` se llama al cargar (partidas.js) y no cambia en la sesión.
- Cambiar de partida = fijar la activa y recargar la página. El guardado de la partida anterior se escribe al salir con SUS claves.
- Pruebas: `prep:{nivel,brillos}` se aplica una vez (`G.partidas.aplicarPrep`) sobre una partida nueva, a Oli y Lali, y se borra.
- Borrar: confirma, copia el guardado a `criaturas_partida_borrada` y quita la ranura.
- Añadir algo por partida: todo lo que cuelgue de `est` ya va por ranura; lo que viva en otras claves de localStorage (audio, HD-2D, mapas del editor, rol) es del DISPOSITIVO y es común a todas.
