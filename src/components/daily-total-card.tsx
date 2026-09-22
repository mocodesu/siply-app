// components/daily-total-card.tsx
//
// Daily summary tile for the History screen: total on the left,
// a compact progress ring on the right.
import { HydrationRing } from "@/components/hydration-ring";
import Text from "@/components/text";
import { selectUnits, useSettingsStore } from "@/store/settings-store";
import { formatVolume } from "@/utils/format";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const RING_SIZE = 76;
const RING_STROKE = 7;

export interface DailyTotalCardProps {
  totalMl: number;
  goalMl: number;
  testID?: string;
}

export function DailyTotalCard({
  totalMl,
  goalMl,
  testID,
}: DailyTotalCardProps) {
  const units = useSettingsStore(selectUnits);
  const percentage = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;
  const percentageInt = Math.round(percentage * 100);

  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.textBlock}>
        <Text variant="caption" color="mutedText">
          Daily Total
        </Text>
        <Text variant="h2" color="onSurface">
          {formatVolume(totalMl, units)}
        </Text>
        <View style={styles.goalRow}>
          <Text variant="caption" color="mutedText">
            Goal
          </Text>
          <Text variant="subheadBold" color="onSurface">
            {formatVolume(goalMl, units)}
          </Text>
        </View>
      </View>

      <HydrationRing
        current={totalMl}
        goal={goalMl}
        size={RING_SIZE}
        strokeWidth={RING_STROKE}
        testID={testID ? `${testID}-ring` : undefined}
        accessibilityLabel={`${percentageInt}% of daily goal reached`}
      >
        <Text variant="micro" color="primary">
          {percentageInt}%
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
