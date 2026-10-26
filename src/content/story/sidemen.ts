import { interiorId } from './interiors';
import type { ItemId } from '@/lib/story/items';
import type { GameMap, Look, Npc, Step, Trainer, Yates } from '@/lib/story/world';

/**
 * The Sidemen, a side quest in Britain. Once you've won the Newcastle jersey, Jamie Elliott, who
 * runs the Sidemen, is at King's Cross: the Charity Match at Wembley is a man short, and the spot
 * goes to whoever beats all six of the lads and then him. The Metropolitan line from King's Cross
 * runs to Wembley Park, where each of the six is filming somewhere of their own with a Ranemon
 * made from them (KSI's Ksimon, Miniminter's Minimon, Zerkaa's Zerkmon, Behzinga's Behzmon,
 * Vikkstar123's Vikkmon and TBJ's Tobimon, `lib/battle/london.ts`). Beat the six, in any order,
 * and Wembley Stadium opens: Jamie is on the pitch with all six of their Ranemon.
 *
 * Wembley Park, its rooms and its battles are 2D only (`flat`), like everything new.
 */

/** Set when Jamie Elliott has asked you, at King's Cross: the Metropolitan line runs for you. */
export const SIDEMEN_START = 'sidemen:start';

/** Set the first time you come off the train at Wembley Park. */
export const SIDEMEN_ARRIVED = 'sidemen:arrived';

/** All six of the lads beaten: Wembley Stadium opens. */
export const SIDEMEN_SIX = 'sidemen:six';

/** Jamie Elliott beaten: you're the eighth Sideman. */
export const SIDEMEN_DONE = 'sidemen:done';

/**
 * Jamie only turns up at King's Cross once you've the sixth jersey, Newcastle's (premier.ts's
 * `plFlag`), halfway up the table.
 */
export const SIDEMEN_GATE = 'pl:newcastle';

export const WEMBLEY_ID = 'wembley';

/** Where the Metropolitan line leaves you: off the train at the top left. */
const WEMBLEY_ARRIVAL = { map: WEMBLEY_ID, x: 1, y: 3, face: 'right' } as const;

/** King's Cross, and the spot on its concourse the trains bring you back to (premier.ts). */
const KINGS_CROSS = { map: interiorId('london', 'L', 0), x: 6, y: 5, face: 'up' } as const;

export const JAMIE = 'sidemen-jamie';

const say = (text: string): Step[] => [{ do: 'say', text }];

interface Sideman {
  /** Their building on Wembley Park, as on the sign over the door. */
  sign: string;
  colour: string;
  /** The room's name. */
  name: string;
  /** Said every time you walk in. */
  intro: string;
  id: string;
  /** The name they battle under. */
  who: string;
  look: Look;
  team: [string, number][];
  before: string;
  after: string;
  line: string;
  /** What they say when you talk to them once they're beaten, there and at Wembley. */
  beaten: string;
  gift: { item: ItemId; count: number; text: string };
  /** Whoever battles you on the way up to them. */
  crew: { id: string; name: string; team: [string, number][]; before: string; after: string };
  crewTalk: string;
  /** Behind the counter by the door. */
  desk: string;
  /** Someone else about the place. */
  other: string;
  /**
   * The room's furniture, by the template's letters (see `roomRows`): `s` along the back wall,
   * `a` and `b` the left and right of the middle, `t` the tables, `f` floor and `r` the middle.
   */
  decor: Record<'s' | 'a' | 'b' | 't' | 'f' | 'r', string>;
  things: Record<string, string>;
}

/**
 * Every room is laid out the same, with its own furniture: the Sideman (1) at the top, someone
 * behind the counter by the door (2), the crew member who battles you (3) looking along the
 * middle, and someone else (4) up by the Sideman.
 */
const TEMPLATE = [
  'WWWWWWWWWWWW',
  'WOWWssssWWOW',
  'WNfff1ffffNW',
  'Wfffrrrrf4fW',
  'WaafrrrrfbbW',
  'WfffrrrrfffW',
  'Wttfffff3ttW',
  'Wff2fffffttW',
  'WfCCCfffffNW',
  'Wffff@fffffW',
  'WWWWWEWWWWWW',
];

function roomRows(decor: Sideman['decor']): string[] {
  return TEMPLATE.map((row) => row.replace(/[satbfr]/g, (c) => decor[c as keyof Sideman['decor']]));
}

