# UNIVERSOS · Convenciones comunes (leer antes de los cuatro universos)

Todo lo de esta carpeta es **diseño y contenido en papel**. Nada está en el código ni en `datos/`. Los ids de mapa llevan el prefijo de la dimensión (`chuches/villa_merengue`) como **propuesta**: el formato final de ids lo decide Fable (auditoría §8.8). Los nombres propios son provisionales (los de criaturas siguen `GUIA_DE_NOMBRES.md`; aquí no se crean criaturas nuevas con nombre).

## Leyenda de estado (se usa en todas las tablas)
- **A** = se puede preparar y crear YA (usa solo lo que existe: mapas JSON, objetos, plantillas, compositor).
- **B** = necesita el contrato de Fable (formato de dimensión, portales, tablas de aparición, guiones, eventos…).
- **C** = solo integrable cuando el motor dimensional funcione.

## Multiplicadores de aparición (se usa en las tablas de criaturas)
Se aplican al pool COMPLETO de las 20 líneas. **×1 = peso normal.** Lo que no se nombra es ×1. Nunca se excluye una línea salvo que se diga («0»). Los pesos de rareza (base común 60 · rara 28 · épica 10) se retocan por dimensión como en cada ficha. Las legendarias siguen solo en guaridas.
Escala: **×3** abundante · **×2** frecuente · **×1** normal · **×0,5** escasa · **0** ausente.

Las 20 líneas actuales (fuente: `src/lineas.js`): pompon (agua·común) · aguacato (hoja·rara) · fosforin (fuego·común) · pilita (eléctrico·rara) · nubecin (aire·común) · cuarzin (roca·rara) · somnin (sombra·rara) · setin (hoja·común) · caracolin (agua·rara) · lunabu (sombra·épica) · cenel (fuego·común) · ferrel (roca·común) · dandel (aire·común) · zefirax (aire+eléctrico·legendaria, ya tiene guarida en Albanota) · zumbel (eléctrico·común) · arenel (roca·común) · perlel (agua·rara) · arcel (eléctrico·rara) · forjel (fuego+roca·épica) · cactel (hoja·rara).

## Reglas de diseño de las fichas
- Cada universo = 3-4 regiones; cada región = pueblo + ruta(s) + 1 lugar especial. Evita repetir mapas: se reutilizan **plantillas** (casa, Centro PC, tienda, gimnasio).
- Tamaños de mapa estándar (de `docs/HISTORIA_Y_MUNDO.md`): pueblo 48×36 · ruta horizontal 64×32 · ruta vertical 32×64 · ruta grande 64×64 · cumbre/cueva 48×48 · gimnasio 24×30 · interior ≈10×8.
- Diseño espacial intencional (norma de `CLAUDE.md`): rejilla de 16 px, equilibrio, sin huecos muertos.
- **Dificultad y premios:** hoy el nivel de una criatura salvaje depende solo de su rareza (`G.nivel.nivelSalvaje`), no del mapa ni de la dimensión. Por eso las «bandas de nivel» de cada universo son **propuestas (B)**: requieren que el motor admita un nivel base por región. Los premios deben respetar la tabla de `docs/SESION.md` v2.350 (combate/objetos/curar/nivel).
- **No se promete contenido nuevo de criaturas.** Cada ficha lista, como opción, qué *huecos* de diseño tendrían sentido (elemento + rareza + idea); su creación sigue el proceso existente de fichas y nombres.
- Nombres de personajes: evitados los de la lista de `datos/agentes.json` (Vera, Nora B., Maia…) para no confundirlos con entrenadores autónomos.
