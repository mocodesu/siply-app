// ─────────────────────────────────────────────────────────────
// components/segmented-control.tsx
//
// Custom animated segmented control. The reference design shows a
// filled blue pill that slides between segments — the native
// `@expo/ui` segmented control can't produce that look, so this is
// hand-rolled with Reanimated.
//
// The indicator slides on the UI thread. Tapping a segment updates
// the parent's state, which flows back down as `value`; the effect
// then animates the indicator to the new position.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import React, { useCallback, useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

const SLIDE_DURATION = 220;

export interface Segment<T extends string> {
  key: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** The segments to display, in order. */
  segments: readonly Segment<T>[];
  /** The currently selected segment key. */
  value: T;
  /** Fires with the new key when the user taps a segment. */
  onChange: (key: T) => void;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
  /** Accessibility label for the whole control. */
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  testID,
  accessibilityLabel = "View period",
}: SegmentedControlProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  const selectedIndex = Math.max(
    0,
    segments.findIndex((s) => s.key === value),
  );
  const segmentWidth =
    containerWidth > 0 && segments.length > 0
      ? containerWidth / segments.length
      : 0;

  useEffect(() => {
    if (segmentWidth <= 0) return;
    translateX.value = withTiming(selectedIndex * segmentWidth, {
      duration: SLIDE_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedIndex, segmentWidth, translateX]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      width: segmentWidth,
      transform: [{ translateX: translateX.value }],
    }),
    [segmentWidth],
  );

  return (
    <View
      testID={testID}
      style={styles.container}
      onLayout={handleLayout}
      accessible
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segmentWidth > 0 && (
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      )}

      {segments.map((segment) => {
        const isActive = segment.key === value;
        return (
          <HapticPressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={segment.label}
            haptic="selection"
            style={styles.segment}
          >
            <Text
              variant={isActive ? "subheadBold" : "subhead"}
              color={isActive ? "onPrimary" : "mutedText"}
              textAlign="center"
            >
              {segment.label}
            </Text>
          </HapticPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    padding: theme.components.segmentedControl.padding,
    borderRadius: theme.components.segmentedControl.borderRadius,
    backgroundColor: theme.colors.panel,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: theme.components.segmentedControl.padding,
    bottom: theme.components.segmentedControl.padding,
    left: theme.components.segmentedControl.padding,
    borderRadius:
      theme.components.segmentedControl.borderRadius -
      theme.components.segmentedControl.padding,
    backgroundColor: theme.colors.primary,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.components.segmentedControl.segmentPaddingVertical,
    paddingHorizontal:
      theme.components.segmentedControl.segmentPaddingHorizontal,
    zIndex: 1,
  },
}));
