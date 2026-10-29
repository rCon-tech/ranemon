import { scaleStats, type BaseStats, type Creature } from './creature';
import { LEGEND } from './legend';
import { LONDON, LONDON_EVOLUTIONS, LONDON_ITEM_EVOLUTIONS } from './london';
import { PETCHEMON } from './petchemon';
import { FOOTBALLER_MON } from './footballers';
import { RANELASS_MON } from './ranelasses';
import { ROSTER } from './roster';

/**
 * Story mode's evolutions: every Ranemon evolves once, into a pun on a Gen 1 or 2 Pokémon.
 * The evolved form keeps its types and moves, and has a bigger stat budget.
 */
export interface Evolution {
  from: string;
  id: string;
  name: string;
  level: number;
  entry: string;
  /** In story mode it only evolves with a Ranemon of this line in the party too. */
  partner?: string;
}

export const EVOLUTION_LEVEL = 30;
export const EVOLVED_BUDGET = 460;

export const EVOLUTIONS: Evolution[] = [
  {
    from: 'carlmon',
    id: 'carlizard',
    name: 'Carlizard',
    entry: 'Flies over the crowd to the bar. The Nozzy Call can be heard from Ennis.',
  },
  {
    from: 'steadmon',
    id: 'steadakazam',
    name: 'Steadakazam',
    entry: 'Has read every page of Ranelads.com, and some that were never written.',
  },
  {
    from: 'enda',
    id: 'clefenda',
    name: 'Clefenda',
    entry: 'Glows on nights out. Nobody has ever left one of his parties early.',
  },
  {
    from: 'oismon',
    id: 'hitmonois',
    name: 'Hitmonois',
    entry: 'Kicks like a mule after a Monster. Still won’t go anywhere without Hitmonollie.',
  },
  {
    from: 'olliemon',
    id: 'hitmonollie',
    name: 'Hitmonollie',
    entry: 'Punches above his weight, and always has a can ready for Hitmonois.',
  },
  {
    from: 'hugomon',
    id: 'hugengar',
    name: 'Hugengar',
    entry: 'Lives in the shadows of the Dark Web. Grins from your phone at 3am.',
  },
  {
    from: 'gibbsmon',
    id: 'gyaragibbs',
    name: 'Gyaragibbs',
    entry: 'No longer calls the army. He is the army.',
  },
  {
    from: 'jammon',
    id: 'jamchamp',
    name: 'Jamchamp',
    entry: 'Four arms, and every one of them out for what he’s owed.',
  },
  {
    from: 'boydemon',
    id: 'primeboyd',
    name: 'Primeboyd',
    entry: 'Wakes up angry and gets angrier. The whole family trained him.',
  },
  {
    from: 'killemon',
    id: 'killigatr',
    name: 'Killigatr',
    entry: 'The dance is now a stomp. The floor of every venue is cracked.',
  },
  {
    from: 'lorcamon',
    id: 'lorchu',
    name: 'Lorchu',
    entry: 'Fully charged and fully buying. His is still the 0% one.',
  },
  {
    from: 'owemon',
    id: 'fearowe',
    name: 'Fearowe',
    entry: 'Circles the pub at altitude, calling in air support for every argument.',
  },
  {
    from: 'conemon',
    id: 'conix',
    name: 'Conix',
    entry: 'Tries so hard for the lads he turned to solid rock. It still costs him.',
  },
  {
    from: 'robinmon',
    id: 'robinsey',
    name: 'Robinsey',
    entry: 'Patches up the whole crew between takes. The fans never stop watching.',
  },
  {
    from: 'simomon',
    id: 'weezimo',
    name: 'Weezimo',
    entry: 'Floats in a haze of his own calm. Nothing reaches him through it.',
  },
  {
    from: 'thilomon',
    id: 'thilotrode',
    name: 'Thilotrode',
    entry: 'Goes back to back so fast he explodes. Then he’s gone.',
  },
  {
    from: 'paulimon',
    id: 'pauliwrath',
    name: 'Pauliwrath',
    entry: 'Put the gloves on over the hat trick. The swirl means he’s not finished.',
  },
  {
    from: 'skehemon',
    id: 'skehdinja',
    name: 'Skehdinja',
    entry: 'So unbothered he floats. A halo, a shell, and still the arms are crossed.',
  },
  {
    from: 'vinnimon',
    id: 'vinnisaur',
    name: 'Vinnisaur',
    entry: 'A flower blooms on his back after the third stein. He toasts it too.',
  },
  {
    from: 'crampemon',
    id: 'crampsb2bthilomon',
    name: 'CrampsB2BThilomon',
    entry:
      'Crampemon and Thilomon, back to back on the decks as one. Nobody leaves till they say so.',
    partner: 'thilomon',
  },
  {
    from: 'nickamon',
    id: 'nickoking',
    name: 'Nickoking',
    entry:
      'Crowned himself King of France in a Lahinch chipper. Still only the second most French man in Ireland.',
  },
].map((e) => ({ ...e, level: EVOLUTION_LEVEL }));

/**
 * Scales a base budget up to `budget` (EVOLVED_BUDGET unless a London stage says otherwise),
 * keeping the shape; the largest stat takes the rounding.
 */
