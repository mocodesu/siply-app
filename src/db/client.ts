// ─────────────────────────────────────────────────────────────
// db/client.ts
// ─────────────────────────────────────────────────────────────
import * as SQLite from "expo-sqlite";

/**
 * Creates the schema on first launch. There are no migrations —
 * the app is new, so this is the single source of truth.
 * If you ever change the schema, bump the app version and
 * handle the transition explicitly in a rebuild path.
 */
export async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.execAsync(`
    -- ── Preferences (generic key/value) ────────────────────
    CREATE TABLE IF NOT EXISTS preferences (
      key        TEXT PRIMARY KEY NOT NULL,
      value      TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- ── Water logs ─────────────────────────────────────────
    -- day_key is a denormalised "YYYY-MM-DD" so daily queries
    -- can hit an index instead of scanning a timestamp range.
    CREATE TABLE IF NOT EXISTS water_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      amount_ml   INTEGER NOT NULL,
      logged_at   INTEGER NOT NULL,
      day_key     TEXT NOT NULL,
      cup_size_ml INTEGER NOT NULL,
      source      TEXT NOT NULL DEFAULT 'manual'
    );
    CREATE INDEX IF NOT EXISTS idx_water_logs_day_key
      ON water_logs(day_key, logged_at DESC);

    -- ── Daily goals ────────────────────────────────────────
    -- One row per day so historic goals stay intact when the
    -- user changes their target.
    CREATE TABLE IF NOT EXISTS daily_goals (
      day_key    TEXT PRIMARY KEY NOT NULL,
      goal_ml    INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- ── Reminders ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS reminders (
      id         TEXT PRIMARY KEY NOT NULL,
      label      TEXT NOT NULL,
      hour       INTEGER NOT NULL,
      minute     INTEGER NOT NULL,
      enabled    INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    -- ── Achievements ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS achievements (
      id          TEXT PRIMARY KEY NOT NULL,
      progress    INTEGER NOT NULL DEFAULT 0,
      target      INTEGER NOT NULL,
      unlocked_at INTEGER,
      updated_at  INTEGER NOT NULL
    );
  `);
}
