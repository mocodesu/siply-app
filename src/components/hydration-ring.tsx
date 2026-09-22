// ─────────────────────────────────────────────────────────────
// components/hydration-ring.tsx
//
// Circular progress ring for daily hydration progress.
//
// Draws a full-circle track behind an animated arc. The arc sweep
// is driven by Reanimated on the UI thread and consumed directly by
// Skia — no `useAnimatedProps` or `createAnimatedComponent`.
//
// Colors are mapped from `theme.semantic` via `withUnistyles`, so
// the ring only re-renders when the theme changes, never when the
// parent screen re-renders for other reasons.
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
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const START_ANGLE = -90; // 12 o'clock position
const FULL_CIRCLE = 360;
const ANIMATION_DURATION = 900;

// ─────────────────────────────────────────────────────────────
// THEMED CANVAS
//
// `withUnistyles` maps theme tokens to Skia color props. Only this
// leaf re-renders on theme change.
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
      {/* Track — full circle behind the arc */}
      <Path
        path={trackPath}
        color={trackColor}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
      />
      {/* Progress arc — animated sweep */}
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
// COMPONENT
// ─────────────────────────────────────────────────────────────

export interface HydrationRingProps {
  /** Current intake in millilitres. */
  current: number;
  /** Daily goal in millilitres. */
  goal: number;
  /** Outer diameter of the ring in pixels. Defaults to the component token. */
  size?: number;
  /** Stroke thickness in pixels. Defaults to the component token. */
  strokeWidth?: number;
  /** Optional content rendered in the centre of the ring. */
  children?: React.ReactNode;
  /** Optional style override for the outer container. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
  /** Accessibility label override. Defaults to a generated description. */
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
  // ── Resolve layout from theme tokens ────────────────────
  const resolvedSize = size ?? RING_DEFAULTS.size;
  const resolvedStroke = strokeWidth ?? RING_DEFAULTS.strokeWidth;

  // ── Progress maths ──────────────────────────────────────
  const safeGoal = goal > 0 ? goal : 1;
  const rawProgress = current / safeGoal;
  const clampedProgress = Math.max(0, Math.min(1, rawProgress));
  const percentage = Math.round(clampedProgress * 100);

  // ── Geometry ────────────────────────────────────────────
  const center = resolvedSize / 2;
  const radius = center - resolvedStroke / 2;

  const { trackPath, arcPath } = useMemo(() => {
    const track = Skia.Path.Make();
    track.addCircle(center, center, radius);

    const arc = Skia.Path.Make();
    arc.addArc(
      {
        x: center - radius,
        y: center - radius,
        width: radius * 2,
        height: radius * 2,
      },
      START_ANGLE,
      0,
    );

    return { trackPath: track, arcPath: arc };
  }, [center, radius]);

  // ── Animation ───────────────────────────────────────────
  const progressShared = useSharedValue(0);

  useEffect(() => {
    progressShared.value = withTiming(clampedProgress, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedProgress, progressShared]);

  const animatedArcPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const sweep = progressShared.value * FULL_CIRCLE;

    path.addArc(
      {
        x: center - radius,
        y: center - radius,
        width: radius * 2,
        height: radius * 2,
      },
      START_ANGLE,
      sweep,
    );

    return path;
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

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// DEFAULTS
//
// Pulled from the `progressRing` component token at call sites via
// the `size` / `strokeWidth` props. The fallbacks here match the
// token defaults so the ring renders correctly even when used
// standalone.
// ─────────────────────────────────────────────────────────────

const RING_DEFAULTS = {
  size: 200,
  strokeWidth: 14,
} as const;
