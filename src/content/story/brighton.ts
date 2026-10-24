import { BRIGHTON_DONE, MATCH_DONE } from './enda';
import { interiorId } from './interiors';
import { homeward } from './station';
import type { GameMap, Npc, Step, Trainer, Yates } from '@/lib/story/world';

/**
 * Brighton, England, by the Sail & Rail from Connolly Station once you've said yes to Enda in
 * Kildare (enda.ts). Enda, Ollie and Kill meet you off the train. First the match at the Amex,
 * Brighton against Crystal Palace, with fans in the stands who want a battle; then the arcade
 * on the seafront, whose door stays shut until the match is over, with three gamers on the way
 * to the Arcade King at the back. Beat him and Enda gives you a Friendship Bracelet.
 */

/** The Amex is the first landmark door, the Royal Pavilion the second, the arcade the third. */
export const AMEX_ID = interiorId('brighton', 'L', 0);
export const ARCADE_ID = interiorId('brighton', 'L', 2);

/** The boss, at the back of the arcade. */
export const ARCADE_KING = 'arcade-king';

/** Beating the Arcade King: Enda's Friendship Bracelet, and the happiest day of his life. */
export const KING_REWARD: Step[] = [
  {
    do: 'say',
    text: 'THE ARCADE KING: Thirty-odd years at the top of every table. Gone. Ah well. Every king has his day. That was mine. Today’s is yours.',
  },
  {
    do: 'say',
    text: 'ENDA: THE ARCADE KING IS BEATEN! (Enda hugs the Arcade King. Now they’re best friends too.)',
  },
  {
    do: 'say',
    text: 'ENDA: I made these on the ferry. One for Ollie, one for Kill, one for the King now, and one for my newest best friend. You!',
  },
  { do: 'give', item: 'friendship-bracelet' },
  {
    do: 'say',
    text: 'Give the Friendship Bracelet to any Ranemon to hold, from the BAG: its Defense goes up 20% in every battle.',
  },
  {
    do: 'say',
    text: 'OLLIE: Formidable! A Brighton win AND the King. Simo is never going to believe this.',
  },
  {
    do: 'say',
    text: 'KILL: Best day ever. I’m still moving to Africa, mind. But I’ll be back for the next one.',
  },
  { do: 'flag', flag: BRIGHTON_DONE },
];
/** Everyone you can battle in Brighton, outside and in, in the order you're likely to meet them. */
export const BRIGHTON_TRAINERS: Trainer[] = [
  {
    id: 'brighton-hen',
    name: 'Hen Party Jess',
    team: [
      ['jammon', 44],
      ['hugomon', 45],
    ],
    ai: 'easy',
    prize: 900,
    before: 'HEN PARTY JESS: You’re not the stripper. Shame. You’ll have to battle us instead!',
    after: 'HEN PARTY JESS: Ah, here. Somebody get the bride another drink.',
  },
  {
    id: 'brighton-deckchair',
    name: 'Deckchair Dennis',
    team: [
      ['steadmon', 45],
      ['robinmon', 46],
    ],
    ai: 'easy',
    prize: 920,
    before:
      'DECKCHAIR DENNIS: Forty years I’ve had this spot on the front. Nobody takes Dennis’s spot.',
    after: 'DECKCHAIR DENNIS: Mind my chips. The gulls are watching.',
  },
  {
    id: 'amex-fan-callum',
    name: 'Seagulls Fan Callum',
    team: [
      ['simomon', 46],
      ['vinnimon', 47],
    ],
    ai: 'normal',
    prize: 940,
    before: 'SEAGULLS FAN CALLUM: Up the Albion! You’re in my seat. Battle you for it!',
    after: 'SEAGULLS FAN CALLUM: Fair enough. I’ll stand. Everyone stands anyway.',
  },
  {
    id: 'amex-fan-pat',
    name: 'Season Ticket Pat',
    team: [
      ['lorcamon', 46],
      ['conemon', 47],
      ['skehemon', 47],
    ],
    ai: 'normal',
    prize: 940,
    before:
      'SEASON TICKET PAT: Thirty seasons, home and away. I’ve seen us in the fourth division and I’ve seen us in Europe. Battle!',
    after: 'SEASON TICKET PAT: Still a better afternoon than Gillingham away in 1997.',
  },
  {
    id: 'amex-palace',
    name: 'Palace Fan Gaz',
    team: [
      ['owemon', 48],
      ['boydemon', 48],
      ['gibbsmon', 49],
    ],
    ai: 'normal',
    prize: 980,
    before:
      'PALACE FAN GAZ: That was a FOUL. That was a foul in the ninetieth minute! Someone’s paying for that, and it’s you!',
    after: 'PALACE FAN GAZ: Long way back up the M23. Long, long way.',
  },
  {
    id: 'arcade-kayleigh',
    name: 'Claw Machine Kayleigh',
    team: [
      ['oismon', 48],
      ['crampemon', 49],
    ],
    ai: 'normal',
    prize: 980,
    before:
      'CLAW MACHINE KAYLEIGH: Ninety quid and I haven’t won a single teddy. I’m in the mood to win SOMETHING.',
    after: 'CLAW MACHINE KAYLEIGH: The claw is rigged. And so, apparently, are you.',
  },
  {
    id: 'arcade-derek',
    name: '2p Falls Derek',
    team: [
      ['paulimon', 49],
      ['thilomon', 49],
      ['carlmon', 50],
    ],
    ai: 'normal',
    prize: 1000,
    before:
      'TWO P FALLS DEREK: That ledge has been about to tip for six hours. I can feel it. Don’t you DARE nudge it.',
    after: 'TWO P FALLS DEREK: …And now it tips. While I’m looking at you. Typical.',
  },
  {
    id: 'arcade-hannah',
    name: 'High Score Hannah',
    team: [
      ['killemon', 49],
      ['jammon', 49],
      ['olliemon', 50],
    ],
    ai: 'hard',
    prize: 1020,
    before:
      'HIGH SCORE HANNAH: Second place on every machine in here. Every single one. Behind HIM. Beat me first.',
    after: 'HIGH SCORE HANNAH: Go on, then. Knock the King off his throne. Please.',
  },
  {
    id: ARCADE_KING,
    name: 'The Arcade King',
    team: [
      ['gibbsmon', 51],
      ['crampemon', 52],
      ['steadmon', 52],
      ['thilomon', 53],
      ['enda', 54],
    ],
    ai: 'hard',
    prize: 5000,
    before:
      'THE ARCADE KING: Top score on every machine on this seafront since 1987. Pac-Man. Street Fighter. Dance Dance Revolution. Nobody beats the King.',
    after: 'THE ARCADE KING: …GAME OVER. For me. Insert coin to continue? No. No, I’m done.',
    line: 'THE ARCADE KING: Continue? 10… 9… 8…',
    reward: KING_REWARD,
  },
];

