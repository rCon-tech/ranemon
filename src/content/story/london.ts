import { interiorId } from './interiors';
import { AGREEMENT, CHAMPION, FIXTURES, LANDED, UK_STARTER } from './kneecap';
import { FORECOURT } from './palace';
import { KINGS_CROSS_ROOM } from './premier';
import { OVERGROUND, SHOREDITCH_TRAINERS } from './shoreditch';
import { homeward } from './station';
import type { GameMap, Npc, Step, Trainer, Yates } from '@/lib/story/world';

/**
 * The London expansion, the first part (docs/london-expansion.md): Dublin Airport, the flight
 * to London Stansted, the border, where your Ranemon are sent home because the Good Friday
 * Agreement doesn't cover them, and London itself, where DJ Próvaí gives you a UK Ranemon in
 * the back room of W.B Yates. The Premier League and the palace come later.
 *
 * Every place in Britain is 2D only (`flat`), and `uk`: wild Ranemon are UK forms, the pubs are
 * W.B Yates and the Lime doesn't cross the sea.
 */

/** Dublin Airport's terminal, and Stansted's arrivals hall: each the first landmark door. */
export const TERMINAL_ID = interiorId('airport', 'L', 0);
export const ARRIVALS_ID = interiorId('stansted', 'L', 0);

/** Where you wake after a blackout once you've crossed, until you next visit a pub. */
const STANSTED_PUB = { map: ARRIVALS_ID, x: 2, y: 4 };
const AIRPORT_PUB = { map: 'airport', x: 3, y: 6 };

/** The level of Próvaí's UK Ranemon. */
export const UK_LEVEL = 5;

// ---------- the flight, and the border ----------

/** Landing at Stansted for the first time: the border, Ollie's parents' call, and London. */
const FIRST_LANDING: Step[] = [
  {
    do: 'say',
    text: 'ARRIVALS. A queue that goes back to the plane. It moves one step every few seconds. Everybody in it has an opinion.',
  },
  {
    do: 'say',
    text: 'BORDER FORCE: Next. Irish passport? Common Travel Area. In you come.',
  },
  { do: 'say', text: 'BORDER FORCE: (He looks past you, at your Ranemon.) Them, however.' },
  {
    do: 'say',
    text: 'BORDER FORCE: The Good Friday Agreement covers people, sir. It does not cover Ranemon. There’s no Common Travel Area for Ranemon.',
  },
  {
    do: 'say',
    text: 'BORDER FORCE: We haven’t actually decided what Ranemon ARE. Livestock, firearms or a band. Until we do, they go back on the plane.',
  },
  {
    do: 'say',
    text: 'BORDER FORCE: That goes for the ones in your Group Chat as well. We checked the Group Chat.',
  },
  { do: 'border', pub: STANSTED_PUB },
  {
    do: 'say',
    text: 'Your whole party is walked back up the steps of the plane. On the top step, your lead Ranemon turns round and looks at you.',
  },
  { do: 'say', text: '♪ Ring ring! It’s Ollie’s parents.' },
  {
    do: 'say',
    text: 'MADAME: Allô? Ollie told us everything. Ze English, pff. Typical.',
  },
  {
    do: 'say',
    text: 'MONSIEUR: Do not worry about your Ranemon. We pay for everything. Zey will stay on ze farm of ze President, in Clare. Very good air. Very good grass.',
  },
  { do: 'say', text: 'MADAME: We will send photos. Go and save ze musicians. Bisous!' },
  {
    do: 'say',
    text: 'You change your money at the bureau, at a terrible rate. Próvaí said to get the Stansted Express into London.',
  },
  { do: 'flag', flag: LANDED },
];

/** Every landing after the first: whoever was waiting on this side is yours again. */
const LANDING_AGAIN: Step[] = [
  {
    do: 'say',
    text: 'BORDER FORCE: You again. Ranemon off, Ranemon on. Same as last time.',
  },
  { do: 'border', pub: STANSTED_PUB },
  { do: 'say', text: 'Your Ranemon from this side of the sea are waiting for you at arrivals.' },
];

