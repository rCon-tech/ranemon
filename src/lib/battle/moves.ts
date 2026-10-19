import type { RaneType } from './types';

export type Category = 'physical' | 'spirit' | 'status';
export type Status = 'flustered' | 'hangry' | 'asleep';
export type Stat = 'attack' | 'defense' | 'spirit' | 'speed';

export type MoveEffect =
  /** A chance to give the target a status. */
  | { kind: 'status'; status: Status; chance: number }
  /** A chance to raise or lower a stat of the user or the target by some stages. */
  | { kind: 'stat'; target: 'self' | 'foe'; stat: Stat; stages: number; chance: number }
  /** The user takes this fraction of the damage it dealt. */
  | { kind: 'recoil'; fraction: number }
  /** The user heals this fraction of its max HP. */
  | { kind: 'heal'; fraction: number }
  /** The move hits between min and max times. */
  | { kind: 'multiHit'; min: number; max: number };

/** What a friend's special move does beyond (or instead of) damage. */
export type SpecialEffect =
  /** Multiplies a stat of the user or the target, e.g. 1.5 for +50%. Lasts until it switches out. */
  | { kind: 'boost'; target: 'self' | 'foe'; stat: Stat; factor: number }
  /** The user loses this fraction of its max HP. */
  | { kind: 'self-damage'; fraction: number }
  /** The user and the target swap HP, each capped at its own max. */
  | { kind: 'swap-hp' }
  /**
   * The user tags out for its partner, who comes in at full HP with Attack multiplied by
   * attackFactor. Fails if the partner isn't on the bench and able to fight.
   */
  | { kind: 'tag-partner'; partner: string; partnerName: string; attackFactor: number }
  /** Uses one of the user's other damaging moves at random, then switches out. */
  | { kind: 'hit-and-run' };

export interface Move {
  id: string;
  name: string;
  flavour: string;
  /** null only for Flail, the move used when every move is out of PP. */
  type: RaneType | null;
  category: Category;
  /** 0 for status moves. */
  power: number;
  /** Percent, or null for a move that never misses. */
  accuracy: number | null;
  pp: number;
  priority: -1 | 0 | 1;
  effect?: MoveEffect;
  /** Only on special moves: the one creature that knows it. */
  signature?: string;
  specials?: SpecialEffect[];
}

/**
 * The shared move list: 6 per type, made of 3 damaging moves, 1 priority or utility move and
 * 2 status or stat moves. Moves are plain data, so rebalancing one never touches the engine.
 */
