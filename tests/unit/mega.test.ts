import { describe, expect, it } from 'vitest';
import { STAT_KEYS } from '@/lib/battle/creature';
import { chooseAction } from '@/lib/battle/cpu';
import { canMegaEvolve, playTurn, startBattle, type Entrant } from '@/lib/battle/engine';
import { MEGA_BOOST, MEGAS, megaForm, megaSprite, megaStats } from '@/lib/battle/mega';
import { speciesById as creatureById } from '@/lib/story/party';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const entrant = (id: string, mega = false): Entrant => ({
  creature: creatureById(id),
  level: 60,
  ...(mega && { mega: true }),
});

describe('Mega forms', () => {
  it('belong to evolved Ranemon that exist, each with a sprite for every look', () => {
    for (const id of Object.keys(MEGAS)) {
      const c = creatureById(id);
      const m = megaForm(c)!;
      expect(m.name).toBe(`Mega ${c.name}`);
      expect(m.mega).toBe(true);
      expect(existsSync(resolve('public', `.${m.sprite}`)), m.sprite).toBe(true);
      expect(
        existsSync(resolve('public', `.${m.sprite!.replace('/sprites/', '/sprites/shiny/')}`)),
      ).toBe(true);
    }
  });

  it('keep HP and add MEGA_BOOST to the rest, most of it to their focus', () => {
    for (const [id, { focus }] of Object.entries(MEGAS)) {
      const base = creatureById(id).base;
      const mega = megaStats(base, focus);
      expect(mega.hp).toBe(base.hp);
      const gain = STAT_KEYS.reduce((sum, k) => sum + mega[k] - base[k], 0);
      expect(gain).toBe(MEGA_BOOST);
      for (const k of STAT_KEYS)
        expect(mega[k] - base[k]).toBeLessThanOrEqual(mega[focus] - base[focus]);
    }
  });

  it('don’t Mega evolve twice, or from a Ranemon without one', () => {
    expect(megaForm(megaForm(creatureById('carlizard'))!)).toBeUndefined();
    expect(megaForm(creatureById('gibbsmon'))).toBeUndefined();
  });

  it('keep the look and shininess of the sprite', () => {
    expect(megaSprite('/sprites/evo/carlizard-tache.png')).toBe(
      '/sprites/mega/carlizard-tache.png',
    );
    expect(megaSprite('/sprites/shiny/bw/cholokill.png')).toBe('/sprites/shiny/mega/cholokill.png');
    expect(megaSprite('/sprites/drawn/conix.png')).toBe('/sprites/drawn/mega/conix.png');
    expect(megaSprite('/sprites/shiny/drawn/lorchu.png')).toBe(
      '/sprites/shiny/drawn/mega/lorchu.png',
    );
  });
});

describe('Mega Evolution in battle', () => {
  it('only works for a side with a Mega Ring, on a Ranemon that has a Mega form', () => {
    const { state } = startBattle([[entrant('carlizard', true)], [entrant('carlizard')]], 1);
    expect(canMegaEvolve(state, 0)).toBe(true);
    expect(canMegaEvolve(state, 1)).toBe(false);
    const plain = startBattle([[entrant('gibbsmon', true)], [entrant('carlizard')]], 1).state;
    expect(canMegaEvolve(plain, 0)).toBe(false);
  });

  it('happens before anyone moves, keeps HP, and lasts the battle, once a side', () => {
    const team = [entrant('carlizard', true), entrant('conix', true)];
    const { state } = startBattle([team, [entrant('gibbsmon'), entrant('gibbsmon')]], 3);
    const before = state.teams[0].battlers[0];
    const { state: after, events } = playTurn(state, [
      { kind: 'move', index: 0, mega: true },
      { kind: 'move', index: 0 },
    ]);
    expect(events[0]).toEqual({ kind: 'mega', side: 0, index: 0 });
    const b = after.teams[0].battlers[0];
    expect(b.creature.name).toBe('Mega Carlizard');
    expect(b.stats.hp).toBe(before.stats.hp);
    expect(b.stats.spirit).toBeGreaterThan(before.stats.spirit);
    expect(after.teams[0].megaUsed).toBe(true);
    expect(canMegaEvolve(after, 0)).toBe(false);
  });

  it('is used by a CPU trainer whose ace can', () => {
    const { state } = startBattle([[entrant('gibbsmon')], [entrant('lorchu', true)]], 5);
    const action = chooseAction(state, 1, 'hard', () => 0.5);
    expect(action).toMatchObject({ kind: 'move', mega: true });
  });
});
