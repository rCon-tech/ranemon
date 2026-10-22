import { expect, it } from 'vitest';
import { MAPS, mapById } from '@/content/story/maps';
import { trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { ROSTER } from '@/lib/battle/roster';
import { simulateBattle } from '@/lib/battle/simulate';
import { makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 400);

/**
 * The route simulator: a player who catches as they go arrives at each gym with their starter
 * 1 level under the leader's ace and the rest of the party 3 under, drawn from the wild
 * Ranemon of the counties so far. Played as the Hard CPU (sensible type choices), they should win most gyms but not
 * all: between 45% and 90% of the time.
 */
it(`each gym is winnable but not a walkover over ${RUNS} runs`, () => {
  const rng = new Rng(1916);
  const gyms = MAPS.filter((m) => m.gym);
  const rates: Record<string, number> = {};
  gyms.forEach((map, g) => {
    const leader = trainerById(map.gym!.trainer);
    const ace = Math.max(...leader.team.map(([, l]) => l));
    const wild = MAPS.slice(0, g + 1).flatMap((m) => m.wild?.table.map(([id]) => id) ?? []);
    let won = 0;
    for (let i = 0; i < RUNS; i++) {
      const starter = ROSTER[rng.int(0, ROSTER.length - 1)].id;
      const size = Math.min(PARTY_SIZE, 2 + g);
      const party = [
        makeMember(starter, ace - 1, 0),
        ...Array.from({ length: size - 1 }, (_, j) =>
          makeMember(wild[rng.int(0, wild.length - 1)], ace - 3, j + 1),
        ),
      ];
      const foes = leader.team.map(([id, level], j) => makeMember(id, level, 100 + j));
      const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 31 + g, [
        'hard',
        leader.ai,
      ]);
      if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
    }
    rates[leader.name] = won / RUNS;
  });
  console.table(rates);
  for (const [name, rate] of Object.entries(rates)) {
    expect(rate, name).toBeGreaterThanOrEqual(0.45);
    expect(rate, name).toBeLessThanOrEqual(0.9);
  }
});

/**
 * Poseidon, the Donegal boss: a party of 6 at Lv54 (where a player reaching Dublin and
 * training a little would be), from the Dublin long grass, should beat him some of the time
 * but not most: between 20% and 65%.
 */
it(`Poseidon is a hard fight over ${RUNS} runs`, () => {
  const rng = new Rng(1798);
  const god = trainerById('poseidon');
  const wild = mapById('dublin').wild!.table.map(([id]) => id);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const party = Array.from({ length: PARTY_SIZE }, (_, j) =>
      makeMember(wild[rng.int(0, wild.length - 1)], 54, j),
    );
    const foes = god.team.map(([id, level], j) => makeMember(id, level, 100 + j));
    const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 17, [
      'hard',
      god.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  console.log('Poseidon win rate', won / RUNS);
  expect(won / RUNS).toBeGreaterThanOrEqual(0.2);
  expect(won / RUNS).toBeLessThanOrEqual(0.65);
});

/**
 * Whoever you accuse of taking the rent: a party of 6 at Lv44, as you arrive in Dublin, from
 * the Dublin long grass, should usually win, but not every time: between 60% and 97%.
 */
it.each(['rent-mc', 'rent-melchior'])(`%s is a fair side fight over ${RUNS} runs`, (id) => {
  const rng = new Rng(1916);
  const foe = trainerById(id);
  const wild = mapById('dublin').wild!.table.map(([id]) => id);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const party = Array.from({ length: PARTY_SIZE }, (_, j) =>
      makeMember(wild[rng.int(0, wild.length - 1)], 44, j),
    );
    const foes = foe.team.map(([id, level], j) => makeMember(id, level, 100 + j));
    const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 13, [
      'hard',
      foe.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  console.log(`${foe.name} win rate`, won / RUNS);
  expect(won / RUNS).toBeGreaterThanOrEqual(0.6);
  expect(won / RUNS).toBeLessThanOrEqual(0.97);
});
