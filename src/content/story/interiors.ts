import { DOORS, find, type GameMap, type Npc, type Step } from '@/lib/story/world';

/**
 * The insides of buildings. Every door on the road leads into a room of its own, built here from
 * one layout per kind of building, so a new town gets its pub, shop and gym for free.
 *
 * Indoor tiles: `F` floor, `g` gym floor, `r` rug (walkable). `W` wall, `O` window, `J` fire,
 * `Y` bookshelves, `V` a bar's bottles, `A` a shop's shelves, `C` counter (talk across it), `U` table, `N` plant, `Q` bed, `X` statue or display,
 * `Z` couch. `E` is the way out, in the bottom wall: walk into it to leave. `@` is where you
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

const LAYOUTS: Record<Kind, string[]> = {
  P: [
    'WWWWWWWWWW',
    'WOWVVVVJVW',
    'WFF1FFNFFW',
    'WCCCCCCFFW',
    'WFFFFFFFFW',
    'WFUUF2FUUW',
    'WFUUFFFUUW',
    'WNFF@FFFNW',
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
    'WFFFXXFFFW',
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

function room(outside: GameMap, kind: Kind, index: number): GameMap {
  const id = interiorId(outside.id, kind, index);
  const home = id === HOME_ID;
  const door = find(outside, kind)[index];
  const town = outside.name.split(',')[0];
  const base = { id, county: outside.county, inside: { map: outside.id, ...door } };

  switch (kind) {
    case 'P':
      return {
        ...base,
        name: `The pub, ${town}`,
        rows: LAYOUTS.P,
        npcs: [
          { look: 'barman', face: 'down', talk: [{ do: 'pub' }] },
          {
            look: 'lad',
            face: 'down',
            talk: [
              {
                do: 'say',
                text: 'LAD: The barman will sort your Ranemon out. Just talk to him over the bar.',
              },
            ],
          },
        ],
        things: {
          V: 'Every whiskey in Ireland, and a bottle of something from Scotland nobody orders.',
          U: 'A sticky table. Someone has left half a pint and a packet of Tayto.',
          J: 'A turf fire. The whole pub smells of it.',
        },
      };
    case 'M':
      return {
        ...base,
        name: `Corner shop, ${town}`,
        rows: LAYOUTS.M,
        npcs: [
          {
            look: 'shopkeeper',
            face: 'down',
            talk: [{ do: 'say', text: 'SHOPKEEPER: What can I get you?' }, { do: 'shop' }],
          },
        ],
        things: {
          A: 'Tayto, Club Orange, Brennans bread and a fridge full of Blue Ghosts.',
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
          { look: 'leader', face: 'down', trainer: gym.trainer },
          {
            look: 'trainer',
            face: 'left',
            talk: [
              {
                do: 'say',
                text: 'GYM GUIDE: Howya, champ in the making! The leader is at the top of the hall. Heal up in the pub first if you need to.',
              },
            ],
          },
        ],
        // The statues read out the gym's name and leader; see the story screen.
      };
    }
    case 'H': {
      const steps = outside.houses?.[index] ?? [];
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
      return {
        ...base,
        name: `${landmarkName(steps) ?? 'Michael D’s farmhouse'}, ${town}`,
        rows: LAYOUTS.L,
        npcs: [],
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
