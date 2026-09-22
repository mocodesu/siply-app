// store/settings-store.ts
//
// Global settings state. Loaded once on app start and kept in
// memory so screens read synchronously without a DB round-trip.
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

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

interface SettingsStore extends AppSettings {
  db: SQLiteDatabase | null;
  isReady: boolean;
  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;

  setDefaultCupSize: (value: CupSizeMl) => Promise<void>;
  setUnits: (value: Units) => Promise<void>;
  setStartDay: (value: StartDay) => Promise<void>;
  setAppleHealth: (value: boolean) => Promise<void>;
  setGoogleFit: (value: boolean) => Promise<void>;
}

// -------------------------------------------------------------
// Store
// -------------------------------------------------------------

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
    if (db)
      await SettingsRepo.set(db, SETTINGS_KEYS.defaultCupSize, String(value));
  },

  setUnits: async (value) => {
    const { db } = get();
    set({ units: value });
    if (db) await SettingsRepo.set(db, SETTINGS_KEYS.units, value);
  },

  setStartDay: async (value) => {
    const { db } = get();
    set({ startDay: value });
    if (db) await SettingsRepo.set(db, SETTINGS_KEYS.startDay, value);
  },

  setAppleHealth: async (value) => {
    const { db } = get();
    set({ appleHealth: value });
    if (db)
      await SettingsRepo.set(
        db,
        SETTINGS_KEYS.appleHealth,
        value ? "true" : "false",
      );
  },

  setGoogleFit: async (value) => {
    const { db } = get();
    set({ googleFit: value });
    if (db)
      await SettingsRepo.set(
        db,
        SETTINGS_KEYS.googleFit,
        value ? "true" : "false",
      );
  },
}));

// -------------------------------------------------------------
// Atomic selectors
// -------------------------------------------------------------

export const selectUnits = (s: SettingsStore): Units => s.units;
export const selectDefaultCupSize = (s: SettingsStore): CupSizeMl =>
  s.defaultCupSize;
export const selectStartDay = (s: SettingsStore): StartDay => s.startDay;
export const selectIsReady = (s: SettingsStore): boolean => s.isReady;
