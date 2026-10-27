import type { GameMap, Npc, Step, Trainer } from '@/lib/story/world';

/**
 * Florence Pugh, behind the bar of every W.B Yates, as Dua Lipa is in every McGrattans: she
 * heals your party (`{ do: 'pub' }`) with a line of her own each visit (`PUGH_LINES`).
 *
 * She has Liam Neeson's old job, and a side quest in Britain comes of it. Once you've the Leeds
 * jersey, she asks you to go after him: he's up Big Ben, at the top of the Elizabeth Tower,
 * looking out over London for whoever took his bar. His stunt double is on the stairs. Beat the
 * double, then him, for a few settled pints, a Blue Ghost and his skin (skins.ts).
 *
 * The tower's room is in London, so it's 2D only (`flat`), like everything new.
 */

/** Set when Florence has asked you to find Liam: he and his double are in the tower. */
export const NEESON_START = 'neeson:start';

/** Liam Neeson beaten. */
export const NEESON_DONE = 'neeson:done';

/** Florence only asks once you've the fifth jersey, Leeds's (premier.ts's `plFlag`). */
export const NEESON_GATE = 'pl:leeds';

export const NEESON_DOUBLE = 'neeson-double';
export const NEESON_TRAINER = 'neeson';

const beat = (trainer: string) => `beat:${trainer}`;
const say = (text: string): Step[] => [{ do: 'say', text }];

/** Florence Pugh's lines when she heals your party in a W.B Yates. */
export const PUGH_LINES = [
  'FLORENCE PUGH: Hiya! Sit yourself down there and I’ll sort your lot out. Little women, little men, little Ranemon, all welcome.',
  'FLORENCE PUGH: Don’t worry, darling. They’re all healed. That one’s a film, by the way. Don’t watch it.',
  'FLORENCE PUGH: I’ve had a stew on since seven. Your Ranemon have had three bowls each. They’re fighting fit.',
  'FLORENCE PUGH: Bit of a Midsommar crowd in tonight. Don’t drink anything with flowers in it. Your Ranemon are grand.',
  'FLORENCE PUGH: Black Widow taught me how to fall off things. Pulling pints I taught myself. Go on, they’re healed.',
  'FLORENCE PUGH: There’s a table of eight girls in the corner in sunglasses. Indoors. At night. They never pay, and everyone who comes in nods at them. Anyway! Your Ranemon are healed.',
];

/** What Florence asks of you, the first time you're in once you've the Leeds jersey. */
const FLORENCE_ASKS: Step[] = [
  { do: 'flag', flag: NEESON_START },
  {
    do: 'say',
    text: 'FLORENCE PUGH: Can I ask you a favour? The fella who had this job before me. Liam. Very tall, very serious, from Ballymena. He did not take it well.',
  },
  {
    do: 'say',
    text: 'FLORENCE PUGH: He left this on the till. (A beer mat. On the back, in very neat capitals: I WILL LOOK FOR YOU. I WILL FIND YOU. AND I WILL BEAT YOU IN A RANEMON BATTLE.)',
  },
  {
    do: 'say',
    text: 'FLORENCE PUGH: He’s gone up Big Ben, in London. Says he can see the whole city from there. Would you go up and talk him down? I’d go myself, but the stew.',
  },
];

/** Talking to Florence over the bar: the heal, then her favour, once. */
export const PUGH_TALK: Step[] = [
  { do: 'pub' },
  {
    do: 'if',
    flag: NEESON_START,
    then: [],
    else: [{ do: 'if', flag: NEESON_GATE, then: FLORENCE_ASKS }],
  },
];

/** His stunt double: the image of him, on the stairs, and a lot less serious. */
const DOUBLE: Npc = {
  look: 'neeson',
  face: 'left',
  trainer: NEESON_DOUBLE,
  sight: 4,
  showIf: NEESON_START,
  talk: say(
    'STUNT DOUBLE: Thirty years I’ve been falling off things for that man. He’s done his own pint pulling, mind. Never let me near it.',
  ),
};

