// ─────────────────────────────────────────────────────────────
// app/(main)/_layout.tsx
//
// The (main) group owns its own <Stack>. Every screen that renders
// after onboarding lives here, with its own presentation and
// animation options. The root layout is now a thin shell that only
// mounts this group plus global providers.
//
// Tablet/phone orientation policy also lives here, since it applies
// to every screen in this group.
// ─────────────────────────────────────────────────────────────

import { Stack } from "expo-router";
import { Dimensions, Platform } from "react-native";

// ─────────────────────────────────────────────────────────────
// Device-class detection — computed once at module load
//
// iOS: Platform.isPad is synchronous and authoritative — including
//      iPad mini, which has a portrait width of 744pt (below the
//      768 breakpoint other libraries use).
//
// Android: no synchronous "is tablet" API. The shorter dimension at
// launch is a reliable proxy — phones never exceed ~450pt in their
// shorter dimension, tablets never fall below ~700pt. Using min()
// means a tablet held in landscape at launch is still detected.
// ─────────────────────────────────────────────────────────────
const IS_TABLET = (() => {
  if (Platform.OS === "ios") return Platform.isPad;
  const { width, height } = Dimensions.get("window");
  return Math.min(width, height) >= 768;
})();

// The first screen to render when this navigator mounts. Without
// this, expo-router picks the alphabetically-first route, which
// would open `create-exercise` (a modal) on cold start.
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function MainGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Phones are portrait-only. Tablets rotate freely.
        // Enforced by react-native-screens via the `orientation`
        // option — the recommended path per the Expo docs.
        orientation: IS_TABLET ? "all" : "portrait_up",
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
