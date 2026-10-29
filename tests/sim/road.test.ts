import { afterEach, expect, it } from 'vitest';
import { COUNTIES, mapById } from '@/content/story/maps';
import { teamOf, trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { ROSTER } from '@/lib/battle/roster';
import { simulateBattle } from '@/lib/battle/simulate';
import { makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

// These battles run without a break, so let vitest's worker messages through between tests.
afterEach(() => new Promise((resolve) => setImmediate(resolve)));

const RUNS = Number(process.env.SIM_RUNS ?? 400);

/**
 * The battles on the road between the counties, played by a party that has just won the last
 * county's jersey: the starter at that gym's level cap and the rest 2 under, drawn from the
 * wild Ranemon of the counties so far, as the Hard CPU.
 */
function winRate(trainer: string, after: string, lead: number, seed: number): number {
  const rng = new Rng(seed);
  const t = trainerById(trainer);
  const counties = COUNTIES.slice(0, COUNTIES.indexOf(after) + 1);
  const wild = counties.flatMap((id) => mapById(id).wild!.table.map(([s]) => s));
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const starter = ROSTER[rng.int(0, ROSTER.length - 1)].id;
    const party = [
      makeMember(starter, lead, 0),
      ...Array.from({ length: PARTY_SIZE - 1 }, (_, j) =>
        makeMember(wild[rng.int(0, wild.length - 1)], lead - 2, j + 1),
      ),
    ];
    const foes = teamOf(t, starter).map(([id, level], j) => makeMember(id, level, 100 + j));
    const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 29 + seed, [
      'hard',
      t.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  return won / RUNS;
}

it(`the rival on the bog and at the services is a fight but a fair one over ${RUNS} runs`, () => {
  const bog = winRate('rival-bog', 'laois', 28, 1);
  const services = winRate('rival-services', 'meath', 40, 2);
  console.log('Thatcher on the bog', bog, 'at the services', services);
  for (const rate of [bog, services]) {
    expect(rate).toBeGreaterThanOrEqual(0.5);
    expect(rate).toBeLessThanOrEqual(0.95);
  }
});

it(`the hurling supporters are a warm-up over ${RUNS} runs`, () => {
  for (const id of ['border-tipp', 'border-cats']) {
    const rate = winRate(id, 'tipperary', 20, 3);
    console.log(id, rate);
    expect(rate, id).toBeGreaterThanOrEqual(0.8);
  }
});
