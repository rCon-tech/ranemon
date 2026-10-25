import { interiorId } from './interiors';
import { CHAMPION, FIXTURES, RAILCARD } from './kneecap';
import { JAMIE_AT_KINGS_CROSS, METROPOLITAN } from './sidemen';
import { find, slot } from '@/lib/story/world';
import type {
  ClubId,
  GameMap,
  LandmarkKind,
  Look,
  Npc,
  Scenery,
  Step,
  Trainer,
  Wild,
  Yates,
} from '@/lib/story/world';

/**
 * The Premier League (docs/london-expansion.md, chapters 7 to 9). Trains leave King's Cross for
 * every ground once Próvaí has told you about the lads. At each ground a club legend waits on
 * the touchline: beat them for the club's jersey. The twelve are played in order, from the
 * smallest club to the biggest (each ground's turnstile is shut until the one before is won),
 * and the last, Roy Keane at Old Trafford, makes you Premier League Champion, which opens
 * Buckingham Palace.
 *
 * Every map here is 2D only and in Britain (`flat`, `uk`), with a W.B Yates of its own.
 */

/** King's Cross, behind the first landmark door in London. */
export const KINGS_CROSS_ID = interiorId('london', 'L', 0);

/** Where a train back into London leaves you on the King's Cross concourse. */
const CONCOURSE = { x: 6, y: 5 };

/** A club's jersey, won from its legend. Kept apart from the nine county jerseys. */
export const plFlag = (club: string) => `pl:${club}`;

/** The legend at a club's ground, as a trainer id. */
export const legendId = (club: string) => `pl-${club}`;

/** Ollie's parents' postcards from Michael D's farm, one after each jersey, in order. */
const POSTCARDS = [
  'Jammon has fixed ze tractor. Michael D is very happy.',
  'Simomon is behind ze barn. “Blazing up”, he says. We do not ask.',
  'Endamon has made friends with ze cows. All of ze cows.',
  'Carlmon is in ze village pub. He says he is “minding it”.',
  'Steadmon was asleep by eight. Ze sheep were still awake.',
  'Oismon has found mushrooms in ze far field. We have taken zem away.',
  'Olliemon and Michael D watched ze hurling. Olliemon cried. Michael D cried also.',
  'Gibbsmon has dug a trench around ze farmhouse. For ze security.',
  'Killemon took action before decision and is now on ze roof.',
  'Lorcamon bought everybody a round. His was ze 0%.',
  'Robinmon is spreading a positive message to ze hens. Ze hens are positive.',
];

const postcard = (i: number): Step[] =>
  i < POSTCARDS.length
    ? [
        {
          do: 'say',
          text: `A postcard from Ollie’s parents, from Michael D’s farm in Clare: “${POSTCARDS[i]}”`,
        },
      ]
    : [];

// ---------- the twelve ----------

interface Club {
  id: ClubId;
  club: string;
  ground: string;
  legend: string;
  look: Look;
  /** Where the ground is: the town's map, and the train to it from King's Cross. */
  map: string;
  before: string;
  after: string;
  /** What else the legend gives you after the jersey. */
  gift: Step[];
  /** What the seats and the pitch say when you look at them. */
  seats: string;
  pitch: string;
}

/**
 * The teams, fixture by fixture: each a little harder than the one before, whoever is in it. The
 * first club you play gets the first team, and so on.
 */
const FIXTURE_TEAMS: Pick<Trainer, 'team' | 'ai'>[] = [
  {
    ai: 'normal',
    team: [
      ['olliemon', 8],
      ['gibbsmon', 9],
      ['boydemon', 10],
    ],
  },
  {
    ai: 'normal',
    team: [
      ['steadmon', 12],
      ['paulimon', 13],
      ['hugomon', 14],
    ],
  },
  {
    ai: 'normal',
    team: [
      ['thilomon', 15],
      ['boydemon', 16],
      ['owemon', 17],
    ],
  },
  {
    ai: 'normal',
    team: [
      ['lorcamon', 17],
      ['robinmon', 18],
      ['vinnimon', 19],
      ['enda', 20],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['killemon', 20],
      ['oismon', 21],
      ['carlmon', 22],
      ['crampemon', 23],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['jammon', 23],
      ['skehemon', 24],
      ['robinmon', 24],
      ['simomon', 26],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['steadmon', 26],
      ['skehemon', 27],
      ['paulimon', 28],
      ['simomon', 29],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['olliemon', 29],
      ['carlmon', 30],
      ['gibbsmon', 30],
      ['killemon', 31],
      ['owemon', 32],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['enda', 32],
      ['boydemon', 33],
      ['lorcamon', 33],
      ['gibbsmon', 34],
      ['vinnimon', 35],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['oismon', 35],
      ['conemon', 36],
      ['killemon', 36],
      ['paulimon', 37],
      ['carlmon', 38],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['robinmon', 39],
      ['steadmon', 40],
      ['hugomon', 40],
      ['lorcamon', 41],
      ['enda', 41],
      ['vinnimon', 42],
    ],
  },
  {
    ai: 'hard',
    team: [
      ['thilomon', 43],
      ['hugomon', 44],
      ['skehemon', 44],
      ['crampemon', 45],
      ['boydemon', 45],
      ['owemon', 46],
    ],
  },
];

/**
 * The twelve, in the order you play them: smallest fan base first, biggest last (a rough
 * estimate from supporter surveys and followers online), so you start at the Amex and finish at
 * Old Trafford.
 */
