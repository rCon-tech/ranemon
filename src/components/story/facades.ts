import type { GameMap } from '@/lib/story/world';
import { TILE } from './pixels';

/**
 * City streets of terraced houses (`terraces` on a map), such as Georgian Dublin: each building
 * is split into houses two or three tiles wide, each in its own brick or painted render with its
 * own coloured front door, and the roof row is drawn as an upper storey under a parapet, so the
 * street reads as tall terraces instead of rows of the same cottage. Only the drawing changes:
 * the tiles, and so walking, doors and saves, are the same as before.
 */

/** Device pixels per world pixel, as in tiles.ts. */
const RES = 2;
const T = TILE * RES;

/** Where a tile sits in its house's front, and what the house looks like. */
export interface Facade {
  /**
   * A house, the pub's painted front, the shop's window on the ground floor, or a granite civic
   * building under its own slate roof (`j`), such as a church or a hall.
   */
  kind: 'house' | 'pub' | 'shop' | 'civic';
  /** Index into the wall finishes. */
  wall: number;
  /** Index into the door colours. */
  door: number;
  /** The ground floor, with the door, the railings and the steps; above it, upper storeys. */
  ground: boolean;
  /** The top storey, under the parapet and the slates. */
  top: boolean;
  /** The building's own ends, which get a shaded corner. */
  endW: boolean;
  endE: boolean;
  /** The line between two houses of a terrace, on the west side of this one. */
  party: boolean;
  /** A rainwater pipe down that line. */
  pipe: boolean;
  /** Chimney pots on the parapet. */
  pots: boolean;
}

/** Brick (base, light, dark, mortar) or painted render (base, light, dark, trim). */
const WALLS: { brick: boolean; colours: [string, string, string, string] }[] = [
  { brick: true, colours: ['#a5483a', '#c06450', '#7a3028', '#c8a898'] },
  { brick: true, colours: ['#8c5440', '#a86c54', '#64382a', '#c0a090'] },
  { brick: true, colours: ['#b8643e', '#d0805a', '#88442a', '#d8b8a0'] },
  { brick: true, colours: ['#6e3832', '#8a4c44', '#4e2420', '#b09088'] },
  { brick: true, colours: ['#a5483a', '#c06450', '#7a3028', '#c8a898'] },
  { brick: false, colours: ['#efe2c4', '#fbf2dc', '#c8b898', '#ffffff'] },
  { brick: false, colours: ['#9cc4da', '#bcdcec', '#6e98b0', '#ffffff'] },
  { brick: false, colours: ['#e8a8b0', '#f4c4c8', '#bc7c86', '#ffffff'] },
  { brick: false, colours: ['#f0d070', '#f8e494', '#c4a444', '#ffffff'] },
  { brick: false, colours: ['#a8d4b4', '#c4e4cc', '#78a888', '#ffffff'] },
];
/** Dublin's doors: the famous colours. */
const DOORS = ['#c8282c', '#2a58a8', '#e8b828', '#2a7a48', '#25282c', '#6a3a8a', '#e07828'];
/** The pub's painted fronts: bottle green, black, oxblood, navy. */
const PUBS = ['#1e4a32', '#1e2226', '#6a1e22', '#1e2e4a'];

const BUILDING = '#^PMGHL';
/** Next to these the building is something else (a castle, a cliff), left as it was. */
const OTHER = 'uqRw';

