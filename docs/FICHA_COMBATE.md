# FICHA DE COMBATE · v2 (9 nov 2026) · decisiones confirmadas provisionalmente (se validan jugando)

> Estado: diseño + **motor implementado** (v2.271, `src/combate_datos.js`, `src/combate.js`) y equilibrado en Común y Rara. Ver el apartado 15. Los nombres de movimiento de esta ficha son los definitivos (los de la tabla del apartado 4).

Diseño + motor (v2.271). Lo marcado con ❓ lo decide el usuario. Cumple la norma «listo para online» (CLAUDE.md): estado en `est.combate`, motor puro con ticks fijos y semilla `est.rnd`, jugadores por id, contenido como datos (`maps`-style: `data/combate/*.json` o registro en `src/`), todo serializable y con versión.

## 1. Decisiones del usuario (se mantienen)
1. **Tiempo real en el mapa, sin turnos.** Las criaturas pelean **solas** con una IA muy cuidada (se mueven, se colocan, esquivan, atacan, defienden). El jugador no las dirige.
2. **Un botón por jugador**, visible solo mientras su criatura pelea. Se **carga** con el combate y al pulsarlo lanza el **ataque especial**.
3. **Equipo de 6 criaturas por jugador (decidido el 9 nov), pero solo UNA en el campo a la vez**, cambiable en pleno combate. Una criatura a 0 de vida queda fuera hasta que se cure (Centro PC, objetos o apoyo).
4. **Varias criaturas a la vez** en la misma pelea.
5. **En el HD-2D se usan los sprites 2D de las criaturas** (láminas), no los modelos 3D. El interruptor `CRIATURAS3D` queda apagado en el combate (el código 3D no se borra).
6. **Efectos visuales propios**, hechos a nuestra medida y con la calidad (o más) de pixelfx. Barras de vida, momento del impacto y detalles de efecto los dirige el usuario con sus prompts: esta ficha NO los fija.

## 2. Capas del sistema (separación obligatoria)
| Capa | Qué hace | Dónde vive |
|---|---|---|
| Datos | Estadísticas, kits de ataque, estados, reacciones | registro/JSON, por plantilla de elemento + rasgos por línea |
| Motor | Simulación a **20 ticks/s**, IA, daño, estados, medidor del especial. Puro, determinista, sin DOM | `src/combate.js` (nuevo) |
| Eventos | El motor emite eventos: `inicio_ataque`, `impacto`, `esquiva`, `bloqueo`, `critico`, `estado_on/off`, `ko`, `especial_listo`, `cambio` | cola en `est.combate.ev` |
| Presentación | Los pintores (2D y HD-2D) convierten eventos en animación, partículas, luz, temblor, sonido. NO guardan estado de juego | `src/fx_*.js`, pintores |
Así el servidor puede repetir el combate con (estado, órdenes, semilla) sin dibujar nada, y lo «dopamínico» se cambia sin tocar las reglas.

## 3. Estadísticas (base, a equilibrar con un simulador)
Cinco estadísticas, derivadas de **datos que ya existen** (rareza, fase, tamaño, kg, elemento) más un **modificador de plantilla**. Propuesta de partida (todo a ajustar):
| Estadística | Qué hace | Se deriva de |
|---|---|---|
| Vida | Aguante total | kg y fase |
| Ataque | Daño que hace | rareza y fase |
| Defensa | Daño que reduce | kg y plantilla (Roca alta) |
| Velocidad | Cadencia de ataque y de movimiento | tamaño (pequeño = rápido) y plantilla |
| Alcance | Distancia a la que ataca (contacto / media / larga) | forma de ataque |
Rareza y fase suben el total (común < rara < épica < legendaria; fase 1 < 2 < 3). Los **kg reales** (Nimbel 0,1 kg frente a Arenel 2 kg o Voltorax 15 kg) dan la sensación de peso: los pesados empujan y resisten más, los ligeros se mueven y esquivan más.