const CLUBS: Club[] = [
  {
    id: 'brighton',
    club: 'Brighton & Hove Albion',
    ground: 'The Amex',
    legend: 'Glenn Murray',
    look: 'murray',
    map: 'falmer',
    before:
      'MURRAY: I played for Brighton and for Palace, and I chose Brighton. That’s all you need to know about me.',
    after: 'MURRAY: Fair play. Enda said you’d be good. Enda says that about everyone, to be fair.',
    gift: [
      { do: 'say', text: 'MURRAY: Have a pint on me. The bar’s open even when there’s no match.' },
      { do: 'give', item: 'perfect-pour', count: 1 },
    ],
    seats: 'Blue and white seats. Enda’s seat from the last time still has his scarf on it.',
    pitch: 'The Amex, empty, with the sprinklers on. It looks very peaceful without the fans.',
  },
  {
    id: 'palace',
    club: 'Crystal Palace',
    ground: 'Selhurst Park',
    legend: 'Ian Wright',
    look: 'wright',
    map: 'tube',
    before: 'WRIGHTY: LISTEN TO ME. LISTEN TO ME. You are a BAD MAN. In a GOOD way. Come on then!',
    after:
      'WRIGHTY: OH MY DAYS. OH. MY. DAYS. You’ve done me! I played for Palace AND Arsenal and you’ve DONE me!',
    gift: [
      {
        do: 'say',
        text: 'WRIGHTY: You need to get round the country, yeah? TAKE MY RAILCARD. It’s a Senior Railcard. Don’t tell anyone.',
      },
      { do: 'flag', flag: RAILCARD },
      {
        do: 'say',
        text: 'You got IAN WRIGHT’S RAILCARD! The trains to Birmingham and Newcastle run for you now.',
      },
    ],
    seats:
      'Red and blue seats, and the Holmesdale Road end, which is still singing from last season.',
    pitch:
      'Selhurst Park. The eagle that flies before every match is sitting on the crossbar, watching you.',
  },
  {
    id: 'villa',
    club: 'Aston Villa',
    ground: 'Villa Park',
    legend: 'Paul McGrath',
    look: 'mcgrath',
    map: 'birmingham',
    before:
      'McGRATH: The knees are gone, so I don’t really train. I just turn up. It works, mostly.',
    after: 'McGRATH: Ah, well done. Sure there’s always next week. There always was for me.',
    gift: [
      {
        do: 'say',
        text: 'McGRATH: Take a full Irish. It’s the only thing that ever worked on the knees.',
      },
      { do: 'give', item: 'full-irish', count: 3 },
    ],
    seats: 'Claret and blue seats. In the Holte End a choir is singing that Paul McGrath is God.',
    pitch: 'Villa Park. There’s no training cone anywhere near Paul McGrath. There never has been.',
  },
  {
    id: 'everton',
    club: 'Everton',
    ground: 'Bramley-Moore Dock',
    legend: 'Duncan Ferguson',
    look: 'ferguson',
    map: 'liverpool',
    before: 'FERGUSON: Right.',
    after: 'FERGUSON: Fair enough.',
    gift: [
      { do: 'say', text: 'Big Dunc hands you the jersey and two cans. He says nothing.' },
      { do: 'give', item: 'blue-ghost', count: 2 },
    ],
    seats: 'Blue seats, brand new, with the River Mersey right behind them. It smells of the sea.',
    pitch: 'The new pitch at Bramley-Moore Dock. A seagull is standing on the centre spot.',
  },
  {
    id: 'leeds',
    club: 'Leeds United',
    ground: 'Elland Road',
    legend: 'Marcelo Bielsa',
    look: 'bielsa',
    map: 'leeds',
    before:
      'BIELSA: I know your team. I sent a man to watch you through the hedge. I apologise. But I know your team.',
    after: 'BIELSA: I knew your team. I did not know you. That is football.',
    gift: [
      {
        do: 'say',
        text: 'BIELSA: Take my bucket. I have sat on it for four years. Sit on it and you will think you know everybody’s team. You will not. But you will think it.',
      },
      { do: 'flag', flag: 'item:bucket' },
      { do: 'say', text: 'You got BIELSA’S BUCKET!' },
    ],
    seats: 'White seats. Someone has written MARCHING ON TOGETHER on every one of them.',
    pitch: 'Elland Road. The touchline has a small round dent in it where the bucket used to be.',
  },
  {
    id: 'newcastle',
    club: 'Newcastle United',
    ground: 'St James’ Park',
    legend: 'Alan Shearer',
    look: 'shearer',
    map: 'newcastle',
    before: 'SHEARER: Right. One arm up. Let’s go.',
    after:
      'SHEARER: He’ll be disappointed with that. I’m he. I’m disappointed with that. Good win.',
    gift: [
      { do: 'say', text: 'SHEARER: Here. Two of me mam’s dinners. Not the same as yours. Close.' },
      { do: 'give', item: 'full-irish', count: 2 },
    ],
    seats: 'Black and white seats. The fans in them are topless. It’s snowing.',
    pitch: 'St James’ Park, up on the hill. You can see the whole city from the Gallowgate.',
  },
  {
    id: 'spurs',
    club: 'Tottenham Hotspur',
    ground: 'Tottenham Hotspur Stadium',
    legend: 'Robbie Keane',
    look: 'robbie',
    map: 'tube',
    before:
      'ROBBIE KEANE: Ah, here, an Irish trainer! Lovely. Any relation to Roy? No? Good. Beat me and I’ll do the cartwheel. Lose and I’ll do it anyway.',
    after:
      'Robbie Keane does the cartwheel, the forward roll and the finger guns, in that order. ROBBIE KEANE: Still got it.',
    gift: [
      {
        do: 'say',
        text: 'ROBBIE KEANE: Here, have a trophy. It’s a replica. We only have the one real one. A steward polishes it every hour.',
      },
      { do: 'flag', flag: 'item:replica' },
      { do: 'say', text: 'You got a REPLICA EUROPA LEAGUE TROPHY!' },
    ],
    seats: 'Navy seats, and a glass case with one trophy in it, being polished by a steward.',
    pitch: 'A pitch that slides out from under the stand for the NFL. A steward says not to ask.',
  },
  {
    id: 'city',
    club: 'Manchester City',
    ground: 'The Etihad',
    legend: 'Sergio Agüero',
    look: 'aguero',
    map: 'manchester',
    before:
      'AGÜERO: You know what 93:20 means here? It means it’s never over. Not the season, not the hearing, not the appeal. Vamos.',
    after:
      'The commentator, from somewhere high up: “AGÜEROOOO… no. NO! It’s the Irish lad! City will be appealing that, surely.”',
    gift: [],
    seats:
      'Sky blue seats, every one sponsored by a different company. They all have the same address. It’s in the Gulf.',
    pitch:
      'The Etihad. The clock on the big screen is stuck at 93:20, beside a second screen counting the charges: 115. Nobody here wants either fixed.',
  },
  {
    id: 'chelsea',
    club: 'Chelsea',
    ground: 'Stamford Bridge',
    legend: 'John Terry',
    look: 'terry',
    map: 'tube',
    before: 'TERRY: Captain. Leader. Legend. It’s on a banner, so it’s true.',
    after: 'TERRY: Still a legend. Banner says so.',
    gift: [
      {
        do: 'say',
        text: 'TERRY: Take a cup of tea. Captains always get the tea in. That’s the rule.',
      },
      { do: 'give', item: 'cup-of-tea', count: 3 },
    ],
    seats: 'Blue seats, and a banner the length of the stand: JT. CAPTAIN. LEADER. LEGEND.',
    pitch: 'Stamford Bridge. John Terry is in full kit, shin pads and all. There’s no match.',
  },
  {
    id: 'arsenal',
    club: 'Arsenal',
    ground: 'The Emirates',
    legend: 'Thierry Henry',
    look: 'henry',
    map: 'tube',
    before: 'HENRY: Ah, ze Irish. You are still upset about ze 2009? …Okay. Zis is fair. Allez.',
    after:
      'HENRY: Bravo. (He offers to shake your hand, then pulls it back.) I am joking. I am joking. ’Ere.',
    gift: [
      { do: 'say', text: 'HENRY: Take some Monster. Va-va-voom, as we say.' },
      { do: 'give', item: 'monster', count: 3 },
    ],
    seats: 'Red seats. Ollie is somehow in one of them, cheering for Henry.',
    pitch: 'The Emirates. Henry’s statue by the gate is sliding on its knees. So is Henry.',
  },
  {
    id: 'liverpool',
    club: 'Liverpool',
    ground: 'Anfield',
    legend: 'Steven Gerrard',
    look: 'gerrard',
    map: 'liverpool',
    before: 'GERRARD: We go again. Careful there. It’s slippy. Trust me.',
    after: 'GERRARD: We go again. Well. You go on. I’ll stay here.',
    gift: [
      {
        do: 'say',
        text: 'GERRARD: Take a Monster. You’ll need the energy for Old Trafford. Keane is a different animal.',
      },
      { do: 'give', item: 'monster', count: 3 },
    ],
    seats: 'Red seats, and THIS IS ANFIELD over the tunnel. You touch it on the way past.',
    pitch: 'Anfield. The grass by the penalty spot is wet. Gerrard won’t go anywhere near it.',
  },
  {
    id: 'united',
    club: 'Manchester United',
    ground: 'Old Trafford',
    legend: 'Roy Keane',
    look: 'keane',
    map: 'manchester',
    before:
      'KEANE: Eleven jerseys. Eleven. And you think that makes you a champion? This is the biggest club in the world. Fail to prepare, prepare to fail.',
    after: 'KEANE: Ah, you weren’t bad. I’ll not say any more than that.',
    gift: [
      {
        do: 'say',
        text: 'KEANE: Take the jersey. Take Fergie’s hairdryer as well, he left it in the dressing room in 2013. Point it at something you don’t like.',
      },
      { do: 'flag', flag: 'item:hairdryer' },
      { do: 'say', text: 'You got FERGIE’S HAIRDRYER!' },
    ],
    seats: 'Red seats. A bucket on one of them catches the drip from the roof. It’s nearly full.',
    pitch:
      'The Old Trafford pitch. A steward tells you it’s the Theatre of Dreams. It’s raining. There are confetti cannons all round it, just in case.',
  },
];

