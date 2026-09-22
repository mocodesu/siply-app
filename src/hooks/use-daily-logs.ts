// hooks/use-daily-logs.ts
//
// Two independent hooks: one for a day's water logs, one for the
// day's summary. Consumers subscribe to only the one they render.
//
// Both hooks:
//   - refetch on screen focus, so returning after logging shows
//     fresh data without a manual refresh
//   - refuse to overwrite state when the fetched content is
//     identical to what's already stored, so a focus refetch that
//     returns the same rows does not cause any re-renders
//   - guard against out-of-order fetches when the day changes
//     mid-request
import { dayKeyFromDate } from "@/constants/notifications";
import {
  WaterRepo,
  type DailySummary,
  type WaterLog,
} from "@/repositories/water-repo";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef, useState } from "react";

// -------------------------------------------------------------
// Equality checks
//
// Hand-rolled rather than deep-equal, because the field set is
// small and fixed. Cheap enough to run on every focus.
// -------------------------------------------------------------

function areLogsEqual(a: WaterLog[], b: WaterLog[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].amountMl !== b[i].amountMl ||
      a[i].loggedAt !== b[i].loggedAt
    ) {
      return false;
    }
  }
  return true;
}

function areSummariesEqual(
  a: DailySummary | null,
  b: DailySummary | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.dayKey === b.dayKey &&
    a.totalMl === b.totalMl &&
    a.goalMl === b.goalMl &&
    a.logCount === b.logCount
  );
}

// -------------------------------------------------------------
// useDailyLogs
// -------------------------------------------------------------

export function useDailyLogs(dayMs: number): WaterLog[] {
  const db = useSQLiteContext();
  const dayKey = dayKeyFromDate(new Date(dayMs));
  const [logs, setLogs] = useState<WaterLog[]>([]);

  // Tracks the last requested day. If a fetch resolves after the
  // user has navigated elsewhere, its result is discarded.
  const requestedDayRef = useRef<string>("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const isDayChange = requestedDayRef.current !== dayKey;
      requestedDayRef.current = dayKey;

      // Clear immediately on day change so yesterday's logs don't
      // flash under today's label.
      if (isDayChange) {
        setLogs((prev) => (prev.length === 0 ? prev : []));
      }

      void (async () => {
        const next = await WaterRepo.getRecentLogs(db, dayKey);
        if (cancelled) return;
        if (requestedDayRef.current !== dayKey) return;
        setLogs((prev) => (areLogsEqual(prev, next) ? prev : next));
      })();

      return () => {
        cancelled = true;
      };
    }, [db, dayKey]),
  );

  return logs;
}

// -------------------------------------------------------------
// useDailySummary
// -------------------------------------------------------------

export function useDailySummary(dayMs: number): DailySummary | null {
  const db = useSQLiteContext();
  const dayKey = dayKeyFromDate(new Date(dayMs));
  const [summary, setSummary] = useState<DailySummary | null>(null);

  const requestedDayRef = useRef<string>("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const isDayChange = requestedDayRef.current !== dayKey;
      requestedDayRef.current = dayKey;

      if (isDayChange) {
        setSummary((prev) => (prev === null ? prev : null));
      }

      void (async () => {
        const next = await WaterRepo.getDailySummary(db, dayKey);
        if (cancelled) return;
        if (requestedDayRef.current !== dayKey) return;
        setSummary((prev) => (areSummariesEqual(prev, next) ? prev : next));
      })();

      return () => {
        cancelled = true;
      };
    }, [db, dayKey]),
  );

  return summary;
}