## 4. Catálogo de movimientos (decidido el 9 nov)
**Idea:** los movimientos viven en un **catálogo compartido** (datos). Cada movimiento tiene id, nombre, elemento, tipo, forma, potencia, alcance, enfriamiento, estado que aplica y su efecto visual. **Una criatura no inventa ataques: lleva una lista de movimientos del catálogo** (más su rasgo propio). Un mismo movimiento (p. ej. «Pisotón solar») lo pueden llevar varias criaturas; si se reequilibra, cambia para todas.
- **Inicio: 8 movimientos por elemento (56 en total):** 2 básicos, 2 habilidades, 2 especiales, 1 defensa y 1 apoyo. Crecerá por lotes (meta orientativa 15-20 por elemento).
- **Equipamiento según rareza:** Común 3 huecos (básico + habilidad + especial); Rara 4 (+ 1 de defensa o apoyo); Épica y Legendaria 4 + su movimiento exclusivo. Las fases superiores mejoran los mismos movimientos y la última gana uno nuevo.
- **Exclusivos ❓ (a confirmar):** épicas y legendarias llevan además 1 movimiento único con efecto propio hecho a mano.
- **Efectos:** cada movimiento tiene su efecto, generado desde las 5 formas con paleta de su elemento. Se comparten además los efectos de **impacto por elemento, estados, defensas, KO, cambio de criatura y reacciones**.
- Potencia y enfriamiento se fijan con el simulador (básico: baja y rápido; habilidad: media; especial: alta y se carga con el medidor).

- **Especial de combo:** de los 2 especiales de cada elemento, uno prepara reacciones con otros elementos (p. ej. Pleamar moja a todos para un rayo después).

Cada elemento tiene un rol base (estilo), estadísticas de partida, ventajas y sus 8 movimientos:

STATS: Vida · Ataque · Defensa · Velocidad · Alcance (1 bajo – 5 alto; tendencia de partida, a equilibrar con el simulador).

### Fuego · Daño y área
*Castiga en zona y deja a los rivales ardiendo.* Gana a Hoja, Aire; pierde contra Agua, Roca. Estadísticas (V/A/D/Vel/Alc): 3 / 5 / 2 / 3 / 3. Estados: Quemado. Reacciones: Vapor (sobre Mojado) · Incendio (sobre Enredado).

| Tipo | Movimiento | Forma | Alcance | Qué hace |
|---|---|---|---|---|
| Básico | **Fogonazo** | proyectil | media | Prende (quemado leve) |
| Básico | **Zarpazo ígneo** | contacto | corta | Quemado |
| Habilidad | **Bola de magma** | proyectil + área | media | Estalla y quema alrededor |
| Habilidad | **Pisotón solar** | onda en línea | larga | Salta en su sitio; al caer, una onda de fuego recorre el suelo hasta el rival (decidido el 9 nov) |
| Especial | **Lluvia de meteoritos** | zona | larga | Lluvia de llamas sobre el campo enemigo |
| Especial | **Estallido volcánico** | zona | media | Columnas de fuego bajo los rivales |
| Defensa | **Aura ardiente** | propia | – | Quema a quien golpea de cerca |
| Apoyo | **Fervor** | aliada | media | Más ataque a una aliada |

### Agua · Control y apoyo
*Frena, empuja y limpia: mantiene al equipo en pie.* Gana a Fuego, Roca; pierde contra Hoja, Eléctrico. Estadísticas (V/A/D/Vel/Alc): 4 / 2 / 3 / 3 / 3. Estados: Mojado · Ralentizado. Reacciones: Vapor · Sobrecarga · Lodo.

| Tipo | Movimiento | Forma | Alcance | Qué hace |
|---|---|---|---|---|
| Básico | **Chorro a presión** | haz | media | Moja |
| Básico | **Salpicadura** | proyectil | corta | Moja y frena un poco |
| Habilidad | **Oleada** | área | media | Empuja y moja |
| Habilidad | **Pompa prisión** | proyectil | media | Atrapa y ralentiza |
| Especial | **Pleamar** | zona | larga | El agua sube sobre la zona enemiga: moja, ralentiza, y al retirarse los arrastra (decidido el 9 nov) |
| Especial | **Hidrocañón** | haz | larga | Arrastra y empuja en línea |
| Defensa | **Muro acuático** | propia | – | Absorbe un golpe |
| Apoyo | **Lluvia curativa** | aliada | media | Limpia estados dañinos |

