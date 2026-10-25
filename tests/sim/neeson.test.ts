import { expect, it } from 'vitest';
import { LONDON } from '@/content/story/london';
import { NEESON_DOUBLE, NEESON_TRAINER } from '@/content/story/neeson';
import { trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { simulateBattle } from '@/lib/battle/simulate';
import { makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 400);

/** How often a party of 6 from London's long grass, at a trainer's ace level, beats them. */
function rate(id: string): number {
  const rng = new Rng(2510);
  const foe = trainerById(id);
  const level = Math.max(...foe.team.map(([, l]) => l));
  const wild = LONDON.wild!.table.map(([s]) => s);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const party = Array.from({ length: PARTY_SIZE }, (_, j) =>
      makeMember(wild[rng.int(0, wild.length - 1)], level, j),
    );
    const foes = foe.team.map(([s, l], j) => makeMember(s, l, 100 + j));
    const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 13, [
      'hard',
      foe.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  return won / RUNS;
}

/** Up Big Ben, for a party at the trainer's own ace level: the double a warm-up, Liam a real fight. */
it(`Liam Neeson is a fight but winnable, after an easier double, over ${RUNS} runs`, () => {
  const rows = { [NEESON_DOUBLE]: rate(NEESON_DOUBLE), [NEESON_TRAINER]: rate(NEESON_TRAINER) };
  console.table(rows);
  expect(rows[NEESON_DOUBLE]).toBeGreaterThanOrEqual(0.7);
  expect(rows[NEESON_TRAINER]).toBeGreaterThanOrEqual(0.35);
  expect(rows[NEESON_TRAINER]).toBeLessThanOrEqual(0.93);
});
