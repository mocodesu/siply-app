// ─────────────────────────────────────────────────────────────
// db/client.ts
//
// Schema bootstrap. Single source of truth for the database
// shape — `CREATE TABLE IF NOT EXISTS` is idempotent.
//
// ── During development ───────────────────────────────────────
// When the schema below changes, `IF NOT EXISTS` means the old
// tables survive and any new columns are silently missing. To
// pick up a schema change, wipe the app's local storage:
//
//   iOS Simulator:  xcrun simctl uninstall booted <bundle-id>
//   Android:        adb shell pm clear <package-name>
//   Device:         delete and reinstall the app
//
// Or change the database filename in `app/_layout.tsx` — a new
// name means a fresh database.
// ─────────────────────────────────────────────────────────────
import * as SQLite from "expo-sqlite";

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
    CREATE TABLE IF NOT EXISTS daily_goals (
      day_key    TEXT PRIMARY KEY NOT NULL,
      goal_ml    INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- ── Reminders ──────────────────────────────────────────
    -- The row's own  is used as the OS notification
    -- identifier, so there is no separate column for it.
    CREATE TABLE IF NOT EXISTS reminders (
      id         TEXT PRIMARY KEY NOT NULL,
      label      TEXT NOT NULL,
      hour       INTEGER NOT NULL,
      minute     INTEGER NOT NULL,
      enabled    INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    -- ── App-level reminder preferences ─────────────────────
    CREATE TABLE IF NOT EXISTS reminder_preferences (
      key        TEXT PRIMARY KEY NOT NULL,
      value      TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- ── App settings (key/value) ───────────────────────────
    -- Keys:
    --   settings.defaultCupSize  → "100" | "250" | "500"
    --   settings.units           → "ml" | "oz"
    --   settings.startDay        → "monday" | "sunday"
    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY NOT NULL,
      value      TEXT NOT NULL,
      updated_at INTEGER NOT NULL
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
