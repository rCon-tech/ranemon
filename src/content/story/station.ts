import { BOYDE } from './boyde';
import { ENDA_ASKED } from './enda';
import { CRAMPS_AT_STATION, TECHNO_ASKED } from './cramps';
import { PROVAI_ARRIVE, PROVAI_ASKED, PROVAI_AT_STATION } from './kneecap';
import { BALL_FLAG } from './ball';
import { interiorId } from './interiors';
import { slot, type Dir, type GameMap, type Look, type Step } from '@/lib/story/world';

/**
 * Connolly Station, Dublin: one door for every train out of the city. The clerk at the ticket
 * desk shows the departures board and sells you a ticket to anywhere it runs; the staff on the
 * platforms will also take you straight onto their own train.
 *
 * Every line is a row in `DEPARTURES`. To add one: make its map, add a `Departure` here (its
 * staff stand on the platforms and its stop goes on the board without any other change), and
 * put `homeward(id)` on whoever brings you back. A line that isn't ready yet can go on the board
 * as `soon`, and one that opens later in the story takes a `lock`.
 */

/** The station is the third landmark door in Dublin. */
export const STATION_ID = interiorId('dublin', 'L', 2);

/** Where a train back to Dublin leaves you: on the concourse, just off the platforms. */
export const PLATFORM = { x: 4, y: 3, face: 'down' as Dir };

export interface Line {
  /** The map the train goes to. */
  id: string;
  /** The line, as it's shown on the board: DART, Intercity, Enterprise… */
  line: string;
  /** Where it goes, as it's shown on the board. */
  to: string;
  platform: number;
  /** Not running yet: on the board as COMING SOON, and nobody can sell you a ticket. */
  soon?: true;
}

export interface Departure extends Line {
  soon?: undefined;
  /** Where you get off, facing which way. */
  at: { x: number; y: number; face: Dir };
  /** Who stands on its platform, and what they ask you. */
  staff: Look;
  ask: string;
  /** What they say if you don't get on. */
  notNow: string;
  /** What you see on the way down. */
  ride: string[];
  /** Said the first time you get off. */
  first: string;
  /** The flag for having been, if not `seen:` and the map's id. */
  seen?: string;
  /** Only runs once this flag is set: until then, the board says why not. */
  lock?: { flag: string; locked: string };
  /** The way home, from whoever runs it at the other end. */
  back: { ask: string; ride: string; notNow: string };
}

