// ─────────────────────────────────────────────────────────────
// utils/reminder-scheduler.ts
//
// Wraps expo-notifications so the rest of the app never has to
// think about identifiers, permissions, or platform quirks.
//
// Local notifications work in Expo Go. Push notifications require
// a development build from SDK 53 onward, but we only use local
// scheduling here, so no dev build is needed for this feature.
// ─────────────────────────────────────────────────────────────
import { Platform } from "react-native";

import * as Notifications from "expo-notifications";

import type { Reminder } from "@/repositories/reminder-repo";

/** Android channel for hydration reminders. */
const REMINDER_CHANNEL_ID = "hydration-reminders";

const CHANNEL_NAME = "Hydration Reminders";
const CHANNEL_DESCRIPTION =
  "Gentle nudges throughout the day to help you stay hydrated.";

const REMINDER_TITLE = "Time to hydrate";
const REMINDER_BODY = "A glass of water now keeps your energy steady.";

/**
 * Creates the Android channel. Safe to call repeatedly — the OS
 * no-ops when a channel with this ID already exists.
 */
export async function ensureReminderChannelAsync(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: CHANNEL_NAME,
    description: CHANNEL_DESCRIPTION,
    importance: Notifications.AndroidImportance.DEFAULT,
    enableVibrate: true,
    vibrationPattern: [0, 150, 100, 150],
    showBadge: false,
  });
}

/**
 * Requests permission only if it hasn't already been granted and
 * the user can still be asked. Never loops on denial.
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

/**
 * Schedules one daily notification and returns its identifier.
 *
 * `SchedulableTriggerInputTypes.DAILY` is what tells Expo this is a
 * repeating calendar trigger rather than an immediate one — without
 * it, the notification fires right away[reference:2].
 */
export async function scheduleDailyReminderAsync(
  reminder: Reminder,
): Promise<string | null> {
  const granted = await ensureReminderPermissionAsync();
  if (!granted) return null;

  await ensureReminderChannelAsync();

  return Notifications.scheduleNotificationAsync({
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
}

/**
 * Cancels a previously scheduled notification. Silently swallows
 * unknown identifiers — the OS throws if the ID no longer exists,
 * which is expected after a re-install.
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
