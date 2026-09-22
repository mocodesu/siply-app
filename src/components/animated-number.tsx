// ─────────────────────────────────────────────────────────────
// components/animated-number.tsx
//
// Number that animates between values. Uses a shared value on the
// UI thread and pushes to React state only when the rounded
// integer changes, so a 900 ms animation triggers roughly 20–30
// re-renders of a single Text node — not one per frame.
//
// `startFrom` controls the initial displayed value. Defaults to
// `value`, meaning the component renders the target immediately on
// mount. Set `startFrom={0}` to have it count up from zero, which
// is what the hydration ring centre uses.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Text, { type CustomTextProps } from "@/components/text";

const DEFAULT_DURATION = 900;
const DEFAULT_EASING = Easing.out(Easing.cubic);

export interface AnimatedNumberProps extends Omit<CustomTextProps, "children"> {
  /** Target value to animate toward. */
  value: number;
  /** Starting value. Defaults to `value`. */
  startFrom?: number;
  /** Animation duration, in milliseconds. */
  duration?: number;
  /** Formats the displayed integer. Defaults to `String`. */
  format?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  startFrom,
  duration = DEFAULT_DURATION,
  format,
  ...textProps
}: AnimatedNumberProps) {
  const initial = startFrom ?? value;
  const shared = useSharedValue(initial);
  const [display, setDisplay] = useState(initial);

  useEffect(() => {
    shared.value = withTiming(value, {
      duration,
      easing: DEFAULT_EASING,
    });
  }, [value, duration, shared]);

  useAnimatedReaction(
    () => Math.round(shared.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplay)(current);
      }
    },
  );

  const rendered = format ? format(display) : String(display);

  return <Text {...textProps}>{rendered}</Text>;
}
