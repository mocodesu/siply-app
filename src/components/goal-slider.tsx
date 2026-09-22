// ─────────────────────────────────────────────────────────────
// components/goal-slider.tsx
//
// Themed wrapper around the Expo SDK 57 Slider.
//
// The underlying component uses SwiftUI Slider on iOS and Material 3
// Slider on Android. On iOS, `maximumTrackTintColor` and
// `thumbTintColor` have no visual effect — SwiftUI only exposes the
// minimum (active) track tint. We map what works on each platform and
// leave the rest to native defaults, which already match the design
// closely in both light and dark mode.
//
// Accessibility: `accessibilityRole="adjustable"` with
// `accessibilityValue` is the documented pattern for range inputs[reference:1].
// ─────────────────────────────────────────────────────────────
import Slider from "@expo/ui/community/slider";
import React, { useCallback } from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Themed slider
//
// `withUnistyles` maps theme tokens into the tint props the native
// slider expects. Only this leaf re-renders on theme change.
// ─────────────────────────────────────────────────────────────

interface ThemedSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
  activeTrack: string;
  inactiveTrack: string;
  thumb: string;
}

const ThemedSlider = withUnistyles(
  ({
    value,
    minimumValue,
    maximumValue,
    step,
    onValueChange,
    activeTrack,
    inactiveTrack,
    thumb,
  }: ThemedSliderProps) => (
    <Slider
      value={value}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      onValueChange={onValueChange}
      minimumTrackTintColor={activeTrack}
      maximumTrackTintColor={inactiveTrack}
      thumbTintColor={thumb}
    />
  ),
  (theme) => ({
    activeTrack: theme.semantic.progressRing,
    inactiveTrack: theme.semantic.progressRingTrack,
    thumb: theme.colors.primary,
  }),
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface GoalSliderProps {
  /** Current goal value. */
  value: number;
  /** Minimum selectable value. */
  minimumValue?: number;
  /** Maximum selectable value. */
  maximumValue?: number;
  /** Step increment. */
  step?: number;
  /** Fires on every value change while dragging. */
  onValueChange: (value: number) => void;
  /** Optional accessibility label for the slider itself. */
  accessibilityLabel?: string;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the wrapper View. */
  testID?: string;
}

export function GoalSlider({
  value,
  minimumValue = 500,
  maximumValue = 5000,
  step = 100,
  onValueChange,
  accessibilityLabel = "Daily goal in millilitres",
  style,
  testID,
}: GoalSliderProps) {
  const handleChange = useCallback(
    (next: number) => {
      onValueChange(Math.round(next));
    },
    [onValueChange],
  );

  return (
    <View
      testID={testID}
      style={[styles.container, style]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        min: minimumValue,
        max: maximumValue,
        now: value,
        text: `${value} millilitres`,
      }}
    >
      <ThemedSlider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={handleChange}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    justifyContent: "center",
    minHeight: theme.layout.minTouchTarget,
  },
}));
