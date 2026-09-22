// hooks/use-next-reminder.ts
//
// Two hooks that share a single pure computation:
//
//   useNextReminder       -- full details, ticks every minute so
//                            the countdown stays fresh
//   useIsReminderImminent -- boolean only, uses setState bailout
//                            so callers re-render only when the
//                            value flips, not every tick
//
// The ticker is skipped entirely when there are no enabled
// reminders, so the interval cost is zero in the common case.
import type { Reminder } from "@/repositories/reminder-repo";
import {
  selectReminders,
  selectSmartEnabled,
  useRemindersStore,
} from "@/store/reminders-store";
import { formatTime } from "@/utils/format";
import { useEffect, useState } from "react";

const TICK_INTERVAL_MS = 60_000;
const IMMINENT_WINDOW_MS = 60 * 60 * 1000;

export interface NextReminder {
  id: string;
  time: string;
  timeLeft: string;
  firesAt: number;
}

// -------------------------------------------------------------
// Pure computation
// -------------------------------------------------------------

function formatCountdown(msUntil: number): string {
  if (msUntil <= 0) return "now";

  const minutes = Math.round(msUntil / 60_000);
  if (minutes < 60) return `in ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `in ${hours} h`;
  return `in ${hours} h ${remainder} min`;
}

function computeNextReminder(
  reminders: readonly Reminder[],
  smartEnabled: boolean,
  nowMs: number,
): NextReminder | null {
  if (!smartEnabled) return null;

  const today = new Date(nowMs);

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;

    const fireDate = new Date(today);
    fireDate.setHours(reminder.hour, reminder.minute, 0, 0);
    const firesAt = fireDate.getTime();
    if (firesAt <= nowMs) continue;

    return {
      id: reminder.id,
      time: formatTime(fireDate),
      timeLeft: formatCountdown(firesAt - nowMs),
      firesAt,
    };
  }

  return null;
}

// -------------------------------------------------------------
// Full-detail hook
// -------------------------------------------------------------

export function useNextReminder(): NextReminder | null {
  const reminders = useRemindersStore(selectReminders);
  const smartEnabled = useRemindersStore(selectSmartEnabled);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!smartEnabled || reminders.length === 0) return;

    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reminders, smartEnabled]);

  return computeNextReminder(reminders, smartEnabled, now);
}

// -------------------------------------------------------------
// Boolean-only hook
// -------------------------------------------------------------

export function useIsReminderImminent(): boolean {
  const reminders = useRemindersStore(selectReminders);
  const smartEnabled = useRemindersStore(selectSmartEnabled);

  const [imminent, setImminent] = useState(false);

  useEffect(() => {
    if (!smartEnabled || reminders.length === 0) {
      setImminent(false);
      return;
    }

    const check = () => {
      const nowMs = Date.now();
      const next = computeNextReminder(reminders, smartEnabled, nowMs);
      const value = next !== null && next.firesAt - nowMs < IMMINENT_WINDOW_MS;
      // setState bails out when the value is identical, so callers
      // re-render only when the dot needs to appear or disappear.
      setImminent(value);
    };

    check();
    const id = setInterval(check, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reminders, smartEnabled]);

  return imminent;
}
