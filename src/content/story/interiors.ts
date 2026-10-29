import { CARL_PUB, CARL_YATES } from './ball';
import { ELVIS_PUB } from './elvis';
import { keeperOf } from './keepers';
import { PUGH_TALK } from './neeson';
import { sibealInPub } from './sibeal';
import { DOORS, find, type GameMap, type Npc, type Step } from '@/lib/story/world';

/**
 * The insides of buildings. Every door on the road leads into a room of its own, built here from
 * one layout per kind of building, so a new town gets its McGrattans, Vapes and gym for free.
 *
 * Indoor tiles: `F` floor, `g` gym floor, `r` rug, `l` a dance floor that lights up, `k` a club's black floor (walkable). `W` wall, `O` window, `J` fire,
 * `Y` bookshelves, `V` a bar's bottles, `A` a shop's shelves, `C` counter (talk across it), `U` table, `N` plant, `Q` bed, `X` statue or display,
 * `Z` couch, `D` a departures board, `I` a speaker stack, `o` a club's brick back wall with a neon light,
 * `m` an arcade machine, `n` a row of stadium seats, `x` a football pitch (blocked: no walking on the grass). `E` is the way out, in the bottom wall: walk into it to leave. `@` is where you
 * come in.
 */

type Kind = 'P' | 'M' | 'G' | 'H' | 'L';

const HOME = [
  'WWWWWWWWWW',
  'WWOWWWJWOW',
  'WNZZFFFFYW',
  'WFFFFFFFYW',
  'WFrrrrF1FW',
  'WFrrrrFUUW',
  'WQFFFFFUUW',
  'WQFF@FFFNW',
  'WWWWEWWWWW',
];

const HOUSE = [
  'WWWWWWWWWW',
  'WOWWJWWOWW',
  'WQFFFFFYYW',
  'WQFFFFFFFW',
  'WFFUUFF1FW',
  'WFFUUFFFFW',
  'WFFrrrFFFW',
  'WNFF@FFFNW',
  'WWWWEWWWWW',
];

/**
 * W.B Yates: the pub, but with its fourth place by Próvaí's table, where a visitor stands in
 * view of the scene (Thatcher, in London) rather than down by the door under the text box.
 */
const YATES = [
  'WWWWWWWWWW',
  'WOWVVVVJVW',
  'WFF1FFNFFW',
  'WCCCCCCFFW',
  'WFFFFF4F3W',
  'WFUUF2FUUW',
  'WFUUFFFUUW',
  'WFFF@FFFNW',
  'WWWWEWWWWW',
];

const LAYOUTS: Record<Kind, string[]> = {
  P: [
    'WWWWWWWWWW',
    'WOWVVVVJVW',
    'WFF1FFNFFW',
    'WCCCCCCFFW',
    'WFFFFFFF3W',
    'WFUUF2FUUW',
    'W4UUFFFUUW',
    'W5FF@FFFNW',
    'WWWWEWWWWW',
  ],
  M: [
    'WWWWWWWWWW',
    'WOWWAAWWOW',
    'WFF1FAAAAW',
    'WCCCCFFFFW',
    'WFFFFFFFFW',
    'WAAFFFFAAW',
    'WFFFFFFFFW',
    'WNFF@FFFNW',
    'WWWWEWWWWW',
  ],
  G: [
    'WWWWWWWWWW',
    'WOWWWWWWOW',
    'WgNgg1gNgW',
    'WggggrgggW',
    'WggggrgggW',
    'WNgggrgggW',
    'WggggrgggW',
    'WggggrgggW',
    'WNgggrgggW',
    'WggggrgggW',
    'WgggXrXggW',
    'Wgggg@g2gW',
    'WWWWWEWWWW',
  ],
  H: HOUSE,
  L: [
    'WWWWWWWWWW',
    'WOWWYYWWOW',
    'WNFFFFFFNW',
    'WFFFFFFFFW',
    'WFF1XXFFFW',
    'WFFFrrFFFW',
    'WFFFrrFFFW',
    'WNFF@FFFNW',
    'WWWWEWWWWW',
  ],
};

