# PROPUESTAS DE ESTRUCTURAS DE DATOS
**Todo esto es PROPUESTA.** Fable decide el contrato definitivo (auditoría §8.8); si lo cambia, el contenido de `universos/` se convierte con una pasada mecánica. Lo que ya existe de verdad en el proyecto está marcado **[existe]**; lo demás es nuevo.
Principios: datos, no código; ids de dimensión y de mapa en minúsculas con `_`; nada que contradiga las normas de `CLAUDE.md` (motor puro, estado serializable).

## 1. Dimensión — `datos/dimensiones/<id>.json` (nuevo)
```json
{
  "v": 1, "id": "chuches", "nombre": "Reino de las Chuches",
  "entrada": { "mapa": "chuches/villa_merengue", "ancla": "portal" },
  "mapas": ["chuches/*"],
  "regiones": ["valle_algodon", "bosque_gominola", "montanas_turron", "lago_cacao"],
  "dificultad": { "nivelBase": 8, "nivelMax": 22 },
  "reglas": { "ciclo": "global", "requisitos": [] },
  "apariciones": "ref: ver §4",
  "entrenadores": "ref: ver §5",
  "economia": { "premios": 1.0, "precios": 1.0 },
  "visual": "ref: ver §7"
}
```
Dependen del motor (B): `nivelBase/nivelMax` (hoy el nivel sale solo de la rareza), `reglas.requisitos`, `reglas.ciclo`, `economia`.

## 2. Región y mapa
**Mapa [existe]:** el formato JSON de `maps/*.json` no cambia (`capas`, `objetos`, `anclas`, `puertas`, `conexiones`, `zonas`, `npcs`, `pesca`, `region`). Propuesta mínima de añadidos:
```json
{ "id": "chuches/villa_merengue", "region": "valle_algodon", "tema": "chuches_pastel", "...": "..." }
```
`region` ya existe en el mapa [existe]; el contenido de región (luz, música, tema) hoy está en código (`capas.js`) y deberá leerse de datos (B).

## 3. Portales y destinos
Puerta actual [existe]: `{ "id": "tienda", "destino": { "mapa": "tienda", "ancla": "entrada" } }`.
Propuesta: `destino` admite `dim`:
```json
{ "id": "portal_chuches", "x": 22, "y": 6, "destino": { "dim": "chuches", "mapa": "chuches/villa_merengue", "ancla": "portal" },
  "portal": { "color": "#ff8fc7", "icono": "chuche", "requisitos": [{ "t": "nivelEntrenador", "n": 5 }] } }
```
`dim` omitido = misma dimensión (compatibilidad). El campo `portal` (visual + requisitos) depende del motor (B); sus requisitos concretos son una decisión de diseño aún abierta (nivel de entrenador, ecos devueltos, objeto…).

## 4. Apariciones de criaturas
Hoy [existe]: `zonas: [{ id, x, y, w, h, elemento }]` y pesos globales `AJUSTES.PESOS`. Propuesta: `apariciones` por dimensión y, opcional, por zona:
```json
{
  "rareza": { "comun": 62, "rara": 28, "epica": 10 },
  "zonas": {
    "claros_fruta": { "x": { "setin": 3, "aguacato": 2, "cactel": 2, "cuarzin": 0.5 } },
    "espesura_regaliz": { "x": { "somnin": 3, "lunabu": 2, "setin": 2, "nubecin": 0.5 }, "cond": { "noche": 2 } }
  }
}
```
- `x` = multiplicadores por **línea** (`fam`) o por **elemento**; lo no nombrado vale 1; `0` excluye explícitamente.
- `cond` (hora, clima): depende de que Fable conecte `G.ciclo` con la aparición (B).
- Las tablas por zona de las cuatro fichas (`universos/*.md §8`) se convierten 1:1 a este formato.

## 5. NPCs y entrenadores
**NPC fijo [existe: maps `npcs` tipo `npc`, guion en `src/npc.js`].** Propuesta de guion como dato:
```json
{ "id": "maestro_tarta", "nombre": "Maestro Tarta", "rol": "tienda", "aspecto": "ref entrenadores.js",
  "dialogo": [ { "id": "inicio", "texto": "…", "opciones": [ { "txt": "…", "accion": "tienda" } ] } ] }
```
(B: contrato de guiones y acciones.)
**Entrenadores autónomos [existe `datos/agentes.json`]:** por dimensión se añade, sin tocar el sistema:
```json
{ "poblacion": 10, "nombres": ["…"], "frases": { "…": ["…"] }, "ambiciones": { "coleccionista": 2 }, "grafo": "ref: mapas y rutas de la dimensión" }
```
(B: el sistema actual lee un solo grafo `datos/mundo.json`; el grafo por dimensión lo diseña Fable.) Entrenadores fijos (Barón Caramelo, Kira…) son agentes con equipo prefijado (B).

## 6. Actividades y eventos
Propuesta mínima, solo como **catálogo de tipos** (la implementación es de Fable):
```json
{ "actividades": [ { "id": "receta_real", "tipo": "coleccion", "pasos": [ { "obtener": "ingrediente_nube", "donde": "claros_fruta" } ] } ],
  "eventos": [ { "id": "dia_golosina", "cada_dias": 6, "dura_dias": 1, "efectos": [ { "t": "rareza", "mult": 1.5 } ] } ] }
```
**[existe]** para referencia: `eventos`/`modificadores`/`cofres` de Profundidades (`datos/profundidades.json`) y las ambiciones de entrenadores; no hay sistema general de misiones ni de eventos de mundo (N).
Tipos de actividad que las fichas necesitan: `coleccion` (reunir objetos/criaturas), `entrega`, `pesca`, `censo` (registrar especies), `torneo`, `puzle`, `cocina` (minijuego). Cada uno es una decisión de alcance de Fable (B/C).

## 7. Configuración visual y ambiental
Hoy [existe]: temperatura de luz por región (`capas.js`, `REGIONES`), `TEMAS` de terreno (`terreno.js`, solo Carbuna), ciclo día/noche, luces de farolas. Propuesta de dato:
```json
{ "visual": { "luz": { "tinte": "#ffd9ec", "fuerza": 0.18 }, "terreno": "chuches_pastel", "musica": "caja_musica", "particulas": "confeti_suave", "nocheSiempre": false } }
```
Todo lo visual debe resolverse en los **dos pintores** (2D y HD-2D) o anotarse como pendiente (norma del proyecto).