export const DEPARTURES: (Departure | Line)[] = [
  {
    id: 'greystones',
    line: 'DART',
    to: 'Greystones, Co. Wicklow',
    platform: 1,
    at: { x: 1, y: 6, face: 'right' },
    staff: 'dart',
    ask: 'DART DRIVER: The DART, southbound for Greystones, Co. Wicklow. Hop on?',
    notNow: 'DART DRIVER: No bother. There’s another one in fifteen minutes. Probably.',
    ride: [
      'The DART hugs the coast past Sandymount, Dún Laoghaire and Killiney Bay. Someone in big sunglasses waves from a balcony.',
      'Through the tunnels under Bray Head, and out the other side the houses get very, very big.',
    ],
    first: 'GREYSTONES, CO. WICKLOW. The richest town in Ireland. Even the seagulls look well off.',
    back: {
      ask: 'DART DRIVER: Back to Connolly?',
      ride: 'The DART rattles back up the coast to Dublin.',
      notNow: 'DART DRIVER: Enjoy the sea air. It’s included in the house prices.',
    },
  },
  {
    id: 'donegal',
    line: 'Intercity',
    to: 'Bundoran, Co. Donegal',
    platform: 2,
    at: { x: 21, y: 5, face: 'left' },
    staff: 'conductor',
    ask: 'CONDUCTOR: The Atlantic Coast Express, Dublin to Bundoran, Co. Donegal. All aboard?',
    notNow: 'CONDUCTOR: No bother. Trains run all day.',
    ride: [
      'The train rattles north through Meath and Cavan, past a hundred lakes, until you can smell the sea.',
    ],
    first: 'BUNDORAN, CO. DONEGAL. Surf capital of Ireland. The Atlantic is roaring.',
    seen: 'seen:bundoran',
    back: {
      ask: 'CONDUCTOR: Back to Dublin Connolly?',
      ride: 'The train winds back down through the lakes to Dublin.',
      notNow: 'CONDUCTOR: Enjoy the waves.',
    },
  },
  {
    id: 'brighton',
    line: 'Sail & Rail',
    to: 'Brighton, England',
    platform: 3,
    at: { x: 4, y: 4, face: 'up' },
    staff: 'sailor',
    ask: 'SAILOR: The Sail & Rail: the ferry to Holyhead, then trains all the way to Brighton, England. All aboard?',
    notNow: 'SAILOR: No rush. The ferry waits for nobody, but I’ll wait for you.',
    ride: [
      'A train to Dublin Port, then the ferry across the Irish Sea. Enda would have made best friends with the whole ferry bar by now.',
      'Holyhead, then trains across Wales and England, through London and down to the south coast. You can smell the sea, and chips.',
    ],
    first:
      'BRIGHTON, ENGLAND. Seagulls, a pier and the sea, and it’s match day: the whole town is in blue and white stripes.',
    lock: {
      flag: ENDA_ASKED,
      locked:
        'CLERK: The Sail & Rail to Brighton? Nobody books that on their own. There’s a very small man in Kildare asking everyone he meets to go to Brighton with him, mind. Have you met Enda?',
    },
    back: {
      ask: 'SAILOR: The Sail & Rail, back to Dublin Connolly?',
      ride: 'Back up through England and Wales, over the Irish Sea, and into Connolly.',
      notNow: 'SAILOR: Enjoy Brighton. Mind your chips.',
    },
  },
  {
    id: 'belgium',
    line: 'Eurostar',
    to: 'Ghent, Belgium',
    platform: 4,
    at: { x: 3, y: 4, face: 'right' },
    staff: 'eurostar',
    ask: 'EUROSTAR HOST: Through to Ghent, Belgium: the ferry, a train to London, then the Eurostar under the sea. All aboard for I Love Techno?',
    notNow: 'EUROSTAR HOST: No problem. The festival goes on for twelve hours. You have time.',
    ride: [
      'The ferry to Holyhead, a train to London, and then the Eurostar, down into the tunnel under the sea. Cramps is playing techno off his phone the whole way.',
      'Out the other side in France, on to Brussels, and a local train to Ghent. Half the carriage is wearing glow sticks.',
    ],
    first:
      'GHENT, BELGIUM. Canals, a castle, stepped gables and waffles, and a queue for I Love Techno that goes round the block.',
    lock: {
      flag: TECHNO_ASKED,
      locked:
        'CLERK: The I Love Techno special to Ghent? Guest list only, I’m afraid. Word is Cramps the DJ is putting one together to celebrate the new Champion of Ireland.',
    },
    back: {
      ask: 'EUROSTAR HOST: Back to Dublin Connolly?',
      ride: 'Back under the sea, up through England and Wales, over the Irish Sea, and into Connolly. Your ears are still ringing.',
      notNow: 'EUROSTAR HOST: Enjoy the festival. Bring earplugs.',
    },
  },
  { id: 'belfast', line: 'Enterprise', to: 'Belfast', platform: 5, soon: true },
  {
    id: 'galway',
    line: 'Intercity',
    to: 'Galway City, Co. Galway',
    platform: 6,
    at: { x: 2, y: 3, face: 'left' },
    staff: 'conductor',
    ask: 'CONDUCTOR: The Intercity to Galway, for the Championship of Ireland. All aboard?',
    notNow:
      'CONDUCTOR: No bother. The Championship has been waiting a hundred years. It’ll wait a bit more.',
    ride: [
      'The Intercity heads west out of Dublin, over the Shannon at Athlone and across the bogs. A man across the aisle is eating a full chicken out of a bag.',
      'Stone walls, more stone walls, then the sea: Galway Bay, and the city on the Corrib.',
    ],
    first:
      'GALWAY CITY, CO. GALWAY. Buskers, the Spanish Arch and the Hall of Champions on Eyre Square, where the Championship of Ireland is held.',
    lock: {
      flag: BALL_FLAG,
      locked:
        'CLERK: The Galway Intercity? That’s the Championship special. Only for those who’ve beaten B&S, I’m afraid.',
    },
    back: {
      ask: 'CONDUCTOR: Back to Dublin Connolly?',
      ride: 'The Intercity rattles back east across the bogs to Dublin.',
      notNow: 'CONDUCTOR: Enjoy Galway. Mind the hen parties on Shop Street.',
    },
  },
  {
    id: 'airport',
    line: 'Airport Bus',
    to: 'Dublin Airport',
    platform: 7,
    at: { x: 3, y: 6, face: 'up' },
    staff: 'bus',
    ask: 'BUS DRIVER: The bus to Dublin Airport. Hop on?',
    notNow: 'BUS DRIVER: No bother. There’s another one in twenty minutes. Or forty.',
    ride: [
      'Platform 7 turns out to be the car park. A bus is waiting. There is still no train to the airport.',
      'Up the M1 in the bus lane, past everyone stuck in traffic. It feels great.',
    ],
    first:
      'DUBLIN AIRPORT. Planes overhead, taxis honking, and a stag party in matching pink T-shirts at 6am.',
    lock: {
      flag: PROVAI_ASKED,
      locked:
        'CLERK: The airport bus? Platform 7. Well, the car park. Where are you off to? You’ve nowhere to be yet, by the look of you.',
    },
    back: {
      ask: 'BUS DRIVER: Back into town, to Connolly?',
      ride: 'Down the M1 into Dublin, and round the back of Connolly.',
      notNow: 'BUS DRIVER: Grand. Mind your bags.',
    },
  },
];

export const isRunning = (d: Departure | Line): d is Departure => !d.soon;

export const RUNNING = DEPARTURES.filter(isRunning);

