// ─────────────────────────────────────────────────────────────
// components/reminder-row.tsx
//
// One scheduled reminder: time + cadence on the left, a bell icon
// and a Switch on the right. The bell is decorative — the switch
// owns the interaction — so it's hidden from screen readers.
// ─────────────────────────────────────────────────────────────
import { MutedIcon } from "@/components/themed";
import { ToggleRow } from "@/components/toggle-row";
import type { Reminder } from "@/repositories/reminder-repo";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface ReminderRowProps {
  /** The reminder this row represents. */
  reminder: Reminder;
  /** Fires when the switch is toggled. */
  onToggle: (id: string) => void;
  /** When true, the switch is dimmed and inert. */
  disabled?: boolean;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function ReminderRow({
  reminder,
  onToggle,
  disabled = false,
  testID,
}: ReminderRowProps) {
  return (
    <View testID={testID} style={styles.wrapper}>
      <View
        style={styles.bell}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <MutedIcon name="notifications-outline" size={18} />
      </View>

      <ToggleRow
        label={reminder.label}
        subtitle="Every Day"
        value={reminder.enabled}
        onValueChange={() => onToggle(reminder.id)}
        disabled={disabled}
        style={styles.toggle}
        testID={testID ? `${testID}-toggle` : undefined}
        switchTestID={testID ? `${testID}-switch` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  bell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.panel,
  },
  toggle: {
    flex: 1,
  },
}));
