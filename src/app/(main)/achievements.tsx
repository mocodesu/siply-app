// ─────────────────────────────────────────────────────────────
// app/(main)/achievements.tsx
//
// Computes the "current tier" (highest streak count achieved) and
// passes `showProgress` to each BadgeRow so anything above that
// tier renders as locked.
// ─────────────────────────────────────────────────────────────
import { AchievementHero } from "@/components/achievement-hero";
import { BadgeRow } from "@/components/badge-row";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useAchievements } from "@/hooks/use-achievements";
import type { AchievementView } from "@/repositories/achievements-repo";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const HERO_UNIT_LABEL = "10 times";

/**
 * Computes the highest unlocked `target` among streak badges. Any
 * badge with a streak target above this renders as locked even if
 * its progress count is non-zero.
 */
function highestUnlockedStreakTarget(badges: AchievementView[]): number {
  return badges.reduce((best, badge) => {
    if (badge.unlocked && badge.target > best) return badge.target;
    return best;
  }, 0);
}

export default function AchievementsScreen() {
  const { loading, hero, badges } = useAchievements();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const highestStreak = highestUnlockedStreakTarget(badges);

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="achievements-back"
      />
      <Text
        variant="title"
        color="onBackground"
        textAlign="center"
        style={styles.headerTitle}
      >
        Achievements
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="achievements-screen">
      {!loading && hero && (
        <AchievementHero
          title={hero.title}
          description={hero.description}
          targetLabel={HERO_UNIT_LABEL}
          progress={hero.progress}
          target={hero.target}
          testID="achievements-hero"
        />
      )}

      {!loading && badges.length > 0 && (
        <View style={styles.listSection}>
          <Text variant="subheadBold" color="onSurface">
            All Badges
          </Text>

          <View style={styles.list}>
            {badges.map((badge) => {
              // Streak badges above the highest unlocked tier are
              // shown as locked. Non-streak badges always show
              // their counter when there's progress.
              const isStreakBadge = badge.description
                .toLowerCase()
                .includes("daily");
              const showProgress = isStreakBadge
                ? badge.target <= highestStreak || badge.unlocked
                : true;

              return (
                <BadgeRow
                  key={badge.id}
                  title={badge.title}
                  description={badge.description}
                  icon={badge.icon}
                  progress={badge.progress}
                  target={badge.target}
                  unlocked={badge.unlocked}
                  showProgress={showProgress}
                  testID={`achievements-badge-${badge.id}`}
                />
              );
            })}
          </View>
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.layout.minTouchTarget,
  },
  headerTitle: { flex: 1 },
  headerSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
  listSection: { gap: theme.spacing.md },
  list: { gap: theme.spacing.sm },
}));
