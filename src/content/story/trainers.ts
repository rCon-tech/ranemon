import { ROSTER } from '@/lib/battle/roster';
import { effectiveness } from '@/lib/battle/types';
import { speciesById } from '@/lib/story/party';
import type { Step, Trainer } from '@/lib/story/world';
import { phone } from './maps';
import { NEVER_FIND_OUT, RENT_DONE } from './rent';

/** Beating whoever you accused of taking the rent: thanks, but still no rent. */
const RENT_REWARD: Step[] = [
  { do: 'flag', flag: RENT_DONE },
  { do: 'say', text: 'Ollie and Simo look at each other. The biscuit tin is still empty.' },
  {
    do: 'say',
    text: 'SIMO: Well, we’re no closer to the rent. But fair play for trying. Have these, for the road.',
  },
  { do: 'give', item: 'full-irish', count: 2 },
];

/** All Romeo Ruairí ever says: before, during and after a battle. */
export const ROMEO = 'ROMEO RUAIRÍ: How do we always end up here?';

/** A gym win: the jersey, Michael D on the phone, and the leader's prize. */
function jersey(county: string, next: string, extra: Step[] = []): Step[] {
  return [
    { do: 'say', text: `You got the ${county} jersey!` },
    { do: 'flag', flag: `jersey:${county.toLowerCase()}` },
    ...extra,
    phone(next),
  ];
}

