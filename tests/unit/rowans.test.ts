import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { mapById, outsideOf } from '@/content/story/maps';
import {
  breakRun,
  FINSBURY_PARK_ID,
  KNEECAP_AT_KINGS_CROSS,
  RANELASSES,
  RANELASSES_BEATEN,
  REVEAL,
  ROWANS_ID,
  ROWANS_ROOM_IDS,
  ROWANS_TRAINERS,
  RUN,
  SHADOWS,
  VICTORIA,
  VIV,
  wonFlag,
} from '@/content/story/rowans';
import { trainerById } from '@/content/story/trainers';
import { UPDATES } from '@/content/updates';
import { MEGAS } from '@/lib/battle/mega';
import { makeMember, speciesById as creatureById } from '@/lib/story/party';
import { MEGA_RING } from '@/lib/story/keys';
import { healParty, newGame } from '@/lib/story/state';
import { find, npcsOf, type Step } from '@/lib/story/world';

/** Plays a script against `flags`, saying yes to every question, and returns what was said and done. */
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

describe('the way to Rowans', () => {
  it('opens once Charles lets slip, after the Agreement', () => {
    const flags = new Set<string>();
    const said = play(trainerById('palace-charles').reward ?? [], flags);
    expect(flags.has(SHADOWS)).toBe(true);
    expect(said.some((l) => l.includes('Rowans, Finsbury Park'))).toBe(true);
    // Charles's reveal comes before the end, and the end isn't the end.
    expect(said.at(-1)).toContain('THE END…?');
  });

  it('runs the Victoria line from King’s Cross, with Kneecap waiting until you’ve been', () => {
    const kx = mapById(interiorId('london', 'L', 0));
    expect(kx.npcs).toContain(VICTORIA);
    for (const k of KNEECAP_AT_KINGS_CROSS) expect(kx.npcs).toContain(k);
    expect(VICTORIA.showIf).toBe(SHADOWS);
    const ride = play(VICTORIA.talk!, new Set([SHADOWS]));
    expect(ride.at(-1)).toBe(`TRAVEL ${FINSBURY_PARK_ID} 1,4`);
    // Everyone stands somewhere you can reach.
    const ours = [VICTORIA, ...KNEECAP_AT_KINGS_CROSS];
    for (const n of npcsOf(kx).filter((n) => ours.includes(n.item)))
      expect(kx.rows[n.y][n.x], `${n.x},${n.y}`).toBe('F');
  });

  it('gives nothing away before then', () => {
    const words = /ranelass|rowans|mega/i;
    for (const u of UPDATES) expect(JSON.stringify(u)).not.toMatch(/ranelass/i);
    for (const s of REVEAL) if (s.do === 'say') expect(s.text).not.toMatch(/ranelass/i);
    expect(words.test('Rowans')).toBe(true);
  });
});

describe('Finsbury Park', () => {
  const park = mapById(FINSBURY_PARK_ID);

  it('is 2D only, in Britain, with a W.B Yates, a shop and Rowans', () => {
    expect(park.flat).toBe(true);
    expect(park.uk).toBe(true);
    expect(find(park, 'P')).toHaveLength(1);
    expect(find(park, 'M')).toHaveLength(1);
    expect(find(park, 'L')).toHaveLength(1);
    expect(mapById(ROWANS_ID).name).toMatch(/^Shoe Hire/);
  });
});

describe('Rowans', () => {
  it('is eight rooms in a row, each way out back to Finsbury Park', () => {
    expect(ROWANS_ROOM_IDS).toHaveLength(8);
    for (const id of ROWANS_ROOM_IDS) {
      const room = mapById(id);
      expect(outsideOf(room).id).toBe(FINSBURY_PARK_ID);
    }
  });

  it('has one Ranelass per room, in order, with Viv last', () => {
    const order = ROWANS_ROOM_IDS.map((id) => mapById(id).npcs[0].trainer);
    expect(order).toEqual([...RANELASSES, VIV]);
  });

  it('gives each Ranelass her own Ranemon, and an ace that Mega evolves', () => {
    for (const t of ROWANS_TRAINERS) {
      expect(t.mega, t.id).toBeDefined();
      expect(MEGAS[t.mega!], t.id).toBeDefined();
      const members = t.team.map(([id, level]) => makeMember(id, level, -1));
      for (const m of members) expect(creatureById(m.species)).toBeDefined();
      expect(members.at(-1)!.species, t.id).toBe(t.mega);
      expect(members.filter((m) => m.species === t.mega)).toHaveLength(1);
      // Her own Ranemon leads, and nobody else has it.
      const own = members[0].species;
      expect(creatureById(own).sprite).toBe(`/sprites/rowans/${own}.png`);
      for (const other of ROWANS_TRAINERS)
        if (other !== t) expect(other.team.map(([id]) => id)).not.toContain(own);
      // And she tells you so.
      expect(t.before).toMatch(/only|nobody|no one|never/i);
    }
  });

  it('gives you the Mega Ring when you beat Viv, the first time', () => {
    const flags = new Set<string>();
    const said = play(trainerById(VIV).reward ?? [], flags);
    expect(flags.has(MEGA_RING)).toBe(true);
    expect(flags.has(RANELASSES_BEATEN)).toBe(true);
    expect(flags.has(wonFlag(VIV))).toBe(true);
    expect(said.join(' ')).toMatch(/the girls/i);
  });

  it('starts the run again when you heal, keeping what you’ve won', () => {
    const s = { ...newGame(), flags: [...RUN, wonFlag(VIV), MEGA_RING] };
    expect(breakRun(s.flags)).toEqual([wonFlag(VIV), MEGA_RING]);
    expect(healParty(s).flags).toEqual([wonFlag(VIV), MEGA_RING]);
  });
});
