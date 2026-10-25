/**
 * The save server: Vercel functions (`api/`) that keep each trainer's online save in a Neon
 * Postgres database (`store.ts`), locked with a PIN. Only a salted PBKDF2 hash of the PIN is
 * kept, and five wrong PINs lock a name for 15 minutes, so a 4-digit PIN can't be guessed by
 * trying them all.
 *
 *   POST /api/load {id, pin}       → {raw} (null if the name has no save yet), 401 wrong PIN,
 *                                    429 locked
 *   POST /api/save {id, pin, raw}  → {ok}; the first save of a name sets its PIN. 409 if the
 *                                    server already has a newer save (from another device),
 *                                    which it keeps.
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
}

export interface SaveStore {
  get(id: string): Promise<SaveRow | null>;
  put(row: SaveRow): Promise<void>;
  fails(id: string): Promise<{ count: number; until: number } | null>;
  setFails(id: string, count: number, until: number): Promise<void>;
  clearFails(id: string): Promise<void>;
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

/** Compares in the same time whatever the strings, so timing can't give a hash away. */
function same(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** The save's own timestamp, or null if `raw` isn't a Ranemon save. */
function savedAtOf(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.length > MAX_SAVE_BYTES) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.version !== 1 || !Array.isArray(d.party)) return null;
    return typeof d.savedAt === 'number' ? d.savedAt : 0;
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

  let body: { id?: unknown; pin?: unknown; raw?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'bad request' });
  }
  const { id, pin } = body;
  if (typeof id !== 'string' || !ID.test(id) || typeof pin !== 'string' || !PIN.test(pin))
    return reply(400, { error: 'bad name or PIN' });

  const fails = await store.fails(id);
  if (fails && fails.count >= MAX_FAILS && fails.until > now())
    return reply(429, { error: 'locked' });

  const row = await store.get(id);
  if (row && !same(await hashPin(pin, row.salt), row.hash)) {
    const count = fails && fails.until > now() ? fails.count + 1 : 1;
    await store.setFails(id, count, now() + LOCK_MS);
    return reply(401, { error: 'wrong PIN' });
  }
  if (fails) await store.clearFails(id);

  if (path === '/load') return reply(200, { raw: row?.raw ?? null });

  const savedAt = savedAtOf(body.raw);
  if (savedAt === null) return reply(400, { error: 'not a save' });
  const raw = body.raw as string;
  if (!row) {
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    await store.put({
      id,
      raw,
      saved_at: savedAt,
      salt,
      hash: await hashPin(pin, salt),
      prev_raw: null,
      prev_at: null,
    });
    return reply(200, { ok: true });
  }
  if (row.saved_at > savedAt) return reply(409, { error: 'newer save kept', kept: row.saved_at });
  const keepPrev = !row.prev_at || now() - row.prev_at >= PREV_EVERY_MS;
  await store.put({
    ...row,
    raw,
    saved_at: savedAt,
    ...(keepPrev && { prev_raw: row.raw, prev_at: now() }),
  });
  return reply(200, { ok: true });
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
