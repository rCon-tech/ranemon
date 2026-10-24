import { LEGEND, LEGEND_LEVEL } from '@/lib/battle/legend';
import { CERT, HM, LIMEPASS, TABLET, TABLET_TAKEN, TAKE_TABLET } from '@/lib/story/keys';
import type { GameMap, Step } from '@/lib/story/world';
import { interiorsOf } from './interiors';
import { SIBEAL_LENDS } from './sibeal';
import { NORM } from '@/lib/story/norm';
import { RENT_ARRIVE, RENT_GARDA, RENT_NEIGHBOUR, RENT_ROOM } from './rent';
import { GREYSTONES } from './greystones';
import {
  GPO_DOOR,
  GPO_ROOM,
  SUPERMACS_DOOR,
  SUPERMACS_ROOM,
  TEMPLE_BAR_PUB_DOOR,
  TEMPLE_BAR_PUB_ROOM,
} from './buildings';
import { STATION_ARRIVE, homeward, stationRoom } from './station';
import { MESCAL } from './mescal';
import { HIGGINS, TRINITY_BALL } from './ball';
import { BOUNCER, RAVE_ARRIVE, raveRoom } from './rave';
import { ENDA_BY_ROAD, ENDA_CALLS, ENDA_IN_ROAD } from './enda';
import { BRIGHTON } from './brighton';
import { CRAMPS_ARRIVE } from './cramps';
import { PROVAI_ARRIVE } from './kneecap';
import { BELGIUM } from './techno';
import { AIRPORT, LONDON, STANSTED } from './london';
import { palaceRooms } from './palace';
import { PL_MAPS } from './premier';
import { SHOREDITCH } from './shoreditch';
import { GALWAY, HALL_ROOMS } from './galway';
import * as LEGENDS from './legends';

/**
 * The road from Co. Clare to Trinity College Dublin, one map per county, walked west to east.
 * Each county has a town with McGrattans (the pub, which heals), Vapes (the shop) and a gym, and a Garda at the east
 * edge who lets you through once you have that county's jersey. See docs/story-mode.md.
 */

const phone = (next: string) => ({
  do: 'say' as const,
  text: `♪ Ring ring! It’s Michael D: “Maith thú! On to ${next} with you now.”`,
});

/** The Garda at each county line: gone once you have the jersey. */
const garda = (county: string, jersey: string) => ({
  look: 'guard' as const,
  face: 'left' as const,
  hideIf: jersey,
  talk: [
    {
      do: 'say' as const,
      text: `GARDA: Nobody leaves ${county} without the ${county} jersey. Beat the gym first.`,
    },
  ],
});

/**
 * The old man in Thurles, a retired donkey vet, who asks you five questions and certifies you
 * with Donkey Brains: the highest honour in Tipperary. His HM opens the gym's pattern lock.
 * The questions are loosely after the screening ones, and every answer is a good one.
 */
const question = (n: number, text: string, yes: string, no: string): Step => ({
  do: 'ask',
  text: `QUESTION ${n} OF 5. ${text}`,
  yes: [{ do: 'say', text: `OLD MAN: ${yes}` }],
  no: [{ do: 'say', text: `OLD MAN: ${no}` }],
});

const DONKEY_VET: Step[] = [
  {
    do: 'if',
    flag: HM,
    then: [
      {
        do: 'say',
        text: 'OLD MAN: Did you frame the certificate? Donkey Brains. There’s only a handful of us in the whole county.',
      },
    ],
    else: [
      {
        do: 'say',
        text: 'OLD MAN: You’re after the gym? Saoirse put a pattern lock on the door. Nobody in Thurles can work it out.',
      },
      {
        do: 'say',
        text: 'OLD MAN: I was a donkey vet for forty years. Cleverest animals in Ireland, donkeys. They notice everything, and they never forget a field.',
      },
      {
        do: 'say',
        text: 'OLD MAN: Answer me five questions and we’ll see if you’ve the brains of a donkey. There are no wrong answers, mind.',
      },
      question(
        1,
        'Do you often notice small sounds other people don’t, like the fridge humming in McGrattans?',
        'So do donkeys. Their ears are enormous.',
        'Lucky. That fridge has been humming since 1994.',
      ),
      question(
        2,
        'Would you rather spend Saturday night in the library than at the disco in Thurles?',
        'The library has better lighting, in fairness.',
        'Grand. The disco shut in 2003, so it’s the library either way.',
      ),
      question(
        3,
        'Do you notice number plates, or patterns in things, all the time?',
        'Then you’ll have seen that every second car in Tipperary is a 2008 Corolla.',
        'No harm. Every second car in Tipperary is a 2008 Corolla anyway.',
      ),
      question(
        4,
        'If someone interrupts you, can you go straight back to what you were doing?',
        'Good, because I’ve forgotten what I was… ah no, here we are.',
        'Me neither. I’ve been halfway through the same crossword since 1979.',
      ),
      question(
        5,
        'Have you one big interest you could talk about for hours? Every Munster hurling final, say?',
        'Same here. Ask me about 1991. Actually, don’t, we’ll be here all day.',
        'Ah, you’ll find one. Mine is donkeys. And hurling. And the crossword.',
      ),
      {
        do: 'say',
        text: 'OLD MAN: (He writes on the back of a Tayto packet for a long time, then looks up, delighted.)',
      },
      {
        do: 'say',
        text: 'OLD MAN: Well now. Those are the most interesting answers I’ve heard since 1987. I hereby certify you…',
      },
      { do: 'say', text: '…with DONKEY BRAINS! You got the Donkey Brains certificate!' },
      { do: 'flag', flag: CERT },
      {
        do: 'say',
        text: 'OLD MAN: And take this. HM NEURODIVERGENT. It lets you see the patterns the rest of us walk straight past. That lock won’t stand a chance.',
      },
      {
        do: 'say',
        text: 'You got HM NEURODIVERGENT! Use it from the BAG to notice everything around you.',
      },
      { do: 'flag', flag: HM },
    ],
  },
];

/**
 * The legend of Dublin. Three coral beads, from an old woman on the quays, a busker's song and
 * a barman in Temple Bar, open the Hellfire Club, where something ancient is waiting. Nobody
 * ever says its name: you only find out who it is when you face it.
 */
export const LEGEND_FLAG = 'legend:beads';
const BEADS = ['bead:liffey', 'bead:busker', 'bead:templebar'];
const bead = (flag: string): Step[] => [
  { do: 'say', text: 'You got a CORAL BEAD! It is warm, as if someone was just holding it.' },
  { do: 'flag', flag },
  ...BEADS.reduceRight<Step[]>(
    (then, f) => [{ do: 'if', flag: f, then }],
    [
      {
        do: 'say',
        text: 'The three coral beads glow together in your bag. Somewhere on the hill, an old door creaks.',
      },
      { do: 'flag', flag: LEGEND_FLAG },
    ],
  ),
];

const OLD_WOMAN: Step[] = [
  {
    do: 'if',
    flag: BEADS[0],
    then: [
      {
        do: 'say',
        text: 'OLD WOMAN: The other beads? Follow the music, love. The busker up by the Park sings the old song.',
      },
    ],
    else: [
      {
        do: 'say',
        text: 'OLD WOMAN: You’ve the look of someone who’s walked a long way. Did you ever hear tell of the legend?',
      },
      {
        do: 'say',
        text: 'OLD WOMAN: A Ranemon older than the city. Cream robes, a coral necklace, a staff topped with gold. Nobody’s seen him in years. Most say he was never real at all.',
      },
      {
        do: 'say',
        text: 'OLD WOMAN: My granny swore she saw him on the quays one night. All he left was this. I fished it out of the Liffey seventy years ago.',
      },
      ...bead(BEADS[0]),
      {
        do: 'say',
        text: 'OLD WOMAN: The busker up by the Park sings the old song about him. Ask him for the second verse.',
      },
    ],
  },
];

