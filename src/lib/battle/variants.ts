import type { Creature } from './creature';

/**
 * Variants: a second look for a Ranemon, from another photo. It's the same Ranemon with the same
 * name, types, stats and moves; only the picture changes. Each form of a line lists the same
 * variant ids, so a variant keeps its look when it evolves.
 */
export interface Variant {
  id: string;
  /** What the team select and the Ranedex call it. */
  label: string;
  sprite: string;
  /** Stands as a solid figure in the 3D look's battles (see `Creature.solid`). */
  solid?: boolean;
}

/** The look every Ranemon has, for pickers that list the looks side by side. */
export const CLASSIC = 'Classic';

const TRICOLOUR = 'tricolour';
const CAP = 'cap';
const WINE = 'wine';
const TACHE = 'tache';
const CURLS = 'curls';
const RUGBY = 'rugby';
const SUIT = 'suit';
const RACES = 'races';
const SHADES = 'shades';
const THUMBS = 'thumbs';

export const VARIANTS: Record<string, Variant[]> = {
  // Olliemon in a green shirt with a tricolour pin, at twice the detail of the other sprites.
  olliemon: [
    {
      id: TRICOLOUR,
      label: 'Tricolour',
      sprite: '/sprites/bw/olliemon-tricolour.png',
      solid: true,
    },
  ],
  hitmonollie: [
    { id: TRICOLOUR, label: 'Tricolour', sprite: '/sprites/evo/hitmonollie-tricolour.png' },
  ],
  // Oismon in an orange cap and a band T-shirt, also in HD.
  oismon: [{ id: CAP, label: 'Orange Cap', sprite: '/sprites/bw/oismon-cap.png', solid: true }],
  hitmonois: [{ id: CAP, label: 'Orange Cap', sprite: '/sprites/evo/hitmonois-cap.png' }],
  // Endamon raising a glass of red, also in HD.
  enda: [{ id: WINE, label: 'Red Wine', sprite: '/sprites/bw/enda-wine.png', solid: true }],
  clefenda: [{ id: WINE, label: 'Red Wine', sprite: '/sprites/evo/clefenda-wine.png' }],
  // Carlmon with a moustache and a silver chain, also in HD.
  carlmon: [
    { id: TACHE, label: 'Moustache', sprite: '/sprites/bw/carlmon-tache.png', solid: true },
  ],
  carlizard: [{ id: TACHE, label: 'Moustache', sprite: '/sprites/evo/carlizard-tache.png' }],
  // Conemon with his curls and a white shirt, also in HD.
  conemon: [{ id: CURLS, label: 'Curls', sprite: '/sprites/bw/conemon-curls.png', solid: true }],
  conix: [{ id: CURLS, label: 'Curls', sprite: '/sprites/evo/conix-curls.png' }],
  // Boydemon in a rugby kit with the ball, also in HD.
  boydemon: [{ id: RUGBY, label: 'Rugby', sprite: '/sprites/bw/boydemon-rugby.png', solid: true }],
  primeboyd: [{ id: RUGBY, label: 'Rugby', sprite: '/sprites/evo/primeboyd-rugby.png' }],
  // Steadmon in a cream wedding suit and a bow tie, also in HD.
  steadmon: [
    { id: SUIT, label: 'Wedding Suit', sprite: '/sprites/bw/steadmon-suit.png', solid: true },
  ],
  steadakazam: [{ id: SUIT, label: 'Wedding Suit', sprite: '/sprites/evo/steadakazam-suit.png' }],
  // Gibbsmon at the races in a flat cap, shades and a check scarf, also in HD.
  gibbsmon: [{ id: RACES, label: 'Races', sprite: '/sprites/bw/gibbsmon-races.png', solid: true }],
  gyaragibbs: [{ id: RACES, label: 'Races', sprite: '/sprites/evo/gyaragibbs-races.png' }],
  // Jammon in shades with a backpack, also in HD.
  jammon: [{ id: SHADES, label: 'Shades', sprite: '/sprites/bw/jammon-shades.png', solid: true }],
  jamchamp: [{ id: SHADES, label: 'Shades', sprite: '/sprites/evo/jamchamp-shades.png' }],
  // Killemon giving a thumbs up in a white linen shirt, also in HD.
  killemon: [
    { id: THUMBS, label: 'Thumbs Up', sprite: '/sprites/bw/killemon-thumbs.png', solid: true },
  ],
  killigatr: [{ id: THUMBS, label: 'Thumbs Up', sprite: '/sprites/evo/killigatr-thumbs.png' }],
};

export const variantsOf = (species: string): Variant[] => VARIANTS[species] ?? [];

/** A species' variant by id, or undefined for its usual look or a variant it doesn't have. */
export const variantOf = (species: string, id: string | undefined) =>
  id === undefined ? undefined : variantsOf(species).find((v) => v.id === id);

/**
 * A creature in a variant's look. An unknown variant (one a later update took out, say) leaves
 * it in its usual look.
 */
export function variantForm(c: Creature, id: string | undefined): Creature {
  const v = variantOf(c.id, id);
  if (!v) return c;
  return { ...c, variant: v.id, sprite: v.sprite, solid: v.solid ?? false };
}

/**
 * The look a wild Ranemon has, from a random number in [0, 1): its usual look and each variant
 * are equally likely. Undefined is the usual look.
 */
export function rollVariant(species: string, random: number): string | undefined {
  const looks = [undefined, ...variantsOf(species).map((v) => v.id)];
  return looks[Math.min(looks.length - 1, Math.floor(random * looks.length))];
}
