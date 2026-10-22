import { homeward } from './station';
import type { GameMap, Npc, Step } from '@/lib/story/world';

/**
 * Greystones, Co. Wicklow, by DART from Connolly Station in Dublin: the richest town in Ireland,
 * with the slate roofs, palm trees, yachts and jeeps to prove it. Kill, Stead and Cramps live
 * here, and all three say the town is under the terrible rule of the Happy Pear Twins, who are
 * down on the beach after their sea swim. Beat both twins, back to back, for the Vegan Stone.
 */

/** Set once anyone in Greystones has told you about the twins: then you can find them. */
export const PEAR_HEARD = 'greystones:heard';
/** The twins, fought one after the other with no healing in between. */
export const PEAR_TRAINERS = ['pear-dave', 'pear-steve'] as const;
/** Beating the second twin is beating the pair. */
export const BEAT_PEARS = `beat:${PEAR_TRAINERS[1]}`;

/** Someone in Greystones: what they say before you beat the twins, then after. */
function local(before: Step[], after: string): Step[] {
  return [
    {
      do: 'if',
      flag: BEAT_PEARS,
      then: [{ do: 'say', text: after }],
      else: [...before, { do: 'flag', flag: PEAR_HEARD }],
    },
  ];
}

const KILL = local(
  [
    {
      do: 'say',
      text: 'KILL: Story. I’m Kill. Lovely spot, Greystones, isn’t it? Sea views, flat whites, a Range Rover in every drive.',
    },
    {
      do: 'say',
      text: 'KILL: Only thing is, I’ve a terrible feeling I’m going to be forced to move to Africa. Any day now. I can feel it in my bones.',
    },
    {
      do: 'say',
      text: 'KILL: My Killemon keeps using This One’s for Africa. I think he’s trying to tell me something.',
    },
    {
      do: 'say',
      text: 'KILL: And we’re all living under the terrible rule of THE HAPPY PEAR TWINS. They’re down on the beach every morning, swimming in the freezing sea. Grinning.',
    },
  ],
  'KILL: You beat the Happy Pear Twins? We’re free! I’m still moving to Africa, mind. Any day now.',
);

const STEAD = local(
  [
    {
      do: 'say',
      text: 'STEAD: Alright? Stead. Very pleased to meet you. I should say straight away: I’m British.',
    },
    {
      do: 'say',
      text: 'STEAD: Born in Wicklow, yes. Raised in Wicklow, yes. But British. Look at the shirt.',
    },
    {
      do: 'say',
      text: 'STEAD: Up at six for the papers, in bed by half eight. You can’t get more British than that.',
    },
    {
      do: 'say',
      text: 'STEAD: Not that it helps. The whole town is under the terrible rule of THE HAPPY PEAR TWINS. They took the sausages out of the full English. The FULL ENGLISH.',
    },
  ],
  'STEAD: Jolly good show! I shall have a sausage roll to celebrate. Don’t tell the twins.',
);

const CRAMPS = local(
  [
    {
      do: 'say',
      text: 'CRAMPS: (He lifts one side of his headphones.) Sorry, what? I’m Cramps. DJ. Resident at the yacht club, Thursdays.',
    },
    {
      do: 'say',
      text: 'CRAMPS: I had a banger ready for tonight. But under the terrible rule of THE HAPPY PEAR TWINS, all I’m allowed to play is whale song.',
    },
    {
      do: 'say',
      text: 'CRAMPS: They say bass is bad for the digestion. They’ve never heard Thilomon and me go back to back.',
    },
  ],
  'CRAMPS: You beat the twins? Tonight we drop the BASS. You’re on the guest list, obviously.',
);

/**
 * The twins: talk to either one. Beat Dave and then Steve, one straight after the other. Lose
 * to Steve and Dave stays beaten, so it's Steve on his own next time.
 */
const twin = (name: 'DAVE' | 'STEVE', after: string): Step[] => [
  {
    do: 'if',
    flag: BEAT_PEARS,
    then: [{ do: 'say', text: `${name}: ${after}` }],
    else: [
      {
        do: 'if',
        flag: `beat:${PEAR_TRAINERS[0]}`,
        then: [
          {
            do: 'say',
            text: 'STEVE: Dave’s having a lie-down on the sand. My turn! I’ve had a smoothie, I’m buzzing.',
          },
          { do: 'battle', trainer: PEAR_TRAINERS[1] },
        ],
        else: [
          {
            do: 'say',
            text: 'DAVE: Howyas! Fresh out of the sea! Eleven degrees this morning. Absolutely gorgeous.',
          },
          {
            do: 'say',
            text: 'STEVE: Morning! We’ve done the sea swim, two hundred press-ups and a sourdough workshop, and it’s only half seven.',
          },
          {
            do: 'say',
            text: 'DAVE: People are saying we rule Greystones with an iron fist. That’s not true at all.',
          },
          { do: 'say', text: 'STEVE: It’s a plant-based fist. Lentils, mostly.' },
          {
            do: 'say',
            text: 'DAVE: Tell you what. Beat the two of us, back to back, no breaks, and we’ll ease up. Deal?',
          },
          {
            do: 'ask',
            text: 'Battle the Happy Pear Twins? It’s two battles in a row, with no healing in between.',
            yes: [
              { do: 'say', text: 'DAVE: Lovely stuff! Me first!' },
              { do: 'battle', trainer: PEAR_TRAINERS[0] },
              {
                do: 'say',
                text: 'STEVE: Nice one, Dave! Tag me in! No rest now, the porridge is going cold!',
              },
              { do: 'battle', trainer: PEAR_TRAINERS[1] },
            ],
            no: [
              { do: 'say', text: 'STEVE: No bother. Go and eat some greens and come back to us.' },
            ],
          },
        ],
      },
    ],
  },
];

