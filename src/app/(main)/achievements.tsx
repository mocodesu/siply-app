// ─────────────────────────────────────────────────────────────
// app/(main)/achievements.tsx
//
// Layout mirrors reference screen 8: header, hero badge card,
// "All Badges" section label, and the badge list.
// ─────────────────────────────────────────────────────────────
import { AchievementHero } from "@/components/achievement-hero";
import { BadgeRow } from "@/components/badge-row";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useAchievements } from "@/hooks/use-achievements";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * Unit label shown under the hero description. Kept here rather
 * than in the definition because it's presentational copy, not
 * data — a "10 times" phrasing only makes sense for the hero's
 * day-count metric.
 */
const HERO_UNIT_LABEL = "10 times";

export default function AchievementsScreen() {
  const { loading, hero, badges } = useAchievements();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

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
            {badges.map((badge) => (
              <BadgeRow
                key={badge.id}
                title={badge.title}
                description={badge.description}
                icon={badge.icon}
                progress={badge.progress}
                target={badge.target}
                unlocked={badge.unlocked}
                testID={`achievements-badge-${badge.id}`}
              />
            ))}
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
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
  listSection: {
    gap: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.sm,
  },
}));
