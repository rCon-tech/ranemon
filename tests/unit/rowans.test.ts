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
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MEGAS, megaForm } from '@/lib/battle/mega';
import { UK } from '@/lib/battle/uk';
import { makeMember, speciesById as creatureById, toEntrant } from '@/lib/story/party';
import { MEGA_RING } from '@/lib/story/keys';
import { scaleTeam } from '@/lib/story/levels';
import { healParty, newGame } from '@/lib/story/state';
import { DELTA, find, isWalkable, marker, npcsOf, tileAt, type Step } from '@/lib/story/world';

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

  it('lets you walk past each Ranelass to the door out of her room', () => {
    for (const id of ROWANS_ROOM_IDS) {
      const room = mapById(id);
      const people = new Set(npcsOf(room).map((n) => `${n.x},${n.y}`));
      const start = marker(room, '@');
      const seen = new Set([`${start.x},${start.y}`]);
      const queue = [start];
      while (queue.length) {
        const { x, y } = queue.shift()!;
        for (const [dx, dy] of Object.values(DELTA)) {
          const key = `${x + dx},${y + dy}`;
          if (seen.has(key) || people.has(key) || !isWalkable(tileAt(room, x + dx, y + dy)))
            continue;
          seen.add(key);
          queue.push({ x: x + dx, y: y + dy });
        }
      }
      for (const door of find(room, 'L')) {
        const near = Object.values(DELTA).some(([dx, dy]) =>
          seen.has(`${door.x + dx},${door.y + dy}`),
        );
        expect(near, `${room.name}: door at ${door.x},${door.y}`).toBe(true);
      }
    }
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

  it('fights with drawn UK forms, so the Megas are drawn too', () => {
    for (const t of ROWANS_TRAINERS) {
      expect(t.uk, t.id).toBe(true);
      const [id, level] = t.team.at(-1)!;
      const ace = toEntrant(makeMember(id, level, -1, UK)).creature;
      expect(ace.sprite, t.id).toMatch(/^\/sprites\/drawn\//);
      const sprite = megaForm(ace)!.sprite!;
      expect(sprite).toBe(`/sprites/drawn/mega/${t.mega}.png`);
      expect(existsSync(resolve('public', `.${sprite}`)), sprite).toBe(true);
      expect(
        existsSync(resolve('public', `.${sprite.replace('/sprites/', '/sprites/shiny/')}`)),
      ).toBe(true);
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

describe('Ranelass level scaling', () => {
  const viv = trainerById(VIV);
  const ace = (t: [string, number][]) => Math.max(...t.map(([, l]) => l));
  const party = (...levels: number[]) => levels.map((l, i) => makeMember('carlmon', l, i, UK));

  it('comes only half way on the first run, so training pays', () => {
    const flags: string[] = [];
    const at = (l: number) =>
      ace(scaleTeam(viv.team, { flags, party: party(l, l, l) }, viv.above, true));
    expect(viv.halfway).toBe(RANELASSES_BEATEN);
    expect(at(60)).toBe(ace(viv.team));
    // Lv80: the gap to Viv's ace (79 against her 63) is 16, so she comes up 8.
    expect(at(80)).toBe(71);
    expect(at(100) - ace(viv.team)).toBeLessThan(100 - 1 - ace(viv.team));
  });

  it('scales to the party’s average, not one over-levelled Ranemon', () => {
    const one = scaleTeam(viv.team, { flags: [], party: party(90, 60, 60) }, viv.above, true);
    expect(ace(one)).toBe(ace(viv.team) + Math.round((70 - 1 - ace(viv.team)) / 2));
  });

  it('scales in full on a rematch, once Viv is beaten', () => {
    const s = { flags: [RANELASSES_BEATEN], party: party(80, 60) };
    expect(ace(scaleTeam(viv.team, s, viv.above))).toBe(79);
  });
});