/** Once the Good Saturday Agreement is signed, your Ranemon go where you go. */
const AGREED: Step[] = [
  {
    do: 'say',
    text: 'BORDER FORCE: Ranemon? Good Saturday Agreement. Common Travel Area. In you all come. (He doesn’t look happy about it.)',
  },
];

/** The Ryanair flight from Dublin to Stansted. */
export const FLIGHT: Step[] = [
  {
    do: 'say',
    text: 'You squeeze into 31E. The trolley comes round: a tube of Pringles is €6. The man in 31F is asleep on you before take-off.',
  },
  {
    do: 'say',
    text: '♪ Da-da-da-DAAA! “Another on-time arrival with Ryanair!” It was forty minutes late.',
  },
  { do: 'travel', map: ARRIVALS_ID, x: 2, y: 4, face: 'up' },
  {
    do: 'if',
    flag: LANDED,
    then: [{ do: 'if', flag: AGREEMENT, then: AGREED, else: LANDING_AGAIN }],
    else: FIRST_LANDING,
  },
];

/** The flight home: your Ranemon in Ireland are yours again, and the UK lot wait in London. */
const FLIGHT_HOME: Step[] = [
  {
    do: 'if',
    flag: AGREEMENT,
    then: [
      {
        do: 'say',
        text: 'Your whole party boards with you. The Good Saturday Agreement covers the lot of them.',
      },
    ],
    else: [
      {
        do: 'say',
        text: 'Your UK Ranemon can’t come either. They’ll wait for you on this side, minded by Próvaí’s cousin.',
      },
      { do: 'border', pub: AIRPORT_PUB },
    ],
  },
  {
    do: 'say',
    text: 'An hour and a bit later, the Ryanair fanfare plays over Dublin Bay. You’re home.',
  },
  { do: 'travel', map: TERMINAL_ID, x: 6, y: 10, face: 'down' },
  {
    do: 'if',
    flag: AGREEMENT,
    then: [],
    else: [
      {
        do: 'say',
        text: 'Your Ranemon are waiting at arrivals, back from Michael D’s farm in Clare. They look very well. They smell of cows.',
      },
    ],
  },
];

// ---------- Dublin Airport ----------

const crew = (text: string): Npc => ({ look: 'crew', face: 'down', talk: [{ do: 'say', text }] });

/** Inside Terminal 1: check-in, security and the gate, with three trainers in the way. */
function terminalRoom(): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  return {
    name: 'Terminal 1',
    rows: [
      'WWWWWWWWWWWWWW',
      'WODDDDDWWWWWOW',
      'W1FFFFFFFFFFNW',
      'WUUUFFFF5UUUUW',
      'WFFFFFFFFFFFFW',
      'WFF4FFFFFFFFFW',
      'WCCCCC3FCCCCCW',
      'WFFFFFFFFFFFFW',
      'W2FFFFFF6FFFFW',
      'WCCCFFFFFFFFFW',
      'WFFFFFFFFFFFFW',
      'WNFFFF@FFFFFNW',
      'WWWWWWEWWWWWWW',
    ],
    npcs: [
      {
        look: 'crew',
        face: 'down',
        talk: [
          {
            do: 'ask',
            text: 'GATE AGENT: Ryanair to London Stansted, now boarding. Got your boarding pass?',
            yes: FLIGHT,
            no: [
              {
                do: 'say',
                text: 'GATE AGENT: Gate closes in ten minutes. It won’t, but it will.',
              },
            ],
          },
        ],
      },
      crew(
        'CHECK-IN: Your bag’s 200 grams over. That’s €70. …Or you could eat that Chicken Fillet Roll. (You eat it on the spot. Your bag is under. The check-in agent claps.)',
      ),
      {
        look: 'security',
        face: 'down',
        talk: [
          {
            do: 'say',
            text: 'SECURITY: Pints out of the bag, please. All of them. In the tray. (He keeps one.) Liquids over 100ml. Rules is rules.',
          },
        ],
      },
      {
        look: 'hen',
        face: 'right',
        trainer: 'airport-hen',
        sight: 3,
        talk: [
          { do: 'say', text: 'HEN PARTY: The inflatable is coming on the plane. It has a seat.' },
        ],
      },
      {
        look: 'gatecamper',
        face: 'down',
        trainer: 'airport-camper',
        sight: 2,
        talk: [
          {
            do: 'say',
            text: 'GATE MAN: Still here. My flight’s at 2. It’s 11. I was here at 5. You can never be too careful.',
          },
        ],
      },
      {
        look: 'stag',
        face: 'left',
        trainer: 'airport-stag',
        sight: 3,
        talk: [
          {
            do: 'say',
            text: 'STAG: Gaz is getting married! Gaz is asleep under the seats! We’re going to Magaluf! Via Stansted! Somehow!',
          },
        ],
      },
    ],
    things: {
      D: 'DEPARTURES. London Stansted, London Stansted, London Stansted, Lanzarote, London Stansted. All Ryanair.',
      U: 'A row of seats bolted together. Someone has put their bag on each one.',
      N: 'A plastic plant. It has seen things.',
    },
  };
}

