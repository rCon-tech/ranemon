import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mapById } from '@/content/story/maps';
import { SHOREDITCH } from '@/content/story/shoreditch';
import { trainerById } from '@/content/story/trainers';
import { STAT_KEYS, validateCreature } from '@/lib/battle/creature';
import { playTurn, startBattle } from '@/lib/battle/engine';
import { DEX, evolutionOf, formAt, formById, lineOf, reachedAt } from '@/lib/battle/evolutions';
import { LONDON, LONDON_BUDGETS, LONDON_ITEM_EVOLUTIONS, LONDON_LINES } from '@/lib/battle/london';
import { moveById } from '@/lib/battle/moves';
import { ROSTER } from '@/lib/battle/roster';
import { validateTeam } from '@/lib/online/rules';
import { evolutionLine, habitats } from '@/lib/story/dex';
import { canUseOn, itemById } from '@/lib/story/items';
import {
  evolutionIn,
  expAt,
  gainExp,
  itemEvolve,
  makeMember,
  speciesById,
} from '@/lib/story/party';

const PUBLIC = join(__dirname, '../../public');

describe('the London Ranedex, batch 1', () => {
  it('has 36 Ranemon, each with its own id and name', () => {
    expect(LONDON).toHaveLength(36);
    const all = [...DEX, ...LONDON];
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    expect(new Set(all.map((c) => c.name)).size).toBe(all.length);
    expect(LONDON_LINES).toHaveLength(13);
  });

  it('meets every card rule at its own stage’s budget', () => {
    for (const c of LONDON) {
      const budget = LONDON_BUDGETS.get(c.id)!;
      expect(budget, c.id).toBeDefined();
      // A line's special move belongs to its first form; a branch has its own.
      const owner = LONDON_ITEM_EVOLUTIONS.some((e) => e.id === c.id) ? c.id : lineOf(c.id);
      expect(validateCreature({ ...c, id: owner }, budget), c.id).toEqual([]);
    }
  });

  it('grows every stat from stage to stage, keeping the line’s moves', () => {
    for (const c of LONDON) {
      const evo = evolutionOf(c.id);
      if (!evo) continue;
      const next = formById(evo.id);
      expect(next.moves).toEqual(c.moves);
      for (const k of STAT_KEYS) expect(next.base[k], `${next.id} ${k}`).toBeGreaterThan(c.base[k]);
    }
  });

  it('has a drawing, a mini and their shiny versions for every one', () => {
    for (const c of LONDON) {
      expect(c.sprite).toBe(`/sprites/london/${c.id}.png`);
      for (const path of [
        `sprites/london/${c.id}.png`,
        `sprites/london/mini/${c.id}.png`,
        `sprites/shiny/london/${c.id}.png`,
        `sprites/shiny/london/mini/${c.id}.png`,
      ])
        expect(existsSync(join(PUBLIC, path)), path).toBe(true);
    }
  });
});

describe('lines that evolve twice', () => {
  it('evolves Oystermon at 14 and Golpeak at 32', () => {
    expect(formAt('oystermon', 13)).toBe('oystermon');
    expect(formAt('oystermon', 14)).toBe('golpeak');
    expect(formAt('oystermon', 40)).toBe('crowdbat');
    expect(lineOf('crowdbat')).toBe('oystermon');
    expect(reachedAt('crowdbat')).toBe(32);
    expect(makeMember('oystermon', 40, 1).species).toBe('crowdbat');

    const m = makeMember('oystermon', 13, 1);
    const { member, lines } = gainExp(m, expAt(14) - m.exp);
    expect(member.species).toBe('golpeak');
    expect(lines).toContain('Oystermon evolved into Golpeak!');
    const next = gainExp(member, expAt(32) - member.exp);
    expect(next.member.species).toBe('crowdbat');
    expect(evolutionIn('What? Golpeak is evolving!', [next.member])?.to.id).toBe('crowdbat');
  });

  it('shows the whole line in the Ranedex, and where each stage is found', () => {
    const line = evolutionLine('golpeak');
    expect(line.first.id).toBe('oystermon');
    expect(line.branches.map((b) => [b.creature.id, b.how])).toEqual([
      ['golpeak', 'Lv14'],
      ['crowdbat', 'Golpeak at Lv32'],
    ]);
    expect(habitats('oystermon').find((h) => h.map === 'shoreditch')).toMatchObject({
      min: 5,
      max: 12,
    });
    expect(habitats('crowdbat')).toEqual([]);
  });

  it('turns away an online team with a form it can’t have reached yet', () => {
    const crowdbat = { ...makeMember('oystermon', 40, 1), level: 20 };
    expect(validateTeam([crowdbat])).toEqual({ error: 'Crowdbat can’t have evolved by Lv20.' });
    expect('team' in validateTeam([makeMember('oystermon', 40, 1)])).toBe(true);
  });
});

