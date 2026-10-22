import { neon } from '@neondatabase/serverless';
import type { RoomStore, SaveRow, SaveStore } from './handler.js';

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

/** Saves in the Neon database that Vercel's Storage tab connects as DATABASE_URL. */
export function neonStore(url: string): SaveStore {
  const q = query(url);
  return {
    get: async (id) => {
      const [r] = await q('SELECT * FROM saves WHERE id = $1', [id]);
      return r
        ? ({ ...r, saved_at: n(r.saved_at), prev_at: n(r.prev_at) } as unknown as SaveRow)
        : null;
    },
    put: async (r) =>
      void (await q(
        `INSERT INTO saves (id, raw, saved_at, salt, hash, prev_raw, prev_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET raw = EXCLUDED.raw, saved_at = EXCLUDED.saved_at,
           prev_raw = EXCLUDED.prev_raw, prev_at = EXCLUDED.prev_at`,
        [r.id, r.raw, r.saved_at, r.salt, r.hash, r.prev_raw, r.prev_at],
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
  };
}
