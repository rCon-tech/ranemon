import { MAX_LEVEL } from '../battle/creature';
import type { ItemEffect, Pint } from '../ui/session';
import { statsOf, type Member } from './party';

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
  | 'blue-ghost';

export type ItemUse =
  | { kind: 'pint'; pint: Pint }
  | { kind: 'heal'; effect: ItemEffect }
  /** A Blue Ghost: +1 level, used outside battle only. */
  | { kind: 'level' };

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
    about: 'Raises a Ranemon by exactly 1 level.',
    price: 4800,
    from: 9,
    use: { kind: 'level' },
  },
];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
export const itemById = (id: ItemId): Item => BY_ID.get(id)!;

/** Items a county's corner shop stocks. */
export const shopStock = (county: number) =>
  ITEMS.filter((i) => i.price !== null && i.from <= county);

/** Whether an item would do anything for this member right now. */
export function canUseOn(item: Item, m: Member): boolean {
  if (item.use.kind === 'level') return m.level < MAX_LEVEL;
  if (item.use.kind === 'pint') return false;
  const max = statsOf(m).hp;
  const e = item.use.effect;
  switch (e.kind) {
    case 'heal':
      return m.hp > 0 && m.hp < max;
    case 'restore':
      return m.hp > 0 && (m.hp < max || m.status !== null);
    case 'revive':
      return m.hp === 0;
    case 'cure':
      return m.hp > 0 && m.status === e.status;
  }
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
