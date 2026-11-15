# 21 · SANTUARIO UNIVERSAL · ETAPA B · bloque 3 · APORTES DE OTRAS DIMENSIONES (v2.367)
Parte de v2.366 (intacta en `criaturas_v2_366.zip`). Orden aprobado el 15 nov 2026: **aportes de otras dimensiones** → personalización y decoración → interior de la cabaña → visitas de solo lectura. Este documento es el estudio previo y el contrato del primer bloque.

## 1. El problema
Hoy el Santuario crece por tres ejes, todos internos: **Brillos** (ampliar, construir), **nivel de entrenador** (acceso) y **vivencias** (XP que se gana jugando). Explorar el multiverso no cambia nada en casa. Si se resolviera con «cada dimensión da un premio», saldría una colección de recompensas sueltas. Lo que se pide es que **lo vivido fuera se note en el hogar y el hogar cambie cómo se juega fuera**.

## 2. Qué existe (y qué no) — comprobado en el código
| Fuente de progreso | Estado | Uso para desbloquear |
|---|---|---|
| Marcas de dimensión (`G.marcas`, F6) | Contrato listo, **ningún contenido las concede aún** | Camino oficial de toda dimensión nueva (Chuches, Pirata, Cerezo) |
| Récord de Profundidades (`j.prof.record`) | Real, guardado, determinista | Primer hito real |
| Nivel de entrenador | Real | Solo como acceso (no es un hito de una dimensión) |
| Casco del barco / marea (FN) | Real, pero la Isla Pirata es solo mar de prueba, sin portal | Disponible en cuanto exista contenido |
| Hábitats | Solo pueden usar las **17 casillas** del juego (no hay casillas propias de cada dimensión) | **No se añaden hábitats vivos todavía**: se verían igual que los actuales |
| Instalaciones | Pueden usar los **77 objetos del catálogo** | Sí se pueden diferenciar |

Consecuencia honesta: las dimensiones Chuches, Pirata y Cerezo **no existen todavía**; sus aportes se escribirán con ellas (el mecanismo ya los espera). Hoy hay un único aporte vivo, el de Profundidades.

## 3. Modelo: hito → opción → decisión
Un **aporte** es un hábitat o una instalación con dos campos nuevos en `datos/santuario.json`:
- `origen`: id de la dimensión que lo aporta (debe estar instalada).
- `req`: lista de requisitos del catálogo de portales (`src/portales.js`): `marca`, `profundidad`, `casco`, `marea`, `nivelEntrenador`.

Reglas (las comprueba `validarDatos`, no la memoria de nadie):
1. **Conexión obligatoria.** Un aporte lleva `origen` **y** `req`, y al menos un requisito es un hito de **esa** dimensión (`marca` con `dim` = origen, `profundidad` para Tonavia, `casco`/`marea` con `dim` explícito). Sin hito de su origen, no es un aporte.
2. **No regala nada.** Desbloquear solo *abre una opción*. Para tenerla hay que seguir cumpliendo los demás ejes: nivel del Santuario, Brillos, y una parcela o un solar libre (coste de oportunidad: solo hay 2 solares por nivel). No da Brillos, objetos, XP ni capacidad.
3. **Lateral, no vertical.** Un aporte no supera el valor máximo que ya tiene su tipo en el contenido base (mismo abanico de efectos, mismos techos). Las instalaciones nuevas compiten por el mismo número de solares.
4. **Lo construido no se pierde.** El hito se pide solo para *elegir* o *construir*. Cargar un guardado, perder una marca o abrir una versión con otros datos nunca derriba lo que ya existe.
5. **Solo del dueño, solo en su hogar.** Se comprueba en el móvil del dueño sobre su propio progreso; no sale de su Santuario ni da ventaja sobre nadie (no hay competición ni escritura compartida). Los requisitos personales nuevos (`profundidad`) **no son válidos en portales** (el progreso declarado por red no los lleva; el validador de portales los rechaza).
6. **Se ve.** El panel de Brezo muestra cada aporte pendiente con su origen y lo que falta («Aporte de Tonavia: llegar al piso 10 de las Profundidades — tu récord: 4»), para que explorar tenga un objetivo legible.

## 4. Efecto nuevo: `expedicion` (la consecuencia que va en los dos sentidos)
Una instalación de aporte puede llevar `efecto: { tipo:'expedicion', donde:'<dimensión | profundidades>', valor }`: **la XP que ganas jugando en ese lugar llena la reserva de vivencias `valor` más deprisa** (+50 % con el Campamento). Es la unión entre los dos mundos:
- Fuera: explorar *ahí* rinde más para el hogar.
- Dentro: las residentes siguen aprendiendo con las reglas aprobadas (dosis diaria, techo de nivel, tope de reserva). **Nada de esto cambia**: solo llega antes la materia prima, y siempre por vivencias reales (sin AFK ni tiempo pasivo).
- Genérico: cada dimensión futura puede ofrecer su «campamento» con `donde` = su id.

Vivo hoy: **Campamento de expedición** (origen `tonavia`, `donde: profundidades`).
| Dato | Valor |
|---|---|
| Hito | `profundidad` ≥ 10 (dos jefes: `jefeCada` = 5) |
| Nivel de Santuario | 3 |
| Coste | 60 combates, mínimo 3.000 ✦ (mismo escalón que la Hoguera; **APROBADO el 15 nov 2026**) |
| Efecto | `expedicion`, `donde: profundidades`, +50 % (tope de validación: +100 %) |
| Aspecto | brasero, barril y cartel del catálogo, sobre ceniza |

## 5. Cómo añadir el aporte de una dimensión nueva (para Sonnet, junto con su dimensión)
1. La dimensión da sus hitos con `G.marcas.dar(est, j, '<dim>', 'modulo.clave')` desde su módulo (`GUIA_CONTENIDO.md` §marcas).
2. En `datos/santuario.json` se añade una instalación (clave de un dígito libre) con `origen`, `req: [{ "t":"marca", "dim":"<dim>", "k":"modulo.clave", "texto":"…" }]` y un efecto existente (`tope`, `cura`, `vinculo`, `vivencias`) o `expedicion` con `donde:"<dim>"`.
3. `node tools/validar_santuario.js` y `node test.js`. **Los hábitats nuevos esperan a tener casillas u objetos propios**: hoy el validador los acepta, pero se verían como uno ya existente.
4. Costes: criterio de la tienda (combates de tu nivel, con mínimo), siempre **propuestos hasta que el usuario los apruebe**.

## 6. Qué NO hace este bloque
Crear contenido de dimensiones · decoración libre (siguiente bloque) · interior de la cabaña · visitas · HD-2D · tocar el reparto de XP, el Manantial (solo cura a residentes) ni la Doctora · monedas, inventarios o ingresos pasivos.

## 7. Compatibilidad
Sin estado nuevo: nada se guarda de más. Un guardado v2.366 carga igual (el id del hogar solo gana el dígito de la instalación nueva si se construye). Mapas y huellas del 2D no cambian.

## Condiciones aprobadas del Campamento (15 nov 2026)
- El bono del 50 % acelera **solo** la obtención de vivencias procedentes de las Profundidades.
- No aumenta directamente la XP de las criaturas: la reserva sigue gastándose con el tope diario por residente (`topeHoy`).
- Se mantienen todos los límites diarios y controles anti-explotación. Prueba: `prueba_santuario.js` §25 (con la reserva siempre llena, una residente no supera su dosis diaria).
