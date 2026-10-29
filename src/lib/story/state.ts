import { mapById, outsideOf } from '@/content/story/maps';
import { breakRun } from '@/content/story/galway';
import { breakRun as breakRowans } from '@/content/story/rowans';
import { LONDON_ONLY } from '@/content/story/kneecap';
import { LONDON_START, LONDON_START_FLAGS, LONDON_START_PUB } from '@/content/story/london';
import type { BattleState } from '../battle/engine';
import { KANE_ID } from '../battle/kane';
import { moveById } from '../battle/moves';
import type { Result } from '../ui/session';
import { sellPrice, type ItemId } from './items';
import {
  afterBattle,
  capLine,
  cappedLine,
  evolutionIn,
  expYield,
  gainExp,
  gainedLine,
  heal,
  learnedOf,
  makeMember,
  PARTY_SIZE,
  nameOf,
  type Member,
} from './party';
import { levelCap } from './levels';
import { SCHEMA } from './save';
import { MEGA_RING } from './keys';
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
  /** Kinds seen in Britain, for the UK Ranedex (`ukdex.ts`). */
  ukSeen?: string[];
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
 * London-only games are kept under keys of their own, so a trainer can have a Dublin save and a
 * London one under the same name, and neither can ever be read as, or write over, the other.
 */
export const LONDON_SAVE_KEY = 'ranemon.london.v1';
export const LONDON_PLAYER_KEY = 'ranemon.london.player';

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
export const saveKey = (name: string, mode: StoryMode = 'dublin') =>
  `${mode === 'london' ? LONDON_SAVE_KEY : SAVE_KEY}:${playerId(name)}`;
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
    // On from the start, so the whole party keeps up with the road without grinding the grass.
    expShare: true,
    schema: SCHEMA,
  };
}

/**
 * SKIP TO RANEMON LONDON: a new game of its own that starts at Stansted with no Ranemon, for
 * players who haven't played Ranemon Dublin. It never meets the Dublin game: its saves are kept
 * apart (`save.ts`), and it carries `LONDON_ONLY` so the London story can tell it apart.
 */
export function newLondonGame(): StoryState {
  const { map, x, y, face } = LONDON_START;
  return {
    ...newGame(),
    map,
    x,
    y,
    face,
    flags: [...LONDON_START_FLAGS, `visited:${map}`],
    pub: { ...LONDON_START_PUB },
  };
}

/** Which game a save is from: Ranemon Dublin (the story from Clare), or a London-only game. */
export type StoryMode = 'dublin' | 'london';
export const modeOf = (s: Pick<StoryState, 'flags'>): StoryMode =>
  s.flags.includes(LONDON_ONLY) ? 'london' : 'dublin';

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

export function take(s: StoryState, item: ItemId, count = 1): StoryState {
  const left = (s.bag[item] ?? 0) - count;
  const bag = { ...s.bag };
  if (left > 0) bag[item] = left;
  else delete bag[item];
  return { ...s, bag };
}

