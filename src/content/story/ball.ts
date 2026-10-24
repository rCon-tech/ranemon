import { CARL_TAKES_ELVIS } from './elvis';
import type { GameMap, Npc, Stall } from '@/lib/story/world';

/**
 * The Trinity Ball: once B&S are beaten, Trinity is one big party, every night. Fairy lights
 * over Front Square, everyone in black tie and having a great time, and Carl Ryan, a very tall
 * man with a sports bag, selling Blue Ghosts for a tenth of what Vapes charge.
 */

/** Set when you beat B&S and become Champion: Trinity is the Trinity Ball from then on. */
export const BALL_FLAG = 'champion';

/** What a Blue Ghost costs from Carl, against €4,800 in Vapes. */
export const CARL_PRICE = 480;

export const CARL_STALL: Stall = {
  name: 'CARL RYAN',
  stock: [{ item: 'blue-ghost', price: CARL_PRICE }],
};

export const CARL: Npc = {
  look: 'carl',
  face: 'left',
  talk: [
    {
      do: 'say',
      text: 'CARL RYAN: Howya. Remember me from Temple Bar? You went to Vapes instead. No hard feelings.',
    },
    {
      do: 'say',
      text: `CARL RYAN: Blue Ghosts, ice cold, out of the bag. €${CARL_PRICE} each, and don’t ask me where I got them.`,
    },
    { do: 'shop', stall: CARL_STALL },
    { do: 'say', text: 'CARL RYAN: Enjoy the Ball. Mind yourself.' },
  ],
};

/** Set the first time you talk to Carl in a McGrattans. */
export const MET_CARL = 'met:carl';

/**
 * Carl in the corner of every McGrattans, from the very start: the same Blue Ghosts at the same
 * price, for anyone who'd rather not grind. Where he gets them is never said.
 */
export const CARL_PUB: Npc = {
  look: 'carl',
  face: 'down',
  talk: [
    {
      do: 'if',
      flag: MET_CARL,
      then: [
        { do: 'say', text: 'CARL RYAN: Ah, it’s yourself. Keep your voice down.' },
        {
          do: 'say',
          text: 'CARL RYAN: Where am I getting them? A lad knows a lad who knows a van. That’s all you need to know.',
        },
      ],
      else: [
        { do: 'flag', flag: MET_CARL },
        {
          do: 'say',
          text: 'CARL RYAN: Psst. Over here. Don’t look at me, look at your pint.',
        },
        {
          do: 'say',
          text: 'CARL RYAN: Your Ranemon look like they could do with a lift. Blue Ghosts. One each and up they go a level, no battling, no grinding.',
        },
        {
          do: 'say',
          text: `CARL RYAN: €${CARL_PRICE} a can, a tenth of what Vapes charge. Where they came from? They fell off the back of something. Don’t ask.`,
        },
      ],
    },
    // Elvis, his dog, if you're walking him (content/story/elvis.ts).
    CARL_TAKES_ELVIS,
    { do: 'shop', stall: CARL_STALL },
    {
      do: 'say',
      text: 'CARL RYAN: You never saw me. And they won’t take your lot past the next gym leader, so don’t come crying to me.',
    },
  ],
};

/** Michael D, in Trinity once you're Champion, ball or no ball. */
export const HIGGINS: Npc = {
  look: 'higgins',
  face: 'up',
  showIf: BALL_FLAG,
  talk: [
    {
      do: 'say',
      text: 'MICHAEL D: Champion of Ireland! From Newmarket-on-Fergus to Front Square. I’m very proud of you.',
    },
    {
      do: 'if',
      flag: 'beat:bns-rematch',
      then: [],
      else: [
        {
          do: 'say',
          text: 'MICHAEL D: B&S have asked for a rematch, at level 60. They’re in the Long Room whenever you’re ready.',
        },
        { do: 'flag', flag: 'rematch' },
      ],
    },
  ],
};

const say = (text: string): Npc['talk'] => [{ do: 'say', text }];

