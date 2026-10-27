import { expect, it } from 'vitest';
import { LONDON, UK_LEVEL } from '@/content/story/london';
import { FIXTURE_LIST, legendId } from '@/content/story/premier';
import { teamOf, trainerById } from '@/content/story/trainers';
import { ROSTER } from '@/lib/battle/roster';
import { Rng } from '@/lib/battle/rng';
import { simulateBattle } from '@/lib/battle/simulate';
import { UK } from '@/lib/battle/uk';
import { makeMember, toEntrant, type Member } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 400);

/** How often `party` beats a trainer's team, built for that starter. */
function rate(party: (rng: Rng) => Member[], trainer: string, starter: (rng: Rng) => string) {
  const rng = new Rng(2710);
  const t = trainerById(trainer);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const mine = party(rng);
    const foes = teamOf(t, starter(rng)).map(([s, l], j) => makeMember(s, l, 100 + j, UK));
    const { state } = simulateBattle([mine.map(toEntrant), foes.map(toEntrant)], i * 17, [
      'hard',
      t.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  return won / RUNS;
}

/**
 * A London-only game starts as a Dublin save does over the border: one UK Ranemon at Lv5 and
 * London's long grass. Its first fights are the same, so they must be winnable from nothing:
 * Thatcher, who picks with a type edge, and then Glenn Murray at the Amex, with a starter and
 * two friends from London at about the level the first trainers and grass get you to.
 */
it(`a London-only start can win its way to Brighton, over ${RUNS} runs`, () => {
  const starters = ROSTER.map((c) => c.id).filter((id) => id !== 'tobymon');
  const pickStarter = (rng: Rng) => starters[rng.int(0, starters.length - 1)];
  let starter = starters[0];
  const thatcher = rate(
    (rng) => {
      starter = pickStarter(rng);
      return [makeMember(starter, UK_LEVEL, 0, UK)];
    },
    'rival-uk-1',
    () => starter,
  );
  const wild = LONDON.wild!.table.map(([s]) => s);
  const murray = rate(
    (rng) => {
      starter = pickStarter(rng);
      return [starter, wild[rng.int(0, wild.length - 1)], wild[rng.int(0, wild.length - 1)]].map(
        (s, j) => makeMember(s, j === 0 ? 11 : 9, j, UK),
      );
    },
    legendId(FIXTURE_LIST[0].id),
    () => starter,
  );
  console.table({ thatcher, murray });
  // Thatcher has the edge, as a rival should, but isn't a wall for a first battle.
  expect(thatcher).toBeGreaterThanOrEqual(0.2);
  expect(murray).toBeGreaterThanOrEqual(0.5);
  expect(murray).toBeLessThanOrEqual(0.97);
});
