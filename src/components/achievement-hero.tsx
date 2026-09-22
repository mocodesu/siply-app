// ─────────────────────────────────────────────────────────────
// components/achievement-hero.tsx
//
// The large hero card at the top of the Achievements screen: a
// trophy badge, the achievement copy, and a progress bar.
//
// Not interactive — it's a status display, not a button. If it ever
// needs to open a detail view, wrap it in a HapticPressable at the
// call site rather than adding an `onPress` here.
// ─────────────────────────────────────────────────────────────
import { ProgressBar } from "@/components/progress-bar";
import Text from "@/components/text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface AchievementHeroProps {
  /** Achievement title, e.g. "Hydration Hero". */
  title: string;
  /** One-line description, e.g. "Drink 2,000 ml in a day". */
  description: string;
  /** Short unit label shown under the description, e.g. "10 times". */
  targetLabel: string;
  /** Best-ever progress toward `target`. */
  progress: number;
  /** Value at which the badge unlocks. */
  target: number;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function AchievementHero({
  title,
  description,
  targetLabel,
  progress,
  target,
  style,
  testID,
}: AchievementHeroProps) {
  const ratio = target > 0 ? Math.min(1, progress / target) : 0;

  return (
    <View
      testID={testID}
      style={[styles.card, style]}
      accessible
      accessibilityLabel={`${title}. ${description}. Goal: ${targetLabel}. Progress ${progress} of ${target}.`}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeCircle}>
          <Ionicons name="trophy" size={34} style={styles.badgeIcon} />
        </View>

        <View style={styles.textBlock}>
          <Text variant="h3" color="onSurface" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" color="mutedText" numberOfLines={2}>
            {description}
          </Text>
          <Text variant="subheadBold" color="onSurface" style={styles.unit}>
            {targetLabel}
          </Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <ProgressBar
          value={ratio}
          height={8}
          testID={testID ? `${testID}-bar` : undefined}
        />
        <Text
          variant="caption"
          color="mutedText"
          textAlign="right"
          style={styles.progressLabel}
        >
          {progress} / {target}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  badgeIcon: {
    color: theme.colors.onPrimary,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  unit: {
    marginTop: theme.spacing.xxs,
  },
  progressBlock: {
    gap: theme.spacing.xs,
  },
  progressLabel: {
    width: "100%",
  },
}));