/**
 * One of the three of them: what they say before the match, before the King, and after. In the
 * arcade, which only opens after the match, there's no before the match.
 */
function pal(beforeMatch: string | null, beforeKing: string, after: string): Step[] {
  const before: Step = { do: 'say', text: beforeKing };
  return [
    {
      do: 'if',
      flag: BRIGHTON_DONE,
      then: [{ do: 'say', text: after }],
      else: [
        beforeMatch === null
          ? before
          : {
              do: 'if',
              flag: MATCH_DONE,
              then: [before],
              else: [{ do: 'say', text: beforeMatch }],
            },
      ],
    },
  ];
}

// ---------- the three of them, on the seafront ----------

const ENDA_OUT = pal(
  'ENDA: BEST FRIEND! You made it! Brighton! Look at the sea! Look at the seagulls! I’ve made friends with three of them already. The match is at the Amex, up the road on the right. COME ON!',
  'ENDA: What a match! Now: the arcade, down by the pier! Last one there is still my best friend, obviously.',
  'ENDA: Best. Day. Ever.',
);
const OLLIE_OUT = pal(
  'OLLIE: Bonjour! Enda said you were coming. Enda says everyone is coming. This time it’s actually true.',
  'OLLIE: The arcade is by the pier. I have forty pounds in two-pence coins. That is a lot of coins.',
  'OLLIE: Formidable, the whole trip. Formidable.',
);
const KILL_OUT = pal(
  'KILL: Story. Brighton, eh? Lovely spot. I’ve a terrible feeling Brighton are going to lose today. I can feel it in my bones.',
  'KILL: They won! My bones were wrong. My bones are never wrong. Maybe I’m not moving to Africa after all. No, I am.',
  'KILL: Some trip. I’ll be telling them about this in Africa.',
);

