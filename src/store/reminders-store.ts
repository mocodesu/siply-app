// ─────────────────────────────────────────────────────────────
// store/reminders-store.ts
//
// Pure data mirror. This store reads and writes SQLite only — it
// performs NO OS scheduling. Every mutation that needs to touch the
// OS goes through `useReminderActions`, which owns the transaction
// across both layers.
//
// Splitting it this way means the store is trivially testable and
// the scheduling logic lives in exactly one place.
// ─────────────────────────────────────────────────────────────
import {
  ReminderPrefsRepo,
  ReminderRepo,
  type Reminder,
} from "@/repositories/reminder-repo";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

interface RemindersStore {
  // ── State ─────────────────────────────────────────────
  db: SQLiteDatabase | null;
  reminders: Reminder[];
  smartEnabled: boolean;
  isReady: boolean;

  // ── Lifecycle ─────────────────────────────────────────
  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;

  // ── Data mutations (no OS side effects) ───────────────
  setSmartEnabledLocal: (enabled: boolean) => Promise<void>;
  setEnabledLocal: (id: string, enabled: boolean) => Promise<void>;
  setNotificationIdLocal: (
    id: string,
    notificationId: string | null,
  ) => Promise<void>;
  insertLocal: (
    reminder: Omit<Reminder, "notificationId" | "createdAt">,
  ) => Promise<void>;
  removeLocal: (id: string) => Promise<void>;
}

export const useRemindersStore = create<RemindersStore>((set, get) => ({
  db: null,
  reminders: [],
  smartEnabled: true,
  isReady: false,

  attach: (db) => {
    set({ db });
    void get().refresh();
  },

  refresh: async () => {
    const { db } = get();
    if (!db) return;

    await ReminderRepo.seedIfEmpty(db);

    const [reminders, smartEnabled] = await Promise.all([
      ReminderRepo.getAll(db),
      ReminderPrefsRepo.getSmartEnabled(db),
    ]);

    set({ reminders, smartEnabled, isReady: true });
  },

  setSmartEnabledLocal: async (enabled) => {
    const { db } = get();
    if (!db) return;

    await ReminderPrefsRepo.setSmartEnabled(db, enabled);
    set({ smartEnabled: enabled });
  },

  setEnabledLocal: async (id, enabled) => {
    const { db } = get();
    if (!db) return;

    await ReminderRepo.setEnabled(db, id, enabled);
    set({
      reminders: get().reminders.map((r) =>
        r.id === id ? { ...r, enabled } : r,
      ),
    });
  },

  setNotificationIdLocal: async (id, notificationId) => {
    const { db } = get();
    if (!db) return;

    await ReminderRepo.setNotificationId(db, id, notificationId);
    set({
      reminders: get().reminders.map((r) =>
        r.id === id ? { ...r, notificationId } : r,
      ),
    });
  },

  insertLocal: async (reminder) => {
    const { db } = get();
    if (!db) return;

    await ReminderRepo.insert(db, reminder);
    // Refresh so the new row lands in the correct sort order.
    await get().refresh();
  },

  removeLocal: async (id) => {
    const { db } = get();
    if (!db) return;

    await ReminderRepo.remove(db, id);
    set({ reminders: get().reminders.filter((r) => r.id !== id) });
  },
}));