/** The six, in the order their doors stand on Wembley Park: the top row, then the middle. */
const SIDEMEN: Sideman[] = [
  {
    sign: 'OVO ARENA',
    colour: '#3ab0e8',
    name: 'OVO Arena Wembley',
    intro:
      'OVO ARENA WEMBLEY. A boxing ring under the lights, cameras on every corner, and a crate of Prime by the door.',
    id: 'sidemen-ksi',
    who: 'KSI',
    look: 'ksi',
    team: [
      ['olliemon', 30],
      ['boydemon', 30],
      ['jammon', 31],
      ['carlmon', 31],
      ['primape', 32],
    ],
    before:
      'KSI: Yo, it’s the Irish one Jamie keeps going on about! Cameras rolling? Good. I don’t lose in this ring. Ask anyone. Actually, don’t ask anyone.',
    after: 'KSI: Nah. NAH. That’s not going in the video. Edit that out. EDIT IT OUT.',
    line: 'KSI: Come on then!',
    beaten: 'KSI: Rematch. Not today. But rematch. I’ll book Wembley. I’ll book two Wembleys.',
    gift: {
      item: 'monster',
      count: 3,
      text: 'KSI: Here, have a drink on me. We’re out of Prime, so it’s a Monster. Don’t film that.',
    },
    crew: {
      id: 'sidemen-sparring',
      name: 'Sparring Partner Dele',
      team: [
        ['gibbsmon', 26],
        ['jammon', 27],
      ],
      before: 'SPARRING PARTNER DELE: JJ hits me for a living. You can’t be worse. Gloves up!',
      after: 'SPARRING PARTNER DELE: OK, you can be worse. Go on up.',
    },
    crewTalk: 'SPARRING PARTNER DELE: Same time tomorrow. My jaw’s had worse.',
    desk: 'PROMOTER: Tickets for the next fight? It’s against somebody. We haven’t picked who yet. It’s sold out.',
    other: 'CAMERAMAN: I’ve filmed eleven hours of him today. About four minutes of it will go up.',
    decor: { s: 'D', a: 'n', b: 'n', t: 'I', f: 'k', r: 'r' },
    things: {
      D: 'A big screen: KSI, in slow motion, winning. It’s on a loop.',
      n: 'Ringside seats. Every one has a bottle of Prime on it, still in its wrapper.',
      I: 'A speaker the size of a wardrobe. It’s playing Thick of It. It’s been playing it all day.',
    },
  },
  {
    sign: 'SIDES',
    colour: '#f0a030',
    name: 'Sides',
    intro:
      'SIDES. Chicken, burgers and a queue round the block. A camera crew is filming a taste test in the corner.',
    id: 'sidemen-tbj',
    who: 'TBJ',
    look: 'tbj',
    team: [
      ['enda', 30],
      ['owemon', 30],
      ['simomon', 31],
      ['conemon', 31],
      ['tobitic', 32],
    ],
    before:
      'TBJ: (laughing) Ah, no way, a challenger at Sides! I’ve hosted every dating show going and nobody’s ever picked me. You won’t pick me either. Battle!',
    after: 'TBJ: (laughing even louder) I can’t even be mad! That was class.',
    line: 'TBJ: Let’s have it!',
    beaten:
      'TBJ: Have you tried the wings? Try the wings. You’re the eighth Sideman, you eat free. Well, nearly. You’re nearly the eighth.',
    gift: {
      item: 'chicken-fillet-roll',
      count: 3,
      text: 'TBJ: Here, take these for the road. On the house. Don’t tell Zerkaa, he does the numbers.',
    },
    crew: {
      id: 'sidemen-chef',
      name: 'Head Chef Lola',
      team: [
        ['carlmon', 26],
        ['simomon', 27],
      ],
      before: 'HEAD CHEF LOLA: Nobody gets past the kitchen without a battle. Health and safety.',
      after: 'HEAD CHEF LOLA: Fine. Wash your hands on the way through.',
    },
    crewTalk: 'HEAD CHEF LOLA: Four hundred orders a day, and Tobi still eats a quarter of them.',
    desk: 'SERVER: Welcome to Sides! It’s a forty-minute wait. It’s always a forty-minute wait.',
    other:
      'FAN: I’ve queued four hours for a burger and a photo with Tobi. Worth it. Easily worth it.',
    decor: { s: 'D', a: 'U', b: 'U', t: 'U', f: 'F', r: 'r' },
    things: {
      D: 'A menu board: wings, tenders, burgers, and a shake called the Tobi that’s mostly sprinkles.',
      U: 'A table. Somebody has left half a burger and a ring light on it.',
    },
  },
  {
    sign: 'SIDEMEN CLOTHING',
    colour: '#d02a2a',
    name: 'Sidemen Clothing',
    intro:
      'SIDEMEN CLOTHING. Racks of hoodies in seven colours of black. Everything has SDMN on it.',
    id: 'sidemen-zerkaa',
    who: 'Zerkaa',
    look: 'zerkaa',
    team: [
      ['hugomon', 31],
      ['vinnimon', 31],
      ['skehemon', 31],
      ['paulimon', 31],
      ['zerkazam', 32],
    ],
    before:
      'ZERKAA: Right. I’ve looked at the numbers, and statistically you win about none of these. I’ve made a spreadsheet. Shall we?',
    after: 'ZERKAA: That wasn’t in the spreadsheet. I’ll have to make a new spreadsheet.',
    line: 'ZERKAA: As planned.',
    beaten:
      'ZERKAA: Somebody has to be the sensible one. Usually it’s me. Today it was apparently you. I’m going to bed.',
    gift: {
      item: 'cup-of-tea',
      count: 3,
      text: 'ZERKAA: Have these. A proper cup of tea fixes most things. It’s in the spreadsheet.',
    },
    crew: {
      id: 'sidemen-manager',
      name: 'Store Manager Priya',
      team: [
        ['lorcamon', 26],
        ['robinmon', 27],
      ],
      before: 'STORE MANAGER PRIYA: You can’t go up to Josh without an appointment. Or a battle.',
      after: 'STORE MANAGER PRIYA: I’ll put you in the diary. Go on up.',
    },
    crewTalk: 'STORE MANAGER PRIYA: The new drop sold out in nine seconds. It was socks.',
    desk: 'TILL: Welcome to Sidemen Clothing! Everything’s £60. The socks are £60.',
    other:
      'DESIGNER: This season’s colours are black, black, washed black and a black we’re calling Midnight.',
    decor: { s: 'Y', a: 'V', b: 'A', t: 'U', f: 'F', r: 'r' },
    things: {
      Y: 'Hoodies folded so neatly that nobody dares unfold one.',
      V: 'A rail of tracksuits, each one with SDMN on the leg.',
      A: 'Caps, socks and a bucket hat that has sold out four times.',
      U: 'A display table. Every T-shirt on it is exactly two inches apart.',
    },
  },
  {
    sign: 'THE GYM',
    colour: '#c03a2a',
    name: 'The Gym',
    intro:
      'THE GYM. Weights, mirrors and somebody shouting LET’S GOOO from the back. You know who it is before you see him.',
    id: 'sidemen-behzinga',
    who: 'Behzinga',
    look: 'behzinga',
    team: [
      ['gibbsmon', 30],
      ['killemon', 30],
      ['boydemon', 31],
      ['steadmon', 31],
      ['behzchamp', 32],
    ],
    before:
      'BEHZINGA: LET’S GOOOOO! You’re the one Jamie was on about! I’ve done ten K this morning, I’m buzzing, let’s have a battle!',
    after: 'BEHZINGA: (wiping his eyes) That was beautiful, man. Proper beautiful. Come here, hug.',
    line: 'BEHZINGA: COME ONNN!',
    beaten:
      'BEHZINGA: Leg day tomorrow. You should come. Bring your Ranemon. Bring all of them. LET’S GO!',
    gift: {
      item: 'full-irish',
      count: 2,
      text: 'BEHZINGA: Protein. That’s all you need. Here, have a full breakfast, it’s basically protein.',
    },
    crew: {
      id: 'sidemen-trainer',
      name: 'Personal Trainer Gaz',
      team: [
        ['boydemon', 26],
        ['killemon', 27],
      ],
      before: 'PERSONAL TRAINER GAZ: Before you see Ethan, you warm up. With me. Twenty reps!',
      after: 'PERSONAL TRAINER GAZ: Good form. Go on, he’s by the squat rack.',
    },
    crewTalk: 'PERSONAL TRAINER GAZ: Hydrate. Stretch. Don’t let him talk you into a marathon.',
    desk: 'RECEPTION: Welcome to the gym! Day pass? You’ll be sore tomorrow. Everyone is.',
    other: 'GYM GOER: He’s been on that bike for three hours. He keeps saying one more song.',
    decor: { s: 'D', a: 'X', b: 'X', t: 'U', f: 'g', r: 'r' },
    things: {
      D: 'A leaderboard. Behzinga is top of every one of them, in his own handwriting.',
      X: 'A bronze statue of somebody mid-squat. A sign under it says MOTIVATION.',
      U: 'A weights bench. The plates on it are labelled in marker: JJ’S, DON’T TOUCH.',
    },
  },
  {
    sign: 'SIDEMEN FC',
    colour: '#f4f4f4',
    name: 'Sidemen FC clubhouse',
    intro:
      'SIDEMEN FC CLUBHOUSE. Shirts on pegs, boots in a heap, and a big telly with a football game paused on it.',
    id: 'sidemen-miniminter',
    who: 'Miniminter',
    look: 'miniminter',
    team: [
      ['oismon', 30],
      ['thilomon', 30],
      ['olliemon', 31],
      ['owemon', 31],
      ['mintair', 32],
    ],
    before:
      'MINIMINTER: (laughing) Oh, here we go! Jamie’s sent someone. Right, I’m warning you, I’ve had the worst pack luck all day. I’m due a win.',
    after: 'MINIMINTER: (laughing) Of course. OF COURSE. That’s just my luck, that is.',
    line: 'MINIMINTER: Go on, go on!',
    beaten:
      'MINIMINTER: Every time. Every single time. Go on, beat the rest of them. Make it fair.',
    gift: {
      item: 'hair-of-the-dog',
      count: 2,
      text: 'MINIMINTER: Have these, I won’t need them. I’m not going out. I’m opening packs till I get a walkout.',
    },
    crew: {
      id: 'sidemen-keeper',
      name: 'Goalkeeper Reece',
      team: [
        ['olliemon', 26],
        ['conemon', 27],
      ],
      before: 'GOALKEEPER REECE: Nothing gets past me. Well. Nothing gets past me on a good day.',
      after: 'GOALKEEPER REECE: Not a good day, then. Go on through.',
    },
    crewTalk:
      'GOALKEEPER REECE: Simon’s scored against me nine times in training. He’s told me about all nine.',
    desk: 'KIT MAN: Every shirt washed, every boot laced. Nobody ever says thanks to the kit man.',
    other:
      'COACH: The plan for the Charity Match? Give it to JJ and hope. It’s the same as last year.',
    decor: { s: 'D', a: 'n', b: 'm', t: 'U', f: 'F', r: 'r' },
    things: {
      D: 'A tactics board. Somebody has drawn every player as a stick man and JJ as a much bigger stick man.',
      n: 'A dugout bench. Somebody’s shin pads are on it, and they don’t smell good.',
      m: 'A games console on a big telly, paused on a pack opening. It’s a bronze.',
      U: 'A table of energy gels and oranges cut into quarters.',
    },
  },
  {
    sign: 'GAMING HOUSE',
    colour: '#7a4ad0',
    name: 'The Gaming House',
    intro:
      'THE GAMING HOUSE. The curtains are shut, the lights are purple, and every screen in the room is somebody dropping out of a plane.',
    id: 'sidemen-vikkstar',
    who: 'Vikkstar123',
    look: 'vikkstar',
    team: [
      ['crampemon', 30],
      ['lorcamon', 30],
      ['gibbsmon', 31],
      ['thilomon', 31],
      ['vikstarmie', 32],
    ],
    before:
      'VIKKSTAR123: One sec, I’m in the final circle. … OK, we won. Right, you. Jamie said you’d come. Let’s go, I’ve got a stream at nine.',
    after: 'VIKKSTAR123: GG. Genuinely, GG. I’m going to have to watch that back.',
    line: 'VIKKSTAR123: Drop in!',
    beaten:
      'VIKKSTAR123: I’ve built the whole of Wembley in Minecraft. I’m going to build you a statue in it. A small one.',
    gift: {
      item: 'blue-ghost',
      count: 1,
      text: 'VIKKSTAR123: Have a Blue Ghost. That’s a level, that is. Basically a cheat code.',
    },
    crew: {
      id: 'sidemen-pro',
      name: 'Pro Gamer Kai',
      team: [
        ['hugomon', 26],
        ['crampemon', 27],
      ],
      before: 'PRO GAMER KAI: You’re not getting to Vik without getting through my lobby first.',
      after: 'PRO GAMER KAI: Lag. That was lag. Go on.',
    },
    crewTalk: 'PRO GAMER KAI: Twelve hours a day, every day. My mum thinks I’m an accountant.',
    desk: 'MANAGER: Quiet, please, he’s live. He’s always live.',
    other: 'EDITOR: I’ve edited three videos since you came in. They’re all called I WON.',
    decor: { s: 'D', a: 'm', b: 'm', t: 'U', f: 'k', r: 'l' },
    things: {
      D: 'A wall of screens. On every one of them, somebody is landing on a roof.',
      m: 'A gaming rig with more lights on it than Blackpool.',
      U: 'A desk with a keyboard, a headset and nine empty cans on it.',
    },
  },
];

