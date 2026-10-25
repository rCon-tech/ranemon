/**
 * The save server: Vercel functions (`api/`) that keep each trainer's online save in a Neon
 * Postgres database (`store.ts`), locked with a PIN. Only a salted PBKDF2 hash of the PIN is
 * kept, and five wrong PINs lock a name for 15 minutes, so a 4-digit PIN can't be guessed by
 * trying them all.
 *
 *   POST /api/load {id, pin}       → {raw, rev} (raw null if the name has no save yet), 401
 *                                    wrong PIN, 429 locked. With `newDevice: true` it also hands
 *                                    back a `device` token, which works in place of the PIN from
 *                                    then on, so a phone can back up a save made offline without
 *                                    asking for the PIN again.
 *   POST /api/load {id, device}    → the same, with a device token instead of the PIN
 *   POST /api/save {id, pin, raw, base}
 *                                  → {ok, rev}; the first save of a name sets its PIN, and
 *                                    `device` works in place of the PIN. `base` is the `rev` the
 *                                    phone's save follows on from: if another device has saved
 *                                    since, it's 409 {error: 'conflict', raw, rev} with the
 *                                    server's save, and nothing is written. Without `base` (older
 *                                    builds of the game) it's 409 if the
 *                                    server already has a newer save (from another device),
 *                                    which it keeps, or one in a newer schema ({error:
 *                                    'update'}) from a newer build of the game.
 *   POST /api/battle {op, ...}     → live friend battles and the Online Champion, run by
 *                                    `src/lib/online/server.ts`
 *
 * The handler takes its storage as a `SaveStore`, so the tests run it against memory.
 */

export interface SaveRow {
  id: string;
  raw: string;
  saved_at: number;
  salt: string;
  hash: string;
  prev_raw: string | null;
  prev_at: number | null;
  /** Counts the writes, so a phone can tell whether another device has saved since it last did. */
  rev?: number;
}

export interface SaveStore {
  get(id: string): Promise<SaveRow | null>;
  put(row: SaveRow): Promise<void>;
  fails(id: string): Promise<{ count: number; until: number } | null>;
  setFails(id: string, count: number, until: number): Promise<void>;
  clearFails(id: string): Promise<void>;
  /** The name a device token (by its hash) was handed out for, if the store keeps them. */
  device?(hash: string): Promise<string | null>;
  addDevice?(hash: string, id: string, now: number): Promise<void>;
}

/** A friend battle room as the battle logic stores it (`RoomStore` in `src/lib/online/server.ts`). */
export interface RoomStore {
  get(code: string): Promise<{ doc: string; version: number } | null>;
  put(code: string, doc: string, version: number, now: number): Promise<boolean>;
}

/** The Online Champion's record (`CrownStore` in `src/lib/online/server.ts`). */
export interface CrownStore {
  get(): Promise<{ doc: string; version: number } | null>;
  put(doc: string, version: number, now: number): Promise<boolean>;
}

/** What the battle logic needs from the save server (`BattleContext` there). */
export interface BattleContext {
  rooms: RoomStore;
  auth(id: string, pin: string): Promise<'ok' | 'pin' | 'locked' | 'nosave'>;
  save(id: string): Promise<string | null>;
  now(): number;
  seed(): number;
  token(): string;
  random(): number;
  crown?: CrownStore;
}

/**
 * The battle logic, bundled from the game's own code at build time (`gen/battle.js`), so the
 * server plays a turn exactly as the game would.
 */
export type BattleCall = (
  body: unknown,
  ctx: BattleContext,
) => Promise<{ status: number; body: object }>;

export interface Options {
  /** Sites allowed to call the server. */
  origins: string[];
  now?: () => number;
  /** Friend battles, when this deployment has them. */
  battles?: { rooms: RoomStore; call: BattleCall; crown?: CrownStore };
}

export const MAX_FAILS = 5;
export const LOCK_MS = 15 * 60 * 1000;
/** The server keeps the save as it was up to an hour before, to restore by hand. */
const PREV_EVERY_MS = 60 * 60 * 1000;
const MAX_SAVE_BYTES = 256 * 1024;
const ITERATIONS = 10_000;

const ID = /^[a-z0-9_-]{1,20}$/;
const PIN = /^\d{4,8}$/;

const b64 = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));

async function hashPin(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: Uint8Array.from(atob(salt), (c) => c.charCodeAt(0)),
      iterations: ITERATIONS,
    },
    key,
    256,
  );
  return b64(bits);
}

/** Checks a name's PIN, counting wrong ones towards the lock. */
async function checkPin(
  store: SaveStore,
  id: string,
  pin: string,
  now: number,
): Promise<'ok' | 'pin' | 'locked' | 'nosave'> {
  if (!ID.test(id) || !PIN.test(pin)) return 'pin';
  const fails = await store.fails(id);
  if (fails && fails.count >= MAX_FAILS && fails.until > now) return 'locked';
  const row = await store.get(id);
  if (!row) return 'nosave';
  if (!same(await hashPin(pin, row.salt), row.hash)) {
    const count = fails && fails.until > now ? fails.count + 1 : 1;
    await store.setFails(id, count, now + LOCK_MS);
    return 'pin';
  }
  if (fails) await store.clearFails(id);
  return 'ok';
}

const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

const DEVICE = /^[A-Za-z0-9_-]{32}$/;

/** Only a hash of each device token is kept, like the PIN. */
async function hashDevice(token: string): Promise<string> {
  return b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
}

