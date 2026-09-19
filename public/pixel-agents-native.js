/*
 * Pixel Agents asset-backed Canvas renderer.
 * Adapted from Pixel Agents upstream, MIT licensed.
 * Upstream commit: 3537e140c2094761beae748592aeb92ece8edfdd
 */
const TILE = 32;
const ROOT = '/pixel-assets/';
const names = ['floor_0.png', 'floor_1.png', 'wall_0.png', 'DESK_FRONT.png', 'PC_FRONT_ON_1.png', 'PC_FRONT_OFF.png', 'PLANT.png', 'LARGE_PLANT.png'];
const images = new Map(names.map((name) => [name, load(name)]));
const chars = Array.from({ length: 6 }, (_, i) => load('characters/char_' + i + '.png'));

function load(name) {
  const image = new Image();
  image.src = ROOT + name;
  return image;
}

function tile(ctx, image, x, y, w = TILE, h = TILE) {
  if (image.complete && image.naturalWidth) ctx.drawImage(image, x, y, w, h);
}

function text(ctx, value, x, y, color = '#f5efe7', size = 7) {
  ctx.fillStyle = color;
  ctx.font = size + 'px ui-monospace, monospace';
  ctx.fillText(value, x, y);
}

export function createPixelAgentsRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return {
    render({ characters, roster, now }) {
      const cols = 25, rows = 17;
      ctx.fillStyle = '#18151b';
      ctx.fillRect(0, 0, cols * TILE, rows * TILE);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        tile(ctx, images.get((x + y) % 3 === 0 ? 'floor_1.png' : 'floor_0.png'), x * TILE, y * TILE);
      }
      for (let x = 0; x < cols; x++) tile(ctx, images.get('wall_0.png'), x * TILE, 0, TILE, TILE * 2);
      const furniture = [
        [3, 3, 'DESK_FRONT.png'], [5, 3, 'PC_FRONT_ON_1.png'], [3, 8, 'DESK_FRONT.png'], [5, 8, 'PC_FRONT_OFF.png'],
        [3, 13, 'DESK_FRONT.png'], [5, 13, 'PC_FRONT_ON_1.png'], [18, 8, 'DESK_FRONT.png'], [20, 8, 'PC_FRONT_OFF.png'],
        [18, 13, 'DESK_FRONT.png'], [20, 13, 'PC_FRONT_ON_1.png'], [11, 2, 'PLANT.png'], [15, 4, 'LARGE_PLANT.png'],
        [9, 8, 'LARGE_PLANT.png'], [16, 11, 'PLANT.png'], [22, 5, 'PLANT.png'],
      ];
      for (const [x, y, name] of furniture) tile(ctx, images.get(name), x * TILE, y * TILE, TILE * 2, TILE * 2);
      text(ctx, 'FOUNDER', 2 * TILE + 5, 2 * TILE, '#d7b9ff');
      text(ctx, 'RESEARCH', 2 * TILE + 5, 7 * TILE, '#d7b9ff');
      text(ctx, 'MARKETING', 2 * TILE + 5, 12 * TILE, '#d7b9ff');
      text(ctx, 'ADMIN', 17 * TILE + 5, 7 * TILE, '#b9d7ff');
      text(ctx, 'FINANCE', 17 * TILE + 5, 12 * TILE, '#f1d1a4');
      text(ctx, 'CAFE', 10 * TILE + 5, 2 * TILE, '#f1d1a4');
      text(ctx, 'ATRIUM', 11 * TILE, 10 * TILE, '#d7b9ff');
      for (const ch of [...characters.values()].sort((a, b) => a.y - b.y)) {
        const index = Number(roster[ch.id]?.palette || 0) % chars.length;
        const image = chars[index];
        if (!(image.complete && image.naturalWidth)) continue;
        const row = ch.mode === 'walk' ? 2 : ch.mode === 'talk' ? 1 : 0;
        const frame = Math.floor(ch.frame * (ch.mode === 'walk' ? 8 : 4)) % 7;
        ctx.drawImage(image, frame * 16, row * 32, 16, 32, ch.x - 16, ch.y - 52, 32, 64);
        text(ctx, roster[ch.id]?.label || ch.id, ch.x - 24, ch.y - 30, '#fff', 6);
        if (ch.bubbleUntil > now()) {
          ctx.fillStyle = '#fffaf2'; ctx.fillRect(ch.x + 9, ch.y - 54, 78, 22);
          text(ctx, ch.bubbleText, ch.x + 12, ch.y - 42, '#33283b', 6);
        }
      }
    },
  };
}
