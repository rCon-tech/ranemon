import { TECHNO_DONE } from './cramps';
import { interiorId } from './interiors';
import { homeward } from './station';
import type { GameMap, Npc, Step, Trainer } from '@/lib/story/world';

/**
 * I Love Techno, after B&S and the Trinity Ball. The first time you're back out in Dublin as
 * Champion, Cramps (the DJ from Greystones) comes running up the street to you: to celebrate the
 * win, the crew are going to I Love Techno, the music festival in Ghent, Belgium, and you're
 * coming. Nobody can miss him: he runs up to you whichever way you come into Dublin, and saves
 * already past the Ball meet him the next time they're out in Dublin. Say no and he waits at
 * Connolly Station to ask again.
 *
 * Saying yes opens the Eurostar at Connolly (platform 4) to Ghent. At Flanders Expo security
 * won't let anyone in: three guards in the queue lane outside, the last one on the door, and
 * stage security inside, then DJ Vandenbass at the decks. Beat him and you get ten Blue Ghosts
 * from his rider, and the festival starts: the hall turns into the party (`after` on the room).
 */

/** Gravensteen is the first landmark door in Ghent, Flanders Expo the second. */
export const EXPO_ID = interiorId('belgium', 'L', 1);

/** The guards, in the order you meet them, and the DJ at the end. */
export const SECURITY = ['techno-wouter', 'techno-ilse', 'techno-dirk', 'techno-bart'];
export const HEAD_OF_SECURITY = 'techno-dirk';
export const TECHNO_DJ = 'techno-dj';

/** How many Blue Ghosts are on the DJ's rider. */
export const RIDER = 10;

// ---------- the guards and the DJ ----------

/** Beating DJ Vandenbass: his rider of Blue Ghosts, and the festival starts. */
export const DJ_REWARD: Step[] = [
  {
    do: 'say',
    text: 'DJ VANDENBASS: …You beat me. At my own festival. In front of my own decks. Respect.',
  },
  {
    do: 'say',
    text: 'DJ VANDENBASS: Here. My rider: ten Blue Ghosts, ice cold. Take one, get yipped, and go up a level. You’ve earned them.',
  },
  { do: 'give', item: 'blue-ghost', count: RIDER },
  {
    do: 'say',
    text: 'CRAMPS: TEN Blue Ghosts! Don’t take them all at once. Actually, it’s I Love Techno. Do what you want.',
  },
  { do: 'flag', flag: TECHNO_DONE },
  {
    do: 'say',
    text: 'The lights drop. A kick drum shakes the whole hall. The doors fly open, thousands pour in, and I LOVE TECHNO has begun!',
  },
];

/**
 * Everyone you battle in Ghent, in the order you meet them, all on Hard. Tuned for a party at
 * each one's ace level: the guards win about 1 time in 10 to 1 in 5, and the DJ about 1 in 3.
 * Hugengar and Vinnisaur are there for Tobymon. Hugengar takes half from his Brains moves and
 * hits his Defense, his weaker guard, with base 138 Attack; Vinnisaur, Charm and Brains like him,
 * takes half from everything he has (`tests/sim/postgame.test.ts`).
 */
export const TECHNO_TRAINERS: Trainer[] = [
  {
    id: 'techno-wouter',
    name: 'Security Wouter',
    team: [
      ['boydemon', 53],
      ['steadmon', 53],
      ['enda', 54],
    ],
    ai: 'hard',
    prize: 1060,
    before:
      'SECURITY WOUTER: Wristband? No wristband, no entry. A County Clare jersey is not a wristband.',
    after: 'SECURITY WOUTER: Okay. Okay. That was a very good wristband.',
  },
  {
    id: 'techno-ilse',
    name: 'Security Ilse',
    team: [
      ['gibbsmon', 54],
      ['conemon', 54],
      ['hugomon', 55],
      ['simomon', 55],
    ],
    ai: 'hard',
    prize: 1080,
    before:
      'SECURITY ILSE: Champion of Ireland? I don’t know what that is. In Belgium we have a king. Is he on the list? No. Neither are you.',
    after: 'SECURITY ILSE: Fine. FINE. Dirk is on the door. Nobody gets past Dirk.',
  },
  {
    id: HEAD_OF_SECURITY,
    name: 'Head of Security Dirk',
    team: [
      ['carlmon', 55],
      ['hugomon', 55],
      ['killemon', 56],
      ['boydemon', 56],
    ],
    ai: 'hard',
    prize: 1100,
    before:
      'HEAD OF SECURITY DIRK: Twenty years on this door. Nobody gets in without a wristband. Not the King. Not the Pope. Not you.',
    after:
      'HEAD OF SECURITY DIRK: …Nobody has ever got past me. Go on in. Before I change my mind.',
  },
  {
    id: 'techno-bart',
    name: 'Stage Security Bart',
    team: [
      ['robinmon', 56],
      ['lorcamon', 56],
      ['vinnimon', 57],
      ['steadmon', 57],
    ],
    ai: 'hard',
    prize: 1120,
    before:
      'STAGE SECURITY BART: How did you get past Dirk? Nobody gets past Dirk. Well. Nobody gets past ME.',
    after: 'STAGE SECURITY BART: Ah no. The DJ is going to kill me.',
  },
  {
    id: TECHNO_DJ,
    name: 'DJ Vandenbass',
    team: [
      ['hugomon', 56],
      ['vinnimon', 57],
      ['crampemon', 58],
      ['oismon', 58],
      ['olliemon', 59],
      ['thilomon', 60],
    ],
    ai: 'hard',
    prize: 6000,
    before:
      'DJ VANDENBASS: Twenty-five years headlining I Love Techno. The festival doesn’t start until I press play. And I don’t press play for anyone who can’t keep up.',
    after: 'DJ VANDENBASS: The drop… you DROPPED me.',
    line: 'DJ VANDENBASS: Feel the BASS!',
    reward: DJ_REWARD,
  },
];

