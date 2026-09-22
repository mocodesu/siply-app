// store/reminders-store.ts
//
// Reminders data + UI state. Reads and writes SQLite, owns
// permission and busy state, and exposes an atomic per-row status
// selector so each row re-renders only when its own status changes.
//
// Mutation methods update in-memory state BEFORE awaiting the DB
// write. This is what keeps toggle switches from briefly showing
// a stale value while the DB write is in flight -- see
// toggleReminder in use-reminder-actions.ts for the full sequence.
import {
  ReminderPrefsRepo,
  ReminderRepo,
  type Reminder,
} from "@/repositories/reminder-repo";
import type { PermissionState } from "@/utils/reminder-scheduler";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

export type ReminderStatus = "scheduled" | "blocked" | "off" | "pending";

interface RemindersStore {
  db: SQLiteDatabase | null;
  reminders: Reminder[];
  smartEnabled: boolean;
  isReady: boolean;
  permission: PermissionState;
  busyIds: Record<string, boolean>;

  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;

  setSmartEnabledLocal: (enabled: boolean) => Promise<void>;
  setEnabledLocal: (id: string, enabled: boolean) => Promise<void>;
  insertLocal: (reminder: Omit<Reminder, "createdAt">) => Promise<void>;
  removeLocal: (id: string) => Promise<void>;

  setPermission: (permission: PermissionState) => void;
  setBusy: (id: string, busy: boolean) => void;
  clearAllBusy: () => void;
}

// -------------------------------------------------------------
// Store
// -------------------------------------------------------------

const EMPTY_BUSY: Record<string, boolean> = {};

export const useRemindersStore = create<RemindersStore>((set, get) => ({
  db: null,
  reminders: [],
  smartEnabled: true,
  isReady: false,
  permission: "undetermined",
  busyIds: EMPTY_BUSY,

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
    const previous = get().smartEnabled;

    // Optimistic.
    set({ smartEnabled: enabled });

    if (!db) return;

    try {
      await ReminderPrefsRepo.setSmartEnabled(db, enabled);
    } catch (error) {
      console.error("Failed to persist smart-enabled state:", error);
      set({ smartEnabled: previous });
    }
  },

  setEnabledLocal: async (id, enabled) => {
    const { db } = get();
    const previous = get().reminders;

    // Optimistic state update, before any await. This is the key
    // fix: the Switch's value prop updates in the same React batch
    // as the caller's other state changes, so the native switch
    // never sees a stale value.
    set({
      reminders: previous.map((r) => (r.id === id ? { ...r, enabled } : r)),
    });

    if (!db) return;

    try {
      await ReminderRepo.setEnabled(db, id, enabled);
    } catch (error) {
      console.error("Failed to persist reminder enabled state:", error);
      // Revert on failure. The next refresh will also correct it.
      set({
        reminders: previous.map((r) =>
          r.id === id ? { ...r, enabled: !enabled } : r,
        ),
      });
    }
  },

  insertLocal: async (reminder) => {
    const { db } = get();
    if (!db) return;
    await ReminderRepo.insert(db, reminder);
    await get().refresh();
  },

  removeLocal: async (id) => {
    const { db } = get();
    const previous = get().reminders;

    // Optimistic.
    set({ reminders: previous.filter((r) => r.id !== id) });

    if (!db) return;

    try {
      await ReminderRepo.remove(db, id);
    } catch (error) {
      console.error("Failed to remove reminder:", error);
      set({ reminders: previous });
    }
  },

  setPermission: (permission) => {
    if (get().permission === permission) return;
    set({ permission });
  },

  setBusy: (id, busy) => {
    const current = get().busyIds;
    if (busy) {
      if (current[id]) return;
      set({ busyIds: { ...current, [id]: true } });
    } else {
      if (!current[id]) return;
      const next = { ...current };
      delete next[id];
      set({ busyIds: next });
    }
  },

  clearAllBusy: () => {
    if (Object.keys(get().busyIds).length === 0) return;
    set({ busyIds: EMPTY_BUSY });
  },
}));

// -------------------------------------------------------------
// Data selectors
// -------------------------------------------------------------

export const selectReminders = (s: RemindersStore): Reminder[] => s.reminders;

export const selectSmartEnabled = (s: RemindersStore): boolean =>
  s.smartEnabled;

export const selectPermission = (s: RemindersStore): PermissionState =>
  s.permission;

export const selectIsReady = (s: RemindersStore): boolean => s.isReady;

export const selectAnyBusy = (s: RemindersStore): boolean =>
  Object.keys(s.busyIds).length > 0;

export const selectScheduledCount = (s: RemindersStore): number => {
  if (!s.smartEnabled) return 0;
  let count = 0;
  for (const r of s.reminders) {
    if (r.enabled) count += 1;
  }
  return count;
};

// -------------------------------------------------------------
// Action selectors
//
// Module-scope so the hook call sites receive stable references.
// Zustand returns the same function for a given selector across
// renders, and a stable selector lets React Compiler trace the
// stability through to the hook's return value.
// -------------------------------------------------------------

export const selectSetSmartEnabledLocal = (s: RemindersStore) =>
  s.setSmartEnabledLocal;
export const selectSetEnabledLocal = (s: RemindersStore) => s.setEnabledLocal;
export const selectInsertLocal = (s: RemindersStore) => s.insertLocal;
export const selectRemoveLocal = (s: RemindersStore) => s.removeLocal;
export const selectSetPermission = (s: RemindersStore) => s.setPermission;
export const selectSetBusy = (s: RemindersStore) => s.setBusy;
export const selectClearAllBusy = (s: RemindersStore) => s.clearAllBusy;
export const selectRefresh = (s: RemindersStore) => s.refresh;

// -------------------------------------------------------------
// Per-row status hook
// -------------------------------------------------------------

export function useReminderStatus(id: string): ReminderStatus {
  return useRemindersStore((s) => {
    if (s.busyIds[id]) return "pending";

    const reminder = s.reminders.find((r) => r.id === id);
    if (!reminder || !reminder.enabled) return "off";

    if (s.smartEnabled && s.permission === "denied") return "blocked";
    if (s.smartEnabled) return "scheduled";
    return "off";
  });
}
