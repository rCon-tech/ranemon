import { mapById, outsideOf } from '@/content/story/maps';
import { breakRun } from '@/content/story/galway';
import type { BattleState } from '../battle/engine';
import type { Result } from '../ui/session';
import type { ItemId } from './items';
import {
  afterBattle,
  capLine,
  cappedLine,
  expYield,
  gainExp,
  gainedLine,
  heal,
  makeMember,
  PARTY_SIZE,
  nameOf,
  type Member,
} from './party';
import { levelCap } from './levels';
import { SCHEMA } from './save';
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
  /**
   * Kinds befriended in Britain. The pint by a wild Ranemon's name starts fresh over the sea,
   * so there it counts only these; `caught` (the Ranedex) still has everything.
   */
  ukCaught?: string[];
  /** Where you wake up after a blackout: the last pub you visited. */
  pub: { map: string; x: number; y: number };
  /** The next member uid. */
  uid: number;
  starter?: string;
  /** The UK Ranemon Próvaí gave you in London (`docs/london-expansion.md`). */
  ukStarter?: string;
  /**
   * The party and Group Chat on the other side of the Irish Sea: Ranemon can't cross the border,
   * so whichever lot you aren't with waits here (`crossBorder`).
   */
  away?: { party: Member[]; box: Member[] };
  steps: number;
  /** `steps` when the dog walking with you last found something (`lib/story/norm.ts`). */
  foundAt?: number;
  /** Exp Share: every Ranemon in the party gets the EXP, not only the ones that fought. */
  expShare?: boolean;
  /** When it was last saved, to pick the newer of a browser save and an online one. */
  savedAt?: number;
  /** Which shape the save is in (`save.ts` converts older ones). Saves from before it are 1. */
  schema?: number;
  /** Ranemon an update could no longer read, kept so a later fix can bring them back. */
  stray?: unknown[];
  /** Skins unlocked (`content/story/skins.ts`), and the one you're wearing, if not the usual. */
  skins?: string[];
  skin?: string;
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
    skins: [],
    schema: SCHEMA,
  };
}

export const hasFlag = (s: StoryState, flag: string) => s.flags.includes(flag);

export function setFlag(s: StoryState, flag: string): StoryState {
  return hasFlag(s, flag) ? s : { ...s, flags: [...s.flags, flag] };
}

export const beatFlag = (trainer: string) => `beat:${trainer}`;

export function unsetFlag(s: StoryState, flag: string): StoryState {
  return hasFlag(s, flag) ? { ...s, flags: s.flags.filter((f) => f !== flag) } : s;
}

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

/** Gives a member an item to hold, handing back whatever it held before. */
export function holdItem(s: StoryState, member: number, item: ItemId): StoryState {
  const m = s.party[member];
  let next = take(s, item);
  if (m.held) next = give(next, m.held);
  return { ...next, party: next.party.map((x, i) => (i === member ? { ...x, held: item } : x)) };
}

/** Takes a member's held item back into the bag. */
export function takeHeld(s: StoryState, member: number): StoryState {
  const m = s.party[member];
  if (!m?.held) return s;
  const { held, ...rest } = m;
  const next = give(s, held);
  return { ...next, party: next.party.map((x, i) => (i === member ? rest : x)) };
}

export function see(s: StoryState, species: string): StoryState {
  return s.seen.includes(species) ? s : { ...s, seen: [...s.seen, species] };
}

/** Whether you're in Britain, outdoors or in somewhere there. */
export const inBritain = (s: StoryState) => !!outsideOf(mapById(s.map)).uk;

/**
 * Whether a wild Ranemon's kind has been befriended before, for the pint by its name in battle.
 * In Britain only the ones befriended there count.
 */
export function caughtBefore(s: StoryState, species: string): boolean {
  return (inBritain(s) ? (s.ukCaught ?? []) : s.caught).includes(species);
}

