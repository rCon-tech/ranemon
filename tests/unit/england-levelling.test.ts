import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { LONDON } from '@/content/story/london';
import { INTERIORS, MAPS, mapById } from '@/content/story/maps';
import {
  FIXTURE_LIST,
  KINGS_CROSS_DOOR,
  KINGS_CROSS_ID,
  KX_DEPARTURES,
  legendId,
  ON_BOARD,
  PL_MAPS,
  TRAIN_ROOMS,
  trainId,
} from '@/content/story/premier';
import { RAILCARD } from '@/content/story/kneecap';
import { trainerById } from '@/content/story/trainers';
import {
  DELTA,
  find,
  isWalkable,
  marker,
  npcsOf,
  spottedBy,
  tileAt,
  type GameMap,
  type Step,
} from '@/lib/story/world';

/** Plays a script against `flags`, answering every question yes, noting what happens. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

const longGrass = (map: GameMap) => find(map, ',').length;
const aceOf = (club: string) => Math.max(...trainerById(legendId(club)).team.map(([, l]) => l));
const passengersOf = (room: GameMap) => room.npcs.filter((n) => n.trainer);

describe('room to battle in England', () => {
  it('gives London a big park of long grass', () => {
    expect(longGrass(LONDON)).toBeGreaterThanOrEqual(200);
  });

  it('gives every ground’s part of town a common of long grass, with wild Ranemon in it', () => {
    for (const m of PL_MAPS) {
      expect(longGrass(m), m.id).toBeGreaterThanOrEqual(150);
      expect(m.wild, m.id).toBeTruthy();
    }
  });

  it('keeps each town’s wild Ranemon under the legend there, and climbing with the fixtures', () => {
    let last = 0;
    // The towns are in the order the clubs are played.
    for (const [i, f] of FIXTURE_LIST.entries()) {
      const town = PL_MAPS[i];
      expect(town.wild!.max, f.club).toBeLessThan(aceOf(f.id));
      expect(town.wild!.min, f.club).toBeGreaterThan(last);
      last = town.wild!.min;
    }
  });
});

describe('the first train to each town', () => {
  const flags = () => new Set([RAILCARD]);

  it('runs every line through its own train the first time, and straight there after', () => {
    for (const d of KX_DEPARTURES) {
      expect(play(d.ride, flags()).filter((l) => l.startsWith('TRAVEL'))).toEqual([
        `TRAVEL ${trainId(d.map)}`,
      ]);
      const been = new Set([RAILCARD, `seen:${d.map}`]);
      expect(play(d.ride, been).filter((l) => l.startsWith('TRAVEL'))).toEqual([`TRAVEL ${d.map}`]);
    }
  });

  it('boards at the back of the carriage, by the doors back out of King’s Cross', () => {
    const kx = find(LONDON, 'L')[0];
    expect(KINGS_CROSS_DOOR).toEqual({ map: LONDON.id, ...kx });
    expect(mapById(interiorId(LONDON.id, 'L', 0)).id).toBe(KINGS_CROSS_ID);
    for (const room of TRAIN_ROOMS) {
      expect(marker(room, '@')).toEqual({ x: ON_BOARD.x, y: ON_BOARD.y });
      expect(room.inside).toEqual(KINGS_CROSS_DOOR);
      expect(room.flat && room.uk).toBe(true);
      expect(INTERIORS).toContain(room);
      expect(MAPS).not.toContain(room);
    }
  });

  it('can’t be walked up without battling every passenger', () => {
    for (const room of TRAIN_ROOMS) {
      expect(passengersOf(room)).toHaveLength(3);
      const people = new Set(npcsOf(room).map((n) => `${n.x},${n.y}`));
      const start = marker(room, '@');
      const seen = new Set([`${start.x},${start.y}`]);
      const queue = [start];
      while (queue.length) {
        const { x, y } = queue.shift()!;
        for (const [dx, dy] of Object.values(DELTA)) {
          const nx = x + dx;
          const ny = y + dy;
          const key = `${nx},${ny}`;
          if (seen.has(key) || people.has(key) || !isWalkable(tileAt(room, nx, ny))) continue;
          if (spottedBy(room, nx, ny, new Set(), () => false)) continue;
          seen.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
      const conductor = npcsOf(room).find((n) => n.item.look === 'conductor')!;
      const near = Object.values(DELTA).some(([dx, dy]) =>
        seen.has(`${conductor.x + dx},${conductor.y + dy}`),
      );
      expect(near, room.id).toBe(false);
    }
  });

  it('gets you off at the town with the conductor at the front, once', () => {
    for (const d of KX_DEPARTURES) {
      const room = mapById(trainId(d.map));
      const conductor = room.npcs.find((n) => n.look === 'conductor')!;
      const f = flags();
      expect(play(conductor.talk!, f)).toContain(`TRAVEL ${d.map}`);
      expect(f.has(`seen:${d.map}`)).toBe(true);
    }
  });

  it('levels you up between the legends: each passenger between the last ace and the next', () => {
    let last = 0;
    for (const [i, d] of KX_DEPARTURES.entries()) {
      const [club] = d.clubs;
      const ace = aceOf(club.id);
      const before = i === 0 ? 6 : aceOf(KX_DEPARTURES[i - 1].clubs[0].id);
      for (const n of passengersOf(mapById(trainId(d.map)))) {
        const top = Math.max(...trainerById(n.trainer!).team.map(([, l]) => l));
        expect(top, n.trainer).toBeGreaterThan(before);
        expect(top, n.trainer).toBeLessThan(ace);
        expect(top, n.trainer).toBeGreaterThanOrEqual(last);
        last = top;
        expect(trainerById(n.trainer!).uk).toBe(true);
      }
    }
  });
});
