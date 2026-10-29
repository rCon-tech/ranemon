import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEX as IRISH_DEX, EVOLUTIONS } from '@/lib/battle/evolutions';
import { FOOTBALLER_MON } from '@/lib/battle/footballers';
import { LONDON } from '@/lib/battle/london';
import { ROSTER } from '@/lib/battle/roster';
import { UK } from '@/lib/battle/uk';
import { looksOf, storyKnowledge } from '@/lib/story/dex';
import { makeMember } from '@/lib/story/party';
import { parseSave } from '@/lib/story/save';
import { newGame, recruit, see } from '@/lib/story/state';
import { hasUkDex, UK_DEX, ukKnowledge } from '@/lib/story/ukdex';

const inLondon = { ...newGame(), map: 'london' };

describe('the UK Ranedex', () => {
  it('has every one of the lads, base and evolved, drawn, then London’s own and the legends’', () => {
    const ids = UK_DEX.map((c) => c.id);
    for (const r of ROSTER) expect(ids, r.id).toContain(r.id);
    for (const e of EVOLUTIONS) expect(ids, e.id).toContain(e.id);
    expect(ids).toContain('cholokill');
    for (const c of LONDON) expect(ids, c.id).toContain(c.id);
    expect(ids.slice(-FOOTBALLER_MON.length)).toEqual(FOOTBALLER_MON.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    // Each base form comes just before what it evolves into.
    for (const e of EVOLUTIONS) expect(ids.indexOf(e.id), e.id).toBe(ids.indexOf(e.from) + 1);
    for (const c of UK_DEX.slice(0, UK_DEX.length - LONDON.length - FOOTBALLER_MON.length)) {
      expect(c.variant, c.id).toBe(UK);
      expect(c.sprite, c.id).toBe(`/sprites/drawn/${c.id}.png`);
      expect(existsSync(`public${c.sprite}`), c.id).toBe(true);
    }
  });

  it('leaves Ireland’s Ranedex as it was, in photos', () => {
    for (const c of IRISH_DEX) expect(c.sprite ?? '', c.id).not.toMatch(/\/drawn\//);
    expect(IRISH_DEX.map((c) => c.id)).not.toContain(LONDON[0].id);
  });

  it('only shows the drawn look on a page, and its shiny', () => {
    const carl = UK_DEX.find((c) => c.id === 'carlmon')!;
    expect(looksOf(carl, false, true).map((l) => l.label)).toEqual(['UK']);
    expect(looksOf(carl, true, true).map((l) => l.creature.sprite)).toEqual([
      '/sprites/drawn/carlmon.png',
      '/sprites/shiny/drawn/carlmon.png',
    ]);
  });

  it('counts only what you’ve met in Britain', () => {
    const home = recruit(see(newGame(), 'carlmon'), 'carlmon', 10).state;
    expect(ukKnowledge(home).seen('carlmon')).toBe(false);
    expect(ukKnowledge(home).caught('carlmon')).toBe(false);
    expect(hasUkDex(home)).toBe(false);
    expect(storyKnowledge(home).caught('carlmon')).toBe(true);

    const away = { ...home, map: 'london' };
    const met = see(away, 'jammon');
    expect(ukKnowledge(met).seen('jammon')).toBe(true);
    expect(ukKnowledge(met).caught('jammon')).toBe(false);
    expect(hasUkDex(met)).toBe(true);
    const friend = recruit(met, 'jammon', 10, { variant: UK }).state;
    expect(ukKnowledge(friend).caught('jammon')).toBe(true);
    // Still in Ireland's, as before.
    expect(storyKnowledge(friend).seen('jammon')).toBe(true);
  });

  it('keeps what you’ve seen over there in the save', () => {
    const met = see(inLondon, 'owemon');
    expect(ukKnowledge(parseSave(JSON.stringify(met))!).seen('owemon')).toBe(true);
  });

  it('fills in from older saves: London’s own and the UK Ranemon you have', () => {
    const old = {
      ...newGame(),
      seen: [LONDON[0].id, 'carlmon'],
      caught: [LONDON[0].id, 'carlmon'],
      away: { party: [makeMember('conemon', 40, 1, UK)], box: [] },
    };
    const know = ukKnowledge(old);
    expect(know.seen(LONDON[0].id)).toBe(true);
    expect(know.caught(LONDON[0].id)).toBe(true);
    expect(know.caught('conix')).toBe(true);
    expect(know.seen('carlmon')).toBe(false);
  });

  it('only lists places in Britain under where it’s found', () => {
    const know = ukKnowledge(inLondon);
    expect(know.where!('london')).toBe(true);
    expect(know.where!('clare')).toBe(false);
  });
});
