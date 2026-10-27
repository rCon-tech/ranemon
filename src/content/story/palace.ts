import { interiorId } from './interiors';
import { AGREEMENT, KING_BEATEN, LONDON_ONLY } from './kneecap';
import { REVEAL, SHADOWS } from './rowans';
import {
  find,
  type GameMap,
  type Look,
  type Npc,
  type Step,
  type Trainer,
} from '@/lib/story/world';

/**
 * Buckingham Palace (docs/london-expansion.md, chapters 10 to 12): the Royal Family as an Elite
 * Four, one room after another behind the door at the top of each, then King Charles in the
 * Throne Room with the Kneecap lads in a cage. Beat him and he signs the Good Saturday
 * Agreement: your Irish party joins you again for good, and the palace becomes an Irish party.
 *
 * The palace is the third landmark door in London, and opens for the Premier League Champion.
 * Every room's way out goes back to the Mall.
 */

export const PALACE_ID = interiorId('london', 'L', 2);

/** The rooms in order: the forecourt, then each one behind the door at the top of the last. */
export const PALACE_ROOM_IDS = [PALACE_ID];
for (let i = 1; i < 7; i++) PALACE_ROOM_IDS.push(interiorId(PALACE_ROOM_IDS[i - 1], 'L', 0));

/** Whoever has to be beaten in each room before its door opens, in order. */
export const ROYALS = [
  'rival-uk-2',
  'palace-edward',
  'palace-anne',
  'palace-william',
  'palace-andrew',
  'palace-queen',
];
export const CHARLES = 'palace-charles';

const said = (text: string): Step[] => [{ do: 'say', text }];

// ---------- the family ----------

const royal = (
  id: string,
  name: string,
  team: [string, number][],
  before: string,
  after: string,
  extra: Partial<Trainer> = {},
): Trainer => ({
  id,
  name,
  uk: true,
  team,
  ai: 'hard',
  prize: Math.max(...team.map(([, l]) => l)) * 50,
  before,
  after,
  ...extra,
});

const guard = (id: string, team: [string, number][]): Trainer => ({
  id,
  name: 'Royal Guard',
  uk: true,
  team,
  ai: 'normal',
  prize: Math.max(...team.map(([, l]) => l)) * 20,
  before: 'ROYAL GUARD: …',
  after: 'ROYAL GUARD: …',
});

/** The takeover, after Charles: the Agreement, the lads, and the party. */
const TAKEOVER: Step[] = [
  { do: 'flag', flag: KING_BEATEN },
  ...said(
    'CHARLES: Very well. Very well. Take the musicians. Take the jewels. Take Gerald, if you like, he’s never liked me.',
  ),
  ...said(
    'You open the gilded cage. Mo Chara and Móglaí Bap walk out, stretch, and Mo Chara starts a song immediately.',
  ),
  ...said(
    'The Throne Room doors bang open. DJ Próvaí, decks under his arm. “Got them back off Border Force. Told them they were livestock.”',
  ),
  ...said('PRÓVAÍ: Lads.'),
  ...said('MO CHARA: Lads.'),
  ...said('MÓGLAÍ BAP: Lads.'),
  ...said('PRÓVAÍ: (to you) Go raibh míle maith agat. Seriously. Now. We’ve a gig to play.'),
  ...said(
    'Camilla hands Charles a pen and a sheet of palace notepaper. He signs it, very slowly: THE GOOD SATURDAY AGREEMENT. Ranemon are in the Common Travel Area.',
  ),
  { do: 'flag', flag: AGREEMENT },
  {
    do: 'if',
    // A London-only game has no Irish party waiting on Michael D's farm.
    flag: LONDON_ONLY,
    then: said(
      'Your phone buzzes. MAM: YOU ARE ON THE NEWS. In a PALACE. Your father has rung everyone. Are you eating?',
    ),
    else: [
      ...said(
        'Your phone buzzes. MADAME: We ’ave seen ze news! Ze Agreement! We are on ze plane already.',
      ),
      ...said('MONSIEUR: Ryanair. Pff. But we are coming.'),
      ...said(
        'An hour later Ollie’s parents walk into the Throne Room with every one of your Irish Ranemon. Your old follower runs straight to you.',
      ),
      { do: 'reunite' },
      ...said('Your Irish Ranemon are back with you, for good. Your UK Ranemon are staying too.'),
    ],
  },
  ...said(
    'A tricolour goes up the flagpole over the palace. Kneecap play on the balcony over the Mall, Próvaí on the decks, and the Mall is packed to Trafalgar Square.',
  ),
  ...said(
    'Michael D lands on the lawn in the Air Corps helicopter, dogs and all, and hands the Irish Crown Jewels to Próvaí. “Back to Dublin Castle, where they belong. And this time, lock the door.”',
  ),
  {
    do: 'if',
    flag: LONDON_ONLY,
    then: said(
      'MICHAEL D: (to you) And you. Any time you’re home, call in to the farm in Clare. There’s twenty pints on my kitchen table, and a whole country of Ranemon to meet.',
    ),
  },
  ...said(
    'The State Dining Room is W.B Yates, Buckingham Palace now, run by Bridie. Florence Pugh pulls the pints. Charles is collecting glasses in an apron. He is not good at it.',
  ),
  // Charles lets slip who he answers to, and the text comes: Rowans (rowans.ts).
  ...REVEAL,
  ...said('THE END…? Go raibh maith agaibh. (Free the lads: done.)'),
];

