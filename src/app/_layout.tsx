// ─────────────────────────────────────────────────────────────
// app/_layout.tsx
// ─────────────────────────────────────────────────────────────
import ThemedSystemBars from "@/components/themed-system-bars";
import { initializeDatabase } from "@/db/client";
import { useRetentionReminders } from "@/hooks/use-retention-reminders";
import { APP_FONT_MAP } from "@/theme/fonts";

import { ThemePreferenceProvider } from "@/components/theme-preferences-provider";
import { APP_NAME } from "@/constants";
import { handleExpoUpdateMetadata } from "@/utils/expo-update-metadata";
import { initializeUpdateChannel } from "@/utils/retention-reminder";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useNavigationContainerRef } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native-unistyles";
import { sentryConfig } from "../../sentry.config";

// Keep the splash screen up until fonts are ready. Must run at module
// scope, before the first render, otherwise the OS auto-hides it.
SplashScreen.preventAutoHideAsync().catch(() => {
  // A rejection here just means the splash was already hidden —
  // safe to ignore.
});

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});
Sentry.init(sentryConfig);
handleExpoUpdateMetadata();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const unstable_settings = {
  initialRouteName: "(main)/(tabs)",
};

const RootLayout = () => {
  useRetentionReminders();

  const navigationRef = useNavigationContainerRef();

  const [fontsLoaded, fontError] = useFonts(APP_FONT_MAP);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initializeUpdateChannel().catch((error) => {
      console.error("Failed to set up the update notification channel:", error);
    });

    if (navigationRef?.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  // Nothing paints until the fonts resolve (or fail). The splash
  // screen covers this window, so the user never sees a flash of
  // system-font text.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SQLiteProvider
        databaseName={`${APP_NAME}.db`}
        onInit={initializeDatabase}
      >
        <ThemePreferenceProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(main)" />
            <Stack.Screen
              name="legal/[document]"
              options={{
                presentation: "modal",
                animation: "slide_from_right",
              }}
            />
          </Stack>
          <ThemedSystemBars />
        </ThemePreferenceProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  container: { flex: 1 },
});