/** Becoming Premier League Champion, after Roy Keane, and the King's letter. */
const CHAMPIONS: Step[] = [
  {
    do: 'say',
    text: 'The confetti cannons go off. The Premier League trophy is carried out onto the Old Trafford pitch, and handed to you.',
  },
  {
    do: 'say',
    text: 'All twelve legends line up to clap you through. Roy Keane does not clap.',
  },
  { do: 'flag', flag: CHAMPION },
  { do: 'flag', flag: 'item:trophy' },
  { do: 'say', text: 'You are PREMIER LEAGUE CHAMPION!' },
  {
    do: 'say',
    text: 'A footman in red and gold walks across the pitch with a letter on a silver tray.',
  },
  {
    do: 'say',
    text: 'FOOTMAN: His Majesty requests the presence of the Premier League Champion at Buckingham Palace.',
  },
  { do: 'say', text: 'FOOTMAN: He hopes very much that you can’t come.' },
  {
    do: 'say',
    text: 'PRÓVAÍ: (on the phone) CHAMPIONS! Get back to London. The police on the Mall have to let you through now. It’s the law. Probably.',
  },
];

export const PL_TRAINERS: Trainer[] = CLUBS.map((c, i) => {
  const { team, ai } = FIXTURE_TEAMS[i];
  const ace = Math.max(...team.map(([, l]) => l));
  return {
    id: legendId(c.id),
    name: c.legend,
    uk: true,
    team,
    ai,
    prize: ace * 40,
    before: c.before,
    after: c.after,
    reward: [
      { do: 'flag', flag: plFlag(c.id) },
      { do: 'say', text: `You won the ${c.club.toUpperCase()} jersey!` },
      ...c.gift,
      ...(i === CLUBS.length - 1 ? CHAMPIONS : postcard(i)),
    ],
  };
});

// ---------- the grounds ----------

/** A layout with only the first `n` people's places in it: the rest are floor. */
const placesFor = (rows: string[], n: number) =>
  rows.map((r) => r.replace(/[1-9]/g, (d) => (Number(d) <= n ? d : 'F')));

const GROUND = [
  'WWWWWWWWWWWW',
  'WnnnnnnnnnnW',
  'WxxxxxxxxxxW',
  'WxxxxxxxxxxW',
  'WFFFFF1FFFFW',
  'WFFFFFFFFFFW',
  'WnnnFFFFnnnW',
  'WF2FFFFFF3FW',
  'WFFFFF@FFFFW',
  'WWWWWWEWWWWW',
];

/** A club's ground: its legend on the touchline, and anyone else who's about. */
function groundRoom(
  c: Club,
  others: Npc[] = [],
): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things' | 'crest'> {
  const npcs: Npc[] = [{ look: c.look, face: 'down', trainer: legendId(c.id) }, ...others];
  return {
    name: c.ground,
    crest: c.id,
    rows: placesFor(GROUND, npcs.length),
    npcs,
    things: { n: c.seats, x: c.pitch },
  };
}

const clubById = (id: string) => CLUBS.find((c) => c.id === id)!;

/** A ground's turnstile: shut until the club before it in the fixtures is beaten. */
function turnstile(id: string) {
  const i = CLUBS.findIndex((c) => c.id === id);
  if (i === 0) return undefined;
  return {
    flag: plFlag(CLUBS[i - 1].id),
    locked: `STEWARD: ${clubById(id).ground}’s closed until later in the season, love. You’ve ${CLUBS[i - 1].legend} to beat first.`,
    opened: 'The turnstile clunks round. You’re in.',
  };
}

/** A ground's door from the street: what it says outside, and its turnstile. */
function grounds(ids: string[]): Pick<GameMap, 'landmarks' | 'landmarkLocks'> {
  const landmarks = ids.map((id): Step[] => {
    const c = clubById(id);
    return [{ do: 'say', text: `${c.ground.toUpperCase()}. Home of ${c.club}.` }];
  });
  const landmarkLocks = Object.fromEntries(
    ids.flatMap((id, i) => {
      const lock = turnstile(id);
      return lock ? [[i, lock]] : [];
    }),
  );
  return { landmarks, landmarkLocks };
}

// ---------- the trains ----------

