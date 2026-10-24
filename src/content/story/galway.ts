import { interiorId } from './interiors';
import { homeward } from './station';
import { find, type GameMap, type Npc, type Step, type Trainer } from '@/lib/story/world';

/**
 * The Championship of Ireland, in Galway, after B&S. The Intercity from Connolly (platform 6)
 * runs once you're Champion. In the Hall of Champions on Eyre Square four of the best in the
 * country wait one after the other, each in a themed room of their own: Rob Lipsett, Blindboy
 * Boatclub, The 2 Johnnies and Bono. Beat all four in a row, with no healing at McGrattans in
 * between, and the door behind Bono opens on the secret Champion: Michael Collins. Beat him to
 * become Champion of Ireland.
 *
 * A run is the beat flags of the four and Collins (`RUN`). Any full heal (McGrattans, Mam, or
 * coming round in the pub after a blackout) wipes them (`healParty`), so you start again from
 * the first. Items from the BAG are fair game. Every team scales to your party, Champion or not,
 * coming in just under your best (`ABOVE`), so it's a fight at any level up to 100.
 */

/** The Hall of Champions is the second landmark door in Galway. */
export const HALL_ID = interiorId('galway', 'L', 1);

/** The four, in the order you meet them, and the secret Champion behind them. */
export const ELITE = ['galway-lipsett', 'galway-blindboy', 'galway-johnnies', 'galway-bono'];
export const COLLINS = 'galway-collins';

/** What one run through the hall has beaten so far. A full heal clears them all. */
export const RUN = [...ELITE, COLLINS].map((t) => `beat:${t}`);

/** Kept for good, unlike a run's beat flags: each one beaten at least once. */
export const wonFlag = (trainer: string) => `galway:won:${trainer}`;

/** Bono has told you about Michael Collins. */
export const COLLINS_HEARD = 'galway:collins';

/** Michael Collins is beaten: you're Champion of Ireland. */
export const CHAMPION_OF_IRELAND = 'galway:champion';

/** Wipes a run through the hall: the four and Collins can all be fought again. */
export function breakRun(flags: string[]): string[] {
  return flags.some((f) => RUN.includes(f)) ? flags.filter((f) => !RUN.includes(f)) : flags;
}

// ---------- the four and the Champion ----------

/**
 * Where each one's ace comes in against your best Ranemon: a few levels under it, rising to one
 * under for Collins, so the teams keep up with you all the way to 100. On their own, a party at
 * any level beats each of the four 3 to 4 times in 5 or better and Collins about half the time;
 * the whole run, with no healing but a bag of food, comes off about 1 time in 20
 * (`tests/sim/galway.test.ts`).
 */
export const ABOVE: Record<string, number> = {
  'galway-lipsett': -3,
  'galway-blindboy': -3,
  'galway-johnnies': -2,
  'galway-bono': -3,
  'galway-collins': -1,
};

const COLLINS_REWARD: Step[] = [
  {
    do: 'if',
    flag: CHAMPION_OF_IRELAND,
    then: [
      {
        do: 'say',
        text: 'MICHAEL COLLINS: Again, so. You’re the real thing, Champion. Same time next week.',
      },
    ],
    else: [
      {
        do: 'say',
        text: 'MICHAEL COLLINS: A hundred years nobody got past me. Ireland has a new Champion, then. Mind the title well. It was hard won.',
      },
      { do: 'flag', flag: CHAMPION_OF_IRELAND },
      { do: 'say', text: 'You are the CHAMPION OF IRELAND!' },
      {
        do: 'say',
        text: 'MICHAEL COLLINS: Take this. I’ve been keeping it behind the bar in Kiernan’s since 1921 for whoever earned it.',
      },
      { do: 'give', item: 'perfect-pour', count: 1 },
      {
        do: 'say',
        text: 'The whole hall is on its feet. Rob Lipsett is crying. Blindboy’s bag is rustling. The 2 Johnnies are already ringing their mammy. Bono is singing.',
      },
    ],
  },
  { do: 'flag', flag: wonFlag(COLLINS) },
];

