# ESTUDIO · CRAFTEO Y EQUIPAMIENTO DE CRIATURAS
**Estado: PROPUESTA PARA DECIDIR JUNTOS. Nada de lo que aparece aquí está aprobado.** Es solo estudio: no se ha tocado código, objetos, recetas, accesorios, criaturas, mapas, dimensiones, F6, FN, F8 ni la hoja de ruta, y no interfiere con `10_ESTUDIO_NAVEGACION.md`. Se desarrollaría cuando termine el trabajo de dimensiones y se decida abrir esta etapa. Todos los nombres de materiales, recetas, estaciones y accesorios son **ejemplos provisionales**, no contenido.

Base de código revisada (v2.356): `tienda.js` (Brillos, mochila, objetos, `usar`), `equipo.js` (equipo de 6, caja, ID permanente, motes), `combate.js` / `combate_motor.js` (estadísticas y unidades), `nivel.js`, `crianza.js` + `datos/crianza.json` (talento), `tablon.js`, `guardado.js`, `red.js`, `bolsa_ui.js`, `peces.js`/`pesca`, `aparicion.js`, `cueva2d.js`, y los contratos 06-08.

---
## 1. Visión general
**Idea:** fabricar es una *capa opcional* que convierte lo que el jugador encuentra explorando, pescando, cuidando criaturas y completando misiones en cosas útiles y bonitas, sin armas del jugador. Tres productos: (1) **objetos de aventura** (consumibles, capturas, herramientas, comida), (2) **accesorios para criaturas** y (3) **cosmética/identidad**.

**Principios propuestos** (a aprobar):
1. **Nunca obligatorio.** Todo lo necesario para avanzar se puede conseguir sin fabricar (tienda, hallazgos, misiones). Fabricar da *alternativas y personalización*, no un techo de poder.
2. **Recompensa descubrir, no repetir.** Las recetas avanzadas dependen de *haber encontrado* algo (un secreto, un lugar, una criatura, una misión), no de acumular cantidad.
3. **El jugador no ataca.** El equipamiento es de las criaturas; el jugador solo lleva herramientas (linterna, brújula…).
4. **Módulo independiente.** Un módulo nuevo `G.crafteo` con sus datos propios; se engancha en pocos puntos existentes, sin refactorizar.
5. **Datos, no código.** Materiales, recetas y accesorios son JSON validados (como `datos/crianza.json`); añadir una dimensión = añadir un archivo.
6. **Determinista y guardable.** Misma regla que el resto: funciones puras sobre `est`, validadas, sin `Math.random`.

---
## 2. Categorías de fabricación
| Categoría | Qué es | Encaje con lo existente | Riesgo |
|---|---|---|---|
| **Consumibles** | curación, revivir, antídotos (quitar estados), mejoras temporales | `tienda.usar` ya cura/revive andando; las pociones NO se usan en combate (se mantiene) | bajo |
| **Captura** | cápsulas especiales | hoy las esferas son un contador `j.esferas`; la captura se ofrece con la salvaje «en rojo» | medio (hay que leer la fórmula de captura) |
| **Cebos y señuelos** | atraer o ayudar a localizar | **seguro en pesca** (`pesca.elegir(est.rnd, zona)` ya elige pez por zona). En tierra, **no** tocar el plan de aparición (depende solo de semilla+mapa; cambiarlo por jugador desincroniza el cooperativo) | alto en tierra / bajo en pesca |
| **Herramientas de exploración** | linterna, brújula, detector de secretos | la linterna ya existe en cuevas (`cueva2d.js`); la brújula encaja con la navegación pirata; el detector necesita el sistema de secretos (aún no existe) | medio |
| **Alimentación y cuidado** | comida con efecto temporal; cuidados | efecto temporal = dato con caducidad medida en `est.reloj` (determinista) | bajo (comida) / sin base (cuidado, §10 D9) |
| **Accesorios** | equipables de criaturas | ver §5 | medio-alto (equilibrio) |
**Recomendación de alcance inicial:** consumibles + accesorios + comida (las tres cosas que no tocan sistemas frágiles). Cápsulas, cebos de pesca y herramientas, en entregas posteriores. Cebos de tierra: no.