interface Line {
  /** Where it goes, as on the board. */
  to: string;
  map: string;
  /** The train, as the guard calls it. */
  train: string;
  ride: string;
  first: string;
  /** Shut until you have the Railcard. */
  railcard?: boolean;
}

/**
 * The trains from King's Cross, one per platform, in the order you first need them: platform 1
 * for the first club, and so on up the table.
 */
const LINES: Line[] = [
  {
    to: 'Brighton',
    map: 'falmer',
    train: 'The 09:12 to Brighton, for Falmer and the Amex',
    ride: 'South to the sea, then a little train up the hill. Enda is waving from the platform.',
    first: 'FALMER. A station, a university, the South Downs, and the Amex. And Enda.',
  },
  {
    to: 'The Tube',
    map: 'tube',
    train:
      'The Underground, for Selhurst Park, the Tottenham Hotspur Stadium, Stamford Bridge and the Emirates',
    ride: 'Down the escalators, onto the Victoria line. Nobody looks at anybody.',
    first:
      'THE TUBE. Four London grounds, one Underground, and a lot of people standing on the left.',
  },
  {
    to: 'Birmingham',
    map: 'birmingham',
    railcard: true,
    train: 'The 10:03 to Birmingham New Street, for Villa Park',
    ride: 'Up through the Chilterns, past a lot of HS2 that isn’t there yet.',
    first:
      'BIRMINGHAM. Canals, a Bullring with a bronze bull, Selfridges in its silver discs, and a lot of flat caps.',
  },
  {
    to: 'Liverpool',
    map: 'liverpool',
    train: 'The 10:47 to Liverpool Lime Street, for Everton and Anfield',
    ride: 'Over to the west coast. The closer you get, the more Irish everyone sounds.',
    first:
      'LIVERPOOL. The Mersey, the Liver Birds on the Liver Building, the ferry to Dublin, and half the city with an Irish granny.',
  },
  {
    to: 'Leeds',
    map: 'leeds',
    train: 'The 11:30 to Leeds, for Elland Road. It’s late. It’s always late',
    ride: 'Up the East Coast line. A man opposite has a Leeds tattoo on his neck and a Leeds tattoo on his other neck.',
    first:
      'LEEDS. The Town Hall clock, the white rose of Yorkshire, and everyone marching on together, mostly to the chippy.',
  },
  {
    to: 'Newcastle',
    map: 'newcastle',
    railcard: true,
    train: 'The 12:00 to Newcastle, for St James’ Park. Bring a coat. Nobody up there will',
    ride: 'All the way up the east coast, past the Angel of the North, and over the Tyne on the high bridge.',
    first: 'NEWCASTLE. The Tyne, the Tyne Bridge, the Angel of the North, and nobody in a coat.',
  },
  {
    to: 'Manchester',
    map: 'manchester',
    train: 'The 12:33 to Manchester Piccadilly, for the Etihad and Old Trafford',
    ride: 'North through the Midlands. It rains from Stoke onwards and doesn’t stop.',
    first:
      'MANCHESTER. Red-brick mills, worker bees on every bin, rain, and two football grounds that won’t look at each other.',
  },
];

/** The clubs whose grounds a line reaches, in the order you play them. */
const clubsOn = (l: Line) => CLUBS.filter((c) => c.map === l.map);

/** A line's platform at King's Cross: its place on the board, from 1. */
const platformOf = (map: string) => LINES.findIndex((l) => l.map === map) + 1;

/**
 * Who you play next, said by a guard or a sign: the first club whose jersey you haven't won,
 * with where the ground is and the platform for it. Nothing once you're Champion.
 */
function nextMatch(from: number = 0): Step[] {
  if (from >= CLUBS.length) return [];
  const c = CLUBS[from];
  const l = LINES[platformOf(c.map) - 1];
  return [
    {
      do: 'if',
      flag: plFlag(c.id),
      then: nextMatch(from + 1),
      else: [
        {
          do: 'say',
          text: `Your next match: ${c.club} (${from + 1} of ${CLUBS.length}), at ${c.ground}. ${c.legend} is waiting. The train is from King’s Cross, platform ${platformOf(c.map)}: ${l.to}.`,
        },
      ],
    },
  ];
}

/** The train back to King's Cross, from anywhere: after a word on where you're going next. */
const BACK_TO_LONDON: Step[] = [
  ...nextMatch(),
  {
    do: 'ask',
    text: 'GUARD: Back down to London King’s Cross?',
    yes: [
      {
        do: 'say',
        text: 'Back down the line to London. The trolley has run out of everything but crisps.',
      },
      { do: 'travel', map: KINGS_CROSS_ID, ...CONCOURSE, face: 'up' },
    ],
    no: [{ do: 'say', text: 'GUARD: Right you are. Mind the gap.' }],
  },
];

const guard = (face: Npc['face'] = 'down'): Npc => ({
  look: 'conductor',
  face,
  talk: BACK_TO_LONDON,
});

/** Where each line arrives in its town, by the guard who brings you back. */
const ARRIVAL = { x: 1, y: 3, face: 'right' as const };

/** Getting on a line: the ride, and the town, with a word the first time. */
function rideOn(l: Line): Step[] {
  const go: Step[] = [
    { do: 'say', text: l.ride },
    { do: 'travel', map: l.map, ...ARRIVAL },
    {
      do: 'if',
      flag: `seen:${l.map}`,
      then: [],
      else: [
        { do: 'say', text: l.first },
        { do: 'flag', flag: `seen:${l.map}` },
      ],
    },
  ];
  if (!l.railcard) return go;
  return [
    {
      do: 'if',
      flag: RAILCARD,
      then: go,
      else: [
        {
          do: 'say',
          text: `GUARD: ${l.to}? That’s an off-peak return, a hundred and ninety pounds. Unless you’ve a Railcard. You haven’t a Railcard. Ian Wright has one, mind. He’s at Selhurst Park.`,
        },
      ],
    },
  ];
}

/** The guard on a platform: which train it is and what it's for, then a yes or no. */
function platformGuard(l: Line, i: number): Step[] {
  const clubs = clubsOn(l)
    .map((c) => c.club)
    .join(', ');
  return [
    {
      do: 'ask',
      text: `GUARD: Platform ${i + 1}. ${l.train}. That’s ${clubs}. Hop on?`,
      yes: rideOn(l),
      no: [{ do: 'say', text: 'GUARD: Next one’s in an hour. Or two. Engineering works.' }],
    },
  ];
}

/** A row of the King's Cross departures board: a line, its grounds, and whether it runs. */
export interface KxDeparture {
  platform: number;
  to: string;
  map: string;
  railcard: boolean;
  clubs: { id: ClubId; club: string; ground: string; legend: string; flag: string }[];
  /** Getting on, for a ticket from the board. */
  ride: Step[];
}

