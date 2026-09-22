// ─────────────────────────────────────────────────────────────
// app/(tabs)/index.tsx — Home dashboard
//
// Fix from Step 6: the second quick-add card is gone. The single
// Quick Add card now opens the Add Water modal, matching the
// reference flow — the modal is where cup-size choice happens.
// ─────────────────────────────────────────────────────────────
import { HydrationRing } from "@/components/hydration-ring";
import { IconButton } from "@/components/icon-button";
import { QuickAddCard } from "@/components/quick-add-card";
import { ReminderCard } from "@/components/reminder-card";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useHydrationStore } from "@/store/hydration-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatVolume, formatVolumeValue } from "@/utils/format";
import { unitSuffix } from "@/utils/units";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good Morning!";
  if (hour < 18) return "Good Afternoon!";
  return "Good Evening!";
}

export default function HomeScreen() {
  const totalMl = useHydrationStore((s) => s.totalMl);
  const goalMl = useHydrationStore((s) => s.goalMl);
  const units = useSettingsStore((s) => s.units);

  const percentage = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;
  const greeting = greetingForHour(new Date().getHours());

  const handleOpenAddWater = useCallback(() => {
    router.push("/add-water");
  }, []);

  const handleNoop = useCallback(() => {
    // Placeholder for the menu and notifications affordances.
  }, []);

  return (
    <ScrollScreen testID="home-screen">
      <View style={styles.headerBlock}>
        <View style={styles.topBar}>
          <IconButton
            name="menu-outline"
            onPress={handleNoop}
            accessibilityLabel="Open menu"
            testID="home-menu-button"
          />
          <IconButton
            name="notifications-outline"
            onPress={handleNoop}
            accessibilityLabel="View notifications"
            showDot
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

      <ReminderCard
        label="Next reminder"
        timeLeft="in 45 min"
        time="10:30 AM"
        testID="home-reminder-card"
      />

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
