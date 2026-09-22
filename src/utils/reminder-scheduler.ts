// ─────────────────────────────────────────────────────────────
// utils/reminder-scheduler.ts
//
// Wraps expo-notifications so the rest of the app never touches
// identifiers, permissions, or platform quirks directly.
//
// Every function returns a discriminated result rather than
// throwing, so callers can render precise error states instead of
// a generic "something went wrong".
//
// Local notifications work in Expo Go. Push notifications require
// a dev build from SDK 53+, but this module only schedules local
// notifications.
// ─────────────────────────────────────────────────────────────
import { Platform } from "react-native";

import * as Notifications from "expo-notifications";

import type { Reminder } from "@/repositories/reminder-repo";

// ─────────────────────────────────────────────────────────────
// Channel configuration
// ─────────────────────────────────────────────────────────────

export const REMINDER_CHANNEL_ID = "hydration-reminders";

const CHANNEL_NAME = "Hydration Reminders";
const CHANNEL_DESCRIPTION =
  "Gentle nudges throughout the day to help you stay hydrated.";

const REMINDER_TITLE = "Time to hydrate";
const REMINDER_BODY = "A glass of water now keeps your energy steady.";

// ─────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────

export type ScheduleResult =
  | { ok: true; notificationId: string }
  | { ok: false; reason: "permission-denied" | "error" };

export type PermissionState = "granted" | "denied" | "undetermined";

// ─────────────────────────────────────────────────────────────
// Channel + permission
// ─────────────────────────────────────────────────────────────

/**
 * Creates the Android channel. Safe to call repeatedly — the OS
 * no-ops when a channel with this ID already exists.
 */
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

/**
 * Reads the current permission state without prompting. Use this
 * to render status indicators.
 */
export async function getReminderPermissionState(): Promise<PermissionState> {
  if (Platform.OS === "web") return "denied";

  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return "granted";
  if (current.status === "undetermined") return "undetermined";
  return "denied";
}

/**
 * Requests permission only if it hasn't been granted and the user
 * can still be asked. Never loops on denial.
 */
export async function ensureReminderPermissionAsync(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
    },
  });

  return requested.status === "granted";
}

// ─────────────────────────────────────────────────────────────
// Scheduling
// ─────────────────────────────────────────────────────────────

/**
 * Schedules one repeating daily notification for a reminder.
 *
 * `type: SchedulableTriggerInputTypes.DAILY` is mandatory — without
 * it, Expo treats the trigger as immediate and fires the
 * notification the instant it's scheduled.
 */
export async function scheduleReminderAsync(
  reminder: Reminder,
): Promise<ScheduleResult> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "permission-denied" };
  }

  const granted = await ensureReminderPermissionAsync();
  if (!granted) {
    return { ok: false, reason: "permission-denied" };
  }

  await ensureReminderChannelAsync();

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
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

    return { ok: true, notificationId };
  } catch (error) {
    console.error("Failed to schedule reminder:", error);
    return { ok: false, reason: "error" };
  }
}

/**
 * Cancels a scheduled notification. Swallows unknown identifiers —
 * the OS throws if the ID no longer exists, which is expected after
 * a reinstall or a data reset.
 */
export async function cancelReminderAsync(
  notificationId: string | null,
): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already gone — nothing to do.
  }
}

/**
 * Cancels every scheduled hydration reminder in one call, then
 * verifies the OS state actually cleared.
 *
 * Used when Smart Reminders is turned off. Returns the number of
 * notifications that were still scheduled after the cancel pass —
 * a non-zero value means something went wrong and the caller should
 * surface it.
 */
export async function cancelAllRemindersAsync(
  notificationIds: readonly (string | null)[],
): Promise<number> {
  await Promise.all(notificationIds.map(cancelReminderAsync));

  try {
    const remaining = await Notifications.getAllScheduledNotificationsAsync();
    const ourPrefix = "hydration-reminder";
    const stragglers = remaining.filter(
      (n) => (n.content.data as { type?: string } | null)?.type === ourPrefix,
    );
    return stragglers.length;
  } catch {
    // Can't verify — report zero so the caller doesn't block on a
    // read failure that may be transient.
    return 0;
  }
}