export const AIRPORT: GameMap = {
  id: 'airport',
  name: 'Dublin Airport, Co. Dublin',
  county: 9,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^^^^^^^^^T',
    'T####P########L########T',
    'TvvvvvvvvvvvvvvvvvvvvvvT',
    'Tv1vvvvvvvvvvvvvvvvvvSvT',
    'TaaaaaaaaaaaaaaaaaaaaaaT',
    'Tac@aaaaaaaaaaaaaaaacaaT',
    'TaaaaaaaaaaaaaaaaaaaaaaT',
    'TvvvvvvvvvvvvvvvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [{ look: 'bus', face: 'down', talk: homeward('airport') }],
  signs: ['DUBLIN AIRPORT. Terminal 1: Ryanair. Terminal 2: also, somehow, Ryanair.'],
  landmarks: [
    [
      {
        do: 'say',
        text: 'TERMINAL 1. Check-in, security, then the gate. Everybody is in a hurry except the queue.',
      },
    ],
  ],
  landmarkRooms: { 0: terminalRoom() },
};

/** Everyone you can battle at the airport, the last fights your Irish team gets for a while. */
const AIRPORT_TRAINERS: Trainer[] = [
  {
    id: 'airport-hen',
    name: 'Hen Party Siobhán',
    team: [
      ['robinmon', 52],
      ['enda', 53],
      ['lorcamon', 54],
    ],
    ai: 'normal',
    prize: 1080,
    before:
      'HEN PARTY SIOBHÁN: We’re off to London for the weekend and we are NOT getting stopped at security again. Battle!',
    after: 'HEN PARTY SIOBHÁN: Ah, go on. Come to the hen. Everyone’s invited.',
  },
  {
    id: 'airport-camper',
    name: 'Gate Man Declan',
    team: [
      ['steadmon', 53],
      ['jammon', 54],
      ['hugomon', 55],
    ],
    ai: 'normal',
    prize: 1100,
    before:
      'GATE MAN DECLAN: Nine hours at this gate. I know every inch of it. You will not take my seat.',
    after: 'GATE MAN DECLAN: Fine. Sit down. Not that seat.',
  },
  {
    id: 'airport-stag',
    name: 'Stag Gaz’s Best Man',
    team: [
      ['boydemon', 53],
      ['owemon', 54],
      ['killemon', 55],
    ],
    ai: 'normal',
    prize: 1100,
    before: 'BEST MAN: The stag needs a battle! Gaz is asleep, so it’s me! LADS LADS LADS!',
    after: 'BEST MAN: Lads… lads… we lost to a tourist.',
  },
];

