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
  legendId,
} from '@/content/story/premier';
import { teamOf, trainerById } from '@/content/story/trainers';
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
  it('has twelve legends, played in order, each a little harder', () => {
    expect(FIXTURE_LIST.map((f) => f.legend)).toEqual([
      'Roy Keane',
      'Marcelo Bielsa',
      'Duncan Ferguson',
      'Robbie Keane',
      'Ian Wright',
      'Glenn Murray',
      'Paul McGrath',
      'Alan Shearer',
      'John Terry',
      'Steven Gerrard',
      'Thierry Henry',
      'Sergio Agüero',
    ]);
    const aces = PL_TRAINERS.map((t) => Math.max(...t.team.map(([, l]) => l)));
    for (let i = 1; i < aces.length; i++) expect(aces[i]).toBeGreaterThan(aces[i - 1]);
    expect(aces[0]).toBeGreaterThan(UK_LEVEL);
  });

  it('fields UK Ranemon only, on every team on the way', () => {
    for (const t of PREMIER_TRAINERS) {
      expect(t.uk, t.id).toBe(true);
      for (const [id] of t.team) expect(hasUkForm(id), `${t.id} ${id}`).toBe(true);
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

  it('makes you Champion at the Etihad, which opens the palace', () => {
    const flags = new Set<string>();
    const said = play(PL_TRAINERS.at(-1)!.reward!, flags);
    expect(flags.has(CHAMPION)).toBe(true);
    expect(said.join(' ')).toContain('PREMIER LEAGUE CHAMPION');
    expect(LONDON.landmarkLocks?.[2]?.flag).toBe(CHAMPION);
    const mission = MISSIONS.find((m) => m.id === 'kneecap')!;
    expect(mission.done).toBe(CHAMPION);
  });
});

describe('King’s Cross', () => {
  const room = mapById(KINGS_CROSS_ID);

  it('runs a train to every town, and the Tube, from its own platform', () => {
    const towns = room.npcs.map((n) =>
      play(n.talk!, new Set([RAILCARD])).find((l) => l.startsWith('TRAVEL')),
    );
    expect(towns.map((t) => t?.split(' ')[1]).sort()).toEqual(PL_MAPS.map((m) => m.id).sort());
  });

  it('only runs the far trains once you have Ian Wright’s Railcard', () => {
    const shut = room.npcs.filter(
      (n) => !play(n.talk!, new Set()).some((l) => l.startsWith('TRAVEL')),
    );
    expect(
      shut.map((n) => play(n.talk!, new Set([RAILCARD])).find((l) => l.startsWith('TRAVEL'))),
    ).toEqual(['TRAVEL falmer', 'TRAVEL birmingham', 'TRAVEL newcastle']);
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
