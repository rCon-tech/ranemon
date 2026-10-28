import { moveById, MOVES } from '../battle/moves';
import { seedFrom } from '../battle/rng';
import { SPORT_MOVES } from '../battle/sports';
import { applyItem, canUseOn, holdsItem, itemById, type ItemId } from '../story/items';
import {
  afterBattle,
  blueGhost,
  expYield,
  gainExp,
  heal,
  learnedOf,
  nameOf,
  speciesById,
  swapMove,
  type Member,
} from '../story/party';
import { MOVE_SLOTS } from '../story/learnsets';
import { replayBattle, startSeshBattle, type BattleInput } from './battle';
import { bossAt, bossesFor, bouncerAt, fightAt, nodeRng, type SeshFoe } from './foes';
import { stageMap, type NodeKind, type StageMap } from './map';
import { seshParty } from './party';
import { PICKS, QUICK_STAGES, type Stage } from './stages';

/**
 * A run of Quick Sesh, as plain data. Everything in it follows from the seed and the choices
 * made (`SeshAction`), so a run replays exactly (`replayRun`): the same party, maps, foes and
 * battles. Nothing carries over between runs.
 */
export interface SeshRun {
  v: 1;
  seed: number;
  /** A Daily Challenge's day (UTC, `YYYY-MM-DD`); a free run has none. */
  daily?: string;
  /** Who's still out, in the order they go into battle. */
  party: Member[];
  /** Sent home in a taxi: still fainted when a battle ended. Out for the rest of the run. */
  gone: Member[];
  bag: Partial<Record<ItemId, number>>;
  /** Euro. */
  cash: number;
  /** The Mega Ring, from The Afterparty's Bouncer. */
  ring: boolean;
  /** The stage you're on, an index into QUICK_STAGES; the length of it once the night is won. */
  stage: number;
  /** Each stage's boss, drawn at the start (`bossesFor`). */
  bosses: string[];
  /** The node picked in each row of this stage so far. */
  path: number[];
  /** The node you're in and haven't finished with: a battle to fight, the Offie, a rest. */
  at: NodeKind | 'boss' | null;
  /** Bosses beaten. */
  beaten: number;
  /** Turns taken in every battle, for the score. */
  turns: number;
  over: 'won' | 'lost' | null;
}

export type RestChoice =
  | { choice: 'heal' }
  | { choice: 'ghost' }
  | { choice: 'move'; uid: number; move: string; slot: number };

/** Every choice a player makes in a run, in order. */
export type SeshAction =
  /** Go into a node in the next row, by its place in that row. */
  | { kind: 'pick'; col: number }
  /** Go in to the boss, once every pick in the stage is made. */
  | { kind: 'boss' }
  /** The battle in the node you're in, played to the end. */
  | { kind: 'battle'; inputs: BattleInput[] }
  /** At the Offie: buy one, or leave. */
  | { kind: 'buy'; item: ItemId }
  | { kind: 'leave' }
  /** At the Smoking Area: one of the three. */
  | ({ kind: 'rest' } & RestChoice)
  /** Outside battle, any time: food, a Blue Ghost, or something to hold, on one of the party. */
  | { kind: 'use'; item: ItemId; uid: number }
  /** Takes back what a member is holding, into the bag. */
  | { kind: 'unhold'; uid: number }
  /** Puts a learnt move into one of a member's 4 slots. */
  | { kind: 'swap'; uid: number; slot: number; move: string };

/** What you start with, besides the party. */
export const START_CASH = 2000;
export const START_BAG: Partial<Record<ItemId, number>> = { 'chicken-fillet-roll': 2 };

/**
 * EXP is more than on the road, and everyone still out gets it from every foe, so a party at
 * Lv50 grows to about Lv62 by The Afterparty's boss. Foe levels are fixed, so it all counts.
 */
export const SESH_EXP = 7;

