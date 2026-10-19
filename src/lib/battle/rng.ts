/**
 * Seeded PRNG (mulberry32). The whole state is one 32-bit number kept in the battle state,
 * so a battle replays exactly from its seed and the list of actions.
 */
export function nextRandom(state: number): [value: number, next: number] {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Turns any string into a starting RNG state (FNV-1a). */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h | 0;
}

/** A mutable cursor over the RNG for use inside one pure function call. */
export class Rng {
  constructor(public state: number) {}

  /** A float in [0, 1). */
  next(): number {
    const [value, next] = nextRandom(this.state);
    this.state = next;
    return value;
  }

  /** True with the given probability. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** An integer in [min, max], both included. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}
