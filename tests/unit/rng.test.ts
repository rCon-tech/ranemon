import { describe, expect, it } from 'vitest';
import { nextRandom, Rng, seedFrom } from '@/lib/battle/rng';

describe('rng', () => {
  it('repeats exactly from the same seed', () => {
    const a = new Rng(seedFrom('battle-1'));
    const b = new Rng(seedFrom('battle-1'));
    const xs = Array.from({ length: 50 }, () => a.next());
    expect(Array.from({ length: 50 }, () => b.next())).toEqual(xs);
    expect(new Rng(seedFrom('battle-2')).next()).not.toBe(xs[0]);
  });

  it('stays in [0, 1) and spreads evenly', () => {
    let state = 1;
    let sum = 0;
    for (let i = 0; i < 10_000; i++) {
      const [v, next] = nextRandom(state);
      state = next;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 10_000).toBeCloseTo(0.5, 1);
  });

  it('int covers both ends', () => {
    const r = new Rng(7);
    const seen = new Set(Array.from({ length: 200 }, () => r.int(1, 3)));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
});
