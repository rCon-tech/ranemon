import { neon } from '@neondatabase/serverless';
import type { CrownStore, RoomStore, SaveRow, SaveStore, SeshRow, SeshStore } from './handler.js';

/** The tables, made on first use, so setting up needs no SQL. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS saves (
    id TEXT PRIMARY KEY,         -- the trainer name as saves are filed under it
    raw TEXT NOT NULL,           -- the save's JSON
    saved_at BIGINT NOT NULL,    -- the save's own savedAt, so an older device can't overwrite a newer save
    salt TEXT NOT NULL,          -- the PIN's salt and PBKDF2 hash; the PIN itself is never kept
    hash TEXT NOT NULL,
    prev_raw TEXT,               -- the save as it was up to an hour before, to restore by hand
    prev_at BIGINT
  )`,
  // Counts the writes, so a phone can tell whether another device has saved since it last did.
  `ALTER TABLE saves ADD COLUMN IF NOT EXISTS rev INTEGER NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS devices (
    hash TEXT PRIMARY KEY,       -- a SHA-256 of a phone's device token, which stands in for the PIN
    id TEXT NOT NULL,            -- the name it was handed out for
    created BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS fails (
    id TEXT PRIMARY KEY,         -- wrong PINs for a name, so a PIN can't be guessed
    count INTEGER NOT NULL,
    until BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS battles (
    code TEXT PRIMARY KEY,       -- a friend battle's room code, like BOKA-42
    doc TEXT NOT NULL,           -- the room and its battle, as JSON
    version INTEGER NOT NULL,    -- bumped on each write, so two calls at once can't overwrite each other
    updated BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS crown (
    id TEXT PRIMARY KEY,         -- always 'online': there is one Online Champion
    doc TEXT NOT NULL,           -- who holds it, as JSON
    version INTEGER NOT NULL,    -- bumped on each write, so two battles ending at once can't both take it
    updated BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sesh_runs (
    id TEXT NOT NULL,            -- the trainer name, as saves are filed under it
    day TEXT NOT NULL,           -- the Daily Challenge's day (UTC, YYYY-MM-DD), or 'free'
    seed BIGINT NOT NULL,        -- with the choices, all it takes to replay the run
    name TEXT NOT NULL,          -- the name as typed, for the boards
    score BIGINT NOT NULL,       -- worked out by the server's own replay, never sent by a phone
    beaten INTEGER NOT NULL,
    standing INTEGER NOT NULL,
    turns INTEGER NOT NULL,
    at BIGINT NOT NULL,          -- when the server took it: ties go to whoever was first
    actions TEXT NOT NULL,       -- every choice, as JSON
    PRIMARY KEY (id, day, seed)
  )`,
  `CREATE INDEX IF NOT EXISTS sesh_runs_board ON sesh_runs (day, score DESC, at)`,
];

/** A room code can be used again once its room has been quiet this long. */
const ROOM_KEPT_MS = 24 * 60 * 60 * 1000;

/** Postgres hands BIGINTs back as strings. */
const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function query(url: string) {
  const sql = neon(url);
  let ready: Promise<unknown> | null = null;
  return async (text: string, params: unknown[]) => {
    ready ??= Promise.all(SCHEMA.map((s) => sql.query(s))).catch((e) => {
      ready = null;
      throw e;
    });
    await ready;
    return (await sql.query(text, params)) as Record<string, unknown>[];
  };
}

/** Friend battle rooms, in the same database. Old rooms are cleared out as new ones open. */
export function neonRooms(url: string): RoomStore {
  const q = query(url);
  return {
    get: async (code) => {
      const [r] = await q('SELECT doc, version FROM battles WHERE code = $1', [code]);
      return r ? { doc: String(r.doc), version: Number(r.version) } : null;
    },
    put: async (code, doc, version, now) => {
      if (version > 0) {
        const rows = await q(
          `UPDATE battles SET doc = $2, version = version + 1, updated = $4
           WHERE code = $1 AND version = $3 RETURNING code`,
          [code, doc, version, now],
        );
        return rows.length > 0;
      }
      await q('DELETE FROM battles WHERE updated < $1', [now - ROOM_KEPT_MS]);
      const rows = await q(
        `INSERT INTO battles (code, doc, version, updated) VALUES ($1, $2, 1, $3)
         ON CONFLICT (code) DO NOTHING RETURNING code`,
        [code, doc, now],
      );
      return rows.length > 0;
    },
  };
}

