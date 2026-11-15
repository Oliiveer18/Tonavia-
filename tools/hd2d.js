// hd2d.js — genera hd2d/criaturas_hd2d.html: la prueba HD-2D (Three.js) con las criaturas REALES del juego.
// Uso:  node tools/hd2d.js              -> reescribe hd2d/criaturas_hd2d.html
//       node tools/hd2d.js --comprobar  -> no escribe; sale con código 1 si el HTML no coincide con los sprites actuales (lo usa test.js)
// No toca el juego: solo lee los sprites con tools/render_sprites.js y los mete en hd2d/plantilla.html.
const cp = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.resolve(__dirname, '..'), IDS = ['aguacato', 'fosforin', 'pompon']; // Hoja, Fuego y Agua (primera fase)
const tmp = path.join(os.tmpdir(), 'hd2d_' + process.pid + '.json');
cp.execFileSync('node', [path.join(root, 'tools/render_sprites.js'), root, tmp, IDS.join(','), '0,1']);
const raw = JSON.parse(fs.readFileSync(tmp, 'utf8')); fs.unlinkSync(tmp);
const spr = {};
IDS.forEach((id) => { spr[id] = {}; const base = raw[id].down0; Object.keys(raw[id]).forEach((k) => { const o = raw[id][k];
  if (o.w !== base.w || o.h !== base.h) throw new Error(id + ': el fotograma ' + k + ' mide distinto que down0');
  if (!o.d.some((v, i) => i % 4 === 3 && v > 0)) throw new Error(id + ': el fotograma ' + k + ' está vacío');
  spr[id][k] = { w: o.w, h: o.h, d: Buffer.from(Uint8Array.from(o.d)).toString('base64') }; }); });
// Personajes jugables: Oli (id interno 'rex') y Lali ('luna'), 4 direcciones × 3 fotogramas (0 quieto, 1 y 2 pasos), mismos sprites que el juego.
function personaje(id) { const t = path.join(os.tmpdir(), 'hd2d_p_' + id + '_' + process.pid + '.json');
  cp.execFileSync('node', [path.join(root, 'tools/render_sprites.js'), root, t, id, '0,1,2']); const raw = JSON.parse(fs.readFileSync(t, 'utf8'))[id]; fs.unlinkSync(t); const r = {};
  Object.keys(raw).forEach((k) => { const o = raw[k]; if (o.w !== raw.down0.w || o.h !== raw.down0.h) throw new Error(id + ': el fotograma ' + k + ' mide distinto'); if (!o.d.some((v, n) => n % 4 === 3 && v > 0)) throw new Error(id + ': el fotograma ' + k + ' está vacío'); r[k] = { w: o.w, h: o.h, d: Buffer.from(Uint8Array.from(o.d)).toString('base64') }; }); return r; }
const oli = personaje('rex'), lali = personaje('luna');
const out = path.join(root, 'hd2d/criaturas_hd2d.html'), html = fs.readFileSync(path.join(root, 'hd2d/plantilla.html'), 'utf8').replace('/*SPRITES*/null', JSON.stringify(spr)).replace('/*OLI*/null', JSON.stringify(oli)).replace('/*LALI*/null', JSON.stringify(lali));
if (process.argv.includes('--comprobar')) { const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : ''; if (cur !== html) { console.log('hd2d/criaturas_hd2d.html no coincide con los sprites del juego: ejecuta node tools/hd2d.js'); process.exit(1); } console.log('hd2d/criaturas_hd2d.html al día'); }
else { fs.writeFileSync(out, html); console.log('hd2d/criaturas_hd2d.html escrito (' + IDS.length + ' criaturas + Oli + Lali, ' + Math.round(html.length / 1024) + ' KB)'); }
