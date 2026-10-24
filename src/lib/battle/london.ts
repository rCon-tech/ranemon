import { scaleStats, type BaseStats, type Creature } from './creature';
import type { RaneType } from './types';

/**
 * London's own Ranemon (docs/london-ranedex.md): Londoners, drawn in pixel art with the kit in
 * `scripts/drawn/london.py`, in `public/sprites/london/`. Batch 1 is Central and Shoreditch &
 * Hackney.
 *
 * Every stage of a line keeps its line's four moves, its special one included, as the lads'
 * evolved forms do; its types can grow from stage to stage. A line has one stat shape, scaled to
 * each stage's budget: 320, 400 and 470 for a line of three, 360 and 460 for an early line of
 * two, 460 for a fossil. Wickmon is 330, and each of its five branches is 460 with a shape of
 * its own.
 */

interface Stage {
  id: string;
  name: string;
  types: [RaneType] | [RaneType, RaneType];
  entry: string;
  /** The level it evolves into this stage at, for every stage after the first. */
  level?: number;
}

interface Line {
  shape: BaseStats;
  budgets: number[];
  colour: string;
  moves: string[];
  stages: Stage[];
}

const stats = (hp: number, attack: number, defense: number, spirit: number, speed: number) => ({
  hp,
  attack,
  defense,
  spirit,
  speed,
});

const THREE = [320, 400, 470];
const TWO = [360, 460];

