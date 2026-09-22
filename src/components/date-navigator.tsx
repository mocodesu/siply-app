// components/date-navigator.tsx
//
// Prev/next day control with a long-form date label. Next is
// disabled at today.
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { SurfaceIcon } from "@/components/themed";
import { formatDateLong } from "@/utils/date";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface DateNavigatorProps {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  testID?: string;
}

export function DateNavigator({
  date,
  onPrev,
  onNext,
  canGoNext,
  testID,
}: DateNavigatorProps) {
  return (
    <View testID={testID} style={styles.row}>
      <HapticPressable
        onPress={onPrev}
        accessibilityLabel="Previous day"
        hitSlop={8}
        style={styles.button}
        testID={testID ? `${testID}-prev` : undefined}
      >
        <SurfaceIcon name="chevron-back" size={20} />
      </HapticPressable>

      <Text
        variant="subheadBold"
        color="onSurface"
        textAlign="center"
        style={styles.label}
        numberOfLines={1}
      >
        {formatDateLong(date)}
      </Text>

      <HapticPressable
        onPress={onNext}
        disabled={!canGoNext}
        accessibilityLabel="Next day"
        accessibilityState={{ disabled: !canGoNext }}
        hitSlop={8}
        style={canGoNext ? styles.button : styles.buttonDisabled}
        testID={testID ? `${testID}-next` : undefined}
      >
        <SurfaceIcon name="chevron-forward" size={20} />
      </HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: theme.layout.minTouchTarget,
  },
  button: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.full,
  },
  buttonDisabled: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.full,
    opacity: theme.opacity.disabled,
  },
  label: {
    flex: 1,
  },
}));
