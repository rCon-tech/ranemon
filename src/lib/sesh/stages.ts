import type { SongId } from '../sound/songs';

/**
 * The Sesh (docs/sesh.md): a roguelike night out. Quick Sesh plays the last three stages of the
 * night, The Pub, The Nightclub and The Afterparty, each a short branching map of node picks on
 * one 2D screen and then a boss. Every stage reuses one of the game's 2D places for its look,
 * and foe levels are fixed by the stage, never by your party.
 */

export type StageId = 'pub' | 'club' | 'after';

export interface Stage {
  id: StageId;
  /** As the night calls it: The Pub. */
  name: string;
  /** The place from the main game it's set in. */
  place: string;
  /** The battlefield for its fights and its boss. */
  scene: 'field' | 'city' | 'gym' | 'night';
  /** What plays on its map. */
  music: SongId;
  /**
   * The levels of its ordinary fights, low and high: the first pick is at the low end and the
   * last at the high end.
   */
  fights: [number, number];
  /** Its boss's level, and how many Ranemon the boss brings. */
  boss: { level: number; team: number };
  /** Its Bouncers' level and team size. Bouncers are Hard. */
  bouncer: { level: number; team: number };
  /** Said as you arrive. */
  intro: string;
}

export const QUICK_STAGES: Stage[] = [
  {
    id: 'pub',
    name: 'The Pub',
    place: 'McGrattans',
    scene: 'city',
    music: 'pub',
    fights: [46, 50],
    boss: { level: 52, team: 3 },
    bouncer: { level: 50, team: 3 },
    intro: 'McGrattans is heaving. Someone’s after a battle at every table.',
  },
  {
    id: 'club',
    name: 'The Nightclub',
    place: 'The Rave Cave',
    scene: 'night',
    music: 'techno',
    fights: [52, 56],
    boss: { level: 58, team: 4 },
    bouncer: { level: 56, team: 3 },
    intro: 'Down the lane to the Rave Cave. The bass is coming up through the pavement.',
  },
  {
    id: 'after',
    name: 'The Afterparty',
    place: 'Silicon Docks',
    scene: 'city',
    music: 'city',
    fights: [58, 62],
    boss: { level: 65, team: 5 },
    bouncer: { level: 62, team: 3 },
    intro: 'Someone knows someone with a penthouse on Grand Canal Dock. The night isn’t over.',
  },
];

/** Node picks in a stage before its boss. */
export const PICKS = 3;

/** The level of an ordinary fight at a pick (0 to PICKS - 1), rising through the stage. */
export function fightLevel(stage: Stage, row: number): number {
  const [low, high] = stage.fights;
  return Math.round(low + ((high - low) * row) / Math.max(1, PICKS - 1));
}