// ---------- Ghent ----------

/** What someone says before the festival and after it starts. */
function festival(before: string, after: string): Step[] {
  return [
    {
      do: 'if',
      flag: TECHNO_DONE,
      then: [{ do: 'say', text: after }],
      else: [{ do: 'say', text: before }],
    },
  ];
}

const CRAMPS_IN_GHENT = festival(
  'CRAMPS: Champion! You made it! Bad news: security won’t let ANYONE in. Not even the crew. Not even Thilo, and he’s DJing. Can you have a word with them? A battle-y sort of word?',
  'CRAMPS: Can you hear that? That’s I Love Techno. Get in there!',
);

/** The way into Flanders Expo, a fenced queue lane, is where the guards are. */
export const BELGIUM: GameMap = {
  id: 'belgium',
  name: 'Ghent, Belgium',
  county: 10,
  // 2D only for now: the 3D look shows Ghent and the Expo in 2D.
  flat: true,
  // Old stepped gables in the town and Gravensteen in stone: slate on every building.
  slate: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'T^^^^^^vv^^^v^^^v^^^^^^T',
    'T###L##vv#P#v#M#v^^^^^^T',
    'T2vvv1vvvvvvvvvvv^^^^^^T',
    'T@vvvvvvvvvvvvvvv##L###T',
    'Taaaaaaaaaaaaaaavf5vvfvT',
    'Tvvvvvvvvvvvvv6vvfvvvfvT',
    'Tv,,,,,,vvvvvvvvvf4vvfvT',
    'Tv,,,,,,vvvvSvvvvfvvvfvT',
    'Tv,,,,,,vvvvvvvvvfvv3fvT',
    'TvvvvvvvvvvvvvvvvvvvvvvT',
    'T~~~y~~~~~~~~~~~~~y~~~~T',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  wild: {
    min: 54,
    max: 58,
    table: [
      ['thilomon', 20],
      ['crampemon', 20],
      ['owemon', 20],
      ['jammon', 15],
      ['oismon', 15],
      ['hugomon', 10],
    ],
  },
  npcs: [
    { look: 'cramps', face: 'down', talk: CRAMPS_IN_GHENT },
    { look: 'eurostar', face: 'right', talk: homeward('belgium') },
    {
      look: 'security',
      face: 'left',
      trainer: 'techno-wouter',
      sight: 2,
      talk: festival(
        'SECURITY WOUTER: Dirk is on the door. Good luck with Dirk.',
        'SECURITY WOUTER: I am on my break. I am dancing on my break.',
      ),
    },
    {
      look: 'security',
      face: 'right',
      trainer: 'techno-ilse',
      sight: 2,
      talk: festival(
        'SECURITY ILSE: The queue is that way. Oh. You ARE the queue.',
        'SECURITY ILSE: Okay, I admit it. I love techno.',
      ),
    },
    {
      look: 'security',
      face: 'right',
      trainer: HEAD_OF_SECURITY,
      sight: 1,
      talk: festival(
        'HEAD OF SECURITY DIRK: The door is open. For you. Only for you.',
        'HEAD OF SECURITY DIRK: (Dirk is nodding his head. Very slightly. On the beat.)',
      ),
    },
    {
      look: 'raver',
      face: 'left',
      talk: festival(
        'RAVER: Four hours in this queue! Security won’t let ANYONE in. Something about the DJ not being ready.',
        'RAVER: WE’RE IN! WE’RE ALL IN! I LOVE TECHNO!',
      ),
    },
  ],
  signs: [
    'I LOVE TECHNO. Flanders Expo, Ghent. Doors open when security says so. Security says no.',
  ],
  landmarks: [
    [
      {
        do: 'say',
        text: 'GRAVENSTEEN. A real castle in the middle of Ghent, with a moat, turrets and a museum of very old, very nasty tools. Cramps says the acoustics are unreal.',
      },
    ],
    festival(
      'FLANDERS EXPO. A hall the size of an airport, nearly empty. Up on the stage, DJ Vandenbass is still doing his sound check.',
      'I LOVE TECHNO. The bass hits you in the chest, lasers sweep the roof and the whole of Belgium is dancing.',
    ),
  ],
  landmarkLocks: {
    1: {
      flag: `beat:${HEAD_OF_SECURITY}`,
      locked:
        'SECURITY: Whoa, whoa, whoa. Where do you think you’re going? Nobody gets in without getting past security. Back to the queue.',
      opened: 'HEAD OF SECURITY DIRK: (Dirk unhooks the rope and steps aside, very slowly.)',
    },
  },
  landmarkRooms: { 1: expoRoom() },
};