function hash(x: number, y: number, k = 0) {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

const facadeCache = new Map<GameMap, Map<string, Facade>>();

/** Every building tile's place in its terrace, by `x,y`. Empty unless the map has terraces. */
export function facadesOf(map: GameMap): Map<string, Facade> {
  let facades = facadeCache.get(map);
  if (facades) return facades;
  facades = new Map();
  facadeCache.set(map, facades);
  if (!map.terraces) return facades;
  const rows = map.rows;
  const at = (x: number, y: number) => rows[y]?.[x] ?? '';
  const seen = new Set<string>();
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (!BUILDING.includes(at(x, y)) || seen.has(`${x},${y}`)) continue;
      // The whole building, joined up.
      const cells: { x: number; y: number }[] = [];
      const queue = [{ x, y }];
      seen.add(`${x},${y}`);
      while (queue.length) {
        const p = queue.pop()!;
        cells.push(p);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const n = { x: p.x + dx, y: p.y + dy };
          const key = `${n.x},${n.y}`;
          if (seen.has(key) || !BUILDING.includes(at(n.x, n.y))) continue;
          seen.add(key);
          queue.push(n);
        }
      }
      const tiles = cells.map((c) => at(c.x, c.y));
      if (tiles.includes('G')) continue;
      const touches = cells.some(({ x: cx, y: cy }) =>
        [at(cx + 1, cy), at(cx - 1, cy), at(cx, cy + 1), at(cx, cy - 1)].some(
          (t) => t !== '' && OTHER.includes(t),
        ),
      );
      if (touches) continue;
      const civic = cells.some((c) => at(c.x, c.y - 1) === 'j');
      const kind: Facade['kind'] = civic
        ? 'civic'
        : tiles.includes('P')
          ? 'pub'
          : tiles.includes('M')
            ? 'shop'
            : 'house';
      const x0 = Math.min(...cells.map((c) => c.x));
      const x1 = Math.max(...cells.map((c) => c.x));
      const y0 = Math.min(...cells.map((c) => c.y));
      // Split a terrace into houses two or three tiles wide; a pub or shop is one front.
      const starts = new Set([x0]);
      if (kind === 'house') {
        let sx = x0;
        while (sx <= x1) {
          const w = 2 + (hash(sx, y0, 1) % 2);
          sx += x1 - (sx + w) + 1 < 2 ? x1 - sx + 1 : w;
          if (sx <= x1) starts.add(sx);
        }
      }
      let house = { wall: 0, door: 0, pipe: false };
      for (let cx = x0; cx <= x1; cx++) {
        if (starts.has(cx)) {
          const h = hash(cx, y0, 2);
          house = {
            wall: kind === 'pub' ? 5 + (h % 5) : h % WALLS.length,
            door: kind === 'pub' ? (h >> 4) % PUBS.length : (h >> 4) % DOORS.length,
            pipe: cx !== x0 && ((h >> 8) & 1) === 1,
          };
        }
        for (const c of cells) {
          if (c.x !== cx) continue;
          const below = BUILDING.includes(at(c.x, c.y + 1));
          const above = BUILDING.includes(at(c.x, c.y - 1)) || at(c.x, c.y - 1) === 'j';
          facades.set(`${c.x},${c.y}`, {
            kind,
            wall: house.wall,
            door: house.door,
            ground: !below,
            top: !above,
            endW: !BUILDING.includes(at(c.x - 1, c.y)),
            endE: !BUILDING.includes(at(c.x + 1, c.y)),
            party: starts.has(cx) && cx !== x0,
            pipe: starts.has(cx) && house.pipe,
            pots: !above && starts.has(cx) && cx !== x0,
          });
        }
      }
    }
  }
  return facades;
}

/** A short key for the tile cache. */
export function facadeKey(f: Facade) {
  return [
    f.kind,
    f.wall,
    f.door,
    +f.ground,
    +f.top,
    +f.endW,
    +f.endE,
    +f.party,
    +f.pipe,
    +f.pots,
  ].join('');
}

type Ctx = CanvasRenderingContext2D;

function px(c: Ctx, x: number, y: number, w: number, h: number, colour: string) {
  c.fillStyle = colour;
  c.fillRect(x, y, w, h);
}

/** The wall itself: brick courses or a painted render. */
function wallFace(c: Ctx, f: Facade, r: () => number) {
  const { brick, colours } = WALLS[f.wall];
  const [base, light, dark, mortar] = colours;
  px(c, 0, 0, T, T, base);
  if (brick) {
    for (let y = 0; y < T; y += 4) {
      px(c, 0, y + 3, T, 1, mortar);
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = off; x < T; x += 8) {
        px(c, x, y, 1, 3, mortar);
        const roll = r();
        if (roll < 0.18) px(c, x + 1, y, 7, 3, dark);
        else if (roll > 0.88) px(c, x + 1, y, 7, 3, light);
      }
    }
    // Weather the mortar a little, so it isn't a perfect grid.
    for (let i = 0; i < 20; i++) px(c, (r() * T) | 0, (r() * T) | 0, 1, 1, dark);
  } else {
    for (let i = 0; i < 40; i++)
      px(c, (r() * T) | 0, (r() * T) | 0, 1, 1, r() < 0.5 ? light : dark);
  }
}

