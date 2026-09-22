// ─────────────────────────────────────────────────────────────
// app/(tabs)/index.tsx — Home dashboard
//
// Changes in Step A:
//   • Drawer icon removed — the app has no drawer.
//   • Bell navigates to Reminders.
//   • Notification dot shown only when a reminder is imminent.
//   • ReminderCard is wired to real reminders, hidden when none.
// ─────────────────────────────────────────────────────────────
import { HydrationRing } from "@/components/hydration-ring";
import { IconButton } from "@/components/icon-button";
import { QuickAddCard } from "@/components/quick-add-card";
import { ReminderCard } from "@/components/reminder-card";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useNextReminder } from "@/hooks/use-next-reminder";
import { useHydrationStore } from "@/store/hydration-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatVolume, formatVolumeValue } from "@/utils/format";
import { unitSuffix } from "@/utils/units";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/** A reminder within this window shows the notification dot. */
const IMMINENT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good Morning!";
  if (hour < 18) return "Good Afternoon!";
  return "Good Evening!";
}

export default function HomeScreen() {
  const totalMl = useHydrationStore((s) => s.totalMl);
  const goalMl = useHydrationStore((s) => s.goalMl);
  const units = useSettingsStore((s) => s.units);

  const nextReminder = useNextReminder();

  const percentage = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;
  const greeting = greetingForHour(new Date().getHours());

  const showNotificationDot =
    nextReminder !== null &&
    nextReminder.firesAt - Date.now() < IMMINENT_WINDOW_MS;

  const handleOpenAddWater = useCallback(() => {
    router.push("/add-water");
  }, []);

  const handleOpenReminders = useCallback(() => {
    router.push("/reminders");
  }, []);

  return (
    <ScrollScreen testID="home-screen">
      <View style={styles.headerBlock}>
        <View style={styles.topBar}>
          {/* Left spacer keeps the bell right-aligned without a
              visible drawer affordance. */}
          <View style={styles.topBarSpacer} />

          <IconButton
            name="notifications-outline"
            onPress={handleOpenReminders}
            accessibilityLabel="View reminders"
            showDot={showNotificationDot}
            testID="home-notifications-button"
          />
        </View>

        <View style={styles.greetingBlock}>
          <Text variant="h2" color="onBackground">
            {greeting} 💧
          </Text>
          <Text variant="subhead" color="mutedText">
            Stay hydrated, stay healthy.
          </Text>
        </View>
      </View>

      <View style={styles.ringWrapper}>
        <HydrationRing
          current={totalMl}
          goal={goalMl}
          size={240}
          testID="home-hydration-ring"
        >
          <View style={styles.ringCenter}>
            <Text variant="caption" color="mutedText">
              Today
            </Text>
            <Text variant="display" color="onBackground">
              {formatVolumeValue(totalMl, units)} {unitSuffix(units)}
            </Text>
            <Text variant="caption" color="mutedText">
              of {formatVolume(goalMl, units)} goal
            </Text>
            <Text variant="h3" color="primary" style={styles.ringPercent}>
              {Math.round(percentage * 100)}%
            </Text>
          </View>
        </HydrationRing>
      </View>

      {nextReminder && (
        <ReminderCard
          label="Next reminder"
          timeLeft={nextReminder.timeLeft}
          time={nextReminder.time}
          onPress={handleOpenReminders}
          testID="home-reminder-card"
        />
      )}

      <QuickAddCard
        onPress={handleOpenAddWater}
        title="Add water"
        description="Logging water is as easy as 1 tap!"
        testID="home-quick-add"
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerBlock: {
    gap: theme.spacing.sm,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.layout.minTouchTarget,
  },
  topBarSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
  greetingBlock: {
    gap: theme.spacing.xxs,
  },
  ringWrapper: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  ringCenter: {
    alignItems: "center",
    gap: 1,
  },
  ringPercent: {
    marginTop: theme.spacing.xs,
  },
}));
