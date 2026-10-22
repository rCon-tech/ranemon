/**
 * Fairy lights for a party, such as the Trinity Ball: strings of coloured bulbs hung between
 * two points, sagging in the middle, with a slow chase running along them. Shared by 2D and 3D.
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
