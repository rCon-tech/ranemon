import { ELVIS } from '@/lib/story/norm';
import type { GameMap, Step, Trainer } from '@/lib/story/world';

/**
 * The road between the counties. Walk off a county's east edge and you come out on a short
 * stretch of road of its own before the next county: the bridge at Killaloe, roadworks on the
 * N24, the hurling border, the Electric Picnic car park, the Bog of Allen, Shannonbridge, the
 * Royal Canal, an Applegreen on the M4 and the Red Cow on the way into Dublin. Each is about two
 * screens wide, with one thing to see, one thing to do and a "Fáilte go Contae…" sign at the far
 * end. The county Garda still stand where they did, so the jerseys still gate the road.
 *
 * They are `link` maps: no McGrattans, Vapes, gym or long grass, left off the Town Map and the
 * Limepass, and 2D only (`flat`), like everything new. See docs/story-mode.md (The road between).
 */

/** Said once, then something else ever after: a gift that's only given the first time. */
function once(flag: string, first: Step[], after: string): Step[] {
  return [
    { do: 'if', flag, then: [{ do: 'say', text: after }], else: [...first, { do: 'flag', flag }] },
  ];
}

const say = (text: string): Step => ({ do: 'say', text });

const welcome = (irish: string, english: string) => `FÁILTE GO ${irish}. Welcome to ${english}.`;

// ---------- the Lads on Tour: find the Groom ----------

/** The stag party has lost the groom. Each Lad you beat on the road knows a bit more. */
export const STAG_BOAT = 'stag:boat';
export const STAG_START = 'beat:lads-dec';
export const STAG_DONE = 'beat:dublin-stag';

// ---------- B&S, seen from the road ----------

export const BNS_SEEN = 'bns:seen';

/** Once you're out of Laois with its jersey, B&S drive past on the road into Offaly. */
export const BNS_SIGHTING: Step[] = [
  {
    do: 'if',
    flag: BNS_SEEN,
    then: [],
    else: [
      say(
        'A white stretch limo comes tearing down the road out of Laois and slows right beside you.',
      ),
      say(
        'B&S: Oh look, it’s the one Michael D sent. Still walking? We got a helicopter to Trinity. Nine jerseys is very cute.',
      ),
      say('B&S: See you under the Campanile. Or not. Probably not.'),
      say('The window goes up. The limo is gone in a spray of bog water.'),
      { do: 'flag', flag: BNS_SEEN },
    ],
  },
];

// ---------- the trainers between the counties ----------

export const ROAD_TRAINERS: Trainer[] = [
  {
    id: 'border-tipp',
    name: 'Tipp Supporter Mairéad',
    team: [
      ['conemon', 19],
      ['carlmon', 20],
    ],
    ai: 'normal',
    prize: 400,
    before:
      'TIPP SUPPORTER MAIRÉAD: Blue and gold! You’re not crossing into Cats country without a puck around first.',
    after: 'TIPP SUPPORTER MAIRÉAD: Fair play. Tell the Cats we’re coming for them in July.',
    reward: [
      say('MAIRÉAD: Here, a Spice Bag for the road. Don’t give any to the Kilkenny crowd.'),
      { do: 'give', item: 'spice-bag' },
    ],
  },
  {
    id: 'border-cats',
    name: 'Cats Supporter Dónal',
    team: [
      ['robinmon', 19],
      ['steadmon', 20],
    ],
    ai: 'normal',
    prize: 400,
    before: 'CATS SUPPORTER DÓNAL: Black and amber! Thirty-six All-Irelands. How many have you?',
    after: 'CATS SUPPORTER DÓNAL: Ah, here. Thirty-six and a half, so.',
    reward: [
      say('DÓNAL: Go on, have a Spice Bag. Kilkenny’s finest. Well, Kilkenny’s chipper’s finest.'),
      { do: 'give', item: 'spice-bag' },
    ],
  },
];

// ---------- the maps ----------

