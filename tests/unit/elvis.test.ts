import { describe, expect, it } from 'vitest';
import { COATS } from '@/components/story/people';
import { CARL_PUB } from '@/content/story/ball';
import { ELVIS_PUB } from '@/content/story/elvis';
import { INTERIORS, mapById } from '@/content/story/maps';
import { NORM_RETURNED } from '@/content/story/sibeal';
import { skinById } from '@/content/story/skins';
import { lineCues } from '@/lib/sound/cues';
import {
  companionOf,
  ELVIS,
  ELVIS_RETURNED,
  FIND_GAP,
  finds,
  NORM,
  NORM_FIND_RATE,
} from '@/lib/story/norm';
import { exportCode, importCode } from '@/lib/story/save';
import { newGame, setFlag } from '@/lib/story/state';
import { isDog, isPresent, npcsOf, type Step } from '@/lib/story/world';

/** Plays a script against `flags`, answering every question with `answer`. */
function play(steps: Step[], flags: Set<string>, answer: boolean, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'unflag') flags.delete(s.flag);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, answer, out);
    else if (s.do === 'ask') play((answer ? s.yes : s.no) ?? [], flags, answer, out);
  }
  return out;
}

const CARL_LINE =
  'CARL RYAN: the big lad needs a walk but I am here locking for Q4. Would you mind walking him?';

describe('Elvis, Carl Ryan’s dog', () => {
  const pubs = INTERIORS.filter((m) => m.name.startsWith('McGrattans'));

  it('lies right beside Carl in every McGrattans, without boxing him in', () => {
    expect(pubs.length).toBeGreaterThanOrEqual(8);
    for (const room of pubs) {
      const placed = npcsOf(room);
      const carl = placed.find((n) => n.item === CARL_PUB)!;
      const elvis = placed.find((n) => n.item === ELVIS_PUB)!;
      expect(carl, room.id).toBeTruthy();
      expect(elvis, room.id).toBeTruthy();
      expect(Math.abs(carl.x - elvis.x) + Math.abs(carl.y - elvis.y), room.id).toBe(1);
      // You can still walk up to Carl from above, as before.
      expect(room.rows[carl.y - 1][carl.x], room.id).toBe('F');
    }
  });

  it('is a dog, really huge and black', () => {
    expect(isDog(ELVIS_PUB.look)).toBe(true);
    expect(COATS.elvis.scale).toBeGreaterThanOrEqual(2 * COATS.norm.scale);
    expect(COATS.elvis.coat).toMatch(/^#[0-2][0-9a-f][0-2][0-9a-f][0-2][0-9a-f]$/);
  });

  it('gets Carl asking you to walk him, word for word, and comes with you if you say yes', () => {
    const flags = new Set<string>();
    const no = play(ELVIS_PUB.talk!, flags, false);
    expect(no).toContain(CARL_LINE);
    expect(flags.has(ELVIS)).toBe(false);
    const yes = play(ELVIS_PUB.talk!, flags, true);
    expect(yes).toContain(CARL_LINE);
    expect(flags.has(ELVIS)).toBe(true);
    expect(companionOf(flags)).toBe('elvis');
    // He's off with you, so he's gone from beside Carl.
    expect(isPresent(ELVIS_PUB, flags)).toBe(false);
  });

  it('sends Norm back to Sibeal if you were walking him: one dog at a time', () => {
    const flags = new Set([NORM]);
    const said = play(ELVIS_PUB.talk!, flags, true);
    expect(said.some((t) => t.startsWith('Norm went back to Sibeal'))).toBe(true);
    expect(flags.has(NORM)).toBe(false);
    expect(flags.has(NORM_RETURNED)).toBe(true);
    expect(companionOf(flags)).toBe('elvis');
    // Without Norm, nothing is said about him.
    const alone = play(ELVIS_PUB.talk!, new Set(), true);
    expect(alone.some((t) => t.includes('Sibeal'))).toBe(false);
  });

  it('goes back to Carl if you borrow Norm from Sibeal', () => {
    const sibeal = npcsOf(mapById('limerick')).find((n) => n.item.look === 'sibeal')!;
    const flags = new Set([ELVIS]);
    const said = play(sibeal.item.talk!, flags, true);
    expect(said.some((t) => t.startsWith('Elvis went back to Carl'))).toBe(true);
    expect(flags.has(ELVIS)).toBe(false);
    expect(companionOf(flags)).toBe('norm');
  });

  it('goes back to Carl when you ask, and the Carl Ryan skin is yours', () => {
    const flags = new Set([ELVIS]);
    play(CARL_PUB.talk!, flags, false);
    expect(flags.has(ELVIS)).toBe(true);
    play(CARL_PUB.talk!, flags, true);
    expect(flags.has(ELVIS)).toBe(false);
    expect(flags.has(ELVIS_RETURNED)).toBe(true);
    expect(isPresent(ELVIS_PUB, flags)).toBe(true);
    expect(skinById('carl')!.unlock).toEqual([ELVIS_RETURNED]);
    // Without Elvis, Carl doesn't ask for him.
    const said = play(CARL_PUB.talk!, new Set(), true);
    expect(said.some((t) => t.includes('Give Elvis back'))).toBe(false);
  });

  it('barks when he finds something, as Norm does', () => {
    expect(lineCues('Elvis found something!')).toEqual([{ sfx: 'bark' }]);
    expect(lineCues('Norm found something!')).toEqual([{ sfx: 'bark' }]);
  });

  it('stays with you through a save code', () => {
    const g = { ...setFlag(newGame(), ELVIS), foundAt: 42 };
    const back = importCode(exportCode(g));
    expect('state' in back && back.state.flags).toContain(ELVIS);
  });
});

describe('the dogs’ nose for things', () => {
  it('never finds twice within FIND_GAP steps', () => {
    expect(finds(150, 100, 0)).toBe(false);
    expect(finds(100 + FIND_GAP - 1, 100, 0)).toBe(false);
    expect(finds(100 + FIND_GAP, 100, 0)).toBe(true);
    // A save from before has no last find.
    expect(finds(3, undefined, 0)).toBe(true);
  });

  it('finds things much less often than the old 1 in 150 a step', () => {
    expect(NORM_FIND_RATE).toBeLessThan(1 / 150);
    // Walk 100,000 steps with a fixed sequence of rolls and count the finds.
    let seed = 1;
    const roll = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    let foundAt: number | undefined;
    let found = 0;
    const n = 100000;
    for (let steps = 1; steps <= n; steps++)
      if (finds(steps, foundAt, roll())) {
        found++;
        foundAt = steps;
      }
    const every = n / found;
    expect(every).toBeGreaterThan(300);
    expect(every).toBeLessThan(420);
  });

  it('is for whichever dog is with you', () => {
    expect(companionOf(new Set())).toBeNull();
    expect(companionOf([NORM])).toBe('norm');
    expect(companionOf([ELVIS])).toBe('elvis');
  });
});
