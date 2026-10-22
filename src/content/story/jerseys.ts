/**
 * The nine county jerseys on the Trainer Card, in each county's GAA colours. A won jersey is
 * drawn in its colours; one not won yet is a grey silhouette.
 */

/** How the jersey's second colour sits on the body. */
export type JerseyPattern =
  | 'plain' // body colour only, with trim at the collar and cuffs
  | 'hoop' // one band across the chest
  | 'stripes' // hoops all the way down
  | 'tricolour'; // three bands, top to bottom: body, band, trim

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

export function jerseyOf(county: string): JerseyKit {
  const kit = JERSEYS[county];
  if (!kit) throw new Error(`No jersey for ${county}`);
  return kit;
}

/** The coloured bands of a jersey 14 tall, as [top, height, colour], drawn over the body. */
export function bandsOf(kit: JerseyKit): [number, number, string][] {
  switch (kit.pattern) {
    case 'plain':
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
