import { expect, it } from 'vitest';
import { mapById } from '@/content/story/maps';
import { CEOS, SILICON_TRAINERS } from '@/content/story/silicon';
import { trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { simulateBattle } from '@/lib/battle/simulate';
import { makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 400);

/** How often a party of 6 from Dublin's long grass, at a trainer's ace level, beats them. */
function rate(id: string): number {
  const rng = new Rng(2410);
  const foe = trainerById(id);
  const level = Math.max(...foe.team.map(([, l]) => l));
  const wild = mapById('dublin').wild!.table.map(([s]) => s);
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
 * Silicon Docks, for a party at the trainer's own ace level: the staff are a warm-up, and each
 * CEO a real fight, from Sundar Pichai, who wins about 1 in 10, to Elon Musk, nearly 1 in 2.
 */
it(`every CEO in Silicon Docks is a fight but winnable, over ${RUNS} runs`, () => {
  const rows = Object.fromEntries(SILICON_TRAINERS.map((t) => [t.id, rate(t.id)]));
  console.table(rows);
  for (const t of SILICON_TRAINERS) {
    const ceo = CEOS.includes(t.id);
    expect(rows[t.id], t.id).toBeGreaterThanOrEqual(ceo ? 0.45 : 0.7);
    if (ceo) expect(rows[t.id], t.id).toBeLessThanOrEqual(0.93);
  }
});
