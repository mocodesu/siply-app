// ─────────────────────────────────────────────────────────────
// components/Haptic-pressable.tsx
//
// Pressable with haptic + sound + scale feedback.
//
// `Pressable` remains the outer element — it's wrapped with
// `Animated.createAnimatedComponent` so the animated style lands
// on the same node as the caller's style. This keeps layout and
// hit-testing identical to a plain Pressable; only the transform
// is added.
//
// Earlier versions wrapped Pressable inside an Animated.View,
// which broke touch handling on headers and any element whose
// style imposed sizing — the wrapper got the size and the inner
// Pressable didn't.
// ─────────────────────────────────────────────────────────────
import React, { useCallback } from "react";
import {
  Pressable,
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

import { HapticType, withHaptic } from "@/utils/haptics";

// ─────────────────────────────────────────────────────────────
// Animation tuning
// ─────────────────────────────────────────────────────────────

const PRESSED_SCALE = 0.96;
const PRESS_IN_DURATION = 70;

// ─────────────────────────────────────────────────────────────
// Animated Pressable
//
// `createAnimatedComponent` accepts any component that forwards a
// `style` prop to a native view. Pressable does, so the caller's
// style and the animated style both end up on the same underlying
// view — which is what we need for correct layout and hit-testing.
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type HapticPressableProps = Omit<PressableProps, "style"> & {
  /** Feedback type to fire on press. Defaults to `"selection"`. */
  haptic?: HapticType;
  /**
   * Style applied directly to the Pressable. Functions of the form
   * `({ pressed }) => style` are not supported — use a plain style
   * or an array of styles.
   */
  style?: StyleProp<ViewStyle>;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

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
      onPress={withHaptic(onPress, haptic)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    />
  );
}
