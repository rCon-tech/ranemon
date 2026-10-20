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
export const TALL = new Set(['T', 'K']);
/** Tall grass: its front blades are drawn again over whoever stands in it. */
export const TALL_GRASS = ',';

const GRASSY = new Set(['.', ',', '"', 'T', 'S', 'f', ':', 'b']);
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
  if (tile === '~' || tile === 'B' || tile === 'b') return Math.floor(now / 220) % 4;
  if (tile === ',' || tile === '"') return Math.floor(now / 600) % 2;
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
    px(c, 0, T - 4, T, 4, '#b8a890');
    px(c, 0, T - 4, T, 1, '#d4c4a8');
    px(c, 0, T - 1, T, 1, '#6a5a48');
  }
  if (around.w !== '#' && !(around.w in DOORS)) px(c, 0, 0, 2, T, '#d4c4a8');
  if (around.e !== '#' && !(around.e in DOORS)) px(c, T - 2, 0, 2, T, '#b8a890');
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
  px(c, 7, 21, 18, 2, '#e0d4c0');
  px(c, 7, 23, 18, 1, '#9a8a74');
}

function door(c: Ctx, r: () => number, around: Around, kind: string) {
  plaster(c, r, around);
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
  for (let y = 2; y < T; y += 6) {
    px(c, 0, y, T, 1, dark);
    px(c, 0, y + 1, T, 1, light);
    const off = (y / 6) % 2 ? 4 : 0;
    for (let x = off; x < T; x += 8) px(c, x, y + 1, 1, 5, dark);
  }
  if (around.n !== '^') {
    px(c, 0, 0, T, 4, light);
    px(c, 0, 0, T, 1, deep);
    px(c, 0, 4, T, 1, dark);
  }
  if (around.s !== '^') {
    px(c, 0, T - 5, T, 5, deep);
    px(c, 0, T - 5, T, 1, light);
  }
  if (around.w !== '^') px(c, 0, 0, 2, T, deep);
  if (around.e !== '^') px(c, T - 2, 0, 2, T, deep);
}

// ---------- things on the grass ----------

function sign(c: Ctx, r: () => number) {
  grass(c, r);
  ellipse(c, 16, 29, 9, 2, 'rgb(0 0 0 / 0.2)');
  px(c, 14, 16, 4, 13, '#7a5028');
  px(c, 16, 16, 2, 13, '#5a3818');
  px(c, 4, 5, 24, 13, '#5a3a1a');
  px(c, 5, 6, 22, 11, '#c89858');
  px(c, 5, 6, 22, 1, '#e8c080');
  px(c, 8, 9, 16, 1, '#7a5028');
  px(c, 8, 12, 12, 1, '#7a5028');
}

function fence(c: Ctx, r: () => number) {
  grass(c, r);
  px(c, 0, 22, T, 2, 'rgb(0 0 0 / 0.12)');
  for (const y of [11, 18]) {
    px(c, 0, y, T, 3, '#c8a070');
    px(c, 0, y, T, 1, '#e0c090');
    px(c, 0, y + 2, T, 1, '#8a6a40');
  }
  for (const x of [5, 22]) {
    px(c, x, 7, 5, 17, '#a07848');
    px(c, x, 7, 5, 1, '#c8a070');
    px(c, x + 3, 7, 2, 17, '#7a5830');
  }
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

// ---------- tall things, drawn with people ----------

/** A tree: grass and a shadow on its own tile, and a round canopy that rises half a tile above. */
function treeTop(r: () => number): HTMLCanvasElement {
  const [cv, c] = canvas(T, T + T / 2);
  const o = T / 2;
  px(c, 13, o + 18, 6, 10, '#7a5028');
  px(c, 16, o + 18, 3, 10, '#5a3818');
  const shift = ((r() * 3) | 0) - 1;
  const blobs: [number, number, number][] = [
    [16 + shift, o + 4, 12],
    [9, o + 11, 8],
    [23, o + 11, 8],
  ];
  for (const [x, y, rad] of blobs) disc(c, x, y, rad + 1, '#1e4a24');
  for (const [x, y, rad] of blobs) disc(c, x, y, rad, '#2a6a30');
  for (const [x, y, rad] of blobs) disc(c, x - 1, y - 2, rad - 2, '#3f8f3a');
  for (const [x, y, rad] of blobs) disc(c, x - 3, y - 4, Math.max(2, rad - 6), '#5fb048');
  for (let i = 0; i < 6; i++) {
    const [x, y, rad] = blobs[(r() * 3) | 0];
    px(c, x - rad / 2 + ((r() * rad) | 0), y - rad / 2 + ((r() * rad) | 0), 2, 1, '#9ce070');
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
      case 'b':
        bog(c, r, frame);
        break;
      case ':':
        limestone(c, r);
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
        door(c, r, around, tile);
        break;
      case 'S':
        sign(c, r);
        break;
      case 'f':
        fence(c, r);
        break;
      case 'w':
        stoneWall(c, r, around);
        break;
      case 'K':
        path(c, r, { n: '=', e: '=', s: '=', w: '=' });
        break;
      case 'T':
        grass(c, r);
        ellipse(c, 16, 27, 14, 5, 'rgb(20 50 20 / 0.3)');
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
): { image: HTMLCanvasElement; rise: number } {
  if (tile === 'K') return { image: kept('K:top', campanile), rise: TILE };
  const v = variant % 4;
  return { image: kept(`T:top:${v}`, () => treeTop(rng(v * 131 + 7))), rise: TILE / 2 };
}

/** The front blades of tall grass, drawn over the lower half of whoever stands in it. */
export function grassFront(frame: number) {
  return kept(`,:front:${frame}`, () => {
    const [cv, c] = canvas();
    tallGrass(c, frame, true);
    return cv;
  });
}
