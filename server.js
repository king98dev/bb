const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const { createHub } = require('./rooms');

const PORT = process.env.PORT || 10000;
const app = express();
app.disable('x-powered-by');
app.get('/healthz', (req, res) => res.type('text').send('ok'));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, file) => { if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); }
}));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 32 * 1024, perMessageDeflate: false });
const hub = createHub();
app.get('/stats', (req, res) => res.json({ rooms: hub.rooms.size, sockets: wss.clients.size }));

wss.on('connection', (ws) => {
  ws.alive = true; ws.n = 0; ws.room = null; ws.role = null;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (data) => {
    ws.alive = true;
    if (++ws.n > 400) return ws.close(1008, 'rate limit'); // ~400 msgs/s is far above real play
    hub.onMessage(ws, data.toString());
  });
  ws.on('close', () => hub.onClose(ws));
  ws.on('error', () => {});
});

setInterval(() => { for (const ws of wss.clients) ws.n = 0; }, 1000);
// Heartbeat: drops dead sockets and keeps Render's proxy from idling connections out.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false; ws.ping();
  }
}, 25000);

server.listen(PORT, '0.0.0.0', () => console.log('Octagon online listening on ' + PORT));
