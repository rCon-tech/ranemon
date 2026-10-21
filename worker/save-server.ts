/**
 * The save server: a Cloudflare Worker that keeps each trainer's online save in a D1 database,
 * locked with a PIN. Only a salted PBKDF2 hash of the PIN is kept, and five wrong PINs lock a name
 * for 15 minutes, so a 4-digit PIN can't be guessed by trying them all.
 *
 *   POST /load {id, pin}       → {raw} (null if the name has no save yet), 401 wrong PIN, 429 locked
 *   POST /save {id, pin, raw}  → {ok}; the first save of a name sets its PIN. 409 if the server
 *                                already has a newer save (from another device), which it keeps.
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

export interface Options {
  /** Sites allowed to call the server. */
  origins: string[];
  now?: () => number;
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
  const path = new URL(req.url).pathname;
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

// ---------- Cloudflare ----------

/** The parts of Cloudflare's D1 binding the server uses. */
interface D1 {
  prepare(query: string): {
    bind(...values: unknown[]): { first<T>(): Promise<T | null>; run(): Promise<unknown> };
  };
}

export function d1Store(db: D1): SaveStore {
  return {
    get: (id) => db.prepare('SELECT * FROM saves WHERE id = ?').bind(id).first<SaveRow>(),
    put: async (r) =>
      void (await db
        .prepare(
          `INSERT INTO saves (id, raw, saved_at, salt, hash, prev_raw, prev_at) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET raw = excluded.raw, saved_at = excluded.saved_at,
             prev_raw = excluded.prev_raw, prev_at = excluded.prev_at`,
        )
        .bind(r.id, r.raw, r.saved_at, r.salt, r.hash, r.prev_raw, r.prev_at)
        .run()),
    fails: (id) =>
      db.prepare('SELECT count, until FROM fails WHERE id = ?').bind(id).first<{
        count: number;
        until: number;
      }>(),
    setFails: async (id, count, until) =>
      void (await db
        .prepare(
          'INSERT INTO fails (id, count, until) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET count = excluded.count, until = excluded.until',
        )
        .bind(id, count, until)
        .run()),
    clearFails: async (id) =>
      void (await db.prepare('DELETE FROM fails WHERE id = ?').bind(id).run()),
  };
}

const worker = {
  fetch(req: Request, env: { DB: D1; ALLOWED_ORIGINS: string }): Promise<Response> {
    return handle(req, d1Store(env.DB), {
      origins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    });
  },
};

export default worker;
