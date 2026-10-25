import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { mapById, isFlat } from '@/content/story/maps';
import { MISSIONS } from '@/content/story/missions';
import { KINGS_CROSS_ID } from '@/content/story/premier';
import {
  JAMIE,
  JAMIE_AT_KINGS_CROSS,
  METROPOLITAN,
  SIDEMEN_ARRIVED,
  SIDEMEN_DONE,
  SIDEMEN_GATE,
  SIDEMEN_SIX,
  SIDEMEN_START,
  SIDEMEN_TRAINERS,
  SIX,
  WEMBLEY,
  WEMBLEY_ID,
} from '@/content/story/sidemen';
import { SKINS } from '@/content/story/skins';
import { trainerById } from '@/content/story/trainers';
import { LONDON_EVOLUTIONS, SIDEMEN } from '@/lib/battle/london';
import { moveById } from '@/lib/battle/moves';
import { hasUkForm } from '@/lib/battle/uk';
import { UK_DEX } from '@/lib/story/ukdex';
import { find, isPresent, type Step } from '@/lib/story/world';

/** Runs a script's flags and branches as if every battle was won and every question a yes. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map}`);
    else if (s.do === 'recruit') out.push(`RECRUIT ${s.species} ${s.level}`);
    else if (s.do === 'give') out.push(`GIVE ${s.item} ${s.count ?? 1}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

/** Beats a trainer and plays their reward, the way the story screen does. */
const beat = (id: string, flags: Set<string>) => {
  flags.add(`beat:${id}`);
  return play(trainerById(id).reward ?? [], flags);
};

const room = (i: number) => mapById(interiorId(WEMBLEY_ID, 'L', i));

describe('the Sidemen’s Ranemon', () => {
  it('are six lines of two, each evolving at Lv30, in the UK Ranedex after London’s own', () => {
    expect(SIDEMEN.map((c) => c.name)).toEqual([
      'Ksimon',
      'Primape',
      'Minimon',
      'Mintair',
      'Zerkmon',
      'Zerkazam',
      'Behzmon',
      'Behzchamp',
      'Vikkmon',
      'Vikstarmie',
      'Tobimon',
      'Tobitic',
    ]);
    for (let i = 0; i < SIDEMEN.length; i += 2) {
      const evo = LONDON_EVOLUTIONS.find((e) => e.from === SIDEMEN[i].id)!;
      expect(evo.id).toBe(SIDEMEN[i + 1].id);
      expect(evo.level).toBe(30);
    }
    expect(UK_DEX.slice(-12).map((c) => c.id)).toEqual(SIDEMEN.map((c) => c.id));
  });

  it('each know their own special move from the start', () => {
    for (const c of SIDEMEN) {
      const special = moveById(c.moves[0]);
      expect(special.signature, c.id).toBe(SIDEMEN[SIDEMEN.indexOf(c) & ~1].id);
    }
  });

  it('are never wild: only on the Sidemen’s and Jamie’s teams', () => {
    const ids = new Set(SIDEMEN.map((c) => c.id));
    for (const [s] of WEMBLEY.wild!.table) expect(ids.has(s), s).toBe(false);
    expect(
      trainerById(JAMIE)
        .team.map(([s]) => s)
        .sort(),
    ).toEqual(
      SIDEMEN.filter((_, i) => i % 2)
        .map((c) => c.id)
        .sort(),
    );
  });
});

describe('Jamie Elliott at King’s Cross', () => {
  const kx = mapById(KINGS_CROSS_ID);

  it('is only there once you have the Brighton jersey, until you’ve beaten him', () => {
    expect(kx.npcs).toContain(JAMIE_AT_KINGS_CROSS);
    expect(isPresent(JAMIE_AT_KINGS_CROSS, new Set())).toBe(false);
    expect(isPresent(JAMIE_AT_KINGS_CROSS, new Set([SIDEMEN_GATE]))).toBe(true);
    expect(isPresent(JAMIE_AT_KINGS_CROSS, new Set([SIDEMEN_GATE, SIDEMEN_DONE]))).toBe(false);
  });

  it('starts the quest, and the Metropolitan line only runs to Wembley Park after', () => {
    expect(play(METROPOLITAN.talk!, new Set())).not.toContain(`TRAVEL ${WEMBLEY_ID}`);
    const flags = new Set([SIDEMEN_GATE]);
    play(JAMIE_AT_KINGS_CROSS.talk!, flags);
    expect(flags.has(SIDEMEN_START)).toBe(true);
    expect(play(METROPOLITAN.talk!, flags)).toContain(`TRAVEL ${WEMBLEY_ID}`);
  });
});

