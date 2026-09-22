// hooks/use-reminder-actions.ts
//
// The single owner of every reminder mutation that spans both the
// database and the OS notification scheduler.
//
// Also owns reconciliation: on screen focus, the hook asks the OS
// what is actually scheduled and disables any DB row that claims
// to be enabled but isn't registered. This closes the drift gap
// left by not persisting a notification identifier.
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Platform } from "react-native";

import { useRemindersStore } from "@/store/reminders-store";
import { feedback } from "@/utils/haptics";
import {
  cancelAllRemindersAsync,
  cancelReminderAsync,
  getReminderPermissionState,
  scheduleReminderAsync,
  type PermissionState,
} from "@/utils/reminder-scheduler";

// -------------------------------------------------------------
// Status types
// -------------------------------------------------------------

export type ReminderStatus = "scheduled" | "blocked" | "off" | "pending";

export interface ReminderActions {
  statusById: Record<string, ReminderStatus>;
  permission: PermissionState;
  busy: boolean;

  addReminder: (input: {
    id: string;
    label: string;
    hour: number;
    minute: number;
  }) => Promise<{ ok: boolean; reason?: "duplicate" | "permission" | "error" }>;

  removeReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  toggleSmartReminders: (enabled: boolean) => Promise<void>;
}

// -------------------------------------------------------------
// Hook
// -------------------------------------------------------------