const BONO_REWARD: Step[] = [
  { do: 'flag', flag: wonFlag('galway-bono') },
  {
    do: 'say',
    text: 'BONO: All four of us, one after the other, and you never once went for a pint. Nobody has done that. Not since 1922.',
  },
  {
    do: 'say',
    text: 'BONO: So I’ll tell you what B&S never knew. Their title was only ever Trinity’s. There’s been one true Champion of Ireland for a hundred years, and he’s never been beaten.',
  },
  {
    do: 'say',
    text: 'The door behind Bono swings open. Through it, in a hall of green, white and gold, a man in a Free State uniform straightens his cap.',
  },
  { do: 'flag', flag: COLLINS_HEARD },
];

export const GALWAY_TRAINERS: Trainer[] = [
  {
    id: 'galway-lipsett',
    name: 'Rob Lipsett',
    // Brawn: all muscle.
    team: [
      ['owemon', 57],
      ['boydemon', 57],
      ['killemon', 58],
      ['olliemon', 59],
      ['gibbsmon', 60],
    ],
    ai: 'hard',
    above: ABOVE['galway-lipsett'],
    prize: 6000,
    before:
      'ROB LIPSETT: Welcome to the Championship, bro. Up at 4am, cold plunge, fasted cardio, three scoops of preworkout. My heart is going like the clappers. LET’S GO.',
    after:
      'ROB LIPSETT: (He is shaking.) …And that’s what happens when you take preworkout before a Ranemon battle.',
    line: 'ROB LIPSETT: Light weight! LIGHT WEIGHT!',
    reward: [{ do: 'flag', flag: wonFlag('galway-lipsett') }],
  },
  {
    id: 'galway-blindboy',
    name: 'Blindboy Boatclub',
    // Chaos: nobody knows what's under the bag.
    team: [
      ['skehemon', 57],
      ['jammon', 58],
      ['crampemon', 58],
      ['hugomon', 59],
      ['thilomon', 60],
    ],
    ai: 'hard',
    above: ABOVE['galway-blindboy'],
    prize: 6000,
    before:
      'BLINDBOY: Story, boi. (The plastic bag over his head rustles.) Blindboy Boatclub, from Limerick, the only city in Ireland that matters. Now I’m going to talk to you about the history of the potato for a bit, and then I’m going to batter you.',
    after:
      'BLINDBOY: Ah, you’re some boi. I’m going home to Limerick to think about that in the bath.',
    line: 'BLINDBOY: Up Limerick, boi!',
    reward: [{ do: 'flag', flag: wonFlag('galway-blindboy') }],
  },
  {
    id: 'galway-johnnies',
    name: 'The 2 Johnnies',
    // Charm: the whole of rural Ireland loves them.
    team: [
      ['enda', 57],
      ['simomon', 58],
      ['lorcamon', 58],
      ['conemon', 59],
      ['vinnimon', 60],
    ],
    ai: 'hard',
    above: ABOVE['galway-johnnies'],
    prize: 6000,
    before:
      'JOHNNY B: Well, lads! JOHNNY SMACKS: WELL! JOHNNY B: Up from Cahir in the Hiace. There’s a tractor double-parked outside and the mart’s on at four, so we’ll make this quick.',
    after:
      'JOHNNY B: Ah stop. JOHNNY SMACKS: Ah STOP. JOHNNY B: That’s going on the podcast, so it is.',
    line: 'JOHNNY SMACKS: G’wan the Johnnies!',
    reward: [{ do: 'flag', flag: wonFlag('galway-johnnies') }],
  },
  {
    id: 'galway-bono',
    name: 'Bono',
    // Hype: the biggest band in the world.
    team: [
      ['paulimon', 57],
      ['lorcamon', 57],
      ['carlmon', 58],
      ['crampemon', 58],
      ['robinmon', 59],
      ['oismon', 59],
    ],
    ai: 'hard',
    above: ABOVE['galway-bono'],
    prize: 7000,
    before:
      'BONO: (He does not take off the sunglasses. He never takes off the sunglasses.) I’ve played to a hundred thousand people in Rio. I can play to one. But I still haven’t found what I’m looking for. Maybe it’s you.',
    after: 'BONO: …It’s a beautiful day. Even when you lose. Especially when you lose.',
    line: 'BONO: Hello, Galway!',
    reward: BONO_REWARD,
  },
  {
    id: COLLINS,
    name: 'Michael Collins',
    // The best of every type: the true Champion.
    team: [
      ['hugomon', 58],
      ['vinnimon', 58],
      ['gibbsmon', 59],
      ['thilomon', 59],
      ['olliemon', 60],
      ['oismon', 60],
    ],
    ai: 'hard',
    above: ABOVE[COLLINS],
    prize: 12000,
    before:
      'MICHAEL COLLINS: So you’re the one who beat B&S, and then the four of them. I’m Michael Collins. I’ve held the title since 1922, and nobody has made it past me. Shall we?',
    after: 'MICHAEL COLLINS: …Well. That’s that, so.',
    line: 'MICHAEL COLLINS: For Ireland!',
    reward: COLLINS_REWARD,
  },
];