---
## 3. Materiales y recetas
### 3.1 Materiales
- **Propiedades en vez de solo nombres:** cada material lleva etiquetas (p. ej. `dulce`, `marino`, `ligero`, `resistente`, `luminoso`). Las recetas pueden pedir «1 material resistente» o un material concreto. Ventaja: cada dimensión aporta materiales *propios* que además *sirven* en recetas de otras, y el contenido nuevo no obliga a reescribir recetas.
- **Clases:** *comunes* (en varias dimensiones, cantidad), *regionales* (propios de una dimensión o región), *singulares* (un solo origen: secreto, misión, criatura legendaria; se obtienen una vez o pocas).
- **Orígenes** (los que has pedido): exploración (puntos de recolección), pesca (peces e ingredientes marinos), misiones (materiales únicos), **interacción amistosa con criaturas** (cuidarlas/alimentarlas da un «regalo» ocasional), y descubrimientos (primer hallazgo de un lugar). **Sin botín de combate** (salvo premios únicos de jefes), para que el crafteo no empuje a farmear combates.
- **Rareza y límites:** reutilizar las clases del juego (común/rara/épica/singular). Apilado máx. 99 comunes y 20-50 raras (decisión D4). Inventario de materiales propio, sin límite de «huecos» (la unidad es la pila), para no crear tareas de gestión.
- **Ejemplos provisionales de identidad por dimensión** (ilustrativos, no aprobados): Tonavia = fibra, resina, bayas, mineral · **Chuches** = azúcar cristalizada, cacao puro, algodón dulce (sabor, cuidado, PS) · **Isla Pirata** = madera de naufragio, perla, cuerda, cristal de rayo (velocidad, resistencia) · **Cerezo** = bambú, seda, tinta, pétalo, laca (defensa, serenidad).

### 3.2 Recetas
- **Estados:** desconocida → **pista** (se ve que existe) → **conocida**. Se guardan por jugador.
- **Cómo se descubren:** misiones, maestros/NPC, secretos, *primer hallazgo* de un material (te sugiere qué hacer), y **experimentar** en una estación con combinaciones razonables (el cuaderno anota lo que funciona). Las recetas básicas vienen conocidas.
- **Varios pasos:** máximo **2 niveles** (material → intermedio → producto, p. ej. hilo → tela → lazo). Los intermedios se apilan. Más pasos sería tedio.
- **Cantidades:** pocas (1-5 por ingrediente, ≤ 3 ingredientes distintos). Fabricar por lotes (×N) en una sola orden.
- **Sin repetición forzada:** ningún objeto *necesario* para avanzar exige una receta; las recetas avanzadas piden *un hallazgo distinto*, no 50 de lo mismo.

### 3.3 Cómo evitar que conseguir materiales sea una tarea repetitiva
1. Los puntos de recolección **rotan el contenido por día de juego** (derivado de semilla+punto+día, determinista): volver a un lugar no da siempre lo mismo y explorar sitios nuevos compensa más.
2. **Saturación suave:** el mismo punto da menos si se recoge muchas veces seguidas el mismo día (sin castigar jugar).
3. Pocas cantidades por receta + intercambio de propiedades (se puede sustituir un material por otro de la misma propiedad).
4. Materiales singulares ligados a *hechos* (misión, secreto), no a tiempo.
5. Nada de rachas diarias obligatorias ni de recompensas por conectarse.