// ---------- London Stansted ----------

/** Inside arrivals: Border Force at one desk, Ryanair home at the other. */
function arrivalsRoom(): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  return {
    name: 'Arrivals',
    rows: [
      'WWWWWWWWWWWWWW',
      'WOWWDDDDWWWWOW',
      'WF1FFFFFFFF2FW',
      'WCCCFFFFFFCCCW',
      'WFFFFFFFFFFFFW',
      'WFUUFFFF3FUUFW',
      'WFFFFFFFFFFFFW',
      'WNFFF4F@FFFFNW',
      'WWWWWWWEWWWWWW',
    ],
    npcs: [
      {
        look: 'border',
        face: 'down',
        talk: [
          {
            do: 'say',
            text: 'BORDER FORCE: Welcome to the United Kingdom. Your Ranemon, should you have any, are not.',
          },
        ],
      },
      {
        look: 'crew',
        face: 'down',
        talk: [
          {
            do: 'ask',
            text: 'RYANAIR: Flying home to Dublin? Your Ranemon in Ireland would be waiting at the other end.',
            yes: FLIGHT_HOME,
            no: [{ do: 'say', text: 'RYANAIR: No bother. There’s one every hour. Roughly.' }],
          },
        ],
      },
      {
        look: 'local',
        face: 'left',
        talk: [
          {
            do: 'say',
            text: 'TRAVELLER: Two hours in that queue. Two hours! I’m from Leeds! I’m BRITISH! Mind you, I was very polite about it.',
          },
        ],
      },
      {
        look: 'stag',
        face: 'up',
        talk: [
          {
            do: 'say',
            text: 'STAG: Is this London? It says London. Where’s Big Ben? Lads? LADS?',
          },
        ],
      },
    ],
    things: {
      D: 'ARRIVALS. Dublin, Dublin, Cork, Dublin, Knock, Dublin. Everyone off them is Irish.',
      U: 'Seats. A man is asleep across four of them in a Leinster jersey.',
      N: 'A potted plant with a sign on it: PLEASE DO NOT WATER. HM BORDER FORCE.',
    },
  };
}

export const STANSTED: GameMap = {
  id: 'stansted',
  name: 'London Stansted, Essex',
  county: 9,
  flat: true,
  uk: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^^^^^T',
    'T#######L##########T',
    'Tvvvvvvv@vvvvvvvvvvT',
    'TvvvvvvvvvvvvvvvvvvT',
    'Tv1vvvvvvvSvvvvvvvvT',
    'TaaaaaaaaaaaaaaaaaaT',
    'TaaacaaaaaaaaaacaaaT',
    'TvvvvvvvvvvvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'conductor',
      face: 'down',
      talk: [
        {
          do: 'ask',
          text: 'STANSTED EXPRESS: Into London Liverpool Street. Fifty minutes. Twenty-three pounds. Hop on?',
          yes: [
            {
              do: 'say',
              text: 'Fields, then Essex, then a lot more Essex, then suddenly tower blocks and cranes and the Gherkin.',
            },
            { do: 'travel', map: 'london', x: 1, y: 3, face: 'right' },
            {
              do: 'if',
              flag: 'seen:london',
              then: [],
              else: [
                {
                  do: 'say',
                  text: 'LONDON. Red buses, black cabs, a pigeon eating a whole croissant and nine million people who won’t look at you.',
                },
                { do: 'flag', flag: 'seen:london' },
              ],
            },
          ],
          no: [
            {
              do: 'say',
              text: 'STANSTED EXPRESS: Suit yourself. Essex is lovely this time of year.',
            },
          ],
        },
      ],
    },
  ],
  signs: ['LONDON STANSTED. Forty miles from London. It says London on it anyway.'],
  landmarks: [
    [
      {
        do: 'say',
        text: 'ARRIVALS. The border is in here, and Ryanair’s desk, for flights home to Dublin.',
      },
    ],
  ],
  landmarkRooms: { 0: arrivalsRoom() },
};