/** A white-framed Georgian sash window, six panes over six. */
function sash(c: Ctx, x: number, y: number, w: number, h: number, lit: boolean) {
  px(c, x - 1, y - 1, w + 2, h + 2, '#2a2420');
  px(c, x, y, w, h, '#f4f0e8');
  const gx = x + 1;
  const gy = y + 1;
  const gw = w - 2;
  const gh = h - 2;
  const g = c.createLinearGradient(0, gy, 0, gy + gh);
  if (lit) {
    g.addColorStop(0, '#f8d890');
    g.addColorStop(1, '#d89848');
  } else {
    g.addColorStop(0, '#5a7a98');
    g.addColorStop(1, '#2a3a58');
  }
  c.fillStyle = g;
  c.fillRect(gx, gy, gw, gh);
  // Glazing bars: two uprights, and a rail across each sash.
  const third = Math.round(gw / 3);
  px(c, gx + third - 1, gy, 1, gh, '#f4f0e8');
  px(c, gx + third * 2, gy, 1, gh, '#f4f0e8');
  const mid = gy + Math.round(gh / 2);
  px(c, gx, mid - 1, gw, 2, '#f4f0e8');
  px(c, gx, gy + Math.round(gh / 4), gw, 1, '#f4f0e8');
  px(c, gx, gy + Math.round((gh * 3) / 4), gw, 1, '#f4f0e8');
  // A glint on the glass.
  if (!lit) {
    px(c, gx + 1, gy + 1, 1, 3, '#a8c8e0');
    px(c, gx + 2, gy + 1, 1, 1, '#a8c8e0');
  }
}

/** The granite sill under a window. */
function sill(c: Ctx, x: number, y: number, w: number) {
  px(c, x - 2, y, w + 4, 2, '#d8d4cc');
  px(c, x - 2, y + 2, w + 4, 1, '#8a867e');
}

/** Black cast-iron railings along the front, over the basement area. */
function railings(c: Ctx) {
  px(c, 0, 26, T, 6, '#b8b4ac');
  px(c, 0, 26, T, 1, '#d8d4cc');
  px(c, 0, 31, T, 1, '#7a766e');
  for (let x = 1; x < T; x += 3) {
    px(c, x, 22, 1, 9, '#1e2226');
    px(c, x, 21, 1, 1, '#4a4e56');
  }
  px(c, 0, 24, T, 1, '#1e2226');
  px(c, 0, 29, T, 1, '#1e2226');
}

/** The front door: a fanlight over it, a stone surround and a granite step. */
function frontDoor(c: Ctx, f: Facade) {
  const colour = DOORS[f.door];
  // The stone surround and the step.
  px(c, 6, 1, 20, 31, '#d8d4cc');
  px(c, 6, 1, 20, 1, '#f0ece4');
  px(c, 25, 1, 1, 31, '#a8a49c');
  px(c, 4, 29, 24, 3, '#c8c4bc');
  px(c, 4, 29, 24, 1, '#e8e4dc');
  px(c, 4, 31, 24, 1, '#8a867e');
  // The fanlight: a half wheel of glass.
  c.fillStyle = '#2a2420';
  c.beginPath();
  c.arc(16, 11, 8, Math.PI, 0);
  c.fill();
  c.fillStyle = '#f8e0a0';
  c.beginPath();
  c.arc(16, 11, 7, Math.PI, 0);
  c.fill();
  c.strokeStyle = '#2a2420';
  c.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (Math.PI * i) / 6;
    c.beginPath();
    c.moveTo(16, 11);
    c.lineTo(16 + Math.cos(a) * 7, 11 + Math.sin(a) * 7);
    c.stroke();
  }
  // The door, in its colour, with raised panels and a brass knocker.
  px(c, 8, 11, 16, 18, '#2a2420');
  px(c, 9, 12, 14, 17, colour);
  c.fillStyle = 'rgb(255 255 255 / 0.18)';
  c.fillRect(9, 12, 14, 1);
  c.fillRect(9, 12, 1, 17);
  c.fillStyle = 'rgb(0 0 0 / 0.25)';
  for (const [x, y, w, h] of [
    [11, 14, 4, 6],
    [17, 14, 4, 6],
    [11, 22, 4, 5],
    [17, 22, 4, 5],
  ])
    c.fillRect(x, y, w, h);
  c.fillStyle = 'rgb(255 255 255 / 0.15)';
  for (const [x, y] of [
    [11, 14],
    [17, 14],
    [11, 22],
    [17, 22],
  ])
    c.fillRect(x, y, 4, 1);
  px(c, 15, 17, 2, 2, '#f0c040');
  px(c, 21, 21, 1, 2, '#f0c040');
}

