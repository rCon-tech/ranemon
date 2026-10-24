import type { Difficulty } from '../battle/cpu';
import type { ItemId } from './items';

/**
 * The overworld's rules: maps made of one character per 16×16 tile, the people standing on them,
 * and the scripts they run. Pure data and pure functions, so it all tests without a browser.
 */

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DELTA: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/**
 * Tiles. Walkable: `.` grass, `,` long grass, `b` bog, `"` flowers, `=` road, `:` limestone,
 * `B` bridge, `F` floor, `s` stone steps, `d` sand, and in a city `v` pavement and `a` tarmac. Blocked: `T` tree, `~` water, `w` stone wall, `f` fence, `^` roof,
 * `#` wall, `S` sign, `K` the Campanile, `C` counter, `R` rock, `e` an earth bank, `h` hedge,
 * `p` a palm tree, `y` a yacht on the water, `c` a parked car. Doors are blocked too, and walking
 * into one runs it: `P` pub, `M` corner shop, `G` gym, `H` house, `L` landmark.
 * Indoors (see content/story/interiors.ts): `g` gym floor, `r` rug, `l` a dance floor and `k` a club's floor are walkable, and `E` is
 * the way out, blocked like a door.
 * Markers that are grass underneath: `@` arrival from the west (and the start), `>` arrival from
 * the east, `*` a hidden Blue Ghost, `1`-`9` the map's people in order, then `0` for a tenth.
 */
export type Tile = string;

const WALKABLE = new Set([
  '.',
  ',',
  'b',
  '"',
  '=',
  'v',
  'a',
  ':',
  'B',
  'F',
  'g',
  'r',
  'l',
  'k',
  's',
  'd',
]);
export const ENCOUNTER_TILES = new Set([',', 'b']);
export const DOORS = new Set(['P', 'M', 'G', 'H', 'L']);
export const EXIT = 'E';

export type Look =
  | 'mam'
  | 'higgins'
  | 'rival'
  | 'farmer'
  | 'lad'
  | 'leader'
  | 'trainer'
  | 'guard'
  | 'scholar'
  | 'bns'
  | 'local'
  | 'barman'
  | 'shopkeeper'
  | 'saoirse'
  | 'oldman'
  | 'legend'
  | 'busker'
  | 'conductor'
  | 'josh'
  | 'poseidon'
  | 'sibeal'
  | 'lime'
  | 'ollie'
  | 'simo'
  | 'mc'
  | 'melchior'
  | 'alex'
  | 'dart'
  | 'kill'
  | 'stead'
  | 'cramps'
  | 'pear'
  | 'cyclist'
  | 'clerk'
  | 'mescal'
  | 'boyde'
  | 'raver'
  | 'clubber'
  | 'shuffler'
  | 'dj'
  | 'bouncer'
  | 'carl'
  | 'reveller'
  | 'debs'
  | 'dancer'
  | 'tux'
  | 'enda'
  | 'sailor'
  | 'hen'
  | 'fan'
  | 'palace'
  | 'gamer'
  | 'king'
  | 'eurostar'
  | 'security'
  | 'headliner'
  | 'provai'
  | 'bus'
  | 'neeson'
  | 'border'
  | 'crew'
  | 'stag'
  | 'gatecamper'
  | 'donal'
  | 'fiddler'
  | 'lipsett'
  | 'blindboy'
  | 'johnnyb'
  | 'johnnysmacks'
  | 'bono'
  | 'collins';

/**
 * The dogs: Norm, Sibeal's collie, and Elvis, Carl Ryan's enormous black dog. Either can walk
 * behind you as your companion (lib/story/norm.ts), and an `Npc` can be one, drawn as a dog.
 */
export type Dog = 'norm' | 'elvis';
export const DOGS: readonly Dog[] = ['norm', 'elvis'];
export const isDog = (look: string): look is Dog => (DOGS as readonly string[]).includes(look);