export const KX_DEPARTURES: KxDeparture[] = LINES.map((l, i) => ({
  platform: i + 1,
  to: l.to,
  map: l.map,
  railcard: !!l.railcard,
  clubs: clubsOn(l).map((c) => ({
    id: c.id,
    club: c.club,
    ground: c.ground,
    legend: c.legend,
    flag: plFlag(c.id),
  })),
  ride: rideOn(l),
}));

/** The ticket office at King's Cross: the board, and a ticket to anywhere on it. */
const KX_CLERK: Npc = {
  look: 'clerk',
  face: 'down',
  talk: [
    ...nextMatch(),
    { do: 'say', text: 'CLERK: Welcome to King’s Cross. Where are you off to?' },
    { do: 'departures', station: 'kings-cross' },
  ],
};

/**
 * King's Cross: the departures board along the back wall, a guard on each platform under their
 * own part of it, and the ticket office by the door.
 */
export const KINGS_CROSS_ROOM: Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> = {
  name: 'King’s Cross',
  rows: [
    'WWWWWWWWWWWWWWWW',
    'WODDDDDDDDDDDDOW',
    'WFFFFFFFFFFFFFFW',
    'W1F2F3F4F5F6F7FW',
    'WFFFFFFFFFFFFFFW',
    'WUUF8FFFFFF9FUUW',
    'WNFFFFF@FF0FFFNW',
    'WWWWWWWEWWWWWWWW',
  ],
  npcs: [
    ...LINES.map((l, i) => ({
      look: 'conductor' as const,
      face: 'down' as const,
      talk: platformGuard(l, i),
    })),
    // The Metropolitan line to Wembley Park, and Jamie Elliott once the Sidemen have heard of you.
    METROPOLITAN,
    JAMIE_AT_KINGS_CROSS,
    KX_CLERK,
  ],
  things: {
    D: `DEPARTURES. ${LINES.map(
      (l, i) =>
        `Platform ${i + 1}: ${l.to}, for ${clubsOn(l)
          .map((c) => c.ground)
          .join(', ')}${l.railcard ? ' (Railcard holders)' : ''}.`,
    ).join(' ')} The ticket office by the door will sell you a ticket to any of them.`,
    U: 'A bench. A man on it is reading the Racing Post upside down. He’s asleep.',
    N: 'A trolley, half stuck in the wall. A queue of tourists is waiting to take its photo.',
  },
};

// ---------- the towns ----------

const town = (min: number, max: number, table: [string, number][]): Wild => ({ min, max, table });

/** A stretch of a town's street: a ground, a landmark, or plain buildings (`P`, `M` and `#`). */
type Part =
  { stadium: ClubId; tube?: string } | { landmark: LandmarkKind; w: number } | { houses: string };

/** How many tiles wide a ground is from the street, with its turnstiles in the middle. */
const STADIUM_W = 8;

/**
 * A town's row of buildings from its parts, west to east between the trees, and what's drawn
 * over them: each ground's door is its landmark door, in the order the grounds come.
 */
function street(parts: Part[]): { doors: string; scenery: Scenery[] } {
  let doors = 'T';
  const scenery: Scenery[] = [];
  for (const p of parts) {
    const x0 = doors.length;
    if ('houses' in p) {
      doors += p.houses;
      continue;
    }
    const w = 'stadium' in p ? STADIUM_W : p.w;
    const door = 'stadium' in p ? STADIUM_W / 2 : -1;
    doors += [...Array(w)].map((_, i) => (i === door ? 'L' : '#')).join('');
    const at = { x0, x1: x0 + w - 1, y0: 0, y1: 2 };
    scenery.push(
      'stadium' in p
        ? { ...at, kind: 'stadium', club: p.stadium, ...(p.tube && { tube: p.tube }) }
        : { ...at, kind: p.landmark },
    );
  }
  return { doors: doors + 'T', scenery };
}

/**
 * A map's rows with its scenery's top row cleared of trees (a plain wall, under the drawing), so
 * nothing grows through a stadium's roof: the trees along the top stay everywhere else.
 */
function clearedFor(rows: string[], scenery: Scenery[]): string[] {
  return rows.map((r, y) =>
    y !== 0
      ? r
      : [...r].map((t, x) => (scenery.some((s) => x >= s.x0 && x <= s.x1) ? 'W' : t)).join(''),
  );
}

/** A stop with only grounds on it, off a train or the Tube: one street, its people and a sign. */
function stopOf(
  parts: Part[],
  people: Record<number, string>,
  sign: number,
): Pick<GameMap, 'rows' | 'scenery'> {
  const { doors, scenery } = street(parts);
  const w = doors.length;
  const row = (fill: string, at: Record<number, string> = {}) =>
    [...Array(w)].map((_, x) => (x === 0 || x === w - 1 ? 'T' : (at[x] ?? fill))).join('');
  const rows = [
    'T'.repeat(w),
    row('^'),
    doors,
    row('v', { 1: '@' }),
    row('v', people),
    row('v', { [sign]: 'S' }),
    'T'.repeat(w),
  ];
  return { rows: clearedFor(rows, scenery), scenery };
}

/**
 * A town from its street: where its people stand (1 the guard home, 2 a local, then 3 and 4 the
 * trainers), and what's drawn over its buildings.
 */
function townOf(parts: Part[]): Pick<GameMap, 'rows' | 'scenery'> {
  const { doors, scenery } = street(parts);
  const w = doors.length;
  const row = (fill: string | ((x: number) => string), at: Record<number, string> = {}) =>
    [...Array(w)]
      .map((_, x) =>
        x === 0 || x === w - 1 ? 'T' : (at[x] ?? (typeof fill === 'string' ? fill : fill(x))),
      )
      .join('');
  const grass = (x: number) => ((x >= 2 && x <= 9) || (x >= 15 && x <= 21) ? ',' : 'v');
  const rows = [
    'T'.repeat(w),
    row('^'),
    doors,
    row('v', { 1: '@' }),
    row('v', { 2: '1', 17: '2' }),
    row('a'),
    row('a', { 4: 'c', 19: 'c' }),
    row('v'),
    row(grass, { 7: '3', 14: 'S', 17: '4' }),
    row(grass),
    row('v'),
    'T'.repeat(w),
  ];
  return { rows: clearedFor(rows, scenery), scenery };
}

const say = (text: string): Step[] => [{ do: 'say', text }];

const ukTrainer = (
  id: string,
  name: string,
  team: [string, number][],
  before: string,
  after: string,
): Trainer => ({
  id,
  name,
  uk: true,
  team,
  ai: 'normal',
  prize: Math.max(...team.map(([, l]) => l)) * 20,
  before,
  after,
});

