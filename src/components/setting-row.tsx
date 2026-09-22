// ─────────────────────────────────────────────────────────────
// components/setting-row.tsx
//
// A single settings row. Three shapes, all sharing the same
// left-label / right-value layout:
//
//   nav      → right chevron, whole row is pressable
//   value    → right value text, whole row is pressable
//   toggle   → right Switch, label is not pressable
//
// The row is pressable when `onPress` is provided and is a plain
// View otherwise, so the accessibility tree matches what's
// actually interactive.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { MutedIcon } from "@/components/themed";
import { ToggleRow } from "@/components/toggle-row";
import type { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface SettingRowProps {
  /** Row label. */
  label: string;
  /**
   * Right-hand content:
   *   - omit both `value` and `switchValue` to render a chevron
   *   - set `value` to render text before the chevron
   *   - set `switchValue` + `onSwitchChange` to render a Switch
   */
  value?: string;
  /** Press handler. Omit to render a non-interactive row. */
  onPress?: () => void;
  /** Renders a Switch instead of a chevron. */
  switchValue?: boolean;
  /** Required when `switchValue` is set. */
  onSwitchChange?: (value: boolean) => void;
  /** Optional leading icon. */
  icon?: IconName;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer row. */
  testID?: string;
  /** Test identifier forwarded to the Switch when one is rendered. */
  switchTestID?: string;
}

export function SettingRow({
  label,
  value,
  onPress,
  switchValue,
  onSwitchChange,
  icon,
  style,
  testID,
  switchTestID,
}: SettingRowProps) {
  // ── Toggle row ───────────────────────────────────────────
  if (switchValue !== undefined && onSwitchChange) {
    return (
      <View style={style} testID={testID}>
        <ToggleRow
          label={label}
          value={switchValue}
          onValueChange={onSwitchChange}
          style={styles.togglePadding}
          testID={testID ? `${testID}-toggle` : undefined}
          switchTestID={switchTestID}
        />
      </View>
    );
  }

  // ── Nav / value row ──────────────────────────────────────
  const content = (
    <View style={[styles.row, style]}>
      {icon && <MutedIcon name={icon} size={20} />}
      <Text variant="subhead" color="onSurface" style={styles.label}>
        {label}
      </Text>
      {value !== undefined && (
        <Text variant="subhead" color="mutedText">
          {value}
        </Text>
      )}
      {onPress && <MutedIcon name="chevron-forward" size={18} />}
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }

  const accessibilityValue = value !== undefined ? `${label}, ${value}` : label;

  return (
    <HapticPressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={accessibilityValue}
      style={styles.pressable}
    >
      {content}
    </HapticPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    // The whole row is the touch target.
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: theme.layout.minTouchTarget,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  label: {
    flex: 1,
  },
  togglePadding: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
}));
