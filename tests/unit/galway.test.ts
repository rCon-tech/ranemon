import { describe, expect, it } from 'vitest';
import {
  ABOVE,
  breakRun,
  CHAMPION_OF_IRELAND,
  COLLINS,
  COLLINS_HEARD,
  ELITE,
  GALWAY_TRAINERS,
  HALL_ID,
  ROOMS,
  RUN,
  wonFlag,
} from '@/content/story/galway';
import { mapById, outsideOf } from '@/content/story/maps';
import { interiorId } from '@/content/story/interiors';
import { MISSIONS } from '@/content/story/missions';
import { skinById } from '@/content/story/skins';
import { departureTo, homeward, STATION_ID, ticket } from '@/content/story/station';
import { stopsOf } from '@/content/story/townmap';
import { trainerById } from '@/content/story/trainers';
import { MAX_LEVEL } from '@/lib/battle/creature';
import { creatureById } from '@/lib/battle/roster';
import { startBattle } from '@/lib/battle/engine';
import { battleSong } from '@/lib/sound/cues';
import { scaleTeam } from '@/lib/story/levels';
import { expAt, gainExp, makeMember, toEntrant } from '@/lib/story/party';
import { healParty, newGame, recruit, settleBattle, type StoryState } from '@/lib/story/state';
import {
  canEnter,
  DELTA,
  find,
  isWalkable,
  marker,
  npcsOf,
  spottedBy,
  tileAt,
  type Dir,
  type GameMap,
  type Step,
} from '@/lib/story/world';

/** Plays a script against `flags`, winning every battle, and returns what was said and done. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'give') out.push(`GIVE ${s.item} ${s.count ?? 1}`);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map} ${s.x},${s.y}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

/** Winning a battle against a trainer, as the story screen does it: the beat flag, then the reward. */
function win(id: string, flags: Set<string>): string[] {
  const first = !flags.has(`beat:${id}`);
  flags.add(`beat:${id}`);
  return first ? play(trainerById(id).reward ?? [], flags) : [];
}

