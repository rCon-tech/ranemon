import type { Creature } from './creature';

/**
 * Tobymon, the legendary Ranemon: ancient, not seen in years, and maybe only a myth. He is met
 * once, at the end of a quest in Dublin, never in the long grass or in battle mode. A bigger stat
 * budget than an evolved Ranemon (520 against 460), and very hard to befriend.
 */
export const LEGEND: Creature = {
  id: 'tobymon',
  name: 'Tobymon',
  types: ['brains', 'charm'],
  base: { hp: 105, attack: 80, defense: 105, spirit: 125, speed: 105 },
  moves: ['staff-of-ages', 'galaxy-brain', 'heartbreaker', 'dazzling-smile'],
  entry:
    'An ancient Ranemon in cream robes, with coral beads and a gold-topped staff. Nobody had seen him in years, and most said he was only a myth.',
  colour: '#e8c898',
  sprite: '/sprites/bw/tobymon.png',
};

/** The level he's met at, just above the last gym's ace. */
export const LEGEND_LEVEL = 50;
