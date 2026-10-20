import type { GameMap } from '@/lib/story/world';
import { interiorsOf } from './interiors';

/**
 * The road from Co. Clare to Trinity College Dublin, one map per county, walked west to east.
 * Each county has a town with a pub (heals), a corner shop and a gym, and a Garda at the east
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

export const MAPS: GameMap[] = [
  {
    id: 'clare',
    name: 'Newmarket-on-Fergus, Co. Clare',
    county: 0,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T^^^^.....TTTT..^^^^^..T',
      'T#H##..S..TTTT..##L##..T',
      'T..@................2..T',
      'T..===============.....T',
      'T....""......=....."".TT',
      'TTTT.""......=.......TTT',
      'TTTTTTTTTTTTT1TTTTTTTTTT',
      'T,,,,,,......=......,,,T',
      'T,,,,,,..3...=......,,,T',
      'T,,,,,,......=..*...,,,T',
      'T....,,......=.....,,,,T',
      'TT...,,......=.....,,,,T',
      'T^^^^...^^^..=..^^^^^..T',
      'T#P##...#M#..=..##G##..T',
      'T.......4....=.........T',
      'T..S.........========>5.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
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
    ],
    signs: [
      'NEWMARKET-ON-FERGUS. Home of a President.',
      'ENNIS. Pub, shop and the Clare gym. Road east to Limerick.',
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
    ],
    landmarks: [
      [
        {
          do: 'say',
          text: 'The farmhouse where Michael D grew up. His dog is asleep on the step.',
        },
      ],
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
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~TTTT^^^^^...T',
      'T~~~~~~~~~~TTTT##L##...T',
      'T~~~~~~~~~~....=.......T',
      'T~~~~~BB~~~...,=,,,,...T',
      'T.....==.....,,=,,,,,..T',
      '@.....==......,=,,,,,..T',
      'T.....=========......2.T',
      'TT..*.==..1...=,,,,,...T',
      'TT....==......=,,,,,...T',
      'T^^^^.==.^^^..=...^^^^^T',
      'T#P##.==.#M#..=...##G##T',
      'T.....==......=........T',
      'T..S..========.======>3.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
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
    ],
    signs: ['LIMERICK. Thomond Park, King John’s Castle and the Shannon.'],
    landmarks: [
      [
        {
          do: 'say',
          text: 'KING JOHN’S CASTLE. Boydemon is said to train at a boxing club by the Treaty Stone.',
        },
      ],
    ],
    gym: { trainer: 'gym-limerick', place: 'Thomond Park' },
    west: 'clare',
    east: 'tipperary',
  },
  {
    id: 'tipperary',
    name: 'Thurles, Co. Tipperary',
    county: 2,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T......,,,,,,,..^^^^^..T',
      'T..^^^.,,,,,,,..##L##..T',
      'T..#H#.,,,,,,,....=....T',
      '@.......===========....T',
      'T.......=.....,,,,,....T',
      'TT..1...=.....,,,,,.*..T',
      'T^^^^...=.....,,,,,....T',
      'T#P##...=..^^^.........T',
      'T.......=..#M#...^^^^^.T',
      'T.......=........##G##.T',
      'T...S...=..2.....=.....T',
      'T.......=============>3.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 11,
      max: 15,
      table: [
        ['carlmon', 40],
        ['conemon', 35],
        ['killemon', 25],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'right', trainer: 'tipp-hurler', sight: 3 },
      { look: 'lad', face: 'up', trainer: 'lads-gav', sight: 3 },
      garda('Tipperary', 'jersey:tipperary'),
    ],
    signs: ['THURLES. Semple Stadium, home of hurling.'],
    houses: [
      [
        {
          do: 'say',
          text: 'Conemon trains on the Semple pitch on his own, long after everyone’s gone home.',
        },
      ],
    ],
    landmarks: [
      [
        {
          do: 'say',
          text: 'THE ROCK OF CASHEL. You can see half of Munster from up here.',
        },
      ],
    ],
    gym: { trainer: 'gym-tipperary', place: 'Semple Stadium' },
    west: 'limerick',
    east: 'kilkenny',
  },
  {
    id: 'kilkenny',
    name: 'Kilkenny City',
    county: 3,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T....^^^^^^^^......^^^.T',
      'T....####L###......#M#.T',
      'T.......=.............*T',
      '@==============....,,,,T',
      'T.....=.......=....,,,,T',
      'T,,,,,=..1....=..2.,,,,T',
      'T,,,,,=.......=........T',
      'T,,,,,=.^^^^..=..^^^^^.T',
      'T.....=.#P##..=..##G##.T',
      'T..S..=.......=........T',
      'T.....=========.=====>3.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
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
    ],
    signs: ['KILKENNY. The Cat Laughs comedy festival is on at the castle.'],
    landmarks: [
      [
        {
          do: 'say',
          text: 'KILKENNY CASTLE. Robinmon is filming content on the lawn. He waves at the camera, not at you.',
        },
      ],
    ],
    gym: { trainer: 'gym-kilkenny', place: 'Kilkenny Castle' },
    west: 'tipperary',
    east: 'laois',
  },
  {
    id: 'laois',
    name: 'Stradbally, Co. Laois',
    county: 4,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,,..^^^^^^^...T',
      'T,,,,,,,,,,..###G###...T',
      'T,,,,1,,,,,.....=......T',
      '@=========......=..*...T',
      'T........=......=......T',
      'T..^^^^..=..2...=..^^^.T',
      'T..#P##..=..........#M#T',
      'T........==============T',
      'T,,,,,,,,,,,,,,,,,,,,,=T',
      'T,,,,,,,,,3,,,,,,,,,,,=T',
      'T.....S..............>4.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 19,
      max: 23,
      table: [
        ['killemon', 35],
        ['thilomon', 25],
        ['oismon', 20],
        ['olliemon', 20],
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
    ],
    signs: ['ELECTRIC PICNIC. The main stage is the Laois gym. Headliner: DJ Stradbally.'],
    gym: { trainer: 'gym-laois', place: 'Electric Picnic' },
    west: 'kilkenny',
    east: 'offaly',
  },
  {
    id: 'offaly',
    name: 'Clonmacnoise, Co. Offaly',
    county: 5,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~~~T',
      'T...^^^^^^^......^^^^^.T',
      'T...###G###......##L##.T',
      '@======.=.............*T',
      'Tbbbbb=...=====..1.....T',
      'Tbbbbb=...=bbbbbbbbb...T',
      'Tbbbbb=...=bbbbbbbbb...T',
      'T..^^^=.^^^=bbbb2bbb...T',
      'T..#P#=.#M#=...........T',
      'T..S..=....==========>3.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 23,
      max: 27,
      table: [
        ['simomon', 40],
        ['steadmon', 35],
        ['hugomon', 25],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'down', trainer: 'offaly-monk', sight: 3 },
      { look: 'local', face: 'up', trainer: 'offaly-turf', sight: 2 },
      garda('Offaly', 'jersey:offaly'),
    ],
    signs: ['CLONMACNOISE. The monastery on the Shannon. Mind the Bog of Allen.'],
    landmarks: [
      [
        {
          do: 'say',
          text: 'A ROUND TOWER. Simomon is said to be blazing up in a quiet corner of the bog.',
        },
      ],
    ],
    gym: { trainer: 'gym-offaly', place: 'Clonmacnoise' },
    west: 'laois',
    east: 'westmeath',
  },
  {
    id: 'westmeath',
    name: 'Athlone and Mullingar, Co. Westmeath',
    county: 6,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T..^^^^^.....,,,,,,,,..T',
      'T..##L##.....,,,,,,,,..T',
      'T....=.......,,,,1,,,..T',
      '@=========.........=...T',
      'T~~~~~~~B~~~~~~~~~~=~~~T',
      'T~~~~~~~B~~~~~~~~~~=~~~T',
      'T.......=..........=...T',
      'T^^^^...=..^^^..^^^^^^.T',
      'T#P##...=..#M#..###G##.T',
      'T.......=.........*....T',
      'T..S....=====2=======>3.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
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
    ],
    signs: ['MULLINGAR. The pop star is home for one night only.'],
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
    ],
    gym: { trainer: 'gym-westmeath', place: 'Mullingar' },
    west: 'offaly',
    east: 'meath',
  },
  {
    id: 'meath',
    name: 'Brú na Bóinne, Co. Meath',
    county: 7,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T.......,,,,,,,..^^^^^.T',
      'T..^^^..,,,1,,,..##G##.T',
      'T..#M#..,,,,,,,....=...T',
      '@=========.........=...T',
      'T........=.........=...T',
      'T..^^^^..=...2.....=...T',
      'T..#P##..=.........=...T',
      'T........==========....T',
      'T.*...............=....T',
      'T..^^^^^^.........=....T',
      'T..###L##.........=....T',
      'T..S..............===>3.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    wild: {
      min: 31,
      max: 35,
      table: [
        ['steadmon', 30],
        ['jammon', 30],
        ['simomon', 25],
        ['enda', 15],
      ],
    },
    npcs: [
      { look: 'trainer', face: 'down', trainer: 'meath-druid', sight: 3 },
      { look: 'trainer', face: 'left', trainer: 'meath-shopper', sight: 3 },
      garda('Meath', 'jersey:meath'),
    ],
    signs: ['BRÚ NA BÓINNE. The gym is in the passage tomb at Newgrange.'],
    landmarks: [
      [
        {
          do: 'say',
          text: 'THE HILL OF TARA. The old kings of Ireland were crowned here. The wind is fierce.',
        },
      ],
    ],
    gym: { trainer: 'gym-meath', place: 'Newgrange' },
    west: 'westmeath',
    east: 'kildare',
  },
  {
    id: 'kildare',
    name: 'The Curragh, Co. Kildare',
    county: 8,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T......,,,,,,,,,,,.....T',
      'T..^^^.,,,,,,,,,,,.^^^.T',
      'T..#M#.,,,,1,,,,,,.#P#.T',
      '@==========......=.....T',
      'T........=.......=.....T',
      'Tffffffff=ffffffff..*..T',
      'T........=.............T',
      'T..^^^^^^^^......2.....T',
      'T..####G###............T',
      'T......=.........=.....T',
      'T..S...===========.==>3.',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
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
    ],
    signs: ['THE CURRAGH. Army camp. Gibbsmon was last seen calling in bombers.'],
    gym: { trainer: 'gym-kildare', place: 'The Curragh' },
    west: 'meath',
    east: 'dublin',
  },
  {
    id: 'dublin',
    name: 'Dublin City',
    county: 9,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,..^^^^^^..^^^T',
      'T,,,,,,,,,..###L##..#M#T',
      'T,,,,1,,,,.....=.......T',
      '@==============.......*T',
      'T.............=........T',
      'T~~~~~~~~~~~~~B~~~~~~~~T',
      'T~~~~~~~~~~~~~B~~~~~~~~T',
      'T.............=..2.....T',
      'T..^^^^..^^^^.=........T',
      'T..#P##..#H##.=======>4.',
      'T..S........3..........T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
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
    ],
    signs: ['DUBLIN. The Phoenix Park, the quays and Temple Bar. Trinity College to the east.'],
    houses: [
      [
        {
          do: 'say',
          text: 'TEMPLE BAR. A man in a Dublin jersey is selling Blue Ghosts out of a sports bag. You decide to buy from the shop instead.',
        },
      ],
    ],
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
    ],
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
      'T....=.......=.......=.T',
      '@=====.......=.......=.T',
      'T............=.......=.T',
      'T..""...4..==K==...""=.T',
      'T..""....5..===....""=.T',
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
        showIf: 'beat:scholar-3',
        hideIf: 'champion',
        trainer: 'bns',
      },
      {
        look: 'higgins',
        face: 'up',
        showIf: 'champion',
        talk: [
          {
            do: 'say',
            text: 'MICHAEL D: Champion of Ireland! From Newmarket-on-Fergus to Front Square. I’m very proud of you.',
          },
          {
            do: 'if',
            flag: 'beat:bns-rematch',
            then: [],
            else: [
              {
                do: 'say',
                text: 'MICHAEL D: B&S have asked for a rematch, at level 60. They’re in the Long Room whenever you’re ready.',
              },
              { do: 'flag', flag: 'rematch' },
            ],
          },
        ],
      },
      { look: 'bns', face: 'down', showIf: 'rematch', trainer: 'bns-rematch' },
    ],
    signs: ['TRINITY COLLEGE. Long Room upstairs. The Campanile in Front Square.'],
    west: 'dublin',
    enter: [
      {
        do: 'say',
        text: 'Three scholars guard the Long Room. B&S wait under the Campanile.',
      },
    ],
  },
];

/** The rooms behind every door. */
export const INTERIORS = MAPS.flatMap(interiorsOf);

const BY_ID = new Map([...MAPS, ...INTERIORS].map((m) => [m.id, m]));
export function mapById(id: string): GameMap {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

/** The map you're on, or the one outside if you're in a building. */
export const outsideOf = (map: GameMap) => (map.inside ? mapById(map.inside.map) : map);

export const COUNTIES = MAPS.slice(0, 9).map((m) => m.id);

export { phone };
