import { mapById, mapFor } from '@/content/story/maps';
import { earned, SKINS } from '@/content/story/skins';
import { moveById } from '../battle/moves';
import { ITEMS } from './items';
import { catchUp, speciesById, type Member } from './party';
import { newGame, playerId, SAVE_KEY, saveKey, START_MONEY, type StoryState } from './state';
import { doorStep, find, marker, type Dir } from './world';

/**
 * Saves that keep working across updates.
 *
 * Every save carries `version: 1`, which every build of the game checks, and `schema`, which
 * says which shape it is in. A save in an older shape is copied aside before it is converted, and
 * each step in MIGRATIONS converts one shape to the next, so a save from any earlier build loads.
 * A change to what a save holds bumps SCHEMA and adds a step here; it never changes `version`,
 * so a save written by a newer build still loads in an older one that is open in another tab.
 */
export const SCHEMA = 5;

type Raw = Record<string, unknown>;

/**
 * The steps that change a save's shape, each from one schema to the next. Fields a build added
 * over time need no step: `repair` fills them in on every load.
 */
const MIGRATIONS: Record<number, (d: Raw) => Raw> = {
  // Schema 1 is every save from before schemas. `repair` now does what it needs.
  1: (d) => ({ ...d, schema: 2 }),
  // Dublin grew into a bigger city: anyone out on its streets moves to the same door on the new map.
  2: (d) => ({
    ...d,
    ...toNewDublin(d),
    pub: isObject(d.pub) ? { ...d.pub, ...toNewDublin(d.pub) } : d.pub,
    schema: 3,
  }),
  // Skins arrived: everyone you'd already beaten, or whose side quest you'd done, is yours to wear.
  3: (d) => ({
    ...d,
    skins: [
      ...new Set([
        ...strings(d.skins),
        ...SKINS.filter((k) => k.unlock.length && earned({ flags: strings(d.flags) }, k)).map(
          (k) => k.id,
        ),
      ]),
    ],
    schema: 4,
  }),
  // Every building got a door: the rooms after the new doors, in reading order, moved along.
  4: (d) => ({
    ...d,
    ...renamedRoom(d),
    pub: isObject(d.pub) ? { ...d.pub, ...renamedRoom(d.pub) } : d.pub,
    schema: 5,
  }),
};

/**
 * The rooms whose ids moved when new doors came before them: the GPO, Supermac's and The Temple
 * Bar in Dublin, and Athlone Castle in Westmeath.
 */
export const RENAMED_ROOMS: Record<string, string> = {
  'dublin-H0': 'dublin-H2',
  'dublin-H1': 'dublin-H4',
  'dublin-H2': 'dublin-H5',
  'dublin-H3': 'dublin-H6',
  'dublin-H4': 'dublin-H7',
  'dublin-H5': 'dublin-H8',
  'dublin-H6': 'dublin-H9',
  'westmeath-L2': 'westmeath-L3',
};

/** A place in a room that moved, now in the same room under its new id. */
function renamedRoom(v: unknown): { map: string } | null {
  if (!isObject(v) || typeof v.map !== 'string' || !(v.map in RENAMED_ROOMS)) return null;
  return { map: RENAMED_ROOMS[v.map] };
}

/**
 * Every door on the old 24 × 16 Dublin, and the west and east ways in, as [tile, which one of
 * that tile on the map now, x, y]. The houses are 2 and 4 now the GPO and Supermac's come first.
 */
const OLD_DUBLIN: [string, number, number, number][] = [
  ['L', 0, 15, 2],
  ['M', 0, 22, 2],
  ['@', 0, 0, 4],
  ['L', 1, 20, 9],
  ['P', 0, 4, 10],
  ['H', 2, 10, 10],
  ['>', 0, 21, 10],
  ['H', 4, 17, 12],
  ['L', 2, 5, 13],
];

/** A place on the old Dublin, moved to the step in front of the nearest door on the new one. */
function toNewDublin(v: unknown): { x: number; y: number } | null {
  if (!isObject(v) || v.map !== 'dublin') return null;
  const x = num(v.x, 0);
  const y = num(v.y, 0);
  const dist = ([, , dx, dy]: (typeof OLD_DUBLIN)[number]) => Math.abs(dx - x) + Math.abs(dy - y);
  const [tile, index] = OLD_DUBLIN.reduce((a, b) => (dist(b) < dist(a) ? b : a));
  const dublin = mapById('dublin');
  if (tile === '@' || tile === '>') return marker(dublin, tile);
  const door = find(dublin, tile)[index];
  const step = doorStep(dublin, door.x, door.y);
  return { x: step.x, y: step.y };
}

/**
 * Every save on every load: fields older saves don't have are filled in, Ranemon catch up on
 * moves they should know by now, and a map or Ranemon the game no longer has moves you to your
 * last pub or is set aside, instead of making the whole save unreadable.
 */
