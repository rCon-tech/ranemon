import type { Creature } from './creature';
import type { Move } from './moves';

/**
 * London's legendary: Harry Kane, home from Munich at Wembley once you're Premier League
 * Champion (`content/story/kane.ts`). Beat him and he comes back to England and joins you.
 * A single stage at a legend's budget, over Tobymon's, and he brings his own Ballon d'Or, so he
 * can Mega evolve into Ballan d'Or with or without a Mega Ring (`mega.ts`). Never wild, never
 * in battle mode or The Sesh; last in the UK Ranedex.
 */
export const KANE_ID = 'kanemon';

export const KANE_MOVES: Move[] = [
  {
    id: 'hurricane',
    signature: KANE_ID,
    name: 'Hurricane',
    flavour: 'Drops deep, turns and smashes it in from thirty yards. Raises Attack by 10%.',
    type: 'brawn',
    category: 'physical',
    power: 100,
    accuracy: 95,
    pp: 10,
    priority: 0,
    specials: [{ kind: 'boost', target: 'self', stat: 'attack', factor: 1.1 }],
  },
];

export const KANEMON: Creature = {
  id: KANE_ID,
  name: 'Kanemon',
  types: ['brawn', 'hype'],
  base: { hp: 105, attack: 125, defense: 95, spirit: 75, speed: 100 },
  moves: ['hurricane', 'main-character-energy', 'double-shift', 'hype-speech'],
  entry:
    'England’s record goalscorer. Left to win a trophy abroad and has a cabinet full of runners-up medals to show for it. Every summer it comes home, and every summer it doesn’t.',
  colour: '#f4f4f0',
  sprite: `/sprites/premier/${KANE_ID}.png`,
};
