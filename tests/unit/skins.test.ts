import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STYLES } from '@/components/story/people';
import { ARCADE_KING } from '@/content/story/brighton';
import { BRIGHTON_DONE } from '@/content/story/enda';
import { RENT_DONE } from '@/content/story/rent';
import { NORM_RETURNED, SIBEAL_PUB } from '@/content/story/sibeal';
import {
  DEFAULT_SKIN,
  hasSkin,
  lookOf,
  newSkins,
  SKINS,
  skinById,
  unlockSkins,
  wearing,
  wearSkin,
} from '@/content/story/skins';
import { TRAINERS } from '@/content/story/trainers';
import { DEX } from '@/lib/battle/evolutions';
import { devSave, storyFlags } from '@/lib/story/devsave';
import { exportCode, importCode, migrate, parseSave, SCHEMA } from '@/lib/story/save';
import { beatFlag, newGame, setFlag, type StoryState } from '@/lib/story/state';

const LATE = readFileSync('tests/fixtures/saves/main-late.json', 'utf8');

const withFlags = (...flags: string[]): StoryState => flags.reduce(setFlag, newGame());

describe('the skins', () => {
  it('are each one of the overworld’s people, once, with a way to earn them', () => {
    const ids = SKINS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(DEFAULT_SKIN);
    for (const k of SKINS) {
      expect(STYLES[k.id], k.id).toBeDefined();
      if (k.id === DEFAULT_SKIN) continue;
      expect(k.unlock.length, k.id).toBeGreaterThan(0);
      expect(k.hint, k.id).not.toBe('');
    }
  });

  it('only ask for flags the game can set', () => {
    const settable = new Set([
      ...storyFlags(),
      ...TRAINERS.map((t) => beatFlag(t.id)),
      ...DEX.map((c) => `caught:${c.id}`),
      'champion',
    ]);
    for (const k of SKINS) for (const f of k.unlock) expect(settable, `${k.id}: ${f}`).toContain(f);
  });

  it('find the trainers who wear a look in the maps', () => {
    expect(wearing('raver').length + wearing('clubber').length + wearing('shuffler').length).toBe(
      9,
    );
    expect(skinById('dj')!.unlock).toHaveLength(9);
    expect(wearing('scholar')).toEqual(['scholar-1', 'scholar-2', 'scholar-3']);
    expect(wearing('fan').length).toBeGreaterThan(0);
    expect(wearing('mam')).toEqual([]);
  });
});

describe('earning a skin', () => {
  it('starts with only the usual look', () => {
    const g = newGame();
    expect(newSkins(g)).toEqual([]);
    expect(SKINS.filter((k) => hasSkin(g, k)).map((k) => k.id)).toEqual([DEFAULT_SKIN]);
    expect(lookOf(g)).toBe('player');
  });

  it('comes from beating a boss, once, with a line to say so', () => {
    const g = withFlags(beatFlag(ARCADE_KING));
    const first = unlockSkins(g);
    expect(first.state.skins).toEqual(['king']);
    expect(first.lines).toEqual([
      'You unlocked the Arcade King skin! Wear it from SKINS on the START menu.',
    ]);
    expect(unlockSkins(first.state)).toEqual({ state: first.state, lines: [] });
  });

  it('comes from finishing a side quest', () => {
    expect(unlockSkins(withFlags(BRIGHTON_DONE)).state.skins).toEqual(['enda']);
    const yes = SIBEAL_PUB.find((s) => s.do === 'ask');
    expect(yes && 'yes' in yes && yes.yes).toContainEqual({ do: 'flag', flag: NORM_RETURNED });
    expect(unlockSkins(withFlags(NORM_RETURNED)).state.skins).toEqual(['sibeal']);
  });

  it('gives the rent house’s people for the rent, and Alex Simonin still for Trinity', () => {
    expect(unlockSkins(withFlags(RENT_DONE)).state.skins).toEqual(['ollie', 'mc', 'melchior']);
    expect(skinById('simo')).toBeUndefined();
    expect(skinById('alex')!.unlock).toEqual([beatFlag('trinity-alex')]);
  });

  it('needs every trainer in a look beaten when a skin is for all of them', () => {
    const [a, ...rest] = wearing('scholar');
    expect(unlockSkins(withFlags(beatFlag(a))).state.skins).toEqual([]);
    const all = withFlags(...[a, ...rest].map(beatFlag));
    expect(unlockSkins(all).state.skins).toEqual(['scholar']);
  });
});

describe('wearing a skin', () => {
  const g = unlockSkins(withFlags(BRIGHTON_DONE)).state;

  it('changes your look, and only to one you have', () => {
    expect(lookOf(wearSkin(g, 'enda'))).toBe('enda');
    expect(wearSkin(g, 'king')).toBe(g);
    expect(wearSkin(g, 'nobody')).toBe(g);
    const back = wearSkin(wearSkin(g, 'enda'), DEFAULT_SKIN);
    expect(back.skin).toBeUndefined();
    expect(lookOf(back)).toBe('player');
  });

  it('falls back to the usual look for a skin this build doesn’t know or you don’t have', () => {
    expect(lookOf({ skin: 'someone-new', skins: ['someone-new'] })).toBe('player');
    expect(lookOf({ skin: 'king', skins: [] })).toBe('player');
  });
});

describe('skins in saves', () => {
  it('are kept through a save, a save code and a reload', () => {
    const g = wearSkin(unlockSkins(withFlags(BRIGHTON_DONE)).state, 'enda');
    const back = parseSave(JSON.stringify(g))!;
    expect(back.skins).toEqual(['enda']);
    expect(back.skin).toBe('enda');
    const code = importCode(exportCode(g));
    expect('state' in code && code.state.skin).toBe('enda');
  });

  it('are given to older saves for everyone already beaten, without a word', () => {
    const old = JSON.parse(LATE);
    const s = migrate({ ...old, schema: 3, flags: [...old.flags, 'beat:bns', BRIGHTON_DONE] })!;
    expect(s.schema).toBe(SCHEMA);
    expect(s.skins).toEqual(expect.arrayContaining(['bns', 'enda']));
    expect(newSkins(s).map((k) => k.id)).not.toContain('bns');
    expect(lookOf(s)).toBe('player');
  });

  it('keep a skin from a newer build, drawn as the usual look', () => {
    const s = migrate({ ...JSON.parse(LATE), skins: ['someone-new'], skin: 'someone-new' })!;
    expect(s.skins).toEqual(['someone-new']);
    expect(s.skin).toBe('someone-new');
    expect(lookOf(s)).toBe('player');
  });

  it('are all in the developer save', () => {
    const g = devSave();
    for (const k of SKINS) expect(hasSkin(g, k), k.id).toBe(true);
  });
});
