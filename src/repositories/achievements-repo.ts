// ─────────────────────────────────────────────────────────────
// repositories/achievements-repo.ts
//
// Achievement persistence + live progress computation.
//
// The DB only stores `progress`, `target`, `unlocked_at`, and
// `updated_at`. Progress is a cache — the authoritative value is
// recomputed from `water_logs` on every read. `unlocked_at` is the
// one field with real persistence semantics: it's written once and
// never cleared, so achievements survive data deletion.
// ─────────────────────────────────────────────────────────────
import {
  ACHIEVEMENT_DEFINITIONS,
  HERO_GOAL_THRESHOLD_ML,
  type AchievementIconName,
} from "@/constants/achievements";
import { longestStreak } from "@/utils/streak";
import type { SQLiteDatabase } from "expo-sqlite";

// ─────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────

export interface AchievementView {
  id: string;
  title: string;
  description: string;
  icon: AchievementIconName;
  /** Value at which the badge unlocks. */
  target: number;
  /** Best-ever progress, capped at `target`. Monotonic. */
  progress: number;
  /** True once `progress` has ever reached `target`. Sticky. */
  unlocked: boolean;
  /** Renders in the hero slot rather than the badge list. */
  isHero: boolean;
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

// ─────────────────────────────────────────────────────────────
// Seeding
// ─────────────────────────────────────────────────────────────

/**
 * Inserts a row for any achievement definition that doesn't already
 * have one. Uses `INSERT OR IGNORE` so existing rows (and their
 * `unlocked_at` timestamps) are never touched. Safe to call on
 * every read — it's a no-op once the table is populated.
 */
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

// ─────────────────────────────────────────────────────────────
// Metric computation
// ─────────────────────────────────────────────────────────────

/**
 * Reads every raw number the achievements layer needs in a single
 * pass. Three queries in parallel rather than one per achievement,
 * so adding a new badge costs nothing at read time.
 */
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

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export const AchievementsRepo = {
  /**
   * Computes live achievement progress, persists it monotonically,
   * and returns the combined view for rendering.
   *
   * Two invariants the caller can rely on:
   *
   *   1. `progress` never decreases across calls. It's the best-ever
   *      value, so deleting old logs can't walk a badge backwards.
   *
   *   2. `unlocked` never flips back to false. Once `unlocked_at` is
   *      set, it stays set regardless of later data changes.
   *
   * The returned array preserves `ACHIEVEMENT_DEFINITIONS` order.
   */
  async computeAchievements(db: SQLiteDatabase): Promise<AchievementView[]> {
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

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const raw = metricValues[def.metric];
      const capped = Math.min(raw, def.target);

      const previous = existing.get(def.id);
      const bestProgress = Math.max(previous?.progress ?? 0, capped);

      const previouslyUnlocked = (previous?.unlocked_at ?? null) !== null;
      const reachedTargetThisRun = bestProgress >= def.target;

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

      views.push({
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        target: def.target,
        progress: bestProgress,
        unlocked,
        isHero: def.isHero ?? false,
      });
    }

    return views;
  },
};
