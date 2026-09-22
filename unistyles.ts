// ─────────────────────────────────────────────────────────────
// unistyles.ts
// ─────────────────────────────────────────────────────────────
import {
  APP_COLOR_SCHEMES,
  AppColorSchemeId,
  DEFAULT_SCHEME_ID,
} from "@/theme/color-schemes";
import { FONT_FAMILY } from "@/theme/fonts";
import { StyleSheet } from "react-native-unistyles";

// ═══════════════════════════════════════════════════════════
//  BASE UNIT
// ═══════════════════════════════════════════════════════════
export const BASE_GAP = 4;

// ═══════════════════════════════════════════════════════════
//  COLOR SCHEME RESOLUTION
// ═══════════════════════════════════════════════════════════

export const COLOR_SCHEME_STORAGE_KEY = "app-color-scheme";
export const COLOR_MODE_STORAGE_KEY = "app-color-mode";

const resolveColorScheme = (schemeId: AppColorSchemeId = DEFAULT_SCHEME_ID) =>
  APP_COLOR_SCHEMES.find((scheme) => scheme.id === schemeId) ??
  APP_COLOR_SCHEMES.find((scheme) => scheme.id === DEFAULT_SCHEME_ID)!;

/**
 * Widened palette shape. `APP_COLOR_SCHEMES` is declared `as const`,
 * so every color value is inferred as a string literal (e.g.
 * `"#2563EB"`). Widening to `string` here lets light and dark
 * palettes from any scheme be assigned to the same variable — which
 * is what `buildTheme` and `buildSemanticColors` need.
 */
export type ColorPalette = {
  primary: string;
  primaryIllumination: string;
  secondary: string;
  onPrimary: string;
  onSecondary: string;
  tertiary: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  panel: string;
  panelBorder: string;
  mutedText: string;
  active: string;
  activeSurface: string;
  activeField: string;
  inactive: string;
  inactiveSurface: string;
  danger: string;
  dangerIllumination: string;
  darkKey: string;
  darkKeyIllumination: string;
};

export const createLightColors = (
  schemeId: AppColorSchemeId = DEFAULT_SCHEME_ID,
): ColorPalette => resolveColorScheme(schemeId).tokens.light;

export const createDarkColors = (
  schemeId: AppColorSchemeId = DEFAULT_SCHEME_ID,
): ColorPalette => resolveColorScheme(schemeId).tokens.dark;

export const Colors: ColorPalette = createLightColors(DEFAULT_SCHEME_ID);
export const DarkColors: ColorPalette = createDarkColors(DEFAULT_SCHEME_ID);

// ═══════════════════════════════════════════════════════════
//  PRIMITIVE TOKENS
// ═══════════════════════════════════════════════════════════

// ── SPACING ────────────────────────────────────────────────
export const SPACE = {
  none: 0,
  xxs: BASE_GAP * 0.5, //  2.5
  xs: BASE_GAP * 1, //  5
  sm: BASE_GAP * 1.5, //  7.5
  md: BASE_GAP * 2, // 10
  lg: BASE_GAP * 3, // 15
  xl: BASE_GAP * 4, // 20
  xxl: BASE_GAP * 5, // 25
  xxxl: BASE_GAP * 6, // 30
  huge: BASE_GAP * 8, // 40
  giant: BASE_GAP * 10, // 50
} as const;

// ── RADII ──────────────────────────────────────────────────
export const RADII = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

// ── BORDER WIDTH ───────────────────────────────────────────
export const BORDER = {
  none: 0,
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 2,
  heavy: 3,
} as const;

// ── OPACITY ────────────────────────────────────────────────
export const OPACITY = {
  disabled: 0.4,
  pressed: 0.7,
  muted: 0.6,
  faint: 0.15,
  overlay: 0.5,
  full: 1,
} as const;

// ── DURATION (ms) ──────────────────────────────────────────
export const DURATION = {
  instant: 80,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,
} as const;

// ── ICON SIZES ─────────────────────────────────────────────
export const ICON = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── TYPOGRAPHY ─────────────────────────────────────────────
export const TYPE = {
  display: {
    fontFamily: FONT_FAMILY.extraBold,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  bodyBold: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  callout: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  subhead: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  subheadBold: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  footnote: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  micro: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.6,
  },
  cookingStep: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  cookingTimer: {
    fontFamily: FONT_FAMILY.extraLight,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.5,
  },
} as const;

