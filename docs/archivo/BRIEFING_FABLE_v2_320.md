# BRIEFING PARA FABLE 5.2 · Criaturas de Lali y Oli (v2.319 → v2.320+)

**Léelo entero y empieza.** Responde en español, breve y directo. **Trabaja SIN INTERRUPCIONES** (ver §5) y entrega **un solo ZIP** al final, con un resumen corto (qué hiciste, qué comprobaste, qué queda). No gastes tokens leyendo todo el código: usa `docs/MAPA_ARQUITECTURA.md` para orientarte y lee solo los módulos que toques.

## 0 · Lectura obligatoria (en este orden)
`CLAUDE.md` (normas permanentes: **listo para online**, **diseño espacial**, **decoración en sitios lógicos**) → `docs/CONTINUAR.md` → `docs/MAPA_ARQUITECTURA.md` → `docs/SESION.md` (últimas secciones, v2.315-v2.319: economía, tendero, Bolsa, cifras) → `docs/BIBLIA_VISUAL.md` y `docs/BIBLIA_INTERIORES.md` (estilo) → `docs/HISTORIA_Y_MUNDO.md` §6 y las regiones.

## 1 · Alcance y límites
- **Solo el 2D.** Nada de HD-2D: cada efecto visual nuevo se anota en `docs/SESION.md` como pendiente del HD-2D (norma del proyecto). No toques `hd2d_*`.
- **Fuera de alcance:** combate cooperativo (lo hace otra sesión), actividades secundarias, atlas completo de Tonavia, «mundo vivo». No amplíes la tarea.
- Motor **puro y determinista**: órdenes + semilla, sin `Math.random`, sin DOM, sin relojes de pared; estado nuevo en `est`/`j`, serializable y con versión; jugadores por id (nada de `oli`/`lali` a fuego en lógica nueva); contenido como **datos**; todo ligero y generado por código.
- Cifras de la interfaz: ya hay una fuente propia (`tools/cifras_pixelify.py`). No cambies la tipografía.
- Nada destructivo ni irreversible sin autorización. No des por verificado lo que no hayas comprobado.

## 2 · MISIÓN 1 — «Profundidades»: el sistema de cuevas desde cero (la mayor)
Hoy **no existe ninguna cueva**. Objetivo: un mundo que no se acaba. Tonavia sigue a mano; las cuevas son pisos **generados por semilla**, distintos cada vez que se entra, pensados para dos jugadores.
**Requisitos**
1. **Entradas** en los mapas (puerta/ancla especial de `maps/*.json`, con aspecto de cueva en 2D) que llevan al piso 1. Reutiliza el sistema de puertas, `j.volver` y el editor de mapas.
2. **Generador puro** (`src/profundidades.js`): semilla = f(semilla de partida, id de entrada, nº de expedición, piso). Monta cada piso con **salas prefabricadas como datos** (cámaras, pasillos, puzles, sala de jefe, escalera de bajada/subida). Garantías comprobadas por test con miles de semillas: **transitable al 100 %**, pasillos ≥ 1 casilla, escalera alcanzable, sin objetos aislados, mismo resultado en dos móviles.
3. **Estado serializable y versionado**: piso actual, semilla, cofres abiertos, puzles resueltos, jefes vencidos; se guarda y se restaura (`guardado.js`).
4. **Puzles para dos jugadores**, como datos: placas de presión, puertas, palancas, bloques empujables. Deben ser **intuitivos** (se entienden en un vistazo).
5. **Encuentros y jefes de piso** reutilizando el combate existente; dificultad creciente con la profundidad; un jefe cada pocos pisos.
6. **Recompensas**: Brillos y objetos (`src/tienda.js`); deja un hueco claro para **huevos** (Misión 2).
7. **Aspecto 2D de cueva**: baldosas, objetos, paleta, ambiente/luz y música por código, en el estilo de `BIBLIA_VISUAL.md`. Varias semillas deben verse variadas pero coherentes.
8. **Editor**: si hace falta, amplía `tools/editor_mapas.*` solo para lo que esta misión necesite (colocar entradas y ver/editar salas prefabricadas).
9. **Revisión espacial** (norma del proyecto): capturas a 390×844 de varias semillas, caminando por ellas; anótalo en `docs/SESION.md`.

