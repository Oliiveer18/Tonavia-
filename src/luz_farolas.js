// luz_farolas.js — LUZ PEQUEÑA DE LAS FAROLAS en el HD-2D (v2.102, paso 5 de docs/FICHAS_OBJETOS_3D.md). Sin luces reales (con 12 farolas y materiales sin iluminación solo afectarían al suelo): un CHARCO de luz plano sobre el suelo y un HALO alrededor del cristal.
// Este archivo es PURO salvo por los dos lienzos de píxeles (G.makeCanvas): sin Three.js, sin azar. El pintor (src/hd2d_pintor.js) los convierte en dos mallas, una para todos los charcos y otra para todos los halos.
// Charco: cuadrado de 2·RADIO u, degradado radial cálido en PASOS escalones (para que case con el pixel art), mezcla aditiva, intensidad máxima INTENSIDAD, 0,02 u sobre el suelo. Halo: sprite de HALO u alrededor del cristal, HALO_PASOS escalones, intensidad HALO_INT.
// Parpadeo lento de ±PARPADEO que se apaga con ?movimiento=0 (G.capas.REDUCIDO). Interruptor: ?farolas=0 o G.luzFarolas.AJUSTES.ACTIVO = false (quita charco y halo; la farola 3D se queda). Límite honesto: es un efecto de suelo, no ilumina a personajes ni bancos.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const OFF = (() => { try { return typeof location !== 'undefined' && /[?&]farolas=0/.test(location.search || ''); } catch (e) { return false; } })();
  const ON = (() => { try { return typeof location !== 'undefined' && /[?&]farolas=1/.test(location.search || ''); } catch (e) { return false; } })();
  // NOCHE: 0 = de día (la luz no se nota, las mallas se esconden) … 1 = de noche (luz completa); los valores intermedios son el atardecer. Hoy el juego no tiene ciclo de día y noche: queda en 0 y ?farolas=1 lo pone en 1 para verla; cuando haya ciclo, solo hay que mover G.luzFarolas.AJUSTES.NOCHE
  const AJUSTES = { ACTIVO: !OFF, NOCHE: ON ? 1 : 0, RADIO: 1.5, INTENSIDAD: 0.22, PASOS: 4, COLOR: '#ffd98a', ALTO: 0.02, HALO: 0.9, HALO_INT: 0.5, HALO_PASOS: 3, HALO_COLOR: '#fff3b0', HALO_Y: 2.035, PARPADEO: 0.04, TEX: 24, HALO_TEX: 16 };
  // nivel de un escalón: d = distancia al centro (0 centro … 1 borde); 1 = el más brillante, 0 = fuera. Con n escalones: 1, (n-1)/n, … , 1/n
  const nivel = (d, n) => d >= 1 ? 0 : Math.ceil((1 - d) * n - 1e-9) / n;
  // parpadeo lento: factor alrededor de 1 (entre 1 − PARPADEO y 1 + PARPADEO); con `quieto` (menos movimiento) siempre 1. t en segundos
  const parpadeo = (t, quieto) => quieto ? 1 : 1 + AJUSTES.PARPADEO * (0.6 * Math.sin(t * 1.3) + 0.4 * Math.sin(t * 3.1 + 1));
  // lienzo n×n con un disco de escalones del color dado: el alfa de cada anillo es su nivel (0..1)
  function disco(n, pasos, color) {
    const c = G.makeCanvas(n, n), x = c.getContext('2d'), r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const d = Math.hypot(i + 0.5 - n / 2, j + 0.5 - n / 2) / (n / 2), a = nivel(d, pasos); if (a > 0) { x.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')'; x.fillRect(i, j, 1, 1); } }
    return c;
  }
  const charco = () => disco(AJUSTES.TEX, AJUSTES.PASOS, AJUSTES.COLOR), halo = () => disco(AJUSTES.HALO_TEX, AJUSTES.HALO_PASOS, AJUSTES.HALO_COLOR);
  // dónde van las luces de un plan del pintor (G.hd2d.plan): las farolas que salen como volumen → [{ x, y, z }] con el centro de su casilla y el suelo
  const puntos = (objetos) => objetos.filter((o) => o.tipo === 'farola' && o.modo === 'volumen').map((o) => ({ x: o.x + 0.5, y: o.y, z: o.z + 0.5 }));
  G.luzFarolas = { AJUSTES, nivel, parpadeo, disco, charco, halo, puntos };
})(typeof window !== 'undefined' ? window : globalThis);
