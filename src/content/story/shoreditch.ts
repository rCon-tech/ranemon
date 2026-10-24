import { UK_STARTER } from './kneecap';
import type { ItemId } from '@/lib/story/items';
import type { GameMap, Npc, Step, Trainer } from '@/lib/story/world';

/**
 * Shoreditch & Hackney (docs/london-ranedex.md), the first of London's own areas: the London
 * Overground from Liverpool Street, long grass full of London Ranemon at Lv5 to 12, and the five
 * things Wickmon can be given. 2D only, like everywhere in Britain.
 */

export const SHOREDITCH_ID = 'shoreditch';

/** Where the Overground leaves you: on the platform, at the top left. */
export const SHOREDITCH_ARRIVAL = { map: SHOREDITCH_ID, x: 1, y: 3, face: 'right' } as const;

/** The Overground conductor in London's hub, and where he leaves you back there. */
export const OVERGROUND: Npc = {
  look: 'conductor',
  face: 'down',
  talk: [
    {
      do: 'if',
      flag: UK_STARTER,
      then: [
        {
          do: 'ask',
          text: 'OVERGROUND: The Overground to Shoreditch, Dalston and Hackney Wick. Hop on?',
          yes: [
            {
              do: 'say',
              text: 'Two stops, and everybody on the train has a tote bag. You’re in Shoreditch.',
            },
            { do: 'travel', ...SHOREDITCH_ARRIVAL },
          ],
          no: [{ do: 'say', text: 'OVERGROUND: Every few minutes. Nobody knows the timetable.' }],
        },
      ],
      else: [
        {
          do: 'say',
          text: 'OVERGROUND: East London’s no place to be without a Ranemon, mate. Próvaí’s in W.B Yates.',
        },
      ],
    },
  ],
};

const say = (text: string): Step[] => [{ do: 'say', text }];

/** Someone who hands you an item once, and says something else after. */
function giver(
  look: Npc['look'],
  face: Npc['face'],
  item: ItemId,
  first: string,
  after: string,
): Npc {
  const flag = `got:${item}`;
  return {
    look,
    face,
    talk: [
      {
        do: 'if',
        flag,
        then: say(after),
        else: [
          { do: 'say', text: first },
          { do: 'give', item },
          { do: 'flag', flag },
        ],
      },
    ],
  };
}

export const SHOREDITCH: GameMap = {
  id: SHOREDITCH_ID,
  name: 'Shoreditch & Hackney, London',
  county: 9,
  flat: true,
  terraces: 'english',
  uk: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^^^^^^^^^^^^^^^T',
    'T####M#######################T',
    'T@1vvvvvvvvvvvvvvvvv5vvvvvvvvT',
    'TvvvvSvvvvvvvv4vvvvvvvvvvvvvvT',
    'TaaaaaaaaaaaaaaaaaaaaaaaaaaaaT',
    'TaacaaaaaaaaaaaaaaaaaaaacaaaaT',
    'TvvvvvvvvvvvvvvvvvvvvvvvvvvvvT',
    'Tv,,,,,,,,v2vvvv,,,,,,,,,,,,vT',
    'Tv,,,,,,,,vvvvv3,,,,,,,,,,,,vT',
    'Tv,,,,,,,,vvvvvv,,,,,,,,,,,,vT',
    'Tv,,,,7,,,vvvvvv,,,,,8,,,,,,vT',
    'TvvvvvvvvvvvvvvvvvvvvvvvvvvvvT',
    'T~~~~~~~~~~BB~~~~~~~~~~~~~~~~T',
    'TvvvvvvvvvvBBvvvvvvvvvvvvvvvvT',
    'Tvvvv6vvvvvvvvvvvv9vvvvvvSvvvT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  wild: {
    min: 5,
    max: 12,
    table: [
      ['oystermon', 14],
      ['fleamon', 12],
      ['oatmon', 12],
      ['wickmon', 11],
      ['seedmon', 10],
      ['decksmon', 10],
      ['jabmon', 10],
      ['bagelmon', 10],
      ['bunchmon', 10],
      // One in a hundred: chained to a doorway somewhere in Spitalfields.
      ['aerodactivist', 1],
    ],
  },
  npcs: [
    {
      look: 'conductor',
      face: 'left',
      talk: [
        {
          do: 'ask',
          text: 'OVERGROUND: Back to Liverpool Street?',
          yes: [
            { do: 'say', text: 'Past the Boxpark and a great many cranes.' },
            { do: 'travel', map: 'london', x: 20, y: 3, face: 'down' },
          ],
          no: say('OVERGROUND: Mind the closing doors. They don’t mind you.'),
        },
      ],
    },
    {
      look: 'trainer',
      face: 'down',
      trainer: 'shoreditch-raver',
      sight: 3,
      talk: say('RAVER: Dalston, then the afterparty, then the after-afterparty. It’s Tuesday.'),
    },
    {
      look: 'trainer',
      face: 'left',
      trainer: 'shoreditch-founder',
      sight: 3,
      talk: say('FOUNDER: We’re pre-revenue. And pre-product. But very post-vibe.'),
    },
    giver(
      'barman',
      'down',
      'espresso-tamper',
      'BARISTA: You want a caramel latte? No. I’m not doing that. Here, have this tamper instead, I’ve got a new one. It weighs exactly 58 grams.',
      'BARISTA: Oat, flat white, no sugar. That’s the only order.',
    ),
    giver(
      'local',
      'up',
      'spareroom-listing',
      'FLATMATE: (Pinning a listing to the Tesco Express noticeboard.) Box room in Hackney Wick, £1,100. Bills not included. Window not included. Take one, there’s loads.',
      'FLATMATE: Nine people have come to see the room. One of them was a fox.',
    ),
    giver(
      'oldman',
      'right',
      'disposable-vape',
      'CANAL BOATER: Somebody’s put a vape in my bin again. Mango ice. Go on, you have it, I’m not having it on the boat.',
      'CANAL BOATER: Forty years on the Lea. Never seen it this busy. Never seen so many tote bags.',
    ),
    {
      look: 'trainer',
      face: 'right',
      trainer: 'shoreditch-reseller',
      sight: 3,
      talk: say('RESELLER: That jacket? Vintage. Archive. £85. No offers.'),
    },
    {
      look: 'trainer',
      face: 'left',
      trainer: 'shoreditch-boxer',
      sight: 3,
      talk: say('BOXER: Bethnal Green gym, 6am, every day. Hands up.'),
    },
    {
      look: 'local',
      face: 'up',
      trainer: 'shoreditch-florist',
      sight: 2,
      talk: say(
        'FLOWER SELLER: Three for a tenner! Three for a TENNER! Four for a tenner after two!',
      ),
    },
  ],
  signs: [
    'SHOREDITCH HIGH STREET. A Boxpark, a cereal café and eleven barbers. Dalston and Hackney Wick are down past the grass.',
    'HACKNEY WICK. Warehouses, a canal, and a lot of people living in them. Mind the bikes on the towpath.',
  ],
};

