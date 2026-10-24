import { BEAT_MS } from './partyfx';
import { TILE } from './pixels';

/**
 * The overworld's tiles, drawn in code at twice the world's resolution, in the style of the
 * later 2D games: shaded, textured, joined up with their neighbours (paths fray into the
 * grass, water foams at the shore, roofs get a ridge and eaves), and animated (water, tall
 * grass and flowers). Each tile is drawn once per look and kept.
 */

/** Device pixels per world pixel. */
export const RES = 2;
const T = TILE * RES;

/** The tiles next to one: north, east, south and west. */
export interface Around {
  n: string;
  e: string;
  s: string;
  w: string;
}

/** Things that stand up off the ground, drawn in depth order with people. */
export const TALL = new Set(['T', 'K', 'p', 'y']);
/** Tall grass: its front blades are drawn again over whoever stands in it. */
export const TALL_GRASS = ',';

const GRASSY = new Set(['.', ',', '"', 'T', 'S', 'f', ':', 'b', 'h', 'p']);
const DOORS: Record<string, [string, string, string]> = {
  // Base, light, dark: the pub's green, the shop's blue, the gym's red, and plain wood.
  P: ['#2f8a4a', '#4cb46a', '#1c5a30'],
  M: ['#3a70c8', '#5c94e4', '#244a8a'],
  G: ['#d03838', '#f05c50', '#8a2020'],
  H: ['#9a6a38', '#c08850', '#6a4422'],
  L: ['#9a6a38', '#c08850', '#6a4422'],
};

/** How many frames each animated tile has, and how long each lasts. */
export function frameOf(tile: string, now: number): number {
  if (tile === 'J') return Math.floor(now / 160) % 4;
  if (tile === '~' || tile === 'B' || tile === 'b' || tile === 'y')
    return Math.floor(now / 220) % 4;
  if (tile === ',' || tile === '"') return Math.floor(now / 600) % 2;
  // The dance floor changes colour on the beat, in time with the dancers.
  if (tile === 'l') return Math.floor(now / BEAT_MS) % 4;
  return 0;
}

// ---------- helpers ----------

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A small number from a position, so neighbouring tiles of the same kind differ. */
export function variantAt(x: number, y: number): number {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

type Ctx = CanvasRenderingContext2D;

function canvas(w = T, h = T): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function px(c: Ctx, x: number, y: number, w: number, h: number, colour: string) {
  c.fillStyle = colour;
  c.fillRect(x, y, w, h);
}

function ellipse(c: Ctx, cx: number, cy: number, rx: number, ry: number, colour: string) {
  c.fillStyle = colour;
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

/** A filled disc with hard pixel edges. */
function disc(c: Ctx, cx: number, cy: number, r: number, colour: string) {
  c.fillStyle = colour;
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y));
    c.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// ---------- ground ----------

function grass(c: Ctx, r: () => number) {
  px(c, 0, 0, T, T, '#7cc858');
  for (let i = 0; i < 26; i++) px(c, (r() * T) | 0, (r() * T) | 0, 2, 1, '#8ad464');
  for (let i = 0; i < 9; i++) {
    const x = (r() * (T - 3)) | 0;
    const y = 3 + ((r() * (T - 6)) | 0);
    px(c, x, y, 1, 3, '#5aa840');
    px(c, x + 2, y + 1, 1, 2, '#5aa840');
    px(c, x + 1, y - 1, 1, 3, '#9ce070');
  }
}

/** One tuft of tall grass, its blades leaning with the wind. */
function tuft(c: Ctx, x: number, y: number, lean: number) {
  const blade = (dx: number, h: number, tilt: number, colour: string) => {
    for (let i = 0; i < h; i++) px(c, x + dx + Math.round((tilt * i) / h), y - i, 1, 1, colour);
  };
  blade(-3, 7, -2 + lean, '#2f7a2e');
  blade(3, 7, 2 + lean, '#2f7a2e');
  blade(0, 9, lean, '#2f7a2e');
  blade(-2, 6, -2 + lean, '#5cb048');
  blade(2, 6, 2 + lean, '#5cb048');
  blade(1, 8, lean, '#8ed868');
}

function tallGrass(c: Ctx, frame: number, front: boolean) {
  if (!front) {
    px(c, 0, 0, T, T, '#4f9e3c');
    for (let y = 2; y < T; y += 10) px(c, 0, y, T, 2, '#468f36');
  }
  if (front) {
    px(c, 0, T - 7, T, 7, '#4f9e3c');
    px(c, 0, T - 7, T, 1, '#5cb048');
  }
  for (let row = 0; row < 3; row++) {
    const y = 10 + row * 10;
    if (front && row < 1) continue;
    const cols = front ? 6 : 4;
    for (let col = 0; col < cols; col++) {
      const x = 3 + col * (T / cols) + (row % 2) * 3;
      tuft(c, x, y, (col + row + frame) % 2);
    }
  }
}

function flowers(c: Ctx, r: () => number, frame: number) {
  grass(c, r);
  const colours = ['#f05868', '#f8d848', '#ffffff', '#f890c0'];
  for (let i = 0; i < 5; i++) {
    const x = 4 + ((r() * (T - 8)) | 0) + (i % 2 === frame ? 1 : 0);
    const y = 4 + ((r() * (T - 8)) | 0);
    const colour = colours[(r() * colours.length) | 0];
    px(c, x, y + 3, 1, 3, '#3f8f3a');
    px(c, x - 1, y, 1, 1, colour);
    px(c, x + 1, y, 1, 1, colour);
    px(c, x, y - 1, 1, 1, colour);
    px(c, x, y + 1, 1, 1, colour);
    px(c, x, y, 1, 1, '#f8b030');
  }
}

/** The city's ground: pavement and the roads through it. */
const CITY = new Set(['v', 'a']);
/** What a road runs on into: more road, a bridge, or a car parked on it. */
const ROADISH = new Set(['a', 'B', 'c']);

/**
 * A city pavement (`v`): pale granite slabs, staggered row to row, with a kerb where it meets
 * the road.
 */
function pavement(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#c8c4bc');
  for (let row = 0; row < 2; row++) {
    const y = row * 16;
    px(c, 0, y, T, 1, '#a8a49c');
    px(c, row ? 0 : 16, y, 1, 16, '#a8a49c');
    px(c, 0, y + 1, T, 1, '#d8d4cc');
  }
  for (let i = 0; i < 18; i++)
    px(c, (r() * T) | 0, (r() * T) | 0, 1, 1, r() < 0.5 ? '#b8b4ac' : '#d4d0c8');
  if (r() < 0.12) ellipse(c, 6 + ((r() * 20) | 0), 6 + ((r() * 20) | 0), 2, 1, '#9a968e');
  // A kerb of darker granite along any side that meets the road.
  if (ROADISH.has(around.n)) px(c, 0, 0, T, 3, '#8a867e');
  if (ROADISH.has(around.s)) px(c, 0, T - 3, T, 3, '#8a867e');
  if (ROADISH.has(around.w)) px(c, 0, 0, 3, T, '#8a867e');
  if (ROADISH.has(around.e)) px(c, T - 3, 0, 3, T, '#8a867e');
}

/** A city road (`a`): tarmac, with a dashed white line down the middle of a straight. */
function road(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#4c4e56');
  for (let i = 0; i < 26; i++)
    px(c, (r() * T) | 0, (r() * T) | 0, 1, 1, r() < 0.5 ? '#3e4048' : '#5c5e66');
  const across = ROADISH.has(around.w) || ROADISH.has(around.e);
  const along = ROADISH.has(around.n) || ROADISH.has(around.s);
  if (across && !along) for (const x of [2, 18]) px(c, x, 15, 10, 2, '#e8e8e0');
  else if (along && !across) for (const y of [2, 18]) px(c, 15, y, 2, 10, '#e8e8e0');
}

function path(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#e2cc94');
  for (let i = 0; i < 30; i++)
    px(c, (r() * T) | 0, (r() * T) | 0, 1 + ((r() * 2) | 0), 1, r() < 0.5 ? '#d2b67c' : '#f0deb0');
  for (let i = 0; i < 3; i++) {
    const x = 3 + ((r() * (T - 6)) | 0);
    const y = 3 + ((r() * (T - 6)) | 0);
    px(c, x, y, 3, 2, '#c4a874');
    px(c, x, y, 2, 1, '#f4e4c0');
  }
  // Where the path meets the grass, the grass grows a little way in.
  const fringe = (side: keyof Around) => {
    if (!GRASSY.has(around[side])) return;
    for (let i = 0; i < T; i++) {
      const depth = 2 + ((r() * 3) | 0);
      const [x, y, w, h] =
        side === 'n'
          ? [i, 0, 1, depth]
          : side === 's'
            ? [i, T - depth, 1, depth]
            : side === 'w'
              ? [0, i, depth, 1]
              : [T - depth, i, depth, 1];
      px(c, x, y, w, h, '#7cc858');
      const [ex, ey] =
        side === 'n'
          ? [i, depth]
          : side === 's'
            ? [i, T - depth - 1]
            : side === 'w'
              ? [depth, i]
              : [T - depth - 1, i];
      px(c, ex, ey, 1, 1, '#c4a470');
    }
  };
  (['n', 'e', 's', 'w'] as const).forEach(fringe);
}

function bog(c: Ctx, r: () => number, frame: number) {
  px(c, 0, 0, T, T, '#6a5434');
  for (let i = 0; i < 40; i++)
    px(c, (r() * T) | 0, (r() * T) | 0, 2, 1, r() < 0.5 ? '#5a4628' : '#7a6440');
  const pools = 1 + ((r() * 2) | 0);
  for (let i = 0; i < pools; i++) {
    const x = 8 + ((r() * 16) | 0);
    const y = 8 + ((r() * 16) | 0);
    ellipse(c, x, y, 7, 4, '#2e3a2c');
    ellipse(c, x, y - 1, 6, 3, '#3c4a3a');
    px(c, x - 3 + frame, y - 2, 3, 1, '#7c9078');
  }
  for (let i = 0; i < 5; i++) {
    const x = 2 + ((r() * (T - 4)) | 0);
    const y = 8 + ((r() * (T - 10)) | 0);
    const h = 5 + ((r() * 3) | 0);
    px(c, x, y - h, 1, h, '#8aa040');
    px(c, x, y - h - 2, 1, 2, '#c0a060');
  }
}

function limestone(c: Ctx, r: () => number) {
  px(c, 0, 0, T, T, '#7c7c86');
  const off = (r() * 12) | 0;
  for (let row = 0; row < 2; row++) {
    for (let col = -1; col < 2; col++) {
      const x = col * 16 + (row ? off : 0) + 1;
      const y = row * 16 + 1;
      px(c, x, y, 14, 14, '#c8c8cc');
      px(c, x, y, 14, 1, '#e4e4e8');
      px(c, x, y, 1, 14, '#e4e4e8');
      px(c, x, y + 13, 14, 1, '#a8a8b0');
      px(c, x + 13, y, 1, 14, '#a8a8b0');
      if (r() < 0.5) px(c, x + 3 + ((r() * 8) | 0), y + 4 + ((r() * 6) | 0), 3, 1, '#b4b4bc');
    }
  }
  for (let i = 0; i < 4; i++) px(c, (r() * T) | 0, ((r() * 2) | 0) * 16 + 15, 2, 2, '#6cb850');
}

/** Golden sand, rippled by the wind, with shells and the odd pebble. */
function sand(c: Ctx, r: () => number) {
  px(c, 0, 0, T, T, '#f0dca0');
  for (let y = 3; y < T; y += 7) {
    for (let x = 0; x < T; x++) {
      const dy = Math.round(Math.sin(((x + y * 3) / 16) * Math.PI) * 1.2);
      px(c, x, y + dy, 1, 1, '#e0c684');
    }
  }
  for (let i = 0; i < 24; i++)
    px(c, (r() * T) | 0, (r() * T) | 0, 1, 1, r() < 0.5 ? '#f8ecc4' : '#d4b878');
  if (r() < 0.5) {
    const x = 4 + ((r() * 22) | 0);
    const y = 4 + ((r() * 22) | 0);
    px(c, x, y, 3, 2, '#f8f0f0');
    px(c, x + 1, y, 1, 2, '#e8b8b0');
  }
}

/** Black or white, and the 3D look picks the same one for the same tile. */
export const CAR_COLOURS = [
  ['#1c1c22', '#4a4a56', '#0c0c10'],
  ['#e8e8ec', '#ffffff', '#a8acb4'],
] as const;
export const carColour = (variant: number) => (variant % 4) % 2;

/**
 * A parked car, seen from above and a little in front like everything else: a big black
 * jeep with tinted glass and silver wheels. Greystones has a lot of them.
 */
function car(c: Ctx, r: () => number, around: Around, variant: number) {
  if (Object.values(around).some((t) => CITY.has(t))) road(c, r, around);
  else path(c, r, around);
  const [body, light, dark] = CAR_COLOURS[carColour(variant)];
  ellipse(c, 16, 29, 14, 3, 'rgb(0 0 0 / 0.25)');
  for (const x of [5, 23]) {
    px(c, x, 24, 4, 6, '#141418');
    px(c, x + 1, 26, 2, 2, '#c8ccd4');
  }
  px(c, 3, 10, 26, 16, body);
  px(c, 3, 10, 26, 1, light);
  px(c, 3, 24, 26, 2, dark);
  px(c, 6, 4, 20, 8, body);
  px(c, 7, 5, 18, 6, '#2a3440');
  px(c, 8, 5, 6, 2, '#5a6a80');
  px(c, 3, 15, 26, 1, dark);
  px(c, 4, 18, 4, 2, '#f8f0c0');
  px(c, 24, 18, 4, 2, '#f8f0c0');
  px(c, 12, 20, 8, 3, '#d8dce4');
}

function water(c: Ctx, frame: number, around: Around) {
  const g = c.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, '#3a80d8');
  g.addColorStop(1, '#4a94e8');
  c.fillStyle = g;
  c.fillRect(0, 0, T, T);
  for (let row = 0; row < 4; row++) {
    const y0 = 4 + row * 8;
    for (let x = 0; x < T; x++) {
      const phase = (x + frame * 8 + row * 11) % 16;
      if (phase > 6) continue;
      const y = y0 + Math.round(Math.sin(((x + frame * 4) / 32) * Math.PI * 2) * 1.5);
      px(c, x, y, 1, 1, phase < 2 ? '#a8dcff' : '#6cb0f4');
    }
  }
  if (frame === 1) px(c, 20, 9, 1, 1, '#ffffff');
  if (frame === 3) px(c, 8, 23, 1, 1, '#ffffff');
  // Foam where the water meets anything else.
  const shore = (side: keyof Around) => {
    if (around[side] === '~' || around[side] === 'B') return;
    for (let i = 0; i < T; i++) {
      const wobble = (i + frame * 3) % 8 < 4 ? 1 : 0;
      const [x, y, w, h] =
        side === 'n'
          ? [i, 0, 1, 2 + wobble]
          : side === 's'
            ? [i, T - 2 - wobble, 1, 2 + wobble]
            : side === 'w'
              ? [0, i, 2 + wobble, 1]
              : [T - 2 - wobble, i, 2 + wobble, 1];
      px(c, x, y, w, h, '#e4f6ff');
      const [sx, sy, sw, sh] =
        side === 'n'
          ? [i, 3 + wobble, 1, 2]
          : side === 's'
            ? [i, T - 5 - wobble, 1, 2]
            : side === 'w'
              ? [3 + wobble, i, 2, 1]
              : [T - 5 - wobble, i, 2, 1];
      px(c, sx, sy, sw, sh, '#78bcf8');
    }
  };
  (['n', 'e', 's', 'w'] as const).forEach(shore);
}

