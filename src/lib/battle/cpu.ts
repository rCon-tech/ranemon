import {
  activeBattler,
  computeDamage,
  effectiveStat,
  legalActions,
  moveFor,
  switchTargets,
  type Action,
  type BattleState,
  type Battler,
  type Side,
} from './engine';
import { moveById, type SpecialEffect } from './moves';

export type Difficulty = 'easy' | 'normal' | 'hard';

/** How often Normal picks a random move instead of its best one. */
export const NORMAL_SLIP = 0.5;

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
function moveValue(state: BattleState, side: Side, index: number): number {
  const user = activeBattler(state, side);
  const target = activeBattler(state, other(side));
  const move = moveFor(user, index);
  const specials = (move.specials ?? []).reduce(
    (sum, e) => sum + specialValue(state, side, e, move.accuracy),
    0,
  );
  return effectValue(user, target, index) + specials;
}

function effectValue(user: Battler, target: Battler, index: number): number {
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

/** What a special move's friend-specific effect is worth, in the same units as moveValue. */
function specialValue(
  state: BattleState,
  side: Side,
  effect: SpecialEffect,
  accuracyPercent: number | null,
): number {
  const user = activeBattler(state, side);
  const target = activeBattler(state, other(side));
  const accuracy = accuracyPercent === null ? 1 : accuracyPercent / 100;
  const healthy = user.hp / user.stats.hp;
  switch (effect.kind) {
    case 'boost': {
      const subject = effect.target === 'self' ? user : target;
      const mod = subject.mods[effect.stat];
      const raising = effect.factor > 1;
      if (raising ? mod >= 1.6 : mod <= 0.6) return 0;
      const size = Math.abs(effect.factor - 1);
      // Rough worth over the next couple of turns: more damage dealt, or less taken.
      const dealt = Math.max(...user.pp.map((_, i) => expectedDamage(user, target, i)));
      const taken = threatFrom(target, user);
      const faster = effectiveStat(user, 'speed') > effectiveStat(target, 'speed');
      if (effect.target === 'self') {
        if (healthy <= (effect.stat === 'defense' ? 0.3 : 0.5) || !raising) return 0;
        if (effect.stat === 'speed') return faster ? 0 : dealt * 0.8;
        if (effect.stat === 'defense') return taken * size * 2;
        const uses = effect.stat === 'attack' ? 'physical' : 'spirit';
        if (!user.creature.moves.some((id) => moveById(id).category === uses)) return 0;
        return dealt * size * 2;
      }
      if (effect.stat === 'speed') return faster ? 0 : dealt * 0.6 * accuracy;
      if (effect.stat === 'defense') return dealt * size * 1.5 * accuracy;
      return taken * size * 1.5 * accuracy;
    }
    case 'self-damage':
      return healthy > effect.fraction + 0.4 ? -user.stats.hp * effect.fraction * 0.5 : -Infinity;
    case 'swap-hp': {
      const gain = Math.min(user.stats.hp, target.hp) - user.hp;
      const loss = target.hp - Math.min(target.stats.hp, user.hp);
      return Math.max(0, (gain + loss) * accuracy);
    }
    case 'tag-partner': {
      // The partner tags in at full HP if it's on the team; otherwise a fresh wild one
      // replaces the user, which is worth the HP the user had lost.
      const partner =
        state.teams[side].battlers.find(
          (b) => b.creature.id === effect.partner && b.hp > 0 && b !== user,
        ) ?? user;
      return (partner.stats.hp - partner.hp) * 0.8 + target.stats.hp * 0.1;
    }
    case 'hit-and-run': {
      const attacks = user.pp.map((_, i) => expectedDamage(user, target, i)).filter((d) => d > 0);
      if (attacks.length === 0) return 0;
      // A hit, then out of harm's way when the foe threatens a lot.
      const average = attacks.reduce((a, b) => a + b, 0) / attacks.length;
      const threat = threatFrom(target, user);
      return average * 0.9 + (threat >= user.hp * 0.5 ? threat * 0.4 : 0);
    }
  }
}

/** The most damage the opponent's active creature can expect to do to this battler. */
function threatFrom(foe: Battler, target: Battler): number {
  return Math.max(...foe.pp.map((_, i) => expectedDamage(foe, target, i)));
}

function bestMove(state: BattleState, side: Side): Action {
  const moves = legalActions(state, side).filter((a) => a.kind === 'move');
  let best = moves[0];
  let bestValue = -Infinity;
  for (const action of moves) {
    const value = moveValue(state, side, action.index);
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
  // Normal slips up now and then, picking any move instead of the best one.
  if (difficulty === 'normal' && random() < NORMAL_SLIP) {
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
  if (difficulty === 'easy' || (difficulty === 'normal' && random() < NORMAL_SLIP)) {
    return options[Math.floor(random() * options.length)];
  }
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