/** The pub's painted wooden front: a fascia, a lit window of small panes and pilasters. */
function pubFront(c: Ctx, f: Facade, door: boolean) {
  const paint = PUBS[f.door];
  px(c, 0, 0, T, T, paint);
  // The fascia board along the top, picked out in gold.
  px(c, 0, 1, T, 1, '#d8b048');
  px(c, 0, 6, T, 1, '#d8b048');
  if (door) {
    // A half-glazed door, a step and a lantern.
    px(c, 8, 9, 16, 23, '#2a1a10');
    px(c, 9, 10, 14, 22, '#5a3018');
    px(c, 10, 11, 12, 9, '#f8d070');
    px(c, 15, 11, 2, 9, '#5a3018');
    px(c, 10, 15, 12, 1, '#5a3018');
    px(c, 20, 23, 2, 2, '#f0c040');
    px(c, 6, 30, 20, 2, '#8a867e');
    px(c, 2, 11, 4, 6, '#1e2226');
    px(c, 3, 12, 2, 4, '#ffe080');
  } else {
    // A big window of small panes, lit warm from inside.
    px(c, 3, 9, 26, 16, '#2a1a10');
    const g = c.createLinearGradient(0, 10, 0, 24);
    g.addColorStop(0, '#fce4a0');
    g.addColorStop(1, '#e09848');
    c.fillStyle = g;
    c.fillRect(4, 10, 24, 14);
    for (let x = 4 + 6; x < 28; x += 6) px(c, x, 10, 1, 14, '#2a1a10');
    px(c, 4, 15, 24, 1, '#2a1a10');
    // A stall-riser panel under the window.
    px(c, 3, 25, 26, 6, paint);
    px(c, 5, 26, 22, 4, 'rgb(0 0 0 / 0.25)');
    px(c, 3, 25, 26, 1, '#d8b048');
  }
  // Pilasters at the ends.
  if (f.endW) px(c, 0, 0, 2, T, '#d8b048');
  if (f.endE) px(c, T - 2, 0, 2, T, '#d8b048');
  px(c, 0, T - 1, T, 1, '#1e2226');
}

/** The shop's front: a fascia and a wide plate-glass window with things on display. */
function shopWindow(c: Ctx, r: () => number) {
  px(c, 0, 0, T, T, '#e8e4dc');
  px(c, 0, 0, T, 6, '#3a70c8');
  px(c, 0, 5, T, 1, '#244a8a');
  px(c, 2, 9, 28, 18, '#3a3a40');
  const g = c.createLinearGradient(0, 10, 0, 26);
  g.addColorStop(0, '#d8f0ff');
  g.addColorStop(1, '#8cc4ec');
  c.fillStyle = g;
  c.fillRect(3, 10, 26, 16);
  // Rows of vapes and cans on the shelves.
  const stock = ['#3a8ae8', '#e84050', '#f8d048', '#5ac85a', '#b060e0'];
  for (const y of [14, 21]) {
    px(c, 3, y + 4, 26, 1, '#9a9aa0');
    for (let x = 5; x < 27; x += 3) px(c, x, y, 2, 4, stock[(r() * stock.length) | 0]);
  }
  px(c, 4, 11, 2, 6, 'rgb(255 255 255 / 0.6)');
  px(c, 0, 27, T, 5, '#b8b4ac');
  px(c, 0, 27, T, 1, '#d8d4cc');
}

