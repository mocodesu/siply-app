// ─────────────────────────────────────────────────────────────
// components/date-navigator.tsx
//
// Prev/next day control with a long-form date label. Used on the
// History screen.
//
// The next button disables when the user reaches today. Future
// dates aren't hidden — they're just unreachable, which is the
// honest UX for a "past logs" view.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { SurfaceIcon } from "@/components/themed";
import { formatDateLong } from "@/utils/date";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface DateNavigatorProps {
  /** Currently selected date. */
  date: Date;
  /** Fires when the user taps the previous-day chevron. */
  onPrev: () => void;
  /** Fires when the user taps the next-day chevron. */
  onNext: () => void;
  /** When false, the next-day chevron is dimmed and inert. */
  canGoNext: boolean;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function DateNavigator({
  date,
  onPrev,
  onNext,
  canGoNext,
  style,
  testID,
}: DateNavigatorProps) {
  return (
    <View testID={testID} style={[styles.row, style]}>
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
        style={[styles.button, !canGoNext && styles.buttonDisabled]}
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
    opacity: theme.opacity.disabled,
  },
  label: {
    flex: 1,
  },
}));