/** One step of a script. Scripts are run by the story screen, one step at a time. */
export type Step =
  | { do: 'say'; text: string }
  | { do: 'battle'; trainer: string }
  | { do: 'give'; item: ItemId; count?: number }
  | { do: 'flag'; flag: string }
  | { do: 'unflag'; flag: string }
  | { do: 'if'; flag: string; then: Step[]; else?: Step[] }
  /** A yes or no question; the answer picks which steps run next. */
  | { do: 'ask'; text: string; yes?: Step[]; no?: Step[] }
  /** A battle with one particular wild Ranemon, such as a legend. The script goes on after. */
  | { do: 'wild'; species: string; level: number }
  /** A Ranemon given to you: it joins the party, or the Group Chat when the party is full. */
  | { do: 'recruit'; species: string; level: number }
  /** Takes you somewhere far off, by train: to a map, standing on a tile, facing a way. */
  | { do: 'travel'; map: string; x: number; y: number; face: Dir }
  /**
   * Whoever on this map is hidden by `flag` runs off the way given and out of sight, then the
   * flag is set so they stay gone.
   */
  | { do: 'flee'; flag: string; dir: Dir }
  | { do: 'heal' }
  /** The starter pick: Michael D's at home, or Próvaí's UK Ranemon in London (`uk`). */
  | { do: 'starter'; uk?: true }
  /**
   * Over the border between Ireland and Britain: Ranemon can't cross it, so the party and Group
   * Chat you had are left behind, and the ones waiting on this side (none, the first time) come
   * back. You'd wake in `pub` after a blackout until you next visit one.
   */
  | { do: 'border'; pub: { map: string; x: number; y: number } }
  | { do: 'pub' }
  /** Vapes, or someone's own stall with its own prices. */
  | { do: 'shop'; stall?: Stall }
  /** The departures board at Connolly Station: pick a train, and the ride runs next. */
  | { do: 'departures' }
  | { do: 'ending' };

/** Someone selling a few things at their own prices, outside any shop. */
export interface Stall {
  /** The panel's title. */
  name: string;
  stock: { item: ItemId; price: number }[];
}

export interface Trainer {
  id: string;
  name: string;
  /** Species and level, lead first. The rival's team is worked out from your starter instead. */
  team: [string, number][];
  ai: Difficulty;
  /** Euro won. */
  prize: number;
  before: string;
  after: string;
  /** Run after winning, once. */
  reward?: Step[];
  /** Said in battle each time they send out a Ranemon. */
  line?: string;
  rival?: boolean;
  /** A first battle you can lose: no blackout, and the story carries on either way. */
  friendly?: boolean;
  /** In Britain: its Ranemon are UK forms, and a rival's team is worked out from your UK starter. */
  uk?: boolean;
  /**
   * Always scales up to your party, Champion or not, with its ace this many levels from your
   * best Ranemon (negative is under it, and never past MAX_LEVEL): the Championship in Galway.
   */
  above?: number;
}

export interface Npc {
  look: Look | Dog;
  face: Dir;
  /** What talking to them does. A trainer's battle comes first if it hasn't been won. */
  talk?: Step[];
  trainer?: string;
  /** A trainer who won't battle until this flag is set: until then, talking runs `talk`. */
  readyIf?: string;
  /** Tiles a trainer can see along its facing; walking into view starts the battle. */
  sight?: number;
  /** Dancing on the spot, turning this way and that, until someone talks to them. */
  dances?: boolean;
  /** Only there while this flag is set / not set. */
  showIf?: string;
  hideIf?: string;
}

export interface Gym {
  trainer: string;
  place: string;
  /** How the leader looks, if not like the other leaders. */
  look?: Look;
  /** A door that stays shut until a flag is set, such as an HM. */
  lock?: Lock;
}

export interface Lock {
  flag: string;
  /** Said at the door while it's shut. */
  locked: string;
  /** Said once, the first time through. */
  opened: string;
}

export interface Wild {
  min: number;
  max: number;
  /** Species and weight. */
  table: [string, number][];
}