/** The six, by trainer id, in the order their doors stand. */
export const SIX = SIDEMEN.map((s) => s.id);

/** Sets `SIDEMEN_SIX` once all six are beaten, whichever was last. */
const checkSix = (rest: string[]): Step[] =>
  rest.length
    ? [{ do: 'if', flag: `beat:${rest[0]}`, then: checkSix(rest.slice(1)) }]
    : [
        { do: 'flag', flag: SIDEMEN_SIX },
        {
          do: 'say',
          text: 'Your phone buzzes: “JAMIE ELLIOTT: Heard you’ve done all six. Fair play. Wembley’s open. I’m on the pitch.”',
        },
      ];

/** Jamie's team: every one of the lads' Ranemon, evolved, saving TBJ's for last. */
const JAMIE_TEAM: [string, number][] = [
  ['zerkazam', 32],
  ['vikstarmie', 32],
  ['mintair', 33],
  ['behzchamp', 33],
  ['primape', 34],
  ['tobitic', 34],
];

/**
 * For beating Jamie: the spot in the Charity Match, and one of the lads' Ranemon for the road,
 * asked about one by one; say no to all the rest and the last is yours.
 */
const PICKS: [species: string, from: string][] = [
  ['primape', 'JJ’s Primape'],
  ['mintair', 'Simon’s Mintair'],
  ['zerkazam', 'Josh’s Zerkazam'],
  ['behzchamp', 'Ethan’s Behzchamp'],
  ['vikstarmie', 'Vik’s Vikstarmie'],
  ['tobitic', 'Tobi’s Tobitic'],
];

