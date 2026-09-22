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
    -- ── Tables ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS preferences (
  key        TEXT PRIMARY KEY NOT NULL,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
  `);
}
