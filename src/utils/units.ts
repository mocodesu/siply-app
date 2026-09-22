// ─────────────────────────────────────────────────────────────
// utils/units.ts
//
// Volume unit conversion. The database always stores millilitres;
// this module is the only place that knows how to present or
// accept values in another unit.
//
// The conversion factor is the US customary fluid ounce. It's
// deliberately hardcoded rather than imported from a locale data
// source because the app supports a single "oz" unit — if you
// ever add UK imperial ounces, this is the file to change.
// ─────────────────────────────────────────────────────────────

export type VolumeUnit = "ml" | "oz";

/** US customary fluid ounce in millilitres. */
const ML_PER_OZ = 29.5735;

/** Converts millilitres to ounces. */
export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

/** Converts ounces to millilitres. */
export function ozToMl(oz: number): number {
  return oz * ML_PER_OZ;
}

/**
 * Converts a stored millilitre value into the given unit's numeric
 * value. Does not round — use `formatVolume` for display, or round
 * explicitly at the call site if the value is going back into a
 * numeric control.
 */
export function fromMl(ml: number, unit: VolumeUnit): number {
  return unit === "oz" ? mlToOz(ml) : ml;
}

/**
 * Converts a value expressed in `unit` back into millilitres, for
 * persistence. Rounds to the nearest whole millilitre so the DB
 * never stores fractional values.
 */
export function toMl(value: number, unit: VolumeUnit): number {
  return Math.round(unit === "oz" ? ozToMl(value) : value);
}

/** Short suffix appended to displayed volumes. */
export function unitSuffix(unit: VolumeUnit): string {
  return unit === "oz" ? "oz" : "ml";
}

/**
 * Numeric step used by sliders and +/- controls, expressed in the
 * user's unit. A 100 ml step is close enough to 4 oz that the two
 * feel equally granular.
 */
export function stepForUnit(unit: VolumeUnit): number {
  return unit === "oz" ? 4 : 100;
}

/** Minimum selectable value for the goal slider, in the user's unit. */
export function minGoalForUnit(unit: VolumeUnit): number {
  return unit === "oz" ? 16 : 500;
}

/** Maximum selectable value for the goal slider, in the user's unit. */
export function maxGoalForUnit(unit: VolumeUnit): number {
  return unit === "oz" ? 168 : 5000;
}
