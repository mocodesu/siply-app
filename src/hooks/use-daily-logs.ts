// ─────────────────────────────────────────────────────────────
// hooks/use-daily-logs.ts
//
// Fetches a single day's logs and summary. Refetches on screen
// focus so returning to the History tab after logging water shows
// the new entry without manual refresh.
//
// Stale-data guard: when `date` changes, the previous day's logs
// are hidden immediately rather than briefly shown under the new
// date label. SQLite is fast enough that the correct data arrives
// in the same frame as the user's tap.
// ─────────────────────────────────────────────────────────────
import { dayKeyFromDate } from "@/constants/notifications";
import {
  WaterRepo,
  type DailySummary,
  type WaterLog,
} from "@/repositories/water-repo";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

interface DailyLogsState {
  dayKey: string;
  logs: WaterLog[];
  summary: DailySummary | null;
  loading: boolean;
}

export interface DailyLogsResult {
  logs: WaterLog[];
  summary: DailySummary | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useDailyLogs(date: Date): DailyLogsResult {
  const db = useSQLiteContext();
  const dayKey = dayKeyFromDate(date);

  const [state, setState] = useState<DailyLogsState>({
    dayKey,
    logs: [],
    summary: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    const [logs, summary] = await Promise.all([
      WaterRepo.getRecentLogs(db, dayKey),
      WaterRepo.getDailySummary(db, dayKey),
    ]);
    setState({ dayKey, logs, summary, loading: false });
  }, [db, dayKey]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const isStale = state.dayKey !== dayKey;

  return {
    logs: isStale ? [] : state.logs,
    summary: isStale ? null : state.summary,
    loading: isStale || state.loading,
    refresh,
  };
}