/** Granite ashlar with a tall round-headed window, or the great door, for a civic building. */
function civicFront(c: Ctx, f: Facade, tile: string, r: () => number) {
  px(c, 0, 0, T, T, '#c8c4b8');
  for (let y = 0; y < T; y += 8) {
    px(c, 0, y + 7, T, 1, '#a09c90');
    const off = (y / 8) % 2 ? 8 : 0;
    for (let x = off; x < T; x += 16) px(c, x, y, 1, 7, '#a09c90');
  }
  for (let i = 0; i < 30; i++)
    px(c, (r() * T) | 0, (r() * T) | 0, 1, 1, r() < 0.5 ? '#b4b0a4' : '#dcd8cc');
  if (tile === '#') {
    // A tall window under a round head.
    c.fillStyle = '#4a4438';
    c.beginPath();
    c.arc(16, 10, 6, Math.PI, 0);
    c.fill();
    px(c, 10, 10, 12, 16, '#4a4438');
    c.fillStyle = '#5a7a98';
    c.beginPath();
    c.arc(16, 10, 5, Math.PI, 0);
    c.fill();
    px(c, 11, 10, 10, 15, '#3a5070');
    px(c, 15, 5, 2, 20, '#4a4438');
    px(c, 11, 15, 10, 1, '#4a4438');
    px(c, 12, 6, 1, 4, '#a8c8e0');
    px(c, 8, 26, 16, 2, '#e0dcd0');
  } else {
    // The great door under a carved head, up two steps.
    px(c, 5, 2, 22, 4, '#e0dcd0');
    px(c, 5, 5, 22, 1, '#8a867e');
    c.fillStyle = '#3a2a1a';
    c.beginPath();
    c.arc(16, 15, 8, Math.PI, 0);
    c.fill();
    px(c, 8, 15, 16, 13, '#3a2a1a');
    c.fillStyle = '#6a3a1e';
    c.beginPath();
    c.arc(16, 15, 7, Math.PI, 0);
    c.fill();
    px(c, 9, 15, 14, 13, '#6a3a1e');
    px(c, 16, 8, 1, 20, '#3a2a1a');
    for (const y of [12, 18, 24]) px(c, 9, y, 14, 1, '#4a2a14');
    px(c, 13, 19, 2, 2, '#f0c040');
    px(c, 18, 19, 2, 2, '#f0c040');
    px(c, 3, 28, 26, 2, '#d8d4cc');
    px(c, 1, 30, 30, 2, '#b8b4ac');
  }
  if (f.endW) px(c, 0, 0, 2, T, '#9a968a');
  if (f.endE) px(c, T - 2, 0, 2, T, '#7a766a');
  if (f.ground) px(c, 0, T - 1, T, 1, '#6a665a');
}

/**
 * One building tile of a terrace. Returns false for a tile it doesn't draw (the shop's own door,
 * with its awning, is left to tiles.ts).
 */