function bridge(c: Ctx, frame: number, around: Around) {
  water(c, frame, { n: '~', e: '~', s: '~', w: '~' });
  // Rails run along the way across: water to the sides means a north–south bridge.
  const upDown = around.w === '~' || around.e === '~';
  for (let i = 0; i < T; i += 6) {
    if (upDown) {
      px(c, 2, i, T - 4, 5, '#c08850');
      px(c, 2, i, T - 4, 1, '#dcaa70');
      px(c, 2, i + 5, T - 4, 1, '#6a4422');
    } else {
      px(c, i, 2, 5, T - 4, '#c08850');
      px(c, i, 2, 1, T - 4, '#dcaa70');
      px(c, i + 5, 2, 1, T - 4, '#6a4422');
    }
  }
  if (upDown) {
    px(c, 0, 0, 3, T, '#7a5028');
    px(c, T - 3, 0, 3, T, '#7a5028');
    px(c, 0, 0, 1, T, '#a07040');
  } else {
    px(c, 0, 0, T, 3, '#7a5028');
    px(c, 0, T - 3, T, 3, '#7a5028');
    px(c, 0, 0, T, 1, '#a07040');
  }
}

function floor(c: Ctx, r: () => number) {
  for (let row = 0; row < 4; row++) {
    const y = row * 8;
    px(c, 0, y, T, 8, row % 2 ? '#cf9a5e' : '#d8a468');
    px(c, 0, y, T, 1, '#e8bc84');
    px(c, 0, y + 7, T, 1, '#a0703c');
    const seam = (row * 13 + ((r() * 8) | 0)) % T;
    px(c, seam, y, 1, 8, '#a0703c');
    for (let i = 0; i < 3; i++) px(c, (r() * T) | 0, y + 2 + ((r() * 4) | 0), 4, 1, '#c08850');
  }
}

// ---------- buildings ----------