const PICK_LEVEL = 30;

function pick(rest: [string, string][]): Step[] {
  const [[species, from], ...others] = rest;
  const take: Step[] = [
    { do: 'say', text: `JAMIE ELLIOTT: ${from}. Good choice. Look after it.` },
    { do: 'recruit', species, level: PICK_LEVEL },
  ];
  if (!others.length) {
    return [{ do: 'say', text: `JAMIE ELLIOTT: Then it’s ${from}. Last one left.` }, ...take];
  }
  return [{ do: 'ask', text: `Take ${from}?`, yes: take, no: pick(others) }];
}

const JAMIE_REWARD: Step[] = [
  { do: 'flag', flag: SIDEMEN_DONE },
  {
    do: 'say',
    text: 'JAMIE ELLIOTT: Right. That’s that, then. Lads! Get over here. Meet the eighth Sideman.',
  },
  {
    do: 'say',
    text: 'The six of them pile on top of you in the middle of the pitch. KSI films it. Behzinga is crying.',
  },
  {
    do: 'say',
    text: 'JAMIE ELLIOTT: Every Sideman has a Ranemon. You can have one of the lads’. They’ve said it’s fine. Well, JJ hasn’t said it’s fine, but he’ll get over it.',
  },
  ...pick(PICKS),
  {
    do: 'say',
    text: 'JAMIE ELLIOTT: And have these. Five Blue Ghosts, from the rider. Don’t tell Josh, they’re on the budget.',
  },
  { do: 'give', item: 'blue-ghost', count: 5 },
  {
    do: 'say',
    text: 'JAMIE ELLIOTT: Charity Match is Saturday. You’re up front with JJ. Don’t pass to Simon.',
  },
];

