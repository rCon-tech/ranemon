import type { Creature } from './creature';
import type { Move } from './moves';

/**
 * Petchemon, B&S's own Ranemon. Only B&S have him: he's never wild, never on another trainer's
 * team and never caught, so he isn't in the Ranedex either.
 */
export const PETCHEMON: Creature = {
  id: 'petchemon',
  name: 'Petchemon',
  types: ['brawn', 'hype'],
  base: { hp: 95, attack: 105, defense: 80, spirit: 60, speed: 100 },
  moves: ['when-in-rome', 'gym-bro-punch', 'mosh-pit', 'flex'],
  entry: 'B&S’s own. A white T-shirt, Ray-Bans and a grin. Conquered Rome on a weekend away.',
  colour: '#e05a2a',
  sprite: '/sprites/bw/petchemon.png',
};

/** His own move. */
export const PETCHEMON_MOVES: Move[] = [
  {
    id: 'when-in-rome',
    signature: 'petchemon',
    name: 'When in Rome',
    flavour: 'Does as the Romans do and storms the Colosseum. Raises Speed by 30%.',
    type: 'brawn',
    category: 'physical',
    power: 90,
    accuracy: 100,
    pp: 5,
    priority: 0,
    specials: [{ kind: 'boost', target: 'self', stat: 'speed', factor: 1.3 }],
  },
];
