// ─────────────────────────────────────────────────────────────
// store/hydration-store.ts
//
// Global hydration state. Holds today's running total, goal, and
// the recent logs list so any screen can render without prop
// drilling. SQLite is the source of truth; the store mirrors it.
//
// The `db` reference is held in the store but never read by a
// selector that drives rendering, so setting it causes no re-renders.
// ─────────────────────────────────────────────────────────────
import { dayKeyFromDate } from "@/constants/notifications";
import { WaterRepo, type WaterLog } from "@/repositories/water-repo";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

interface HydrationStore {
  // ── State ─────────────────────────────────────────────
  db: SQLiteDatabase | null;
  dayKey: string;
  totalMl: number;
  goalMl: number;
  recentLogs: WaterLog[];
  isReady: boolean;
  /** Timestamp of the last successful add — useful for animation triggers. */
  lastAddedAt: number | null;

  // ── Actions ───────────────────────────────────────────
  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;
  addWater: (amountMl: number, cupSizeMl?: number) => Promise<void>;
  removeLog: (id: number) => Promise<void>;
  setGoal: (goalMl: number) => Promise<void>;
}

const todayKey = () => dayKeyFromDate(new Date());

export const useHydrationStore = create<HydrationStore>((set, get) => ({
  db: null,
  dayKey: todayKey(),
  totalMl: 0,
  goalMl: 2000,
  recentLogs: [],
  isReady: false,
  lastAddedAt: null,

  attach: (db) => {
    set({ db });
    void get().refresh();
  },

  refresh: async () => {
    const { db } = get();
    if (!db) return;

    const currentKey = todayKey();

    const [summary, logs] = await Promise.all([
      WaterRepo.getDailySummary(db, currentKey),
      WaterRepo.getRecentLogs(db, currentKey),
    ]);

    set({
      dayKey: currentKey,
      totalMl: summary.totalMl,
      goalMl: summary.goalMl,
      recentLogs: logs,
      isReady: true,
    });
  },

  addWater: async (amountMl, cupSizeMl = amountMl) => {
    const { db } = get();
    if (!db) return;

    await WaterRepo.addWater(db, amountMl, cupSizeMl);
    set({ lastAddedAt: Date.now() });
    await get().refresh();
  },

  removeLog: async (id) => {
    const { db } = get();
    if (!db) return;

    await WaterRepo.deleteLog(db, id);
    await get().refresh();
  },

  setGoal: async (goalMl) => {
    const { db, dayKey } = get();
    if (!db) return;

    await WaterRepo.setGoal(db, dayKey, goalMl);
    set({ goalMl });
  },
}));

// ─────────────────────────────────────────────────────────────
// Selectors — all return primitives, so components only re-render
// when the value they actually read changes.
// ─────────────────────────────────────────────────────────────

export const selectPercentage = (s: HydrationStore): number =>
  s.goalMl > 0 ? Math.min(1, s.totalMl / s.goalMl) : 0;
