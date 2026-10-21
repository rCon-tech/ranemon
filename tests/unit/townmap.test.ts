import { describe, expect, it } from 'vitest';
import { MAP_HEIGHT, MAP_WIDTH, stopsOf } from '@/content/story/townmap';
import { newGame } from '@/lib/story/state';

describe('the Town Map', () => {
  const game = newGame();

  it('has every stop from Clare to Dublin on the map, west to east, in order', () => {
    const stops = stopsOf(game);
    expect(stops.map((s) => s.id)).toEqual([
      'clare',
      'limerick',
      'tipperary',
      'kilkenny',
      'laois',
      'offaly',
      'westmeath',
      'meath',
      'kildare',
      'dublin',
    ]);
    for (const s of stops) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(MAP_WIDTH);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(MAP_HEIGHT);
    }
    // Dublin is east of Clare, and Meath north of Kildare.
    expect(stops[9].x).toBeGreaterThan(stops[0].x);
    expect(stops[7].y).toBeLessThan(stops[8].y);
  });

  it('starts in Clare, with only Clare visited and no jerseys', () => {
    const stops = stopsOf(game);
    expect(stops.filter((s) => s.here).map((s) => s.id)).toEqual(['clare']);
    expect(stops.filter((s) => s.visited).map((s) => s.id)).toEqual(['clare']);
    expect(stops.some((s) => s.gym?.won)).toBe(false);
  });

  it('follows you: places visited, jerseys won, and rooms count as their town', () => {
    const stops = stopsOf({
      ...game,
      map: 'tipperary-G0',
      flags: ['visited:limerick', 'visited:tipperary', 'jersey:clare', 'jersey:limerick'],
    });
    expect(stops.find((s) => s.here)?.id).toBe('tipperary');
    expect(stops.filter((s) => s.visited)).toHaveLength(3);
    expect(stops.filter((s) => s.gym?.won).map((s) => s.id)).toEqual(['clare', 'limerick']);
    expect(stops[2].gym?.place).toBe('Semple Stadium');
  });

  it('puts Trinity under Dublin, and never shows the legend', () => {
    const stops = stopsOf({ ...game, map: 'trinity', flags: ['champion'] });
    expect(stops.find((s) => s.here)?.id).toBe('dublin');
    expect(stops[9].gym).toEqual({ place: 'Trinity College', won: true });
    expect(JSON.stringify(stops).toLowerCase()).not.toMatch(/hellfire|legend|toby/);
  });
});
