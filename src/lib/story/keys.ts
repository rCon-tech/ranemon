import { find, isPresent, npcsOf, tileAt, type GameMap, type Step } from './world';

/**
 * Key items: things you carry for good, kept as story flags rather than in the bag's counts,
 * since you never use them up.
 */

/** HM Neurodivergent, from the old man in Thurles: opens the Semple Stadium gym. */
export const HM = 'hm:neurodivergent';
/** The certificate that comes with it. */
export const CERT = 'cert:donkey-brains';

/** Josh Lee's tablet, from Bundoran, and whether you've taken it: then you can see Poseidon. */
export const TABLET = 'item:tablet';
export const TABLET_TAKEN = 'tablet:taken';

/** Taking the tablet, from Josh's question or from the bag. */
export const TAKE_TABLET: Step[] = [
  { do: 'say', text: 'You take Josh Lee’s tablet. It tastes of sea salt and regret.' },
  { do: 'say', text: '…' },
  {
    do: 'say',
    text: 'The waves start to shimmer. Out on the rocks, something enormous with a crown is looking straight at you.',
  },
  { do: 'flag', flag: TABLET_TAKEN },
];

/** Nick's beret, found at the Rock of Cashel and handed back to him at the Thurles gym door. */
export const NICK_BERET = 'item:nick-beret';

/** The Mega Ring: your Ranemon that have a Mega form can Mega evolve, once a battle. */
export const MEGA_RING = 'item:mega-ring';

/** The Limepass, from the Lime rep in Limerick: Lime e-bikes to ride, and fast travel. */
export const LIMEPASS = 'limepass';

export interface KeyItem {
  flag: string;
  /** Gone from the bag once this flag is set, such as a tablet once taken. */
  goneIf?: string;
  name: string;
  about: string;
  /** Whether it can be used from the bag. */
  usable?: boolean;
}

export const KEY_ITEMS: KeyItem[] = [
  {
    flag: HM,
    name: 'HM Neurodivergent',
    about:
      'Opens the pattern lock on the Semple Stadium gym. Use it anywhere to notice everything around you.',
    usable: true,
  },
  {
    flag: CERT,
    name: 'Donkey Brains certificate',
    about:
      'Signed by a retired donkey vet on the back of a Tayto packet. The highest honour in Tipperary.',
  },
  { flag: 'bike', name: 'High Nelly', about: 'A big black bike. Hold B to ride.' },
  {
    flag: LIMEPASS,
    name: 'Limepass',
    about:
      'Unlocks every Lime e-bike in Ireland. Hold B to ride, and pick LIMEPASS from START to zip back to any town you’ve been to.',
  },
  {
    flag: TABLET,
    goneIf: TABLET_TAKEN,
    name: 'Josh Lee’s Tablet',
    about:
      'A small white tablet from Josh Lee in Bundoran. He swears that once you take it, you can see Poseidon.',
    usable: true,
  },
  {
    flag: NICK_BERET,
    goneIf: 'nick:done',
    name: 'Nick’s Beret',
    about:
      'Black, a bit squashed, found on the Rock of Cashel. Nick won’t leave the Semple Stadium gym door without it.',
  },
  // From the Premier League legends in the London expansion (content/story/premier.ts).
  {
    flag: 'item:hairdryer',
    name: 'Fergie’s Hairdryer',
    about:
      'From Roy Keane. Left in the Old Trafford dressing room in 2013. Point it at something you don’t like.',
  },
  {
    flag: 'item:bucket',
    name: 'Bielsa’s Bucket',
    about: 'He sat on it for four years. Sit on it and you’ll think you know everybody’s team.',
  },
  {
    flag: 'item:replica',
    name: 'Replica Europa League Trophy',
    about:
      'From Robbie Keane. Spurs only have the one real one, and a steward polishes it every hour.',
  },
  {
    flag: 'london:railcard',
    name: 'Ian Wright’s Railcard',
    about:
      'A Senior Railcard. The trains to Brighton, Birmingham and Newcastle run for you. Don’t tell anyone.',
  },
  {
    flag: 'item:trophy',
    name: 'Premier League Trophy',
    about: 'Yours. The police line on the Mall has to let you through now. It’s the law. Probably.',
  },
  {
    flag: MEGA_RING,
    name: 'Mega Ring',
    about:
      'Gold, with a stone that glows. Once a battle, one of your Ranemon that has a Mega form can Mega evolve: press MEGA EVOLVE before you pick its move.',
  },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * What HM Neurodivergent notices on a map: everything, counted. Blue Ghosts still lying about
 * are counted too, which helps you find them.
 */
export function notice(map: GameMap, flags: ReadonlySet<string>, ghostsLeft: number): string[] {
  let trees = 0;
  let grass = 0;
  let flowers = 0;
  map.rows.forEach((row, y) =>
    [...row].forEach((_, x) => {
      const t = tileAt(map, x, y);
      if (t === 'T') trees++;
      else if (t === ',') grass++;
      else if (t === '"') flowers++;
    }),
  );
  const people = npcsOf(map).filter((n) => isPresent(n.item, flags)).length;
  const doors = ['P', 'M', 'G', 'H', 'L'].reduce((n, d) => n + find(map, d).length, 0);
  const seen = map.inside
    ? `You notice everything: ${plural(people, 'person', 'people')} in the room, and the clock is 4 minutes slow.`
    : `You notice everything: ${plural(trees, 'tree', 'trees')}, ${plural(grass, 'tuft', 'tufts')} of long grass, ${plural(flowers, 'flower bed', 'flower beds')}, ${plural(doors, 'door', 'doors')} and ${plural(people, 'person', 'people')}.`;
  return [
    'You used HM NEURODIVERGENT!',
    seen,
    ghostsLeft
      ? `You can hear ${plural(ghostsLeft, 'Blue Ghost', 'Blue Ghosts')} fizzing somewhere nearby.`
      : 'No Blue Ghosts left here. You’d have heard them fizzing.',
  ];
}