const LINES: Line[] = [
  {
    shape: stats(80, 80, 70, 65, 105),
    budgets: THREE,
    colour: '#3a4a8c',
    moves: ['rush-hour', 'cold-shoulder', 'cash-in-hand', 'sucks-teeth'],
    stages: [
      {
        id: 'oystermon',
        name: 'Oystermon',
        types: ['graft', 'chill'],
        entry:
          'Taps in at Woolwich Arsenal at 6:58 every morning. There are forty more of it in every tunnel.',
      },
      {
        id: 'golpeak',
        name: 'Golpeak',
        types: ['graft', 'chill'],
        level: 14,
        entry: 'Only travels at peak. Its ears hear a delay announced three stations away.',
      },
      {
        id: 'crowdbat',
        name: 'Crowdbat',
        types: ['graft', 'hype'],
        level: 32,
        entry: 'Takes the Paddington Express on expenses. Answers emails with all four wings.',
      },
    ],
  },
  {
    shape: stats(70, 90, 60, 75, 105),
    budgets: THREE,
    colour: '#4a4e58',
    moves: ['zero-longitude', 'hype-train', 'headlock', 'mosh-pit'],
    stages: [
      {
        id: 'speedmon',
        name: 'Speedmon',
        types: ['hype'],
        entry: 'Walks left on the Victoria line escalator. Tuts at anyone standing on that side.',
      },
      {
        id: 'jogduo',
        name: 'Jogduo',
        types: ['hype', 'brawn'],
        level: 16,
        entry: 'Evolved the day it bought a Garmin. Runs laps of Peckham Rye with its other head.',
      },
      {
        id: 'meridrio',
        name: 'Meridrio',
        types: ['hype', 'brawn'],
        level: 32,
        entry:
          'Runs the Greenwich Meridian with one foot in each half of the world. Three heads, three splits.',
      },
    ],
  },
  {
    shape: stats(80, 85, 70, 60, 105),
    budgets: THREE,
    colour: '#d8433a',
    moves: ['strava-segment', 'shoulder-barge', 'gym-bro-punch', 'late-dinner-plans'],
    stages: [
      {
        id: 'pedalmon',
        name: 'Pedalmon',
        types: ['hype'],
        entry: 'Rides a Santander bike in a suit. Docks it with a minute to spare, every time.',
      },
      {
        id: 'pedgeotto',
        name: 'Pedgeotto',
        types: ['hype', 'brawn'],
        level: 18,
        entry: 'Twelve laps of Richmond Park in Lycra. Says it’s going for a coffee. Never stops.',
      },
      {
        id: 'pedgeot',
        name: 'Pedgeot',
        types: ['hype', 'brawn'],
        level: 36,
        entry: 'Holds the Herne Hill Velodrome record, and the record for talking about it.',
      },
    ],
  },
  {
    shape: stats(70, 105, 70, 55, 100),
    budgets: THREE,
    colour: '#3d8b4a',
    moves: ['undercroft-grind', 'cheap-shot', 'shopping-trolley', 'hype-speech'],
    stages: [
      {
        id: 'skatemon',
        name: 'Skatemon',
        types: ['hype'],
        entry: 'Kickflips past the Royal Festival Hall. Lands about one in ten.',
      },
      {
        id: 'skyther',
        name: 'Skyther',
        types: ['hype', 'chaos'],
        level: 20,
        entry: 'Got sponsored. The deck has a logo on it now, and so do its shoes.',
      },
      {
        id: 'grindzor',
        name: 'Grindzor',
        types: ['hype', 'chaos'],
        level: 40,
        entry: 'A legend of the Undercroft. Has defended it from developers with its life.',
      },
    ],
  },
  {
    shape: stats(90, 80, 95, 75, 60),
    budgets: THREE,
    colour: '#8a6a3a',
    moves: ['mint-condition', 'overtime', 'abstract', 'members-only'],
    stages: [
      {
        id: 'fleamon',
        name: 'Fleamon',
        types: ['graft'],
        entry: 'Up at 5am at Deptford Market. Buys a jacket for £2 on Saturday.',
      },
      {
        id: 'metadepop',
        name: 'Metadepop',
        types: ['graft', 'arty'],
        level: 12,
        entry: 'Lists the same jacket for £85 on Sunday. Describes it as “archive”.',
      },
      {
        id: 'antiquefree',
        name: 'Antiquefree',
        types: ['graft', 'posh'],
        level: 30,
        entry: 'Deals antiques in Crystal Palace now. The jacket is in the window at £400.',
      },
    ],
  },
  {
    shape: stats(90, 60, 80, 105, 65),
    budgets: THREE,
    colour: '#c9a77c',
    moves: ['pour-over', 'slow-clap', 'trust-fund', 'power-nap'],
    stages: [
      {
        id: 'oatmon',
        name: 'Oatmon',
        types: ['chill'],
        entry: 'Pulls oat flat whites in Hackney. Will not do you a caramel anything.',
      },
      {
        id: 'flaatwhite',
        name: 'Flaatwhite',
        types: ['chill', 'posh'],
        level: 16,
        entry: 'A flat white purist from Islington. Can tell a Kenyan bean from across the room.',
      },
      {
        id: 'ampharoast',
        name: 'Ampharoast',
        types: ['chill', 'posh'],
        level: 34,
        entry:
          'Roasts single-origin beans in a railway arch. Its wool glows the colour of a light roast.',
      },
    ],
  },
  {
    shape: stats(80, 60, 75, 105, 80),
    budgets: THREE,
    colour: '#6aa0d8',
    moves: ['disrupt', 'quick-fact', 'group-chat-spam', 'galaxy-brain'],
    stages: [
      {
        id: 'seedmon',
        name: 'Seedmon',
        types: ['brains'],
        entry: 'A tech founder in Shoreditch, pre-seed. Has a lanyard, a deck and no product.',
      },
      {
        id: 'pivotgon',
        name: 'Pivotgon',
        types: ['brains', 'hype'],
        level: 18,
        entry: 'Raised its Series A and pivoted. It was an app for dogs; it is now AI.',
      },
      {
        id: 'pivotgon2',
        name: 'Pivotgon2',
        types: ['brains', 'hype'],
        level: 36,
        entry: 'A unicorn. Each evolution was a pivot. Still no revenue.',
      },
    ],
  },
  {
    shape: stats(80, 85, 65, 100, 70),
    budgets: TWO,
    colour: '#2a2a3a',
    moves: ['rewind-selecta', 'hype-train', 'lullaby-playlist', 'cold-shoulder'],
    stages: [
      {
        id: 'decksmon',
        name: 'Decksmon',
        types: ['hype'],
        entry: 'Plays Dalston basements off a laptop. Has a residency nobody has heard of.',
      },
      {
        id: 'electabass',
        name: 'Electabass',
        types: ['hype', 'chill'],
        level: 30,
        entry:
          'Runs a wall of speakers on a Carnival corner in Ladbroke Grove. Rewinds it if you cheer.',
      },
    ],
  },
  {
    shape: stats(95, 105, 85, 50, 65),
    budgets: TWO,
    colour: '#b8322a',
    moves: ['bell-ringer', 'shoulder-barge', 'headlock', 'hi-vis'],
    stages: [
      {
        id: 'jabmon',
        name: 'Jabmon',
        types: ['brawn'],
        entry: 'A regular at the Bethnal Green boxing gym. Skips rope at 6am. Skips nothing else.',
      },
      {
        id: 'ursaringside',
        name: 'Ursaringside',
        types: ['brawn', 'graft'],
        level: 28,
        entry: 'Coaches the gym now. Shouts “hands up” in its sleep.',
      },
    ],
  },
  {
    shape: stats(105, 75, 80, 80, 60),
    budgets: TWO,
    colour: '#d89a4a',
    moves: ['salt-beef-on-rye', 'charm-offensive', 'dazzling-smile', 'unbothered'],
    stages: [
      {
        id: 'bagelmon',
        name: 'Bagelmon',
        types: ['charm'],
        entry:
          'Queues at Brick Lane at 3am for a salt beef bagel. Makes friends with the whole queue.',
      },
      {
        id: 'delibeigel',
        name: 'Delibeigel',
        types: ['charm', 'chill'],
        level: 24,
        entry: 'A regular at every deli in Golders Green. Has its own table, and its own mustard.',
      },
    ],
  },
  {
    shape: stats(95, 100, 80, 55, 70),
    budgets: TWO,
    colour: '#e0b83a',
    moves: ['three-for-a-tenner', 'cash-in-hand', 'puppy-eyes', 'sucks-teeth'],
    stages: [
      {
        id: 'bunchmon',
        name: 'Bunchmon',
        types: ['graft'],
        entry: 'Sells flowers on Columbia Road. Shouts the price down every hour after 2pm.',
      },
      {
        id: 'sunflorist',
        name: 'Sunflorist',
        types: ['graft', 'charm'],
        level: 24,
        entry: 'Has had the same pitch for forty years. Gives the last sunflowers away at four.',
      },
    ],
  },
  {
    shape: stats(66, 66, 66, 66, 66),
    budgets: [330],
    colour: '#7a5a9a',
    moves: ['bin-rota', 'cheap-shot', 'stir-the-pot', 'prank-call'],
    stages: [
      {
        id: 'wickmon',
        name: 'Wickmon',
        types: ['chaos'],
        entry:
          'Lives in a Hackney Wick warehouse with ten flatmates and one bathroom. What it becomes depends on what you hand it.',
      },
    ],
  },
  {
    shape: stats(85, 105, 70, 85, 115),
    budgets: [460],
    colour: '#a07850',
    moves: ['listed-building', 'well-actually', 'prank-call', 'long-lecture'],
    stages: [
      {
        id: 'aerodactivist',
        name: 'Aerodactivist',
        types: ['brains', 'chaos'],
        entry:
          'Has chained itself to a Georgian doorway in Spitalfields. Was here before the building, and will be after.',
      },
    ],
  },
];

