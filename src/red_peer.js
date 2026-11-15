// red_peer.js — v2.188 (1.3d): la CONEXIÓN entre los dos móviles con PeerJS (punto a punto; se pide a cdnjs solo al elegir personaje, como Three.js). Roles fijos: Oli crea la sala y Lali entra.
// La sala se crea una vez: el código se guarda en cada móvil (localStorage) y después conecta sola. Primera vez de Lali: pide el código (o ?sala=CODIGO en el enlace). Si se cae, el juego sigue en solitario y reintenta cada 3 s.
// Lo que viaja lo define src/red.js (puro y validado). Aquí solo hay transporte y estado visible. Con un servidor propio (online) solo cambia este archivo.
(function (root) {
  'use strict';
  const G = root.G, URL_PEER = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js', CL_SALA = 'criaturas_sala', CL_ROL = 'criaturas_rol', HZ = 10, OTRO = { oli: 'lali', lali: 'oli' }, NOMBRE = { oli: 'Oli', lali: 'Lali' };
  const ls = () => { try { return root.localStorage || null; } catch (e) { return null; } };
  const leer = (k) => { try { const s = ls(); return s ? s.getItem(k) : null; } catch (e) { return null; } }, escribir = (k, v) => { try { const s = ls(); if (s) s.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };
  function cargarPeer() {
    return new Promise((ok, ko) => { if (root.Peer) return ok(root.Peer); if (typeof document === 'undefined') return ko(new Error('sin documento'));
      const s = document.createElement('script'); s.src = URL_PEER; s.onload = () => (root.Peer ? ok(root.Peer) : ko(new Error('PeerJS no cargó'))); s.onerror = () => ko(new Error('sin conexión a PeerJS')); document.head.appendChild(s); });
  }
  function nuevoCodigo() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; const u = root.crypto && root.crypto.getRandomValues ? root.crypto.getRandomValues(new Uint8Array(6)) : Array.from({ length: 6 }, () => Math.floor(Math.random() * 256)); for (let i = 0; i < 6; i++) c += A[u[i] % A.length]; return c; } // capa de red, no del motor: aquí sí vale el azar del sistema
  function param(nombre) { try { return new URLSearchParams(root.location.search).get(nombre); } catch (e) { return null; } }
  function crear() { // una sesión de red por instancia (el juego usa G.redPeer; las pruebas crean dos)
    let R = null; // { me, est, peer, conn, estado, codigo, acc }
  function poner(estado) { if (R && R.estado !== estado) { R.estado = estado; if (R.aviso) R.aviso(redPeer.sufijo()); } }
  function enviarProgreso(fuerza) {   // F8: nuestro progreso personal (nivel, marcas, casco) para que el anfitrión pueda comprobar los requisitos de portal; solo se manda si cambió
    if (!R || !R.conn || !G.red.progreso) return; const m = G.red.progreso(R.est, R.me); if (!m) return; const t = JSON.stringify(m); if (!fuerza && t === R.prg) return; R.prg = t; R.conn.send(m);
  }
  function enlazar(conn) {
    if (R.conn && R.conn !== conn) { try { R.conn.close(); } catch (e) { /* ya cerrada */ } }
    R.conn = conn; const otro = OTRO[R.me];
    conn.on('open', () => { poner('conectado'); if (G.agentes && G.agentes.red) G.agentes.red.conectar(R.est, R.me === 'oli' ? 'anfitrion' : 'invitado');   /* v2.325: la población de entrenadores la manda Oli (el que crea la sala) */ try { conn.send(G.red.resumen(R.est, R.me)); R.prg = null; enviarProgreso(true); } catch (e) { /* se reintenta en el siguiente envío */ } });
    conn.on('data', (m) => { if (!R || R.conn !== conn) return; if (m && m.k === 'prg') G.red.progresoAplicar(R.est, otro, m); else if (m && m.k && G.agentes && G.agentes.red) G.agentes.red.recibir(R.est, m); else G.red.aplicar(R.est, otro, m); });   /* F8: 'prg' = progreso declarado del otro móvil (requisitos de portal) */
    const caida = () => { if (R && R.conn === conn) { R.conn = null; G.red.soltar(R.est, otro); if (G.agentes && G.agentes.red) G.agentes.red.conectar(R.est, null); poner(R.me === 'oli' ? 'esperando' : 'reintentando'); } };
    conn.on('close', caida); conn.on('error', caida);
  }
  function unir() { // Lali: conecta con la sala de Oli; si falla, reintenta
    if (!R || R.conn) return;
    try { const c = R.peer.connect('criaturas-' + R.codigo, { reliable: true }); enlazar(c); } catch (e) { poner('reintentando'); }
  }
  const redPeer = {
    OTRO, rolGuardado() { const r = leer(CL_ROL); return r === 'oli' || r === 'lali' ? r : null; },
    activo() { return !!R; },
    sufijo() { if (!R) return ''; const e = R.estado; return e === 'conectado' ? ' · 🔗 con ' + NOMBRE[OTRO[R.me]] : e === 'esperando' ? ' · sala ' + R.codigo : e === 'reintentando' ? ' · 🔗 buscando a Oli…' : e === 'error' ? ' · sin red (juegas solo)' : ''; },
    codigo() { return R ? R.codigo : null; },
    iniciar({ me, est, aviso, Peer: PeerInyectado, codigo: codigoDado }) { // me = 'oli' | 'lali'; Peer y codigo solo los usan las pruebas
      if (R || (me !== 'oli' && me !== 'lali')) return; escribir(CL_ROL, me);
      let codigo = (codigoDado || param('sala') || leer(CL_SALA) || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (me === 'oli') { if (!codigo) codigo = nuevoCodigo(); } else if (!codigo) { try { codigo = String(root.prompt('Código de sala que te da Oli (solo la primera vez)') || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); } catch (e) { codigo = ''; } }
      if (!codigo) return; escribir(CL_SALA, codigo);
      R = { me, est, codigo, aviso, peer: null, conn: null, estado: me === 'oli' ? 'esperando' : 'reintentando', acc: 0 }; if (aviso) aviso(redPeer.sufijo());
      const arrancar = (Peer) => {
        if (!R) return;
        const p = me === 'oli' ? new Peer('criaturas-' + codigo) : new Peer(); R.peer = p;
        p.on('connection', (c) => { if (me === 'oli') enlazar(c); });
        p.on('open', () => { if (me === 'lali') unir(); });
        p.on('error', (e) => { if (e && e.type === 'unavailable-id') { poner('error'); } else if (me === 'lali') poner('reintentando'); });
        p.on('disconnected', () => { try { p.reconnect(); } catch (e) { /* se reintenta */ } });
      };
      if (PeerInyectado) arrancar(PeerInyectado); else cargarPeer().then(arrancar).catch(() => poner('error'));
    },
    tick(dt) { // desde el bucle del juego: manda el jugador local ~10 veces por segundo y reintenta la unión de Lali
      if (!R) return; R.acc += dt; if (R.acc < 1 / HZ) return; R.acc = 0;
      if (R.conn && R.estado === 'conectado') { try { enviarProgreso(false); R.conn.send(G.red.resumen(R.est, R.me));  if (G.agentes && G.agentes.red) G.agentes.red.salida(R.est, 1 / HZ).forEach((m) => R.conn.send(m)); } catch (e) { /* la caída la gestiona 'close' */ } }
      else if (R.me === 'lali' && R.peer && R.peer.open && (R.reint = (R.reint || 0) + 1) % 30 === 0) unir(); // cada ~3 s
    },
    parar() { if (!R) return; try { if (R.peer) R.peer.destroy(); } catch (e) { /* ya cerrado */ } G.red.soltar(R.est, OTRO[R.me]); R = null; },
  };
    return redPeer;
  }
  G.redPeer = crear(); G.redPeer.crear = crear;
})(typeof window !== 'undefined' ? window : globalThis);
