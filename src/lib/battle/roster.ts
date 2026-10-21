import type { Creature } from './creature';

/**
 * The lads, from Rich's Ranemon sheet. Each has their own special move and a sprite cut from
 * their photo. The sheet doesn't give types or stats, so those are a first pass for balance.
 */
export const ROSTER: Creature[] = [
  {
    id: 'carlmon',
    name: 'Carlmon',
    types: ['hype'],
    base: { hp: 80, attack: 85, defense: 70, spirit: 65, speed: 100 },
    moves: ['nozzy-call', 'mosh-pit', 'shopping-trolley', 'headlock'],
    entry: 'One Nozzy Call and he’s already halfway to the bar.',
    colour: '#f5cf3a',
    sprite: '/sprites/bw/carlmon.png',
  },
  {
    id: 'steadmon',
    name: 'Steadmon',
    types: ['brains'],
    base: { hp: 90, attack: 55, defense: 80, spirit: 95, speed: 80 },
    moves: ['ranelads-com', 'well-actually', 'cold-shoulder', 'quick-fact'],
    entry: 'Ruler of Ranelads.com. Rewrites the rules of reality when he’s losing.',
    colour: '#9b7be8',
    sprite: '/sprites/bw/steadmon.png',
  },
  {
    id: 'enda',
    name: 'Endamon',
    types: ['charm'],
    base: { hp: 100, attack: 60, defense: 85, spirit: 85, speed: 70 },
    moves: ['fierce-friendship', 'heartbreaker', 'prank-call', 'cold-shoulder'],
    entry: 'Makes friends so fiercely that opponents forget they came to fight.',
    colour: '#f59ac2',
    sprite: '/sprites/bw/enda.png',
  },
  {
    id: 'oismon',
    name: 'Oismon',
    types: ['hype'],
    base: { hp: 85, attack: 90, defense: 70, spirit: 60, speed: 95 },
    moves: ['helping-hand-ois', 'mosh-pit', 'gym-bro-punch', 'hype-train'],
    entry: 'Always has a Monster in his pocket for Olliemon.',
    colour: '#e8a33a',
    sprite: '/sprites/bw/oismon.png',
  },
  {
    id: 'olliemon',
    name: 'Olliemon',
    types: ['brawn'],
    base: { hp: 95, attack: 100, defense: 75, spirit: 60, speed: 70 },
    moves: ['helping-hand-ollie', 'slam-dunk', 'headlock', 'dazzling-smile'],
    entry: 'Tags in for Oismon with an energy drink. Never seen without him.',
    colour: '#e58fd8',
    sprite: '/sprites/bw/olliemon.png',
  },
  {
    id: 'hugomon',
    name: 'Hugomon',
    types: ['brains', 'chaos'],
    base: { hp: 65, attack: 120, defense: 70, spirit: 60, speed: 85 },
    moves: ['dark-web', 'calculated-hit', 'shopping-trolley', 'cheap-shot'],
    entry: 'Logs onto the Dark Web, hides his identity, and hits harder for it.',
    colour: '#6b5bb8',
    sprite: '/sprites/bw/hugomon.png',
  },
  {
    id: 'gibbsmon',
    name: 'Gibbsmon',
    types: ['brawn'],
    base: { hp: 100, attack: 105, defense: 85, spirit: 45, speed: 65 },
    moves: ['military-force', 'gym-bro-punch', 'mosh-pit', 'flex'],
    entry: 'Has the army on speed dial. The bombers arrive in waves.',
    colour: '#7d8b4f',
    sprite: '/sprites/bw/gibbsmon.png',
  },
  {
    id: 'jammon',
    name: 'Jammon',
    types: ['chill'],
    base: { hp: 85, attack: 110, defense: 85, spirit: 70, speed: 50 },
    moves: ['jamanding', 'slow-clap', 'gym-bro-punch', 'shopping-trolley'],
    entry: 'Demands what he deserves, and digs in until he gets it.',
    colour: '#58a6a6',
    sprite: '/sprites/bw/jammon.png',
  },
  {
    id: 'boydemon',
    name: 'Boydemon',
    types: ['brawn', 'chaos'],
    base: { hp: 75, attack: 130, defense: 70, spirit: 45, speed: 80 },
    moves: ['paddy-pimblett', 'headlock', 'shopping-trolley', 'cheap-shot'],
    entry: 'Learnt his MMA from the family. Nobody asks for a rematch.',
    colour: '#f08a5d',
    sprite: '/sprites/bw/boydemon.png',
  },
  {
    id: 'killemon',
    name: 'Killemon',
    types: ['hype'],
    base: { hp: 90, attack: 100, defense: 65, spirit: 55, speed: 90 },
    moves: ['this-ones-for-africa', 'mosh-pit', 'hype-train', 'slow-clap'],
    entry: 'Breaks into a tribal dance from the wilds of Africa and comes back stronger.',
    colour: '#d9822b',
    sprite: '/sprites/bw/killemon.png',
  },
  {
    id: 'lorcamon',
    name: 'Lorcamon',
    types: ['charm'],
    base: { hp: 110, attack: 65, defense: 95, spirit: 50, speed: 80 },
    moves: ['rounds-on-me', 'dazzling-smile', 'cold-shoulder', 'group-chat-spam'],
    entry: 'Gets the rounds in. His is always the 0% one.',
    colour: '#7fa6e6',
    sprite: '/sprites/bw/lorcamon.png',
  },
  {
    id: 'owemon',
    name: 'Owemon',
    types: ['brawn', 'hype'],
    base: { hp: 95, attack: 100, defense: 75, spirit: 60, speed: 70 },
    moves: ['usa', 'mosh-pit', 'calculated-hit', 'steal-their-chips'],
    entry: 'Brings the full might of the US military to a pub argument.',
    colour: '#c94f4f',
    sprite: '/sprites/bw/owemon.png',
  },
  {
    id: 'conemon',
    name: 'Conemon',
    types: ['hype', 'charm'],
    base: { hp: 90, attack: 110, defense: 65, spirit: 50, speed: 85 },
    moves: ['try-hard', 'mosh-pit', 'gym-bro-punch', 'shopping-trolley'],
    entry: 'Tries far too hard for the lads, and it costs him.',
    colour: '#f2a541',
    sprite: '/sprites/bw/conemon.png',
  },
  {
    id: 'robinmon',
    name: 'Robinmon',
    types: ['charm'],
    base: { hp: 105, attack: 65, defense: 90, spirit: 60, speed: 80 },
    moves: ['content-creation', 'dazzling-smile', 'group-chat-spam', 'prank-call'],
    entry: 'Films everything. The fans keep him going.',
    colour: '#d94fa8',
    sprite: '/sprites/bw/robinmon.png',
  },
  {
    id: 'simomon',
    name: 'Simomon',
    types: ['chill'],
    base: { hp: 105, attack: 55, defense: 90, spirit: 100, speed: 50 },
    moves: ['blaze-up', 'avalanche-of-vibes', 'cold-shoulder', 'well-actually'],
    entry: 'Slows right down and becomes very, very hard to bother.',
    colour: '#6cc4a0',
    sprite: '/sprites/bw/simomon.png',
  },
  {
    id: 'thilomon',
    name: 'Thilomon',
    types: ['chaos'],
    base: { hp: 85, attack: 105, defense: 70, spirit: 50, speed: 90 },
    moves: ['b2b', 'shopping-trolley', 'mosh-pit', 'cheap-shot'],
    entry: 'Goes back to back: fires one off, then he’s gone before you notice.',
    colour: '#b45cc9',
    sprite: '/sprites/bw/thilomon.png',
  },
  {
    id: 'paulimon',
    name: 'Paulimon',
    types: ['hype', 'brains'],
    base: { hp: 85, attack: 90, defense: 70, spirit: 75, speed: 80 },
    moves: ['hat-trick', 'group-chat-spam', 'calculated-hit', 'hype-speech'],
    entry: 'Never seen without the hat. Scores three before you’ve found your seat.',
    colour: '#4a6fb5',
    sprite: '/sprites/bw/paulimon.png',
    solid: true,
  },
  {
    id: 'skehemon',
    name: 'Skehemon',
    types: ['chill', 'chaos'],
    base: { hp: 80, attack: 70, defense: 80, spirit: 90, speed: 80 },
    moves: ['not-impressed', 'slow-clap', 'prank-call', 'unbothered'],
    entry: 'Arms crossed, shades on. Has seen it all before, and wasn’t impressed then either.',
    colour: '#2fb3b8',
    sprite: '/sprites/bw/skehemon.png',
    solid: true,
  },
  {
    id: 'vinnimon',
    name: 'Vinnimon',
    types: ['charm', 'brains'],
    base: { hp: 100, attack: 60, defense: 75, spirit: 95, speed: 70 },
    moves: ['prost', 'dazzling-smile', 'well-actually', 'smooth-talk'],
    entry: 'Suit, tie and a stein of lager. Toasts every win, and every loss.',
    colour: '#c9a227',
    sprite: '/sprites/bw/vinnimon.png',
    solid: true,
  },
  {
    id: 'crampemon',
    name: 'Crampemon',
    types: ['brawn', 'charm'],
    base: { hp: 100, attack: 90, defense: 85, spirit: 60, speed: 65 },
    moves: ['calf-cramp', 'headlock', 'dazzling-smile', 'flex'],
    entry: 'All grin and beard. Seizes up mid-match, and takes the other lad down with him.',
    colour: '#c8642a',
    sprite: '/sprites/bw/crampemon.png',
    solid: true,
  },
];

export function creatureById(id: string): Creature {
  const c = ROSTER.find((s) => s.id === id);
  if (!c) throw new Error(`Unknown creature: ${id}`);
  return c;
}

/** Ranemon that only work together, so a drawn team never splits them up. */
const PAIRS: [string, string][] = [['oismon', 'olliemon']];

/**
 * Takes the first `size` of a shuffled pool as a team. When that splits a pair and the
 * partner is still in the pool, the partner comes in for the last unpaired member, so
 * Helping Hand has someone to tag.
 */
export function drawTeam(shuffled: Creature[], size: number): Creature[] {
  const team = shuffled.slice(0, size);
  const rest = shuffled.slice(size);
  for (const [a, b] of PAIRS) {
    const hasA = team.some((c) => c.id === a);
    if (hasA === team.some((c) => c.id === b)) continue;
    const partner = rest.find((c) => c.id === (hasA ? b : a));
    const out = team.findLastIndex((c) => c.id !== a && c.id !== b);
    if (partner && out >= 0) team[out] = partner;
  }
  return team;
}
