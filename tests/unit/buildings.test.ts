import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { KEEPERS } from '@/content/story/keepers';
import { AFTER_MAPS, INTERIORS, isFlat, MAPS, mapById } from '@/content/story/maps';
import { DOORS, type GameMap } from '@/lib/story/world';

/** Building tiles: walls, roofs, slate roofs and castle stone, with the doors in them. */
const BUILDING = new Set(['#', '^', 'j', 'q', 'u', ...DOORS]);

/** Each building on a map: its tiles, joined up, and whether one of them is a door. */
function buildings(map: GameMap): { at: string; door: boolean }[] {
  const seen = new Set<string>();
  const out: { at: string; door: boolean }[] = [];
  map.rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (!BUILDING.has(c) || seen.has(`${x},${y}`)) return;
      const queue = [[x, y]];
      seen.add(`${x},${y}`);
      let door = false;
      while (queue.length) {
        const [cx, cy] = queue.pop()!;
        if (DOORS.has(map.rows[cy][cx])) door = true;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const [nx, ny] = [cx + dx, cy + dy];
          if (!BUILDING.has(map.rows[ny]?.[nx] ?? '') || seen.has(`${nx},${ny}`)) continue;
          seen.add(`${nx},${ny}`);
          queue.push([nx, ny]);
        }
      }
      out.push({ at: `${x},${y}`, door });
    }),
  );
  return out;
}

describe('every building', () => {
  // Trinity's Long Room is walked into through gaps in its walls, not a door.
  it.each(MAPS.filter((m) => m.id !== 'trinity').map((m) => [m.id, m] as const))(
    'on %s has a door',
    (_, map) => {
      expect(
        buildings(map)
          .filter((b) => !b.door)
          .map((b) => b.at),
      ).toEqual([]);
    },
  );

  it.each([...INTERIORS, ...AFTER_MAPS.filter((m) => m.inside)].map((m) => [m.id, m] as const))(
    'room %s always has someone in it to talk to',
    (_, room) => {
      expect(room.npcs.some((n) => !n.showIf && !n.hideIf)).toBe(true);
    },
  );

  it('gives every keeper a landmark to look after', () => {
    const rooms = new Set(INTERIORS.map((r) => r.name));
    for (const [map, keepers] of Object.entries(KEEPERS)) {
      const town = mapById(map).name.split(',')[0];
      for (const name of Object.keys(keepers)) expect(rooms, map).toContain(`${name}, ${town}`);
    }
  });

  it('puts the new rooms in 2D, even where the map outside is in 3D', () => {
    const station = mapById(interiorId('brighton', 'H', 0));
    expect(station.name).toBe('Brighton Station, Brighton');
    expect(mapById('brighton').flat).toBeFalsy();
    expect(isFlat(station)).toBe(true);
    for (const i of [0, 1, 3]) expect(isFlat(mapById(interiorId('dublin', 'H', i)))).toBe(true);
    expect(mapById(interiorId('westmeath', 'L', 2)).name).toMatch(/^Athlone Castle/);
    expect(isFlat(mapById(interiorId('westmeath', 'L', 2)))).toBe(true);
  });
});
