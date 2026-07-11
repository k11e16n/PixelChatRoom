import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

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

wss.on('connection', (ws) => {
  ws.id = randomUUID();
  console.log(`[join] ${ws.id} connected (total: ${wss.clients.size})`);

  ws.on('close', () => {
    console.log(`[leave] ${ws.id} disconnected (total: ${wss.clients.size})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`PixelChatRoom server listening on http://localhost:${PORT}`);
});
