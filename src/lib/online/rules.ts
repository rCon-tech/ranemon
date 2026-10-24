import { MAX_LEVEL, MIN_LEVEL, type Creature } from '../battle/creature';
import type {
  Action,
  Battler,
  BattleEvent,
  BattleState,
  Entrant,
  Phase,
  Side,
} from '../battle/engine';
import { EVOLVED, ITEM_EVOLVED, reachedAt } from '../battle/evolutions';
import { LONDON } from '../battle/london';
import { LEGEND } from '../battle/legend';
import { allMoves } from '../battle/moves';
import { PETCHEMON } from '../battle/petchemon';
import { POSEIDON } from '../battle/poseidon';
import { ROSTER } from '../battle/roster';
import { TYPES, typeMultiplier } from '../battle/types';
import { variantOf } from '../battle/variants';
import { heldBoost, ITEMS } from '../story/items';
import { BOSS, creatureOf, movesAt, PARTY_SIZE, speciesById, type Member } from '../story/party';
import type { QueueItem } from '../ui/session';

/**
 * Online friend battles: the rules both phones and the save server share. The server runs the
 * battle (`server.ts`); each phone only sends its choices and plays back what happened.
 */

/**
 * Bumped by hand when the engine changes how a battle plays out. The rest of RULES_VERSION is a
 * hash of the battle data, so a new move or a rebalance changes it on its own.
 */
const ENGINE_REVISION = 1;

/** FNV-1a, as 8 hex digits. Not for security: only to tell two versions of the data apart. */
function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const ALL_SPECIES: Creature[] = [
  ...ROSTER,
  ...EVOLVED,
  ...ITEM_EVOLVED,
  PETCHEMON,
  LEGEND,
  POSEIDON,
  ...LONDON,
];

/**
 * Both players and the server must fight by the same moves, stats and types. Every call carries
 * this, and the server turns away a game on another version with "update the game".
 */
export const RULES_VERSION = fnv(
  JSON.stringify([
    ENGINE_REVISION,
    allMoves(),
    ALL_SPECIES.map((c) => [c.id, c.types, c.base, c.moves]),
    TYPES.map((a) => TYPES.map((d) => typeMultiplier(a, d))),
    ITEMS.map((i) => [i.id, i.use]),
  ]),
);

/** How levels are set for a friend battle, picked by the challenger. */
export type LevelRule = 'flat50' | 'cap50' | 'caught';

export const LEVEL_RULES: { id: LevelRule; label: string; about: string }[] = [
  {
    id: 'flat50',
    label: 'FLAT 50',
    about: 'Every Ranemon fights at Lv50. Moves and evolutions from Story still count.',
  },
  {
    id: 'cap50',
    label: 'CAP 50',
    about: 'Above Lv50 comes down to 50; the rest stay as they are.',
  },
  { id: 'caught', label: 'AS CAUGHT', about: `Real levels, 5 to ${MAX_LEVEL}.` },
];

export const isLevelRule = (x: unknown): x is LevelRule => LEVEL_RULES.some((r) => r.id === x);

export function ruleLevel(rule: LevelRule, level: number): number {
  if (rule === 'flat50') return 50;
  if (rule === 'cap50') return Math.min(50, level);
  return level;
}

/** Ranemon there is only one of in the whole story. */
const ONE_OF = [PETCHEMON.id, LEGEND.id, POSEIDON.id];

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * The team a save fights with online: its party, checked so that a hand-edited save can at least
 * only bring a team the game could have given it. Returns the reason when it can't.
 */
export function validateTeam(party: unknown): { team: Member[] } | { error: string } {
  if (!Array.isArray(party) || party.length === 0) return { error: 'Your party is empty.' };
  if (party.length > PARTY_SIZE) return { error: `A team is at most ${PARTY_SIZE} Ranemon.` };
  const uids = new Set<number>();
  const team: Member[] = [];
  for (const m of party) {
    if (!isObject(m) || typeof m.species !== 'string') return { error: 'A Ranemon is unreadable.' };
    let species: Creature;
    try {
      species = speciesById(m.species);
    } catch {
      return { error: `${m.species} isn’t in this version of the game.` };
    }
    const name = species.name;
    if (species.id === BOSS.id) return { error: `${name} can’t join a team.` };
    const level = m.level;
    if (typeof level !== 'number' || !Number.isInteger(level))
      return { error: `${name} has no level.` };
    if (level < MIN_LEVEL || level > MAX_LEVEL)
      return { error: `${name} is Lv${level}, outside ${MIN_LEVEL} to ${MAX_LEVEL}.` };
    if (level < reachedAt(species.id))
      return { error: `${name} can’t have evolved by Lv${level}.` };
    const uid = m.uid;
    if (typeof uid !== 'number' || uids.has(uid)) return { error: `${name} is on the team twice.` };
    uids.add(uid);
    const moves = m.moves;
    if (!Array.isArray(moves) || moves.length < 1 || moves.length > 4)
      return { error: `${name} needs 1 to 4 moves.` };
    if (new Set(moves).size !== moves.length) return { error: `${name} knows a move twice.` };
    const known = movesAt(species, level);
    for (const move of moves) {
      if (typeof move !== 'string' || !known.includes(move))
        return { error: `${name} can’t know ${String(move)} at Lv${level}.` };
    }
    if (m.variant !== undefined && !variantOf(species.id, m.variant as string))
      return { error: `${name} has a look it doesn’t have.` };
    if (m.held !== undefined && !ITEMS.some((i) => i.id === m.held && i.use.kind === 'hold'))
      return { error: `${name} is holding something it can’t.` };
    team.push({
      uid,
      species: species.id,
      level,
      exp: 0,
      hp: 1,
      pp: [],
      status: null,
      moves: moves as string[],
      ...(m.shiny === true && { shiny: true }),
      ...(typeof m.variant === 'string' && { variant: m.variant }),
      ...(typeof m.held === 'string' && { held: m.held as Member['held'] }),
    });
  }
  for (const id of ONE_OF) {
    if (team.filter((m) => m.species === id).length > 1)
      return { error: `There’s only one ${speciesById(id).name}.` };
  }
  return { team };
}

