export const ROOM_WIDTH = 640;
export const ROOM_HEIGHT = 480;

export const CHAR_PIXEL_SIZE = 2;

export const WALL_THICKNESS_TOP = 32;
export const WALL_THICKNESS_SIDE = 14;

export const ROOM_BOUNDS = {
  minX: WALL_THICKNESS_SIDE,
  minY: WALL_THICKNESS_TOP,
  maxX: ROOM_WIDTH - WALL_THICKNESS_SIDE,
  maxY: ROOM_HEIGHT - WALL_THICKNESS_SIDE,
};

export const FURNITURE = [
  // Library zone (left wall)
  { type: 'bookshelf', x: 20, y: 40, w: 24, h: 80 },
  { type: 'bookshelf', x: 20, y: 130, w: 24, h: 80 },
  { type: 'bookshelf', x: 20, y: 220, w: 24, h: 80 },
  // Dining zone (top-right)
  { type: 'table', x: 460, y: 90, w: 100, h: 50 },
  { type: 'chair', x: 470, y: 65, w: 20, h: 20, backSide: 'top' },
  { type: 'chair', x: 530, y: 65, w: 20, h: 20, backSide: 'top' },
  { type: 'chair', x: 470, y: 165, w: 20, h: 20, backSide: 'bottom' },
  { type: 'chair', x: 530, y: 165, w: 20, h: 20, backSide: 'bottom' },
  // Lounge zone (bottom-right), arranged in an L: one sofa along the bottom,
  // one along the right wall, meeting at a corner with a coffee table in front.
  // Shifted right of the door (x:280-340) so the horizontal sofa doesn't block it.
  { type: 'sofa', x: 416, y: 400, w: 160, h: 50, backSide: 'bottom' },
  { type: 'sofa', x: 576, y: 250, w: 50, h: 150, backSide: 'right' },
  { type: 'table', x: 460, y: 320, w: 60, h: 45 },
];

export const WINDOWS = [
  { x: 120, w: 80 },
  { x: 440, w: 80 },
];

export const DOOR = { x: 280, w: 60 };

export const DEFAULT_SPAWN = { x: 300, y: 250 };

export const MAX_PLAYERS = 5;
