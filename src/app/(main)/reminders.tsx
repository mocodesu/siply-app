// ─────────────────────────────────────────────────────────────
// app/(main)/reminders.tsx
//
// Modal for configuring hydration reminders.
//
// Layout mirrors reference screen 4: header with back + add,
// Smart Reminders card, the reminder time list, and the
// consistency tip.
// ─────────────────────────────────────────────────────────────
import { IconButton } from "@/components/icon-button";
import { ReminderRow } from "@/components/reminder-row";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { TipCard } from "@/components/tip-card";
import { ToggleRow } from "@/components/toggle-row";
import { useRemindersStore } from "@/store/reminders-store";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function RemindersScreen() {
  const reminders = useRemindersStore((s) => s.reminders);
  const smartEnabled = useRemindersStore((s) => s.smartEnabled);
  const setSmartEnabled = useRemindersStore((s) => s.setSmartEnabled);
  const toggleReminder = useRemindersStore((s) => s.toggleReminder);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

  const handleAdd = useCallback(() => {
    // Time-picker flow lands in a later step. For now this is a
    // no-op so the header matches the design without implying a
    // feature that doesn't exist yet.
  }, []);

  const handleSmartToggle = useCallback(
    (value: boolean) => {
      void setSmartEnabled(value);
    },
    [setSmartEnabled],
  );

  const handleReminderToggle = useCallback(
    (id: string) => {
      void toggleReminder(id);
    },
    [toggleReminder],
  );

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="reminders-back"
      />
      <IconButton
        name="add"
        onPress={handleAdd}
        accessibilityLabel="Add reminder"
        testID="reminders-add"
      />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="reminders-screen">
      {/* ── Title ───────────────────────────────────────── */}
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Reminders
        </Text>
      </View>

      {/* ── Smart Reminders ─────────────────────────────── */}
      <View style={styles.card}>
        <ToggleRow
          label="Smart Reminders"
          subtitle="We'll remind you based on your habits and schedule."
          value={smartEnabled}
          onValueChange={handleSmartToggle}
          testID="reminders-smart-toggle"
          switchTestID="reminders-smart-switch"
        />
      </View>

      {/* ── Reminder times ──────────────────────────────── */}
      <View style={styles.listSection}>
        <Text variant="subheadBold" color="onSurface">
          Reminder Times
        </Text>

        <View style={styles.list}>
          {reminders.map((reminder) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              onToggle={handleReminderToggle}
              disabled={!smartEnabled}
              testID={`reminders-row-${reminder.id}`}
            />
          ))}
        </View>
      </View>

      {/* ── Tip ─────────────────────────────────────────── */}
      <TipCard
        title="Tip: Consistency is key!"
        body="Spread your water intake throughout the day."
        testID="reminders-tip"
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.layout.minTouchTarget,
  },
  titleBlock: {
    alignItems: "center",
  },
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
  },
  listSection: {
    gap: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.xs,
  },
}));
