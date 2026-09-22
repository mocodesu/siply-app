// ─────────────────────────────────────────────────────────────
// components/pulsing-dot.tsx
//
// Small dot that slowly pulses its opacity. Used for the
// notification indicator on the Home bell — a hint of life without
// demanding attention the way a bounce or shake would.
//
// The dot is decorative; the parent button carries the accessible
// label, so this subtree is hidden from screen readers.
// ─────────────────────────────────────────────────────────────
import React, { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

const PULSE_DURATION = 1400;
const MIN_OPACITY = 0.55;
const MAX_OPACITY = 1;

export interface PulsingDotProps {
  /** Diameter in pixels. Defaults to 8. */
  size?: number;
  /** Style override for positioning. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the wrapper. */
  testID?: string;
}

export function PulsingDot({ size = 8, style, testID }: PulsingDotProps) {
  const opacity = useSharedValue(MAX_OPACITY);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(MIN_OPACITY, {
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  dot: {
    backgroundColor: theme.colors.danger,
    borderWidth: 1.5,
    borderColor: theme.colors.background,
  },
}));