export function departureTo(id: string): Departure {
  const d = RUNNING.find((r) => r.id === id);
  if (!d) throw new Error(`No train to ${id}`);
  return d;
}

/** Getting on: the ride, the arrival, and the welcome the first time. */
export function ride(d: Departure): Step[] {
  const seen = d.seen ?? `seen:${d.id}`;
  return [
    ...d.ride.map((text) => ({ do: 'say' as const, text })),
    { do: 'travel', map: d.id, ...d.at },
    {
      do: 'if',
      flag: seen,
      then: [],
      else: [
        { do: 'say', text: d.first },
        { do: 'flag', flag: seen },
      ],
    },
  ];
}

/** A ticket from the desk: the ride, unless the line isn't open to you yet. */
export function ticket(d: Departure): Step[] {
  if (!d.lock) return ride(d);
  return [
    { do: 'if', flag: d.lock.flag, then: ride(d), else: [{ do: 'say', text: d.lock.locked }] },
  ];
}

/** What the staff on its platform say: a yes or no to their own train. */
export function aboard(d: Departure): Step[] {
  return [{ do: 'ask', text: d.ask, yes: ticket(d), no: [{ do: 'say', text: d.notNow }] }];
}

/** The way back to Connolly, from whoever runs the line at the other end. */
export function homeward(id: string): Step[] {
  const { back } = departureTo(id);
  return [
    {
      do: 'ask',
      text: back.ask,
      yes: [
        { do: 'say', text: back.ride },
        { do: 'travel', map: STATION_ID, ...PLATFORM },
        // Back from Ghent, Próvaí is waiting on the platform (kneecap.ts).
        ...PROVAI_ARRIVE,
      ],
      no: [{ do: 'say', text: back.notNow }],
    },
  ];
}

/** The departures board, as it reads on the wall. */
export function boardText(): string {
  const rows = DEPARTURES.map(
    (d) => `Platform ${d.platform}: ${d.line} to ${d.to}${d.soon ? ' (coming soon)' : ''}.`,
  );
  return `DEPARTURES. ${rows.join(' ')}`;
}

/**
 * The station itself, behind its door in Dublin. Platform staff stand along the top, one per
 * running line; the clerk is behind the ticket desk by the door.
 */
const CLERK: Step[] = [
  { do: 'say', text: 'CLERK: Welcome to Connolly. Where are you off to?' },
  { do: 'departures' },
];

/**
 * Where the platform staff stand, in platform order: along the top of the concourse, leaving a
 * gap to the departures board, then down the left wall.
 */
const STAFF_AT = [
  { x: 2, y: 2 },
  { x: 7, y: 2 },
  { x: 3, y: 2 },
  { x: 6, y: 2 },
  { x: 5, y: 2 },
  { x: 1, y: 3 },
];

/** Where Jamie Boyde stands on the concourse, by the benches, out of everyone's way. */
const BOYDE_AT = { x: 7, y: 5 };

/** Where Cramps waits on the concourse once he's asked you to I Love Techno. */
const CRAMPS_AT = { x: 5, y: 5 };

/** Where Próvaí waits on the concourse once he's found you. */
const PROVAI_AT = { x: 6, y: 4 };

export function stationRoom(): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  // The clerk is person 1; each running line's staff stand at the top, in platform order, and
  // Jamie Boyde and Cramps come after them.
  const staff = RUNNING.slice(0, STAFF_AT.length);
  const rows = [
    'WWWWWWWWWW',
    'WODDDDDDOW',
    'WNFFFFFFNW',
    'WFFFFFFFFW',
    'WUUFFFFUUW',
    'WF1FFFFFFW',
    'WCCCFFFFNW',
    'WFFF@FFFFW',
    'WWWWEWWWWW',
  ].map((r) => r.split(''));
  staff.forEach((_, i) => (rows[STAFF_AT[i].y][STAFF_AT[i].x] = String(i + 2)));
  rows[BOYDE_AT.y][BOYDE_AT.x] = String(staff.length + 2);
  rows[CRAMPS_AT.y][CRAMPS_AT.x] = String(staff.length + 3);
  rows[PROVAI_AT.y][PROVAI_AT.x] = slot(staff.length + 3);
  return {
    name: 'Connolly Station',
    rows: rows.map((r) => r.join('')),
    npcs: [
      { look: 'clerk', face: 'down', talk: CLERK },
      ...staff.map((d) => ({ look: d.staff, face: 'down' as Dir, talk: aboard(d) })),
      BOYDE,
      CRAMPS_AT_STATION,
      PROVAI_AT_STATION,
    ],
    things: {
      D: boardText(),
      U: 'A bench. Someone has left a copy of the property supplement open at Greystones.',
    },
  };
}

/** Said every time you come into the station. */
export const STATION_ARRIVE: Step[] = [
  {
    do: 'say',
    text: 'CONNOLLY STATION. Trains are humming at every platform. The ticket desk is by the door.',
  },
  // Back from Ghent, DJ Próvaí is waiting (kneecap.ts).
  ...PROVAI_ARRIVE,
];
