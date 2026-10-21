import { describe, expect, it } from 'vitest';
import { MAPS, mapById } from '@/content/story/maps';
import { devSave } from '@/lib/story/devsave';
import { KEY_ITEMS, LIMEPASS } from '@/lib/story/keys';
import { limeStops } from '@/lib/story/limepass';
import { canEnter, npcsOf, tileAt, type Step } from '@/lib/story/world';

function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
  }
  return out;
}

describe('the Limepass', () => {
  it('comes from the Lime rep in Limerick, once', () => {
    const rep = npcsOf(mapById('limerick')).find((n) => n.item.look === 'lime')!;
    const flags = new Set<string>();
    const first = play(rep.item.talk!, flags);
    expect(flags.has(LIMEPASS)).toBe(true);
    expect(first.join(' ')).toContain('LIMEPASS');
    const again = play(rep.item.talk!, flags);
    expect(again).toHaveLength(1);
    expect(KEY_ITEMS.some((k) => k.flag === LIMEPASS)).toBe(true);
  });

  it('goes only to towns you’ve been to, in the order of the road', () => {
    expect(limeStops(new Set())).toEqual([]);
    const stops = limeStops(new Set(['visited:dublin', 'visited:clare', 'visited:limerick']));
    expect(stops.map((s) => s.map)).toEqual(['clare', 'limerick', 'dublin']);
  });

  it('drops you on open ground outside every town’s McGrattans', () => {
    const all = limeStops(new Set(MAPS.map((m) => `visited:${m.id}`)));
    expect(all).toHaveLength(MAPS.length);
    for (const s of all) {
      const map = mapById(s.map);
      expect(canEnter(map, s.x, s.y, new Set()), `${s.map} ${s.x},${s.y}`).toBe(true);
      if (s.map !== 'trinity') expect(tileAt(map, s.x, s.y - 1), s.map).toBe('P');
    }
  });

  it('is in the developer save', () => {
    expect(devSave().flags).toContain(LIMEPASS);
  });
});
