// ─────────────────────────────────────────────────────────────
// components/preset-chip.tsx
//
// Selectable preset tile: a large amount, a small label underneath,
// and a border/background that reflects the selection.
//
// Selection uses border color + background + text color together so
// the state is never communicated by color alone.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface PresetChipProps {
  /** Amount shown in the chip, e.g. "2,000 ml". */
  value: string;
  /** Label shown below, e.g. "Recommended". */
  label: string;
  /** Whether this chip is the current selection. */
  selected: boolean;
  /** Press handler. */
  onPress: () => void;
  /** Test identifier forwarded to the pressable. */
  testID?: string;
}

export function PresetChip({
  value,
  label,
  selected,
  onPress,
  testID,
}: PresetChipProps) {
  return (
    <HapticPressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={`${value}, ${label}`}
      accessibilityState={{ selected }}
      style={styles.pressable}
    >
      <View style={[styles.chip, selected && styles.chipSelected]}>
        <Text
          variant="subheadBold"
          color={selected ? "primary" : "onSurface"}
          textAlign="center"
        >
          {value}
        </Text>
        <Text
          variant="caption"
          color={selected ? "primary" : "mutedText"}
          textAlign="center"
        >
          {label}
        </Text>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    flex: 1,
  },
  chip: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidth.thick,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.panel,
  },
}));
