import { describe, expect, it } from 'vitest';
import { HOME_ID, interiorId } from '@/content/story/interiors';
import { INTERIORS, MAPS, mapById } from '@/content/story/maps';
import { teamOf, TRAINERS, trainerById } from '@/content/story/trainers';
import { speciesById } from '@/lib/story/party';
import {
  DELTA,
  doorStep,
  DOORS,
  EXIT,
  find,
  isWalkable,
  marker,
  npcsOf,
  tileAt,
  type Dir,
  type GameMap,
  type Step,
} from '@/lib/story/world';

/** Tiles reachable on foot from a start, with every Garda and gate stepped aside. */
function reachable(map: GameMap, from: { x: number; y: number }): Set<string> {
  const people = new Set(npcsOf(map).map((n) => `${n.x},${n.y}`));
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [from];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const dir of Object.keys(DELTA) as Dir[]) {
      const [dx, dy] = DELTA[dir];
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !isWalkable(tileAt(map, nx, ny))) continue;
      // Gates step aside once their flag is set; others stay put but can still be reached.
      const npc = npcsOf(map).find((n) => n.x === nx && n.y === ny);
      if (people.has(key) && !npc?.item.hideIf) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

const nextTo = (seen: Set<string>, x: number, y: number) =>
  Object.values(DELTA).some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));

function stepsOf(steps: Step[]): Step[] {
  return steps.flatMap((s) =>
    s.do === 'if'
      ? [s, ...stepsOf(s.then), ...stepsOf(s.else ?? [])]
      : s.do === 'ask'
        ? [s, ...stepsOf(s.yes ?? []), ...stepsOf(s.no ?? [])]
        : [s],
  );
}

describe.each(MAPS.map((m) => [m.id, m]))('map %s', (_, map) => {
  it('is a rectangle with a border', () => {
    const width = map.rows[0].length;
    for (const row of map.rows) expect(row.length, row).toBe(width);
  });

  it('places every person, and nobody extra', () => {
    expect(npcsOf(map)).toHaveLength(map.npcs.length);
    expect(find(map, String(map.npcs.length + 1))).toHaveLength(0);
  });

  it('has text for every sign, house and landmark', () => {
    expect(find(map, 'S').length).toBe(map.signs?.length ?? 0);
    expect(find(map, 'H').length).toBe(map.houses?.length ?? 0);
    expect(find(map, 'L').length).toBe(map.landmarks?.length ?? 0);
    expect(find(map, 'G').length).toBe(map.gym ? 1 : 0);
  });

  it('can reach every door, person and exit from where you arrive', () => {
    const seen = reachable(map, marker(map, '@'));
    for (const c of [...DOORS, 'S', '*']) {
      for (const p of find(map, c))
        expect(nextTo(seen, p.x, p.y) || seen.has(`${p.x},${p.y}`), `${c} at ${p.x},${p.y}`).toBe(
          true,
        );
    }
    for (const n of npcsOf(map)) expect(nextTo(seen, n.x, n.y), `person ${n.index + 1}`).toBe(true);
    if (map.east) {
      const width = map.rows[0].length;
      const exits = map.rows.flatMap((row, y) =>
        isWalkable(tileAt(map, width - 1, y)) ? [y] : [],
      );
      expect(exits).toHaveLength(1);
      expect(seen.has(`${width - 1},${exits[0]}`)).toBe(true);
      expect(marker(map, '>')).toBeTruthy();
      // The Garda (or porter) stands right in front of the way out.
      const guard = npcsOf(map).find((n) => n.x === width - 2 && n.y === exits[0]);
      expect(guard?.item.hideIf, 'a gate in front of the exit').toMatch(/^jersey:/);
    }
    if (map.west) expect(marker(map, '@').x).toBe(0);
  });

  it('links to maps that link back', () => {
    if (map.east) expect(mapById(map.east).west).toBe(map.id);
    if (map.west) expect(mapById(map.west).east).toBe(map.id);
  });

  it('only uses trainers, species and items that exist', () => {
    for (const npc of map.npcs) if (npc.trainer) expect(trainerById(npc.trainer)).toBeTruthy();
    if (map.gym) expect(trainerById(map.gym.trainer)).toBeTruthy();
    for (const [id] of map.wild?.table ?? []) expect(speciesById(id)).toBeTruthy();
    const scripts = [
      ...map.npcs.map((n) => n.talk ?? []),
      ...(map.houses ?? []),
      ...(map.landmarks ?? []),
    ];
    for (const step of scripts.flatMap(stepsOf)) {
      if (step.do === 'battle') expect(trainerById(step.trainer)).toBeTruthy();
    }
  });
});

