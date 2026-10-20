import { levelStats, MAX_LEVEL, type BaseStats, type Creature } from '../battle/creature';
import type { Battler, Entrant } from '../battle/engine';
import { moveById, type Status } from '../battle/moves';
import { ROSTER } from '../battle/roster';

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
  moves: string[];
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
  colour: '#306230',
  sprite: '/sprites/gb/bns.png',
};

const SPECIES = new Map([...ROSTER, BOSS].map((c) => [c.id, c]));

export function speciesById(id: string): Creature {
  const c = SPECIES.get(id);
  if (!c) throw new Error(`Unknown species: ${id}`);
  return c;
}

/** Ranemon that are harder to befriend. Everyone else has the common rate. */
const RARE = ['gibbsmon', 'thilomon', 'oismon', 'olliemon'];
export const catchRate = (species: string) => (RARE.includes(species) ? 45 : 120);

/** Every Ranemon grows on one curve: reaching level L takes L³ EXP in total. */
export const expAt = (level: number) => level ** 3;

/**
 * The order a Ranemon learns its 4 battle-mode moves: two to start, the third at 12, and its
 * special move at 20.
 */
export function learnset(c: Creature): { level: number; move: string }[] {
  const plain = c.moves.filter((id) => !moveById(id).signature);
  const special = c.moves.filter((id) => moveById(id).signature);
  return [...plain, ...special].map((move, i) => ({ level: [1, 1, 12, 20][i] ?? 20, move }));
}

export function movesAt(c: Creature, level: number): string[] {
  return learnset(c)
    .filter((l) => l.level <= level)
    .map((l) => l.move);
}

export function statsOf(m: Member): BaseStats {
  return levelStats(speciesById(m.species).base, m.level);
}

export function makeMember(species: string, level: number, uid: number): Member {
  const moves = movesAt(speciesById(species), level);
  const member: Member = {
    uid,
    species,
    level,
    exp: expAt(level),
    hp: 0,
    pp: moves.map((id) => moveById(id).pp),
    status: null,
    moves,
  };
  return { ...member, hp: statsOf(member).hp };
}

/** The member as the engine sees it: the species with only the moves it knows so far. */
export function creatureOf(m: Member): Creature {
  return { ...speciesById(m.species), moves: m.moves };
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
  const name = speciesById(m.species).name;
  const before = statsOf(m).hp;
  let next: Member = { ...m, level: m.level + 1 };
  const gained = statsOf(next).hp - before;
  next = { ...next, hp: m.hp > 0 ? m.hp + gained : 0 };
  lines.push(`${name} grew to Lv${next.level}!`);
  for (const learnt of learnset(speciesById(m.species))) {
    if (learnt.level !== next.level || next.moves.includes(learnt.move)) continue;
    const move = moveById(learnt.move);
    next = { ...next, moves: [...next.moves, move.id], pp: [...next.pp, move.pp] };
    lines.push(
      move.signature
        ? `${name} unlocked its special move, ${move.name}!`
        : `${name} learned ${move.name}!`,
    );
  }
  return next;
}

/** Adds EXP and applies any level-ups. Returns the lines to show. */
export function gainExp(m: Member, amount: number): { member: Member; lines: string[] } {
  if (m.level >= MAX_LEVEL) return { member: m, lines: [] };
  const lines = [`${speciesById(m.species).name} gained ${amount} EXP!`];
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
