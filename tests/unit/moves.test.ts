import { describe, expect, it } from 'vitest';
import { levelStats, validateCreature, type Creature } from '@/lib/battle/creature';
import { MOVES } from '@/lib/battle/moves';
import { STARTERS } from '@/lib/battle/roster';
import { TYPES } from '@/lib/battle/types';

describe('move list', () => {
  it('has 36 moves with unique ids', () => {
    expect(MOVES).toHaveLength(36);
    expect(new Set(MOVES.map((m) => m.id)).size).toBe(36);
  });

  it.each(TYPES)('%s has 3 damaging, 1 priority or utility, 2 status or stat moves', (type) => {
    const list = MOVES.filter((m) => m.type === type);
    expect(list).toHaveLength(6);
    const utility = list.filter((m) => m.priority !== 0 || m.effect?.kind === 'heal');
    const status = list.filter((m) => m.category === 'status' && !utility.includes(m));
    const damaging = list.filter((m) => m.category !== 'status' && !utility.includes(m));
    expect([damaging.length, utility.length, status.length]).toEqual([3, 1, 2]);
  });

  it('keeps every value in the plan’s ranges', () => {
    for (const m of MOVES) {
      if (m.category === 'status') expect(m.power).toBe(0);
      else {
        expect(m.power).toBeGreaterThanOrEqual(40);
        expect(m.power).toBeLessThanOrEqual(120);
      }
      if (m.accuracy !== null) {
        expect(m.accuracy).toBeGreaterThanOrEqual(50);
        expect(m.accuracy).toBeLessThanOrEqual(100);
      }
      expect(m.pp).toBeGreaterThanOrEqual(5);
      expect(m.pp).toBeLessThanOrEqual(20);
    }
  });
});

describe('creatures', () => {
  it.each(STARTERS.map((s) => [s.name, s] as const))('%s is a valid card', (_, creature) => {
    expect(validateCreature(creature)).toEqual([]);
  });

  it('turns base stats into level 50 stats', () => {
    expect(levelStats({ hp: 100, attack: 80, defense: 80, spirit: 80, speed: 60 })).toEqual({
      hp: 160,
      attack: 85,
      defense: 85,
      spirit: 85,
      speed: 65,
    });
  });

  it('catches every broken rule', () => {
    const bad: Creature = {
      ...STARTERS[0],
      types: ['brains', 'brains'],
      base: { hp: 140, attack: 30, defense: 30, spirit: 30, speed: 30 },
      moves: ['galaxy-brain', 'galaxy-brain', 'slam-dunk'],
    };
    const problems = validateCreature(bad).join('\n');
    expect(problems).toMatch(/add up to 260/);
    expect(problems).toMatch(/hp must be/);
    expect(problems).toMatch(/Two types must differ/);
    expect(problems).toMatch(/exactly 4 moves/);
    expect(problems).toMatch(/all differ/);
    expect(problems).toMatch(/At most 1 move with Power 100/);
    const noStab = { ...STARTERS[0], moves: ['slam-dunk', 'flex', 'headlock', 'shoulder-barge'] };
    expect(validateCreature(noStab).join()).toMatch(/must match one of its types/);
  });
});
