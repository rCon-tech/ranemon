import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEX } from '@/lib/battle/evolutions';
import { startBattle } from '@/lib/battle/engine';
import { creatureById } from '@/lib/battle/roster';
import { describeEvent } from '@/lib/ui/playback';
import { load, newGame, recruit, save, settleBattle } from '@/lib/story/state';
import { rollShiny, SHINY_ODDS, shinyChance, shinyForm, shinySprite } from '@/lib/story/shiny';
import {
  creatureOf,
  evolutionIn,
  expAt,
  gainExp,
  makeMember,
  nameOf,
  toEntrant,
} from '@/lib/story/party';

/** A fixed-seed Lehmer generator, so the rate check is the same every run. */
function lehmer(seed = 1) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

describe('shiny rate', () => {
  it('is 1 in 256 by default', () => {
    expect(SHINY_ODDS).toBe(256);
    expect(rollShiny(0)).toBe(true);
    expect(rollShiny(1 / 256 - 1e-9)).toBe(true);
    expect(rollShiny(1 / 256)).toBe(false);
    expect(rollShiny(0.5)).toBe(false);
  });

  it('comes up about 1 time in SHINY_ODDS', () => {
    const random = lehmer();
    const n = 256_000;
    let shinies = 0;
    for (let i = 0; i < n; i++) if (rollShiny(random())) shinies++;
    // Expect ~1000; ±15% is far outside random noise for a fair roll.
    expect(shinies).toBeGreaterThan(850);
    expect(shinies).toBeLessThan(1150);
  });

  it('stays rare over a playthrough: most players never see one', () => {
    // About 150 wild battles in a run.
    expect(shinyChance(150)).toBeCloseTo(0.443, 2);
    expect(shinyChance(150)).toBeLessThan(0.5);
    // Among 8 friends, one shiny between them is the usual outcome, not one each.
    expect(8 * shinyChance(150)).toBeLessThan(4);
    expect(shinyChance(1, 1)).toBe(1);
  });
});

describe('shiny Ranemon', () => {
  it('use the golden sprites and say so when they appear', () => {
    const c = shinyForm(creatureById('carlmon'));
    expect(c.shiny).toBe(true);
    expect(c.sprite).toBe('/sprites/shiny/bw/carlmon.png');
    expect(shinySprite('/sprites/evo/conix.png')).toBe('/sprites/shiny/evo/conix.png');
    const { state } = startBattle([[creatureById('enda')], [c]], 1);
    const view = state.teams.map((t) => ({ active: t.active })) as never;
    expect(
      describeEvent({ kind: 'send-out', side: 1, index: 0 }, state, view, { kind: 'wild' }),
    ).toBe('A shiny Carlmon appeared!');
  });

  it('have a golden sprite, and a golden head for following you, for every Ranemon', () => {
    for (const c of DEX) {
      const sprite = shinySprite(c.sprite!);
      expect(existsSync(`public${sprite}`), sprite).toBe(true);
      expect(existsSync(`public${sprite.replace(/\/([^/]+)$/, '/mini/$1')}`), sprite).toBe(true);
    }
  });

  it('keep their shine when befriended, evolved and saved', () => {
    const wild = { ...makeMember('conemon', 29, -1), shiny: true };
    const s = recruit(newGame(), 'enda', 5).state;
    const { state } = startBattle([s.party.map(toEntrant), [toEntrant(wild)]], 1);
    const caught = settleBattle(s, state, 'caught', [0], false).state;
    const friend = caught.party[1];
    expect(friend.shiny).toBe(true);
    expect(creatureOf(friend).sprite).toMatch(/^\/sprites\/shiny\//);

    const { member, lines } = gainExp(friend, expAt(30) - friend.exp);
    expect(member.species).toBe('conix');
    expect(member.shiny).toBe(true);
    expect(creatureOf(member).sprite).toBe('/sprites/shiny/evo/conix.png');
    expect(lines).toContain('★Conemon evolved into ★Conix!');
    const scene = evolutionIn('What? ★Conemon is evolving!');
    expect(scene?.from.shiny && scene.to.shiny).toBe(true);
    expect(evolutionIn('Conemon evolved into Conix!')?.to.shiny).toBeFalsy();

    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    save(storage, { ...caught, party: [caught.party[0], member] }, 'Rich');
    expect(load(storage, 'Rich')?.party[1].shiny).toBe(true);
    expect(nameOf(member)).toBe('★Conix');
  });

  it('a normal catch is not shiny, and saves from before shinies still load', () => {
    const s = recruit(newGame(), 'enda', 5).state;
    expect(s.party[0].shiny).toBeUndefined();
    expect(creatureOf(s.party[0]).shiny).toBeUndefined();
    // A save written before the shiny field existed.
    const old = JSON.stringify({ ...s, party: [{ ...makeMember('carlmon', 8, 1) }] });
    const loaded = load({ getItem: (k) => (k.endsWith(':rich') ? old : null) }, 'Rich');
    expect(loaded?.party[0].species).toBe('carlmon');
    expect(loaded?.party[0].shiny).toBeFalsy();
    expect(creatureOf(loaded!.party[0]).sprite).toBe('/sprites/bw/carlmon.png');
  });
});
