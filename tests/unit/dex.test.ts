import { describe, expect, it } from 'vitest';
import { DEX, formById } from '@/lib/battle/evolutions';
import { PETCHEMON } from '@/lib/battle/petchemon';
import { secondSpecialOf, SECOND_SPECIAL_LEVEL } from '@/lib/battle/second-specials';
import {
  dexMoves,
  evolutionLine,
  habitats,
  KNOW_ALL,
  looksOf,
  matchups,
  storyKnowledge,
  strongAgainst,
} from '@/lib/story/dex';
import { makeMember } from '@/lib/story/party';
import { newGame } from '@/lib/story/state';
import { moveById } from '@/lib/battle/moves';

describe('Ranedex pages', () => {
  it('Petchemon still has no page', () => {
    expect(DEX.some((c) => c.id === PETCHEMON.id)).toBe(false);
  });

  it('a story save knows only what it has come across', () => {
    const game = { ...newGame(), seen: ['enda', 'clefenda'], caught: ['enda'] };
    const know = storyKnowledge(game);
    expect(know.seen('enda')).toBe(true);
    expect(know.seen('carlmon')).toBe(false);
    expect(know.caught('clefenda')).toBe(false);
    expect(know.visited!('clare')).toBe(false);
  });

  it('hides the second special move until a Ranemon of the line has learnt it', () => {
    const late = secondSpecialOf('olliemon')!;
    const before = storyKnowledge({ ...newGame(), party: [makeMember('olliemon', 20, 1)] });
    const row = (know: typeof before) =>
      dexMoves(formById('olliemon'), know).find((m) => m.move.id === late.id)!;
    expect(row(before)).toMatchObject({ hidden: true, level: SECOND_SPECIAL_LEVEL });
    const after = storyKnowledge({
      ...newGame(),
      party: [makeMember('hitmonollie', SECOND_SPECIAL_LEVEL, 1)],
    });
    expect(row(after).hidden).toBe(false);
    expect(row(KNOW_ALL).hidden).toBe(false);
  });

  it('shows how each form of a line is reached', () => {
    const killemon = evolutionLine('cholokill');
    expect(killemon.first.id).toBe('killemon');
    expect(killemon.branches.map((b) => [b.creature.id, b.how])).toEqual([
      ['killigatr', 'Lv30'],
      ['cholokill', 'Given a Flannel Shirt'],
    ]);
    expect(evolutionLine('crampemon').branches[0].how).toBe('Lv30 with a Thilomon in the party');
    expect(evolutionLine('tobymon').branches).toEqual([]);
  });

  it('finds a form only where its line is in the grass at its levels', () => {
    const enda = habitats('enda');
    expect(enda.some((h) => h.map === 'clare')).toBe(true);
    for (const h of enda) expect(h.max).toBeLessThan(30);
    for (const h of habitats('clefenda')) expect(h.min).toBeGreaterThanOrEqual(30);
    expect(habitats('cholokill')).toEqual([]);
    expect(habitats('tobymon')).toEqual([]);
  });

  it('flips through every look, and the shiny ones only when allowed', () => {
    const ollie = formById('olliemon');
    expect(looksOf(ollie, false).map((l) => l.label)).toEqual(['Classic', 'Tricolour']);
    const all = looksOf(ollie, true);
    expect(all).toHaveLength(4);
    expect(all[3].creature).toMatchObject({ shiny: true, variant: 'tricolour' });
  });

  it('says what a move and a Ranemon are strong and weak against', () => {
    expect(strongAgainst(moveById(formById('carlmon').moves[0])).length).toBeLessThanOrEqual(3);
    expect(matchups(['brains'])).toEqual({
      weak: ['chill', 'hype', 'graft'],
      resists: ['brains', 'brawn', 'posh'],
    });
  });
});