const KILLALOE: GameMap = {
  id: 'link-killaloe',
  name: 'Killaloe Bridge, on the Shannon',
  county: 0,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T..".....~~~~~~TT."..T',
    'T..S.1...~~~~~~~...2.T',
    'T........~~~~~~~.....T',
    '@========BBBBBBB====>=',
    'T........~~~~~~~.....T',
    'T."......~~~~~~~..S..T',
    'T....T...~~~~~~~...".T',
    'T..T....~~~~~~~~~..TTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'local',
      face: 'down',
      talk: once(
        'gift:killaloe',
        [
          say('ANGLER: Not a bite all day. The swans got the lot. I’ll not be needing this, so.'),
          { do: 'give', item: 'chicken-fillet-roll', count: 2 },
        ],
        'ANGLER: Clare on this side, Limerick on that. The fish don’t care which.',
      ),
    },
    {
      look: 'lad',
      face: 'left',
      talk: [
        say(
          'LAD ON TOUR: STAG! STAG! STAG! We’re doing a stag the long way. Every county from here to Dublin!',
        ),
        say(
          'LAD ON TOUR: Dec went on ahead into Limerick. If you see him, tell him he has the groom’s wallet.',
        ),
      ],
    },
  ],
  signs: [
    'KILLALOE AND BALLINA. One town on each side of the Shannon, one bridge between them, and a row about whose it is that has gone on for 300 years.',
    welcome('CONTAE LUIMNIGH', 'County Limerick'),
  ],
  west: 'clare',
  east: 'limerick',
};

/** The STOP/GO man on the N24: on STOP since 2019, until you ask nicely. */
const ROADWORKS_GO = 'roadworks:go';

const ROADWORKS: GameMap = {
  id: 'link-roadworks',
  name: 'Roadworks on the N24',
  county: 1,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T.......hhhhhhhh.....T',
    'T..S...c.c.c.c...2...T',
    'T.....ffffffff.......T',
    '@=========1=========>=',
    'T.....ffffffff.......T',
    'Thhhhhhhhhhhhhhh..S..T',
    'T"...............".."T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'guard',
      face: 'left',
      hideIf: ROADWORKS_GO,
      talk: [
        say('STOP/GO MAN: It’s on STOP.'),
        {
          do: 'ask',
          text: 'STOP/GO MAN: …It’s been on STOP since 2019. Do you want me to turn it?',
          yes: [
            say('STOP/GO MAN: Nobody’s ever asked before. Go on, so.'),
            say('He turns the sign round to GO. A cheer goes up from every car in the queue.'),
            { do: 'flag', flag: ROADWORKS_GO },
          ],
          no: [say('STOP/GO MAN: Grand. It’s on STOP.')],
        },
      ],
    },
    {
      look: 'farmer',
      face: 'left',
      talk: [
        say('FARMER: I’ve been in this queue so long my cattle have had calves. In the trailer.'),
        say('FARMER: Thurles is just the far side. If yer man ever turns that sign.'),
      ],
    },
  ],
  signs: [
    'ROADWORKS AHEAD. N24 IMPROVEMENT SCHEME, PHASE 1 OF 14. Expected completion: yes.',
    welcome('CONTAE THIOBRAID ÁRANN', 'County Tipperary'),
  ],
  west: 'limerick',
  east: 'tipperary',
};

const HURLING: GameMap = {
  id: 'link-hurling',
  name: 'The Hurling Border',
  county: 2,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T.nnnnnnnnnnnnnnnnnn.T',
    'T.nxxxxxxxxxxxxxxxxn.T',
    'T.nxxxxxxxxxxxxxxxxn.T',
    'T.nnnnnnnnnnnnnnnnnn.T',
    'T..S...1...3...2...S.T',
    '@===================>=',
    'Thhhhhhhhhhhhhhhhhhh"T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    { look: 'fan', face: 'down', trainer: 'border-tipp', sight: 1 },
    { look: 'fan', face: 'down', trainer: 'border-cats', sight: 1 },
    {
      look: 'oldman',
      face: 'down',
      talk: [
        say(
          'OLD MAN: Half this pitch is in Tipperary and half is in Kilkenny. They’ve been playing the same match on it since 1887.',
        ),
        say('OLD MAN: Nobody remembers the score. Nobody will ever let it go.'),
      ],
    },
  ],
  signs: [
    'THE HURLING BORDER. Tipp blue and gold on this side, Kilkenny black and amber on that. Neutrals please keep moving.',
    welcome('CONTAE CHILL CHAINNIGH', 'County Kilkenny'),
  ],
  west: 'tipperary',
  east: 'kilkenny',
};

