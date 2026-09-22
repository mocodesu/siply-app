// app/(main)/calendar.tsx
//
// Date picker modal. Writes directly to the UI store, so History
// picks up the change without any param passing or focus hook.
import { CalendarGrid } from "@/components/calendar-grid";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { startOfDayMs, useUIStore } from "@/store/ui-store";
import { parseDayKey, startOfDay } from "@/utils/date";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function resolveInitialDate(raw: string | undefined): Date {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return startOfDay(new Date());
  return parseDayKey(raw);
}

export default function CalendarScreen() {
  const params = useLocalSearchParams<{ initialDate?: string }>();
  const initialDate = resolveInitialDate(params.initialDate);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  const setSelectedHistoryDayMs = useUIStore((s) => s.setSelectedHistoryDayMs);

  const today = startOfDay(new Date());

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
      if (next.getTime() > today.getTime()) return prev;
      return next;
    });
  }, [today]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setSelectedHistoryDayMs(startOfDayMs(date));
      if (router.canGoBack()) router.back();
    },
    [setSelectedHistoryDayMs],
  );

  const canGoNextMonth = (() => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );
    return nextMonth.getTime() <= today.getTime();
  })();

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
