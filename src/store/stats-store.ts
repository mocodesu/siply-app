// store/stats-store.ts
//
// Stats data store. Holds period, loading state, and computed
// values as flat primitives so each section of the Stats screen
// can subscribe to exactly what it renders.
//
// setPeriod does NOT clear bars. Clearing them unmounts the chart,
// which collapses the content height, which reflows the ScrollView
// and the SegmentedControl above it. That reflow was causing the
// period picker's indicator to re-measure and re-animate from a
// stale starting position -- the visible "jump back to Week".
//
// SQLite is fast enough that the stale window between period
// change and new data is a few frames. The chart simply swaps
// values in place.
import { dayKeyFromDate } from "@/constants/notifications";
import { WaterRepo } from "@/repositories/water-repo";
import { useHydrationStore } from "@/store/hydration-store";
import {
  addDays,
  eachDay,
  getEndOfWeek,
  getStartOfWeek,
  monthShort,
  startOfDay,
  weekdayShort,
} from "@/utils/date";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

// -------------------------------------------------------------
// Public types
// -------------------------------------------------------------

export type StatsPeriod = "week" | "month" | "year";

export interface StatsBar {
  label: string;
  value: number;
}

interface StatsData {
  bars: StatsBar[];
  averageMl: number;
  totalMl: number;
  consistency: number;
  deltaPercent: number;
  periodLabel: string;
  deltaLabel: string;
}

// -------------------------------------------------------------
// Period ranges
// -------------------------------------------------------------

interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  deltaLabel: string;
}

function rangeFor(period: StatsPeriod, reference: Date): PeriodRange {
  if (period === "week") {
    const start = getStartOfWeek(reference);
    return {
      start,
      end: getEndOfWeek(reference),
      label: "This Week",
      deltaLabel: "vs last week",
    };
  }

  if (period === "month") {
    const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
    return {
      start,
      end,
      label: "This Month",
      deltaLabel: "vs last month",
    };
  }

  const start = new Date(reference.getFullYear(), 0, 1);
  const end = new Date(reference.getFullYear(), 11, 31);
  return {
    start,
    end,
    label: "This Year",
    deltaLabel: "vs last year",
  };
}

function previousRangeFor(period: StatsPeriod, reference: Date): PeriodRange {
  if (period === "week") {
    return rangeFor("week", addDays(reference, -7));
  }
  if (period === "month") {
    return rangeFor(
      "month",
      new Date(reference.getFullYear(), reference.getMonth() - 1, 1),
    );
  }
  return rangeFor("year", new Date(reference.getFullYear() - 1, 0, 1));
}

// -------------------------------------------------------------
// Buckets
// -------------------------------------------------------------

interface Bucket {
  label: string;
  dayKeys: string[];
}

function weekBuckets(range: PeriodRange): Bucket[] {
  return eachDay(range.start, range.end).map((day) => ({
    label: weekdayShort(day),
    dayKeys: [dayKeyFromDate(day)],
  }));
}

function monthBuckets(range: PeriodRange): Bucket[] {
  const buckets: Bucket[] = [];
  let weekStart = getStartOfWeek(range.start);
  let weekIndex = 1;

  while (weekStart.getTime() <= range.end.getTime()) {
    const weekEnd = addDays(weekStart, 6);
    const clippedStart = weekStart < range.start ? range.start : weekStart;
    const clippedEnd = weekEnd > range.end ? range.end : weekEnd;

    if (clippedStart.getTime() <= clippedEnd.getTime()) {
      buckets.push({
        label: `W${weekIndex}`,
        dayKeys: eachDay(clippedStart, clippedEnd).map(dayKeyFromDate),
      });
    }

    weekStart = addDays(weekStart, 7);
    weekIndex += 1;
  }

  return buckets;
}

function yearBuckets(range: PeriodRange): Bucket[] {
  const buckets: Bucket[] = [];
  for (let month = 0; month < 12; month += 1) {
    const start = new Date(range.start.getFullYear(), month, 1);
    const end = new Date(range.start.getFullYear(), month + 1, 0);
    buckets.push({
      label: monthShort(month),
      dayKeys: eachDay(start, end).map(dayKeyFromDate),
    });
  }
  return buckets;
}

function bucketsFor(period: StatsPeriod, range: PeriodRange): Bucket[] {
  if (period === "week") return weekBuckets(range);
  if (period === "month") return monthBuckets(range);
  return yearBuckets(range);
}

// -------------------------------------------------------------
// Compute
// -------------------------------------------------------------

