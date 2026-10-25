import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { CHAMPION, RAILCARD } from '@/content/story/kneecap';
import { LONDON, UK_LEVEL } from '@/content/story/london';
import { mapById } from '@/content/story/maps';
import { MISSIONS } from '@/content/story/missions';
import {
  FIXTURE_LIST,
  KINGS_CROSS_ID,
  PL_FLAGS,
  PL_MAPS,
  PL_TRAINERS,
  PREMIER_TRAINERS,
  KX_DEPARTURES,
  legendId,
  nextClub,
  objectiveAt,
  objectiveText,
} from '@/content/story/premier';
import { find, slot } from '@/lib/story/world';
import { FIXTURES } from '@/content/story/kneecap';
import { migrate, replayKeane } from '@/lib/story/save';
import { METROPOLITAN } from '@/content/story/sidemen';
import { teamOf, trainerById } from '@/content/story/trainers';
import { LONDON_LINES } from '@/lib/battle/london';
import { hasUkForm } from '@/lib/battle/uk';
import type { Step } from '@/lib/story/world';

/** Plays a script against `flags`, answering every question yes, noting what happens. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

describe('a new story line in Britain', () => {
  it('starts your UK Ranemon at Lv5, and Thatcher with you', () => {
    expect(UK_LEVEL).toBe(5);
    expect(teamOf(trainerById('rival-uk-1'), 'simomon')[0][1]).toBe(5);
    expect(LONDON.wild!.max).toBeLessThanOrEqual(6);
  });
});

describe('the Premier League', () => {
  it('has twelve legends, smallest club to biggest, each a little harder', () => {
    expect(FIXTURE_LIST.map((f) => f.legend)).toEqual([
      'Glenn Murray',
      'Ian Wright',
      'Paul McGrath',
      'Duncan Ferguson',
      'Marcelo Bielsa',
      'Alan Shearer',
      'Robbie Keane',
      'Sergio Agüero',
      'John Terry',
      'Thierry Henry',
      'Steven Gerrard',
      'Roy Keane',
    ]);
    const aces = PL_TRAINERS.map((t) => Math.max(...t.team.map(([, l]) => l)));
    for (let i = 1; i < aces.length; i++) expect(aces[i]).toBeGreaterThan(aces[i - 1]);
    expect(aces[0]).toBeGreaterThan(UK_LEVEL);
  });

  it('fields UK Ranemon and London’s own only, on every team on the way', () => {
    for (const t of PREMIER_TRAINERS) {
      expect(t.uk, t.id).toBe(true);
      for (const [id] of t.team)
        expect(hasUkForm(id) || LONDON_LINES.includes(id), `${t.id} ${id}`).toBe(true);
    }
    for (const m of PL_MAPS)
      for (const [id] of m.wild?.table ?? []) expect(hasUkForm(id), `${m.id} ${id}`).toBe(true);
  });

  it('gives each club’s jersey, and shuts each ground until the one before is won', () => {
    const grounds = PL_MAPS.flatMap((m) =>
      (m.landmarks ?? []).map((_, i) => ({ map: m, i, room: mapById(interiorId(m.id, 'L', i)) })),
    );
    expect(grounds).toHaveLength(12);
    for (const [n, f] of FIXTURE_LIST.entries()) {
      const g = grounds.find((g) => g.room.name.startsWith(`${f.ground},`))!;
      expect(g, f.ground).toBeTruthy();
      expect(g.room.npcs[0].trainer).toBe(legendId(PL_FLAGS[n].slice(3)));
      expect(g.map.landmarkLocks?.[g.i]?.flag).toBe(n === 0 ? undefined : PL_FLAGS[n - 1]);
      const flags = new Set<string>();
      play(trainerById(g.room.npcs[0].trainer!).reward!, flags);
      expect(flags.has(f.flag), f.club).toBe(true);
    }
  });

  it('makes you Champion at Old Trafford, which opens the palace', () => {
    expect(PL_TRAINERS.at(-1)!.name).toBe('Roy Keane');
    const flags = new Set<string>();
    const said = play(PL_TRAINERS.at(-1)!.reward!, flags);
    expect(flags.has(CHAMPION)).toBe(true);
    expect(said.join(' ')).toContain('PREMIER LEAGUE CHAMPION');
    expect(LONDON.landmarkLocks?.[2]?.flag).toBe(CHAMPION);
    const mission = MISSIONS.find((m) => m.id === 'kneecap')!;
    expect(mission.steps.map((st) => st.until)).toContain(CHAMPION);
  });
});

describe('King’s Cross', () => {
  const room = mapById(KINGS_CROSS_ID);
  // The Metropolitan line and Jamie Elliott are the Sidemen's (sidemen.test.ts).
  const platforms = room.npcs.filter((n) => n.look === 'conductor' && n !== METROPOLITAN);

  it('numbers its platforms in the order you first need them, each saying where it goes', () => {
    expect(KX_DEPARTURES.map((d) => d.map)).toEqual([
      'falmer',
      'tube',
      'birmingham',
      'liverpool',
      'leeds',
      'newcastle',
      'manchester',
    ]);
    for (const [i, n] of platforms.entries()) {
      const ask = n.talk![0];
      expect(ask.do === 'ask' && ask.text, `platform ${i + 1}`).toContain(`Platform ${i + 1}.`);
      // Standing under its own part of the board.
      expect(find(room, slot(i))[0]).toEqual({ x: 2 * i + 1, y: 3 });
    }
    // The ticket office opens the board as a list to pick from.
    const clerk = room.npcs.find((n) => n.look === 'clerk')!;
    expect(clerk.talk!.some((s) => s.do === 'departures' && s.station === 'kings-cross')).toBe(
      true,
    );
  });

  it('runs a train to every town, and the Tube, from its own platform', () => {
    const towns = platforms.map((n) =>
      play(n.talk!, new Set([RAILCARD])).find((l) => l.startsWith('TRAVEL')),
    );
    expect(towns.map((t) => t?.split(' ')[1]).sort()).toEqual(PL_MAPS.map((m) => m.id).sort());
  });

  it('only runs the far trains once you have Ian Wright’s Railcard', () => {
    const shut = platforms.filter(
      (n) => !play(n.talk!, new Set()).some((l) => l.startsWith('TRAVEL')),
    );
    expect(
      shut.map((n) => play(n.talk!, new Set([RAILCARD])).find((l) => l.startsWith('TRAVEL'))),
    ).toEqual(['TRAVEL birmingham', 'TRAVEL newcastle']);
    const wright = trainerById(legendId('palace'));
    const flags = new Set<string>();
    play(wright.reward!, flags);
    expect(flags.has(RAILCARD)).toBe(true);
  });

  it('is brought back to from every town by its guard', () => {
    for (const m of PL_MAPS) {
      const guard = m.npcs.find((n) => n.look === 'conductor')!;
      expect(play(guard.talk!, new Set()), m.id).toContain(`TRAVEL ${KINGS_CROSS_ID}`);
    }
  });

  it('has a W.B Yates in every town with a pub, each with an owner of its own', () => {
    const owners = PL_MAPS.filter((m) => m.yates).map((m) => m.yates!.owner.look);
    expect(new Set(owners).size).toBe(owners.length);
    for (const m of PL_MAPS.filter((m) => m.yates))
      expect(mapById(interiorId(m.id, 'P', 0)).name).toBe(`W.B Yates, ${m.name.split(',')[0]}`);
  });
});

describe('where to go next', () => {
  const start = new Set([FIXTURES]);
  const won = (n: number) => new Set([FIXTURES, ...PL_FLAGS.slice(0, n)]);

  it('says the next club, its ground and its platform, from Brighton up to United', () => {
    expect(nextClub(new Set())).toBeNull();
    expect(nextClub(start)).toMatchObject({ n: 1, club: 'Brighton & Hove Albion', platform: 1 });
    expect(objectiveText(start)).toBe('NEXT 1/12: Brighton at The Amex · Platform 1');
    expect(nextClub(won(2))).toMatchObject({ club: 'Aston Villa', platform: 3, to: 'Birmingham' });
    expect(nextClub(won(11))).toMatchObject({
      n: 12,
      club: 'Manchester United',
      map: 'manchester',
    });
    expect(nextClub(new Set([...won(11), CHAMPION]))).toBeNull();
  });

  it('puts the marker on King’s Cross, the right guard, then the right turnstiles', () => {
    expect(objectiveAt(LONDON, start)).toEqual({ ...find(LONDON, 'L')[0], on: 'door' });
    const kx = mapById(KINGS_CROSS_ID);
    expect(objectiveAt(kx, won(2))).toEqual({ x: 5, y: 3, on: 'person' });
    const falmer = mapById('falmer');
    const door = objectiveAt(falmer, start)!;
    expect(falmer.rows[door.y][door.x]).toBe('L');
    // In the wrong town, it's the guard who takes you back.
    expect(objectiveAt(mapById('leeds'), start)).toMatchObject({ on: 'person' });
    expect(objectiveAt(LONDON, new Set())).toBeNull();
  });

  it('draws every ground as its club’s stadium, over its own door', () => {
    for (const m of PL_MAPS) {
      const grounds = (m.scenery ?? []).filter((s) => s.kind === 'stadium');
      expect(grounds.length, m.id).toBe(m.landmarks?.length);
      for (const s of grounds) {
        expect(m.rows[s.y1].slice(s.x0, s.x1 + 1), m.id).toContain('L');
        // Nothing tall grows through the roof.
        expect(m.rows[0].slice(s.x0, s.x1 + 1)).not.toContain('T');
      }
    }
  });

  it('gives a save partway through the old order Roy Keane again, as the final', () => {
    const partway = ['london:fixtures', 'pl:united', 'beat:pl-united', 'pl:leeds'];
    expect(replayKeane(partway)).toEqual(['london:fixtures', 'pl:leeds']);
    const done = [...PL_FLAGS, CHAMPION];
    expect(replayKeane(done)).toEqual(done);
    const s = migrate({
      version: 1,
      schema: 5,
      map: 'manchester',
      x: 5,
      y: 3,
      face: 'down',
      party: [],
      box: [],
      bag: {},
      money: 0,
      flags: partway,
      seen: [],
      caught: [],
      pub: { map: 'manchester', x: 5, y: 3 },
      uid: 1,
      steps: 0,
    })!;
    expect(s.flags).not.toContain('pl:united');
    expect(s.flags).toContain('pl:leeds');
  });
});