/** Your own house: the first house in Clare. */
export const HOME_ID = 'clare-H0';

/** The id of the room behind a door: the map, the kind of door, and which one of that kind. */
export const interiorId = (map: string, kind: string, index: number) => `${map}-${kind}${index}`;

const SMALL = new Set(['of', 'the', 'and', 'on']);
/** `KING JOHN’S CASTLE` to `King John’s Castle`. */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** A landmark's name, from the capitals that start its text, if it has them. */
function landmarkName(steps: Step[]): string | null {
  const first = steps.find((s) => s.do === 'say');
  const caps = first?.do === 'say' ? first.text.match(/^([A-Z’'& ]+)[.,]/) : null;
  return caps ? titleCase(caps[1].trim()) : null;
}

const firstLine = (steps: Step[]) => {
  const s = steps.find((s) => s.do === 'say');
  return s?.do === 'say' ? s.text : '…';
};

/** A layout with only the first `n` people's places in it: the rest are floor. */
const placesFor = (rows: string[], n: number) =>
  rows.map((r) => r.replace(/[1-9]/g, (d) => (Number(d) <= n ? d : 'F')));

/**
 * A pub in Britain: a W.B Yates, with Florence Pugh behind the bar (neeson.ts) and its own owner
 * and regulars (`yates` on the town's map). In London that's Donal from Cork, with Próvaí in the back.
 * Carl Ryan is in the corner of every one, as he is in every McGrattans (ball.ts).
 */
function yatesRoom(outside: GameMap, base: Pick<GameMap, 'id' | 'county' | 'inside'>): GameMap {
  const town = outside.name.split(',')[0];
  const yates = outside.yates;
  const npcs: Npc[] = [
    { look: 'pugh', face: 'down', talk: PUGH_TALK },
    ...(yates
      ? [
          yates.owner,
          ...(yates.regular ? [yates.regular] : []),
          ...(yates.visitor ? [yates.visitor] : []),
        ]
      : []),
  ];
  return {
    ...base,
    name: `W.B Yates, ${town}`,
    rows: placesFor(YATES, npcs.length),
    // Carl Ryan, in his own corner, with his sports bag of Blue Ghosts.
    npcs: [...npcs, CARL_YATES],
    things: {
      V: 'Every whiskey in Ireland, a few from Scotland, and none at all from England.',
      U: 'A sticky table, a pint of Guinness and a packet of King crisps, smuggled over.',
      J: 'A turf fire. Where they get turf in London, nobody asks.',
      ...yates?.things,
    },
  };
}

function room(outside: GameMap, kind: Kind, index: number): GameMap {
  const id = interiorId(outside.id, kind, index);
  const home = id === HOME_ID;
  const door = find(outside, kind)[index];
  const town = outside.name.split(',')[0];
  const base = { id, county: outside.county, inside: { map: outside.id, ...door } };

  switch (kind) {
    case 'P':
      if (outside.uk || outside.yates) return yatesRoom(outside, base);
      return {
        ...base,
        name: `McGrattans, ${town}`,
        rows: LAYOUTS.P,
        npcs: [
          { look: 'barman', face: 'down', talk: [{ do: 'pub' }] },
          {
            look: 'lad',
            face: 'down',
            talk: [
              {
                do: 'say',
                text: 'LAD: Is that Dua Lipa pulling pints? It is! Talk to her over the bar and she’ll sort your Ranemon out.',
              },
            ],
          },
          sibealInPub,
          // Carl Ryan, in the corner, with his sports bag of Blue Ghosts.
          CARL_PUB,
          // And Elvis, his really huge black dog, at his feet.
          ELVIS_PUB,
        ],
        things: {
          V: 'Every whiskey in Ireland, and a bottle of something from Scotland nobody orders.',
          U: 'A sticky table. Someone has left half a pint and a packet of Tayto.',
          J: 'A turf fire. All of McGrattans smells of it.',
        },
      };
    case 'M':
      if (outside.uk)
        return {
          ...base,
          name: `Vapes & More, ${town}`,
          rows: LAYOUTS.M,
          npcs: [
            {
              look: 'shopkeeper',
              face: 'down',
              talk: [
                {
                  do: 'say',
                  text: 'SHOPKEEPER: Welcome to Vapes & More. Unexpected item in the bagging area. That’s just what I say now.',
                },
                { do: 'shop' },
              ],
            },
          ],
          things: {
            A: 'Meal deals, a fridge of Blue Ghosts at London prices and Tayto, in the “World Foods” aisle.',
          },
        };
      return {
        ...base,
        name: `Vapes, ${town}`,
        rows: LAYOUTS.M,
        npcs: [
          {
            look: 'shopkeeper',
            face: 'down',
            talk: [
              { do: 'say', text: 'SHOPKEEPER: Welcome to Vapes. What can I get you?' },
              { do: 'shop' },
            ],
          },
        ],
        things: {
          A: 'Vapes in every flavour, Tayto, Club Orange, Brennans bread and a fridge full of Blue Ghosts.',
        },
      };
    case 'G': {
      const gym = outside.gym!;
      return {
        ...base,
        name: `${gym.place} gym`,
        rows: LAYOUTS.G,
        gym,
        npcs: [
          { look: gym.look ?? 'leader', face: 'down', trainer: gym.trainer },
          {
            look: 'trainer',
            face: 'left',
            talk: [
              {
                do: 'say',
                text: 'GYM GUIDE: Howya, champ in the making! The leader is at the top of the hall. Heal up in McGrattans first if you need to.',
              },
            ],
          },
        ],
        // The statues read out the gym's name and leader; see the story screen.
      };
    }
    case 'H': {
      const steps = outside.houses?.[index] ?? [];
      const own = outside.houseRooms?.[index];
      // A room that already names its city, such as `Old Trafford, Manchester`, keeps its name.
      if (own)
        return {
          ...base,
          arrive: steps,
          ...own,
          name: own.name.includes(', ') ? own.name : `${own.name}, ${town}`,
        };
      const npc: Npc = { look: home ? 'mam' : 'local', face: 'down', talk: steps };
      return {
        ...base,
        name: home ? `Home, ${town}` : `A house, ${town}`,
        rows: home ? HOME : HOUSE,
        npcs: [npc],
        arrive: steps,
        things: home
          ? {
              Z: 'A lovely Ocean Linen couch.',
              Y: 'Your old Ranemon cards, and every Clare hurling programme since 1995.',
              J: 'A turf fire. Mam keeps it going all day.',
              U: 'The kitchen table. There’s a pot of tea on it, and a plate of Mikado.',
              Q: 'Your bed. No time for a lie-in, Michael D is waiting!',
            }
          : {
              Y: 'A shelf of books and a few framed jerseys.',
              J: 'A turf fire, burning low.',
              U: 'A kitchen table with a pot of tea on it.',
              Q: 'A neatly made bed.',
            },
      };
    }
    case 'L': {
      const steps = outside.landmarks?.[index] ?? [];
      const own = outside.landmarkRooms?.[index];
      // A room that already names its city, such as `Old Trafford, Manchester`, keeps its name.
      if (own)
        return {
          ...base,
          arrive: steps,
          ...own,
          name: own.name.includes(', ') ? own.name : `${own.name}, ${town}`,
        };
      const name = landmarkName(steps) ?? 'Michael D’s farmhouse';
      // Whoever looks after the place, standing by its display.
      const npcs = [keeperOf(outside.id, name)];
      return {
        ...base,
        name: `${name}, ${town}`,
        rows: placesFor(LAYOUTS.L, npcs.length),
        npcs,
        arrive: steps,
        things: {
          X: firstLine(steps),
          Y: 'Old books and older maps of the county.',
        },
      };
    }
  }
}

/** Every room behind the doors of a map. */
export function interiorsOf(outside: GameMap): GameMap[] {
  return [...DOORS].flatMap((kind) =>
    find(outside, kind).map((_, i) => room(outside, kind as Kind, i)),
  );
}