// ---------- London ----------

/** Próvaí in the back of W.B Yates: your UK Ranemon, Thatcher, and the story of the lads. */
const PROVAI_STARTER: Step[] = [
  {
    do: 'if',
    flag: UK_STARTER,
    then: [
      {
        do: 'say',
        text: 'PRÓVAÍ: Twelve clubs. Twelve legends. Beat the legend at each ground for the jersey, and you’re champion. Then it’s the palace.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: Trains go from King’s Cross. Engineering works this weekend, of course. Get to know your Ranemon in the park while we wait.',
      },
    ],
    else: [
      {
        do: 'say',
        text: 'PRÓVAÍ: They took the Ranemon off you? Ah, they did the same to me. Even took my decks. Said they were livestock.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: Don’t worry. Donal owes me a favour. Now. UK Ranemon are a bit different.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: Over here, nobody’s got a photo of them. They’re all DRAWN. Like a cartoon on the BBC. Something about Ofcom.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: Same lads, same moves, they just look like they came out of a Game Boy. Twenty pints on that table. Pick one. Any one.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: The old lad in the cream robes? Not a hope. Nobody’s seen him in years. And Petchemon? Never heard of him.',
      },
      { do: 'starter', uk: true },
      {
        do: 'say',
        text: '(The door bangs open. In comes a royal blue suit, pearls and hair that has not moved since 1979.)',
      },
      { do: 'battle', trainer: 'rival-uk-1' },
      {
        do: 'say',
        text: 'PRÓVAÍ: Who was THAT? Never mind. Sit down there. I’ll tell you what happened the lads.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: In 1907, the Irish Crown Jewels were robbed out of Dublin Castle. Never found. True story, look it up.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: The lads heard they ended up in a cupboard in Buckingham Palace. So they went in the back gate to bring them home. They got as far as the Throne Room.',
      },
      {
        do: 'say',
        text: '(Mo Chara and Móglaí Bap tiptoe through a gold room and open a cupboard. Green light floods out. Somebody clears their throat.)',
      },
      {
        do: 'say',
        text: 'KING CHARLES: I say. One does rather think those are MINE. (He’s holding a watering can.) Guards!',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: Charles won’t see anyone. One rule: the only person in the country who gets an audience with the King is the Premier League Champion.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: He made the rule in 1976 so he’d never have to meet anyone. The Premier League didn’t even exist then.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: So. You’re going to win the Premier League. Twelve clubs, twelve legends, twelve jerseys. Trains go from King’s Cross.',
      },
      { do: 'flag', flag: FIXTURES },
      {
        do: 'say',
        text: 'DONAL: And take these, on the house. Poured properly, mind. Not like the ones on that table.',
      },
      { do: 'give', item: 'pint', count: 5 },
    ],
  },
];

/** Próvaí outside W.B Yates, until he's given you a Ranemon. */
const PROVAI_OUTSIDE: Npc = {
  look: 'provai',
  face: 'left',
  hideIf: UK_STARTER,
  talk: [
    {
      do: 'say',
      text: 'PRÓVAÍ: You made it! In you go, into W.B Yates there. The lad who runs it is from Cork. He’s been here since 1987. He’s going home next year.',
    },
  ],
};

/** Liam Neeson's lines when he heals your party in a W.B Yates. */
export const NEESON_LINES = [
  'LIAM NEESON: Your Ranemon were taken from you. I found them. I healed them. Don’t thank me. Thank the stout.',
  'LIAM NEESON: I have a very particular set of skills. Skills I have acquired over a very long career. Pouring is one of them.',
  'LIAM NEESON: I don’t know who you are. I don’t know what you want. But your Ranemon are fighting fit.',
  'LIAM NEESON: (He looks at your Ranemon for a long time.) They’ll live. They’ll do more than live.',
  'LIAM NEESON: I’m from Ballymena. We don’t do small talk. Your Ranemon are healed.',
];

