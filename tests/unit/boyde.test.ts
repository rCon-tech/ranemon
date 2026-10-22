import { describe, expect, it } from 'vitest';
import { STYLES } from '@/components/story/people';
import { BOYDE, BOYDE_ASKS, BOYDE_NO, BOYDE_YES } from '@/content/story/boyde';
import { mapById } from '@/content/story/maps';
import { RUNNING, STATION_ID } from '@/content/story/station';
import { isWalkable, npcsOf, tileAt } from '@/lib/story/world';
import { VARIANTS } from '@/lib/battle/variants';

describe('Jamie Boyde', () => {
  const station = mapById(STATION_ID);
  const jamie = npcsOf(station).find((n) => n.item.look === 'boyde')!;

  it('stands on the concourse at Connolly, by the benches, after the platform staff', () => {
    expect(jamie).toBeTruthy();
    expect(station.npcs.indexOf(BOYDE)).toBe(RUNNING.length + 1);
    // Below the platforms and clear of the way from the door to the desk and the trains.
    expect(jamie.y).toBeGreaterThan(2);
    expect(jamie.x).not.toBe(4);
    expect(tileAt(station, jamie.x, jamie.y - 1)).toBe('U');
    expect(isWalkable(tileAt(station, jamie.x - 1, jamie.y))).toBe(true);
  });

  it('asks the one question, and has no battle', () => {
    expect(BOYDE.trainer).toBeUndefined();
    expect(BOYDE.talk).toHaveLength(1);
    const [ask] = BOYDE.talk!;
    if (ask.do !== 'ask') throw new Error('Jamie should ask');
    expect(ask.text).toBe(BOYDE_ASKS);
    expect(ask.text).toContain('Should I put this pill in my ass?');
    // Whatever you say, that's all there is to it.
    expect(ask.yes).toEqual([{ do: 'say', text: BOYDE_YES }]);
    expect(ask.no).toEqual([{ do: 'say', text: BOYDE_NO }]);
    for (const line of [BOYDE_ASKS, BOYDE_YES, BOYDE_NO]) expect(line).toMatch(/^JAMIE BOYDE: /);
  });

  it('wears the rugby kit of Boydemon’s second look', () => {
    expect(VARIANTS.boydemon.map((v) => v.id)).toContain('rugby');
    const s = STYLES.boyde;
    expect(s.top).toBe('#d8392c');
    expect(s.shorts).toBeTruthy();
    expect(s.socks).toBeTruthy();
    expect(s.legs).toBe(s.skin);
  });
});
