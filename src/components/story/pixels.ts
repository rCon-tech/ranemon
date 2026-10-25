/**
 * The overworld's shared sizes and colours. The tiles are drawn in tiles.ts, and the people in
 * people.ts.
 */

export const TILE = 16;
/** Outlines, and the overworld's own text and markers. */
export const INK = '#283038';
export const LIGHT = '#ffffff';

/** What each door's building says over it. */
const DOOR_LABEL: Record<string, string> = { P: 'McGRATTANS', M: 'VAPES', G: 'GYM' };

/** In Britain the pub is a W.B Yates and the shop a Vapes & More (content/story/interiors.ts). */
const UK_DOOR_LABEL: Record<string, string> = { P: 'W.B YATES', M: 'VAPES & MORE' };

/** The doors' signs on a map, as `DOOR_LABEL` but with Britain's own pubs and shops. */
export const doorLabels = (map: { uk?: boolean; yates?: unknown }): Record<string, string> => ({
  ...DOOR_LABEL,
  ...(map.uk ? UK_DOOR_LABEL : map.yates ? { P: UK_DOOR_LABEL.P } : {}),
});