const BUSKER: Step[] = [
  {
    do: 'if',
    flag: BEADS[1],
    then: [
      {
        do: 'say',
        text: 'BUSKER: The last verse is about Temple Bar. Ask the barman about the stranger with the gold staff.',
      },
    ],
    else: [
      {
        do: 'if',
        flag: BEADS[0],
        then: [
          {
            do: 'say',
            text: 'BUSKER: Is that a coral bead? Where’d you get that? Then you’ll want the second verse.',
          },
          {
            do: 'say',
            text: 'BUSKER: ♪ In robes of cream and coral red, he walked the hills while Dublin slept. A staff of gold, a name unsaid, and a bead for every promise kept. ♪',
          },
          {
            do: 'say',
            text: 'BUSKER: Someone dropped this in my guitar case the night I wrote that. Never saw who.',
          },
          ...bead(BEADS[1]),
          {
            do: 'say',
            text: 'BUSKER: The old barman in Temple Bar’s been pouring since the seventies. He’ll know the last verse.',
          },
        ],
        else: [
          {
            do: 'say',
            text: 'BUSKER: ♪ In Dublin’s fair city… ♪ Sorry, I only do the old songs for people who know the story.',
          },
        ],
      },
    ],
  },
];

const TEMPLE_BAR: Step[] = [
  {
    do: 'if',
    flag: BEADS[2],
    then: [
      {
        do: 'say',
        text: 'BARMAN: The Hellfire Club, up the hill at the edge of town. Mind yourself up there.',
      },
    ],
    else: [
      {
        do: 'if',
        flag: BEADS[1],
        then: [
          {
            do: 'say',
            text: 'BARMAN: A bead like that? A stranger left one on this counter in 1979. Paid for a pint with it, then walked out into the fog.',
          },
          ...bead(BEADS[2]),
          {
            do: 'say',
            text: 'BARMAN: He went up toward the Hellfire Club, the old ruin on the hill. Nobody’s got that door open in two hundred years.',
          },
        ],
      },
    ],
  },
];

const HELLFIRE: Step[] = [
  {
    do: 'if',
    flag: 'caught:tobymon',
    then: [{ do: 'say', text: 'THE HELLFIRE CLUB. Only coral dust, and the quiet of the hill.' }],
    else: [
      {
        do: 'say',
        text: 'THE HELLFIRE CLUB. Mist hangs inside the ruin, and the air smells of old incense.',
      },
    ],
  },
];

const HELLFIRE_ROOM = {
  name: 'The Hellfire Club',
  rows: [
    'WWWWWWWWWW',
    'WwwwwwwwwW',
    'Ww::1:::wW',
    'W::::::2:W',
    'W:X:rr:X:W',
    'W:::rr:::W',
    'Ww::rr:::W',
    'Ww::@:::wW',
    'WWWWEWWWWW',
  ],
  things: {
    X: 'A standing stone carved with a figure leaning on a staff. The face has worn away.',
  },
  npcs: [
    {
      look: 'legend' as const,
      face: 'down' as const,
      showIf: LEGEND_FLAG,
      hideIf: 'caught:tobymon',
      talk: [
        {
          do: 'say' as const,
          text: 'A figure in cream robes stands among the ruins, leaning on a gold-topped staff. Coral beads glow at his neck.',
        },
        {
          do: 'say' as const,
          text: '???: …So. You carry my beads. Then the old stories found you, as once they found me.',
        },
        {
          do: 'say' as const,
          text: '???: Show me what kind of trainer walks this far for a myth.',
        },
        { do: 'wild' as const, species: LEGEND.id, level: LEGEND_LEVEL },
        {
          do: 'if' as const,
          flag: 'caught:tobymon',
          then: [
            {
              do: 'say' as const,
              text: 'The legend was real. The coral beads crumble to dust in your bag. Nobody in Dublin will ever believe you.',
            },
          ],
          else: [
            {
              do: 'say' as const,
              text: 'The figure fades into the mist. The beads are still warm. He will be waiting here.',
            },
          ],
        },
      ],
    },
    // A hillwalker sheltering from the weather, so the ruin is never empty.
    {
      look: 'local' as const,
      face: 'left' as const,
      talk: [
        {
          do: 'say' as const,
          text: 'HILLWALKER: The Hellfire Club. Rich lads built it in 1725 with stones from a cairn, and the roof blew off the first winter. Served them right.',
        },
        {
          do: 'say' as const,
          text: 'HILLWALKER: They say the Devil sat in on a card game here once. I only come up for the view of the bay. And the sandwiches.',
        },
      ],
    },
  ],
};

/**
 * The Donegal side story: the train from Dublin to Bundoran, where Josh Lee surfs all year and
 * hands out a tablet that lets you see Poseidon, out on the rocks. Poseidon is a boss trainer.
 */
const BEAT_POSEIDON = 'beat:poseidon';