---
## 4. Estaciones de fabricación
**Organización propuesta (sencilla y escalable): tres estaciones funcionales, una sola interfaz.**
| Estación | Qué fabrica | Tipo de sitio |
|---|---|---|
| **Banco de trabajo** | herramientas, accesorios, piezas intermedias | edificio/objeto en pueblos |
| **Cocina** | comida, cuidado de criaturas | casa/taberna/pastelería |
| **Laboratorio** | consumibles, cápsulas, cebos de pesca | Centro PC, casa de alquimista |
Cada dimensión puede tener **su variante local** (p. ej. la Cocina de Chuches = el «taller de cocina» ya aprobado como contenido futuro en D10; en el Cerezo, un taller de artesano; en la Isla Pirata, el astillero ya cubre el barco y *no* es una estación nueva). Una variante local es *la misma estación* con recetas y arte propios, no un tipo nuevo.
- **Cómo se implementa:** igual que el tendero: un NPC/objeto de mapa con `estacion: <id>` y la orden `fabricar` exige estar a su lado (patrón de `tienda.comprar`). Sin tocar mapas hoy.
- **Alternativas:** (A) *una sola mesa con pestañas* (más simple, menos identidad); (B) **tres estaciones** (recomendada: poca cantidad, identidad clara); (C) estaciones por dimensión (se multiplican y confunden). Recomiendo B + variantes locales opcionales.

---
## 5. Equipamiento de criaturas
### 5.1 Ranuras
| Opción | Descripción | Valoración |
|---|---|---|
| 1 ranura | un accesorio por criatura | simple, poca expresividad |
| **2 ranuras tipadas (recomendada)** | **Cuerpo** (collar/arnés: PS, defensa) + **Adorno** (lazo/cinta/amuleto: velocidad, efecto pasivo) | decisión con sentido, fácil de equilibrar y de mostrar |
| 3 ranuras (+ reliquia) | tercera ranura desbloqueable (p. ej. nivel 30 o rareza) | posible ampliación futura, decidir más adelante |
Un accesorio de un tipo no se puede poner en la ranura del otro. **No se repiten accesorios iguales** en una misma criatura.

### 5.2 Anclaje y guardado
- Se asocian al **ID permanente de la criatura** (Nº 0042, `equipo.js`; existe tanto en el equipo como en la caja y no se reutiliza): `j.cra.eq[id] = [cuerpo, adorno]`. Así el accesorio viaja con la criatura al pasar de caja a equipo y viceversa. (Alternativa: por clave de equipo, como `j.motes`; se rompe al mover de la caja).
- Los accesorios sin equipar viven en el inventario de accesorios `j.cra.acc {id:n}` (apilables; no son únicos con estadísticas aleatorias en v1 → menos errores de guardado y menos incentivo a repetir tiradas).
- **Soltar o intercambiar** una criatura (Alba/tablón): sus accesorios vuelven automáticamente al inventario (nunca se pierden ni se duplican; misma filosofía de «custodia» del tablón). Una criatura equipada no se puede ofrecer hasta quitarle los accesorios (o se quitan al publicar).
- **Equipar/quitar** solo fuera de combate (como las pociones).

### 5.3 En la ficha
En `equipo_ui.js` (ficha de criatura): dos casillas con el accesorio, el **efecto neto** resumido («+6 % defensa, −2 % velocidad») y los números finales de PS/ATQ/DEF/VEL ya con el equipo. Mostrar siempre cuánto aporta el equipo frente a la base, para que el jugador entienda.

### 5.4 Cómo entra en el combate (clave para no tocar el motor)
`G.combate.statsDe({forma, nivel, tal})` **ya admite multiplicadores por estadística** (`tal.ps/atq/def/vel`, hoy usados por el talento de las crías). Propuesta: el equipo se resuelve **antes** de empezar el combate a un multiplicador por estadística y se pasa por la misma vía (`combate_motor.js`, donde ya se construye `tal`). El motor de combate **no cambia**, queda puro y determinista, y las ventajas se *congelan al comenzar* (no se puede cambiar el equipo durante el combate). Los efectos pasivos «especiales» (resistir un estado, regenerar un poco…) **no** se incluyen en v1: requieren ganchos en el combate en tiempo real y simulación de equilibrio; se estudian en una entrega posterior (§10).

---
## 6. Bonificaciones y equilibrio
**Punto de partida real:** subir un nivel da +2,5 % de PS/ATQ/DEF (`nivel.js`, `MULT`); nivel 50 = ×2,225. Los entrenadores NPC y salvajes no llevan accesorios. Por tanto un accesorio de +6 % equivale a ~2-3 niveles en nivel bajo y pesa menos en niveles altos.

