# DEMO DE SOMBRAS PROYECTADAS (2D y HD-2D) · v2.100 · SOLO DOCUMENTOS Y HERRAMIENTA
El código del juego NO cambia (sigue v2.94; dist/ idéntico). Nada está implementado: es una demostración para aprobar antes del «hazlo».

## Qué se ha hecho
- Herramienta nueva `tools/demo_sombras/` (`demo.py`, `inject2d.js`, `injecthd.js`). Abre `dist/criaturas.html` en Chromium (solo lectura), coloca a Oli, Lali y 3 criaturas por el estado del motor y captura el lienzo REAL (390×844, ×2).
- «AHORA» = juego tal cual, sin inyección. «PROPUESTA» = mismo juego + capa inyectada solo en la página en ejecución (no se escribe ningún archivo del juego).
- **2D** (`inject2d.js`): se engancha a `G.capas.luzRegion`. Sombra = silueta real de cada sprite (objetos, Oli, Lali, criaturas) inclinada 2:1 (0,45 px a la derecha y 0,225 abajo por píxel de altura), una sola máscara (no oscurece doble), tono por multiplicación (violeta frío), nada sobre agua, árboles nunca.
- **HD-2D** (`injecthd.js`): Three.js r128 REAL (`npm install three@0.128.0`; variable `THREE_MIN=ruta/three.min.js`). Luz direccional con mapa de sombras real (2048, PCF suave, misma dirección que el 2D), suelo receptor ShadowMaterial solo sobre hierba, camino y puente; emisores = edificios y fuente en volumen + «proxys» invisibles de las láminas (farolas, bancos, macetas, personajes, criaturas) con la misma textura y recorte alfa, siempre de cara al sur (la sombra no cambia al girar la cámara). Se oculta la sombra suave horneada de los edificios; la sombra de contacto de los pies se mantiene.
- Hallazgo técnico: en r128 `render` es propiedad de cada instancia; hay que envolver el constructor `THREE.WebGLRenderer`, no el prototipo.
- Los botones HUD (minimapa, Mapas, Editar, Gráficos) se ocultan con CSS en TODAS las capturas.
- Albanota no tiene NPC definidos: se usan Lali (inmóvil) y criaturas reales como sustitutos.

## Capturas hechas (docs/sombras_demo/)
Solo la vista **plaza**: `plaza_{2d,hd}_{ahora,propuesta}.png` y hojas `_smoke_plaza.png` (2D ahora/propuesta + HD ahora/propuesta) y `_smoke_hd.png`. Son capturas reales del renderizador; las hojas son capturas puestas una al lado de otra. Las `plaza_2d_*` son anteriores al arreglo del HD (el 2D no cambió).

## Lo visto
- 2D: sombras con la forma de farolas, banco, fuente, macetas, Oli, Lali y criaturas; se cortan en el borde del césped/camino sin manchas.
- HD-2D: sombras reales de farolas, banco, personajes y criaturas bien proyectadas. **Revisar:** la fuente 3D proyecta poco (mancha compacta bajo la taza) y la luz `sol` original del pintor (delante-izquierda) no coincide con la dirección de la sombra; solo afecta a las paredes del relieve.

## Pendiente (no hecho)
1. Renderizar las otras 5 vistas ya definidas en `VISTAS` de `demo.py`: barrio (casas y tejados), laboratorio, centro y tienda, orilla y puente, huerto. No se han visto aún.
2. Hojas comparativas finales (ahora/propuesta, 2D y HD-2D) y comprobar que el HD «ahora» queda idéntico con la capa apagada.
3. Ajustar según el usuario: largo de sombra, tono, intensidad, si quiere sombra en personajes y criaturas.
4. Uso: `THREE_MIN=…/three.min.js python3 tools/demo_sombras/demo.py [vista…] [2d|hd]` (salida en tools/demo_sombras/out/; necesita playwright).
5. Implementación real solo con su «hazlo» (interruptor en «Sombras», `?sombrasp=0`, test, y HD-2D con luz + receptor).


## ACTUALIZACIÓN v2.96 (6 nov) · SOLO 2D · el HD-2D queda en pausa
**Decisión del usuario:** en el HD-2D NO se hace nada todavía (faltan texturas en muchas cosas). Por ahora solo se trabaja el 2D. No tocar `injecthd.js` ni la capa 3D.

### Hecho
- Renderizadas las 5 vistas 2D que faltaban (barrio, laboratorio, centro, orilla, huerto), «ahora» y «propuesta», sin errores de consola. Archivos en `docs/sombras_demo/`: `{vista}_2d_ahora.png`, `{vista}_2d_propuesta.png` y la hoja `{vista}_2d_ahora_vs_propuesta.png` (izquierda ahora, derecha propuesta). Comando: `python3 tools/demo_sombras/demo.py barrio laboratorio centro orilla huerto 2d`.

