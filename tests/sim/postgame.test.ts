import { expect, it } from 'vitest';
import { mapById } from '@/content/story/maps';
import { TECHNO_DJ, TECHNO_TRAINERS } from '@/content/story/techno';
import { trainerById } from '@/content/story/trainers';
import { LEGEND } from '@/lib/battle/legend';
import { Rng } from '@/lib/battle/rng';
import { ROSTER } from '@/lib/battle/roster';
import { simulateBattle } from '@/lib/battle/simulate';
import { makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 400);

/**
 * Tobymon one on one with each evolved Ranemon at Lv55, both on Hard. A legend should beat
 * most of them, but not nearly all: at 520 with a +30% Staff of Ages he won about 9 in 10 and
 * swept the post-game on his own. The best of the rest win about 2 in 3.
 */
it(`Tobymon is the strongest, not unbeatable, over ${RUNS} duels`, () => {
  let won = 0;
  let played = 0;
  for (let i = 0; i < RUNS; i++) {
    const foe = ROSTER[i % ROSTER.length].id;
    const { state } = simulateBattle(
      [[toEntrant(makeMember(LEGEND.id, 55, 1))], [toEntrant(makeMember(foe, 55, 2))]],
      i * 7,
      ['hard', 'hard'],
    );
    played++;
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  console.log('Tobymon one on one', won / played);
  expect(won / played).toBeGreaterThanOrEqual(0.6);
  expect(won / played).toBeLessThanOrEqual(0.82);
});

/** How often a party of 6 from the Ghent long grass at a level beats a trainer, maybe led by Tobymon. */
function rate(id: string, level: number, tobymon: boolean): number {
  const rng = new Rng(2610);
  const foe = trainerById(id);
  const wild = mapById('belgium').wild!.table.map(([s]) => s);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const party = Array.from({ length: PARTY_SIZE }, (_, j) =>
      makeMember(wild[rng.int(0, wild.length - 1)], level, j),
    );
    if (tobymon) party[0] = makeMember(LEGEND.id, level, 0);
    const foes = foe.team.map(([s, l], j) => makeMember(s, l, 100 + j));
    const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 13, [
      'hard',
      foe.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  return won / RUNS;
}

const ace = (id: string) => Math.max(...trainerById(id).team.map(([, l]) => l));

/**
 * After B&S, a party at a trainer's ace level (where a trained-up party is, and where teams are
 * raised to) should still lose now and then to the Ghent guards, and have a real fight with DJ
 * Vandenbass and the B&S rematch. Tobymon leading it shouldn't turn either boss into a formality:
 * before this pass he took the DJ from about 1 in 6 to every time.
 */
it(`the post-game has a fight left in it, Tobymon or not, over ${RUNS} runs`, () => {
  const bosses = [TECHNO_DJ, 'bns-rematch'];
  const rows = Object.fromEntries(
    [...TECHNO_TRAINERS.map((t) => t.id), 'bns-rematch'].map((id) => [
      id,
      {
        plain: rate(id, ace(id), false),
        tobymon: bosses.includes(id) ? rate(id, ace(id), true) : undefined,
      },
    ]),
  );
  console.table(rows);
  for (const t of TECHNO_TRAINERS.filter((t) => t.id !== TECHNO_DJ)) {
    expect(rows[t.id].plain, t.id).toBeGreaterThanOrEqual(0.7);
    expect(rows[t.id].plain, t.id).toBeLessThanOrEqual(0.96);
  }
  for (const id of bosses) {
    expect(rows[id].plain, id).toBeGreaterThanOrEqual(0.4);
    expect(rows[id].plain, id).toBeLessThanOrEqual(0.85);
    expect(rows[id].tobymon!, `${id} with Tobymon`).toBeLessThanOrEqual(0.85);
  }
});