const JOSH: Step[] = [
  {
    do: 'if',
    flag: BEAT_POSEIDON,
    then: [
      {
        do: 'say',
        text: 'JOSH LEE: You beat POSEIDON? Absolute legend. Nobody in the Surf Club believes me either.',
      },
    ],
    else: [
      {
        do: 'if',
        flag: TABLET_TAKEN,
        then: [
          {
            do: 'say',
            text: 'JOSH LEE: Told you. He’s out on the rocks by Tullan Strand, isn’t he? Go on, he loves a scrap.',
          },
        ],
        else: [
          {
            do: 'if',
            flag: TABLET,
            then: [
              { do: 'say', text: 'JOSH LEE: Still haven’t taken the tablet? Go on.' },
              {
                do: 'ask',
                text: 'Take Josh Lee’s tablet now?',
                yes: TAKE_TABLET,
                no: [{ do: 'say', text: 'JOSH LEE: Suit yourself. It’s in your bag.' }],
              },
            ],
            else: [
              {
                do: 'say',
                text: 'JOSH LEE: Story? Josh Lee. I surf Bundoran all year round, even in January.',
              },
              {
                do: 'say',
                text: 'JOSH LEE: There’s a god out on the rocks. POSEIDON. Crown, trident, beard down to here. I’ve seen him loads.',
              },
              {
                do: 'say',
                text: 'JOSH LEE: Only thing is, you can only see him after you take one of these. Here.',
              },
              { do: 'flag', flag: TABLET },
              { do: 'say', text: 'You got JOSH LEE’S TABLET!' },
              {
                do: 'ask',
                text: 'Take the tablet now?',
                yes: TAKE_TABLET,
                no: [
                  {
                    do: 'say',
                    text: 'JOSH LEE: Grand. It’s in your bag whenever you’re ready.',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

/** The Lime rep in Limerick, who signs you up for a Limepass. */
const LIME_REP: Step[] = [
  {
    do: 'if',
    flag: LIMEPASS,
    then: [
      {
        do: 'say',
        text: 'LIME REP: Enjoying the Limepass? Hold B to ride, and pick LIMEPASS from START to zip back anywhere you’ve been.',
      },
    ],
    else: [
      {
        do: 'say',
        text: 'LIME REP: Story! Lime bikes have landed in Limerick. Grand for the hills, and you can leave them anywhere. Well, nearly anywhere.',
      },
      {
        do: 'say',
        text: 'LIME REP: Here, have a Limepass on the house. First ride’s on us. So is every other one.',
      },
      { do: 'flag', flag: LIMEPASS },
      { do: 'say', text: 'You got the LIMEPASS! Hold B to ride a Lime e-bike.' },
      {
        do: 'say',
        text: 'LIMEPASS is on the START menu now, too: pick it to zip straight back to any town you’ve been to.',
      },
    ],
  },
];

export const MAPS: GameMap[] = [
  {
    id: 'clare',
    name: 'Newmarket-on-Fergus, Co. Clare',
    county: 0,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T^^^^.....TTTT..^^^^^..TTTT~~~~~~~~~~~~T',
      'T#H##..S..TTTT..##L##..TT~~~~~~~~~~~~~~T',
      'T..@................2..T~~~~~~~~~~~~~~~T',
      'T..===============.....T~~~~~~~~~~~~~~~T',
      'T....""......=....."".TT~~~~~~~~~~~~~~~T',
      'TTTT.""......=.......TTTdd~~~~~~~~~~~~~T',
      'TTTTTTTTTTTTT1TTTTTTTTTTddddddddd~~~~~~T',
      'T,,,,,,......=......,,,..........ddd~~~T',
      'T,,,,,,..3...=......,,,T..uuuuuuu...dd~T',
      'T,,,,,,......=..*...,,,T..qqqqqqq..S.ddT',
      'TeeeeeeeeeeeeseeeeeeeeeT..qqqLqqq......T',
      'TT...,,......=.....,,,,...........6....T',
      'T^^^^...^^^..=..^^^^^..T.^^^.^^^...^^^^T',
      'T#P##...#M#..=..##G##..T.#H#.#H#...##H#T',
      'T.......4....=.........................T',
      'T..S.........========================>5.',
      'TTTTTTTT=TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      '~~~R....=:":"::":":""::"::TTTT,,,,,,,,TT',
      '~~~Ruuu.=::RR::"::"":::::::"TT,,,,,,,,,T',
      '~~~RqLq.=":::RRR:::::::::::::,,,,,,,,,,T',
      '~~~R..0S="::"R.R:"S::::::::::....,,,,,,T',
      '~~~R....=====================.....8....T',
      '~~~R....=.:::":RRRR:::::.....=...^^^^..T',
      '~~~R....=.:"R:"RLRR""RR......=...##H#..T',
      '~~~dd...=....................=.........T',
      '~~~dd...=.......,,,,,,,,,....=..S^^^^..T',
      '~~~dd....7......,,,,,,,,,....=...##H#..T',
      '~~~ddd..==================9===.........T',
      '~~~~ddd....*....,,,,,,,,,,..........,,,T',
      '~~~~dddddddddd..............,,,,,,,,,,,T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 2,
      max: 6,
      table: [
        ['enda', 35],
        ['lorcamon', 30],
        ['simomon', 25],
        ['owemon', 10],
      ],
    },
    npcs: [
      {
        look: 'farmer',
        face: 'up',
        hideIf: 'starter',
        talk: [
          {
            do: 'say',
            text: 'FARMER: Don’t go into that long grass without a Ranemon of your own! Michael D is up at the old farm.',
          },
        ],
      },
      {
        look: 'higgins',
        face: 'down',
        talk: [
          {
            do: 'if',
            flag: 'starter',
            then: [
              {
                do: 'say',
                text: 'MICHAEL D: Go on now. Nine jerseys, and then Trinity. B&S won’t know what hit them.',
              },
            ],
            else: [
              {
                do: 'say',
                text: 'MICHAEL D: Ah, there you are. B&S have taken the title of Ranemon Champions of Ireland and locked themselves into Trinity.',
              },
              {
                do: 'say',
                text: 'MICHAEL D: Only a trainer wearing all nine county jerseys gets past the Front Gate. I think that trainer is you.',
              },
              {
                do: 'say',
                text: 'MICHAEL D: There’s a pint on the table for every Ranemon in Ireland. Pick whichever one you like.',
              },
              { do: 'starter' },
              { do: 'give', item: 'pint', count: 5 },
              {
                do: 'say',
                text: 'MICHAEL D: And here’s five Pints of Guinness. Throw one at a wild Ranemon and, if it finishes it, it’s yours. Mind yourself!',
              },
            ],
          },
        ],
      },
      {
        look: 'rival',
        face: 'right',
        trainer: 'rival-1',
        sight: 4,
        showIf: 'starter',
      },
      {
        look: 'local',
        face: 'down',
        talk: [
          {
            do: 'say',
            text: 'Ennis gym’s a trad session. Nóra plays the concertina and her Ranemon are as chill as you like.',
          },
        ],
      },
      garda('Clare', 'jersey:clare'),
      ...LEGENDS.CLARE_NPCS,
    ],
    signs: [
      'NEWMARKET-ON-FERGUS. Home of a President.',
      LEGENDS.CLARE_SIGNS.bunratty,
      'ENNIS. McGrattans, Vapes and the Clare gym. Road east to Limerick, and south to the Burren.',
      LEGENDS.CLARE_SIGNS.cliffs,
      LEGENDS.CLARE_SIGNS.dolmen,
      LEGENDS.CLARE_SIGNS.doolin,
    ],
    houses: [
      [
        {
          do: 'say',
          text: 'MAM: Are you not gone yet? Michael D’s up at the old farm asking for you!',
        },
        { do: 'heal' },
        { do: 'say', text: 'MAM: Here, have a cup of tea before you go. You look wrecked.' },
      ],
      ...LEGENDS.CLARE_HOUSES,
    ],
    landmarks: [
      [
        {
          do: 'say',
          text: 'The farmhouse where Michael D grew up. His dog is asleep on the step.',
        },
      ],
      ...LEGENDS.CLARE_LANDMARKS,
    ],
    gym: { trainer: 'gym-clare', place: 'Ennis' },
    east: 'limerick',
    enter: [
      {
        do: 'say',
        text: 'MAM: Wake up! The President’s in the village, visiting the farm he grew up on. And he’s asking for YOU.',
      },
      {
        do: 'say',
        text: 'MAM: Go on up to him. The farmhouse is east of the house. Talk to people with the A button.',
      },
    ],
  },
  {
    id: 'limerick',
    name: 'Limerick City',
    county: 1,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~TTTTuuuuu...T~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~TTTTqqLqq...T~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~....=........R.S.....~~~~~~~T',
      'T~~~~~BB~~~...,=,,,,..........~~~~~~~~~T',
      'T.....==.....,,=,,,,,..T..jjjjjjj..~~~~T',
      '@.....==......,=,,,,,..T..##L####..~~~~T',
      'T.....=========......2.................T',
      'TT..*.==..1...=,,,,,...T..^^^^..,,,,,,,T',
      'TT....==......=,,,,,...T..#H##..,,,,,,,T',
      'T^^^^.==.^^^..=...^^^^^T........,,6,,,,T',
      'T#P##.==.#M#..=...##G##T..............,T',
      'T.....==.4....=..5.............S.......T',
      'T..S..========.======================>3.',
      'TTTTTT=TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T.....=......,,,,,,,,,,,,,..TTTTTTTTTTTT',
      'T.^^^.=.^^^..,,,,,,,,,,,,,..T~~~~~~~~~~T',
      'T.#H#.=.#H#..,,,,,,,7,,,,,..T~~~~~~~~~~T',
      'T.....=.......,,,,,,,,,,,,....~~~~~~~~~T',
      'T.S...=====================...~~~~~~~~~T',
      'T..........................=..~~~~~~~~~T',
      'T.jjjjjjj..................=..~~~~~~~~~T',
      'T.###L###.........RRRRR....=...8...S...T',
      'T................R.....R...=...........T',
      'T...,,,,,,,......R..S......=...........T',
      'T...,,,,,,,......R.....R...=..^^^^^....T',
      'T...,,,9,,,.......RRRRR....=..##L##....T',
      'T...,,,,,,,......................*.....T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 7,
      max: 11,
      table: [
        ['jammon', 35],
        ['boydemon', 25],
        ['lorcamon', 25],
        ['hugomon', 15],
      ],
    },
    npcs: [
      { look: 'rival', face: 'right', trainer: 'rival-2', sight: 4 },
      { look: 'lad', face: 'left', trainer: 'lads-dec', sight: 3 },
      garda('Limerick', 'jersey:limerick'),
      // Sibeal and her dog Norm. Once he's with you she's off to McGrattans to wait for him.
      { look: 'sibeal', face: 'down', hideIf: NORM, talk: SIBEAL_LENDS },
      // The Lime rep, by a row of green e-bikes.
      { look: 'lime', face: 'left', talk: LIME_REP },
      ...LEGENDS.LIMERICK_NPCS,
    ],
    signs: [
      LEGENDS.LIMERICK_SIGNS.treaty,
      LEGENDS.LIMERICK_SIGNS.thomond,
      'LIMERICK. Thomond Park, King John’s Castle and the Shannon. Adare and Lough Gur to the south.',
      LEGENDS.LIMERICK_SIGNS.adare,
      LEGENDS.LIMERICK_SIGNS.gur,
      LEGENDS.LIMERICK_SIGNS.circle,
    ],
    houses: LEGENDS.LIMERICK_HOUSES,
    landmarks: [
      [
        {
          do: 'say',
          text: 'KING JOHN’S CASTLE. Boydemon is said to train at a boxing club by the Treaty Stone.',
        },
      ],
      ...LEGENDS.LIMERICK_LANDMARKS,
    ],
    gym: { trainer: 'gym-limerick', place: 'Thomond Park' },
    west: 'clare',
    east: 'tipperary',
  },
  {
    id: 'tipperary',
    name: 'Thurles, Co. Tipperary',
    county: 2,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T......,,,,,,,..uuuuu..T.....,,,,,,,RRRT',
      'T..^^^.,,,,,,,..qqLqq..T.^^^^^...RRRRRRT',
      'T..#H#.,,,,,,,....=.......##H##...RR.RRT',
      '@.......===========...........S...RRRRRT',
      'TeeeeeeeseeeeeeeeeeeeeeTeeeeeeeeeeeeeeeT',
      'TT..1...=.....,,,,,.*..T......,,,,,,...T',
      'T^^^^...=.....,,,,,..4.T..jjjjjjj..,,,,T',
      'T#P##...=..^^^.........T..###L###..,,5,T',
      'T.......=..#M#...^^^^^.................T',
      'T.......=........##G##.T.....S....,,,,,T',
      'T...S...=..2.....=.....T.........,,,,,,T',
      'T.......=============================>3.',
      'TTTTTTTT=TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T.......=......,,,,,,,,,,......RRRRRRRRT',
      'T~~~~~~~B~~~~~~,,,,,,,,,,.....RRR..RRRRT',
      'T~~~~~~~B~~~~~~,,,,6,,,,,.....RR..7..RRT',
      'T.......=..............................T',
      'T.uuuuu.=.^^^......===================.T',
      'T.qqLqq.=.#H#......=....,,,,,,,,,,,,,,.T',
      'T.......=..........=....,,,,,,,8,,,,,,.T',
      'T..S....============....,,,,,,,,,,,,,,.T',
      'T.....*.....................S..........T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 11,
      max: 15,
      table: [
        ['carlmon', 35],
        ['conemon', 30],
        ['killemon', 20],
        ['paulimon', 15],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'right', trainer: 'tipp-hurler', sight: 3 },
      { look: 'lad', face: 'up', trainer: 'lads-gav', sight: 3 },
      garda('Tipperary', 'jersey:tipperary'),
      { look: 'oldman', face: 'down', talk: DONKEY_VET },
      ...LEGENDS.TIPPERARY_NPCS,
    ],
    signs: [
      LEGENDS.TIPPERARY_SIGNS.hayes,
      LEGENDS.TIPPERARY_SIGNS.holycross,
      'THURLES. Semple Stadium, home of hurling. Gym door locked: see the old man.',
      LEGENDS.TIPPERARY_SIGNS.cahir,
      LEGENDS.TIPPERARY_SIGNS.aherlow,
    ],
    houses: [
      [
        {
          do: 'say',
          text: 'Conemon trains on the Semple pitch on his own, long after everyone’s gone home.',
        },
      ],
      ...LEGENDS.TIPPERARY_HOUSES,
    ],
    landmarks: [
      [
        {
          do: 'say',
          text: 'THE ROCK OF CASHEL. You can see half of Munster from up here.',
        },
      ],
      ...LEGENDS.TIPPERARY_LANDMARKS,
    ],
    gym: {
      trainer: 'gym-tipperary',
      place: 'Semple Stadium',
      look: 'saoirse',
      lock: {
        flag: HM,
        locked:
          'The gym door has a pattern lock: 400 little coloured tiles. Nobody in Thurles has ever worked it out. Maybe the old man by the gym knows something.',
        opened:
          'You used HM NEURODIVERGENT! You spot the pattern in the tiles straight away. The door clicks open.',
      },
    },
    west: 'limerick',
    east: 'kilkenny',
  },
  {
    id: 'kilkenny',
    name: 'Kilkenny City',
    county: 3,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T....^^^^^^^^......^^^.T~~...jjjjjjj...T',
      'T....####L###......#M#.T~~...###L###.R.T',
      'T.......=.............*.~~.......S.....T',
      '@==============....,,,,.BB.............T',
      'T.....=.......=....,,,,T~~..^^^^^......T',
      'T,,,,,=..1....=..2.,,,,T~~..#H###..,,,,T',
      'T,,,,,=.......=.........~~.......,,,4,,T',
      'T,,,,,=.^^^^..=..^^^^^.T~~..^^^^^^.,,,,T',
      'T.....=.#P##..=..##G##.T~~..##H###.,,,,T',
      'T..S..=.......=........T~~.........S...T',
      'T.....=========.=========BB==========>3.',
      'TTTTTT=TTTTTTTTTTTTTTTTTT~~TTTTTTTTTTTTT',
      'T.....=......,,,,,,,,,...~~.....^^^^^..T',
      'T.RRRRRR.....,,,,,,5,,...~~.....#H###..T',
      'T.RRRLRR.....,,,,,,,,,...~~............T',
      'T..S..=.......=..........BB=====.......T',
      'T.....=========..........~~.....,,,,,,.T',
      'T..............jjjjjjj...~~..6..,,,,,,.T',
      'T..*...........##L####...~~.....,,,,,,.T',
      'T........S.....=.........~~.....,,7,,,.T',
      'T..............=.........~~.....,,,,,,.T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 15,
      max: 19,
      table: [
        ['enda', 40],
        ['robinmon', 35],
        ['steadmon', 25],
      ],
    },
    npcs: [
      { look: 'rival', face: 'down', trainer: 'rival-3', sight: 4 },
      { look: 'trainer', face: 'left', trainer: 'kk-comic', sight: 3 },
      garda('Kilkenny', 'jersey:kilkenny'),
      ...LEGENDS.KILKENNY_NPCS,
    ],
    signs: [
      LEGENDS.KILKENNY_SIGNS.canice,
      'KILKENNY. The Cat Laughs comedy festival is on at the castle. Over the Nore for the Medieval Mile.',
      LEGENDS.KILKENNY_SIGNS.mile,
      LEGENDS.KILKENNY_SIGNS.dunmore,
      LEGENDS.KILKENNY_SIGNS.jerpoint,
    ],
    houses: LEGENDS.KILKENNY_HOUSES,
    landmarks: [
      [
        {
          do: 'say',
          text: 'KILKENNY CASTLE. Robinmon is filming content on the lawn. He waves at the camera, not at you.',
        },
      ],
      ...LEGENDS.KILKENNY_LANDMARKS,
    ],
    gym: { trainer: 'gym-kilkenny', place: 'Kilkenny Castle' },
    west: 'tipperary',
    east: 'laois',
  },
  {
    id: 'laois',
    name: 'Stradbally, Co. Laois',
    county: 4,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,,..^^^^^^^...TTTT.....RRRRRR.T',
      'T,,,,,,,,,,..###G###...TT......RRuuuRR.T',
      'T,,,,1,,,,,.....=.........S....RRqLqRR.T',
      '@=========......=..*......=.....RR.RR..T',
      'T........=......=.........=......=.....T',
      'T..^^^^..=..2...=..^^^....=......=.....T',
      'T..#P##..=..........#M#...============.T',
      'T........===========================5=.T',
      'T,,,,,,,,,,,,,,,,,,,,,=.,,,,,,,,,,,,.=.T',
      'T,,,,,,,,,3,,,,,,,,,,,=.,,,,,,6,,,,,.=.T',
      'T.....S..............================>4.',
      'TTTTTTTTTTTTTTTTTTTTT=TTTTTTTTTTTTTTTTTT',
      'T....................=.................T',
      'T.^^^^^^^^.....RRRRR.=..^^^^...TTTTTTTTT',
      'T.##H#####...RRRRRRRR=..#H##..TTRRRRRRRT',
      'T.........RRRRRRRRRR.=........TRRRRRRRRT',
      'T....S.....RRRRRRRR..=====.....RRRR7RRRT',
      'T........................=.....RRR...RRT',
      'T.....T..,,,,,,,,,.......=.....RR....RRT',
      'T....TTT9,,,,8,,,,...S...=.............T',
      'T.....T..,,,,,,,,,.......=.............T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 19,
      max: 23,
      table: [
        ['killemon', 30],
        ['thilomon', 20],
        ['crampemon', 20],
        ['oismon', 15],
        ['olliemon', 15],
      ],
    },
    npcs: [
      { look: 'lad', face: 'down', trainer: 'lads-ringleader', sight: 3 },
      { look: 'trainer', face: 'right', trainer: 'laois-raver', sight: 3 },
      {
        look: 'local',
        face: 'up',
        talk: [
          {
            do: 'say',
            text: 'Thilomon’s playing back to back in the dance tent. Oismon and Olliemon are only ever seen backstage, together.',
          },
        ],
      },
      garda('Laois', 'jersey:laois'),
      ...LEGENDS.LAOIS_NPCS,
    ],
    signs: [
      LEGENDS.LAOIS_SIGNS.dunamase,
      'ELECTRIC PICNIC. The main stage is the Laois gym. Headliner: DJ Stradbally.',
      LEGENDS.LAOIS_SIGNS.emo,
      LEGENDS.LAOIS_SIGNS.bloom,
    ],
    houses: LEGENDS.LAOIS_HOUSES,
    landmarks: LEGENDS.LAOIS_LANDMARKS,
    gym: { trainer: 'gym-laois', place: 'Electric Picnic' },
    west: 'kilkenny',
    east: 'offaly',
  },
  {
    id: 'offaly',
    name: 'Clonmacnoise, Co. Offaly',
    county: 5,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'T...^^^^^^^......^^^^^.TT....uuuuuuu...T',
      'T...###G###......##L##.T.....qqqLqqq...T',
      '@======.=.............*.....S..........T',
      'Tbbbbb=...=====..1.....................T',
      'Tbbbbb=...=bbbbbbbbb...T.,,,,,,..jjjjj.T',
      'Tbbbbb=...=bbbbbbbbb...T.,,,4,,..##H##.T',
      'T..^^^=.^^^=bbbb2bbb...T.,,,,,,........T',
      'T..#P#=.#M#=...........T.........S.....T',
      'T..S..=....==========================>3.',
      'TTTTTTTTTTT=TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T..........=.................bbbbbbbbbbT',
      'T.uuuuu....=....RRR..RRR.....bbbbbbbbbbT',
      'T.qqLqq....=.......R.R.......bbbb6bbbbbT',
      'T......7...=....S..RRR.......bbbbbbbbbbT',
      'T....^^^^^.=================.....S.....T',
      'T....#H###..........,,,,,,,,,,,........T',
      'T...................,,,,,5,,,,,..uuuu..T',
      'T...S..........*....,,,,,,,,,,,..qLqq..T',
      'T...................,,,,,,,,,,,........T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 23,
      max: 27,
      table: [
        ['simomon', 30],
        ['steadmon', 30],
        ['hugomon', 20],
        ['skehemon', 20],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'down', trainer: 'offaly-monk', sight: 3 },
      { look: 'local', face: 'up', trainer: 'offaly-turf', sight: 2 },
      garda('Offaly', 'jersey:offaly'),
      ...LEGENDS.OFFALY_NPCS,
    ],
    signs: [
      LEGENDS.OFFALY_SIGNS.birr,
      LEGENDS.OFFALY_SIGNS.tullamore,
      'CLONMACNOISE. The monastery on the Shannon. Mind the Bog of Allen.',
      LEGENDS.OFFALY_SIGNS.boora,
      LEGENDS.OFFALY_SIGNS.bog,
      LEGENDS.OFFALY_SIGNS.leap,
    ],
    houses: LEGENDS.OFFALY_HOUSES,
    landmarks: [
      [
        {
          do: 'say',
          text: 'A ROUND TOWER. Simomon is said to be blazing up in a quiet corner of the bog.',
        },
      ],
      ...LEGENDS.OFFALY_LANDMARKS,
    ],
    gym: { trainer: 'gym-offaly', place: 'Clonmacnoise' },
    west: 'laois',
    east: 'westmeath',
  },
  {
    id: 'westmeath',
    name: 'Athlone and Mullingar, Co. Westmeath',
    county: 6,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T..^^^^^.....,,,,,,,,..T..jjjjjjj......T',
      'T..##L##.....,,,,,,,,..T..###L###...S..T',
      'T....=.......,,,,1,,,..................T',
      '@=========.........=...T...............T',
      'T~~~~~~~B~~~~~~~~~~=~~~T....qqqq..^^^^^T',
      'T~~~~~~~B~~~~~~~~~~=~~~T....qLqq..##H##T',
      'T.......=..........=...................T',
      'T^^^^...=..^^^..^^^^^^.T..^^^^^.,,,,,,.T',
      'T#P##...=..#M#..###G##.T..##H##.,,,,4,.T',
      'T.......=.........*....................T',
      'T..S....=====2=======================>3.',
      'TTTTTTTT=TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T.......=....~~~~~~~~~~~~~~~~...RRR....T',
      'T.jjjj..=...~~~~~~~~~~~~~~~~~~.RRRRR...T',
      'T.#L##..=...~~~~~~~~~~~~~~~~~~.RR.RR...T',
      'T.......=....~~~~~~~~~~~~~~~~...S......T',
      'T..S....=.......5............,,,,,,,,..T',
      'T.......=================....,,,,6,,,..T',
      'T....,,,,,,,,,,,.......=.....,,,,,,,,..T',
      'T....,,,,7,,,,,,.......=..S..,,,,,,,,..T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 27,
      max: 31,
      table: [
        ['lorcamon', 30],
        ['carlmon', 25],
        ['robinmon', 25],
        ['conemon', 20],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'left', trainer: 'wm-fan', sight: 3 },
      { look: 'lad', face: 'up', trainer: 'lads-fiach', sight: 2 },
      garda('Westmeath', 'jersey:westmeath'),
      ...LEGENDS.WESTMEATH_NPCS,
    ],
    signs: [
      LEGENDS.WESTMEATH_SIGNS.cathedral,
      'MULLINGAR. The pop star is home for one night only.',
      LEGENDS.WESTMEATH_SIGNS.uisneach,
      LEGENDS.WESTMEATH_SIGNS.fore,
      LEGENDS.WESTMEATH_SIGNS.derravaragh,
    ],
    houses: LEGENDS.WESTMEATH_HOUSES,
    landmarks: [
      [
        {
          do: 'say',
          text: 'SEAN’S BAR, ATHLONE. The oldest pub in Ireland. Lorcamon is at the bar.',
        },
        {
          do: 'if',
          flag: 'gift:seans',
          then: [{ do: 'say', text: 'LORCAMON: Sound. Mind how you go.' }],
          else: [
            { do: 'say', text: 'LORCAMON: You look like you need a round. Here.' },
            { do: 'give', item: 'mulligans', count: 3 },
            { do: 'flag', flag: 'gift:seans' },
          ],
        },
      ],
      LEGENDS.WESTMEATH_LANDMARKS[0],
      [
        {
          do: 'say',
          text: 'ATHLONE CASTLE. Guarding the bridge over the Shannon since 1210, where Leinster meets Connacht. In the siege of 1691 its walls took a battering for ten days.',
        },
      ],
      LEGENDS.WESTMEATH_LANDMARKS[1],
    ],
    gym: { trainer: 'gym-westmeath', place: 'Mullingar' },
    west: 'offaly',
    east: 'meath',
  },
  {
    id: 'meath',
    name: 'Brú na Bóinne, Co. Meath',
    county: 7,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T.......,,,,,,,..^^^^^.T~~~~~~~~~~~~~~~T',
      'T..^^^..,,,1,,,..##G##.T~~~~~~~~~~~~~~~T',
      'T..#M#..,,,,,,,....=..........8........T',
      '@=========.........=...T...............T',
      'T........=.........=...T..jjjj.....RRR.T',
      'T..^^^^..=...2.....=...T..#H##.....RRR.T',
      'T..#P##..=.........=...T............S..T',
      'T........==========....................T',
      'T.*...............=....T..uuuuuuu..,,4,T',
      'T..^^^^^^.........=....T..qqqqqqq..,,,.T',
      'T..###L##.........=....T..qqqLqqq...S..T',
      'T..S..............===================>3.',
      'TTTTTTTTTTTTTTTTTT=TTTTTTTTTTTTTTTTTTTTT',
      'T.................=.........RRRRR......T',
      'T...RRRRR.........=........RRRRRRR.....T',
      'T..RRRRRRR....5...=.......RRRRLRRR.....T',
      'T..RRRLRRR........=.............S......T',
      'T......S.....======......6.............T',
      'T......,,,,,,,,,,,,,,,,,..........,,,,.T',
      'T......,,,,,,,,,,7,,,,,,..........,,,,.T',
      'T..*...,,,,,,,,,,,,,,,,,...S......,,,,.T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 31,
      max: 35,
      table: [
        ['steadmon', 25],
        ['jammon', 25],
        ['simomon', 20],
        ['vinnimon', 20],
        ['enda', 10],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'down', trainer: 'meath-druid', sight: 3 },
      { look: 'trainer', face: 'left', trainer: 'meath-shopper', sight: 3 },
      garda('Meath', 'jersey:meath'),
      ...LEGENDS.MEATH_NPCS,
    ],
    signs: [
      LEGENDS.MEATH_SIGNS.slane,
      LEGENDS.MEATH_SIGNS.trim,
      'BRÚ NA BÓINNE. The gym is in the passage tomb at Newgrange.',
      LEGENDS.MEATH_SIGNS.knowth,
      LEGENDS.MEATH_SIGNS.loughcrew,
      LEGENDS.MEATH_SIGNS.boyne,
    ],
    houses: LEGENDS.MEATH_HOUSES,
    landmarks: [
      [
        {
          do: 'say',
          text: 'THE HILL OF TARA. The old kings of Ireland were crowned here. The wind is fierce.',
        },
      ],
      ...LEGENDS.MEATH_LANDMARKS,
    ],
    gym: { trainer: 'gym-meath', place: 'Newgrange' },
    west: 'westmeath',
    east: 'kildare',
  },
  {
    id: 'kildare',
    name: 'The Curragh, Co. Kildare',
    county: 8,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T......,,,,,,,,,,,.....T..jjjjjjj......T',
      'T..^^^.,,,,,,,,,,,.^^^.T..###L###...S..T',
      'T..#M#.,,,,1,,,,,,.#P#.................T',
      '@==========......=.....T...............T',
      'T........=.......=.........^^^^^^^.....T',
      'Tffffffff=ffffffff..*..T...###H###.....T',
      'T........=......................f......T',
      'T..^^^^^^^^......2.....T..ffffffff.....T',
      'T..####G###............T..f,,,,,,,,,...T',
      'T......=.........=........f,,,,,6,,,5ffT',
      'T..S...===========..================>43.',
      'TTTTTTT=TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T......=.......................RRRR....T',
      'T.^^^^^^^^^..=..........7.....RRRRRR...T',
      'T.####H####..=................RRR..R...T',
      'T......S.....=.........S..........8....T',
      'T~~~~~~~~~~~~B~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'T......,,,,,,=,,,,,,.......fffffffff...T',
      'T..9...,,,,,,=,,,,,,.......f,,,,,,,f...T',
      'T......,,,,,,=======.......f,,,0,,,f...T',
      'T..............S...........f,,,,,,,f...T',
      'T......................................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 35,
      max: 39,
      table: [
        ['owemon', 40],
        ['boydemon', 40],
        ['gibbsmon', 20],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'down', trainer: 'kildare-soldier', sight: 3 },
      { look: 'rival', face: 'down', trainer: 'rival-4', sight: 3 },
      garda('Kildare', 'jersey:kildare'),
      // Enda stands in the road to Dublin until you've met him, then steps aside.
      ENDA_IN_ROAD,
      ENDA_BY_ROAD,
      ...LEGENDS.KILDARE_NPCS,
    ],
    signs: [
      LEGENDS.KILDARE_SIGNS.town,
      'THE CURRAGH. Army camp. Gibbsmon was last seen calling in bombers.',
      LEGENDS.KILDARE_SIGNS.castletown,
      LEGENDS.KILDARE_SIGNS.allen,
      LEGENDS.KILDARE_SIGNS.canal,
    ],
    houses: LEGENDS.KILDARE_HOUSES,
    landmarks: LEGENDS.KILDARE_LANDMARKS,
    gym: { trainer: 'gym-kildare', place: 'The Curragh' },
    arrive: ENDA_CALLS,
    west: 'meath',
    east: 'dublin',
  },
  {
    id: 'dublin',
    name: 'Dublin City',
    county: 9,
    // A city: Georgian slate roofs, pavements and tarmac, with grass only in the parks.
    slate: true,
    // Georgian terraces of brick and painted houses, each with its own coloured door.
    terraces: 'georgian',
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,T,,.v^^^^^^^v^^^^^v^^^^^v^^^vTvnnnnnnnnnnv,,,T',
      'T,,T,,,,,,,,,.v###L###v##H##a##H##v#M#vTvnxxxxxxxxnv,,,T',
      'T,,,,,1,,,,,T.SvvvavvvvvvvvSavvvvvvvavvTvnxxxxxxxxnvS,,T',
      'T,,,,,,,,T,,,.vvvvavvv6vvvvvavvvvvvvav*Tvnnnnnnnnnnv,,,T',
      'T,T,,,,,,,,,,.vvvvavvvvvvvvvavvvvvvvavvTvvvvvvvvvvvvvv,T',
      '@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaacaaavaaaaaaaaaaaaaaaaT',
      'Tvvvv5vvvvavvvvvvvavvvvvvvvvavvvvvvvvvvvvvvvvvvvvvvvddRT',
      'Tvvvvvvvvvavvvvvvvavvvvvvvvvavvvvvvvvvvvvvvvvvvvvvvdd~RT',
      'T~~~~~~~~~B~~~~~~~B~~~~~~~~~B~~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~B~~~~~~~B~~~~~~~~~B~~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'Taaaaaaaaaaaaacaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaadd~~T',
      'Tvvvvvvv8vavvvvvvvavvvvv2vvvavv^^^^^^vvvvvvvvvvvvvSdd~~T',
      'Tvv^^^^vv^^^^vvvvva^^^vvvvvvavv######vvvvvvvvvvvvvvdd~~T',
      'Tvv#P##vv#H##vvvvva#L#vvvvvvavv##H###vvvvvvvvvvvvvvdd~~T',
      'TvvSvvvvvvvvvvvvvvavvvvvvvvvavSvvvvvvvvvvvvvvvvvvvvdd~~T',
      'Taaaaaaacaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa>4v',
      'Tvvvvavvvvvvvavv3vvvv^^^vvvvavvvvvvvvvvvvvvvvvvvvvvdd~~T',
      'Tvvvvavvvvvvvavvvvvvv#H#7vvvavvvvvvvvvvvvvvvvvvvvvvdd~~T',
      'Tvvv^^^^vvv^^^^^^^vvvvvvvvvvavvvvvvvvvvvvvvvvvvvvvvdd~~T',
      'Tvvv#L##Svv#H###H#vvvvvvvvvvavvvv9vvvvvvvvvvvvvvvvSdd~~T',
      'T..........vvvvvvvvvvvvvv^^^^^^^vvvvvvvvvvvvvvvvvvvdd~~T',
      'T,,,,,,,T,.vvvvvvvvvvvvvv#######vvvvvvvvvvvvvvvvvvvdd~~T',
      'T,,,T,,,,,.vvvvvvvvvvvvvS###L###vvvvvvvvvvvvvvvvvvvdd~~T',
      'T,,,,,,,,,.vvvvvvvvvvvvvvvvvvv0vvvvvvvvvvvvvvvvvvvvdd~~T',
      'TTTTTTTTTT.TTTTTTTTTTTTTTTTTTTTTTvTTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,.vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvdd~~T',
      'T,,qqqqqqq.vv^^^^^^^vvvvjjjjjjjvvvvvvvvvvvvvvuuuvvvdd~~T',
      'T,,qqqLqqq.vv##H####vvvv###L###vvvvvvvvvvvvvvqLqvvSdd~~T',
      'T..........vvvvvvvvvvvvvvvvvvvvvSvvvvvvvvvvvvvvvvvvdd~~T',
      'Taaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaadd~~T',
      'Tvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvdd~~T',
      'Tvv^^^^^^vvvvvSvvvvvv^^^^^vvvvvvvRRRRRRRvvvvvvvvvvvdd~~T',
      'Tvv##H###vvvvvvvvvvvv##H##vvvvvvRRRRRRRRRvvvvvvvvvvdd~~T',
      'TvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvRRRRRRRvvvvvvvvvvvdd~~T',
      'T,,,,,,,,,,vvvvvvvvvvvvvvvvvvSvvvvvvRRRvvvvv,,,,,,,dd~~T',
      'T,,,,,,,,,,vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv,,,,,,,dd~~T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 40,
      max: 46,
      table: [
        ['carlmon', 7],
        ['steadmon', 7],
        ['enda', 7],
        ['oismon', 6],
        ['olliemon', 6],
        ['hugomon', 7],
        ['jammon', 7],
        ['lorcamon', 7],
        ['simomon', 7],
        ['boydemon', 7],
        ['conemon', 7],
        ['killemon', 7],
        ['owemon', 7],
        ['robinmon', 7],
        ['paulimon', 7],
        ['skehemon', 7],
        ['vinnimon', 7],
        ['crampemon', 7],
        ['gibbsmon', 3],
        ['thilomon', 3],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'down', trainer: 'dublin-jogger', sight: 3 },
      { look: 'rival', face: 'left', trainer: 'rival-5', sight: 4 },
      { look: 'lad', face: 'up', trainer: 'dublin-stag', sight: 2 },
      {
        look: 'guard',
        face: 'left',
        talk: [
          {
            do: 'say',
            text: 'PORTER: Trinity College is through here. You’ll need all nine county jerseys to get past the Front Gate.',
          },
        ],
        hideIf: 'jersey:all',
      },
      { look: 'local', face: 'down', talk: OLD_WOMAN },
      { look: 'busker', face: 'down', talk: BUSKER },
      RENT_NEIGHBOUR,
      RENT_GARDA,
      MESCAL,
      BOUNCER,
    ],
    signs: [
      'DUBLIN. The Phoenix Park, the quays and Temple Bar. Trinity College to the east.',
      'O’CONNELL STREET. The GPO, the Spire, and a man selling phone chargers outside Supermac’s.',
      LEGENDS.DUBLIN_SIGNS.croke,
      LEGENDS.DUBLIN_SIGNS.poolbeg,
      'TEMPLE BAR. A pint here costs more than a Ranemon. Mind the hen parties.',
      'SILICON DOCKS. Everyone here works in tech, and nobody can tell you what they actually do.',
      'CONNOLLY STATION. Trains to Greystones, Bundoran and beyond. Tickets inside.',
      LEGENDS.DUBLIN_SIGNS.bull,
      'THE RAVE CAVE. Open all night, every night. Everyone inside is up for a battle.',
      LEGENDS.DUBLIN_SIGNS.fortyfoot,
      LEGENDS.DUBLIN_SIGNS.liberties,
      LEGENDS.DUBLIN_SIGNS.brazen,
      LEGENDS.DUBLIN_SIGNS.molly,
    ],
    // The GPO and Supermac's on O'Connell Street come first in reading order, then the Temple
    // Bar house, then The Temple Bar pub: saves inside the houses after them are moved along
    // (schema 5 in lib/story/save.ts).
    houses: [
      GPO_DOOR,
      SUPERMACS_DOOR,
      [
        {
          do: 'say',
          text: 'TEMPLE BAR. A man in a Dublin jersey is selling Blue Ghosts out of a sports bag. You decide to buy from Vapes instead.',
        },
        ...TEMPLE_BAR,
      ],
      TEMPLE_BAR_PUB_DOOR,
      RENT_ARRIVE,
      [
        {
          do: 'say',
          text: 'LOCAL: This is a Georgian house. The box room under the stairs is €2,400 a month, and there’s a queue of forty for the viewing.',
        },
      ],
      [
        {
          do: 'say',
          text: 'LOCAL: Eleven of us live here. That lad on the couch? Never seen him before in my life. He’s been here since March.',
        },
      ],
      ...LEGENDS.DUBLIN_HOUSES,
    ],
    houseRooms: { 0: GPO_ROOM, 1: SUPERMACS_ROOM, 3: TEMPLE_BAR_PUB_ROOM, 4: RENT_ROOM },
    landmarks: [
      [
        { do: 'say', text: 'ST JAMES’S GATE. The smell of roasting barley.' },
        {
          do: 'if',
          flag: 'gift:gate',
          then: [{ do: 'say', text: 'BREWER: Go on, the Perfect Pour is yours. Use it well.' }],
          else: [
            {
              do: 'say',
              text: 'BREWER: Nine jerseys? Then you’ve earned this. Two-part pour, 119.5 seconds.',
            },
            { do: 'give', item: 'perfect-pour', count: 1 },
            { do: 'flag', flag: 'gift:gate' },
          ],
        },
      ],
      HELLFIRE,
      STATION_ARRIVE,
      RAVE_ARRIVE,
      ...LEGENDS.DUBLIN_LANDMARKS,
    ],
    landmarkLocks: {
      1: {
        flag: LEGEND_FLAG,
        locked:
          'THE HELLFIRE CLUB. An old hunting lodge, boarded up for two hundred years. The door won’t budge.',
        opened:
          'The three coral beads glow warm in your bag. The boards fall away from the door on their own…',
      },
    },
    landmarkRooms: { 1: HELLFIRE_ROOM, 2: stationRoom(), 3: raveRoom() },
    // Once you're Champion, Cramps comes running up the street the first time you're back out.
    arrive: [...CRAMPS_ARRIVE, ...PROVAI_ARRIVE],
    west: 'kildare',
    east: 'trinity',
  },
  {
    id: 'trinity',
    name: 'Trinity College Dublin',
    county: 10,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T######################T',
      'T#FFFFFFFFF6FFFFFFFFFF#T',
      'T#FFFF1FFFF2FFFF3FFFFF#T',
      'T#FFFFFFFFFFFFFFFFFFFF#T',
      'T####FFF#####F#######F#T',
      'T....=..7....=.......=.T',
      '@=====.......=.......=.T',
      'T............=.......=.T',
      'T..hh...4..==K==...hh=.T',
      'T..hh....5..===....hh=.T',
      'T....................=.T',
      'T..S.................=.T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    npcs: [
      { look: 'scholar', face: 'down', trainer: 'scholar-1', sight: 2 },
      { look: 'scholar', face: 'down', trainer: 'scholar-2', sight: 2 },
      { look: 'scholar', face: 'down', trainer: 'scholar-3', sight: 2 },
      {
        look: 'bns',
        face: 'right',
        hideIf: 'champion',
        trainer: 'bns',
        // There under the Campanile from the start, but they won't fight until the last scholar
        // in the Long Room is beaten.
        readyIf: 'beat:scholar-3',
        talk: [
          {
            do: 'say',
            text: 'B&S: Not so fast. Get past our three scholars in the Long Room first, then come back to us.',
          },
        ],
      },
      HIGGINS,
      { look: 'bns', face: 'down', showIf: 'rematch', trainer: 'bns-rematch' },
      { look: 'alex', face: 'left', trainer: 'trinity-alex', sight: 3 },
    ],
    signs: ['TRINITY COLLEGE. Long Room upstairs. The Campanile in Front Square.'],
    west: 'dublin',
    enter: [
      {
        do: 'say',
        text: 'Three scholars guard the Long Room. B&S wait under the Campanile.',
      },
    ],
    after: TRINITY_BALL,
  },
  {
    id: 'donegal',
    name: 'Bundoran, Co. Donegal',
    county: 9,
    // Grown east and south with the county's landmarks: 2D only, like everything new.
    flat: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      '~~~~~~~T...^^^^...^^^^.T..uuuuuu....RRRT',
      '~~~~~~~T...#P##...#M##.T..qqLqqq...RRRRT',
      '~~~~~~2:.......=.....S.T...........RRRRT',
      '~~~~~~~:.....1.=............S.......RR.T',
      '~~~~~~~:,,,,...=....3@.T...............T',
      '~~~~~~~:,,,,...=.......T....,,,,,,,4,..T',
      '~~~~~~~:,,,,...================,,,,,,,,T',
      '~~~~~~~::......S.........^^^...........T',
      '~~~~~~~~~~:...,,,,,....T.#H#.......S...T',
      '~~~~~~~~~~~:..,,,,,....T...............T',
      'TTTTTTTTTTTTT.TTTTTTTTTTTTTTTTTTTTTTTTTT',
      '~~~~~~~~~~~R....=......................T',
      '~~~~~~~~~RRR....=..wwwww....uuuuuu..,,,T',
      '~~~~~~~~R~R.....=..w...w....qqqqLq..,,,T',
      '~~~~~~~~~R......=..w.S.w............,,,T',
      '~~~~~~~~~R..5...=..ww.ww.....S......,,,T',
      '~~~~~~~~RR......================.......T',
      '~~~~~~~RRR..S.............,,,,,,,......T',
      '~~~~~~RRRR................,,,6,,,......T',
      '~~~~~~~RRR......*.........,,,,,,,......T',
      '~~~~~~~~RR.........7......,,,,,,,..8...T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 46,
      max: 52,
      table: [
        ['jammon', 20],
        ['simomon', 20],
        ['olliemon', 15],
        ['enda', 15],
        ['owemon', 15],
        ['steadmon', 15],
      ],
    },
    npcs: [
      { look: 'josh', face: 'down', talk: JOSH },
      {
        look: 'poseidon',
        face: 'right',
        showIf: TABLET_TAKEN,
        hideIf: BEAT_POSEIDON,
        trainer: 'poseidon',
      },
      { look: 'conductor', face: 'left', talk: homeward('donegal') },
      ...LEGENDS.DONEGAL_NPCS,
    ],
    signs: [
      'BUNDORAN STATION. Trains to Dublin Connolly. Surfboards in the guard’s van, please.',
      LEGENDS.DONEGAL_SIGNS.glenveagh,
      'TULLAN STRAND. Locals say POSEIDON himself lives out on the rocks. Nobody has ever seen him.',
      LEGENDS.DONEGAL_SIGNS.errigal,
      LEGENDS.DONEGAL_SIGNS.grianan,
      LEGENDS.DONEGAL_SIGNS.castle,
      LEGENDS.DONEGAL_SIGNS.fairy,
    ],
    houses: LEGENDS.DONEGAL_HOUSES,
    landmarks: LEGENDS.DONEGAL_LANDMARKS,
  },
  GREYSTONES,
  BRIGHTON,
  BELGIUM,
  AIRPORT,
  STANSTED,
  LONDON,
  ...PL_MAPS,
  SHOREDITCH,
  GALWAY,
];

