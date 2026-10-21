import { scaled } from '@/lib/speed';
import { canEnter, DELTA, type Dir, type GameMap } from '@/lib/story/world';

/**
 * Walking, shared by the 2D and 3D overworlds: one tile per step, started while a direction is
 * held, with the follower taking the tile you just left. The drawing reads where everyone is
 * from here, so both looks walk exactly alike.
 */

export const WALK_MS = 250;
export const BIKE_MS = 125;

export interface Held {
  dir: Dir | null;
  b: boolean;
}

export interface Position {
  x: number;
  y: number;
  face: Dir;
}

export interface Walk extends Position {
  /** The tile being walked from, or null when standing. */
  from: { x: number; y: number } | null;
  t0: number;
  dur: number;
  /** Steps taken, so the feet alternate. */
  frame: number;
  /** Waiting for the story to take in the last step. */
  waiting: boolean;
  lastBump: number;
}

/** Where the follower is: the tile it stands on, and the one it's leaving, while moving. */
export interface Trail {
  at: { x: number; y: number };
  from: { x: number; y: number } | null;
}

export interface Walker {
  map: GameMap;
  flags: ReadonlySet<string>;
  frozen: boolean;
  bike: boolean;
  held: React.RefObject<Held>;
  onStep: (to: Position) => void;
  onTurn: (face: Dir) => void;
  onBump: (x: number, y: number, face: Dir) => void;
}

export const startWalk = (pos: Position): Walk => ({
  ...pos,
  from: null,
  t0: 0,
  dur: WALK_MS,
  frame: 0,
  waiting: false,
  lastBump: 0,
});

/** The story moved us (a warp, a blackout) or took in our last step. */
export function placeWalk(w: Walk, trail: Trail, pos: Position) {
  w.waiting = false;
  if (w.from) return;
  if (w.x !== pos.x || w.y !== pos.y) {
    Object.assign(w, { x: pos.x, y: pos.y });
    Object.assign(trail, { at: { x: pos.x, y: pos.y }, from: null });
  }
  w.face = pos.face;
}

/** Moves the walk on to `now`: finishes a step, or starts the next one if a direction is held. */
export function tickWalk(w: Walk, trail: Trail, p: Walker, now: number) {
  if (w.from && now - w.t0 >= w.dur) {
    w.from = null;
    trail.from = null;
    w.waiting = true;
    p.onStep({ x: w.x, y: w.y, face: w.face });
  }
  const dir = p.held.current?.dir ?? null;
  if (w.from || w.waiting || p.frozen || !dir) return;
  if (dir !== w.face) {
    w.face = dir;
    p.onTurn(dir);
  }
  const [dx, dy] = DELTA[dir];
  const nx = w.x + dx;
  const ny = w.y + dy;
  const width = p.map.rows[0].length;
  const offEdge = (nx < 0 && p.map.west) || (nx >= width && p.map.east);
  if (offEdge || canEnter(p.map, nx, ny, p.flags)) {
    Object.assign(trail, { at: { x: w.x, y: w.y }, from: trail.at });
    w.from = { x: w.x, y: w.y };
    w.x = nx;
    w.y = ny;
    w.t0 = now;
    w.dur = scaled(p.bike && p.held.current?.b ? BIKE_MS : WALK_MS);
    w.frame++;
  } else if (now - w.lastBump > 350) {
    w.lastBump = now;
    p.onBump(nx, ny, dir);
  }
}

/** How far through the current step, from 0 to 1 (1 when standing). */
export const stepT = (w: Walk, now: number) => (w.from ? Math.min(1, (now - w.t0) / w.dur) : 1);

/** The pose frame for a step `t` of the way through: frames 1-4 lead with the left foot, 5-8 the right. */
export const stepPose = (t: number, step: number) =>
  (step % 2 ? 4 : 0) + (t < 0.25 ? 1 : t < 0.6 ? 2 : t < 0.85 ? 3 : 4);
