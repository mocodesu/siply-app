// ─────────────────────────────────────────────────────────────
// hooks/use-stats.ts
//
// Computes the numbers the Statistics screen renders: per-bucket
// intake for the bar chart, the period average, the total, the
// consistency percentage, and the delta versus the previous period.
//
// Buckets differ per period:
//   week  → one bar per day, Mon–Sun
//   month → one bar per calendar week that overlaps the month
//   year  → one bar per month, Jan–Dec
//
// The hook refetches on focus, so logging water on another tab
// and returning to Stats shows fresh numbers without manual pull.
// ─────────────────────────────────────────────────────────────
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
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

export type StatsPeriod = "week" | "month" | "year";

export interface StatsBar {
  label: string;
  value: number;
}

export interface StatsResult {
  loading: boolean;
  bars: StatsBar[];
  averageMl: number;
  totalMl: number;
  /** 0–1. Fraction of elapsed days that met the daily goal. */
  consistency: number;
  /** Percentage change vs the previous period. Can be negative. */
  deltaPercent: number;
  /** Human label for the period, e.g. `"This Week"`. */
  periodLabel: string;
  /** The comparison label, e.g. `"vs last week"`. */
  deltaLabel: string;
}

interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  deltaLabel: string;
}

// ─────────────────────────────────────────────────────────────
// Range computation
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Bucket computation
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

const EMPTY: StatsResult = {
  loading: true,
  bars: [],
  averageMl: 0,
  totalMl: 0,
  consistency: 0,
  deltaPercent: 0,
  periodLabel: "This Week",
  deltaLabel: "vs last week",
};

export function useStats(period: StatsPeriod): StatsResult {
  const db = useSQLiteContext();
  const goalMl = useHydrationStore((s) => s.goalMl);
  const [state, setState] = useState<StatsResult>(EMPTY);

  const refresh = useCallback(async () => {
    const today = startOfDay(new Date());
    const todayKey = dayKeyFromDate(today);

    const current = rangeFor(period, today);
    const previous = previousRangeFor(period, today);
    const buckets = bucketsFor(period, current);

    // Clamp query ranges so we never ask for future data.
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

    // ── Bars ─────────────────────────────────────────────
    const bars: StatsBar[] = buckets.map((bucket) => ({
      label: bucket.label,
      value: bucket.dayKeys.reduce(
        (sum, key) => sum + (currentTotals[key] ?? 0),
        0,
      ),
    }));

    // ── Totals and averages ──────────────────────────────
    const totalMl = Object.values(currentTotals).reduce((sum, v) => sum + v, 0);

    // Only count days that have actually elapsed, so a partial
    // week doesn't drag the average down with phantom zeros.
    const elapsedDayKeys = buckets
      .flatMap((b) => b.dayKeys)
      .filter((key) => key <= todayKey);

    const elapsedDayCount = Math.max(1, elapsedDayKeys.length);
    const averageMl = totalMl / elapsedDayCount;

    // ── Consistency ──────────────────────────────────────
    const daysMet = elapsedDayKeys.filter(
      (key) => (currentTotals[key] ?? 0) >= goalMl,
    ).length;
    const consistency = elapsedDayCount > 0 ? daysMet / elapsedDayCount : 0;

    // ── Delta vs previous period ─────────────────────────
    const previousTotalMl = Object.values(previousTotals).reduce(
      (sum, v) => sum + v,
      0,
    );
    const previousDayKeys = Object.keys(previousTotals);
    // Fall back to the full previous period length when there are
    // no logs at all, so the denominator isn't zero.
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
        ? Math.round(
            ((averageMl - previousAverageMl) / previousAverageMl) * 100,
          )
        : 0;

    setState({
      loading: false,
      bars,
      averageMl,
      totalMl,
      consistency,
      deltaPercent,
      periodLabel: current.label,
      deltaLabel: current.deltaLabel,
    });
  }, [db, period, goalMl]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return state;
}