// ---------- the Hall of Champions ----------

/**
 * The Hall of Champions is five rooms, one per battler, in a line: Rob Lipsett's gym, Blindboy's
 * study, the 2 Johnnies' farmhouse kitchen, Bono's stage and the Champion's hall. Each one waits
 * in the middle of their room, in front of the door to the next, which stays shut until they're
 * beaten in this run. The way out at the bottom of any room goes back to Eyre Square.
 */
export const ROOMS = [HALL_ID];
for (let i = 1; i < 5; i++) ROOMS.push(interiorId(ROOMS[i - 1], 'L', 0));

/** Where the battler stands, facing the way in, and how far they see. */
const SIGHT = 4;

interface Arena {
  name: string;
  rows: string[];
  things: Record<string, string>;
  /** Everyone in the room, the battler first. */
  npcs: Npc[];
  arrive: Step[];
}

const said = (text: string): Step[] => [{ do: 'say', text }];

/** One of the four: in the middle of the room, facing the way in. */
const battler = (i: number, after: string): Npc => ({
  look: (['lipsett', 'blindboy', 'johnnyb', 'bono'] as const)[i],
  face: 'down',
  trainer: ELITE[i],
  sight: SIGHT,
  ...(i > 0 && { readyIf: `beat:${ELITE[i - 1]}` }),
  talk: said(after),
});

