// formas_agua.js — dibujos de las criaturas de elemento principal Agua (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo).
// Criaturas de este archivo: caracolin, espiravar, ondavar, perlel, perlorix, pompon.
// Los ayudantes comunes vienen de src/formas_base.js (G.F); cada archivo es su propio bloque (function () {...})(), así que los nombres locales no chocan entre archivos.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const { mk, inEll, ell, set, def2, sym, Ei, eli, scal } = G.F;

  // Ondel 14×14 · gota redonda y bajita con hojita
  set('pompon', [14, 14], (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, cy = 8 - up;
    px(P.orange, 3, f ? 11 : 12, 3, 1); px(P.orange, 8, f ? 12 : 11, 3, 1); px(P.red2, 3, 12, 3, 1); px(P.red2, 8, 12, 3, 1);
    ell(px, W, H, 7, cy, 5.9, 4.7, 0, (x, y) => (y >= cy + 2 ? P.teal2 : x < 5 && y < cy - 1 ? '#7fe0db' : P.teal));
    px(P.green2, 7, cy - 6, 1, 3); px(P.green, 8, cy - 7, 3, 2); px(P.green, 4, cy - 6, 3, 2);
    if (dir === 'up') { px(P.teal2, 6, cy - 1, 2, 2); px(P.teal2, 5, cy, 1, 1); return; }
    const ex = side ? -2 : 0;
    px(P.ink, 4 + ex, cy - 1, 2, 2); px(P.white, 4 + ex, cy - 1); if (!side) { px(P.ink, 8, cy - 1, 2, 2); px(P.white, 8, cy - 1); }
    px(P.pink2, 2 + ex, cy + 1, 2, 1); if (!side) px(P.pink2, 10, cy + 1, 2, 1); px(P.ink, 6 + ex, cy + 2, 2, 1);
    if (side) px(P.teal2, 12, cy, 1, 2); // rabito
  });

  // Espirel · Agua · Rara · 20×14: caracol con concha en espiral y ojos en antenas
  def2('caracolin',
    (c, dir, f, px0, W, H) => {
      const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, skin = '#9ad9cb', skin2 = '#6fbfae';
      const shell = (cx, cy, r) => ell(px, W, H, cx, cy - up, r, r, 0, (x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - (cy - up)); return (d > 1.4 && d < 2.3) || (d > 3.4 && d < 4.1) || (d > 5.1 && d < 5.6) ? P.blue2 : d < 1.4 ? P.yellow : P.blue; });
      if (dir === 'up') { shell(10, 6, 6); ell(px, W, H, 10, 11.2 - up * 0, 7.8, 2.6, 0, (x, y) => (y >= 12 ? skin2 : skin)); return; }
      if (!side) {
        shell(13, 6, 5.4); ell(px, W, H, 9.5, 11.2, 7.2, 2.7, 0, (x, y) => (y >= 12 ? skin2 : skin)); ell(px, W, H, 8, 8.8, 3.4, 3, 0, skin);
        px(skin, 6, 5, 1, 2); px(skin, 10, 5, 1, 2); px(P.white, 5, 3, 2, 2); px(P.white, 9, 3, 2, 2); px(P.ink, 6, 4); px(P.ink, 10, 4); px(P.ink, 7, 10, 2, 1); px(P.pink2, 5, 10); px(P.pink2, 10, 10);
      } else {
        shell(12.5, 6, 5.4); ell(px, W, H, 10, 11.3, 8.8, 2.6, 0, (x, y) => (y >= 12 ? skin2 : skin)); ell(px, W, H, 3.8, 8.8, 3, 3, 0, skin);
        px(skin, 2, 5, 1, 2); px(skin, 5, 5, 1, 2); px(P.white, 1, 3, 2, 2); px(P.white, 4, 3, 2, 2); px(P.ink, 2, 4); px(P.ink, 5, 4); px(P.ink, 2, 10, 2, 1);
      }
    });

  // ═══ Línea de Ondel (Pompón): gota con hojita → Ondavar, nenúfar ancho y bajo ═══
  // Ondavar (fase 2, 18×12, 2 kg): se ensancha y se aplana. Hoja de nenúfar enorme con muesca sobre un cuerpo azul profundo, pétalos rosas en la base.
  // Rasgo propio: la hoja gotea cuando está parada (frame 2: cae la gota) y rebota poco y despacio. Se conserva: hoja verde, mejillas rosas, ojos, pies, brillo teal.
  const ONDA = { pad: P.green2, body: P.blue, shade: P.blue2, petal: P.pink, cheek: P.pink2, drop: '#7fe0db', foot: P.orange };

  const ondavarDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f === 1 ? 1 : 0, front = dir === 'down', sym = !side;
    px(ONDA.foot, side ? 6 : 4, 11, 2, 1); px(ONDA.foot, side ? 10 : 12, 11, 2, 1); // patitas
    const bx = side ? 8.5 : 9, brx = side ? 5.4 : 5.8, cy = 8 - up;
    ell(px, W, H, bx, cy, brx, 3.2, 0.04, (x, y) => (y >= cy + 1.4 ? ONDA.shade : ONDA.body));
    // pétalos de loto en la base (sobresalen del cuerpo)
    if (sym) { px(ONDA.petal, 2, 9 - up, 2, 1); px(ONDA.petal, 1, 10 - up, 3, 1); px(ONDA.petal, 14, 9 - up, 2, 1); px(ONDA.petal, 14, 10 - up, 3, 1); }
    else { px(ONDA.petal, 14, 8 - up, 3, 1); px(ONDA.petal, 15, 9 - up, 2, 1); px(ONDA.petal, 3, 10 - up, 2, 1); }
    // hoja de nenúfar: elipse ancha con una muesca en la esquina baja
    for (let y = 0; y < 6; y++) for (let x = 0; x < W; x++) {
      if (!inEll(x, y, 9, 3 - up, 8.9, 2.3, 0)) continue;
      const r = y + up; if ((r === 3 && x >= 15) || (r === 4 && x >= 13)) continue;
      px(ONDA.pad, x, y);
    }
    if (dir === 'up') { px(ONDA.shade, 8, 6 - up, 2, 4); return; }
    // gota en el borde de la hoja: cuelga (frames 0-1) o cae (frame 2)
    px(ONDA.drop, 1, f === 2 ? 7 : 5);
    const ey = 6 - up;
    if (front) { px(P.ink, 5, ey, 2, 2); px(P.ink, 11, ey, 2, 2); px(P.white, 5, ey); px(P.white, 11, ey); px(ONDA.cheek, 3, 8 - up, 2, 1); px(ONDA.cheek, 13, 8 - up, 2, 1); px(P.ink, 8, 9 - up, 2, 1); }
    else { px(P.ink, 4, ey, 2, 2); px(P.white, 4, ey); px(ONDA.cheek, 3, 8 - up, 2, 1); px(P.ink, 3, 9 - up, 2, 1); }
  };

  def2('ondavar', ondavarDraw);

  // ═══ Línea de Espirel (Caracolín): caracol bajo y largo → Espiravar, caracol con concha-torre alta ═══
  // Espiravar (fase 2, 20×18, 9 kg): mismo largo, pero la concha crece en torre cónica (silueta de montaña) y el cuerpo se queda corto. Concha azul marino con franjas de nácar, borde dorado y una ventanita con un pececito.
  // Rasgo propio: dentro de la ventana nada un pececito y suben burbujas (frame 2, `flick`); las antenas suben y bajan. Sigue siendo lentísimo. Se conserva: cuerpo verde-menta (ahora turquesa), concha azul con detalle amarillo/dorado, ojos en antenas, mejillas.
  const ESP = { skin: '#46c4bc', skin2: '#2f9ea6', navy: '#243f86', navy2: '#162a5c', nacre: '#f1d8d2', gold: '#f0b93a', gold2: '#c98a1d', water: '#8fdcf0', fish: P.orange, bub: P.white };

  const espiravarDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f === 1 ? 1 : 0, back = dir === 'up', front = dir === 'down';
    const cx = back ? 10 : side ? 12 : 11;
    // concha-torre: cono de 14 filas, franjas de nácar en espiral
    for (let y = 0; y <= 13; y++) {
      const hw = 1.3 + y * 0.42;
      for (let x = Math.floor(cx - hw - 1); x <= Math.ceil(cx + hw + 1); x++) {
        const dx = x + 0.5 - cx; if (Math.abs(dx) > hw) continue;
        const t = y + dx * 0.55, m = ((t % 4) + 4) % 4;
        px(Math.abs(dx) > hw - 1.1 ? ESP.navy2 : m < 1 ? ESP.nacre : ESP.navy, x, y - up);
      }
    }
    px(ESP.gold, Math.round(cx) - 1, 0 - up, 2, 1); // punta dorada
    // cuerpo corto y ancho
    ell(px, W, H, back ? 10 : 10.5, 15.4, back ? 8.8 : 9.2, 2.6, 0, (x, y) => (y >= 16 ? ESP.skin2 : ESP.skin));
    // borde dorado en la base de la concha (sobre el cuerpo)
    for (let x = Math.round(cx - 7.2); x <= Math.round(cx + 6.8); x++) px(x % 2 ? ESP.gold : ESP.gold2, x, 13 - up);
    if (back) return;
    // ventanita dorada con pececito (frame 2: el pez nada y suben burbujas)
    const wx = Math.round(cx) - 1;
    px(ESP.gold, wx, 7 - up, 4, 4); px(ESP.water, wx + 1, 8 - up, 2, 2); px(ESP.gold2, wx, 10 - up, 4, 1);
    if (f === 2) { px(ESP.fish, wx + 2, 8 - up); px(ESP.bub, wx + 3, 5 - up); px(ESP.bub, wx + 4, 3 - up); }
    else px(ESP.fish, wx + 1, 9 - up);
    // cabeza con antenas que suben y bajan (f0 normal · f1 alta · f2 baja)
    const ey = f === 1 ? 4 : f === 2 ? 6 : 5, hx = side ? 4.2 : 5.6;
    ell(px, W, H, hx, 13, side ? 3.4 : 3.8, 3.3, 0, (x, y) => (y >= 15 ? ESP.skin2 : ESP.skin));
    const ax = side ? [2, 6] : [3, 8];
    ax.forEach((x) => { for (let y = ey + 2; y <= 10; y++) px(ESP.skin, x - 1, y, 2, 1); px(P.white, x - 1, ey, 2, 2); px(P.ink, x - 1, ey + 1); });
    if (front) { px(P.pink2, 3, 13); px(P.pink2, 8, 13); px(P.ink, 5, 14, 2, 1); } else { px(P.pink2, 3, 14); px(P.ink, 2, 14, 2, 1); }
  };

  def2('espiravar', espiravarDraw);

  const PER = { v: '#3f58c0', vL: '#6f8cf0', vD: '#2a3b8f', vV: '#4a2f8a', lip: '#d9ccf7', in: '#5a2a6a', inL: '#8a3a86', n: '#f8e6f2', nS: '#dcb8e4', nH: '#f3ebfa', pk: '#f4a0bc', ft: '#e8a89c', ftD: '#c07c78', bub: '#bfeaff', bubD: '#7fc4e8', co: '#f06a8c', coD: '#b83a64', coL: '#ffb0c4', gl: '#e4d2fb', spk: '#ffffff' };

  const pearl = (cx, cy, r) => (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return dx * 0.6 + dy * 0.8 > r * 0.5 ? PER.nS : dx < -r * 0.3 && dy < -r * 0.35 && dx > -r * 0.8 && dy > -r * 0.85 ? PER.nH : PER.n; };

  const bubble = (px, x, y) => { px(PER.bubD, x, y, 2, 2); px(PER.bub, x, y); }; // burbuja pequeña 2×2

  // Perlel (fase 1, 16×14, 3 kg): almeja de dos valvas azules con una perla enorme que no sabe cerrar la boca. La perla es la CARA (ojos grandes, mejillas rosas, boquita); pie de molusco rosado debajo.
  // Rasgo propio: anda arrastrando la concha (`sway`), muy lenta; parada, bosteza: la valva de arriba se levanta, la perla asoma y sale una burbuja (frame 2, `flick`).
  const perlelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, P2 = PER, y0 = -up, uy = y0 - (fl ? 1 : 0), INK = '#2a1b30';
    // pie de molusco (se alterna al andar)
    if (!side) { const a = f === 1 ? 4 : 6; px(P2.ft, a, 13, 6, 1); px(P2.ftD, a, 13); px(P2.ftD, a + 5, 13); } else { const a = f === 1 ? 3 : 5; px(P2.ft, a, 13, 6, 1); px(P2.ftD, a, 13); }
    if (back) { // de espaldas: la concha cerrada, con la bisagra abajo y las costillas
      const g = (x, y) => { const yy = y - y0; return yy === 8 ? P2.vD : yy >= 12 ? P2.vD : yy <= 2 ? P2.vL : x % 3 === 1 ? P2.vL : yy > 8 && x % 3 === 0 ? P2.vV : P2.v; };
      eli(px, 8, 7.4 + y0, 7.8, 5.4, 0, 12, W, g); px(P2.lip, 6, 12 + y0, 4, 1); if (fl) bubble(px, 13, 0);
      return;
    }
    const cx = side ? 9.4 : 8, rx = side ? 6.7 : 7.7;
    // interior de la boca (ciruela) y valva de abajo
    for (let y = 6 + uy; y <= 7 + y0; y++) for (let x = 1; x <= (side ? 12 : 14); x++) px(y >= 7 + y0 ? P2.in : P2.inL, x, y);
    eli(px, cx, 9.8, rx + 0.2, 3.5, 8, 12, W, (x, y) => (y === 8 ? P2.lip : y >= 12 ? P2.vD : (x + (side ? 1 : 0)) % 3 === 1 ? P2.vL : y >= 11 ? P2.vV : P2.v));
    // valva de arriba (se levanta al bostezar)
    eli(px, cx, 4.8 + uy, rx, 3.6, -2, 6 + uy, W, (x, y) => { const yy = y - uy; return yy === 6 ? P2.lip : yy <= 1 ? P2.vL : x % 3 === 1 ? P2.vL : x < cx - 3 && yy <= 3 ? P2.vL : P2.v; });
    if (side) px(P2.vV, 14, 7 + y0, 2, 3); // bisagra
    // la perla, grande, en la boca
    const pcx = side ? 5.2 : 8, pr = side ? 3.3 : 3.6;
    ell(px, W, H, pcx, 6.6 + y0, pr, pr, 0, pearl(pcx, 6.6 + y0, pr));
    if (front) { Ei(px, 5, 5 + y0, INK); Ei(px, 9, 5 + y0, INK); sym(px, W, P2.pk, 4, 7 + y0, 1, 1); px(INK, 7, 8 + y0, 2, 1); } else { Ei(px, 2, 5 + y0, INK); px(P2.pk, 4, 7 + y0); px(INK, 2, 8 + y0, 2, 1); }
    if (fl) { bubble(px, side ? 1 : 13, 0); if (!side) px(P2.bub, 15, 3); }
  };

  def2('perlel', perlelDraw);

  // Perlorix (fase 2, 20×18, 8 kg): ostra gigante. Concha de abanico con costillas (el borde sobresale en «dientes»), CORONA DE CORAL rosa en lo alto, perla enorme con aureola luminosa que hace de cara y burbujas alrededor.
  // Rasgo propio: más lenta aún; la perla brilla; parada, bosteza y la aureola destella con estrellitas y burbujas (frame 2, `flick`). Se conserva: perla grande con cara, valvas azules y el pie rosado.
  const perlorixDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, P2 = PER, y0 = -up, uy = y0 - (fl ? 1 : 0), INK = '#2a1b30';
    const valU = (x) => (x % 3 === 1 ? 0 : 0.9), valL = (x) => (x % 3 === 1 ? 0 : -0.9);
    if (!side) { const a = f === 1 ? 5 : 7; px(P2.ft, a, 17, 8, 1); px(P2.ftD, a, 17); px(P2.ftD, a + 7, 17); } else { const a = f === 1 ? 4 : 6; px(P2.ft, a, 17, 8, 1); px(P2.ftD, a, 17); }
    const crown = (ox) => { // corona de coral: tronco central con dos ramas; ox = desplazamiento en la vista de perfil
      if (!side) { // tres corales redondos: el central grande y uno a cada lado
        px(P2.co, 8, 0 + uy, 4, 2); px(P2.coL, 8, 0 + uy, 4, 1); px(P2.coD, 9, 2 + uy, 2, 3);
        sym(px, W, P2.co, 3, 2 + uy, 3, 2); sym(px, W, P2.coL, 3, 2 + uy, 3, 1); sym(px, W, P2.coD, 4, 4 + uy, 1, 1);
        sym(px, W, P2.coD, 6, 3 + uy, 1, 2);
      } else {
        px(P2.co, 11, 1 + uy, 2, 4); px(P2.coL, 11, 0 + uy, 2, 1); px(P2.coD, 12, 4 + uy);
        px(P2.co, 8, 2 + uy, 2, 3); px(P2.coL, 8, 1 + uy, 1, 1); px(P2.co, 15, 3 + uy, 2, 2); px(P2.coL, 16, 2 + uy, 1, 1); px(P2.coD, 9, 4 + uy);
      }
    };
    if (back) {
      const g = (x, y) => { const yy = y - y0; return yy === 11 ? P2.vD : yy >= 16 ? P2.vD : yy <= 5 ? P2.vL : x % 3 === 1 ? P2.vL : yy > 11 && x % 3 === 0 ? P2.vV : P2.v; };
      scal(px, W, 10, 9.4 + y0, 9.8, 6.6, valU, 2 + y0, 16, g); crown(0); px(P2.lip, 8, 16 + y0, 4, 1);
      if (fl) { bubble(px, 17, 2); bubble(px, 1, 5); }
      return;
    }
    const cx = side ? 12.2 : 10, rx = side ? 7.7 : 9.6;
    for (let y = 9 + uy; y <= 10 + y0; y++) for (let x = 1; x <= 18; x++) px(y >= 10 + y0 ? P2.in : P2.inL, x, y);
    scal(px, W, cx, 13.2, rx + 0.3, 3.6, valL, 11, 16, (x, y) => (y === 11 ? P2.lip : y >= 16 ? P2.vD : x % 3 === 1 ? P2.vL : y >= 14 ? P2.vV : P2.v));
    scal(px, W, cx, 7.6 + uy, rx, 4.4, valU, 2, 9 + uy, (x, y) => { const yy = y - uy; return yy === 9 ? P2.lip : yy <= 4 ? (x % 3 === 1 ? P2.vL : P2.v) : x % 3 === 1 ? P2.vL : yy >= 7 && x > cx + 3 ? P2.vD : P2.v; });
    crown(0);
    if (side) px(P2.vV, 18, 10 + y0, 2, 4);
    const pcx = side ? 6.8 : 10, pcy = 9.9 + y0, pr = side ? 4.1 : 4.3;
    // aureola luminosa alrededor de la perla
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x + 0.5 - pcx, dy = y + 0.5 - pcy, d = Math.hypot(dx, dy); if (d > pr && d <= pr + 1.15 && y > 3 + uy && y < 17) px(fl ? P2.spk : P2.gl, x, y); }
    ell(px, W, H, pcx, pcy, pr, pr, 0, pearl(pcx, pcy, pr));
    if (front) { Ei(px, 7, 7 + y0, INK); Ei(px, 11, 7 + y0, INK); sym(px, W, P2.pk, 6, 10 + y0, 1, 1); px(INK, 9, 11 + y0, 2, 1); } else { Ei(px, 4, 7 + y0, INK); px(P2.pk, 6, 10 + y0); px(INK, 3, 11 + y0, 2, 1); }
    bubble(px, side ? 1 : 1, 3 + (f === 1 ? -1 : 0));
    if (fl) { bubble(px, side ? 15 : 17, 6); px(P2.bub, side ? 18 : 18, 4); if (!side) sym(px, W, P2.spk, 4, 6, 1, 1); }
  };

  def2('perlorix', perlorixDraw);
})();
