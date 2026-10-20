import { mapById, outsideOf } from '@/content/story/maps';
import type { BattleState } from '../battle/engine';
import type { Result } from '../ui/session';
import type { ItemId } from './items';
import {
  afterBattle,
  expYield,
  gainExp,
  heal,
  makeMember,
  PARTY_SIZE,
  catchUp,
  speciesById,
  type Member,
} from './party';
import { marker, type Dir } from './world';

/** Everything a story save holds. Plain JSON. */
export interface StoryState {
  version: 1;
  map: string;
  x: number;
  y: number;
  face: Dir;
  party: Member[];
  /** The Group Chat: Ranemon that didn't fit in the party. */
  box: Member[];
  bag: Partial<Record<ItemId, number>>;
  money: number;
  flags: string[];
  seen: string[];
  caught: string[];
  /** Where you wake up after a blackout: the last pub you visited. */
  pub: { map: string; x: number; y: number };
  /** The next member uid. */
  uid: number;
  starter?: string;
  steps: number;
  /** When it was last saved, to pick the newer of a browser save and an online one. */
  savedAt?: number;
}

export const SAVE_KEY = 'ranemon.story.v1';
/** The trainer name last used in this browser. */
export const PLAYER_KEY = 'ranemon.player';

/**
 * A trainer name as saves are filed under it: case and extra spaces don't matter, and spaces
 * become dashes so it can name a database document.
 */
export function playerId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 20);
}

/** Where a trainer's save lives in this browser. */
export const saveKey = (name: string) => `${SAVE_KEY}:${playerId(name)}`;
export const START_MONEY = 3000;

export function newGame(): StoryState {
  const start = marker(mapById('clare'), '@');
  return {
    version: 1,
    map: 'clare',
    ...start,
    face: 'down',
    party: [],
    box: [],
    bag: {},
    money: START_MONEY,
    flags: [],
    seen: [],
    caught: [],
    pub: { map: 'clare', ...start },
    uid: 1,
    steps: 0,
  };
}

export const hasFlag = (s: StoryState, flag: string) => s.flags.includes(flag);

export function setFlag(s: StoryState, flag: string): StoryState {
  return hasFlag(s, flag) ? s : { ...s, flags: [...s.flags, flag] };
}

export const beatFlag = (trainer: string) => `beat:${trainer}`;

export function give(s: StoryState, item: ItemId, count = 1): StoryState {
  return { ...s, bag: { ...s.bag, [item]: (s.bag[item] ?? 0) + count } };
}

export function take(s: StoryState, item: ItemId): StoryState {
  const left = (s.bag[item] ?? 0) - 1;
  const bag = { ...s.bag };
  if (left > 0) bag[item] = left;
  else delete bag[item];
  return { ...s, bag };
}

export function see(s: StoryState, species: string): StoryState {
  return s.seen.includes(species) ? s : { ...s, seen: [...s.seen, species] };
}

/** Adds a new friend to the party, or to the Group Chat when the party is full. */
export function recruit(
  s: StoryState,
  species: string,
  level: number,
  from?: Partial<Member>,
): { state: StoryState; line: string | null } {
  const member: Member = { ...makeMember(species, level, s.uid), ...from, uid: s.uid };
  const caught = s.caught.includes(member.species) ? s.caught : [...s.caught, member.species];
  const next = { ...see(s, member.species), uid: s.uid + 1, caught };
  if (s.party.length < PARTY_SIZE) {
    return { state: { ...next, party: [...s.party, member] }, line: null };
  }
  return {
    state: { ...next, box: [...s.box, member] },
    line: `Your party is full, so ${speciesById(species).name} joined the Group Chat.`,
  };
}

export function healParty(s: StoryState): StoryState {
  return { ...s, party: s.party.map(heal) };
}

export const canFight = (s: StoryState) => s.party.some((m) => m.hp > 0);

/** The member who walks behind you: the first one still standing. */
export const follower = (s: StoryState) => s.party.find((m) => m.hp > 0) ?? null;

/**
 * What a finished battle leaves behind: HP, PP and status copied back, EXP for every foe that
 * fainted (shared by the Ranemon that fought it, and half for the rest with The Round), and the
 * catch or the blackout.
 */
