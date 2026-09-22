// ─────────────────────────────────────────────────────────────
// components/history-log-row.tsx
//
// One logged entry: cup icon, amount, and time. Used on the
// History screen.
//
// The cup's fill ratio is relative to a 500 ml reference so a
// 100 ml log looks lighter than a 500 ml log at a glance. Purely
// decorative — the accessible label carries the real numbers.
// ─────────────────────────────────────────────────────────────
import { CupIcon } from "@/components/cup-icon";
import Text from "@/components/text";
import { formatNumber, formatTime } from "@/utils/format";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/** Reference size for the cup's visual fill. */
const CUP_FILL_REFERENCE_ML = 500;

export interface HistoryLogRowProps {
  /** Amount logged, in millilitres. */
  amountMl: number;
  /** Epoch millis when the entry was logged. */
  loggedAt: number;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function HistoryLogRow({
  amountMl,
  loggedAt,
  testID,
}: HistoryLogRowProps) {
  const time = formatTime(new Date(loggedAt));
  const fillRatio = Math.min(1, amountMl / CUP_FILL_REFERENCE_ML);

  return (
    <View
      testID={testID}
      style={styles.row}
      accessible
      accessibilityLabel={`${amountMl} millilitres logged at ${time}`}
    >
      <CupIcon size={20} fillRatio={fillRatio} />

      <Text variant="subheadBold" color="onSurface">
        {formatNumber(amountMl)} ml
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
  spacer: {
    flex: 1,
  },
}));