/** London's W.B Yates: Donal from Cork runs it, and Próvaí is in the back with the pints. */
const LONDON_YATES: Yates = {
  owner: {
    look: 'donal',
    face: 'left',
    talk: [
      {
        do: 'say',
        text: 'DONAL: Welcome to W.B Yates! I’m from Cork. Thirty-eight years here now. I’m going home next year. Every year I say that.',
      },
      {
        do: 'say',
        text: 'DONAL: Liam’s on the bar. Don’t make small talk with him. He doesn’t do small talk. Trad session every night at nine.',
      },
    ],
  },
  regular: { look: 'provai', face: 'down', showIf: LANDED, talk: PROVAI_STARTER },
  things: {
    V: 'Every whiskey in Ireland, and a framed photo of Donal with the Cork hurlers in 1990.',
    U: 'A long table. Twenty pints of Guinness on it, all poured badly.',
    J: 'A fire with a sign over it: NO IRISH NEED APPLY. Someone has crossed out NEED APPLY and written ARE IN CHARGE NOW.',
  },
};

export const LONDON: GameMap = {
  id: 'london',
  name: 'London, England',
  county: 9,
  flat: true,
  terraces: 'english',
  slate: true,
  uk: true,
  yates: LONDON_YATES,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^^vv^^^^^^v^^^^^^^vv^^^^^T',
    'T##L####vv##P###v###M###vv#L###T',
    'T@vv2vvvvvvvv1vvvvvvvvvvvvvvvvvT',
    'TvSvvvvvvvvvvvvvvvvv7vvvvvvvvvvT',
    'TaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaT',
    'TaacaaaaaaaaaaaaaaaaaaacaaaaaaaT',
    'TvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvT',
    'T~~~~~~~~~BB~~~~~~~~~~~~BB~~~~~T',
    'T~~~~~~~~~BB~~~~~~~~~~~~BB~~~~~T',
    'TvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvT',
    'Tv....,,,,,,....vvv^^^^^^vvvv3vT',
    'Tv.,,,,,,,,,,,..vvv##L###vvvvvvT',
    'Tv.,,,,,,,,,,,..vvvvvv4vvvvvvvvT',
    'Tv..,,,,,,,,,...vvSvvvvvvvvvvvvT',
    'Tv.....5........vvvvvvvv6vvvvvvT',
    'TvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  wild: {
    min: 3,
    max: 6,
    // London's own commuters, runners, cyclists and skaters, and a few of the lads still about
    // (docs/london-ranedex.md), so their UK forms can still be caught.
    table: [
      ['oystermon', 26],
      ['speedmon', 15],
      ['pedalmon', 15],
      ['skatemon', 12],
      ['simomon', 5],
      ['robinmon', 5],
      ['enda', 5],
      ['steadmon', 5],
      ['hugomon', 3],
      ['skehemon', 3],
      ['killemon', 3],
      ['vinnimon', 3],
    ],
  },
  npcs: [
    PROVAI_OUTSIDE,
    {
      look: 'conductor',
      face: 'down',
      talk: [
        {
          do: 'ask',
          text: 'STANSTED EXPRESS: Back out to Stansted Airport?',
          yes: [
            { do: 'say', text: 'Out through the tower blocks, and then a great deal of Essex.' },
            { do: 'travel', map: 'stansted', x: 8, y: 3, face: 'down' },
          ],
          no: [{ do: 'say', text: 'STANSTED EXPRESS: Mind the gap.' }],
        },
      ],
    },
    {
      look: 'oldman',
      face: 'down',
      talk: [
        {
          do: 'say',
          text: 'PIGEON MAN: Feed the birds, tuppence a bag. Well. Four pounds fifty a bag. It’s London.',
        },
      ],
    },
    {
      look: 'guard',
      face: 'down',
      talk: [
        {
          do: 'say',
          text: 'POLICE: Buckingham Palace is closed to the public, sir. By order of His Majesty. Only the Premier League Champion gets through. Says so on a sign.',
        },
      ],
    },
    {
      look: 'trainer',
      face: 'up',
      trainer: 'london-banker',
      readyIf: UK_STARTER,
      sight: 3,
      talk: [{ do: 'say', text: 'BANKER: I’m on a call. I’m always on a call.' }],
    },
    {
      look: 'trainer',
      face: 'left',
      trainer: 'london-islander',
      readyIf: UK_STARTER,
      sight: 3,
      talk: [{ do: 'say', text: 'ISLANDER: I’ve got a text! …No, it’s from Tesco.' }],
    },
    OVERGROUND,
  ],
  signs: [
    'LIVERPOOL STREET. Trains to and from Stansted Airport. Not Liverpool. Nothing here goes to Liverpool.',
    'THE MALL. Buckingham Palace this way. Closed to the public. Especially you.',
  ],
  landmarks: [
    [
      {
        do: 'say',
        text: 'KING’S CROSS. Trains north to every ground in the Premier League. There’s a trolley half stuck in the wall at platform 9.',
      },
    ],
    [
      {
        do: 'say',
        text: 'BIG BEN. Bong. It’s actually the bell, a man in a hi-vis tells you. The tower is the Elizabeth Tower. Bong.',
      },
    ],
    [
      {
        do: 'say',
        text: 'BUCKINGHAM PALACE. Somewhere inside, a King, two lads from Kneecap and a cupboard full of green light.',
      },
    ],
  ],
  landmarkRooms: { 0: KINGS_CROSS_ROOM, 2: FORECOURT },
  landmarkLocks: {
    0: {
      flag: FIXTURES,
      locked:
        'KING’S CROSS: (A sign.) NO TRAINS NORTH THIS WEEKEND DUE TO ENGINEERING WORKS. A REPLACEMENT BUS SERVICE IS NOT IN OPERATION.',
      opened: 'The engineering works are finished. Apparently.',
    },
    2: {
      flag: CHAMPION,
      locked:
        'POLICE: (A line of police across the gates.) Sorry. By order of His Majesty, only the Premier League Champion. Off you go.',
      opened: 'The police line steps aside for the Premier League trophy.',
    },
  },
};

