import { expect, it } from 'vitest';
import { MAPS, mapById } from '@/content/story/maps';
import { trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { ROSTER } from '@/lib/battle/roster';
import { simulateBattle } from '@/lib/battle/simulate';
import { PEAR_TRAINERS } from '@/content/story/greystones';
import { RAVE_TRAINERS } from '@/content/story/rave';
import { ARCADE_KING, BRIGHTON_TRAINERS } from '@/content/story/brighton';
import { afterBattle, makeMember, PARTY_SIZE, toEntrant } from '@/lib/story/party';

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

/**
 * Alex Simonin in Front Square: a party of 6 at Lv45 from the Dublin long grass, as you reach
 * Trinity, should usually beat him, if a little less often than the scholars (87% to 94%):
 * his Weezimo are tough.
 */
it(`Alex Simonin is a fair Trinity fight over ${RUNS} runs`, () => {
  const rng = new Rng(1916);
  const foe = trainerById('trinity-alex');
  const wild = mapById('dublin').wild!.table.map(([id]) => id);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const party = Array.from({ length: PARTY_SIZE }, (_, j) =>
      makeMember(wild[rng.int(0, wild.length - 1)], 45, j),
    );
    const foes = foe.team.map(([id, level], j) => makeMember(id, level, 100 + j));
    const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 13, [
      'hard',
      foe.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  console.log(`${foe.name} win rate`, won / RUNS);
  expect(won / RUNS).toBeGreaterThanOrEqual(0.65);
  expect(won / RUNS).toBeLessThanOrEqual(0.95);
});

/**
 * The Happy Pear Twins, in Greystones: Dave and then Steve, back to back, with whatever HP and
 * PP the party has left after Dave. A party of 6 at Lv52 (a player reaching Greystones and
 * training a little), from the Greystones long grass, should beat both some of the time but not
 * most: between 25% and 65%. Beating Dave alone should be the usual outcome.
 */
it(`the Happy Pear Twins are a hard double over ${RUNS} runs`, () => {
  const rng = new Rng(2012);
  const [dave, steve] = PEAR_TRAINERS.map(trainerById);
  const wild = mapById('greystones').wild!.table.map(([id]) => id);
  let first = 0;
  let both = 0;
  for (let i = 0; i < RUNS; i++) {
    let party = Array.from({ length: PARTY_SIZE }, (_, j) =>
      makeMember(wild[rng.int(0, wild.length - 1)], 52, j),
    );
    const one = simulateBattle(
      [party.map(toEntrant), dave.team.map(([id, l], j) => toEntrant(makeMember(id, l, 100 + j)))],
      i * 19,
      ['hard', dave.ai],
    ).state;
    if (one.phase.kind !== 'over' || one.phase.winner !== 0) continue;
    first++;
    party = party.map((m, j) => afterBattle(m, one.teams[0].battlers[j]));
    const two = simulateBattle(
      [party.map(toEntrant), steve.team.map(([id, l], j) => toEntrant(makeMember(id, l, 200 + j)))],
      i * 23,
      ['hard', steve.ai],
    ).state;
    if (two.phase.kind === 'over' && two.phase.winner === 0) both++;
  }
  console.log('Happy Pear Twins: beat Dave', first / RUNS, 'beat both', both / RUNS);
  expect(first / RUNS).toBeGreaterThanOrEqual(0.6);
  expect(both / RUNS).toBeGreaterThanOrEqual(0.25);
  expect(both / RUNS).toBeLessThanOrEqual(0.65);
});

/**
 * Paul Mescal past Temple Bar: a party of 6 at Lv42 from the Dublin long grass, as you reach the
 * city, should nearly always beat him, as with the other Dublin street trainers. He's too sad.
 */
it(`Paul Mescal is an easy Dublin fight over ${RUNS} runs`, () => {
  const rng = new Rng(1916);
  const foe = trainerById('dublin-mescal');
  const wild = mapById('dublin').wild!.table.map(([id]) => id);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const party = Array.from({ length: PARTY_SIZE }, (_, j) =>
      makeMember(wild[rng.int(0, wild.length - 1)], 42, j),
    );
    const foes = foe.team.map(([id, level], j) => makeMember(id, level, 100 + j));
    const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 17, [
      'hard',
      foe.ai,
    ]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  console.log(`${foe.name} win rate`, won / RUNS);
  expect(won / RUNS).toBeGreaterThanOrEqual(0.85);
});

/**
 * The Rave Cave in Dublin, for training: a party of 6 at Lv46 from the Dublin long grass, as you
 * reach the city, should nearly always beat the ravers by the door, and one at Lv54 should have
 * a real fight on its hands with Mossy at the back by the DJ.
 */
it(`the Rave Cave gets harder from the door to the DJ over ${RUNS} runs`, () => {
  const rng = new Rng(1994);
  const wild = mapById('dublin').wild!.table.map(([id]) => id);
  const rate = (id: string, level: number) => {
    const foe = trainerById(id);
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
  };
  const rates = Object.fromEntries(
    RAVE_TRAINERS.map((t) => [t.name, { Lv46: rate(t.id, 46), Lv54: rate(t.id, 54) }]),
  );
  console.table(rates);
  const first = rates[RAVE_TRAINERS[0].name];
  const last = rates[RAVE_TRAINERS.at(-1)!.name];
  expect(first.Lv46).toBeGreaterThanOrEqual(0.85);
  expect(last.Lv46).toBeLessThan(first.Lv46);
  expect(last.Lv54).toBeGreaterThanOrEqual(0.2);
  expect(last.Lv54).toBeLessThanOrEqual(0.9);
});

/**
 * Brighton, by the Sail & Rail: a party of 6 at Lv48 from the Brighton long grass, a little
 * past Dublin, should usually beat the fans and the gamers on the way, and one at Lv52 should
 * beat the Arcade King some of the time but not most: between 30% and 75%.
 */
it(`Brighton builds up to a hard Arcade King over ${RUNS} runs`, () => {
  const rng = new Rng(1901);
  const wild = mapById('brighton').wild!.table.map(([id]) => id);
  const rate = (id: string, level: number) => {
    const foe = trainerById(id);
    let won = 0;
    for (let i = 0; i < RUNS; i++) {
      const party = Array.from({ length: PARTY_SIZE }, (_, j) =>
        makeMember(wild[rng.int(0, wild.length - 1)], level, j),
      );
      const foes = foe.team.map(([s, l], j) => makeMember(s, l, 100 + j));
      const { state } = simulateBattle([party.map(toEntrant), foes.map(toEntrant)], i * 29, [
        'hard',
        foe.ai,
      ]);
      if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
    }
    return won / RUNS;
  };
  const rates = Object.fromEntries(
    BRIGHTON_TRAINERS.map((t) => [t.name, { Lv48: rate(t.id, 48), Lv52: rate(t.id, 52) }]),
  );
  console.table(rates);
  for (const t of BRIGHTON_TRAINERS.filter((t) => t.id !== ARCADE_KING))
    expect(rates[t.name].Lv48, t.name).toBeGreaterThanOrEqual(0.6);
  const king = rates[trainerById(ARCADE_KING).name];
  expect(king.Lv52).toBeGreaterThanOrEqual(0.3);
  expect(king.Lv52).toBeLessThanOrEqual(0.75);
});
