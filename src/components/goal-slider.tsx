// ─────────────────────────────────────────────────────────────
// components/goal-slider.tsx
//
// Custom slider with a min/max stepper on either side.
//
// Replaces the native Slider, which couldn't match the reference
// design's filled-track-plus-large-thumb treatment. Gesture and
// animation run entirely on the UI thread; the parent only hears
// about discrete value changes via `runOnJS`.
//
// ── React Compiler note ──────────────────────────────────────
// The gesture callbacks and the shared-value updater live at
// module scope with `'worklet'` directives where they touch the
// UI thread. See `bar-chart.tsx` for the same pattern and the
// linked Reanimated issue.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import { SurfaceIcon } from "@/components/themed";
import React, { useCallback, useEffect, useMemo } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────

const TRACK_HEIGHT = 10;
const THUMB_SIZE = 26;
const SNAP_DURATION = 120;

/** Clamps `x` into [0, 1]. Worklet-safe. */
const clamp01 = (x: number): number => {
  "worklet";
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
};

/** Rounds to the nearest multiple of `step`, min-anchored. */
const snapToStep = (raw: number, min: number, step: number): number => {
  "worklet";
  const steps = Math.round((raw - min) / step);
  return min + steps * step;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface GoalSliderProps {
  /** Current value, expressed in the parent's unit. */
  value: number;
  /** Minimum value. */
  minimumValue: number;
  /** Maximum value. */
  maximumValue: number;
  /** Snap increment. */
  step: number;
  /** Fires when the value changes, after snapping. */
  onValueChange: (value: number) => void;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
  /** Accessibility label for the whole control. */
  accessibilityLabel?: string;
}

export function GoalSlider({
  value,
  minimumValue,
  maximumValue,
  step,
  onValueChange,
  testID,
  accessibilityLabel = "Daily goal",
}: GoalSliderProps) {
  const trackWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const range = Math.max(1, maximumValue - minimumValue);

  // ── Keep the thumb in sync with the prop value ───────────
  useEffect(() => {
    if (trackWidth.value <= 0) return;
    if (isDragging.value) return;
    const ratio = (value - minimumValue) / range;
    thumbX.value = withTiming(clamp01(ratio) * trackWidth.value, {
      duration: SNAP_DURATION,
    });
  }, [value, minimumValue, range, thumbX, trackWidth, isDragging]);

  // ── Notify the parent ────────────────────────────────────
  const emitValue = useCallback(
    (raw: number) => {
      const snapped = snapToStep(raw, minimumValue, step);
      const clamped = Math.max(minimumValue, Math.min(maximumValue, snapped));
      if (clamped !== value) onValueChange(clamped);
    },
    [minimumValue, maximumValue, step, value, onValueChange],
  );

  // ── Gesture ──────────────────────────────────────────────
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          isDragging.value = true;
          const x = clamp01(e.x / Math.max(1, trackWidth.value));
          thumbX.value = x * trackWidth.value;
          runOnJS(emitValue)(minimumValue + x * (maximumValue - minimumValue));
        })
        .onUpdate((e) => {
          const x = clamp01(e.x / Math.max(1, trackWidth.value));
          thumbX.value = x * trackWidth.value;
          runOnJS(emitValue)(minimumValue + x * (maximumValue - minimumValue));
        })
        .onFinalize(() => {
          isDragging.value = false;
        }),
    [trackWidth, thumbX, isDragging, emitValue, minimumValue, maximumValue],
  );

  // ── Stepper handlers ─────────────────────────────────────
  const handleDecrement = useCallback(() => {
    const next = Math.max(minimumValue, value - step);
    if (next !== value) onValueChange(next);
  }, [value, step, minimumValue, onValueChange]);

  const handleIncrement = useCallback(() => {
    const next = Math.min(maximumValue, value + step);
    if (next !== value) onValueChange(next);
  }, [value, step, maximumValue, onValueChange]);

  // ── Layout ───────────────────────────────────────────────
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      trackWidth.value = width;
      const ratio = (value - minimumValue) / range;
      thumbX.value = clamp01(ratio) * width;
    },
    [trackWidth, thumbX, value, minimumValue, range],
  );

  // ── Animated styles ──────────────────────────────────────
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const canDecrement = value > minimumValue;
  const canIncrement = value < maximumValue;

  return (
    <View
      testID={testID}
      style={styles.root}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        min: minimumValue,
        max: maximumValue,
        now: value,
      }}
    >
      <HapticPressable
        onPress={handleDecrement}
        disabled={!canDecrement}
        accessibilityLabel="Decrease"
        accessibilityState={{ disabled: !canDecrement }}
        style={[styles.stepper, !canDecrement && styles.stepperDisabled]}
        testID={testID ? `${testID}-minus` : undefined}
      >
        <SurfaceIcon name="remove" size={20} />
      </HapticPressable>

      <GestureDetector gesture={pan}>
        <View style={styles.trackArea} onLayout={handleLayout}>
          <View style={styles.track} />
          <Animated.View style={[styles.fill, fillStyle]} />
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>

      <HapticPressable
        onPress={handleIncrement}
        disabled={!canIncrement}
        accessibilityLabel="Increase"
        accessibilityState={{ disabled: !canIncrement }}
        style={[styles.stepper, !canIncrement && styles.stepperDisabled]}
        testID={testID ? `${testID}-plus` : undefined}
      >
        <SurfaceIcon name="add" size={20} />
      </HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: theme.layout.minTouchTarget,
  },
  stepper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperDisabled: {
    opacity: theme.opacity.disabled,
  },
  trackArea: {
    flex: 1,
    height: Math.max(TRACK_HEIGHT, THUMB_SIZE),
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: theme.semantic.progressRingTrack,
  },
  fill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: theme.colors.primary,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    ...theme.elevation.sm,
  },
}));
