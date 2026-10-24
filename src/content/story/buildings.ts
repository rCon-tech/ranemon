import type { GameMap, Step } from '@/lib/story/world';

/**
 * Dublin's buildings that used to have no door: the GPO and Supermac's on O’Connell Street, and
 * The Temple Bar, the red pub, in Temple Bar. Each is a house door (`H`) with a room of its own
 * and someone in it to talk to. 2D only, like everything new.
 */

type Room = Pick<GameMap, 'rows' | 'npcs' | 'name'> & Partial<GameMap>;

const say = (...lines: string[]): Step[] => lines.map((text) => ({ do: 'say', text }));

export const GPO_DOOR = say(
  'THE GPO. The General Post Office, where the Proclamation was read out in 1916. There are still bullet marks in the pillars.',
);

export const GPO_ROOM: Room = {
  name: 'The GPO',
  flat: true,
  rows: [
    'WWWWWWWWWW',
    'WOWWWWWWOW',
    'WFF1FFF2FW',
    'WCCCCFFFFW',
    'WFFFFFFFFW',
    'WFFFXXFFFW',
    'WFFFrrFFFW',
    'WNFF@FFFNW',
    'WWWWEWWWWW',
  ],
  npcs: [
    {
      look: 'clerk',
      face: 'down',
      talk: say(
        'AN POST CLERK: Stamps, parcels, or a tour? We do all three. The tour is free, the stamps are not.',
        'AN POST CLERK: Easter Monday 1916, Pearse read the Proclamation on the steps out there. Then they held the building for five days.',
        'AN POST CLERK: The queue for the counter has been going about as long.',
      ),
    },
    {
      look: 'oldman',
      face: 'left',
      talk: say(
        'OLD MAN: That statue is Cúchulainn, dying, tied to a stone so he’d face his enemies standing up. A crow landed on his shoulder before anyone dared come near him.',
        'OLD MAN: I come in every day to post one letter. It gets me out of the house.',
      ),
    },
  ],
  things: {
    X: 'A bronze of Cúchulainn, dying, tied to a standing stone, with a raven on his shoulder.',
    C: 'The counter. A sign says “PLEASE WAIT TO BE CALLED”. Nobody has been called in a while.',
  },
};

export const SUPERMACS_DOOR = say(
  'SUPERMAC’S, O’CONNELL STREET. Open till four in the morning. The smell of curry chips carries to the Spire.',
);

export const SUPERMACS_ROOM: Room = {
  name: 'Supermac’s',
  flat: true,
  rows: [
    'WWWWWWWWWW',
    'WOWAAAAWOW',
    'WFFF1FFFFW',
    'WCCCCCFFFW',
    'WFFFFFFFFW',
    'WUUFFF2UUW',
    'WUUFFFFUUW',
    'WNFF@FFFNW',
    'WWWWEWWWWW',
  ],
  npcs: [
    {
      look: 'shopkeeper',
      face: 'down',
      talk: [
        ...say(
          'SUPERMAC’S: Howya. What’ll it be? The curry chips are fresh, the spice bag is legendary.',
        ),
        {
          do: 'shop',
          stall: {
            name: 'Supermac’s',
            stock: [
              { item: 'curry-chips', price: 150 },
              { item: 'chicken-fillet-roll', price: 300 },
              { item: 'spice-bag', price: 700 },
            ],
          },
        },
      ],
    },
    {
      look: 'lad',
      face: 'up',
      talk: say(
        'LAD: Supermac’s beat McDonald’s in court, you know. McDonald’s tried to say nobody could have “Mac” in Europe. A Galway man said no.',
        'LAD: Pat McDonagh. Hero. Pass us the garlic dip.',
      ),
    },
  ],
  things: {
    A: 'A menu board: curry chips, a Snack Box, and a spice bag that could feed a gym.',
    U: 'A table with a lone chip on it, and a ketchup sachet somebody sat on.',
  },
};

export const TEMPLE_BAR_PUB_DOOR = say(
  'THE TEMPLE BAR. The famous red pub, with trad music on from the morning, and a pint at a price you won’t forget.',
);

export const TEMPLE_BAR_PUB_ROOM: Room = {
  name: 'The Temple Bar',
  flat: true,
  rows: [
    'WWWWWWWWWW',
    'WOWVVVVJVW',
    'WFF1FFNFFW',
    'WCCCCCCFFW',
    'WFFFFFFF3W',
    'WFUUF2FUUW',
    'WFUUFFFUUW',
    'WFFF@FFFNW',
    'WWWWEWWWWW',
  ],
  npcs: [
    {
      look: 'mick',
      face: 'down',
      talk: say(
        'BARMAN: That’s €9.50, love. Yes, for the one. No, I don’t heal Ranemon. Go to McGrattans for that, they’re cheaper and they have Dua Lipa.',
      ),
    },
    {
      look: 'fiddler',
      face: 'down',
      talk: say(
        'FIDDLER: Requests? Anything but “Galway Girl”. I’ve played it fourteen times today and it’s not even two o’clock.',
        'FIDDLER: …Go on. Once more. For you.',
      ),
    },
    {
      look: 'hen',
      face: 'left',
      talk: say(
        'HEN PARTY: We came from Manchester for this! The bride has lost a shoe, a tiara and her sense of direction.',
      ),
    },
  ],
  things: {
    V: 'Shelf after shelf of whiskey, and a sign: “CASH OR CARD, NO RANEMON”.',
    U: 'A table full of tourists’ pints and a man from Texas explaining his Irish roots.',
    J: 'A fire, and a tourist warming his hands at it in August.',
  },
};
