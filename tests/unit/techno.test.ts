import { describe, expect, it } from 'vitest';
import { CRAMPS_ARRIVE, TECHNO_ASKED, TECHNO_DONE, TECHNO_MET } from '@/content/story/cramps';
import { mapById, mapFor } from '@/content/story/maps';
import { STATION_ID, departureTo, homeward, ticket } from '@/content/story/station';
import {
  EXPO_ID,
  HEAD_OF_SECURITY,
  RIDER,
  SECURITY,
  TECHNO_DJ,
  TECHNO_TRAINERS,
} from '@/content/story/techno';
import { stopsOf } from '@/content/story/townmap';
import { trainerById } from '@/content/story/trainers';
import { evolutionOf } from '@/lib/battle/evolutions';
import { areaSong, battleSong, partySong } from '@/lib/sound/cues';
import { SONGS } from '@/lib/sound/songs';
import { habitats } from '@/lib/story/dex';
import { newGame } from '@/lib/story/state';
import {
  canEnter,
  DELTA,
  find,
  isPresent,
  isWalkable,
  marker,
  npcsOf,
  tileAt,
  type Dir,
  type GameMap,
  type Look,
  type Placed,
  type Npc,
  type Step,
} from '@/lib/story/world';

/**
 * Plays a script against `flags`, answering every question with `answer`, returning what was
 * said, fought, given and where it went. A battle is won, so the trainer's reward plays too.
 */
function play(steps: Step[], flags: Set<string>, answer = true, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'give') out.push(`GIVE ${s.item} ${s.count ?? 1}`);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map} ${s.x},${s.y}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, answer, out);
    else if (s.do === 'ask') play((answer ? s.yes : s.no) ?? [], flags, answer, out);
    else if (s.do === 'battle') {
      const t = trainerById(s.trainer);
      out.push(`BATTLE ${t.id}`, t.after);
      flags.add(`beat:${t.id}`);
      play(t.reward ?? [], flags, answer, out);
    }
  }
  return out;
}

/** Every tile you can walk to from a start, with the people present for these flags in the way. */
function walkable(map: GameMap, from: { x: number; y: number }, flags: Set<string>): Set<string> {
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [from];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const dir of Object.keys(DELTA) as Dir[]) {
      const [dx, dy] = DELTA[dir];
      const key = `${x + dx},${y + dy}`;
      if (seen.has(key) || !canEnter(map, x + dx, y + dy, flags)) continue;
      seen.add(key);
      queue.push({ x: x + dx, y: y + dy });
    }
  }
  return seen;
}

/** The map with every tile these trainers can see walled off, as if each would stop you. */
function watched(map: GameMap, trainers: Placed<Npc>[]): GameMap {
  const seen = new Set<string>();
  for (const t of trainers) {
    const [dx, dy] = DELTA[t.item.face];
    for (let d = 1; d <= t.item.sight!; d++) seen.add(`${t.x + dx * d},${t.y + dy * d}`);
  }
  return {
    ...map,
    rows: map.rows.map((row, y) =>
      [...row].map((c, x) => (seen.has(`${x},${y}`) ? 'W' : c)).join(''),
    ),
  };
}

const person = (map: GameMap, look: Look, flags = new Set<string>()) =>
  npcsOf(map).find((n) => n.item.look === look && isPresent(n.item, flags))!;

const guard = (map: GameMap, id: string) => npcsOf(map).find((n) => n.item.trainer === id)!;

