import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { mapById } from '@/content/story/maps';
import { find, marker, npcsOf, type GameMap } from '@/lib/story/world';

/** The doors of the old, smaller county maps: they stay put, so saves and rooms still line up. */
const OLD_DOORS: Record<string, [string, number, number][]> = {
  clare: [
    ['H', 2, 2],
    ['L', 18, 2],
    ['P', 2, 14],
    ['M', 9, 14],
    ['G', 18, 14],
  ],
  limerick: [
    ['L', 17, 2],
    ['P', 2, 11],
    ['M', 10, 11],
    ['G', 20, 11],
  ],
  tipperary: [
    ['H', 4, 3],
    ['L', 18, 2],
    ['P', 2, 8],
    ['M', 12, 9],
    ['G', 19, 10],
  ],
  kilkenny: [
    ['L', 9, 2],
    ['M', 20, 2],
    ['P', 9, 9],
    ['G', 19, 9],
  ],
  laois: [
    ['G', 16, 2],
    ['P', 4, 7],
    ['M', 21, 7],
  ],
  offaly: [
    ['G', 7, 4],
    ['L', 19, 4],
    ['P', 4, 10],
    ['M', 9, 10],
  ],
};

const first = (map: GameMap, kind: string) => find(map, kind)[0];

describe.each(Object.entries(OLD_DOORS))('the bigger %s', (id, doors) => {
  const map = mapById(id);

  it('is bigger, and 2D only', () => {
    expect(map.rows[0].length).toBeGreaterThanOrEqual(40);
    expect(map.rows.length).toBeGreaterThanOrEqual(22);
    expect(map.flat).toBe(true);
  });

  it('keeps every old door where it was, first of its kind', () => {
    for (const [kind, x, y] of doors) {
      expect(map.rows[y][x], `${kind} at ${x},${y}`).toBe(kind);
      // The old door is still the first of its kind, so its room keeps its id.
      if (kind !== 'P' && kind !== 'M' && kind !== 'G') {
        const index = find(map, kind).findIndex((p) => p.x === x && p.y === y);
        expect(interiorId(id, kind, index)).toBe(interiorId(id, kind, 0));
      }
    }
    expect(first(map, 'P')).toBeTruthy();
  });

  it('has famous places and local legends to find', () => {
    const doors = (map.landmarks?.length ?? 0) + (map.houses?.length ?? 0);
    expect(doors).toBeGreaterThanOrEqual(3);
    expect(map.signs?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(npcsOf(map).length).toBeGreaterThanOrEqual(7);
  });

  it('moves the way out to the new east edge', () => {
    const width = map.rows[0].length;
    expect(marker(map, '>').x).toBe(width - 3);
  });
});
