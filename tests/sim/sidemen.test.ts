import { expect, it } from 'vitest';
import { JAMIE, SIDEMEN_TRAINERS, SIX, WEMBLEY } from '@/content/story/sidemen';
import { trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { simulateBattle } from '@/lib/battle/simulate';
import { makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 400);

/** How often a party of 6 from Wembley Park's long grass, at a trainer's ace level, beats them. */
function rate(id: string): number {
  const rng = new Rng(2510);
  const foe = trainerById(id);
  const level = Math.max(...foe.team.map(([, l]) => l));
  const wild = WEMBLEY.wild!.table.map(([s]) => s);
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

/**
 * The Sidemen, for a party at the trainer's own ace level: their crew are a warm-up, each of the
 * six a real fight (Miniminter is the hardest, won about 7 in 10, Zerkaa the easiest, about 9 in
 * 10), and Jamie Elliott, with all six of their Ranemon, about 1 in 2.
 */
it(`every Sideman is a fight but winnable, and Jamie harder, over ${RUNS} runs`, () => {
  const rows = Object.fromEntries(SIDEMEN_TRAINERS.map((t) => [t.id, rate(t.id)]));
  console.table(rows);
  for (const t of SIDEMEN_TRAINERS) {
    const boss = SIX.includes(t.id) || t.id === JAMIE;
    expect(rows[t.id], t.id).toBeGreaterThanOrEqual(boss ? 0.35 : 0.7);
    if (boss) expect(rows[t.id], t.id).toBeLessThanOrEqual(0.93);
  }
});