export const SIDEMEN_TRAINERS: Trainer[] = [
  ...SIDEMEN.flatMap((s): Trainer[] => [
    {
      id: s.crew.id,
      name: s.crew.name,
      uk: true,
      team: s.crew.team,
      ai: 'normal',
      prize: Math.max(...s.crew.team.map(([, l]) => l)) * 30,
      before: s.crew.before,
      after: s.crew.after,
    },
    {
      id: s.id,
      name: s.who,
      uk: true,
      team: s.team,
      ai: 'hard',
      prize: 2500,
      before: s.before,
      after: s.after,
      line: s.line,
      reward: [
        { do: 'say', text: s.gift.text },
        { do: 'give', item: s.gift.item, count: s.gift.count },
        ...checkSix(SIX),
      ],
    },
  ]),
  {
    id: JAMIE,
    name: 'Jamie Elliott',
    uk: true,
    team: JAMIE_TEAM,
    ai: 'hard',
    prize: 6000,
    before:
      'JAMIE ELLIOTT: Six from six. Not bad. But I picked every one of those lads, and I know their Ranemon better than they do. Let’s see if you’re a Sideman.',
    after: 'JAMIE ELLIOTT: (laughing) Yeah. Yeah, all right. You’re in.',
    line: 'JAMIE ELLIOTT: Go on, lads!',
    reward: JAMIE_REWARD,
  },
];

