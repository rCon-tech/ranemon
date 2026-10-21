import { describe, expect, it } from 'vitest';
import { LATEST, UPDATES } from '@/content/updates';

describe('the Updates screen', () => {
  it('lists updates newest first, with real dates', () => {
    expect(UPDATES.length).toBeGreaterThan(5);
    const dates = UPDATES.map((u) => u.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const d of dates) expect(Number.isNaN(Date.parse(d))).toBe(false);
    expect(LATEST).toContain(UPDATES[0].title);
  });

  it('gives nothing away about the stories, or the test tools', () => {
    const text = JSON.stringify(UPDATES).toLowerCase();
    for (const secret of [
      'tobymon',
      'poseidon',
      'josh',
      'tablet',
      'bundoran',
      'donegal',
      'hellfire',
      'bead',
      'sibeal',
      'norm',
      'godcon',
      'developer',
      'unlocked',
      'cheat',
    ])
      expect(text, secret).not.toContain(secret);
  });
});
