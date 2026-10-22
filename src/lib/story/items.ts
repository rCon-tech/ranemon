import { MAX_LEVEL } from '../battle/creature';
import { itemEvolutionOf, lineOf } from '../battle/evolutions';
import { MAX_STAGE } from '../battle/engine';
import type { Stat, Status } from '../battle/moves';
import type { ItemEffect, Pint } from '../ui/session';
import { statsOf, type Member } from './party';
import type { Stall } from './world';

export type ItemId =
  | 'pint'
  | 'settled-pint'
  | 'mulligans'
  | 'perfect-pour'
  | 'chicken-fillet-roll'
  | 'spice-bag'
  | 'full-irish'
  | 'cup-of-tea'
  | 'curry-chips'
  | 'monster'
  | 'hair-of-the-dog'
  | 'blue-ghost'
  | 'watermelon-ice'
  | 'blue-razz'
  | 'cherry-cola'
  | 'mango-tango'
  | 'flannel-shirt'
  | 'vegan-stone'
  | 'friendship-bracelet';

export type ItemUse =
  | { kind: 'pint'; pint: Pint }
  | { kind: 'heal'; effect: Exclude<ItemEffect, { kind: 'boost' }> }
  /** A Blue Ghost: +1 level, used outside battle only. */
  | { kind: 'level' }
  /** A vape: raises a stat of the Ranemon that's out, in battle only, until the battle ends. */
  | { kind: 'vape'; effect: Extract<ItemEffect, { kind: 'boost' }> }
  /** Sets off an item evolution (`ITEM_EVOLUTIONS`), outside battle only. */
  | { kind: 'evolve' }
  /**
   * Given to a Ranemon to hold, outside battle: one of `line` only, or any Ranemon if there's no
   * line. While it holds it, a stat is multiplied in every battle. Taken back from PARTY.
   */
  | { kind: 'hold'; line?: string; stat: Stat; factor: number };

export interface Item {
  id: ItemId;
  name: string;
  about: string;
  /** Euro, or null when it can't be bought. */
  price: number | null;
  /** The first county (route index) whose shop sells it. */
  from: number;
  use: ItemUse;
}

export const ITEMS: Item[] = [
  {
    id: 'pint',
    name: 'Pint of Guinness',
    about: 'Throw it at a wild Ranemon. Finish it in 3 sips and it joins you.',
    price: 200,
    from: 0,
    use: { kind: 'pint', pint: { name: 'Pint of Guinness', multiplier: 1 } },
  },
  {
    id: 'settled-pint',
    name: 'Well-Settled Pint',
    about: 'Left to settle properly. Befriends 1.5× as well.',
    price: 600,
    from: 2,
    use: { kind: 'pint', pint: { name: 'Well-Settled Pint', multiplier: 1.5 } },
  },
  {
    id: 'mulligans',
    name: 'Mulligan’s Pint',
    about: 'The best pint in Dublin, they say. Befriends 2× as well.',
    price: 1200,
    from: 6,
    use: { kind: 'pint', pint: { name: 'Mulligan’s Pint', multiplier: 2 } },
  },
  {
    id: 'perfect-pour',
    name: 'The Perfect Pour',
    about: 'Poured at St James’s Gate. No Ranemon can say no.',
    price: null,
    from: 99,
    use: { kind: 'pint', pint: { name: 'Perfect Pour', multiplier: Infinity } },
  },
  {
    id: 'chicken-fillet-roll',
    name: 'Chicken Fillet Roll',
    about: 'Restores 30 HP.',
    price: 300,
    from: 0,
    use: { kind: 'heal', effect: { kind: 'heal', amount: 30 } },
  },
  {
    id: 'spice-bag',
    name: 'Spice Bag',
    about: 'Restores 80 HP.',
    price: 700,
    from: 3,
    use: { kind: 'heal', effect: { kind: 'heal', amount: 80 } },
  },
  {
    id: 'full-irish',
    name: 'Full Irish',
    about: 'Full HP and cures any status.',
    price: 2500,
    from: 7,
    use: { kind: 'heal', effect: { kind: 'restore' } },
  },
  {
    id: 'cup-of-tea',
    name: 'Cup of Tea',
    about: 'Cures Flustered.',
    price: 150,
    from: 0,
    use: { kind: 'heal', effect: { kind: 'cure', status: 'flustered' } },
  },
  {
    id: 'curry-chips',
    name: 'Curry Chips',
    about: 'Cures Hangry.',
    price: 150,
    from: 0,
    use: { kind: 'heal', effect: { kind: 'cure', status: 'hangry' } },
  },
  {
    id: 'monster',
    name: 'Can of Monster',
    about: 'Wakes a Ranemon up.',
    price: 200,
    from: 0,
    use: { kind: 'heal', effect: { kind: 'cure', status: 'asleep' } },
  },
  {
    id: 'hair-of-the-dog',
    name: 'Hair of the Dog',
    about: 'Revives a fainted Ranemon at half HP.',
    price: 1500,
    from: 4,
    use: { kind: 'heal', effect: { kind: 'revive', fraction: 0.5 } },
  },
  {
    id: 'blue-ghost',
    name: 'Blue Ghost',
    about: 'Take one, get yipped, and go up exactly 1 level.',
    price: 4800,
    from: 9,
    use: { kind: 'level' },
  },
  // Vapes, from the Vapes shop: one stat up a stage in battle, for the Ranemon that's out.
  {
    id: 'watermelon-ice',
    name: 'Watermelon Ice',
    about: 'Ice cold. Raises DEFENSE in battle. Nothing gets to it now.',
    price: 500,
    from: 1,
    use: { kind: 'vape', effect: { kind: 'boost', stat: 'defense', stages: 1 } },
  },
  {
    id: 'blue-razz',
    name: 'Blue Razz',
    about: 'Pure sugar and noise. Raises SPEED in battle.',
    price: 500,
    from: 1,
    use: { kind: 'vape', effect: { kind: 'boost', stat: 'speed', stages: 1 } },
  },
  {
    id: 'cherry-cola',
    name: 'Cherry Cola',
    about: 'Fizzing for a fight. Raises ATTACK in battle.',
    price: 500,
    from: 1,
    use: { kind: 'vape', effect: { kind: 'boost', stat: 'attack', stages: 1 } },
  },
  {
    id: 'mango-tango',
    name: 'Mango Tango',
    about: 'Smells like a summer in Salthill. Raises SPIRIT in battle.',
    price: 500,
    from: 1,
    use: { kind: 'vape', effect: { kind: 'boost', stat: 'spirit', stages: 1 } },
  },
  {
    id: 'flannel-shirt',
    name: 'Flannel Shirt',
    about: 'A big check flannel, sleeves rolled. Give it to a Killemon and see what happens.',
    price: 3000,
    from: 3,
    use: { kind: 'evolve' },
  },
  {
    id: 'vegan-stone',
    name: 'Vegan Stone',
    about:
      'A smooth green stone from the Happy Pear Twins. Give it to Conemon or Conix to hold: Attack up 20% in every battle.',
    price: null,
    from: 99,
    use: { kind: 'hold', line: 'conemon', stat: 'attack', factor: 1.2 },
  },
  {
    id: 'friendship-bracelet',
    name: 'Friendship Bracelet',
    about:
      'A friendship bracelet Enda made on the ferry to Brighton, for his best friends. Give it to any Ranemon to hold: Defense up 20% in every battle.',
    price: null,
    from: 99,
    use: { kind: 'hold', stat: 'defense', factor: 1.2 },
  },
];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
export const itemById = (id: ItemId): Item => BY_ID.get(id)!;

