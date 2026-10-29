import { expect, it } from 'vitest';
import { LONDON } from '@/content/story/london';
import { RANELASSES_BEATEN, VIV } from '@/content/story/rowans';
import { trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { simulateBattle } from '@/lib/battle/simulate';
import { UK } from '@/lib/battle/uk';
import { scaleTeam } from '@/lib/story/levels';
import { makeMember, PARTY_SIZE, toEntrant, type Member } from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 150);

/** A party of 6 from London's long grass at `level`, or with one carry and the rest 12 under. */
function party(rng: Rng, level: number, carry: boolean): Member[] {
  const wild = LONDON.wild!.table.map(([s]) => s);
  return Array.from({ length: PARTY_SIZE }, (_, j) =>
    makeMember(wild[rng.int(0, wild.length - 1)], carry && j > 0 ? level - 12 : level, j, UK),
  );
}

/** How often that party beats Viv, scaled as the game does, before or after she's first beaten. */
function rate(level: number, { carry = false, rematch = false } = {}): number {
  const rng = new Rng(4242);
  const t = trainerById(VIV);
  const flags = rematch ? [RANELASSES_BEATEN] : [];
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    const mine = party(rng, level, carry);
    const halfway = !flags.includes(t.halfway!);
    const team = scaleTeam(t.team, { flags, party: mine }, t.above, halfway).map(([s, l], j) => {
      const e = toEntrant(makeMember(s, l, 100 + j, UK));
      return e.creature.id === t.mega ? { ...e, mega: true } : e;
    });
    const { state } = simulateBattle([mine.map(toEntrant), team], i * 17, ['hard', t.ai]);
    if (state.phase.kind === 'over' && state.phase.winner === 0) won++;
  }
  return won / RUNS;
}

/**
 * Viv, the hardest of the Ranelasses. On the first run she only comes half way to the party, so
 * training pays: about 2 in 5 at Lv62, two thirds at Lv70 and most of the time at Lv80, and a
 * carry with a weaker team behind it still gains from every level. A rematch keeps up in full.
 */
it(`training before Rowans pays, and rematches stay a fight, over ${RUNS} runs`, () => {
  const rows = {
    first: [62, 70, 80].map((l) => rate(l)),
    carry: [70, 80].map((l) => rate(l, { carry: true })),
    rematch: [70, 90].map((l) => rate(l, { rematch: true })),
  };
  console.table(rows);
  const [at62, at70, at80] = rows.first;
  expect(at62).toBeGreaterThanOrEqual(0.25);
  expect(at62).toBeLessThanOrEqual(0.55);
  expect(at70).toBeGreaterThan(at62 + 0.1);
  expect(at80).toBeGreaterThan(at70 + 0.1);
  expect(rows.carry[1]).toBeGreaterThan(rows.carry[0] + 0.1);
  for (const r of rows.rematch) expect(r).toBeLessThanOrEqual(0.65);
}, 600_000);
