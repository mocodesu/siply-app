// ─────────────────────────────────────────────────────────────
// store/settings-store.ts
//
// Global settings state. Loaded once on app start and kept in
// memory so screens read synchronously without a DB round-trip.
//
// Writes are optimistic: state updates immediately, then the row
// is persisted. If persistence fails, the in-memory value stays
// changed — acceptable for preferences, where the worst case is a
// setting reverting on next launch rather than a broken screen.
// ─────────────────────────────────────────────────────────────
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEYS,
  SettingsRepo,
  type AppSettings,
  type CupSizeMl,
  type StartDay,
  type Units,
} from "@/repositories/settings-repo";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

interface SettingsStore extends AppSettings {
  // ── Lifecycle ─────────────────────────────────────────
  db: SQLiteDatabase | null;
  isReady: boolean;
  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;

  // ── Setters ───────────────────────────────────────────
  setDefaultCupSize: (value: CupSizeMl) => Promise<void>;
  setUnits: (value: Units) => Promise<void>;
  setStartDay: (value: StartDay) => Promise<void>;
  setAppleHealth: (value: boolean) => Promise<void>;
  setGoogleFit: (value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  db: null,
  isReady: false,

  attach: (db) => {
    set({ db });
    void get().refresh();
  },

  refresh: async () => {
    const { db } = get();
    if (!db) return;

    const settings = await SettingsRepo.getAll(db);
    set({ ...settings, isReady: true });
  },

  setDefaultCupSize: async (value) => {
    const { db } = get();
    set({ defaultCupSize: value });
    if (db) {
      await SettingsRepo.set(db, SETTINGS_KEYS.defaultCupSize, String(value));
    }
  },

  setUnits: async (value) => {
    const { db } = get();
    set({ units: value });
    if (db) {
      await SettingsRepo.set(db, SETTINGS_KEYS.units, value);
    }
  },

  setStartDay: async (value) => {
    const { db } = get();
    set({ startDay: value });
    if (db) {
      await SettingsRepo.set(db, SETTINGS_KEYS.startDay, value);
    }
  },

  setAppleHealth: async (value) => {
    const { db } = get();
    set({ appleHealth: value });
    if (db) {
      await SettingsRepo.set(
        db,
        SETTINGS_KEYS.appleHealth,
        value ? "true" : "false",
      );
    }
  },

  setGoogleFit: async (value) => {
    const { db } = get();
    set({ googleFit: value });
    if (db) {
      await SettingsRepo.set(
        db,
        SETTINGS_KEYS.googleFit,
        value ? "true" : "false",
      );
    }
  },
}));