### Lo visto en el 2D
- **Orilla:** la mejor; las sombras se cortan limpias en el borde del césped y no pasan al agua ni al puente.
- **Barrio:** farolas, banco, macetas y personajes bien; la sombra de las casas sale escalonada y suave.
- **Laboratorio:** el edificio solo deja una franja baja sobre la arena; cúpula y cristales casi no proyectan.
- **Centro y Tienda:** la sombra del edificio sobre el camino es una banda plana grande, la más pesada; el tono sobre la arena sale gris-malva apagado, no violeta.
- **Huerto:** la más floja. Sobre la tierra oscura apenas se nota; las sombras de Oli sobre los tomates y de Lali sobre las calabazas salen como manchas raras; hay un píxel gris suelto en el hueco de la valla (arriba a la derecha).

### Ajustes APROBADOS por el usuario para el 2D (aún NO implementados)
1. Suavizar la sombra de los edificios, con **degradado**: más fuerte pegada a la pared y más clara al alejarse (no banda plana).
2. **Tejados y cúpula:** sombra más corta y suave.
3. **Intensidad por superficie:** menos opacidad sobre tierra oscura (huerto) y arena, más sobre césped; **calentar el tono sobre la arena**.
4. **Sin sombras de personajes sobre los cultivos** (tomates, calabazas…).
5. Arreglar el píxel suelto de la valla.
6. Implementación real: interruptor en «Sombras», `?sombrasp=0`, test, y comprobar que con la capa apagada el juego es idéntico al actual (huella igual). Solo 2D.

### Siguiente paso
Implementar los ajustes 1-6 en el 2D (con el «hazlo» del usuario, ya dado para los ajustes) y revisar de nuevo las 6 vistas. HD-2D: esperar a que tenga texturas.

### v2.97 · ajustes LOW hechos en la capa de demo 2D (`tools/demo_sombras/inject2d.js`; el juego NO cambia, sigue v2.94)
- **Tono por superficie:** el suelo bajo cada píxel de sombra se clasifica (agua / césped / arena / tierra oscura) y cada clase usa su propio multiplicador: `mul` (césped, sin cambio), `mulArena` [206,184,224] (más clara y cálida) y `mulTierra` [214,204,230] (más suave). La sombra sobre la arena ya no sale gris-malva.
- **Sin sombras de personajes y criaturas sobre el huerto** (rectángulo del objeto `huerto`, con 2 px de margen): desaparecen las manchas sobre tomates y calabazas. Las sombras de objetos (p. ej. espantapájaros) siguen.
- Las 6 vistas 2D se volvieron a renderizar (sin errores de consola); capturas y hojas actualizadas en `docs/sombras_demo/`.
- **Sigue pendiente (LOW):** el píxel gris suelto junto al poste de la valla del huerto (arriba a la derecha) NO se ha arreglado; falta localizar qué objeto lo genera.
- **Sigue pendiente (MEDIUM):** degradado de la sombra de los edificios (fuerte en la pared, clara al alejarse), tejados y cúpula con sombra más corta y suave, e implementación real en `src/` con interruptor «Sombras», `?sombrasp=0`, test y huella igual con la capa apagada.

### v2.98 · DEGRADADO de la sombra de los edificios (MEDIUM, hecho en la capa de demo `inject2d.js`; el juego NO cambia, sigue v2.94)
- Solo los edificios (`casa`, `casa_lali`, `casa_oli`, `laboratorio`, `centro_pc`, `tienda`, `ermita`): cada píxel de sombra recibe un nivel según su altura sobre el suelo `h`: nivel 1 (fuerte) si `h ≤ g1` (20), nivel 2 (62 % de fuerza) si `h ≤ g2` (44), nivel 3 (36 %) si es más alto. El multiplicador de cada superficie (césped, arena, tierra) se aclara hacia blanco según la fuerza. Parámetros: `P.g1`, `P.g2`, `P.fuerza`.
- Donde se solapan sombras gana el nivel más fuerte (sigue sin oscurecer doble). Objetos, personajes y criaturas siguen en nivel 1.
- Resultado: la banda plana del Centro PC sobre el camino pasa a una sombra que se aclara al alejarse de la pared. Las 6 vistas se volvieron a renderizar sin errores de consola; capturas y hojas en `docs/sombras_demo/`.
- **Pendiente:** tejados y cúpula con sombra más corta (reducir `SX`/`SY` para `h` alto en edificios), píxel suelto de la valla (LOW) e implementación real en `src/` (interruptor «Sombras», `?sombrasp=0`, test, huella igual con la capa apagada). HD-2D en pausa.