export function settleBattle(
  s: StoryState,
  battle: BattleState,
  result: Result,
  fought: number[],
  trainer: boolean,
): { state: StoryState; lines: string[] } {
  const lines: string[] = [];
  let party = s.party.map((m, i) => afterBattle(m, battle.teams[0].battlers[i]));

  if (result === 'win' || result === 'caught') {
    const foes = battle.teams[1].battlers.filter((b) => b.hp === 0 && !b.left);
    for (const foe of foes) {
      const total = expYield(foe.level, trainer);
      const fighters = fought.filter((i) => i < party.length && party[i].hp > 0);
      const shareOut = (i: number, amount: number) => {
        const { member, lines: more } = gainExp(party[i], amount);
        party = party.map((m, j) => (j === i ? member : m));
        lines.push(...more);
      };
      for (const i of fighters) shareOut(i, Math.max(1, Math.floor(total / fighters.length)));
      if (hasFlag(s, 'round')) {
        party.forEach((m, i) => {
          if (!fighters.includes(i) && m.hp > 0) shareOut(i, Math.max(1, Math.floor(total / 2)));
        });
      }
    }
  }

  let state: StoryState = { ...s, party };
  if (result === 'caught') {
    const foe = battle.teams[1].battlers[battle.teams[1].active];
    const joined = recruit(state, foe.creature.id, foe.level, {
      hp: foe.hp,
      status: foe.status,
    });
    state = joined.state;
    if (joined.line) lines.push(joined.line);
  }
  if (result === 'loss' || result === 'draw') {
    const tab = Math.floor(state.money / 2);
    state = { ...healParty(state), money: state.money - tab, ...s.pub, face: 'down' };
    const town = outsideOf(mapById(s.pub.map)).name.split(',')[0];
    lines.push(
      'You’re out of Ranemon that can fight!',
      `You come round in ${town}, with a bar tab of €${tab}.`,
    );
  }
  return { state, lines };
}

/** Swaps a member to the front of the party, so it leads in battle and walks behind you. */
export function makeLead(s: StoryState, index: number): StoryState {
  const party = [...s.party];
  [party[0], party[index]] = [party[index], party[0]];
  return { ...s, party };
}

export function toGroupChat(s: StoryState, index: number): StoryState {
  if (s.party.length <= 1) return s;
  return {
    ...s,
    party: s.party.filter((_, i) => i !== index),
    box: [...s.box, s.party[index]],
  };
}

export function fromGroupChat(s: StoryState, index: number): StoryState {
  if (s.party.length >= PARTY_SIZE) return s;
  return {
    ...s,
    box: s.box.filter((_, i) => i !== index),
    party: [...s.party, heal(s.box[index])],
  };
}

/** A save read back from its JSON, or null if it isn't one. Older saves catch up on moves. */
export function parseSave(raw: string | null | undefined): StoryState | null {
  try {
    if (!raw) return null;
    const data = JSON.parse(raw) as StoryState;
    if (data.version !== 1 || !Array.isArray(data.party)) return null;
    mapById(data.map);
    return { ...data, party: data.party.map(catchUp), box: data.box.map(catchUp) };
  } catch {
    return null;
  }
}

/**
 * Reads a trainer's save from this browser, or null if there is none or it can't be read.
 * Saves from before trainer names were kept under one key, so the first name to look finds it.
 */
export function load(storage: Pick<Storage, 'getItem'> | null, name: string): StoryState | null {
  try {
    return parseSave(storage?.getItem(saveKey(name))) ?? parseSave(storage?.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

/** The newer of two saves, either of which may be missing. */
export function newer(a: StoryState | null, b: StoryState | null): StoryState | null {
  if (!a || !b) return a ?? b;
  return (b.savedAt ?? 0) > (a.savedAt ?? 0) ? b : a;
}

/** Saves to this browser under the trainer's name. Returns the JSON written, or null. */
export function save(
  storage: Pick<Storage, 'setItem'> | null,
  s: StoryState,
  name: string,
): string | null {
  try {
    const raw = JSON.stringify({ ...s, savedAt: Date.now() });
    storage?.setItem(saveKey(name), raw);
    return storage ? raw : null;
  } catch {
    return null;
  }
}
