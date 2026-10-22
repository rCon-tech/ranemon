import { interiorId } from './interiors';
import type { GameMap, Look, Npc, Step, Trainer } from '@/lib/story/world';

/**
 * The Rave Cave, down a lane on the south side of Dublin: a basement where the party never
 * stops. Nine trainers dance under the lights, easiest by the door and hardest at the back by
 * the DJ, and once you've beaten one you can ask them for another battle whenever you like, and
 * they always say yes. It's the place to train a party up for B&S and the bosses after.
 */

/** The cave is the fourth landmark door in Dublin, after Connolly Station. */
export const RAVE_ID = interiorId('dublin', 'L', 3);

interface Raver {
  id: string;
  name: string;
  look: Look;
  team: [string, number][];
  ai: Trainer['ai'];
  before: string;
  after: string;
  /** What they say when you ask for another battle, before it starts. */
  again: string;
}

/** Front to back: the first three by the door, the last three by the DJ booth. */
const RAVERS: Raver[] = [
  {
    id: 'rave-aoife',
    name: 'Raver Aoife',
    look: 'raver',
    team: [
      ['hugomon', 42],
      ['oismon', 43],
    ],
    ai: 'easy',
    before: 'This is my song! Well, they’re all my song. Battle!',
    after: 'Grand, grand. Back to the dancing.',
    again: 'Again? Go on so, this is my song anyway!',
  },
  {
    id: 'rave-darragh',
    name: 'Bucket Hat Darragh',
    look: 'clubber',
    team: [
      ['jammon', 43],
      ['owemon', 44],
    ],
    ai: 'easy',
    before: 'Haven’t been home since Thursday. What day is it? Doesn’t matter. Battle!',
    after: 'Sound. Is it Monday yet?',
    again: 'Another one? I’ve nowhere to be. I’ve not had anywhere to be since Thursday.',
  },
  {
    id: 'rave-niamh',
    name: 'Shuffler Niamh',
    look: 'shuffler',
    team: [
      ['owemon', 45],
      ['simomon', 45],
      ['conemon', 46],
    ],
    ai: 'easy',
    before: 'You can’t shuffle in those shoes. You can battle in them, though.',
    after: 'Fair. My feet are in bits anyway.',
    again: 'Yes! I’ll shuffle while I battle. Watch this.',
  },
  {
    id: 'rave-cian',
    name: 'Afters Cian',
    look: 'raver',
    team: [
      ['killemon', 47],
      ['boydemon', 47],
      ['thilomon', 48],
    ],
    ai: 'normal',
    before:
      'There’s an afters in a flat in Rathmines. You’re not getting the address unless you beat me.',
    after: 'The address is… actually I’ve forgotten it.',
    again: 'Rematch? Sure. The afters isn’t till six.',
  },
  {
    id: 'rave-sorcha',
    name: 'Techno Sorcha',
    look: 'clubber',
    team: [
      ['lorcamon', 49],
      ['robinmon', 49],
      ['gibbsmon', 50],
    ],
    ai: 'normal',
    before: 'One hundred and forty beats a minute. My Ranemon are going faster than that.',
    after: 'Respect. That was a proper drop.',
    again: 'Again! Again! Bring it back!',
  },
  {
    id: 'rave-podge',
    name: 'Sesh Gremlin Podge',
    look: 'shuffler',
    team: [
      ['steadmon', 51],
      ['enda', 51],
      ['paulimon', 52],
    ],
    ai: 'normal',
    before: 'I’m not even tired. I’ve never been less tired. BATTLE ME.',
    after: 'Okay. Maybe I’m a small bit tired.',
    again: 'I’ve got my second wind. Or my ninth. Let’s go!',
  },
  {
    id: 'rave-kev',
    name: 'Festival Kev',
    look: 'raver',
    team: [
      ['skehemon', 52],
      ['vinnimon', 53],
      ['crampemon', 53],
      ['carlmon', 54],
    ],
    ai: 'hard',
    before: 'Electric Picnic, Body & Soul, Life… I’ve battled at all of them. You’re next.',
    after: 'Haven’t lost like that since the mud at the Picnic in 2008.',
    again: 'A rematch? Like the encore. There’s always an encore.',
  },
  {
    id: 'rave-orla',
    name: 'Sunglasses-at-Night Orla',
    look: 'clubber',
    team: [
      ['hugomon', 54],
      ['jammon', 55],
      ['owemon', 55],
      ['oismon', 56],
    ],
    ai: 'hard',
    before: 'I can’t see a thing in these. I don’t need to see to win.',
    after: 'I still can’t see. Did I lose? I lost.',
    again: 'Again? Sure. The shades stay on.',
  },
  {
    id: 'rave-mossy',
    name: 'Rave Legend Mossy',
    look: 'shuffler',
    team: [
      ['gibbsmon', 56],
      ['thilomon', 57],
      ['simomon', 57],
      ['killemon', 58],
    ],
    ai: 'hard',
    before: 'I’ve been on this floor since the Rave Cave opened in 1994. Nobody beats Mossy.',
    after: 'Thirty years and nobody’s beaten Mossy. Well. Thirty years and one person.',
    again: 'Back for more? Mossy never says no to a dance. Or a battle.',
  },
];

