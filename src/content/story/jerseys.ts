import type { ClubId } from '@/lib/story/world';

/**
 * The jerseys on the Trainer Card: the nine county jerseys in each county's GAA colours, and the
 * twelve Premier League jerseys won in Britain in each club's home colours. A won jersey is drawn
 * in its colours; one not won yet is a grey silhouette.
 */

/** How the jersey's second colour sits on the body. */
export type JerseyPattern =
  | 'plain' // body colour only, with trim at the collar and cuffs
  | 'hoop' // one band across the chest
  | 'stripes' // hoops all the way down
  | 'tricolour' // three bands, top to bottom: body, band, trim
  | 'vstripes' // stripes from the collar to the hem
  | 'sleeves'; // body colour, with the sleeves in the band colour

export interface JerseyKit {
  body: string;
  band: string;
  trim: string;
  pattern: JerseyPattern;
}

export const JERSEYS: Record<string, JerseyKit> = {
  // Saffron and blue.
  clare: { body: '#f6c21c', band: '#1f4f9e', trim: '#1f4f9e', pattern: 'hoop' },
  // Green and white.
  limerick: { body: '#11804a', band: '#ffffff', trim: '#ffffff', pattern: 'plain' },
  // Blue and gold, the gold hoop across the chest.
  tipperary: { body: '#1d3f92', band: '#f6c21c', trim: '#f6c21c', pattern: 'hoop' },
  // The Cats: black and amber stripes.
  kilkenny: { body: '#f2a900', band: '#16181c', trim: '#16181c', pattern: 'stripes' },
  // Blue with a white hoop.
  laois: { body: '#2457b0', band: '#ffffff', trim: '#ffffff', pattern: 'hoop' },
  // Green, white and gold.
  offaly: { body: '#11804a', band: '#ffffff', trim: '#f6c21c', pattern: 'tricolour' },
  // Maroon with a white hoop.
  westmeath: { body: '#7d1f2e', band: '#ffffff', trim: '#ffffff', pattern: 'hoop' },
  // Green and gold.
  meath: { body: '#11804a', band: '#f6c21c', trim: '#f6c21c', pattern: 'plain' },
  // The Lilywhites.
  kildare: { body: '#ffffff', band: '#ffffff', trim: '#ffffff', pattern: 'plain' },
};

/** The Premier League jerseys, in each club's home colours. The crest goes on the chest. */
export const CLUB_JERSEYS: Record<ClubId, JerseyKit> = {
  // Blue and white stripes.
  brighton: { body: '#ffffff', band: '#0057b8', trim: '#0057b8', pattern: 'vstripes' },
  // Red and blue stripes.
  palace: { body: '#1b458f', band: '#c4122e', trim: '#c4122e', pattern: 'vstripes' },
  // Claret with sky blue sleeves.
  villa: { body: '#670e36', band: '#95bfe5', trim: '#95bfe5', pattern: 'sleeves' },
  // Royal blue.
  everton: { body: '#003399', band: '#ffffff', trim: '#ffffff', pattern: 'plain' },
  // All white, blue and yellow at the collar.
  leeds: { body: '#ffffff', band: '#ffcd00', trim: '#1d428a', pattern: 'plain' },
  // The Magpies: black and white stripes.
  newcastle: { body: '#ffffff', band: '#241f20', trim: '#241f20', pattern: 'vstripes' },
  // White, navy at the collar.
  spurs: { body: '#ffffff', band: '#132257', trim: '#132257', pattern: 'plain' },
  // Sky blue.
  city: { body: '#6cabdd', band: '#ffffff', trim: '#ffffff', pattern: 'plain' },
  // Chelsea blue.
  chelsea: { body: '#034694', band: '#ffffff', trim: '#ffffff', pattern: 'plain' },
  // Red with white sleeves.
  arsenal: { body: '#ef0107', band: '#ffffff', trim: '#ffffff', pattern: 'sleeves' },
  // Red, white at the collar.
  liverpool: { body: '#c8102e', band: '#ffffff', trim: '#ffffff', pattern: 'plain' },
  // Red, black at the collar.
  united: { body: '#da291c', band: '#16181c', trim: '#16181c', pattern: 'plain' },
};

/** What each club is called under its jersey on the Trainer Card. */
export const CLUB_SHORT: Record<ClubId, string> = {
  brighton: 'Brighton',
  palace: 'Palace',
  villa: 'Villa',
  everton: 'Everton',
  leeds: 'Leeds',
  newcastle: 'Newcastle',
  spurs: 'Spurs',
  city: 'Man City',
  chelsea: 'Chelsea',
  arsenal: 'Arsenal',
  liverpool: 'Liverpool',
  united: 'Man Utd',
};

export function clubJerseyOf(club: ClubId): JerseyKit {
  const kit = CLUB_JERSEYS[club];
  if (!kit) throw new Error(`No jersey for ${club}`);
  return kit;
}

export function jerseyOf(county: string): JerseyKit {
  const kit = JERSEYS[county];
  if (!kit) throw new Error(`No jersey for ${county}`);
  return kit;
}

/** The coloured bands of a jersey 14 tall, as [top, height, colour], drawn over the body. */
export function bandsOf(kit: JerseyKit): [number, number, string][] {
  switch (kit.pattern) {
    case 'plain':
    case 'vstripes':
    case 'sleeves':
      return [];
    case 'hoop':
      return [[5, 3, kit.band]];
    case 'stripes':
      return [
        [2, 2, kit.band],
        [6, 2, kit.band],
        [10, 2, kit.band],
      ];
    case 'tricolour':
      return [
        [5, 4, kit.band],
        [9, 5, kit.trim],
      ];
  }
}

/** The upright stripes of a jersey 16 wide, as [left, width, colour], drawn over the body. */
export function columnsOf(kit: JerseyKit): [number, number, string][] {
  switch (kit.pattern) {
    case 'vstripes':
      return [
        [2, 2, kit.band],
        [6, 2, kit.band],
        [10, 2, kit.band],
        [14, 2, kit.band],
      ];
    case 'sleeves':
      return [
        [0, 4, kit.band],
        [12, 4, kit.band],
      ];
    default:
      return [];
  }
}
