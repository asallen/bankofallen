CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('parent', 'kid')),
  display_name    TEXT NOT NULL,
  photo           TEXT,                       -- small JPEG data URL
  photo_v         INTEGER NOT NULL DEFAULT 0, -- cache buster
  allowance_cents INTEGER NOT NULL DEFAULT 0,
  allowance_day   INTEGER NOT NULL DEFAULT 6  -- 0 = Sunday ... 6 = Saturday
);

CREATE TABLE IF NOT EXISTS transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  kid_id       INTEGER NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,              -- positive = money in, negative = money out
  type         TEXT NOT NULL CHECK (type IN ('deposit', 'debit', 'allowance', 'interest')),
  memo         TEXT NOT NULL DEFAULT '',
  date         TEXT NOT NULL,                 -- YYYY-MM-DD in the family's timezone
  created_by   INTEGER REFERENCES users(id),  -- NULL for automatic allowance/interest
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  key          TEXT UNIQUE                    -- prevents paying the same allowance/interest twice
);
CREATE INDEX IF NOT EXISTS transactions_kid ON transactions (kid_id, date);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