function plaster(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#f2e8d6');
  for (let i = 0; i < 24; i++) px(c, (r() * T) | 0, (r() * T) | 0, 1, 1, '#e6d8c0');
  if (around.n === '^') {
    const g = c.createLinearGradient(0, 0, 0, 7);
    g.addColorStop(0, 'rgb(40 20 10 / 0.35)');
    g.addColorStop(1, 'rgb(40 20 10 / 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, T, 7);
  }
  if (around.s !== '#' && !(around.s in DOORS)) {
    // A stone plinth along the bottom of the wall.
    px(c, 0, T - 6, T, 6, '#a89c88');
    for (let x = (r() * 6) | 0; x < T; x += 7) px(c, x, T - 6, 1, 6, '#857a68');
    px(c, 0, T - 6, T, 1, '#d4c8b0');
    px(c, 0, T - 1, T, 1, '#5a4e40');
  }
  // Dressed stone at the corners, alternating long and short.
  const quoins = (x: number) => {
    for (let y = 0; y < T - 6; y += 8) {
      const w = (y / 8) % 2 ? 4 : 7;
      px(c, x === 0 ? 0 : T - w, y, w, 7, '#d8ccb4');
      px(c, x === 0 ? 0 : T - w, y + 6, w, 1, '#9a8e78');
    }
  };
  if (around.w !== '#' && !(around.w in DOORS)) quoins(0);
  if (around.e !== '#' && !(around.e in DOORS)) quoins(T);
}

function wall(c: Ctx, r: () => number, around: Around) {
  plaster(c, r, around);
  // A sash window with a sill and a shine on the glass.
  px(c, 8, 7, 16, 14, '#5a4a3a');
  const g = c.createLinearGradient(0, 8, 0, 20);
  g.addColorStop(0, '#9cd4f8');
  g.addColorStop(1, '#4a90d8');
  c.fillStyle = g;
  c.fillRect(9, 8, 14, 12);
  px(c, 15, 8, 2, 12, '#f8f8f8');
  px(c, 9, 13, 14, 2, '#f8f8f8');
  for (let i = 0; i < 4; i++) px(c, 10 + i, 12 - i, 1, 1, '#e8f6ff');
  px(c, 19, 17, 3, 1, '#e8f6ff');
  // Shutters each side, and a window box of flowers.
  px(c, 4, 7, 3, 14, '#2f7a4a');
  px(c, 25, 7, 3, 14, '#2f7a4a');
  for (let y = 9; y < 20; y += 3) {
    px(c, 4, y, 3, 1, '#1f5a34');
    px(c, 25, y, 3, 1, '#1f5a34');
  }
  px(c, 7, 21, 18, 4, '#8a5a30');
  px(c, 7, 21, 18, 1, '#a87040');
  const blooms = ['#e84050', '#f8d048', '#f070b0', '#ffffff'];
  for (let x = 8; x < 24; x += 3) {
    px(c, x, 19, 2, 2, blooms[(x + ((r() * 4) | 0)) % 4]);
    px(c, x + 1, 21, 1, 1, '#3a8a36');
  }
}

/**
 * The glass of an office block in Silicon Docks: panes in a steel grid, a floor line every half
 * tile, the sky caught in them as a diagonal shine, a parapet along the top and a frame down
 * each end.
 */
function glass(c: Ctx, around: Around) {
  const g = c.createLinearGradient(0, 0, T, T);
  g.addColorStop(0, '#7ab8e0');
  g.addColorStop(1, '#3a6a98');
  c.fillStyle = g;
  c.fillRect(0, 0, T, T);
  // The sky in the glass: a broad shine running down to the right, unbroken across the block.
  c.fillStyle = 'rgb(232 246 255 / 0.35)';
  for (let y = 0; y < T; y++) c.fillRect((y + 4) % T, y, 6, 1);
  c.fillStyle = 'rgb(232 246 255 / 0.15)';
  for (let y = 0; y < T; y++) c.fillRect((y + 13) % T, y, 3, 1);
  // Mullions and the dark band of each floor.
  for (let x = 0; x < T; x += 8) px(c, x, 0, 1, T, '#c8d4dc');
  for (let y = 0; y < T; y += 16) {
    px(c, 0, y + 13, T, 3, '#2a4058');
    px(c, 0, y + 13, T, 1, '#5a7a98');
  }
  if (around.n !== 'z') {
    px(c, 0, 0, T, 4, '#d8dce0');
    px(c, 0, 4, T, 1, '#6a7480');
  }
  if (around.w !== 'z' && around.w !== 'L') px(c, 0, 0, 2, T, '#5a6470');
  if (around.e !== 'z' && around.e !== 'L') px(c, T - 2, 0, 2, T, '#3a4450');
  if (around.s !== 'z' && around.s !== 'L') px(c, 0, T - 2, T, 2, '#8a8a90');
}

/** A glass door in a glass front: two sliding panes in a steel frame, with a mat. */
function glassDoor(c: Ctx, around: Around) {
  glass(c, { ...around, w: 'z', e: 'z', s: 'z' });
  px(c, 5, 8, 22, 24, '#3a4450');
  px(c, 6, 9, 20, 23, '#b8e4f8');
  px(c, 6, 9, 20, 1, '#e8f6ff');
  px(c, 15, 9, 2, 23, '#3a4450');
  for (let i = 0; i < 6; i++) px(c, 8 + i, 20 - i, 1, 1, '#f4fbff');
  px(c, 12, 18, 2, 4, '#6a7480');
  px(c, 18, 18, 2, 4, '#6a7480');
  px(c, 5, T - 2, 22, 2, '#4a4a52');
}

function door(c: Ctx, r: () => number, around: Around, kind: string) {
  // A door set into a castle or a rock face has stone round it, not plaster.
  if ([around.w, around.e].some((t) => t === 'q' || t === 'R')) castleWall(c, () => 0.9, around);
  else plaster(c, r, around);
  const [base, light, dark] = DOORS[kind];
  px(c, 7, 8, 18, 24, '#3a2a1a');
  px(c, 8, 9, 16, 23, base);
  px(c, 8, 9, 16, 1, light);
  px(c, 8, 9, 1, 23, light);
  px(c, 11, 12, 10, 6, '#bfe4ff');
  px(c, 11, 12, 10, 1, '#e8f6ff');
  px(c, 11, 21, 4, 8, dark);
  px(c, 17, 21, 4, 8, dark);
  px(c, 21, 20, 2, 2, '#f8d048');
  px(c, 5, T - 2, 22, 2, '#8a7a68');
  if (kind === 'M') {
    // The shop's striped awning.
    for (let x = 4; x < 28; x += 4) px(c, x, 3, 4, 5, (x / 4) % 2 ? '#ffffff' : '#3a70c8');
    px(c, 4, 8, 24, 1, '#244a8a');
  }
  if (kind === 'G') {
    px(c, 12, 2, 8, 5, '#f8c830');
    px(c, 12, 2, 8, 1, '#fff0a0');
    px(c, 15, 3, 2, 3, '#a87810');
  }
  if (kind === 'P') {
    // A lantern by the pub door.
    px(c, 3, 10, 3, 5, '#3a2a1a');
    px(c, 4, 11, 1, 3, '#f8d860');
  }
}

function roof(c: Ctx, around: Around, colour: [string, string, string, string]) {
  const [base, light, dark, deep] = colour;
  px(c, 0, 0, T, T, base);
  // Rows of shingles, staggered, each lit along its top and shaded at its bottom edge.
  for (let y = 0; y < T; y += 6) {
    const off = (y / 6) % 2 ? 4 : 0;
    for (let x = off - 8; x < T; x += 8) {
      px(c, x + 1, y + 1, 7, 1, light);
      px(c, x + 1, y + 5, 7, 1, dark);
      px(c, x, y, 1, 6, deep);
    }
  }
  if (around.n !== '^') {
    // The ridge: a rounded cap.
    px(c, 0, 0, T, 5, light);
    px(c, 0, 1, T, 1, '#ffffff40');
    px(c, 0, 0, T, 1, deep);
    px(c, 0, 5, T, 1, deep);
    for (let x = 3; x < T; x += 8) px(c, x, 1, 1, 4, dark);
  }
  if (around.s !== '^') {
    // Eaves: a fascia board and the dark overhang.
    px(c, 0, T - 6, T, 3, deep);
    px(c, 0, T - 3, T, 2, '#f0e8d8');
    px(c, 0, T - 1, T, 1, '#6a5a48');
  }
  if (around.w !== '^') {
    px(c, 0, 0, 3, T, deep);
    px(c, 1, 0, 1, T, light);
  }
  if (around.e !== '^') {
    px(c, T - 3, 0, 3, T, deep);
    px(c, T - 2, 0, 1, T, dark);
  }
  if (around.n !== '^' && around.e !== '^') {
    // A chimney at the right-hand end of the ridge.
    px(c, 18, 0, 9, 13, '#5a3a2a');
    px(c, 19, 2, 7, 10, '#a85a3a');
    for (let y = 4; y < 12; y += 3) px(c, 19, y, 7, 1, '#7a3a24');
    px(c, 17, 0, 11, 3, '#8a8478');
    px(c, 17, 0, 11, 1, '#b8b0a4');
  }
}

// ---------- things on the grass ----------

function sign(c: Ctx, r: () => number, around: Around) {
  if (CITY.has(around.s) || CITY.has(around.n)) pavement(c, r, around);
  else grass(c, r);
  ellipse(c, 16, 29, 9, 2, 'rgb(0 0 0 / 0.2)');
  px(c, 14, 16, 4, 13, '#7a5028');
  px(c, 16, 16, 2, 13, '#5a3818');
  px(c, 4, 5, 24, 13, '#5a3a1a');
  px(c, 5, 6, 22, 11, '#c89858');
  px(c, 5, 6, 22, 1, '#e8c080');
  px(c, 8, 9, 16, 1, '#7a5028');
  px(c, 8, 12, 12, 1, '#7a5028');
}

/** A white picket fence, joined up with the fence next to it. */
function fence(c: Ctx, r: () => number) {
  grass(c, r);
  px(c, 0, 25, T, 3, 'rgb(20 50 20 / 0.22)');
  for (const y of [11, 19]) {
    px(c, 0, y, T, 3, '#e8eef4');
    px(c, 0, y + 2, T, 1, '#9aa8b8');
  }
  for (let x = 1; x < T; x += 6) {
    px(c, x, 7, 4, 18, '#f8fafc');
    px(c, x + 3, 7, 1, 18, '#b8c4d0');
    px(c, x + 1, 5, 2, 2, '#f8fafc');
    px(c, x + 1, 4, 1, 1, '#dce4ec');
    px(c, x, 24, 4, 1, '#8a98a8');
  }
}

/** A clipped hedge of leafy squares, like the gardens in the 5th generation's towns. */
function hedge(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#24521f');
  for (let y = 0; y < T; y += 8) {
    for (let x = 0; x < T; x += 8) {
      px(c, x + 1, y + 1, 7, 7, '#3f8a34');
      px(c, x + 1, y + 1, 6, 2, '#6cb84a');
      px(c, x + 1, y + 1, 2, 6, '#58a840');
      if (r() < 0.5) px(c, x + 3, y + 3, 2, 1, '#9ce070');
    }
  }
  if (around.n !== 'h') px(c, 0, 0, T, 2, '#8ad464');
  if (around.s !== 'h') {
    px(c, 0, T - 4, T, 4, '#1c4019');
    px(c, 0, T - 1, T, 1, 'rgb(0 0 0 / 0.3)');
  }
}

/** An earth bank between two levels of ground: a grass lip and a streaked dirt face. */
function ledge(c: Ctx, r: () => number, around: Around) {
  grass(c, r);
  const open = (side: string) => side !== 'e' && side !== 's';
  for (let x = 0; x < T; x++) {
    // The lip wobbles, and each end slopes down into the grass.
    const left = open(around.w) ? Math.max(0, 8 - x) : 0;
    const right = open(around.e) ? Math.max(0, x - (T - 9)) : 0;
    const top = 8 + ((x * 7) % 3) + left + right;
    const g = c.createLinearGradient(0, top, 0, T);
    g.addColorStop(0, '#c8925a');
    g.addColorStop(1, '#8a5a32');
    c.fillStyle = g;
    c.fillRect(x, top, 1, T - 3 - top);
    px(c, x, top, 1, 2, '#7a4e28');
    px(c, x, top - 2, 1, 2, '#9ce070');
    if ((x * 13) % 5 === 0) px(c, x, top + 4 + ((x * 3) % 7), 1, 5, '#a06a3a');
    px(c, x, T - 3, 1, 3, '#5a3a1e');
  }
  for (let i = 0; i < 5; i++) px(c, 3 + ((r() * 26) | 0), 14 + ((r() * 10) | 0), 2, 1, '#dcae78');
}

/** Stone steps up a bank, with a rail on each side where the bank meets them. */
function stairs(c: Ctx, around: Around) {
  px(c, 0, 0, T, T, '#a8a094');
  for (let y = 0; y < T; y += 6) {
    px(c, 4, y, T - 8, 4, '#dcd4c8');
    px(c, 4, y, T - 8, 1, '#f0e8dc');
    px(c, 4, y + 4, T - 8, 2, '#8a8478');
  }
  for (const [x, side] of [
    [0, around.w],
    [T - 4, around.e],
  ] as const) {
    px(c, x, 0, 4, T, side === 'e' ? '#d88a80' : '#b8b0a4');
    px(c, x, 0, 1, T, side === 'e' ? '#f0b0a4' : '#d0c8bc');
    px(c, x + 3, 0, 1, T, side === 'e' ? '#a05a50' : '#8a8478');
  }
  if (around.n === '.' || around.n === ',') px(c, 0, 0, T, 2, '#7cc858');
}

function stoneWall(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#5a5a62');
  const greys = ['#a8a8b0', '#9c9ca6', '#b4b4bc', '#8e8e98'];
  for (let y = 0; y < T; y += 8) {
    let x = -((r() * 6) | 0);
    while (x < T) {
      const w = 6 + ((r() * 7) | 0);
      px(c, x + 1, y + 1, w - 1, 6, greys[(r() * greys.length) | 0]);
      px(c, x + 1, y + 1, w - 1, 1, '#d0d0d8');
      px(c, x + 1, y + 6, w - 1, 1, '#6c6c76');
      x += w;
    }
  }
  if (around.n !== 'w') {
    for (let i = 0; i < 6; i++) px(c, (r() * T) | 0, 0, 3, 2, '#6cb050');
  }
}

/**
 * Grey rock, on whatever ground is round it: the sea, sand, the Burren's limestone or grass. A
 * rock on its own is a boulder; rocks side by side join into one outcrop, so a block of them
 * makes a crag or a mountain. Cliff edges, dolmens and stone circles are made of them.
 */
function rock(c: Ctx, r: () => number, around: Around, frame: number) {
  const sides = [around.n, around.e, around.s, around.w];
  const count = (t: string) => sides.filter((s) => s === t).length;
  if (count('~') >= 2) water(c, frame, { n: '~', e: '~', s: '~', w: '~' });
  else if (count('d')) sand(c, r);
  else if (count(':')) limestone(c, r);
  else grass(c, r);
  const joined = (side: keyof Around) => around[side] === 'R';
  // Inset from each side that isn't more rock.
  const l = joined('w') ? 0 : 2 + ((r() * 3) | 0);
  const rt = joined('e') ? T : T - 2 - ((r() * 3) | 0);
  const top = joined('n') ? 0 : 6 + ((r() * 4) | 0);
  const bottom = joined('s') ? T : T - 3;
  if (!joined('s')) ellipse(c, T / 2, T - 3, (rt - l) / 2 + 1, 3, 'rgb(20 30 20 / 0.35)');
  const round = (n: boolean, side: boolean) => (n || side ? 0 : 3);
  // The body, with its corners knocked off where it ends.
  px(
    c,
    l + round(joined('n'), joined('w')),
    top,
    rt - l - round(joined('n'), joined('w')) - round(joined('n'), joined('e')),
    bottom - top,
    '#6e6e78',
  );
  px(c, l, top + 3, rt - l, bottom - top - 6 + (joined('s') ? 3 : 0), '#6e6e78');
  px(c, l + 1, top + 1, rt - l - 2, bottom - top - 4, '#8e8e98');
  // Lit faces and dark cracks, scattered.
  for (let i = 0; i < 3; i++) {
    const x = l + 2 + ((r() * Math.max(1, rt - l - 12)) | 0);
    const y = top + 2 + ((r() * Math.max(1, bottom - top - 10)) | 0);
    px(c, x, y, 8, 3, '#b4b4be');
    px(c, x, y + 3, 8, 1, '#5e5e68');
    px(c, x + 5 + ((r() * 3) | 0), y + 4, 1, 4, '#5a5a64');
  }
  if (!joined('n')) px(c, l + 3, top + 1, rt - l - 6, 2, '#c8c8d0');
  if (!joined('s')) px(c, l + 1, bottom - 3, rt - l - 2, 2, '#4e4e58');
  if (r() < 0.5) px(c, l + 4 + ((r() * Math.max(1, rt - l - 10)) | 0), top + 6, 3, 2, '#a8b468');
}

/** Rough castle stone, as on a keep or a tower, with an arrow slit in some blocks. */
function castleWall(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#6a665e');
  const greys = ['#9a958a', '#8c877c', '#a6a196', '#827d72'];
  for (let y = 0; y < T; y += 8) {
    let x = (y / 8) % 2 ? -6 : 0;
    while (x < T) {
      const w = 10 + ((r() * 5) | 0);
      px(c, x + 1, y + 1, w - 1, 6, greys[(r() * greys.length) | 0]);
      px(c, x + 1, y + 1, w - 1, 1, '#bcb6aa');
      x += w;
    }
  }
  if (r() < 0.5) {
    px(c, 14, 8, 4, 14, '#2a2622');
    px(c, 15, 9, 2, 12, '#141210');
  }
  if (around.n === 'u') px(c, 0, 0, T, 3, 'rgb(20 16 10 / 0.35)');
  if (around.s !== 'q') {
    px(c, 0, T - 3, T, 3, '#4e4a44');
    px(c, 0, T - 4, T, 1, '#8a857a');
  }
}

/** The top of a castle wall, seen from above: flagstones, with battlements along the edges. */
function battlements(c: Ctx, r: () => number, around: Around) {
  px(c, 0, 0, T, T, '#7a756c');
  for (let y = 0; y < T; y += 8)
    for (let x = (y / 8) % 2 ? -4 : 0; x < T; x += 8) {
      px(c, x + 1, y + 1, 7, 7, r() < 0.5 ? '#8e897e' : '#86817a');
      px(c, x + 1, y + 1, 7, 1, '#a09a8e');
    }
  const merlons = (side: keyof Around) => {
    if (around[side] === 'u') return;
    for (let i = 0; i < T; i += 8) {
      const [x, y, w, h] =
        side === 'n'
          ? [i, 0, 5, 6]
          : side === 's'
            ? [i, T - 6, 5, 6]
            : side === 'w'
              ? [0, i, 6, 5]
              : [T - 6, i, 6, 5];
      px(c, x, y, w, h, '#b4aea2');
      px(c, x, y + h - 1, w, 1, '#5a564e');
    }
  };
  (['n', 'e', 's', 'w'] as const).forEach(merlons);
}

// ---------- tall things, drawn with people ----------

/** How far a tree's canopy spreads past its tile on each side, and rises above it. */
const TREE_SPREAD = 5;
const TREE_RISE = 14;

/** About two trees in five are pines; one broadleaf in four has turned for autumn. */
export const isPine = (variant: number) => (variant >>> 9) % 5 < 2;
export const isAutumn = (variant: number) => !isPine(variant) && ((variant >>> 5) & 3) === 0;
const PINE_RISE = 22;

const LEAVES = {
  green: ['#173c1c', '#24602a', '#3a8a36', '#5cae46', '#9ce070'],
  autumn: ['#4a1e0c', '#8a3416', '#c4561c', '#e8892c', '#f8c860'],
};

/**
 * A tree in the style of the 5th generation: a big canopy built up in tiers of scalloped leaf
 * clumps, lit from the top left, on a short trunk. It spreads past its tile and rises above it.
 */
function treeTop(r: () => number, autumn: boolean): HTMLCanvasElement {
  const sp = TREE_SPREAD * RES;
  const rise = TREE_RISE * RES;
  const [cv, c] = canvas(T + sp * 2, T + rise);
  const [ink, dark, mid, light, shine] = autumn ? LEAVES.autumn : LEAVES.green;
  const cx = (T + sp * 2) / 2;
  const bottom = rise + T - 10;
  // The trunk, with roots spreading into the grass.
  px(c, cx - 4, bottom - 8, 8, 16, '#5a3818');
  px(c, cx - 4, bottom - 8, 3, 16, '#7a5028');
  px(c, cx - 7, bottom + 6, 14, 2, '#4a2e14');
  // One dark mass for the whole canopy, so the clumps read as a single tree.
  ellipse(c, cx, 28, 23, 24, ink);
  ellipse(c, cx, 27, 22, 23, dark);
  // Tiers from the back (top) to the front (bottom), each a row of clumps.
  const tiers: [number, number, number][] = [
    [8, 2, 9],
    [20, 3, 10],
    [33, 4, 10],
    [44, 3, 9],
  ];
  for (const [ty, n, rad] of tiers) {
    const y = ty + ((r() * 3) | 0) - 1;
    const width = n === 4 ? 40 : n === 3 ? 34 : 20;
    for (let i = 0; i < n; i++) {
      const x = cx - width / 2 + (width / (n - 1 || 1)) * i + ((r() * 3) | 0) - 1;
      disc(c, x, y + 1, rad + 1, ink);
    }
    for (let i = 0; i < n; i++) {
      const x = cx - width / 2 + (width / (n - 1 || 1)) * i;
      disc(c, x, y, rad, dark);
      disc(c, x - 1, y - 2, rad - 2, mid);
      disc(c, x - 3, y - 4, Math.max(2, rad - 6), light);
      for (let k = 0; k < 3; k++)
        px(c, x - rad / 2 + ((r() * rad) | 0), y - rad / 2 + ((r() * rad * 0.6) | 0), 2, 1, shine);
      // A scalloped lower edge: the dark under each clump.
      for (let k = -rad + 3; k < rad - 2; k += 4) px(c, x + k, y + rad - 3, 3, 1, ink);
    }
  }
  return cv;
}

const NEEDLES = ['#123a30', '#1e5a40', '#2c7a4e', '#46a060', '#7cc87a'];

/**
 * A pine like the 5th generation's forests: stacked tiers of drooping, jagged boughs in deep
 * blue-greens, narrowing to a point, on a short trunk. Taller than the broadleaf trees.
 */
function pineTop(r: () => number): HTMLCanvasElement {
  const sp = TREE_SPREAD * RES;
  const rise = PINE_RISE * RES;
  const w = T + sp * 2;
  const [cv, c] = canvas(w, T + rise);
  const [ink, dark, mid, light, shine] = NEEDLES;
  const cx = w / 2;
  const bottom = rise + T - 8;
  px(c, cx - 3, bottom - 8, 6, 12, '#4a2e14');
  px(c, cx - 3, bottom - 8, 2, 12, '#6a4422');
  // Tiers from the top down; each is a triangle of boughs whose edge droops in spikes.
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const top = 2 + i * 11;
    const height = 16;
    const half = 7 + i * 4.2;
    for (let y = 0; y < height; y++) {
      const spread = (half * (y + 1)) / height;
      const jag = y > height - 5 ? (((y * 7 + i * 3) % 4) - 1) * 1.5 : 0;
      const x0 = Math.round(cx - spread - jag);
      const x1 = Math.round(cx + spread + jag);
      px(c, x0 - 1, top + y, x1 - x0 + 2, 1, ink);
      px(c, x0, top + y, x1 - x0, 1, dark);
      // Lit from the left: the left half of each tier is lighter.
      px(c, x0 + 1, top + y, Math.round((x1 - x0) * 0.45), 1, mid);
      if (y > 2) px(c, x0 + 2, top + y, Math.round((x1 - x0) * 0.2), 1, light);
    }
    // Spiky drooping tips along the bottom edge.
    for (let x = Math.round(cx - half); x < cx + half; x += 3) {
      const tip = 2 + ((x + i) % 2);
      px(c, x, top + height, 2, tip, x < cx ? mid : dark);
      px(c, x, top + height + tip, 1, 1, ink);
    }
    for (let k = 0; k < 4 + i; k++)
      px(c, cx - half + ((r() * half) | 0), top + 6 + ((r() * 8) | 0), 2, 1, shine);
  }
  return cv;
}

