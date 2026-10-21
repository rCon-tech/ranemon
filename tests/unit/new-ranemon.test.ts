import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEX, evolutionOf, formById } from '@/lib/battle/evolutions';
import { moveById } from '@/lib/battle/moves';
import { creatureById } from '@/lib/battle/roster';
import { MAPS } from '@/content/story/maps';
import { TRAINERS } from '@/content/story/trainers';
import { speciesById } from '@/lib/story/party';

const NEW = [
  ['paulimon', 'pauliwrath', 'hat-trick'],
  ['skehemon', 'skehdinja', 'not-impressed'],
  ['vinnimon', 'vinnisaur', 'prost'],
] as const;

describe('Paulimon, Skehemon and Vinnimon', () => {
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