/** Every tile you can walk to from a start, past whoever's beaten, but stopped by any trainer who sees you. */
function reach(map: GameMap, flags: Set<string>): Set<string> {
  const from = marker(map, '@');
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [from];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const dir of Object.keys(DELTA) as Dir[]) {
      const [dx, dy] = DELTA[dir];
      const [nx, ny] = [x + dx, y + dy];
      const key = `${nx},${ny}`;
      if (seen.has(key) || !canEnter(map, nx, ny, flags)) continue;
      seen.add(key);
      // Spotted: you get no further without a battle.
      if (spottedBy(map, nx, ny, flags, (t) => flags.has(`beat:${t}`))) continue;
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

const hall = mapById(HALL_ID);
const galway = mapById('galway');

describe('the level cap', () => {
  it('goes to 100', () => {
    expect(MAX_LEVEL).toBe(100);
    const m = makeMember('gibbsmon', 98, 1);
    const up = gainExp(m, expAt(MAX_LEVEL + 5)).member;
    expect(up.level).toBe(100);
    expect(up.exp).toBe(expAt(100));
  });
});

describe('the Intercity to Galway', () => {
  const line = departureTo('galway');

  it('runs from platform 6 at Connolly once you’ve beaten B&S', () => {
    expect(line.platform).toBe(6);
    const early = play(ticket(line), new Set());
    expect(early.some((l) => l.startsWith('TRAVEL'))).toBe(false);
    expect(early.join(' ')).toMatch(/beaten B&S/);
    const there = play(ticket(line), new Set(['champion'])).find((l) => l.startsWith('TRAVEL'))!;
    const [, map, at] = there.split(' ');
    const [x, y] = at.split(',').map(Number);
    expect(map).toBe('galway');
    expect(isWalkable(tileAt(galway, x, y))).toBe(true);
    const conductor = npcsOf(galway).find((n) => n.item.look === 'conductor')!;
    expect(conductor.item.talk).toEqual(homeward('galway'));
    expect(play(homeward('galway'), new Set()).at(-1)).toMatch(`TRAVEL ${STATION_ID}`);
  });

  it('puts Galway on the Town Map once you’ve been', () => {
    const game = newGame();
    expect(stopsOf(game).some((s) => s.id === 'galway')).toBe(false);
    const stop = stopsOf({ ...game, flags: ['visited:galway'] }).find((s) => s.id === 'galway');
    expect(stop).toMatchObject({ town: 'Galway City', county: 'Co. Galway' });
  });
});

describe('Galway', () => {
  it('is 2D only, with a pub, a shop, long grass and the Hall of Champions', () => {
    expect(galway.flat).toBe(true);
    expect(hall.inside?.map).toBe('galway');
    for (const door of ['P', 'M']) expect(find(galway, door), door).toHaveLength(1);
    expect(find(galway, 'L')).toHaveLength(2);
    expect(find(galway, ',').length).toBeGreaterThan(0);
    expect(hall.name).toBe('Rob Lipsett’s Gym, Galway City');
  });

  it('has the doorman tell you the rules', () => {
    const doorman = npcsOf(galway).find((n) => n.item.look === 'bouncer')!;
    const said = play(doorman.item.talk!, new Set()).join(' ');
    expect(said).toMatch(/one after the other/);
    expect(said).toMatch(/McGrattans/);
  });
});

describe('the Hall of Champions', () => {
  const rooms = ROOMS.map((id) => mapById(id));

  it('is five rooms in a row, each one 2D and each way out back to Eyre Square', () => {
    expect(rooms.map((r) => r.name)).toEqual([
      'Rob Lipsett’s Gym, Galway City',
      'Blindboy’s Study, Galway City',
      'The 2 Johnnies’ Kitchen, Galway City',
      'Bono’s Stage, Galway City',
      'The Champion’s Hall, Galway City',
    ]);
    const door = find(galway, 'L')[1];
    for (const room of rooms) {
      expect(room.inside, room.id).toEqual({ map: 'galway', ...door });
      expect(outsideOf(room).flat, room.id).toBe(true);
    }
    // Each of the four's rooms has one door at the top, into the next; the Champion's has none.
    for (const [i, room] of rooms.entries()) {
      const doors = find(room, 'L');
      expect(doors, room.id).toHaveLength(i < 4 ? 1 : 0);
      if (i < 4) expect(interiorId(room.id, 'L', 0)).toBe(ROOMS[i + 1]);
    }
  });

  it('puts each battler in the middle of their room, in the way of the door to the next', () => {
    expect(GALWAY_TRAINERS.map((t) => t.name)).toEqual([
      'Rob Lipsett',
      'Blindboy Boatclub',
      'The 2 Johnnies',
      'Bono',
      'Michael Collins',
    ]);
    for (const [i, id] of [...ELITE, COLLINS].entries()) {
      const room = rooms[i];
      const who = npcsOf(room).find((n) => n.item.trainer === id)!;
      expect(who, id).toBeTruthy();
      if (i > 0) expect(who.item.readyIf).toBe(`beat:${ELITE[i - 1]}`);
      // One step in from the door and they've seen you.
      const flags = new Set(i > 0 ? [`beat:${ELITE[i - 1]}`] : []);
      const start = marker(room, '@');
      expect(who.x, id).toBe(start.x);
      expect(spottedBy(room, start.x, start.y - 1, flags, () => false)?.item.trainer, id).toBe(id);
      if (i === 4) continue;
      // Their door stays shut until they're beaten in this run.
      expect(room.landmarkLocks?.[0]?.flag, id).toBe(`beat:${id}`);
      const door = find(room, 'L')[0];
      flags.add(`beat:${id}`);
      expect(reach(room, flags).has(`${door.x},${door.y + 1}`), id).toBe(true);
    }
  });

  it('reveals Collins once all four are beaten in the same run', () => {
    const flags = new Set<string>();
    const said = ELITE.flatMap((id) => win(id, flags)).join(' ');
    expect(said).toMatch(/one true Champion of Ireland/);
    expect(flags.has(COLLINS_HEARD)).toBe(true);
    // His room is behind Bono's door.
    expect(rooms[3].landmarkLocks?.[0]?.flag).toBe(`beat:${ELITE[3]}`);
  });

  it('makes you Champion of Ireland the first time you beat Collins', () => {
    const flags = new Set<string>();
    for (const id of ELITE) win(id, flags);
    const said = win(COLLINS, flags);
    expect(said).toContain('You are the CHAMPION OF IRELAND!');
    expect(said).toContain('GIVE perfect-pour 1');
    expect(flags.has(CHAMPION_OF_IRELAND)).toBe(true);
    // Another run, another win, and no second prize.
    const again = new Set(breakRun([...flags]));
    for (const id of ELITE) win(id, again);
    const second = win(COLLINS, again);
    expect(second.join(' ')).toMatch(/Again, so/);
    expect(second).not.toContain('GIVE perfect-pour 1');
  });

  it('has hard teams of 5 or 6, boss music for Collins and the leader theme for the four', () => {
    for (const t of GALWAY_TRAINERS) {
      expect(t.ai, t.id).toBe('hard');
      expect(t.team.length, t.id).toBeGreaterThanOrEqual(5);
      expect(t.above, t.id).toBe(ABOVE[t.id]);
    }
    expect(trainerById(COLLINS).team).toHaveLength(6);
    expect(battleSong('night', false, COLLINS)).toBe('boss');
    expect(battleSong('gym', false, ELITE[0])).toBe('leader');
    expect(trainerById('galway-lipsett').after).toMatch(
      /that’s what happens when you take preworkout before a Ranemon battle/,
    );
  });
});

describe('a run through the Championship', () => {
  const champion = (): StoryState => ({
    ...recruit(newGame(), 'gibbsmon', 70).state,
    flags: ['champion', ...RUN.slice(0, 3), wonFlag(ELITE[0]), CHAMPION_OF_IRELAND],
  });

  it('ends when you heal, but keeps what you’ve won for good', () => {
    const healed = healParty(champion());
    for (const f of RUN) expect(healed.flags, f).not.toContain(f);
    expect(healed.flags).toContain(wonFlag(ELITE[0]));
    expect(healed.flags).toContain(CHAMPION_OF_IRELAND);
    expect(healed.flags).toContain('champion');
  });

  it('ends when you lose', () => {
    const s = champion();
    const foe = creatureById('enda');
    const { state } = startBattle([s.party.map(toEntrant), [{ creature: foe, level: 90 }]], 1);
    const lost = structuredClone(state);
    lost.teams[0].battlers[0].hp = 0;
    const after = settleBattle(s, lost, 'loss', [0], true, ELITE[3]).state;
    for (const f of RUN) expect(after.flags, f).not.toContain(f);
  });

  it('leaves other flags alone', () => {
    const flags = ['champion', 'beat:bns'];
    expect(breakRun(flags)).toBe(flags);
  });
});

describe('level scaling in Galway', () => {
  const party = (level: number) => [makeMember('gibbsmon', level, 1)];
  const ace = (team: [string, number][]) => Math.max(...team.map(([, l]) => l));

  it('scales the four and Collins to your best, Champion or not, never past 100', () => {
    for (const t of GALWAY_TRAINERS) {
      const scaled = (level: number) =>
        ace(scaleTeam(t.team, { flags: [], party: party(level) }, t.above));
      // Never weaker than they start.
      expect(scaled(30), t.id).toBe(ace(t.team));
      expect(scaled(80), t.id).toBe(80 + t.above!);
      expect(scaled(100), t.id).toBe(Math.min(MAX_LEVEL, 100 + t.above!));
    }
    // Collins comes in highest.
    for (const id of ELITE) expect(ABOVE[COLLINS]).toBeGreaterThanOrEqual(ABOVE[id]);
  });

  it('keeps everyone else unscaled until you’re Champion', () => {
    const gym = trainerById('gym-clare').team;
    expect(scaleTeam(gym, { flags: [], party: party(80) })).toEqual(gym);
    expect(ace(scaleTeam(gym, { flags: ['champion'], party: party(80) }))).toBe(80);
  });
});

describe('the Championship in the rest of the game', () => {
  it('is a mission from the first time you’re in Galway', () => {
    const m = MISSIONS.find((m) => m.id === 'galway')!;
    expect(m.start).toBe('visited:galway');
    expect(m.done).toBe(CHAMPION_OF_IRELAND);
    expect(m.steps.map((s) => s.until)).toEqual([COLLINS_HEARD, CHAMPION_OF_IRELAND]);
  });

  it('unlocks a skin for each of them', () => {
    for (const id of ['lipsett', 'blindboy', 'johnnyb', 'johnnysmacks', 'bono', 'collins'])
      expect(skinById(id), id).toBeTruthy();
    expect(skinById('collins')!.unlock).toEqual([CHAMPION_OF_IRELAND]);
  });
});