const T: Trainer[] = [
  // ---------- the rival: Margaret Thatcher, who picks after you and is terribly British ----------
  {
    id: 'rival-1',
    name: 'Margaret Thatcher',
    rival: true,
    friendly: true,
    team: [],
    ai: 'easy',
    prize: 100,
    before:
      'THATCHER: Good heavens. That Higgins chap gave you a Ranemon? Then I shall have one too. This lady is not for turning, and neither is her Ranemon!',
    after:
      'THATCHER: Beginner’s luck, I expect. I’m off for a pot of Earl Grey. Do queue properly on your way out.',
  },
  {
    id: 'rival-2',
    name: 'Margaret Thatcher',
    rival: true,
    team: [],
    ai: 'easy',
    prize: 560,
    before:
      'THATCHER: Thomond Park, is it? We invented rugby, dear. And queueing. And the scone. Shall we?',
    after:
      'THATCHER: Hmph. I shall be writing a very strongly worded letter to The Times. Tipperary is that way.',
  },
  {
    id: 'rival-3',
    name: 'Margaret Thatcher',
    rival: true,
    team: [],
    ai: 'normal',
    prize: 880,
    before:
      'THATCHER: I’ve been training at Wimbledon between rounds of cucumber sandwiches. Pearls on. Handbag ready. Prepare yourself.',
    after: 'THATCHER: Extraordinary. Simply not cricket. I’ll see you in Kildare, I suppose.',
  },
  {
    id: 'rival-4',
    name: 'Margaret Thatcher',
    rival: true,
    team: [],
    ai: 'hard',
    prize: 1680,
    before:
      'THATCHER: The Curragh. Horses, soldiers and frankly far too much rain. Stiff upper lip, everyone. Last chance before Dublin, dear.',
    after: 'THATCHER: Very well. You may have Dublin. I am keeping the handbag.',
  },
  {
    id: 'rival-5',
    name: 'Margaret Thatcher',
    rival: true,
    team: [],
    ai: 'hard',
    prize: 1840,
    before:
      'THATCHER: One more, on the quays. I have brought my pearls, my handbag and the full might of a stiff upper lip. Jolly good. Let’s begin.',
    after:
      'THATCHER: Oh, go on then. Beat B&S. I shall be taking afternoon tea at the Shelbourne if anyone needs me. Cheerio!',
  },

  // ---------- gyms ----------
  {
    id: 'gym-clare',
    name: 'Nóra',
    team: [
      ['simomon', 8],
      ['jammon', 11],
    ],
    ai: 'easy',
    prize: 480,
    before: 'NÓRA: Pull up a stool. Let’s see if you can keep time with the session.',
    after: 'NÓRA: Lovely playing. The Clare jersey is yours.',
    reward: jersey('Clare', 'Limerick', [{ do: 'give', item: 'cup-of-tea', count: 3 }]),
  },
  {
    id: 'gym-limerick',
    name: 'Big Donncha',
    team: [
      ['olliemon', 14],
      ['boydemon', 16],
    ],
    ai: 'easy',
    prize: 640,
    before: 'BIG DONNCHA: Down low, crouch, bind, SET!',
    after: 'BIG DONNCHA: You’ve a fine low centre of gravity. Take the jersey, and the High Nelly.',
    reward: jersey('Limerick', 'Tipperary', [
      { do: 'say', text: 'You got the High Nelly bike! Hold B to ride.' },
      { do: 'flag', flag: 'bike' },
    ]),
  },
  {
    id: 'gym-tipperary',
    name: 'Saoirse',
    team: [
      ['jammon', 18],
      ['steadmon', 18],
      ['conemon', 20],
    ],
    ai: 'easy',
    prize: 800,
    before:
      'SAOIRSE: Hiya! Quick check-in before we start: my Ranemon have unionised, my oat flat white is fair trade, and this battle is a safe space. Now let’s GO.',
    after:
      'SAOIRSE: Okay, that was problematic… for me. Fair play, though. Take the Tipperary jersey, and a reusable tote bag. Plastic is so last century.',
    reward: jersey('Tipperary', 'Kilkenny'),
  },
  {
    id: 'gym-kilkenny',
    name: 'Aoife',
    team: [
      ['enda', 22],
      ['robinmon', 22],
      ['lorcamon', 24],
    ],
    ai: 'hard',
    prize: 960,
    before: 'AOIFE: A trainer walks into a gym… Stop me if you’ve heard this one.',
    after: 'AOIFE: You killed. Take the jersey and The Round.',
    reward: jersey('Kilkenny', 'Laois', [
      {
        do: 'say',
        text: 'You got The Round! Ranemon who sat out a win now get half the EXP.',
      },
      { do: 'flag', flag: 'round' },
    ]),
  },
  {
    id: 'gym-laois',
    name: 'DJ Stradbally',
    team: [
      ['hugomon', 26],
      ['thilomon', 26],
      ['boydemon', 28],
    ],
    ai: 'normal',
    prize: 1120,
    before: 'DJ STRADBALLY: Hands in the air for the main stage!',
    after: 'DJ STRADBALLY: Absolute scenes. Laois jersey, go on.',
    reward: jersey('Laois', 'Offaly', [{ do: 'give', item: 'hair-of-the-dog', count: 2 }]),
  },
  {
    id: 'gym-offaly',
    name: 'Brother Ciarán',
    team: [
      ['steadmon', 30],
      ['simomon', 31],
      ['hugomon', 32],
    ],
    ai: 'normal',
    prize: 1280,
    before: 'BROTHER CIARÁN: Silence in the scriptorium. We battle quietly here.',
    after: 'BROTHER CIARÁN: Go in peace. And in the Offaly jersey.',
    reward: jersey('Offaly', 'Westmeath'),
  },
  {
    id: 'gym-westmeath',
    name: 'Niamh',
    team: [
      ['robinmon', 34],
      ['carlmon', 34],
      ['enda', 35],
      ['conemon', 36],
    ],
    ai: 'hard',
    prize: 1440,
    before: 'NIAMH: Mullingar! Are you ready? One, two, three, four!',
    after: 'NIAMH: What a crowd. Here’s the Westmeath jersey.',
    reward: jersey('Westmeath', 'Meath', [{ do: 'give', item: 'full-irish', count: 2 }]),
  },
  {
    id: 'gym-meath',
    name: 'The Keeper',
    team: [
      ['jammon', 38],
      ['simomon', 38],
      ['hugomon', 39],
      ['steadmon', 40],
    ],
    ai: 'hard',
    prize: 1600,
    before: 'THE KEEPER: The sun lights the chamber once a year. Today, it lights your defeat.',
    after: 'THE KEEPER: The light favours you. The Meath jersey, and two Blue Ghosts.',
    reward: jersey('Meath', 'Kildare', [{ do: 'give', item: 'blue-ghost', count: 2 }]),
  },
  {
    id: 'gym-kildare',
    name: 'Commandant Dee',
    team: [
      ['oismon', 39],
      ['olliemon', 39],
      ['boydemon', 40],
      ['owemon', 41],
      ['gibbsmon', 44],
    ],
    ai: 'hard',
    prize: 1760,
    before: 'COMMANDANT DEE: Attention! This is the last gym before Dublin. Fall in!',
    after: 'COMMANDANT DEE: At ease. The Kildare jersey. That makes nine.',
    reward: jersey('Kildare', 'Dublin', [
      { do: 'flag', flag: 'jersey:all' },
      { do: 'say', text: 'All nine county jerseys! The Front Gate of Trinity will open for you.' },
    ]),
  },

  // ---------- Trinity ----------
  {
    id: 'scholar-1',
    name: 'Scholar Aisling',
    team: [
      ['steadmon', 46],
      ['robinmon', 46],
      ['killemon', 47],
    ],
    ai: 'hard',
    prize: 1880,
    before: 'SCHOLAR AISLING: Shh. This is the Long Room. Battle in a whisper.',
    after: 'SCHOLAR AISLING: I’ll need to read up on that.',
  },
  {
    id: 'scholar-2',
    name: 'Scholar Rónán',
    team: [
      ['gibbsmon', 47],
      ['conemon', 47],
      ['lorcamon', 47],
    ],
    ai: 'hard',
    prize: 1880,
    before: 'SCHOLAR RÓNÁN: The Book of Kells has nothing on my team.',
    after: 'SCHOLAR RÓNÁN: Footnote: I lost.',
  },
  {
    id: 'scholar-3',
    name: 'Scholar Méabh',
    team: [
      ['thilomon', 47],
      ['carlmon', 48],
      ['enda', 48],
    ],
    ai: 'hard',
    prize: 1920,
    before: 'SCHOLAR MÉABH: B&S are under the Campanile. You won’t get past me.',
    after: 'SCHOLAR MÉABH: Go on, then. Walk under the Campanile, if you dare.',
  },
  {
    id: 'bns',
    name: 'B&S',
    team: [
      ['oismon', 51],
      ['olliemon', 51],
      ['gibbsmon', 52],
      ['thilomon', 53],
      ['petchemon', 54],
      ['bns', 55],
    ],
    ai: 'hard',
    prize: 5500,
    before:
      'B&S: So you’re the one in nine jerseys. We are B&S, Ranemon Champions of Ireland. Last orders!',
    after: 'B&S: …Fair play. The title is yours.',
    reward: [
      { do: 'say', text: 'B&S: And take Petchemon. He was only ever spying for us anyway.' },
      { do: 'recruit', species: 'petchemon', level: 55 },
      { do: 'ending' },
    ],
  },
  {
    id: 'bns-rematch',
    name: 'B&S',
    team: [
      ['oismon', 58],
      ['olliemon', 58],
      ['gibbsmon', 59],
      ['thilomon', 59],
      ['petchemon', 59],
      ['bns', 60],
    ],
    ai: 'hard',
    prize: 9000,
    before: 'B&S: Rematch. Level 60. No excuses this time.',
    after: 'B&S: Grand. Same again next week?',
  },
  {
    id: 'poseidon',
    name: 'Poseidon',
    team: [
      ['jammon', 54],
      ['simomon', 54],
      ['olliemon', 56],
      ['owemon', 56],
      ['poseidon', 60],
    ],
    ai: 'hard',
    prize: 7000,
    before:
      'POSEIDON: A mortal who can see me. Josh Lee has been handing out tablets again. Very well: face the Atlantic!',
    after:
      'POSEIDON: …The sea has not lost since Atlantis. Take this, and tell no one. They would not believe you.',
    reward: [
      { do: 'give', item: 'blue-ghost', count: 3 },
      {
        do: 'say',
        text: 'Poseidon dives under a wave the size of a house and is gone. The sea goes quiet.',
      },
    ],
  },

  // ---------- the missing rent: whoever you accuse ----------
  {
    id: 'rent-mc',
    name: 'MC',
    team: [
      ['conemon', 45],
      ['robinmon', 46],
      ['jammon', 47],
    ],
    ai: 'normal',
    prize: 1100,
    before: 'MC: Small but mighty!',
    after: `MC: ${NEVER_FIND_OUT}`,
    reward: RENT_REWARD,
  },
  {
    id: 'rent-melchior',
    name: 'Melchior',
    team: [
      ['vinnimon', 43],
      ['lorcamon', 44],
      ['skehemon', 45],
    ],
    ai: 'normal',
    prize: 1100,
    before: 'MELCHIOR: Vive le roi!',
    after: `MELCHIOR: ${NEVER_FIND_OUT}`,
    reward: RENT_REWARD,
  },

  // ---------- Romeo Ruairí, outside Sean's Bar: Simomon only, and only the one line ----------
  {
    id: 'wm-romeo',
    name: 'Romeo Ruairí',
    team: [
      ['simomon', 28],
      ['simomon', 30],
    ],
    ai: 'easy',
    prize: 600,
    before: ROMEO,
    after: ROMEO,
    line: ROMEO,
  },

  // ---------- route trainers ----------
  trainer(
    'lads-dec',
    'Lad on Tour Dec',
    [
      ['killemon', 9],
      ['carlmon', 10],
    ],
    'STAG! STAG! STAG!',
  ),
  trainer(
    'tipp-hurler',
    'Hurler Pádraig',
    [
      ['conemon', 14],
      ['boydemon', 14],
    ],
    'Up Tipp!',
  ),
  trainer(
    'lads-gav',
    'Lad on Tour Gav',
    [
      ['owemon', 14],
      ['jammon', 15],
    ],
    'Have you seen the groom? We lost him in Limerick.',
  ),
  trainer(
    'kk-comic',
    'Comedian Fionn',
    [
      ['robinmon', 18],
      ['enda', 18],
    ],
    'Did you hear the one about the trainer who lost?',
  ),
  trainer(
    'lads-ringleader',
    'Ringleader Shane',
    [
      ['thilomon', 22],
      ['killemon', 22],
      ['carlmon', 23],
    ],
    'I’m headlining Electric Picnic. Get off my stage.',
  ),
  trainer(
    'laois-raver',
    'Raver Saoirse',
    [
      ['hugomon', 21],
      ['oismon', 22],
    ],
    'You’re blocking the view of the main stage!',
  ),
  trainer(
    'offaly-monk',
    'Monk Colm',
    [
      ['steadmon', 26],
      ['simomon', 26],
    ],
    'A battle is a kind of prayer.',
  ),
  trainer(
    'offaly-turf',
    'Turf Cutter Bríd',
    [
      ['jammon', 25],
      ['hugomon', 26],
    ],
    'Mind the bog. It swallows people.',
  ),
  trainer(
    'wm-fan',
    'Superfan Ciara',
    [
      ['robinmon', 30],
      ['conemon', 30],
      ['carlmon', 31],
    ],
    'I’ve been queueing for Niamh since Tuesday!',
  ),
  trainer(
    'lads-fiach',
    'Lad on Tour Fiach',
    [
      ['boydemon', 29],
      ['lorcamon', 30],
    ],
    'Sean’s Bar is the oldest pub in Ireland and we’re not leaving.',
  ),
  trainer(
    'meath-druid',
    'Druid Oisín',
    [
      ['simomon', 34],
      ['jammon', 34],
    ],
    'The solstice approaches. Battle me in its honour.',
  ),
  trainer(
    'meath-shopper',
    'Shopper Tadhg',
    [
      ['jammon', 33],
      ['steadmon', 34],
    ],
    'I want a REFUND. And a battle.',
  ),
  trainer(
    'kildare-soldier',
    'Private Byrne',
    [
      ['owemon', 37],
      ['boydemon', 38],
      ['gibbsmon', 38],
    ],
    'Halt! Who goes there?',
  ),
  trainer(
    'dublin-jogger',
    'Jogger Ruth',
    [
      ['carlmon', 42],
      ['conemon', 43],
    ],
    'Three laps of the Phoenix Park before breakfast!',
  ),
  trainer(
    'dublin-stag',
    'Lad on Tour Groom',
    [
      ['killemon', 42],
      ['thilomon', 43],
      ['owemon', 43],
    ],
    'Last night of the stag! Let’s make it count!',
  ),
];