describe('Wembley Park', () => {
  it('is 2D only, in Britain, rooms and all, with a way back to King’s Cross', () => {
    expect(WEMBLEY.flat).toBe(true);
    expect(WEMBLEY.uk).toBe(true);
    for (let i = 0; i < 7; i++) expect(isFlat(room(i)), room(i).name).toBe(true);
    const guard = WEMBLEY.npcs[0];
    expect(play(guard.talk!, new Set())).toContain(`TRAVEL ${KINGS_CROSS_ID}`);
  });

  it('has a room for each of the six, then Wembley Stadium', () => {
    expect(find(WEMBLEY, 'L')).toHaveLength(7);
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => room(i).name.split(',')[0])).toEqual([
      'OVO Arena Wembley',
      'Sides',
      'Sidemen Clothing',
      'The Gym',
      'Sidemen FC clubhouse',
      'The Gaming House',
      'Wembley Stadium',
    ]);
    for (let i = 0; i < 6; i++) {
      // The Sideman at the top, and one of their crew to beat on the way up.
      const trainers = room(i)
        .npcs.filter((n) => n.trainer)
        .map((n) => n.trainer);
      expect(trainers).toHaveLength(2);
      expect(trainers[0]).toBe(SIX[i]);
    }
    expect(room(6).npcs[0].trainer).toBe(JAMIE);
  });

  it('keeps the stadium shut until all six are beaten, in any order', () => {
    expect(WEMBLEY.landmarkLocks?.[6]?.flag).toBe(SIDEMEN_SIX);
    const flags = new Set<string>();
    for (const id of SIX.slice(1).reverse()) beat(id, flags);
    expect(flags.has(SIDEMEN_SIX)).toBe(false);
    const said = beat(SIX[0], flags);
    expect(flags.has(SIDEMEN_SIX)).toBe(true);
    expect(said.join(' ')).toContain('Wembley’s open');
  });

  it('pays you with a spot in the Sidemen and one of their Ranemon', () => {
    const flags = new Set<string>();
    const said = beat(JAMIE, flags);
    expect(flags.has(SIDEMEN_DONE)).toBe(true);
    expect(said.filter((l) => l.startsWith('RECRUIT'))).toEqual(['RECRUIT primape 30']);
    expect(said).toContain('GIVE blue-ghost 5');
  });

  it('has a mission from Jamie’s ask to beating him, counting the six', () => {
    const m = MISSIONS.find((x) => x.id === 'sidemen')!;
    expect(m.start).toBe(SIDEMEN_START);
    expect(m.done).toBe(SIDEMEN_DONE);
    expect(m.steps.map((s) => s.until)).toEqual([SIDEMEN_ARRIVED, SIDEMEN_SIX, SIDEMEN_DONE]);
    expect(m.steps[1].count).toEqual(SIX.map((id) => `beat:${id}`));
  });

  it('gives a skin for each of the six, and for Jamie', () => {
    for (const id of [...SIX, JAMIE]) {
      expect(
        SKINS.some((s) => s.unlock.includes(`beat:${id}`)),
        id,
      ).toBe(true);
    }
  });

  it('puts the Sidemen between the Brighton jersey and Villa Park, with Jamie a step up', () => {
    const ace = (id: string) => Math.max(...trainerById(id).team.map(([, l]) => l));
    for (const id of SIX) expect(ace(id)).toBe(32);
    expect(ace(JAMIE)).toBe(34);
    // Everyone fields the lads in their UK forms, or the Sidemen's own.
    const own = new Set(SIDEMEN.map((c) => c.id));
    for (const t of SIDEMEN_TRAINERS) {
      for (const [s] of t.team) expect(hasUkForm(s) || own.has(s), `${t.id} ${s}`).toBe(true);
    }
    expect(trainerById(JAMIE).team).toHaveLength(6);
  });
});