/** Wickmon's branches: one for each item it can be given. */
const BRANCHES: (Stage & { item: string; signature: string; base: BaseStats; colour: string })[] = [
  {
    id: 'vapeoreon',
    name: 'Vapeoreon',
    types: ['chill'],
    item: 'disposable-vape',
    signature: 'mango-ice',
    base: stats(125, 60, 75, 120, 80),
    colour: '#5ab8d8',
    entry: 'Found a mango ice in a bin by the canal. Has not been seen without the cloud since.',
  },
  {
    id: 'espresseon',
    name: 'Espresseon',
    types: ['hype'],
    item: 'espresso-tamper',
    signature: 'double-shot',
    base: stats(70, 115, 65, 80, 130),
    colour: '#6a3a1a',
    entry: 'Got a job at a coffee start-up. Vibrates very slightly at all times.',
  },
  {
    id: 'rumbreon',
    name: 'Rumbreon',
    types: ['chaos'],
    item: 'afterparty-wristband',
    signature: 'after-after-party',
    base: stats(100, 120, 100, 55, 85),
    colour: '#3a2a4a',
    entry: 'Never went to bed. Still has the wristband on. It’s been three days.',
  },
  {
    id: 'flatshareon',
    name: 'Flatshareon',
    types: ['graft'],
    item: 'spareroom-listing',
    signature: 'rent-increase',
    base: stats(110, 110, 125, 50, 65),
    colour: '#7a7a6a',
    entry: 'Took over the lease and became the landlord. Now it lists the box room for £1,100.',
  },
  {
    id: 'joltcoin',
    name: 'Joltcoin',
    types: ['brains'],
    item: 'hardware-wallet',
    signature: 'to-the-moon',
    base: stats(75, 60, 70, 130, 125),
    colour: '#e8b83a',
    entry: 'Went all in on crypto. Lost the seed phrase. Still says “we’re so early”.',
  },
];

const form = (line: Line, s: Stage, i: number): Creature => ({
  id: s.id,
  name: s.name,
  types: s.types,
  base: scaleStats(line.shape, line.budgets[i]),
  moves: line.moves,
  entry: s.entry,
  colour: line.colour,
  sprite: `/sprites/london/${s.id}.png`,
});

/** Each London form's stat budget, by id. */
export const LONDON_BUDGETS = new Map<string, number>([
  ...LINES.flatMap((l) => l.stages.map((s, i) => [s.id, l.budgets[i]] as [string, number])),
  ...BRANCHES.map((b) => [b.id, 460] as [string, number]),
]);

/** The step from one London stage to the next, by level. */
export const LONDON_EVOLUTIONS = LINES.flatMap((l) =>
  l.stages.slice(1).map((s, i) => ({
    from: l.stages[i].id,
    id: s.id,
    name: s.name,
    level: s.level!,
    entry: s.entry,
  })),
);

/** Wickmon's branches, each set off by its own item. */
export const LONDON_ITEM_EVOLUTIONS = BRANCHES.map((b) => ({
  from: 'wickmon',
  id: b.id,
  name: b.name,
  item: b.item,
  entry: b.entry,
  signature: b.signature,
}));

const wickmon = LINES.find((l) => l.stages[0].id === 'wickmon')!;

/** Every London form, in London Ranedex order: each line, then Wickmon's branches after it. */
export const LONDON: Creature[] = LINES.flatMap((l) => {
  const forms = l.stages.map((s, i) => form(l, s, i));
  if (l !== wickmon) return forms;
  return [
    ...forms,
    ...BRANCHES.map((b) => ({
      ...form(l, b, 0),
      base: b.base,
      colour: b.colour,
      moves: [b.signature, ...l.moves.slice(1)],
    })),
  ];
});

/** The London lines' first forms. */
export const LONDON_LINES = LINES.map((l) => l.stages[0].id);