export const RAVE_TRAINERS: Trainer[] = RAVERS.map((r) => ({
  id: r.id,
  name: r.name,
  team: r.team,
  ai: r.ai,
  // As on the road: 20 euro a level of their best, paid every time you win.
  prize: Math.max(...r.team.map(([, l]) => l)) * 20,
  before: `${r.name.toUpperCase()}: ${r.before}`,
  after: `${r.name.toUpperCase()}: ${r.after}`,
}));

/**
 * Once beaten, talking to them asks for another go, and they always say yes. The story screen
 * still checks your party can fight before the battle starts.
 */
export function rematch(r: Raver): Step[] {
  return [
    {
      do: 'ask',
      text: `Ask ${r.name} for another battle?`,
      yes: [
        { do: 'say', text: `${r.name.toUpperCase()}: ${r.again}` },
        { do: 'battle', trainer: r.id },
      ],
      no: [
        { do: 'say', text: `${r.name.toUpperCase()}: No bother. I’ll be here. We’re always here.` },
      ],
    },
  ];
}

/** The DJ, behind the booth at the back, who never stops and never battles. */
const DJ: Npc = {
  look: 'dj',
  face: 'down',
  dances: true,
  talk: [
    {
      do: 'say',
      text: 'DJ: (Without taking off the headphones.) WELCOME TO THE RAVE CAVE! Everyone on this floor will battle you!',
    },
    {
      do: 'say',
      text: 'DJ: Beat someone and they’ll go again any time you ask. Easiest by the door, hardest up here by me.',
    },
  ],
};

/** Where each raver dances on the floor, front to back, in `RAVERS` order. */
const SPOTS = [
  [10, 9],
  [3, 8],
  [7, 8],
  [11, 8],
  [3, 6],
  [8, 6],
  [3, 4],
  [7, 4],
  [11, 4],
];

export function raveRoom(): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  // The DJ is person 1, behind the booth; the ravers come after, front to back.
  const rows = [
    'WooooooooooooW',
    'WIkkkk1kkkkkIW',
    'WIkkCCCCCCkkIW',
    'WkllllllllllkW',
    'WkllllllllllkW',
    'WkllllllllllkW',
    'WkllllllllllkW',
    'WkllllllllllkW',
    'WkllllllllllkW',
    'WkllllllllllkW',
    'WUUkkkkkkkkUUW',
    'WUUkkk@kkkkUUW',
    'WWWWWWEWWWWWWW',
  ].map((r) => r.split(''));
  RAVERS.forEach((_, i) => {
    const [x, y] = SPOTS[i];
    rows[y][x] = String((i + 2) % 10);
  });
  return {
    name: 'The Rave Cave',
    rows: rows.map((r) => r.join('')),
    npcs: [
      DJ,
      ...RAVERS.map((r): Npc => ({
        look: r.look,
        face: 'down',
        trainer: r.id,
        dances: true,
        talk: rematch(r),
      })),
    ],
    things: {
      I: 'A speaker stack the size of a wardrobe. Your teeth are buzzing.',
      C: 'The DJ booth. Two decks, a laptop covered in stickers and a very warm can of Club Orange.',
      o: 'Black brick and a neon tube. Somebody has written “MOSSY 4 EVA” on the wall in glow stick.',
      U: 'A sticky table covered in glow sticks, bottles of water and somebody’s lost jacket.',
    },
  };
}

/** Said every time you come down the stairs. */
export const RAVE_ARRIVE: Step[] = [
  {
    do: 'say',
    text: 'THE RAVE CAVE. The bass hits you in the chest. The lights never stop and neither does anyone on the floor.',
  },
];

/** The bouncer on the door outside, who lets anyone in. */
export const BOUNCER: Npc = {
  look: 'bouncer',
  face: 'left',
  talk: [
    {
      do: 'say',
      text: 'BOUNCER: The Rave Cave. Open all night, every night, since 1994. In you go, but mind yourself: everyone in there wants a battle.',
    },
  ],
};
