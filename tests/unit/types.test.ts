import { describe, expect, it } from 'vitest';
import { effectiveness, typeMultiplier, TYPES } from '@/lib/battle/types';

describe('type chart', () => {
  it('matches the plan: who beats whom', () => {
    const strong: [string, string[]][] = [
      ['brains', ['brawn', 'chill']],
      ['brawn', ['chaos', 'charm']],
      ['chaos', ['chill', 'hype']],
      ['chill', ['charm', 'brains']],
      ['charm', ['hype', 'brawn']],
      ['hype', ['brains', 'chaos']],
    ];
    for (const [attack, targets] of strong) {
      for (const defend of TYPES) {
        const m = typeMultiplier(attack as never, defend);
        if (targets.includes(defend)) expect(m, `${attack} into ${defend}`).toBe(2);
        else expect(m, `${attack} into ${defend}`).not.toBe(2);
      }
    }
  });

  it('is balanced: every type hits 2 types for 2x, 2 for 0.5x, and is hit by 2 for 2x', () => {
    for (const t of TYPES) {
      expect(TYPES.filter((d) => typeMultiplier(t, d) === 2)).toHaveLength(2);
      expect(TYPES.filter((d) => typeMultiplier(t, d) === 0.5)).toHaveLength(2);
      expect(TYPES.filter((a) => typeMultiplier(a, t) === 2)).toHaveLength(2);
      expect(TYPES.filter((a) => typeMultiplier(a, t) === 0.5)).toHaveLength(2);
    }
  });

  it('multiplies both types of a dual-type defender', () => {
    expect(effectiveness('brains', ['brawn', 'chill'])).toBe(4);
    expect(effectiveness('brains', ['brawn', 'hype'])).toBe(1);
    expect(effectiveness('brains', ['brains', 'hype'])).toBe(0.25);
    expect(effectiveness(null, ['brains'])).toBe(1);
  });
});