/** A new run from a seed. A Daily Challenge's seed comes from its day (`dailySeed`). */
export function newRun(seed: number, daily?: string): SeshRun {
  return {
    v: 1,
    seed,
    ...(daily && { daily }),
    party: seshParty(seed),
    gone: [],
    bag: { ...START_BAG },
    cash: START_CASH,
    ring: false,
    stage: 0,
    bosses: bossesFor(seed, QUICK_STAGES.length),
    path: [],
    at: null,
    beaten: 0,
    turns: 0,
    over: null,
  };
}

export const stageOf = (run: SeshRun): Stage => QUICK_STAGES[run.stage];
export const mapOf = (run: SeshRun): StageMap => stageMap(run.seed, run.stage);

/** The nodes you can pick next: the whole first row, or where your last pick leads. */
export function choices(run: SeshRun): number[] {
  if (run.over || run.at) return [];
  const map = mapOf(run);
  const row = run.path.length;
  if (row >= PICKS) return [];
  if (row === 0) return map[0].map((_, i) => i);
  return map[row - 1][run.path[row - 1]].next;
}

/** Whether the boss is next: every pick in the stage is made. */
export const bossNext = (run: SeshRun) => !run.over && !run.at && run.path.length >= PICKS;

/** Who you're up against in the node you're in, if it's a battle. */
export function foeOf(run: SeshRun): SeshFoe | null {
  const stage = stageOf(run);
  if (run.at === 'boss') return bossAt(run.seed, stage, run.stage, run.bosses[run.stage]);
  const row = run.path.length - 1;
  const col = run.path[row];
  if (run.at === 'fight') return fightAt(run.seed, stage, run.stage, row, col);
  if (run.at === 'bouncer') return bouncerAt(run.seed, stage, run.stage, row, col, run.ring);
  return null;
}

/** The seed of the battle in the node you're in. */
export function battleSeed(run: SeshRun): number {
  return seedFrom(`${run.seed}:${run.stage}:${run.at === 'boss' ? 'boss' : run.path.join('.')}`);
}

/** The battle in the node you're in, as it starts. */
export function battleOf(run: SeshRun) {
  const foe = foeOf(run);
  if (!foe) return null;
  return { foe, start: startSeshBattle(run.party, foe, battleSeed(run), run.ring) };
}

/** What can be bought at the Offie you're in. */
const FOOD: ItemId[] = [
  'chicken-fillet-roll',
  'spice-bag',
  'full-irish',
  'hair-of-the-dog',
  'cup-of-tea',
  'curry-chips',
  'monster',
  'watermelon-ice',
  'blue-razz',
  'cherry-cola',
  'mango-tango',
];

/** The Offie's stock: 4 to 6 things from the story's shelves, and now and then a Blue Ghost. */
export function offieStock(run: SeshRun): ItemId[] {
  const row = run.path.length - 1;
  const rng = nodeRng(run.seed, run.stage, row, run.path[row], 'offie');
  const pool = [...FOOD];
  const count = rng.int(4, 6);
  const stock: ItemId[] = ['chicken-fillet-roll'];
  pool.shift();
  while (stock.length < count) stock.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  if (rng.chance(0.35)) stock.push('blue-ghost');
  return stock;
}

/** The three moves the Smoking Area offers a member: of its types, ones it doesn't know. */
export function restMoves(run: SeshRun, m: Member): string[] {
  const row = run.path.length - 1;
  const rng = nodeRng(run.seed, run.stage, row, run.path[row], `moves:${m.uid}`);
  const types = speciesById(m.species).types as string[];
  const known = learnedOf(m);
  const pool = [...MOVES, ...SPORT_MOVES].filter(
    (mv) => mv.type && types.includes(mv.type) && !mv.signature && !known.includes(mv.id),
  );
  const out: string[] = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(rng.int(0, pool.length - 1), 1)[0].id);
  return out;
}

/** The score: bosses beaten first, then Ranemon left standing, then fewest turns. */
export function scoreOf(run: SeshRun): number {
  return run.beaten * 100_000 + run.party.length * 1_000 + Math.max(0, 999 - run.turns);
}