function repair(d: Raw): Raw {
  const start = newGame();
  const party = repairMembers(d.party);
  const box = repairMembers(d.box);
  const away = isObject(d.away)
    ? [d.away.party, d.away.box].flatMap((l) => repairMembers(l).ok)
    : [];
  const members = [...party.ok, ...box.ok, ...away];
  const place = validPlace(d) ?? validPlace(d.pub) ?? { map: start.map, x: start.x, y: start.y };
  return {
    ...d,
    ...place,
    face: DIRS.includes(d.face as Dir) ? d.face : 'down',
    party: party.ok,
    box: box.ok,
    // Anything that can't be read now is kept, so a later fix can bring it back.
    ...(party.bad.length + box.bad.length > 0 && {
      stray: [...arr(d.stray), ...party.bad, ...box.bad],
    }),
    bag: isObject(d.bag) ? d.bag : {},
    money: num(d.money, START_MONEY),
    flags: strings(d.flags),
    seen: strings(d.seen),
    caught: strings(d.caught),
    ...(d.ukCaught !== undefined && { ukCaught: strings(d.ukCaught) }),
    pub: validPlace(d.pub) ?? start.pub,
    // The Ranemon left on the other side of the Irish Sea, read the same way as the party.
    ...(isObject(d.away) && {
      away: { party: repairMembers(d.away.party).ok, box: repairMembers(d.away.box).ok },
    }),
    uid: Math.max(num(d.uid, 1), ...members.map((m) => m.uid + 1)),
    steps: num(d.steps, 0),
    // A skin this build doesn't know is kept, and drawn as the usual look (`lookOf`).
    skins: strings(d.skins),
  };
}

const DIRS: Dir[] = ['up', 'down', 'left', 'right'];
const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strings = (v: unknown) => arr(v).filter((s): s is string => typeof s === 'string');
const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function validPlace(v: unknown): { map: string; x: number; y: number } | null {
  if (!isObject(v) || typeof v.map !== 'string') return null;
  try {
    const map = mapById(v.map);
    const x = num(v.x, -1);
    const y = num(v.y, -1);
    if (y >= 0 && y < map.rows.length && x >= 0 && x < map.rows[y].length)
      return { map: map.id, x, y };
    return { map: map.id, ...marker(map, '@') };
  } catch {
    return null;
  }
}

/** Each member the game can still read, caught up on its moves, and the ones it can't. */
function repairMembers(list: unknown): { ok: Member[]; bad: unknown[] } {
  const ok: Member[] = [];
  const bad: unknown[] = [];
  for (const m of arr(list)) {
    try {
      if (!isObject(m) || typeof m.species !== 'string') throw new Error('not a member');
      speciesById(m.species);
      const moves = strings(m.moves).filter(known);
      const pp = arr(m.pp);
      const member: Member = {
        ...(m as unknown as Member),
        uid: num(m.uid, 0),
        level: Math.min(100, Math.max(1, Math.round(num(m.level, 5)))),
        exp: num(m.exp, 0),
        hp: Math.max(0, num(m.hp, 0)),
        moves,
        pp: moves.map((id, i) => num(pp[strings(m.moves).indexOf(id)] ?? pp[i], moveById(id).pp)),
        status:
          m.status === 'flustered' || m.status === 'hangry' || m.status === 'asleep'
            ? m.status
            : null,
        ...(m.learned !== undefined && { learned: strings(m.learned).filter(known) }),
      };
      // An item it holds that this build doesn't know is dropped, not the Ranemon.
      if (member.held !== undefined && !ITEMS.some((i) => i.id === member.held)) delete member.held;
      ok.push(catchUp(member));
    } catch {
      bad.push(m);
    }
  }
  return { ok, bad };
}

function known(id: string) {
  try {
    moveById(id);
    return true;
  } catch {
    return false;
  }
}

/** The schema a stored save is in: saves from before schemas are 1. */
export const schemaOf = (d: Raw) => num(d.schema, 1);

/**
 * A save brought up to the current shape, or null if it isn't a save at all.
 */
export function migrate(data: unknown): StoryState | null {
  if (!isObject(data) || data.version !== 1 || !Array.isArray(data.party)) return null;
  let d = data;
  for (let s = schemaOf(d); s < SCHEMA; s = schemaOf(d)) {
    const step = MIGRATIONS[s];
    if (!step) return null;
    d = step(d);
  }
  // A save from a newer build keeps its schema and anything this build doesn't know about.
  return repair(d) as unknown as StoryState;
}