export function useReminderActions(): ReminderActions {
  const reminders = useRemindersStore((s) => s.reminders);
  const smartEnabled = useRemindersStore((s) => s.smartEnabled);
  const insertLocal = useRemindersStore((s) => s.insertLocal);
  const removeLocal = useRemindersStore((s) => s.removeLocal);
  const setEnabledLocal = useRemindersStore((s) => s.setEnabledLocal);
  const setSmartEnabledLocal = useRemindersStore((s) => s.setSmartEnabledLocal);
  const refresh = useRemindersStore((s) => s.refresh);

  const [permission, setPermission] = useState<PermissionState>("undetermined");
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [globalBusy, setGlobalBusy] = useState(false);

  // Permission tracking on mount and whenever a row is added or
  // removed, so the banner reflects the current OS state.
  useEffect(() => {
    let active = true;
    void getReminderPermissionState().then((state) => {
      if (active) setPermission(state);
    });
    return () => {
      active = false;
    };
  }, [reminders.length]);

  // Refresh permission when the app returns to foreground. The
  // user may have changed it in system settings while we were
  // backgrounded.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void getReminderPermissionState().then(setPermission);
      }
    });
    return () => subscription.remove();
  }, []);

  // Reconciliation. On every screen focus, compare the DB against
  // the OS's actual scheduled notifications. Any enabled row the
  // OS doesn't have scheduled is flipped to disabled.
  //
  // A read failure is ignored rather than treated as "nothing is
  // scheduled" -- a transient native error must not disable every
  // reminder in the list.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return;
      if (reminders.length === 0) return;

      let cancelled = false;

      void (async () => {
        let scheduledIds: Set<string>;
        try {
          const scheduled =
            await Notifications.getAllScheduledNotificationsAsync();
          scheduledIds = new Set(scheduled.map((n) => n.identifier));
        } catch {
          return;
        }

        if (cancelled) return;

        for (const reminder of reminders) {
          if (!reminder.enabled) continue;
          if (scheduledIds.has(reminder.id)) continue;
          await setEnabledLocal(reminder.id, false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [reminders, setEnabledLocal]),
  );

  const markBusy = useCallback((id: string, isBusy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (isBusy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Derived status. Because the OS identifier is the row's own id,
  // status is inferred from (enabled, smartEnabled, permission).
  // Every scheduling failure flips enabled to false, so a row that
  // reads "scheduled" here really is registered with the OS.
  const statusById = useMemo(() => {
    const map: Record<string, ReminderStatus> = {};

    for (const reminder of reminders) {
      if (busyIds.has(reminder.id)) {
        map[reminder.id] = "pending";
      } else if (!reminder.enabled) {
        map[reminder.id] = "off";
      } else if (smartEnabled && permission === "denied") {
        map[reminder.id] = "blocked";
      } else if (smartEnabled) {
        map[reminder.id] = "scheduled";
      } else {
        map[reminder.id] = "off";
      }
    }

    return map;
  }, [reminders, busyIds, smartEnabled, permission]);

  // Add
  const addReminder = useCallback<ReminderActions["addReminder"]>(
    async (input) => {
      if (reminders.some((r) => r.id === input.id)) {
        return { ok: false, reason: "duplicate" };
      }

      setGlobalBusy(true);

      try {
        await insertLocal({
          id: input.id,
          label: input.label,
          hour: input.hour,
          minute: input.minute,
          enabled: true,
        });

        // Smart Reminders off: store the row, skip the OS call.
        if (!smartEnabled) return { ok: true };

        const result = await scheduleReminderAsync({
          id: input.id,
          label: input.label,
          hour: input.hour,
          minute: input.minute,
          enabled: true,
          createdAt: Date.now(),
        });

        if (!result.ok) {
          // Match toggleReminder's behaviour: flip enabled back to
          // false so derived status reflects reality. Leaving it
          // true would make the row claim "scheduled" when nothing
          // is registered with the OS.
          await setEnabledLocal(input.id, false);
          const state = await getReminderPermissionState();
          setPermission(state);
          return {
            ok: false,
            reason:
              result.reason === "permission-denied" ? "permission" : "error",
          };
        }

        const state = await getReminderPermissionState();
        setPermission(state);
        return { ok: true };
      } catch (error) {
        console.error("Failed to add reminder:", error);
        await removeLocal(input.id).catch(() => undefined);
        return { ok: false, reason: "error" };
      } finally {
        setGlobalBusy(false);
      }
    },
    [reminders, smartEnabled, insertLocal, removeLocal, setEnabledLocal],
  );

  // Remove
  const removeReminder = useCallback(
    async (id: string) => {
      markBusy(id, true);
      try {
        // Cancel first, then delete. A cancelled-but-listed row is
        // recoverable; a deleted row whose notification still fires
        // is not.
        await cancelReminderAsync(id);
        await removeLocal(id);
      } catch (error) {
        console.error("Failed to remove reminder:", error);
      } finally {
        markBusy(id, false);
      }
    },
    [removeLocal, markBusy],
  );

  // Toggle one reminder
  const toggleReminder = useCallback(
    async (id: string) => {
      const target = reminders.find((r) => r.id === id);
      if (!target) return;

      const nextEnabled = !target.enabled;
      markBusy(id, true);

      try {
        if (nextEnabled) {
          await setEnabledLocal(id, true);

          // Smart Reminders off: persist preference, skip the OS.
          if (!smartEnabled) return;

          const result = await scheduleReminderAsync({
            ...target,
            enabled: true,
          });

          if (!result.ok) {
            await setEnabledLocal(id, false);
            const state = await getReminderPermissionState();
            setPermission(state);
            feedback("warning");
          }
        } else {
          await cancelReminderAsync(id);
          await setEnabledLocal(id, false);
        }
      } catch (error) {
        console.error("Failed to toggle reminder:", error);
      } finally {
        markBusy(id, false);
      }
    },
    [reminders, smartEnabled, setEnabledLocal, markBusy],
  );

  // Toggle Smart Reminders
  const toggleSmartReminders = useCallback(
    async (enabled: boolean) => {
      setGlobalBusy(true);

      try {
        await setSmartEnabledLocal(enabled);

        if (!enabled) {
          await cancelAllRemindersAsync(reminders.map((r) => r.id));
          return;
        }

        // Re-enabling: reschedule every enabled reminder.
        for (const reminder of reminders) {
          if (!reminder.enabled) continue;
          await scheduleReminderAsync(reminder);
        }

        const state = await getReminderPermissionState();
        setPermission(state);
        await refresh();
      } catch (error) {
        console.error("Failed to toggle smart reminders:", error);
      } finally {
        setGlobalBusy(false);
      }
    },
    [reminders, setSmartEnabledLocal, refresh],
  );

  return {
    statusById,
    permission,
    busy: globalBusy || busyIds.size > 0,
    addReminder,
    removeReminder,
    toggleReminder,
    toggleSmartReminders,
  };
}
