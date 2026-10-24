import type { ItemId } from './items';
import type { Dog } from './world';

/**
 * The dogs who walk with you: Norm, who Sibeal lends you in Limerick, and Elvis, who you walk
 * for Carl Ryan from any McGrattans. Only one at a time. Both have the same nose for things.
 */

/** Set while Norm, Sibeal's dog, is walking with you. */
export const NORM = 'norm:with-you';

/** Set while Elvis, Carl Ryan's dog, is walking with you. */
export const ELVIS = 'elvis:with-you';

/** Set the first time Elvis goes back to Carl: Carl's skin. */
export const ELVIS_RETURNED = 'elvis:returned';

/** Each dog's flag while it's with you, and its name. */
export const COMPANIONS: Record<Dog, { flag: string; name: string }> = {
  norm: { flag: NORM, name: 'Norm' },
  elvis: { flag: ELVIS, name: 'Elvis' },
};

/** The dog walking with you, if any. */
export function companionOf(flags: ReadonlySet<string> | readonly string[]): Dog | null {
  const has = (f: string) => ('has' in flags ? flags.has(f) : flags.includes(f));
  if (has(ELVIS)) return 'elvis';
  if (has(NORM)) return 'norm';
  return null;
}

/**
 * The chance, each step, that the dog turns something up, once FIND_GAP steps have passed since
 * the last find. Together that's about one find every 350 steps (it was one in 150, with no gap,
 * which turned things up far too often).
 */
export const NORM_FIND_RATE = 1 / 250;

/** Steps after a find before the dog can find anything again, so finds never come in a bunch. */
export const FIND_GAP = 100;

/**
 * Whether the dog finds something on this step: `steps` is the step count now, `foundAt` the
 * step count at the last find (none yet in older saves), and `roll` is in [0, 1).
 */
export function finds(steps: number, foundAt: number | undefined, roll: number): boolean {
  const last = typeof foundAt === 'number' && Number.isFinite(foundAt) ? foundAt : -Infinity;
  return steps - last >= FIND_GAP && roll < NORM_FIND_RATE;
}

/** What the dogs find, and how often: mostly pints and tea, now and then something good. */
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

/** Picks what the dog found, from a roll in [0, 1). */
export function pickFind(r: number): ItemId {
  const total = NORM_FINDS.reduce((n, [, w]) => n + w, 0);
  let at = r * total;
  for (const [item, w] of NORM_FINDS) {
    if (at < w) return item;
    at -= w;
  }
  return NORM_FINDS[0][0];
}