const PICNIC: GameMap = {
  id: 'link-picnic',
  name: 'Electric Picnic Car Park',
  county: 3,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T.c.c.c.c...c.c.c.c..T',
    'T.c.c.c.c...c.c.c.c*.T',
    'T.......1............T',
    '@===================>=',
    'T..S........2........T',
    'T.c.c.c.c...c.c.c.c..T',
    'T.c.c.c.c.3.c.c.c.cS.T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'security',
      face: 'down',
      talk: once(
        'gift:wristband',
        [
          say(
            'STEWARD: Wristband? No? Ah sure, nobody has one in the car park. Here, have a few of these instead.',
          ),
          { do: 'give', item: 'monster', count: 3 },
          say(
            'STEWARD: DJ Stradbally is on the main stage tonight. You’ll need your best Ranemon for that one.',
          ),
        ],
        'STEWARD: Main stage is straight on into Laois. Mind the glampers.',
      ),
    },
    {
      look: 'cramps',
      face: 'up',
      talk: [
        say(
          'CRAMPS: Alright! I’m Cramps. I’m playing the dance tent at three in the morning. Nobody will be there. It’ll be unreal.',
        ),
        say(
          'CRAMPS: Once this is over I’m back to Greystones. Come find me in Dublin some time, the DART goes right there.',
        ),
      ],
    },
    {
      look: 'raver',
      face: 'up',
      talk: [
        say(
          'GLAMPER: I lost my tent. I lost my friends. I found a lad selling Blue Ghosts out of a sports bag, though.',
        ),
        say('GLAMPER: He said he’d be in Temple Bar after. Something about locking for Q4.'),
      ],
    },
  ],
  signs: [
    'ELECTRIC PICNIC. CAR PARK B. Please remember where you parked. (Nobody ever does.)',
    welcome('CONTAE LAOISE', 'County Laois'),
  ],
  west: 'kilkenny',
  east: 'laois',
};

const BOG: GameMap = {
  id: 'link-bog',
  name: 'The Bog of Allen',
  county: 4,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'Tbbbbbeeebbbbbbbbbbb.T',
    'Tb.S..eeebbbbb2bbbbbbT',
    'Tb....ee1bbbbb=bbbbbbT',
    '@===================>=',
    'Tbbbbbeeebbbbb3bbbbbbT',
    'Tbbbbbeeebbbbbbbbbbb.T',
    'TbbbbbeeebbbbbbbbbbS.T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    { look: 'rival', face: 'down', trainer: 'rival-bog', sight: 1 },
    {
      look: 'conductor',
      face: 'down',
      talk: [
        say(
          'TURF TRAIN DRIVER: All aboard the Bord na Móna express! Top speed: walking pace. Mind the turf.',
        ),
        {
          do: 'ask',
          text: 'TURF TRAIN DRIVER: Will I bring you across the bog?',
          yes: [
            say('Chug… chug… chug… The little turf train trundles across the bog.'),
            { do: 'travel', map: 'link-bog', x: 19, y: 4, face: 'right' },
            say('TURF TRAIN DRIVER: Offaly! Mind the step.'),
          ],
          no: [
            say(
              'TURF TRAIN DRIVER: Suit yourself. The boardwalk’s grand too, if you don’t mind wet feet.',
            ),
          ],
        },
      ],
    },
    {
      look: 'farmer',
      face: 'up',
      talk: [
        say(
          'TURF CUTTER: The bog keeps everything. Butter, bodies, a fella’s phone from 2004. Still had battery.',
        ),
      ],
    },
  ],
  signs: [
    'THE BOG OF ALLEN. A thousand square kilometres of bog, and every bit of it wants your shoes.',
    welcome('CONTAE UÍBH FHAILÍ', 'County Offaly'),
  ],
  west: 'laois',
  east: 'offaly',
};