/** Compares in the same time whatever the strings, so timing can't give a hash away. */
function same(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** The save's own timestamp and schema, or null if `raw` isn't a Ranemon save. */
function saveInfo(raw: unknown): { savedAt: number; schema: number } | null {
  if (typeof raw !== 'string' || raw.length > MAX_SAVE_BYTES) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.version !== 1 || !Array.isArray(d.party)) return null;
    return {
      savedAt: typeof d.savedAt === 'number' ? d.savedAt : 0,
      // Saves from before schemas are 1, as in the game.
      schema: typeof d.schema === 'number' ? d.schema : 1,
    };
  } catch {
    return null;
  }
}

export async function handle(req: Request, store: SaveStore, opts: Options): Promise<Response> {
  const now = opts.now ?? Date.now;
  const origin = req.headers.get('origin') ?? '';
  const cors: Record<string, string> = opts.origins.includes(origin)
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        vary: 'origin',
      }
    : {};
  const reply = (status: number, body: object) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...cors },
    });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const path = new URL(req.url).pathname.replace(/^\/api/, '').replace(/\/$/, '');
  if (req.method === 'POST' && path === '/battle' && opts.battles) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return reply(400, { error: 'bad request' });
    }
    const { rooms, call, crown } = opts.battles;
    const r = await call(body, {
      rooms,
      ...(crown && { crown }),
      auth: (id, pin) => checkPin(store, id, pin, now()),
      save: async (id) => (await store.get(id))?.raw ?? null,
      now,
      seed: () => new Int32Array(randomBytes(4).buffer)[0],
      token: () => b64(randomBytes(18)).replace(/\+/g, '-').replace(/\//g, '_'),
      random: () => new Uint32Array(randomBytes(4).buffer)[0] / 2 ** 32,
    });
    return reply(r.status, r.body);
  }
  if (req.method !== 'POST' || (path !== '/load' && path !== '/save'))
    return reply(404, { error: 'not found' });

  let body: {
    id?: unknown;
    pin?: unknown;
    device?: unknown;
    newDevice?: unknown;
    raw?: unknown;
    base?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'bad request' });
  }
  const { id, pin, device } = body;
  const byDevice = typeof device === 'string' && pin === undefined;
  if (
    typeof id !== 'string' ||
    !ID.test(id) ||
    (byDevice ? !DEVICE.test(device) : typeof pin !== 'string' || !PIN.test(pin))
  )
    return reply(400, { error: 'bad name or PIN' });

  const row = await store.get(id);
  if (byDevice) {
    // A device token stands in for a PIN that has already opened the name on this phone.
    const owner = row && store.device ? await store.device(await hashDevice(device)) : null;
    if (owner !== id) return reply(401, { error: 'wrong PIN' });
  } else {
    const fails = await store.fails(id);
    if (fails && fails.count >= MAX_FAILS && fails.until > now())
      return reply(429, { error: 'locked' });
    if (row && !same(await hashPin(pin as string, row.salt), row.hash)) {
      const count = fails && fails.until > now() ? fails.count + 1 : 1;
      await store.setFails(id, count, now() + LOCK_MS);
      return reply(401, { error: 'wrong PIN' });
    }
    if (fails) await store.clearFails(id);
  }

  if (path === '/load') {
    let token: string | undefined;
    if (row && !byDevice && body.newDevice === true && store.addDevice) {
      token = b64(randomBytes(24)).replace(/\+/g, '-').replace(/\//g, '_');
      await store.addDevice(await hashDevice(token), id, now());
    }
    return reply(200, {
      raw: row?.raw ?? null,
      ...(row && { rev: row.rev ?? 0 }),
      ...(token && { device: token }),
    });
  }

  const info = saveInfo(body.raw);
  if (info === null) return reply(400, { error: 'not a save' });
  const { savedAt } = info;
  const raw = body.raw as string;
  if (!row) {
    // A new name's first save sets its PIN, so it needs one.
    if (byDevice) return reply(401, { error: 'wrong PIN' });
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    await store.put({
      id,
      raw,
      saved_at: savedAt,
      salt,
      hash: await hashPin(pin as string, salt),
      prev_raw: null,
      prev_at: null,
      rev: 1,
    });
    return reply(200, { ok: true, rev: 1 });
  }
  const rev = row.rev ?? 0;
  if (typeof body.base === 'number') {
    // Another device has saved since this phone last did: send its save back, write nothing.
    if (body.base !== rev) return reply(409, { error: 'conflict', raw: row.raw, rev });
  } else if (row.saved_at > savedAt)
    return reply(409, { error: 'newer save kept', kept: row.saved_at });
  // An older build of the game (one cached for offline play) mustn't write over a save a newer
  // build has already converted: it would come back stamped with the older schema.
  if (info.schema < (saveInfo(row.raw)?.schema ?? 1)) return reply(409, { error: 'update' });
  const keepPrev = !row.prev_at || now() - row.prev_at >= PREV_EVERY_MS;
  await store.put({
    ...row,
    raw,
    saved_at: savedAt,
    rev: rev + 1,
    ...(keepPrev && { prev_raw: row.raw, prev_at: now() }),
  });
  return reply(200, { ok: true, rev: rev + 1 });
}

/**
 * The database's address. Vercel's Neon integration names it DATABASE_URL, POSTGRES_URL, or
 * either with a prefix chosen when connecting it, so any of those will do.
 */
export function databaseUrl(env: Record<string, string | undefined>): string | null {
  const names = Object.keys(env);
  const name =
    ['DATABASE_URL', 'POSTGRES_URL'].find((n) => env[n]) ??
    names.find((n) => /_DATABASE_URL$/.test(n) && env[n]) ??
    names.find((n) => /_POSTGRES_URL$/.test(n) && env[n]);
  return name ? env[name]! : null;
}
