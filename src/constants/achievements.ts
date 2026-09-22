// ─────────────────────────────────────────────────────────────
// constants/achievements.ts
//
// Single source of truth for every achievement: id, copy, icon,
// target, and how progress is derived.
//
// Progress is never stored as the authoritative value — it's
// recomputed from `water_logs` on every screen focus. The DB only
// tracks `unlocked_at` (the timestamp a badge was first earned),
// which is monotonic so deleting old logs can't re-lock a badge.
// ─────────────────────────────────────────────────────────────
import { Ionicons } from "@expo/vector-icons";

/** Ionicons name union — narrows to the glyphs the icon set actually ships. */
export type AchievementIconName = keyof typeof Ionicons.glyphMap;

/**
 * How an achievement's progress is computed. Each metric maps to a
 * single number derived from the water-logs table.
 *
 *   first-log        → 1 once any log exists, else 0
 *   day-goal-hits    → count of days where the day's total ≥ 2,000 ml
 *   longest-streak   → longest run of consecutive days with ≥1 log
 */
export type AchievementMetric =
  | "first-log"
  | "day-goal-hits"
  | "longest-streak";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: AchievementIconName;
  /** Value at which the badge unlocks. */
  target: number;
  metric: AchievementMetric;
  /** Renders this achievement in the hero slot at the top of the screen. */
  isHero?: boolean;
}

/**
 * Threshold used by the `day-goal-hits` metric. Deliberately fixed
 * at 2,000 ml to match the badge's own description, so changing the
 * user's daily goal doesn't silently redefine what "Hydration Hero"
 * means.
 */
export const HERO_GOAL_THRESHOLD_ML = 2000;

/** Ordered exactly as the reference design presents them. */
export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: "hero",
    title: "Hydration Hero",
    description: "Drink 2,000 ml in a day",
    icon: "trophy",
    target: 10,
    metric: "day-goal-hits",
    isHero: true,
  },
  {
    id: "first-drop",
    title: "First Drop",
    description: "Log your first glass",
    icon: "water",
    target: 1,
    metric: "first-log",
  },
  {
    id: "streak-3",
    title: "3-Day Streak",
    description: "Drink daily for 3 days",
    icon: "flame",
    target: 3,
    metric: "longest-streak",
  },
  {
    id: "streak-7",
    title: "7-Day Streak",
    description: "Drink daily for 7 days",
    icon: "flame",
    target: 7,
    metric: "longest-streak",
  },
  {
    id: "streak-14",
    title: "14-Day Streak",
    description: "Drink daily for 14 days",
    icon: "flame",
    target: 14,
    metric: "longest-streak",
  },
  {
    id: "streak-30",
    title: "Hydration Master",
    description: "30-Day Streak",
    icon: "trophy",
    target: 30,
    metric: "longest-streak",
  },
];
