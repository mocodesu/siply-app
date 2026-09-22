// ─────────────────────────────────────────────────────────────
// components/calendar-grid.tsx
//
// Month grid with weekday headers, prev/next month nav, and
// disabled future days.
//
// Selected day is a filled accent circle; today (if not selected)
// shows an outlined circle. The distinction survives greyscale.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { SurfaceIcon } from "@/components/themed";
import { addDays, getStartOfWeek, isSameDay, startOfDay } from "@/utils/date";
import React, { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface CalendarGridProps {
  /** The month to render. Any date in the month is acceptable. */
  month: Date;
  /** The currently selected date. */
  selectedDate: Date;
  /** Fires when a day is tapped. */
  onSelectDate: (date: Date) => void;
  /** Fires when the user navigates to the previous month. */
  onPrevMonth: () => void;
  /** Fires when the user navigates to the next month. */
  onNextMonth: () => void;
  /** When false, the next-month chevron is disabled. */
  canGoNextMonth: boolean;
  /** Test identifier prefix forwarded to day cells. */
  testIDPrefix?: string;
}

export function CalendarGrid({
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  canGoNextMonth,
  testIDPrefix,
}: CalendarGridProps) {
  const today = useMemo(() => startOfDay(new Date()), []);

  // ── Days to render: 6 weeks starting Monday, always 42 cells ──
  const weeks = useMemo(() => {
    const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const gridStart = getStartOfWeek(firstOfMonth);
    const cells: Date[][] = [];
    for (let w = 0; w < 6; w += 1) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d += 1) {
        week.push(addDays(gridStart, w * 7 + d));
      }
      cells.push(week);
    }
    return cells;
  }, [month]);

  const monthLabel = `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`;

  return (
    <View style={styles.root}>
      {/* ── Month header ─────────────────────────────── */}
      <View style={styles.header}>
        <HapticPressable
          onPress={onPrevMonth}
          accessibilityLabel="Previous month"
          hitSlop={8}
          style={styles.headerButton}
        >
          <SurfaceIcon name="chevron-back" size={20} />
        </HapticPressable>

        <Text variant="subheadBold" color="onSurface">
          {monthLabel}
        </Text>

        <HapticPressable
          onPress={onNextMonth}
          disabled={!canGoNextMonth}
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canGoNextMonth }}
          hitSlop={8}
          style={[
            styles.headerButton,
            !canGoNextMonth && styles.headerButtonDisabled,
          ]}
        >
          <SurfaceIcon name="chevron-forward" size={20} />
        </HapticPressable>
      </View>

      {/* ── Weekday headers ──────────────────────────── */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_HEADERS.map((label) => (
          <View key={label} style={styles.cell}>
            <Text variant="caption" color="mutedText" textAlign="center">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Weeks ────────────────────────────────────── */}
      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={styles.weekRow}>
          {week.map((day) => {
            const inMonth = day.getMonth() === month.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const isFuture = day.getTime() > today.getTime();

            const dayLabel = `${MONTH_NAMES[day.getMonth()]} ${day.getDate()}`;

            return (
              <View key={day.toISOString()} style={styles.cell}>
                <HapticPressable
                  testID={
                    testIDPrefix
                      ? `${testIDPrefix}-${day.toISOString().slice(0, 10)}`
                      : undefined
                  }
                  onPress={() => !isFuture && onSelectDate(day)}
                  disabled={isFuture}
                  accessibilityLabel={dayLabel}
                  accessibilityState={{
                    selected: isSelected,
                    disabled: isFuture,
                  }}
                  haptic="selection"
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && !isSelected && styles.dayCircleToday,
                      isSelected && styles.dayCircleSelected,
                    ]}
                  >
                    <Text
                      variant="subhead"
                      color={
                        isSelected
                          ? "onPrimary"
                          : isFuture || !inMonth
                            ? "mutedText"
                            : "onSurface"
                      }
                      textAlign="center"
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                </HapticPressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.layout.minTouchTarget,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonDisabled: {
    opacity: theme.opacity.disabled,
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekRow: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleToday: {
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.primary,
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.primary,
  },
}));
