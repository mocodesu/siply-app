// ─────────────────────────────────────────────────────────────
// app/(tabs)/history.tsx — History
//
// The calendar icon now opens the calendar picker modal. The
// selected date comes back via the UI store, consumed on focus.
// ─────────────────────────────────────────────────────────────
import { DailyTotalCard } from "@/components/daily-total-card";
import { DateNavigator } from "@/components/date-navigator";
import { HistoryLogRow } from "@/components/history-log-row";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { dayKeyFromDate } from "@/constants/notifications";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { DEFAULT_GOAL_ML } from "@/repositories/water-repo";
import { useUIStore } from "@/store/ui-store";
import { addDays, isAfterDay, startOfDay } from "@/utils/date";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );

  const today = useMemo(() => startOfDay(new Date()), []);

  const { logs, summary } = useDailyLogs(selectedDate);

  const totalMl = summary?.totalMl ?? 0;
  const goalMl = summary?.goalMl ?? DEFAULT_GOAL_ML;

  // ── Consume pending date from the calendar picker ───────
  const pendingHistoryDate = useUIStore((s) => s.pendingHistoryDate);
  const setPendingHistoryDate = useUIStore((s) => s.setPendingHistoryDate);

  useFocusEffect(
    useCallback(() => {
      if (pendingHistoryDate) {
        setSelectedDate(startOfDay(pendingHistoryDate));
        setPendingHistoryDate(null);
      }
    }, [pendingHistoryDate, setPendingHistoryDate]),
  );

  // ── Navigation ──────────────────────────────────────────
  const handlePrev = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, -1));
  }, []);

  const handleNext = useCallback(() => {
    setSelectedDate((prev) => {
      const next = addDays(prev, 1);
      return isAfterDay(next, today) ? prev : next;
    });
  }, [today]);

  const canGoNext = !isAfterDay(addDays(selectedDate, 1), today);

  // ── Calendar ────────────────────────────────────────────
  const handleOpenCalendar = useCallback(() => {
    router.push({
      pathname: "/calendar",
      params: { initialDate: dayKeyFromDate(selectedDate) },
    });
  }, [selectedDate]);

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
      <DateNavigator
        date={selectedDate}
        onPrev={handlePrev}
        onNext={handleNext}
        canGoNext={canGoNext}
        testID="history-date-nav"
      />

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
