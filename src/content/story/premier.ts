import { KANE_TEXT } from './kane';
import { interiorId } from './interiors';
import { CHAMPION, FIXTURES, LONDON_ONLY, RAILCARD } from './kneecap';
import { JAMIE_AT_KINGS_CROSS, METROPOLITAN } from './sidemen';
import { KNEECAP_AT_KINGS_CROSS, VICTORIA } from './rowans';
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

/**
 * A London-only game has no Ranemon on the farm, so it gets a text from your mam instead, one
 * after each jersey, in order.
 */
const MAM_TEXTS = [
  'Brighton! By the sea! Did you bring a coat? Text me back. Text me anyway.',
  'Your auntie says Crystal Palace is a rough area. Is that true. Are you eating.',
  'Saw the Villa match on the news. Was that you? Your hair looked very long.',
  'Everton. Is that the blue one or the red one. Your father says it matters.',
  'Leeds is very far up. Bring a coat. I mean it.',
  'Newcastle. They don’t wear coats there I hear. YOU wear a coat.',
  'Spurs! Your uncle Tom is delighted. He hasn’t said why.',
  'Manchester City. That’s a lot of money for football. Are they paying you.',
  'Chelsea. Very posh, I hear. Mind your manners.',
  'Arsenal! Mrs Byrne’s son supports them. He’s a solicitor now.',
  'Liverpool. Half of Mayo is in Liverpool. Say hello to them.',
];

const postcard = (i: number): Step[] =>
  i < POSTCARDS.length
    ? [
        {
          do: 'if',
          flag: LONDON_ONLY,
          then: [{ do: 'say', text: `♪ Bzzt. A text from your mam: “${MAM_TEXTS[i]}”` }],
          else: [
            {
              do: 'say',
              text: `A postcard from Ollie’s parents, from Michael D’s farm in Clare: “${POSTCARDS[i]}”`,
            },
          ],
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
  /** Where the ground is: its own map, and the train to it from King's Cross. */
  map: string;
  before: string;
  after: string;
  /** What else the legend gives you after the jersey. */
  gift: Step[];
  /** His own Ranemon (`footballers.ts`): his ace, and yours once you've beaten him. */
  own: string;
  /** What he says as he hands it over. */
  hand: string;
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
    own: 'murraymon',
    hand: 'MURRAY: Take Murraymon with you. He knows the way to Palace. He just won’t go.',
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
    map: 'selhurst',
    before: 'WRIGHTY: LISTEN TO ME. LISTEN TO ME. You are a BAD MAN. In a GOOD way. Come on then!',
    after:
      'WRIGHTY: OH MY DAYS. OH. MY. DAYS. You’ve done me! I played for Palace AND Arsenal and you’ve DONE me!',
    own: 'wrightymon',
    hand: 'WRIGHTY: And TAKE WRIGHTYMON! He’s a BAD MAN! He’ll look after you, yeah?',
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
    own: 'mcgrathmon',
    hand: 'McGRATH: Bring McGrathmon along. Don’t worry about training him. I never did.',
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
    own: 'duncanmon',
    hand: 'Big Dunc points at Duncanmon, then at you. Duncanmon follows you. Nobody says anything.',
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
    own: 'bielsamon',
    hand: 'BIELSA: Bielsamon goes with you. He has watched you for a week. He knows you better than I do now.',
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
    own: 'shearermon',
    hand: 'SHEARER: And take Shearermon. He’ll be disappointed with you now and then. Don’t take it personally.',
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
    map: 'tottenham',
    before:
      'ROBBIE KEANE: Ah, here, an Irish trainer! Lovely. Any relation to Roy? No? Good. Beat me and I’ll do the cartwheel. Lose and I’ll do it anyway.',
    after:
      'Robbie Keane does the cartwheel, the forward roll and the finger guns, in that order. ROBBIE KEANE: Still got it.',
    own: 'robbiemon',
    hand: 'ROBBIE KEANE: Here, Robbiemon wants to go with you. He’s from Tallaght too. He says you were always his boyhood club.',
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
    map: 'eastlands',
    before:
      'AGÜERO: You know what 93:20 means here? It means it’s never over. Not the season, not the hearing, not the appeal. Vamos.',
    after:
      'The commentator, from somewhere high up: “AGÜEROOOO… no. NO! It’s the Irish lad! City will be appealing that, surely.”',
    own: 'agueromon',
    hand: 'AGÜERO: Take Agüeromon. He’s best in the last minute. Like me. Like the appeal.',
    gift: [
      {
        do: 'say',
        text: 'AGÜERO: Take these. Sky blue, like the shirt. For the last minute, when you need it.',
      },
      { do: 'give', item: 'blue-ghost', count: 3 },
    ],
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
    map: 'fulham',
    before: 'TERRY: Captain. Leader. Legend. It’s on a banner, so it’s true.',
    after: 'TERRY: Still a legend. Banner says so.',
    own: 'terrymon',
    hand: 'TERRY: Take Terrymon. He’ll captain your lot. He’ll lift the trophy even if he’s on the bench.',
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
    map: 'highbury',
    before: 'HENRY: Ah, ze Irish. You are still upset about ze 2009? …Okay. Zis is fair. Allez.',
    after:
      'HENRY: Bravo. (He offers to shake your hand, then pulls it back.) I am joking. I am joking. ’Ere.',
    own: 'henrymon',
    hand: 'HENRY: Henrymon will go with you. Do not let him near a ball with his hands. Not in Paris, anyway.',
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
    map: 'anfield',
    before: 'GERRARD: We go again. Careful there. It’s slippy. Trust me.',
    after: 'GERRARD: We go again. Well. You go on. I’ll stay here.',
    own: 'gerrardmon',
    hand: 'GERRARD: Take Gerrardmon with you. Mind him on the wet grass.',
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
    own: 'keanemon',
    hand: 'KEANE: And take Keanemon. If he walks out on you, that’s your fault. Not his.',
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
  ...KANE_TEXT,
];

export const PL_TRAINERS: Trainer[] = CLUBS.map((c, i) => {
  const { team: lads, ai } = FIXTURE_TEAMS[i];
  const ace = Math.max(...lads.map(([, l]) => l));
  // His own Ranemon takes the place of the team's ace, at its level, and goes out last.
  const benched = lads.findIndex(([, l]) => l === ace);
  const team: Trainer['team'] = [...lads.filter((_, j) => j !== benched), [c.own, ace]];
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
      { do: 'say', text: c.hand },
      { do: 'recruit', species: c.own, level: ace },
      ...(i === CLUBS.length - 1 ? CHAMPIONS : postcard(i)),
    ],
  };
});

