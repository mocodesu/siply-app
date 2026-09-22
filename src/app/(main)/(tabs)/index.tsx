// app/(tabs)/index.tsx
//
// Composed of five independent modules. Each one subscribes to
// exactly the state it renders, so a store change re-renders only
// the module that owns the changed value:
//
//   HomeHeader   -- no subscriptions, mounts once
//   HomeBell     -- subscribes to a boolean, re-renders only when
//                   the dot flips
//   HomeRing     -- subscribes to totalMl, goalMl, percentageInt,
//                   units; re-renders on water log
//   HomeReminder -- subscribes to next reminder; re-renders on tick
//                   and on reminder changes
//   HomeQuickAdd -- no subscriptions, mounts once
//
// React Compiler is enabled in app.config.ts, so manual useMemo,
// useCallback, and React.memo are intentionally omitted. The
// compiler inserts equivalent memoization automatically.
import { AnimatedNumber } from "@/components/animated-number";
import { FadeInView } from "@/components/fade-in";
import { HydrationRing } from "@/components/hydration-ring";
import { IconButton } from "@/components/icon-button";
import { QuickAddCard } from "@/components/quick-add-card";
import { ReminderCard } from "@/components/reminder-card";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import {
  useIsReminderImminent,
  useNextReminder,
} from "@/hooks/use-next-reminder";
import {
  selectGoalMl,
  selectPercentageInt,
  selectTotalMl,
  useHydrationStore,
} from "@/store/hydration-store";
import { selectUnits, useSettingsStore } from "@/store/settings-store";
import { formatNumber, formatVolume } from "@/utils/format";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// -------------------------------------------------------------
// Module-scope callbacks
//
// Stable references passed to third-party components. React
// Compiler handles per-component memoization, but a callback
// passed to a native view's prop benefits from being a
// single module-scope instance.
// -------------------------------------------------------------

const goToReminders = () => router.push("/reminders");
const goToAddWater = () => router.push("/add-water");

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good Morning!";
  if (hour < 18) return "Good Afternoon!";
  return "Good Evening!";
}

// -------------------------------------------------------------
// Screen
// -------------------------------------------------------------

export default function HomeScreen() {
  return (
    <ScrollScreen testID="home-screen">
      <FadeInView delay={0}>
        <HomeHeader />
      </FadeInView>

      <FadeInView delay={60}>
        <HomeRing />
      </FadeInView>

      <HomeReminder />

      <FadeInView delay={180}>
        <HomeQuickAdd />
      </FadeInView>
    </ScrollScreen>
  );
}

// -------------------------------------------------------------
// Header
//
// No store subscriptions. Greeting captured at mount, so the
// module renders exactly once.
// -------------------------------------------------------------

function HomeHeader() {
  const [greeting] = useState(() => greetingForHour(new Date().getHours()));

  return (
    <View style={styles.headerBlock}>
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <HomeBell />
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
  );
}

// -------------------------------------------------------------
// Bell
//
// Boolean subscription. Re-renders only when the dot needs to
// appear or disappear.
// -------------------------------------------------------------

function HomeBell() {
  const showDot = useIsReminderImminent();

  return (
    <IconButton
      name="notifications-outline"
      onPress={goToReminders}
      accessibilityLabel="View reminders"
      showDot={showDot}
      testID="home-notifications-button"
    />
  );
}

// -------------------------------------------------------------
// Ring
//
// Subscribes to four primitives: totalMl, goalMl, percentageInt,
// units. Re-renders only when one of those changes -- which is
// when water is logged, or the goal is edited, or units are
// changed. Not on minute ticks.
// -------------------------------------------------------------

function HomeRing() {
  const totalMl = useHydrationStore(selectTotalMl);
  const goalMl = useHydrationStore(selectGoalMl);
  const percentageInt = useHydrationStore(selectPercentageInt);
  const units = useSettingsStore(selectUnits);

  const goalLabel = `of ${formatVolume(goalMl, units)} goal`;

  return (
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

          <AnimatedNumber
            value={totalMl}
            startFrom={0}
            variant="display"
            color="onBackground"
            format={formatTotalWithUnit}
          />

          <Text variant="caption" color="mutedText">
            {goalLabel}
          </Text>

          <AnimatedNumber
            value={percentageInt}
            startFrom={0}
            variant="h3"
            color="primary"
            style={styles.ringPercent}
            format={formatPercentage}
          />
        </View>
      </HydrationRing>
    </View>
  );
}

function formatTotalWithUnit(n: number): string {
  return formatNumber(n);
}

function formatPercentage(n: number): string {
  return `${n}%`;
}

// -------------------------------------------------------------
// Reminder
//
// Renders null when there is no upcoming reminder. This is the
// only module that re-renders on a minute tick.
// -------------------------------------------------------------

function HomeReminder() {
  const next = useNextReminder();

  if (!next) return null;

  return (
    <FadeInView delay={120}>
      <ReminderCard
        label="Next reminder"
        timeLeft={next.timeLeft}
        time={next.time}
        onPress={goToReminders}
        testID="home-reminder-card"
      />
    </FadeInView>
  );
}

// -------------------------------------------------------------
// Quick add
//
// No store subscriptions. Mounts once, never re-renders.
// -------------------------------------------------------------

function HomeQuickAdd() {
  return (
    <QuickAddCard
      onPress={goToAddWater}
      title="Add water"
      description="Logging water is as easy as 1 tap!"
      testID="home-quick-add"
    />
  );
}

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------

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