export interface GameMap {
  id: string;
  name: string;
  /** Route index: 0 is Clare, 9 Dublin, 10 Trinity. Decides what the shop sells. */
  county: number;
  rows: string[];
  wild?: Wild;
  npcs: Npc[];
  /** Text of each `S`, `H` and `L`, in reading order. */
  signs?: string[];
  houses?: Step[][];
  landmarks?: Step[][];
  /** Landmark doors that stay shut until a flag is set, by landmark index. */
  landmarkLocks?: Record<number, Lock>;
  /** A landmark's own room instead of the plain one, by landmark index. */
  landmarkRooms?: Record<number, Pick<GameMap, 'rows' | 'npcs' | 'name'> & Partial<GameMap>>;
  /** A house's own room instead of the plain one, by house index. */
  houseRooms?: Record<number, Pick<GameMap, 'rows' | 'npcs' | 'name'> & Partial<GameMap>>;
  /** The gym behind the `G` door: its leader, and where it is, for the sign at the door. */
  gym?: Gym;
  west?: string;
  east?: string;
  /** Run once, the first time you arrive. */
  enter?: Step[];
  /** A room: the map and door outside it. */
  inside?: { map: string; x: number; y: number };
  /**
   * Run every time you come in, such as Mam's welcome. On a map outdoors, every time you come
   * onto it, by its edge, out of a door or off a train, such as someone running up to you once a
   * flag is set: guard it with `if` steps so it only says something when it should.
   */
  arrive?: Step[];
  /** Only drawn in 2D for now: with the 3D look picked, this map and its rooms show in 2D. */
  flat?: boolean;
  /** Slate roofs on every building, not only the gym: the look of a well-off town. */
  slate?: boolean;
  /** What the things in a room say when you look at them, by tile. */
  things?: Record<string, string>;
  /**
   * The map as it is once a flag is set, such as Trinity turning into the Trinity Ball after
   * B&S are beaten. Its fields replace the plain map's; the id stays the same.
   */
  after?: { flag: string } & Partial<Omit<GameMap, 'id' | 'after'>>;
  /** A party, with everything that goes with it. */
  party?: Party;
  /**
   * In Britain (the London expansion): wild Ranemon are UK forms, the pubs are W.B Yates and
   * the shop is a Tesco Express, and the Limepass doesn't cross the sea.
   */
  uk?: boolean;
  /** This town's W.B Yates: who runs it and what's different about it. */
  yates?: Yates;
}

/** A W.B Yates, the pubs in England: each run by Irish people living there, and each its own. */
export interface Yates {
  /** Whoever runs it, standing at the end of the bar. */
  owner: Npc;
  /** Someone else in, if there is. */
  regular?: Npc;
  /** What the things in the room say, over the usual ones. */
  things?: Record<string, string>;
}

export interface Party {
  /** Strings of fairy lights hung over the map, each from one tile point to another. */
  lights: [number, number, number, number][];
  /**
   * A crowd dancing, past the ten people a map can place: they're in the way and each has a
   * line from `lines` to shout at you, but they're nobody in particular.
   */
  crowd?: { x: number; y: number; look: Look }[];
  lines?: string[];
  /** Bunches of balloons tied to tiles, best on ones you can't walk on. */
  balloons?: [number, number][];
}

/** Who in a party's crowd is dancing on a tile, by index, or -1. */
export const crowdAt = (map: GameMap, x: number, y: number) =>
  map.party?.crowd?.findIndex((c) => c.x === x && c.y === y) ?? -1;

export interface Placed<T> {
  x: number;
  y: number;
  index: number;
  item: T;
}

