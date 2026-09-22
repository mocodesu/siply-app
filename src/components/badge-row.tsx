// ─────────────────────────────────────────────────────────────
// components/badge-row.tsx
//
// One achievement in the "All Badges" list.
//
// Three visual states, each communicated by more than color alone
// so the meaning survives greyscale and high-contrast mode:
//
//   unlocked     → filled accent badge, green checkmark
//   in progress  → tinted badge, "5/7" counter
//   locked       → muted badge, padlock
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface BadgeRowProps {
  /** Achievement title. */
  title: string;
  /** One-line description. */
  description: string;
  /** Ionicons glyph for this achievement. */
  icon: IconName;
  /** Best-ever progress toward `target`. */
  progress: number;
  /** Value at which the badge unlocks. */
  target: number;
  /** True once the badge has been earned. */
  unlocked: boolean;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function BadgeRow({
  title,
  description,
  icon,
  progress,
  target,
  unlocked,
  style,
  testID,
}: BadgeRowProps) {
  const inProgress = !unlocked && progress > 0;

  const iconWrapStyle = unlocked
    ? styles.iconWrapUnlocked
    : inProgress
      ? styles.iconWrapInProgress
      : styles.iconWrapLocked;

  const iconStyle = unlocked
    ? styles.iconUnlocked
    : inProgress
      ? styles.iconInProgress
      : styles.iconLocked;

  const statusLabel = unlocked
    ? "Unlocked"
    : inProgress
      ? `Progress ${progress} of ${target}`
      : "Locked";

  return (
    <View
      testID={testID}
      style={[styles.row, style]}
      accessible
      accessibilityLabel={`${title}. ${description}. ${statusLabel}.`}
    >
      <View style={[styles.iconWrap, iconWrapStyle]}>
        <Ionicons name={icon} size={20} style={iconStyle} />
      </View>

      <View style={styles.textBlock}>
        <Text
          variant="subheadBold"
          color={unlocked ? "onSurface" : "mutedText"}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text variant="caption" color="mutedText" numberOfLines={2}>
          {description}
        </Text>
      </View>

      {unlocked ? (
        <Ionicons name="checkmark-circle" size={22} style={styles.checkIcon} />
      ) : inProgress ? (
        <Text variant="caption" color="mutedText">
          {progress}/{target}
        </Text>
      ) : (
        <Ionicons name="lock-closed" size={16} style={styles.lockIcon} />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.components.badgeRow.padding,
    borderRadius: theme.components.badgeRow.borderRadius,
    borderWidth: theme.components.badgeRow.borderWidth,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.surface,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnlocked: {
    backgroundColor: theme.colors.primary,
  },
  iconWrapInProgress: {
    backgroundColor: theme.colors.panel,
  },
  iconWrapLocked: {
    backgroundColor: theme.colors.panel,
  },
  iconUnlocked: {
    color: theme.colors.onPrimary,
  },
  iconInProgress: {
    color: theme.colors.primary,
  },
  iconLocked: {
    color: theme.colors.mutedText,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  checkIcon: {
    color: theme.colors.active,
  },
  lockIcon: {
    color: theme.colors.mutedText,
  },
}));
