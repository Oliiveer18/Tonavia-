// hoja_pisos.js — hoja de contacto de 50 pisos de las Profundidades con el pintor REAL del juego (Chromium + dist/criaturas.html). Uso: node build.js && node tools/hoja_pisos.js [bioma|todos] [semilla]
// Escribe docs/hoja_pisos.png (todos los biomas) o docs/hoja_pisos_<bioma>.png. Salida de UNA línea: «OK archivo» o «FALLA: motivo».
const path = require('path'), fs = require('fs'), raiz = path.join(__dirname, '..'), bioma = process.argv[2] || 'todos', semilla = process.argv[3] || 'hoja';
(async () => {
  let pw; try { pw = require('playwright'); } catch (e) { console.log('FALLA: falta playwright (npm i playwright) para pintar con el juego real'); process.exit(1); }
  const html = path.join(raiz, 'dist', 'criaturas.html'); if (!fs.existsSync(html)) { console.log('FALLA: falta dist/criaturas.html (node build.js)'); process.exit(1); }
  const b = await pw.chromium.launch(), pg = await b.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto('file://' + html + '?menu=1&sonido=0'); await pg.waitForTimeout(300);
  const r = await pg.evaluate(([bioma, semilla]) => {
    const P = G.profundidades, C = G.cueva2d, N = 50, COLS = 10, E = 1 / 3, fw = Math.round(58 * 16 * E), fh = Math.round(38 * 16 * E), cv = document.createElement('canvas'); cv.width = COLS * (fw + 4) + 4; cv.height = Math.ceil(N / COLS) * (fh + 16) + 4;
    const c = cv.getContext('2d'); c.fillStyle = '#120c1c'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = true; c.font = '10px monospace'; const est = { jugadores: {}, mapas: {} }; if (bioma !== 'todos' && P.BIOMAS.indexOf(bioma) < 0) return { error: 'bioma desconocido: ' + bioma + ' (' + P.BIOMAS.join(', ') + ')' };
    for (let i = 0; i < N; i++) {
      const b0 = bioma === 'todos' ? P.BIOMAS[i % P.BIOMAS.length] : bioma, piso = bioma === 'todos' ? 1 + ((i / 5) | 0) * 3 + (i % 3) : 1 + (i % 5), id = P.idMapa(b0, P.hash(semilla + '|' + i), piso), m = G.mundo.mapa(id);
      const f = C.fondo(m), t = document.createElement('canvas'); t.width = m.W * 16; t.height = m.H * 16; const x = t.getContext('2d'); x.drawImage(f, 0, 0);
      P.vista(est, m).forEach((o) => { if (o.t !== 'jefe') C.pintarEl(x, o, o.x * 16, o.y * 16, 0, C.paleta(m)); }); (m.npcs || []).forEach((n) => { x.fillStyle = n.tipo === 'guarida' ? '#ff4d6d' : '#9dffb0'; x.fillRect(n.x * 16 + 3, n.y * 16 + 3, 10, 10); });
      const ox = 4 + (i % COLS) * (fw + 4), oy = 4 + ((i / COLS) | 0) * (fh + 16); c.drawImage(t, 0, 0, t.width, t.height, ox, oy + 12, fw, fh); c.fillStyle = '#fff4dc'; c.fillText(m.prof.bioma + ' ' + piso + ' ' + (m.prof.especial || m.prof.tipo), ox, oy + 9); G.mundo.quitar(id);
    }
    return { url: cv.toDataURL('image/png') };
  }, [bioma, semilla]);
  await b.close();
  if (r.error || errs.length) { console.log('FALLA: ' + (r.error || errs[0])); process.exit(1); }
  const sal = path.join(raiz, 'docs', bioma === 'todos' ? 'hoja_pisos.png' : 'hoja_pisos_' + bioma + '.png'); fs.writeFileSync(sal, Buffer.from(r.url.split(',')[1], 'base64'));
  console.log('OK ' + path.relative(raiz, sal) + ' (50 pisos)');
})().catch((e) => { console.log('FALLA: ' + e.message); process.exit(1); });
