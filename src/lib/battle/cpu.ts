import {
  activeBattler,
  computeDamage,
  legalActions,
  moveFor,
  switchTargets,
  type Action,
  type BattleState,
  type Battler,
  type Side,
} from './engine';

export type Difficulty = 'easy' | 'normal' | 'hard';

/** A float in [0, 1). */
export type Random = () => number;

const other = (side: Side): Side => (side === 0 ? 1 : 0);

/** Average damage of one use, counting accuracy and multi-hits but not crits. */
function expectedDamage(user: Battler, target: Battler, index: number): number {
  const move = moveFor(user, index);
  if (move.category === 'status') return 0;
  const hits = move.effect?.kind === 'multiHit' ? (move.effect.min + move.effect.max) / 2 : 1;
  const accuracy = move.accuracy === null ? 1 : move.accuracy / 100;
  return computeDamage(user, target, move, false, 0.5) * hits * accuracy;
}

/** How much a move is worth right now, in rough HP-equivalent units. */
function moveValue(user: Battler, target: Battler, index: number): number {
  const move = moveFor(user, index);
  const effect = move.effect;
  if (move.category !== 'status') {
    const damage = Math.min(expectedDamage(user, target, index), target.hp);
    // Finishing the target off is worth more than the HP it had left.
    const ko = damage >= target.hp ? target.stats.hp * 0.3 : 0;
    const recoil = effect?.kind === 'recoil' ? damage * effect.fraction * 0.5 : 0;
    return damage + ko - recoil;
  }
  const accuracy = move.accuracy === null ? 1 : move.accuracy / 100;
  const healthy = user.hp / user.stats.hp;
  switch (effect?.kind) {
    case 'status':
      if (target.status !== null) return 0;
      return target.stats.hp * (effect.status === 'asleep' ? 0.4 : 0.3) * accuracy;
    case 'stat':
      if (effect.target === 'self') {
        return user.stages[effect.stat] < 2 && healthy > 0.6 ? target.stats.hp * 0.25 : 0;
      }
      return target.stages[effect.stat] > -2 ? target.stats.hp * 0.15 * accuracy : 0;
    case 'heal':
      return healthy < 0.5 ? Math.min(user.stats.hp - user.hp, user.stats.hp / 2) * 0.9 : 0;
    default:
      return 0;
  }
}

/** The most damage the opponent's active creature can expect to do to this battler. */
function threatFrom(foe: Battler, target: Battler): number {
  return Math.max(...foe.pp.map((_, i) => expectedDamage(foe, target, i)));
}

function bestMove(state: BattleState, side: Side): Action {
  const user = activeBattler(state, side);
  const target = activeBattler(state, other(side));
  const moves = legalActions(state, side).filter((a) => a.kind === 'move');
  let best = moves[0];
  let bestValue = -Infinity;
  for (const action of moves) {
    const value = moveValue(user, target, action.index);
    if (value > bestValue) {
      best = action;
      bestValue = value;
    }
  }
  return best;
}

/** Picks an action for the CPU-controlled side. */
export function chooseAction(
  state: BattleState,
  side: Side,
  difficulty: Difficulty,
  random: Random,
): Action {
  if (difficulty === 'easy') {
    const moves = legalActions(state, side).filter((a) => a.kind === 'move');
    return moves[Math.floor(random() * moves.length)];
  }
  const move = bestMove(state, side);
  if (difficulty === 'hard') {
    const team = state.teams[side];
    const me = activeBattler(state, side);
    const foe = activeBattler(state, other(side));
    const threat = threatFrom(foe, me);
    const canFinish = move.kind === 'move' && expectedDamage(me, foe, move.index) >= foe.hp;
    if (threat >= me.hp * 0.5 && !canFinish) {
      const safer = switchTargets(state, side)
        .map((i) => ({ i, threat: threatFrom(foe, team.battlers[i]) / team.battlers[i].hp }))
        .sort((a, b) => a.threat - b.threat)[0];
      if (safer && safer.threat < threat / me.hp / 2) return { kind: 'switch', to: safer.i };
    }
  }
  return move;
}

/** Picks which benched creature to send in after a faint. */
export function chooseReplacement(
  state: BattleState,
  side: Side,
  difficulty: Difficulty,
  random: Random,
): number {
  const options = switchTargets(state, side);
  if (difficulty === 'easy') return options[Math.floor(random() * options.length)];
  const foe = activeBattler(state, other(side));
  const team = state.teams[side];
  const score = (i: number) => {
    const b = team.battlers[i];
    const dealt = Math.max(...b.pp.map((_, m) => expectedDamage(b, foe, m))) / foe.hp;
    const taken = threatFrom(foe, b) / b.hp;
    return dealt - taken;
  };
  return options.reduce((best, i) => (score(i) > score(best) ? i : best), options[0]);
}
