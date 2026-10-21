import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEX, evolutionOf, formById, lineOf } from '@/lib/battle/evolutions';
import { moveById } from '@/lib/battle/moves';
import { creatureById } from '@/lib/battle/roster';
import { MAPS } from '@/content/story/maps';
import { TRAINERS } from '@/content/story/trainers';
import { canUseOn, itemById, shopStock } from '@/lib/story/items';
import {
  evolutionIn,
  expAt,
  gainExp,
  itemEvolve,
  makeMember,
  speciesById,
  statsOf,
} from '@/lib/story/party';

const NEW = [
  ['paulimon', 'pauliwrath', 'hat-trick'],
  ['skehemon', 'skehdinja', 'not-impressed'],
  ['vinnimon', 'vinnisaur', 'prost'],
  ['crampemon', 'crampharos', 'calf-cramp'],
] as const;

describe('Paulimon, Skehemon, Vinnimon and Crampemon', () => {
  it.each(NEW)('%s joins the roster with his own move and evolution', (id, evo, move) => {
    const c = creatureById(id);
    expect(c.moves[0]).toBe(move);
    expect(moveById(move).signature).toBe(id);
    expect(evolutionOf(id)?.id).toBe(evo);
    expect(formById(evo).types).toEqual(c.types);
    for (const path of [c.sprite, formById(evo).sprite])
      expect(existsSync(`public${path}`)).toBe(true);
    expect(DEX.map((d) => d.id)).toEqual(expect.arrayContaining([id, evo]));
  });

  it.each(NEW)('%s can be met in the wild', (id) => {
    const maps = MAPS.filter((m) => m.wild?.table.some(([s]) => s === id));
    expect(maps.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Petchemon', () => {
  it('is only on B&S’s teams, and never in the Ranedex', () => {
    const p = speciesById('petchemon');
    expect(moveById(p.moves[0]).signature).toBe('petchemon');
    const has = TRAINERS.filter((t) => t.team.some(([s]) => s === 'petchemon')).map((t) => t.id);
    expect(has).toEqual(['bns', 'bns-rematch']);
    for (const m of MAPS)
      expect(m.wild?.table.some(([s]) => s === 'petchemon') ?? false).toBe(false);
    expect(DEX.some((d) => d.id === 'petchemon')).toBe(false);
  });
});

describe('Cholokill', () => {
  it('is what a Killemon becomes in a Flannel Shirt from the shop, with Whabam', () => {
    const shirt = itemById('flannel-shirt');
    expect(shopStock(9)).toContain(shirt);
    const m = { ...makeMember('killemon', 20, 1), hp: 30, shiny: true };
    expect(canUseOn(shirt, m)).toBe(true);
    expect(canUseOn(shirt, makeMember('carlmon', 20, 2))).toBe(false);
    // Killigatr has gone the other way: no shirt for him.
    expect(canUseOn(shirt, makeMember('killemon', 35, 3))).toBe(false);
    const before = statsOf(m).hp;
    const { member, lines } = itemEvolve(m, 'flannel-shirt');
    expect(member.species).toBe('cholokill');
    expect(member.shiny).toBe(true);
    expect(member.hp).toBe(30 + statsOf(member).hp - before);
    expect(member.moves).toContain('whabam');
    expect(member.moves).not.toContain('this-ones-for-africa');
    expect(member.pp[member.moves.indexOf('whabam')]).toBe(moveById('whabam').pp);
    expect(moveById('whabam').signature).toBe('cholokill');
    expect(lines).toEqual([
      'What? ★Killemon is evolving!',
      '★Killemon evolved into ★Cholokill!',
      '★Cholokill learned Whabam!',
    ]);
    // The evolution scene shows Cholokill, not Killigatr.
    expect(evolutionIn(lines[0], [member])?.to.id).toBe('cholokill');
    expect(evolutionIn(lines[1], [member])?.to.id).toBe('cholokill');
    expect(evolutionIn('What? Killemon is evolving!', [])?.to.id).toBe('killigatr');
    // Fully evolved: levels don't turn him into Killigatr, and he keeps his line's moves.
    expect(lineOf('cholokill')).toBe('killemon');
    expect(gainExp(member, expAt(40) - member.exp).member.species).toBe('cholokill');
    expect(
      DEX.map((c) => c.id).slice(
        DEX.findIndex((c) => c.id === 'killemon'),
        -1,
      ),
    ).toEqual(expect.arrayContaining(['killemon', 'killigatr', 'cholokill']));
    expect(existsSync(`public${speciesById('cholokill').sprite}`)).toBe(true);
  });
});