const trainerAt = (id: string, face: Npc['face'], look: Look = 'trainer'): Npc => ({
  look,
  face,
  trainer: id,
  sight: 3,
});

const MANCHESTER_YATES: Yates = {
  owner: {
    look: 'mayo',
    face: 'down',
    talk: [
      ...say('SEÁN: I’m Seán, from Mayo. That’s my brother Pádraig at the other end of the bar.'),
      ...say('SEÁN: We haven’t spoken since 1998. Tell him the Guinness needs changing.'),
    ],
  },
  regular: {
    look: 'mayo',
    face: 'down',
    talk: [
      ...say('PÁDRAIG: Seán says the Guinness needs changing? Tell Seán the Guinness is grand.'),
      ...say('PÁDRAIG: And tell him Mayo will win the All-Ireland. He’ll know what I mean.'),
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, split down the middle of the shelf. Half is Seán’s. Half is Pádraig’s.',
    U: 'A table. The jukebox beside it only plays Oasis. It’s playing Wonderwall again.',
    J: 'A fire, and a sign: NO OASIS REQUESTS. IT ONLY PLAYS OASIS.',
  },
};

export const MANCHESTER: GameMap = {
  id: 'manchester',
  name: 'Manchester, England',
  county: 9,
  flat: true,
  terraces: 'english',
  uk: true,
  yates: MANCHESTER_YATES,
  ...townOf([
    { landmark: 'manchester-mill', w: 6 },
    { stadium: 'united' },
    { houses: '##P##' },
    { landmark: 'manchester-town-hall', w: 8 },
    { houses: '#M#' },
    { stadium: 'city' },
  ]),
  wild: town(26, 30, [
    ['olliemon', 20],
    ['oismon', 20],
    ['gibbsmon', 15],
    ['carlmon', 15],
    ['owemon', 15],
    ['thilomon', 15],
  ]),
  npcs: [
    guard(),
    {
      look: 'local',
      face: 'down',
      talk: say(
        'LOCAL: United or City? Don’t answer. Whichever you say, half the street will stop talking to you.',
      ),
    },
    trainerAt('mcr-oasis', 'right'),
    trainerAt('mcr-ultra', 'left'),
  ],
  signs: ['MANCHESTER. Old Trafford and the Etihad. Two grounds, one city, no peace.'],
  ...grounds(['united', 'city']),
  landmarkRooms: {
    0: groundRoom(clubById('united')),
    // City's lawyers and their accountant, never far from the touchline.
    1: groundRoom(clubById('city'), [
      {
        look: 'tux',
        face: 'right',
        talk: say(
          'CITY’S LAWYER: 115 charges? Allegations. Proven? Alleged to be proven. We’ll be appealing the appeal. Have you a moment? This is billed by the minute.',
        ),
      },
      {
        look: 'tux',
        face: 'left',
        talk: say(
          'CITY’S ACCOUNTANT: Sponsorship income from a company that is definitely not the owner, to a club that is definitely within the rules. Here’s the spreadsheet. Don’t look at column F.',
        ),
      },
    ]),
  },
};

const LEEDS_YATES: Yates = {
  owner: {
    look: 'brid',
    face: 'down',
    talk: [
      ...say(
        'BRÍD: Bríd, from Kerry. I run the GAA club here too. Leeds Gaels. We’re short a full-back.',
      ),
      ...say('BRÍD: The All-Ireland final is on every screen. It’s always on. I record it.'),
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, and a Sam Maguire made of tinfoil.',
    U: 'A table with a hurley across it. A sign: DO NOT USE AS A TABLE.',
    J: 'A fire, and Kerry jerseys drying in front of it.',
  },
};

export const LEEDS: GameMap = {
  id: 'leeds',
  name: 'Leeds, England',
  county: 9,
  flat: true,
  terraces: 'english',
  uk: true,
  yates: LEEDS_YATES,
  ...townOf([
    { landmark: 'leeds-town-hall', w: 8 },
    { houses: '##P##' },
    { landmark: 'yorkshire-rose', w: 6 },
    { houses: '#M#' },
    { stadium: 'leeds' },
  ]),
  wild: town(18, 22, [
    ['steadmon', 20],
    ['hugomon', 20],
    ['paulimon', 20],
    ['jammon', 20],
    ['vinnimon', 20],
  ]),
  npcs: [
    guard(),
    {
      look: 'local',
      face: 'down',
      talk: say(
        'LOCAL: Bielsa? He’s a god here. We put up a mural. And another one. And a statue of the bucket.',
      ),
    },
    trainerAt('leeds-analyst-1', 'right'),
    trainerAt('leeds-analyst-2', 'left'),
  ],
  signs: ['LEEDS. Elland Road this way. Marching on together.'],
  ...grounds(['leeds']),
  landmarkRooms: { 0: groundRoom(clubById('leeds')) },
};

const LIVERPOOL_YATES: Yates = {
  owner: {
    look: 'kelly',
    face: 'down',
    talk: [
      ...say(
        'NANA KELLY: We’re the Kellys. Four generations in this pub. Wexford, originally. Then the boat.',
      ),
      ...say(
        'NANA KELLY: See the sign? LIVERPOOL, THE REAL CAPITAL OF IRELAND. Half the city’s Irish, la. The other half wishes it was.',
      ),
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, and a ferry timetable to Dublin, pinned up beside them.',
    U: 'A table. Four generations of Kellys have carved their names in it.',
    J: 'A fire, and over it a sign: LIVERPOOL, THE REAL CAPITAL OF IRELAND.',
  },
};

export const LIVERPOOL: GameMap = {
  id: 'liverpool',
  name: 'Liverpool, England',
  county: 9,
  flat: true,
  terraces: 'english',
  uk: true,
  yates: LIVERPOOL_YATES,
  ...townOf([
    { landmark: 'liver-building', w: 8 },
    { stadium: 'everton' },
    { houses: '##P##' },
    { landmark: 'mersey', w: 7 },
    { houses: '#M#' },
    { stadium: 'liverpool' },
  ]),
  wild: town(15, 19, [
    ['boydemon', 20],
    ['thilomon', 20],
    ['killemon', 20],
    ['conemon', 20],
    ['oismon', 20],
  ]),
  npcs: [
    guard(),
    {
      look: 'local',
      face: 'down',
      talk: say(
        'SCOUSE LAD: Big Dunc? He caught a burglar in his own house once, la. Burglar’s still not right.',
      ),
    },
    trainerAt('lpool-ferry', 'right'),
    trainerAt('lpool-dock', 'left'),
  ],
  signs: [
    'LIVERPOOL. Bramley-Moore Dock for Everton. Anfield for Liverpool. The ferry for Dublin.',
  ],
  ...grounds(['everton', 'liverpool']),
  landmarkRooms: {
    0: groundRoom(clubById('everton')),
    1: groundRoom(clubById('liverpool')),
  },
};

export const FALMER: GameMap = {
  id: 'falmer',
  name: 'Falmer, East Sussex',
  county: 9,
  flat: true,
  uk: true,
  ...stopOf(
    [{ landmark: 'south-downs', w: 6 }, { stadium: 'brighton' }, { houses: '##' }],
    {
      2: '1',
      8: '2',
    },
    10,
  ),
  npcs: [
    guard(),
    {
      look: 'enda',
      face: 'down',
      talk: [
        ...say('ENDA: I KNEW you’d come back! Is it a tradition now? It’s a tradition.'),
        ...say(
          'ENDA: I made you another friendship bracelet on the train. It says PREMIER LEAGUE. It’s spelt wrong.',
        ),
      ],
    },
  ],
  signs: ['FALMER. The Amex. Brighton & Hove Albion.'],
  ...grounds(['brighton']),
  landmarkRooms: { 0: groundRoom(clubById('brighton')) },
};

const BIRMINGHAM_YATES: Yates = {
  owner: {
    look: 'mick',
    face: 'down',
    talk: [
      ...say(
        'MICK: Mick, from Tipperary. Sixty years in Birmingham. I’ve marched in every Paddy’s Day parade since 1966.',
      ),
      ...say('MICK: Take a flat cap from the rack. Everyone in here has to wear one. House rules.'),
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, and a photo of every Birmingham St Patrick’s Day parade since 1960.',
    U: 'A table. Everyone at it is wearing a flat cap.',
    J: 'A fire, and a rack of flat caps beside it.',
  },
};

export const BIRMINGHAM: GameMap = {
  id: 'birmingham',
  name: 'Birmingham, England',
  county: 9,
  flat: true,
  terraces: 'english',
  uk: true,
  yates: BIRMINGHAM_YATES,
  ...townOf([
    { landmark: 'selfridges', w: 8 },
    { houses: '##P##' },
    { landmark: 'canal', w: 6 },
    { houses: '#M#' },
    { stadium: 'villa' },
  ]),
  wild: town(12, 16, [
    ['steadmon', 20],
    ['skehemon', 20],
    ['simomon', 20],
    ['paulimon', 20],
    ['robinmon', 20],
  ]),
  npcs: [
    guard(),
    {
      look: 'local',
      face: 'down',
      talk: say(
        'VILLA FAN: (In a gilet, and sunglasses, and a very fake moustache.) I’m basically royalty. I know a lot of people. Best of luck. You’ll need it. Ahem.',
      ),
    },
    trainerAt('brum-canal', 'right'),
    trainerAt('brum-bull', 'left'),
  ],
  signs: ['BIRMINGHAM. Villa Park this way. Up the Villa.'],
  ...grounds(['villa']),
  landmarkRooms: { 0: groundRoom(clubById('villa')) },
};

const NEWCASTLE_YATES: Yates = {
  owner: {
    look: 'grainne',
    face: 'down',
    talk: [
      ...say('GRÁINNE: Gráinne. From Killybegs, in Donegal. My father fished. I pour.'),
      ...say(
        'GRÁINNE: No heating in here, ever. Nobody up here would use it. Got a Chicken Fillet Roll? I’ll swap you a fish story for one.',
      ),
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, and a stuffed fish that Gráinne swears was bigger.',
    U: 'A table. Everyone at it is in a T-shirt. Your breath is fogging.',
    J: 'A fireplace with no fire in it. There never has been.',
  },
};

export const NEWCASTLE: GameMap = {
  id: 'newcastle',
  name: 'Newcastle, England',
  county: 9,
  flat: true,
  terraces: 'english',
  uk: true,
  yates: NEWCASTLE_YATES,
  ...townOf([
    { landmark: 'tyne-bridge', w: 8 },
    { houses: '##P##' },
    { landmark: 'angel', w: 7 },
    { houses: '#M#' },
    { stadium: 'newcastle' },
  ]),
  wild: town(21, 25, [
    ['olliemon', 20],
    ['gibbsmon', 20],
    ['carlmon', 20],
    ['killemon', 20],
    ['owemon', 20],
  ]),
  npcs: [
    guard(),
    {
      look: 'local',
      face: 'down',
      talk: say('GEORDIE: Howay man, it’s not cold! It’s FRESH. Coats are for Londoners.'),
    },
    trainerAt('ncl-topless', 'right'),
    trainerAt('ncl-bridge', 'left'),
  ],
  signs: ['NEWCASTLE. St James’ Park, up the hill. You can’t miss it. It’s enormous.'],
  ...grounds(['newcastle']),
  landmarkRooms: { 0: groundRoom(clubById('newcastle')) },
};

export const TUBE: GameMap = {
  id: 'tube',
  name: 'The Tube, London',
  county: 9,
  flat: true,
  uk: true,
  ...stopOf(
    [
      { landmark: 'underground', w: 5 },
      { stadium: 'spurs', tube: 'SEVEN SISTERS' },
      { stadium: 'palace', tube: 'SELHURST' },
      { stadium: 'chelsea', tube: 'FULHAM BROADWAY' },
      { stadium: 'arsenal', tube: 'ARSENAL' },
    ],
    { 2: '1', 15: '2' },
    8,
  ),
  npcs: [
    guard(),
    {
      look: 'local',
      face: 'left',
      talk: say('COMMUTER: Stand on the right. WALK on the left. It’s not complicated. Tourists.'),
    },
  ],
  signs: ['THE TUBE. Seven Sisters, Selhurst, Fulham Broadway and Arsenal. Mind the gap.'],
  ...grounds(['spurs', 'palace', 'chelsea', 'arsenal']),
  landmarkRooms: {
    0: groundRoom(clubById('spurs')),
    1: groundRoom(clubById('palace')),
    2: groundRoom(clubById('chelsea')),
    3: groundRoom(clubById('arsenal')),
  },
};

export const PL_MAPS = [MANCHESTER, LEEDS, LIVERPOOL, FALMER, BIRMINGHAM, NEWCASTLE, TUBE];

/** Everyone on the way to the grounds: each with one of the lads and one of London’s own. */
const ROUTE_TRAINERS: Trainer[] = [
  ukTrainer(
    'mcr-oasis',
    'Oasis Fan Liam',
    [
      ['oismon', 27],
      ['decksmon', 29],
    ],
    'OASIS FAN LIAM: You’re not a patch on the Gallaghers. Nobody is. Come on then.',
    'OASIS FAN LIAM: Don’t look back in anger. I am, though.',
  ),
  ukTrainer(
    'mcr-ultra',
    'City Ultra Dean',
    [
      ['jabmon', 29],
      ['thilomon', 28],
    ],
    'CITY ULTRA DEAN: 115 what? Never heard of it. Battle!',
    'CITY ULTRA DEAN: It’ll go to an independent panel.',
  ),
  ukTrainer(
    'leeds-analyst-1',
    'Analyst Tomás',
    [
      ['seedmon', 21],
      ['hugomon', 19],
    ],
    'ANALYST TOMÁS: I’ve already watched you. Through the hedge. With a clipboard.',
    'ANALYST TOMÁS: That wasn’t in the notes.',
  ),
  ukTrainer(
    'leeds-analyst-2',
    'Analyst Pablo',
    [
      ['paulimon', 19],
      ['oatmon', 21],
    ],
    'ANALYST PABLO: Forty-two hours of footage on you. Let’s see if it was worth it.',
    'ANALYST PABLO: Forty-three hours, then.',
  ),
  ukTrainer(
    'lpool-ferry',
    'Ferryman Joe',
    [
      ['oystermon', 17],
      ['conemon', 16],
    ],
    'FERRYMAN JOE: Ferry ’cross the Mersey, la. First, a battle ’cross the Mersey.',
    'FERRYMAN JOE: Here I’ll stay.',
  ),
  ukTrainer(
    'lpool-dock',
    'Docker Mo',
    [
      ['killemon', 16],
      ['fleamon', 17],
    ],
    'DOCKER MO: My nan’s from Wexford. Doesn’t mean I’ll go easy on you.',
    'DOCKER MO: Ah, sound. Tell your nan I said hiya.',
  ),
  ukTrainer(
    'brum-canal',
    'Canal Boater Pete',
    [
      ['jammon', 13],
      ['oatmon', 13],
    ],
    'CANAL BOATER PETE: More canals than Venice, Birmingham. Fewer gondolas. Battle!',
    'CANAL BOATER PETE: Sunk.',
  ),
  ukTrainer(
    'brum-bull',
    'Shopper Sharon',
    [
      ['fleamon', 15],
      ['robinmon', 14],
    ],
    'SHOPPER SHARON: I’ve been in the Bullring since nine. I need a sit down. After this.',
    'SHOPPER SHARON: Right. Sit down.',
  ),
  ukTrainer(
    'ncl-topless',
    'Topless Fan Gaz',
    [
      ['olliemon', 22],
      ['speedmon', 22],
    ],
    'TOPLESS FAN GAZ: Cold? It’s FRESH, man! Battle!',
    'TOPLESS FAN GAZ: Now I’m cold.',
  ),
  ukTrainer(
    'ncl-bridge',
    'Bridge Walker Jen',
    [
      ['carlmon', 23],
      ['pedalmon', 24],
    ],
    'BRIDGE WALKER JEN: Seven bridges on the Tyne. I’ve walked them all today. One more battle.',
    'BRIDGE WALKER JEN: Eight, if you count that.',
  ),
];

export const PREMIER_TRAINERS = [...PL_TRAINERS, ...ROUTE_TRAINERS];

/** The legends' jersey flags, in the order you win them. */
export const PL_FLAGS = CLUBS.map((c) => plFlag(c.id));

/** The legends, in order, with where they are: for the mission list. */
export const FIXTURE_LIST = CLUBS.map((c) => ({
  club: c.club,
  ground: c.ground,
  legend: c.legend,
  flag: plFlag(c.id),
  /** The platform at King's Cross for it, and where that train goes. */
  platform: platformOf(c.map),
  to: LINES[platformOf(c.map) - 1].to,
}));

// ---------- where to go next ----------

/** The next club to play, with where and how to get there. */
export interface NextClub {
  /** Which fixture it is, from 1 to 12. */
  n: number;
  id: ClubId;
  club: string;
  ground: string;
  legend: string;
  map: string;
  platform: number;
  to: string;
}

/** The next club to play, or null before Próvaí has sent you out and once you're Champion. */
export function nextClub(flags: ReadonlySet<string>): NextClub | null {
  if (!flags.has(FIXTURES) || flags.has(CHAMPION)) return null;
  const i = CLUBS.findIndex((c) => !flags.has(plFlag(c.id)));
  if (i < 0) return null;
  const c = CLUBS[i];
  const platform = platformOf(c.map);
  return {
    n: i + 1,
    id: c.id,
    club: c.club,
    ground: c.ground,
    legend: c.legend,
    map: c.map,
    platform,
    to: LINES[platform - 1].to,
  };
}

/** What everyone calls each club, for the line on screen. */
const SHORT: Record<ClubId, string> = {
  brighton: 'Brighton',
  palace: 'Palace',
  villa: 'Villa',
  everton: 'Everton',
  leeds: 'Leeds',
  newcastle: 'Newcastle',
  spurs: 'Spurs',
  city: 'Man City',
  chelsea: 'Chelsea',
  arsenal: 'Arsenal',
  liverpool: 'Liverpool',
  united: 'Man United',
};

/** The line along the bottom of the map while the Premier League is on: who's next and how to get there. */
export function objectiveText(flags: ReadonlySet<string>): string | null {
  const next = nextClub(flags);
  if (!next) return null;
  return `NEXT ${next.n}/${CLUBS.length}: ${SHORT[next.id]} at ${next.ground} · Platform ${next.platform}`;
}

/**
 * Where the marker for the next match goes on a map, if anywhere: King's Cross's door in London,
 * the guard on the right platform at King's Cross, the ground's turnstiles in its town, or the
 * guard home from any other town on the way.
 */
export function objectiveAt(
  map: GameMap,
  flags: ReadonlySet<string>,
): { x: number; y: number; on: 'door' | 'person' } | null {
  const next = nextClub(flags);
  if (!next) return null;
  if (map.id === 'london') {
    const door = find(map, 'L')[0];
    return door ? { ...door, on: 'door' } : null;
  }
  if (map.id === KINGS_CROSS_ID) {
    const guard = find(map, slot(next.platform - 1))[0];
    return guard ? { ...guard, on: 'person' } : null;
  }
  if (!PL_MAPS.some((m) => m.id === map.id)) return null;
  const ground = map.scenery?.find((s) => s.kind === 'stadium' && s.club === next.id);
  if (ground) {
    const x = [...map.rows[ground.y1]].findIndex((t, x) => t === 'L' && x >= ground.x0);
    return { x, y: ground.y1, on: 'door' };
  }
  const guard = find(map, slot(0))[0];
  return guard ? { ...guard, on: 'person' } : null;
}
