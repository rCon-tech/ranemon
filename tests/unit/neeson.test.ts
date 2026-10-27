import { describe, expect, it } from 'vitest';
import { STYLES } from '@/components/story/people';
import { interiorId } from '@/content/story/interiors';
import { INTERIORS, isFlat, mapById } from '@/content/story/maps';
import { MISSIONS } from '@/content/story/missions';
import {
  NEESON_DONE,
  NEESON_DOUBLE,
  NEESON_GATE,
  NEESON_START,
  NEESON_TRAINER,
  PUGH_LINES,
  PUGH_TALK,
} from '@/content/story/neeson';
import { legendId } from '@/content/story/premier';
import { SKINS } from '@/content/story/skins';
import { trainerById } from '@/content/story/trainers';
import { beatFlag } from '@/lib/story/state';
import { isPresent, type Step } from '@/lib/story/world';

/** Runs a script's flags and branches as if every battle was won and every question a yes. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'give') out.push(`GIVE ${s.item} ${s.count ?? 1}`);
    else if (s.do === 'pub') out.push('HEAL');
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
  }
  return out;
}

const tower = mapById(interiorId('london', 'L', 1));
const liam = tower.npcs.find((n) => n.trainer === NEESON_TRAINER)!;
const double = tower.npcs.find((n) => n.trainer === NEESON_DOUBLE)!;

describe('Florence Pugh in W.B Yates', () => {
  const yates = INTERIORS.filter((m) => m.name.startsWith('W.B Yates'));

  it('is behind the bar of every W.B Yates, healing your party, where Liam Neeson was', () => {
    expect(yates.length).toBeGreaterThan(5);
    for (const pub of yates) {
      expect(pub.npcs[0].look, pub.id).toBe('pugh');
      expect(pub.npcs[0].talk, pub.id).toBe(PUGH_TALK);
      expect(
        pub.npcs.some((n) => n.look === 'neeson'),
        pub.id,
      ).toBe(false);
    }
    expect(PUGH_TALK[0]).toEqual({ do: 'pub' });
    expect(STYLES.pugh).toBeDefined();
    expect(PUGH_LINES.length).toBe(6);
    for (const line of PUGH_LINES) expect(line.startsWith('FLORENCE PUGH: ')).toBe(true);
  });

  it('only heals until you have the Leeds jersey, the fifth', () => {
    expect(NEESON_GATE).toBe(`pl:${'leeds'}`);
    expect(trainerById(legendId('leeds'))).toBeDefined();
    const flags = new Set<string>();
    expect(play(PUGH_TALK, flags)).toEqual(['HEAL']);
    expect(flags.has(NEESON_START)).toBe(false);
  });

  it('then asks you once to go after Liam, up Big Ben', () => {
    const flags = new Set([NEESON_GATE]);
    const first = play(PUGH_TALK, flags);
    expect(flags.has(NEESON_START)).toBe(true);
    expect(first[0]).toBe('HEAL');
    expect(first.join(' ')).toContain('Big Ben');
    expect(play(PUGH_TALK, flags)).toEqual(['HEAL']);
  });
});

describe('Liam Neeson, up Big Ben', () => {
  it('waits in a 2D room at the top of the Elizabeth Tower, with his double on the way up', () => {
    expect(tower.name).toBe('Big Ben, London');
    expect(isFlat(tower)).toBe(true);
    for (const n of [liam, double]) {
      expect(n.look).toBe('neeson');
      expect(isPresent(n, new Set())).toBe(false);
      expect(isPresent(n, new Set([NEESON_START]))).toBe(true);
    }
    // The man in hi-vis still looks after the place.
    expect(tower.npcs.some((n) => n.look === 'border')).toBe(true);
    expect(liam.readyIf).toBe(beatFlag(NEESON_DOUBLE));
  });

  it('is a hard UK battle, a few levels over the Leeds jersey, after an easier one', () => {
    const palace = Math.max(...trainerById(legendId('leeds')).team.map(([, l]) => l));
    const sidemen = Math.min(...trainerById('sidemen-ksi').team.map(([, l]) => l));
    const him = trainerById(NEESON_TRAINER);
    const dbl = trainerById(NEESON_DOUBLE);
    expect(him.name).toBe('Liam Neeson');
    expect(him.uk && dbl.uk).toBe(true);
    expect(him.ai).toBe('hard');
    const levels = him.team.map(([, l]) => l);
    expect(Math.max(...levels)).toBeGreaterThan(palace);
    expect(Math.max(...levels)).toBeLessThan(sidemen);
    expect(Math.max(...dbl.team.map(([, l]) => l))).toBeLessThan(Math.max(...levels));
    expect(him.before).toContain('very particular set of skills');
  });

  it('gives you settled pints, a Blue Ghost and his skin for beating him', () => {
    const flags = new Set<string>();
    const said = play(trainerById(NEESON_TRAINER).reward!, flags);
    expect(flags.has(NEESON_DONE)).toBe(true);
    expect(said).toContain('GIVE settled-pint 3');
    expect(said).toContain('GIVE blue-ghost 1');
    const skin = SKINS.find((k) => k.id === 'neeson')!;
    expect(skin.name).toBe('Liam Neeson');
    expect(skin.unlock).toEqual([beatFlag(NEESON_TRAINER)]);
  });

  it('is on the Missions list, from Florence asking to beating him', () => {
    const m = MISSIONS.find((x) => x.id === 'neeson')!;
    expect(m.start).toBe(NEESON_START);
    expect(m.done).toBe(NEESON_DONE);
    expect(m.steps.map((s) => s.until)).toEqual([beatFlag(NEESON_DOUBLE), NEESON_DONE]);
    for (const s of m.steps) expect(s.where).toBe('Big Ben, London');
  });
});