function room(s: Sideman): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> {
  const npcs: Npc[] = [
    { look: s.look, face: 'down', trainer: s.id, talk: say(s.beaten) },
    { look: 'local', face: 'down', talk: say(s.desk) },
    { look: 'trainer', face: 'left', trainer: s.crew.id, sight: 4, talk: say(s.crewTalk) },
    { look: 'local', face: 'down', talk: say(s.other) },
  ];
  return { name: s.name, rows: roomRows(s.decor), npcs, things: s.things };
}

/** Wembley Stadium: Jamie on the halfway line, the six lads either side of him. */
const STADIUM: Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> = {
  name: 'Wembley Stadium',
  rows: [
    'WWWWWWWWWWWWWWWW',
    'WnnnnnnnnnnnnnnW',
    'WxxxxxxxxxxxxxxW',
    'WxxxxxxxxxxxxxxW',
    'WF2F3F4F1F5F6F7W',
    'WFFFFFFFFFFFFFFW',
    'WnnnFFFFFFFFnnnW',
    'WFFFFFFF@FFFFFFW',
    'WWWWWWWWEWWWWWWW',
  ],
  npcs: [
    {
      look: 'jamie',
      face: 'down',
      trainer: JAMIE,
      talk: say(
        'JAMIE ELLIOTT: Eighth Sideman. Has a ring to it. Come back for the Charity Match, yeah? Bring your boots.',
      ),
    },
    // The six, watching: each says what they say once they're beaten.
    ...SIDEMEN.map((s): Npc => ({ look: s.look, face: 'down', talk: say(s.beaten) })),
  ],
  things: {
    n: 'Ninety thousand red seats. Somebody has left a SIDEMEN scarf on one of them.',
    x: 'The Wembley pitch. A groundsman glares at you from the tunnel for even looking at it.',
  },
};

/** The six lads' rooms, then Wembley Stadium, by Wembley Park landmark index. */
const ROOMS = [...SIDEMEN.map(room), STADIUM];

/** The Metropolitan line back to King's Cross, from the platform at Wembley Park. */
const HOMEWARD: Npc = {
  look: 'conductor',
  face: 'down',
  talk: [
    {
      do: 'ask',
      text: 'GUARD: The Metropolitan line, back to King’s Cross?',
      yes: [
        { do: 'say', text: 'Back into town. Half the carriage is in Sidemen hoodies.' },
        { do: 'travel', ...KINGS_CROSS },
      ],
      no: say('GUARD: Mind the gap. Mind the Sidemen fans, more like.'),
    },
  ],
};

/** The guard for the Metropolitan line at King's Cross: only for Jamie's lot. */
export const METROPOLITAN: Npc = {
  look: 'conductor',
  face: 'down',
  // At the end of the King's Cross concourse, past the twelve platforms' guards.
  at: { x: 4, y: 5 },
  talk: [
    {
      do: 'if',
      flag: SIDEMEN_START,
      then: [
        {
          do: 'ask',
          text: 'GUARD: The Metropolitan line to Wembley Park. Hop on?',
          yes: [
            {
              do: 'say',
              text: 'Out through Finchley Road, past a great many semis. There’s the arch.',
            },
            { do: 'travel', ...WEMBLEY_ARRIVAL },
          ],
          no: say('GUARD: Every few minutes. Every few minutes full of Sidemen fans.'),
        },
      ],
      else: say(
        'GUARD: Wembley Park? It’s players and crew only out there this week, for the Sidemen Charity Match. Unless Jamie Elliott says otherwise.',
      ),
    },
  ],
};