/** How far a palm's fronds spread past its tile, and how high it stands above it. */
const PALM_SPREAD = 6;
const PALM_RISE = 20;

/**
 * A cabbage palm, as in every good garden on the east coast: a slim, ringed, slightly bent
 * trunk with a burst of spiky fronds on top.
 */
function palmTop(r: () => number): HTMLCanvasElement {
  const sp = PALM_SPREAD * RES;
  const rise = PALM_RISE * RES;
  const w = T + sp * 2;
  const [cv, c] = canvas(w, T + rise);
  const cx = w / 2;
  const bottom = rise + T - 6;
  const lean = r() < 0.5 ? -1 : 1;
  for (let y = 18; y < bottom; y++) {
    const x = cx - 3 + Math.round(lean * ((bottom - y) / (bottom - 18)) ** 2 * 5);
    px(c, x, y, 6, 1, '#8a6a48');
    px(c, x, y, 2, 1, '#a88a62');
    if (y % 4 === 0) px(c, x, y, 6, 1, '#5a4430');
  }
  const top = { x: cx - 3 + lean * 5 + 3, y: 18 };
  const fronds = 11;
  for (let i = 0; i < fronds; i++) {
    const a = Math.PI + (Math.PI * i) / (fronds - 1);
    const len = 15 + ((r() * 5) | 0);
    for (let k = 0; k < len; k++) {
      const droop = (k / len) ** 2 * 6;
      const x = top.x + Math.cos(a) * k;
      const y = top.y + Math.sin(a) * k * 0.7 + droop;
      px(c, x - 1, y - 1, 3, 3, '#1e5a2a');
      px(c, x, y - 1, 1, 2, k % 3 ? '#46a048' : '#7cc860');
    }
  }
  for (const a of [0.3, 1.2, 2.0, 2.8]) {
    for (let k = 0; k < 10; k++) {
      const x = top.x + Math.cos(a) * k;
      const y = top.y + Math.sin(a) * k * 0.6 + (k / 10) ** 2 * 5;
      px(c, x - 1, y - 1, 3, 2, '#2a6e30');
      px(c, x, y - 1, 1, 1, '#5cae46');
    }
  }
  return cv;
}

