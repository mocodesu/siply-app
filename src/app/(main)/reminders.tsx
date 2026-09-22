// app/(main)/reminders.tsx
//
// Reminders screen.
//
// Reconciliation against the OS now happens inside
// useReminderActions, so this screen does not need a separate
// reconcile call.
import { FadeInView } from "@/components/fade-in";
import { IconButton } from "@/components/icon-button";
import { ReminderRow } from "@/components/reminder-row";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { TipCard } from "@/components/tip-card";
import { ToggleRow } from "@/components/toggle-row";
import { useReminderActions } from "@/hooks/use-reminder-actions";
import { useRemindersStore } from "@/store/reminders-store";
import { feedback } from "@/utils/haptics";
import { router } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Alert, Linking, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function RemindersScreen() {
  const reminders = useRemindersStore((s) => s.reminders);
  const smartEnabled = useRemindersStore((s) => s.smartEnabled);

  const {
    statusById,
    permission,
    busy,
    removeReminder,
    toggleReminder,
    toggleSmartReminders,
  } = useReminderActions();

  const scheduledCount = useMemo(
    () => reminders.filter((r) => statusById[r.id] === "scheduled").length,
    [reminders, statusById],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleAdd = useCallback(() => {
    if (busy) return;
    router.push("/add-reminder");
  }, [busy]);

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const handleSmartToggle = useCallback(
    (value: boolean) => {
      if (!value && scheduledCount > 0) {
        Alert.alert(
          "Turn off reminders?",
          `This will cancel ${scheduledCount} scheduled ${
            scheduledCount === 1 ? "reminder" : "reminders"
          }. Your times are kept and can be re-enabled later.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Turn off",
              style: "destructive",
              onPress: () => {
                void toggleSmartReminders(false);
              },
            },
          ],
        );
        return;
      }

      void toggleSmartReminders(value);
    },
    [scheduledCount, toggleSmartReminders],
  );

  const handleReminderToggle = useCallback(
    (id: string) => {
      void toggleReminder(id);
    },
    [toggleReminder],
  );

  const handleReminderDelete = useCallback(
    (id: string) => {
      void removeReminder(id);
      feedback("success");
    },
    [removeReminder],
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

  const permissionDenied = permission === "denied";

  return (
    <ScrollScreen header={header} testID="reminders-screen">
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Reminders
        </Text>
      </View>

      {permissionDenied && (
        <View style={styles.banner} testID="reminders-permission-banner">
          <Text variant="subheadBold" color="danger">
            Notifications are off
          </Text>
          <Text variant="caption" color="mutedText">
            Reminders can't fire until you allow notifications for Siply.
          </Text>
          <Text
            variant="subheadBold"
            color="primary"
            onPress={handleOpenSettings}
            accessibilityRole="link"
            accessibilityLabel="Open notification settings"
            style={styles.bannerAction}
          >
            Open settings
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <ToggleRow
          label="Smart Reminders"
          subtitle="We'll remind you based on your habits and schedule."
          value={smartEnabled}
          onValueChange={handleSmartToggle}
          disabled={busy}
          testID="reminders-smart-toggle"
          switchTestID="reminders-smart-switch"
        />
      </View>

      <View style={styles.listSection}>
        <Text variant="subheadBold" color="onSurface">
          Reminder Times
        </Text>

        <View style={styles.list} testID="reminders-list">
          {reminders.map((reminder, index) => (
            <FadeInView
              key={reminder.id}
              delay={Math.min(index, 8) * 40}
              offset={6}
            >
              <ReminderRow
                reminder={reminder}
                status={statusById[reminder.id] ?? "off"}
                onToggle={handleReminderToggle}
                onDelete={handleReminderDelete}
                disabled={!smartEnabled}
                swipeDisabled={busy}
                testID={`reminders-row-${reminder.id}`}
              />
            </FadeInView>
          ))}
        </View>

        {reminders.length === 0 && (
          <Text
            variant="caption"
            color="mutedText"
            textAlign="center"
            style={styles.empty}
          >
            No reminders yet. Tap + to add one.
          </Text>
        )}
      </View>

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
  banner: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.danger,
    gap: theme.spacing.xxs,
  },
  bannerAction: {
    marginTop: theme.spacing.xs,
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
  empty: {
    paddingVertical: theme.spacing.xl,
  },
}));
