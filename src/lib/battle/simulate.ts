import { chooseAction, chooseReplacement, type Difficulty } from './cpu';
import type { Creature } from './creature';
import {
  playTurn,
  replaceFainted,
  startBattle,
  type BattleState,
  type Entrant,
  type Side,
} from './engine';
import { Rng } from './rng';

const MAX_TURNS = 300;

/** Plays a whole battle between two CPUs. Used for balance checks and tests. */
export function simulateBattle(
  teams: [(Creature | Entrant)[], (Creature | Entrant)[]],
  seed: number,
  difficulty: [Difficulty, Difficulty] = ['normal', 'normal'],
): { state: BattleState; turns: number } {
  const cpuRng = new Rng(seed ^ 0x5bd1e995);
  const random = () => cpuRng.next();
  let { state } = startBattle(teams, seed);
  while (state.phase.kind !== 'over') {
    if (state.turn > MAX_TURNS) throw new Error('Battle did not finish');
    if (state.phase.kind === 'replace') {
      const side = state.phase.sides[0];
      state = replaceFainted(
        state,
        side,
        chooseReplacement(state, side, difficulty[side], random),
      ).state;
      continue;
    }
    const actions = ([0, 1] as Side[]).map((side) =>
      chooseAction(state, side, difficulty[side], random),
    ) as [ReturnType<typeof chooseAction>, ReturnType<typeof chooseAction>];
    state = playTurn(state, actions).state;
  }
  return { state, turns: state.turn - 1 };
}