describe('trainers', () => {
  it('have real teams of 1 to 6', () => {
    for (const t of TRAINERS) {
      const team = teamOf(t, 'carlmon');
      expect(team.length, t.id).toBeGreaterThan(0);
      expect(team.length, t.id).toBeLessThanOrEqual(6);
      for (const [id, level] of team) {
        expect(speciesById(id), t.id).toBeTruthy();
        expect(level).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('gym aces rise about 4 levels a gym, up to 44', () => {
    const aces = MAPS.filter((m) => m.gym).map((m) =>
      Math.max(...trainerById(m.gym!.trainer).team.map(([, l]) => l)),
    );
    // Tuned by the route simulator (tests/sim/story.test.ts): Clare's ace is 11, not 12.
    expect(aces).toEqual([11, 16, 20, 24, 28, 32, 36, 40, 44]);
  });

  it('gives the rival a starter that beats yours', () => {
    const team = teamOf(trainerById('rival-1'), 'simomon');
    expect(team[0][0]).not.toBe('simomon');
  });

  it('every trainer is met somewhere', () => {
    const met = new Set([
      ...MAPS.flatMap((m) => m.npcs.map((n) => n.trainer)),
      ...MAPS.map((m) => m.gym?.trainer),
    ]);
    for (const t of TRAINERS) expect(met.has(t.id), t.id).toBe(true);
  });
});

describe('rooms', () => {
  it('every door leads into a room that leads back out to it', () => {
    for (const map of MAPS) {
      for (const kind of DOORS) {
        find(map, kind).forEach((door, i) => {
          const room = mapById(interiorId(map.id, kind, i));
          expect(room.inside).toEqual({ map: map.id, ...door });
          expect(room.county).toBe(map.county);
          const out = doorStep(map, door.x, door.y);
          expect(isWalkable(tileAt(map, out.x, out.y)), `${room.id} way out`).toBe(true);
        });
      }
    }
    expect(INTERIORS.length).toBe(
      MAPS.reduce((n, m) => n + [...DOORS].flatMap((k) => find(m, k)).length, 0),
    );
  });

  describe.each(INTERIORS.map((m) => [m.id, m]))('room %s', (_, room) => {
    it('fits together: a rectangle, everyone placed, the way out under where you come in', () => {
      const width = room.rows[0].length;
      for (const row of room.rows) expect(row.length, row).toBe(width);
      expect(npcsOf(room)).toHaveLength(room.npcs.length);
      const start = marker(room, '@');
      expect(room.rows[start.y + 1][start.x]).toBe(EXIT);
    });

    it('can reach everyone and everything you can look at', () => {
      const seen = reachable(room, marker(room, '@'));
      for (const n of npcsOf(room)) {
        // People behind a counter are talked to across it.
        const across = Object.values(DELTA).some(
          ([dx, dy]) =>
            tileAt(room, n.x + dx, n.y + dy) === 'C' && seen.has(`${n.x + 2 * dx},${n.y + 2 * dy}`),
        );
        expect(nextTo(seen, n.x, n.y) || across, `person ${n.index + 1}`).toBe(true);
      }
      for (const tile of Object.keys(room.things ?? {})) {
        expect(
          find(room, tile).some((p) => nextTo(seen, p.x, p.y)),
          `${tile} in ${room.id}`,
        ).toBe(true);
      }
    });
  });

  it('puts the Ocean Linen couch in your own house, and nowhere else', () => {
    const home = mapById(HOME_ID);
    expect(home.things?.Z).toBe('A lovely Ocean Linen couch.');
    expect(find(home, 'Z')).toHaveLength(2);
    for (const room of INTERIORS) if (room.id !== HOME_ID) expect(find(room, 'Z')).toHaveLength(0);
  });
});
