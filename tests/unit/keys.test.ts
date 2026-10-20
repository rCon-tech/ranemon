import { describe, expect, it } from 'vitest';
import { mapById } from '@/content/story/maps';
import { CERT, HM, KEY_ITEMS, notice } from '@/lib/story/keys';
import { npcsOf, type Step } from '@/lib/story/world';

describe('HM Neurodivergent', () => {
  const tipp = mapById('tipperary');

  it('locks the Semple Stadium gym until you have it', () => {
    expect(tipp.gym?.lock?.flag).toBe(HM);
    expect(tipp.gym?.look).toBe('saoirse');
  });

  it('comes from the old man after five yes or no questions, with the certificate', () => {
    const vet = npcsOf(tipp).find((n) => n.item.look === 'oldman')!;
    const script = vet.item.talk![0] as Extract<Step, { do: 'if' }>;
    expect(script.flag).toBe(HM);
    const quiz = script.else!.filter((s) => s.do === 'ask');
    expect(quiz).toHaveLength(5);
    for (const q of quiz) {
      expect(q.do === 'ask' && q.yes?.length && q.no?.length).toBeTruthy();
    }
    const flags = script.else!.flatMap((s) => (s.do === 'flag' ? [s.flag] : []));
    expect(flags).toEqual([CERT, HM]);
  });

  it('notices everything on a map, Blue Ghosts included', () => {
    const lines = notice(tipp, new Set(), 1);
    expect(lines[0]).toBe('You used HM NEURODIVERGENT!');
    expect(lines[1]).toMatch(/\d+ trees, \d+ tufts of long grass/);
    expect(lines[2]).toContain('1 Blue Ghost fizzing');
    expect(notice(tipp, new Set(), 0)[2]).toContain('No Blue Ghosts');
  });

  it('is a key item you can use', () => {
    expect(KEY_ITEMS.find((k) => k.flag === HM)?.usable).toBe(true);
  });
});
