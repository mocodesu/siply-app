// app/(main)/reminders.tsx
//
// Composed of five independent modules:
//
//   RemindersHeader            -- no subscriptions, mounts once
//   RemindersPermissionBanner  -- subscribes to permission only
//   RemindersSmartToggle       -- subscribes to smartEnabled and
//                                 anyBusy (global flag; correct
//                                 here because the toggle is
//                                 global)
//   RemindersList              -- subscribes to the reminders
//                                 array and smartEnabled only;
//                                 each row owns its own busy flag
//   RemindersTip               -- no subscriptions, mounts once
//
// Toggling a single reminder re-renders exactly one row. The
// RemindersList does not re-render on a toggle.
import { FadeInView } from "@/components/fade-in";
import { IconButton } from "@/components/icon-button";
import { ReminderRow } from "@/components/reminder-row";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { TipCard } from "@/components/tip-card";
import { ToggleRow } from "@/components/toggle-row";
import { useReminderActions } from "@/hooks/use-reminder-actions";
import {
  selectAnyBusy,
  selectPermission,
  selectReminders,
  selectScheduledCount,
  selectSmartEnabled,
  useRemindersStore,
} from "@/store/reminders-store";
import { feedback } from "@/utils/haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// -------------------------------------------------------------
// Module-scope callbacks
// -------------------------------------------------------------

const goBack = () => {
  if (router.canGoBack()) router.back();
};

const goToAddReminder = () => {
  router.push("/add-reminder");
};

const openSystemSettings = () => {
  void Linking.openSettings();
};

// -------------------------------------------------------------
// Screen
// -------------------------------------------------------------

export default function RemindersScreen() {
  return (
    <ScrollScreen header={<RemindersHeader />} testID="reminders-screen">
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Reminders
        </Text>
      </View>

      <RemindersPermissionBanner />
      <RemindersSmartToggle />
      <RemindersList />
      <RemindersTip />
    </ScrollScreen>
  );
}

// -------------------------------------------------------------
// Header
// -------------------------------------------------------------

function RemindersHeader() {
  return (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={goBack}
        accessibilityLabel="Go back"
        testID="reminders-back"
      />
      <IconButton
        name="add"
        onPress={goToAddReminder}
        accessibilityLabel="Add reminder"
        testID="reminders-add"
      />
    </View>
  );
}

// -------------------------------------------------------------
// Permission banner
// -------------------------------------------------------------

function RemindersPermissionBanner() {
  const permission = useRemindersStore(selectPermission);

  if (permission !== "denied") return null;

  return (
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
        onPress={openSystemSettings}
        accessibilityRole="link"
        accessibilityLabel="Open notification settings"
        style={styles.bannerAction}
      >
        Open settings
      </Text>
    </View>
  );
}

// -------------------------------------------------------------
// Smart Reminders toggle
//
// Legitimately subscribes to anyBusy -- the toggle is global, so
// it should dim while any scheduling operation is running.
// -------------------------------------------------------------

function RemindersSmartToggle() {
  const smartEnabled = useRemindersStore(selectSmartEnabled);
  const scheduledCount = useRemindersStore(selectScheduledCount);
  const anyBusy = useRemindersStore(selectAnyBusy);

  const { toggleSmartReminders } = useReminderActions();

  const handleToggle = (value: boolean) => {
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
  };

  return (
    <View style={styles.card}>
      <ToggleRow
        label="Smart Reminders"
        subtitle="We'll remind you based on your habits and schedule."
        value={smartEnabled}
        onValueChange={handleToggle}
        disabled={anyBusy}
        testID="reminders-smart-toggle"
        switchTestID="reminders-smart-switch"
      />
    </View>
  );
}

// -------------------------------------------------------------
// List
//
// Subscribes to the reminders array and smartEnabled only. No
// per-toggle state is shared here, so toggling a row does not
// cause this component to re-render. Each ReminderRow owns its
// own busy flag.
// -------------------------------------------------------------

function RemindersList() {
  const reminders = useRemindersStore(selectReminders);
  const smartEnabled = useRemindersStore(selectSmartEnabled);

  const { toggleReminder, removeReminder } = useReminderActions();

  const handleToggle = (id: string) => {
    void toggleReminder(id);
  };

  const handleDelete = (id: string) => {
    void removeReminder(id);
    feedback("success");
  };

  return (
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
              reminderId={reminder.id}
              onToggle={handleToggle}
              onDelete={handleDelete}
              disabled={!smartEnabled}
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
  );
}

// -------------------------------------------------------------
// Tip
// -------------------------------------------------------------

function RemindersTip() {
  return (
    <TipCard
      title="Tip: Consistency is key!"
      body="Spread your water intake throughout the day."
      testID="reminders-tip"
    />
  );
}

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------

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