/** Jamie Elliott at King's Cross, from the Newcastle jersey on, until you've beaten him. */
export const JAMIE_AT_KINGS_CROSS: Npc = {
  look: 'jamie',
  face: 'right',
  at: { x: 10, y: 5 },
  showIf: SIDEMEN_GATE,
  hideIf: SIDEMEN_DONE,
  talk: [
    {
      do: 'if',
      flag: SIDEMEN_START,
      then: say(
        'JAMIE ELLIOTT: Metropolitan line, the guard at the end. The lads are all over Wembley Park. Beat all six, then come and find me on the pitch.',
      ),
      else: [
        ...say(
          'JAMIE ELLIOTT: Here, you. You’re the Irish one who’s been battering the club legends, yeah? I’ve seen the clips. Everyone’s seen the clips.',
        ),
        ...say(
          'JAMIE ELLIOTT: Jamie Elliott. I run the Sidemen. Six lads, and me keeping them in line. Charity Match at Wembley on Saturday, ninety thousand in, and we’re a man short.',
        ),
        ...say(
          'JAMIE ELLIOTT: So here’s the deal. The lads are filming all over Wembley Park. Every one of them has a Ranemon of his own, made from him. Beat all six, then come and find me on the pitch.',
        ),
        ...say(
          'JAMIE ELLIOTT: Beat me, and you’re the eighth Sideman. The Metropolitan line goes from here, the guard at the end. And don’t let JJ sell you a drink.',
        ),
        { do: 'flag', flag: SIDEMEN_START },
      ],
    },
  ],
};