const add = (bag: SeshRun['bag'], id: ItemId, n = 1) => ({ ...bag, [id]: (bag[id] ?? 0) + n });
const take = (bag: SeshRun['bag'], id: ItemId) => {
  if (!(bag[id]! > 0)) throw new Error(`No ${id} in the bag`);
  return { ...bag, [id]: bag[id]! - 1 };
};

function member(run: SeshRun, uid: number): Member {
  const m = run.party.find((p) => p.uid === uid);
  if (!m) throw new Error(`No one with uid ${uid}`);
  return m;
}

const replace = (run: SeshRun, m: Member): SeshRun => ({
  ...run,
  party: run.party.map((p) => (p.uid === m.uid ? m : p)),
});

/** Gives the battle's results: EXP for everyone still out, the prize, a drop, or the end. */
function afterFight(run: SeshRun, inputs: BattleInput[]): { run: SeshRun; lines: string[] } {
  const battle = battleOf(run)!;
  const { session, used } = replayBattle(battle.start, inputs, run.bag);
  if (session.mode !== 'over') throw new Error('The battle isn’t finished');
  const { state, result } = session;
  let bag = run.bag;
  for (const id of used) bag = take(bag, id);
  const after = run.party.map((m, i) => afterBattle(m, state.teams[0].battlers[i]));
  const lines: string[] = [];
  const turns = run.turns + state.turn - 1;
  // A win with nobody left standing (the last hit's recoil, say) still ends the night.
  if (result !== 'win' || after.every((m) => m.hp === 0)) {
    return {
      run: { ...run, bag, party: after.filter((m) => m.hp > 0), turns, at: null, over: 'lost' },
      lines: ['Your night’s over. Someone call you a taxi.'],
    };
  }
  // Permadeath: whoever's still fainted goes home in a taxi.
  const gone = after.filter((m) => m.hp === 0);
  let party = after.filter((m) => m.hp > 0);
  for (const m of gone) lines.push(`${nameOf(m)} has been put in a taxi home.`);
  const earned = state.teams[1].battlers
    .filter((b) => b.hp === 0)
    .reduce((sum, b) => sum + expYield(b.level, true) * SESH_EXP, 0);
  party = party.map((m) => {
    const got = gainExp(m, earned, party);
    lines.push(...got.lines);
    return got.member;
  });
  const foe = battle.foe;
  lines.unshift(foe.after, `You got €${foe.prize} for winning!`);
  let next: SeshRun = {
    ...run,
    bag,
    party,
    gone: [...run.gone, ...gone],
    cash: run.cash + foe.prize,
    turns,
    at: null,
  };
  if (foe.drop === 'mega-ring') {
    next = { ...next, ring: true };
    lines.push(`${foe.name} dropped a Mega Ring! Your Ranemon with a Mega form can Mega evolve.`);
  } else if (foe.drop) {
    next = { ...next, bag: add(next.bag, foe.drop) };
    lines.push(`${foe.name} dropped ${itemById(foe.drop).name}!`);
  }
  if (foe.kind === 'boss') {
    const stage = next.stage + 1;
    next = { ...next, beaten: next.beaten + 1, stage, path: [] };
    if (stage >= QUICK_STAGES.length) next = { ...next, over: 'won' };
  }
  return { run: next, lines };
}

/**
 * Applies one choice to a run, with what's said about it. Throws on a choice the run doesn't
 * allow, so a run that's been tampered with can't be replayed.
 */
