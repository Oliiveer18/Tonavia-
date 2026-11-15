// economia_santuario.js — SIMULA la economía real del juego (tienda.js, entrenador.js, nivel.js) para fijar los costes de ampliar el Santuario. No cambia nada. Uso: node tools/economia_santuario.js
// Modelo: un jugador que solo combate contra salvajes comunes de su nivel (la fuente de Brillos más estable; pesca, capturas y cofres quedan como margen a su favor).
//  · por combate gana tienda.ingresoNivel(nivel) ✦ y la mitad de la XP de la criatura como XP de entrenador (combate_motor.js); al subir de nivel, 6 × nivel ✦ (entrenador.js)
//  · gasto corriente (curas, pociones, esferas): una fracción del ingreso. Se prueban tres perfiles: ahorrador 20 %, normal 40 %, gastador 60 %.
//  · compra cada ampliación en cuanto le llega el dinero. Empieza a contar al llegar al nivel 8 (cuando se abre el portal) con 0 ✦ ahorrados (caso desfavorable).
const G = require('./_cargar.js')(), Ti = G.tienda, E = G.entrenador, S = G.santuario;
const costes = S.D.niveles.slice(1).map((n) => n.coste), precio = (c, nivel) => Math.max(c.minimo, Math.round(c.combates * Ti.ingresoNivel(nivel) / 10) * 10);
function simula(gasto) {
  let xp = E.xpPara(8), ahorro = 0, combates = 0, i = 0; const hitos = [];
  while (i < costes.length && combates < 200000) {
    const n = E.nivelDe(xp), c = Math.min(50, Math.round(1.4 * n + 0.6)); combates++; ahorro += Ti.ingresoNivel(n) * (1 - gasto);
    xp = Math.min(E.xpPara(E.MAX), xp + Math.max(1, Math.round(G.nivel.xpGanada(c, c, 'comun') * 0.5))); const n2 = E.nivelDe(xp); for (let l = n + 1; l <= n2; l++) ahorro += 6 * l;
    while (i < costes.length && ahorro >= precio(costes[i], n2)) { const p = precio(costes[i], n2); ahorro -= p; hitos.push({ nivelSantuario: i + 2, precio: p, combates, nivelEntrenador: n2 }); i++; }
  }
  return hitos;
}
const perfiles = [['ahorrador (gasta 20 %)', 0.2], ['normal (gasta 40 %)', 0.4], ['gastador (gasta 60 %)', 0.6]];
console.log('Ingreso por combate (✦): ' + [8, 12, 16, 20, 25, 30, 40].map((n) => 'Nv' + n + '=' + Ti.ingresoNivel(n)).join(' · '));
console.log('Precio de cada ampliación según el nivel de entrenador al comprar:');
costes.forEach((c, i) => console.log('  a nivel ' + (i + 2) + ' (' + S.D.niveles[i + 1].nombre + '): ' + c.combates + ' combates · mínimo ' + c.minimo + ' ✦ → ' + [8, 12, 16, 20, 25, 30, 40].map((n) => 'Nv' + n + '=' + precio(c, n)).join(' · ')));
perfiles.forEach(([nom, g]) => { console.log(nom + ':'); simula(g).forEach((h) => console.log('  Santuario ' + h.nivelSantuario + ': ' + h.precio + ' ✦ · tras ' + h.combates + ' combates desde el nivel 8 · entrenador Nv ' + h.nivelEntrenador + ' · ≈ ' + (h.combates * 0.75 / 60).toFixed(1) + ' h de juego (45 s por combate)')); });
const caja = []; let t = 0; for (let m = 50, k = 0; m < 300; m += 10, k++) { t += 120 + 80 * k; if (m + 10 === 100 || m + 10 === 200 || m + 10 === 300) caja.push('caja ' + (m + 10) + ' = ' + t + ' ✦ acumulados'); }
console.log('Referencia (ampliar la caja pagando, equipo.js): ' + caja.join(' · '));
