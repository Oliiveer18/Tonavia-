# 20 · SANTUARIO UNIVERSAL · ETAPA B · bloque 1 (v2.365)
Parte de v2.364 (Etapa A, intacta en `criaturas_v2_364.zip`). Decisiones aprobadas el 14 nov 2026: acceso por el Nexus y nivel 8. **Costes de ampliación: APROBADOS el 15 nov 2026** (se revisarán con datos de juego real; no abaratar antes).

## 1. Hecho en este bloque
- **Carácter por ejemplar** (`rasgos` en datos): sale del ID permanente; no se guarda ni cambia. Matiza el temperamento de la especie y sus ganas de juntarse.
- **Relaciones sin estado**: afinidad = familia, elementos (los que chocan en combate se miran de reojo), carácter, «química» de los dos ID y **días de convivencia en el mismo hábitat**. Niveles: se conocen → son amigas → son inseparables. Solo se guarda el día de llegada (`des`). Mudarse de hábitat reinicia la convivencia.
- **Encuentros**: cada 18 s las despiertas de un hábitat se emparejan (puro) y se saludan, juegan (se persiguen en círculo), descansan juntas o se miran de reojo. Las amigas duermen pegadas. Señales: ♥ ♪ ! …
- **Hablar** con una residente dice carácter, qué hace, con quién y su relación.
- **Ampliar** (`santuario.ampliar`) con Brillos y **elegir hábitat** (`santuario.habitat`): la parcela nueva llega vacía; darle hábitat es gratis, cambiarlo cuesta. Cada nivel abre hábitats: 1 Prado · 2 Charca, Claro de Brisa · 3 Brasal, Pedregal · 4 Llano de Chispas, Arboleda Umbría.
- **Rótulo**: mote primero; si no hay, especie.
- **Rendimiento**: las residentes que ningún jugador tiene a menos de 26 casillas no se animan (se colocan donde les toca, sin coste).

## 2. Costes propuestos (criterio de la tienda v2.349: nº de combates de tu nivel, con mínimo)
| Ampliación | Combates | Mínimo | A nivel 8 | A nivel 20 | A nivel 40+ |
|---|---|---|---|---|---|
| 1 Refugio | gratis | — | 0 | 0 | 0 |
| 2 Patio | 15 | 450 | 450 | 960 | 1.590 |
| 3 Aldea | 45 | 1.800 | 1.800 | 2.880 | 4.770 |
| 4 Valle | 100 | 5.500 | 5.500 | 6.400 | 10.600 |
| 5 Gran Santuario | 200 | 15.000 | 15.000 | 15.000 | 21.200 |
Cambiar un hábitat existente: 3 combates (mínimo 90). Simulación: `node tools/economia_santuario.js`.

## 3. Bloque 2 (v2.366) · aprobado el 15 nov 2026: ventajas elementales, actividades propias, XP lenta con tope diario y bonus moderado de amistad
- **Entrenamiento por vivencias** (sin XP por tiempo): la XP de entrenador que el jugador gana jugando llena una reserva con tope (300 / 800 / 2.000 / 5.000 / 12.000 por nivel). Solo con el dueño dentro del hogar, cada residente toma de ella hasta su dosis del día (0,6 combates de su nivel), repartida en ~40 s. Esperar dentro, o estar días fuera, no da nada más: al volver se reparte UNA dosis. Techo: el nivel de la mejor criatura del equipo.
- Extras (se suman, máximo ×2,05): hábitat de su elemento +25 % · amistad +5/+10/+15 % · Fragua +40 % · Campo de prácticas +25 %.
- **Dones de hábitat** (siete distintos): Prado cura al amanecer · Charca amistades +40 % · Claro de Brisa más encuentros · Brasal dosis +40 % · Pedregal gasta 1/1,4 vivencias · Llano de Chispas techo +3 niveles · Arboleda Umbría sin recelos.
- **Actividad propia** por hábitat (en el rincón característico, con señal y frase; mucho más frecuente en las de su elemento).
- **Instalaciones** en los solares (`santuario.construir` / `santuario.derribar`, una de cada tipo): Campo de prácticas (nivel 1, 25 combates/mín. 800) · Manantial (2, 40/1.500: todas amanecen curadas) · Glorieta (2, 40/1.500: amistades +25 %) · Hoguera de relatos (3, 60/3.000: reserva ×2). Hay más instalaciones que solares: hay que elegir. **Costes de las cuatro instalaciones: APROBADOS el 15 nov 2026** (se mantienen). Quinta instalación (Campamento de expedición, B3): coste propuesto, sin aprobar.
- Id del hogar: tramo `_i<claves>` solo si hay instalaciones (`santuario/hogar_2_pc_i10_oli`); los ids anteriores siguen valiendo.
- Estado nuevo por jugador: `ins`, `viv`, `dia`, `hoy` (validados; un registro de A/B1 se completa solo).
- Panel de Brezo: vivencias, solares e instalaciones, don de cada hábitat, dosis del día de cada residente.
- Gancho nuevo: `G.entrenador.dar` se envuelve (no se edita `entrenador.js`).

## 4. Qué falta para cerrar la Etapa B
**Hecho en el bloque 3 (v2.367):** aportes de otras dimensiones (`21_SANTUARIO_APORTES.md`).

**Hecho en el bloque 4 (v2.368):** personalización y decoración (`22_SANTUARIO_DECORACION.md`).

**Hecho en el bloque 5 (v2.369, aprobado):** interior de la cabaña (`23_SANTUARIO_CABANA.md`).

**Hecho en el bloque 6 (v2.370, funcionamiento aprobado):** visitas de solo lectura entre los dos Santuarios privados (`24_SANTUARIO_VISITAS.md`). Con esto la Etapa B queda **implementada**; el bloque 6 está probado en local y con la conexión simulada, **pendiente de una visita real entre dos dispositivos** (no se marca como validado).
Pendiente, en el orden aprobado: HD-2D. Crafteo: no activado (los talleres no existen).

## 5. No probado
iPhone/Safari, red real y en bucle local, HD-2D, `mapas_juego/minimapa/tablon.py` en esta versión, equilibrio con partidas reales.

## (histórico) Pendiente tras el bloque 1

Hábitats con función (ventajas reales por hábitat) · instalaciones en los solares · entrenamiento acotado por día · que las relaciones tengan efecto fuera del paseo · decoración · aportes de otras dimensiones por datos (campo de requisito por marca) · visitas.