describe('Wickmon', () => {
  it('becomes one of five Ranemon, by what it’s given', () => {
    const into = {
      'disposable-vape': 'vapeoreon',
      'espresso-tamper': 'espresseon',
      'afterparty-wristband': 'rumbreon',
      'spareroom-listing': 'flatshareon',
      'hardware-wallet': 'joltcoin',
    } as const;
    for (const [item, id] of Object.entries(into)) {
      const wick = makeMember('wickmon', 15, 1);
      expect(canUseOn(itemById(item as keyof typeof into), wick)).toBe(true);
      const { member, lines } = itemEvolve(wick, item);
      expect(member.species).toBe(id);
      const special = formById(id).moves[0];
      expect(moveById(special).signature).toBe(id);
      expect(member.moves).toContain(special);
      expect(member.moves).not.toContain('bin-rota');
      expect(evolutionIn(lines[0], [member])?.to.id).toBe(id);
      expect(speciesById(id).types).toEqual([moveById(special).type]);
    }
    expect(evolutionLine('wickmon').branches).toHaveLength(5);
  });

  it('finds every one of its items in Shoreditch & Hackney', () => {
    const steps = JSON.stringify([
      SHOREDITCH.npcs,
      ...['shoreditch-raver', 'shoreditch-founder'].map((t) => trainerById(t).reward),
    ]);
    for (const e of LONDON_ITEM_EVOLUTIONS) expect(steps).toContain(`"item":"${e.item}"`);
  });
});

describe('Rush Hour', () => {
  it('hits once for every Ranemon on the team still standing', () => {
    const oyster = formById('oystermon');
    const foe = { ...formById('jabmon'), base: { ...formById('jabmon').base, hp: 130 } };
    for (const team of [1, 3]) {
      const mine = [oyster, ...ROSTER.slice(0, team - 1)];
      const { state } = startBattle([mine, [foe]], 7);
      const { events } = playTurn(state, [
        { kind: 'move', index: oyster.moves.indexOf('rush-hour') },
        { kind: 'move', index: 3 },
      ]);
      const hits = events.filter((e) => e.kind === 'damage' && e.side === 1).length;
      expect(hits, `${team} on the team`).toBe(team);
    }
  });
});

describe('Shoreditch & Hackney', () => {
  it('is reached by the Overground from Liverpool Street, and back', () => {
    const steps = JSON.stringify(mapById('london').npcs);
    expect(steps).toContain('"map":"shoreditch"');
    expect(JSON.stringify(SHOREDITCH.npcs)).toContain('"map":"london"');
    expect(SHOREDITCH.flat).toBe(true);
    expect(SHOREDITCH.uk).toBe(true);
  });

  it('is full of London Ranemon at Lv5 to 12, Aerodactivist one time in a hundred', () => {
    expect(SHOREDITCH.wild).toMatchObject({ min: 5, max: 12 });
    const table = SHOREDITCH.wild!.table;
    for (const [s] of table) expect(LONDON_LINES).toContain(s);
    const total = table.reduce((sum, [, w]) => sum + w, 0);
    expect(table.find(([s]) => s === 'aerodactivist')![1] / total).toBe(0.01);
  });

  it('has London’s own early Ranemon in the hub too, and a few of the lads', () => {
    const table = mapById('london').wild!.table.map(([s]) => s);
    expect(table).toEqual(
      expect.arrayContaining(['oystermon', 'speedmon', 'pedalmon', 'skatemon']),
    );
    expect(table).toEqual(expect.arrayContaining(['simomon', 'enda']));
  });
});