### Nivel de calidad exigido en las Profundidades (profesional, no básico)
No basta con pegar salas al azar. Se exige, como mínimo:
1. **Estructura con ritmo:** el generador arma un recorrido con intención (entrada → combate → puzle → tesoro → miniJefe → llave → jefe), con **puertas con llave**, **atajos que abren bucles** y **secretos con pistas**.
2. **Cuevas orgánicas:** zonas abiertas con bordes naturales y **auto-baldosas** (sin contorno cuadriculado); salas hechas a mano para puzles y jefes.
3. **Al menos 5 biomas** (cristal, mina, hongos, inundada y hielo o lava), cada uno con paleta, baldosas, música por código, enemigos y **una mecánica ambiental propia** (suelo resbaladizo, oscuridad con linterna, charcos que frenan…).
4. **Luz y atmósfera 2D:** linterna por jugador, antorchas y cristales que iluminan, oscuridad con radio, polvo, niebla y sombras. Rendimiento fluido en móvil (generación incremental por piso).
5. **Al menos 12 tipos de puzle** combinables y con **resolutor automático**: cada puzle generado debe tener solución y **necesitar a los dos jugadores**; dificultad escalada por profundidad.
6. **Rejugabilidad:** al menos **6 tipos de piso especial** (tesoro, santuario, evento, tienda subterránea, jefe oculto, descanso), **modificadores de expedición** (bendiciones y maldiciones), **expedición diaria** (misma semilla para todos) y **récord de profundidad** guardado.
7. **Descubrimiento:** **minimapa** que se va revelando, cofres con rareza y llaves.
8. **Calidad medida:** banco con miles de semillas (variedad, longitud del recorrido, tiempo estimado por piso, ningún piso injugable) y una **hoja de contacto de 50 pisos** (`docs/hoja_pisos.png`) para revisar de un vistazo.

## 3 · MISIÓN 2 — Crianza genérica (la pieza principal del juego)
Dos criaturas (en cooperativo, una por jugador) dejan un huevo en la incubadora del Laboratorio; eclosiona andando; la cría hereda rasgos con mutaciones determinadas por semilla.
**Requisitos**
1. **Sistema genérico guiado por datos** (`src/crianza.js`, puro): genes, herencia, mutación, estadísticas y habilidades. Cada línea de criaturas declara su **ficha de cría** (capas, paleta, marcas, partes, reglas) y un indicador `lista`. **Añadir una criatura nueva con su ficha le da huevos automáticamente, sin tocar código.**
2. **Validador** que lista qué líneas están listas y cuáles no, y falla con un mensaje claro si una ficha está incompleta. Documenta cómo preparar una línea nueva en `docs/GUIA_CRIANZA.md` y añade el paso al proceso de creación de criaturas.
3. **Sintetizador de sprites por capas en 2D** que mantenga el estilo dibujado a mano del juego.
4. **Estado**: huevos del jugador (serializable, con versión), eclosión por distancia, incubadora del Laboratorio y una interfaz mínima (clara en móvil, cifras legibles).
5. **Piloto con UNA sola línea** (la mejor hecha; elígela tú y justifícalo en `docs/SESION.md`). Genera una **hoja de contacto de 8 crías** (`docs/hoja_crias_<linea>.png`) y **sigue sin parar**: deja la cría **activa solo en el piloto** (un indicador `lista` en sus datos que el usuario puede apagar con un cambio de una línea) para que el sistema se pueda probar entero. El usuario revisará la hoja después; ninguna otra línea se activa.
6. Las líneas con arte imperfecto **no se activan**: solo las que el usuario apruebe.

### Diseño de la crianza decidido por el usuario (punto de partida; todo ajustable por datos)
- **Flujo:** la Doctora Nora (NPC del Laboratorio, por crear siguiendo el patrón de Alba y Teo: sprite propio, casilla `anclas.npc`, diálogo con menú) ofrece «Criar». El jugador elige **dos criaturas compatibles** y paga **Brillos**; el huevo va a una de las **3 incubadoras** del Laboratorio; **eclosiona andando** cierta distancia (en cooperativo cuentan los pasos de los dos jugadores).
- **Compatibilidad:** **cualquier pareja de líneas aprobadas** (`lista`). La cría es de la línea de **uno de los padres** (elegido por semilla) y siempre nace en su **primera fase**.
- **Herencia (determinista con semilla = f(partida, id del huevo, padres)):** color, marcas y partes (cola, orejas, cresta…) de uno u otro padre; estadísticas = media de los padres con una pequeña variación («talento» por estadística); una habilidad de los padres; **mutación rara** que da un color o una marca especial.
- **Cooperativo:** cada jugador aporta un padre; la pareja cooperativa tiene más probabilidad de mutación y enlaza con la evolución por pareja (cascabel) ya prevista en `HISTORIA_Y_MUNDO.md`.
- **Frenos:** coste fijo en Brillos por huevo; los padres **descansan** un tiempo medido en **pasos**; solo crían las líneas con `lista`.
- **Todo número (coste, pasos de eclosión, descanso, probabilidad de mutación) va en un archivo de datos** (p. ej. `datos/crianza.json`) con comentarios, para que el usuario o Sonnet lo ajusten luego sin tocar código. Incluye un simulador que informe del reparto de rasgos y de la frecuencia de mutaciones.

