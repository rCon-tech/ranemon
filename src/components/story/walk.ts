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
  /**
   * The last direction pressed, until the walk has seen it. A quick tap on a slow phone can be
   * let go before the next frame is drawn; this keeps it from being lost.
   */
  tapped?: Dir | null;
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
  /** The tile the last step left, to tell a late update from before it. */
  left: { x: number; y: number } | null;
  lastBump: number;
  /** On the bike for the step being taken. */
  riding: boolean;
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
  /** Which bike you have, if any. */
  bike: string | null;
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
  left: null,
  lastBump: 0,
  riding: false,
});

/** The story moved us (a warp, a blackout) or took in our last step. */
export function placeWalk(w: Walk, trail: Trail, pos: Position) {
  // On a slow phone the story can render a turn after the step that followed it, with the
  // position from before the step. Moving back there would undo the step and leave the walk
  // waiting for news of it that never comes.
  if (w.waiting && w.left && pos.x === w.left.x && pos.y === w.left.y) return;
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
    w.left = w.from;
    w.from = null;
    trail.from = null;
    w.waiting = true;
    p.onStep({ x: w.x, y: w.y, face: w.face });
  }
  const held = p.held.current;
  if (held && p.frozen) held.tapped = null;
  const dir = held?.dir ?? held?.tapped ?? null;
  if (w.from || w.waiting || p.frozen || !dir) return;
  if (held) held.tapped = null;
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
    w.riding = !!p.bike && !!p.held.current?.b;
    w.dur = scaled(w.riding ? BIKE_MS : WALK_MS);
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

/** Whether you're on the bike: for the step you're taking, or standing with B held. */
export const isRiding = (w: Walk, p: Walker) =>
  !!p.bike && (w.from ? w.riding : !!p.held.current?.b);

/** Someone running off: which of the map's people, which way, and when they set off. */
export interface Flight {
  index: number;
  dir: Dir;
  t0: number;
  dur: number;
}

/** How many tiles a runner covers before they're out of sight, at bike speed. */
export const FLEE_TILES = 8;
export const FLEE_MS = FLEE_TILES * BIKE_MS;

/** Where a runner has got to at `now`: tiles from where they stood, and the step they're on. */
export function runOff(f: Flight, now: number): { tiles: number; step: number; t: number } {
  const tiles = Math.max(0, Math.min(FLEE_TILES, ((now - f.t0) / f.dur) * FLEE_TILES));
  const step = Math.floor(tiles);
  return { tiles, step, t: tiles - step };
}

/** One beat of the dancing, matching the dance floor's lights. */
export const BEAT_MS = 500;
const MOVES: Dir[] = ['down', 'left', 'down', 'right'];

/**
 * Where a dancer is at `now`: the way they face, turning on every second beat, out of step with
 * the dancer beside them, which foot is forward, and how high they're hopping (0 to 1).
 */
export function dance(
  index: number,
  now: number,
): { face: Dir; step: number; t: number; hop: number } {
  const beats = now / BEAT_MS + index * 0.45;
  const beat = Math.floor(beats);
  const t = beats - beat;
  return {
    face: MOVES[Math.floor(beat / 2 + index) % MOVES.length],
    step: beat % 2,
    t,
    hop: Math.sin(t * Math.PI),
  };
}
