// ─────────────────────────────────────────────────────────────
// app/(tabs)/history.tsx — History
//
// Layout mirrors reference screen 6: header, date navigator, the
// day's log list, and the daily-total card.
//
// No back button — this is a tab, and the tab bar owns navigation.
// The calendar icon is wired to a placeholder until a date picker
// is built.
// ─────────────────────────────────────────────────────────────
import { DailyTotalCard } from "@/components/daily-total-card";
import { DateNavigator } from "@/components/date-navigator";
import { HistoryLogRow } from "@/components/history-log-row";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { DEFAULT_GOAL_ML } from "@/repositories/water-repo";
import { addDays, isAfterDay, startOfDay } from "@/utils/date";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function HistoryScreen() {
  // ── Selected day ────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );

  const today = useMemo(() => startOfDay(new Date()), []);

  const { logs, summary } = useDailyLogs(selectedDate);

  const totalMl = summary?.totalMl ?? 0;
  const goalMl = summary?.goalMl ?? DEFAULT_GOAL_ML;

  // ── Navigation ──────────────────────────────────────────
  const handlePrev = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, -1));
  }, []);

  const handleNext = useCallback(() => {
    setSelectedDate((prev) => {
      const next = addDays(prev, 1);
      // Guard against overshooting today if the button were ever
      // triggered while disabled.
      return isAfterDay(next, today) ? prev : next;
    });
  }, [today]);

  const canGoNext = !isAfterDay(addDays(selectedDate, 1), today);

  // ── Calendar placeholder ────────────────────────────────
  const handleOpenCalendar = useCallback(() => {
    // Date picker flow lands in a later step.
  }, []);

  // ── Header ──────────────────────────────────────────────
  const header = (
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

  return (
    <ScrollScreen header={header} testID="history-screen">
      {/* ── Date navigator ──────────────────────────────── */}
      <DateNavigator
        date={selectedDate}
        onPrev={handlePrev}
        onNext={handleNext}
        canGoNext={canGoNext}
        testID="history-date-nav"
      />

      {/* ── Log list ────────────────────────────────────── */}
      {logs.length === 0 ? (
        <View style={styles.emptyState} testID="history-empty-state">
          <Text variant="subhead" color="mutedText" textAlign="center">
            No water logged for this day.
          </Text>
        </View>
      ) : (
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
      )}

      {/* ── Daily total ─────────────────────────────────── */}
      <DailyTotalCard
        totalMl={totalMl}
        goalMl={goalMl}
        testID="history-daily-total"
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
