import { drawCharacter, shade, getFacing, GRID_W, GRID_H } from './character.js';
import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_BOUNDS, FURNITURE, DEFAULT_SPAWN, CHAR_PIXEL_SIZE } from './room-config.js';

const CHAR_WIDTH = GRID_W * CHAR_PIXEL_SIZE;
const CHAR_HEIGHT = GRID_H * CHAR_PIXEL_SIZE;
const SPEED = 120; // px/sec
const MOVE_SEND_INTERVAL = 50; // ms
const BUBBLE_DURATION = 4500; // ms
const BUBBLE_FADE_DURATION = 500; // ms
const WALK_FRAME_INTERVAL = 150; // ms
const IDLE_TIMEOUT = 200; // ms

export const FLOOR_COLOR = '#c9a876';
export const floorSeamColor = shade(FLOOR_COLOR, 0.8);
export const FLOOR_TILE_SIZE = 16;
export const FURNITURE_FILL = '#8a6642';
export const OUTLINE_COLOR = '#161616';
export const ROOM_BORDER_THICKNESS = 2;

export const WALL_COLOR = '#7a8a99';
export const wallSeamColor = shade(WALL_COLOR, 0.8);
export const WALL_TILE_W = 24;
export const WALL_TILE_H = 12;
export const BASEBOARD_COLOR = shade(WALL_COLOR, 0.5);
export const BASEBOARD_THICKNESS = 2;

const BOOK_COLORS = ['#e63946', '#2a9d8f', '#457b9d', '#f4a261', '#8338ec'];
const BOOK_WIDTHS = [3, 4, 3, 5, 4];
const BOOK_HEIGHT_INSETS = [0, 2, 1, 0, 3];
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

export function drawSeamRect(ctx, x, y, w, h, baseColor, seamColor, tileW, tileH) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = seamColor;
  for (let gx = tileW; gx < w; gx += tileW) {
    ctx.fillRect(x + gx, y, 1, h);
  }
  for (let gy = tileH; gy < h; gy += tileH) {
    ctx.fillRect(x, y + gy, w, 1);
  }
}

export function drawRoomBorder(ctx, w, h, thickness) {
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(0, 0, w, thickness);
  ctx.fillRect(0, h - thickness, w, thickness);
  ctx.fillRect(0, 0, thickness, h);
  ctx.fillRect(w - thickness, 0, thickness, h);
}

// Unified light source: top-left highlight, bottom-right shadow, for every
// flat rectangular object (furniture bodies). Cylindrical parts (table legs)
// use their own left/right shading — see drawTableLeg.
export function drawShadedRect(ctx, x, y, w, h, baseColor) {
  const highlight = shade(baseColor, 1.25);
  const shadow = shade(baseColor, 0.7);
  const edge = Math.max(1, Math.round(Math.min(w, h) * 0.18));

  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = baseColor;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = highlight;
  ctx.fillRect(x + 1, y + 1, w - 2, edge);
  ctx.fillRect(x + 1, y + 1, edge, h - 2);

  ctx.fillStyle = shadow;
  ctx.fillRect(x + 1, y + h - 1 - edge, w - 2, edge);
  ctx.fillRect(x + w - 1 - edge, y + 1, edge, h - 2);
}

export function drawBookshelf(ctx, x, y, w, h, baseColor) {
  drawShadedRect(ctx, x, y, w, h, baseColor);

  const shelfCount = 3;
  const shelfGap = h / (shelfCount + 1);

  ctx.fillStyle = OUTLINE_COLOR;
  for (let i = 1; i <= shelfCount; i++) {
    ctx.fillRect(x + 1, y + shelfGap * i, w - 2, 1);
  }

  const bookGap = 1;
  let colorIndex = 0;
  for (let i = 0; i <= shelfCount; i++) {
    const segTop = y + (i === 0 ? 2 : shelfGap * i + 1);
    const segBottom = y + (i === shelfCount ? h - 2 : shelfGap * (i + 1));
    const segHeight = segBottom - segTop;
    if (segHeight < 4) continue;

    let bx = x + 2;
    while (bx + 2 <= x + w - 2) {
      const bookWidth = BOOK_WIDTHS[colorIndex % BOOK_WIDTHS.length];
      if (bx + bookWidth > x + w - 2) break;

      const heightInset = BOOK_HEIGHT_INSETS[colorIndex % BOOK_HEIGHT_INSETS.length];
      const bookHeight = Math.max(2, segHeight - heightInset);

      ctx.fillStyle = BOOK_COLORS[colorIndex % BOOK_COLORS.length];
      ctx.fillRect(bx, segTop, bookWidth, bookHeight);
      bx += bookWidth + bookGap;
      colorIndex++;
    }
  }
}

function drawTableLeg(ctx, x, y, size, baseColor) {
  const highlight = shade(baseColor, 1.45);
  const shadow = shade(baseColor, 0.5);
  const third = Math.max(1, Math.round(size / 3));

  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = highlight;
  ctx.fillRect(x + 1, y + 1, third, size - 2);
  ctx.fillStyle = baseColor;
  ctx.fillRect(x + 1 + third, y + 1, size - 2 * third - 2, size - 2);
  ctx.fillStyle = shadow;
  ctx.fillRect(x + size - third - 1, y + 1, third, size - 2);
}

