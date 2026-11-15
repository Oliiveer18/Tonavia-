# REUTILIZACIÓN · qué existe y qué falta (inspeccionado en el proyecto v2.350)
Regla: no duplicar. Cada fila dice qué se reutiliza tal cual (**R**), con retoque de datos (**RD**) o no existe (**N**).

## Mapas y plantillas
| Existe | Uso en el multiverso | Tipo |
|---|---|---|
| `sala_centro_pc`, `sala_tienda`, `sala_laboratorio`, `sala_casa_*`, `sala_ermita` (objetos de interior en `interiores_objetos.js`) y los mapas `centro_pc`, `tienda`, `laboratorio`, `casa_de_*` | Centro PC, tienda, laboratorio y casas de cada dimensión: **copiar el mapa con id nuevo**, retocando decoración | RD |
| `plantillas/sala.json`, `plantillas/receta_pueblo_carbuna.json`, `tools/componer_mapa.js` | Generar pueblos y rutas de cada dimensión desde una receta (determinista, valida) | R |
| `tools/editor_mapas.html` / `editor_mapas.js` | Dibujar/retocar mapas de las dimensiones | R |
| Tema de terreno `carbuna` (`src/terreno.js`, `TEMAS`) | Plantilla para crear temas de dimensión (**solo existe el de Carbuna**; los demás hay que crearlos) | RD / N |
| `datos/mundo.json` (50 mapas planificados, 8 reales) | NO se amplía con las dimensiones: es el plan de Tonavia | — |

## Objetos y decoración (`G.OBJETOS`, 77 piezas)
Reutilizables en las cuatro dimensiones: `fuente`, `banco`, `farola`, `cartel`, `maceta`, `barril`, `valla_*`, `juncos*`, `nenufar*`, `roca`, `piedras`, `hierba_alta`, `huerto`, `puente_albanota`, `brasero_carbuna`, `boca_cueva`, altares/pedestales de Eco, mobiliario de interior (`estante`, `mesa`, `mostrador_*`, `vitrina`, `consola_*`, `terminal_pc`, `incubadora`, `escaner`). **Faltan (N)** piezas temáticas: gominolas, piruletas y mostradores de caramelo (Chuches); lianas, palafitos, acacias (Salvaje); pantallas, cables, cintas, servidores (Tecno). Se crean con el proceso de `FICHAS_OBJETOS_3D.md` / catálogo; cada pieza va en los dos pintores o se anota como pendiente.

## NPCs
| Existe | Uso |
|---|---|
| Enfermera Alba (`enfermera`), doctora, tendero Teo, tablón (`tablon`), guarida (Zefirax) en `src/npc.js` | Reutilizar enfermera y tablón en cada Centro PC/mercado (R); tendero como base de los tenderos nuevos (RD sprite) |
| `src/entrenadores.js`: fábrica de entrenadores (complexión + peinado + ropa + complemento + paleta) | Genera el aspecto de todos los entrenadores y personajes secundarios (R); solo hace falta dar identidad (datos) |
| Guiones en `GUION` de `npc.js` | **Están en código.** Fable los pasa a datos; hasta entonces no se escriben guiones nuevos (B) |

## Entrenadores autónomos (`datos/agentes.json`)
Reutilizar: población, rasgos, 5 ambiciones (campeón, coleccionista, explorador, criador, mercader), pools de `nombres` (48) y `frases` (30). **Se adapta, no se rehace:** cada dimensión añade pools de nombres/frases propios y un grafo propio (B). Los 48 nombres actuales no se repiten en personajes importantes (ver `universos/00_comun.md`).

## Criaturas (20 líneas, 41 formas)
Las cuatro dimensiones se pueden poblar **solo con las existentes** mediante tablas de aparición. Dibujos y sprites 2D/3D: reutilizar. Nuevas criaturas: opcional (huecos listados en cada ficha); siguen `GUIA_DE_NOMBRES.md` y `docs/DISENO_CRIATURAS.md`.

## Sistemas jugables ya existentes (R)
Pesca (`peces.js`, `pesca3d.js`; 20 peces visibles en 3 profundidades) · Profundidades (`profundidades.js`: 20 salas, 5 biomas con datos —cristal, mina, hongos, inundada, hielo—, 6 pisos especiales, 8 modificadores, 6 cofres, 2 eventos; los biomas **lava** y **sombra** están planificados pero no definidos) · puzles para dos y su validador (`tools/validar_puzles.js`) · crianza (`crianza.js`, Doctora/laboratorio) · tablón de intercambios y buzón · nivel y XP de entrenador · economía equilibrada (v2.350) · ciclo día/noche (`ciclo.js`) · luces de farolas HD-2D · música/sonido por código (`audio.js`, `musica_combate.js`).

## Lo que NO existe y es nuevo (N)
Peces propios por dimensión · materiales/curiosidades como tipo de objeto · nivel base de criaturas por región/dimensión (hoy solo rareza) · tipos de actividad (cocina, censo, torneo) · eventos de mundo · temas de terreno distintos de Carbuna · biomas lava y sombra · piezas decorativas temáticas · música por dimensión · guiones en datos.
