// ─────────────────────────────────────────────────────────────
// components/icon-button.tsx
//
// Step D: the notification dot now pulses softly via PulsingDot.
// The dot only renders when `showDot` is true, so the pulse is
// itself conditional — no idle animation when nothing is pending.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import { PulsingDot } from "@/components/pulsing-dot";
import { SurfaceIcon } from "@/components/themed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  showDot?: boolean;
  style?: ViewStyle;
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
        {showDot && <PulsingDot style={styles.dot} />}
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
  },
}));