### Hoja · Sostén y trampas
*Atrapa al rival y cura a las suyas poco a poco.* Gana a Agua, Sombra; pierde contra Fuego, Aire. Estadísticas (V/A/D/Vel/Alc): 4 / 2 / 3 / 2 / 3. Estados: Enredado. Reacciones: Incendio (si la prende Fuego).

| Tipo | Movimiento | Forma | Alcance | Qué hace |
|---|---|---|---|---|
| Básico | **Latigazo** | contacto | corta | Golpe de enredadera |
| Básico | **Cuchilla de hoja** | proyectil | media | Corte rápido |
| Habilidad | **Enredadera** | zona | media | Inmoviliza (enredado) |
| Habilidad | **Nube de esporas** | área | media | Ralentiza |
| Especial | **Zarzal** | zona | larga | Raíces y cura a las aliadas |
| Especial | **Ciclón de hojas** | área | larga | Muchos cortes seguidos |
| Defensa | **Piel de corteza** | propia | – | Reduce el daño recibido |
| Apoyo | **Savia vital** | aliada | media | Cura en el tiempo |

### Eléctrico · Velocidad y cadena
*Golpea primero y salta de un objetivo a otro.* Gana a Agua, Aire; pierde contra Roca, Sombra. Estadísticas (V/A/D/Vel/Alc): 2 / 4 / 1 / 5 / 3. Estados: Aturdido (breve). Reacciones: Sobrecarga (sobre Mojado) · Tormenta (con Aire).

| Tipo | Movimiento | Forma | Alcance | Qué hace |
|---|---|---|---|---|
| Básico | **Centella** | proyectil | media | Chispa muy rápida |
| Básico | **Sacudida** | contacto | corta | Aturde un instante |
| Habilidad | **Cadena voltaica** | haz | media | Salta entre 2-3 objetivos |
| Habilidad | **Red estática** | área | corta | Ralentiza alrededor |
| Especial | **Tormenta eléctrica** | zona | larga | Rayos sobre los enemigos |
| Especial | **Rayo cenital** | haz | larga | Gran golpe vertical sobre un objetivo |
| Defensa | **Jaula de chispas** | propia | – | Paraliza un instante a quien la toca |
| Apoyo | **Pulso veloz** | aliada | media | Más velocidad a una aliada |

### Aire · Movilidad y empuje
*Desordena al rival y esquiva casi todo.* Gana a Hoja, Sombra; pierde contra Fuego, Eléctrico. Estadísticas (V/A/D/Vel/Alc): 2 / 3 / 2 / 4 / 3. Estados: Empujado · Ralentizado (breve). Reacciones: Tormenta (con Eléctrico).

| Tipo | Movimiento | Forma | Alcance | Qué hace |
|---|---|---|---|---|
| Básico | **Tajo de viento** | proyectil | media | Corte de aire rápido |
| Básico | **Aletazo** | contacto | corta | Golpe y retroceso leve |
| Habilidad | **Remolino** | área | corta | Aparta y desordena |
| Habilidad | **Vendaval** | haz | media | Empuja en línea |
| Especial | **Tornado** | área | larga | Arrastra y dispersa |
| Especial | **Ojo del huracán** | zona | larga | Arrastra al centro |
| Defensa | **Plumaje etéreo** | propia | – | Esquiva casi todo un tiempo |
| Apoyo | **Viento de cola** | aliada | media | Más velocidad a una aliada |

### Roca · Tanque
*Aguanta, atrae golpes y aturde de cerca.* Gana a Fuego, Eléctrico; pierde contra Agua, Sombra. Estadísticas (V/A/D/Vel/Alc): 5 / 3 / 5 / 1 / 1. Estados: Aturdido · Empujado. Reacciones: Lodo (con Agua).

| Tipo | Movimiento | Forma | Alcance | Qué hace |
|---|---|---|---|---|
| Básico | **Mazazo** | contacto | corta | Retroceso |
| Básico | **Pedrusco** | proyectil | media | Pedrada lenta |
| Habilidad | **Onda sísmica** | área | corta | Aturde alrededor |
| Habilidad | **Embestida pétrea** | contacto en línea | media | Embiste y aturde |
| Especial | **Alud de rocas** | zona | larga | Lluvia de rocas con aturdimiento |
| Especial | **Seísmo** | área | larga | Empuja y aturde a todos |
| Defensa | **Muralla de piedra** | propia | – | Reduce daño y no se deja empujar |
| Apoyo | **Desafío** | enemigos | media | Atrae los ataques enemigos |

