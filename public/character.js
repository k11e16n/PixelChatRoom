export const GRID_W = 24;
export const GRID_H = 32;

const SKIN_COLOR = '#f2c9a0';
const EYE_COLOR = '#2b1d14';
const OUTLINE_COLOR = '#161616';
const EMPTY_ROW = '........................';

function grid(rows) {
  return rows.map((row) => row.split(''));
}

// Returns a hex string (not rgb(...)) so the result can safely be fed back
// into shade() again — e.g. drawSofa lightens the base color once for the
// backrest, then drawShadedRect shades it again internally for highlight/shadow.
export function shade(hex, factor) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.floor(((num >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.floor((num & 0xff) * factor));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 8-direction movement → {facing, flip}. Only 3 poses are hand-authored
// (down, up, side); side-facing-left and all 4 diagonals are derived by
// mirroring / reusing the side pose so every direction stays visually
// consistent with the same underlying character.
export function getFacing(dx, dy) {
  if (dx === 0 && dy === 0) return null;
  if (dx === 0) return dy > 0 ? { facing: 'down', flip: false } : { facing: 'up', flip: false };
  if (dy === 0) return { facing: 'side', flip: dx < 0 };
  if (dy < 0) return { facing: 'diagUp', flip: dx < 0 };
  return { facing: 'diagDown', flip: dx < 0 };
}

// Head + neck (12 rows), one per facing. Torso/legs/arms (20 rows) are
// shared across all facings and only vary by walk frame — see below.
const HEAD_DOWN = [
  '........11111111........',
  '......111111111111......',
  '....1111111111111111....',
  '...111111111111111111...',
  '..11111111111111111111..',
  '..11111121111112111111..',
  '..11111111111111111111..',
  '...111111111111111111...',
  '....1111111111111111....',
  '......111111111111......',
  '........11111111........',
  '.........111111.........',
];

const HEAD_UP = [
  '........11111111........',
  '......111111111111......',
  '....1111111111111111....',
  '...111111111111111111...',
  '..11111111111111111111..',
  '..11111111111111111111..',
  '..11111111111111111111..',
  '...111111111111111111...',
  '....1111111111111111....',
  '......111111111111......',
  '........11111111........',
  '.........111111.........',
];

// Same round silhouette as HEAD_DOWN/HEAD_UP (head proportions must match
// across every facing) — only the eye row changes, to a single eye near the
// facing edge instead of two centered eyes.
const HEAD_SIDE = HEAD_DOWN.map((row, i) => (i === 5 ? '..' + '1'.repeat(17) + '2' + '11' + '..' : row));

// NE (facing away + right): no eye, since we're mostly seeing the back of the head.
const HEAD_DIAG_UP = HEAD_SIDE.map((row, i) => (i === 5 ? row.replace('2', '1') : row));

// SE (facing viewer + right): eye nudged two columns toward the front for a
// slightly more 3/4 angle instead of a pure profile. Derived from the eye's
// actual index rather than a hardcoded position, so it stays correct if
// HEAD_SIDE's eye placement ever changes.
const HEAD_DIAG_DOWN = HEAD_SIDE.map((row, i) => {
  if (i !== 5) return row;
  const eyeIndex = row.indexOf('2');
  const newIndex = eyeIndex - 2;
  return row.slice(0, newIndex) + '2' + row.slice(newIndex + 1, eyeIndex) + '1' + row.slice(eyeIndex + 1);
});

const TORSO_LEGS_FRAME0 = [
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111.............',
  '.....111111.............',
  '.....111111.............',
];

const TORSO_LEGS_FRAME1 = [
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....11111111111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.....111111..111111.....',
  '.............111111.....',
  '.............111111.....',
  '.............111111.....',
];

// Arms are authored as their own overlay (absolute rows 13-19) and merged
// onto the torso/legs silhouette in bodyFrame(), so front/back/side can each
// swing their arms independently without duplicating the torso+legs data.
function armsGrid(rows) {
  const padded = [];
  for (let i = 0; i < 13; i++) padded.push(EMPTY_ROW);
  padded.push(...rows);
  while (padded.length < GRID_H) padded.push(EMPTY_ROW);
  return padded;
}

// Both arms hang straight at the sides; frame0 has the right arm swung
// inward (elbow bent toward center), frame1 mirrors it to the left arm.
const ARMS_DOWN_FRAME0 = armsGrid([
  '.1111..............1111.',
  '.1111..............1111.',
  '.1111..............1111.',
  '.1111........1111.......',
  '.1111........1111.......',
  '.1111........1111.......',
  '.1111........1111.......',
]);

const ARMS_DOWN_FRAME1 = armsGrid([
  '.1111..............1111.',
  '.1111..............1111.',
  '.1111..............1111.',
  '.......1111........1111.',
  '.......1111........1111.',
  '.......1111........1111.',
  '.......1111........1111.',
]);

// Only the near arm is visible in profile; it swings between a forward
// position (frame0) and a trailing position behind the body (frame1).
const ARMS_SIDE_FRAME0 = armsGrid([
  '................1111....',
  '................1111....',
  '................1111....',
  '....................1111',
  '....................1111',
  '....................1111',
  '....................1111',
]);

const ARMS_SIDE_FRAME1 = armsGrid([
  '....1111................',
  '....1111................',
  '....1111................',
  '1111....................',
  '1111....................',
  '1111....................',
  '1111....................',
]);

function bodyFrame(head, torsoLegs, arms) {
  const combined = grid([...head, ...torsoLegs]);
  for (let r = 0; r < combined.length; r++) {
    for (let c = 0; c < combined[r].length; c++) {
      if (arms[r]?.[c] === '1') combined[r][c] = '1';
    }
  }
  return combined;
}

const BODY_FRAMES = {
  down: [
    bodyFrame(HEAD_DOWN, TORSO_LEGS_FRAME0, ARMS_DOWN_FRAME0),
    bodyFrame(HEAD_DOWN, TORSO_LEGS_FRAME1, ARMS_DOWN_FRAME1),
  ],
  up: [
    bodyFrame(HEAD_UP, TORSO_LEGS_FRAME0, ARMS_DOWN_FRAME0),
    bodyFrame(HEAD_UP, TORSO_LEGS_FRAME1, ARMS_DOWN_FRAME1),
  ],
  side: [
    bodyFrame(HEAD_SIDE, TORSO_LEGS_FRAME0, ARMS_SIDE_FRAME0),
    bodyFrame(HEAD_SIDE, TORSO_LEGS_FRAME1, ARMS_SIDE_FRAME1),
  ],
  diagUp: [
    bodyFrame(HEAD_DIAG_UP, TORSO_LEGS_FRAME0, ARMS_SIDE_FRAME0),
    bodyFrame(HEAD_DIAG_UP, TORSO_LEGS_FRAME1, ARMS_SIDE_FRAME1),
  ],
  diagDown: [
    bodyFrame(HEAD_DIAG_DOWN, TORSO_LEGS_FRAME0, ARMS_SIDE_FRAME0),
    bodyFrame(HEAD_DIAG_DOWN, TORSO_LEGS_FRAME1, ARMS_SIDE_FRAME1),
  ],
};

const HEAD_ROW_COUNT = 12;

function hairGrid(rows) {
  const padded = [...rows];
  while (padded.length < GRID_H) padded.push(EMPTY_ROW);
  return grid(padded);
}

function outfitGrid(rows) {
  const padded = [];
  for (let i = 0; i < HEAD_ROW_COUNT; i++) padded.push(EMPTY_ROW);
  padded.push(...rows);
  while (padded.length < GRID_H) padded.push(EMPTY_ROW);
  return grid(padded);
}

const MOHAWK_SHAPE = hairGrid([
  '..........1111..........',
  '..........1111..........',
]);

function withDiagAliases(style) {
  return { ...style, diagUp: style.side, diagDown: style.side };
}

export const HAIR_STYLES = [
  withDiagAliases({
    color: '#5a3825',
    down: hairGrid([
      '........11111111........',
      '......111111111111......',
      '....1111111111111111....',
      '....1..............1....',
    ]),
    up: hairGrid([
      '........11111111........',
      '......111111111111......',
      '....1111111111111111....',
      '...111111111111111111...',
      '..11111111111111111111..',
      '..11111111111111111111..',
      '..11111111111111111111..',
      '...111111111111111111...',
      '....1111111111111111....',
      '......111111111111......',
      '........11111111........',
    ]),
    side: hairGrid([
      '........11111111........',
      '......111111111111......',
      '....1111111111111111....',
    ]),
  }),
  withDiagAliases({
    color: '#1a1a1a',
    down: hairGrid([
      '........11111111........',
      '......111111111111......',
      '....1111111111111111....',
      '....1..............1....',
      '....1..............1....',
      '....1..............1....',
      '....1..............1....',
      '....1..............1....',
    ]),
    up: hairGrid([
      '........11111111........',
      '......111111111111......',
      '....1111111111111111....',
      '...111111111111111111...',
      '..11111111111111111111..',
      '..11111111111111111111..',
      '..11111111111111111111..',
      '...111111111111111111...',
      '....1111111111111111....',
      '......111111111111......',
      '........11111111........',
      '.........111111.........',
      '.........111111.........',
    ]),
    side: hairGrid([
      '........11111111........',
      '......111111111111......',
      '....1111111111111111....',
      '....11..................',
      '....11..................',
      '....11..................',
      '....11..................',
    ]),
  }),
  withDiagAliases({
    color: '#d9b45c',
    down: MOHAWK_SHAPE,
    up: MOHAWK_SHAPE,
    side: MOHAWK_SHAPE,
  }),
];

export const OUTFIT_STYLES = [
  outfitGrid([
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
  ]),
  outfitGrid([
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '.....11111111111111.....',
    '....1111111111111111....',
    '....1111111111111111....',
    '...111111111111111111...',
    '...111111111111111111...',
  ]),
  outfitGrid([
    '.......1111111111.......',
    '.......1111111111.......',
    '.......1111111111.......',
    '.......1111111111.......',
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

function isFilled(cells, row, col) {
  if (row < 0 || row >= cells.length) return false;
  const line = cells[row];
  if (col < 0 || col >= line.length) return false;
  const c = line[col];
  return c === '1' || c === '2';
}

function drawGrid(ctx, cells, baseColor, originX, originY, pixelSize) {
  const highlight = shade(baseColor, 1.25);
  const shadow = shade(baseColor, 0.7);
  const height = cells.length;
  const width = cells[0].length;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (isFilled(cells, row, col)) continue;
      const hasFilledNeighbor =
        isFilled(cells, row - 1, col) ||
        isFilled(cells, row + 1, col) ||
        isFilled(cells, row, col - 1) ||
        isFilled(cells, row, col + 1);
      if (hasFilledNeighbor) {
        ctx.fillStyle = OUTLINE_COLOR;
        ctx.fillRect(originX + col * pixelSize, originY + row * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row][col];
      if (cell === '2') {
        ctx.fillStyle = EYE_COLOR;
      } else if (cell === '1') {
        const bottomEmpty = !isFilled(cells, row + 1, col);
        const rightEmpty = !isFilled(cells, row, col + 1);
        const topEmpty = !isFilled(cells, row - 1, col);
        const leftEmpty = !isFilled(cells, row, col - 1);
        if (bottomEmpty || rightEmpty) {
          ctx.fillStyle = shadow;
        } else if (topEmpty || leftEmpty) {
          ctx.fillStyle = highlight;
        } else {
          ctx.fillStyle = baseColor;
        }
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
