import { describe, expect, it } from 'vitest';
import { STAT_KEYS, validateCreature } from '@/lib/battle/creature';
import { playTurn, startBattle } from '@/lib/battle/engine';
import {
  DEX,
  EVOLUTIONS,
  EVOLVED,
  EVOLVED_BUDGET,
  evolvedStats,
  formAt,
  formById,
  ITEM_EVOLUTIONS,
  lineOf,
} from '@/lib/battle/evolutions';
import { ROSTER } from '@/lib/battle/roster';
import { blueGhost, catchRate, expAt, gainExp, makeMember, statsOf } from '@/lib/story/party';
import { recruit, newGame } from '@/lib/story/state';

describe('evolutions', () => {
  it('gives every Ranemon exactly one evolution with its own name', () => {
    expect(EVOLUTIONS.map((e) => e.from).sort()).toEqual(ROSTER.map((c) => c.id).sort());
    const names = new Set([...ROSTER, ...EVOLVED].map((c) => c.name));
    expect(names.size).toBe(ROSTER.length * 2);
    // Plus the item evolutions, Petchemon and the one legend, who never evolve.
    expect(DEX).toHaveLength(ROSTER.length * 2 + ITEM_EVOLUTIONS.length + 2);
  });

  it('keeps types and moves, and grows the stat budget', () => {
    for (const e of EVOLVED) {
      const from = formById(lineOf(e.id));
      expect(e.types).toEqual(from.types);
      expect(e.moves).toEqual(from.moves);
      expect(STAT_KEYS.reduce((sum, k) => sum + e.base[k], 0)).toBe(EVOLVED_BUDGET);
      for (const k of STAT_KEYS) expect(e.base[k]).toBeGreaterThanOrEqual(from.base[k]);
    }
  });

  it('evolves on the level-up to 30, keeping the HP lost', () => {
    const m = { ...makeMember('conemon', 29, 1), hp: 50 };
    const before = statsOf(m).hp;
    const { member, lines } = gainExp(m, expAt(30) - m.exp);
    expect(member.species).toBe('conix');
    expect(lines).toContain('Conemon evolved into Conix!');
    expect(statsOf(member).hp - member.hp).toBe(before - 50);
    expect(blueGhost(makeMember('enda', 29, 2)).member.species).toBe('clefenda');
  });

  it('meets wild and trainer Ranemon already evolved from level 30', () => {
    expect(makeMember('owemon', 29, 1).species).toBe('owemon');
    expect(makeMember('owemon', 30, 1).species).toBe('fearowe');
    expect(formAt('fearowe', 50)).toBe('fearowe');
    expect(catchRate('fearowe')).toBeLessThan(catchRate('owemon'));
    const { state } = recruit(newGame(), 'owemon', 31);
    expect(state.caught).toEqual(['fearowe']);
  });

  it('lets Helping Hand tag an evolved partner', () => {
    const ois = makeMember('oismon', 35, 1);
    const ollie = makeMember('olliemon', 35, 2);
    expect(ollie.species).toBe('hitmonollie');
    const { state } = startBattle(
      [[formById(ois.species), formById(ollie.species)], [formById('simomon')]],
      1,
    );
    const hand = state.teams[0].battlers[0].creature.moves.indexOf('helping-hand-ois');
    const next = playTurn(state, [
      { kind: 'move', index: hand },
      { kind: 'move', index: 0 },
    ]);
    const team = next.state.teams[0];
    expect(team.battlers[team.active].creature.id).toBe('hitmonollie');
    expect(team.battlers).toHaveLength(2);
  });
});

describe('budgets for the London stages', () => {
  it('scales a base form to any budget, keeping its shape', () => {
    const carl = ROSTER.find((c) => c.id === 'carlmon')!;
    for (const budget of [320, 440, 470, 490]) {
      const stats = evolvedStats(carl.base, budget);
      expect(STAT_KEYS.reduce((sum, k) => sum + stats[k], 0)).toBe(budget);
      expect(stats.speed).toBe(Math.max(...STAT_KEYS.map((k) => stats[k])));
    }
  });

  it('checks a card against its own stage’s budget', () => {
    const carl = ROSTER.find((c) => c.id === 'carlmon')!;
    const small = { ...carl, base: evolvedStats(carl.base, 320) };
    expect(validateCreature(small, 320)).toEqual([]);
    expect(validateCreature(small).join()).toMatch(/add up to 320, not 400/);
  });
});