function trainer(id: string, name: string, team: [string, number][], before: string): Trainer {
  const ace = Math.max(...team.map(([, l]) => l));
  return {
    id,
    name,
    team,
    ai: 'easy',
    prize: ace * 20,
    before: `${name.toUpperCase()}: ${before}`,
    after: `${name.toUpperCase()}: Ah, here.`,
  };
}

const BY_ID = new Map(T.map((t) => [t.id, t]));
export const TRAINERS = T;

export function trainerById(id: string): Trainer {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`Unknown trainer: ${id}`);
  return t;
}

/** The rival's starter: the first Ranemon whose type hits yours for super-effective damage. */
export function rivalStarter(yours: string): string {
  const mine = speciesById(yours).types;
  const pick = ROSTER.find(
    (c) => c.id !== yours && c.types.some((t) => effectiveness(t, mine) > 1),
  );
  return (pick ?? ROSTER.find((c) => c.id !== yours)!).id;
}

/** The rival's team at each meeting: the starter plus more of the lads, a little ahead of you. */
const RIVAL_STAGES: Record<string, { levels: number[] }> = {
  'rival-1': { levels: [5] },
  'rival-2': { levels: [14, 12] },
  'rival-3': { levels: [22, 20, 20] },
  'rival-4': { levels: [42, 40, 40, 41] },
  'rival-5': { levels: [46, 44, 44, 45, 45, 44] },
};
const RIVAL_BENCH = [
  'killemon',
  'hugomon',
  'robinmon',
  'boydemon',
  'lorcamon',
  'gibbsmon',
  'jammon',
  'conemon',
];

export function teamOf(t: Trainer, starter: string | undefined): [string, number][] {
  if (!t.rival) return t.team;
  const lead = rivalStarter(starter ?? 'carlmon');
  const bench = RIVAL_BENCH.filter((id) => id !== lead && id !== starter);
  return RIVAL_STAGES[t.id].levels.map((level, i) => [i === 0 ? lead : bench[i - 1], level]);
}
