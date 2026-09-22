// ─────────────────────────────────────────────────────────────
// utils/format.ts
//
// Locale-independent formatters. Intl is unreliable across the
// Hermes/JSC/Android matrix, so these are hand-rolled.
// ─────────────────────────────────────────────────────────────

/**
 * Thousands separator. `1250` → `"1,250"`.
 *
 * Note: only handles non-negative integers, which is all the
 * hydration domain needs.
 */
export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 12-hour clock with a padded minute. `18:05` → `"6:05 PM"`.
 * Midnight and noon resolve to `"12:00 AM"` / `"12:00 PM"`.
 */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}
