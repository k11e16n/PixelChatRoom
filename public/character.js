export const GRID_W = 12;
export const GRID_H = 16;

const SKIN_COLOR = '#f2c9a0';

function grid(rows) {
  return rows.map((row) => row.split(''));
}

export const BODY = grid([
  '............',
  '...XXXXXX...',
  '..XXXXXXXX..',
  '..XXXXXXXX..',
  '..XXXXXXXX..',
  '...XXXXXX...',
  '....XXXX....',
  '...XXXXXX...',
  '..XXXXXXXX..',
  '..XXXXXXXX..',
  '..XXXXXXXX..',
  '..XXXXXXXX..',
  '..XXXXXXXX..',
  '...XX..XX...',
  '...XX..XX...',
  '...XX..XX...',
]);

export const HAIR_STYLES = [
  {
    color: '#5a3825',
    rows: grid([
      '...XXXXXX...',
      '..XXXXXXXX..',
      '..X......X..',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
    ]),
  },
  {
    color: '#1a1a1a',
    rows: grid([
      '...XXXXXX...',
      '..XXXXXXXX..',
      '..X......X..',
      '..X......X..',
      '..X......X..',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
    ]),
  },
  {
    color: '#d9b45c',
    rows: grid([
      '....XXXX....',
      '....XXXX....',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
    ]),
  },
];

export const OUTFIT_STYLES = [
  grid([
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '...XX..XX...',
    '...XX..XX...',
    '...XX..XX...',
  ]),
  grid([
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
  ]),
  grid([
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '....XXXX....',
    '...XXXXXX...',
    '...XXXXXX...',
    '...XXXXXX...',
    '...XXXXXX...',
    '...XX..XX...',
    '....XX.XX...',
    '............',
    '............',
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

function drawGrid(ctx, cells, color, originX, originY, pixelSize) {
  ctx.fillStyle = color;
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      if (cells[row][col] === 'X') {
        ctx.fillRect(originX + col * pixelSize, originY + row * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

export function drawCharacter(ctx, appearance, originX, originY, pixelSize) {
  const hairStyle = HAIR_STYLES[appearance.hair] ?? HAIR_STYLES[0];
  const outfitCells = OUTFIT_STYLES[appearance.outfit] ?? OUTFIT_STYLES[0];
  const outfitColor = COLOR_PALETTE[appearance.color] ?? COLOR_PALETTE[0];

  drawGrid(ctx, BODY, SKIN_COLOR, originX, originY, pixelSize);
  drawGrid(ctx, hairStyle.rows, hairStyle.color, originX, originY, pixelSize);
  drawGrid(ctx, outfitCells, outfitColor, originX, originY, pixelSize);
}
