// Pure room/relay logic (no dependencies) so it can be unit-tested with fake sockets.
// Model: the HOST's browser runs the fight simulation. The server only pairs people and relays.
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const MAX_ROOMS = 300, MAX_SPECS = 8;
const HOST_TYPES = new Set(['snap', 'setup']);
const GUEST_TYPES = new Set(['in', 'char', 'rematch', 'vr']);

function createHub() {
  const rooms = new Map();

  const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(typeof o === 'string' ? o : JSON.stringify(o)); };
  const newCode = () => {
    for (let i = 0; i < 60; i++) {
      let c = '';
      for (let k = 0; k < 4; k++) c += ALPHA[(Math.random() * ALPHA.length) | 0];
      if (!rooms.has(c)) return c;
    }
    return null;
  };

  function createRoom(ws, pub) {
    if (rooms.size >= MAX_ROOMS) return send(ws, { t: 'err', m: 'Server is full — try again soon' });
    const code = newCode();
    if (!code) return send(ws, { t: 'err', m: 'Could not create a room' });
    const room = { code, host: ws, guest: null, specs: new Set(), pub };
    rooms.set(code, room);
    ws.room = room; ws.role = 'host';
    send(ws, { t: 'room', code, pub });
  }

  function joinRoom(ws, room) {
    let role = 'guest';
    if (room.guest) {
      if (room.specs.size >= MAX_SPECS) return send(ws, { t: 'err', m: 'Room is full' });
      role = 'spec'; room.specs.add(ws);
    } else room.guest = ws;
    ws.room = room; ws.role = role;
    send(ws, { t: 'joined', code: room.code, role });
    send(room.host, { t: 'peer', role });
  }

  function onMessage(ws, raw) {
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;

    if (m.t === 'pg') return send(ws, { t: 'pg', ts: +m.ts || 0 });

    if (!ws.room) {
      if (m.t === 'create') return createRoom(ws, false);
      if (m.t === 'quick') {
        for (const r of rooms.values()) {
          if (r.pub && !r.guest && r.host.readyState === 1) return joinRoom(ws, r);
        }
        return createRoom(ws, true);
      }
      if (m.t === 'join') {
        const code = String(m.code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
        const room = rooms.get(code);
        if (!room) return send(ws, { t: 'err', m: 'Room ' + (code || '????') + ' not found' });
        return joinRoom(ws, room);
      }
      return;
    }

    const room = ws.room;
    if (ws.role === 'host') {
      if (!HOST_TYPES.has(m.t)) return;
      if (m.to === undefined) { // fast path: forward the original string
        send(room.guest, raw); for (const s of room.specs) send(s, raw);
        return;
      }
      const to = m.to; delete m.to; const out = JSON.stringify(m);
      if (to === 'guest') send(room.guest, out);
      else if (to === 'spec') for (const s of room.specs) send(s, out);
    } else if (ws.role === 'guest') {
      if (!GUEST_TYPES.has(m.t)) return;
      m.from = 'guest';
      send(room.host, m);
    } // spectators cannot send anything
  }

  function onClose(ws) {
    const room = ws.room;
    if (!room) return;
    ws.room = null;
    if (ws.role === 'host') {
      rooms.delete(room.code);
      const others = [room.guest, ...room.specs];
      for (const o of others) if (o) { send(o, { t: 'hostleft' }); o.room = null; }
    } else if (ws.role === 'guest') {
      room.guest = null; send(room.host, { t: 'left', role: 'guest' });
    } else {
      room.specs.delete(ws); send(room.host, { t: 'left', role: 'spec' });
    }
  }

  return { onMessage, onClose, rooms };
}

module.exports = { createHub };
