// ─────────────────────────────────────────────────────────────
// components/primary-button.tsx
//
// Filled accent button. Used for the terminal action on every
// modal screen (Add Water, Save Goal, Start Free Trial).
//
// The label and optional icon are siblings inside a row, so the
// content stays optically centered regardless of whether an icon
// is present.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { OnPrimaryIcon } from "@/components/themed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface PrimaryButtonProps {
  /** Button label. */
  label: string;
  /** Press handler. Not called while `disabled`. */
  onPress: () => void;
  /** Optional leading icon. */
  icon?: IconName;
  /** Renders the button in a non-interactive, dimmed state. */
  disabled?: boolean;
  /** Test identifier forwarded to the pressable. */
  testID?: string;
  /** Accessibility label override. Defaults to `label`. */
  accessibilityLabel?: string;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  testID,
  accessibilityLabel,
}: PrimaryButtonProps) {
  return (
    <HapticPressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      haptic="medium"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={styles.pressable}
    >
      <View style={[styles.button, disabled && styles.buttonDisabled]}>
        {icon && <OnPrimaryIcon name={icon} size={20} />}
        <Text variant="bodyBold" color="onPrimary">
          {label}
        </Text>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    borderRadius: theme.components.primaryButton.borderRadius,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    minHeight: theme.components.primaryButton.minHeight,
    paddingVertical: theme.components.primaryButton.paddingVertical,
    paddingHorizontal: theme.components.primaryButton.paddingHorizontal,
    borderRadius: theme.components.primaryButton.borderRadius,
    backgroundColor: theme.colors.primary,
    ...theme.elevation.sm,
  },
  buttonDisabled: {
    opacity: theme.opacity.disabled,
  },
}));
