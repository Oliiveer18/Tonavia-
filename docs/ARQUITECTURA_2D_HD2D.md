# Arquitectura 2D / HD-2D (v2.51b · pasos A1, A2 y A3)

Objetivo: un botón dentro de la partida que cambie entre ver el juego en 2D y en HD-2D, sin reiniciar y con el mismo estado.
Idea: el **mundo** es uno solo; el 2D y el HD-2D son dos **pintores** que lo leen.

## A1 · Qué hay hoy (inventario)

| Capa | Archivos | Qué hace | ¿Depende de cómo se dibuja? |
|---|---|---|---|
| Datos | `maps/*.json`, `src/mapas.js` | Mapas, casillas, objetos, puertas, sólido/no sólido | No |
| Reglas y estado | `src/motor.js`, `src/aparicion.js` | Jugadores, criaturas, órdenes (teclas, hablar, evolucionar), colisiones, cruce de mapas, azar con semilla | No (no toca DOM ni lienzo) |
| Qué se ve | `src/vista.js` (nuevo en v2.51b) | Fotograma, altura, balanceo, cabeceo y sombra de cada criatura; sprite de Oli y Lali (incluye espejo de Lali a la izquierda) | No (solo cuentas) |
| Sprites | `src/chars.js`, `src/formas_*.js`, `src/lineas.js`, `src/creatures.js` | Pixel art por código | Es el contenido que usan los dos pintores |
| Pintor 2D | `src/game.js`, `src/capas.js`, `src/sombreado.js`, `src/arboles.js`, `src/albanota_objetos.js` | Lienzo 2D, cámara entera en píxeles, suelo horneado, olas, viento, luz, nombres | Sí: es el pintor |
| Entrada y menú | `src/game.js` (teclas, botones, menú de elección) | Manda órdenes al motor | Parte del 2D; en HD-2D se reutiliza |
| Pintor HD-2D | `hd2d/plantilla.html` (prueba) | Escena Three.js con maqueta, Oli/Lali y 3 criaturas | Tiene su propio mundo y colisiones: **hay que quitarlas** (paso B2) |

Hallazgo: el mundo ya estaba separado del dibujo en la v2.x (`motor.js` no dibuja). Lo único que seguía dentro de `game.js` eran las cuentas de «qué se ve»; eso es lo que se ha movido a `vista.js`.

## A2 · Qué cambió
- Nuevo `src/vista.js` con `G.vista.altura`, `G.vista.criatura` y `G.vista.persona` (funciones puras).
- `game.js` ya no calcula nada de eso: llama a `G.vista` y dibuja.
- **Prueba de que el 2D no cambió:** `tools/huella_juego.js` simula una partida (360 cuadros, con paseos, hablar, evolucionar y cambio de jugador) y saca un hash de **todas** las llamadas de dibujo y del estado final. Con el código de la v2.51a y con el nuevo sale el mismo (`docs/HUELLA_JUEGO.txt`). Comprobado que detecta cambios provocados (un espejo mal puesto y un cabeceo de 1 cuadro).
- Si algún día se cambia a propósito lo que se ve: `node tools/huella_juego.js --escribir` y anotarlo en `SESION.md`.

## A3 · Contrato del pintor
Un pintor recibe, cada cuadro:
1. el **mapa** (`G.mundo.mapa(id)`: casillas, objetos, sólidos) y el estado (`est`) del motor;
2. para cada criatura, `G.vista.criatura(c, reloj)`; para cada jugador, `G.vista.persona(id, dir, moving, tm)`;
3. el reloj de animación propio.

Un pintor **no** decide posiciones, colisiones, azar ni evoluciones: eso es del motor. Un pintor **sí** decide cámara, zoom, luz, sombras y cómo se pinta el suelo.
El botón 2D / HD-2D solo cambia qué pintor está activo; el motor sigue y el estado se conserva.

## HD-B1 · primera mitad (v2.63)
`hd2d/albanota_hd2d.html` (generado por `tools/hd2d_albanota.js` desde `hd2d/plantilla_albanota.html`): terreno de Albanota en 3D con el suelo que pinta el 2D. El pintor HD-2D recibe el mapa (`G.mundo.mapa`) y decide el relieve y la cámara; el suelo de píxeles es el del 2D (captura del `drawTile` y `G.capas.fondo`). Pendiente: edificios y objetos (2.ª mitad) y que lea del motor (B2).

## Lo que sigue
- B1 · MEDIUM · mapa real (Albanota) a terreno 3D. B2 · MEDIUM · el HD-2D lee del motor (sin colisiones propias). B3 · MEDIUM · olas, viento y luz en HD-2D.
- C1 · LOW · botón. C2 · MEDIUM · cargar Three.js solo si se elige HD-2D y volver al 2D si falla. C3 · LOW · pruebas y ZIP.

## v2.64 · Fase 3 hecha
`src/hd2d_pintor.js` es el segundo pintor: recibe un host de game.js (`estado()`, `fondo()`, `tam()`, `alFallar()`), solo lee y dibuja. game.js elige pintor en el bucle (`if (hd) G.hd2d.dibujar(); else { draw(); drawPlates(); }`). Three.js se carga bajo demanda; fallo, sin WebGL o lentitud → 2D. Edificios y objetos = láminas del dibujo 2D. Falta verlo con Three.js real.
