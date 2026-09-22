// ─────────────────────────────────────────────────────────────
// app/(main)/_layout.tsx
//
// The (main) group owns its own <Stack>. Every screen that renders
// after onboarding lives here.
//
// The hydration bootstrap lives here so the store is populated
// before the tab screens mount.
// ─────────────────────────────────────────────────────────────

import { useHydrationBootstrap } from "@/hooks/use-hydration-bootstrap";
import { Stack } from "expo-router";
import { Dimensions, Platform } from "react-native";

const IS_TABLET = (() => {
  if (Platform.OS === "ios") return Platform.isPad;
  const { width, height } = Dimensions.get("window");
  return Math.min(width, height) >= 768;
})();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function MainGroupLayout() {
  useHydrationBootstrap();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        orientation: IS_TABLET ? "all" : "portrait_up",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-water"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
