# PLAN MOVIMIENTO PROFESIONAL DE PERSONAJES (Lali y Oli a la vez)

Estado: **HECHO (v2.135, pasos 1-5)**; detalle en `docs/SESION.md`. Pendiente: verlo con Three.js real/móvil con GPU y la red (no existe en esta versión; `ang` viaja con `est.jugadores`). Valores a ajustar si no gusta: `ESTABLE_S` = 0,05 s, `AMP_S` = 0,1 s.
Alcance: Lali y Oli se tratan a la vez. No se hace uno sin el otro.

## Problema a resolver

Al moverse en diagonal (por ejemplo izquierda + arriba), el personaje debe girar hacia la esquina y no hacia la izquierda o arriba.

Causa actual, verificada en el código:
- `src/motor.js` (línea ~74): la dirección sale del eje dominante (`|vx| >= |vy|` gana la horizontal). El resultado son 4 direcciones.
- `src/personaje3d.js` (línea ~65): la tabla `YAW` tiene 4 valores y `pose()` usa solo `dir`.
- `src/game.js` (línea ~109): a los demás jugadores solo se envían `dir`, `moving` y `tm`.

## Requisitos

1. **Ángulo real.** El motor guarda `ang = Math.atan2(vx, vy)` cuando el jugador se mueve, y lo conserva al parar. `dir` se mantiene para la lógica 2D.
2. **Giro hacia la esquina.** En `pose()`, la meta del giro pasa de `YAW[dir]` a `ang`. Usar el suavizado existente (`girar`, 90° en 0,12 s). Decidir si el giro debe ser más rápido al cambiar de diagonal; si se decide, documentar el valor.
3. **Sin temblor.** Histéresis en el cambio de meta para que no oscile cuando `vx` y `vy` son casi iguales. El umbral lo decide quien implementa y se documenta.
4. **Red.** Añadir `ang` al estado que se envía (`game.js`) y al que recibe el otro móvil. Sin esto, el otro jugador verá solo 4 direcciones.
5. **Movimiento profesional.** Además del giro, revisar: sincronía entre paso y balanceo de brazos, arranque y parada suaves, y que el personaje no patine al cambiar de dirección. Criterio: el movimiento debe parecer natural en móvil y en PC.
6. **Sprites 2D.** Los sprites de Lali y Oli tienen solo 4 vistas. Decisión por defecto: en 2D se mantiene la dirección dominante y no se dibuja arte nuevo. Si quien implementa cree que hace falta otra cosa, lo documenta y avisa al usuario; no se decide en silencio.

## Pasos

### Paso 1. Ángulo en el motor y en el estado — MEDIUM
- Añadir `ang` en `src/motor.js`, con el mismo tratamiento que `dir` (conservar al parar).
- Comprobar en `test.js` que `ang` es 0 para `down` y que las 8 direcciones dan el ángulo esperado.
- Huella del juego sin cambios.

### Paso 2. Giro 3D hacia el ángulo — MEDIUM
- En `pose()` de `src/personaje3d.js`, la meta de giro usa `ang` si existe, y `YAW[dir]` si no. Mantener compatibilidad con Oli y Lali.
- Añadir la histéresis.
- Captura de prueba de las 8 direcciones: Oli y Lali.

### Paso 3. Sincronización por red — MEDIUM
- `ang` en el paquete que se envía (`src/game.js`) y en el que se recibe.
- Probar con dos móviles (o dos pestañas) que el otro jugador gira igual.

### Paso 4. Pulido de movimiento — MEDIUM
- Sincronía paso/brazos, arranque y parada, sin patinar.
- Verificación en Chromium móvil y escritorio. Documentar los valores finales.

### Paso 5. Cierre — LOW
- `test.js`, `LEEME.txt`, `docs/ROADMAP.md`, `docs/SESION.md`.
- ZIP del proyecto.

## Criterio de hecho

Lali y Oli giran hacia la esquina al moverse en diagonal, en 3D y en la red; no hay temblor; el 2D no cambia salvo lo declarado; `node test.js` pasa; y lo no verificado con navegador real queda anotado como pendiente.
