import type { BattleEvent, BattleState, Side } from '../battle/engine';
import { moveById, type Stat, type Status } from '../battle/moves';

/** What the battle screen shows, rebuilt one event at a time so HP bars and text stay in step. */
export interface SideView {
  active: number;
  /** False between a withdraw or faint and the next send-out. */
  shown: boolean;
  hp: number[];
  status: (Status | null)[];
}

export type View = [SideView, SideView];

export function viewOf(state: BattleState): View {
  return state.teams.map((team) => ({
    active: team.active,
    shown: team.battlers[team.active].hp > 0,
    hp: team.battlers.map((b) => b.hp),
    status: team.battlers.map((b) => b.status),
  })) as View;
}

/** Applies one event to the view. Returns a new view. */
export function applyEvent(view: View, event: BattleEvent): View {
  if (event.kind === 'win' || !('side' in event)) return view;
  const next = view.map((s) => ({ ...s, hp: [...s.hp], status: [...s.status] })) as View;
  const side = next[event.side];
  switch (event.kind) {
    case 'send-out':
      side.active = event.index;
      side.shown = true;
      break;
    case 'withdraw':
      side.shown = false;
      break;
    case 'damage':
    case 'recoil':
    case 'heal':
    case 'status-damage':
      side.hp[side.active] = event.hp;
      break;
    case 'status':
      side.status[side.active] = event.status;
      break;
    case 'wake':
      side.status[side.active] = null;
      break;
    case 'faint':
      side.hp[side.active] = 0;
      side.shown = false;
      break;
  }
  return next;
}

const STAT_NAME: Record<Stat, string> = {
  attack: 'Attack',
  defense: 'Defense',
  spirit: 'Spirit',
  speed: 'Speed',
};

const STATUS_TEXT: Record<Status, string> = {
  flustered: 'is flustered! It may be unable to move!',
  hangry: 'is hangry!',
  asleep: 'fell asleep!',
};

/** Short tags for info boxes. */
export const STATUS_TAG: Record<Status, string> = {
  flustered: 'FLU',
  hangry: 'HNG',
  asleep: 'SLP',
};

/**
 * The text-box line for an event, or null for events that only animate. `view` is the view
 * before the event, so names refer to the creature that was out when it happened.
 */
export function describeEvent(event: BattleEvent, state: BattleState, view: View): string | null {
  if (event.kind === 'win') {
    if (event.winner === 'draw') return 'It’s a draw!';
    return event.winner === 0 ? 'You won the battle!' : 'You lost the battle…';
  }
  const side: Side = event.side;
  const index = event.kind === 'send-out' ? event.index : view[side].active;
  const creature = state.teams[side].battlers[index].creature.name;
  const name = side === 0 ? creature : `Foe ${creature}`;

  switch (event.kind) {
    case 'send-out':
      return side === 0 ? `Go! ${creature}!` : `Your rival sent out ${creature}!`;
    case 'withdraw':
      return side === 0 ? `${creature}, come back!` : `Your rival withdrew ${creature}!`;
    case 'move':
      return `${name} used ${moveById(event.moveId).name}!`;
    case 'miss':
      return `${name}’s attack missed!`;
    case 'damage': {
      if (event.crit) return 'A critical hit!';
      if (event.effectiveness > 1) return 'It’s super effective!';
      if (event.effectiveness < 1) return 'It’s not very effective…';
      return null;
    }
    case 'hits':
      return `Hit ${event.count} time${event.count === 1 ? '' : 's'}!`;
    case 'recoil':
      return `${name} is hit with recoil!`;
    case 'heal':
      return event.amount > 0 ? `${name} regained health!` : `${name}’s HP is full!`;
    case 'status':
      return `${name} ${STATUS_TEXT[event.status]}`;
    case 'status-failed':
      return 'But it failed!';
    case 'status-damage':
      return `${name} is hurt by hunger!`;
    case 'stat': {
      const size = Math.abs(event.change);
      const how =
        event.change > 0
          ? size > 1
            ? 'rose sharply'
            : 'rose'
          : size > 1
            ? 'harshly fell'
            : 'fell';
      return `${name}’s ${STAT_NAME[event.stat]} ${how}!`;
    }
    case 'stat-limit':
      return `${name}’s ${STAT_NAME[event.stat]} won’t go any ${event.rising ? 'higher' : 'lower'}!`;
    case 'asleep':
      return `${name} is fast asleep.`;
    case 'wake':
      return `${name} woke up!`;
    case 'fluster-skip':
      return `${name} is too flustered to move!`;
    case 'faint':
      return `${name} fainted!`;
  }
}