const YACHT_RISE = 22;

/**
 * A yacht moored in the marina: a white hull with a blue stripe and a teak deck, a tall mast
 * and the mainsail furled along the boom. It stands up out of the water like a tree does.
 */
function yachtTop(): HTMLCanvasElement {
  const rise = YACHT_RISE * RES;
  const [cv, c] = canvas(T, T + rise);
  const o = rise;
  ellipse(c, 16, o + 26, 15, 4, 'rgb(20 40 80 / 0.35)');
  // The hull, pointed at the bow on the left.
  for (let y = 0; y < 10; y++) {
    const inset = Math.round((y / 10) ** 2 * 4);
    px(
      c,
      1 + inset + (y < 4 ? 4 - y : 0),
      o + 15 + y,
      30 - inset * 2 - (y < 4 ? 4 - y : 0),
      1,
      '#f8f8fa',
    );
  }
  px(c, 3, o + 19, 27, 2, '#1f4fa8');
  px(c, 5, o + 24, 22, 1, '#b8c0cc');
  // The teak deck and the cabin.
  px(c, 4, o + 12, 25, 4, '#c08850');
  px(c, 4, o + 12, 25, 1, '#e0a870');
  px(c, 12, o + 8, 12, 5, '#f4f4f6');
  px(c, 13, o + 9, 10, 2, '#2a3440');
  // The mast and the boom with its sail furled.
  px(c, 15, o - rise + 4, 2, rise + 8, '#d8dce4');
  px(c, 16, o - rise + 4, 1, rise + 8, '#9aa0a8');
  px(c, 15, o + 6, 14, 2, '#c8ccd4');
  px(c, 16, o + 3, 12, 3, '#f0f0f4');
  px(c, 16, o + 5, 12, 1, '#c8ccd8');
  // A pennant at the top, and the stays.
  px(c, 17, o - rise + 4, 5, 2, '#d03838');
  for (let k = 0; k < rise; k += 2) {
    px(c, 16 - (k * 12) / rise, o - rise + 6 + k, 1, 1, '#9aa0a8');
    px(c, 16 + (k * 12) / rise, o - rise + 6 + k, 1, 1, '#9aa0a8');
  }
  return cv;
}

/** Trinity's Campanile: a little stone tower with an arch. */
function campanile(): HTMLCanvasElement {
  const [cv, c] = canvas(T, T * 2);
  const o = T;
  px(c, 4, o + 26, 24, 6, '#a8a8b0');
  px(c, 6, o - 6, 4, 32, '#d8d8dc');
  px(c, 22, o - 6, 4, 32, '#d8d8dc');
  px(c, 8, o - 6, 2, 32, '#b8b8c0');
  px(c, 24, o - 6, 2, 32, '#b8b8c0');
  px(c, 4, o - 10, 24, 5, '#e8e8ec');
  px(c, 4, o - 6, 24, 1, '#9c9ca6');
  disc(c, 16, o - 12, 7, '#9cc8b8');
  disc(c, 15, o - 14, 4, '#c0e4d8');
  px(c, 15, o - 24, 2, 6, '#5a5a62');
  px(c, 10, o + 4, 12, 22, 'rgb(40 48 56 / 0.25)');
  disc(c, 16, o + 4, 6, 'rgb(40 48 56 / 0.25)');
  return cv;
}

// ---------- indoors ----------

/** Walls and the dark beyond them, for joining up wall tiles. */
const WALLISH = new Set(['W', 'O', 'J', 'E', 'T', 'Y', 'V', 'A', 'D', 'o']);
/** Walls only, without the shelves standing against them. */
const BACK_WALL = new Set(['W', 'O', 'J', 'T', 'D', 'o']);

/** The floor under a piece of furniture: the gym's boards in a gym, floorboards elsewhere. */
function ground(c: Ctx, r: () => number, around: Around) {
  const near = Object.values(around);
  if (near.includes('g')) gymFloor(c);
  else if (near.includes('k') || near.includes('l')) darkFloor(c, r);
  else floor(c, r);
}

/** A club's floor (`k`): black concrete, scuffed, with the odd dropped glow stick. */
function darkFloor(c: Ctx, r: () => number) {
  px(c, 0, 0, T, T, '#1c1824');
  for (let i = 0; i < 14; i++) px(c, (r() * T) | 0, (r() * T) | 0, 2, 1, '#2a2434');
  if (r() < 0.3)
    px(c, 6 + ((r() * 18) | 0), 8 + ((r() * 16) | 0), 5, 1, r() < 0.5 ? '#f040a0' : '#70f040');
}

/**
 * A club's back wall (`o`): black-painted brick, and a neon tube along it in pink or blue that
 * lights the bricks around it.
 */
function brickWall(c: Ctx, r: () => number, variant: number) {
  px(c, 0, 0, T, T, '#2a2230');
  for (let row = 0; row < 7; row++) {
    const y = row * 4;
    px(c, 0, y + 3, T, 1, '#18141e');
    for (let x = (row % 2) * 4; x < T; x += 8) px(c, x, y, 1, 3, '#18141e');
  }
  const neon = variant % 2 ? '#f040a0' : '#30d0f0';
  px(c, 0, 9, T, 5, `${neon}40`);
  px(c, 0, 10, T, 3, neon);
  px(c, 0, 11, T, 1, '#ffffff');
  px(c, 0, 26, T, 3, '#3a3242');
  px(c, 0, 29, T, 3, '#120e16');
  for (let i = 0; i < 6; i++) px(c, (r() * T) | 0, 16 + ((r() * 8) | 0), 1, 1, '#3a3242');
}

/** The wallpaper face of a back wall: green stripes, a dado rail and a skirting board. */
function wallpaper(c: Ctx, r: () => number) {
  px(c, 0, 0, T, T, '#cfe0c4');
  for (let x = 0; x < T; x += 8) px(c, x + 2, 0, 3, 20, '#bcd2ae');
  for (let i = 0; i < 10; i++) px(c, (r() * T) | 0, (r() * 20) | 0, 1, 1, '#b4c8a6');
  px(c, 0, 18, T, 2, '#8a6a48');
  px(c, 0, 18, T, 1, '#b08a60');
  px(c, 0, 20, T, 7, '#e8dcc4');
  px(c, 0, 26, T, 3, '#8a6a48');
  px(c, 0, 26, T, 1, '#b08a60');
  px(c, 0, 29, T, 3, '#5a4430');
}

/** A wall seen from above: the dark band round the edge of a room. */
function wallTop(c: Ctx, around: Around) {
  px(c, 0, 0, T, T, '#3a3444');
  px(c, 2, 2, T - 4, T - 4, '#4a4458');
  if (!WALLISH.has(around.n)) px(c, 0, 0, T, 3, '#6a6278');
  if (!WALLISH.has(around.e)) px(c, T - 3, 0, 3, T, '#6a6278');
  if (!WALLISH.has(around.w)) px(c, 0, 0, 3, T, '#6a6278');
}

