// components/history-log-row.tsx
//
// One logged entry: cup icon, amount, time.
//
// The cup is a plain View rather than a Skia canvas. A Skia canvas
// per list row is a real scroll-jank risk -- each one runs its own
// render thread work. A rounded rect with a filled bottom strip
// reads the same at this size and costs nothing.
import Text from "@/components/text";
import { selectUnits, useSettingsStore } from "@/store/settings-store";
import { formatTime, formatVolume } from "@/utils/format";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const CUP_FILL_REFERENCE_ML = 500;

export interface HistoryLogRowProps {
  amountMl: number;
  loggedAt: number;
  testID?: string;
}

export function HistoryLogRow({
  amountMl,
  loggedAt,
  testID,
}: HistoryLogRowProps) {
  const units = useSettingsStore(selectUnits);
  const time = formatTime(new Date(loggedAt));
  const fillRatio = Math.min(1, amountMl / CUP_FILL_REFERENCE_ML);
  const display = formatVolume(amountMl, units);
  const fillHeight = `${Math.round(fillRatio * 100)}%`;

  return (
    <View
      testID={testID}
      style={styles.row}
      accessible
      accessibilityLabel={`${display} logged at ${time}`}
    >
      <View style={styles.cup}>
        <View style={[styles.cupFill, { height: fillHeight }]} />
      </View>

      <Text variant="subheadBold" color="onSurface">
        {display}
      </Text>

      <View style={styles.spacer} />

      <Text variant="subhead" color="mutedText">
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: theme.layout.minTouchTarget,
    paddingVertical: theme.spacing.sm,
  },
  cup: {
    width: 16,
    height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  cupFill: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    opacity: 0.35,
  },
  spacer: {
    flex: 1,
  },
}));