describe('Cramps, back in Dublin after the Ball', () => {
  const dublin = mapById('dublin');

  it('runs up to you the first time you come out into Dublin as Champion', () => {
    expect(dublin.arrive).toBe(CRAMPS_ARRIVE);
    // Not before B&S are beaten.
    expect(play(CRAMPS_ARRIVE, new Set())).toEqual([]);
    const flags = new Set(['champion']);
    const said = play(CRAMPS_ARRIVE, flags).join(' ');
    expect(said).toMatch(/CRAMPS/);
    expect(said).toMatch(
      /to celebrate the win, we are going to I Love Techno music festival in Belgium/i,
    );
    expect(said).toMatch(/Connolly Station, platform 4/);
    expect(flags).toEqual(new Set(['champion', TECHNO_MET, TECHNO_ASKED]));
    // Once is enough.
    expect(play(CRAMPS_ARRIVE, flags)).toEqual([]);
  });

  it('catches a save that is already well past the Ball', () => {
    const flags = new Set(['champion', 'beat:bns', 'beat:bns-rematch', 'visited:trinity']);
    expect(play(CRAMPS_ARRIVE, flags).join(' ')).toMatch(/I Love Techno/);
  });

  it('waits at Connolly if you say no, and asks again there', () => {
    const flags = new Set(['champion']);
    play(CRAMPS_ARRIVE, flags, false);
    expect(flags.has(TECHNO_MET)).toBe(true);
    expect(flags.has(TECHNO_ASKED)).toBe(false);
    const station = mapById(STATION_ID);
    expect(
      npcsOf(station).some((n) => n.item.look === 'cramps' && isPresent(n.item, new Set())),
    ).toBe(false);
    const cramps = person(station, 'cramps', flags);
    expect(play(cramps.item.talk!, flags, false).join(' ')).toMatch(/Changed your mind/);
    play(cramps.item.talk!, flags, true);
    expect(flags.has(TECHNO_ASKED)).toBe(true);
    expect(play(cramps.item.talk!, flags).join(' ')).toMatch(/Platform 4/);
    flags.add(TECHNO_DONE);
    expect(play(cramps.item.talk!, flags).join(' ')).toMatch(/Best festival/);
  });
});

describe('the Eurostar to Ghent', () => {
  const line = departureTo('belgium');

  it('runs from platform 4 at Connolly only once you have said yes to Cramps', () => {
    expect(line.platform).toBe(4);
    expect(line.lock?.flag).toBe(TECHNO_ASKED);
    const early = play(ticket(line), new Set());
    expect(early.some((l) => l.startsWith('TRAVEL'))).toBe(false);
    expect(early.join(' ')).toMatch(/Cramps/);
    const there = play(ticket(line), new Set([TECHNO_ASKED])).find((l) => l.startsWith('TRAVEL'))!;
    const [, map, at] = there.split(' ');
    const [x, y] = at.split(',').map(Number);
    expect(map).toBe('belgium');
    expect(isWalkable(tileAt(mapById(map), x, y))).toBe(true);
    expect(person(mapById(STATION_ID), 'eurostar').item.talk).toBeTruthy();
    expect(person(mapById('belgium'), 'eurostar').item.talk).toEqual(homeward('belgium'));
  });

  it('puts Ghent on the Town Map once you have been', () => {
    const game = newGame();
    expect(stopsOf(game).some((s) => s.id === 'belgium')).toBe(false);
    const stops = stopsOf({ ...game, flags: ['visited:belgium'] });
    const ghent = stops.find((s) => s.id === 'belgium')!;
    expect(ghent).toMatchObject({ town: 'Ghent', county: 'Belgium' });
    const brighton = stopsOf({ ...game, flags: ['visited:brighton'] }).find(
      (s) => s.id === 'brighton',
    )!;
    expect(`${ghent.x},${ghent.y}`).not.toBe(`${brighton.x},${brighton.y}`);
  });
});

