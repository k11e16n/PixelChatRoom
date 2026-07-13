export const ROOM_WIDTH = 400;
export const ROOM_HEIGHT = 300;

export const CHAR_PIXEL_SIZE = 2;

export const WALL_THICKNESS_TOP = 24;
export const WALL_THICKNESS_SIDE = 10;

export const ROOM_BOUNDS = {
  minX: WALL_THICKNESS_SIDE,
  minY: WALL_THICKNESS_TOP,
  maxX: ROOM_WIDTH - WALL_THICKNESS_SIDE,
  maxY: ROOM_HEIGHT - WALL_THICKNESS_SIDE,
};

export const FURNITURE = [
  { type: 'bookshelf', x: 10, y: 28, w: 24, h: 90 },
  { type: 'table', x: 173, y: 110, w: 54, h: 32 },
  { type: 'sofa', x: 330, y: 210, w: 50, h: 60 },
];

export const DEFAULT_SPAWN = { x: 200, y: 200 };

export const MAX_PLAYERS = 5;
