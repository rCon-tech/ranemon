import { moveById } from './moves';
import type { Stat } from './moves';
import type { RaneType } from './types';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  spirit: number;
  speed: number;
}

export interface Creature {
  id: string;
  name: string;
  types: [RaneType] | [RaneType, RaneType];
  base: BaseStats;
  /** Exactly 4 move ids. */
  moves: string[];
  /** One line for the Ranedex. */
  entry: string;
  /** Path to the pixel sprite cut from the friend's photo. Without one, a blob is drawn. */
  sprite?: string;
  /** Accent colour: the blob's body, and the backdrop behind a sprite in the Ranedex. */
  colour: string;
  /** Stands in the 3D look's battles as a solid figure blown up from its sprite (`Solid`). */
  solid?: boolean;
  /** A second look from another photo (`variants.ts`); the usual look has none. */
  variant?: string;
  /** A rare golden palette, from story mode's wild Ranemon. */
  shiny?: boolean;
}

/** Battle mode's level. Story mode runs from 5 to MAX_LEVEL. */
export const LEVEL = 50;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;
export const STAT_BUDGET = 400;
export const BASE_MIN = 30;
export const BASE_MAX = 130;

/**
 * Stats at a level, by the main-series formula without IVs or EVs. At level 50 that is exactly
 * HP = base + 60 and the rest base + 5, so battle mode's numbers are unchanged.
 */
export function levelStats(base: BaseStats, level: number = LEVEL): BaseStats {
  const stat = (b: number) => Math.floor((2 * b * level) / 100) + 5;
  return {
    hp: Math.floor((2 * base.hp * level) / 100) + level + 10,
    attack: stat(base.attack),
    defense: stat(base.defense),
    spirit: stat(base.spirit),
    speed: stat(base.speed),
  };
}

export const STAT_KEYS: (keyof BaseStats)[] = ['hp', 'attack', 'defense', 'spirit', 'speed'];
export const BATTLE_STATS: Stat[] = ['attack', 'defense', 'spirit', 'speed'];

/** Every rule a creature card must meet. Returns the broken ones; empty means valid. */
export function validateCreature(c: Creature): string[] {
  const problems: string[] = [];
  const total = STAT_KEYS.reduce((sum, k) => sum + c.base[k], 0);
  if (total !== STAT_BUDGET) problems.push(`Base stats add up to ${total}, not ${STAT_BUDGET}`);
  for (const k of STAT_KEYS) {
    if (c.base[k] < BASE_MIN || c.base[k] > BASE_MAX) {
      problems.push(`${k} must be ${BASE_MIN} to ${BASE_MAX}`);
    }
  }
  if (c.types.length === 2 && c.types[0] === c.types[1]) problems.push('Two types must differ');
  if (c.moves.length !== 4) problems.push('Must have exactly 4 moves');
  if (new Set(c.moves).size !== c.moves.length) problems.push('Moves must all differ');
  const moves = c.moves.map(moveById);
  if (!moves.some((m) => m.type !== null && (c.types as RaneType[]).includes(m.type))) {
    problems.push('At least 1 move must match one of its types');
  }
  for (const m of moves) {
    if (m.signature !== undefined && m.signature !== c.id) {
      problems.push(`${m.name} is another Ranemon’s special move`);
    }
  }
  if (moves.filter((m) => m.signature !== undefined).length > 1) {
    problems.push('At most 1 special move');
  }
  if (moves.filter((m) => m.power >= 100).length > 1) {
    problems.push('At most 1 move with Power 100 or more');
  }
  return problems;
}