export const evolvedStats = (base: BaseStats, budget = EVOLVED_BUDGET) => scaleStats(base, budget);

const BASE_FORMS = new Map(ROSTER.map((c) => [c.id, c]));

export const EVOLVED: Creature[] = EVOLUTIONS.map((e) => {
  const from = BASE_FORMS.get(e.from);
  if (!from) throw new Error(`Unknown Ranemon: ${e.from}`);
  return {
    ...from,
    id: e.id,
    name: e.name,
    base: evolvedStats(from.base),
    entry: e.entry,
    sprite: `/sprites/evo/${e.id}.png`,
    // An evolved form's glow and costume pieces are see-through, so it stays flat.
    solid: false,
  };
});

/**
 * Evolutions an item sets off instead of a level: a second branch for a Ranemon, alongside the
 * one it reaches by levelling. The evolved form comes from its own photo and swaps the base
 * form's special move for one of its own.
 */
export interface ItemEvolution {
  from: string;
  id: string;
  name: string;
  /** The item's id (`ItemId` in story mode's items). */
  item: string;
  entry: string;
  /** Its own special move, in place of the base form's. */
  signature: string;
}

export const ITEM_EVOLUTIONS: ItemEvolution[] = [
  {
    from: 'killemon',
    id: 'cholokill',
    name: 'Cholokill',
    item: 'flannel-shirt',
    entry: 'Put on the flannel shirt and never took it off. Points at you, then WHABAM.',
    signature: 'whabam',
  },
];

export const ITEM_EVOLVED: Creature[] = ITEM_EVOLUTIONS.map((e) => {
  const from = BASE_FORMS.get(e.from)!;
  return {
    ...from,
    id: e.id,
    name: e.name,
    base: evolvedStats(from.base),
    moves: [e.signature, ...from.moves.slice(1)],
    entry: e.entry,
    // From a photo of its own, in HD, so it stands solid in the 3D look.
    sprite: `/sprites/bw/${e.id}.png`,
    solid: true,
  };
});

/** Every item evolution: the lads' and Wickmon's branches. */
export const ALL_ITEM_EVOLUTIONS: ItemEvolution[] = [...ITEM_EVOLUTIONS, ...LONDON_ITEM_EVOLUTIONS];

/** The item evolution a species can take with an item, if any. */
export const itemEvolutionOf = (species: string, item: string) =>
  ALL_ITEM_EVOLUTIONS.find((e) => e.from === species && e.item === item);

const BY_FROM = new Map([...EVOLUTIONS, ...LONDON_EVOLUTIONS].map((e) => [e.from, e]));
const BY_ID = new Map<string, { from: string; level?: number }>(
  [...EVOLUTIONS, ...LONDON_EVOLUTIONS, ...ALL_ITEM_EVOLUTIONS].map((e) => [e.id, e]),
);

/** The form a species evolved from, or undefined for a line's first form. */
export const previousOf = (species: string) => BY_ID.get(species)?.from;

/** The lowest level a form can be at: the level of the last levelled evolution on its way, or 0. */
export function reachedAt(species: string): number {
  for (let e = BY_ID.get(species); e; e = BY_ID.get(e.from)) if (e.level) return e.level;
  return 0;
}

/** What a species evolves into by levelling, or undefined once it's fully evolved. */
export const evolutionOf = (species: string): Evolution | undefined => BY_FROM.get(species);

/**
 * The first form of a species' line: an evolved form's base form, or the species itself. Walks
 * back more than one step, for the London lines that evolve twice.
 */
export function lineOf(species: string): string {
  let id = species;
  for (let from = BY_ID.get(id)?.from; from; from = BY_ID.get(id)?.from) id = from;
  return id;
}

/** The form a species takes at a level, for trainers' and wild Ranemon: every step it's reached. */
export function formAt(species: string, level: number): string {
  let id = species;
  for (let evo = evolutionOf(id); evo && level >= evo.level; evo = evolutionOf(id)) id = evo.id;
  return id;
}

const FORMS = new Map(
  [
    ...ROSTER,
    ...EVOLVED,
    ...ITEM_EVOLVED,
    PETCHEMON,
    LEGEND,
    ...LONDON,
    ...RANELASS_MON,
    ...FOOTBALLER_MON,
  ].map((c) => [c.id, c]),
);

/** Any Ranemon, base or evolved. */
export function formById(id: string): Creature {
  const c = FORMS.get(id);
  if (!c) throw new Error(`Unknown creature: ${id}`);
  return c;
}

/** `species` at the same stage as `like`: evolved if `like` is. */
export function sameStage(species: string, like: string): string {
  return lineOf(like) === like ? species : (evolutionOf(species)?.id ?? species);
}

/**
 * The Ranedex order: each Ranemon followed by its evolutions, then Petchemon, who B&S give you,
 * and the legend last.
 */
export const DEX: Creature[] = [
  ...ROSTER.flatMap((c) => {
    const evo = evolutionOf(c.id);
    const items = ITEM_EVOLUTIONS.filter((e) => e.from === c.id).map((e) => formById(e.id));
    return [c, ...(evo ? [formById(evo.id)] : []), ...items];
  }),
  PETCHEMON,
  LEGEND,
];
