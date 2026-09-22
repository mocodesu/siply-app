// ─────────────────────────────────────────────────────────────
// hooks/use-hydration-bootstrap.ts
//
// Wires the SQLite handle into the hydration store and refreshes
// today's totals whenever the app returns to the foreground —
// which covers the day-rollover case where the user leaves the
// app overnight.
// ─────────────────────────────────────────────────────────────
import { useHydrationStore } from "@/store/hydration-store";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect } from "react";
import { AppState } from "react-native";

export function useHydrationBootstrap() {
  const db = useSQLiteContext();
  const attach = useHydrationStore((s) => s.attach);
  const refresh = useHydrationStore((s) => s.refresh);

  useEffect(() => {
    attach(db);
  }, [db, attach]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);
}
