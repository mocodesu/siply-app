// store/hydration-store.ts
//
// Global hydration state plus the achievement-unlock queue.
//
// Atomic selectors are exported alongside the store so components
// subscribe to the narrowest slice possible. Each selector returns
// a primitive, which Zustand compares with Object.is -- the fastest
// equality check available.
import { dayKeyFromDate } from "@/constants/notifications";
import {
  AchievementsRepo,
  type AchievementView,
} from "@/repositories/achievements-repo";
import { WaterRepo, type WaterLog } from "@/repositories/water-repo";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

interface HydrationStore {
  db: SQLiteDatabase | null;
  dayKey: string;
  totalMl: number;
  goalMl: number;
  recentLogs: WaterLog[];
  isReady: boolean;
  lastAddedAt: number | null;
  pendingUnlocks: AchievementView[];

  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;
  addWater: (amountMl: number, cupSizeMl?: number) => Promise<void>;
  removeLog: (id: number) => Promise<void>;
  setGoal: (goalMl: number) => Promise<void>;
  dismissUnlock: () => void;
}

// -------------------------------------------------------------
// Store
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Atomic selectors
//
// Every selector below returns a primitive. Components that use
// them re-render only when that exact value changes.
// -------------------------------------------------------------

export const selectTotalMl = (s: HydrationStore): number => s.totalMl;
export const selectGoalMl = (s: HydrationStore): number => s.goalMl;
export const selectIsReady = (s: HydrationStore): boolean => s.isReady;

/** 0-1 progress ratio. Derived, but still a primitive. */
export const selectPercentage = (s: HydrationStore): number =>
  s.goalMl > 0 ? Math.min(1, s.totalMl / s.goalMl) : 0;

/** Integer percentage for display. Avoids re-rendering on sub-1% changes. */
export const selectPercentageInt = (s: HydrationStore): number =>
  s.goalMl > 0 ? Math.round(Math.min(1, s.totalMl / s.goalMl) * 100) : 0;

/** Boolean -- true when the current day's total meets or exceeds the goal. */
export const selectGoalReached = (s: HydrationStore): boolean =>
  s.goalMl > 0 && s.totalMl >= s.goalMl;

/** First item in the unlock queue, or null. */
export const selectPendingUnlock = (
  s: HydrationStore,
): AchievementView | null => s.pendingUnlocks[0] ?? null;

/** Count of queued unlocks. Primitive so the root layout can cheaply detect arrivals. */
export const selectPendingUnlockCount = (s: HydrationStore): number =>
  s.pendingUnlocks.length;