/** Inside Flanders Expo: the decks at the back, stage security on the floor, Cramps by the door. */
function expoRoom(): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things' | 'after'> {
  const dj: Npc = {
    look: 'headliner',
    face: 'down',
    trainer: TECHNO_DJ,
    talk: [
      {
        do: 'say',
        text: 'DJ VANDENBASS: (He doesn’t take his headphones off.) Twelve hours, no breaks. This is what you won, Champion. DANCE!',
      },
    ],
  };
  const bart: Npc = {
    look: 'security',
    face: 'right',
    trainer: 'techno-bart',
    sight: 11,
    talk: festival(
      'STAGE SECURITY BART: Please don’t tell the DJ it was me who let you through.',
      'STAGE SECURITY BART: Security? Me? No. Tonight I am a raver.',
    ),
  };
  const cramps: Npc = {
    look: 'cramps',
    face: 'up',
    talk: festival(
      'CRAMPS: We’re IN! Now: DJ Vandenbass won’t start the festival for anyone who can’t keep up. Show him you can keep up.',
      'CRAMPS: THIS. IS. I LOVE. TECHNO! Thilo’s on after Vandenbass. Then me. Then you, if you want!',
    ),
  };
  return {
    name: 'Flanders Expo',
    rows: [
      'WooooooooooooW',
      'WIkkkk1kkkkkIW',
      'WIkkCCCCCCkkIW',
      'WkllllllllllkW',
      'WkllllllllllkW',
      'W2llllllllllkW',
      'WkllllllllllkW',
      'WkllllllllllkW',
      'WkllllllllllkW',
      'WUUkkkkkkk3UUW',
      'WUUkkk@kkkkUUW',
      'WWWWWWEWWWWWWW',
    ],
    npcs: [dj, bart, cramps],
    things: {
      I: 'A speaker stack as tall as a house. The whole hall hums.',
      C: 'The decks: four turntables, a mixer the size of a car bonnet and a towel that says I ♥ TECHNO.',
      o: 'Black walls and a lighting rig hung off the roof, waiting.',
      U: 'A table of water bottles, earplugs and lost glow sticks.',
    },
    after: {
      flag: TECHNO_DONE,
      name: 'I Love Techno, Ghent',
      npcs: [
        { ...dj, dances: true },
        { ...bart, dances: true },
        { ...cramps, dances: true },
      ],
      party: {
        // Laser strings over the dance floor, and two across from speaker to speaker.
        lights: [
          [1.5, 1.5, 12.5, 1.5],
          [2.5, 3.5, 11.5, 3.5],
          [2.5, 3.5, 6.5, 8.5],
          [11.5, 3.5, 7.5, 8.5],
          [2.5, 6, 11.5, 6],
          [2.5, 8.5, 11.5, 8.5],
        ],
        crowd: [
          { x: 3, y: 4, look: 'raver' },
          { x: 5, y: 4, look: 'clubber' },
          { x: 9, y: 4, look: 'shuffler' },
          { x: 11, y: 4, look: 'raver' },
          { x: 4, y: 6, look: 'dancer' },
          { x: 9, y: 6, look: 'clubber' },
          { x: 11, y: 6, look: 'shuffler' },
          { x: 3, y: 7, look: 'shuffler' },
          { x: 5, y: 8, look: 'raver' },
          { x: 9, y: 8, look: 'dancer' },
          { x: 11, y: 8, look: 'clubber' },
          { x: 3, y: 9, look: 'raver' },
        ],
        lines: [
          'I LOVE TECHNO! I LOVE TECHNO!',
          'Twelve hours! TWELVE HOURS!',
          'Is this the drop? Is THIS the drop? THIS is the drop!',
          'Came over on the Eurostar with nothing but a bum bag. No regrets.',
          'Vandenbass is playing at 140 beats a minute. My heart is doing 160.',
          'Have you seen Cramps dance? Nobody has. He just nods.',
          'Dirk let me in! DIRK! Nobody gets past Dirk!',
          'Someone gave me a Blue Ghost and now I can see the bass.',
        ],
        balloons: [
          [1, 1],
          [12, 1],
          [1, 9],
          [12, 9],
        ],
      },
    },
  };
}