export const MOVES: Move[] = [
  // Brains
  {
    id: 'galaxy-brain',
    name: 'Galaxy Brain',
    flavour: 'A thought so big it hurts.',
    type: 'brains',
    category: 'spirit',
    power: 110,
    accuracy: 85,
    pp: 5,
    priority: 0,
  },
  {
    id: 'well-actually',
    name: 'Well, Actually',
    flavour: 'Corrects the target mid-sentence.',
    type: 'brains',
    category: 'spirit',
    power: 65,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'flustered', chance: 0.2 },
  },
  {
    id: 'calculated-hit',
    name: 'Calculated Hit',
    flavour: 'Worked out the angles first.',
    type: 'brains',
    category: 'physical',
    power: 70,
    accuracy: 100,
    pp: 15,
    priority: 0,
  },
  {
    id: 'quick-fact',
    name: 'Quick Fact',
    flavour: 'Gets it in before anyone else can talk.',
    type: 'brains',
    category: 'spirit',
    power: 40,
    accuracy: 100,
    pp: 20,
    priority: 1,
  },
  {
    id: 'overthink',
    name: 'Overthink',
    flavour: 'Raises Spirit.',
    type: 'brains',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    effect: { kind: 'stat', target: 'self', stat: 'spirit', stages: 1, chance: 1 },
  },
  {
    id: 'long-lecture',
    name: 'Long Lecture',
    flavour: 'Talks until the target falls asleep.',
    type: 'brains',
    category: 'status',
    power: 0,
    accuracy: 70,
    pp: 10,
    priority: 0,
    effect: { kind: 'status', status: 'asleep', chance: 1 },
  },

  // Brawn
  {
    id: 'slam-dunk',
    name: 'Slam Dunk',
    flavour: 'Hurts the user a bit too.',
    type: 'brawn',
    category: 'physical',
    power: 120,
    accuracy: 90,
    pp: 5,
    priority: 0,
    effect: { kind: 'recoil', fraction: 0.25 },
  },
  {
    id: 'gym-bro-punch',
    name: 'Gym Bro Punch',
    flavour: 'Never skips arm day.',
    type: 'brawn',
    category: 'physical',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
  },
  {
    id: 'headlock',
    name: 'Headlock',
    flavour: 'May lower the target’s Speed.',
    type: 'brawn',
    category: 'physical',
    power: 65,
    accuracy: 100,
    pp: 20,
    priority: 0,
    effect: { kind: 'stat', target: 'foe', stat: 'speed', stages: -1, chance: 0.3 },
  },
  {
    id: 'shoulder-barge',
    name: 'Shoulder Barge',
    flavour: 'Always goes first.',
    type: 'brawn',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 20,
    priority: 1,
  },
  {
    id: 'flex',
    name: 'Flex',
    flavour: 'Sharply raises Attack.',
    type: 'brawn',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    effect: { kind: 'stat', target: 'self', stat: 'attack', stages: 2, chance: 1 },
  },
  {
    id: 'steal-their-chips',
    name: 'Steal Their Chips',
    flavour: 'Leaves the target Hangry.',
    type: 'brawn',
    category: 'status',
    power: 0,
    accuracy: 90,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'hangry', chance: 1 },
  },

  // Chaos
  {
    id: 'total-meltdown',
    name: 'Total Meltdown',
    flavour: 'Wild, and often misses.',
    type: 'chaos',
    category: 'spirit',
    power: 120,
    accuracy: 75,
    pp: 5,
    priority: 0,
  },
  {
    id: 'shopping-trolley',
    name: 'Shopping Trolley',
    flavour: 'One wonky wheel, full speed.',
    type: 'chaos',
    category: 'physical',
    power: 80,
    accuracy: 90,
    pp: 10,
    priority: 0,
  },
  {
    id: 'prank-call',
    name: 'Prank Call',
    flavour: 'May leave the target Flustered.',
    type: 'chaos',
    category: 'spirit',
    power: 60,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'flustered', chance: 0.3 },
  },
  {
    id: 'cheap-shot',
    name: 'Cheap Shot',
    flavour: 'Always goes first.',
    type: 'chaos',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 20,
    priority: 1,
  },
  {
    id: 'stir-the-pot',
    name: 'Stir the Pot',
    flavour: 'Leaves the target Flustered.',
    type: 'chaos',
    category: 'status',
    power: 0,
    accuracy: 75,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'flustered', chance: 1 },
  },
  {
    id: 'sugar-rush',
    name: 'Sugar Rush',
    flavour: 'Sharply raises Speed.',
    type: 'chaos',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    effect: { kind: 'stat', target: 'self', stat: 'speed', stages: 2, chance: 1 },
  },

  // Chill
  {
    id: 'avalanche-of-vibes',
    name: 'Avalanche of Vibes',
    flavour: 'Calm, then all at once.',
    type: 'chill',
    category: 'spirit',
    power: 100,
    accuracy: 95,
    pp: 5,
    priority: 0,
  },
  {
    id: 'cold-shoulder',
    name: 'Cold Shoulder',
    flavour: 'May lower the target’s Spirit.',
    type: 'chill',
    category: 'spirit',
    power: 75,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: { kind: 'stat', target: 'foe', stat: 'spirit', stages: -1, chance: 0.3 },
  },
  {
    id: 'slow-clap',
    name: 'Slow Clap',
    flavour: 'Every clap lands.',
    type: 'chill',
    category: 'physical',
    power: 65,
    accuracy: null,
    pp: 20,
    priority: 0,
  },
  {
    id: 'power-nap',
    name: 'Power Nap',
    flavour: 'Restores half of max HP.',
    type: 'chill',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    effect: { kind: 'heal', fraction: 0.5 },
  },
  {
    id: 'unbothered',
    name: 'Unbothered',
    flavour: 'Sharply raises Defense.',
    type: 'chill',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    effect: { kind: 'stat', target: 'self', stat: 'defense', stages: 2, chance: 1 },
  },
  {
    id: 'lullaby-playlist',
    name: 'Lullaby Playlist',
    flavour: 'Puts the target to sleep.',
    type: 'chill',
    category: 'status',
    power: 0,
    accuracy: 75,
    pp: 10,
    priority: 0,
    effect: { kind: 'status', status: 'asleep', chance: 1 },
  },

  // Charm
  {
    id: 'heartbreaker',
    name: 'Heartbreaker',
    flavour: 'Leaves a mark.',
    type: 'charm',
    category: 'spirit',
    power: 100,
    accuracy: 85,
    pp: 5,
    priority: 0,
  },
  {
    id: 'dazzling-smile',
    name: 'Dazzling Smile',
    flavour: 'May leave the target Flustered.',
    type: 'charm',
    category: 'spirit',
    power: 70,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'flustered', chance: 0.2 },
  },
  {
    id: 'compliment-barrage',
    name: 'Compliment Barrage',
    flavour: 'Hits 2 or 3 times.',
    type: 'charm',
    category: 'spirit',
    power: 40,
    accuracy: 95,
    pp: 10,
    priority: 0,
    effect: { kind: 'multiHit', min: 2, max: 3 },
  },
  {
    id: 'charm-offensive',
    name: 'Charm Offensive',
    flavour: 'Always goes first.',
    type: 'charm',
    category: 'spirit',
    power: 40,
    accuracy: 100,
    pp: 20,
    priority: 1,
  },
  {
    id: 'puppy-eyes',
    name: 'Puppy Eyes',
    flavour: 'Lowers the target’s Spirit.',
    type: 'charm',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: { kind: 'stat', target: 'foe', stat: 'spirit', stages: -1, chance: 1 },
  },
  {
    id: 'smooth-talk',
    name: 'Smooth Talk',
    flavour: 'Leaves the target Flustered.',
    type: 'charm',
    category: 'status',
    power: 0,
    accuracy: 75,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'flustered', chance: 1 },
  },

  // Hype
  {
    id: 'main-character-energy',
    name: 'Main Character Energy',
    flavour: 'Hurts the user a bit too.',
    type: 'hype',
    category: 'physical',
    power: 120,
    accuracy: 80,
    pp: 5,
    priority: 0,
    effect: { kind: 'recoil', fraction: 1 / 3 },
  },
  {
    id: 'group-chat-spam',
    name: 'Group Chat Spam',
    flavour: 'Forty notifications in a minute.',
    type: 'hype',
    category: 'spirit',
    power: 70,
    accuracy: 95,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'flustered', chance: 0.2 },
  },
  {
    id: 'mosh-pit',
    name: 'Mosh Pit',
    flavour: 'Everyone in!',
    type: 'hype',
    category: 'physical',
    power: 90,
    accuracy: 90,
    pp: 10,
    priority: 0,
  },
  {
    id: 'hype-train',
    name: 'Hype Train',
    flavour: 'Always goes first.',
    type: 'hype',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 20,
    priority: 1,
  },
  {
    id: 'hype-speech',
    name: 'Hype Speech',
    flavour: 'Sharply raises Attack.',
    type: 'hype',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    effect: { kind: 'stat', target: 'self', stat: 'attack', stages: 2, chance: 1 },
  },
  {
    id: 'late-dinner-plans',
    name: 'Late Dinner Plans',
    flavour: 'Leaves the target Hangry.',
    type: 'hype',
    category: 'status',
    power: 0,
    accuracy: 90,
    pp: 15,
    priority: 0,
    effect: { kind: 'status', status: 'hangry', chance: 1 },
  },
];

