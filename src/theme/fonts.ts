// ─────────────────────────────────────────────────────────────
// theme/fonts.ts
//
// Single source of truth for every font family name and the
// runtime `useFonts` map consumed by the root layout.
//
// Font files are baked into specific weights (e.g. Nunito_600SemiBold
// IS the 600-weight file), so we never set `fontWeight` alongside a
// custom font family — that combination resolves incorrectly on
// Android. The Text component handles weight overrides by swapping
// the font family instead.
// ─────────────────────────────────────────────────────────────

import {
  Nunito_200ExtraLight,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

/** PostScript-style names registered by `useFonts`. */
export const FONT_FAMILY = {
  extraLight: "Nunito_200ExtraLight",
  regular: "Nunito_400Regular",
  medium: "Nunito_500Medium",
  semibold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extraBold: "Nunito_800ExtraBold",
} as const;

/** Map passed directly to `useFonts` in the root layout. */
export const APP_FONT_MAP = {
  Nunito_200ExtraLight,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} as const;

/** Weight key → font family name. Used by Text for weight overrides. */
export const FONT_FAMILY_BY_WEIGHT = {
  light: FONT_FAMILY.regular,
  regular: FONT_FAMILY.regular,
  medium: FONT_FAMILY.medium,
  semibold: FONT_FAMILY.semibold,
  bold: FONT_FAMILY.bold,
} as const;

export type FontWeightKey = keyof typeof FONT_FAMILY_BY_WEIGHT;