/** Trinity as the Trinity Ball, for `after` on the Trinity map. */
export const TRINITY_BALL: NonNullable<GameMap['after']> = {
  flag: BALL_FLAG,
  name: 'Trinity Ball',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T######################T',
    'T#FFFFFFFFF6FFFFFFFFFF#T',
    'T#FFFF1FFFF2FFFF3FFFFF#T',
    'T#FFFFFFFFFFFFFFFFFFFF#T',
    'T####FFF#####F#######F#T',
    'T....=..7....=.......=.T',
    '@=====.......=.......=.T',
    'T............=..8....=.T',
    'T..hh...4..==K==...hh=.T',
    'T..hh....5..===....hh=.T',
    'T.....9.........0....=.T',
    'T..S.................=.T',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'scholar',
      face: 'down',
      trainer: 'scholar-1',
      talk: say('SCHOLAR AISLING: No shushing tonight! The Long Room is a dance floor now.'),
    },
    {
      look: 'scholar',
      face: 'down',
      trainer: 'scholar-2',
      talk: say(
        'SCHOLAR RÓNÁN: I’ve had three Blue Ghosts and I can see through time. Brilliant night.',
      ),
    },
    {
      look: 'scholar',
      face: 'down',
      trainer: 'scholar-3',
      talk: say('SCHOLAR MÉABH: Exams? Never heard of them. Is that the headliner starting?'),
    },
    {
      look: 'debs',
      face: 'right',
      talk: say('Best night of my LIFE! Have you seen the queue for the chipper van? Worth it.'),
    },
    HIGGINS,
    { look: 'bns', face: 'down', showIf: 'rematch', trainer: 'bns-rematch' },
    { look: 'alex', face: 'left', trainer: 'trinity-alex', sight: 3 },
    CARL,
    {
      look: 'reveller',
      face: 'right',
      talk: say('Dancing since nine. My feet are gone. Grand, though. GRAND.'),
    },
    {
      look: 'debs',
      face: 'left',
      talk: say('The whole of Ireland is here! Michael D did the Macarena earlier. Iconic.'),
    },
  ],
  signs: ['TRINITY BALL. Tonight and every night. Dress code: black tie, or whatever you won in.'],
  party: {
    // Round Front Square under the Long Room, out from the Campanile to each corner, along the
    // hedges, and twice the length of the Long Room.
    lights: [
      [1.5, 6.2, 12.5, 6.2],
      [14.5, 6.2, 21.5, 6.2],
      [13.5, 9.5, 2, 7.5],
      [13.5, 9.5, 21, 7.5],
      [13.5, 9.5, 2, 12.5],
      [13.5, 9.5, 21, 12.5],
      [13.5, 9.5, 13.5, 6.2],
      [2.5, 9, 2.5, 12.5],
      [21.5, 8, 21.5, 12.5],
      [2.5, 2.2, 21.5, 2.2],
      [2.5, 4.4, 21.5, 4.4],
    ],
    crowd: [
      // The Long Room is the dance floor.
      { x: 3, y: 3, look: 'dancer' },
      { x: 8, y: 4, look: 'tux' },
      { x: 9, y: 2, look: 'debs' },
      { x: 14, y: 4, look: 'reveller' },
      { x: 19, y: 2, look: 'dancer' },
      { x: 19, y: 4, look: 'lad' },
      // And Front Square.
      { x: 9, y: 7, look: 'tux' },
      { x: 10, y: 8, look: 'dancer' },
      { x: 12, y: 11, look: 'reveller' },
      { x: 3, y: 11, look: 'debs' },
      { x: 15, y: 11, look: 'lad' },
      { x: 17, y: 10, look: 'dancer' },
      { x: 18, y: 7, look: 'tux' },
    ],
    lines: [
      'WOOOO! TRINITY BALL!',
      'This is my song! They’re ALL my song!',
      'Has anyone seen my shoe? Doesn’t matter. DANCING.',
      'B&S are on the decks later. Apparently they do a set called “Last Orders”.',
      'I came in my county jersey. Nobody said a word. Best night ever.',
      'Carl Ryan sold me a Blue Ghost and now I can hear colours.',
      'We’re going to the chipper after. And then back in. And then the chipper again.',
      'I love you. I don’t know you. I love you anyway!',
    ],
    balloons: [
      [3, 9],
      [4, 10],
      [19, 9],
      [20, 10],
      [2, 5],
      [10, 5],
      [17, 5],
      [13, 9],
      [3, 12],
    ],
  },
};
