import { describe, expect, it } from 'vitest';
import { COUNTIES, mapById } from '@/content/story/maps';
import { MISSIONS } from '@/content/story/missions';
import { BNS_SEEN, BNS_SIGHTING, LINKS, STAG_BOAT, STAG_START } from '@/content/story/road';
import { stopsOf } from '@/content/story/townmap';
import { teamOf, trainerById } from '@/content/story/trainers';
import { GYM_ORDER } from '@/lib/story/levels';
import { openMissions } from '@/lib/story/missions';
import { beatFlag, newGame } from '@/lib/story/state';
import {
  DELTA,
  isPresent,
  isWalkable,
  marker,
  npcsOf,
  spottedBy,
  tileAt,
  type Dir,
  type GameMap,
  type Step,
} from '@/lib/story/world';

function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
  }
  return out;
}

/** Whether you can walk from where you arrive to the way out without any trainer seeing you. */
function sneaksPast(map: GameMap, flags: Set<string>): boolean {
  const width = map.rows[0].length;
  const people = new Set(
    npcsOf(map)
      .filter((n) => isPresent(n.item, flags))
      .map((n) => `${n.x},${n.y}`),
  );
  const start = marker(map, '@');
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    if (x === width - 1) return true;
    for (const dir of Object.keys(DELTA) as Dir[]) {
      const [dx, dy] = DELTA[dir];
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || people.has(key) || !isWalkable(tileAt(map, nx, ny))) continue;
      if (spottedBy(map, nx, ny, flags, () => false)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}

describe('the road between the counties', () => {
  it('puts a stretch of road between every county, from Clare to Dublin', () => {
    const road = ['clare'];
    for (let id = 'clare'; id !== 'dublin';) {
      id = mapById(id).east!;
      road.push(id);
    }
    expect(road.filter((id) => !mapById(id).link)).toEqual([...COUNTIES, 'dublin']);
    expect(road.filter((id) => mapById(id).link)).toEqual(LINKS.map((m) => m.id));
    // A county, then the road, then the next county: never two of either in a row.
    road.forEach((id, i) => expect(!!mapById(id).link, id).toBe(i % 2 === 1));
  });

  it('keeps every stretch short, 2D and free of towns, gyms and long grass', () => {
    for (const m of LINKS) {
      expect(m.flat, m.id).toBe(true);
      expect(m.rows[0].length, m.id).toBeLessThanOrEqual(24);
      expect(m.gym, m.id).toBeUndefined();
      expect(m.wild, m.id).toBeUndefined();
      expect(m.rows.join(''), m.id).not.toMatch(/[PMGHL]/);
      // A welcome to the next county at the far end.
      expect(m.signs?.at(-1), m.id).toMatch(/^FÁILTE GO /);
    }
  });

  it('counts as the county behind you on the Town Map', () => {
    const here = (map: string) => stopsOf({ ...newGame(), map }).find((s) => s.here)?.id;
    expect(here('link-bog')).toBe('laois');
    expect(here('link-redcow')).toBe('kildare');
    expect(stopsOf(newGame()).some((s) => s.id.startsWith('link-'))).toBe(false);
  });

  it('lets nobody past the rival or the hurling supporters without a battle', () => {
    // Where nobody battles, you walk straight through.
    expect(sneaksPast(mapById('link-killaloe'), new Set())).toBe(true);
    for (const id of ['link-bog', 'link-services', 'link-hurling']) {
      expect(sneaksPast(mapById(id), new Set()), id).toBe(false);
    }
  });

  it('turns the STOP/GO sign once you ask, and not before', () => {
    const map = mapById('link-roadworks');
    const man = npcsOf(map).find((n) => n.item.hideIf === 'roadworks:go')!;
    const ask = man.item.talk!.find((s) => s.do === 'ask')!;
    const flags = new Set<string>();
    expect(isPresent(man.item, flags)).toBe(true);
    if (ask.do === 'ask') play(ask.yes!, flags);
    expect(isPresent(man.item, flags)).toBe(false);
  });
});

describe('the rival on the road', () => {
  it('turns up between Kilkenny and Kildare too, a little ahead of you each time', () => {
    const ace = (id: string) => Math.max(...teamOf(trainerById(id), 'carlmon').map(([, l]) => l));
    const aces = ['rival-3', 'rival-bog', 'rival-services', 'rival-4'].map(ace);
    expect(aces).toEqual([...aces].sort((a, b) => a - b));
    // Never past the level cap of the gym you're heading for.
    const cap = (gym: string) => Math.max(...trainerById(gym).team.map(([, l]) => l));
    expect(ace('rival-bog')).toBeLessThanOrEqual(cap('gym-offaly'));
    expect(ace('rival-services')).toBeLessThanOrEqual(cap('gym-kildare'));
  });
});

describe('Michael D on the phone', () => {
  it('lets slip something about Dublin after every gym', () => {
    for (const gym of GYM_ORDER.slice(0, 9)) {
      const call = trainerById(gym).reward!.find(
        (s) => s.do === 'say' && s.text.includes('Ring ring'),
      );
      expect(call && call.do === 'say' && call.text, gym).toMatch(/Dublin|B&S/);
    }
  });
});

describe('B&S on the road', () => {
  it('drive past once on the way into Offaly', () => {
    expect(mapById('offaly').arrive).toBe(BNS_SIGHTING);
    const flags = new Set<string>();
    expect(play(BNS_SIGHTING, flags).join(' ')).toContain('B&S');
    expect(flags.has(BNS_SEEN)).toBe(true);
    expect(play(BNS_SIGHTING, flags)).toEqual([]);
  });
});

describe('the Lads on Tour', () => {
  const stag = () => MISSIONS.find((m) => m.id === 'stag')!;
  const next = (...flags: string[]) =>
    openMissions(new Set(flags)).find((o) => o.mission.id === 'stag')?.step.where;

  it('opens once you beat Dec, and follows the groom county by county to Dublin', () => {
    expect(next()).toBeUndefined();
    const done = [STAG_START];
    const wheres = [];
    for (const step of stag().steps) {
      wheres.push(next(...done));
      done.push(step.until);
    }
    expect(wheres.at(0)).toContain('Tipperary');
    expect(wheres.at(-1)).toBe('Dublin City');
    expect(next(...done)).toBeUndefined();
  });

  it('gets its Shannonbridge clue from the skipper, once the stag has started', () => {
    const skipper = npcsOf(mapById('link-shannonbridge')).find((n) => n.item.look === 'sailor')!;
    const before = new Set<string>();
    play(skipper.item.talk!, before);
    expect(before.has(STAG_BOAT)).toBe(false);
    const after = new Set([beatFlag('lads-dec')]);
    expect(play(skipper.item.talk!, after).join(' ')).toContain('Athlone');
    expect(after.has(STAG_BOAT)).toBe(true);
  });

  it('pays out when you find the groom', () => {
    const reward = trainerById('dublin-stag').reward!;
    expect(reward.some((s) => s.do === 'give' && s.item === 'blue-ghost')).toBe(true);
  });
});
