// utils/reminder-scheduler.ts
//
// Wraps expo-notifications. The reminder's own id is used as the
// OS notification identifier. See utils/haptics.ts for how the
// haptic + sound layer hooks in.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Reminder } from "@/repositories/reminder-repo";

export const REMINDER_CHANNEL_ID = "hydration-reminders";

const CHANNEL_NAME = "Hydration Reminders";
const CHANNEL_DESCRIPTION =
  "Gentle nudges throughout the day to help you stay hydrated.";

const REMINDER_TITLE = "Time to hydrate";
const REMINDER_BODY = "A glass of water now keeps your energy steady.";

export type ScheduleResult =
  | { ok: true }
  | { ok: false; reason: "permission-denied" | "error" };

export type PermissionState = "granted" | "denied" | "undetermined";

// -------------------------------------------------------------
// Channel + permission
// -------------------------------------------------------------

export async function ensureReminderChannelAsync(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: true,
      vibrationPattern: [0, 150, 100, 150],
      showBadge: false,
    });
  } catch (error) {
    console.error("Failed to create reminder channel:", error);
  }
}

export async function getReminderPermissionState(): Promise<PermissionState> {
  if (Platform.OS === "web") return "denied";

  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return "granted";
  if (current.status === "undetermined") return "undetermined";
  return "denied";
}

export async function ensureReminderPermissionAsync(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });

  return requested.status === "granted";
}

// -------------------------------------------------------------
// Scheduling
// -------------------------------------------------------------

/**
 * Schedules one repeating daily notification using the reminder's
 * own id as the OS identifier.
 *
 * Cancels any existing notification with the same identifier
 * first. Without this, rescheduling after a settings change can
 * fail on some platforms with a duplicate-identifier error.
 *
 * SchedulableTriggerInputTypes.DAILY is mandatory. Without the
 * explicit type field, Expo treats the trigger as immediate.
 */
export async function scheduleReminderAsync(
  reminder: Reminder,
): Promise<ScheduleResult> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "permission-denied" };
  }

  const granted = await ensureReminderPermissionAsync();
  if (!granted) return { ok: false, reason: "permission-denied" };

  await ensureReminderChannelAsync();

  // Cancel any existing registration under this identifier.
  // Cancelling a non-existent id is a no-op.
  try {
    await Notifications.cancelScheduledNotificationAsync(reminder.id);
  } catch {
    // Fine -- nothing was scheduled.
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: REMINDER_TITLE,
        body: REMINDER_BODY,
        sound: true,
        data: { type: "hydration-reminder", reminderId: reminder.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: Platform.OS === "android" ? REMINDER_CHANNEL_ID : undefined,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to schedule reminder:", error);
    return { ok: false, reason: "error" };
  }
}

export async function cancelReminderAsync(reminderId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  } catch {
    // Already gone -- nothing to do.
  }
}

export async function cancelAllRemindersAsync(
  reminderIds: readonly string[],
): Promise<number> {
  await Promise.all(reminderIds.map(cancelReminderAsync));

  try {
    const remaining = await Notifications.getAllScheduledNotificationsAsync();
    return remaining.filter(
      (n) =>
        (n.content.data as { type?: string } | null)?.type ===
        "hydration-reminder",
    ).length;
  } catch {
    return 0;
  }
}
