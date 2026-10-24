import { describe, expect, it } from 'vitest';
import { effectiveness, matchup, typeMultiplier, TYPES } from '@/lib/battle/types';

describe('type chart', () => {
  it('matches the plan: who beats whom', () => {
    const strong: [string, string[]][] = [
      ['brains', ['brawn', 'chill', 'arty']],
      ['brawn', ['chaos', 'charm', 'graft']],
      ['chaos', ['chill', 'hype', 'posh']],
      ['chill', ['charm', 'brains', 'arty']],
      ['charm', ['hype', 'brawn', 'graft']],
      ['hype', ['brains', 'chaos', 'posh']],
      ['posh', ['charm', 'brawn', 'graft']],
      ['graft', ['chill', 'brains', 'arty']],
      ['arty', ['hype', 'chaos', 'posh']],
    ];
    for (const [attack, targets] of strong) {
      for (const defend of TYPES) {
        const m = typeMultiplier(attack as never, defend);
        if (targets.includes(defend)) expect(m, `${attack} into ${defend}`).toBe(2);
        else expect(m, `${attack} into ${defend}`).not.toBe(2);
      }
    }
  });

  it('is balanced: every type hits 3 types for 2x, 3 for 0.5x, and is hit by 3 for 2x', () => {
    for (const t of TYPES) {
      expect(TYPES.filter((d) => typeMultiplier(t, d) === 2)).toHaveLength(3);
      expect(TYPES.filter((d) => typeMultiplier(t, d) === 0.5)).toHaveLength(3);
      expect(TYPES.filter((a) => typeMultiplier(a, t) === 2)).toHaveLength(3);
      expect(TYPES.filter((a) => typeMultiplier(a, t) === 0.5)).toHaveLength(3);
    }
  });

  it('leaves the six old types’ matchups with each other as they were', () => {
    const OLD = TYPES.slice(0, 6);
    const was: Record<string, [string[], string[]]> = {
      brains: [
        ['brawn', 'chill'],
        ['brains', 'hype'],
      ],
      brawn: [
        ['chaos', 'charm'],
        ['brains', 'brawn'],
      ],
      chaos: [
        ['chill', 'hype'],
        ['brawn', 'chaos'],
      ],
      chill: [
        ['charm', 'brains'],
        ['chaos', 'chill'],
      ],
      charm: [
        ['hype', 'brawn'],
        ['chill', 'charm'],
      ],
      hype: [
        ['brains', 'chaos'],
        ['charm', 'hype'],
      ],
    };
    for (const a of OLD) {
      for (const d of OLD) {
        const [strong, weak] = was[a];
        const m = strong.includes(d) ? 2 : weak.includes(d) ? 0.5 : 1;
        expect(typeMultiplier(a, d), `${a} into ${d}`).toBe(m);
      }
    }
  });

  it('multiplies both types of a dual-type defender', () => {
    expect(effectiveness('brains', ['brawn', 'chill'])).toBe(4);
    expect(effectiveness('brains', ['brawn', 'hype'])).toBe(1);
    expect(effectiveness('brains', ['brains', 'hype'])).toBe(0.25);
    expect(effectiveness(null, ['brains'])).toBe(1);
  });
});

describe('matchup', () => {
  it('labels every multiplier a move can have', () => {
    expect(matchup('brains', ['brawn', 'chill'])).toMatchObject({
      multiplier: 4,
      short: 'SUPER ×4',
      tone: 'super',
    });
    expect(matchup('brains', ['brawn'])).toMatchObject({ multiplier: 2, tone: 'super' });
    expect(matchup('brains', ['charm'])).toMatchObject({ multiplier: 1, short: 'NORMAL' });
    expect(matchup('brains', ['brawn', 'brains'])).toMatchObject({ multiplier: 1, tone: 'normal' });
    expect(matchup('brains', ['brains'])).toMatchObject({ multiplier: 0.5, short: 'WEAK ×½' });
    expect(matchup('brains', ['brains', 'hype'])).toMatchObject({ multiplier: 0.25, tone: 'weak' });
    expect(matchup(null, ['brains']).multiplier).toBe(1);
  });
});
