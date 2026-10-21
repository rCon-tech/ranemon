import { levelStats, MAX_LEVEL, type BaseStats, type Creature } from '../battle/creature';
import type { Battler, Entrant } from '../battle/engine';
import { EVOLVED, evolutionOf, formAt, lineOf } from '../battle/evolutions';
import { moveById, type Status } from '../battle/moves';
import { LEGEND } from '../battle/legend';
import { POSEIDON } from '../battle/poseidon';
import { ROSTER } from '../battle/roster';
import { variantForm } from '../battle/variants';
import { LEARNSETS, MOVE_SLOTS, SPORT_LEVELS } from './learnsets';
import { SHINY_STAR, shinyForm } from './shiny';

/**
 * Story mode's Ranemon: a species at a level, with the HP, PP and status it carries from one
 * fight to the next. Pure data, so the whole party saves as JSON.
 */
export interface Member {
  /** Unique within a save, so two of the same species can be told apart. */
  uid: number;
  species: string;
  level: number;
  /** Total EXP; the next level is at (level + 1)³. */
  exp: number;
  hp: number;
  /** PP for each of `moves`, in order. */
  pp: number[];
  status: Status | null;
  /** The (up to) 4 moves it fights with. */
  moves: string[];
  /**
   * Every move it has learnt, in the order it learnt them; `moves` are picked from these.
   * Saves from before there were more than 4 have no field, so read it as `moves`.
   */
  learned?: string[];
  /** A shiny: golden, and rare. Saves from before shinies have no field, so read it as false. */
  shiny?: boolean;
  /** Its look, for a Ranemon with more than one (`variants.ts`). None is the usual look. */
  variant?: string;
}

export const PARTY_SIZE = 6;
export const START_LEVEL = 5;

/** B&S, the final boss: a creature made from the group photo, only met at Trinity. */
export const BOSS: Creature = {
  id: 'bns',
  name: 'B&S',
  types: ['chaos', 'hype'],
  base: { hp: 100, attack: 85, defense: 70, spirit: 70, speed: 75 },
  moves: ['last-orders', 'mosh-pit', 'shopping-trolley', 'hype-train'],
  entry: 'Ranemon Champions of Ireland. Seven lads, one photo, no mercy.',
  colour: '#c8288f',
  sprite: '/sprites/bw/bns.png',
};

const SPECIES = new Map([...ROSTER, ...EVOLVED, BOSS, LEGEND, POSEIDON].map((c) => [c.id, c]));

export function speciesById(id: string): Creature {
  const c = SPECIES.get(id);
  if (!c) throw new Error(`Unknown species: ${id}`);
  return c;
}

/** Ranemon that are harder to befriend. Everyone else has the common rate. */
const RARE = ['gibbsmon', 'thilomon', 'oismon', 'olliemon'];
/** Evolved Ranemon are harder again. */
export function catchRate(species: string): number {
  // The legend is as hard as they come: worn down to 1 HP and asleep, a Mulligan's Pint
  // befriends him about 1 time in 7.
  if (species === LEGEND.id) return 9;
  const rate = RARE.includes(lineOf(species)) ? 45 : 120;
  return lineOf(species) === species ? rate : Math.round(rate * 0.6);
}

/** Every Ranemon grows on one curve: reaching level L takes L³ EXP in total. */
export const expAt = (level: number) => level ** 3;

/**
 * The order a Ranemon learns its moves. First its 4 battle-mode moves: its weakest attack and
 * its own special move to start, then the rest at 12 and 20, weakest first. Every Ranemon has
 * its special move from Lv1, so it's itself from the first fight. Then its line's 6 sport moves
 * from LEARNSETS, from Lv8 to Lv50.
 */
export function learnset(c: Creature): { level: number; move: string }[] {
  const plain = c.moves
    .filter((id) => !moveById(id).signature)
    .sort((a, b) => moveById(a).power - moveById(b).power);
  const firstAttack = plain.find((id) => moveById(id).power > 0);
  const order = firstAttack ? [firstAttack, ...plain.filter((id) => id !== firstAttack)] : plain;
  const special = c.moves.filter((id) => moveById(id).signature);
  const [first, ...rest] = order;
  const own = [first, ...special, ...rest]
    .filter(Boolean)
    .map((move, i) => ({ level: [1, 1, 12, 20][i] ?? 20, move }));
  const sport = (LEARNSETS[lineOf(c.id)] ?? []).map((move, i) => ({
    level: SPORT_LEVELS[i],
    move,
  }));
  return [...own, ...sport].sort((a, b) => a.level - b.level);
}

