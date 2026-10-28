import { formAt, ITEM_EVOLVED, lineOf } from '../battle/evolutions';
import { Rng } from '../battle/rng';
import { ROSTER } from '../battle/roster';
import { hasUkForm, UK } from '../battle/uk';
import { rollVariant } from '../battle/variants';
import type { ItemId } from '../story/items';
import { makeMember, PARTY_SIZE, type Member } from '../story/party';

/** Quick Sesh's party starts here, and its foes are fixed by stage from Lv46 to 65. */
export const SESH_LEVEL = 50;

/**
 * Every Ranemon The Sesh deals, to you or to a foe: only the ones made from photos, the 20 lads
 * in the form they have at Lv50, and Cholokill, Killemon's other branch. London's own and the
 * Sidemen's are never dealt (the Sidemen bring theirs as bosses), and nor are the legends.
 */
export const SESH_POOL: string[] = [
  ...ROSTER.map((c) => formAt(c.id, SESH_LEVEL)),
  ...ITEM_EVOLVED.map((c) => c.id),
];

/**
 * What each member of a party is dealt to hold: anything can hold the Friendship Bracelet or
 * Xanax, and Conix gets the Vegan Stone, which only does anything for his line.
 */
function heldFor(species: string, rng: Rng): ItemId {
  if (lineOf(species) === 'conemon') return 'vegan-stone';
  return rng.chance(0.5) ? 'friendship-bracelet' : 'xanax';
}

/**
 * A look for a dealt Ranemon: its drawn UK look, one of its second looks from another photo, or
 * its usual one. Only the picture changes.
 */
export function lookFor(species: string, rng: Rng): string | undefined {
  const roll = rng.next();
  if (hasUkForm(species) && roll < 1 / 3) return UK;
  return rollVariant(species, rng.next());
}

/** Deals `count` Ranemon from the pool, no line twice, leaving out any lines in `taken`. */
export function deal(rng: Rng, count: number, taken: string[] = []): string[] {
  const pool = SESH_POOL.filter((id) => !taken.includes(lineOf(id)));
  const out: string[] = [];
  while (out.length < count && pool.length) {
    const [id] = pool.splice(rng.int(0, pool.length - 1), 1);
    // Killigatr and Cholokill are the same line: only one of them.
    for (let i = pool.length - 1; i >= 0; i--)
      if (lineOf(pool[i]) === lineOf(id)) pool.splice(i, 1);
    out.push(id);
  }
  return out;
}

/**
 * Quick Sesh's party: 6 strong Ranemon at Lv50 from the seed, in random looks, each holding an
 * item. Each knows the moves it would by Lv50 in story mode.
 */
export function seshParty(seed: number): Member[] {
  const rng = new Rng(seed);
  return deal(rng, PARTY_SIZE).map((species, i) => {
    const look = lookFor(species, rng);
    const m = makeMember(species, SESH_LEVEL, i + 1, look === UK ? UK : undefined);
    return { ...m, ...(look && look !== UK && { variant: look }), held: heldFor(species, rng) };
  });
}