### Sombra · Debilitar y emboscar
*Ataca desde el flanco y apaga al rival.* Gana a Eléctrico, Roca; pierde contra Hoja, Aire. Estadísticas (V/A/D/Vel/Alc): 3 / 4 / 2 / 4 / 2. Estados: Maldito · Miedo. Reacciones: Eclipse (sobre Maldito).

| Tipo | Movimiento | Forma | Alcance | Qué hace |
|---|---|---|---|---|
| Básico | **Garra umbría** | contacto | corta | Más daño por la espalda |
| Básico | **Aguja de sombra** | proyectil | media | Aguja de sombra |
| Habilidad | **Mal de ojo** | haz | media | Baja ataque y defensa (maldito) |
| Habilidad | **Emboscada** | contacto | media | Aparece tras el objetivo y golpea |
| Especial | **Noche voraz** | área | larga | Miedo en área y roba vida |
| Especial | **Terror nocturno** | zona | larga | Miedo prolongado |
| Defensa | **Manto de penumbra** | propia | – | Esquiva al ser apuntada |
| Apoyo | **Drenar fuerza** | enemigo | media | Quita fuerza al enemigo más peligroso |

**Formas de ataque (5):** contacto · proyectil · área alrededor · haz o cadena · zona en suelo. Cada ataque es una forma + un elemento: de ahí salen los efectos visuales **por plantilla** (no uno por criatura), así escala a 200 líneas.

## 5. Defensa y apoyo
- **Defensas:** esquiva (velocidad), bloqueo/escudo (Roca, Agua), parada (ataque contacto justo antes del impacto), resistencia elemental (tabla de abajo), retroceso (empuje por peso).
- **Apoyo:** curación (Hoja, Agua), mejora de aliados (Aire: velocidad; Fuego: ataque), limpiar estados (Agua), provocación (Roca: atrae enemigos).
- **Elementos (ya existen en `creatures.js`):** ×2 ventaja, ×0,5 debilidad, ×1 neutro.
  Fuego > Hoja, Aire · Agua > Fuego, Roca · Hoja > Agua, Sombra · Eléctrico > Agua, Aire · Aire > Hoja, Sombra · Roca > Fuego, Eléctrico · Sombra > Eléctrico, Roca.

## 6. Estados (8)
Quemado (daño en el tiempo) · Mojado (prepara reacciones) · Enredado (no se mueve) · Aturdido (no actúa) · Ralentizado · Maldito (−ataque/−defensa) · Miedo (huye) · Empujado (desplazamiento por peso). Duran ticks fijos, se guardan en `est`, y cada uno tiene su efecto visual propio sobre la criatura.

## 7. Reacciones entre elementos (el «dopamínico» sin tocar al jugador)
Se disparan cuando un ataque toca un estado ya presente:
| Reacción | Combinación | Resultado |
|---|---|---|
| Vapor | Fuego sobre Mojado | nube que ciega: baja la puntería en el área |
| Sobrecarga | Eléctrico sobre Mojado | descarga que salta a vecinos |
| Incendio | Fuego sobre Enredado | quemadura fuerte y extensión al área |
| Tormenta eléctrica | Aire + Eléctrico | rayos sobre la zona del torbellino |
| Lodo | Agua + Roca | suelo que ralentiza |
| Noche voraz | Sombra sobre Maldito | daño extra y miedo |
Las reacciones solo suman cuando hay combo, así se premia la colocación y el reparto de elementos del equipo.

## 8. IA de las criaturas (lo que hay que cuidar mucho)
Función pura `decidir(estado, id, semilla)`; cada criatura, cada pocos ticks:
1. **Percepción:** enemigos en rango, aliados heridos, amenazas (proyectiles y áreas con aviso).
2. **Objetivo:** el más amenazante o cercano según su rol (tanque provoca, apoyo busca heridos, sombra busca el flanco).
3. **Posición:** mantiene su **distancia ideal** (alcance), rodea, evita juntarse y esquiva zonas con aviso.
4. **Acción:** básico → habilidad si hay enfriamiento y vale la pena → defender o apoyar si toca.
5. **Reacción:** esquivar o bloquear según velocidad y estado; huir con miedo.
Toda aleatoriedad sale de `est.rnd`. Las criaturas **dudan lo justo** y no todas actúan a la vez (variación determinista por id) para que se vea natural.