/** Items a county's corner shop stocks. */
export const shopStock = (county: number) =>
  ITEMS.filter((i) => i.price !== null && i.from <= county);

/** What an item costs: at someone's stall, their price; otherwise the shop's, if it sells it. */
export function priceOf(id: ItemId, stall?: Stall | null): number {
  if (stall) return stall.stock.find((s) => s.item === id)?.price ?? Infinity;
  return itemById(id).price ?? Infinity;
}

/** What an item needs to know about a Ranemon, in or out of battle. */
export interface Target {
  hp: number;
  maxHp: number;
  status: Status | null;
  level: number;
  /** In battle: whether it's the one out, and its stat stages. Vapes need both. */
  active?: boolean;
  stages?: Record<Stat, number>;
  /** Out of battle: its species, for items that set off an evolution. */
  species?: string;
}

/** Whether an item would do anything for this Ranemon right now. */
export function canUse(use: ItemUse, t: Target, item?: ItemId): boolean {
  if (use.kind === 'level') return t.level < MAX_LEVEL;
  if (use.kind === 'evolve') return !!item && !!t.species && !!itemEvolutionOf(t.species, item);
  if (use.kind === 'hold') return !!t.species && (!use.line || lineOf(t.species) === use.line);
  if (use.kind === 'pint') return false;
  if (use.kind === 'vape')
    return !!t.active && !!t.stages && t.hp > 0 && t.stages[use.effect.stat] < MAX_STAGE;
  const e = use.effect;
  switch (e.kind) {
    case 'heal':
      return t.hp > 0 && t.hp < t.maxHp;
    case 'restore':
      return t.hp > 0 && (t.hp < t.maxHp || t.status !== null);
    case 'revive':
      return t.hp === 0;
    case 'cure':
      return t.hp > 0 && t.status === e.status;
  }
}

export const canUseOn = (item: Item, m: Member) =>
  canUse(
    item.use,
    { hp: m.hp, maxHp: statsOf(m).hp, status: m.status, level: m.level, species: m.species },
    item.id,
  );

/** What a member's held item does in battle: its stat multipliers, if it's of the right line (or any). */
export function heldBoost(m: Member): Partial<Record<Stat, number>> | undefined {
  const use = m.held && BY_ID.get(m.held)?.use;
  if (!use || use.kind !== 'hold' || (use.line && lineOf(m.species) !== use.line)) return undefined;
  return { [use.stat]: use.factor };
}

/** Applies a healing item outside battle. */
export function applyItem(item: Item, m: Member): Member {
  if (item.use.kind !== 'heal') return m;
  const max = statsOf(m).hp;
  const e = item.use.effect;
  switch (e.kind) {
    case 'heal':
      return { ...m, hp: Math.min(max, m.hp + e.amount) };
    case 'restore':
      return { ...m, hp: max, status: null };
    case 'revive':
      return { ...m, hp: Math.max(1, Math.floor(max * e.fraction)) };
    case 'cure':
      return { ...m, status: null };
  }
}
