// ─────────────────────────────────────────────────────────────
// app/(main)/_layout.tsx
//
// The (main) group owns its own <Stack>. Every screen that renders
// after onboarding lives here.
//
// Both bootstrap hooks live here so the hydration and reminder
// stores are populated before any screen mounts.
// ─────────────────────────────────────────────────────────────

import { useHydrationBootstrap } from "@/hooks/use-hydration-bootstrap";
import { useRemindersBootstrap } from "@/hooks/use-reminders-bootstrap";
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
  useRemindersBootstrap();

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
      <Stack.Screen
        name="daily-goal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="reminders"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
