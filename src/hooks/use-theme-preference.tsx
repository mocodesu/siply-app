// hooks/use-theme-preference.tsx
//
// Theme preference context. Returns schemeId, mode, and the two
// setters. Consumers should only read what they display -- each
// consumer re-renders when the provider value changes, which
// happens on scheme or mode change.
import type { ThemePrefValue } from "@/types";
import { createContext, useContext } from "react";

export const ThemePrefContext = createContext<ThemePrefValue | null>(null);

export function useThemePreference(): ThemePrefValue {
  const ctx = useContext(ThemePrefContext);
  if (!ctx) {
    throw new Error(
      "useThemePreference must be used inside <ThemePreferenceProvider>",
    );
  }
  return ctx;
}