/** The Online Champion, in the same database, as one row. */
export function neonCrown(url: string): CrownStore {
  const q = query(url);
  return {
    get: async () => {
      const [r] = await q(`SELECT doc, version FROM crown WHERE id = 'online'`, []);
      return r ? { doc: String(r.doc), version: Number(r.version) } : null;
    },
    put: async (doc, version, now) => {
      const rows =
        version > 0
          ? await q(
              `UPDATE crown SET doc = $1, version = version + 1, updated = $3
               WHERE id = 'online' AND version = $2 RETURNING id`,
              [doc, version, now],
            )
          : await q(
              `INSERT INTO crown (id, doc, version, updated) VALUES ('online', $1, 1, $2)
               ON CONFLICT (id) DO NOTHING RETURNING id`,
              [doc, now],
            );
      return rows.length > 0;
    },
  };
}

/** Saves in the Neon database that Vercel's Storage tab connects as DATABASE_URL. */
export function neonStore(url: string): SaveStore {
  const q = query(url);
  return {
    get: async (id) => {
      const [r] = await q('SELECT * FROM saves WHERE id = $1', [id]);
      return r
        ? ({
            ...r,
            saved_at: n(r.saved_at),
            prev_at: n(r.prev_at),
            rev: n(r.rev) ?? 0,
          } as unknown as SaveRow)
        : null;
    },
    put: async (r) =>
      void (await q(
        `INSERT INTO saves (id, raw, saved_at, salt, hash, prev_raw, prev_at, rev)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET raw = EXCLUDED.raw, saved_at = EXCLUDED.saved_at,
           prev_raw = EXCLUDED.prev_raw, prev_at = EXCLUDED.prev_at, rev = EXCLUDED.rev`,
        [r.id, r.raw, r.saved_at, r.salt, r.hash, r.prev_raw, r.prev_at, r.rev ?? 0],
      )),
    fails: async (id) => {
      const [r] = await q('SELECT count, until FROM fails WHERE id = $1', [id]);
      return r ? { count: Number(r.count), until: Number(r.until) } : null;
    },
    setFails: async (id, count, until) =>
      void (await q(
        `INSERT INTO fails (id, count, until) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET count = EXCLUDED.count, until = EXCLUDED.until`,
        [id, count, until],
      )),
    clearFails: async (id) => void (await q('DELETE FROM fails WHERE id = $1', [id])),
    device: async (hash) => {
      const [r] = await q('SELECT id FROM devices WHERE hash = $1', [hash]);
      return r ? String(r.id) : null;
    },
    addDevice: async (hash, id, now) =>
      void (await q('INSERT INTO devices (hash, id, created) VALUES ($1, $2, $3)', [
        hash,
        id,
        now,
      ])),
  };
}

const seshRow = (r: Record<string, unknown>): SeshRow => ({
  name: String(r.name),
  day: String(r.day),
  score: Number(r.score),
  beaten: Number(r.beaten),
  standing: Number(r.standing),
  turns: Number(r.turns),
  at: Number(r.at),
});

const ROW = 'name, day, score, beaten, standing, turns, at';

/** The Sesh's runs, in the same database. Each name keeps its best run per day and seed. */
export function neonSesh(url: string): SeshStore {
  const q = query(url);
  return {
    put: async (e) => {
      const rows = await q(
        `INSERT INTO sesh_runs (id, day, seed, name, score, beaten, standing, turns, at, actions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id, day, seed) DO UPDATE SET name = EXCLUDED.name, score = EXCLUDED.score,
           beaten = EXCLUDED.beaten, standing = EXCLUDED.standing, turns = EXCLUDED.turns,
           at = EXCLUDED.at, actions = EXCLUDED.actions
         WHERE EXCLUDED.score > sesh_runs.score
         RETURNING id`,
        [e.id, e.day, e.seed, e.name, e.score, e.beaten, e.standing, e.turns, e.at, e.actions],
      );
      return rows.length > 0;
    },
    board: async (day, limit) =>
      (
        await q(`SELECT ${ROW} FROM sesh_runs WHERE day = $1 ORDER BY score DESC, at LIMIT $2`, [
          day,
          limit,
        ])
      ).map(seshRow),
    winners: async (before, limit) =>
      (
        await q(
          `SELECT * FROM (
             SELECT DISTINCT ON (day) ${ROW} FROM sesh_runs
             WHERE day <> 'free' AND day < $1 ORDER BY day, score DESC, at
           ) w ORDER BY day DESC LIMIT $2`,
          [before, limit],
        )
      ).map(seshRow),
    mine: async (id, day, limit) =>
      (
        await q(
          day === null
            ? `SELECT ${ROW} FROM sesh_runs WHERE id = $1 AND day <> 'free' ORDER BY day DESC LIMIT $2`
            : `SELECT ${ROW} FROM sesh_runs WHERE id = $1 AND day = $3 ORDER BY score DESC, at LIMIT $2`,
          day === null ? [id, limit] : [id, limit, day],
        )
      ).map(seshRow),
  };
}
