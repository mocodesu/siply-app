// ─────────────────────────────────────────────────────────────
// app/(main)/add-reminder.tsx
//
// Modal for adding a new reminder. Composes TimePicker with a
// preview of the chosen time and a Save button.
// ─────────────────────────────────────────────────────────────
import { IconButton } from "@/components/icon-button";
import { PrimaryButton } from "@/components/primary-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { TimePicker, type Meridiem } from "@/components/time-picker";
import { ReminderRepo, type Reminder } from "@/repositories/reminder-repo";
import { useRemindersStore } from "@/store/reminders-store";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Time conversion
// ─────────────────────────────────────────────────────────────

function to24Hour(hour12: number, meridiem: Meridiem): number {
  if (meridiem === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function formatTimeLabel(hour12: number, minute: number, meridiem: Meridiem) {
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

/** Deterministic ID so re-adding the same time is idempotent. */
function reminderId(hour24: number, minute: number): string {
  return `rem-${String(hour24).padStart(2, "0")}${String(minute).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function AddReminderScreen() {
  const db = useSQLiteContext();
  const refresh = useRemindersStore((s) => s.refresh);
  const existing = useRemindersStore((s) => s.reminders);

  const [hour12, setHour12] = useState(10);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<Meridiem>("AM");

  const hour24 = useMemo(() => to24Hour(hour12, meridiem), [hour12, meridiem]);

  const label = useMemo(
    () => formatTimeLabel(hour12, minute, meridiem),
    [hour12, minute, meridiem],
  );

  const id = useMemo(() => reminderId(hour24, minute), [hour24, minute]);
  const isDuplicate = useMemo(
    () => existing.some((r) => r.id === id),
    [existing, id],
  );

  // ── Handlers ────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleSave = useCallback(async () => {
    if (isDuplicate) return;

    const reminder: Omit<Reminder, "notificationId" | "createdAt"> = {
      id,
      label,
      hour: hour24,
      minute,
      enabled: true,
    };

    await ReminderRepo.insert(db, reminder);
    await refresh();
    if (router.canGoBack()) router.back();
  }, [db, id, label, hour24, minute, isDuplicate, refresh]);

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="close"
        onPress={handleClose}
        accessibilityLabel="Close"
        testID="add-reminder-close"
      />
      <Text
        variant="title"
        color="onBackground"
        textAlign="center"
        style={styles.headerTitle}
      >
        Add Reminder
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="add-reminder-screen">
      {/* ── Preview ─────────────────────────────────────── */}
      <View style={styles.preview}>
        <Text variant="display" color="primary" textAlign="center">
          {label}
        </Text>
        <Text variant="caption" color="mutedText" textAlign="center">
          {isDuplicate
            ? "You already have a reminder at this time."
            : "Repeats every day."}
        </Text>
      </View>

      {/* ── Picker ──────────────────────────────────────── */}
      <TimePicker
        hour12={hour12}
        minute={minute}
        meridiem={meridiem}
        onChange={(next) => {
          setHour12(next.hour12);
          setMinute(next.minute);
          setMeridiem(next.meridiem);
        }}
        testIDPrefix="add-reminder"
      />

      {/* ── Save ────────────────────────────────────────── */}
      <PrimaryButton
        label="Save Reminder"
        onPress={() => {
          void handleSave();
        }}
        disabled={isDuplicate}
        testID="add-reminder-save"
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.layout.minTouchTarget,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
  preview: {
    alignItems: "center",
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.lg,
  },
}));