// ---------- the match, at the Amex ----------

/** The match itself: kick-off to full time, from the front row. */
const MATCH: Step[] = [
  {
    do: 'say',
    text: 'PEEEEP! Kick-off at the Amex! Brighton in blue and white stripes, Crystal Palace in red and blue.',
  },
  { do: 'say', text: 'OLLIE: Allez les Seagulls! Allez!' },
  {
    do: 'say',
    text: 'Twenty minutes in, Palace score. The away end goes wild. KILL: Told you. My bones.',
  },
  {
    do: 'say',
    text: '(At half time, Enda disappears. You spot him in the away end, singing their songs with his arm round a man in a Palace shirt. Best friends.)',
  },
  {
    do: 'ask',
    text: 'Second half. The Amex starts singing “Sussex by the Sea”. Join in?',
    yes: [
      {
        do: 'say',
        text: 'You don’t know the words. Nobody minds. Thirty thousand people sing it with you, and Brighton EQUALISE!',
      },
    ],
    no: [
      {
        do: 'say',
        text: 'You hum along instead. Enda sings loud enough for the both of you, and Brighton EQUALISE!',
      },
    ],
  },
  {
    do: 'say',
    text: 'Ninetieth minute. A cross from the left, a header… BRIGHTON SCORE! 2–1! The whole stand jumps. Enda is hugging a steward.',
  },
  { do: 'say', text: 'PEEEEP! FULL TIME. Brighton 2, Crystal Palace 1.' },
  {
    do: 'say',
    text: 'ENDA: BEST. MATCH. EVER! Now, the arcade on the seafront! Come on, come on, come on!',
  },
  { do: 'flag', flag: MATCH_DONE },
];

const ENDA_AT_MATCH: Step[] = [
  {
    do: 'say',
    text: 'ENDA: Front row! I know everyone in this row now. That’s Callum, that’s Pat, they’re my best friends.',
  },
  {
    do: 'ask',
    text: 'ENDA: It’s nearly kick-off! Sit down with us for the match?',
    yes: MATCH,
    no: [
      {
        do: 'say',
        text: 'ENDA: Grand, go and get a pie. They won’t start without us. Well. They will. Be quick!',
      },
    ],
  },
];