const ARENAS: Arena[] = [
  {
    name: 'Rob Lipsett’s Gym',
    rows: [
      'WWWWWWLWWWWWW',
      'WXgggggggggXW',
      'WXgggg1ggggXW',
      'WggggggggggUW',
      'WUgggggggggUW',
      'WggggggggggUW',
      'WXgggggggggXW',
      'WXgggg@ggggXW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      X: 'A rack of dumbbells, all the way up to 50kg. The 50s have never been touched.',
      U: 'A bench press with a tub of preworkout on it. The label says ONE scoop.',
    },
    npcs: [battler(0, 'ROB LIPSETT: Go on through, bro. Hydrate. HYDRATE.')],
    arrive: [
      {
        do: 'if',
        flag: RUN[0],
        then: said('THE HALL OF CHAMPIONS. You’re still on your run. Stay out of McGrattans.'),
        else: said(
          'THE HALL OF CHAMPIONS. Four in a row, no healing in between. Heal or lose, and it’s back to the first. First up: a gym that smells of protein shakes.',
        ),
      },
    ],
  },
  {
    name: 'Blindboy’s Study',
    rows: [
      'WWWWWWLWWWWWW',
      'WYYYJrrrJYYYW',
      'WNrrrr1rrrrNW',
      'WrrrrrrrrrrrW',
      'WUUrrrrrrrUUW',
      'WrrrrrrrrrrrW',
      'WUrrrrrrrrrUW',
      'WNrrrr@rrrrNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      Y: 'Shelves of books about Limerick, and one about the potato, signed.',
      J: 'A fire with a kettle on it. A spare plastic bag is drying on the guard.',
      U: 'A desk with a typewriter and a mug that says LIMERICK, YOU’RE A LADY.',
    },
    npcs: [battler(1, 'BLINDBOY: Go on through, boi. Mind yourself in there.')],
    arrive: said('BLINDBOY’S STUDY. Books, a fire, and the smell of a bath being run somewhere.'),
  },
  {
    name: 'The 2 Johnnies’ Kitchen',
    rows: [
      'WWWWWWLWWWWWW',
      'WAAJFFFFFJAAW',
      'WFFFF21FFFFFW',
      'WFFFFFFFFFFFW',
      'WUUFFFFFFFUUW',
      'WUUFFFFFFFUUW',
      'WFFFFFFFFFFFW',
      'WNFFFF@FFFFNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      A: 'A dresser of good plates nobody is allowed to use, and a Sacred Heart lamp.',
      J: 'A range, going full blast in all weathers.',
      U: 'A kitchen table: a pot of tea, ham sandwiches and the Farmers Journal open at the mart prices.',
    },
    npcs: [
      battler(2, 'JOHNNY B: G’wan through to Bono. He’ll talk your ear off, mind.'),
      {
        look: 'johnnysmacks',
        face: 'down',
        talk: said(
          'JOHNNY SMACKS: Talk to Johnny B, he does the battling. I do the driving. And the shouting. WELL!',
        ),
      },
    ],
    arrive: said('THE 2 JOHNNIES’ KITCHEN. A farmhouse kitchen, the range lit, the radio on.'),
  },
  {
    name: 'Bono’s Stage',
    rows: [
      'WoooooLoooooW',
      'WIkkkkkkkkkIW',
      'WIllll1llllIW',
      'WklllllllllkW',
      'WklllllllllkW',
      'WklllllllllkW',
      'WIkkkkkkkkkIW',
      'WIkkkk@kkkkIW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      I: 'A speaker stack. It says BONO on it, in case anyone forgets.',
      o: 'A wall of lights spelling out the name of every album. It takes a while.',
    },
    npcs: [
      battler(
        3,
        'BONO: Walk on. Walk on. What you got, they can’t steal it. He’s waiting for you.',
      ),
    ],
    arrive: said('BONO’S STAGE. The lights come up. The crowd you can’t see goes wild.'),
  },
  {
    name: 'The Champion’s Hall',
    rows: [
      'WWWWWWWWWWWWW',
      'WOOOOXXXOOOOW',
      'WNFFFr1rFFFNW',
      'WXFFFrrrFFFXW',
      'WFFFFrrrFFFFW',
      'WXFFFrrrFFFXW',
      'WFFFFrrrFFFFW',
      'WNFFFr@rFFFNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      X: 'A bronze statue of a Champion from long ago. The plaque has been worn smooth.',
      O: 'High windows over Eyre Square. You can hear Galway Girl from here.',
    },
    npcs: [
      {
        look: 'collins',
        face: 'down',
        trainer: COLLINS,
        sight: SIGHT,
        readyIf: `beat:${ELITE[3]}`,
        talk: said('MICHAEL COLLINS: Go on home, Champion. Ireland’s waiting on you.'),
      },
    ],
    arrive: said('THE CHAMPION’S HALL. Green, white and gold, and 1922 carved over the chair.'),
  },
];

/** The door at the top of each of the four's rooms: shut until they're beaten in this run. */
const doorOut = (i: number): Record<number, { flag: string; locked: string; opened: string }> => ({
  0: {
    flag: `beat:${ELITE[i]}`,
    locked: 'The door is shut. You’ll have to get past whoever’s in this room first.',
    opened: 'The door swings open.',
  },
});

const arena = (i: number): Pick<GameMap, 'rows' | 'npcs' | 'name'> & Partial<GameMap> => ({
  name: ARENAS[i].name,
  rows: ARENAS[i].rows,
  npcs: ARENAS[i].npcs,
  things: ARENAS[i].things,
  arrive: ARENAS[i].arrive,
  ...(i < ELITE.length && { landmarkLocks: doorOut(i) }),
});

// ---------- Galway ----------

/** The Intercity conductor who brings you back to Connolly. */
const CONDUCTOR: Npc = { look: 'conductor', face: 'right', talk: homeward('galway') };

