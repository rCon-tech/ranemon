import type { Creature } from './creature';

/**
 * Tobymon, the legendary Ranemon: ancient, not seen in years, and maybe only a myth. He is met
 * once, at the end of a quest in Dublin, never in the long grass or in battle mode. A bigger stat
 * budget than an evolved Ranemon (480 against 460), and very hard to befriend.
 *
 * He was 520 (105/80/105/125/105) until players found he swept the post-game on his own: no
 * type hits him for more than normal damage, so the budget is where he's held back. Speed 90
 * lets the quickest evolved Ranemon move first, and Spirit 115 (his attack and his guard for
 * Spirit moves) still tops every evolved Ranemon. One on one with an evolved Ranemon at the
 * same level he wins about 3 times in 4, down from 9 in 10 (`tests/sim/postgame.test.ts`).
 */
export const LEGEND: Creature = {
  id: 'tobymon',
  name: 'Tobymon',
  types: ['brains', 'charm'],
  base: { hp: 100, attack: 80, defense: 95, spirit: 115, speed: 90 },
  moves: ['staff-of-ages', 'galaxy-brain', 'heartbreaker', 'dazzling-smile'],
  entry:
    'An ancient Ranemon in cream robes, with coral beads and a gold-topped staff. Nobody had seen him in years, and most said he was only a myth.',
  colour: '#e8c898',
  sprite: '/sprites/bw/tobymon.png',
};

/** The level he's met at, just above the last gym's ace. */
export const LEGEND_LEVEL = 50;