export const PALACE_TRAINERS: Trainer[] = [
  guard('palace-guard-1', [
    ['gibbsmon', 44],
    ['olliemon', 45],
  ]),
  guard('palace-guard-2', [
    ['boydemon', 45],
    ['owemon', 46],
  ]),
  guard('palace-guard-3', [
    ['steadmon', 45],
    ['killemon', 46],
  ]),
  {
    id: 'rival-uk-2',
    name: 'Margaret Thatcher',
    rival: true,
    uk: true,
    team: [],
    ai: 'hard',
    prize: 2400,
    before:
      'THATCHER: I have queued for this since 1979. The lady’s not for turning, and she’s certainly not for losing to you.',
    after: 'THATCHER: …Go on, then. Mind the carpets.',
  },
  royal(
    'palace-edward',
    'Prince Edward',
    [
      ['robinmon', 46],
      ['lorcamon', 47],
      ['enda', 48],
      ['vinnimon', 49],
    ],
    'EDWARD: Hello! Prince Edward. Edward. The youngest. No? It’s fine. It’s fine. Shall we battle?',
    'EDWARD: Nobody will remember this either. Go on up.',
  ),
  royal(
    'palace-anne',
    'Princess Anne',
    [
      ['gibbsmon', 48],
      ['boydemon', 49],
      ['olliemon', 49],
      ['owemon', 50],
      ['killemon', 51],
    ],
    'ANNE: Don’t dawdle. I’ve eleven engagements this afternoon and a horse with a cough.',
    'ANNE: Hm. Well done. Genuinely. Now get out of my stables.',
  ),
  royal(
    'palace-william',
    'Prince William',
    [
      ['steadmon', 50],
      ['paulimon', 51],
      ['jammon', 51],
      ['simomon', 52],
      ['skehemon', 53],
    ],
    'WILLIAM: (It’s the Villa fan from Birmingham, without the moustache.) I DID tell you I knew a lot of people.',
    'WILLIAM: For what it’s worth, I’d have given you the jersey. Up the Villa.',
  ),
  royal(
    'palace-andrew',
    'Andrew Mountbatten Windsor',
    [
      ['hugomon', 52],
      ['thilomon', 53],
      ['vinnimon', 53],
      ['skehemon', 54],
      ['crampemon', 55],
    ],
    'ANDREW: I’m afraid I can’t have been here. I was at a Pizza Express in Woking. You’ll find my Ranemon don’t sweat. It’s a medical condition.',
    'ANDREW: That battle didn’t happen. I have no recollection of meeting you.',
  ),
  royal(
    'palace-queen',
    'Zombie Queen Elizabeth',
    [
      ['steadmon', 55],
      ['enda', 56],
      ['robinmon', 56],
      ['vinnimon', 57],
      ['skehemon', 57],
      ['crampemon', 58],
    ],
    'ZOMBIE QUEEN: One has been dead for four years. One took the Tube up from Windsor. It was frightful. One has seen off fifteen prime ministers, and one rather fancies seeing you off too.',
    'ZOMBIE QUEEN: (She sighs, straightens her hat and shuffles back down to the vaults.) Do tell Charles to water the begonias. And to pick up when they ring. One always did.',
    { line: 'A procession of undead corgis shuffles in behind her.' },
  ),
  royal(
    CHARLES,
    'King Charles',
    [
      ['robinmon', 57],
      ['steadmon', 58],
      ['lorcamon', 58],
      ['simomon', 59],
      ['vinnimon', 59],
      ['enda', 60],
    ],
    'CHARLES: One does not GIVE BACK things. It’s simply not done. Ask anyone. Ask Greece. CAMILLA: Oh, just battle the child, Charles.',
    'CHARLES: Oh, BOTHER.',
    { reward: TAKEOVER },
  ),
];

