import { drawCharacter, GRID_W, GRID_H } from './character.js';
import { ROOM_WIDTH, ROOM_HEIGHT, FURNITURE, DEFAULT_SPAWN, CHAR_PIXEL_SIZE } from './room-config.js';

const CHAR_WIDTH = GRID_W * CHAR_PIXEL_SIZE;
const CHAR_HEIGHT = GRID_H * CHAR_PIXEL_SIZE;
const SPEED = 120; // px/sec

const FLOOR_COLOR = '#dcd3c0';
const FURNITURE_FILL = '#8a6642';
const FURNITURE_STROKE = '#5c4429';

const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function collidesAt(x, y) {
  const box = { x, y, w: CHAR_WIDTH, h: CHAR_HEIGHT };
  return FURNITURE.some((furniture) => rectsOverlap(box, furniture));
}

export function initRoom({ ctx, selfAppearance }) {
  const player = { x: DEFAULT_SPAWN.x, y: DEFAULT_SPAWN.y };
  const pressed = new Set();

  window.addEventListener('keydown', (event) => {
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

  function render() {
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    ctx.fillStyle = FURNITURE_FILL;
    ctx.strokeStyle = FURNITURE_STROKE;
    for (const { x, y, w, h } of FURNITURE) {
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }

    drawCharacter(ctx, selfAppearance, player.x, player.y, CHAR_PIXEL_SIZE);
  }

  let lastTimestamp = null;
  function loop(timestamp) {
    if (lastTimestamp !== null) {
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      step(dt);
    }
    lastTimestamp = timestamp;
    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
