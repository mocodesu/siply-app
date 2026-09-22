// ─────────────────────────────────────────────────────────────
// app/(main)/calendar.tsx
//
// Date picker modal. Writes the chosen date into the UI store so
// History can pick it up when it refocuses.
//
// The month state is local — the modal always opens on the month
// containing the currently selected date, passed via `initialDate`
// query param. Navigation within the modal doesn't touch the store
// until the user taps a day.
// ─────────────────────────────────────────────────────────────
import { CalendarGrid } from "@/components/calendar-grid";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useUIStore } from "@/store/ui-store";
import { parseDayKey, startOfDay } from "@/utils/date";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * Parses a `"YYYY-MM-DD"` day key sent via query param. Falls back
 * to today when the param is missing or malformed.
 */
function resolveInitialDate(raw: string | undefined): Date {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return startOfDay(new Date());
  return parseDayKey(raw);
}

export default function CalendarScreen() {
  const params = useLocalSearchParams<{ initialDate?: string }>();

  const initialDate = useMemo(
    () => resolveInitialDate(params.initialDate),
    [params.initialDate],
  );

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  const setPendingHistoryDate = useUIStore((s) => s.setPendingHistoryDate);

  const today = useMemo(() => startOfDay(new Date()), []);

  // ── Navigation ──────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handlePrevMonth = useCallback(() => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }, []);

  const handleNextMonth = useCallback(() => {
    setVisibleMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      // Block navigation past the month containing today.
      if (next.getTime() > today.getTime()) return prev;
      return next;
    });
  }, [today]);

  const canGoNextMonth = useMemo(() => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );
    return nextMonth.getTime() <= today.getTime();
  }, [visibleMonth, today]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setPendingHistoryDate(date);
      if (router.canGoBack()) router.back();
    },
    [setPendingHistoryDate],
  );

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="close"
        onPress={handleBack}
        accessibilityLabel="Close calendar"
        testID="calendar-close"
      />
      <Text
        variant="title"
        color="onBackground"
        textAlign="center"
        style={styles.headerTitle}
      >
        Pick a date
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="calendar-screen">
      <CalendarGrid
        month={visibleMonth}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        canGoNextMonth={canGoNextMonth}
        testIDPrefix="calendar-day"
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
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
}));