function room(c: Ctx, r: () => number, around: Around) {
  if (!WALLISH.has(around.s)) wallpaper(c, r);
  else wallTop(c, around);
}

function window_(c: Ctx, r: () => number) {
  wallpaper(c, r);
  px(c, 6, 2, 20, 15, '#6a4a2a');
  const g = c.createLinearGradient(0, 3, 0, 16);
  g.addColorStop(0, '#bfe6ff');
  g.addColorStop(1, '#7cc0f0');
  c.fillStyle = g;
  c.fillRect(7, 3, 18, 13);
  px(c, 15, 3, 2, 13, '#6a4a2a');
  // Lace curtains.
  px(c, 7, 3, 4, 13, '#f8f4ec');
  px(c, 21, 3, 4, 13, '#f8f4ec');
  for (let y = 4; y < 16; y += 3) {
    px(c, 10, y, 1, 1, '#d8d0c4');
    px(c, 21, y, 1, 1, '#d8d0c4');
  }
  px(c, 12, 5, 2, 1, '#ffffff');
  px(c, 5, 16, 22, 2, '#e0d4c0');
}

/**
 * A station's departures board (`D`) on the back wall: a black panel in a steel frame with rows
 * of amber dot-matrix text, joined up along its length.
 */
function board(c: Ctx, r: () => number, around: Around) {
  wallpaper(c, r);
  const left = around.w !== 'D' ? 2 : 0;
  const right = around.e !== 'D' ? 2 : 0;
  px(c, left, 2, T - left - right, 17, '#8a929c');
  px(
    c,
    left + (left ? 1 : 0),
    3,
    T - left - right - (left ? 1 : 0) - (right ? 1 : 0),
    15,
    '#141418',
  );
  for (const y of [5, 9, 13]) {
    let x = left + 2;
    while (x < T - right - 3) {
      const w = 2 + ((r() * 4) | 0);
      px(c, x, y, Math.min(w, T - right - 3 - x), 2, r() < 0.15 ? '#5ad060' : '#f8b820');
      x += w + 1 + ((r() * 2) | 0);
    }
  }
  // Brackets up to the ceiling.
  if (left) px(c, 4, 0, 2, 2, '#5a6068');
  if (right) px(c, T - 6, 0, 2, 2, '#5a6068');
}

/** A fireplace: a stone surround and a turf fire that flickers. */
function fire(c: Ctx, r: () => number, frame: number) {
  wallpaper(c, r);
  px(c, 3, 4, 26, 26, '#8a8478');
  px(c, 3, 4, 26, 3, '#b4ac9c');
  px(c, 1, 3, 30, 2, '#6a4a2a');
  px(c, 8, 10, 16, 20, '#201814');
  // Sods of turf, glowing.
  px(c, 9, 25, 14, 4, '#4a3020');
  px(c, 10, 24, 5, 2, '#5a3a24');
  px(c, 16, 24, 6, 2, '#5a3a24');
  const flick = [0, 1, 2, 1][frame];
  const flames: [number, number, number, string][] = [
    [10, 6 + flick, 4, '#e85020'],
    [14, 9 - flick, 5, '#f07828'],
    [19, 7 + (flick % 2), 4, '#e85020'],
    [12, 4 + flick, 3, '#f8b040'],
    [17, 5 - (flick % 2), 3, '#f8d060'],
  ];
  for (const [x, h, w, colour] of flames) px(c, x, 24 - h, w, h, colour);
  px(c, 0, 30, T, 2, '#5a4430');
}

/** Shelves of books (`Y`), bottles behind a bar (`V`) or a shop's crisps and cans (`A`). */
function shelves(c: Ctx, r: () => number, around: Around, kind: string) {
  if (BACK_WALL.has(around.n)) wallpaper(c, r);
  else ground(c, r, around);
  px(c, 2, 2, 28, 28, '#5a3a20');
  px(c, 3, 3, 26, 26, '#7a5230');
  const books = ['#d04838', '#3a70c8', '#f0c030', '#2f8a4a', '#e8e0d0', '#8a3aa0', '#204a30'];
  const bottles = ['#2f6a3a', '#7a4a1a', '#c88a28', '#e8e0c8', '#3a5a2a'];
  const goods = ['#e03c3a', '#f0c030', '#f08a20', '#3a70c8', '#2f8a4a', '#f4f4f4'];
  for (const y of [4, 13, 22]) {
    px(c, 3, y + 7, 26, 2, '#4a2e18');
    let x = 4;
    while (x < 27) {
      if (kind === 'V') {
        // A bottle: body, shoulder and neck, with a shine.
        const colour = bottles[(r() * bottles.length) | 0];
        if (x + 3 > 28) break;
        px(c, x, y + 3, 3, 4, colour);
        px(c, x + 1, y, 1, 3, colour);
        px(c, x, y + 3, 1, 3, 'rgb(255 255 255 / 0.35)');
        x += 4;
        continue;
      }
      const w = kind === 'A' ? 3 + ((r() * 2) | 0) : 2 + ((r() * 3) | 0);
      const h = kind === 'A' ? 3 + ((r() * 4) | 0) : 4 + ((r() * 3) | 0);
      if (x + w > 28) break;
      const colour = (kind === 'A' ? goods : books)[
        (r() * (kind === 'A' ? goods : books).length) | 0
      ];
      px(c, x, y + 7 - h, w, h, colour);
      px(c, x, y + 7 - h, 1, h, 'rgb(255 255 255 / 0.25)');
      x += w + (r() < 0.2 ? 2 : 1);
    }
  }
  px(c, 2, 30, 28, 2, 'rgb(0 0 0 / 0.25)');
}

/** A bar or shop counter, joined up along its length. */
function counter(c: Ctx, r: () => number, around: Around) {
  ground(c, r, around);
  const left = around.w !== 'C' ? 2 : 0;
  const right = around.e !== 'C' ? 2 : 0;
  px(c, left, 4, T - left - right, 26, '#5a3418');
  px(c, left, 4, T - left - right, 8, '#a8743c');
  px(c, left, 4, T - left - right, 2, '#d0a060');
  px(c, left, 12, T - left - right, 1, '#3a2010');
  for (let x = left + 3; x < T - right; x += 8) px(c, x, 15, 5, 12, '#6a4020');
  px(c, left, 30, T - left - right, 2, 'rgb(0 0 0 / 0.3)');
}

/** A wooden table, any size, with its legs along the front. */
function table(c: Ctx, r: () => number, around: Around) {
  ground(c, r, around);
  const n = around.n === 'U';
  const s = around.s === 'U';
  const w = around.w === 'U';
  const e = around.e === 'U';
  const x0 = w ? 0 : 3;
  const x1 = e ? T : T - 3;
  const y0 = n ? 0 : 6;
  const y1 = s ? T : 24;
  px(c, x0, y0, x1 - x0, y1 - y0, '#9a6a38');
  for (let y = y0 + 4; y < y1; y += 6) px(c, x0, y, x1 - x0, 1, '#8a5c30');
  if (!n) px(c, x0, y0, x1 - x0, 2, '#c08850');
  if (!s) {
    px(c, x0, y1, x1 - x0, 3, '#6a4422');
    if (!w) px(c, x0 + 1, y1 + 3, 2, 4, '#4a2e18');
    if (!e) px(c, x1 - 3, y1 + 3, 2, 4, '#4a2e18');
    px(c, x0, y1 + 3, x1 - x0, 1, 'rgb(0 0 0 / 0.2)');
  }
  if (!n && !w) {
    // A cup of tea.
    px(c, 8, 10, 5, 4, '#f8f8f8');
    px(c, 9, 10, 3, 1, '#8a5a30');
  }
}

function plant(c: Ctx, r: () => number, around: Around) {
  ground(c, r, around);
  ellipse(c, 16, 29, 8, 2, 'rgb(0 0 0 / 0.25)');
  px(c, 10, 20, 12, 9, '#b0583a');
  px(c, 10, 20, 12, 2, '#d07a50');
  for (const [x, y, rx, ry, colour] of [
    [16, 12, 9, 7, '#2f7a3a'],
    [12, 10, 5, 5, '#3a9a48'],
    [20, 9, 5, 6, '#3a9a48'],
    [16, 6, 4, 4, '#58b860'],
  ] as const)
    ellipse(c, x, y, rx, ry, colour);
}

/** The colours of a dance floor's squares: four lit, and two dark between them. */
const DISCO = ['#f040a0', '#30d0f0', '#f8d030', '#60e060', '#201830', '#2a2040'];

/**
 * A dance floor (`l`): four by four glass squares lit from below, each changing colour on the
 * beat, out of step with its neighbours.
 */
function danceFloor(c: Ctx, variant: number, frame: number) {
  const q = T / 4;
  px(c, 0, 0, T, T, '#100c18');
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const colour = DISCO[(x + y * 3 + variant * 5 + frame * 7) % DISCO.length];
      px(c, x * q + 1, y * q + 1, q - 2, q - 2, colour);
      px(c, x * q + 1, y * q + 1, q - 2, 1, 'rgb(255 255 255 / 0.35)');
    }
  }
}

/** A speaker stack (`I`): a black cabinet with a big cone below and a small one above. */
function speaker(c: Ctx, r: () => number, around: Around) {
  ground(c, r, around);
  ellipse(c, 16, 30, 12, 2, 'rgb(0 0 0 / 0.3)');
  px(c, 4, 1, 24, 29, '#18161c');
  px(c, 4, 1, 24, 1, '#3a3640');
  px(c, 5, 2, 1, 27, '#2a2830');
  ellipse(c, 16, 9, 5, 5, '#3a3640');
  ellipse(c, 16, 9, 2, 2, '#6a6670');
  ellipse(c, 16, 21, 8, 7, '#2e2b34');
  ellipse(c, 16, 21, 5, 4, '#4a4652');
  ellipse(c, 16, 21, 2, 2, '#8a8690');
}

/** Screen colours for the arcade machines (`m`), one per machine. */
const ARCADE = ['#30d0f0', '#f040a0', '#70f040', '#f8d030'];

