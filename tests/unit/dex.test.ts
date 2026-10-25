import { describe, expect, it } from 'vitest';
import { INTERIORS, MAPS } from '@/content/story/maps';
import { TRAINERS } from '@/content/story/trainers';
import { DEX, EVOLVED, formById, ITEM_EVOLVED } from '@/lib/battle/evolutions';
import { LEGEND } from '@/lib/battle/legend';
import { LONDON } from '@/lib/battle/london';
import { PETCHEMON } from '@/lib/battle/petchemon';
import { ROSTER } from '@/lib/battle/roster';
import { secondSpecialOf, SECOND_SPECIAL_LEVEL } from '@/lib/battle/second-specials';
import { TYPES } from '@/lib/battle/types';
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
import { recruits } from '@/lib/story/devsave';
import { makeMember } from '@/lib/story/party';
import { newGame, recruit } from '@/lib/story/state';
import { UK_DEX } from '@/lib/story/ukdex';
import { moveById } from '@/lib/battle/moves';

describe('Ranedex pages', () => {
  it('gives Petchemon a page, between the lads and the legend', () => {
    expect(DEX.map((c) => c.id).slice(-2)).toEqual([PETCHEMON.id, LEGEND.id]);
    expect(evolutionLine(PETCHEMON.id)).toEqual({ first: PETCHEMON, branches: [] });
    expect(habitats(PETCHEMON.id)).toEqual([]);
    // Beating B&S befriends him, so his page is filled in.
    const game = recruit(newGame(), PETCHEMON.id, 55).state;
    expect(storyKnowledge(game).caught(PETCHEMON.id)).toBe(true);
  });

  it('has a page, with types and an entry, for every Ranemon you can have', () => {
    // Every kind that turns up in the grass, in a script's wild battle or as a gift, and every
    // form any of them can become.
    const met = new Set<string>([...recruits()]);
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (o.do === 'wild' && typeof o.species === 'string') met.add(o.species);
        Object.values(o).forEach(walk);
      }
    };
    walk([MAPS, INTERIORS, TRAINERS]);
    for (const m of [...MAPS, ...INTERIORS]) for (const [s] of m.wild?.table ?? []) met.add(s);
    for (const c of [...ROSTER, ...EVOLVED, ...ITEM_EVOLVED, ...LONDON]) met.add(c.id);

    const pages = new Map([...DEX, ...UK_DEX].map((c) => [c.id, c]));
    for (const id of met) {
      const c = pages.get(id);
      expect(c, `${id} has no Ranedex page`).toBeDefined();
      expect(c!.types.length, `${id} has no type`).toBeGreaterThan(0);
      expect(c!.types.length, id).toBeLessThanOrEqual(2);
      expect(new Set(c!.types).size, id).toBe(c!.types.length);
      for (const t of c!.types) expect(TYPES, id).toContain(t);
      expect(c!.entry.trim(), `${id} has no Ranedex entry`).not.toBe('');
    }
    // Every page in either Ranedex, UK forms included, has them too.
    for (const c of pages.values()) {
      expect(c.types.length, c.id).toBeGreaterThan(0);
      expect(c.entry?.trim(), c.id).toBeTruthy();
    }
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
