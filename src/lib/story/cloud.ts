import { playerId, type StoryMode, type StoryState } from './state';

/**
 * Online saves, filed under the trainer's name so a save follows you to another device or
 * survives a cleared browser. It is off unless the page that hosts the game provides it: the
 * claude.ai play link keeps saves in its own database, and a build with NEXT_PUBLIC_SAVE_API set
 * uses the save server in `save-api/` (`remote.ts`), where each name is locked with a PIN.
 *
 * The save in this browser is always the one you play, online or not. Online saves follow it:
 * with no connection, the newest save waits and goes up once the phone is back online. The save
 * server hands each phone a device token the first time a PIN opens a name there, so a save made
 * offline goes up without asking for the PIN again. It also counts each name's writes (`rev`):
 * a phone remembers the count its save follows on from (`base`), so if two devices both play on
 * from the same save, neither writes over the other, and the title screen asks which to keep.
 */
export interface CloudSaves {
  /** The save's JSON, or null if there is none under that name. Rejects with a CloudError. */
  load(id: string, pin?: string, opts?: LoadOpts): Promise<string | null | Online>;
  /** Rejects with a CloudError: `conflict` carries the server's save. */
  save(id: string, raw: string, pin?: string, opts?: SaveOpts): Promise<void | { rev?: number }>;
  /** Each name is locked with a PIN, chosen with its first online save. */
  pin?: boolean;
}

/** A save as the save server has it: its JSON, its count of writes, and maybe a device token. */
export interface Online {
  raw: string | null;
  rev?: number;
  device?: string;
}

export interface LoadOpts {
  /** Stands in for the PIN. */
  device?: string;
  /** Asks for a device token, for this phone to use from now on. */
  newDevice?: boolean;
}

export interface SaveOpts {
  device?: string;
  /** The `rev` this save follows on from. */
  base?: number;
}

/**
 * `pin`: the PIN doesn't match the name's. `locked`: too many wrong PINs; wait and try again.
 * `conflict`: another device has saved since; `online` is its save.
 */
export class CloudError extends Error {
  constructor(
    readonly code: 'pin' | 'locked' | 'conflict',
    readonly online?: { raw: string; rev: number },
  ) {
    super(code);
  }
}

export type OnlineResult =
  { raw: string | null; rev?: number } | { error: 'pin' | 'locked' | 'offline' };

let cloud: CloudSaves | null = null;
let ready: Promise<CloudSaves | null> = Promise.resolve(null);
/** The PIN that opened each name's online save this visit. Never stored. */
const pins = new Map<string, string>();
/** Names whose online save another device has moved on: no writes until the title sorts it out. */
const clashed = new Set<string>();

/** Turns online saves on. The host may still be connecting, so this takes a promise too. */
export function setCloudSaves(c: CloudSaves | Promise<CloudSaves | null> | null) {
  // A PIN opened a name on the host before, not this one.
  pins.clear();
  if (!(c instanceof Promise)) cloud = c;
  ready = Promise.resolve(c).then(
    (resolved) => (cloud = resolved),
    () => (cloud = null),
  );
}

export const hasCloudSaves = () => cloud !== null;

/** A short checksum of a name, for London ids that would run past the server's 20 letters. */
function digest(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36).padStart(6, '0').slice(-6);
}

/**
 * The name a save goes online under. A Dublin save keeps the trainer's own; a London-only game
 * goes under `ln__` and the name, a save (and PIN) of its own on the server, so it can never
 * write over the trainer's Dublin save. It's passed in place of the name, and `playerId` leaves
 * it as it is.
 */
export function onlineName(name: string, mode: StoryMode = 'dublin'): string {
  if (mode === 'dublin') return name;
  const id = playerId(name);
  const own = `ln__${id}`;
  return own.length <= 20 ? own : `ln__${id.slice(0, 10)}${digest(id)}`;
}
/** Whether the title screen should ask for a PIN. */
export const cloudNeedsPin = () => !!cloud?.pin;
export const isPin = (pin: string) => /^\d{4,8}$/.test(pin);

// ---------- what this browser knows about each name's online save ----------

/**
 * Kept per name in this browser. `device`: the token that stands in for the PIN. `base`: the
 * online `rev` the save here follows on from. `synced`: the `savedAt` of the last save the server
 * took, so a save made since is still to go up.
 */
export interface Sync {
  device?: string;
  base?: number;
  synced?: number;
}

const syncKey = (id: string) => `ranemon.sync:${id}`;
/** Where there's no localStorage (tests, a private window that refuses it). */
const memory = new Map<string, string>();

function storage(): Pick<Storage, 'getItem' | 'setItem'> {
  try {
    if (globalThis.localStorage) return globalThis.localStorage;
  } catch {
    // Refused: fall through.
  }
  return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v) };
}

