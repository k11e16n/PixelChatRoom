export const GRID_W = 14;
export const GRID_H = 20;

const SKIN_COLOR = '#f2c9a0';
const EYE_COLOR = '#2b1d14';

function grid(rows) {
  return rows.map((row) => row.split(''));
}

function shade(hex, factor) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.floor(((num >> 16) & 0xff) * factor);
  const g = Math.floor(((num >> 8) & 0xff) * factor);
  const b = Math.floor((num & 0xff) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// Head + neck (8 rows), one per facing. Torso/legs (12 rows) are shared
// across all facings and only vary by walk frame — see TORSO_LEGS below.
const HEAD_DOWN = [
  '..............',
  '....111111....',
  '...11111111...',
  '..1121111211..',
  '..1111111111..',
  '...11111111...',
  '....111111....',
  '.....1111.....',
];

const HEAD_UP = [
  '..............',
  '....111111....',
  '...11111111...',
  '..1111111111..',
  '..1111111111..',
  '...11111111...',
  '....111111....',
  '.....1111.....',
];

const HEAD_SIDE = [
  '..............',
  '.....1111.....',
  '....111111....',
  '....111112....',
  '....111111....',
  '....111111....',
  '.....1111.....',
  '.....1111.....',
];

const TORSO_LEGS_FRAME0 = [
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...111..111...',
  '...111..111...',
  '...111..111...',
  '...111........',
  '...111........',
];

const TORSO_LEGS_FRAME1 = [
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...11111111...',
  '...111..111...',
  '...111..111...',
  '...111..111...',
  '........111...',
  '........111...',
];

function bodyFrame(head, torsoLegs) {
  return grid([...head, ...torsoLegs]);
}

const BODY_FRAMES = {
  down: [bodyFrame(HEAD_DOWN, TORSO_LEGS_FRAME0), bodyFrame(HEAD_DOWN, TORSO_LEGS_FRAME1)],
  up: [bodyFrame(HEAD_UP, TORSO_LEGS_FRAME0), bodyFrame(HEAD_UP, TORSO_LEGS_FRAME1)],
  side: [bodyFrame(HEAD_SIDE, TORSO_LEGS_FRAME0), bodyFrame(HEAD_SIDE, TORSO_LEGS_FRAME1)],
};

const EMPTY_ROW = '..............';

function hairGrid(rows) {
  const padded = [...rows];
  while (padded.length < GRID_H) padded.push(EMPTY_ROW);
  return grid(padded);
}

const MOHAWK_SHAPE = hairGrid([
  '.....1111.....',
  '.....1111.....',
]);

export const HAIR_STYLES = [
  {
    color: '#5a3825',
    down: hairGrid([
      '....111111....',
      '...11111111...',
      '..1........1..',
    ]),
    up: hairGrid([
      '....111111....',
      '...11111111...',
      '..1111111111..',
      '..1111111111..',
      '...11111111...',
      '....111111....',
    ]),
    side: hairGrid([
      '.....1111.....',
      '....111111....',
    ]),
  },
  {
    color: '#1a1a1a',
    down: hairGrid([
      '....111111....',
      '...11111111...',
      '..1........1..',
      '..1........1..',
      '..1........1..',
      '..1........1..',
    ]),
    up: hairGrid([
      '....111111....',
      '...11111111...',
      '..1111111111..',
      '..1111111111..',
      '...11111111...',
      '....111111....',
      '.....1111.....',
    ]),
    side: hairGrid([
      '.....1111.....',
      '....111111....',
      '....1.........',
      '....1.........',
      '....1.........',
      '....1.........',
    ]),
  },
  {
    color: '#d9b45c',
    down: MOHAWK_SHAPE,
    up: MOHAWK_SHAPE,
    side: MOHAWK_SHAPE,
  },
];

function outfitGrid(rows) {
  const padded = ['..............', '..............', '..............', '..............', '..............', '..............', '..............', '..............', ...rows];
  while (padded.length < GRID_H) padded.push(EMPTY_ROW);
  return grid(padded);
}

export const OUTFIT_STYLES = [
  outfitGrid([
    '...11111111...',
    '...11111111...',
    '...11111111...',
    '...11111111...',
    '...11111111...',
    '...11111111...',
    '...11111111...',
  ]),
  outfitGrid([
    '...11111111...',
    '...11111111...',
    '...11111111...',
    '..1111111111..',
    '..1111111111..',
    '.111111111111.',
    '.111111111111.',
  ]),
  outfitGrid([
    '....111111....',
    '....111111....',
    '....111111....',
  ]),
];

export const COLOR_PALETTE = [
  '#e63946',
  '#2a9d8f',
  '#457b9d',
  '#f4a261',
  '#8338ec',
  '#ffffff',
];

function drawGrid(ctx, cells, baseColor, originX, originY, pixelSize) {
  const shadowColor = shade(baseColor, 0.7);
  const width = cells[0].length;
  const bottomRow = new Array(width).fill(-1);

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < width; col++) {
      if (cells[row][col] === '1') bottomRow[col] = row;
    }
  }

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row][col];
      if (cell === '2') {
        ctx.fillStyle = EYE_COLOR;
      } else if (cell === '1') {
        ctx.fillStyle = row === bottomRow[col] ? shadowColor : baseColor;
      } else {
        continue;
      }
      ctx.fillRect(originX + col * pixelSize, originY + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

export function drawCharacter(ctx, appearance, originX, originY, pixelSize, { facing = 'down', frame = 0, flip = false } = {}) {
  const bodyCells = (BODY_FRAMES[facing] ?? BODY_FRAMES.down)[frame % 2];
  const hairStyle = HAIR_STYLES[appearance.hair] ?? HAIR_STYLES[0];
  const hairCells = hairStyle[facing] ?? hairStyle.down;
  const outfitCells = OUTFIT_STYLES[appearance.outfit] ?? OUTFIT_STYLES[0];
  const outfitColor = COLOR_PALETTE[appearance.color] ?? COLOR_PALETTE[0];
  const charWidthPx = GRID_W * pixelSize;

  ctx.save();
  if (flip) {
    ctx.translate(originX + charWidthPx, originY);
    ctx.scale(-1, 1);
    drawGrid(ctx, bodyCells, SKIN_COLOR, 0, 0, pixelSize);
    drawGrid(ctx, hairCells, hairStyle.color, 0, 0, pixelSize);
    drawGrid(ctx, outfitCells, outfitColor, 0, 0, pixelSize);
  } else {
    drawGrid(ctx, bodyCells, SKIN_COLOR, originX, originY, pixelSize);
    drawGrid(ctx, hairCells, hairStyle.color, originX, originY, pixelSize);
    drawGrid(ctx, outfitCells, outfitColor, originX, originY, pixelSize);
  }
  ctx.restore();
}
