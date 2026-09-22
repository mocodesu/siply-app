// components/Haptic-pressable.tsx
//
// Pressable with haptic + sound + scale feedback.
//
// The onPress wrapper is memoized with useCallback, so when a
// caller passes a stable callback the underlying native view sees
// an unchanging handler. This matters for the new isolated Home
// sections, which pass module-scope callbacks.
import React, { useCallback } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { feedback, type HapticType } from "@/utils/haptics";

const PRESSED_SCALE = 0.96;
const PRESS_IN_DURATION = 70;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticPressableProps = Omit<PressableProps, "style"> & {
  haptic?: HapticType;
  style?: StyleProp<ViewStyle>;
};

export function HapticPressable({
  haptic = "selection",
  onPress,
  onPressIn,
  onPressOut,
  accessibilityRole = "button",
  accessible = true,
  style,
  ...props
}: HapticPressableProps) {
  const scale = useSharedValue(1);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      feedback(haptic);
      onPress?.(event);
    },
    [haptic, onPress],
  );

  const handlePressIn = useCallback<NonNullable<PressableProps["onPressIn"]>>(
    (event) => {
      scale.value = withTiming(PRESSED_SCALE, {
        duration: PRESS_IN_DURATION,
        easing: Easing.out(Easing.quad),
      });
      onPressIn?.(event);
    },
    [onPressIn, scale],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps["onPressOut"]>>(
    (event) => {
      scale.value = withSpring(1, {
        damping: 18,
        stiffness: 480,
        mass: 0.6,
      });
      onPressOut?.(event);
    },
    [onPressOut, scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    />
  );
}
