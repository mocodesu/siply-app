// ─────────────────────────────────────────────────────────────
// utils/format.ts
//
// Locale-independent formatters. Intl is unreliable across the
// Hermes/JSC/Android matrix, so these are hand-rolled.
// ─────────────────────────────────────────────────────────────

import { fromMl, unitSuffix, type VolumeUnit } from "@/utils/units";

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

/**
 * Renders a stored millilitre value in the user's chosen unit,
 * with a suffix. `formatVolume(1250, "oz")` → `"42 oz"`.
 *
 * Oz values are rounded to the nearest whole ounce because
 * fractional ounces read as false precision on a hydration app.
 */
export function formatVolume(ml: number, unit: VolumeUnit): string {
  const value = fromMl(ml, unit);
  const rounded = unit === "oz" ? Math.round(value) : Math.round(value);
  return `${formatNumber(rounded)} ${unitSuffix(unit)}`;
}

/**
 * Same as `formatVolume` but without the unit suffix. Useful for
 * large displays where the unit is shown separately, like the
 * hydration ring's centre.
 */
export function formatVolumeValue(ml: number, unit: VolumeUnit): string {
  const value = fromMl(ml, unit);
  return formatNumber(unit === "oz" ? Math.round(value) : value);
}
