import { interiorId } from './interiors';
import { CHAMPION, RAILCARD } from './kneecap';
import type { GameMap, Look, Npc, Step, Trainer, Wild, Yates } from '@/lib/story/world';

/**
 * The Premier League (docs/london-expansion.md, chapters 7 to 9). Trains leave King's Cross for
 * every ground once Próvaí has told you about the lads. At each ground a club legend waits on
 * the touchline: beat them for the club's jersey. The twelve are played in order (each ground's
 * turnstile is shut until the one before is won), and the last, Agüero at the Etihad, makes you
 * Premier League Champion, which opens Buckingham Palace.
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
  id: string;
  club: string;
  ground: string;
  legend: string;
  look: Look;
  team: [string, number][];
  ai: Trainer['ai'];
  before: string;
  after: string;
  /** What else the legend gives you after the jersey. */
  gift: Step[];
  /** What the seats and the pitch say when you look at them. */
  seats: string;
  pitch: string;
}

/** The twelve, in the order you play them. */
const CLUBS: Club[] = [
  {
    id: 'united',
    club: 'Manchester United',
    ground: 'Old Trafford',
    legend: 'Roy Keane',
    look: 'keane',
    team: [
      ['olliemon', 8],
      ['gibbsmon', 9],
      ['boydemon', 10],
    ],
    ai: 'normal',
    before:
      'KEANE: Fail to prepare, prepare to fail. You’ve come over with no Ranemon of your own and a starter you got off a DJ in a pub. Saipan had better facilities than this.',
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
    pitch: 'The Old Trafford pitch. A steward tells you it’s the Theatre of Dreams. It’s raining.',
  },
  {
    id: 'leeds',
    club: 'Leeds United',
    ground: 'Elland Road',
    legend: 'Marcelo Bielsa',
    look: 'bielsa',
    team: [
      ['steadmon', 12],
      ['paulimon', 13],
      ['hugomon', 14],
    ],
    ai: 'normal',
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
    id: 'everton',
    club: 'Everton',
    ground: 'Bramley-Moore Dock',
    legend: 'Duncan Ferguson',
    look: 'ferguson',
    team: [
      ['thilomon', 15],
      ['boydemon', 16],
      ['owemon', 17],
    ],
    ai: 'normal',
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
    id: 'spurs',
    club: 'Tottenham Hotspur',
    ground: 'Tottenham Hotspur Stadium',
    legend: 'Robbie Keane',
    look: 'robbie',
    team: [
      ['lorcamon', 17],
      ['robinmon', 18],
      ['vinnimon', 19],
      ['enda', 20],
    ],
    ai: 'normal',
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
    id: 'palace',
    club: 'Crystal Palace',
    ground: 'Selhurst Park',
    legend: 'Ian Wright',
    look: 'wright',
    team: [
      ['killemon', 20],
      ['oismon', 21],
      ['carlmon', 22],
      ['crampemon', 23],
    ],
    ai: 'hard',
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
        text: 'You got IAN WRIGHT’S RAILCARD! The trains to Brighton, Birmingham and Newcastle run for you now.',
      },
    ],
    seats:
      'Red and blue seats, and the Holmesdale Road end, which is still singing from last season.',
    pitch:
      'Selhurst Park. The eagle that flies before every match is sitting on the crossbar, watching you.',
  },
  {
    id: 'brighton',
    club: 'Brighton & Hove Albion',
    ground: 'The Amex',
    legend: 'Glenn Murray',
    look: 'murray',
    team: [
      ['jammon', 23],
      ['skehemon', 24],
      ['robinmon', 24],
      ['simomon', 26],
    ],
    ai: 'hard',
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
    id: 'villa',
    club: 'Aston Villa',
    ground: 'Villa Park',
    legend: 'Paul McGrath',
    look: 'mcgrath',
    team: [
      ['steadmon', 26],
      ['skehemon', 27],
      ['paulimon', 28],
      ['simomon', 29],
    ],
    ai: 'hard',
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
    id: 'newcastle',
    club: 'Newcastle United',
    ground: 'St James’ Park',
    legend: 'Alan Shearer',
    look: 'shearer',
    team: [
      ['olliemon', 29],
      ['carlmon', 30],
      ['gibbsmon', 30],
      ['killemon', 31],
      ['owemon', 32],
    ],
    ai: 'hard',
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
    id: 'chelsea',
    club: 'Chelsea',
    ground: 'Stamford Bridge',
    legend: 'John Terry',
    look: 'terry',
    team: [
      ['enda', 32],
      ['boydemon', 33],
      ['lorcamon', 33],
      ['gibbsmon', 34],
      ['vinnimon', 35],
    ],
    ai: 'hard',
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
    id: 'liverpool',
    club: 'Liverpool',
    ground: 'Anfield',
    legend: 'Steven Gerrard',
    look: 'gerrard',
    team: [
      ['oismon', 35],
      ['conemon', 36],
      ['killemon', 36],
      ['paulimon', 37],
      ['carlmon', 38],
    ],
    ai: 'hard',
    before: 'GERRARD: We go again. Careful there. It’s slippy. Trust me.',
    after: 'GERRARD: We go again. Well. You go on. I’ll stay here.',
    gift: [
      {
        do: 'say',
        text: 'GERRARD: Take a Monster. You’ll need the energy for the Emirates. Henry is a different animal.',
      },
      { do: 'give', item: 'monster', count: 3 },
    ],
    seats: 'Red seats, and THIS IS ANFIELD over the tunnel. You touch it on the way past.',
    pitch: 'Anfield. The grass by the penalty spot is wet. Gerrard won’t go anywhere near it.',
  },
  {
    id: 'arsenal',
    club: 'Arsenal',
    ground: 'The Emirates',
    legend: 'Thierry Henry',
    look: 'henry',
    team: [
      ['robinmon', 39],
      ['steadmon', 40],
      ['hugomon', 40],
      ['lorcamon', 41],
      ['enda', 41],
      ['vinnimon', 42],
    ],
    ai: 'hard',
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
    id: 'city',
    club: 'Manchester City',
    ground: 'The Etihad',
    legend: 'Sergio Agüero',
    look: 'aguero',
    team: [
      ['thilomon', 43],
      ['hugomon', 44],
      ['skehemon', 44],
      ['crampemon', 45],
      ['boydemon', 45],
      ['owemon', 46],
    ],
    ai: 'hard',
    before:
      'AGÜERO: The last day of the season. You and City, level on points. The clock says 93:20. Vamos.',
    after: 'The commentator, from somewhere high up: “AGÜEROOOO… no. NO! It’s the Irish lad!”',
    gift: [],
    seats: 'Sky blue seats, every one of them full. The board says 93:20.',
    pitch: 'The Etihad on the final day. There’s confetti ready in cannons all round the pitch.',
  },
];

