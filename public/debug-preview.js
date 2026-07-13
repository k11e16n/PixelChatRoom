import { drawCharacter, GRID_W, GRID_H } from './character.js';
import {
  ROOM_WIDTH, ROOM_HEIGHT, ROOM_BOUNDS, FURNITURE, DEFAULT_SPAWN, CHAR_PIXEL_SIZE,
  WALL_THICKNESS_TOP, WALL_THICKNESS_SIDE, WINDOWS, DOOR,
} from './room-config.js';
import {
  drawSeamRect, drawRoomBorder, drawBookshelf, drawTable, drawSofa, drawChair, drawWindow, drawDoor,
  FLOOR_COLOR, floorSeamColor, FLOOR_TILE_SIZE,
  WALL_COLOR, wallSeamColor, WALL_TILE_W, WALL_TILE_H,
  BASEBOARD_COLOR, BASEBOARD_THICKNESS, ROOM_BORDER_THICKNESS,
  FURNITURE_FILL,
} from './room.js';

const SAMPLE_APPEARANCE = { hair: 0, outfit: 1, color: 2 };
const FURNITURE_DRAWERS = { bookshelf: drawBookshelf, table: drawTable, sofa: drawSofa, chair: drawChair };

// --- Room scene: exactly what the game renders, minus the WebSocket layer ---
const roomCanvas = document.getElementById('room-canvas');
roomCanvas.width = ROOM_WIDTH;
roomCanvas.height = ROOM_HEIGHT;
const roomCtx = roomCanvas.getContext('2d');

drawSeamRect(roomCtx, 0, 0, ROOM_WIDTH, ROOM_HEIGHT, WALL_COLOR, wallSeamColor, WALL_TILE_W, WALL_TILE_H);
drawRoomBorder(roomCtx, ROOM_WIDTH, ROOM_HEIGHT, ROOM_BORDER_THICKNESS);

for (const win of WINDOWS) drawWindow(roomCtx, win.x, win.w, WALL_THICKNESS_TOP);
drawDoor(roomCtx, DOOR.x, DOOR.w, ROOM_HEIGHT - WALL_THICKNESS_SIDE, WALL_THICKNESS_SIDE);

const { minX, minY, maxX, maxY } = ROOM_BOUNDS;
const floorX = minX - BASEBOARD_THICKNESS;
const floorY = minY - BASEBOARD_THICKNESS;
const floorW = maxX - minX + BASEBOARD_THICKNESS * 2;
const floorH = maxY - minY + BASEBOARD_THICKNESS * 2;
roomCtx.fillStyle = BASEBOARD_COLOR;
roomCtx.fillRect(floorX, floorY, floorW, floorH);
drawSeamRect(roomCtx, minX, minY, maxX - minX, maxY - minY, FLOOR_COLOR, floorSeamColor, FLOOR_TILE_SIZE, FLOOR_TILE_SIZE);

for (const item of FURNITURE) {
  FURNITURE_DRAWERS[item.type](roomCtx, item.x, item.y, item.w, item.h, FURNITURE_FILL, item.backSide);
}

drawCharacter(roomCtx, SAMPLE_APPEARANCE, DEFAULT_SPAWN.x, DEFAULT_SPAWN.y, CHAR_PIXEL_SIZE, { facing: 'down', frame: 0 });

// --- Character sheet: all 8 compass directions x 2 walk frames, same scale,
// laid out on one sheet so directional consistency is easy to eyeball at once ---
const CHAR_SCALE = 6;
const COMPASS = [
  { label: 'N', facing: 'up', flip: false },
  { label: 'NE', facing: 'diagUp', flip: false },
  { label: 'E', facing: 'side', flip: false },
  { label: 'SE', facing: 'diagDown', flip: false },
  { label: 'S', facing: 'down', flip: false },
  { label: 'SW', facing: 'diagDown', flip: true },
  { label: 'W', facing: 'side', flip: true },
  { label: 'NW', facing: 'diagUp', flip: true },
];
const LABEL_HEIGHT = 20;
const cellW = GRID_W * CHAR_SCALE + 16;
const cellH = GRID_H * CHAR_SCALE + 16 + LABEL_HEIGHT;

const charSheetCanvas = document.getElementById('char-sheet-canvas');
charSheetCanvas.width = cellW * COMPASS.length;
charSheetCanvas.height = cellH * 2;
const charSheetCtx = charSheetCanvas.getContext('2d');
charSheetCtx.fillStyle = '#3a3a3a';
charSheetCtx.fillRect(0, 0, charSheetCanvas.width, charSheetCanvas.height);
charSheetCtx.font = '14px sans-serif';
charSheetCtx.fillStyle = '#eee';
charSheetCtx.textAlign = 'center';

[0, 1].forEach((frame) => {
  COMPASS.forEach(({ label, facing, flip }, i) => {
    const cellX = i * cellW;
    const cellY = frame * cellH;
    charSheetCtx.fillStyle = '#eee';
    charSheetCtx.fillText(`${label} f${frame}`, cellX + cellW / 2, cellY + 14);
    drawCharacter(charSheetCtx, SAMPLE_APPEARANCE, cellX + 8, cellY + LABEL_HEIGHT, CHAR_SCALE, { facing, frame, flip });
  });
});

// --- Furniture closeups, uniformly scaled via ctx.scale so internal detail stays proportional ---
const FURN_SCALE = 4;
const furnitureCanvas = document.getElementById('furniture-canvas');
const furnitureItems = [
  { type: 'bookshelf', w: 24, h: 80 },
  { type: 'table', w: 100, h: 50 },
  { type: 'table', w: 60, h: 35 },
  { type: 'sofa', w: 160, h: 50, backSide: 'bottom' },
  { type: 'sofa', w: 50, h: 150, backSide: 'right' },
  { type: 'chair', w: 20, h: 20, backSide: 'top' },
  { type: 'chair', w: 20, h: 20, backSide: 'bottom' },
];
const gap = 20;
furnitureCanvas.width = furnitureItems.reduce((sum, f) => sum + f.w * FURN_SCALE + gap, gap);
furnitureCanvas.height = Math.max(...furnitureItems.map((f) => f.h)) * FURN_SCALE + gap * 2;
const furnitureCtx = furnitureCanvas.getContext('2d');
furnitureCtx.fillStyle = '#3a3a3a';
furnitureCtx.fillRect(0, 0, furnitureCanvas.width, furnitureCanvas.height);

let fx = gap;
for (const { type, w, h, backSide } of furnitureItems) {
  furnitureCtx.save();
  furnitureCtx.scale(FURN_SCALE, FURN_SCALE);
  FURNITURE_DRAWERS[type](furnitureCtx, fx / FURN_SCALE, gap / FURN_SCALE, w, h, FURNITURE_FILL, backSide);
  furnitureCtx.restore();
  fx += w * FURN_SCALE + gap;
}

window.__debugPreviewReady = true;
