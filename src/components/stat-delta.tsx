// ─────────────────────────────────────────────────────────────
// components/stat-delta.tsx
//
// "▲ 12% vs last week" indicator. Positive deltas render in the
// active (green) role, negative in danger (red).
//
// The triangle is a text glyph rather than an icon so the whole
// indicator stays a single text node — easier to align, easier to
// announce, and no icon-theming wrapper needed.
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface StatDeltaProps {
  /** Percentage change. Can be negative or zero. */
  percent: number;
  /** Comparison label, e.g. `"vs last week"`. */
  label: string;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function StatDelta({ percent, label, style, testID }: StatDeltaProps) {
  const isPositive = percent > 0;
  const isFlat = percent === 0;

  const color = isFlat ? "mutedText" : isPositive ? "active" : "danger";
  const glyph = isFlat ? "–" : isPositive ? "▲" : "▼";

  return (
    <View
      testID={testID}
      style={[styles.row, style]}
      accessible
      accessibilityLabel={`${Math.abs(percent)} percent ${isPositive ? "increase" : isFlat ? "no change" : "decrease"} ${label}`}
    >
      <Text variant="caption" color={color}>
        {glyph} {Math.abs(percent)}%
      </Text>
      <Text variant="caption" color="mutedText">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
}));