const SHANNONBRIDGE: GameMap = {
  id: 'link-shannonbridge',
  name: 'Shannonbridge',
  county: 5,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T..S...~~~~~~~~.."...T',
    'T.....~~~y~~~~~~.....T',
    'T.....~~~~~~~~~~~..2.T',
    '@=====BBBBBBBBBBB===>=',
    'T.....~~~~~~~~~~~....T',
    'T..1..~~~~y~~~~~~.3..T',
    'T"....~~~~~~~~~~.."S.T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'reveller',
      face: 'right',
      talk: [
        say(
          'REVELLER: There’s a boat party going up the Shannon to Athlone. We’ve been on it three days. I think.',
        ),
      ],
    },
    {
      look: 'sailor',
      face: 'left',
      talk: [
        {
          do: 'if',
          flag: STAG_START,
          then: [
            say(
              'SKIPPER: A groom? In a veil and a sash that says GROOM? Aye, he was on the boat party.',
            ),
            say(
              'SKIPPER: Got off at Athlone looking for Sean’s Bar. His mate Fiach went after him.',
            ),
            { do: 'flag', flag: STAG_BOAT },
          ],
          else: [say('SKIPPER: Twenty-two arches on this bridge. I’ve hit every one of them.')],
        },
      ],
    },
    {
      look: 'local',
      face: 'up',
      talk: [
        say(
          'LOCAL: Offaly behind you, Westmeath ahead, and the Shannon in the middle doing what it likes.',
        ),
      ],
    },
  ],
  signs: [
    'SHANNONBRIDGE. The bridge has stood since 1757. The boat parties have stood for considerably less.',
    welcome('CONTAE NA hIARMHÍ', 'County Westmeath'),
  ],
  west: 'offaly',
  east: 'westmeath',
};

const CANAL: GameMap = {
  id: 'link-canal',
  name: 'The Royal Canal',
  county: 6,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'Th..S....1.......h...T',
    'T....................T',
    '@===================>=',
    'T~~~~~~~~~BB~~~~~~~~~T',
    'T...2.3....4.....S.".T',
    'T"...................T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'oldman',
      face: 'down',
      talk: once(
        'gift:lock',
        [
          say(
            'LOCK KEEPER: Nobody gets past my lock without a riddle. Well, they do, it’s a towpath. But humour me.',
          ),
          say('LOCK KEEPER: What has a bed but never sleeps, and a mouth but never speaks?'),
          {
            do: 'ask',
            text: 'LOCK KEEPER: Is it… a river?',
            yes: [
              say('LOCK KEEPER: It is! Nobody ever gets it. Here, you’ve earned these.'),
              { do: 'give', item: 'mulligans', count: 2 },
            ],
            no: [
              say(
                'LOCK KEEPER: It’s a river. I gave you the answer and you still said no. Here, take these anyway.',
              ),
              { do: 'give', item: 'mulligans', count: 2 },
            ],
          },
        ],
        'LOCK KEEPER: Meath’s on down the towpath. Slow down, would you. It’s a canal.',
      ),
    },
    {
      look: 'carl',
      face: 'right',
      talk: [
        say(
          'CARL RYAN: Big lad needed a walk. I’m locking for Q4 from the towpath, there’s great signal on a canal.',
        ),
        say(
          'CARL RYAN: I do a bit of business in Dublin. If you ever need a Blue Ghost, you never got it from me.',
        ),
      ],
    },
    {
      look: 'elvis',
      face: 'left',
      hideIf: ELVIS,
      talk: [
        say('Elvis sniffs your hand, then lies down across the whole towpath. He is enormous.'),
      ],
    },
    {
      look: 'local',
      face: 'up',
      talk: [
        say(
          'BARGE OWNER: Dublin to the Shannon in a week. You’d walk it faster. You’d not enjoy it half as much.',
        ),
      ],
    },
  ],
  signs: [
    'THE ROYAL CANAL. Dublin to the Shannon, 145 kilometres, 46 locks, and one very particular lock keeper.',
    welcome('CONTAE NA MÍ', 'County Meath'),
  ],
  west: 'westmeath',
  east: 'meath',
};

