import type { Creature } from './creature';

/**
 * Stand-in creatures until Creature Studio turns friends' photos into real ones. Each is a
 * valid card under the same rules a friend's creature will follow.
 */
export const STARTERS: Creature[] = [
  {
    id: 'professor-pip',
    name: 'Prof Pip',
    types: ['brains'],
    base: { hp: 130, attack: 55, defense: 70, spirit: 70, speed: 75 },
    moves: ['galaxy-brain', 'well-actually', 'overthink', 'long-lecture'],
    entry: 'Has a fact for every occasion, and several for the others.',
    colour: '#9b7be8',
  },
  {
    id: 'quizzy',
    name: 'Quizzy',
    types: ['brains', 'chill'],
    base: { hp: 85, attack: 75, defense: 85, spirit: 85, speed: 70 },
    moves: ['calculated-hit', 'cold-shoulder', 'quick-fact', 'power-nap'],
    entry: 'Wins every pub quiz, then goes straight to bed.',
    colour: '#7fa6e6',
  },
  {
    id: 'big-tone',
    name: 'Big Tone',
    types: ['brawn'],
    base: { hp: 100, attack: 115, defense: 60, spirit: 50, speed: 75 },
    moves: ['slam-dunk', 'gym-bro-punch', 'shoulder-barge', 'flex'],
    entry: 'Will help you move house. Will not stop talking about it.',
    colour: '#f08a5d',
  },
  {
    id: 'deadlift-dee',
    name: 'Dee',
    types: ['brawn', 'chaos'],
    base: { hp: 100, attack: 95, defense: 75, spirit: 55, speed: 75 },
    moves: ['gym-bro-punch', 'shopping-trolley', 'headlock', 'steal-their-chips'],
    entry: 'Turns every walk into a race.',
    colour: '#f2a541',
  },
  {
    id: 'gremlin',
    name: 'Gremlin',
    types: ['chaos'],
    base: { hp: 55, attack: 100, defense: 50, spirit: 75, speed: 120 },
    moves: ['shopping-trolley', 'prank-call', 'cheap-shot', 'stir-the-pot'],
    entry: 'Nobody knows how it got on the roof.',
    colour: '#d94fa8',
  },
  {
    id: 'wildcard-wes',
    name: 'Wes',
    types: ['chaos', 'charm'],
    base: { hp: 120, attack: 60, defense: 75, spirit: 70, speed: 75 },
    moves: ['total-meltdown', 'dazzling-smile', 'sugar-rush', 'smooth-talk'],
    entry: 'Somehow talks the bouncer into letting everyone in.',
    colour: '#b45cc9',
  },
  {
    id: 'snooze',
    name: 'Snooze',
    types: ['chill'],
    base: { hp: 105, attack: 50, defense: 95, spirit: 75, speed: 75 },
    moves: ['avalanche-of-vibes', 'slow-clap', 'power-nap', 'lullaby-playlist'],
    entry: 'Has never once been in a hurry.',
    colour: '#6cc4e8',
  },
  {
    id: 'mellow-mo',
    name: 'Mo',
    types: ['chill', 'brawn'],
    base: { hp: 100, attack: 85, defense: 95, spirit: 50, speed: 70 },
    moves: ['slow-clap', 'gym-bro-punch', 'unbothered', 'power-nap'],
    entry: 'Shrugs off everything, including furniture.',
    colour: '#58a6a6',
  },
  {
    id: 'sweet-talk-sal',
    name: 'Sal',
    types: ['charm'],
    base: { hp: 120, attack: 40, defense: 90, spirit: 75, speed: 75 },
    moves: ['heartbreaker', 'compliment-barrage', 'charm-offensive', 'puppy-eyes'],
    entry: 'Gets free dessert everywhere.',
    colour: '#f59ac2',
  },
  {
    id: 'bestie',
    name: 'Bestie',
    types: ['charm', 'brains'],
    base: { hp: 130, attack: 50, defense: 80, spirit: 70, speed: 70 },
    moves: ['dazzling-smile', 'well-actually', 'smooth-talk', 'overthink'],
    entry: 'Remembers everyone’s birthday, and everyone’s secrets.',
    colour: '#e58fd8',
  },
  {
    id: 'loud-lou',
    name: 'Lou',
    types: ['hype'],
    base: { hp: 75, attack: 110, defense: 55, spirit: 55, speed: 105 },
    moves: ['main-character-energy', 'group-chat-spam', 'hype-train', 'hype-speech'],
    entry: 'First on the dance floor, last to leave.',
    colour: '#f5cf3a',
  },
  {
    id: 'party-starter',
    name: 'Starter',
    types: ['hype', 'chaos'],
    base: { hp: 75, attack: 80, defense: 60, spirit: 90, speed: 95 },
    moves: ['group-chat-spam', 'prank-call', 'late-dinner-plans', 'cheap-shot'],
    entry: 'Plans the night out, then cancels at 6pm.',
    colour: '#e8a33a',
  },
];

export function starterById(id: string): Creature {
  const c = STARTERS.find((s) => s.id === id);
  if (!c) throw new Error(`Unknown creature: ${id}`);
  return c;
}