export function drawFacade(c: Ctx, tile: string, f: Facade, r: () => number): boolean {
  if (f.ground && f.kind === 'shop' && tile === 'M') return false;
  if (f.kind === 'civic') {
    civicFront(c, f, tile, r);
    return true;
  }
  if (f.ground && f.kind === 'pub') {
    pubFront(c, f, tile === 'P');
  } else if (f.ground && f.kind === 'shop') {
    shopWindow(c, r);
  } else {
    wallFace(c, f, r);
    if (f.ground) {
      if (tile === 'H' || tile === 'L' || tile === 'P' || tile === 'M') {
        frontDoor(c, f);
      } else {
        sash(c, 9, 3, 14, 18, false);
        sill(c, 9, 21, 14);
        railings(c);
      }
    } else {
      const top = f.top ? 9 : 4;
      sash(c, 9, top, 14, 25 - top, false);
      sill(c, 9, 29, 14);
    }
  }
  const [, light, dark] = WALLS[f.wall].colours;
  if (!f.ground || f.kind === 'house') {
    // Shade the building's ends, as tiles.ts does for the cottages' corners.
    if (f.endW) {
      px(c, 0, 0, 1, T, '#2a2420');
      px(c, 1, 0, 1, T, light);
    }
    if (f.endE) {
      px(c, T - 3, 0, 2, T, dark);
      px(c, T - 1, 0, 1, T, '#2a2420');
    }
    // The line between two houses, sometimes with a downpipe.
    if (f.party) px(c, 0, 0, 1, T, dark);
    if (f.pipe) {
      px(c, 0, 0, 3, T, '#3a3e46');
      px(c, 0, 0, 1, T, '#5a5e66');
    }
  }
  if (f.top) {
    // Slates showing over the parapet, the parapet's granite coping, and a cornice under it.
    px(c, 0, 0, T, 3, '#4a5468');
    px(c, 0, 0, T, 1, '#6a7488');
    for (let x = (r() * 6) | 0; x < T; x += 6) px(c, x, 1, 1, 2, '#3a4254');
    px(c, 0, 3, T, 3, '#d8d4cc');
    px(c, 0, 3, T, 1, '#f0ece4');
    px(c, 0, 6, T, 1, '#8a867e');
    if (f.pots) {
      // A chimney stack on the party wall, with its pots.
      px(c, 0, 0, 7, 4, '#7a3028');
      px(c, 0, 0, 7, 1, '#a5483a');
      px(c, 1, 0, 2, 1, '#c8703a');
      px(c, 4, 0, 2, 1, '#c8703a');
    }
  }
  return true;
}

const lampCache = new Map<GameMap, { x: number; y: number }[]>();

/**
 * Street lamps along the kerbs of a city of terraces, every few tiles, on pavement beside the
 * road. They're only drawn: you walk past them as before.
 */
export function lampsOf(map: GameMap) {
  let lamps = lampCache.get(map);
  if (lamps) return lamps;
  lamps = [];
  lampCache.set(map, lamps);
  if (!map.terraces) return lamps;
  const at = (x: number, y: number) => map.rows[y]?.[x] ?? '';
  const road = (t: string) => t === 'a' || t === 'c';
  for (let y = 0; y < map.rows.length; y++) {
    for (let x = 0; x < map.rows[y].length; x++) {
      if (at(x, y) !== 'v' || x % 6 !== 3) continue;
      // Not in front of a door, where it would stand in the doorway.
      if ('PMGHL'.includes(at(x, y - 1))) continue;
      // On the kerb with the road in front, so the post rises over the pavement behind it.
      if (road(at(x, y + 1))) lamps.push({ x, y });
    }
  }
  return lamps;
}

/**
 * A Dublin lamp post, in world pixels: a dark green fluted column with a lantern on top. `x`
 * and `y` are where it stands; `night` (0 to 1) lights the lantern.
 */
export function drawLamp(c: Ctx, x: number, y: number, night: number) {
  c.fillStyle = 'rgb(0 0 0 / 0.25)';
  c.fillRect(x - 2, y - 0.5, 5, 1.5);
  c.fillStyle = '#1e2e26';
  c.fillRect(x - 1.5, y - 2.5, 3, 2.5);
  c.fillRect(x - 0.5, y - 20, 1.5, 18);
  c.fillStyle = '#3e5a4a';
  c.fillRect(x - 0.5, y - 20, 0.5, 18);
  c.fillStyle = '#1e2e26';
  c.fillRect(x - 1.5, y - 21, 3.5, 1);
  // The lantern.
  c.fillStyle = '#1e2e26';
  c.fillRect(x - 2, y - 26.5, 5, 6);
  c.fillRect(x - 1.5, y - 28, 4, 1.5);
  c.fillStyle = night > 0 ? '#ffe9a0' : '#cfe0e6';
  c.fillRect(x - 1.5, y - 26, 4, 4.5);
  c.fillStyle = night > 0 ? '#fff6d0' : '#eef6f8';
  c.fillRect(x - 1.5, y - 26, 1, 4.5);
  c.fillStyle = '#1e2e26';
  c.fillRect(x, y - 26, 0.5, 4.5);
}