/** The rooms behind every door. */
export const INTERIORS = [...MAPS.flatMap(interiorsOf), ...HALL_ROOMS, ...palaceRooms(LONDON)];

const BY_ID = new Map([...MAPS, ...INTERIORS].map((m) => [m.id, m]));
export function mapById(id: string): GameMap {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

const AFTER = new Map<string, GameMap>();
/** A map in its `after` form, such as the Trinity Ball: one object per map, so it can be cached. */
export function afterOf(map: GameMap): GameMap | null {
  if (!map.after) return null;
  if (!AFTER.has(map.id)) {
    AFTER.set(map.id, { ...map, ...map.after, after: undefined });
  }
  return AFTER.get(map.id)!;
}

/** Every map's and room's `after` form. */
export const AFTER_MAPS = [...MAPS, ...INTERIORS].flatMap((m) => afterOf(m) ?? []);

/** The map with an id as it is now: in its `after` form once that flag is set. */
export function mapFor(id: string, flags: readonly string[]): GameMap {
  const map = mapById(id);
  return map.after && flags.includes(map.after.flag) ? afterOf(map)! : map;
}

/** The map you're on, or the one outside if you're in a building. */
export const outsideOf = (map: GameMap) => (map.inside ? mapById(map.inside.map) : map);

/** Only drawn in 2D: the map, or the room, or the map outside the room, is `flat`. */
export const isFlat = (map: GameMap) => !!(map.flat || outsideOf(map).flat);

export const COUNTIES = MAPS.slice(0, 9).map((m) => m.id);

export { phone };
