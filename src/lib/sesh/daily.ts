import { seedFrom } from '../battle/rng';
import { newRun, type SeshRun } from './run';

/**
 * The Daily Challenge: a Quick Sesh everyone plays on the same seed for one day (UTC), so the
 * same party, maps, foes and bosses. The seed comes from the date, so every phone works it out
 * itself, even offline. Play it as often as you like that day; your best score counts.
 */

const DAY = 24 * 60 * 60 * 1000;

/** How long after its day a Daily Challenge run still counts on the board, if uploaded late. */
export const DAILY_GRACE_MS = 2 * DAY;

/** The day (UTC, `YYYY-MM-DD`) a moment falls on. */
export const dayOf = (now: number | Date) => new Date(now).toISOString().slice(0, 10);

/** Today (UTC). */
export const today = () => dayOf(Date.now());

/** A day's seed. */
export const dailySeed = (day: string) => seedFrom(`ranemon-sesh-daily:${day}`);

/** A day's Daily Challenge, from the start. */
export const dailyRun = (day: string): SeshRun => newRun(dailySeed(day), day);

/** Milliseconds until the next Daily Challenge, at midnight UTC. */
export const untilNext = (now: number) => DAY - (now % DAY);

/** A wait as `HH:MM:SS`. */
export function countdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

/** Whether a run for `day` finished at `now` still counts for that day's board. */
export const countsFor = (day: string, now: number) => {
  const start = Date.parse(`${day}T00:00:00Z`);
  return now >= start && now < start + DAY + DAILY_GRACE_MS;
};