/** What beating Steve gives you, after Dave: the Vegan Stone. */
export const PEAR_REWARD: Step[] = [
  {
    do: 'say',
    text: 'DAVE: Fair play. You’ve earned this. We found it on the beach after our very first sea swim.',
  },
  { do: 'give', item: 'vegan-stone' },
  {
    do: 'say',
    text: 'Give the Vegan Stone to Conemon or Conix to hold, from the BAG: their Attack goes up 20% in every battle.',
  },
  {
    do: 'say',
    text: 'STEVE: Greystones is free! Well, it was always free. But now there are sausages again.',
  },
];

const DART_DRIVER: Npc = { look: 'dart', face: 'down', talk: homeward('greystones') };

export const GREYSTONES: GameMap = {
  id: 'greystones',
  name: 'Greystones, Co. Wicklow',
  county: 9,
  slate: true,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'Tp"^^^^"p.^^^^.p^^^^^d~~',
    'Th"#P##"h.#M##.h#L###d~y',
    'Th..=...h..=...h..=..d~~',
    'T...=.1.....2.....=.4d~~',
    'T6S.=.............=.5dy~',
    'T@==================ddd~',
    'T....=.....=....7...d~~~',
    'Tccc.=.^^^^^^.3....S.d~y',
    'T....=.#H####.......dd~~',
    'Tp""S=.h=hp".,,,,,,.d~~~',
    'T,,,,,,,=,,,,,,,,,,,dd~~',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  wild: {
    min: 46,
    max: 52,
    table: [
      ['killemon', 20],
      ['steadmon', 20],
      ['crampemon', 20],
      ['vinnimon', 15],
      ['paulimon', 15],
      ['robinmon', 10],
    ],
  },
  npcs: [
    { look: 'kill', face: 'down', talk: KILL },
    { look: 'stead', face: 'down', talk: STEAD },
    { look: 'cramps', face: 'left', talk: CRAMPS },
    {
      look: 'pear',
      face: 'left',
      showIf: PEAR_HEARD,
      talk: twin(
        'DAVE',
        'Keep eating the greens! And come for a swim some morning, it’s only freezing for the first hour.',
      ),
    },
    {
      look: 'pear',
      face: 'left',
      showIf: PEAR_HEARD,
      talk: twin('STEVE', 'We’re off for a cold plunge. Want to come? No? Fair enough.'),
    },
    DART_DRIVER,
    { look: 'cyclist', face: 'left', trainer: 'greystones-cyclist', sight: 3 },
  ],
  signs: [
    'GREYSTONES STATION. DART to Bray, Dún Laoghaire and Connolly Station, Dublin.',
    'GREYSTONES MARINA. Moorings €40,000 a year. Waiting list: eleven years.',
    'GREYSTONES GOLF CLUB. Members only. The long grass is full of lost balls and wild Ranemon.',
  ],
  houses: [
    [
      {
        do: 'say',
        text: 'LOCAL: Welcome! Mind the marble. We’ve just had the kitchen done. Again. The island has its own island.',
      },
      {
        do: 'say',
        text: 'LOCAL: The Happy Pear Twins? Lovely lads. Very fit. Very, very fit. Nobody can keep up with them.',
      },
    ],
  ],
  landmarks: [
    [
      {
        do: 'say',
        text: 'THE HAPPY PEAR. A café full of plants, smoothies and pictures of two identical lads grinning in the sea.',
      },
      {
        do: 'if',
        flag: BEAT_PEARS,
        then: [
          {
            do: 'say',
            text: 'WAITER: The twins? They said you gave them a proper workout. They’ve named a smoothie after you.',
          },
        ],
        else: [
          {
            do: 'say',
            text: 'WAITER: Looking for the twins? They’re down on the beach after their sea swim. They’re always down on the beach.',
          },
          { do: 'flag', flag: PEAR_HEARD },
        ],
      },
    ],
  ],
};