export function play(run: SeshRun, a: SeshAction): { run: SeshRun; lines: string[] } {
  if (run.over) throw new Error('The run is over');
  switch (a.kind) {
    case 'pick': {
      if (!choices(run).includes(a.col)) throw new Error(`Can’t go to ${a.col}`);
      const path = [...run.path, a.col];
      const kind = mapOf(run)[path.length - 1][a.col].kind;
      return { run: { ...run, path, at: kind }, lines: [] };
    }
    case 'boss':
      if (!bossNext(run)) throw new Error('The boss isn’t next');
      return { run: { ...run, at: 'boss' }, lines: [] };
    case 'battle':
      if (run.at !== 'fight' && run.at !== 'bouncer' && run.at !== 'boss') {
        throw new Error('No battle here');
      }
      return afterFight(run, a.inputs);
    case 'buy': {
      if (run.at !== 'offie' || !offieStock(run).includes(a.item)) throw new Error('Not sold');
      const price = itemById(a.item).price!;
      if (run.cash < price) throw new Error('Not enough cash');
      return {
        run: { ...run, cash: run.cash - price, bag: add(run.bag, a.item) },
        lines: [`You bought a ${itemById(a.item).name}.`],
      };
    }
    case 'leave':
      if (run.at !== 'offie') throw new Error('Not at the Offie');
      return { run: { ...run, at: null }, lines: [] };
    case 'rest': {
      if (run.at !== 'smoke') throw new Error('Not at the Smoking Area');
      const done = { ...run, at: null };
      if (a.choice === 'heal') {
        return {
          run: { ...done, party: run.party.map(heal) },
          lines: ['A sit-down outside and a glass of water. Everyone’s feeling grand again.'],
        };
      }
      if (a.choice === 'ghost') {
        return {
          run: { ...done, bag: add(run.bag, 'blue-ghost') },
          lines: ['Someone slips you a Blue Ghost.'],
        };
      }
      const m = member(run, a.uid);
      if (!restMoves(run, m).includes(a.move) || a.slot < 0 || a.slot >= MOVE_SLOTS) {
        throw new Error('Not on offer');
      }
      const learned = [...learnedOf(m), a.move];
      const next = swapMove({ ...m, learned }, Math.min(a.slot, m.moves.length), a.move);
      return {
        run: replace(done, next),
        lines: [`${nameOf(m)} learned ${moveById(a.move).name}!`],
      };
    }
    case 'use': {
      const m = member(run, a.uid);
      const item = itemById(a.item);
      const bag = take(run.bag, a.item);
      if (holdsItem(item, m.species) && item.use.kind === 'hold') {
        const back = m.held ? add(bag, m.held) : bag;
        return {
          run: replace({ ...run, bag: back }, { ...m, held: a.item }),
          lines: [`${nameOf(m)} is holding the ${item.name}.`],
        };
      }
      if (!canUseOn(item, m)) throw new Error(`${item.name} won’t do anything`);
      if (item.use.kind === 'level') {
        const got = blueGhost(m, run.party);
        return { run: replace({ ...run, bag }, got.member), lines: got.lines };
      }
      if (item.use.kind === 'heal' && item.use.effect.kind !== 'revive') {
        return { run: replace({ ...run, bag }, applyItem(item, m)), lines: [] };
      }
      throw new Error(`${item.name} can’t be used here`);
    }
    case 'unhold': {
      const m = member(run, a.uid);
      if (!m.held) throw new Error('Not holding anything');
      return {
        run: replace({ ...run, bag: add(run.bag, m.held) }, { ...m, held: undefined }),
        lines: [],
      };
    }
    case 'swap': {
      const m = member(run, a.uid);
      const next = swapMove(m, a.slot, a.move);
      if (next === m) throw new Error('Can’t swap that in');
      return { run: replace(run, next), lines: [] };
    }
  }
}

export const reduceRun = (run: SeshRun, a: SeshAction) => play(run, a).run;

/** A run replayed from its seed and every choice made. Throws if any choice isn't allowed. */
export function replayRun(seed: number, actions: SeshAction[], daily?: string): SeshRun {
  return actions.reduce(reduceRun, newRun(seed, daily));
}

/** A new seed for a free run. */
export const freshSeed = (random: () => number = Math.random) => Math.floor(random() * 2 ** 31);
