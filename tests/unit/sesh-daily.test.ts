import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countdown, countsFor, dailyRun, dailySeed, dayOf, untilNext } from '@/lib/sesh/daily';
import {
  loadDailyBests,
  loadSesh,
  recordDaily,
  slotOf,
  storeSesh,
  type SeshBest,
} from '@/lib/sesh/save';
import { newRun } from '@/lib/sesh/run';

describe('the Daily Challenge', () => {
  it('is the day in UTC, whatever the time zone', () => {
    expect(dayOf(Date.parse('2026-10-28T23:59:59Z'))).toBe('2026-10-28');
    expect(dayOf(Date.parse('2026-10-29T00:00:00Z'))).toBe('2026-10-29');
    // Just past midnight in Dublin in summer is still the day before in UTC.
    expect(dayOf(Date.parse('2026-07-01T00:30:00+01:00'))).toBe('2026-06-30');
  });

  it('is the same night for everyone on a day, and a different one the next day', () => {
    expect(dailyRun('2026-10-28')).toEqual(dailyRun('2026-10-28'));
    expect(dailyRun('2026-10-28').daily).toBe('2026-10-28');
    expect(dailySeed('2026-10-28')).not.toBe(dailySeed('2026-10-29'));
    expect(dailyRun('2026-10-28').party).not.toEqual(dailyRun('2026-10-29').party);
  });

  it('counts down to midnight UTC', () => {
    expect(untilNext(Date.parse('2026-10-28T23:00:00Z'))).toBe(60 * 60 * 1000);
    expect(untilNext(Date.parse('2026-10-28T00:00:00Z'))).toBe(24 * 60 * 60 * 1000);
    expect(countdown(untilNext(Date.parse('2026-10-28T20:58:30Z')))).toBe('03:01:30');
    expect(countdown(0)).toBe('00:00:00');
  });

  it('counts on its day’s board if it’s in within 48 hours of the day ending', () => {
    expect(countsFor('2026-10-28', Date.parse('2026-10-28T12:00:00Z'))).toBe(true);
    expect(countsFor('2026-10-28', Date.parse('2026-10-30T23:59:59Z'))).toBe(true);
    expect(countsFor('2026-10-28', Date.parse('2026-10-31T00:00:00Z'))).toBe(false);
    expect(countsFor('2026-10-28', Date.parse('2026-10-27T23:59:59Z'))).toBe(false);
  });
});

describe('Daily Challenge saves', () => {
  beforeEach(() => {
    const kept = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => kept.get(k) ?? null,
      setItem: (k: string, v: string) => void kept.set(k, v),
      removeItem: (k: string) => void kept.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  const best = (score: number): SeshBest => ({ score, beaten: 1, standing: 2, at: 'x' });

  it('keep a Daily Challenge apart from a free run, so starting one never ends the other', () => {
    const free = newRun(1);
    const day = dailyRun('2026-10-28');
    expect(slotOf(free)).toBe('free');
    expect(slotOf(day)).toBe('daily');
    storeSesh('Rich', { v: 1, run: free, actions: [] }, slotOf(free));
    storeSesh('Rich', { v: 1, run: day, actions: [] }, slotOf(day));
    expect(loadSesh('Rich')!.run).toEqual(free);
    expect(loadSesh('Rich', 'daily')!.run).toEqual(day);
  });

  it('keep your best score each day, for the last 30 days', () => {
    recordDaily('Rich', '2026-10-28', best(500));
    recordDaily('Rich', '2026-10-28', best(300));
    expect(loadDailyBests('Rich')['2026-10-28'].score).toBe(500);
    recordDaily('Rich', '2026-10-28', best(900));
    expect(loadDailyBests('Rich')['2026-10-28'].score).toBe(900);
    for (let d = 1; d <= 31; d++)
      recordDaily('Rich', `2026-08-${String(d).padStart(2, '0')}`, best(d));
    const kept = loadDailyBests('Rich');
    expect(Object.keys(kept)).toHaveLength(30);
    expect(kept['2026-10-28']).toBeDefined();
    expect(kept['2026-08-01']).toBeUndefined();
  });
});
