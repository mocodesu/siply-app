// ─────────────────────────────────────────────────────────────
// components/icon-button.tsx
//
// Square, circular-ripple icon button. Used in every screen header
// (close, bookmark, back, add, edit) and on the Home top bar.
//
// The optional `showDot` badge is the notification indicator on the
// Home bell — kept here rather than in the caller so the dot's
// position stays consistent with the icon's box.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import { SurfaceIcon } from "@/components/themed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface IconButtonProps {
  /** Ionicons glyph name. */
  name: IconName;
  /** Press handler. */
  onPress: () => void;
  /** Required for screen readers — icon-only buttons have no text. */
  accessibilityLabel: string;
  /** Icon size in pixels. Defaults to the button's hit target ratio. */
  size?: number;
  /** Renders a small danger-colored dot in the top-right corner. */
  showDot?: boolean;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the pressable. */
  testID?: string;
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  size = 24,
  showDot = false,
  style,
  testID,
}: IconButtonProps) {
  return (
    <HapticPressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={style}
    >
      <View style={styles.button}>
        <SurfaceIcon name={name} size={size} />
        {showDot && <View style={styles.dot} />}
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.full,
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
    borderWidth: 1.5,
    borderColor: theme.colors.background,
  },
}));
