---
name: esfuerzo-delegacion
description: Antes de cada paso del proyecto Criaturas, fija el esfuerzo (LOW/MEDIUM) y decide qué delegar a Haiku. Úsala al proponer o empezar un paso.
---

# Esfuerzo y delegación

Modelo de la sesión: Sonnet 5.5. No cambiar de modelo (rompe la caché); solo el esfuerzo.

## 1. Esfuerzo por tipo de paso
- **LOW:** ajuste de una sola pieza, documentos, datos/mapas, retoques, música, puntos o anclas.
- **MEDIUM:** piezas 3D nuevas, poses, interiores, mecánicas, cambios en el motor o en los dos pintores.

## 2. Protocolo
1. Antes de empezar, decir el esfuerzo (LOW o MEDIUM) y, en una línea, qué se delega a Haiku (si algo).
2. Esperar el «hazlo» del usuario: ese «hazlo» es el acuerdo.
3. Una sesión NO puede cambiar su propio esfuerzo (`set_session_effort` se rechaza sobre la misma sesión). Si el esfuerzo acordado difiere del actual: pedir al usuario que lo cambie en el selector de la app y esperar su aviso antes de editar. Alternativa solo si el usuario la acepta: hacer el paso en un subagente con `effort` indicado. Si no hay acuerdo claro, preguntar.
4. **Regla de parada:** si un paso LOW resulta ser MEDIUM, parar y avisar antes de seguir. Nunca subir por cuenta propia.

## 3. Delegar a Haiku 5.5 (subagente, esfuerzo medium)
Solo tareas mecánicas con salida larga:
- Ejecutar `node build.js`, `node test.js`, `node tools/huella_juego.js --comprobar` (y `--clasico`) y las pruebas `tools/prueba_*.py`.
- Prompt breve y autocontenido; pedir un informe de pocas líneas (OK / falla X).

**Verificación proporcional (usuario, 7 nov 2026):** no pasar siempre las 25 pruebas de navegador.
- Siempre: `node build.js`, `node test.js`, huella 2D (`--comprobar`; y `--clasico` si se toca el 2D).
- Solo las pruebas `tools/prueba_*.py` de la zona tocada (p. ej. pesca/red; HD-2D: `hd2d_juego`, `hd2d_albanota`), 2-4 como máximo.
- Pasada completa con Haiku solo al cerrar una fase grande o un cambio de motor, guardado o red.
- Captura a 390×844 solo si el cambio es visual.

No delegar: diseño, código, poses, revisión visual a 390×844, documentos, ZIP ni nada que requiera criterio.
Haiku nunca decide ni juzga: solo cuenta como verificado lo que se ha visto directamente (o el comando que Haiku ha ejecutado, comprobando su informe).

## 4. Cierre
Al terminar: qué se hizo, qué se comprobó, qué queda pendiente. Si el siguiente paso pide otro esfuerzo, proponerlo y esperar «hazlo».
