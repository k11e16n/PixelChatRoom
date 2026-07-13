import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { FURNITURE, DEFAULT_SPAWN, ROOM_BOUNDS, CHAR_PIXEL_SIZE, MAX_PLAYERS } from './public/room-config.js';
import { GRID_W, GRID_H } from './public/character.js';

const CHAR_WIDTH = GRID_W * CHAR_PIXEL_SIZE;
const CHAR_HEIGHT = GRID_H * CHAR_PIXEL_SIZE;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function nextDefaultName() {
  for (let n = 1; n <= MAX_PLAYERS; n++) {
    const candidate = `玩家${n}`;
    if (![...players.values()].some((p) => p.name === candidate)) return candidate;
  }
  return `玩家${players.size + 1}`;
}

const PORT = 8080;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const httpServer = createServer(async (req, res) => {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(PUBLIC_DIR, requestPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const contents = await readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(contents);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocketServer({ server: httpServer });
const players = new Map();

function broadcast(message, excludeId) {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN && client.id !== excludeId && players.has(client.id)) {
      client.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  ws.id = randomUUID();

  if (players.size >= MAX_PLAYERS) {
    console.log(`[reject] ${ws.id} room full (players: ${players.size})`);
    ws.send(JSON.stringify({ type: 'room_full', message: `房間已滿（最多 ${MAX_PLAYERS} 人）` }));
    ws.close();
    return;
  }

  console.log(`[join] ${ws.id} connected (total: ${wss.clients.size})`);

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }

    if (message.type === 'join') {
      const trimmedName = typeof message.name === 'string' ? message.name.trim() : '';
      const name = trimmedName || nextDefaultName();
      const player = { id: ws.id, name, appearance: message.appearance, ...DEFAULT_SPAWN };
      players.set(ws.id, player);

      console.log(`[player-join] ${ws.id} name="${name}" appearance=${JSON.stringify(message.appearance)}`);

      ws.send(JSON.stringify({
        type: 'room_state',
        self_id: ws.id,
        players: [...players.values()],
        furniture: FURNITURE,
      }));

      broadcast({
        type: 'player_joined',
        id: ws.id,
        name,
        appearance: message.appearance,
        x: player.x,
        y: player.y,
      }, ws.id);
    } else if (message.type === 'move') {
      const player = players.get(ws.id);
      if (!player) return;

      player.x = clamp(Number(message.x), ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX - CHAR_WIDTH);
      player.y = clamp(Number(message.y), ROOM_BOUNDS.minY, ROOM_BOUNDS.maxY - CHAR_HEIGHT);

      broadcast({ type: 'player_moved', id: ws.id, x: player.x, y: player.y }, ws.id);
    } else if (message.type === 'chat') {
      if (!players.has(ws.id)) return;
      const text = typeof message.text === 'string' ? message.text.trim() : '';
      if (!text) return;

      broadcast({ type: 'player_chat', id: ws.id, text }, ws.id);
    }
  });

  ws.on('close', () => {
    const player = players.get(ws.id);
    players.delete(ws.id);
    const label = player ? `${ws.id} (${player.name})` : ws.id;
    console.log(`[leave] ${label} disconnected (total: ${wss.clients.size})`);
    if (player) {
      broadcast({ type: 'player_left', id: ws.id }, ws.id);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`PixelChatRoom server listening on http://localhost:${PORT}`);
});