### v2.99 · TEJADOS Y CÚPULA con sombra más corta (hecho en la capa de demo `inject2d.js`; el juego NO cambia, sigue v2.94)
- Solo edificios: por encima de `h = g1` (20) la altura efectiva de la sombra se acorta: `h' = g1 + (h − g1) · P.corto`. Valor elegido **`corto = 0,75`**.
- Prueba: con 0,45 la sombra del laboratorio quedaba escondida detrás del propio edificio (casi desaparecía); con 0,75 se ve la sombra de la cúpula y del lateral sin alargarse tanto como antes. Si se quiere más corta, bajar `P.corto` (0,6) o más larga (0,9).
- Las 6 vistas 2D se renderizaron de nuevo sin errores de consola; capturas y hojas en `docs/sombras_demo/`.
- **Pendiente:** píxel suelto de la valla (LOW) e implementación real en `src/` (interruptor «Sombras», `?sombrasp=0`, test, huella igual con la capa apagada; parámetros de la demo: `mul`, `mulArena`, `mulTierra`, `g1`, `g2`, `fuerza`, `corto`). HD-2D en pausa.

## v2.100 · SOMBRAS PROYECTADAS DEL 2D, YA EN EL JUEGO (MEDIUM; solo 2D; el HD-2D NO se toca y sigue en pausa)
Hecho el «hazlo» de los dos pendientes. Código nuevo `src/sombras_proyectadas.js` (`G.sombrasp`, en `src/orden.json` tras `particulas.js`) y una llamada en `draw()` de `src/game.js`, justo después de la luz de región y antes de dibujar objetos y personajes. `dist/criaturas.html` reconstruido.
- **Qué hace:** el método aprobado de la demo (silueta real inclinada 2:1, una sola máscara, nada sobre el agua, árboles nunca) con todos los ajustes: degradado de edificios (3 niveles), tejados y cúpula más cortos (`corto 0,75`), tono por superficie (césped / arena / tierra), personajes y criaturas sin sombra sobre el huerto.
- **Píxel suelto de la valla (arreglado):** venía de la sombra del extremo del poste de `valla_ni`, `valla_nd` y `valla_9` (solo se veía un píxel fuera del sprite). Las vallas bajas ya no proyectan (igual que `valla_v`, el huerto, el puente y lo que flota en el agua: lista `G.sombrasp.NO`).
- **Interruptor:** `?sombrasp=0` las apaga; el botón «Sombras» (`G.SOMBREADO.ACTIVO`) las enciende y apaga con el resto del sombreado; `G.sombrasp.AJUSTES.ACTIVO = false` por código. Encendidas por defecto. Con la capa apagada NO se hace ninguna llamada de dibujo ni se calculan las entidades.
- **Solo el 2D:** el pintor HD-2D no llama a esta capa y su suelo horneado (`C.luzRegion`) no cambia; por eso las sombras NO están dentro de `G.capas.luzRegion`.
- **Ajustes** en `G.sombrasp.AJUSTES`: `SX`, `SY`, `mul`, `mulArena`, `mulTierra`, `g1`, `g2`, `fuerza`, `corto`, `ENTIDADES`.
- **Pruebas:** `node test.js` = **60 grupos** (grupo nuevo: lo puro, apagado sin llamadas, interruptor «Sombras», sin sombra sobre el huerto). `node tools/huella_juego.js --comprobar` IGUAL (`77a1889f58e106b6d42dc86c · 665961 llamadas`): la huella se mide con la capa apagada (`G.sombrasp.AJUSTES.ACTIVO = false` en la herramienta), que es lo que demuestra «apagada = idéntico a antes».
- **Comprobado en Chromium real** (`tools/demo_sombras/captura_real.py`, 6 vistas, animación congelada con `?movimiento=0`): con `?sombrasp=0` el juego sale píxel a píxel igual que el v2.94; con las sombras encendidas sale igual que la demo aprobada, salvo el píxel suelto de la valla (quitado) y el rótulo animado «Dandel» que se mueve entre capturas. Sin errores de consola. Capturas `docs/sombras_demo/{vista}_real_sin_vs_con.png` (izquierda `?sombrasp=0`, derecha encendidas).
- **Coste:** 0,82 ms de media por cuadro (máximo 4,5 ms) en Chromium sin GPU, en la plaza; un móvil con GPU debería estar por debajo. Cada cuadro lee el suelo una vez (`getImageData`) para no pintar sobre el agua; si algún día pesa, se puede guardar la máscara de los objetos fijos mientras la cámara no se mueva.
- **Sigue pendiente:** HD-2D (esperar a que tenga texturas). Si se quiere más o menos sombra: `corto`, `g1`, `g2`, `fuerza` y los multiplicadores son un solo número cada uno. `tools/demo_sombras/inject2d.js` (capa de demo) queda solo como referencia histórica.