// ---------- the rooms ----------

/** Shut until whoever's in the room is beaten. */
const doorOut = (trainer: string) => ({
  0: {
    flag: `beat:${trainer}`,
    locked:
      'A footman stands in front of the door. FOOTMAN: Not until you’ve seen His Majesty’s family off, I’m afraid.',
    opened: 'The footman sighs, and opens the door.',
  },
});

/** The one in charge of a room: in the middle, facing the way in. */
const host = (look: Look, trainer: string, after: string): Npc => ({
  look,
  face: 'down',
  trainer,
  sight: 4,
  talk: said(after),
});

interface Room {
  name: string;
  rows: string[];
  npcs: Npc[];
  things: Record<string, string>;
  arrive: Step[];
  /** Beaten to open the door at the top. */
  boss?: string;
}

const ROOMS: Room[] = [
  {
    name: 'The Forecourt',
    rows: [
      'WWWWWWLWWWWWW',
      'WXFFFFFFFFFXW',
      'WF1FFFFFFF2FW',
      'WFFFFF4FFFFFW',
      'WFFFFFFFFFFFW',
      'WF3FFFFFFFFFW',
      'WXFFFF@FFFFXW',
      'WWWWWWEWWWWWW',
    ],
    npcs: [
      host('royalguard', 'palace-guard-1', 'ROYAL GUARD: …'),
      host('royalguard', 'palace-guard-2', 'ROYAL GUARD: …'),
      host('royalguard', 'palace-guard-3', 'ROYAL GUARD: …'),
      {
        look: 'thatcher',
        face: 'down',
        trainer: 'rival-uk-2',
        sight: 3,
        talk: said('THATCHER: Mind the carpets. They’re older than you.'),
      },
    ],
    things: {
      X: 'A sentry box. The guard in front of it hasn’t blinked since you arrived.',
    },
    arrive: said(
      'BUCKINGHAM PALACE. The gravel crunches. Somewhere a band is playing God Save the King, slightly too slowly.',
    ),
    boss: 'rival-uk-2',
  },
  {
    name: 'The Grand Staircase',
    rows: [
      'WWWWWWLWWWWWW',
      'WXsssssssssXW',
      'WsssssssssssW',
      'WXssss1ssssXW',
      'WFFFFFFFFFFFW',
      'WNFFFF@FFFFNW',
      'WWWWWWEWWWWWW',
    ],
    npcs: [host('edward', 'palace-edward', 'EDWARD: Up you go. Mind the third step, it creaks.')],
    things: {
      X: 'A portrait of a king. Under it, someone has stuck a Post-it: WHO IS THIS?',
      N: 'A potted palm, and a little sign: GIFT OF THE PEOPLE OF TUVALU.',
    },
    arrive: said('THE GRAND STAIRCASE. Red carpet, gold rails, and a portrait on every wall.'),
    boss: 'palace-edward',
  },
  {
    name: 'The Royal Mews',
    rows: [
      'WWWWWWLWWWWWW',
      'WAAAFFFFFAAAW',
      'WFFFFF1FFFFFW',
      'WAAFFFFFFFAAW',
      'WFFFFFFFFFFFW',
      'WNFFFF@FFFFNW',
      'WWWWWWEWWWWWW',
    ],
    npcs: [host('anne', 'palace-anne', 'ANNE: Through there. Don’t touch the horses.')],
    things: {
      A: 'A stall with a horse in it. It has a cough. It looks at you as if this is your fault.',
      N: 'A bale of hay with a riding crop stuck in it.',
    },
    arrive: said('THE ROYAL MEWS. Stables, a gold coach and a strong smell of horse.'),
    boss: 'palace-anne',
  },
  {
    name: 'The Ballroom',
    rows: [
      'WWWWWWLWWWWWW',
      'WXllllllllYXW',
      'Wlllll1lllllW',
      'WlllllllllllW',
      'WlllllllllllW',
      'WXllll@llllXW',
      'WWWWWWEWWWWWW',
    ],
    npcs: [host('william', 'palace-william', 'WILLIAM: Up the Villa. Go on, then.')],
    things: {
      X: 'A golden chandelier, low enough to bang your head on.',
      Y: 'A door with a note on it: GONE TO CALIFORNIA. NETFLIX HAVE THE REST. H.',
    },
    arrive: said(
      'THE BALLROOM. Gold everywhere, and a dance floor nobody has danced on since 1953.',
    ),
    boss: 'palace-william',
  },
  {
    name: 'The East Wing',
    rows: [
      'WWWWWWLWWWWWW',
      'WYYYrrrrrYYYW',
      'WrrrrrrrrrrrW',
      'WUUrrr1rrrUUW',
      'WrrrrrrrrrrrW',
      'WN2rrr@rrrrNW',
      'WWWWWWEWWWWWW',
    ],
    npcs: [
      host('andrew', 'palace-andrew', 'ANDREW: I’ve never met you. Through there.'),
      {
        look: 'bridie',
        face: 'right',
        talk: [
          ...said(
            'BRIDIE: You’re the one come for the Belfast lads? God love you. Sit down there and have a cup of tea.',
          ),
          { do: 'heal' },
          ...said('Your Ranemon are fighting fit again!'),
          ...said(
            'BRIDIE: Half the staff in this place is Irish, you know. The chef’s from Tuam. The gardener’s from Ballyfermot. We’ve been waiting a long time for someone like you.',
          ),
        ],
      },
    ],
    things: {
      Y: 'A door. The name plate says PRINCE ANDREW, crossed out, and ANDREW MOUNTBATTEN WINDSOR underneath, in biro.',
      U: 'A table with a pizza box on it, from a Pizza Express in Woking.',
      N: 'A rope across the corridor, and a sign: CLOSED TO THE PUBLIC.',
    },
    arrive: said('THE EAST WING. It’s quiet. Too quiet. There’s a smell of pizza.'),
    boss: 'palace-andrew',
  },
  {
    name: 'The State Dining Room',
    rows: [
      'WWWWWWLWWWWWW',
      'WJFFFFFFFFFJW',
      'WFFFFF1FFFFFW',
      'WFUUUUUUUUUFW',
      'WFFFFFFFFFFFW',
      'WNFFFF@FFFFNW',
      'WWWWWWEWWWWWW',
    ],
    npcs: [
      host(
        'queen',
        'palace-queen',
        'ZOMBIE QUEEN: Marmalade sandwich? One keeps one in one’s handbag for emergencies.',
      ),
    ],
    things: {
      J: 'A fireplace. The fire is green. That isn’t right.',
      U: 'A dining table for sixty, laid for one. The cutlery is covered in cobwebs.',
      N: 'A begonia, badly in need of watering.',
    },
    arrive: said(
      'THE STATE DINING ROOM. The lights flicker. Something is coming up the stairs from the vaults.',
    ),
    boss: 'palace-queen',
  },
  {
    name: 'The Throne Room',
    rows: [
      'WWWWWWWWWWWWW',
      'WOOOOXXXOOOOW',
      'WNFF2r1rFFFNW',
      'WFF3Frrr4FFFW',
      'WFFFFrrrFFFFW',
      'WF5FFrrrF6FFW',
      'WNFFFr@rFFFNW',
      'WWWWWWEWWWWWW',
    ],
    npcs: [
      {
        look: 'charles',
        face: 'down',
        trainer: CHARLES,
        talk: [
          {
            do: 'if',
            flag: AGREEMENT,
            then: [
              ...said('CHARLES: (In an apron.) Pint? I’m told I pour it like a Protestant.'),
              { do: 'heal' },
              ...said('Your Ranemon are fighting fit again!'),
            ],
            else: said(
              'CHARLES: You’re doing awfully well, Gerald. Awfully well. (to you) Oh. It’s you.',
            ),
          },
        ],
      },
      {
        look: 'camilla',
        face: 'down',
        talk: [
          {
            do: 'if',
            flag: AGREEMENT,
            then: said('CAMILLA: Enda is SUCH fun. Have you met Enda? We’re going to Brighton.'),
            else: said(
              'CAMILLA: (A gin and tonic in hand.) Oh, just battle the child, Charles. You know who’ll be on the phone on Tuesday if you don’t.',
            ),
          },
        ],
      },
      {
        look: 'mochara',
        face: 'down',
        talk: [
          {
            do: 'if',
            flag: KING_BEATEN,
            then: said('MO CHARA: Free! Free and on the balcony. Get up here, we’re on in five!'),
            else: said(
              'MO CHARA: (From inside a gilded birdcage.) Ah, finally! Here, did you bring Próvaí?',
            ),
          },
        ],
      },
      {
        look: 'moglai',
        face: 'down',
        talk: [
          {
            do: 'if',
            flag: KING_BEATEN,
            then: said('MÓGLAÍ BAP: Never again. Well. Until the next time.'),
            else: said('MÓGLAÍ BAP: (Also in the cage.) Don’t start singing, Mo.'),
          },
        ],
      },
      {
        look: 'provai',
        face: 'up',
        showIf: AGREEMENT,
        talk: [
          {
            do: 'if',
            flag: SHADOWS,
            then: said(
              'PRÓVAÍ: The Mall’s packed to Trafalgar Square. But that text… King’s Cross, the Victoria line. We’ll be there.',
            ),
            // Anyone who signed the Agreement before Rowans was in the game hears it here.
            else: [...said('PRÓVAÍ: Here. Charles has something he wants to tell you.'), ...REVEAL],
          },
        ],
      },
      {
        look: 'higgins',
        face: 'up',
        showIf: AGREEMENT,
        talk: said(
          'MICHAEL D: The jewels are going home to Dublin Castle. I’m going home to my dogs. Mind yourself over here.',
        ),
      },
    ],
    things: {
      X: 'Two thrones and, between them, an empty gilded birdcage.',
      O: 'Tall windows over the Mall. There’s a cupboard behind the thrones leaking green light.',
      N: 'A potted plant. Charles calls it Gerald.',
    },
    arrive: [
      {
        do: 'if',
        flag: AGREEMENT,
        then: said('THE THRONE ROOM. A tricolour over the thrones, and a céilí in full swing.'),
        else: said(
          'THE THRONE ROOM. King Charles is watering a potted plant and talking to it. Queen Camilla has a gin and tonic. Between the thrones, in a gilded cage, sit Mo Chara and Móglaí Bap.',
        ),
      },
    ],
  },
];

const room = (r: Room): Pick<GameMap, 'rows' | 'npcs' | 'name'> & Partial<GameMap> => ({
  name: r.name,
  rows: r.rows,
  npcs: r.npcs,
  things: r.things,
  arrive: r.arrive,
  ...(r.boss && { landmarkLocks: doorOut(r.boss) }),
});

/** The forecourt, behind the palace gates on the Mall. */
export const FORECOURT = room(ROOMS[0]);

/** The rooms past the forecourt, each behind the door at the top of the one before. */
export function palaceRooms(london: GameMap): GameMap[] {
  const gates = { map: london.id, ...find(london, 'L')[2] };
  return PALACE_ROOM_IDS.slice(1).map((id, j) => ({
    ...room(ROOMS[j + 1]),
    id,
    county: london.county,
    name: `${ROOMS[j + 1].name}, London`,
    inside: gates,
  }));
}