/** An arcade machine (`m`): a tall cabinet with a glowing screen, a joystick and two buttons. */
function arcadeMachine(c: Ctx, r: () => number, around: Around, variant: number) {
  ground(c, r, around);
  const glow = ARCADE[variant % ARCADE.length];
  ellipse(c, 16, 30, 12, 2, 'rgb(0 0 0 / 0.3)');
  px(c, 5, 1, 22, 29, '#1c1830');
  px(c, 5, 1, 22, 4, glow);
  px(c, 6, 2, 20, 2, 'rgb(255 255 255 / 0.35)');
  px(c, 8, 7, 16, 11, '#0c0a14');
  px(c, 9, 8, 14, 9, shadeOf(glow));
  // A little game on the screen: a ship and a row of invaders.
  for (let x = 10; x < 22; x += 3) px(c, x, 9 + ((x / 3) % 2), 2, 1, '#f4f4f4');
  px(c, 15, 15, 2, 1, glow);
  px(c, 7, 19, 18, 4, '#2a2640');
  px(c, 10, 19, 1, 3, '#d8d8e0');
  px(c, 9, 19, 3, 1, '#e03c3a');
  px(c, 16, 20, 2, 2, '#e03c3a');
  px(c, 20, 20, 2, 2, '#3a70c8');
  px(c, 13, 25, 6, 3, '#0c0a14');
  px(c, 15, 26, 2, 1, '#f8d030');
}

