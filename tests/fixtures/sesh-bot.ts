import { chooseAction, chooseReplacement } from '@/lib/battle/cpu';
import { Rng } from '@/lib/battle/rng';
import { settle, type BattleInput } from '@/lib/sesh/battle';
import {
  battleOf,
  bossNext,
  choices,
  mapOf,
  offieStock,
  play,
  restMoves,
  type SeshAction,
  type SeshRun,
} from '@/lib/sesh/run';
import { itemById, type ItemId } from '@/lib/story/items';
import { statsOf } from '@/lib/story/party';
import { reduce, type Session } from '@/lib/ui/session';
import { actionOf } from '@/lib/sesh/battle';

/**
 * A simple bot that plays Quick Sesh the way a careful player might: Hard-CPU moves in battle,
 * food between fights, a rest when the party's hurt, and Bouncers only when it's healthy.
 */

/** How healthy the party is, 0 to 1. */
const health = (run: SeshRun) =>
  run.party.reduce((sum, m) => sum + m.hp / statsOf(m).hp, 0) / Math.max(1, run.party.length);

/** Plays the battle in the node the run is in, as the bot. Returns its inputs and the session. */
export function botBattle(start: Session, rng: Rng): { inputs: BattleInput[]; session: Session } {
  const random = () => rng.next();
  const inputs: BattleInput[] = [];
  let s = settle(start);
  for (let guard = 0; s.mode !== 'over' && guard < 2000; guard++) {
    const input: BattleInput =
      s.mode === 'forced-switch'
        ? { kind: 'replace', to: chooseReplacement(s.state, 0, 'hard', random) }
        : { kind: 'act', action: chooseAction(s.state, 0, 'hard', random) };
    inputs.push(input);
    s = settle(reduce(s, actionOf(input)));
  }
  return { inputs, session: s };
}

/** The bot's next choice outside battle. */
function nextChoice(run: SeshRun, rng: Rng): SeshAction {
  // Food on anyone below half, a Blue Ghost on the lowest level.
  for (const m of run.party) {
    const max = statsOf(m).hp;
    const food = (['full-irish', 'spice-bag', 'chicken-fillet-roll'] as ItemId[]).find(
      (id) => run.bag[id]! > 0,
    );
    if (food && m.hp < max / 2) return { kind: 'use', item: food, uid: m.uid };
  }
  if (run.bag['blue-ghost']! > 0) {
    const low = [...run.party].sort((a, b) => a.level - b.level)[0];
    return { kind: 'use', item: 'blue-ghost', uid: low.uid };
  }
  if (run.at === 'offie') {
    const stock = offieStock(run);
    const wish = (['blue-ghost', 'full-irish', 'spice-bag'] as ItemId[]).find(
      (id) => stock.includes(id) && run.cash >= itemById(id).price! && (run.bag[id] ?? 0) < 3,
    );
    return wish ? { kind: 'buy', item: wish } : { kind: 'leave' };
  }
  if (run.at === 'smoke') {
    if (health(run) < 0.8) return { kind: 'rest', choice: 'heal' };
    const m = run.party[0];
    const moves = restMoves(run, m);
    return moves.length && rng.chance(0.3)
      ? { kind: 'rest', choice: 'move', uid: m.uid, move: moves[0], slot: 0 }
      : { kind: 'rest', choice: 'ghost' };
  }
  if (bossNext(run)) return { kind: 'boss' };
  const map = mapOf(run);
  const row = run.path.length;
  const options = choices(run);
  const score = (col: number) => {
    const kind = map[row][col].kind;
    if (kind === 'smoke') return health(run) < 0.7 ? 3 : 1;
    if (kind === 'bouncer') return health(run) > 0.85 && run.party.length >= 4 ? 2 : -1;
    if (kind === 'offie') return run.cash > 2500 ? 2 : 0;
    return 1.5;
  };
  const best = [...options].sort((a, b) => score(b) - score(a) || rng.next() - 0.5)[0];
  return { kind: 'pick', col: best };
}

export interface BotRun {
  run: SeshRun;
  actions: SeshAction[];
  /** Battles fought, and the playback time of all of them at 1× in ms. */
  battles: number;
  playback: number;
  inputs: number;
  /** The party's average level going in to each boss. */
  bossLevels: number[];
}

/** Plays a whole run as the bot, from a new run. */
export function botRun(start: SeshRun, seed: number): BotRun {
  const rng = new Rng(seed);
  let run = start;
  const actions: SeshAction[] = [];
  let battles = 0;
  let playback = 0;
  let inputs = 0;
  const bossLevels: number[] = [];
  for (let guard = 0; !run.over && guard < 500; guard++) {
    let a: SeshAction;
    const battle = battleOf(run);
    if (battle && run.at) {
      if (run.at === 'boss') {
        bossLevels.push(run.party.reduce((s, m) => s + m.level, 0) / run.party.length);
      }
      const played = botBattle(battle.start, rng);
      battles++;
      inputs += played.inputs.length;
      playback += timeOf(battle.start, played.inputs);
      a = { kind: 'battle', inputs: played.inputs };
    } else a = nextChoice(run, rng);
    actions.push(a);
    run = play(run, a).run;
  }
  return { run, actions, battles, playback, inputs, bossLevels };
}

/** How long a battle's playback takes at 1×: every pause the screen waits, added up. */
export function timeOf(start: Session, inputs: BattleInput[]): number {
  let total = 0;
  let s = start;
  const steps = (x: Session) => {
    while (x.mode === 'playing') {
      x = reduce(x, { type: 'step', random: 0 });
      total += x.pause;
    }
    return x;
  };
  s = steps(s);
  for (const input of inputs) s = steps(reduce(s, actionOf(input)));
  return total;
}
