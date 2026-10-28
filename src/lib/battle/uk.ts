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

/** What a Ranemon's UK form says in the Ranedex, by species: the lads, then their evolutions. */
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
  nickamon: 'Tells everyone in London he’s French. They believe him, which he finds suspicious.',
  // The evolved forms, drawn with their evolution's pieces grown into the body (scripts/drawn/).
  carlizard: 'Flies over the Thames to the bar. The Nozzy Call can be heard from Croydon.',
  steadakazam: 'Bends spoons on the Victoria line. Still home and asleep by 8:30pm.',
  clefenda: 'Glows over Soho on a night out. Best friends with the whole of Old Compton Street.',
  hitmonois: 'Kicks like a mule after a £3 Monster. Still won’t ride the Tube without Hitmonollie.',
  hitmonollie:
    'Punches above his weight at the Emirates, and always has a can ready for Hitmonois.',
  hugengar: 'Haunts the Shoreditch start-ups after dark. His crypto app is still in beta.',
  gyaragibbs: 'No longer calls in airstrikes on Arsenal fans. He is the airstrike.',
  jamchamp: 'Four arms, and every one of them out for his Northern line refund.',
  primeboyd: 'Six knocks to the head for London Irish and angrier after every one.',
  killigatr: 'Lurks in the Clapham Common ponds. Action first, decision never.',
  cholokill: 'Wore the flannel shirt to a Hackney warehouse and was made head of security. WHABAM.',
  lorchu: 'Lights up the whole pub at £8.50 a pint. His is still the 0%.',
  fearowe: 'Soars over Wembley shouting “soccer”. The fight starts before he lands.',
  conix: 'A rock-hard accent that took a week to pick up and will take years to lose.',
  robinsey: 'Hands out eggs and good news on the Tube. Someone made eye contact once.',
  weezimo: 'A cloud hangs over Hyde Park wherever he floats. Still chill about the prices.',
  thilotrode: 'Charged up in a Hackney warehouse. Goes off before the bouncers can reach him.',
  pauliwrath:
    'Throws punches for every rugby player England ever overlooked. Most of the bus agrees.',
  skehdinja: 'Folds his arms in a queue faster than the eye can see. It’s still a bad queue.',
  vinnisaur: 'A flower grew from the Mayfair townhouse problem. Now it’s the size of Mayfair.',
  crampsb2bthilomon:
    'Back to back in a Peckham car park at last. The residency is sold out until 2030.',
  nickoking: 'Holds court in a Soho brasserie. The waiters call him Your Majesty, ironically.',
};

/** Whether a species has a UK form: every one of the lads, and every form they evolve into. */
export const hasUkForm = (species: string) => species in UK_ENTRIES;

/** The drawn front of a species' UK form. */
export const ukSprite = (species: string) => `/sprites/drawn/${species}.png`;