export function drawTable(ctx, x, y, w, h, baseColor) {
  const legSize = Math.max(3, Math.round(h * 0.3));
  const legInset = Math.max(2, Math.round(w * 0.08));

  drawTableLeg(ctx, x + legInset, y + h, legSize, baseColor);
  drawTableLeg(ctx, x + w - legInset - legSize, y + h, legSize, baseColor);

  drawShadedRect(ctx, x, y, w, h, baseColor);
}

export function drawSofa(ctx, x, y, w, h, baseColor) {
  const backHeight = Math.round(h * 0.35);

  drawShadedRect(ctx, x, y, w, backHeight, shade(baseColor, 1.1));
  drawShadedRect(ctx, x, y + backHeight, w, h - backHeight, baseColor);

  ctx.fillStyle = OUTLINE_COLOR;
  const seams = 2;
  for (let i = 1; i <= seams; i++) {
    const seamX = x + (w / (seams + 1)) * i;
    ctx.fillRect(seamX, y + backHeight + 2, 1, h - backHeight - 4);
  }
}

const FURNITURE_DRAWERS = {
  bookshelf: drawBookshelf,
  table: drawTable,
  sofa: drawSofa,
};

export function initRoom({ ctx, selfAppearance, selfId, selfName, initialPlayers = [], onMove }) {
  const player = {
    x: DEFAULT_SPAWN.x,
    y: DEFAULT_SPAWN.y,
    facing: 'down',
    frame: 0,
    flip: false,
    animTimer: 0,
  };
  const pressed = new Set();

  const otherPlayers = new Map();
  for (const other of initialPlayers) {
    otherPlayers.set(other.id, {
      name: other.name,
      appearance: other.appearance,
      x: other.x,
      y: other.y,
      facing: 'down',
      frame: 0,
      flip: false,
      lastMoveAt: 0,
    });
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

    if (dx !== 0 || dy !== 0) {
      const facing = getFacing(dx, dy);
      player.facing = facing.facing;
      player.flip = facing.flip;

      player.animTimer += dt * 1000;
      if (player.animTimer >= WALK_FRAME_INTERVAL) {
        player.animTimer = 0;
        player.frame = player.frame === 0 ? 1 : 0;
      }
    } else {
      player.frame = 0;
      player.animTimer = 0;
    }

    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    const distance = SPEED * dt;

    if (dx !== 0) {
      const nextX = Math.min(Math.max(player.x + dx * distance, ROOM_BOUNDS.minX), ROOM_BOUNDS.maxX - CHAR_WIDTH);
      if (!collidesAt(nextX, player.y)) player.x = nextX;
    }

    if (dy !== 0) {
      const nextY = Math.min(Math.max(player.y + dy * distance, ROOM_BOUNDS.minY), ROOM_BOUNDS.maxY - CHAR_HEIGHT);
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
    drawSeamRect(ctx, 0, 0, ROOM_WIDTH, ROOM_HEIGHT, WALL_COLOR, wallSeamColor, WALL_TILE_W, WALL_TILE_H);
    drawRoomBorder(ctx, ROOM_WIDTH, ROOM_HEIGHT, ROOM_BORDER_THICKNESS);

    const { minX, minY, maxX, maxY } = ROOM_BOUNDS;
    const floorX = minX - BASEBOARD_THICKNESS;
    const floorY = minY - BASEBOARD_THICKNESS;
    const floorW = maxX - minX + BASEBOARD_THICKNESS * 2;
    const floorH = maxY - minY + BASEBOARD_THICKNESS * 2;

    ctx.fillStyle = BASEBOARD_COLOR;
    ctx.fillRect(floorX, floorY, floorW, floorH);

    drawSeamRect(ctx, minX, minY, maxX - minX, maxY - minY, FLOOR_COLOR, floorSeamColor, FLOOR_TILE_SIZE, FLOOR_TILE_SIZE);

    for (const { type, x, y, w, h } of FURNITURE) {
      const draw = FURNITURE_DRAWERS[type] ?? drawShadedRect;
      draw(ctx, x, y, w, h, FURNITURE_FILL);
    }

    ctx.font = '8px sans-serif';

    for (const [id, other] of otherPlayers) {
      const isIdle = performance.now() - other.lastMoveAt > IDLE_TIMEOUT;
      drawCharacter(ctx, other.appearance, other.x, other.y, CHAR_PIXEL_SIZE, {
        facing: other.facing,
        frame: isIdle ? 0 : other.frame,
        flip: other.flip,
      });
      drawName(other.name, other.x, other.y);
      drawBubble(id, other.x, other.y);
    }

    drawCharacter(ctx, selfAppearance, player.x, player.y, CHAR_PIXEL_SIZE, {
      facing: player.facing,
      frame: player.frame,
      flip: player.flip,
    });
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
      otherPlayers.set(id, {
        name,
        appearance,
        x,
        y,
        facing: 'down',
        frame: 0,
        flip: false,
        lastMoveAt: 0,
      });
    },
    updatePlayerPosition(id, x, y) {
      const other = otherPlayers.get(id);
      if (!other) return;

      const dx = x - other.x;
      const dy = y - other.y;

      if (dx !== 0 || dy !== 0) {
        const facing = getFacing(Math.sign(dx), Math.sign(dy));
        other.facing = facing.facing;
        other.flip = facing.flip;
        other.frame = other.frame === 0 ? 1 : 0;
        other.lastMoveAt = performance.now();
      }

      other.x = x;
      other.y = y;
    },
    removePlayer(id) {
      otherPlayers.delete(id);
    },
    showBubble(id, text) {
      bubbles.set(id, { text, expiresAt: performance.now() + BUBBLE_DURATION });
    },
  };
}
