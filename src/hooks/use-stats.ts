// hooks/use-stats.ts
//
// Sync hook for the Stats store. Runs the fetch on screen focus,
// on period change, and on goal change. Does not return data --
// sections subscribe to the store directly.
import { selectGoalMl, useHydrationStore } from "@/store/hydration-store";
import { useStatsStore } from "@/store/stats-store";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";

export function useStatsSync(): void {
  const db = useSQLiteContext();
  const fetch = useStatsStore((s) => s.fetch);
  const period = useStatsStore((s) => s.period);
  const goalMl = useHydrationStore(selectGoalMl);

  useFocusEffect(
    useCallback(() => {
      void fetch(db);
    }, [db, fetch, period, goalMl]),
  );
}
