// store/hydration-store.ts
//
// Global hydration state. Holds today's running total, goal, and
// the recent logs list. SQLite is the source of truth; the store
// mirrors it.
//
// Also owns the achievement-unlock queue: whenever addWater runs,
// it checks for fresh unlocks and pushes them here so the overlay
// in the root layout can present them.
import { dayKeyFromDate } from "@/constants/notifications";
import {
  AchievementsRepo,
  type AchievementView,
} from "@/repositories/achievements-repo";
import { WaterRepo, type WaterLog } from "@/repositories/water-repo";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

interface HydrationStore {
  // State
  db: SQLiteDatabase | null;
  dayKey: string;
  totalMl: number;
  goalMl: number;
  recentLogs: WaterLog[];
  isReady: boolean;
  lastAddedAt: number | null;
  /** FIFO queue of achievements waiting to be celebrated. */
  pendingUnlocks: AchievementView[];

  // Actions
  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;
  addWater: (amountMl: number, cupSizeMl?: number) => Promise<void>;
  removeLog: (id: number) => Promise<void>;
  setGoal: (goalMl: number) => Promise<void>;
  /** Pop the front of the unlock queue. */
  dismissUnlock: () => void;
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
  pendingUnlocks: [],

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

    // Check for fresh unlocks. A failure here must not prevent the
    // water log itself from being recorded -- that's already done.
    try {
      const { newlyUnlocked } = await AchievementsRepo.computeAchievements(db);
      if (newlyUnlocked.length > 0) {
        const current = get().pendingUnlocks;
        set({ pendingUnlocks: [...current, ...newlyUnlocked] });
      }
    } catch (error) {
      console.error("Achievement check failed:", error);
    }
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

  dismissUnlock: () => {
    set({ pendingUnlocks: get().pendingUnlocks.slice(1) });
  },
}));

export const selectPercentage = (s: HydrationStore): number =>
  s.goalMl > 0 ? Math.min(1, s.totalMl / s.goalMl) : 0;
