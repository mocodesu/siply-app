// ─────────────────────────────────────────────────────────────
// components/consistency-bar.tsx
//
// "Consistency 86%" with a horizontal fill bar underneath.
//
// The fill animates on mount and whenever the value changes. The
// track and fill are plain Views — no Skia needed for a single
// rounded rectangle.
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import React, { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

const FILL_DURATION = 600;

export interface ConsistencyBarProps {
  /** Completion ratio, 0–1. Clamped. */
  value: number;
  /** Label above the bar. Defaults to `"Consistency"`. */
  label?: string;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function ConsistencyBar({
  value,
  label = "Consistency",
  style,
  testID,
}: ConsistencyBarProps) {
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
      style={[styles.root, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label} ${percentage} percent`}
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
    >
      <View style={styles.headerRow}>
        <Text variant="subheadBold" color="onSurface">
          {label}
        </Text>
        <Text variant="h3" color="onSurface">
          {percentage}%
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.semantic.progressRingTrack,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
}));
