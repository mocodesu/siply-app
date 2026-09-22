// ─────────────────────────────────────────────────────────────
// components/progress-bar.tsx
//
// Animated horizontal fill bar. Used on the achievement hero card
// and anywhere else a plain 0–1 progress indicator is needed.
//
// Distinct from `consistency-bar.tsx`, which bundles its own label
// row. This one is bare — the caller owns all text around it.
// ─────────────────────────────────────────────────────────────
import React, { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

const FILL_DURATION = 700;

export interface ProgressBarProps {
  /** Completion ratio, 0–1. Clamped. */
  value: number;
  /** Track height in pixels. Defaults to 8. */
  height?: number;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function ProgressBar({
  value,
  height = 8,
  style,
  testID,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percentage = Math.round(clamped * 100);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, {
      duration: FILL_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      testID={testID}
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
    >
      <Animated.View
        style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    width: "100%",
    backgroundColor: theme.semantic.progressRingTrack,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
}));
