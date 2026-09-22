// ─────────────────────────────────────────────────────────────
// repositories/settings-repo.ts
//
// Key/value persistence for user-facing app settings. Every key
// lives under the `settings.` namespace so it can't collide with
// hydration or reminder preferences stored elsewhere.
//
// Values are stored as strings. The typed getters parse them and
// fall back to defaults when a row is missing or malformed — so a
// corrupt value never crashes a screen.
// ─────────────────────────────────────────────────────────────
import type { SQLiteDatabase } from "expo-sqlite";

// ─────────────────────────────────────────────────────────────
// Keys
// ─────────────────────────────────────────────────────────────

export const SETTINGS_KEYS = {
  defaultCupSize: "settings.defaultCupSize",
  units: "settings.units",
  startDay: "settings.startDay",
  appleHealth: "settings.appleHealth",
  googleFit: "settings.googleFit",
} as const;

// ─────────────────────────────────────────────────────────────
// Value types
// ─────────────────────────────────────────────────────────────

export type CupSizeMl = 100 | 250 | 500;
export type Units = "ml" | "oz";
export type StartDay = "monday" | "sunday";

export interface AppSettings {
  defaultCupSize: CupSizeMl;
  units: Units;
  startDay: StartDay;
  appleHealth: boolean;
  googleFit: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultCupSize: 250,
  units: "ml",
  startDay: "monday",
  appleHealth: false,
  googleFit: false,
};

// ─────────────────────────────────────────────────────────────
// Parsers
// ─────────────────────────────────────────────────────────────

function parseCupSize(raw: string | undefined): CupSizeMl {
  const n = Number(raw);
  if (n === 100 || n === 250 || n === 500) return n;
  return DEFAULT_SETTINGS.defaultCupSize;
}

function parseUnits(raw: string | undefined): Units {
  if (raw === "ml" || raw === "oz") return raw;
  return DEFAULT_SETTINGS.units;
}

function parseStartDay(raw: string | undefined): StartDay {
  if (raw === "monday" || raw === "sunday") return raw;
  return DEFAULT_SETTINGS.startDay;
}

function parseBool(raw: string | undefined): boolean {
  return raw === "true";
}

// ─────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────

export const SettingsRepo = {
  async getAll(db: SQLiteDatabase): Promise<AppSettings> {
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      `SELECT key, value FROM app_settings`,
    );

    const map = new Map(rows.map((r) => [r.key, r.value]));

    return {
      defaultCupSize: parseCupSize(map.get(SETTINGS_KEYS.defaultCupSize)),
      units: parseUnits(map.get(SETTINGS_KEYS.units)),
      startDay: parseStartDay(map.get(SETTINGS_KEYS.startDay)),
      appleHealth: parseBool(map.get(SETTINGS_KEYS.appleHealth)),
      googleFit: parseBool(map.get(SETTINGS_KEYS.googleFit)),
    };
  },

  async set(db: SQLiteDatabase, key: string, value: string): Promise<void> {
    await db.runAsync(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
      key,
      value,
      Date.now(),
    );
  },
};
