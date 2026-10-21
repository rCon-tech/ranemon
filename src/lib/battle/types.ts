/** Ranemon types are personalities, not elements, so they fit real people. */
export const TYPES = ['brains', 'brawn', 'chaos', 'chill', 'charm', 'hype'] as const;
export type RaneType = (typeof TYPES)[number];

export const TYPE_LABEL: Record<RaneType, string> = {
  brains: 'Brains',
  brawn: 'Brawn',
  chaos: 'Chaos',
  chill: 'Chill',
  charm: 'Charm',
  hype: 'Hype',
};

/** One colour per type, used on badges, move buttons and the type chart. */
export const TYPE_COLOR: Record<RaneType, string> = {
  brains: '#7b4fd6',
  brawn: '#e0592a',
  chaos: '#c8288f',
  chill: '#4fb3e8',
  charm: '#f07aae',
  hype: '#f2c418',
};

/**
 * Attacker type -> defender types it hits for 2x. Every type is strong against exactly 2
 * and resisted by exactly 2 (the 0.5x entries in RESISTED_BY), so no type is the obvious pick.
 */
const STRONG: Record<RaneType, RaneType[]> = {
  brains: ['brawn', 'chill'],
  brawn: ['chaos', 'charm'],
  chaos: ['chill', 'hype'],
  chill: ['charm', 'brains'],
  charm: ['hype', 'brawn'],
  hype: ['brains', 'chaos'],
};

/** Attacker type -> defender types that take 0.5x from it. */
const WEAK: Record<RaneType, RaneType[]> = {
  brains: ['brains', 'hype'],
  brawn: ['brains', 'brawn'],
  chaos: ['brawn', 'chaos'],
  chill: ['chaos', 'chill'],
  charm: ['chill', 'charm'],
  hype: ['charm', 'hype'],
};

/** Multiplier for one attacking type into one defending type: 2, 1 or 0.5. */
export function typeMultiplier(attack: RaneType, defend: RaneType): number {
  if (STRONG[attack].includes(defend)) return 2;
  if (WEAK[attack].includes(defend)) return 0.5;
  return 1;
}

/** A dual-type defender multiplies both values, so the result is 4, 2, 1, 0.5 or 0.25. */
export function effectiveness(attack: RaneType | null, defender: readonly RaneType[]): number {
  if (attack === null) return 1;
  return defender.reduce((m, t) => m * typeMultiplier(attack, t), 1);
}

export interface Matchup {
  /** The damage multiplier: 4, 2, 1, 0.5 or 0.25. */
  multiplier: number;
  /** Short, for a move button: SUPER ×2, NORMAL, WEAK ×½. */
  short: string;
  /** In words, for the move's details. */
  label: string;
  tone: 'super' | 'normal' | 'weak';
}

/** How well a move's type does against a defender, ready to show before it's used. */
export function matchup(attack: RaneType | null, defender: readonly RaneType[]): Matchup {
  const multiplier = effectiveness(attack, defender);
  if (multiplier >= 4)
    return { multiplier, short: 'SUPER ×4', label: 'Extremely effective', tone: 'super' };
  if (multiplier >= 2)
    return { multiplier, short: 'SUPER ×2', label: 'Super effective', tone: 'super' };
  if (multiplier > 0.5)
    return { multiplier, short: 'NORMAL', label: 'Normal damage', tone: 'normal' };
  if (multiplier > 0.25)
    return { multiplier, short: 'WEAK ×½', label: 'Not very effective', tone: 'weak' };
  return { multiplier, short: 'WEAK ×¼', label: 'Barely effective', tone: 'weak' };
}