/** Every move a Ranemon has learnt by a level, in the order it learnt them. */
export function movesAt(c: Creature, level: number): string[] {
  return learnset(c)
    .filter((l) => l.level <= level)
    .map((l) => l.move);
}

/**
 * The 4 moves a Ranemon met in the wild or on a trainer's team fights with: its special move,
 * and the latest it has learnt, as in the main series.
 */
export function fightingMoves(learned: string[]): string[] {
  const special = learned.filter((id) => moveById(id).signature);
  const latest = learned
    .filter((id) => !moveById(id).signature)
    .slice(-(MOVE_SLOTS - special.length));
  return learned.filter((id) => special.includes(id) || latest.includes(id));
}

/** Every move a member has learnt, the 4 it fights with included. */
export const learnedOf = (m: Member) => m.learned ?? m.moves;

/** Puts a learnt move into one of the member's 4 slots, with its full PP. */
export function swapMove(m: Member, slot: number, move: string): Member {
  if (!learnedOf(m).includes(move) || m.moves.includes(move)) return m;
  const moves = [...m.moves];
  const pp = [...m.pp];
  moves[slot] = move;
  pp[slot] = moveById(move).pp;
  return { ...m, moves: moves.slice(0, MOVE_SLOTS), pp: pp.slice(0, MOVE_SLOTS) };
}

export function statsOf(m: Member): BaseStats {
  return levelStats(speciesById(m.species).base, m.level);
}

/** A new member at a level; a Ranemon met at or past its evolution level comes evolved. */
export function makeMember(base: string, level: number, uid: number): Member {
  const species = formAt(base, level);
  const learned = movesAt(speciesById(species), level);
  const moves = fightingMoves(learned);
  const member: Member = {
    uid,
    species,
    level,
    exp: expAt(level),
    hp: 0,
    pp: moves.map((id) => moveById(id).pp),
    status: null,
    moves,
    learned,
  };
  return { ...member, hp: statsOf(member).hp };
}

/**
 * Adds any move the member should know by now, for saves from before special moves came at
 * Lv1 or before sport moves. They go into a free slot if there is one, else wait to be swapped in.
 */
export function catchUp(m: Member): Member {
  const known = learnedOf(m);
  const missing = movesAt(speciesById(m.species), m.level).filter((id) => !known.includes(id));
  if (missing.length === 0 && m.learned) return m;
  const add = missing.slice(0, Math.max(0, MOVE_SLOTS - m.moves.length));
  return {
    ...m,
    learned: [...known, ...missing],
    moves: [...m.moves, ...add],
    pp: [...m.pp, ...add.map((id) => moveById(id).pp)],
  };
}

/** The member as the engine sees it: the species with only the moves it knows so far. */
export function creatureOf(m: Member): Creature {
  const c = variantForm({ ...speciesById(m.species), moves: m.moves }, m.variant);
  return m.shiny ? shinyForm(c) : c;
}

/** A member's name as the story's text gives it: shinies wear their star. */
export function nameOf(m: Member): string {
  return `${m.shiny ? SHINY_STAR : ''}${speciesById(m.species).name}`;
}

export function toEntrant(m: Member): Entrant {
  return { creature: creatureOf(m), level: m.level, hp: m.hp, pp: m.pp, status: m.status };
}

/** Copies what a battle did to a member back onto it. */
export function afterBattle(m: Member, b: Battler): Member {
  return { ...m, hp: b.hp, pp: [...b.pp], status: b.status };
}

export const isHealthy = (m: Member) => m.hp > 0;

export function heal(m: Member): Member {
  return {
    ...m,
    hp: statsOf(m).hp,
    status: null,
    pp: m.moves.map((id) => moveById(id).pp),
  };
}

/** EXP for beating a Ranemon, from the main series' formula; trainers' Ranemon give 1.5×. */
export function expYield(foeLevel: number, trainer: boolean): number {
  return Math.floor(((140 * foeLevel) / 7) * (trainer ? 1.5 : 1));
}

