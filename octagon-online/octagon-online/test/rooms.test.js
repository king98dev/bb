const assert = require('assert');
const { createHub } = require('../rooms');
const mk = () => ({ readyState: 1, out: [], send(s) { this.out.push(JSON.parse(s)); }, room: null, role: null });
const last = (w) => w.out[w.out.length - 1];
const hub = createHub();

const host = mk(), guest = mk(), spec = mk(), stranger = mk();
hub.onMessage(host, JSON.stringify({ t: 'create' }));
const code = last(host).code;
assert.strictEqual(last(host).t, 'room'); assert.strictEqual(code.length, 4);

hub.onMessage(stranger, JSON.stringify({ t: 'join', code: 'ZZZZ' }));
assert.strictEqual(last(stranger).t, 'err');

hub.onMessage(guest, JSON.stringify({ t: 'join', code: code.toLowerCase() }));
assert.deepStrictEqual(last(guest), { t: 'joined', code, role: 'guest' });
assert.deepStrictEqual(last(host), { t: 'peer', role: 'guest' });

hub.onMessage(spec, JSON.stringify({ t: 'join', code }));
assert.strictEqual(last(spec).role, 'spec');

// guest -> host only, tagged, whitelisted
hub.onMessage(guest, JSON.stringify({ t: 'in', a: 'jab', v: 1, from: 'spoof' }));
assert.deepStrictEqual(last(host), { t: 'in', a: 'jab', v: 1, from: 'guest' });
const n = host.out.length; hub.onMessage(guest, JSON.stringify({ t: 'snap' })); assert.strictEqual(host.out.length, n);
hub.onMessage(spec, JSON.stringify({ t: 'in', a: 'jab', v: 1 })); assert.strictEqual(host.out.length, n);

// host -> everyone, or targeted
hub.onMessage(host, JSON.stringify({ t: 'snap', h: 1 }));
assert.strictEqual(last(guest).t, 'snap'); assert.strictEqual(last(spec).t, 'snap');
hub.onMessage(host, JSON.stringify({ t: 'setup', to: 'spec', a: 1 }));
assert.strictEqual(last(spec).t, 'setup'); assert.strictEqual(last(spec).to, undefined); assert.notStrictEqual(last(guest).t, 'setup');

// guest leaves, host told; new guest can take the slot
hub.onClose(guest); assert.deepStrictEqual(last(host), { t: 'left', role: 'guest' });
const g2 = mk(); hub.onMessage(g2, JSON.stringify({ t: 'join', code })); assert.strictEqual(last(g2).role, 'guest');

// quick match pairs two strangers
const q1 = mk(), q2 = mk();
hub.onMessage(q1, JSON.stringify({ t: 'quick' })); assert.strictEqual(last(q1).pub, true);
hub.onMessage(q2, JSON.stringify({ t: 'quick' })); assert.strictEqual(last(q2).role, 'guest');

// host leaves -> room gone, others told
hub.onClose(host); assert.strictEqual(last(g2).t, 'hostleft'); assert.ok(!hub.rooms.has(code));

// garbage never throws
hub.onMessage(mk(), 'not json'); hub.onMessage(mk(), '{"t":5}');
console.log('rooms.js: all tests passed');
