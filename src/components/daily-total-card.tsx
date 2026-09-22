// ─────────────────────────────────────────────────────────────
// components/daily-total-card.tsx
//
// Daily summary tile for the History screen: total on the left,
// a compact progress ring on the right, goal underneath.
//
// The ring is the same `HydrationRing` used on Home, just smaller.
// Reusing it guarantees the two screens never drift visually.
// ─────────────────────────────────────────────────────────────
import { HydrationRing } from "@/components/hydration-ring";
import Text from "@/components/text";
import { formatNumber } from "@/utils/format";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/** Diameter of the compact ring, in pixels. */
const RING_SIZE = 76;
const RING_STROKE = 7;

export interface DailyTotalCardProps {
  /** Total logged for the day, in millilitres. */
  totalMl: number;
  /** Goal for the day, in millilitres. */
  goalMl: number;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function DailyTotalCard({
  totalMl,
  goalMl,
  style,
  testID,
}: DailyTotalCardProps) {
  const percentage = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;

  return (
    <View testID={testID} style={[styles.card, style]}>
      <View style={styles.textBlock}>
        <Text variant="caption" color="mutedText">
          Daily Total
        </Text>
        <Text variant="h2" color="onSurface">
          {formatNumber(totalMl)} ml
        </Text>
        <View style={styles.goalRow}>
          <Text variant="caption" color="mutedText">
            Goal
          </Text>
          <Text variant="subheadBold" color="onSurface">
            {formatNumber(goalMl)} ml
          </Text>
        </View>
      </View>

      <HydrationRing
        current={totalMl}
        goal={goalMl}
        size={RING_SIZE}
        strokeWidth={RING_STROKE}
        testID={testID ? `${testID}-ring` : undefined}
        accessibilityLabel={`${Math.round(
          percentage * 100,
        )}% of daily goal reached`}
      >
        <Text variant="micro" color="primary">
          {Math.round(percentage * 100)}%
        </Text>
      </HydrationRing>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxs,
  },
}));
