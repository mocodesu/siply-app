// ─────────────────────────────────────────────────────────────
// components/time-picker.tsx
//
// Simple time picker: hour chips (1–12), minute chips (00/15/30/45),
// and an AM/PM segmented control.
//
// Chips rather than a native time picker or a wheel — the app has
// four minute presets, not sixty, and a bounded set of options
// keeps the interaction short.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MINUTES = [0, 15, 30, 45] as const;

export type Meridiem = "AM" | "PM";

export interface TimePickerProps {
  /** Currently selected hour, 1–12. */
  hour12: number;
  /** Currently selected minute, one of 0/15/30/45. */
  minute: number;
  /** Currently selected meridiem. */
  meridiem: Meridiem;
  /** Fires when any component changes. */
  onChange: (next: {
    hour12: number;
    minute: number;
    meridiem: Meridiem;
  }) => void;
  /** Test identifier prefix forwarded to chips. */
  testIDPrefix?: string;
}

export function TimePicker({
  hour12,
  minute,
  meridiem,
  onChange,
  testIDPrefix,
}: TimePickerProps) {
  const emit = (
    patch: Partial<{ hour12: number; minute: number; meridiem: Meridiem }>,
  ) => {
    onChange({ hour12, minute, meridiem, ...patch });
  };

  return (
    <View style={styles.root}>
      {/* ── Hour ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="caption" color="mutedText">
          Hour
        </Text>
        <View style={styles.chipRow}>
          {HOURS.map((h) => {
            const selected = h === hour12;
            return (
              <HapticPressable
                key={h}
                testID={testIDPrefix ? `${testIDPrefix}-hour-${h}` : undefined}
                onPress={() => emit({ hour12: h })}
                accessibilityLabel={`${h} o'clock`}
                accessibilityState={{ selected }}
                haptic="selection"
              >
                <View style={[styles.chip, selected && styles.chipSelected]}>
                  <Text
                    variant="subhead"
                    color={selected ? "onPrimary" : "onSurface"}
                    textAlign="center"
                  >
                    {h}
                  </Text>
                </View>
              </HapticPressable>
            );
          })}
        </View>
      </View>

      {/* ── Minute ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="caption" color="mutedText">
          Minute
        </Text>
        <View style={styles.chipRow}>
          {MINUTES.map((m) => {
            const selected = m === minute;
            const label = String(m).padStart(2, "0");
            return (
              <HapticPressable
                key={m}
                testID={
                  testIDPrefix ? `${testIDPrefix}-minute-${m}` : undefined
                }
                onPress={() => emit({ minute: m })}
                accessibilityLabel={`${label} minutes`}
                accessibilityState={{ selected }}
                haptic="selection"
              >
                <View style={[styles.chip, selected && styles.chipSelected]}>
                  <Text
                    variant="subhead"
                    color={selected ? "onPrimary" : "onSurface"}
                    textAlign="center"
                  >
                    {label}
                  </Text>
                </View>
              </HapticPressable>
            );
          })}
        </View>
      </View>

      {/* ── AM/PM ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="caption" color="mutedText">
          Period
        </Text>
        <View style={styles.chipRow}>
          {(["AM", "PM"] as const).map((p) => {
            const selected = p === meridiem;
            return (
              <HapticPressable
                key={p}
                testID={
                  testIDPrefix ? `${testIDPrefix}-period-${p}` : undefined
                }
                onPress={() => emit({ meridiem: p })}
                accessibilityLabel={p}
                accessibilityState={{ selected }}
                haptic="selection"
              >
                <View
                  style={[
                    styles.chip,
                    styles.chipWide,
                    selected && styles.chipSelected,
                  ]}
                >
                  <Text
                    variant="subhead"
                    color={selected ? "onPrimary" : "onSurface"}
                    textAlign="center"
                  >
                    {p}
                  </Text>
                </View>
              </HapticPressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  chip: {
    minWidth: 44,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipWide: {
    minWidth: 72,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
}));