async function computeStats(
  db: SQLiteDatabase,
  period: StatsPeriod,
  goalMl: number,
): Promise<StatsData> {
  const today = startOfDay(new Date());
  const todayKey = dayKeyFromDate(today);

  const current = rangeFor(period, today);
  const previous = previousRangeFor(period, today);
  const buckets = bucketsFor(period, current);

  const currentEnd =
    current.end.getTime() > today.getTime() ? today : current.end;

  const [currentTotals, previousTotals] = await Promise.all([
    WaterRepo.getDailyTotalsInRange(
      db,
      dayKeyFromDate(current.start),
      dayKeyFromDate(currentEnd),
    ),
    WaterRepo.getDailyTotalsInRange(
      db,
      dayKeyFromDate(previous.start),
      dayKeyFromDate(previous.end),
    ),
  ]);

  const bars: StatsBar[] = buckets.map((bucket) => ({
    label: bucket.label,
    value: bucket.dayKeys.reduce(
      (sum, key) => sum + (currentTotals[key] ?? 0),
      0,
    ),
  }));

  const totalMl = Object.values(currentTotals).reduce((sum, v) => sum + v, 0);

  const elapsedDayKeys = buckets
    .flatMap((b) => b.dayKeys)
    .filter((key) => key <= todayKey);

  const elapsedDayCount = Math.max(1, elapsedDayKeys.length);
  const averageMl = totalMl / elapsedDayCount;

  const daysMet = elapsedDayKeys.filter(
    (key) => (currentTotals[key] ?? 0) >= goalMl,
  ).length;
  const consistency = elapsedDayCount > 0 ? daysMet / elapsedDayCount : 0;

  const previousTotalMl = Object.values(previousTotals).reduce(
    (sum, v) => sum + v,
    0,
  );
  const previousDayKeys = Object.keys(previousTotals);
  const previousDayCount =
    previousDayKeys.length > 0
      ? previousDayKeys.length
      : period === "week"
        ? 7
        : period === "month"
          ? 30
          : 365;
  const previousAverageMl = previousTotalMl / previousDayCount;

  const deltaPercent =
    previousAverageMl > 0
      ? Math.round(((averageMl - previousAverageMl) / previousAverageMl) * 100)
      : 0;

  return {
    bars,
    averageMl,
    totalMl,
    consistency,
    deltaPercent,
    periodLabel: current.label,
    deltaLabel: current.deltaLabel,
  };
}

// -------------------------------------------------------------
// Equality
// -------------------------------------------------------------

function areStatsEqual(state: StatsStore, data: StatsData): boolean {
  if (state.bars.length !== data.bars.length) return false;

  for (let i = 0; i < state.bars.length; i++) {
    const a = state.bars[i];
    const b = data.bars[i];
    if (a.label !== b.label || a.value !== b.value) return false;
  }

  return (
    state.averageMl === data.averageMl &&
    state.totalMl === data.totalMl &&
    state.consistency === data.consistency &&
    state.deltaPercent === data.deltaPercent &&
    state.periodLabel === data.periodLabel &&
    state.deltaLabel === data.deltaLabel
  );
}

// -------------------------------------------------------------
// Store
// -------------------------------------------------------------

interface StatsStore extends StatsData {
  period: StatsPeriod;
  loading: boolean;
  setPeriod: (period: StatsPeriod) => void;
  fetch: (db: SQLiteDatabase) => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  period: "week",
  loading: true,
  bars: [],
  averageMl: 0,
  totalMl: 0,
  consistency: 0,
  deltaPercent: 0,
  periodLabel: "This Week",
  deltaLabel: "vs last week",

  setPeriod: (period) => {
    if (get().period === period) return;
    // Keep previous bars visible until the new data arrives. See
    // the file header for why clearing them caused the picker to
    // re-animate.
    set({ period, loading: true });
  },

  fetch: async (db) => {
    const { period } = get();
    const goalMl = useHydrationStore.getState().goalMl;

    try {
      const data = await computeStats(db, period, goalMl);

      if (period !== get().period) return;

      if (areStatsEqual(get(), data)) {
        if (get().loading) set({ loading: false });
        return;
      }

      set({ ...data, loading: false });
    } catch (error) {
      console.error("Failed to compute stats:", error);
      set({ loading: false });
    }
  },
}));

// -------------------------------------------------------------
// Atomic selectors
// -------------------------------------------------------------

export const selectStatsPeriod = (s: StatsStore): StatsPeriod => s.period;
export const selectStatsLoading = (s: StatsStore): boolean => s.loading;
export const selectStatsBars = (s: StatsStore): StatsBar[] => s.bars;
export const selectStatsAverageMl = (s: StatsStore): number => s.averageMl;
export const selectStatsTotalMl = (s: StatsStore): number => s.totalMl;
export const selectStatsConsistency = (s: StatsStore): number => s.consistency;
export const selectStatsDeltaPercent = (s: StatsStore): number =>
  s.deltaPercent;
export const selectStatsPeriodLabel = (s: StatsStore): string => s.periodLabel;
export const selectStatsDeltaLabel = (s: StatsStore): string => s.deltaLabel;
export const selectSetStatsPeriod = (s: StatsStore) => s.setPeriod;