/** Liam, at the top of the tower, looking out over London. He won't turn round till you're past the double. */
const LIAM: Npc = {
  look: 'neeson',
  face: 'down',
  trainer: NEESON_TRAINER,
  readyIf: beat(NEESON_DOUBLE),
  showIf: NEESON_START,
  talk: [
    {
      do: 'if',
      flag: NEESON_DONE,
      then: say(
        'LIAM NEESON: I’m going home to Ballymena tomorrow. I’ve said that every day for a week.',
      ),
      else: say(
        'LIAM NEESON: (He doesn’t turn round.) There’s a man on the stairs who looks just like me. Get past him first.',
      ),
    },
  ],
};

/** For beating Liam: he finds who took his bar, settled pints and a Blue Ghost, and his skin. */
const NEESON_REWARD: Step[] = [
  { do: 'flag', flag: NEESON_DONE },
  {
    do: 'say',
    text: 'LIAM NEESON: (He looks out over London for a long time.) She pours a better pint than me. Florence. I watched her through the telescope. For a week.',
  },
  {
    do: 'say',
    text: 'LIAM NEESON: I came up here to find whoever took my bar. I found them. It was me. I don’t do small talk, and behind a bar, that’s the whole job.',
  },
  {
    do: 'say',
    text: 'LIAM NEESON: Take these. Settled for exactly 119.5 seconds. I won’t be pouring any more.',
  },
  { do: 'give', item: 'settled-pint', count: 3 },
  { do: 'say', text: 'LIAM NEESON: And this. Don’t tell Carl Ryan where you got it.' },
  { do: 'give', item: 'blue-ghost', count: 1 },
  {
    do: 'say',
    text: 'LIAM NEESON: Tell Florence she’s good. Don’t tell her I said so.',
  },
];

export const NEESON_TRAINERS: Trainer[] = [
  {
    id: NEESON_DOUBLE,
    name: 'Stunt Double',
    uk: true,
    team: [
      ['jabmon', 22],
      ['jogduo', 23],
    ],
    ai: 'normal',
    prize: 23 * 30,
    before:
      'STUNT DOUBLE: (He looks exactly like Liam Neeson. He is not Liam Neeson.) Nobody goes up to him. I take the hits, that’s the job. Go on, then.',
    after: 'STUNT DOUBLE: Grand. I’ve had worse. I’ve been thrown off this tower twice. Go on up.',
  },
  {
    id: NEESON_TRAINER,
    name: 'Liam Neeson',
    uk: true,
    team: [
      ['golpeak', 24],
      ['jogduo', 25],
      ['killemon', 25],
      ['jabmon', 26],
      ['gibbsmon', 27],
    ],
    ai: 'hard',
    prize: 2000,
    before:
      'LIAM NEESON: I don’t know who you are. … No. I do. You came into W.B Yates the week they gave my bar away. I have a very particular set of skills. I’ll show you every one of them.',
    after: 'LIAM NEESON: (A long pause.) Good. That was good.',
    line: 'LIAM NEESON: Go.',
    reward: NEESON_REWARD,
  },
];

/**
 * Big Ben: the clock room at the top of the Elizabeth Tower, with the backs of the clock faces
 * along the wall, lit from outside. Liam (1) looks out at the top, his double (2) is on
 * the way up, and the man in hi-vis (3) who looks after the place is by the door.
 */
export function bigBenRoom(keeper: Npc): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  return {
    name: 'Big Ben',
    rows: [
      'WWWWWWWWWWWW',
      'WOWOOOOOOWOW',
      'WNkkk1kkkkNW',
      'WkkkkkkkkkkW',
      'WkkkkkkkkkkW',
      'WkkkkkkkkkkW',
      'Wkkkkkk2kkkW',
      'WkkkkkkkkkkW',
      'WN3kkkkkkkNW',
      'Wkkkkk@kkkkW',
      'WWWWWWEWWWWW',
    ],
    npcs: [LIAM, DOUBLE, keeper],
    things: {
      O: 'A clock face, from behind. All of London is out there, the wrong way round. There’s a nose print on the glass at about Liam Neeson height.',
      N: 'A pot plant. Somebody has stuck a beer mat in the soil: I WILL FIND YOU.',
    },
  };
}
