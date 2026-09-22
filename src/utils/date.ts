// ─────────────────────────────────────────────────────────────
// utils/date.ts
//
// Date helpers. Kept separate from `utils/format.ts` so string
// formatting and date maths don't entangle.
//
// Everything here works on local time. The app never crosses time
// zones mid-day because it's a personal tracker, not a scheduler
// coordinating across regions.
// ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAY_SHORT = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

/** Returns a new Date `days` away from `date`. Negative goes back. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Zeroes out the time component so two dates on the same day compare equal. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True when both dates fall on the same calendar day, local time. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True when `date` is strictly after `reference`, ignoring time. */
export function isAfterDay(date: Date, reference: Date): boolean {
  return startOfDay(date).getTime() > startOfDay(reference).getTime();
}

/**
 * Parses a `"YYYY-MM-DD"` day key into a local-midnight Date.
 *
 * Constructed with the numeric `(year, monthIndex, day)` overload
 * rather than `new Date(string)`, because the string form is parsed
 * as UTC and would shift the day in any non-UTC timezone.
 */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** `"May 19, 2024"` — long, unambiguous, matches the reference design. */
export function formatDateLong(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** `"Sun, May 19"` — compact, used in secondary labels. */
export function formatDateShort(date: Date): string {
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    date.getDay()
  ];
  return `${weekday}, ${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

// ─────────────────────────────────────────────────────────────
// Period helpers (used by the Statistics screen)
// ─────────────────────────────────────────────────────────────

/** Monday-based start of the week containing `date`. */
export function getStartOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

/** Sunday-based end of the week containing `date`. */
export function getEndOfWeek(date: Date): Date {
  return addDays(getStartOfWeek(date), 6);
}

/** Every calendar day from `start` to `end`, inclusive. */
export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(start);
  const last = startOfDay(end);
  while (current.getTime() <= last.getTime()) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

/** Weekday label for a bar in the week view. */
export function weekdayShort(date: Date): string {
  const index = (date.getDay() + 6) % 7; // Monday = 0
  return WEEKDAY_SHORT[index];
}

/** Short month label for a bar in the year view. */
export function monthShort(monthIndex: number): string {
  return MONTH_SHORT[monthIndex] ?? "";
}
