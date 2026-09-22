// ─────────────────────────────────────────────────────────────
// components/history-log-row.tsx
//
// Unit-aware — the amount renders in the user's chosen unit.
// ─────────────────────────────────────────────────────────────
import { CupIcon } from "@/components/cup-icon";
import Text from "@/components/text";
import { useSettingsStore } from "@/store/settings-store";
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
  const units = useSettingsStore((s) => s.units);
  const time = formatTime(new Date(loggedAt));
  const fillRatio = Math.min(1, amountMl / CUP_FILL_REFERENCE_ML);
  const display = formatVolume(amountMl, units);

  return (
    <View
      testID={testID}
      style={styles.row}
      accessible
      accessibilityLabel={`${display} logged at ${time}`}
    >
      <CupIcon size={20} fillRatio={fillRatio} />

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
  spacer: { flex: 1 },
}));
