import type { Creature } from './creature';
import type { Move } from './moves';

/**
 * The Ranelasses' own Ranemon: one each, made from her, drawn with the body kit
 * (`scripts/drawn/bosses.py`, art in `art/bosses/`). They're only ever met on the Ranelasses'
 * teams at Rowans: never wild, never in battle mode and never in either Ranedex, so nothing gives
 * them away before you get there. A single stage each, at an evolved form's budget (460), with a
 * special move of its own.
 */
export const RANELASS_MOVES: Move[] = [
  {
    id: 'sangria-jug',
    signature: 'vivemon',
    name: 'Sangria Jug',
    flavour:
      'Pours a round for itself from the jug. Heals a third of its HP and raises Spirit by 20%.',
    type: 'chill',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 5,
    priority: 0,
    effect: { kind: 'heal', fraction: 1 / 3 },
    specials: [{ kind: 'boost', target: 'self', stat: 'spirit', factor: 1.2 }],
  },
  {
    id: 'mega-pouch',
    signature: 'megamon',
    name: 'Mega Pouch',
    flavour: 'Bursts a festival drinks pouch over the foe. Raises Attack and Spirit by 10%.',
    type: 'hype',
    category: 'spirit',
    power: 80,
    accuracy: 95,
    pp: 10,
    priority: 0,
    specials: [
      { kind: 'boost', target: 'self', stat: 'attack', factor: 1.1 },
      { kind: 'boost', target: 'self', stat: 'spirit', factor: 1.1 },
    ],
  },
  {
    id: 'scooter-by',
    signature: 'anniemon',
    name: 'Scooter By',
    flavour: 'Pulls up on a red Vespa and is gone before the bill. Always goes first.',
    type: 'posh',
    category: 'physical',
    power: 60,
    accuracy: 100,
    pp: 15,
    priority: 1,
  },
  {
    id: 'spritz-o-clock',
    signature: 'esmeon',
    name: 'Spritz O’Clock',
    flavour: 'It’s five o’clock somewhere. May Fluster the target.',
    type: 'charm',
    category: 'spirit',
    power: 90,
    accuracy: 95,
    pp: 10,
    priority: 0,
    effect: { kind: 'status', status: 'flustered', chance: 0.3 },
  },
  {
    id: 'golden-pint',
    signature: 'anamon',
    name: 'Golden Pint',
    flavour: 'Raises a pint to the sun. Heals a quarter of its HP and raises Speed by 30%.',
    type: 'hype',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 5,
    priority: 0,
    effect: { kind: 'heal', fraction: 0.25 },
    specials: [{ kind: 'boost', target: 'self', stat: 'speed', factor: 1.3 }],
  },
  {
    id: 'bedside-manner',
    signature: 'batoolmon',
    name: 'Bedside Manner',
    flavour:
      'Tells the foe to rest and lie back. Heals half its HP and cuts the foe’s Defense by 20%.',
    type: 'brains',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 5,
    priority: 0,
    effect: { kind: 'heal', fraction: 0.5 },
    specials: [{ kind: 'boost', target: 'foe', stat: 'defense', factor: 0.8 }],
  },
  {
    id: 'prescription',
    signature: 'bhavemon',
    name: 'Prescription',
    flavour: 'Writes the foe a prescription. It falls asleep.',
    type: 'chill',
    category: 'status',
    power: 0,
    accuracy: 75,
    pp: 10,
    priority: 0,
    effect: { kind: 'status', status: 'asleep', chance: 1 },
  },
  {
    id: 'walkies',
    signature: 'sibealmon',
    name: 'Walkies',
    flavour: 'Norm runs rings round the foe on his lead. Hits 2 to 5 times.',
    type: 'charm',
    category: 'physical',
    power: 25,
    accuracy: 95,
    pp: 10,
    priority: 0,
    effect: { kind: 'multiHit', min: 2, max: 5 },
  },
];

const stats = (hp: number, attack: number, defense: number, spirit: number, speed: number) => ({
  hp,
  attack,
  defense,
  spirit,
  speed,
});

const ranelass = (c: Omit<Creature, 'sprite'>): Creature => ({
  ...c,
  sprite: `/sprites/rowans/${c.id}.png`,
});

export const RANELASS_MON: Creature[] = [
  ranelass({
    id: 'vivemon',
    name: 'Vivemon',
    types: ['chill', 'charm'],
    base: stats(95, 70, 85, 120, 90),
    moves: ['sangria-jug', 'cold-shoulder', 'dazzling-smile', 'power-nap'],
    entry:
      'Found only where there is sun, a sea view and a jug on the table. It has been on holiday for three years and calls it a couple of days away.',
    colour: '#c8303a',
  }),
  ranelass({
    id: 'megamon',
    name: 'Megamon',
    types: ['hype', 'charm'],
    base: stats(90, 95, 75, 95, 105),
    moves: ['mega-pouch', 'group-chat-spam', 'charm-offensive', 'hype-speech'],
    entry:
      'Comes out at the first sign of sun in a London park. The stone round its neck is a drinks pouch it has never once finished.',
    colour: '#cdc0c4',
  }),
  ranelass({
    id: 'anniemon',
    name: 'Anniemon',
    types: ['posh', 'chill'],
    base: stats(85, 80, 90, 100, 105),
    moves: ['scooter-by', 'members-only', 'cold-shoulder', 'look-down-your-nose'],
    entry:
      'Only ever seen at the good table. Rides a little red scooter between garden parties and has never once spilled its red.',
    colour: '#c8d09a',
  }),
  ranelass({
    id: 'esmeon',
    name: 'Esmeon',
    types: ['charm', 'hype'],
    base: stats(90, 75, 80, 110, 105),
    moves: ['spritz-o-clock', 'dazzling-smile', 'compliment-barrage', 'hype-speech'],
    entry:
      'Evolved by the sea at golden hour. It wears its wrap like a tail, and its smile can be seen from the next terrace.',
    colour: '#c8d630',
  }),
  ranelass({
    id: 'anamon',
    name: 'Anamon',
    types: ['hype', 'chill'],
    base: stats(100, 90, 80, 90, 100),
    moves: ['golden-pint', 'mosh-pit', 'slow-clap', 'unbothered'],
    entry:
      'Comes out when the sun does and is gone by the first cloud. It has never lost a drop of its pint on the grass.',
    colour: '#c8783a',
  }),
  ranelass({
    id: 'batoolmon',
    name: 'Batoolmon',
    types: ['brains', 'charm'],
    base: stats(100, 70, 90, 115, 85),
    moves: ['bedside-manner', 'well-actually', 'dazzling-smile', 'lullaby-playlist'],
    entry:
      'Has delivered more Ranemon than anyone in London. Graduated top of its year, and still turned up to the ceremony on time.',
    colour: '#5a86c8',
  }),
  ranelass({
    id: 'bhavemon',
    name: 'Bhavemon',
    types: ['chill', 'brains'],
    base: stats(95, 70, 80, 120, 95),
    moves: ['prescription', 'cold-shoulder', 'well-actually', 'unbothered'],
    entry:
      'Swore it hated Ranemon until it lost to one. Carries a prescription pad and an oat latte that never goes cold.',
    colour: '#7a1c2c',
  }),
  ranelass({
    id: 'sibealmon',
    name: 'Sibealmon',
    types: ['charm', 'graft'],
    base: stats(95, 90, 85, 85, 105),
    moves: ['walkies', 'overtime', 'dazzling-smile', 'puppy-eyes'],
    entry:
      'Never seen without its border collie. Will walk you round the whole of Dublin in the rain and say it was a lovely day for it.',
    colour: '#c83a3a',
  }),
];
