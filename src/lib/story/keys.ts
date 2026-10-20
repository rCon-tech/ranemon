import { find, isPresent, npcsOf, tileAt, type GameMap } from './world';

/**
 * Key items: things you carry for good, kept as story flags rather than in the bag's counts,
 * since you never use them up.
 */

/** HM Neurodivergent, from the old man in Thurles: opens the Semple Stadium gym. */
export const HM = 'hm:neurodivergent';
/** The certificate that comes with it. */
export const CERT = 'cert:donkey-brains';

export interface KeyItem {
  flag: string;
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
