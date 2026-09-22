// ─────────────────────────────────────────────────────────────
// app/(tabs)/index.tsx — Home dashboard
// ─────────────────────────────────────────────────────────────
import { HydrationRing } from "@/components/hydration-ring";
import { IconButton } from "@/components/icon-button";
import { QuickAddCard } from "@/components/quick-add-card";
import { ReminderCard } from "@/components/reminder-card";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useHydrationStore } from "@/store/hydration-store";
import { formatNumber } from "@/utils/format";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good Morning!";
  if (hour < 18) return "Good Afternoon!";
  return "Good Evening!";
}

/** Default quick-add amount in millilitres. */
const DEFAULT_QUICK_ADD_ML = 250;

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const totalMl = useHydrationStore((s) => s.totalMl);
  const goalMl = useHydrationStore((s) => s.goalMl);
  const addWater = useHydrationStore((s) => s.addWater);

  const percentage = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;
  const greeting = greetingForHour(new Date().getHours());

  const handleQuickAdd = useCallback(() => {
    void addWater(DEFAULT_QUICK_ADD_ML, DEFAULT_QUICK_ADD_ML);
  }, [addWater]);

  const handleOpenAddWater = useCallback(() => {
    router.push("/add-water");
  }, []);

  const handleNoop = useCallback(() => {
    // Placeholder — these affordances are wired in later steps.
  }, []);

  return (
    <ScrollScreen testID="home-screen">
      {/* ── Top bar ─────────────────────────────────────── */}
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

        {/* ── Greeting ──────────────────────────────────── */}
        <View style={styles.greetingBlock}>
          <Text variant="h2" color="onBackground">
            {greeting} 💧
          </Text>
          <Text variant="subhead" color="mutedText">
            Stay hydrated, stay healthy.
          </Text>
        </View>
      </View>

      {/* ── Progress ring ───────────────────────────────── */}
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
              {formatNumber(totalMl)} ml
            </Text>
            <Text variant="caption" color="mutedText">
              of {formatNumber(goalMl)} ml goal
            </Text>
            <Text variant="h3" color="primary" style={styles.ringPercent}>
              {Math.round(percentage * 100)}%
            </Text>
          </View>
        </HydrationRing>
      </View>

      {/* ── Next reminder ───────────────────────────────── */}
      <ReminderCard
        label="Next reminder"
        timeLeft="in 45 min"
        time="10:30 AM"
        testID="home-reminder-card"
      />

      {/* ── Quick add ───────────────────────────────────── */}
      <QuickAddCard
        onPress={handleQuickAdd}
        title="Add water"
        description="Logging water is as easy as 1 tap!"
        testID="home-quick-add"
      />

      {/* ── Open the add-water modal ────────────────────── */}
      <QuickAddCard
        onPress={handleOpenAddWater}
        title="Choose a cup size"
        description="Pick from 100, 250, or 500 ml."
        testID="home-open-add-water"
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
