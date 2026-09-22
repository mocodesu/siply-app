// ─────────────────────────────────────────────────────────────
// components/info-card.tsx
//
// Titled card with body copy and an optional tertiary action.
// Used for "About your goal" on Daily Goal and similar explainer
// blocks elsewhere.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface InfoCardProps {
  /** Card heading. */
  title: string;
  /** Body copy. */
  body: string;
  /** Optional small action label, e.g. "Learn more". */
  actionLabel?: string;
  /** Handler for the action. Required when `actionLabel` is set. */
  onActionPress?: () => void;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function InfoCard({
  title,
  body,
  actionLabel,
  onActionPress,
  style,
  testID,
}: InfoCardProps) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      <Text variant="subheadBold" color="onSurface">
        {title}
      </Text>
      <Text variant="caption" color="mutedText">
        {body}
      </Text>

      {actionLabel && onActionPress && (
        <HapticPressable
          onPress={onActionPress}
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={styles.action}
        >
          <Text variant="subheadBold" color="primary">
            {actionLabel}
          </Text>
        </HapticPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.xs,
  },
  action: {
    alignSelf: "flex-start",
    paddingVertical: theme.spacing.xxs,
  },
}));
