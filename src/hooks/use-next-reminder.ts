// ─────────────────────────────────────────────────────────────
// hooks/use-next-reminder.ts
//
// Derives the next scheduled reminder for today from the reminders
// store. Returns null when Smart Reminders is off, when there are
// no enabled reminders, or when every enabled reminder has already
// fired today.
//
// Recomputes once per minute so the label stays fresh while the
// Home screen is open — enough resolution for a "in 45 min" label
// without burning cycles every second.
// ─────────────────────────────────────────────────────────────
import { useRemindersStore } from "@/store/reminders-store";
import { formatTime } from "@/utils/format";
import { useEffect, useMemo, useState } from "react";

interface NextReminder {
  /** Formatted time of the next reminder, e.g. "10:30 AM". */
  time: string;
  /** Human-friendly countdown, e.g. "in 45 min" or "in 2 h". */
  timeLeft: string;
  /** Epoch millis when the reminder fires. */
  firesAt: number;
}

/** Formats the gap between now and a future timestamp. */
function formatCountdown(msUntil: number): string {
  if (msUntil <= 0) return "now";

  const minutes = Math.round(msUntil / 60000);
  if (minutes < 60) return `in ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `in ${hours} h`;
  return `in ${hours} h ${remainder} min`;
}

export function useNextReminder(): NextReminder | null {
  const reminders = useRemindersStore((s) => s.reminders);
  const smartEnabled = useRemindersStore((s) => s.smartEnabled);

  // Tick once a minute so countdowns stay fresh.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!smartEnabled) return null;

    const enabled = reminders.filter((r) => r.enabled);
    if (enabled.length === 0) return null;

    const today = new Date(now);

    // Build today's occurrences and pick the next one.
    for (const reminder of enabled) {
      const fireDate = new Date(today);
      fireDate.setHours(reminder.hour, reminder.minute, 0, 0);

      const firesAt = fireDate.getTime();
      if (firesAt > now) {
        return {
          time: formatTime(fireDate),
          timeLeft: formatCountdown(firesAt - now),
          firesAt,
        };
      }
    }

    return null;
  }, [reminders, smartEnabled, now]);
}