/** Everyone you can battle in London, once Próvaí has given you a Ranemon. */
const LONDON_TRAINERS: Trainer[] = [
  {
    id: 'rival-uk-1',
    name: 'Margaret Thatcher',
    rival: true,
    friendly: true,
    uk: true,
    team: [],
    ai: 'normal',
    prize: 1520,
    before:
      'THATCHER: YOU! Here! In MY London! And I suppose that DJ gave you one of our Ranemon. Then I shall have one too. I AM from here, you know.',
    after:
      'THATCHER: Hmph. Beginner’s luck, on British soil. I shall be at Number Ten if anybody needs me. Nobody ever does.',
  },
  {
    id: 'london-banker',
    name: 'City Banker Rupert',
    uk: true,
    team: [
      ['vinnimon', 6],
      ['hugomon', 7],
    ],
    ai: 'easy',
    prize: 760,
    before: 'CITY BANKER RUPERT: Let’s circle back on this after a quick battle. Synergies!',
    after: 'CITY BANKER RUPERT: Let’s take that offline. Permanently.',
  },
  {
    id: 'london-islander',
    name: 'Islander Kai',
    uk: true,
    team: [
      ['robinmon', 7],
      ['conemon', 8],
    ],
    ai: 'easy',
    prize: 780,
    before: 'ISLANDER KAI: You’re my type on paper. Let’s see if you’re my type in battle.',
    after: 'ISLANDER KAI: I’m not here to make friends. I’ve made loads, though.',
  },
];

export const UK_TRAINERS = [...AIRPORT_TRAINERS, ...LONDON_TRAINERS, ...SHOREDITCH_TRAINERS];
