// ─────────────────────────────────────────────────────────────
// hooks/use-reminders-bootstrap.ts
//
// Wires the SQLite handle into the reminders store and creates the
// Android notification channel up front. Mirrors the hydration
// bootstrap so both stores follow the same lifecycle.
// ─────────────────────────────────────────────────────────────
import { useRemindersStore } from "@/store/reminders-store";
import { ensureReminderChannelAsync } from "@/utils/reminder-scheduler";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect } from "react";

export function useRemindersBootstrap() {
  const db = useSQLiteContext();
  const attach = useRemindersStore((s) => s.attach);

  useEffect(() => {
    attach(db);
  }, [db, attach]);

  useEffect(() => {
    void ensureReminderChannelAsync();
  }, []);
}