/** A checked team as the engine starts it online: at the rule's level, healthy and full of PP. */
export function entrantsOf(team: Member[], rule: LevelRule): Entrant[] {
  return team.map((m) => {
    const held = heldBoost(m);
    return {
      creature: creatureOf(m),
      level: ruleLevel(rule, m.level),
      ...(held && { held }),
    };
  });
}

// ---------- what each phone sees ----------

const other = (side: Side): Side => (side === 0 ? 1 : 0);

/** A foe's Ranemon that hasn't been sent out yet: the phone only learns it's there. */
export const HIDDEN: Creature = {
  id: 'hidden',
  name: '???',
  types: ['chill'],
  base: { hp: 1, attack: 1, defense: 1, spirit: 1, speed: 1 },
  moves: [],
  entry: '',
  colour: '#8890a0',
};

function hide(b: Battler): Battler {
  const one = { hp: 1, attack: 1, defense: 1, spirit: 1, speed: 1 };
  return {
    creature: HIDDEN,
    level: 1,
    stats: one,
    hp: b.hp > 0 ? 1 : 0,
    status: null,
    sleepTurns: 0,
    stages: { attack: 0, defense: 0, spirit: 0, speed: 0 },
    mods: { attack: 1, defense: 1, spirit: 1, speed: 1 },
    pp: [],
  };
}

function flipPhase(phase: Phase): Phase {
  if (phase.kind === 'replace') return { kind: 'replace', sides: phase.sides.map(other) };
  if (phase.kind === 'over' && phase.winner !== 'draw')
    return { kind: 'over', winner: other(phase.winner) };
  return phase;
}

/**
 * The battle as one player sees it: their own team as side 0, and only the foe's Ranemon that
 * have been sent out (`seen`, by the foe's index).
 */
export function stateFor(state: BattleState, side: Side, seen: number[]): BattleState {
  const mine = state.teams[side];
  const foe = state.teams[other(side)];
  return {
    ...state,
    teams: [
      mine,
      { ...foe, battlers: foe.battlers.map((b, i) => (seen.includes(i) ? b : hide(b))) },
    ],
    phase: side === 0 ? state.phase : flipPhase(state.phase),
  };
}

/** An event as one player sees it, with their own side as 0. */
export function eventFor(item: QueueItem, side: Side): QueueItem {
  if (side === 0 || !('kind' in item)) return item;
  if (item.kind === 'say' || item.kind === 'end') return item;
  const e = item as BattleEvent;
  if (e.kind === 'win') return { ...e, winner: e.winner === 'draw' ? 'draw' : other(e.winner) };
  if (e.kind === 'swap-hp') return { ...e, side: other(e.side), hp: [e.hp[1], e.hp[0]] };
  return { ...e, side: other(e.side) } as BattleEvent;
}

/** The actions a phone may send: never a `pass`, which is only for story mode's items. */
export function isOnlineAction(x: unknown): x is Action {
  if (!isObject(x)) return false;
  if (x.kind === 'move') return Number.isInteger(x.index);
  if (x.kind === 'switch') return Number.isInteger(x.to);
  return false;
}

// ---------- the save server's battle calls ----------

export type RoomStage = 'waiting' | 'lobby' | 'live' | 'over' | 'closed';

/** One player as both phones see them. */
export interface PlayerView {
  name: string;
  ready: boolean;
  /** How many Ranemon they bring, once ready. */
  size?: number;
}

/** What every battle call answers with: where the room is up to, from this player's side. */
export interface RoomView {
  code: string;
  rule: LevelRule;
  stage: RoomStage;
  you: PlayerView;
  foe: PlayerView | null;
  /** The number of steps so far; send it back as `after` to get only what's new. */
  n: number;
  /** What happened after `after`, oldest first, to play back. */
  items: QueueItem[];
  /** The battle now, once it has started. */
  state: BattleState | null;
  /** Why the battle ended, once it has. */
  why?: 'battle' | 'forfeit' | 'timeout';
}

/**
 * A trainer name as the save server files it, the same as `playerId` in `story/state.ts` (which
 * the server can't load, since it pulls in the maps).
 */
export function trainerId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 20);
}
