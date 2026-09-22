// components/segmented-control.tsx
//
// Animated segmented control. The indicator slides on the UI
// thread between segment positions.
//
// Animation is driven by useAnimatedReaction rather than a
// useEffect. The reaction fires only when the observed shared
// values actually change, and it re-targets the animation cleanly
// from wherever the pill currently is. This avoids the class of
// bug where a mid-animation re-render caused withTiming to restart
// from a stale position and the pill visibly jumped backwards.
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import React, { useCallback, useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedReaction,
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
  segments: readonly Segment<T>[];
  value: T;
  onChange: (key: T) => void;
  testID?: string;
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

  const selectedIndex = Math.max(
    0,
    segments.findIndex((s) => s.key === value),
  );

  const segmentWidth =
    containerWidth > 0 && segments.length > 0
      ? containerWidth / segments.length
      : 0;

  // Shared values mirror the props so the reaction below can read
  // current values without capturing stale closures.
  const indexShared = useSharedValue(selectedIndex);
  const widthShared = useSharedValue(segmentWidth);

  // The animated X position of the indicator.
  const translateX = useSharedValue(0);

  // True once the pill has been positioned for the first time.
  // Used to snap on the initial layout instead of animating from
  // an arbitrary starting point.
  const hasPositioned = useSharedValue(false);

  useEffect(() => {
    indexShared.value = selectedIndex;
  }, [selectedIndex, indexShared]);

  useEffect(() => {
    widthShared.value = segmentWidth;
  }, [segmentWidth, widthShared]);

  useAnimatedReaction(
    () => ({
      index: indexShared.value,
      width: widthShared.value,
    }),
    (current, previous) => {
      if (current.width <= 0) return;

      const target = current.index * current.width;

      // Snap on the first valid measurement. Animating from 0
      // here would cause a visible slide on mount.
      if (!hasPositioned.value) {
        translateX.value = target;
        hasPositioned.value = true;
        return;
      }

      const previousIndex = previous?.index ?? -1;
      const previousWidth = previous?.width ?? 0;

      if (current.index !== previousIndex || current.width !== previousWidth) {
        translateX.value = withTiming(target, {
          duration: SLIDE_DURATION,
          easing: Easing.out(Easing.cubic),
        });
      }
    },
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: widthShared.value,
    transform: [{ translateX: translateX.value }],
  }));

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
