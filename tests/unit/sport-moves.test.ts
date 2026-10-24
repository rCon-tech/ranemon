import { describe, expect, it } from 'vitest';
import { EVOLUTIONS, formById } from '@/lib/battle/evolutions';
import { LONDON_EVOLUTIONS, LONDON_LINES } from '@/lib/battle/london';
import { moveById, MOVES } from '@/lib/battle/moves';
import { ROSTER } from '@/lib/battle/roster';
import { SPORT_MOVES } from '@/lib/battle/sports';
import { TYPES } from '@/lib/battle/types';
import { LEARNSETS, MOVE_SLOTS, SPORT_LEVELS } from '@/lib/story/learnsets';
import {
  catchUp,
  fightingMoves,
  gainExp,
  learnedOf,
  makeMember,
  movesAt,
  speciesById,
  swapMove,
  expAt,
  type Member,
} from '@/lib/story/party';

describe('sport moves', () => {
  it('adds 54 new moves, 6 per sport, every type covered, no clashes', () => {
    expect(SPORT_MOVES).toHaveLength(54);
    const ids = new Set([...MOVES, ...SPORT_MOVES].map((m) => m.id));
    expect(ids.size).toBe(MOVES.length + SPORT_MOVES.length);
    for (const t of TYPES) {
      const own = SPORT_MOVES.filter((m) => m.type === t);
      expect(own.length, t).toBeGreaterThanOrEqual(4);
      expect(
        own.some((m) => m.power >= 85),
        `${t} has a strong attack`,
      ).toBe(true);
    }
    for (const m of SPORT_MOVES) {
      expect(m.category === 'status', m.id).toBe(m.power === 0);
      expect(m.signature).toBeUndefined();
      expect(moveById(m.id)).toBe(m);
    }
  });

  it('gives every line 6 of them, each its own type’s strong attack, and uses every one', () => {
    const lines = [...ROSTER, ...LONDON_LINES.map(formById)];
    expect(Object.keys(LEARNSETS).sort()).toEqual(lines.map((c) => c.id).sort());
    const used = new Set<string>();
    for (const c of lines) {
      const set = LEARNSETS[c.id];
      expect(set).toHaveLength(SPORT_LEVELS.length);
      expect(new Set(set).size).toBe(set.length);
      for (const id of set) {
        expect(c.moves, `${c.id} already knows ${id}`).not.toContain(id);
        used.add(id);
      }
      expect(
        set.some((id) => c.types.includes(moveById(id).type!) && moveById(id).power >= 85),
        c.id,
      ).toBe(true);
    }
    expect(used.size).toBe(SPORT_MOVES.length);
  });

  it('teaches evolved forms their line’s moves', () => {
    for (const e of [...EVOLUTIONS, ...LONDON_EVOLUTIONS]) {
      expect(movesAt(speciesById(e.id), 50)).toEqual(movesAt(speciesById(e.from), 50));
    }
  });
});

describe('4 moves at a time', () => {
  it('fights with its special moves and the latest it has learnt', () => {
    const m = makeMember('carlmon', 50, 1);
    expect(learnedOf(m)).toHaveLength(11);
    expect(m.moves).toHaveLength(MOVE_SLOTS);
    expect(m.moves).toEqual(expect.arrayContaining(['nozzy-call', 'fossil-record']));
    expect(m.moves).toEqual(expect.arrayContaining(['rage-quit', 'lights-out']));
    expect(m.pp).toHaveLength(MOVE_SLOTS);
    expect(fightingMoves(movesAt(speciesById('carlmon'), 5))).toHaveLength(2);
  });

  it('keeps a move learnt with 4 slots full until you swap it in', () => {
    const m = makeMember('carlmon', 15, 1);
    expect(m.moves).toHaveLength(4);
    const { member, lines } = gainExp(m, expAt(16) - m.exp);
    expect(lines).toContain('Carlmon learned Scrum Down! Swap it in from PARTY.');
    expect(member.moves).toEqual(m.moves);
    expect(learnedOf(member)).toContain('scrum-down');

    const swapped = swapMove(member, 0, 'scrum-down');
    expect(swapped.moves[0]).toBe('scrum-down');
    expect(swapped.pp[0]).toBe(moveById('scrum-down').pp);
    expect(learnedOf(swapped)).toContain(m.moves[0]);
    // Only moves it has learnt, and not one it already has in a slot.
    expect(swapMove(member, 0, 'hole-in-one')).toBe(member);
    expect(swapMove(swapped, 1, 'scrum-down')).toBe(swapped);
  });

  it('brings old saves up to date without going over 4', () => {
    const old: Member = {
      uid: 1,
      species: 'carlizard',
      level: 40,
      exp: expAt(40),
      hp: 10,
      pp: [20, 10, 10, 10],
      status: null,
      moves: ['headlock', 'nozzy-call', 'shopping-trolley', 'mosh-pit'],
    };
    const now = catchUp(old);
    expect(now.moves).toEqual(old.moves);
    expect(learnedOf(now)).toEqual(
      expect.arrayContaining(['fore', 'scrum-down', 'drs', 'top-bins']),
    );
    expect(learnedOf(now)).not.toContain('rage-quit');
    expect(catchUp(now)).toBe(now);
  });
});