/** Used automatically once every move is out of PP. */
export const FLAIL: Move = {
  id: 'flail',
  name: 'Flail',
  flavour: 'Out of ideas.',
  type: null,
  category: 'physical',
  power: 40,
  accuracy: null,
  pp: 1,
  priority: 0,
  effect: { kind: 'recoil', fraction: 0.25 },
};

/**
 * Each friend's own special move, from Rich's Ranemon sheet. Only that friend can learn it.
 * Where the sheet gives no number, the values here are a first guess for balancing.
 */
export const SPECIAL_MOVES: Move[] = [
  {
    id: 'nozzy-call',
    signature: 'carlmon',
    name: 'Nozzy Call',
    flavour: 'Raises Speed by 50%.',
    type: 'hype',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    specials: [{ kind: 'boost', target: 'self', stat: 'speed', factor: 1.5 }],
  },
  {
    id: 'ranelads-com',
    signature: 'steadmon',
    name: 'Ranelads.com',
    flavour:
      'Uses his powers as ruler of Ranelads.com to change the rules of reality. Swaps HP with the opponent.',
    type: 'brains',
    category: 'status',
    power: 0,
    accuracy: 90,
    pp: 5,
    priority: 0,
    specials: [{ kind: 'swap-hp' }],
  },
  {
    id: 'fierce-friendship',
    signature: 'enda',
    name: 'Fierce Friendship',
    flavour: 'Makes friends with the opponent, dropping their Attack by 30%.',
    type: 'charm',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 10,
    priority: 0,
    specials: [{ kind: 'boost', target: 'foe', stat: 'attack', factor: 0.7 }],
  },
  {
    id: 'helping-hand-ois',
    signature: 'oismon',
    name: 'Helping Hand',
    flavour:
      'Swaps out for Olliemon with a Monster energy drink: full HP and 20% more Attack. Without him, a wild Olliemon hands Oismon the drink.',
    type: 'hype',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 5,
    priority: 1,
    specials: [
      { kind: 'tag-partner', partner: 'olliemon', partnerName: 'Olliemon', attackFactor: 1.2 },
    ],
  },
  {
    id: 'helping-hand-ollie',
    signature: 'olliemon',
    name: 'Helping Hand',
    flavour:
      'Swaps out for Oismon with a Monster energy drink: full HP and 20% more Attack. Without him, a wild Oismon hands Olliemon the drink.',
    type: 'charm',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 5,
    priority: 1,
    specials: [
      { kind: 'tag-partner', partner: 'oismon', partnerName: 'Oismon', attackFactor: 1.2 },
    ],
  },
  {
    id: 'dark-web',
    signature: 'hugomon',
    name: 'Dark Web',
    flavour: 'Hides his identity, raising Attack by 30%.',
    type: 'brains',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    specials: [{ kind: 'boost', target: 'self', stat: 'attack', factor: 1.3 }],
  },
  {
    id: 'military-force',
    signature: 'gibbsmon',
    name: 'Military Force',
    flavour: 'Calls in bombers from the army. Hits 2 to 4 times.',
    type: 'brawn',
    category: 'physical',
    power: 40,
    accuracy: 90,
    pp: 5,
    priority: 0,
    effect: { kind: 'multiHit', min: 2, max: 4 },
  },
  {
    id: 'jamanding',
    signature: 'jammon',
    name: 'Jamanding',
    flavour: 'Demands he gets what he deserves. Raises Defense by 25%.',
    type: 'chill',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    specials: [{ kind: 'boost', target: 'self', stat: 'defense', factor: 1.25 }],
  },
  {
    id: 'paddy-pimblett',
    signature: 'boydemon',
    name: 'Paddy Pimblett',
    flavour: 'MMA moves learnt from the family. Massive damage.',
    type: 'brawn',
    category: 'physical',
    power: 120,
    accuracy: 85,
    pp: 5,
    priority: 0,
  },
  {
    id: 'this-ones-for-africa',
    signature: 'killemon',
    name: 'This One’s for Africa',
    flavour: 'A tribal dance learnt in the wilderness. Raises Attack by 30%.',
    type: 'hype',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    specials: [{ kind: 'boost', target: 'self', stat: 'attack', factor: 1.3 }],
  },
  {
    id: 'rounds-on-me',
    signature: 'lorcamon',
    name: 'Rounds on Me',
    flavour: 'Buys a round: his is 0%, theirs isn’t. Lowers their Speed and raises his.',
    type: 'charm',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 10,
    priority: 0,
    specials: [
      { kind: 'boost', target: 'foe', stat: 'speed', factor: 0.8 },
      { kind: 'boost', target: 'self', stat: 'speed', factor: 1.2 },
    ],
  },
  {
    id: 'usa',
    signature: 'owemon',
    name: 'USA',
    flavour: 'A high-damage attack with the might of the military.',
    type: 'brawn',
    category: 'physical',
    power: 110,
    accuracy: 90,
    pp: 5,
    priority: 0,
  },
  {
    id: 'try-hard',
    signature: 'conemon',
    name: 'Try Hard',
    flavour: 'Tries too hard for the lads: Attack up 30%, HP down 15%.',
    type: 'hype',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    specials: [
      { kind: 'boost', target: 'self', stat: 'attack', factor: 1.3 },
      { kind: 'self-damage', fraction: 0.15 },
    ],
  },
  {
    id: 'content-creation',
    signature: 'robinmon',
    name: 'Content Creation',
    flavour: 'The love of his fans restores half his HP.',
    type: 'charm',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 5,
    priority: 0,
    effect: { kind: 'heal', fraction: 0.5 },
  },
  {
    id: 'blaze-up',
    signature: 'simomon',
    name: 'Blaze Up',
    flavour: 'Lowers his Speed but greatly raises his Defense.',
    type: 'chill',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    specials: [
      { kind: 'boost', target: 'self', stat: 'speed', factor: 0.75 },
      { kind: 'boost', target: 'self', stat: 'defense', factor: 1.6 },
    ],
  },
  {
    id: 'b2b',
    signature: 'thilomon',
    name: 'B2B',
    flavour: 'Fires off a random attack from his moveset, then switches out.',
    type: 'chaos',
    category: 'status',
    power: 0,
    accuracy: null,
    pp: 10,
    priority: 0,
    specials: [{ kind: 'hit-and-run' }],
  },
];

const BY_ID = new Map([...MOVES, ...SPECIAL_MOVES, FLAIL].map((m) => [m.id, m]));

export function moveById(id: string): Move {
  const move = BY_ID.get(id);
  if (!move) throw new Error(`Unknown move: ${id}`);
  return move;
}