describe('I Love Techno, at Flanders Expo', () => {
  const ghent = mapById('belgium');
  const expo = mapById(EXPO_ID);

  it('is 2D only for now', () => {
    expect(ghent.flat).toBe(true);
    expect(expo.inside?.map).toBe('belgium');
  });

  it('has Cramps waiting off the train, and a pub, a shop and long grass', () => {
    const arrive = departureTo('belgium').at;
    const cramps = person(ghent, 'cramps');
    expect(Math.abs(cramps.x - arrive.x) + Math.abs(cramps.y - arrive.y)).toBeLessThanOrEqual(3);
    expect(play(cramps.item.talk!, new Set()).join(' ')).toMatch(/security won’t let ANYONE in/);
    for (const door of ['P', 'M']) expect(find(ghent, door), door).toHaveLength(1);
    expect(find(ghent, 'L')).toHaveLength(2);
    expect(find(ghent, ',').length).toBeGreaterThan(0);
    expect(expo.name).toBe('Flanders Expo, Ghent');
  });

  it('keeps the doors shut until the head of security is beaten', () => {
    expect(ghent.landmarkLocks?.[1]?.flag).toBe(`beat:${HEAD_OF_SECURITY}`);
    expect(ghent.landmarkLocks?.[1]?.locked).toMatch(/security/);
  });

  it('makes you battle all three guards outside to reach the door', () => {
    const door = find(ghent, 'L')[1];
    const start = marker(ghent, '@');
    const outside = SECURITY.slice(0, 3).map((id) => guard(ghent, id));
    const atDoor = (m: GameMap) => walkable(m, start, new Set()).has(`${door.x},${door.y + 1}`);
    expect(atDoor(ghent)).toBe(true);
    // Each guard on their own is enough to stop you.
    for (const g of outside) expect(atDoor(watched(ghent, [g])), g.item.trainer).toBe(false);
  });

  it('has stage security watching the whole floor between the way in and the decks', () => {
    const start = marker(expo, '@');
    const dj = guard(expo, TECHNO_DJ);
    const bart = guard(expo, 'techno-bart');
    const near = (m: GameMap) => {
      const reach = walkable(m, start, new Set());
      return Object.values(DELTA).some(([dx, dy]) => reach.has(`${dj.x + dx},${dj.y + dy}`));
    };
    expect(near(expo)).toBe(true);
    expect(near(watched(expo, [bart]))).toBe(false);
  });

  it('ends with DJ Vandenbass, a boss with boss music, ten Blue Ghosts and the festival', () => {
    const dj = trainerById(TECHNO_DJ);
    expect(dj.ai).toBe('hard');
    expect(dj.team).toHaveLength(6);
    const best = (id: string) => Math.max(...trainerById(id).team.map(([, l]) => l));
    for (const t of TECHNO_TRAINERS.filter((t) => t.id !== TECHNO_DJ))
      expect(best(t.id), t.id).toBeLessThan(best(TECHNO_DJ));
    expect(battleSong('city', false, TECHNO_DJ)).toBe('boss');
    expect(battleSong('city', false, 'techno-wouter')).toBe('trainer');

    const flags = new Set<string>();
    const said = play([{ do: 'battle', trainer: TECHNO_DJ }], flags);
    expect(RIDER).toBe(10);
    expect(said).toContain('GIVE blue-ghost 10');
    expect(said.join(' ')).toMatch(/I LOVE TECHNO has begun/);
    expect(flags.has(TECHNO_DONE)).toBe(true);
  });

  it('turns the hall into the festival once the DJ is beaten', () => {
    expect(mapFor(EXPO_ID, []).party).toBeUndefined();
    const festival = mapFor(EXPO_ID, [TECHNO_DONE]);
    expect(festival.name).toBe('I Love Techno, Ghent');
    expect(festival.party!.crowd!.length).toBeGreaterThanOrEqual(10);
    expect(festival.party!.lights.length).toBeGreaterThan(0);
    expect(festival.party!.lines!.some((l) => /I LOVE TECHNO/.test(l))).toBe(true);
    expect(festival.npcs.every((n) => n.dances)).toBe(true);
    // Nobody in the crowd stands where you could be talking to the DJ, or in the way out.
    const flags = new Set([TECHNO_DONE]);
    const reach = walkable(festival, marker(festival, '@'), flags);
    for (const n of npcsOf(festival))
      expect(
        Object.values(DELTA).some(([dx, dy]) => reach.has(`${n.x + dx},${n.y + dy}`)),
        `person ${n.index + 1}`,
      ).toBe(true);
    // The guards outside are partying too.
    expect(play(guard(ghent, HEAD_OF_SECURITY).item.talk!, flags).join(' ')).toMatch(/beat/);
  });

  it('plays techno in the hall, before and during the festival', () => {
    expect(SONGS.techno.loop).toBe(true);
    expect(areaSong(EXPO_ID, 'belgium')).toBe('techno');
    expect(partySong(EXPO_ID)).toBe('techno');
    expect(partySong('trinity')).toBe('pub');
    expect(areaSong('belgium', 'belgium')).toBe('city');
  });

  it('keeps Blue Ghosts as something you take and get yipped on', () => {
    const text = [
      ...TECHNO_TRAINERS.flatMap((t) => [t.before, t.after]),
      ...play(trainerById(TECHNO_DJ).reward!, new Set()),
    ];
    expect(text.join(' ')).toMatch(/Take one, get yipped/);
    for (const t of text) if (/Blue Ghost/.test(t)) expect(t).not.toMatch(/drink/i);
  });
});

describe('Ghent in the Ranedex', () => {
  it('lists Ghent where its wild Ranemon are found', () => {
    for (const [id] of mapById('belgium').wild!.table) {
      const forms = [id, evolutionOf(id)?.id].filter((f): f is string => !!f);
      expect(
        forms.some((f) => habitats(f).some((h) => h.map === 'belgium')),
        id,
      ).toBe(true);
    }
  });
});
