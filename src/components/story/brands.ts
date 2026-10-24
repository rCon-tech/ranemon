import type { Brand, Logo } from '@/lib/story/world';
import { TILE } from './pixels';

/**
 * The big tech companies' own looks in Silicon Docks, drawn over the map in world pixels: each
 * HQ's glass tinted in its colours with its logo up on the front, and inside, the room washed in
 * its colour with its logo laid into the floor. The logos are simple shapes, drawn in code.
 */

type Ctx = CanvasRenderingContext2D;

function rect(c: Ctx, x: number, y: number, w: number, h: number, colour: string) {
  c.fillStyle = colour;
  c.fillRect(x, y, w, h);
}

/** A logo centred on (x, y), about `s` world pixels across, on a background of `bg`. */
export function paintLogo(c: Ctx, logo: Logo, x: number, y: number, s: number, bg: string) {
  const h = s / 2;
  c.save();
  c.lineCap = 'butt';
  switch (logo) {
    case 'google': {
      // A ring in four colours, open on the right with a bar across: a G.
      c.lineWidth = s / 5;
      const r = h - s / 10;
      const arcs: [number, number, string][] = [
        [-0.25, 0.25, '#4285f4'],
        [0.25, 0.75, '#34a853'],
        [0.75, 1.1, '#fbbc05'],
        [1.1, 1.75, '#ea4335'],
      ];
      for (const [a, b, colour] of arcs) {
        c.strokeStyle = colour;
        c.beginPath();
        c.arc(x, y, r, a * Math.PI, b * Math.PI);
        c.stroke();
      }
      rect(c, x, y - s / 10, h, s / 5, '#4285f4');
      break;
    }
    case 'meta': {
      // An infinity loop in Meta blue.
      c.lineWidth = s / 6;
      c.strokeStyle = '#ffffff';
      for (const dx of [-s / 4, s / 4]) {
        c.beginPath();
        c.ellipse(x + dx, y, s / 4, s / 5, 0, 0, Math.PI * 2);
        c.stroke();
      }
      break;
    }
    case 'microsoft': {
      // Four squares: red, green, blue and yellow.
      const q = s / 2 - 1;
      rect(c, x - h, y - h, q, q, '#f25022');
      rect(c, x + 1, y - h, q, q, '#7fba00');
      rect(c, x - h, y + 1, q, q, '#00a4ef');
      rect(c, x + 1, y + 1, q, q, '#ffb900');
      break;
    }
    case 'apple': {
      // An apple with a bite out of the right and a leaf on top.
      c.fillStyle = '#9aa2ae';
      c.beginPath();
      c.arc(x - s / 7, y + s / 12, s / 3, 0, Math.PI * 2);
      c.arc(x + s / 7, y + s / 12, s / 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = bg;
      c.beginPath();
      c.arc(x + h, y, s / 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#9aa2ae';
      c.beginPath();
      c.ellipse(x + s / 12, y - s / 2.6, s / 10, s / 6, 0.6, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'amazon': {
      // The orange smile, with an arrowhead at its end.
      c.lineWidth = s / 7;
      c.strokeStyle = '#ff9900';
      c.beginPath();
      c.arc(x, y - h, s * 0.75, 0.25 * Math.PI, 0.75 * Math.PI);
      c.stroke();
      c.fillStyle = '#ff9900';
      c.beginPath();
      c.moveTo(x + s / 2.2, y);
      c.lineTo(x + s / 2.2 + s / 5, y - s / 5);
      c.lineTo(x + s / 2.2 + s / 8, y + s / 8);
      c.fill();
      break;
    }
    case 'tiktok': {
      // A note, three times: cyan and pink shadows behind a white one.
      const note = (dx: number, dy: number, colour: string) => {
        rect(c, x + dx, y - h + dy, s / 6, s * 0.8, colour);
        c.fillStyle = colour;
        c.beginPath();
        c.arc(x + dx - s / 7, y + s / 4 + dy, s / 5, 0, Math.PI * 2);
        c.fill();
        rect(c, x + dx, y - h + dy, s / 3, s / 6, colour);
      };
      note(-1, -1, '#25f4ee');
      note(1, 1, '#fe2c55');
      note(0, 0, '#ffffff');
      break;
    }
    case 'x': {
      // A big white X.
      c.lineWidth = s / 6;
      c.strokeStyle = '#ffffff';
      c.beginPath();
      c.moveTo(x - h, y - h);
      c.lineTo(x + h, y + h);
      c.moveTo(x + h, y - h);
      c.lineTo(x - h, y + h);
      c.stroke();
      break;
    }
    case 'stripe': {
      // A white S on a purple tile.
      rect(c, x - h, y - h, s, s, '#635bff');
      c.fillStyle = '#ffffff';
      c.font = `700 ${Math.round(s * 0.9)}px "Pixelify Sans", sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('S', x, y + 1);
      break;
    }
  }
  c.restore();
}

/**
 * An HQ's glass block, from tile (x0, y0) to (x1, y1) inclusive, in world pixels offset by
 * (ox, oy): tinted in the brand's colour, with its own trim, and its logo up on the front.
 */
export function paintFacade(
  c: Ctx,
  brand: Brand,
  ox: number,
  oy: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const left = ox + x0 * TILE;
  const top = oy + y0 * TILE;
  const w = (x1 - x0 + 1) * TILE;
  const h = (y1 - y0 + 1) * TILE;
  c.save();
  c.globalAlpha = brand.tint;
  rect(c, left, top, w, h, brand.facade);
  c.restore();
  // A band of the brand's colours along the top of the building.
  const band = brand.band ?? [brand.colour];
  const step = w / band.length;
  band.forEach((colour, i) => rect(c, left + i * step, top, Math.ceil(step), 3, colour));
  rect(c, left, top + 3, w, 0.5, 'rgb(0 0 0 / 0.35)');
  // The logo on a panel in the middle of the front, above the sign.
  const lx = left + w / 2;
  const ly = top + TILE - 2;
  rect(c, lx - 9, ly - 8, 18, 16, 'rgb(0 0 0 / 0.25)');
  rect(c, lx - 8.5, ly - 7.5, 17, 15, brand.panel);
  paintLogo(c, brand.logo, lx, ly, 11, brand.panel);
}

/**
 * Inside an HQ: the room washed in the brand's colour, and its logo laid into the floor in the
 * middle of the room, at tile (cx, cy), offset by (ox, oy).
 */
export function paintRoom(
  c: Ctx,
  brand: Brand,
  ox: number,
  oy: number,
  cols: number,
  rows: number,
  cx: number,
  cy: number,
) {
  c.save();
  c.globalAlpha = 0.14;
  rect(c, ox, oy, cols * TILE, rows * TILE, brand.colour);
  c.restore();
  const x = ox + cx * TILE;
  const y = oy + cy * TILE;
  rect(c, x - 22, y - 18, 44, 36, 'rgb(0 0 0 / 0.25)');
  rect(c, x - 21, y - 17, 42, 34, brand.panel);
  const band = brand.band ?? [brand.colour];
  const step = 42 / band.length;
  band.forEach((colour, i) => rect(c, x - 21 + i * step, y + 14, Math.ceil(step), 3, colour));
  paintLogo(c, brand.logo, x, y - 1, 22, brand.panel);
}
