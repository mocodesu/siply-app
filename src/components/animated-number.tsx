// components/animated-number.tsx
//
// Number that animates between values. Wrapped in React.memo so a
// parent re-render with unchanged value/format/style does not
// re-render this component.
import React, { memo, useEffect, useState } from "react";
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
  value: number;
  startFrom?: number;
  duration?: number;
  format?: (value: number) => string;
}

function AnimatedNumberBase({
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

export const AnimatedNumber = memo(AnimatedNumberBase);