function amexRoom(): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  return {
    name: 'The Amex',
    rows: [
      'WWWWWWWWWWWWWW',
      'WnnnnnnnnnnnnW',
      'WxxxxxxxxxxxxW',
      'WxxxxxxxxxxxxW',
      'WxxxxxxxxxxxxW',
      'WxxxxxxxxxxxxW',
      'WFFFF123FFFFFW',
      'WnnnFnnnnnFnnW',
      'WnnnFnnnnnFnnW',
      'W4FFFFFFFFFF5W',
      'WFF6FFF@FFFFFW',
      'WWWWWWWEWWWWWW',
    ],
    npcs: [
      { look: 'enda', face: 'up', hideIf: MATCH_DONE, talk: ENDA_AT_MATCH },
      {
        look: 'ollie',
        face: 'up',
        hideIf: MATCH_DONE,
        talk: [
          {
            do: 'say',
            text: 'OLLIE: Sit with Enda, he has the best seat. He always gets the best seat. Everyone gives it to him.',
          },
        ],
      },
      {
        look: 'kill',
        face: 'up',
        hideIf: MATCH_DONE,
        talk: [
          { do: 'say', text: 'KILL: Brighton are going to lose. I can feel it. Pass me a pie.' },
        ],
      },
      { look: 'fan', face: 'right', trainer: 'amex-fan-callum', sight: 4 },
      { look: 'fan', face: 'left', trainer: 'amex-fan-pat', sight: 3 },
      // Only once the match is over, and right by the way out: he's not leaving without a win.
      { look: 'palace', face: 'right', showIf: MATCH_DONE, trainer: 'amex-palace', sight: 4 },
    ],
    things: {
      n: 'Blue seats, row after row of them. Nobody is sitting in any of them. Everyone is standing.',
      x: 'The pitch, cut in perfect stripes. A steward shakes his head at you: no walking on the grass.',
    },
  };
}

// ---------- the arcade ----------

function arcadeRoom(): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  const gamer = (id: string, face: Npc['face'], sight: number): Npc => ({
    look: 'gamer',
    face,
    trainer: id,
    sight,
  });
  return {
    name: 'The Arcade',
    rows: [
      'WWWWWWWWWWWWWW',
      'WmmmmmmmmmmmmW',
      'WNFFFF1FFFFFNW',
      'WFmmFFFFFFmmFW',
      'WF6FFFFFFFF7FW',
      'WmmmFmmmmFmmmW',
      'WFFFFFFFFFFFFW',
      'WFmmF5FFFFmmFW',
      'W2FF3F@FFFF4FW',
      'WWWWWWEWWWWWWW',
    ],
    npcs: [
      {
        look: 'king',
        face: 'down',
        trainer: ARCADE_KING,
        talk: [
          {
            do: 'say',
            text: 'THE ARCADE KING: Second place. On every machine. I can live with that. Probably.',
          },
        ],
      },
      {
        look: 'enda',
        face: 'up',
        talk: pal(
          null,
          'ENDA: The Arcade King, up at the back! Top score on every machine since 1987. Let’s go and make him our best friend. By beating him.',
          'ENDA: I’ve put my name on every high score table in here. It just says BEST FRIENDS. They let me.',
        ),
      },
      {
        look: 'ollie',
        face: 'up',
        talk: pal(
          null,
          'OLLIE: I have put forty pounds into the claw machine. I have won nothing. Simo is going to kill me.',
          'OLLIE: I won a teddy! On the very last go! It is a seagull. I shall call him Simo.',
        ),
      },
      {
        look: 'kill',
        face: 'up',
        talk: pal(
          null,
          'KILL: I won a tiny plastic lion on the 2p machine. A LION. It’s a sign. Africa. Any day now.',
          'KILL: The lion is coming to Africa with me. Obviously.',
        ),
      },
      gamer('arcade-kayleigh', 'right', 4),
      gamer('arcade-derek', 'right', 3),
      gamer('arcade-hannah', 'left', 3),
    ],
    things: {
      m: 'An arcade machine, flashing INSERT COIN. Every high score on it says KING.',
      N: 'A plastic palm tree, wrapped in fairy lights.',
    },
  };
}

// ---------- the seafront ----------

/**
 * Brighton's pub is a W.B Yates, like every pub in England: run by Fionnuala from Galway, who
 * came over for a hen party in 1994 and never went home.
 */
