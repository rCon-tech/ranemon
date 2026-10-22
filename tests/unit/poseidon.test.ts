import { describe, expect, it } from 'vitest';
import { MAPS, mapById } from '@/content/story/maps';
import { STATION_ID } from '@/content/story/station';
import { stopsOf } from '@/content/story/townmap';
import { trainerById } from '@/content/story/trainers';
import { DEX } from '@/lib/battle/evolutions';
import { moveById } from '@/lib/battle/moves';
import { KEY_ITEMS, TABLET, TABLET_TAKEN, TAKE_TABLET } from '@/lib/story/keys';
import { speciesById } from '@/lib/story/party';
import { newGame } from '@/lib/story/state';
import { isPresent, isWalkable, npcsOf, tileAt, type Step } from '@/lib/story/world';

/** Plays a script with every question answered yes, returning what was said and where it went. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map} ${s.x},${s.y}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

describe('the Donegal side story', () => {
  const station = mapById(STATION_ID);
  const donegal = mapById('donegal');
  const npc = (map: typeof station, look: string) => npcsOf(map).find((n) => n.item.look === look)!;

  it('runs a train from Connolly Station to Bundoran and back, onto open ground', () => {
    const there = play(npc(station, 'conductor').item.talk!, new Set());
    const back = play(npc(donegal, 'conductor').item.talk!, new Set());
    for (const [line, map] of [
      [there.find((l) => l.startsWith('TRAVEL'))!, donegal],
      [back.find((l) => l.startsWith('TRAVEL'))!, station],
    ] as const) {
      const [, id, at] = line.split(' ');
      const [x, y] = at.split(',').map(Number);
      expect(id).toBe(map.id);
      expect(isWalkable(tileAt(map, x, y)), line).toBe(true);
    }
  });

  it('gets the tablet from Josh Lee, and taking it lets you see Poseidon', () => {
    const flags = new Set<string>();
    const said = play(npc(donegal, 'josh').item.talk!, flags);
    expect(said.join(' ')).toContain('JOSH LEE’S TABLET');
    expect(flags.has(TABLET)).toBe(true);
    expect(flags.has(TABLET_TAKEN)).toBe(true);

    const god = donegal.npcs.find((n) => n.look === 'poseidon')!;
    expect(isPresent(god, new Set([TABLET]))).toBe(false);
    expect(isPresent(god, new Set([TABLET, TABLET_TAKEN]))).toBe(true);
    expect(isPresent(god, new Set([TABLET_TAKEN, 'beat:poseidon']))).toBe(false);
  });

  it('keeps the tablet in the bag until you take it', () => {
    const tablet = KEY_ITEMS.find((k) => k.flag === TABLET)!;
    expect(tablet.usable).toBe(true);
    expect(tablet.goneIf).toBe(TABLET_TAKEN);
    const flags = new Set<string>();
    play(TAKE_TABLET, flags);
    expect(flags.has(TABLET_TAKEN)).toBe(true);
  });

  it('makes Poseidon a strong boss, never catchable or in the Ranedex', () => {
    const t = trainerById('poseidon');
    expect(t.ai).toBe('hard');
    expect(t.team.at(-1)).toEqual(['poseidon', 60]);
    const god = speciesById('poseidon');
    expect(Object.values(god.base).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(500);
    expect(moveById('trident').signature).toBe('poseidon');
    expect(DEX.some((c) => c.id === 'poseidon')).toBe(false);
    for (const m of MAPS) expect(JSON.stringify(m.wild ?? {}), m.id).not.toContain('poseidon');
  });

  it('adds Donegal to the Town Map once you have been', () => {
    const game = newGame();
    expect(stopsOf(game).some((s) => s.id === 'donegal')).toBe(false);
    const there = stopsOf({ ...game, map: 'donegal' });
    expect(there.find((s) => s.here)?.id).toBe('donegal');
    expect(stopsOf({ ...game, flags: ['visited:donegal'] }).at(-1)?.id).toBe('donegal');
  });
});