/** W.B Yates Wembley: Ciarán from Kerry runs it, and has seen every Sideman fall out the door. */
const WEMBLEY_YATES: Yates = {
  owner: {
    look: 'barman',
    face: 'down',
    talk: [
      ...say(
        'CIARÁN: Welcome to W.B Yates Wembley! Ciarán, from Kerry. Twenty years here. I’ve seen two FA Cup finals and one Sidemen after-party, and the after-party was worse.',
      ),
      {
        do: 'if',
        flag: SIDEMEN_SIX,
        then: say('CIARÁN: All six of them? Go on to the stadium, so. Jamie’s been waiting.'),
        else: say(
          'CIARÁN: The lads are all round Wembley Park, filming. Every door with a sign over it, there’s one of them behind it.',
        ),
      },
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, and a signed Sidemen shirt in a frame. One of the signatures is just a drawing of a pint.',
    U: 'A table. Someone has carved SDMN into it, and someone else has carved KERRY underneath.',
    J: 'A turf fire. Ciarán gets the turf posted over from home.',
  },
};

/** The first time off the train: where everything is. */
const WELCOME: Step[] = [
  ...say(
    'WEMBLEY PARK. The arch is right there over the rooftops, and there are Sidemen fans everywhere you look.',
  ),
  ...say(
    'Each of the six is filming behind one of the doors with a sign over it. The stadium is at the bottom of the hill. W.B Yates is on the main street, if your Ranemon need a rest.',
  ),
  { do: 'flag', flag: SIDEMEN_ARRIVED },
];

/**
 * Wembley Park: the station and the main street along the top, two more doors over the road,
 * and Wembley Stadium at the bottom between two patches of long grass. `z` is the stadium's glass.
 */
export const WEMBLEY: GameMap = {
  id: WEMBLEY_ID,
  name: 'Wembley Park, London',
  county: 9,
  flat: true,
  terraces: 'english',
  uk: true,
  yates: WEMBLEY_YATES,
  arrive: [{ do: 'if', flag: SIDEMEN_ARRIVED, then: [], else: WELCOME }],
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^^^^^^^^^^^^^^^T',
    'T##L####L####P####M####L###L#T',
    'T@vvvvvvvvvvvvvvvvvvvvvvvvvvvT',
    'Tv1vvvvvvvvvvvvSvvvvvvvvvv2vvT',
    'TaaaaaaaaaaaaaaaaaaaaaaaaaaaaT',
    'TaacaaaaaaaaaaaaaaaaaaaaacaaaT',
    'TvvvvvvvvvvvvvvvvvvvvvvvvvvvvT',
    'Tv^^^^^^^vvvvvvvvvvvv^^^^^^^vT',
    'Tv###L###vvv3vvvvvvvv###L###vT',
    'TvvvvvvvvvzzzzzzzzzzvvvvvvvvvT',
    'Tv,,,,,,,vzzzzzzzzzzv,,,,,,,vT',
    'Tv,,,4,,,vzzzzLzzzzzv,,,5,,,vT',
    'Tv,,,,,,,vvvvvvvvvvvv,,,,,,,vT',
    'TvvvvvvvvvvvvvSvvvvvvvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  wild: {
    min: 24,
    max: 29,
    table: [
      ['olliemon', 12],
      ['oismon', 12],
      ['gibbsmon', 10],
      ['jammon', 10],
      ['owemon', 10],
      ['thilomon', 10],
      ['hugomon', 10],
      ['boydemon', 9],
      ['carlmon', 9],
      ['lorcamon', 8],
    ],
  },
  npcs: [
    { ...HOMEWARD, face: 'left' },
    {
      look: 'local',
      face: 'left',
      talk: say(
        'FAN: I’ve got a ticket for the Charity Match and a ticket for the Charity Match after-party. I haven’t got a ticket home.',
      ),
    },
    {
      look: 'fan',
      face: 'down',
      trainer: 'wembley-superfan',
      sight: 3,
      talk: say('SUPERFAN: Seen every video. Every one. Some of them twice. Most of them twice.'),
    },
    {
      look: 'trainer',
      face: 'right',
      trainer: 'wembley-groundsman',
      sight: 3,
      talk: say('GROUNDSMAN: Keep off the grass. Not this grass. The other grass. All grass.'),
    },
    {
      look: 'trainer',
      face: 'left',
      trainer: 'wembley-steward',
      sight: 3,
      talk: say('STEWARD: Bags open, pockets out. Nobody gets near the stadium without a search.'),
    },
  ],
  signs: [
    'WEMBLEY PARK. The Metropolitan line to King’s Cross: the guard by the station. Every door with a sign over it has one of the Sidemen behind it.',
    'WEMBLEY STADIUM. Home of the Sidemen Charity Match. Players and crew only, until Jamie Elliott says so.',
  ],
  landmarks: [
    ...SIDEMEN.map((s): Step[] => say(s.intro)),
    say('WEMBLEY STADIUM. The tunnel, and the pitch beyond it.'),
  ],
  landmarkLabels: Object.fromEntries([
    ...SIDEMEN.map((s, i) => [i, { text: s.sign, colour: s.colour }]),
    [SIDEMEN.length, { text: 'WEMBLEY', colour: '#d02a2a' }],
  ]),
  landmarkLocks: {
    [SIDEMEN.length]: {
      flag: SIDEMEN_SIX,
      locked:
        'STEWARD: Stadium’s shut. Jamie says nobody gets on the pitch till they’ve beaten all six of the lads.',
      opened:
        'The steward steps aside. The tunnel is open, and the pitch is lit up at the end of it.',
    },
  },
  landmarkRooms: Object.fromEntries(ROOMS.map((r, i) => [i, r])),
};

/** Out on Wembley Park: everyone round the station and the stadium. */
export const WEMBLEY_TRAINERS: Trainer[] = [
  {
    id: 'wembley-superfan',
    name: 'Superfan Ellie',
    uk: true,
    team: [
      ['oismon', 25],
      ['olliemon', 26],
    ],
    ai: 'normal',
    prize: 520,
    before: 'SUPERFAN ELLIE: You’re not one of the Sidemen. Are you? You’re not. Battle me anyway!',
    after: 'SUPERFAN ELLIE: Can I get a photo? For the group chat?',
  },
  {
    id: 'wembley-groundsman',
    name: 'Groundsman Terry',
    uk: true,
    team: [
      ['thilomon', 25],
      ['gibbsmon', 27],
    ],
    ai: 'normal',
    prize: 540,
    before: 'GROUNDSMAN TERRY: You’ve stood on it. I saw you stand on it. Battle!',
    after: 'GROUNDSMAN TERRY: Just… mind the grass, will you.',
  },
  {
    id: 'wembley-steward',
    name: 'Steward Marcus',
    uk: true,
    team: [
      ['jammon', 26],
      ['boydemon', 27],
    ],
    ai: 'normal',
    prize: 540,
    before: 'STEWARD MARCUS: Random search. Very random. It’s a battle.',
    after: 'STEWARD MARCUS: You’re clear. Enjoy the match.',
  },
];
