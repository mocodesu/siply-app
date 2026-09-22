// ─────────────────────────────────────────────────────────────
// repositories/reminder-repo.ts
// ─────────────────────────────────────────────────────────────
import type { SQLiteDatabase } from "expo-sqlite";

export interface Reminder {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  notificationId: string | null;
  createdAt: number;
}

interface ReminderRow {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: number;
  notification_id: string | null;
  created_at: number;
}

const mapRow = (row: ReminderRow): Reminder => ({
  id: row.id,
  label: row.label,
  hour: row.hour,
  minute: row.minute,
  enabled: row.enabled === 1,
  notificationId: row.notification_id,
  createdAt: row.created_at,
});

/**
 * Default schedule seeded on first launch. Matches the reference
 * design's reminder list. Times are local; the OS handles DST.
 */
const SEED_REMINDERS: Omit<Reminder, "notificationId" | "createdAt">[] = [
  { id: "rem-0900", label: "9:00 AM", hour: 9, minute: 0, enabled: true },
  { id: "rem-1130", label: "11:30 AM", hour: 11, minute: 30, enabled: true },
  { id: "rem-1400", label: "2:00 PM", hour: 14, minute: 0, enabled: true },
  { id: "rem-1630", label: "4:30 PM", hour: 16, minute: 30, enabled: true },
  { id: "rem-1900", label: "7:00 PM", hour: 19, minute: 0, enabled: true },
];

export const ReminderRepo = {
  async seedIfEmpty(db: SQLiteDatabase): Promise<void> {
    const existing = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM reminders`,
    );
    if ((existing?.count ?? 0) > 0) return;

    const now = Date.now();
    for (const r of SEED_REMINDERS) {
      await db.runAsync(
        `INSERT INTO reminders (id, label, hour, minute, enabled, notification_id, created_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?)`,
        r.id,
        r.label,
        r.hour,
        r.minute,
        r.enabled ? 1 : 0,
        now,
      );
    }
  },

  async getAll(db: SQLiteDatabase): Promise<Reminder[]> {
    const rows = await db.getAllAsync<ReminderRow>(
      `SELECT id, label, hour, minute, enabled, notification_id, created_at
       FROM reminders
       ORDER BY hour ASC, minute ASC`,
    );
    return rows.map(mapRow);
  },

  async setEnabled(
    db: SQLiteDatabase,
    id: string,
    enabled: boolean,
  ): Promise<void> {
    await db.runAsync(
      `UPDATE reminders SET enabled = ? WHERE id = ?`,
      enabled ? 1 : 0,
      id,
    );
  },

  async setNotificationId(
    db: SQLiteDatabase,
    id: string,
    notificationId: string | null,
  ): Promise<void> {
    await db.runAsync(
      `UPDATE reminders SET notification_id = ? WHERE id = ?`,
      notificationId,
      id,
    );
  },

  async insert(
    db: SQLiteDatabase,
    reminder: Omit<Reminder, "notificationId" | "createdAt">,
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO reminders (id, label, hour, minute, enabled, notification_id, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`,
      reminder.id,
      reminder.label,
      reminder.hour,
      reminder.minute,
      reminder.enabled ? 1 : 0,
      Date.now(),
    );
  },

  async remove(db: SQLiteDatabase, id: string): Promise<void> {
    await db.runAsync(`DELETE FROM reminders WHERE id = ?`, id);
  },
};

// ─────────────────────────────────────────────────────────────
// Reminder preferences (key/value)
// ─────────────────────────────────────────────────────────────

export const REMINDER_SMART_ENABLED_KEY = "reminders.smartEnabled";

export const ReminderPrefsRepo = {
  async getSmartEnabled(db: SQLiteDatabase): Promise<boolean> {
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM reminder_preferences WHERE key = ?`,
      REMINDER_SMART_ENABLED_KEY,
    );
    // Default to true — matches the reference design's "on" state.
    return row?.value !== "false";
  },

  async setSmartEnabled(db: SQLiteDatabase, enabled: boolean): Promise<void> {
    await db.runAsync(
      `INSERT INTO reminder_preferences (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
      REMINDER_SMART_ENABLED_KEY,
      enabled ? "true" : "false",
      Date.now(),
    );
  },
};