// ── ELEVATION ──────────────────────────────────────────────
export const ELEVATION = {
  none: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ── LAYOUT ─────────────────────────────────────────────────
export const LAYOUT = {
  screenPaddingH: SPACE.lg,
  screenPaddingV: SPACE.md,
  cardPadding: SPACE.md,
  sectionGap: SPACE.xl,
  listGap: SPACE.md,
  contentMaxWidth: 640,
  contentMaxWidthTablet: 760,
  contentMaxWidthWide: 1200,
  hitSlop: SPACE.sm,
  minTouchTarget: 44,
} as const;

// ═══════════════════════════════════════════════════════════
//  SEMANTIC COLOR ROLES (hydration domain)
// ═══════════════════════════════════════════════════════════
//
// These roles are resolved per-scheme in `buildSemanticColors`.
// Every role maps to an existing palette token, so all six colour
// schemes work without new base colours.

type SemanticColorRoles = {
  // ── Hydration progress ────────────────────────────────
  /** Arc + fill for the daily progress ring. */
  progressRing: string;
  /** Unfilled track behind the progress ring. */
  progressRingTrack: string;
  /** Water fill inside the animated glass / drop. */
  waterFill: string;
  /** Water surface highlight (lighter wave crest). */
  waterSurfaceHighlight: string;
  /** Water body shadow (darker wave trough). */
  waterBodyShadow: string;

  // ── Goal states ───────────────────────────────────────
  /** Goal reached / above target. */
  goalMet: string;
  /** Soft background behind a met-goal badge. */
  goalMetSurface: string;
  /** Slightly under target. */
  goalNear: string;
  /** Soft background behind a near-goal badge. */
  goalNearSurface: string;
  /** Well under target. */
  goalLow: string;
  /** Soft background behind a low-goal badge. */
  goalLowSurface: string;

  // ── Charts ────────────────────────────────────────────
  /** Default bar in a bar chart. */
  chartBar: string;
  /** Highlighted bar (e.g. today, best day). */
  chartBarHighlight: string;
  /** Muted bar for days with no data. */
  chartBarMuted: string;
  /** Horizontal grid lines behind charts. */
  chartGridLine: string;
  /** Axis labels. */
  chartAxisLabel: string;

  // ── Quick-add / action surfaces ───────────────────────
  /** Background of the floating quick-add FAB. */
  quickAddBackground: string;
  /** Icon colour inside the quick-add FAB. */
  quickAddIcon: string;

  // ── Reminder card ─────────────────────────────────────
  /** Background of the next-reminder card on Home. */
  reminderCardBackground: string;
  /** Border of the next-reminder card. */
  reminderCardBorder: string;
  /** Icon tint inside the reminder card. */
  reminderIcon: string;

  // ── Badges / achievements ─────────────────────────────
  /** Locked badge background. */
  badgeLocked: string;
  /** Locked badge border. */
  badgeLockedBorder: string;
  /** Unlocked badge background. */
  badgeUnlocked: string;
  /** Unlocked badge border. */
  badgeUnlockedBorder: string;

  // ── Premium ───────────────────────────────────────────
  /** Premium hero gradient start. */
  premiumGradientStart: string;
  /** Premium hero gradient end. */
  premiumGradientEnd: string;
  /** Premium CTA background. */
  premiumCtaBackground: string;
  /** Premium CTA label. */
  premiumCtaLabel: string;
};

/**
 * Builds the semantic colour roles for a given palette. Called once
 * per light/dark theme at module load and again on scheme change.
 */
export const buildSemanticColors = (palette: {
  primary: string;
  primaryIllumination: string;
  active: string;
  activeSurface: string;
  inactive: string;
  inactiveSurface: string;
  danger: string;
  dangerIllumination: string;
  background: string;
  surface: string;
  onSurface: string;
  panel: string;
  panelBorder: string;
  mutedText: string;
  onPrimary: string;
  tertiary: string;
  darkKey: string;
  darkKeyIllumination: string;
}): SemanticColorRoles => ({
  // ── Hydration progress ────────────────────────────────
  progressRing: palette.primary,
  progressRingTrack: palette.panel,
  waterFill: palette.primary,
  waterSurfaceHighlight: palette.primaryIllumination,
  waterBodyShadow: palette.darkKeyIllumination,

  // ── Goal states ───────────────────────────────────────
  goalMet: palette.active,
  goalMetSurface: palette.activeSurface,
  goalNear: palette.inactive,
  goalNearSurface: palette.inactiveSurface,
  goalLow: palette.danger,
  goalLowSurface: palette.dangerIllumination,

  // ── Charts ────────────────────────────────────────────
  chartBar: palette.primary,
  chartBarHighlight: palette.primaryIllumination,
  chartBarMuted: palette.panelBorder,
  chartGridLine: palette.panelBorder,
  chartAxisLabel: palette.mutedText,

  // ── Quick-add / action surfaces ───────────────────────
  quickAddBackground: palette.primary,
  quickAddIcon: palette.onPrimary,

  // ── Reminder card ─────────────────────────────────────
  reminderCardBackground: palette.panel,
  reminderCardBorder: palette.panelBorder,
  reminderIcon: palette.primary,

  // ── Badges / achievements ─────────────────────────────
  badgeLocked: palette.panel,
  badgeLockedBorder: palette.panelBorder,
  badgeUnlocked: palette.activeSurface,
  badgeUnlockedBorder: palette.active,

  // ── Premium ───────────────────────────────────────────
  premiumGradientStart: palette.primary,
  premiumGradientEnd: palette.tertiary,
  premiumCtaBackground: palette.primary,
  premiumCtaLabel: palette.onPrimary,
});

// ═══════════════════════════════════════════════════════════
//  COMPONENT TOKENS (hydration domain)
// ═══════════════════════════════════════════════════════════
//
// Component tokens describe a specific UI treatment in one place.
// Screens reference `theme.components.cupCard` instead of repeating
// radius, padding, and border values.

const components = {
  // ── Cup-size card (Add Water, Daily Goal) ─────────────
  cupCard: {
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.lg,
    borderWidth: BORDER.thin,
    iconSize: ICON.xxl,
    gap: SPACE.xs,
  },

  // ── Stat card (Home, Weekly Summary, History) ─────────
  statCard: {
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: BORDER.thin,
    gap: SPACE.xxs,
    iconSize: ICON.md,
  },

  // ── Setting row (Settings, Reminders) ─────────────────
  settingRow: {
    minHeight: LAYOUT.minTouchTarget,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
    gap: SPACE.md,
    chevronSize: ICON.sm,
  },

  // ── Badge row (Achievements) ──────────────────────────
  badgeRow: {
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: BORDER.thin,
    gap: SPACE.md,
    iconSize: ICON.xl,
  },

  // ── Segmented control (Weekly Summary, Statistics) ────
  segmentedControl: {
    padding: BASE_GAP * 0.75,
    borderRadius: RADII.md,
    segmentPaddingVertical: SPACE.xs,
    segmentPaddingHorizontal: SPACE.md,
  },

  // ── Primary CTA button ────────────────────────────────
  primaryButton: {
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADII.md,
    minHeight: LAYOUT.minTouchTarget,
    iconSize: ICON.md,
  },

  // ── Circular progress ring ────────────────────────────
  progressRing: {
    defaultSize: 200,
    strokeWidth: 14,
    trackStrokeWidth: 14,
  },

  // ── Bar chart ─────────────────────────────────────────
  barChart: {
    defaultHeight: 160,
    barRadius: RADII.sm,
    barGap: SPACE.sm,
    axisHeight: 24,
  },
} as const;

// ═══════════════════════════════════════════════════════════
//  THEME OBJECTS
// ═══════════════════════════════════════════════════════════
const commonTokens = {
  gap: (v: number) => v * BASE_GAP,
  paddingHorizontal: LAYOUT.screenPaddingH,

  spacing: { ...SPACE },
  radii: { ...RADII },
  borderWidth: BORDER,
  opacity: OPACITY,
  duration: DURATION,
  iconSize: ICON,
  typography: TYPE,
  elevation: ELEVATION,
  layout: LAYOUT,
  components,
} as const;

const buildTheme = (colors: typeof Colors, isDark: boolean) => ({
  isDark,
  colors,
  semantic: buildSemanticColors(colors),
  ...commonTokens,
});

const lightTheme = buildTheme(Colors, false);
const darkTheme = buildTheme(DarkColors, true);

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

const breakpoints = {
  phone: 0,
  largePhone: 400,
  tablet: 768,
  largeTablet: 1024,
} as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  settings: {
    adaptiveThemes: true,
    nativeBreakpointsMode: "pixels",
    CSSVars: true,
  },
  themes: appThemes,
  breakpoints,
});

// ═══════════════════════════════════════════════════════════
//  PUBLIC TYPES
// ═══════════════════════════════════════════════════════════
export type AppTheme = typeof lightTheme;
export type AppColorTokens = typeof Colors;
export type AppSemanticTokens = AppTheme["semantic"];
export type AppComponentTokens = AppTheme["components"];
export type AppTypographyToken = keyof typeof TYPE;
export type AppSpaceToken = keyof typeof SPACE;
export type AppRadiusToken = keyof typeof RADII;
export type AppElevationToken = keyof typeof ELEVATION;
