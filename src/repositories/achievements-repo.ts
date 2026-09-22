// repositories/achievements-repo.ts
//
// Achievement persistence + live progress computation.
//
// computeAchievements now also returns the subset of achievements
// that flipped from locked to unlocked during this run, so callers
// can celebrate the moment it happens instead of discovering it on
// the next screen visit.
import {
  ACHIEVEMENT_DEFINITIONS,
  HERO_GOAL_THRESHOLD_ML,
  type AchievementIconName,
} from "@/constants/achievements";
import { longestStreak } from "@/utils/streak";
import type { SQLiteDatabase } from "expo-sqlite";

// -------------------------------------------------------------
// Public types
// -------------------------------------------------------------

export interface AchievementView {
  id: string;
  title: string;
  description: string;
  icon: AchievementIconName;
  target: number;
  progress: number;
  unlocked: boolean;
  isHero: boolean;
}

export interface AchievementComputation {
  /** Every achievement, in definition order, with current state. */
  views: AchievementView[];
  /** Achievements that just flipped from locked to unlocked. */
  newlyUnlocked: AchievementView[];
}

interface AchievementRow {
  id: string;
  progress: number;
  target: number;
  unlocked_at: number | null;
}

interface MetricValues {
  "first-log": number;
  "day-goal-hits": number;
  "longest-streak": number;
}

// -------------------------------------------------------------
// Seeding
// -------------------------------------------------------------

async function seedMissingRows(db: SQLiteDatabase): Promise<void> {
  const now = Date.now();
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO achievements
         (id, progress, target, unlocked_at, updated_at)
       VALUES (?, 0, ?, NULL, ?)`,
      def.id,
      def.target,
      now,
    );
  }
}

// -------------------------------------------------------------
// Metric computation
// -------------------------------------------------------------

async function readMetricValues(db: SQLiteDatabase): Promise<MetricValues> {
  const [logCountRow, distinctDayRows, goalHitRows] = await Promise.all([
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM water_logs`,
    ),
    db.getAllAsync<{ day_key: string }>(
      `SELECT DISTINCT day_key FROM water_logs ORDER BY day_key ASC`,
    ),
    db.getAllAsync<{ day_key: string }>(
      `SELECT day_key
         FROM water_logs
        GROUP BY day_key
       HAVING SUM(amount_ml) >= ?`,
      HERO_GOAL_THRESHOLD_ML,
    ),
  ]);

  return {
    "first-log": (logCountRow?.count ?? 0) > 0 ? 1 : 0,
    "day-goal-hits": goalHitRows.length,
    "longest-streak": longestStreak(distinctDayRows.map((r) => r.day_key)),
  };
}

// -------------------------------------------------------------
// Public API
// -------------------------------------------------------------

export const AchievementsRepo = {
  /**
   * Computes live achievement progress, persists it monotonically,
   * and returns the combined view for rendering plus any
   * achievements that unlocked during this call.
   *
   * Two invariants:
   *   1. `progress` never decreases across calls.
   *   2. `unlocked` never flips back to false.
   */
  async computeAchievements(
    db: SQLiteDatabase,
  ): Promise<AchievementComputation> {
    await seedMissingRows(db);

    const [metricValues, rows] = await Promise.all([
      readMetricValues(db),
      db.getAllAsync<AchievementRow>(
        `SELECT id, progress, target, unlocked_at FROM achievements`,
      ),
    ]);

    const existing = new Map(rows.map((row) => [row.id, row]));
    const now = Date.now();
    const views: AchievementView[] = [];
    const newlyUnlocked: AchievementView[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const raw = metricValues[def.metric];
      const capped = Math.min(raw, def.target);

      const previous = existing.get(def.id);
      const bestProgress = Math.max(previous?.progress ?? 0, capped);

      const previouslyUnlocked = (previous?.unlocked_at ?? null) !== null;
      const reachedTargetThisRun = bestProgress >= def.target;
      const isFreshUnlock = !previouslyUnlocked && reachedTargetThisRun;

      const unlocked = previouslyUnlocked || reachedTargetThisRun;
      const unlockedAt = previouslyUnlocked
        ? (previous?.unlocked_at ?? null)
        : reachedTargetThisRun
          ? now
          : null;

      await db.runAsync(
        `UPDATE achievements
            SET progress = ?, target = ?, unlocked_at = ?, updated_at = ?
          WHERE id = ?`,
        bestProgress,
        def.target,
        unlockedAt,
        now,
        def.id,
      );

      const view: AchievementView = {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        target: def.target,
        progress: bestProgress,
        unlocked,
        isHero: def.isHero ?? false,
      };

      views.push(view);
      if (isFreshUnlock) newlyUnlocked.push(view);
    }

    return { views, newlyUnlocked };
  },
};
