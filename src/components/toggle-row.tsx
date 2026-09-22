// ─────────────────────────────────────────────────────────────
// components/toggle-row.tsx
//
// Label + optional subtitle on the left, a themed Switch on the
// right. Used by Smart Reminders and every per-time reminder row.
//
// The Switch is wrapped with `withUnistyles` using `uniProps` so
// its `trackColor` and `thumbColor` follow the theme — Switch takes
// colors as props, not through `style`, which is exactly the case
// `withUnistyles` exists for[reference:3].
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import React from "react";
import { Switch, View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Themed switch
// ─────────────────────────────────────────────────────────────

interface ThemedSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trackOn: string;
  trackOff: string;
  thumb: string;
  disabledTrack: string;
  disabledThumb: string;
  accessibilityLabel?: string;
  testID?: string;
}

const ThemedSwitch = withUnistyles(
  ({
    value,
    onValueChange,
    disabled,
    trackOn,
    trackOff,
    thumb,
    disabledTrack,
    disabledThumb,
    accessibilityLabel,
    testID,
  }: ThemedSwitchProps) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      trackColor={{
        false: disabled ? disabledTrack : trackOff,
        true: disabled ? disabledTrack : trackOn,
      }}
      thumbColor={disabled ? disabledThumb : thumb}
      ios_backgroundColor={disabled ? disabledTrack : trackOff}
    />
  ),
  (theme) => ({
    trackOn: theme.colors.primary,
    trackOff: theme.colors.panelBorder,
    thumb: theme.colors.surface,
    disabledTrack: theme.colors.panel,
    disabledThumb: theme.colors.mutedText,
  }),
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface ToggleRowProps {
  /** Primary label. */
  label: string;
  /** Optional supporting copy under the label. */
  subtitle?: string;
  /** Current switch value. */
  value: boolean;
  /** Fires with the new value when the switch is toggled. */
  onValueChange: (value: boolean) => void;
  /** Dims and disables the switch without hiding it. */
  disabled?: boolean;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
  /** Test identifier forwarded to the Switch itself. */
  switchTestID?: string;
}

export function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  style,
  testID,
  switchTestID,
}: ToggleRowProps) {
  return (
    <View testID={testID} style={[styles.row, style]}>
      <View style={styles.textBlock}>
        <Text
          variant="subheadBold"
          color={disabled ? "mutedText" : "onSurface"}
        >
          {label}
        </Text>
        {subtitle && (
          <Text variant="caption" color="mutedText">
            {subtitle}
          </Text>
        )}
      </View>

      <ThemedSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        testID={switchTestID}
      />
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
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
