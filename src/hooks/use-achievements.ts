// ─────────────────────────────────────────────────────────────
// hooks/use-achievements.ts
//
// Owns the achievements read path. Refetches on focus so returning
// to the screen after logging water shows updated progress without
// a manual refresh.
//
// `loading` is true only for the very first read. Subsequent focus
// refetches keep the previous data on screen and swap it in when
// the new read resolves — no flicker, no flash of zeros.
// ─────────────────────────────────────────────────────────────
import {
  AchievementsRepo,
  type AchievementView,
} from "@/repositories/achievements-repo";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

export interface AchievementsResult {
  /** True only until the first read resolves. */
  loading: boolean;
  /** The hero achievement, or null before the first read. */
  hero: AchievementView | null;
  /** Every non-hero achievement, in definition order. */
  badges: AchievementView[];
  /** Manual refresh — rarely needed since focus handles it. */
  refresh: () => Promise<void>;
}

export function useAchievements(): AchievementsResult {
  const db = useSQLiteContext();

  const [state, setState] = useState<{
    loading: boolean;
    achievements: AchievementView[];
  }>({ loading: true, achievements: [] });

  const refresh = useCallback(async () => {
    const achievements = await AchievementsRepo.computeAchievements(db);
    setState({ loading: false, achievements });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const hero = state.achievements.find((a) => a.isHero) ?? null;
  const badges = state.achievements.filter((a) => !a.isHero);

  return {
    loading: state.loading,
    hero,
    badges,
    refresh,
  };
}