## 9. Medidor y botón de especial (decidido el 9 nov)
- **Cada criatura tiene su propio medidor** (`est.combate.criaturas[id].medidor`, 0–100). Solo se carga mientras ESA criatura pelea: sube con los **golpes dados** (más) y **recibidos** (menos) y poco con el tiempo.
- Al cambiar de criatura, el medidor de la que sale **se queda como estaba y no se carga en la reserva**. Así no se puede cargar con una criatura rápida y usarlo con otra.
- Al llegar a 100 se emite `especial_listo` y el botón se ilumina. **El botón solo se ve en combate**; fuera de combate no aparece.
- El especial se puede lanzar en cuanto está cargado, sin exigir enemigo en rango. Durante su animación es difícil interrumpirlo (salvo aturdimiento).
- **Aviso de los especiales enemigos:** antes de caer, una marca en el suelo y una breve carga, para que se lea qué va a pasar (regla de diseño de todos los efectos).

## 10. Equipo y cambio de criatura en pleno combate (decidido el 9 nov)
- Cada jugador lleva **6 criaturas**, pero **solo una combate** a la vez. Las otras 5 esperan en la reserva.
- Se cambia la activa por otra de la reserva en pleno combate. La que entra ocupa el sitio y hace un pequeño ataque de entrada. Enfriamiento de cambio (propuesta 4 s) para que no sea un abuso.
- La que sale conserva vida y estados. **Una criatura a 0 de vida queda fuera hasta curarla**; si las 6 caen, se acaba el combate.
- Por eso importa la composición del equipo: elementos y roles distintos para poder cambiar según el rival.

## 11. Escala de la pelea (qué hay a la vez en pantalla)
- Con 1 criatura en el campo por jugador, en pantalla hay **2 aliadas** (la de Oli y la de Lali; 1 si juega uno solo) frente a **1-3 enemigas**. Es un límite pensado para que el móvil aguante todos los efectos a la vez; se mide en el primer prototipo y se sube si sobra rendimiento.
- Los enemigos salvajes llegan en oleadas pequeñas; los jefes son criaturas grandes con más vida y un especial telegrafiado.

## 12. Lista de efectos a crear (por plantilla, no por criatura)
Para cada uno de los 7 elementos: **básico** (1 forma), **habilidad** (1 forma), **especial** (1, grande), **impacto** (golpe + crítico), **estado propio** (1-2) → ≈ 7 × 6 = **42 efectos** de elemento. Más **comunes**: golpe base, parada, bloqueo, esquiva, entrada/cambio, KO, aparición del medidor, números de daño (dirigido por el usuario). Reacciones: 6.
El estilo y la calidad de referencia son pixelfx (MIT, referencia, no se copia): anticipación, impacto con parada breve, recuperación, luz aditiva, partículas físicas con semilla. El detalle visual de cada impacto lo fija el usuario con sus prompts.

## 13. Verificación (cuando se programe)
- `tools/simular_combate.js`: simulador **sin gráficos** que juega N peleas con semillas y comprueba (a) determinismo (mismo resultado dos veces), (b) equilibrio (ningún elemento gana más de ~58 % global), (c) que ninguna pelea se atasca, (d) tiempo por tick.
- Tests de las normas online: estado serializable, sin `Math.random`, jugadores por id, repetición exacta.
- Presupuesto de partículas y fps medidos en móvil (HD-2D incluido).

## 14. Decisiones
Tomadas el 9 nov: equipo de 6 con 1 en el campo · 0 de vida = fuera hasta curar · especial solo en combate, botón oculto fuera, sin exigir rango · roles de la tabla del apartado 4 con retoques de Claude (la reserva no se recupera en combate; apoyo y provocación pensados para 2 aliadas).
Pendiente ❓: aprobar enemigos 1-3 a la vez en pantalla (apartado 11) y los números de equilibrio, que saldrán del simulador.


