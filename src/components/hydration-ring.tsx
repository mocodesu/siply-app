// ─────────────────────────────────────────────────────────────
// components/hydration-ring.tsx
//
// Circular progress ring for daily hydration progress.
//
// ── Skia API note ────────────────────────────────────────────
// Uses the immutable Path API throughout. The track is a static
// factory (`Skia.Path.Circle`); the animated arc is built with
// `Skia.PathBuilder`.
//   See: shopify.github.io/react-native-skia/docs/shapes/path-migration
// ─────────────────────────────────────────────────────────────
import { Canvas, Path, Skia, type SkPath } from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const START_ANGLE = -90; // 12 o'clock
const FULL_CIRCLE = 360;
const ANIMATION_DURATION = 900;

const RING_DEFAULTS = {
  size: 200,
  strokeWidth: 14,
} as const;

// ─────────────────────────────────────────────────────────────
// Themed canvas
// ─────────────────────────────────────────────────────────────

interface ThemedRingCanvasProps {
  size: number;
  trackPath: SkPath;
  arcPath: SkPath;
  trackColor: string;
  progressColor: string;
  strokeWidth: number;
}

const ThemedRingCanvas = withUnistyles(
  ({
    size,
    trackPath,
    arcPath,
    trackColor,
    progressColor,
    strokeWidth,
  }: ThemedRingCanvasProps) => (
    <Canvas style={{ width: size, height: size }}>
      <Path
        path={trackPath}
        color={trackColor}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
      />
      <Path
        path={arcPath}
        color={progressColor}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
      />
    </Canvas>
  ),
  (theme) => ({
    trackColor: theme.semantic.progressRingTrack,
    progressColor: theme.semantic.progressRing,
  }),
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface HydrationRingProps {
  /** Current intake in millilitres. */
  current: number;
  /** Daily goal in millilitres. */
  goal: number;
  /** Outer diameter of the ring in pixels. */
  size?: number;
  /** Stroke thickness in pixels. */
  strokeWidth?: number;
  /** Optional content rendered in the centre of the ring. */
  children?: React.ReactNode;
  /** Optional style override for the outer container. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
  /** Accessibility label override. */
  accessibilityLabel?: string;
}

export function HydrationRing({
  current,
  goal,
  size,
  strokeWidth,
  children,
  style,
  testID,
  accessibilityLabel,
}: HydrationRingProps) {
  const resolvedSize = size ?? RING_DEFAULTS.size;
  const resolvedStroke = strokeWidth ?? RING_DEFAULTS.strokeWidth;

  // ── Progress maths ──────────────────────────────────────
  const safeGoal = goal > 0 ? goal : 1;
  const clampedProgress = Math.max(0, Math.min(1, current / safeGoal));
  const percentage = Math.round(clampedProgress * 100);

  // ── Geometry ────────────────────────────────────────────
  const center = resolvedSize / 2;
  const radius = center - resolvedStroke / 2;

  // Static track — a closed circle, built once via the factory.
  const trackPath = useMemo(
    () => Skia.Path.Circle(center, center, radius),
    [center, radius],
  );

  // ── Animation ───────────────────────────────────────────
  const progressShared = useSharedValue(0);

  useEffect(() => {
    progressShared.value = withTiming(clampedProgress, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedProgress, progressShared]);

  const animatedArcPath = useDerivedValue(() => {
    const sweep = progressShared.value * FULL_CIRCLE;
    const rect = Skia.XYWHRect(
      center - radius,
      center - radius,
      radius * 2,
      radius * 2,
    );
    return Skia.PathBuilder.Make().addArc(rect, START_ANGLE, sweep).build();
  }, [center, radius]);

  // ── Accessibility ───────────────────────────────────────
  const defaultLabel = `${percentage}% of daily goal. ${current} of ${goal} millilitres.`;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { width: resolvedSize, height: resolvedSize },
        style,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? defaultLabel}
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
    >
      <ThemedRingCanvas
        size={resolvedSize}
        trackPath={trackPath}
        arcPath={animatedArcPath}
        strokeWidth={resolvedStroke}
      />
      {children !== undefined && (
        <View style={styles.center} pointerEvents="none">
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
