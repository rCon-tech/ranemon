import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { mapById, mapFor } from '@/content/story/maps';
import { MISSIONS } from '@/content/story/missions';
import { RAVE_ID } from '@/content/story/rave';
import {
  CEOS,
  COLLISONS,
  FIRST_HQ,
  SEVEN,
  SILICON_SEVEN,
  SILICON_START,
  SILICON_TRAINERS,
} from '@/content/story/silicon';
import { STATION_ID } from '@/content/story/station';
import { trainerById } from '@/content/story/trainers';
import { find, npcsOf, type Step } from '@/lib/story/world';

const DUBLIN = mapById('dublin');
const hqs = CEOS.map((_, i) => mapById(interiorId('dublin', 'L', FIRST_HQ + i)));

/** Runs a script's flags and branches, as if every battle in it was won. */
function play(steps: Step[], flags: Set<string>): string[] {
  const said: string[] = [];
  for (const s of steps) {
    if (s.do === 'say') said.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'if') said.push(...play(flags.has(s.flag) ? s.then : (s.else ?? []), flags));
  }
  return said;
}

/** Beats a trainer and plays their reward, the way the story screen does. */
const beat = (id: string, flags: Set<string>) => {
  flags.add(`beat:${id}`);
  return play(trainerById(id).reward ?? [], flags);
};

describe('Silicon Docks', () => {
  it('has a glass HQ for each of the eight, after every door Dublin already had', () => {
    expect(find(DUBLIN, 'L')).toHaveLength(FIRST_HQ + 8);
    expect(hqs.map((r) => r.name)).toEqual(
      [
        'Google HQ',
        'Meta HQ',
        'Microsoft HQ',
        'Apple HQ',
        'Amazon HQ',
        'TikTok HQ',
        'X HQ',
        'Stripe HQ',
      ].map((n) => `${n}, Dublin City`),
    );
    // Nothing that was in Dublin moves, so saves inside its rooms carry on.
    expect(mapById(STATION_ID).name).toContain('Connolly');
    expect(mapById(RAVE_ID).name).toContain('Rave Cave');
    for (const r of hqs) {
      const door = find(DUBLIN, 'L')[FIRST_HQ + hqs.indexOf(r)];
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
      ])
        expect(DUBLIN.rows[door.y + dy][door.x + dx]).toBe('z');
    }
  });

  it('puts the company’s sign over each HQ door', () => {
    const labels = CEOS.map((_, i) => DUBLIN.landmarkLabels?.[FIRST_HQ + i]?.text);
    expect(labels).toEqual([
      'GOOGLE',
      'META',
      'MICROSOFT',
      'APPLE',
      'AMAZON',
      'TIKTOK',
      'X',
      'STRIPE',
    ]);
  });

  it('has a CEO to battle in every HQ, someone on staff and people to talk to', () => {
    hqs.forEach((room, i) => {
      const people = npcsOf(room).map((n) => n.item);
      expect(people[0].trainer, room.id).toBe(CEOS[i]);
      expect(people.filter((n) => n.talk && !n.trainer).length, room.id).toBeGreaterThanOrEqual(2);
      expect(
        people.some((n) => n.trainer && n.sight),
        room.id,
      ).toBe(true);
      for (const n of people) expect(n.talk?.length, room.id).toBeGreaterThan(0);
    });
    expect(SILICON_TRAINERS).toHaveLength(16);
  });

  it('starts the mission the first time you walk into an HQ', () => {
    for (const r of hqs) expect(r.arrive).toContainEqual({ do: 'flag', flag: SILICON_START });
    expect(MISSIONS.find((m) => m.id === 'silicon')?.start).toBe(SILICON_START);
  });

  it('opens Stripe once all seven are beaten, in any order, and not before', () => {
    const lock = DUBLIN.landmarkLocks?.[FIRST_HQ + 7];
    expect(lock?.flag).toBe(SILICON_SEVEN);
    for (const order of [SEVEN, [...SEVEN].reverse()]) {
      const flags = new Set<string>();
      order.slice(0, -1).forEach((id) => beat(id, flags));
      expect(flags.has(SILICON_SEVEN)).toBe(false);
      const said = beat(order.at(-1)!, flags);
      expect(flags.has(SILICON_SEVEN)).toBe(true);
      expect(said.some((t) => t.includes('STRIPE'))).toBe(true);
    }
    expect(trainerById(COLLISONS).team).toHaveLength(6);
  });

  it('gets harder from Google to Stripe', () => {
    const aces = CEOS.map((id) => Math.max(...trainerById(id).team.map(([, l]) => l)));
    for (let i = 1; i < aces.length; i++) expect(aces[i]).toBeGreaterThan(aces[i - 1]);
    expect(aces[0]).toBeGreaterThanOrEqual(44);
    for (const id of CEOS) expect(trainerById(id).ai).toBe('hard');
  });

  it('is 2D only, with the rest of Dublin', () => {
    expect(DUBLIN.flat).toBe(true);
    for (const r of hqs) expect(mapFor(r.id, []).inside?.map).toBe('dublin');
  });
});
