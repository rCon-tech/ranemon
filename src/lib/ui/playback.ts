import type { BattleEvent, BattleState, Side } from '../battle/engine';
import { moveById, type Stat, type Status } from '../battle/moves';

/** Who the player is up against, which changes how the text box talks about the other side. */
export interface Foe {
  kind: 'rival' | 'trainer' | 'wild';
  /** A trainer's name, such as "Nóra". */
  name?: string;
  /** What the trainer says each time they send out a Ranemon. */
  line?: string;
}

export const RIVAL: Foe = { kind: 'rival' };

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
    case 'wild-partner':
      side.hp[side.active] = 0;
      side.hp.push(event.hp);
      side.status.push(null);
      side.shown = false;
      break;
    case 'swap-hp':
      next[0].hp[next[0].active] = event.hp[0];
      next[1].hp[next[1].active] = event.hp[1];
      break;
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
    case 'self-damage':
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
export function describeEvent(
  event: BattleEvent,
  state: BattleState,
  view: View,
  foe: Foe = RIVAL,
): string | null {
  const trainer = foe.kind === 'trainer' ? (foe.name ?? 'The trainer') : 'Your rival';
  if (event.kind === 'win') {
    if (event.winner === 'draw') return 'It’s a draw!';
    if (event.winner === 1) return 'You lost the battle…';
    if (foe.kind === 'wild') return null;
    return foe.kind === 'trainer' ? `You beat ${trainer}!` : 'You won the battle!';
  }
  const side: Side = event.side;
  const index = event.kind === 'send-out' ? event.index : view[side].active;
  const creature = state.teams[side].battlers[index].creature.name;
  const name = side === 0 ? creature : `${foe.kind === 'wild' ? 'Wild' : 'Foe'} ${creature}`;

  switch (event.kind) {
    case 'send-out':
      if (side === 0) return `Go! ${creature}!`;
      if (foe.kind === 'wild') {
        return state.teams[side].battlers[index].creature.shiny
          ? `A shiny ${creature} appeared!`
          : `A wild ${creature} appeared!`;
      }
      return `${trainer} sent out ${creature}!`;
    case 'withdraw':
      return side === 0 ? `${creature}, come back!` : `${trainer} withdrew ${creature}!`;
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
    case 'boost': {
      const percent = Math.round(Math.abs(event.factor - 1) * 100);
      const how = event.factor > 1 ? 'rose' : 'fell';
      return `${name}’s ${STAT_NAME[event.stat]} ${how} by ${percent}%!`;
    }
    case 'self-damage':
      return `${name} paid for it with some HP!`;
    case 'swap-hp': {
      const foeSide: Side = side === 0 ? 1 : 0;
      const other = state.teams[foeSide].battlers[view[foeSide].active].creature.name;
      const label = foeSide === 0 ? other : `${foe.kind === 'wild' ? 'Wild' : 'Foe'} ${other}`;
      return `${name} swapped HP with ${label}!`;
    }
    case 'wild-partner': {
      const partner = state.teams[side].battlers[event.index].creature.name;
      return `${name} called in a wild ${partner}!`;
    }
    case 'faint':
      return `${name} fainted!`;
  }
}
