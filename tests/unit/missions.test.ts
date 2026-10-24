import { describe, expect, it } from 'vitest';
import { UK_STARTER } from '@/content/story/kneecap';
import { COUNTIES, MAPS } from '@/content/story/maps';
import { RENT_CLUES, RENT_DONE, RENT_READY, RENT_START } from '@/content/story/rent';
import { TRAINERS } from '@/content/story/trainers';
import { DEX } from '@/lib/battle/evolutions';
import { devSave, storyFlags } from '@/lib/story/devsave';
import { isOpen, MISSIONS, openMissions, type Mission } from '@/lib/story/missions';
import { beatFlag } from '@/lib/story/state';

const flagsOf = (...flags: string[]) => new Set(flags);
const ids = (flags: Set<string>) => openMissions(flags).map((o) => o.mission.id);
const JERSEYS = COUNTIES.map((c) => `jersey:${c}`);

describe('the missions', () => {
  it('each have a unique id, a name, a line about them and a step to do', () => {
    const all = MISSIONS.map((m) => m.id);
    expect(new Set(all).size).toBe(all.length);
    for (const m of MISSIONS) {
      expect(m.name, m.id).not.toBe('');
      expect(m.about, m.id).not.toBe('');
      expect(m.steps.length, m.id).toBeGreaterThan(0);
      for (const s of m.steps) {
        expect(s.todo, m.id).not.toBe('');
        expect(s.where, m.id).not.toBe('');
      }
    }
  });

  it('only use flags the game can set', () => {
    const settable = new Set([
      ...storyFlags(),
      ...MAPS.map((m) => `visited:${m.id}`),
      ...TRAINERS.map((t) => beatFlag(t.id)),
      ...DEX.map((c) => `caught:${c.id}`),
      ...JERSEYS,
      // Set by the starter screens (Michael D's, and Próvaí's in London) and the ending, not by
      // a script step.
      'starter',
      UK_STARTER,
      'champion',
    ]);
    for (const m of MISSIONS) {
      const used = [m.start, m.done, ...m.steps.flatMap((s) => [s.until, ...(s.count ?? [])])];
      for (const f of used) if (f) expect(settable, `${m.id}: ${f}`).toContain(f);
    }
  });

  it('end on the step that finishes them, so finishing it closes the mission', () => {
    for (const m of MISSIONS) expect(m.steps.at(-1)!.until, m.id).toBe(m.done);
  });
});

describe('open missions', () => {
  it('starts with only the main story, at picking your first Ranemon', () => {
    const open = openMissions(flagsOf());
    expect(open.map((o) => o.mission.id)).toEqual(['champions']);
    expect(open[0].step.todo).toContain('first Ranemon');
  });

  it('points the main story at the next jersey, then at B&S', () => {
    const step = (flags: Set<string>) => openMissions(flags)[0].step;
    expect(step(flagsOf('starter')).todo).toContain('Clare jersey');
    expect(step(flagsOf('starter', 'jersey:clare', 'jersey:limerick')).todo).toContain(
      'Tipperary jersey',
    );
    const last = step(flagsOf('starter', ...JERSEYS));
    expect(last.todo).toContain('B&S');
    expect(last.where).toBe('Trinity College Dublin');
  });

  it('shows a side story only once it has started, and drops it once it is done', () => {
    expect(ids(flagsOf('starter'))).not.toContain('rent');
    expect(ids(flagsOf('starter', RENT_START))).toContain('rent');
    expect(ids(flagsOf('starter', RENT_START, RENT_DONE))).not.toContain('rent');
  });

  it('counts the clues found so far, then moves on once they are all in', () => {
    const rent = (flags: Set<string>) => openMissions(flags).find((o) => o.mission.id === 'rent')!;
    expect(rent(flagsOf(RENT_START)).progress).toEqual({ got: 0, of: 3 });
    expect(rent(flagsOf(RENT_START, RENT_CLUES[0], RENT_CLUES[2])).progress).toEqual({
      got: 2,
      of: 3,
    });
    const ready = rent(flagsOf(RENT_START, ...RENT_CLUES, RENT_READY));
    expect(ready.step.todo).toContain('Accuse');
    expect(ready.progress).toBeUndefined();
  });

  it('has nothing open once everything is done, for the empty screen', () => {
    const all = flagsOf(...MISSIONS.flatMap((m) => [m.start ?? '', m.done]));
    expect(openMissions(all)).toEqual([]);
  });

  it('keeps the last step if every step is set but the mission isn’t done', () => {
    const m: Mission = {
      id: 'odd',
      name: 'Odd',
      about: 'Odd.',
      done: 'odd:done',
      steps: [
        { until: 'odd:a', todo: 'A', where: 'Here' },
        { until: 'odd:b', todo: 'B', where: 'There' },
      ],
    };
    expect(isOpen(m, flagsOf('odd:a', 'odd:b'))).toBe(true);
    expect(openMissions(flagsOf('odd:a', 'odd:b'), [m])[0].step.todo).toBe('B');
  });

  it('shows the developer save the trips it leaves to play', () => {
    const open = ids(new Set(devSave().flags));
    expect(open).toContain('brighton');
    expect(open).toContain('techno');
    expect(open).not.toContain('champions');
  });
});