/** The trainers of Shoreditch & Hackney: London Ranemon at Lv8 to 12. */
export const SHOREDITCH_TRAINERS: Trainer[] = [
  {
    id: 'shoreditch-raver',
    name: 'Raver Ffion',
    uk: true,
    team: [
      ['decksmon', 10],
      ['wickmon', 11],
    ],
    ai: 'normal',
    prize: 220,
    before: 'RAVER FFION: Is this the queue for the afterparty? Doesn’t matter. Battle!',
    after: 'RAVER FFION: Fine. You’re on the list. Take my wristband, I’m never going home anyway.',
    reward: [
      { do: 'give', item: 'afterparty-wristband' },
      {
        do: 'say',
        text: 'She snaps off her wristband and puts it on your wrist. It’s still warm.',
      },
    ],
  },
  {
    id: 'shoreditch-founder',
    name: 'Founder Jasper',
    uk: true,
    team: [
      ['seedmon', 10],
      ['oystermon', 11],
    ],
    ai: 'normal',
    prize: 400,
    before: 'FOUNDER JASPER: Let me pitch you. It’s like Uber, but for battling. Shall we disrupt?',
    after: 'FOUNDER JASPER: OK. We’re pivoting.',
    reward: [
      {
        do: 'say',
        text: 'FOUNDER JASPER: Have this from the office, I’ve lost the seed phrase anyway. It might have a million in it. It might not.',
      },
      { do: 'give', item: 'hardware-wallet' },
    ],
  },
  {
    id: 'shoreditch-reseller',
    name: 'Reseller Tilly',
    uk: true,
    team: [
      ['oatmon', 9],
      ['fleamon', 12],
    ],
    ai: 'normal',
    prize: 240,
    before: 'RESELLER TILLY: You’ve got a good look. I could sell you for £85. Battle!',
    after: 'RESELLER TILLY: Mint condition, still. I’ll list it.',
  },
  {
    id: 'shoreditch-boxer',
    name: 'Boxer Kemi',
    uk: true,
    team: [
      ['speedmon', 10],
      ['jabmon', 12],
    ],
    ai: 'normal',
    prize: 240,
    before: 'BOXER KEMI: Gloves on. Ding ding.',
    after: 'BOXER KEMI: Good hands. Come down the gym some morning. 6am.',
  },
  {
    id: 'shoreditch-florist',
    name: 'Flower Seller Del',
    uk: true,
    team: [
      ['bagelmon', 9],
      ['bunchmon', 11],
    ],
    ai: 'normal',
    prize: 220,
    before: 'FLOWER SELLER DEL: Not buying? Then you’re battling. Three for a tenner!',
    after: 'FLOWER SELLER DEL: Go on, take the last of the sunflowers. They’re free after four.',
  },
];
