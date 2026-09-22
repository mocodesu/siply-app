// hooks/use-achievements.ts
//
// Owns the achievements read path. Refetches on focus so returning
// to the screen after logging water shows updated progress.
import {
  AchievementsRepo,
  type AchievementView,
} from "@/repositories/achievements-repo";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

export interface AchievementsResult {
  loading: boolean;
  hero: AchievementView | null;
  badges: AchievementView[];
  refresh: () => Promise<void>;
}

export function useAchievements(): AchievementsResult {
  const db = useSQLiteContext();

  const [state, setState] = useState<{
    loading: boolean;
    achievements: AchievementView[];
  }>({ loading: true, achievements: [] });

  const refresh = useCallback(async () => {
    const { views } = await AchievementsRepo.computeAchievements(db);
    setState({ loading: false, achievements: views });
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
