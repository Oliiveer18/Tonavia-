# PLAN LALI 3D (personaje «luna»)

Estado: **TERMINADO (v2.127-v2.132)**; ver `docs/FICHA_LALI_3D.md` (secciones 11 a 15). El plan de movimiento también está hecho (v2.135).
Orden de trabajo: primero este plan (Lali 3D, pasos 1 a 6). Después, el plan de movimiento `docs/PLAN_MOVIMIENTO_PERSONAJES.md`, que se hace para Lali y Oli A LA VEZ.

## Referencias obligatorias (leer antes de empezar)

- `docs/FICHA_OLI_3D.md`: plantilla de la ficha, medidas, presupuestos y lecciones (sección 16: proporciones del cuerpo; sección 21: paso 4 de Oli).
- `src/personaje3d.js`: módulo de Oli. Lali debe reutilizarlo parametrizado, NO copiarlo.
- `src/chars.js`: sprites de Lali (id `luna`: rubia, ojos verdes, chaqueta azul).
- `src/hd2d_pintor.js`: pintor HD-2D donde se enchufa el personaje 3D y donde hoy Lali es una lámina (`G.vista.persona`).
- `tools/cara_oli.py`: rasterizador de texturas, para usarlo como base de las de Lali.
- `test.js`: grupos de comprobación. Añadir grupos nuevos para Lali; no romper los existentes.
- `docs/PROMPT_PARA_CONTINUAR.md` y `docs/ROADMAP.md`: reglas de trabajo y estado.

## Reglas fijas

1. Un paso por sesión. Cada paso cierra con checkpoint y se avisa al usuario. No pasar al siguiente sin «hazlo».
2. Huella del juego: el 2D, las criaturas y Oli no deben cambiar. Comprobarlo con `node tools/huella_juego.js --comprobar` en cada paso.
3. Presupuesto: ≤240 triángulos por personaje (`MAX_TRIANGULOS`), atlas ≤256×256, +1 llamada de dibujo por jugador.
4. Interruptor de seguridad: Lali 3D debe tener su propio interruptor (`G.hd2d.AJUSTES.PERSONAJES3D_LALI` o equivalente) que, si algo falla, vuelve a la lámina sin romper el juego.
5. Versión: cada paso sube la versión en `LEEME.txt` y deja una línea en `docs/SESION.md`.
6. Las decisiones técnicas de detalle las toma quien implementa (Sonnet 5.5). Hay que dejar por escrito la decisión y el motivo en la ficha.

## Pasos

### Paso 1. Ficha de Lali 3D — LOW · HECHO (v2.127)
- Crear `docs/FICHA_LALI_3D.md` siguiendo la estructura de `FICHA_OLI_3D.md`.
- Fijar: id `luna`, pelo rubio, ojos verdes, chaqueta azul, lista de piezas, tope de triángulos, tabla de presupuestos, pose de andar, tamaño en u.
- Solo documentación. Sin código. Checkpoint: ficha escrita y revisada.

### Paso 2. Volumen con colores lisos — MEDIUM · HECHO (v2.128)
- Generalizar `src/personaje3d.js` para aceptar un modelo por personaje (`oli` / `luna`) sin cambiar el resultado de Oli.
- Crear las piezas de Lali según la ficha: cabeza, pelo rubio, torso azul, brazos, piernas, zapatillas.
- Revisar proporciones con captura antes de seguir (Oli tuvo que corregir torso y cabeza en v2.120 y v2.121).
- Comprobar: `node test.js` y tests nuevos del modelo de Lali. Oli: su geometría debe ser idéntica a la anterior.

### Paso 3. Texturas de píxel recortadas del sprite — MEDIUM · HECHO (v2.129, 3a-3d juntos)
Se hace en sub-checkpoints, uno por sesión si hace falta:
- 3a: cara y cabeza (frente, costados, espalda).
- 3b: cuerpo y chaqueta azul (torso y mangas).
- 3c: piernas, pantalón y zapatillas con suela.
- 3d: pelo rubio (sin trenzas) y costados.
Las texturas salen de `src/chars.js` (sprite de Lali) con un rasterizador tipo `tools/cara_oli.py`.

### Paso 4. Enchufar Lali 3D al pintor HD-2D — MEDIUM · HECHO (v2.130)
- Atlas con las texturas de Lali, malla con pose por cuadro, interruptor propio.
- Quitar la lámina de Lali solo cuando el interruptor esté encendido.
- Presupuesto de llamadas: +1 por jugador, o sea +2 con Oli y Lali en 3D. La ficha de Oli decía «máximo +2 en total hasta que exista Lali 3D»; medir la cifra real y anotarla en las dos fichas.

### Paso 5. Prueba con Three.js real y presupuestos — LOW · HECHO (v2.131)
- Captura desde los 4 giros, medida de rendimiento y ajuste de brillo (`BRILLO`, `TONO_TEX`), igual que el paso 5 de Oli.
- Límite: el entorno no tiene red. Si Three.js real no está disponible, dejar la prueba escrita como pendiente y no darla por hecha.

### Paso 6. Cierre — LOW · HECHO (v2.132)
- Retirar la lámina de Lali si la prueba del paso 5 fue correcta; si no, dejar el interruptor en `false` y documentar el motivo.
- Actualizar `test.js`, `LEEME.txt`, `docs/ROADMAP.md` y `docs/SESION.md`.
- Generar el ZIP del proyecto.

## Criterio de hecho

Lali se dibuja en 3D en el HD-2D, con su pose de andar y sus texturas; Oli no cambia; la huella del juego se mantiene salvo lo que se declare; `node test.js` pasa; y las pruebas que no se han podido ejecutar quedan anotadas como pendientes, sin darlas por hechas.
