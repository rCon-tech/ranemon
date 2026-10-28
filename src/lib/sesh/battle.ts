import { startBattle, type Action, type Entrant } from '../battle/engine';
import { canUse, itemById, type ItemId } from '../story/items';
import { toEntrant, type Member } from '../story/party';
import { reduce, startSession, type Session, type SessionAction } from '../ui/session';
import type { SeshFoe } from './foes';

/**
 * A Sesh battle is kept as its seed and the player's choices, nothing else: the session is
 * seeded (`Session.seeded`), so the same choices always play out the same battle. That's how a
 * page closed mid-fight carries on where it was, and how the save server checks a run.
 */
export type BattleInput =
  | { kind: 'act'; action: Action }
  | { kind: 'replace'; to: number }
  /** An item from the BAG, on one of your Ranemon by its place in the battle. */
  | { kind: 'item'; item: ItemId; target: number }
  | { kind: 'forfeit' };

/** Your party as it goes into a battle: with the Mega Ring, any with a Mega form can use it. */
export const entrantsOf = (party: Member[], ring: boolean): Entrant[] =>
  party.map((m) => ({ ...toEntrant(m), ...(ring && { mega: true }) }));

/** A foe's team as it goes into a battle: its ace Mega evolves if it's the one that can. */
export const foeEntrants = (foe: SeshFoe): Entrant[] =>
  foe.team.map((m) => ({ ...toEntrant(m), ...(m.species === foe.mega && { mega: true }) }));

/** A battle as it starts, with nothing played back yet. */
export function startSeshBattle(
  party: Member[],
  foe: SeshFoe,
  seed: number,
  ring: boolean,
): Session {
  return startSession(startBattle([entrantsOf(party, ring), foeEntrants(foe)], seed), foe.ai, {
    foe: { kind: 'trainer', name: foe.name, line: foe.line },
    timer: false,
    seeded: true,
  });
}

/** Plays back everything queued, as the screen would, up to the next choice or the end. */
export function settle(s: Session): Session {
  while (s.mode === 'playing') s = reduce(s, { type: 'step', random: 0 });
  return s;
}

/** Whether an input can be made with the battle as it stands and the bag as it is. */
export function allowed(s: Session, input: BattleInput, bag: Partial<Record<ItemId, number>>) {
  if (input.kind !== 'item') return true;
  const b = s.state.teams[0].battlers[input.target];
  const item = itemById(input.item);
  if (!b || !(bag[input.item]! > 0)) return false;
  if (item.use.kind !== 'heal' && item.use.kind !== 'vape') return false;
  const active = input.target === s.view[0].active;
  return canUse(item.use, {
    hp: b.hp,
    maxHp: b.stats.hp,
    status: b.status,
    level: b.level,
    active,
    stages: b.stages,
  });
}

/** The session action an input makes. Randomness comes from the battle, so none is passed. */
export function actionOf(input: BattleInput): SessionAction {
  switch (input.kind) {
    case 'act':
      return { type: 'act', action: input.action, random: 0 };
    case 'replace':
      return { type: 'replace', to: input.to };
    case 'forfeit':
      return { type: 'forfeit' };
    case 'item': {
      const item = itemById(input.item);
      if (item.use.kind !== 'heal' && item.use.kind !== 'vape') {
        throw new Error(`${item.name} can't be used in battle`);
      }
      return {
        type: 'item',
        name: item.name,
        effect: item.use.effect,
        target: input.target,
        random: 0,
      };
    }
  }
}

/**
 * Plays a battle from its start through the inputs, and on to the next choice or the end.
 * Throws on an input the battle or the bag wouldn't allow, so a tampered run is turned away.
 * Returns the items used, to take out of the bag.
 */
export function replayBattle(
  start: Session,
  inputs: BattleInput[],
  bag: Partial<Record<ItemId, number>>,
): { session: Session; used: ItemId[] } {
  const left = { ...bag };
  const used: ItemId[] = [];
  let s = settle(start);
  for (const input of inputs) {
    if (s.mode === 'over') throw new Error('The battle is already over');
    if (!allowed(s, input, left)) throw new Error(`Not allowed: ${JSON.stringify(input)}`);
    const next = reduce(s, actionOf(input));
    if (next === s) throw new Error(`Nothing happened: ${JSON.stringify(input)}`);
    if (input.kind === 'item') {
      left[input.item] = left[input.item]! - 1;
      used.push(input.item);
    }
    s = settle(next);
  }
  return { session: s, used };
}
