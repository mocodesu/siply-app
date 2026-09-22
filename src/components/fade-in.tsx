// ─────────────────────────────────────────────────────────────
// components/fade-in.tsx
//
// Fades its children in on mount, with an optional vertical slide
// and delay. The primitive behind staggered screen entrances.
//
// Plays on mount only — tabs keep their screens mounted, so a
// re-visit lands on the fully-revealed state instead of replaying
// the animation every time. Modals, which mount fresh each open,
// get the entrance every time.
// ─────────────────────────────────────────────────────────────
import React, { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const DEFAULT_DURATION = 320;
const DEFAULT_OFFSET = 8;
const DEFAULT_EASING = Easing.out(Easing.cubic);

export interface FadeInViewProps {
  children: React.ReactNode;
  /** Delay before the fade starts, in milliseconds. */
  delay?: number;
  /** Fade duration, in milliseconds. */
  duration?: number;
  /**
   * Starting vertical offset, in pixels. Positive values slide the
   * content up into place. Set to 0 for a pure fade.
   */
  offset?: number;
  /** Layout style for the wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the wrapper. */
  testID?: string;
}

export function FadeInView({
  children,
  delay = 0,
  duration = DEFAULT_DURATION,
  offset = DEFAULT_OFFSET,
  style,
  testID,
}: FadeInViewProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: DEFAULT_EASING }),
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: offset * (1 - progress.value) }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} testID={testID}>
      {children}
    </Animated.View>
  );
}