/** Marks a kind as befriended: in the Ranedex, and for the pint in Britain if you're there. */
export function befriend(s: StoryState, species: string): StoryState {
  const caught = s.caught.includes(species) ? s.caught : [...s.caught, species];
  const uk = s.ukCaught ?? [];
  if (!inBritain(s) || uk.includes(species)) return { ...s, caught };
  return { ...s, caught, ukCaught: [...uk, species] };
}

/** Adds a new friend to the party, or to the Group Chat when the party is full. */
export function recruit(
  s: StoryState,
  species: string,
  level: number,
  from?: Partial<Member>,
): { state: StoryState; line: string | null } {
  // A UK Ranemon stays the way it's drawn: it isn't made up evolved, whatever its level.
  const member: Member = {
    ...makeMember(species, level, s.uid, from?.variant),
    ...from,
    uid: s.uid,
  };
  const next = { ...befriend(see(s, member.species), member.species), uid: s.uid + 1 };
  if (s.party.length < PARTY_SIZE) {
    return { state: { ...next, party: [...s.party, member] }, line: null };
  }
  return {
    state: { ...next, box: [...s.box, member] },
    line: `Your party is full, so ${nameOf(member)} joined the Group Chat.`,
  };
}

/** Heals everyone. It also ends a run through the Championship in Galway, which allows no healing. */
export function healParty(s: StoryState): StoryState {
  return { ...s, party: s.party.map(heal), flags: breakRun(s.flags) };
}

export const canFight = (s: StoryState) => s.party.some((m) => m.hp > 0);

/** The member who walks behind you: the first one still standing. */
export const follower = (s: StoryState) => s.party.find((m) => m.hp > 0) ?? null;

const GREW = / grew to Lv\d+!$/;

/** Names as a list: “Carlmon, Enda and Jammon”. */
const listOf = (names: string[]) =>
  names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** Everyone's EXP from a battle in one line, grouping those who got the same. */
export function expLine(gains: { name: string; amount: number }[]): string {
  const amounts = [...new Set(gains.map((g) => g.amount))];
  return amounts
    .map((amount) => {
      const names = gains.filter((g) => g.amount === amount).map((g) => g.name);
      if (names.length === 1) return gainedLine(names[0], amount);
      return `${listOf(names)} gained ${amount} EXP each!`;
    })
    .join(' ');
}

/**
 * What a finished battle leaves behind: HP, PP and status copied back, EXP for every foe that
 * fainted, and the catch or the blackout. The Ranemon that fought a foe share its EXP. The rest
 * of the party still standing get nothing, half with The Round, or the same as a fighter with
 * Exp Share on. Nobody grows past the level cap; beating the gym leader who sets it lifts it for
 * that battle's EXP too.
 */
