// ─────────────────────────────────────────────────────────────
// app/(main)/_layout.tsx
// ─────────────────────────────────────────────────────────────

import { useHydrationBootstrap } from "@/hooks/use-hydration-bootstrap";
import { useRemindersBootstrap } from "@/hooks/use-reminders-bootstrap";
import { useSettingsBootstrap } from "@/hooks/use-settings-bootstrap";
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
  useSettingsBootstrap();

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
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="daily-goal"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="reminders"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="add-reminder"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="picker"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="calendar"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />

      <Stack.Screen
        name="achievements"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