## 4 · Orden y calidad
Orden: Misión 1, luego Misión 2, luego el legado de §5. Para cada una: diseño breve por escrito (en `docs/SESION.md`) → implementación → tests propios dentro de `test.js` → revisión visual.
**Verificación:** `node build.js` → `node test.js` (hoy solo falla «texturas: prueba de Chromium», anterior a esta tarea) → `node tools/huella_juego.js --comprobar` (si cambia a propósito: `--escribir` y `--clasico --escribir`, y anótalo) → pruebas de navegador de lo tocado (`tools/prueba_*.py`, 2-4 como máximo; escribe una `prueba_profundidades.py` y una `prueba_crianza.py`).
**Eficiencia:** delega a un subagente barato solo la ejecución de build, tests y pruebas, pidiendo un informe de pocas líneas. El tope de peso de `dist/criaturas.html` en `test.js` es 1.800.000 caracteres; si hace falta subirlo, hazlo, pero anótalo y avisa.
**Entrega:** un ZIP del proyecto, `docs/SESION.md` actualizado (con lo pendiente del HD-2D), `docs/CONTINUAR.md`, `docs/ROADMAP.md` y `CLAUDE.md` al día.

## 5 · Autonomía total y legado para Sonnet (ahorra tokens futuros)
**Sin interrupciones.** No uses preguntas al usuario ni te detengas a esperar aprobación. Cuando haya una decisión razonable, tómala y anótala en `docs/SESION.md` (sección «Decisiones de Fable», una línea cada una). Solo para ante algo **destructivo o irreversible**. Autorizado: subir el tope de peso de `dist/criaturas.html` en `test.js` lo necesario (anótalo); regenerar huellas del 2D si el dibujo cambia a propósito.
**Deja todo preparado para que una sesión mucho más barata (Sonnet) pueda ampliar el sistema sin rehacerlo ni releerlo.** Entregables obligatorios:
1. `docs/GUIA_PROFUNDIDADES.md`: cómo añadir una sala, un puzle, un jefe, un piso especial, un modificador o un bioma nuevo, **solo con datos**, con un ejemplo mínimo real y una lista de comprobación.
2. `docs/GUIA_CRIANZA.md`: cómo preparar una línea nueva (plantilla de ficha de cría, ejemplo completo, qué capas dibujar, cómo activar `lista`).
3. **Herramientas con salida de UNA línea («OK» o «FALLA: motivo»)**, para no gastar tokens leyendo informes: `tools/validar_salas.js` (salas), `tools/validar_puzles.js` (resolutor: cada puzle tiene solución y exige a los dos), `tools/probar_semillas.js <n>` (miles de semillas: transitable, escalera alcanzable, sin objetos aislados, métricas), `tools/hoja_pisos.js <bioma>` (hoja de contacto de 50 pisos), `tools/validar_crianza.js` (líneas listas y fichas incompletas) y `tools/hoja_crias.js <linea>` (hoja de contacto de una línea).
4. **Plantillas** de datos con comentarios en `maps/` o en una carpeta `plantillas/` (sala vacía, ficha de cría vacía).
5. Módulos pequeños y con **comentario de cabecera estándar** (primera línea: `// nombre.js — qué es`), y `python3 tools/mapa_arquitectura.py` ejecutado al final para dejar `docs/MAPA_ARQUITECTURA.md` al día.
6. `CLAUDE.md`: añade ≤ 10 líneas en «Notas de arquitectura» con lo imprescindible de las Profundidades y la crianza (módulos, estado en `j`/`est`, órdenes, cómo se prueban). Actualiza `docs/CONTINUAR.md` y `docs/ROADMAP.md`.
7. En `docs/SESION.md`, una sección final «Qué puede hacer Sonnet a partir de aquí» con 5-8 tareas concretas, cada una con el comando de verificación.

## 6 · Cómo trabajar de forma eficaz (muy importante)
- **Planifica antes de escribir:** un diseño breve por misión en `docs/SESION.md` y después implementa de una vez; no rehagas ni releas lo que ya funciona.
- **Piensa en el siguiente que trabaje aquí (Sonnet, más barato):** todo lo que no exija tu nivel (más salas, más puzles, más biomas, más líneas con cría, equilibrio, retoques) debe poder hacerse **solo con datos, guías y herramientas**, sin tocar el motor. Si algo se puede dejar como dato en vez de código, déjalo como dato.
- **Reserva tu esfuerzo para lo difícil:** el generador, el resolutor de puzles, la luz 2D, las auto-baldosas, la estructura con ritmo y el sintetizador de crías. Lo repetitivo (rellenar contenido) déjalo preparado con plantillas y **ejemplos completos** para que lo rellene otra sesión.
- **Calidad sobre cantidad de contenido:** entrega los 5 biomas y los 12 puzles **bien hechos y probados**; el contenido extra lo añadirá Sonnet con tus guías.