## 15. Estado de implementación y equilibrio (v2.271; actualizado el 10 nov 2026, v2.304)
> **Actualización v2.304:** lo marcado como pendiente en «Pendiente (por orden)» ya está hecho en lo esencial: eventos conectados a los pintores 2D y HD-2D, pantalla de combate, botón de especial, acompañante y captura (v2.272-v2.296), sonido (`src/sonido_combate.js`, v2.301-v2.302) y niveles (`src/nivel.js`, v2.303: `nivel` opcional en la unidad, 1 por defecto; escala vida/ataque/defensa ×(1+0,025·(n−1))). Sigue pendiente: equipo y cambio en pleno combate, kit exclusivo de épicas/legendarias, y re-equilibrar con niveles (`tools/simular_combate.js` simula siempre nivel 1).

**Hecho**
- Catálogo de 56 movimientos (ids internos fijos = ids de `tools/prototipo_fx`; nombres de la tabla del apartado 4) en `src/combate_datos.js`: forma, potencia, enfriamiento, alcance, radio, estados y etiqueta.
- Motor puro `src/combate.js` (20 ticks/s, semilla propia `c.rs`, estado JSON, eventos `inicio, golpe, esquiva, fallo, reaccion, estado, interrumpe, defensa, apoyo, salta, zona, ko, especial_listo, cambio, fin`). IA, 8 estados, 6 reacciones, medidor por criatura, relevos y cambio (`{t:'cambio'}`), especial por orden (`{t:'esp'}`) o automático (`auto`).
- Efectos visuales: prototipo en `tools/prototipo_fx/efectos_combate.html` (56 efectos, 1 por movimiento; solo verificados por capturas, no en móvil; Zarzal es el más pesado).
**Reglas del motor que salieron de equilibrar**
- Tenacidad: tras aturdir, enredar o dar miedo, 2 s de inmunidad a ese estado. Una reacción consume el estado que la dispara.
- Crítico 18 % ×1,8; daño ±30 %; arranque con medidor y enfriamientos al azar. Rareza ×1 / 1,25 / 1,45 / 1,7; fase ×1 / 1,25 / 1,5.
- Estadísticas = plantilla de elemento × rareza × fase × peso. El peso no decide la fuerza: `KGPOT` iguala ligeros y pesados (ellos ganan velocidad, los pesados vida y defensa).
- Kit por rareza: Común básico+habilidad+especial; Rara +1 defensa o apoyo; Épica/Legendaria +1 más (el exclusivo está pendiente). Hoy el reparto por criatura es provisional (por id).
**Cómo se equilibra (no tocar a mano `CAL`, `AJUSTE`, `KGPOT` de `combate_datos.js`)**
1. Cambiar un dato de `MOV`, de `PLANTILLAS` o del motor → `node tools/calibrar_combate.js --n 50 --rondas 8 --escribir` (~6 min) → `node tools/simular_combate.js --n 300` (y `--nivel rara`).
2. Meta: victorias globales por elemento 40-60 %; criaturas reales contra plantillas de su nivel 40-65 %; neutros 30-70 %; sin atascos. El simulador suspende si un elemento sale de 40-60 %.
3. Resultado actual: Común 45-53 %, Rara 47-57 %, reales 38-65 %, mediana 12 s por pelea. Con ventaja de tipo (×2/×0,5) a igual nivel el resultado es casi 100/0 (decisión de esta ficha; alternativa ×1,5/×0,67).
**Pendiente (por orden)**
1. Conectar los eventos con los pintores 2D y HD-2D y crear la pantalla de combate y el botón de especial.
2. Lista de movimientos por criatura (hoy provisional) y movimiento exclusivo de épicas y legendarias; entonces recalibrar Épico y Legendario (hoy 3 líneas = 7 criaturas: Forjel y Lunel con 3 fases y Zefirax; el coeficiente épico está sin cerrar).
3. «Pequeño ataque» al entrar una criatura por cambio (apartado 10).
4. Medir en 2 contra 3 si apoyo, provocación y curación valen lo mismo en equipo; medir con el mapa real (hoy el motor usa una línea de 160 u sin eje lateral).
5. Medir fps y partículas en móvil (HD-2D incluido) y probar Hoja, Eléctrico, Aire, Roca y Sombra en el móvil.
6. Confirmar jugando los ❓ ya aceptados provisionalmente: movimientos exclusivos de épicas/legendarias, 1-3 enemigos en pantalla, números por simulador.
