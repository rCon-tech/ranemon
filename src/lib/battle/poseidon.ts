import type { Creature } from './creature';
import type { Move } from './moves';

/**
 * Poseidon, god of the sea, out on the rocks at Bundoran. Only someone who has taken Josh Lee's
 * tablet can see him. A boss like B&S: fought once, as the last of his own team, never caught.
 */
export const POSEIDON: Creature = {
  id: 'poseidon',
  name: 'Poseidon',
  types: ['chill', 'brawn'],
  base: { hp: 115, attack: 115, defense: 95, spirit: 100, speed: 80 },
  moves: ['trident', 'avalanche-of-vibes', 'slam-dunk', 'unbothered'],
  entry:
    'God of the sea, earthquakes and the Atlantic swell. Surfs Bundoran when nobody is looking.',
  colour: '#2a8ad0',
  sprite: '/sprites/bw/poseidon.png',
};

/** His own move. */
export const POSEIDON_MOVES: Move[] = [
  {
    id: 'trident',
    signature: 'poseidon',
    name: 'Trident',
    flavour: 'Drives the trident down and the whole Atlantic follows it in. Raises Attack by 30%.',
    type: 'brawn',
    category: 'physical',
    power: 100,
    accuracy: 95,
    pp: 5,
    priority: 0,
    specials: [{ kind: 'boost', target: 'self', stat: 'attack', factor: 1.3 }],
  },
];
