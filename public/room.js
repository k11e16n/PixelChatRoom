import { drawCharacter, GRID_W, GRID_H } from './character.js';
import { ROOM_WIDTH, ROOM_HEIGHT, FURNITURE, DEFAULT_SPAWN, CHAR_PIXEL_SIZE } from './room-config.js';

const CHAR_WIDTH = GRID_W * CHAR_PIXEL_SIZE;
const CHAR_HEIGHT = GRID_H * CHAR_PIXEL_SIZE;
const SPEED = 120; // px/sec
const MOVE_SEND_INTERVAL = 50; // ms
const BUBBLE_DURATION = 4500; // ms
const BUBBLE_FADE_DURATION = 500; // ms

const FLOOR_COLOR = '#dcd3c0';
const FURNITURE_FILL = '#8a6642';
const FURNITURE_STROKE = '#5c4429';
const BUBBLE_FILL = '#ffffff';
const BUBBLE_STROKE = '#1a1a1a';
const BUBBLE_TEXT_COLOR = '#1a1a1a';
const BUBBLE_PADDING_X = 4;
const BUBBLE_HEIGHT = 12;
const BUBBLE_GAP = 4;

const NAME_FONT = '8px sans-serif';
const NAME_TEXT_COLOR = '#ffffff';
const NAME_STROKE_COLOR = '#1a1a1a';
const NAME_GAP = 2;
const NAME_RESERVED_HEIGHT = 10;

const MOVE_KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function collidesAt(x, y) {
  const box = { x, y, w: CHAR_WIDTH, h: CHAR_HEIGHT };
  return FURNITURE.some((furniture) => rectsOverlap(box, furniture));
}

export function initRoom({ ctx, selfAppearance, selfId, selfName, initialPlayers = [], onMove }) {
  const player = { x: DEFAULT_SPAWN.x, y: DEFAULT_SPAWN.y };
  const pressed = new Set();

  const otherPlayers = new Map();
  for (const other of initialPlayers) {
    otherPlayers.set(other.id, { name: other.name, appearance: other.appearance, x: other.x, y: other.y });
  }

  const bubbles = new Map();

  let lastSentAt = 0;
  let lastSentX = player.x;
  let lastSentY = player.y;

  window.addEventListener('keydown', (event) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    const direction = MOVE_KEYS[event.code];
    if (direction) pressed.add(direction);
  });

  window.addEventListener('keyup', (event) => {
    const direction = MOVE_KEYS[event.code];
    if (direction) pressed.delete(direction);
  });

  function step(dt) {
    let dx = (pressed.has('right') ? 1 : 0) - (pressed.has('left') ? 1 : 0);
    let dy = (pressed.has('down') ? 1 : 0) - (pressed.has('up') ? 1 : 0);

    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    const distance = SPEED * dt;

    if (dx !== 0) {
      const nextX = Math.min(Math.max(player.x + dx * distance, 0), ROOM_WIDTH - CHAR_WIDTH);
      if (!collidesAt(nextX, player.y)) player.x = nextX;
    }

    if (dy !== 0) {
      const nextY = Math.min(Math.max(player.y + dy * distance, 0), ROOM_HEIGHT - CHAR_HEIGHT);
      if (!collidesAt(player.x, nextY)) player.y = nextY;
    }
  }

  function drawName(name, x, y) {
    if (!name) return;

    const centerX = x + CHAR_WIDTH / 2;
    const baselineY = y - NAME_GAP;

    ctx.font = NAME_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 2;
    ctx.strokeStyle = NAME_STROKE_COLOR;
    ctx.strokeText(name, centerX, baselineY);
    ctx.fillStyle = NAME_TEXT_COLOR;
    ctx.fillText(name, centerX, baselineY);
  }

  function drawBubble(id, x, y) {
    const bubble = bubbles.get(id);
    if (!bubble) return;

    const remaining = bubble.expiresAt - performance.now();
    if (remaining <= 0) {
      bubbles.delete(id);
      return;
    }

    const alpha = remaining < BUBBLE_FADE_DURATION ? remaining / BUBBLE_FADE_DURATION : 1;
    const textWidth = ctx.measureText(bubble.text).width;
    const boxWidth = textWidth + BUBBLE_PADDING_X * 2;
    const centerX = x + CHAR_WIDTH / 2;
    const boxX = Math.min(Math.max(centerX - boxWidth / 2, 0), ROOM_WIDTH - boxWidth);
    const boxY = y - BUBBLE_HEIGHT - BUBBLE_GAP - NAME_RESERVED_HEIGHT;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = BUBBLE_FILL;
    ctx.strokeStyle = BUBBLE_STROKE;
    ctx.fillRect(boxX, boxY, boxWidth, BUBBLE_HEIGHT);
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxWidth - 1, BUBBLE_HEIGHT - 1);
    ctx.fillStyle = BUBBLE_TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.text, boxX + boxWidth / 2, boxY + BUBBLE_HEIGHT / 2 + 1);
    ctx.restore();
  }

  function render() {
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    ctx.fillStyle = FURNITURE_FILL;
    ctx.strokeStyle = FURNITURE_STROKE;
    for (const { x, y, w, h } of FURNITURE) {
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }

    ctx.font = '8px sans-serif';

    for (const [id, other] of otherPlayers) {
      drawCharacter(ctx, other.appearance, other.x, other.y, CHAR_PIXEL_SIZE);
      drawName(other.name, other.x, other.y);
      drawBubble(id, other.x, other.y);
    }

    drawCharacter(ctx, selfAppearance, player.x, player.y, CHAR_PIXEL_SIZE);
    drawName(selfName, player.x, player.y);
    drawBubble(selfId, player.x, player.y);
  }

  function maybeSendMove(timestamp) {
    if (!onMove) return;
    if (player.x === lastSentX && player.y === lastSentY) return;
    if (timestamp - lastSentAt < MOVE_SEND_INTERVAL) return;

    lastSentAt = timestamp;
    lastSentX = player.x;
    lastSentY = player.y;
    onMove(player.x, player.y);
  }

  let lastTimestamp = null;
  function loop(timestamp) {
    if (lastTimestamp !== null) {
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      step(dt);
    }
    lastTimestamp = timestamp;
    render();
    maybeSendMove(timestamp);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  return {
    addPlayer(id, name, appearance, x, y) {
      otherPlayers.set(id, { name, appearance, x, y });
    },
    updatePlayerPosition(id, x, y) {
      const other = otherPlayers.get(id);
      if (other) {
        other.x = x;
        other.y = y;
      }
    },
    removePlayer(id) {
      otherPlayers.delete(id);
    },
    showBubble(id, text) {
      bubbles.set(id, { text, expiresAt: performance.now() + BUBBLE_DURATION });
    },
  };
}