const DOORMAN: Npc = {
  look: 'bouncer',
  face: 'down',
  talk: [
    {
      do: 'if',
      flag: CHAMPION_OF_IRELAND,
      then: [
        {
          do: 'say',
          text: 'DOORMAN: Champion of Ireland! In you go. They’re all up for another go, and so is he.',
        },
      ],
      else: [
        {
          do: 'say',
          text: 'DOORMAN: The Hall of Champions. Four of the best in the country, one after the other. No going back to McGrattans in between: heal up, or lose, and you start again from the first. Stock up in Vapes.',
        },
      ],
    },
  ],
};

const BUSKER: Npc = {
  look: 'busker',
  face: 'down',
  talk: [
    {
      do: 'say',
      text: 'BUSKER: (She’s been playing Galway Girl on a loop since nine o’clock.) Request? Is it Galway Girl? It’s always Galway Girl.',
    },
  ],
};

const LOCAL: Npc = {
  look: 'local',
  face: 'left',
  talk: [
    {
      do: 'if',
      flag: COLLINS_HEARD,
      then: [
        {
          do: 'say',
          text: 'LOCAL: Michael Collins? In the Hall? Sure everyone knows that. We just don’t say it to Dubs.',
        },
      ],
      else: [
        {
          do: 'say',
          text: 'LOCAL: There’s a rumour about the Hall of Champions. Beat all four in a row and someone else comes out. Nobody’s seen him in a hundred years.',
        },
      ],
    },
  ],
};

/** Eyre Square up the middle, the Spanish Arch and the Hall of Champions, and the bay below. */
export const GALWAY: GameMap = {
  id: 'galway',
  name: 'Galway City, Co. Galway',
  county: 10,
  // New places are 2D only: the 3D look shows Galway and the Hall in 2D.
  flat: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^vv^^^^^v^^^^^^^^T',
    'T##P#M#vv##L##v^^^^^^^^T',
    'T1vvvvvvvvvvvvv^^^^^^^^T',
    'T@vvvvvvvvvvvvv####L###T',
    'Taaaaaaaaaaaaaaavv2vvvvT',
    'Tvvvvvvvvvvvvvvvvvvvvv4T',
    'Tv,,,,,,,""vvvvvvSvvvvvT',
    'Tv,,,,,,,""vvv3vvvvvvvvT',
    'Tv,,,,,,,""vvvvvvvvvvvvT',
    'TvvvvvvvvvvvvvvvvvvvvvvT',
    'T~~~y~~~~~~~~~~~~~y~~~~T',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  // Eyre Square's long grass: what the four and Collins fight with.
  wild: {
    min: 56,
    max: 60,
    table: [
      ['gibbsmon', 15],
      ['olliemon', 20],
      ['hugomon', 15],
      ['vinnimon', 15],
      ['paulimon', 15],
      ['skehemon', 20],
    ],
  },
  npcs: [CONDUCTOR, DOORMAN, BUSKER, LOCAL],
  signs: [
    'THE HALL OF CHAMPIONS. Four in a row, no healing in between. The Championship of Ireland.',
  ],
  landmarks: [
    [
      {
        do: 'say',
        text: 'THE SPANISH ARCH. Four hundred years old, on the bank of the Corrib, where the Spanish ships came in with wine. Now it’s mostly cans.',
      },
    ],
    [
      {
        do: 'say',
        text: 'THE HALL OF CHAMPIONS. A stone hall on Eyre Square with 1922 carved over the door.',
      },
    ],
  ],
  landmarkRooms: { 1: arena(0) },
};

/**
 * The rooms past the first, each one behind the door at the top of the room before. Their way
 * out goes back to Eyre Square, like the first room's.
 */
export const HALL_ROOMS: GameMap[] = ROOMS.slice(1).map((id, j) => {
  const door = find(GALWAY, 'L')[1];
  return {
    ...arena(j + 1),
    id,
    county: GALWAY.county,
    name: `${ARENAS[j + 1].name}, Galway City`,
    inside: { map: GALWAY.id, ...door },
  };
});
