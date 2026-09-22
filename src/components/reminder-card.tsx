// ─────────────────────────────────────────────────────────────
// components/reminder-card.tsx
//
// Compact card showing the next scheduled reminder. Used on Home.
// Purely presentational — the caller supplies the times.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { PrimaryIcon } from "@/components/themed";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface ReminderCardProps {
  /** Left-side label, e.g. "Next reminder". */
  label: string;
  /** Secondary line under the label, e.g. "in 45 min". */
  timeLeft: string;
  /** Right-aligned time, e.g. "10:30 AM". */
  time: string;
  /** Optional press handler — makes the whole card tappable. */
  onPress?: () => void;
  /** Test identifier forwarded to the outer container. */
  testID?: string;
  /** Accessibility label override. */
  accessibilityLabel?: string;
}

export function ReminderCard({
  label,
  timeLeft,
  time,
  onPress,
  testID,
  accessibilityLabel,
}: ReminderCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <PrimaryIcon name="time-outline" size={20} />
      </View>

      <View style={styles.textBlock}>
        <Text variant="subheadBold" color="onSurface" numberOfLines={1}>
          {label}
        </Text>
        <Text variant="caption" color="mutedText" numberOfLines={1}>
          {timeLeft}
        </Text>
      </View>

      <Text variant="subheadBold" color="onSurface">
        {time}
      </Text>
    </View>
  );

  const a11yLabel = accessibilityLabel ?? `${label}, ${timeLeft}, ${time}`;

  if (onPress) {
    return (
      <HapticPressable
        testID={testID}
        onPress={onPress}
        accessibilityLabel={a11yLabel}
        style={styles.pressable}
      >
        {content}
      </HapticPressable>
    );
  }

  return (
    <View testID={testID} accessible accessibilityLabel={a11yLabel}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    borderRadius: theme.radii.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.semantic.reminderCardBackground,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.semantic.reminderCardBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
