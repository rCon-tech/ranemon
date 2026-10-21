-- The save server's tables (Cloudflare D1, which is SQLite).
CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,         -- the trainer name as saves are filed under it
  raw TEXT NOT NULL,           -- the save's JSON
  saved_at INTEGER NOT NULL,   -- the save's own savedAt, so an older device can't overwrite a newer save
  salt TEXT NOT NULL,          -- the PIN's salt and PBKDF2 hash; the PIN itself is never kept
  hash TEXT NOT NULL,
  prev_raw TEXT,               -- the save as it was up to an hour before, to restore by hand
  prev_at INTEGER
);

CREATE TABLE IF NOT EXISTS fails (
  id TEXT PRIMARY KEY,         -- wrong PINs for a name, so a PIN can't be guessed
  count INTEGER NOT NULL,
  until INTEGER NOT NULL
);
