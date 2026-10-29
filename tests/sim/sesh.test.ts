import { expect, it } from 'vitest';
import { newRun } from '@/lib/sesh/run';
import { QUICK_STAGES } from '@/lib/sesh/stages';
import { botRun } from '../fixtures/sesh-bot';

const RUNS = Number(process.env.SIM_RUNS ?? 300);

/** How long the player takes over a choice in battle, and over one outside it, in ms. */
const THINK_IN_BATTLE = 2500;
const THINK_OUTSIDE = 4000;
/** The Sesh plays at 2× to start. */
const SPEED = 2;

const breather = () => new Promise((resolve) => setImmediate(resolve));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/**
 * Quick Sesh, played over and over by a simple bot (`tests/fixtures/sesh-bot.ts`): Hard-CPU
 * moves, food between fights, a rest when it's hurt and Bouncers only when it's healthy.
 *
 * - About 1 run in 4 clears The Afterparty (a careful player does a bit better than the bot).
 * - The party grows from Lv50 into the bosses' range: about Lv53, 59 and 65 going in.
 * - A whole run, won or lost at the last boss, takes about 20 minutes at 2×: the battles'
 *   playback at that speed, plus a few seconds for each choice.
 */
it(`Quick Sesh is cleared about 1 time in 4, in about 20 minutes, over ${RUNS} runs`, async () => {
  let won = 0;
  const beaten = QUICK_STAGES.map(() => 0).concat(0);
  const levels: number[][] = QUICK_STAGES.map(() => []);
  const fullRuns: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const r = botRun(newRun(2026 + i * 17), i);
    if (r.run.over === 'won') won++;
    beaten[r.run.beaten]++;
    r.bossLevels.forEach((l, k) => levels[k].push(l));
    // Runs that get to the last boss: a whole night's length.
    if (r.bossLevels.length === QUICK_STAGES.length) {
      const outside = r.actions.filter((a) => a.kind !== 'battle').length;
      fullRuns.push(r.playback / SPEED + r.inputs * THINK_IN_BATTLE + outside * THINK_OUTSIDE);
    }
    if (i % 10 === 0) await breather();
  }
  const rate = won / RUNS;
  const minutes = mean(fullRuns) / 60_000;
  const atBoss = levels.map((l) => Math.round(mean(l) * 10) / 10);
  console.table({
    sesh: {
      cleared: rate,
      minutes: Math.round(minutes * 10) / 10,
      ...atBoss,
      beaten: beaten.join('/'),
    },
  });
  expect(rate).toBeGreaterThanOrEqual(0.1);
  expect(rate).toBeLessThanOrEqual(0.4);
  expect(atBoss[0]).toBeGreaterThanOrEqual(51.5);
  expect(atBoss[0]).toBeLessThanOrEqual(55);
  expect(atBoss[2]).toBeGreaterThanOrEqual(60);
  expect(atBoss[2]).toBeLessThanOrEqual(68);
  expect(minutes).toBeGreaterThanOrEqual(12);
  expect(minutes).toBeLessThanOrEqual(28);
});
