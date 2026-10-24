/**
 * UK Ranemon: the same lads, drawn in pixel art instead of cut from their photos. Over in
 * Britain nobody has a photo of them, so every Ranemon there is one of these (the London
 * expansion, docs/london-expansion.md). The art is `scripts/drawn/` output, in
 * `public/sprites/drawn/`. Same name, types, stats and moves: only the picture and the
 * Ranedex line change.
 *
 * It's a look like a variant (`variants.ts`), with the id `uk`, but it's left out of the lists
 * of variants so battle mode, the team select and wild Ranemon at home never pick it.
 */

/** The look's id, as `variant` on a Ranemon. */
export const UK = 'uk';

/** What a Ranemon's UK form says in the Ranedex, by species. Only the base forms are drawn. */
export const UK_ENTRIES: Record<string, string> = {
  carlmon: 'Halfway to a Wetherspoons before the Nozzy Call has finished ringing.',
  steadmon: 'Finally home. Asleep by 8:30pm, and nobody believes he’s British.',
  enda: 'Has made best friends with a beefeater, a pigeon and a man selling the Big Issue.',
  oismon: 'Grows mushrooms on an allotment in Peckham. Pays £14 for a Monster.',
  olliemon:
    'Knows every Premier League score since 1992. Never seen without Oismon, even on the Tube.',
  hugomon:
    'Runs a crypto start-up from a Shoreditch café. Nobody knows what it does, including him.',
  gibbsmon: 'Fought in the Ranemon Civil Wars. Now calls in airstrikes on Arsenal fans.',
  jammon: 'Has fixed the Northern line. Is still demanding a refund for it.',
  boydemon: 'Plays rugby for London Irish. Three knocks to the head this season and counting.',
  killemon: 'Found in Africa, now found in Clapham. Still puts action before decision.',
  lorcamon: 'Gets the rounds in at £8.50 a pint. His is still the 0%.',
  owemon:
    'Came over from the USA for the football. Calls it soccer, which starts a fight every time.',
  conemon: 'Tries far too hard for the lads, now with an accent he picked up in a week.',
  robinmon: 'Spreading a positive message on the Tube, where nobody makes eye contact.',
  simomon: 'Blazing up in Hyde Park. Remarkably chill about the price of everything.',
  thilomon: 'Back to back at a warehouse in Hackney. Gone before the bouncers notice.',
  paulimon: 'Talks to everyone on the bus about rugby players who were too good for England.',
  skehemon: 'Arms crossed, shades on, in a queue. Has seen better queues.',
  vinnimon:
    'Bought a townhouse in Mayfair to make a problem go away. The problem was the townhouse.',
  crampemon:
    'Has a residency in a Peckham car park. Still looking for Thilomon to go back to back with.',
};

/** Whether a species has a UK form: the base form of every one of the lads. */
export const hasUkForm = (species: string) => species in UK_ENTRIES;

/** The drawn front of a species' UK form. */
export const ukSprite = (species: string) => `/sprites/drawn/${species}.png`;