**Reglas propuestas (números a calibrar con `tools/calibrar_combate.js` y `tools/equilibrio.js`, no definitivos):**
1. Cada accesorio da **un bono principal pequeño** (p. ej. +3-6 %) y, desde el segundo escalón, **un compromiso** (p. ej. −2 % en otra estadística): se elige, no se acumula sin coste.
2. **Tope por estadística**: el total del equipo no pasa de +10-12 % (aunque se combinen), en cualquier combinación.
3. **Una sola ranura puede llevar efecto especial** (cuando existan).
4. Multiplicación con el talento de las crías: el producto *talento × equipo* tiene tope global (medir con simulación antes de fijarlo).
5. **Sin escalado exponencial:** no hay mejora de accesorios por niveles infinitos; hay 3 escalones fijos (básico, avanzado, singular).
6. **Techo de poder igual para todo:** un accesorio fabricado y uno encontrado/misión **comparten el mismo techo numérico**. Lo encontrado se distingue por *identidad* (efecto único, apariencia, historia), no por números mayores. Así nada hace inútil lo demás.
7. Consumibles fabricados **no superan** a los de tienda en cura por coste, sino que ofrecen otra cosa (cura + quitar estado, efecto más duradero). Revivir/curar de la tienda sigue siendo la base.
8. Los productos fabricados se venden por **menos** que el valor de sus materiales (no hay bucle de dinero).

**Cómo evitar una criatura excesivamente poderosa:** topes por estadística y global (reglas 2 y 4), compromisos, una sola fuente de especial, ningún accesorio que dé inmunidad total, y **prueba de simulación obligatoria** antes de publicar cualquier lote de contenido (el mismo validador que las tablas de aparición).

---
## 7. Integración con las dimensiones
- Los datos viven en `datos/crafteo/` con **un archivo por dimensión** (`tonavia.json`, `chuches.json`, `pirata.json`, `cerezo.json`) y un índice global pequeño. **No se tocan** los archivos de dimensión (`datos/dimensiones/<id>.json`): el esquema v1 rechaza claves ajenas, y mantener los datos separados evita cambiar el contrato de F3.
- Cada dimensión aporta: materiales regionales, 1-2 estaciones/variantes locales, una *familia* de accesorios con «sabor» distinto (provisional: Chuches = PS y recuperación, Pirata = velocidad y resistencia, Cerezo = defensa y equilibrio) y recetas ligadas a su historia y descubrimientos (mapa del tesoro, faroles, ceremonia del té…).
- **Materiales entre dimensiones:** las propiedades permiten que un material de una dimensión sirva en una receta de otra sin obligar a viajar constantemente, y las *recetas avanzadas* piden un hallazgo de otra dimensión (incentivo a explorar, no a repetir).
- **Requisitos de receta:** por nivel de entrenador (ya existe) y, cuando F6 llegue, por marcas de progreso (misión hecha, lugar descubierto) reutilizando el mismo registro de requisitos de los portales.
- **Dimensión no instalada:** el jugador puede tener ids de materiales de contenido que este juego aún no conoce (§8, riesgo de guardado): se **conservan** sin borrarse.
- **Orden de contenido** (si se aprueba): Tonavia y Chuches primero (coincide con D11), luego Pirata y Cerezo.

---
## 8. Integración técnica con los sistemas existentes
### 8.1 Qué se reutiliza
| Existente | Uso |
|---|---|
| `j.mochila` + `tienda` (compra/venta/usar, Brillos) | consumibles fabricados entran como objetos normales |
| Patrón «NPC cercano» (`tendero`, `enfermera`) | estaciones y órdenes `fabricar` |
| ID permanente + caja + custodia del tablón | anclaje de accesorios y traspasos seguros |
| `statsDe(..., tal)` | única vía de bonificación de combate |
| `nivel.js`, `datos/crianza.json` | modelo para datos ajustables y validados |
| `guardado.js` (validadores `*Ok`, secciones) | guardado nuevo |
| `bolsa_ui.js`, `equipo_ui.js` | pestañas y ficha |
| Pesca (`G.pesca`, `PECES`) | ingredientes y cebos de pesca |
| `G.hash` / `G.azar` | rotación determinista de recolección |
| Relojes `est.reloj` | caducidad de efectos y rotación diaria |
| Herramientas de equilibrio (`calibrar_combate`, `equilibrio`, `simular_combate`) | validar topes |