/** Each legend's own Ranemon, and the level he gives it to you at: his ace's. */
export const LEGEND_OWN = PL_TRAINERS.map((t) => {
  const [species, level] = t.team[t.team.length - 1];
  return { trainer: t.id, species, level };
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

/** The city each ground is in, for the name of the ground from inside. */
const CITY: Record<ClubId, string> = {
  brighton: 'Brighton',
  palace: 'London',
  villa: 'Birmingham',
  everton: 'Liverpool',
  leeds: 'Leeds',
  newcastle: 'Newcastle',
  spurs: 'London',
  city: 'Manchester',
  chelsea: 'London',
  arsenal: 'London',
  liverpool: 'Liverpool',
  united: 'Manchester',
};

/**
 * A club's ground: its legend on the touchline, and anyone else who's about. It's named with its
 * city (`Old Trafford, Manchester`), since some grounds share a name with the area they're in.
 */
function groundRoom(
  c: Club,
  others: Npc[] = [],
): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things' | 'crest'> {
  const npcs: Npc[] = [{ look: c.look, face: 'down', trainer: legendId(c.id) }, ...others];
  return {
    name: `${c.ground}, ${CITY[c.id]}`,
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
function ground(id: ClubId): Pick<GameMap, 'landmarks' | 'landmarkLocks' | 'landmarkRooms'> {
  const c = clubById(id);
  const lock = turnstile(id);
  return {
    landmarks: [[{ do: 'say', text: `${c.ground.toUpperCase()}. Home of ${c.club}.` }]],
    ...(lock && { landmarkLocks: { 0: lock } }),
    landmarkRooms: { 0: groundRoom(c) },
  };
}

// ---------- the trains ----------

interface Line {
  /** Where it goes, as on the board: the ground's own part of town. */
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
 * The trains from King's Cross, one per platform and one per ground, in the order you play them:
 * platform 1 for the first club, and so on up the table to Old Trafford on platform 12.
 */
const LINES: Line[] = [
  {
    to: 'Falmer',
    map: 'falmer',
    train: 'The 09:12 to Brighton, for Falmer and the Amex',
    ride: 'South to the sea, then a little train up the hill. Enda is waving from the platform.',
    first: 'FALMER. A station, a university, the South Downs, and the Amex. And Enda.',
  },
  {
    to: 'Selhurst',
    map: 'selhurst',
    train: 'The Thameslink to East Croydon, then one stop back to Selhurst, for Selhurst Park',
    ride: 'Down through London Bridge and out past Norwood Junction. The Crystal Palace mast is on the hill the whole way.',
    first:
      'SOUTH NORWOOD. Selhurst Park, squeezed in between the terraces, with a Sainsbury’s built into one end of it. The Crystal Palace mast up on the hill.',
  },
  {
    to: 'Aston',
    map: 'birmingham',
    railcard: true,
    train: 'The 10:03 to Birmingham New Street, then the train up to Witton, for Villa Park',
    ride: 'Up through the Chilterns, past a lot of HS2 that isn’t there yet, then out to Aston.',
    first:
      'ASTON. Aston Hall up the hill, the canal under the Expressway, and Villa Park with the Holte End’s red brick.',
  },
  {
    to: 'Bramley-Moore',
    map: 'liverpool',
    train: 'The 10:47 to Liverpool Lime Street, then up the dock road, for Bramley-Moore Dock',
    ride: 'Over to the west coast. The closer you get, the more Irish everyone sounds.',
    first:
      'BRAMLEY-MOORE DOCK. Everton’s new ground on the Mersey, the Victoria clock tower on the dock wall, the Liver Birds down the river, and the ferry to Dublin.',
  },
  {
    to: 'Beeston',
    map: 'leeds',
    train:
      'The 11:30 to Leeds, then the bus out to Beeston, for Elland Road. It’s late. It’s always late',
    ride: 'Up the East Coast line. A man opposite has a Leeds tattoo on his neck and a Leeds tattoo on his other neck.',
    first:
      'BEESTON. Elland Road, Billy Bremner in bronze outside it with his arms in the air, the white rose of Yorkshire, and everyone marching on together, mostly to the chippy.',
  },
  {
    to: 'Newcastle',
    map: 'newcastle',
    railcard: true,
    train:
      'The 12:00 to Newcastle, for Gallowgate and St James’ Park. Bring a coat. Nobody up there will',
    ride: 'All the way up the east coast, past the Angel of the North, and over the Tyne on the high bridge.',
    first:
      'GALLOWGATE. St James’ Park, enormous, right in the middle of town. The Tyne Bridge down the hill, and nobody in a coat.',
  },
  {
    to: 'Tottenham',
    map: 'tottenham',
    train: 'The Overground to White Hart Lane, for the Tottenham Hotspur Stadium',
    ride: 'Out of Liverpool Street and up through Hackney. The stadium fills the window long before the station.',
    first:
      'TOTTENHAM. The High Road, Bruce Castle, and the Tottenham Hotspur Stadium: a huge silver bowl with a golden cockerel on top and people walking across its roof.',
  },
  {
    to: 'Eastlands',
    map: 'eastlands',
    train:
      'The 12:33 to Manchester Piccadilly, then the tram to the Etihad Campus. First class only. The seats are upholstered in fifty-pound notes',
    ride: 'North through the Midlands. A man in a sheikh’s headdress offers to buy the train. The guard says it isn’t for sale. He buys it anyway.',
    first:
      'EASTLANDS. The Etihad, the velodrome, and an oil field that definitely doesn’t belong to the club’s owner. There’s money blowing down the street.',
  },
  {
    to: 'Fulham Broadway',
    map: 'fulham',
    train: 'The District line to Fulham Broadway, for Stamford Bridge',
    ride: 'Round on the Circle, then out west on the District. Everyone gets off at Fulham Broadway in blue.',
    first:
      'FULHAM. Fulham Broadway station, Brompton Cemetery over the wall, Chelsea Pensioners in red coats, and Stamford Bridge, which isn’t in Chelsea.',
  },
  {
    to: 'Highbury',
    map: 'highbury',
    train:
      'The Piccadilly line to Arsenal, for Highbury and the Emirates. Two stops. Don’t sit down',
    ride: 'Two stops north on the Piccadilly line. Arsenal is the only Tube station named after a football club.',
    first:
      'HIGHBURY. Arsenal station, the old Art Deco East Stand of Highbury (flats now), and the Emirates, ringed with Arsenal legends with their arms round each other.',
  },
  {
    to: 'Anfield',
    map: 'anfield',
    train: 'The 13:05 to Liverpool Lime Street, then the 26 bus up to Anfield',
    ride: 'Back over to Liverpool. Everyone on the 26 bus is singing. The driver too.',
    first:
      'ANFIELD. The Shankly Gates, Stanley Park with Goodison Park across it, Homebaked’s pies, and Anfield’s Main Stand towering over the terraced streets.',
  },
  {
    to: 'Old Trafford',
    map: 'manchester',
    train: 'The 13:33 to Manchester Piccadilly, then the tram to Old Trafford',
    ride: 'North through the Midlands. It rains from Stoke onwards and doesn’t stop.',
    first:
      'OLD TRAFFORD. The Theatre of Dreams, the Munich clock, Best, Law and Charlton in bronze, and the Ship Canal behind. It’s raining.',
  },
];

/** The clubs whose grounds a line reaches: one each. */
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

/** Where a train back into London leaves you on the King's Cross concourse. */
export const CONCOURSE = { x: 12, y: 5 };

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
export const ARRIVAL = { x: 1, y: 4, face: 'right' as const };

/** A train's carriage, on the way to a line's town. */
export const trainId = (map: string) => `train-${map}`;

/** Where you board a train: at the back of the carriage, by its doors. */
export const ON_BOARD = { x: 1, y: 4, face: 'up' as const };

/** Getting off at a line's town: the town, with a word the first time. */
function getOff(l: Line): Step[] {
  return [
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
}

/**
 * Getting on a line: the ride, and the town. The first time, the train is packed and you battle
 * your way up it to the front (`trainRoom`) before you can get off.
 */
function rideOn(l: Line): Step[] {
  const go: Step[] = [
    {
      do: 'if',
      flag: `seen:${l.map}`,
      then: [{ do: 'say', text: l.ride }, ...getOff(l)],
      else: [
        {
          do: 'say',
          text: 'GUARD: First time on this one? It’s rammed. You’ll have to battle your way up the train to the front to get off.',
        },
        { do: 'say', text: l.ride },
        { do: 'travel', map: trainId(l.map), ...ON_BOARD },
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

/** A row of the King's Cross departures board: a line, its ground, and whether it runs. */
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
  at: { x: 17, y: 6 },
  talk: [
    ...nextMatch(),
    { do: 'say', text: 'CLERK: Welcome to King’s Cross. Where are you off to?' },
    { do: 'departures', station: 'kings-cross' },
  ],
};

/** Where each platform's guard stands, under their own part of the board: two tiles apart. */
export const platformAt = (i: number) => ({ x: 2 * i + 1, y: 3 });

/**
 * King's Cross: the departures board along the back wall, a guard on each of the twelve
 * platforms under their own part of it, and the ticket office by the door. The first ten guards
 * stand on their markers, the last two by `at`.
 */
export const KINGS_CROSS_ROOM: Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> = {
  name: 'King’s Cross',
  rows: [
    'WWWWWWWWWWWWWWWWWWWWWWWWWW',
    'WODDDDDDDDDDDDDDDDDDDDDDOW',
    'WFFFFFFFFFFFFFFFFFFFFFFFFW',
    'W1F2F3F4F5F6F7F8F9F0FFFFFW',
    'WFFFFFFFFFFFFFFFFFFFFFFFFW',
    'WUUFFFFFFFFFFFFFFFFFFFFUUW',
    'WNFFFFFFFFFFF@FFFFFFFFFFNW',
    'WWWWWWWWWWWWWEWWWWWWWWWWWW',
  ],
  npcs: [
    ...LINES.map((l, i): Npc => ({
      look: 'conductor',
      face: 'down',
      ...(i >= 10 && { at: platformAt(i) }),
      talk: platformGuard(l, i),
    })),
    // The Metropolitan line to Wembley Park, and Jamie Elliott once the Sidemen have heard of you.
    METROPOLITAN,
    JAMIE_AT_KINGS_CROSS,
    KX_CLERK,
    // The Victoria line, once someone has sent you a text (rowans.ts).
    VICTORIA,
    ...KNEECAP_AT_KINGS_CROSS,
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

// ---------- each ground's own part of town ----------

const town = (min: number, max: number, table: [string, number][]): Wild => ({ min, max, table });

/**
 * A stretch of a street: the ground (wider for the big ones), a landmark (a station's with the
 * name on it), or plain buildings (`P`, `M` and `#`).
 */
type Part =
  | { stadium: ClubId; w: number }
  | { landmark: LandmarkKind; w: number; label?: string }
  | { houses: string };

/** How many rows of the map a ground stands over, and a landmark: grounds stand taller. */
const STADIUM_ROWS = 4;
const LANDMARK_ROWS = 3;

/**
 * A street from its parts, west to east between the trees, and what's drawn over it. The ground's
 * door (its turnstiles) is in the middle of its front, the area's one landmark door.
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
    const door = 'stadium' in p ? Math.floor(p.w / 2) : -1;
    doors += [...Array(p.w)].map((_, i) => (i === door ? 'L' : '#')).join('');
    const y1 = STADIUM_ROWS - 1;
    scenery.push(
      'stadium' in p
        ? { x0, x1: x0 + p.w - 1, y0: 0, y1, kind: 'stadium', club: p.stadium }
        : {
            x0,
            x1: x0 + p.w - 1,
            y0: STADIUM_ROWS - LANDMARK_ROWS,
            y1,
            kind: p.landmark,
            ...(p.label && { label: p.label }),
          },
    );
  }
  return { doors: doors + 'T', scenery };
}

/** How many rows of long grass the common under every ground's street has. */
export const COMMON_ROWS = 9;

/**
 * The common: rows of long grass the width of the street, with short grass round the edge, a
 * tree here and there and a few flowers, so there's room to battle wild Ranemon and level up.
 */
export function commonOf(w: number, rows = COMMON_ROWS): string[] {
  return [...Array(rows)].map((_, y) =>
    [...Array(w)]
      .map((_, x) => {
        if (x === 0 || x === w - 1) return 'T';
        if (x === 1 || x === w - 2 || y === 0 || y === rows - 1) return '.';
        if ((x * 3 + y * 5) % 17 === 0) return 'T';
        if ((x + y * 7) % 13 === 0) return '"';
        return ',';
      })
      .join(''),
  );
}

/**
 * A ground's area of town from its street: two rows of trees along the top (cleared to a plain
 * wall under the ground and the landmarks, so nothing grows through a roof), the buildings, the
 * pavement, the road with its cars, a park with long grass in it, and below that a big common of
 * long grass to battle and level up in between the grounds.
 * Its people stand at 1 (the guard home, by the way in), 2 (a local), then 3 and 4 (trainers, on
 * the far pavement) and 5 (someone else about).
 */
function areaOf(parts: Part[], people: number): Pick<GameMap, 'rows' | 'scenery'> {
  const { doors, scenery } = street(parts);
  const w = doors.length;
  if (w < 24) throw new Error(`a street of ${w} is too short for its people`);
  const spot = (n: number, x: number) => (n <= people ? { [x]: String(n) } : {});
  const row = (fill: string | ((x: number) => string), at: Record<number, string> = {}) =>
    [...Array(w)]
      .map((_, x) =>
        x === 0 || x === w - 1 ? 'T' : (at[x] ?? (typeof fill === 'string' ? fill : fill(x))),
      )
      .join('');
  const covered = (x: number, y: number) =>
    scenery.some((s) => x >= s.x0 && x <= s.x1 && y >= s.y0);
  const top = (y: number) =>
    [...Array(w)].map((_, x) => (x > 0 && x < w - 1 && covered(x, y) ? 'W' : 'T')).join('');
  const park = (x: number) => ((x >= 2 && x <= 9) || (x >= 15 && x <= 21) ? ',' : 'v');
  const rows = [
    top(0),
    top(1),
    row('^'),
    doors,
    row('v', { 1: '@' }),
    row('v', { ...spot(1, 2), ...spot(2, 17) }),
    row('a'),
    row('a', { 4: 'c', 19: 'c' }),
    row('v', spot(5, 11)),
    row(park, { ...spot(3, 7), 14: 'S', ...spot(4, 17) }),
    row(park),
    row('v'),
    ...commonOf(w),
    'T'.repeat(w),
  ];
  return { rows, scenery };
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

const local = (face: Npc['face'], text: string, look: Look = 'local'): Npc => ({
  look,
  face,
  talk: say(text),
});

/** What every ground's area has: in Britain, 2D only, with its own guard back to London. */
const AREA = { county: 9, flat: true, uk: true } as const;

// 1. Brighton, at Falmer.

export const FALMER: GameMap = {
  id: 'falmer',
  name: 'Falmer, East Sussex',
  ...AREA,
  ...areaOf(
    [
      { landmark: 'south-downs', w: 7 },
      { stadium: 'brighton', w: 10 },
      { houses: '##' },
      { landmark: 'rail', w: 5, label: 'FALMER' },
    ],
    2,
  ),
  wild: town(6, 9, [
    ['enda', 20],
    ['simomon', 20],
    ['lorcamon', 20],
    ['owemon', 20],
    ['skehemon', 20],
  ]),
  npcs: [
    guard(),
    {
      look: 'enda',
      face: 'down',
      talk: [
        {
          do: 'if',
          // A London-only game has never met Enda in Kildare, or been to Brighton with him.
          flag: LONDON_ONLY,
          then: [
            ...say(
              'ENDA: Hiya! I’m Enda! I’m very small and I make best friends with everyone. You’re my best friend now. That’s just how it is.',
            ),
            ...say(
              'ENDA: I made you a friendship bracelet on the train. It says PREMIER LEAGUE. It’s spelt wrong.',
            ),
          ],
          else: [
            ...say('ENDA: I KNEW you’d come back! Is it a tradition now? It’s a tradition.'),
            ...say(
              'ENDA: I made you another friendship bracelet on the train. It says PREMIER LEAGUE. It’s spelt wrong.',
            ),
          ],
        },
      ],
    },
  ],
  signs: ['FALMER. The Amex. Brighton & Hove Albion. The South Downs behind.'],
  ...ground('brighton'),
};

// 2. Crystal Palace, at Selhurst Park in South Norwood.

export const SELHURST: GameMap = {
  id: 'selhurst',
  name: 'South Norwood, London',
  ...AREA,
  terraces: 'english',
  ...areaOf(
    [
      { landmark: 'crystal-palace-mast', w: 7 },
      { houses: '##' },
      { stadium: 'palace', w: 10 },
      { landmark: 'sainsburys', w: 6 },
      { landmark: 'rail', w: 4, label: 'SELHURST' },
    ],
    4,
  ),
  wild: town(9, 13, [
    ['jammon', 20],
    ['hugomon', 20],
    ['conemon', 20],
    ['vinnimon', 20],
    ['crampemon', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'LOCAL: That’s a Sainsbury’s, yeah. Built right into the Whitehorse Lane end. You can do your big shop at half time.',
    ),
    trainerAt('snw-eagle', 'right'),
    trainerAt('snw-holmesdale', 'left'),
  ],
  signs: [
    'SOUTH NORWOOD. Selhurst Park, home of Crystal Palace. The Crystal Palace itself burnt down in 1936. The mast and the dinosaurs are still up the hill.',
  ],
  ...ground('palace'),
};

// 3. Aston Villa, at Villa Park in Aston.

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
  name: 'Aston, Birmingham',
  ...AREA,
  terraces: 'english',
  yates: BIRMINGHAM_YATES,
  ...areaOf(
    [
      { landmark: 'aston-hall', w: 8 },
      { houses: '##P##' },
      { landmark: 'canal', w: 6 },
      { houses: '#M#' },
      { stadium: 'villa', w: 10 },
    ],
    4,
  ),
  wild: town(12, 16, [
    ['steadmon', 20],
    ['skehemon', 20],
    ['simomon', 20],
    ['paulimon', 20],
    ['robinmon', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'VILLA FAN: (In a gilet, and sunglasses, and a very fake moustache.) I’m basically royalty. I know a lot of people. Best of luck. You’ll need it. Ahem.',
    ),
    trainerAt('brum-canal', 'right'),
    trainerAt('brum-bull', 'left'),
  ],
  signs: ['ASTON. Villa Park this way, Aston Hall up the hill. Up the Villa.'],
  ...ground('villa'),
};

// 4. Everton, at Bramley-Moore Dock on the Mersey.

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
  name: 'Bramley-Moore Dock, Liverpool',
  ...AREA,
  terraces: 'english',
  yates: LIVERPOOL_YATES,
  ...areaOf(
    [
      { landmark: 'liver-building', w: 8 },
      { houses: '##P##' },
      { landmark: 'victoria-tower', w: 4 },
      { landmark: 'mersey', w: 7 },
      { houses: '#M#' },
      { stadium: 'everton', w: 10 },
    ],
    4,
  ),
  wild: town(15, 19, [
    ['boydemon', 20],
    ['thilomon', 20],
    ['killemon', 20],
    ['conemon', 20],
    ['oismon', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'SCOUSE LAD: Big Dunc? He caught a burglar in his own house once, la. Burglar’s still not right.',
    ),
    trainerAt('lpool-ferry', 'right'),
    trainerAt('lpool-dock', 'left'),
  ],
  signs: [
    'BRAMLEY-MOORE DOCK. Everton’s new ground, on the Mersey. The Pier Head and the ferry for Dublin down the river. Anfield is up the hill, on another train.',
  ],
  ...ground('everton'),
};

// 5. Leeds United, at Elland Road in Beeston.

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
  name: 'Beeston, Leeds',
  ...AREA,
  terraces: 'english',
  yates: LEEDS_YATES,
  ...areaOf(
    [
      { landmark: 'yorkshire-rose', w: 6 },
      { houses: '##P##' },
      { landmark: 'bremner-statue', w: 6 },
      { houses: '#M#' },
      { stadium: 'leeds', w: 10 },
    ],
    4,
  ),
  wild: town(18, 22, [
    ['steadmon', 20],
    ['hugomon', 20],
    ['paulimon', 20],
    ['jammon', 20],
    ['vinnimon', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'LOCAL: Bielsa? He’s a god here. We put up a mural. And another one. And a statue of the bucket. Billy Bremner’s statue is jealous.',
    ),
    trainerAt('leeds-analyst-1', 'right'),
    trainerAt('leeds-analyst-2', 'left'),
  ],
  signs: ['BEESTON. Elland Road this way, past Billy Bremner. Marching on together.'],
  ...ground('leeds'),
};

// 6. Newcastle United, at St James' Park on Gallowgate.

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
  name: 'Gallowgate, Newcastle',
  ...AREA,
  terraces: 'english',
  yates: NEWCASTLE_YATES,
  ...areaOf(
    [
      { landmark: 'tyne-bridge', w: 8 },
      { houses: '##P##' },
      { landmark: 'angel', w: 7 },
      { houses: '#M#' },
      { stadium: 'newcastle', w: 12 },
    ],
    4,
  ),
  wild: town(21, 25, [
    ['olliemon', 20],
    ['gibbsmon', 20],
    ['carlmon', 20],
    ['killemon', 20],
    ['owemon', 20],
  ]),
  npcs: [
    guard(),
    local('down', 'GEORDIE: Howay man, it’s not cold! It’s FRESH. Coats are for Londoners.'),
    trainerAt('ncl-topless', 'right'),
    trainerAt('ncl-bridge', 'left'),
  ],
  signs: [
    'GALLOWGATE. St James’ Park, right in the middle of town. You can’t miss it. It’s enormous.',
  ],
  ...ground('newcastle'),
};

// 7. Tottenham Hotspur, on the High Road.

export const TOTTENHAM: GameMap = {
  id: 'tottenham',
  name: 'Tottenham, North London',
  ...AREA,
  terraces: 'english',
  ...areaOf(
    [
      { landmark: 'bruce-castle', w: 6 },
      { landmark: 'overground', w: 5, label: 'WHITE HART LANE' },
      { stadium: 'spurs', w: 14 },
      { houses: '##' },
    ],
    4,
  ),
  wild: town(24, 28, [
    ['robinmon', 20],
    ['steadmon', 20],
    ['lorcamon', 20],
    ['boydemon', 20],
    ['crampemon', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'LOCAL: Sixty-two thousand seats, a pitch that slides away for the NFL, a microbrewery, and you can walk across the roof. One trophy, mind.',
    ),
    trainerAt('thfc-skywalk', 'right'),
    trainerAt('thfc-brewery', 'left'),
  ],
  signs: [
    'TOTTENHAM. The Tottenham Hotspur Stadium, on the High Road where White Hart Lane was. To dare is to do.',
  ],
  ...ground('spurs'),
};

// 8. Manchester City, at the Etihad in Eastlands.

export const EASTLANDS: GameMap = {
  id: 'eastlands',
  name: 'Eastlands, Manchester',
  ...AREA,
  terraces: 'english',
  ...areaOf(
    [
      { landmark: 'velodrome', w: 8 },
      { houses: '##' },
      { landmark: 'oil-field', w: 7 },
      { houses: '#M#' },
      { stadium: 'city', w: 11 },
    ],
    4,
  ),
  wild: town(26, 30, [
    ['olliemon', 20],
    ['oismon', 20],
    ['gibbsmon', 15],
    ['thilomon', 15],
    ['owemon', 15],
    ['jammon', 15],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'LOCAL: The oil field? Been there since the takeover. Nothing to do with the owner. Different company. Same address.',
    ),
    trainerAt('mcr-ultra', 'right'),
    trainerAt('mcr-cyclist', 'left'),
  ],
  signs: [
    'EASTLANDS. The Etihad Stadium, home of Manchester City. Money found on the pavement must be handed in. It won’t be.',
  ],
  ...ground('city'),
  landmarkRooms: {
    // City's lawyers and their accountant, never far from the touchline.
    0: groundRoom(clubById('city'), [
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

// 9. Chelsea, at Stamford Bridge in Fulham.

export const FULHAM: GameMap = {
  id: 'fulham',
  name: 'Fulham, West London',
  ...AREA,
  terraces: 'english',
  ...areaOf(
    [
      { landmark: 'brompton-cemetery', w: 7 },
      { landmark: 'underground', w: 5, label: 'FULHAM BROADWAY' },
      { stadium: 'chelsea', w: 11 },
      { houses: '##' },
    ],
    5,
  ),
  wild: town(30, 34, [
    ['simomon', 20],
    ['hugomon', 20],
    ['paulimon', 20],
    ['skehemon', 20],
    ['vinnimon', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'LOCAL: Stamford Bridge isn’t in Chelsea, it’s in Fulham. Fulham are in Fulham as well. Nobody tells the tourists.',
    ),
    trainerAt('cfc-shed', 'right'),
    trainerAt('cfc-kings-road', 'left'),
    local(
      'down',
      'CHELSEA PENSIONER: Scarlet coat, tricorn hat, season ticket since 1955. I’ve seen eleven managers sacked this year. It’s March.',
      'oldman',
    ),
  ],
  signs: [
    'FULHAM. Stamford Bridge, home of Chelsea, by Fulham Broadway. Brompton Cemetery over the wall.',
  ],
  ...ground('chelsea'),
};

// 10. Arsenal, at the Emirates in Highbury.

export const HIGHBURY: GameMap = {
  id: 'highbury',
  name: 'Highbury, North London',
  ...AREA,
  terraces: 'english',
  ...areaOf(
    [
      { landmark: 'highbury-square', w: 8 },
      { landmark: 'underground', w: 5, label: 'ARSENAL' },
      { stadium: 'arsenal', w: 12 },
      { houses: '##' },
    ],
    4,
  ),
  wild: town(33, 37, [
    ['lorcamon', 20],
    ['jammon', 20],
    ['crampemon', 20],
    ['steadmon', 20],
    ['thilomon', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'LOCAL: That was the old ground, Highbury. Marble halls, the clock end, Art Deco. They turned it into flats. The pitch is a garden now.',
    ),
    trainerAt('afc-clock-end', 'right'),
    trainerAt('afc-invincible', 'left'),
  ],
  signs: [
    'HIGHBURY. The Emirates, home of Arsenal, by Arsenal station. The old Highbury stadium is round the corner, flats now.',
  ],
  ...ground('arsenal'),
};

// 11. Liverpool, at Anfield.

export const ANFIELD: GameMap = {
  id: 'anfield',
  name: 'Anfield, Liverpool',
  ...AREA,
  terraces: 'english',
  ...areaOf(
    [
      { landmark: 'stanley-park', w: 8 },
      { landmark: 'homebaked', w: 5 },
      { houses: '#M#' },
      { landmark: 'shankly-gates', w: 5 },
      { stadium: 'liverpool', w: 12 },
    ],
    4,
  ),
  wild: town(36, 40, [
    ['boydemon', 20],
    ['robinmon', 20],
    ['killemon', 20],
    ['conemon', 20],
    ['enda', 20],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'KOPITE: Goodison’s just across Stanley Park, la. Everton moved down to the docks. We still don’t go in that end of the park.',
    ),
    trainerAt('anf-kop', 'right'),
    trainerAt('anf-gates', 'left'),
  ],
  signs: [
    'ANFIELD. Home of Liverpool. The Shankly Gates, the Kop, and Stanley Park. You’ll never walk alone.',
  ],
  ...ground('liverpool'),
};

// 12. Manchester United, at Old Trafford.

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
  name: 'Old Trafford, Manchester',
  ...AREA,
  terraces: 'english',
  yates: MANCHESTER_YATES,
  ...areaOf(
    [
      { landmark: 'manchester-mill', w: 6 },
      { houses: '##P##' },
      { landmark: 'united-trinity', w: 6 },
      { landmark: 'ship-canal', w: 6 },
      { houses: '#M#' },
      { stadium: 'united', w: 13 },
    ],
    4,
  ),
  wild: town(40, 44, [
    ['olliemon', 20],
    ['oismon', 20],
    ['gibbsmon', 15],
    ['carlmon', 15],
    ['owemon', 15],
    ['thilomon', 15],
  ]),
  npcs: [
    guard(),
    local(
      'down',
      'LOCAL: City? That’s the other side of town, Eastlands. Different tram. Different planet. We don’t talk about them here.',
    ),
    trainerAt('mcr-oasis', 'right'),
    trainerAt('mcr-stretford', 'left'),
  ],
  signs: [
    'OLD TRAFFORD. The Theatre of Dreams, home of Manchester United. Sir Matt Busby Way. The Holy Trinity in bronze.',
  ],
  ...ground('united'),
};

/** Every ground's own area, in the order you play them. */
export const PL_MAPS = [
  FALMER,
  SELHURST,
  BIRMINGHAM,
  LIVERPOOL,
  LEEDS,
  NEWCASTLE,
  TOTTENHAM,
  EASTLANDS,
  FULHAM,
  HIGHBURY,
  ANFIELD,
  MANCHESTER,
];

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
  ukTrainer(
    'snw-eagle',
    'Eagle Handler Kayla',
    [
      ['robinmon', 11],
      ['pedalmon', 12],
    ],
    'EAGLE HANDLER KAYLA: Kayla the eagle flies before every home game. I fly before every battle. Not literally.',
    'EAGLE HANDLER KAYLA: Grounded.',
  ),
  ukTrainer(
    'snw-holmesdale',
    'Holmesdale Ultra Del',
    [
      ['skatemon', 12],
      ['gibbsmon', 13],
    ],
    'HOLMESDALE ULTRA DEL: Drum, flags, ninety minutes standing up. You think you can out-sing the Holmesdale?',
    'HOLMESDALE ULTRA DEL: Glad all over. Not really.',
  ),
  ukTrainer(
    'thfc-skywalk',
    'Skywalk Guide Priya',
    [
      ['carlmon', 25],
      ['speedmon', 26],
    ],
    'SKYWALK GUIDE PRIYA: I take people over the roof, forty metres up. Clip in. We battle on the way down.',
    'SKYWALK GUIDE PRIYA: Mind the edge on your way out.',
  ),
  ukTrainer(
    'thfc-brewery',
    'Brewer Dom',
    [
      ['bagelmon', 26],
      ['jammon', 27],
    ],
    'BREWER DOM: Biggest bar in Europe, sixty-five metres long, and a brewery under the stand. One trophy, mind. Battle!',
    'BREWER DOM: Spursy. That was very Spursy of me.',
  ),
  ukTrainer(
    'mcr-cyclist',
    'Velodrome Rider Laura',
    [
      ['pedalmon', 29],
      ['vinnimon', 30],
    ],
    'VELODROME RIDER LAURA: Round and round the track at the velodrome all morning. You’re my warm-down.',
    'VELODROME RIDER LAURA: Photo finish. Mine wasn’t the good one.',
  ),
  ukTrainer(
    'cfc-shed',
    'Shed End Gary',
    [
      ['simomon', 31],
      ['wickmon', 32],
    ],
    'SHED END GARY: Been in the Shed since it was a shed. Battle me, and I’ll sing you “Blue is the Colour”.',
    'SHED END GARY: Blue is the colour. Mostly my face, now.',
  ),
  ukTrainer(
    'cfc-kings-road',
    'King’s Road Tilly',
    [
      ['lorcamon', 32],
      ['seedmon', 33],
    ],
    'KING’S ROAD TILLY: Daddy bought me a box for the season. I came down to see what the outside is like. Battle!',
    'KING’S ROAD TILLY: I’m telling Daddy.',
  ),
  ukTrainer(
    'afc-clock-end',
    'Clock End Kev',
    [
      ['hugomon', 34],
      ['oatmon', 35],
    ],
    'CLOCK END KEV: They moved the clock to the Emirates. I moved with it. Forty years in that end. Battle!',
    'CLOCK END KEV: Time’s up, then.',
  ),
  ukTrainer(
    'afc-invincible',
    'Invincible Nadia',
    [
      ['owemon', 35],
      ['fleamon', 36],
    ],
    'INVINCIBLE NADIA: Forty-nine games unbeaten, 2003 to 2004. I was there for every one. I don’t lose.',
    'INVINCIBLE NADIA: Fifty. It was going to happen sometime.',
  ),
  ukTrainer(
    'anf-kop',
    'Kopite Jamie',
    [
      ['steadmon', 37],
      ['decksmon', 38],
    ],
    'KOPITE JAMIE: The Kop sucks the ball into the net, la. Watch it suck the life out of your team.',
    'KOPITE JAMIE: You’ll never walk alone. You might lose alone, though. Like me.',
  ),
  ukTrainer(
    'anf-gates',
    'Pie Man Tony',
    [
      ['crampemon', 38],
      ['oystermon', 39],
    ],
    'PIE MAN TONY: Homebaked’s pies, best in Liverpool. Win this and you can have one. Lose and I’ll eat it at you.',
    'PIE MAN TONY: Have the pie. Go on.',
  ),
  ukTrainer(
    'mcr-stretford',
    'Stretford Ender Bryan',
    [
      ['killemon', 41],
      ['jabmon', 42],
      ['robinmon', 43],
    ],
    'STRETFORD ENDER BRYAN: Thirteen titles under Fergie and I sat through every one. I’ve sat through a lot since, as well. Battle!',
    'STRETFORD ENDER BRYAN: Like watching the last ten years all over again.',
  ),
];

// ---------- the first ride on each line ----------

/**
 * A carriage: tables and seats along both sides and a wide aisle up the middle. The three
 * passengers sit by the aisle, in seats facing it, so nobody gets up the train without being
 * seen, and the conductor waits at the front. You board at the back (`@`), where the doors (`E`)
 * take you back off onto the street outside King's Cross.
 */
const CARRIAGE = [
  'WWOWWOWWOWWOWWOWWOWWOWWOWW',
  'WnUnFnUn1nUnFnUnFnUn3nUnUW',
  'WFFFFFFFFFFFFFFFFFFFFFFF4W',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'W@nUnFnUnFnUn2nUnFnUnFnUnW',
  'WEWWWWWWWWWWWWWWWWWWWWWWWW',
];

/** Getting off a train goes back out of King's Cross, onto the street in London. */
export const KINGS_CROSS_DOOR = { map: 'london', x: 3, y: 2 };

/** London's long grass tops out at Lv6: the first train starts a little over it. */
const FIRST_FROM = 6;

/** How many passengers battle you on each train. */
const PASSENGERS_PER_TRAIN = 3;

/** Someone on a train the first time you take it, with their two Ranemon. */
interface Passenger {
  look: Look;
  name: string;
  team: [string, string];
  before: string;
  after: string;
}

/** The passengers on each line's train, from the back of the carriage to the front. */
const PASSENGERS: Record<string, Passenger[]> = {
  falmer: [
    {
      look: 'hen',
      name: 'Hen Party Shauna',
      team: ['enda', 'skatemon'],
      before:
        'HEN PARTY SHAUNA: We’re off to Brighton for Ciara’s hen! You’re coming now. Battle first!',
      after: 'HEN PARTY SHAUNA: Fine. You’re still coming to the hen.',
    },
    {
      look: 'trainer',
      name: 'Student Ollie',
      team: ['simomon', 'oatmon'],
      before: 'STUDENT OLLIE: I’m at Sussex. I study the vibes. Battle me.',
      after: 'STUDENT OLLIE: I’ll write my dissertation on that.',
    },
    {
      look: 'fan',
      name: 'Seagulls Fan Dawn',
      team: ['oystermon', 'owemon'],
      before: 'SEAGULLS FAN DAWN: Up the Albion! Nobody takes points off us at the Amex.',
      after: 'SEAGULLS FAN DAWN: Glenn Murray will sort you out.',
    },
  ],
  selhurst: [
    {
      look: 'local',
      name: 'Commuter Gary',
      team: ['speedmon', 'jammon'],
      before:
        'COMMUTER GARY: Thameslink have cancelled the next six trains. I’ve time for a battle.',
      after: 'COMMUTER GARY: Delayed. Again.',
    },
    {
      look: 'fan',
      name: 'Eagles Fan Tash',
      team: ['hugomon', 'fleamon'],
      before: 'EAGLES FAN TASH: Holmesdale Road End, born and bred. Come on then!',
      after: 'EAGLES FAN TASH: We’ll still sing louder than you.',
    },
    {
      look: 'trainer',
      name: 'Croydon Kid Jordan',
      team: ['skatemon', 'conemon'],
      before: 'CROYDON KID JORDAN: Croydon’s got a Boxpark AND a tram. Respect it.',
      after: 'CROYDON KID JORDAN: Still got the tram.',
    },
  ],
  birmingham: [
    {
      look: 'trainer',
      name: 'HS2 Engineer Priya',
      team: ['boydemon', 'pedalmon'],
      before: 'HS2 ENGINEER PRIYA: This line will be twenty minutes faster by 2040. Maybe. Battle.',
      after: 'HS2 ENGINEER PRIYA: Over budget again.',
    },
    {
      look: 'local',
      name: 'Brummie Nan Joan',
      team: ['steadmon', 'bagelmon'],
      before: 'BRUMMIE NAN JOAN: Ow am ya, bab? Lovely. Now battle me.',
      after: 'BRUMMIE NAN JOAN: Tara-a-bit, bab.',
    },
    {
      look: 'fan',
      name: 'Villa Fan Kev',
      team: ['paulimon', 'seedmon'],
      before: 'VILLA FAN KEV: Holte End, me. We won the European Cup, you know. Once.',
      after: 'VILLA FAN KEV: 1982 still counts.',
    },
  ],
  liverpool: [
    {
      look: 'sailor',
      name: 'Ferry Worker Siobhán',
      team: ['oystermon', 'thilomon'],
      before: 'FERRY WORKER SIOBHÁN: I work the Dublin ferry. Today I’m off duty, and fighting.',
      after: 'FERRY WORKER SIOBHÁN: Rough crossing, that.',
    },
    {
      look: 'fan',
      name: 'Toffee Fan Ste',
      team: ['killemon', 'jabmon'],
      before: 'TOFFEE FAN STE: Bramley-Moore Dock! Best new ground in the world. Prove me wrong.',
      after: 'TOFFEE FAN STE: Still the People’s Club.',
    },
    {
      look: 'lad',
      name: 'Scouse Lad Connor',
      team: ['conemon', 'decksmon'],
      before:
        'SCOUSE LAD CONNOR: Me nan’s from Wexford, me da’s from Mayo and I’m from Kirkby. Battle!',
      after: 'SCOUSE LAD CONNOR: Boss, that, la.',
    },
  ],
  leeds: [
    {
      look: 'trainer',
      name: 'Intern Marta',
      team: ['seedmon', 'hugomon'],
      before: 'INTERN MARTA: Marcelo has me watching the whole carriage. You’re next.',
      after: 'INTERN MARTA: I’ll need another forty hours of footage.',
    },
    {
      look: 'fan',
      name: 'Leeds Fan Gaz',
      team: ['jammon', 'oatmon'],
      before: 'LEEDS FAN GAZ: Marching on together! Mostly to the buffet car.',
      after: 'LEEDS FAN GAZ: Dirty, that.',
    },
    {
      look: 'local',
      name: 'Rambler Margaret',
      team: ['vinnimon', 'pedalmon'],
      before: 'RAMBLER MARGARET: Off to walk the Dales. A battle first, it’ll warm my legs up.',
      after: 'RAMBLER MARGARET: Right. Pass me my flask.',
    },
  ],
  newcastle: [
    {
      look: 'stag',
      name: 'Stag Do Lee',
      team: ['gibbsmon', 'bagelmon'],
      before: 'STAG DO LEE: Stag do to the Toon! No coats! Battle!',
      after: 'STAG DO LEE: Taking me top off now. Not because of that.',
    },
    {
      look: 'fan',
      name: 'Toon Fan Shelley',
      team: ['olliemon', 'fleamon'],
      before: 'TOON FAN SHELLEY: Howay! Shearer’s waiting, and so am I.',
      after: 'TOON FAN SHELLEY: Divvent tell Alan.',
    },
    {
      look: 'trainer',
      name: 'Reality Star Jay',
      team: ['owemon', 'speedmon'],
      before:
        'REALITY STAR JAY: I’m auditioning for Geordie Shore. Battling’s part of it, probably.',
      after: 'REALITY STAR JAY: I’ll just do a fake tan instead.',
    },
  ],
  tottenham: [
    {
      look: 'fan',
      name: 'Spurs Fan Daniel',
      team: ['robinmon', 'jabmon'],
      before: 'SPURS FAN DANIEL: This is our year. It’s always our year. Battle!',
      after: 'SPURS FAN DANIEL: It’s the hope that kills you.',
    },
    {
      look: 'local',
      name: 'Barista Freya',
      team: ['oatmon', 'crampemon'],
      before: 'BARISTA FREYA: An oat flat white is six pounds. A battle’s free.',
      after: 'BARISTA FREYA: That’ll be six pounds anyway.',
    },
    {
      look: 'busker',
      name: 'Busker Femi',
      team: ['decksmon', 'lorcamon'],
      before:
        'BUSKER FEMI: I’ve played Wonderwall four hundred times today. Battle me so I can stop.',
      after: 'BUSKER FEMI: Wonderwall it is, then.',
    },
  ],
  eastlands: [
    {
      look: 'tux',
      name: 'Hedge Fund Hugo',
      team: ['bagelmon', 'oismon'],
      before:
        'HEDGE FUND HUGO: First class, obviously. The seats are fifty-pound notes. Battle me for one.',
      after: 'HEDGE FUND HUGO: Put it on expenses.',
    },
    {
      look: 'fan',
      name: 'City Fan Nadia',
      team: ['thilomon', 'speedmon'],
      before: 'CITY FAN NADIA: Treble winners! The charges are irrelevant. Battle!',
      after: 'CITY FAN NADIA: We’ll be appealing that.',
    },
    {
      look: 'local',
      name: 'Ticket Inspector Bernard',
      team: ['gibbsmon', 'fleamon'],
      before: 'TICKET INSPECTOR BERNARD: Tickets, please. No ticket? A battle, then.',
      after: 'TICKET INSPECTOR BERNARD: Enjoy the rest of your journey.',
    },
  ],
  fulham: [
    {
      look: 'tux',
      name: 'Sloane Ranger Pippa',
      team: ['simomon', 'skatemon'],
      before:
        'SLOANE RANGER PIPPA: Daddy says the District line is character building. Quick battle.',
      after: 'SLOANE RANGER PIPPA: I’m getting an Uber next time.',
    },
    {
      look: 'oldman',
      name: 'Chelsea Pensioner Arthur',
      team: ['steadmon', 'paulimon'],
      before: 'CHELSEA PENSIONER ARTHUR: I saw Osgood play, son. Let’s see what you’ve got.',
      after: 'CHELSEA PENSIONER ARTHUR: Not bad. Osgood was better.',
    },
    {
      look: 'fan',
      name: 'Blues Fan Mason',
      team: ['hugomon', 'jabmon'],
      before: 'BLUES FAN MASON: Eleven managers since I was born. Battle!',
      after: 'BLUES FAN MASON: Sack the manager.',
    },
  ],
  highbury: [
    {
      look: 'fan',
      name: 'Gooner Aisha',
      team: ['lorcamon', 'seedmon'],
      before: 'GOONER AISHA: Two stops. Just long enough to beat you.',
      after: 'GOONER AISHA: Trust the process.',
    },
    {
      look: 'trainer',
      name: 'Tourist Lars',
      team: ['crampemon', 'pedalmon'],
      before: 'TOURIST LARS: Is this the Tube to Arsenal? I will battle you for directions.',
      after: 'TOURIST LARS: I will ask somebody else.',
    },
    {
      look: 'local',
      name: 'Islington Dad Rupert',
      team: ['vinnimon', 'oatmon'],
      before: 'ISLINGTON DAD RUPERT: Sourdough in one hand, season ticket in the other. Battle.',
      after: 'ISLINGTON DAD RUPERT: I shall be writing to the Guardian.',
    },
  ],
  anfield: [
    {
      look: 'fan',
      name: 'Kopite Jen',
      team: ['boydemon', 'decksmon'],
      before: 'KOPITE JEN: You’ll never walk alone. You’ll lose, though.',
      after: 'KOPITE JEN: Still never walking alone.',
    },
    {
      look: 'lad',
      name: 'Singer Tommo',
      team: ['killemon', 'fleamon'],
      before: 'SINGER TOMMO: (Singing.) Allez, allez, allez! Battle, battle, battle!',
      after: 'SINGER TOMMO: (Still singing.)',
    },
    {
      look: 'trainer',
      name: 'Beatles Guide Paula',
      team: ['enda', 'speedmon'],
      before:
        'BEATLES GUIDE PAULA: Strawberry Field is that way. But first, all you need is a battle.',
      after: 'BEATLES GUIDE PAULA: Let it be.',
    },
  ],
  manchester: [
    {
      look: 'fan',
      name: 'United Fan Callum',
      team: ['olliemon', 'jabmon'],
      before: 'UNITED FAN CALLUM: Twenty titles. I was there for most of them. On the telly.',
      after: 'UNITED FAN CALLUM: Fergie would’ve had words.',
    },
    {
      look: 'trainer',
      name: 'Poet Lou',
      team: ['owemon', 'bagelmon'],
      before: 'POET LOU: It rains in Manchester. It rains on you. Battle.',
      after: 'POET LOU: That one’s going in the book.',
    },
    {
      look: 'lad',
      name: 'Raver Shaun',
      team: ['oismon', 'decksmon'],
      before: 'RAVER SHAUN: The Haçienda, ’89. Never really left. Come on then!',
      after: 'RAVER SHAUN: Madchester, that.',
    },
  ],
};

const passengerId = (map: string, k: number) => `train-${map}-${k + 1}`;

/** The ace of the club a line goes to, by its place in the fixtures. */
const aceOf = (i: number) => Math.max(...FIXTURE_TEAMS[i].team.map(([, l]) => l));

/** A line's club, by its place in the fixtures. */
const fixtureOf = (l: Line) => CLUBS.findIndex((c) => c.map === l.map);

/**
 * The best Ranemon of the k-th passenger on a line: from the ace of the legend before up toward
 * the ace of the legend you're on your way to, so you level up between grounds without grinding.
 */
export function passengerLevel(i: number, k: number): number {
  const from = i === 0 ? FIRST_FROM : aceOf(i - 1);
  return from + Math.round(((aceOf(i) - from) * (k + 1)) / (PASSENGERS_PER_TRAIN + 1));
}

/** Everyone on the trains: two Ranemon each, the first a level under the second. */
const TRAIN_TRAINERS: Trainer[] = LINES.flatMap((l) => {
  const i = fixtureOf(l);
  return PASSENGERS[l.map].map((p, k): Trainer => {
    const top = passengerLevel(i, k);
    return {
      ...ukTrainer(
        passengerId(l.map, k),
        p.name,
        [
          [p.team[0], top - 1],
          [p.team[1], top],
        ],
        p.before,
        p.after,
      ),
      // The first two trains are the easy ones, like London's own trainers.
      ai: i < 2 ? 'easy' : 'normal',
    };
  });
});

/** A line's train, the first time you take it: its passengers, and the conductor at the front. */
function trainRoom(l: Line): GameMap {
  const passengers: Npc[] = PASSENGERS[l.map].map((p, k) => ({
    look: p.look,
    // The second passenger sits on the far side of the aisle, facing the other way.
    face: k === 1 ? 'up' : 'down',
    trainer: passengerId(l.map, k),
    sight: 2,
  }));
  return {
    id: trainId(l.map),
    name: `The train to ${l.to}`,
    county: 9,
    flat: true,
    uk: true,
    inside: KINGS_CROSS_DOOR,
    rows: CARRIAGE,
    npcs: [
      ...passengers,
      {
        look: 'conductor',
        face: 'left',
        talk: [
          {
            do: 'say',
            text: `CONDUCTOR: You made it up the whole train! Next stop, ${l.to}. Mind the gap.`,
          },
          ...getOff(l),
        ],
      },
    ],
    things: {
      n: 'A seat. Someone has put their bag on it, and their coat, and their feet.',
      U: 'A table, sticky with someone else’s tea. A newspaper on it says the trains are late.',
    },
  };
}

/** The trains, one per line, each taken once: the first time you go to its town. */
export const TRAIN_ROOMS = LINES.map(trainRoom);

export const PREMIER_TRAINERS = [...PL_TRAINERS, ...ROUTE_TRAINERS, ...TRAIN_TRAINERS];

/** The legends' jersey flags, in the order you win them. */
export const PL_FLAGS = CLUBS.map((c) => plFlag(c.id));

/** The legends, in order, with where they are: for the mission list. */
export const FIXTURE_LIST = CLUBS.map((c) => ({
  id: c.id,
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
