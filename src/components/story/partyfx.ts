import type { Dir } from '@/lib/story/world';

/**
 * A party, such as the Trinity Ball, drawn the same way in 2D and 3D: fairy lights (strings of
 * coloured bulbs, sagging in the middle, with a slow chase running along them), everyone
 * dancing, bunches of balloons, confetti, sweeping light beams and fireworks.
 */

export const BULB_COLOURS = ['#ff5a5a', '#ffd23c', '#5be38a', '#5ab4ff', '#ff7ad9'];

/** How high a string hangs at its ends, and how far it sags in the middle, in tiles. */
const HANG = 1.5;
const SAG = 0.35;

export interface Bulb {
  /** Tile coordinates on the ground under it. */
  x: number;
  y: number;
  /** Height above the ground, in tiles. */
  h: number;
  colour: string;
  /** Its place among all the bulbs, for the chase. */
  index: number;
  /** The first bulb of its string: no wire leads to it from the one before. */
  start: boolean;
}

/** Every bulb on a set of strings, about two to a tile. */
export function bulbsOf(strings: [number, number, number, number][]): Bulb[] {
  const out: Bulb[] = [];
  for (const [x0, y0, x1, y1] of strings) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({
        x: x0 + (x1 - x0) * t,
        y: y0 + (y1 - y0) * t,
        h: HANG - SAG * 4 * t * (1 - t),
        colour: BULB_COLOURS[out.length % BULB_COLOURS.length],
        index: out.length,
        start: i === 0,
      });
    }
  }
  return out;
}

/** How bright a bulb is just now, 0.35 to 1: a chase of dimmer bulbs running along. */
export const glowOf = (b: Bulb, now: number) =>
  (b.index + Math.floor(now / 350)) % 4 === 0 ? 0.35 : 1;

/** One beat of the music, in milliseconds: about 125 beats a minute. */
export const BEAT_MS = 480;

const MOVES: Dir[][] = [
  ['down', 'left', 'down', 'right'],
  ['left', 'right', 'left', 'right'],
  ['down', 'down', 'up', 'down'],
  ['right', 'down', 'left', 'up'],
];

/**
 * Someone dancing: which way they face on this beat, and a hop on each beat (0 to 1). Everyone
 * has their own moves and is a little out of step with each other.
 */
export function dance(who: number, now: number): { dir: Dir; hop: number; beat: number } {
  const at = now / BEAT_MS + (who % 3) * 0.33;
  const beat = Math.floor(at);
  const moves = MOVES[who % MOVES.length];
  return {
    dir: moves[Math.floor(beat / 2 + who) % moves.length],
    hop: Math.abs(Math.sin((at - beat) * Math.PI)),
    beat,
  };
}

/** A little hash of a whole number to 0 to 1, for scattering things about. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const BALLOON_COLOURS = ['#ff4d6d', '#ffd23c', '#4dabff', '#b06bff', '#4be08a', '#ff8a3d'];

/** A bunch of three balloons: each one's offset from where they're tied, in tiles, and colour. */
export function balloonsAt(i: number, now: number) {
  const sway = Math.sin(now / 900 + i * 1.7) * 0.06;
  return [-0.22, 0, 0.22].map((dx, k) => ({
    dx: dx + sway * (1 + k * 0.3),
    rise: 0.95 + (k === 1 ? 0.22 : 0) + Math.sin(now / 700 + i + k) * 0.03,
    colour: BALLOON_COLOURS[(i * 2 + k) % BALLOON_COLOURS.length],
  }));
}

/** How long one firework takes, from launch to the last spark. */
export const FIREWORK_MS = 1800;

/**
 * The fireworks going off just now: where each burst is across the map (0 to 1 of its width and
 * height of the sky), its colour, and how far through it is (0 to 1). Two at a time, staggered.
 */
export function fireworks(now: number) {
  const out: { x: number; y: number; colour: string; t: number; n: number }[] = [];
  for (let lane = 0; lane < 2; lane++) {
    const at = now / FIREWORK_MS + lane * 0.5;
    const n = Math.floor(at) * 2 + lane;
    out.push({
      x: 0.12 + hash(n) * 0.76,
      y: 0.15 + hash(n + 0.5) * 0.35,
      colour: BULB_COLOURS[n % BULB_COLOURS.length],
      t: at - Math.floor(at),
      n,
    });
  }
  return out;
}

/** Sparks in a burst. */
export const SPARKS = 18;

export const CONFETTI_COLOURS = ['#ff4d6d', '#ffd23c', '#4dabff', '#4be08a', '#ff7ad9', '#ffffff'];
