import type { ItemId } from './items';

/** Set while Norm, Sibeal's dog, is walking with you. */
export const NORM = 'norm:with-you';

/** The chance, each step, that Norm turns something up. About once every 150 steps. */
export const NORM_FIND_RATE = 1 / 150;

/** What Norm finds, and how often: mostly pints and tea, now and then something good. */
export const NORM_FINDS: [ItemId, number][] = [
  ['pint', 30],
  ['cup-of-tea', 20],
  ['chicken-fillet-roll', 15],
  ['spice-bag', 10],
  ['curry-chips', 10],
  ['settled-pint', 6],
  ['monster', 5],
  ['mulligans', 3],
  ['blue-ghost', 1],
];

/** Picks what Norm found, from a roll in [0, 1). */
export function pickFind(r: number): ItemId {
  const total = NORM_FINDS.reduce((n, [, w]) => n + w, 0);
  let at = r * total;
  for (const [item, w] of NORM_FINDS) {
    if (at < w) return item;
    at -= w;
  }
  return NORM_FINDS[0][0];
}
