# DEPENDENCIAS DEL CONTENIDO
Tres categorías (las mismas A/B/C de `universos/00_comun.md`). Todo contenido de las fichas está clasificado aquí; si falta algo, se asume **B**.

## A · Se puede preparar AHORA (no depende de Fable)
Solo usa lo que existe hoy. Los mapas se crean con ids provisionales y se renombran con una pasada mecánica cuando Fable fije el formato.
- **Mapas** de las 4 dimensiones (≈ 47 mapas en total; 5 + 14 + 14 + 14) con el formato JSON actual, creados con `componer_mapa.js` y el editor (terreno, objetos, anclas, puertas, `conexiones`, `zonas` con `elemento`). Excluidos los portales entre dimensiones.
- **Interiores de plantilla** (Centro PC, tienda, laboratorio, casas) copiados con id nuevo.
- **Piezas decorativas temáticas** nuevas (ver `02_REUTILIZACION.md` «Lo que no existe»), dentro del proceso de piezas ya existente.
- **Temas de terreno** por dimensión en `terreno.js`/compositor (hoy solo Carbuna) — es código de dibujo, no del motor.
- **Aspectos de personajes** (entrenadores/NPC) con `entrenadores.js` (solo dibujo).
- **Criaturas nuevas** (opcional) por el proceso de fichas existente.
- **Textos y nombres** (frases, nombres de lugares, descripciones) como borradores.

## B · Necesita el contrato definitivo de Fable
- Ids con espacio de nombres, `destino.dim`, portales con requisitos y visual.
- Archivo de **dimensión** (`datos/dimensiones/*.json`) y su validador.
- **Tablas de aparición** por dimensión/zona (multiplicadores, `cond`); **nivel base por región** (hoy solo rareza).
- **Guiones de NPC** en datos; entrenadores fijos (Barón Caramelo, Kira, Zura…); jefes de dimensión.
- **Entrenadores autónomos por dimensión** (grafo, población, pools de nombres y frases).
- **Peces propios** por dimensión, **materiales/curiosidades** como tipo de objeto, tienda con objetos de dimensión.
- **Biomas de cueva por dimensión** y los biomas aún no definidos (lava, sombra).
- **Luz, música y tema por región** leídos de datos.
- **Tipos de actividad** y de evento (coleccion, entrega, censo, torneo, cocina, puzle…) y misiones.
- **Factores de economía por dimensión** (premios, precios) y la regla de `G.tienda` para materiales.

## C · Solo después de tener el motor
- Todo lo que cambia el mundo con el progreso: puente de la Isla del Palacio, apertura del Observatorio del Nexus, Meseta del Eco tras el censo.
- Eventos que alteran apariciones/precios (Marea de portales, Día de la Golosina, Migración, Pico de carga) y su calendario.
- Visitantes entre dimensiones (entrenadores que viajan), transporte (balsero), torneo, entrenamiento de la fábrica.
- Verificación de equilibrio con datos reales (`tools/equilibrio.js`, tabla v2.350) y pruebas de recorrido completo.
- Mazmorras con puzles para dos específicas de cada dimensión (reutilizan el resolutor, pero necesitan los biomas B).

## Resumen por universo
| Universo | A (ya) | B (contrato) | C (motor) |
|---|---|---|---|
| Nexus | 5 mapas, interiores, Centro PC | portales, guiones, tienda Vexa | observatorio, visitantes |
| Chuches | 14 mapas, piezas, tema | zonas, guiones, jefe, materiales, peces | receta real, evento, puente |
| Salvaje | 14 mapas, tema, pesca de mapas | zonas por hora, guiones, jefa, peces | censo, migración, balsero |
| Tecnológica | 14 mapas, tema, aspectos | zonas, puzles, jefe, materiales | núcleo, pico de carga, torneo |