const BRIGHTON_YATES: Yates = {
  owner: {
    look: 'fionnuala',
    face: 'down',
    talk: [
      {
        do: 'say',
        text: 'FIONNUALA: Fionnuala, from Galway. I came over for a hen party in 1994. The hen went home. I didn’t.',
      },
      {
        do: 'say',
        text: 'FIONNUALA: Liam does the bar. I do the sea views. Mind the seagulls on the terrace, they’ll have the chips out of your hand.',
      },
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, and a stick of Brighton rock with GALWAY written all the way through it.',
    U: 'A table by the window, looking out at the pier. A seagull is looking back in.',
    J: 'A fire, and over it a photo of a 1994 hen party on the pier. Everyone in it is wearing a sash.',
  },
};

export const BRIGHTON: GameMap = {
  id: 'brighton',
  name: 'Brighton, England',
  county: 9,
  // Regency terraces: slate roofs on every building, as in Greystones.
  slate: true,
  terraces: 'english',
  yates: BRIGHTON_YATES,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^vv^^^^vv^^^^^^^vT',
    'T######vv#P##vv^^^^^^^vT',
    'T4vv123Svvvvvvv###L###vT',
    'T@vvvvvvvvvvvvvvvvvvvvvT',
    'TaaaaaaacaaaaaaaaaacaaaT',
    'Tvv^^^^vv^^^^^vv,,,,,,vT',
    'Tvv#M##vv##L##vv,,,,,,vT',
    'Tvvvvvvvvvvvvvvv,,,,,,vT',
    'Tvv^^^^^^^vvvvvSvvvvvvvT',
    'Tvv###L###vvvvvvvvvvv6vT',
    'Tvvvvvvvvvvv5vvvvvvvvvvT',
    'TddddddddddddSdddddddddT',
    '~~~~~~~~~~~~B~~~~~~~~~~~',
    '~~~~~~~~~~~BBB~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  wild: {
    min: 44,
    max: 50,
    table: [
      ['steadmon', 20],
      ['olliemon', 20],
      ['killemon', 20],
      ['enda', 15],
      ['crampemon', 15],
      ['carlmon', 10],
    ],
  },
  npcs: [
    { look: 'enda', face: 'down', hideIf: MATCH_DONE, talk: ENDA_OUT },
    { look: 'ollie', face: 'down', hideIf: MATCH_DONE, talk: OLLIE_OUT },
    { look: 'kill', face: 'down', hideIf: MATCH_DONE, talk: KILL_OUT },
    { look: 'sailor', face: 'right', talk: homeward('brighton') },
    { look: 'hen', face: 'down', trainer: 'brighton-hen', sight: 3 },
    { look: 'oldman', face: 'left', trainer: 'brighton-deckchair', sight: 4 },
  ],
  signs: [
    'BRIGHTON STATION. Trains to London Victoria, and the Sail & Rail to Dublin Connolly.',
    'THE LEVEL. A park full of long grass, frisbees and wild Ranemon.',
    'BRIGHTON PALACE PIER. Doughnuts, deckchairs and the sea. Mind your chips: the gulls are bold.',
  ],
  landmarks: [
    [
      {
        do: 'say',
        text: 'THE AMEX. Home of Brighton & Hove Albion. Match day: thirty thousand people in blue and white stripes.',
      },
    ],
    [
      {
        do: 'say',
        text: 'THE ROYAL PAVILION. A palace built to look like it’s in India, by a king who loved a party. Enda says the king would have been his best friend.',
      },
    ],
    [
      {
        do: 'say',
        text: 'THE ARCADE. Bleeps, bloops and the crash of two-pence coins. The Arcade King holds court at the back.',
      },
    ],
  ],
  landmarkLocks: {
    2: {
      flag: MATCH_DONE,
      locked:
        'ENDA: Not yet! Match first, THEN the arcade. That’s the plan. The Amex is up the road on the right!',
      opened: 'ENDA: ARCADE TIME! Ollie, Kill, get the coins out!',
    },
  },
  landmarkRooms: {
    0: amexRoom(),
    2: arcadeRoom(),
  },
};