### 8.2 Qué hay que añadir (módulos nuevos)
`src/crafteo.js` (materiales, recetas, estaciones, fabricar; puro), `src/accesorios.js` (ranuras, equipar, resolución a multiplicadores; puro), `datos/crafteo/*.json`, `tools/validar_crafteo.js` (como `validar_crianza`), `tools/simular_equipo.js`, panel de fabricación y cambios de pestaña/ficha en las UI.

### 8.3 Qué cambia en contratos existentes (pocos y pequeños)
1. **`guardado.js`:** un bloque nuevo por jugador, `j.cra = { v, mat, rec, acc, eq, ef }`, con su validador. **Decisión importante:** hoy `mochilaOk` *descarta* ids que el juego no conoce. Para crafteo hay que **conservar** ids desconocidos con formato válido y cantidades acotadas (si no, instalar tarde una dimensión o abrir una partida en una versión anterior borraría materiales y recetas). Además, una versión anterior que cargue y vuelva a guardar *perdería* el bloque: proteger subiendo la versión de sección (mismo mecanismo que `seccionFutura`) para que lo bloquee.
2. **`tienda.js`:** `existe`, el catálogo `OBJ` y `usar` están cerrados a 4 objetos y a los tipos `cura/revive/esfera`. Hay que abrirlos a un **registro** (objetos de otros módulos) sin cambiar los existentes.
3. **`combate_motor.js`:** una línea para fundir el multiplicador del equipo con el `tal` que ya se pasa. `combate.js` no cambia.
4. **`equipo.js`:** al poner en caja / soltar / publicar en el tablón, devolver los accesorios al inventario (ganchos).
5. **Registro de órdenes** (previsto en F6): `fabricar`, `equipar`, `desequipar`, `recolectar`, `comer`. **Dependencia, no alteración de F6:** esta etapa se apoyaría en ese registro y en las marcas de progreso, que ya figuran en su alcance. Si no estuvieran disponibles, se podría hacer con el parche de órdenes que ya usa `tienda.js`, a decidir entonces.
6. **Mapas (contenido futuro):** objetos de estación y puntos de recolección, vía el compositor de mapas (no se tocan ahora).

### 8.4 Red y cooperativo
- Cada móvil es autoridad de **su** jugador (inventario, recetas, equipo): no viaja más que lo que hoy ya viaja. 
- **A verificar antes de implementar:** si el combate cooperativo usa criaturas de *ambos* jugadores; si es así, el multiplicador de equipo de la criatura del compañero debe viajar con el combate (campo nuevo en F8/versión de `red.js`). En el combate actual parece haber un único `est.combate.jid` por jugador, así que probablemente no hace falta, pero hay que comprobarlo.
- Sin comercio de objetos entre jugadores en la primera versión (evita duplicaciones y mercado paralelo); posible más adelante a través del tablón con custodia.

---
## 9. Riesgos y dependencias
| Riesgo | Gravedad | Mitigación |
|---|---|---|
| Pérdida de materiales/recetas de contenido no instalado o por versión antigua | **Alta** | conservar ids válidos; guard de versión (§8.3.1) |
| Desequilibrio de combate (talento × equipo × nivel) | Alta | topes, compromisos, simulación obligatoria, congelar al empezar |
| Cebos/señuelos que alteren el plan de aparición y desincronicen el cooperativo | Alta | no en tierra; solo pesca (§2) |
| Duplicar o perder accesorios al mover/intercambiar criaturas | Media | anclaje por ID, devolución automática, pruebas de ciclo completo |
| Tareas repetitivas / presión de «hay que fabricar» | Media | §3.3, §6, principios |
| Tamaño del inventario y de la UI | Media | pilas, pestañas, filtros |
| Rendimiento | Baja | los multiplicadores se calculan al empezar el combate y se cachean; recetas indexadas |
| Dependencia de F6 (órdenes, marcas) y de la navegación (brújula) | Media | etapas que no los necesiten van primero (§10) |
| Huellas 2D/clásico alteradas | Media | todo bajo `j.cra`, sin cambiar el estado de quien no lo usa |
**Requisitos previos:** terminar las dimensiones y F6-F8; sin sistema de secretos no hay «detector»; sin navegación no hay brújula marina.