/** Sells some of an item to a shop, for `sellPrice` each. Only as many as you have, and never one of a kind. */
export function sell(s: StoryState, item: ItemId, count: number): StoryState {
  const each = sellPrice(item);
  const n = Math.min(Math.floor(count), s.bag[item] ?? 0);
  if (each === null || n <= 0) return s;
  return { ...take(s, item, n), money: s.money + each * n };
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

/** Marks a kind as seen: in the Ranedex, and in the UK Ranedex too if you're in Britain. */
export function see(s: StoryState, species: string): StoryState {
  const seen = s.seen.includes(species) ? s.seen : [...s.seen, species];
  const uk = s.ukSeen ?? [];
  if (!inBritain(s) || uk.includes(species)) return seen === s.seen ? s : { ...s, seen };
  return { ...s, seen, ukSeen: [...uk, species] };
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

/**
 * Heals everyone. It also ends a run through the Championship in Galway, or through Rowans, which
 * allow no healing.
 */
export function healParty(s: StoryState): StoryState {
  return { ...s, party: s.party.map(heal), flags: breakRowans(breakRun(s.flags)) };
}

/**
 * Whether a member can Mega evolve in your battles: any with a Mega form once you have the Mega
 * Ring, and Harry Kane always, since he brings his own Ballon d'Or.
 */
export const canMega = (s: StoryState, m: Member) => hasFlag(s, MEGA_RING) || m.species === KANE_ID;

export const canFight = (s: StoryState) => s.party.some((m) => m.hp > 0);

/** The member who walks behind you: the first one still standing. */
export const follower = (s: StoryState) => s.party.find((m) => m.hp > 0) ?? null;

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
 * A Ranemon's level-up from a battle, however many levels it went, with every move it learnt on
 * the way: “Carlmon grew to Lv13 and learned Pint Throw!”.
 */
function grewLine(before: Member, after: Member): string {
  const known = learnedOf(before);
  const learnt = learnedOf(after).filter((id) => !known.includes(id));
  const grew = `${nameOf(before)} grew to Lv${after.level}`;
  if (!learnt.length) return `${grew}!`;
  const names = learnt.map((id) => moveById(id).name);
  const benched = learnt.filter((id) => !after.moves.includes(id));
  const swap = benched.length ? ` Swap ${benched.length > 1 ? 'them' : 'it'} in from PARTY.` : '';
  const list = listOf(names);
  // Some moves bring their own “!”, like Fore!
  return `${grew} and learned ${list}${/[!?]$/.test(list) ? '' : '!'}${swap}`;
}

/** Rows a text box shows at once; a longer results box carries on into another. */
export const BOX_ROWS = 6;

/** Rows of a results box, a line each, split into boxes of `BOX_ROWS`. */
function boxesOf(rows: string[]): string[] {
  const boxes: string[] = [];
  for (let i = 0; i < rows.length; i += BOX_ROWS)
    boxes.push(rows.slice(i, i + BOX_ROWS).join('\n'));
  return boxes;
}

/**
 * What a finished battle leaves behind: HP, PP and status copied back, EXP for every foe that
 * fainted, and the catch or the blackout. The Ranemon that fought a foe share its EXP. The rest
 * of the party still standing get nothing, half with The Round, or the same as a fighter with
 * Exp Share on. Nobody grows past the level cap; beating the gym leader who sets it lifts it for
 * that battle's EXP too. It's said in as few boxes as it takes: one results box, starting with
 * `opener` (the prize money) if there is one, then a pair for each evolution.
 */
export function settleBattle(
  s: StoryState,
  battle: BattleState,
  result: Result,
  fought: number[],
  trainer: boolean,
  trainerId?: string,
  opener?: string,
): { state: StoryState; lines: string[] } {
  // The results box: what was won, a row each, then any evolutions and what else is said.
  const summary = opener ? [opener] : [];
  const after: string[] = [];
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
    const evolutions: string[] = [];
    earned.forEach((amount, i) => {
      if (!amount) return;
      const before = party[i];
      const gained = gainedLine(nameOf(before), amount);
      const { member, lines: more } = gainExp(before, amount, party, cap);
      party = party.map((m, j) => (j === i ? member : m));
      if (more[0] === gained) gains.push({ name: nameOf(before), amount });
      if (member.level > before.level) levels.push(grewLine(before, member));
      const atCap = (l: string) => l === capLine(before, cap) || l === capLine(member, cap);
      if (more.some(atCap)) capped.push(nameOf(member));
      evolutions.push(...more.filter((l) => evolutionIn(l)));
    });
    // Everyone's EXP, new levels, new moves and the level cap all go in the one results box;
    // only an evolution, with its scene, gets boxes of its own.
    if (gains.length) summary.push(expLine(gains));
    summary.push(...levels);
    if (capped.length) summary.push(cappedLine(listOf(capped), cap));
    after.push(...evolutions);
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
    if (joined.line) summary.push(joined.line);
  }
  if (result === 'loss' || result === 'draw') {
    const tab = Math.floor(state.money / 2);
    state = { ...healParty(state), money: state.money - tab, ...s.pub, face: 'down' };
    const outside = outsideOf(mapById(s.pub.map));
    const town = outside.name.split(',')[0];
    // In England the pubs are W.B Yates, and in the expansion the tab is in pounds.
    const money = outside.uk ? `£${tab}` : `€${tab}`;
    summary.push(
      'You’re out of Ranemon that can fight!',
      outside.uk || outside.yates
        ? `You come round in W.B Yates, ${town}, with a bar tab of ${money}. Florence Pugh is standing over you with a bowl of stew.`
        : `You come round in McGrattans, ${town}, with a bar tab of ${money}.`,
    );
  }
  return { state, lines: [...boxesOf(summary), ...after] };
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
