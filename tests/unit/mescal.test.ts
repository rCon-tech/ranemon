import { describe, expect, it } from 'vitest';
import { FLEE_MS, FLEE_TILES, runOff } from '@/components/story/walk';
import { STYLES } from '@/components/story/people';
import { mapById } from '@/content/story/maps';
import {
  MESCAL,
  MESCAL_AFTER,
  MESCAL_BEFORE,
  MESCAL_GONE,
  MESCAL_RUNS,
  MESCAL_TRAINER,
} from '@/content/story/mescal';
import { trainerById } from '@/content/story/trainers';
import { beatFlag } from '@/lib/story/state';
import { find, isPresent, npcsOf, slot, spottedBy, tileAt } from '@/lib/story/world';

const mescal = trainerById(MESCAL_TRAINER);
const dublin = mapById('dublin');
const here = npcsOf(dublin).find((n) => n.item === MESCAL)!;

describe('Paul Mescal', () => {
  it('is an Academy Award nominee, really attractive, really rich and really sad', () => {
    expect(mescal.name).toBe('Paul Mescal');
    expect(mescal.before).toBe(MESCAL_BEFORE);
    for (const word of ['Academy Award nominated', 'attractive', 'rich', 'sad'])
      expect(MESCAL_BEFORE).toContain(word);
  });

  it('is even sadder when he loses, and tells you to look over there', () => {
    expect(mescal.after).toBe(MESCAL_AFTER);
    expect(MESCAL_AFTER).toContain('even sadder');
    expect(MESCAL_AFTER).toContain('Look over there!');
  });

  it('then runs off the quays, and stays gone', () => {
    expect(mescal.reward).toBe(MESCAL_RUNS);
    const [flee, ...rest] = MESCAL_RUNS;
    expect(flee).toEqual({ do: 'flee', flag: MESCAL_GONE, dir: 'right' });
    expect(rest).toEqual([
      { do: 'say', text: 'You look. There’s nothing over there. Paul Mescal is gone.' },
    ]);
    // The flag that ends the run is the one that hides him.
    expect(MESCAL.hideIf).toBe(MESCAL_GONE);
    expect(isPresent(MESCAL, new Set([beatFlag(MESCAL_TRAINER)]))).toBe(true);
    expect(isPresent(MESCAL, new Set([MESCAL_GONE]))).toBe(false);
    // Should he still be there after a win, talking to him tries the same trick again.
    expect(MESCAL.talk).toEqual([{ do: 'say', text: MESCAL_AFTER }, ...MESCAL_RUNS]);
  });

  it('matches the other trainers on the Dublin streets', () => {
    const near = ['dublin-jogger', 'dublin-stag'].map(trainerById);
    const levels = near.flatMap((t) => t.team.map(([, l]) => l));
    for (const [, level] of mescal.team) {
      expect(level).toBeGreaterThanOrEqual(Math.min(...levels));
      expect(level).toBeLessThanOrEqual(Math.max(...levels));
    }
    expect(mescal.team.length).toBeLessThanOrEqual(Math.max(...near.map((t) => t.team.length)));
    expect(mescal.ai).toBe(near[0].ai);
    // Route trainers pay 20 euro a level of their best.
    expect(mescal.prize).toBe(Math.max(...mescal.team.map(([, l]) => l)) * 20);
    expect(mescal.team[0][0]).toBe('paulimon');
  });

  it('is the tenth person in Dublin, down past Temple Bar, looking along the street', () => {
    expect(dublin.npcs).toHaveLength(10);
    expect(slot(9)).toBe('0');
    expect(find(dublin, '0')).toEqual([{ x: here.x, y: here.y }]);
    expect(here.index).toBe(9);
    expect(tileAt(dublin, here.x, here.y)).toBe('.');
    const beaten = () => false;
    for (let d = 1; d <= MESCAL.sight!; d++) {
      expect(spottedBy(dublin, here.x - d, here.y, new Set(), beaten)?.item).toBe(MESCAL);
    }
    expect(spottedBy(dublin, here.x - 1, here.y, new Set([MESCAL_GONE]), beaten)).toBeNull();
  });

  it('runs all the way to the edge of the map', () => {
    const f = { index: here.index, dir: 'right' as const, t0: 1000, dur: FLEE_MS };
    expect(runOff(f, 1000)).toEqual({ tiles: 0, step: 0, t: 0 });
    expect(runOff(f, 1000 + FLEE_MS / 2).tiles).toBe(FLEE_TILES / 2);
    expect(runOff(f, 1000 + FLEE_MS * 3)).toEqual({ tiles: FLEE_TILES, step: FLEE_TILES, t: 0 });
    // Past the last tile of road and into the trees at the edge of town.
    expect(here.x + FLEE_TILES).toBeGreaterThanOrEqual(dublin.rows[0].length - 1);
  });

  it('wears tiny shorts over bare legs, a moustache and a sad face', () => {
    const s = STYLES.mescal;
    expect(s.shorts).toBeDefined();
    expect(s.legs).toBe(s.skin);
    expect(s.socks).toBeDefined();
    expect(s.moustache).toBeDefined();
    expect(s.sad).toBe(true);
  });
});
