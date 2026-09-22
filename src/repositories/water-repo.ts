// ─────────────────────────────────────────────────────────────
// repositories/water-repo.ts
// ─────────────────────────────────────────────────────────────
import { dayKeyFromDate } from "@/constants/notifications";
import type { SQLiteDatabase } from "expo-sqlite";

export interface WaterLog {
  id: number;
  amountMl: number;
  loggedAt: number;
  dayKey: string;
  cupSizeMl: number;
  source: string;
}

export interface DailySummary {
  dayKey: string;
  totalMl: number;
  goalMl: number;
  logCount: number;
}

/** Fallback when a day has no explicit goal row. */
export const DEFAULT_GOAL_ML = 2000;

export const WaterRepo = {
  async getDailySummary(
    db: SQLiteDatabase,
    dayKey: string,
  ): Promise<DailySummary> {
    const totalRow = await db.getFirstAsync<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(amount_ml), 0) AS total, COUNT(*) AS count
       FROM water_logs WHERE day_key = ?`,
      dayKey,
    );
    const goalRow = await db.getFirstAsync<{ goal_ml: number }>(
      `SELECT goal_ml FROM daily_goals WHERE day_key = ?`,
      dayKey,
    );

    return {
      dayKey,
      totalMl: totalRow?.total ?? 0,
      goalMl: goalRow?.goal_ml ?? DEFAULT_GOAL_ML,
      logCount: totalRow?.count ?? 0,
    };
  },

  async getRecentLogs(
    db: SQLiteDatabase,
    dayKey: string,
    limit = 20,
  ): Promise<WaterLog[]> {
    const rows = await db.getAllAsync<{
      id: number;
      amount_ml: number;
      logged_at: number;
      day_key: string;
      cup_size_ml: number;
      source: string;
    }>(
      `SELECT id, amount_ml, logged_at, day_key, cup_size_ml, source
       FROM water_logs
       WHERE day_key = ?
       ORDER BY logged_at DESC
       LIMIT ?`,
      dayKey,
      limit,
    );

    return rows.map((r) => ({
      id: r.id,
      amountMl: r.amount_ml,
      loggedAt: r.logged_at,
      dayKey: r.day_key,
      cupSizeMl: r.cup_size_ml,
      source: r.source,
    }));
  },

  /**
   * Returns a map of `day_key` → total ml for every day in the
   * inclusive range that has at least one log. Days with no logs
   * are simply absent from the map — callers fill in zeros.
   */
  async getDailyTotalsInRange(
    db: SQLiteDatabase,
    startDayKey: string,
    endDayKey: string,
  ): Promise<Record<string, number>> {
    const rows = await db.getAllAsync<{ day_key: string; total: number }>(
      `SELECT day_key, SUM(amount_ml) AS total
       FROM water_logs
       WHERE day_key BETWEEN ? AND ?
       GROUP BY day_key`,
      startDayKey,
      endDayKey,
    );

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.day_key] = row.total;
    }
    return map;
  },

  async addWater(
    db: SQLiteDatabase,
    amountMl: number,
    cupSizeMl: number,
    source: string = "manual",
    loggedAt: number = Date.now(),
  ): Promise<WaterLog> {
    const dayKey = dayKeyFromDate(new Date(loggedAt));
    const result = await db.runAsync(
      `INSERT INTO water_logs (amount_ml, logged_at, day_key, cup_size_ml, source)
       VALUES (?, ?, ?, ?, ?)`,
      amountMl,
      loggedAt,
      dayKey,
      cupSizeMl,
      source,
    );

    return {
      id: result.lastInsertRowId,
      amountMl,
      loggedAt,
      dayKey,
      cupSizeMl,
      source,
    };
  },

  async deleteLog(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync(`DELETE FROM water_logs WHERE id = ?`, id);
  },

  async setGoal(
    db: SQLiteDatabase,
    dayKey: string,
    goalMl: number,
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO daily_goals (day_key, goal_ml, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(day_key) DO UPDATE SET goal_ml = excluded.goal_ml`,
      dayKey,
      goalMl,
      Date.now(),
    );
  },
};
