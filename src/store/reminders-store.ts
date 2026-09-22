// ─────────────────────────────────────────────────────────────
// store/reminders-store.ts
//
// Owns the reminder list, the Smart Reminders preference, and the
// OS-level scheduling side effects.
//
// Toggling a reminder is optimistic: the local row flips first,
// then the OS call runs, then the stored notification ID is
// persisted. If scheduling fails (permission denied), the row
// reverts so the UI never claims something is scheduled when it
// isn't.
// ─────────────────────────────────────────────────────────────
import {
  ReminderPrefsRepo,
  ReminderRepo,
  type Reminder,
} from "@/repositories/reminder-repo";
import {
  cancelReminderAsync,
  scheduleDailyReminderAsync,
} from "@/utils/reminder-scheduler";
import type { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

interface RemindersStore {
  // ── State ─────────────────────────────────────────────
  db: SQLiteDatabase | null;
  reminders: Reminder[];
  smartEnabled: boolean;
  isReady: boolean;

  // ── Actions ───────────────────────────────────────────
  attach: (db: SQLiteDatabase) => void;
  refresh: () => Promise<void>;
  setSmartEnabled: (enabled: boolean) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
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

  setSmartEnabled: async (enabled) => {
    const { db } = get();
    if (!db) return;

    set({ smartEnabled: enabled });
    await ReminderPrefsRepo.setSmartEnabled(db, enabled);

    // When Smart Reminders turns off, cancel every scheduled
    // notification but keep the rows so the user's configured
    // times survive a re-enable.
    if (!enabled) {
      const { reminders } = get();
      for (const reminder of reminders) {
        await cancelReminderAsync(reminder.notificationId);
        await ReminderRepo.setNotificationId(db, reminder.id, null);
      }
      set({
        reminders: reminders.map((r) => ({ ...r, notificationId: null })),
      });
      return;
    }

    // Re-enabling: reschedule everything that's marked enabled.
    const { reminders } = get();
    for (const reminder of reminders) {
      if (!reminder.enabled) continue;
      const notificationId = await scheduleDailyReminderAsync(reminder);
      if (notificationId) {
        await ReminderRepo.setNotificationId(db, reminder.id, notificationId);
      }
    }

    await get().refresh();
  },

  toggleReminder: async (id) => {
    const { db, smartEnabled } = get();
    if (!db) return;

    const target = get().reminders.find((r) => r.id === id);
    if (!target) return;

    const nextEnabled = !target.enabled;

    // Optimistic flip.
    set({
      reminders: get().reminders.map((r) =>
        r.id === id ? { ...r, enabled: nextEnabled } : r,
      ),
    });

    await ReminderRepo.setEnabled(db, id, nextEnabled);

    // Smart Reminders off means the schedule is dormant — persist
    // the preference without touching the OS.
    if (!smartEnabled) return;

    if (nextEnabled) {
      const notificationId = await scheduleDailyReminderAsync({
        ...target,
        enabled: true,
      });

      if (notificationId) {
        await ReminderRepo.setNotificationId(db, id, notificationId);
      } else {
        // Permission was denied — revert so the UI stays honest.
        await ReminderRepo.setEnabled(db, id, false);
        set({
          reminders: get().reminders.map((r) =>
            r.id === id ? { ...r, enabled: false } : r,
          ),
        });
        return;
      }
    } else {
      await cancelReminderAsync(target.notificationId);
      await ReminderRepo.setNotificationId(db, id, null);
    }

    await get().refresh();
  },
}));
