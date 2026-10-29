import { expect, it } from 'vitest';
import { KANE_LEVEL, KANE_TRAINER } from '@/content/story/kane';
import { VIV } from '@/content/story/rowans';
import { trainerById } from '@/content/story/trainers';
import type { Entrant } from '@/lib/battle/engine';
import { KANE_ID } from '@/lib/battle/kane';
import { Rng } from '@/lib/battle/rng';
import { ROSTER } from '@/lib/battle/roster';
import { simulateBattle } from '@/lib/battle/simulate';
import { UK } from '@/lib/battle/uk';
import { makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 400);
const LADS = ROSTER.map((c) => c.id).filter((id) => id !== 'tobymon');

/** A trainer's team, its Mega one ready to Mega evolve. */
const foes = (id: string): Entrant[] => {
  const t = trainerById(id);
  return t.team.map(([s, l], j) => {
    const e = toEntrant(makeMember(s, l, 100 + j, UK));
    return s === t.mega ? { ...e, mega: true } : e;
  });
};

/** How often six of the lads at a level beat a trainer, maybe with Kanemon leading them. */
function rate(trainer: string, level: number, kane: boolean): number {
  const rng = new Rng(2910);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const party: Entrant[] = Array.from({ length: PARTY_SIZE }, (_, j) =>
      toEntrant(makeMember(LADS[rng.int(0, LADS.length - 1)], level, j, UK)),
    );
    // Kanemon brings his own Ballon d'Or: he can Mega evolve without the Ring.
    if (kane) party[0] = { ...toEntrant(makeMember(KANE_ID, KANE_LEVEL, 0)), mega: true };
    const { state } = simulateBattle([party, foes(trainer)], i * 11, [
      'hard',
      trainerById(trainer).ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  return won / RUNS;
}

/**
 * Harry Kane on his own is a real fight for a Champion's party at about his level, and once he's
 * yours he makes Viv, the last of the Ranelasses, a good deal easier, without making her a walkover.
 */
it(`Harry Kane is a legendary fight, and a big help at Rowans, over ${RUNS} runs`, () => {
  const kane = rate(KANE_TRAINER, KANE_LEVEL - 4, false);
  const viv = rate(VIV, 60, false);
  const vivWithKane = rate(VIV, 60, true);
  console.table({ kane, viv, vivWithKane });
  expect(kane).toBeGreaterThanOrEqual(0.3);
  expect(kane).toBeLessThanOrEqual(0.8);
  expect(vivWithKane).toBeGreaterThan(viv + 0.1);
  expect(vivWithKane).toBeLessThanOrEqual(0.9);
});
