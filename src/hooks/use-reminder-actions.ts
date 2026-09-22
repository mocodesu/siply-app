// hooks/use-reminder-actions.ts
//
// Action dispatcher for reminders. All UI state lives in the
// reminders store; this hook only coordinates DB / OS transactions
// and manages per-screen side effects.
//
// toggleReminder updates the enabled flag BEFORE marking busy, so
// the switch's value prop and its disabled state change in the
// same React batch. See the comment on that function for the full
// sequence.
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import {
  selectClearAllBusy,
  selectInsertLocal,
  selectRefresh,
  selectRemoveLocal,
  selectSetBusy,
  selectSetEnabledLocal,
  selectSetPermission,
  selectSetSmartEnabledLocal,
  useRemindersStore,
} from "@/store/reminders-store";
import { feedback } from "@/utils/haptics";
import {
  cancelAllRemindersAsync,
  cancelReminderAsync,
  getReminderPermissionState,
  scheduleReminderAsync,
} from "@/utils/reminder-scheduler";

// -------------------------------------------------------------
// Public interface
// -------------------------------------------------------------

export interface ReminderActions {
  addReminder: (input: {
    id: string;
    label: string;
    hour: number;
    minute: number;
  }) => Promise<{
    ok: boolean;
    reason?: "duplicate" | "permission" | "error";
  }>;

  removeReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  toggleSmartReminders: (enabled: boolean) => Promise<void>;
}

// -------------------------------------------------------------
// Hook
// -------------------------------------------------------------