/** Goes up one level: more HP, and any move learnt at the new level. */
function levelUp(m: Member, lines: string[]): Member {
  const name = nameOf(m);
  const before = statsOf(m).hp;
  let next: Member = { ...m, level: m.level + 1 };
  const gained = statsOf(next).hp - before;
  next = { ...next, hp: m.hp > 0 ? m.hp + gained : 0 };
  lines.push(`${name} grew to Lv${next.level}!`);
  for (const learnt of learnset(speciesById(m.species))) {
    if (learnt.level !== next.level || learnedOf(next).includes(learnt.move)) continue;
    const move = moveById(learnt.move);
    const learned = [...learnedOf(next), move.id];
    if (next.moves.length < MOVE_SLOTS) {
      next = { ...next, learned, moves: [...next.moves, move.id], pp: [...next.pp, move.pp] };
      lines.push(`${name} learned ${move.name}!`);
    } else {
      next = { ...next, learned };
      lines.push(`${name} learned ${move.name}! Swap it in from PARTY.`);
    }
  }
  const evo = evolutionOf(next.species);
  if (evo && next.level >= evo.level) next = evolve(next, lines);
  return next;
}

/** Turns a member into its evolved form, keeping the HP it has lost. */
function evolve(m: Member, lines: string[]): Member {
  const evo = evolutionOf(m.species)!;
  const name = nameOf(m);
  const before = statsOf(m).hp;
  // A shiny stays shiny, and a look stays the same: everything but the species carries over.
  const next: Member = { ...m, species: evo.id };
  const gained = statsOf(next).hp - before;
  lines.push(`What? ${name} is evolving!`, `${name} evolved into ${nameOf(next)}!`);
  return { ...next, hp: m.hp > 0 ? m.hp + gained : 0 };
}

/** Adds EXP and applies any level-ups. Returns the lines to show. */
export function gainExp(m: Member, amount: number): { member: Member; lines: string[] } {
  if (m.level >= MAX_LEVEL) return { member: m, lines: [] };
  const lines = [`${nameOf(m)} gained ${amount} EXP!`];
  let member: Member = { ...m, exp: m.exp + amount };
  while (member.level < MAX_LEVEL && member.exp >= expAt(member.level + 1)) {
    member = levelUp(member, lines);
  }
  if (member.level >= MAX_LEVEL) member = { ...member, exp: expAt(MAX_LEVEL) };
  return { member, lines };
}

/** A Blue Ghost: exactly one level, with EXP set to the start of it. */
export function blueGhost(m: Member): { member: Member; lines: string[] } {
  if (m.level >= MAX_LEVEL) return { member: m, lines: ['It won’t have any effect.'] };
  const lines: string[] = [];
  const member = levelUp(m, lines);
  return { member: { ...member, exp: expAt(member.level) }, lines };
}

/** How far a member is through its current level, 0 to 1, for the EXP bar. */
export function expProgress(m: Member): number {
  if (m.level >= MAX_LEVEL) return 1;
  const from = expAt(m.level);
  return Math.max(0, Math.min(1, (m.exp - from) / (expAt(m.level + 1) - from)));
}

const BY_NAME = new Map([...SPECIES.values()].map((c) => [c.name, c]));

/**
 * The evolution a line of text announces, for the evolution scene: `done` once it has
 * happened. Null for any other line. A shiny's star in the name shows both forms shiny, and
 * both are in the look of the party member of that line, if there is one.
 */
export function evolutionIn(
  text: string,
  party: Member[] = [],
): { from: Creature; to: Creature; done: boolean } | null {
  const starting = /^What\? (.+) is evolving!$/.exec(text);
  const finished = /^(.+) evolved into (.+)!$/.exec(text);
  const named = (starting ?? finished)?.[1] ?? '';
  const shiny = named.startsWith(SHINY_STAR);
  const base = BY_NAME.get(shiny ? named.slice(SHINY_STAR.length) : named);
  const evo = base && evolutionOf(base.id);
  if (!base || !evo) return null;
  const variant = party.find((m) => m.species === base.id || m.species === evo.id)?.variant;
  const from = variantForm(base, variant);
  const to = variantForm(speciesById(evo.id), variant);
  return shiny
    ? { from: shinyForm(from), to: shinyForm(to), done: !!finished }
    : { from, to, done: !!finished };
}