/** A save read back from its JSON, or null if it isn't one. */
export function parseSave(raw: string | null | undefined): StoryState | null {
  try {
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

// ---------- this browser ----------

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** Why a copy was kept: as you played, before an update converted it, or before a restore or import replaced it. */
export type BackupReason = 'auto' | 'update' | 'restore' | 'import';

export interface Backup {
  at: number;
  why: BackupReason;
  raw: string;
}

/** The rolling copies of each trainer's save, newest first. */
export const backupKey = (name: string) => `ranemon.backups:${playerId(name)}`;
/** A copy is kept at most this often while you play. */
export const BACKUP_EVERY_MS = 10 * 60 * 1000;
/** How many copies of each kind are kept. */
const KEEP: Record<BackupReason, number> = { auto: 5, update: 3, restore: 3, import: 3 };

export function backups(storage: Pick<Storage, 'getItem'> | null, name: string): Backup[] {
  try {
    const list = JSON.parse(storage?.getItem(backupKey(name)) ?? '[]');
    return Array.isArray(list)
      ? list.filter((b): b is Backup => typeof b?.raw === 'string' && typeof b?.at === 'number')
      : [];
  } catch {
    return [];
  }
}

function keepBackup(storage: Store | null, name: string, b: Backup) {
  if (!storage) return;
  const list = [b, ...backups(storage, name).filter((o) => o.raw !== b.raw)];
  const count: Partial<Record<BackupReason, number>> = {};
  let kept = list.filter((o) => (count[o.why] = (count[o.why] ?? 0) + 1) <= KEEP[o.why]);
  // A full browser drops the oldest copies first; the save itself is already written.
  while (kept.length) {
    try {
      storage.setItem(backupKey(name), JSON.stringify(kept));
      return;
    } catch {
      kept = kept.slice(0, -1);
    }
  }
}

/** Every save this browser has for the trainer, before any of them is read: the save, then its copies. */
function stored(storage: Pick<Storage, 'getItem'> | null, name: string): string[] {
  const own = storage?.getItem(saveKey(name)) ?? null;
  // Saves from before trainer names were kept under one key, so the first name to look finds it.
  const first = own ?? storage?.getItem(SAVE_KEY) ?? null;
  return [first, ...backups(storage, name).map((b) => b.raw)].filter((r): r is string => !!r);
}

/**
 * Reads a trainer's save from this browser, or null if there is none. If the save can't be read,
 * the newest copy that can is used instead. A save in an older shape is copied aside before it
 * is converted, so an update can never lose it.
 */
export function load(
  storage: Store | Pick<Storage, 'getItem'> | null,
  name: string,
): StoryState | null {
  try {
    for (const raw of stored(storage, name)) {
      const s = parseSave(raw);
      if (!s) continue;
      const before = schemaOf(JSON.parse(raw));
      if (before < SCHEMA && storage && 'setItem' in storage)
        keepBackup(storage, name, { at: Date.now(), why: 'update', raw });
      return s;
    }
    return null;
  } catch {
    return null;
  }
}

/** Saves to this browser under the trainer's name, keeping a copy now and then. Returns the JSON written, or null. */
export function save(storage: Store | null, s: StoryState, name: string): string | null {
  try {
    const now = Date.now();
    const raw = JSON.stringify({ ...s, schema: SCHEMA, savedAt: now });
    storage?.setItem(saveKey(name), raw);
    if (!storage) return null;
    const last = backups(storage, name).find((b) => b.why === 'auto');
    if (!last || now - last.at >= BACKUP_EVERY_MS)
      keepBackup(storage, name, { at: now, why: 'auto', raw });
    return raw;
  } catch {
    return null;
  }
}

/**
 * Makes `s` the trainer's save, as a restore or an import does: the save it replaces is kept as
 * a copy first, and the new one is stamped now so it wins over any older copy online.
 */
export function replace(
  storage: Store | null,
  s: StoryState,
  name: string,
  why: 'restore' | 'import',
) {
  const current = storage?.getItem(saveKey(name));
  if (current) keepBackup(storage, name, { at: Date.now(), why, raw: current });
  return save(storage, s, name);
}

// ---------- save codes ----------

const CODE_PREFIX = 'RANEMON1';

/** FNV-1a, to catch a code that was cut short or mistyped. */
function check(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

/** A save as text that can be copied to another device, or kept in a file. */
export function exportCode(s: StoryState): string {
  const json = JSON.stringify({ ...s, schema: SCHEMA });
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const body = btoa(bin);
  return `${CODE_PREFIX}.${body}.${check(body)}`;
}

/** The save in a code (or in a file of save JSON), or why it can't be read. */
export function importCode(text: string): { state: StoryState } | { error: string } {
  const code = text.replace(/\s+/g, '');
  try {
    if (code.startsWith('{')) {
      const state = parseSave(code);
      return state ? { state } : { error: 'That file isn’t a Ranemon save.' };
    }
    const [prefix, body, sum] = code.split('.');
    if (prefix !== CODE_PREFIX || !body) return { error: 'That isn’t a Ranemon save code.' };
    if (check(body) !== sum)
      return { error: 'That code is incomplete. Copy the whole code and try again.' };
    const bin = atob(body);
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const state = parseSave(json);
    return state ? { state } : { error: 'That code’s save can’t be read.' };
  } catch {
    return { error: 'That isn’t a Ranemon save code.' };
  }
}

/** A one-line summary of a save, to tell copies apart. */
export function describe(s: StoryState): string {
  const jerseys = s.flags.filter((f) => f.startsWith('jersey:') && f !== 'jersey:all').length;
  const lead = s.party[0];
  let place = s.map;
  try {
    place = mapFor(s.map, s.flags).name;
  } catch {}
  return `${place} · ${s.party.length} Ranemon${lead ? ` (Lv${lead.level} lead)` : ''} · ${jerseys} jerseys`;
}
