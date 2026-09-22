// app/(tabs)/history.tsx
//
// Composed of four independent modules. Each subscribes to exactly
// the state it renders:
//
//   HistoryHeader      -- no subscriptions, mounts once
//   HistoryDateSection -- subscribes to selectedHistoryDayMs
//   HistoryLogSection  -- subscribes to selectedHistoryDayMs and
//                         its logs; re-renders only when the log
//                         list content changes
//   HistoryTotalSection -- subscribes to selectedHistoryDayMs and
//                          its summary; re-renders only when the
//                          summary content changes
//
// React Compiler is enabled in app.config.ts, so manual useMemo,
// useCallback, and React.memo are omitted unless an integration
// contract requires a stable reference.
import { DailyTotalCard } from "@/components/daily-total-card";
import { DateNavigator } from "@/components/date-navigator";
import { FadeInView } from "@/components/fade-in";
import { HistoryLogRow } from "@/components/history-log-row";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { dayKeyFromDate } from "@/constants/notifications";
import { useDailyLogs, useDailySummary } from "@/hooks/use-daily-logs";
import { DEFAULT_GOAL_ML } from "@/repositories/water-repo";
import { selectSelectedHistoryDayMs, useUIStore } from "@/store/ui-store";
import { addDays, isAfterDay, startOfDay } from "@/utils/date";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// -------------------------------------------------------------
// Screen
// -------------------------------------------------------------

export default function HistoryScreen() {
  return (
    <ScrollScreen header={<HistoryHeader />} testID="history-screen">
      <HistoryDateSection />
      <HistoryLogSection />
      <HistoryTotalSection />
    </ScrollScreen>
  );
}

// -------------------------------------------------------------
// Header
//
// No subscriptions. Renders once.
// -------------------------------------------------------------

function HistoryHeader() {
  const handleOpenCalendar = () => {
    const dayMs = useUIStore.getState().selectedHistoryDayMs;
    const key = dayKeyFromDate(new Date(dayMs));
    router.push({ pathname: "/calendar", params: { initialDate: key } });
  };

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerSpacer} />
      <Text
        variant="title"
        color="onBackground"
        textAlign="center"
        style={styles.headerTitle}
      >
        History
      </Text>
      <IconButton
        name="calendar-outline"
        onPress={handleOpenCalendar}
        accessibilityLabel="Open calendar"
        testID="history-calendar"
      />
    </View>
  );
}

// -------------------------------------------------------------
// Date section
//
// Subscribes to selectedHistoryDayMs only.
// -------------------------------------------------------------

function HistoryDateSection() {
  const selectedDayMs = useUIStore(selectSelectedHistoryDayMs);
  const setSelectedDayMs = useUIStore((s) => s.setSelectedHistoryDayMs);

  const selectedDate = new Date(selectedDayMs);
  const today = startOfDay(new Date());

  const handlePrev = () => {
    const prev = addDays(selectedDate, -1);
    setSelectedDayMs(prev.getTime());
  };

  const handleNext = () => {
    const next = addDays(selectedDate, 1);
    if (isAfterDay(next, today)) return;
    setSelectedDayMs(next.getTime());
  };

  const canGoNext = !isAfterDay(addDays(selectedDate, 1), today);

  return (
    <DateNavigator
      date={selectedDate}
      onPrev={handlePrev}
      onNext={handleNext}
      canGoNext={canGoNext}
      testID="history-date-nav"
    />
  );
}

// -------------------------------------------------------------
// Log section
//
// Subscribes to selectedHistoryDayMs. Its logs come from a hook
// that bails out of state updates when content is unchanged, so
// focus refetches with identical data are free.
// -------------------------------------------------------------

function HistoryLogSection() {
  const selectedDayMs = useUIStore(selectSelectedHistoryDayMs);
  const logs = useDailyLogs(selectedDayMs);

  if (logs.length === 0) {
    return (
      <FadeInView>
        <View style={styles.emptyState} testID="history-empty-state">
          <Text variant="subhead" color="mutedText" textAlign="center">
            No water logged for this day.
          </Text>
        </View>
      </FadeInView>
    );
  }

  return (
    <FadeInView key={selectedDayMs}>
      <View style={styles.listCard} testID="history-log-list">
        {logs.map((log) => (
          <HistoryLogRow
            key={log.id}
            amountMl={log.amountMl}
            loggedAt={log.loggedAt}
            testID={`history-log-${log.id}`}
          />
        ))}
      </View>
    </FadeInView>
  );
}

// -------------------------------------------------------------
// Total section
//
// Subscribes to selectedHistoryDayMs. The summary hook bails out
// when content is unchanged, so the ring does not restart its
// animation on a no-op refetch.
// -------------------------------------------------------------

function HistoryTotalSection() {
  const selectedDayMs = useUIStore(selectSelectedHistoryDayMs);
  const summary = useDailySummary(selectedDayMs);

  const totalMl = summary?.totalMl ?? 0;
  const goalMl = summary?.goalMl ?? DEFAULT_GOAL_ML;

  return (
    <FadeInView delay={80}>
      <DailyTotalCard
        totalMl={totalMl}
        goalMl={goalMl}
        testID="history-daily-total"
      />
    </FadeInView>
  );
}

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.layout.minTouchTarget,
  },
  headerSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
  headerTitle: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: theme.spacing.giant,
    alignItems: "center",
    justifyContent: "center",
  },
  listCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
  },
}));
