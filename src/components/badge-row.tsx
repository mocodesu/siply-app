// ─────────────────────────────────────────────────────────────
// components/badge-row.tsx
//
// Fix from Step 11: badges above the current tier now show a
// padlock rather than "5/30". Badges within the current tier show
// their counter; the next tier shows a padlock. This matches the
// reference design and keeps the ladder legible at a glance.
//
// "Within the current tier" is determined by whether *any* badge
// has been unlocked at that metric level — the caller decides via
// `showProgress`. If `showProgress` is false and the badge isn't
// unlocked, it renders as locked regardless of the numeric value.
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface BadgeRowProps {
  title: string;
  description: string;
  icon: IconName;
  progress: number;
  target: number;
  unlocked: boolean;
  /**
   * When false, a not-yet-unlocked badge shows a padlock even if
   * `progress > 0`. Callers set this to false for tiers above the
   * user's current highest unlocked tier.
   */
  showProgress: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function BadgeRow({
  title,
  description,
  icon,
  progress,
  target,
  unlocked,
  showProgress,
  style,
  testID,
}: BadgeRowProps) {
  const showCounter = !unlocked && showProgress && progress > 0;
  const showLock = !unlocked && !showCounter;

  const iconWrapStyle = unlocked
    ? styles.iconWrapUnlocked
    : showCounter
      ? styles.iconWrapInProgress
      : styles.iconWrapLocked;

  const iconStyle = unlocked
    ? styles.iconUnlocked
    : showCounter
      ? styles.iconInProgress
      : styles.iconLocked;

  const statusLabel = unlocked
    ? "Unlocked"
    : showCounter
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
      ) : showCounter ? (
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
  iconWrapUnlocked: { backgroundColor: theme.colors.primary },
  iconWrapInProgress: { backgroundColor: theme.colors.panel },
  iconWrapLocked: { backgroundColor: theme.colors.panel },
  iconUnlocked: { color: theme.colors.onPrimary },
  iconInProgress: { color: theme.colors.primary },
  iconLocked: { color: theme.colors.mutedText },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  checkIcon: { color: theme.colors.active },
  lockIcon: { color: theme.colors.mutedText },
}));
