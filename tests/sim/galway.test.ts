import { expect, it } from 'vitest';
import { COLLINS, ELITE } from '@/content/story/galway';
import { mapById } from '@/content/story/maps';
import { trainerById } from '@/content/story/trainers';
import { Rng } from '@/lib/battle/rng';
import { simulateBattle } from '@/lib/battle/simulate';
import { scaleTeam } from '@/lib/story/levels';
import {
  afterBattle,
  makeMember,
  PARTY_SIZE,
  statsOf,
  toEntrant,
  type Member,
} from '@/lib/story/party';

const RUNS = Number(process.env.SIM_RUNS ?? 300);

/** The levels a player could take on the Championship at: arriving, trained up, and maxed. */
const LEVELS = [60, 80, 100];

/** Food a careful player brings for the whole run, used between battles. */
const BAG = { revive: 10, restore: 20 };

/** A party of 6 from the Eyre Square long grass, all at one level. */
function party(rng: Rng, level: number): Member[] {
  const wild = mapById('galway').wild!.table.map(([s]) => s);
  return Array.from({ length: PARTY_SIZE }, (_, j) =>
    makeMember(wild[rng.int(0, wild.length - 1)], level, j),
  );
}

/** One battle against a trainer, scaled to the party as the game does. Returns the party after. */
function fight(mine: Member[], id: string, seed: number): { won: boolean; party: Member[] } {
  const t = trainerById(id);
  const team = scaleTeam(t.team, { flags: [], party: mine }, t.above).map(([s, l], j) =>
    makeMember(s, l, 100 + j),
  );
  const fighting = mine.filter((m) => m.hp > 0);
  if (!fighting.length) return { won: false, party: mine };
  const { state } = simulateBattle([fighting.map(toEntrant), team.map(toEntrant)], seed, [
    'hard',
    t.ai,
  ]);
  const after = fighting.map((m, i) => afterBattle(m, state.teams[0].battlers[i]));
  const won = state.phase.kind === 'over' && state.phase.winner === 0;
  return { won, party: [...after, ...mine.filter((m) => m.hp === 0)] };
}

/** Between battles: Hair of the Dog on whoever fainted, then Full Irish on whoever's lowest. */
function patchUp(mine: Member[], bag: { revive: number; restore: number }): Member[] {
  return mine
    .map((m) => {
      if (m.hp > 0 || !bag.revive) return m;
      bag.revive--;
      return { ...m, hp: Math.floor(statsOf(m).hp / 2), status: null };
    })
    .map((m) => {
      if (m.hp === 0 || m.hp > statsOf(m).hp / 2 || !bag.restore) return m;
      bag.restore--;
      return { ...m, hp: statsOf(m).hp, status: null };
    });
}

/**
 * Lets the test runner's messages through between battles: a long run of battles with no break
 * holds up the worker until vitest gives up on it.
 */
const breather = () => new Promise((resolve) => setImmediate(resolve));

async function single(id: string, level: number): Promise<number> {
  const rng = new Rng(1922);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    if (fight(party(rng, level), id, i * 13).won) won++;
    if (i % 20 === 0) await breather();
  }
  return won / RUNS;
}

/** The whole run: the four then Collins, with no healing but the bag in between. */
async function run(level: number): Promise<number> {
  const rng = new Rng(1916);
  let won = 0;
  for (let i = 0; i < RUNS; i++) {
    let mine = party(rng, level);
    const bag = { ...BAG };
    let ok = true;
    for (const [k, id] of [...ELITE, COLLINS].entries()) {
      const r = fight(mine, id, i * 31 + k);
      if (!r.won) {
        ok = false;
        break;
      }
      mine = patchUp(r.party, bag);
    }
    if (ok) won++;
    if (i % 10 === 0) await breather();
  }
  return won / RUNS;
}

/**
 * The Championship should be the hardest thing in the game at any level up to 100. A random party
 * at full health beats each of the four most of the time and Collins about half the time, but
 * with no healing in between, only a bag of food, a whole run comes off for about 1 in 20 of
 * them. A party picked to cover each one's type does much better.
 */
for (const level of LEVELS) {
  it(`the Championship is hard at Lv${level}, over ${RUNS} runs`, async () => {
    const row: Record<string, number> = { run: await run(level) };
    for (const id of [...ELITE, COLLINS]) row[id] = await single(id, level);
    console.table({ [`Lv${level}`]: row });
    for (const id of ELITE) {
      expect(row[id], id).toBeGreaterThanOrEqual(0.6);
      expect(row[id], id).toBeLessThanOrEqual(0.95);
    }
    expect(row[COLLINS]).toBeGreaterThanOrEqual(0.3);
    expect(row[COLLINS]).toBeLessThanOrEqual(0.65);
    expect(row.run).toBeGreaterThanOrEqual(0.01);
    expect(row.run).toBeLessThanOrEqual(0.2);
  });
}
