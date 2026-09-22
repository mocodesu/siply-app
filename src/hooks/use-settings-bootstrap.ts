// ─────────────────────────────────────────────────────────────
// hooks/use-settings-bootstrap.ts
//
// Loads persisted settings into the store on app start. Mirrors
// the hydration and reminder bootstraps so every store follows the
// same lifecycle.
// ─────────────────────────────────────────────────────────────
import { useSettingsStore } from "@/store/settings-store";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect } from "react";

export function useSettingsBootstrap() {
  const db = useSQLiteContext();
  const attach = useSettingsStore((s) => s.attach);

  useEffect(() => {
    attach(db);
  }, [db, attach]);
}