---
## 10. Propuesta de implementación por entregas (cuando se decida abrir la etapa)
| Entrega | Contenido | Depende de |
|---|---|---|
| **C0 · Equilibrio previo (sin código de juego)** | topes y escalones con simulación; decidir cifras | — |
| **C1 · Núcleo de materiales** | `j.cra`, guardado con conservación de desconocidos y guard de versión, inventario de materiales, registro de objetos en `tienda`, pruebas, validador | F6 (órdenes), F8 |
| **C2 · Fabricar consumibles** | estaciones (3), recetas conocidas, pestaña de fabricación, comida y consumibles | C1 |
| **C3 · Accesorios** | 2 ranuras, equipar/quitar, gancho de combate, ficha, traspasos seguros (caja/tablón/soltar), simulación | C1 |
| **C4 · Descubrimiento** | pista/conocida, cuaderno, experimentar, recetas de 2 pasos, requisitos por marcas | C2, F6 marcas |
| **C5 · Contenido por dimensión** (Sonnet) | materiales, recetas, estaciones y familias de accesorios por dimensión con el validador | C1-C4 |
| **C6 · Extras** | herramientas (linterna/brújula/detector), cápsulas, cebos de pesca; efectos pasivos de combate si se aprueban | navegación, secretos, equilibrio |
Cada entrega: build → tests → huellas iguales → guardado v2 real migrado sin pérdida → informe.

---
## 11. Decisiones que necesitan tu aprobación
| # | Decisión | Alternativas | Mi recomendación y motivo |
|---|---|---|---|
| D1 | ¿Se abre esta etapa después de F8 y del contenido de dimensiones? | antes / después | Después, para no competir con las dimensiones |
| D2 | Alcance inicial | todo / consumibles+accesorios+comida | Lo segundo: no toca sistemas frágiles |
| D3 | Ranuras | 1 / **2 tipadas** / 3 | 2 tipadas (Cuerpo, Adorno): decisión real y equilibrio fácil |
| D4 | Almacén de materiales | **inventario propio** / dentro de la mochila | Propio: no cambia la economía ni el límite de 99 de la mochila |
| D5 | Anclaje del equipo | **ID permanente** / clave de equipo | ID permanente: viaja con la criatura |
| D6 | Topes de bonificación (cifras) | fijos / tras simular | Fijar tras C0; propongo tope ~+10-12 % por estadística |
| D7 | Efectos pasivos especiales | v1 / más adelante | Más adelante (requiere ganchos de combate y simulación) |
| D8 | Estaciones | 1 mesa / **3 estaciones** / por dimensión | 3 estaciones + variantes locales |
| D9 | «Cuidado» de criaturas (cariño, vínculo) | solo comida con efecto temporal / crear sistema nuevo | Solo comida; no inventar un sistema de vínculo sin aprobarlo |
| D10 | Orígenes de materiales | con/sin botín de combate | Sin botín de combate (salvo jefes únicos) |
| D11 | Cebos y señuelos | sólo pesca / también tierra | Solo pesca; tierra rompe determinismo del cooperativo |
| D12 | Accesorios fabricados vs encontrados | mismo techo / fabricados más fuertes | Mismo techo; lo encontrado se distingue por identidad |
| D13 | Comercio entre jugadores | no en v1 / por tablón | No en v1 |
| D14 | Ids desconocidos en el guardado | conservar / descartar | Conservar (progreso intocable, como ya se hizo con dimensiones) |
| D15 | Comprobación del combate cooperativo | investigar antes de C3 | Sí, al empezar C0 |
**Nada de esto se implementa ni se considera aprobado hasta que lo decidas.**