export function settleBattle(
  s: StoryState,
  battle: BattleState,
  result: Result,
  fought: number[],
  trainer: boolean,
  trainerId?: string,
): { state: StoryState; lines: string[] } {
  const lines: string[] = [];
  const cap = levelCap(result === 'win' && trainerId ? setFlag(s, beatFlag(trainerId)) : s);
  let party = s.party.map((m, i) => afterBattle(m, battle.teams[0].battlers[i]));

  if (result === 'win' || result === 'caught') {
    // What each member earns from every foe that fainted, added up so it's said once.
    const earned = party.map(() => 0);
    const foes = battle.teams[1].battlers.filter((b) => b.hp === 0 && !b.left);
    for (const foe of foes) {
      const total = expYield(foe.level, trainer);
      const fighters = fought.filter((i) => i < party.length && party[i].hp > 0);
      const each = Math.max(1, Math.floor(total / Math.max(1, fighters.length)));
      for (const i of fighters) earned[i] += each;
      const bench = s.expShare
        ? each
        : hasFlag(s, 'round')
          ? Math.max(1, Math.floor(total / 2))
          : 0;
      if (bench) {
        party.forEach((m, i) => {
          if (!fighters.includes(i) && m.hp > 0) earned[i] += bench;
        });
      }
    }
    const gains: { name: string; amount: number }[] = [];
    const levels: string[] = [];
    const capped: string[] = [];
    const rest: string[] = [];
    earned.forEach((amount, i) => {
      if (!amount) return;
      const before = party[i];
      const gained = gainedLine(nameOf(before), amount);
      const { member, lines: more } = gainExp(before, amount, party, cap);
      party = party.map((m, j) => (j === i ? member : m));
      if (more[0] === gained) gains.push({ name: nameOf(before), amount });
      // Only the level it ends on, however many it went up.
      const grew = more.filter((l) => GREW.test(l));
      if (grew.length) levels.push(grew[grew.length - 1]);
      const atCap = (l: string) => l === capLine(before, cap) || l === capLine(member, cap);
      if (more.some(atCap)) capped.push(nameOf(member));
      rest.push(...more.filter((l) => l !== gained && !GREW.test(l) && !atCap(l)));
    });
    // One box for everyone's EXP, one for everyone's new level and one for everyone at the
    // level cap; what they learnt and their evolutions still get a box each.
    if (gains.length) lines.push(expLine(gains));
    if (levels.length) lines.push(levels.join(' '));
    lines.push(...rest);
    if (capped.length) lines.push(cappedLine(listOf(capped), cap));
  }

  let state: StoryState = { ...s, party };
  if (result === 'caught') {
    const foe = battle.teams[1].battlers[battle.teams[1].active];
    const joined = recruit(state, foe.creature.id, foe.level, {
      hp: foe.hp,
      status: foe.status,
      ...(foe.creature.shiny ? { shiny: true } : {}),
      ...(foe.creature.variant ? { variant: foe.creature.variant } : {}),
    });
    state = joined.state;
    if (joined.line) lines.push(joined.line);
  }
  if (result === 'loss' || result === 'draw') {
    const tab = Math.floor(state.money / 2);
    state = { ...healParty(state), money: state.money - tab, ...s.pub, face: 'down' };
    const outside = outsideOf(mapById(s.pub.map));
    const town = outside.name.split(',')[0];
    // In England the pubs are W.B Yates, and in the expansion the tab is in pounds.
    const money = outside.uk ? `£${tab}` : `€${tab}`;
    lines.push(
      'You’re out of Ranemon that can fight!',
      outside.uk || outside.yates
        ? `You come round in W.B Yates, ${town}, with a bar tab of ${money}. Liam Neeson is standing over you. He says nothing.`
        : `You come round in McGrattans, ${town}, with a bar tab of ${money}.`,
    );
  }
  return { state, lines };
}

/**
 * Over the border: the party and Group Chat you have stay behind, and the ones that were waiting
 * on the far side (none, the first time over) are yours again. A blackout wakes you at `pub`.
 */
export function crossBorder(s: StoryState, pub: StoryState['pub']): StoryState {
  const back = s.away ?? { party: [], box: [] };
  return { ...s, party: back.party, box: back.box, away: { party: s.party, box: s.box }, pub };
}

/**
 * The Good Saturday Agreement: the Ranemon waiting over the sea join you for good. They lead,
 * so your old follower runs straight back to you; whoever doesn't fit in the party goes to the
 * Group Chat.
 */
export function reunite(s: StoryState): StoryState {
  if (!s.away) return s;
  const all = [...s.away.party, ...s.party];
  return {
    ...s,
    party: all.slice(0, PARTY_SIZE),
    box: [...all.slice(PARTY_SIZE), ...s.away.box, ...s.box],
    away: undefined,
  };
}

export const toggleExpShare = (s: StoryState): StoryState => ({ ...s, expShare: !s.expShare });

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

export { load, parseSave, save } from './save';

/** The newer of two saves, either of which may be missing. */
export function newer(a: StoryState | null, b: StoryState | null): StoryState | null {
  if (!a || !b) return a ?? b;
  return (b.savedAt ?? 0) > (a.savedAt ?? 0) ? b : a;
}