export function useReminderActions(): ReminderActions {
  const insertLocal = useRemindersStore(selectInsertLocal);
  const removeLocal = useRemindersStore(selectRemoveLocal);
  const setEnabledLocal = useRemindersStore(selectSetEnabledLocal);
  const setSmartEnabledLocal = useRemindersStore(selectSetSmartEnabledLocal);
  const setPermission = useRemindersStore(selectSetPermission);
  const setBusy = useRemindersStore(selectSetBusy);
  const clearAllBusy = useRemindersStore(selectClearAllBusy);
  const refresh = useRemindersStore(selectRefresh);

  const schedulingInFlightRef = useRef(false);

  // -----------------------------------------------------------
  // Permission tracking
  // -----------------------------------------------------------

  useEffect(() => {
    let active = true;
    void getReminderPermissionState().then((state) => {
      if (active) setPermission(state);
    });
    return () => {
      active = false;
    };
  }, [setPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void getReminderPermissionState().then(setPermission);
      }
    });
    return () => subscription.remove();
  }, [setPermission]);

  // -----------------------------------------------------------
  // Reconciliation on focus
  // -----------------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return;

      let cancelled = false;

      const reconcile = async () => {
        if (schedulingInFlightRef.current) return;

        const snapshot = useRemindersStore.getState().reminders;
        if (snapshot.length === 0) return;

        let scheduledIds: Set<string>;
        try {
          const scheduled =
            await Notifications.getAllScheduledNotificationsAsync();
          scheduledIds = new Set(scheduled.map((n) => n.identifier));
        } catch {
          return;
        }

        if (cancelled) return;
        if (schedulingInFlightRef.current) return;

        for (const reminder of snapshot) {
          if (cancelled) return;
          if (schedulingInFlightRef.current) return;
          if (!reminder.enabled) continue;
          if (scheduledIds.has(reminder.id)) continue;
          await setEnabledLocal(reminder.id, false);
        }
      };

      void reconcile();

      return () => {
        cancelled = true;
      };
    }, [setEnabledLocal]),
  );

  // -----------------------------------------------------------
  // Add
  // -----------------------------------------------------------

  const addReminder = useCallback<ReminderActions["addReminder"]>(
    async (input) => {
      const current = useRemindersStore.getState().reminders;
      if (current.some((r) => r.id === input.id)) {
        return { ok: false, reason: "duplicate" };
      }

      schedulingInFlightRef.current = true;
      setBusy(input.id, true);

      try {
        await insertLocal({
          id: input.id,
          label: input.label,
          hour: input.hour,
          minute: input.minute,
          enabled: true,
        });

        const smartEnabled = useRemindersStore.getState().smartEnabled;
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
        schedulingInFlightRef.current = false;
        setBusy(input.id, false);
      }
    },
    [insertLocal, removeLocal, setEnabledLocal, setPermission, setBusy],
  );

  // -----------------------------------------------------------
  // Remove
  // -----------------------------------------------------------

  const removeReminder = useCallback(
    async (id: string) => {
      setBusy(id, true);
      schedulingInFlightRef.current = true;
      try {
        await cancelReminderAsync(id);
        await removeLocal(id);
      } catch (error) {
        console.error("Failed to remove reminder:", error);
      } finally {
        schedulingInFlightRef.current = false;
        setBusy(id, false);
      }
    },
    [removeLocal, setBusy],
  );

  // -----------------------------------------------------------
  // Toggle one reminder
  //
  // Order matters. The bug this fixes: if setBusy runs before the
  // enabled state update, the row re-renders with busy=true and
  // enabled=<old> for the duration of the DB write. The native
  // switch sees value=<old> while disabled and animates back,
  // then animates forward again when the value finally updates.
  //
  // Fixed order:
  //   1. void setEnabledLocal -- updates state synchronously,
  //      the DB write continues in the background
  //   2. setBusy -- also synchronous
  //   Both set() calls land in the same React batch, so the switch
  //   sees value=<new> and disabled=true in one frame.
  // -----------------------------------------------------------

  const toggleReminder = useCallback(
    async (id: string) => {
      // Re-entrancy guard. Bail if this row is already processing.
      if (useRemindersStore.getState().busyIds[id]) return;

      const target = useRemindersStore
        .getState()
        .reminders.find((r) => r.id === id);
      if (!target) return;

      const nextEnabled = !target.enabled;

      // Step 1: synchronous state update. Fire-and-forget the DB
      // write inside setEnabledLocal so this call returns
      // immediately and the store reflects the new value in the
      // same tick.
      void setEnabledLocal(id, nextEnabled);

      // Step 2: mark busy. Batched with step 1 by React.
      setBusy(id, true);
      schedulingInFlightRef.current = true;

      try {
        if (nextEnabled) {
          const smartEnabled = useRemindersStore.getState().smartEnabled;
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
        }
      } catch (error) {
        console.error("Failed to toggle reminder:", error);
        // Revert on unexpected failure.
        await setEnabledLocal(id, target.enabled);
      } finally {
        schedulingInFlightRef.current = false;
        setBusy(id, false);
      }
    },
    [setEnabledLocal, setPermission, setBusy],
  );

  // -----------------------------------------------------------
  // Toggle Smart Reminders
  // -----------------------------------------------------------

  const toggleSmartReminders = useCallback(
    async (enabled: boolean) => {
      schedulingInFlightRef.current = true;
      clearAllBusy();

      try {
        await setSmartEnabledLocal(enabled);

        if (!enabled) {
          const ids = useRemindersStore.getState().reminders.map((r) => r.id);
          await cancelAllRemindersAsync(ids);
          return;
        }

        const snapshot = useRemindersStore.getState().reminders;
        for (const reminder of snapshot) {
          if (!reminder.enabled) continue;
          const result = await scheduleReminderAsync(reminder);
          if (!result.ok) {
            await setEnabledLocal(reminder.id, false);
          }
        }

        const state = await getReminderPermissionState();
        setPermission(state);
        await refresh();
      } catch (error) {
        console.error("Failed to toggle smart reminders:", error);
      } finally {
        schedulingInFlightRef.current = false;
      }
    },
    [
      setSmartEnabledLocal,
      setEnabledLocal,
      setPermission,
      clearAllBusy,
      refresh,
    ],
  );

  return {
    addReminder,
    removeReminder,
    toggleReminder,
    toggleSmartReminders,
  };
}