/** Becoming Premier League Champion, after Agüero, and the King's letter. */
const CHAMPIONS: Step[] = [
  {
    do: 'say',
    text: 'The confetti cannons go off. The Premier League trophy is carried out onto the Etihad pitch, and handed to you.',
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
  const ace = Math.max(...c.team.map(([, l]) => l));
  return {
    id: legendId(c.id),
    name: c.legend,
    uk: true,
    team: c.team,
    ai: c.ai,
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
): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  const npcs: Npc[] = [{ look: c.look, face: 'down', trainer: legendId(c.id) }, ...others];
  return {
    name: c.ground,
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

/** The train back to King's Cross, from anywhere. */
const BACK_TO_LONDON: Step[] = [
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

interface Line {
  to: string;
  map: string;
  ask: string;
  ride: string;
  first: string;
  /** Shut until you have the Railcard. */
  railcard?: boolean;
}

const LINES: Line[] = [
  {
    to: 'Manchester',
    map: 'manchester',
    ask: 'GUARD: The 10:33 to Manchester Piccadilly. Hop on?',
    ride: 'North through the Midlands. It rains from Stoke onwards and doesn’t stop.',
    first: 'MANCHESTER. Red brick, rain, and two football grounds that won’t look at each other.',
  },
  {
    to: 'Leeds',
    map: 'leeds',
    ask: 'GUARD: The Leeds train. It’s late. It’s always late. Hop on?',
    ride: 'Up the East Coast line. A man opposite has a Leeds tattoo on his neck and a Leeds tattoo on his other neck.',
    first: 'LEEDS. Everyone here is marching on together, mostly to the chippy.',
  },
  {
    to: 'Liverpool',
    map: 'liverpool',
    ask: 'GUARD: The Liverpool Lime Street train. Hop on?',
    ride: 'Over to the west coast. The closer you get, the more Irish everyone sounds.',
    first:
      'LIVERPOOL. The Mersey, the docks, the ferry to Dublin, and half the city with an Irish granny.',
  },
  {
    to: 'Brighton (the Amex)',
    map: 'falmer',
    railcard: true,
    ask: 'GUARD: Falmer, for the Amex. Change at Brighton. Hop on?',
    ride: 'South to the sea, then a little train up the hill. Enda is waving from the platform.',
    first: 'FALMER. A station, a university, and the Amex. And Enda.',
  },
  {
    to: 'Birmingham',
    map: 'birmingham',
    railcard: true,
    ask: 'GUARD: The Birmingham New Street train. Hop on?',
    ride: 'Up through the Chilterns, past a lot of HS2 that isn’t there yet.',
    first: 'BIRMINGHAM. Canals, a Bullring with no bulls, and a lot of flat caps.',
  },
  {
    to: 'Newcastle',
    map: 'newcastle',
    railcard: true,
    ask: 'GUARD: The Newcastle train. Bring a coat. Nobody up there will. Hop on?',
    ride: 'All the way up the east coast, over the Tyne on the high bridge.',
    first: 'NEWCASTLE. The Tyne, its bridges, and nobody in a coat.',
  },
  {
    to: 'the Tube',
    map: 'tube',
    ask: 'TUBE: King’s Cross St Pancras Underground. For Tottenham, Selhurst, Stamford Bridge and the Emirates. Down you go?',
    ride: 'Down the escalators, onto the Victoria line. Nobody looks at anybody.',
    first:
      'THE TUBE. Four London grounds, one Underground, and a lot of people standing on the left.',
  },
];

/** Where each line arrives in its town, by the guard who brings you back. */
const ARRIVAL = { x: 1, y: 3, face: 'right' as const };

function ticket(l: Line): Step[] {
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
  const ask: Step[] = [
    {
      do: 'ask',
      text: l.ask,
      yes: go,
      no: [{ do: 'say', text: 'GUARD: Next one’s in an hour. Or two. Engineering works.' }],
    },
  ];
  if (!l.railcard) return ask;
  return [
    {
      do: 'if',
      flag: RAILCARD,
      then: ask,
      else: [
        {
          do: 'say',
          text: `GUARD: ${l.to}? That’s an off-peak return, a hundred and ninety pounds. Unless you’ve a Railcard. You haven’t a Railcard.`,
        },
      ],
    },
  ];
}

/** King's Cross: a departures board, and a guard on each platform. */
export const KINGS_CROSS_ROOM: Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> = {
  name: 'King’s Cross',
  rows: [
    'WWWWWWWWWWWW',
    'WODDDDDDDDOW',
    'WF1F2F3F4F5W',
    'WFFFFFFFFFFW',
    'WUUFF6F7FUUW',
    'WFFFFFFFFFFW',
    'WNFFFF@FFFNW',
    'WWWWWWEWWWWW',
  ],
  npcs: LINES.map((l) => ({ look: 'conductor' as const, face: 'down' as const, talk: ticket(l) })),
  things: {
    D: `DEPARTURES. ${LINES.map((l) => `${l.to}${l.railcard ? ' (Railcard holders)' : ''}`).join(', ')}. Every one delayed.`,
    U: 'A bench. A man on it is reading the Racing Post upside down. He’s asleep.',
    N: 'A trolley, half stuck in the wall. A queue of tourists is waiting to take its photo.',
  },
};

// ---------- the towns ----------

const town = (min: number, max: number, table: [string, number][]): Wild => ({ min, max, table });

/** Where a town's people stand: 1 the guard home, 2 a local, then 3 and 4 the trainers. */
function townRows(doors: string): string[] {
  return [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^^^^^^^^^T',
    doors,
    'T@vvvvvvvvvvvvvvvvvvvvvT',
    'Tv1vvvvvvvvvvvvvv2vvvvvT',
    'TaaaaaaaaaaaaaaaaaaaaaaT',
    'TaaacaaaaaaaaaaaaaacaaaT',
    'TvvvvvvvvvvvvvvvvvvvvvvT',
    'Tv,,,,,3,,vvvvS,,4,,,,vT',
    'Tv,,,,,,,,vvvvv,,,,,,,vT',
    'TvvvvvvvvvvvvvvvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ];
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
  rows: townRows('T##L###L####P####M#####T'),
  wild: town(8, 12, [
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
    1: groundRoom(clubById('city')),
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
  rows: townRows('T##L########P####M#####T'),
  wild: town(11, 15, [
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
  rows: townRows('T##L###L####P####M#####T'),
  wild: town(14, 18, [
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
  rows: [
    'TTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^T',
    'T####L#########T',
    'T@vvvvvvvvvvvvvT',
    'Tv1vvvvv2vvvvvvT',
    'TvvvvvvvvvSvvvvT',
    'TTTTTTTTTTTTTTTT',
  ],
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
  rows: townRows('T##L########P####M#####T'),
  wild: town(25, 29, [
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
  rows: townRows('T##L########P####M#####T'),
  wild: town(28, 32, [
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
  rows: [
    'TTTTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^^^T',
    'T#L###L###L###L##T',
    'T@vvvvvvvvvvvvvvvT',
    'Tv1vvvvvvvvvvvv2vT',
    'TvvvvvvvSvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTT',
  ],
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

/** Everyone on the way to the grounds. */
const ROUTE_TRAINERS: Trainer[] = [
  ukTrainer(
    'mcr-oasis',
    'Oasis Fan Liam',
    [
      ['oismon', 9],
      ['owemon', 10],
    ],
    'OASIS FAN LIAM: You’re not a patch on the Gallaghers. Nobody is. Come on then.',
    'OASIS FAN LIAM: Don’t look back in anger. I am, though.',
  ),
  ukTrainer(
    'mcr-ultra',
    'City Ultra Dean',
    [
      ['gibbsmon', 10],
      ['thilomon', 11],
    ],
    'CITY ULTRA DEAN: 115 what? Never heard of it. Battle!',
    'CITY ULTRA DEAN: It’ll go to an independent panel.',
  ),
  ukTrainer(
    'leeds-analyst-1',
    'Analyst Tomás',
    [
      ['steadmon', 12],
      ['hugomon', 13],
    ],
    'ANALYST TOMÁS: I’ve already watched you. Through the hedge. With a clipboard.',
    'ANALYST TOMÁS: That wasn’t in the notes.',
  ),
  ukTrainer(
    'leeds-analyst-2',
    'Analyst Pablo',
    [
      ['paulimon', 13],
      ['vinnimon', 14],
    ],
    'ANALYST PABLO: Forty-two hours of footage on you. Let’s see if it was worth it.',
    'ANALYST PABLO: Forty-three hours, then.',
  ),
  ukTrainer(
    'lpool-ferry',
    'Ferryman Joe',
    [
      ['boydemon', 15],
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
      ['thilomon', 17],
    ],
    'DOCKER MO: My nan’s from Wexford. Doesn’t mean I’ll go easy on you.',
    'DOCKER MO: Ah, sound. Tell your nan I said hiya.',
  ),
  ukTrainer(
    'brum-canal',
    'Canal Boater Pete',
    [
      ['jammon', 26],
      ['skehemon', 27],
    ],
    'CANAL BOATER PETE: More canals than Venice, Birmingham. Fewer gondolas. Battle!',
    'CANAL BOATER PETE: Sunk.',
  ),
  ukTrainer(
    'brum-bull',
    'Shopper Sharon',
    [
      ['vinnimon', 27],
      ['robinmon', 28],
    ],
    'SHOPPER SHARON: I’ve been in the Bullring since nine. I need a sit down. After this.',
    'SHOPPER SHARON: Right. Sit down.',
  ),
  ukTrainer(
    'ncl-topless',
    'Topless Fan Gaz',
    [
      ['olliemon', 29],
      ['gibbsmon', 30],
    ],
    'TOPLESS FAN GAZ: Cold? It’s FRESH, man! Battle!',
    'TOPLESS FAN GAZ: Now I’m cold.',
  ),
  ukTrainer(
    'ncl-bridge',
    'Bridge Walker Jen',
    [
      ['carlmon', 30],
      ['owemon', 31],
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
}));