/** The colour of a screen showing a game: the machine's colour, dimmed. */
const shadeOf = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.35)).join(' ')})`;

/** A row of stadium seats (`n`), blue and white, with a fan in a striped shirt here and there. */
function seats(c: Ctx, r: () => number) {
  px(c, 0, 0, T, T, '#5a5a64');
  px(c, 0, 0, T, 2, '#6c6c76');
  for (let x = 1; x < T; x += 8) {
    const blue = (x >> 3) % 2 === 0;
    px(c, x, 6, 6, 12, '#1c2a48');
    px(c, x, 6, 6, 10, blue ? '#1f5fb8' : '#f0f0f4');
    px(c, x, 16, 6, 6, blue ? '#18488c' : '#c8c8d0');
    if (r() < 0.45) {
      // Someone standing up in front of their seat.
      px(c, x + 1, 14, 4, 10, '#f4f4f4');
      px(c, x + 2, 14, 1, 10, '#1f5fb8');
      px(c, x + 1, 9, 4, 5, r() < 0.5 ? '#f8d0a8' : '#c88a5a');
      px(c, x + 1, 8, 4, 2, r() < 0.5 ? '#3a2a1e' : '#c89048');
    }
  }
  px(c, 0, 26, T, 6, '#4a4a54');
}

/** The pitch (`x`): mown in stripes, with white lines along its edges. */
function pitch(c: Ctx, around: Around) {
  px(c, 0, 0, T, T, '#3a9a3a');
  px(c, 0, 0, T / 2, T, '#44a844');
  const line = '#f4f4f0';
  if (around.n !== 'x') px(c, 0, 1, T, 2, line);
  if (around.s !== 'x') px(c, 0, T - 3, T, 2, line);
  if (around.w !== 'x') px(c, 1, 0, 2, T, line);
  if (around.e !== 'x') px(c, T - 3, 0, 2, T, line);
}

/** A bed: a pillow at the head, a patchwork quilt below. */
function bed(c: Ctx, r: () => number, around: Around) {
  floor(c, r);
  const head = around.n !== 'Q';
  const foot = around.s !== 'Q';
  px(c, 3, head ? 2 : 0, 26, (foot ? 28 : T) - (head ? 2 : 0), '#6a4422');
  px(c, 4, head ? 3 : 0, 24, (foot ? 26 : T) - (head ? 3 : 0), '#f4f0e8');
  if (head) {
    px(c, 7, 5, 18, 8, '#ffffff');
    px(c, 7, 12, 18, 1, '#d8d0c4');
  }
  const top = head ? 15 : 0;
  const bottom = foot ? 26 : T;
  for (let y = top; y < bottom; y += 6)
    for (let x = 4; x < 28; x += 6)
      px(c, x, y, 6, Math.min(6, bottom - y), (x + y) % 12 ? '#3a8a58' : '#d04838');
  if (foot) px(c, 3, 28, 26, 3, '#4a2e18');
}

/** A statue on a plinth, holding up the All-Ireland cup. */
function statue(c: Ctx, r: () => number, around: Around) {
  ground(c, r, around);
  ellipse(c, 16, 29, 11, 2.5, 'rgb(0 0 0 / 0.25)');
  px(c, 5, 18, 22, 11, '#8a8478');
  px(c, 5, 18, 22, 2, '#c8c0b0');
  px(c, 7, 22, 18, 4, '#6a6458');
  // The cup.
  px(c, 11, 4, 10, 8, '#c8a030');
  px(c, 12, 5, 8, 6, '#f0d060');
  px(c, 13, 5, 2, 5, '#fff4b0');
  px(c, 8, 5, 3, 4, '#c8a030');
  px(c, 21, 5, 3, 4, '#c8a030');
  px(c, 14, 12, 4, 3, '#a87810');
  px(c, 11, 15, 10, 3, '#c8a030');
}

/** Floorboards, or the polished boards and court lines of a gym. */
function gymFloor(c: Ctx) {
  px(c, 0, 0, T, T, '#e2c48e');
  for (let x = 0; x < T; x += 6) px(c, x, 0, 1, T, '#d0ae74');
  px(c, 0, 0, T, 1, '#f0dcb0');
  px(c, 3, 14, 2, 2, '#ffffff');
}

/** A rug: red with a gold border where it meets the floor. */
function rug(c: Ctx, around: Around, gym: boolean) {
  px(c, 0, 0, T, T, gym ? '#c83030' : '#a83a3a');
  for (let i = 0; i < T; i += 4) px(c, i, (i * 3) % T, 2, 2, gym ? '#d84848' : '#b84a48');
  const gold = '#e8b840';
  if (around.n !== 'r') px(c, 0, 0, T, 2, gold);
  if (around.s !== 'r') px(c, 0, T - 2, T, 2, gold);
  if (around.w !== 'r') px(c, 0, 0, 2, T, gold);
  if (around.e !== 'r') px(c, T - 2, 0, 2, T, gold);
}

/** The way out: a doormat in a gap in the wall. */
function exit(c: Ctx, r: () => number, around: Around) {
  if (around.n === 'k') darkFloor(c, r);
  else floor(c, r);
  px(c, 0, 0, T, T, 'rgb(0 0 0 / 0.15)');
  px(c, 3, 4, 26, 18, '#7a3020');
  px(c, 4, 5, 24, 16, '#a84a2c');
  for (let y = 7; y < 20; y += 3) px(c, 6, y, 20, 1, '#c06a40');
  // A strip of daylight under the door.
  const g = c.createLinearGradient(0, 22, 0, T);
  g.addColorStop(0, 'rgb(255 248 220 / 0)');
  g.addColorStop(1, 'rgb(255 248 220 / 0.6)');
  c.fillStyle = g;
  c.fillRect(0, 22, T, 10);
}

/**
 * The couch in your house: a three-seater in Ocean Linen, blue-grey slubbed linen with rolled
 * arms, a long seat cushion, two back cushions, a scatter cushion at each end and a skirt down to
 * the floor. It's two tiles wide; each tile draws its own half.
 */
function couch(): HTMLCanvasElement {
  const [cv, c] = canvas(T * 2, T);
  const base = '#4e7096';
  const light = '#6f92b8';
  const dark = '#3c5a7c';
  const deep = '#2a4260';
  const ink = '#1c2c40';
  ellipse(c, T, 30, 30, 2.5, 'rgb(0 0 0 / 0.28)');
  // Back cushions.
  px(c, 6, 1, 52, 14, ink);
  px(c, 7, 2, 24, 12, base);
  px(c, 33, 2, 24, 12, base);
  px(c, 7, 2, 24, 2, light);
  px(c, 33, 2, 24, 2, light);
  px(c, 31, 2, 2, 12, deep);
  // Seat and skirt.
  px(c, 4, 14, 56, 15, ink);
  px(c, 5, 15, 54, 6, light);
  px(c, 5, 15, 54, 1, '#8aaccc');
  px(c, 5, 21, 54, 1, deep);
  px(c, 5, 22, 54, 6, dark);
  px(c, 5, 27, 54, 1, deep);
  // Rolled arms, lower than the back and flaring out at the top.
  for (const [x, out] of [
    [1, -1],
    [53, 1],
  ]) {
    px(c, x, 9, 10, 20, ink);
    px(c, x + 1, 10, 8, 18, base);
    px(c, x + (out < 0 ? -1 : 2), 8, 9, 4, ink);
    px(c, x + (out < 0 ? 0 : 2), 9, 7, 2, light);
    px(c, x + 2, 12, 6, 1, dark);
    px(c, x + 1, 26, 8, 2, deep);
  }
  // Scatter cushions, leaning out against the arms.
  for (const [x, lean] of [
    [10, -1],
    [46, 1],
  ]) {
    for (let i = 0; i < 9; i++) {
      const sx = x + lean * Math.round((8 - i) / 3);
      px(c, sx, 5 + i, 9, 1, ink);
      if (i && i < 8) px(c, sx + 1, 5 + i, 7, 1, i < 3 ? '#8aaccc' : light);
    }
  }
  // Linen slub: a few lighter and darker flecks.
  const r = rng(42);
  for (let i = 0; i < 70; i++) {
    const x = 6 + ((r() * 52) | 0);
    const y = 3 + ((r() * 24) | 0);
    px(c, x, y, 1, 1, r() < 0.5 ? 'rgb(255 255 255 / 0.12)' : 'rgb(0 0 30 / 0.12)');
  }
  // Little dark feet.
  px(c, 6, 29, 3, 2, ink);
  px(c, 55, 29, 3, 2, ink);
  return cv;
}

// ---------- the public side ----------

const ROOFS: Record<string, [string, string, string, string]> = {
  red: ['#d04838', '#e86a50', '#a02c28', '#6a1c18'],
  slate: ['#5c6878', '#7c8898', '#404a58', '#262c36'],
};

const cache = new Map<string, HTMLCanvasElement>();
function kept(key: string, make: () => HTMLCanvasElement) {
  let c = cache.get(key);
  if (!c) cache.set(key, (c = make()));
  return c;
}

/** The ground layer of a tile. */
export function tileImage(
  tile: string,
  around: Around,
  variant: number,
  frame: number,
  slate = false,
) {
  const v = variant % 4;
  const joins = `${around.n}${around.e}${around.s}${around.w}`;
  return kept(`${tile}:${v}:${frame}:${joins}:${slate}`, () => {
    const [cv, c] = canvas();
    const r = rng(v * 977 + tile.charCodeAt(0) * 31);
    switch (tile) {
      case ',':
        tallGrass(c, frame, false);
        break;
      case '"':
        flowers(c, r, frame);
        break;
      case '=':
        path(c, r, around);
        break;
      case 'v':
        pavement(c, r, around);
        break;
      case 'a':
        road(c, r, around);
        break;
      case 'b':
        bog(c, r, frame);
        break;
      case ':':
        limestone(c, r);
        break;
      case 'd':
        sand(c, r);
        break;
      case 'y':
        water(c, frame, { n: '~', e: '~', s: '~', w: '~' });
        break;
      case 'c':
        car(c, r, around, v);
        break;
      case 'p':
        grass(c, r);
        break;
      case '~':
        water(c, frame, around);
        break;
      case 'B':
        bridge(c, frame, around);
        break;
      case 'F':
        floor(c, r);
        break;
      case 'g':
        gymFloor(c);
        break;
      case 'r':
        rug(c, around, Object.values(around).includes('g'));
        break;
      case 'l':
        danceFloor(c, v, frame);
        break;
      case 'k':
        darkFloor(c, r);
        break;
      case 'o':
        if (!WALLISH.has(around.s)) brickWall(c, r, v);
        else wallTop(c, around);
        break;
      case 'I':
        speaker(c, r, around);
        break;
      case 'm':
        arcadeMachine(c, r, around, v);
        break;
      case 'n':
        seats(c, r);
        break;
      case 'x':
        pitch(c, around);
        break;
      case 'W':
        room(c, r, around);
        break;
      case 'O':
        window_(c, r);
        break;
      case 'J':
        fire(c, r, frame);
        break;
      case 'D':
        board(c, r, around);
        break;
      case 'Y':
      case 'V':
      case 'A':
        shelves(c, r, around, tile);
        break;
      case 'C':
        counter(c, r, around);
        break;
      case 'U':
        table(c, r, around);
        break;
      case 'N':
        plant(c, r, around);
        break;
      case 'Q':
        bed(c, r, around);
        break;
      case 'X':
        statue(c, r, around);
        break;
      case 'E':
        exit(c, r, around);
        break;
      case 'Z': {
        floor(c, r);
        const half = around.e === 'Z' ? 0 : 1;
        c.drawImage(kept('Z:couch', couch), half * T, 0, T, T, 0, 0, T, T);
        break;
      }
      case '#':
        wall(c, r, around);
        break;
      case '^':
        roof(c, around, slate ? ROOFS.slate : ROOFS.red);
        break;
      case 'P':
      case 'M':
      case 'G':
      case 'H':
      case 'L':
        if (around.w === 'z' || around.e === 'z') glassDoor(c, around);
        else door(c, r, around, tile);
        break;
      case 'z':
        glass(c, around);
        break;
      case 'S':
        sign(c, r, around);
        break;
      case 'f':
        fence(c, r);
        break;
      case 'h':
        hedge(c, r, around);
        break;
      case 'e':
        ledge(c, r, around);
        break;
      case 's':
        stairs(c, around);
        break;
      case 'w':
        stoneWall(c, r, around);
        break;
      case 'K':
        path(c, r, { n: '=', e: '=', s: '=', w: '=' });
        break;
      case 'R':
        rock(c, r, around, frame);
        break;
      case 'q':
        castleWall(c, r, around);
        break;
      case 'u':
        battlements(c, r, around);
        break;
      case 'j': {
        // A slate roof on its own, for churches and abbeys in a town of red roofs.
        const as = (t: string) => (t === 'j' ? '^' : t === '^' ? 'x' : t);
        roof(
          c,
          { n: as(around.n), e: as(around.e), s: as(around.s), w: as(around.w) },
          ROOFS.slate,
        );
        break;
      }
      case 'T':
        grass(c, r);
        break;
      default:
        grass(c, r);
    }
    return cv;
  });
}

/** The standing-up part of a tall tile, and how far it rises above its tile, in world pixels. */
export function tallImage(
  tile: string,
  variant: number,
): { image: HTMLCanvasElement; rise: number; spread: number } {
  if (tile === 'K') return { image: kept('K:top', campanile), rise: TILE, spread: 0 };
  const v = variant % 4;
  if (tile === 'y') return { image: kept('y:top', yachtTop), rise: YACHT_RISE, spread: 0 };
  if (tile === 'p')
    return {
      image: kept(`p:top:${v}`, () => palmTop(rng(v * 53 + 11))),
      rise: PALM_RISE,
      spread: PALM_SPREAD,
    };
  if (isPine(variant)) {
    return {
      image: kept(`T:pine:${v}`, () => pineTop(rng(v * 71 + 3))),
      rise: PINE_RISE,
      spread: TREE_SPREAD,
    };
  }
  const autumn = isAutumn(variant);
  return {
    image: kept(`T:top:${v}:${autumn}`, () => treeTop(rng(v * 131 + 7), autumn)),
    rise: TREE_RISE,
    spread: TREE_SPREAD,
  };
}

/** The front blades of tall grass, drawn over the lower half of whoever stands in it. */
export function grassFront(frame: number) {
  return kept(`,:front:${frame}`, () => {
    const [cv, c] = canvas();
    tallGrass(c, frame, true);
    return cv;
  });
}

/** A smooth random field over the map: value noise on a grid of `cell` device pixels. */
function noise(seed: number, cell: number) {
  const at = (gx: number, gy: number) => {
    let h = (gx * 374761393 + gy * 668265263 + seed * 2654435761) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h & 0xffff) / 0xffff;
  };
  const ease = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const fx = ease(x / cell - gx);
    const fy = ease(y / cell - gy);
    const top = at(gx, gy) + (at(gx + 1, gy) - at(gx, gy)) * fx;
    const bottom = at(gx, gy + 1) + (at(gx + 1, gy + 1) - at(gx, gy + 1)) * fx;
    return top + (bottom - top) * fy;
  };
}

const PLAIN = new Set(['.', 'T', 'S', 'f']);
const overlays = new Map<string, HTMLCanvasElement>();

/**
 * The detail laid over a whole outdoor map once: broad light and shade across the grass, worn
 * dirt patches, the trees' cast shadows, and fallen leaves under the autumn trees. Drawn after
 * the ground and before anything that stands up.
 */
export function groundOverlay(
  id: string,
  width: number,
  height: number,
  at: (x: number, y: number) => string,
): HTMLCanvasElement {
  const done = overlays.get(id);
  if (done) return done;
  const [cv, c] = canvas(width * T, height * T);
  overlays.set(id, cv);
  const seed = [...id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7);
  const shade = noise(seed, 56);
  const dirt = noise(seed + 1, 40);
  const r = rng(seed);
  const img = c.createImageData(width * T, height * T);
  const d = img.data;
  for (let y = 0; y < height * T; y++) {
    for (let x = 0; x < width * T; x++) {
      const tile = at((x / T) | 0, (y / T) | 0);
      if (!PLAIN.has(tile) && tile !== ',') continue;
      const i = (y * width * T + x) * 4;
      const v = shade(x, y);
      if (v > 0.64) {
        // Sunlit patches, a little yellow.
        d.set([240, 248, 150, Math.min(48, (v - 0.64) * 200)], i);
      } else if (v < 0.34) {
        d.set([20, 70, 30, Math.min(40, (0.34 - v) * 200)], i);
      }
      if (tile === '.') {
        const w = dirt(x, y) + (((x * 7 + y * 13) % 5) - 2) * 0.012;
        if (w > 0.8) {
          const edge = w < 0.825;
          d.set(edge ? [176, 160, 96, 150] : [214, 194, 138, 235], i);
        }
      }
    }
  }
  c.putImageData(img, 0, 0);

  // Buildings throw a shadow down and to the right onto the ground.
  const building = (t: string) => '#^PMGHLwz'.includes(t);
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      if (!building(at(tx, ty))) continue;
      if (!building(at(tx, ty + 1)) && at(tx, ty) !== '^') {
        const g = c.createLinearGradient(0, (ty + 1) * T, 0, (ty + 1) * T + 8);
        g.addColorStop(0, 'rgb(20 40 30 / 0.3)');
        g.addColorStop(1, 'rgb(20 40 30 / 0)');
        c.fillStyle = g;
        c.fillRect(tx * T + 4, (ty + 1) * T, T, 8);
      }
      if (!building(at(tx + 1, ty))) {
        const g = c.createLinearGradient((tx + 1) * T, 0, (tx + 1) * T + 7, 0);
        g.addColorStop(0, 'rgb(20 40 30 / 0.28)');
        g.addColorStop(1, 'rgb(20 40 30 / 0)');
        c.fillStyle = g;
        c.fillRect((tx + 1) * T, ty * T + 6, 7, T);
      }
    }
  }

  // Cast shadows, down and to the right of each tree, and fallen leaves around autumn ones.
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      if (at(tx, ty) !== 'T') continue;
      if (at(tx, ty + 1) !== 'T') {
        ellipse(c, tx * T + 22, ty * T + 30, 24, 9, 'rgb(20 50 30 / 0.22)');
        ellipse(c, tx * T + 20, ty * T + 28, 16, 6, 'rgb(20 50 30 / 0.12)');
      }
      if (!isAutumn(variantAt(tx, ty))) continue;
      for (const [dx, dy] of [
        [0, 1],
        [-1, 1],
        [1, 1],
        [-1, 0],
        [1, 0],
      ]) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (at(nx, ny) !== '.') continue;
        const pile = dy === 1 && dx === 0 && r() < 0.5;
        const n = pile ? 90 : 14;
        for (let k = 0; k < n; k++) {
          const lx = nx * T + ((r() * (T - 2)) | 0);
          const ly = ny * T + ((r() * (pile ? T - 2 : 14)) | 0);
          const colour = LEAVES.autumn[2 + ((r() * 3) | 0)];
          px(c, lx, ly, 2, 2, colour);
          if (r() < 0.3) px(c, lx, ly + 2, 2, 1, LEAVES.autumn[1]);
        }
      }
    }
  }
  return cv;
}
