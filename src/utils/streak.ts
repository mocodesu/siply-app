// ─────────────────────────────────────────────────────────────
// utils/streak.ts
//
// Streak computation from a list of day keys.
//
// Uses local-midnight Date objects and `addDays`/`isSameDay` rather
// than millisecond arithmetic, so DST transitions (where a "day"
// is 23 or 25 hours long) don't break the chain.
//
// Duplicate keys are tolerated — the caller usually feeds this from
// a `SELECT DISTINCT`, but the algorithm is correct either way.
// ─────────────────────────────────────────────────────────────
import { addDays, isSameDay, parseDayKey } from "@/utils/date";

/**
 * Longest run of consecutive calendar days present in `dayKeys`.
 *
 * Returns 0 for an empty input and 1 for a single day. Days need not
 * be sorted or unique on input.
 */
export function longestStreak(dayKeys: readonly string[]): number {
  if (dayKeys.length === 0) return 0;

  const sorted = [...dayKeys].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const previous = parseDayKey(sorted[i - 1]);
    const today = parseDayKey(sorted[i]);

    // Duplicate day — treat as the same link in the chain.
    if (isSameDay(today, previous)) continue;

    if (isSameDay(today, addDays(previous, 1))) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}
