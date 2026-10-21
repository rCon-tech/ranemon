import { describe, expect, it } from 'vitest';
import { INTERIORS, mapById } from '@/content/story/maps';
import { ITEMS } from '@/lib/story/items';
import { NORM, NORM_FINDS, pickFind } from '@/lib/story/norm';
import { exportCode, importCode, parseSave } from '@/lib/story/save';
import { newGame, setFlag, unsetFlag } from '@/lib/story/state';
import { isPresent, npcsOf, type Step } from '@/lib/story/world';

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

describe('Sibeal and Norm', () => {
  const limerick = mapById('limerick');
  const sibeal = npcsOf(limerick).find((n) => n.item.look === 'sibeal')!;
  const pubs = INTERIORS.filter((m) => m.name.startsWith('McGrattans'));
  const inPub = (room: (typeof pubs)[number]) => room.npcs.find((n) => n.look === 'sibeal')!;

  it('meets you in Limerick, the second town, and lends you Norm if you say yes', () => {
    expect(sibeal).toBeTruthy();
    const flags = new Set<string>();
    play(sibeal.item.talk!, flags, false);
    expect(flags.has(NORM)).toBe(false);
    const said = play(sibeal.item.talk!, flags, true);
    expect(flags.has(NORM)).toBe(true);
    expect(said.join(' ')).toContain('McGrattans');
  });

  it('is off to McGrattans while you have him: every one of them', () => {
    expect(isPresent(sibeal.item, new Set())).toBe(true);
    expect(isPresent(sibeal.item, new Set([NORM]))).toBe(false);
    expect(pubs.length).toBeGreaterThanOrEqual(8);
    for (const room of pubs) {
      expect(isPresent(inPub(room), new Set()), room.id).toBe(false);
      expect(isPresent(inPub(room), new Set([NORM])), room.id).toBe(true);
    }
  });

  it('takes Norm back in any McGrattans, and you can borrow him again after', () => {
    for (const room of pubs) {
      const flags = new Set([NORM]);
      play(inPub(room).talk!, flags, false);
      expect(flags.has(NORM)).toBe(true);
      play(inPub(room).talk!, flags, true);
      expect(flags.has(NORM)).toBe(false);
    }
    const flags = new Set<string>();
    play(sibeal.item.talk!, flags, true);
    expect(flags.has(NORM)).toBe(true);
  });

  it('never fights: lending him leaves the party alone', () => {
    const before = newGame();
    const after = setFlag(before, NORM);
    expect(after.party).toEqual(before.party);
    expect(unsetFlag(after, NORM).flags).toEqual(before.flags);
  });

  it('finds real items, pints and tea most often and the Blue Ghost hardly ever', () => {
    for (const [id] of NORM_FINDS)
      expect(
        ITEMS.some((i) => i.id === id),
        id,
      ).toBe(true);
    const counts = new Map<string, number>();
    const n = 10000;
    for (let i = 0; i < n; i++) {
      const item = pickFind(i / n);
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
    expect(counts.get('pint')! / n).toBeCloseTo(0.3, 1);
    expect(counts.get('blue-ghost')! / n).toBeLessThan(0.02);
    expect(pickFind(0)).toBe('pint');
    expect(pickFind(0.99999)).toBe('blue-ghost');
  });

  it('stays with you through a save and a save code', () => {
    const g = setFlag(newGame(), NORM);
    expect(parseSave(JSON.stringify(g))?.flags).toContain(NORM);
    const back = importCode(exportCode(g));
    expect('state' in back && back.state.flags).toContain(NORM);
  });
});