export function readSync(name: string): Sync {
  try {
    const s = JSON.parse(storage().getItem(syncKey(playerId(name))) ?? '{}');
    return s && typeof s === 'object' ? s : {};
  } catch {
    return {};
  }
}

function writeSync(id: string, change: Sync) {
  try {
    const key = syncKey(id);
    const before = JSON.parse(storage().getItem(key) ?? '{}');
    storage().setItem(key, JSON.stringify({ ...before, ...change }));
  } catch {
    // Without storage, the next visit asks for the PIN, as before.
  }
}

/** Whether this browser's save has changes the online save doesn't have yet. */
export function unsynced(name: string, local: StoryState | null): boolean {
  if (!cloud || !local) return false;
  return readSync(name).synced !== local.savedAt;
}

// ---------- reading ----------

export async function loadOnline(name: string, pin?: string): Promise<OnlineResult> {
  const id = playerId(name);
  try {
    const c = await ready;
    if (!c) return { raw: null };
    const { device } = readSync(name);
    // The PIN when there is one, so a wrong one is still caught; the device token otherwise.
    const usePin = c.pin && pin ? pin : undefined;
    const got = await c.load(
      id,
      usePin,
      usePin ? { newDevice: !device } : device ? { device } : undefined,
    );
    const online: Online = typeof got === 'object' && got !== null ? got : { raw: got };
    if (usePin) pins.set(id, usePin);
    if (online.device) writeSync(id, { device: online.device });
    clashed.delete(id);
    return { raw: online.raw ?? null, ...(online.rev !== undefined && { rev: online.rev }) };
  } catch (e) {
    // A device token that no longer works is dropped, and the PIN asked for again.
    if (e instanceof CloudError && e.code === 'pin' && !pin) writeSync(id, { device: undefined });
    return { error: e instanceof CloudError && e.code !== 'conflict' ? e.code : 'offline' };
  }
}

/**
 * Which save to carry on from, this browser's or the online one, or `ask` when both have moved
 * on from the last save they shared. Without counts (an older server, the play link), the newer.
 */
export function choose(
  local: StoryState | null,
  online: StoryState | null,
  rev: number | undefined,
  sync: Sync,
): 'local' | 'online' | 'ask' {
  if (!online) return 'local';
  if (!local) return 'online';
  if (rev === undefined || sync.base === undefined)
    return (online.savedAt ?? 0) > (local.savedAt ?? 0) ? 'online' : 'local';
  // Nobody has saved online since this browser last did: its save is as new or newer.
  if (sync.base === rev) return 'local';
  // Nothing new here since then: the online save is simply further on.
  if (sync.synced === local.savedAt) return 'online';
  return 'ask';
}

/** The save to carry on from is settled: later saves here follow on from online save `rev`. */
export function settle(name: string, rev: number | undefined) {
  const id = playerId(name);
  clashed.delete(id);
  if (rev !== undefined) writeSync(id, { base: rev });
}

// ---------- writing ----------

/** Saves often happen a few times a minute, so writes wait a moment and keep only the last. */
const WRITE_DELAY_MS = 15_000;
let pending: { id: string; raw: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function saveOnline(name: string, raw: string) {
  const id = playerId(name);
  // A PIN-locked name is only written once its PIN has opened it this visit, or with the token
  // this phone was given when it last did.
  if (!cloud || clashed.has(id) || (cloud.pin && !pins.has(id) && !readSync(name).device)) return;
  pending = { id, raw };
  timer ??= setTimeout(flushOnline, WRITE_DELAY_MS);
}

const savedAtOf = (raw: string) => {
  try {
    return JSON.parse(raw).savedAt as number | undefined;
  } catch {
    return undefined;
  }
};

/**
 * Writes any waiting save now, such as when the page is being hidden or the connection comes
 * back. A save that can't go up waits for the next try.
 */
export function flushOnline(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  const next = pending;
  const c = cloud;
  if (!next || !c) return Promise.resolve();
  pending = null;
  const pin = pins.get(next.id);
  const { device, base } = readSync(next.id);
  return c
    .save(next.id, next.raw, pin, { ...(!pin && device && { device }), base })
    .then((done) => {
      writeSync(next.id, {
        synced: savedAtOf(next.raw),
        ...(done && done.rev !== undefined && { base: done.rev }),
      });
    })
    .catch((e) => {
      if (e instanceof CloudError && e.code === 'conflict') clashed.add(next.id);
      else if (e instanceof CloudError && e.code === 'pin')
        writeSync(next.id, { device: undefined });
      // No connection: keep it for the next try, unless a newer save has taken its place.
      else pending ??= next;
    });
}