const MARKERS = new Set(['@', '>', '*', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);

/** The marker for a map's person at an index: `1` to `9`, then `0` for the tenth. */
export const slot = (index: number) => (index === 9 ? '0' : String(index + 1));

/**
 * The tile under a position; outside the map counts as a tree. A marker takes the ground of the
 * nearest plain tile in its row, so a person stands on floor indoors and on road on the road.
 */
export function tileAt(map: GameMap, x: number, y: number): Tile {
  const row = map.rows[y];
  const c = row?.[x];
  if (c === undefined) return 'T';
  if (!MARKERS.has(c)) return c;
  for (let d = 1; d < row.length; d++) {
    for (const n of [row[x - d], row[x + d]]) {
      if (n !== undefined && !MARKERS.has(n) && isWalkable(n)) return n;
    }
  }
  return '.';
}

/** Every position of a character, in reading order. */
export function find(map: GameMap, c: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  map.rows.forEach((row, y) => [...row].forEach((ch, x) => ch === c && out.push({ x, y })));
  return out;
}

export function marker(map: GameMap, c: '@' | '>'): { x: number; y: number } {
  const at = find(map, c)[0];
  if (!at) throw new Error(`${map.id} has no ${c}`);
  return at;
}

export function npcsOf(map: GameMap): Placed<Npc>[] {
  return map.npcs.map((npc, i) => {
    const at = i < 10 ? find(map, slot(i))[0] : undefined;
    if (!at) throw new Error(`${map.id} has no slot ${i + 1}`);
    return { ...at, index: i, item: npc };
  });
}

export const npcId = (map: GameMap, index: number) => `${map.id}:${index}`;

export function isPresent(npc: Npc, flags: ReadonlySet<string>): boolean {
  if (npc.showIf && !flags.has(npc.showIf)) return false;
  if (npc.hideIf && flags.has(npc.hideIf)) return false;
  return true;
}

export const isWalkable = (t: Tile) => WALKABLE.has(t);

/** Whether the player could stand at a tile: walkable and nobody standing there. */
export function canEnter(map: GameMap, x: number, y: number, flags: ReadonlySet<string>): boolean {
  if (!isWalkable(tileAt(map, x, y))) return false;
  if (crowdAt(map, x, y) >= 0) return false;
  return !npcsOf(map).some((n) => n.x === x && n.y === y && isPresent(n.item, flags));
}

/**
 * Where you come out of a door: the tile in front of it, or beside it if that's blocked.
 * Facing away from the door.
 */
export function doorStep(map: GameMap, x: number, y: number): { x: number; y: number; face: Dir } {
  for (const face of ['down', 'left', 'right', 'up'] as Dir[]) {
    const [dx, dy] = DELTA[face];
    if (isWalkable(tileAt(map, x + dx, y + dy))) return { x: x + dx, y: y + dy, face };
  }
  return { x, y: y + 1, face: 'down' };
}

/** The text of the sign, house or landmark door at a position. */
export function doorIndex(map: GameMap, x: number, y: number): number {
  const c = map.rows[y][x];
  return find(map, c).findIndex((p) => p.x === x && p.y === y);
}

/**
 * A trainer that can see the player standing at (x, y): one not yet beaten, facing them, with
 * nothing in between and the player within its sight.
 */
export function spottedBy(
  map: GameMap,
  x: number,
  y: number,
  flags: ReadonlySet<string>,
  beaten: (trainer: string) => boolean,
): Placed<Npc> | null {
  for (const n of npcsOf(map)) {
    const npc = n.item;
    if (!npc.trainer || !npc.sight || !isPresent(npc, flags) || beaten(npc.trainer)) continue;
    if (npc.readyIf && !flags.has(npc.readyIf)) continue;
    const [dx, dy] = DELTA[npc.face];
    for (let d = 1; d <= npc.sight; d++) {
      const tx = n.x + dx * d;
      const ty = n.y + dy * d;
      if (tx === x && ty === y) return n;
      if (!canEnter(map, tx, ty, flags)) break;
    }
  }
  return null;
}

/** Picks a wild Ranemon from a table, given two random numbers in [0, 1). */
export function pickWild(wild: Wild, r1: number, r2: number): { species: string; level: number } {
  const total = wild.table.reduce((s, [, w]) => s + w, 0);
  let roll = r1 * total;
  let species = wild.table[0][0];
  for (const [id, w] of wild.table) {
    if (roll < w) {
      species = id;
      break;
    }
    roll -= w;
  }
  return { species, level: wild.min + Math.floor(r2 * (wild.max - wild.min + 1)) };
}

/** 1 step in 10 on long grass or bog starts a wild battle. */
export const ENCOUNTER_RATE = 0.1;
