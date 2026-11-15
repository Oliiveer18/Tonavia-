# MUNDO · plan de Tonavia (v2.320, PROPUESTA para aprobar)

Datos: `datos/mundo.json` · validador: `node tools/validar_mundo.js` (una línea). Nada de esto toca el juego todavía: es el plan sobre el que se construirá.

## Forma del mundo
Albanota es el centro con 4 salidas (hoy sus bordes están sin conectar). Cada región = pueblo + gimnasio (con santuario del Eco) + 2 casas de plantilla; Centro PC y Tienda son mapas compartidos.

```
                 Cirrena (aire)*  ── cumbre_aire (tras los 7 ecos)
                      │ ruta_cirrena_1
 Silvara ─ ruta ─ ALBANOTA ─ ruta ─ Carbuna ─ ruta_v ─ Fulgoria
 (hoja)               │ ruta_obsidra_1  (fuego)        (eléctrico)
    │ ruta_v      Obsidra ─ ruta_h ─ Umbrada
 Marenda          (roca)             (sombra)
 (agua)
 * cerrada hasta tener 6 ecos (propuesta; Aire es el último de los 7)
```

## Regiones
| Región | Elemento | Terreno (lo que pintará el motor) | Cueva (Profundidades) |
|---|---|---|---|
| Silvara | Hoja | prado y bosque claro | hongos |
| Carbuna | Fuego | volcán, ceniza y **lava** | **lava (bioma nuevo)** |
| Marenda | Agua | costa, lagos y puentes | inundada |
| Fulgoria | Eléctrico | llanura con torres y cables | cristal |
| Cirrena | Aire | montaña, **nieve y hielo** | hielo |
| Obsidra | Roca | cañón y desierto de obsidiana | mina |
| Umbrada | Sombra | **bosque oscuro** y pantano | **sombra (bioma nuevo)** |

## Cifras (50 mapas)
7 pueblos nuevos (48×36) + Albanota · 7 rutas (64×32 o 32×64) · 7 gimnasios (24×30) · 7 santuarios (20×20) · cumbre (48×48) · 14 casas + interiores. **Las cuevas NO son mapas a mano**: son entradas al generador de las Profundidades (un bioma por región), así se ahorran 7 mapas y salen infinitas.

## Decisiones propuestas (apruébalas o cámbialas)
1. Orden libre entre las 6 primeras regiones; Cirrena (Aire) abre con 6 ecos y la cumbre con los 7.
2. Carbuna es la región de prueba (confirmado): pueblo, ruta de entrada, gimnasio, santuario y cueva de lava.
3. Gimnasio = esqueleto común (24×30) con líder; **sin puzles por ahora** (decisión del usuario, 11 nov: no se tocan los puzles).
4. Dos biomas de cueva nuevos (lava, sombra): se añaden con datos (`GUIA_PROFUNDIDADES.md`).
5. Los mapas de terreno se generan con recetas (motor de terrenos de Fable) y se retocan con el editor; no se pintan casilla a casilla.

## Pendiente (siguientes pasos)
- Motor de terrenos 2D (Fable): auto-baldosas, paletas, luz y ambiente por región; primero solo Carbuna.
- Producción de mapas (Sonnet) con `validar_mundo.js` y el editor.