const SERVICES: GameMap = {
  id: 'link-services',
  name: 'Applegreen, M4 Services',
  county: 7,
  link: true,
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T.S...............c.cT',
    'T.....CCCCCCCCC...c.cT',
    'T....aaaaaaaa1a..c4c.T',
    '@====aaaaaaaaaa=====>=',
    'T..c.c.c.aaaa....ccc.T',
    'T..c.c.c.aaaa..2.3...T',
    'T"...............S.."T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'shopkeeper',
      face: 'down',
      talk: once(
        'gift:services',
        [
          say(
            'DELI COUNTER: Breakfast roll? We’re out of breakfast rolls. We’re always out of breakfast rolls. Have a chicken fillet roll.',
          ),
          { do: 'give', item: 'chicken-fillet-roll', count: 3 },
        ],
        'DELI COUNTER: Still out of breakfast rolls.',
      ),
    },
    {
      look: 'ollie',
      face: 'up',
      talk: [
        say(
          'OLLIE: Bonjour! Alex and I are driving back to Dublin. Somebody has taken the rent from the biscuit tin, and I think I know who.',
        ),
        say(
          'OLLIE: Well, I think I know two people who. Come to the house past Temple Bar when you get to the city.',
        ),
      ],
    },
    {
      look: 'alex',
      face: 'up',
      talk: [say('ALEX SIMONIN: How do we always end up here?')],
    },
    { look: 'rival', face: 'down', trainer: 'rival-services', sight: 1 },
  ],
  signs: [
    'APPLEGREEN. M4 SERVICES. Fuel, food and a deli counter that has never once had a breakfast roll when you wanted one.',
    welcome('CONTAE CHILL DARA', 'County Kildare'),
  ],
  west: 'meath',
  east: 'kildare',
};

const RED_COW: GameMap = {
  id: 'link-redcow',
  name: 'The Red Cow, on the Luas',
  county: 8,
  link: true,
  flat: true,
  slate: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'Tv.S.vvv.S.vvvS.vvv.vT',
    'Tvvvvvvvvvvvvvvvvvvv.T',
    'Tv.c.....c.....c....vT',
    '@aaaaaaaaaaaaaaaaaaa>=',
    'Tv.....c....c.....c.vT',
    'Tv1vvvvvvvvvvvv2vvvvvT',
    'Tvvv.S.vvvvvv.S.vvv.vT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'conductor',
      face: 'down',
      talk: [
        say('LUAS DRIVER: Red Line into the city! Next stop: Dublin. Hold on to something.'),
        {
          do: 'ask',
          text: 'LUAS DRIVER: Getting on?',
          yes: [
            say(
              'Ding ding! The Luas glides past the Red Cow and the city rises up ahead: the Spire, the Poolbeg chimneys, cranes everywhere.',
            ),
            { do: 'travel', map: 'link-redcow', x: 19, y: 4, face: 'right' },
            say(
              'LUAS DRIVER: Dublin, straight ahead. Mind the gap. There isn’t one, but mind it anyway.',
            ),
          ],
          no: [
            say('LUAS DRIVER: Walk it, so. Mind the roundabout. Everybody minds the roundabout.'),
          ],
        },
      ],
    },
    {
      look: 'local',
      face: 'up',
      talk: [
        say(
          'COMMUTER: First time in Dublin? Get the train out of Connolly to Greystones some day. And never, ever pay full price in Temple Bar.',
        ),
      ],
    },
  ],
  signs: [
    'BILLBOARD: THE RAVE CAVE. South side, Dublin. Nine dancers. One DJ. The party never stops.',
    'BILLBOARD: SILICON DOCKS. Eight HQs on Grand Canal Dock. Every CEO is hiring. Every CEO wants a battle.',
    'BILLBOARD: CONNOLLY STATION. Trains to Greystones, Donegal, and places you haven’t heard of yet.',
    'POSTER: B&S, RANEMON CHAMPIONS OF IRELAND. Live at Trinity College. Undefeated. Unbearable.',
    welcome('BAILE ÁTHA CLIATH', 'Dublin'),
  ],
  west: 'kildare',
  east: 'dublin',
};

/** Every stretch of road between the counties, west to east. */
export const LINKS: GameMap[] = [
  KILLALOE,
  ROADWORKS,
  HURLING,
  PICNIC,
  BOG,
  SHANNONBRIDGE,
  CANAL,
  SERVICES,
  RED_COW,
];
