// ─────────────────────────────────────────────────────────────
// app/(tabs)/settings.tsx — Settings
//
// Every group — Preferences, Reminders, Integrations, Appearance,
// About — now uses the same `SettingsSection` + `SettingRow`
// pattern so the whole screen reads as a single list.
//
// Custom content inside the Appearance group (color swatches,
// theme mode tiles) is wrapped in `SettingsContentRow`, which
// applies the same padding as a row so everything lines up.
// ─────────────────────────────────────────────────────────────
import { ScrollScreen } from "@/components/screen";
import { SettingRow } from "@/components/setting-row";
import {
  SettingsContentRow,
  SettingsSection,
} from "@/components/settings-section";
import Text from "@/components/text";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { useHydrationStore } from "@/store/hydration-store";
import { useRemindersStore } from "@/store/reminders-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  APP_COLOR_SCHEMES,
  type AppColorSchemeId,
} from "@/theme/color-schemes";
import { ThemeMode } from "@/types";
import { formatVolume } from "@/utils/format";
import { unitSuffix } from "@/utils/units";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Theme mode options
// ─────────────────────────────────────────────────────────────

const THEME_MODES: {
  key: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "system", label: "System", icon: "phone-portrait-outline" },
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon" },
];

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { theme } = useUnistyles();

  const { schemeId, mode, selectScheme, selectMode } = useThemePreference();

  const goalMl = useHydrationStore((s) => s.goalMl);
  const smartEnabled = useRemindersStore((s) => s.smartEnabled);
  const setSmartEnabled = useRemindersStore((s) => s.setSmartEnabled);

  const defaultCupSize = useSettingsStore((s) => s.defaultCupSize);
  const units = useSettingsStore((s) => s.units);
  const startDay = useSettingsStore((s) => s.startDay);

  const appVersion = Application.nativeApplicationVersion ?? "—";
  const buildVersion = Application.nativeBuildVersion ?? "—";

  // ── Handlers ────────────────────────────────────────────
  const handleOpenDailyGoal = useCallback(() => {
    router.push("/daily-goal");
  }, []);

  const handleOpenReminders = useCallback(() => {
    router.push("/reminders");
  }, []);

  const handleOpenAchievements = useCallback(() => {
    router.push("/achievements");
  }, []);

  const handleOpenCupSizePicker = useCallback(() => {
    router.push({ pathname: "/picker", params: { setting: "cup-size" } });
  }, []);

  const handleOpenUnitsPicker = useCallback(() => {
    router.push({ pathname: "/picker", params: { setting: "units" } });
  }, []);

  const handleOpenStartDayPicker = useCallback(() => {
    router.push({ pathname: "/picker", params: { setting: "start-day" } });
  }, []);

  const handleOpenPrivacy = useCallback(() => {
    router.push("/legal/privacy");
  }, []);

  const handleOpenTerms = useCallback(() => {
    router.push("/legal/terms");
  }, []);

  const handleSmartToggle = useCallback(
    (value: boolean) => {
      void setSmartEnabled(value);
    },
    [setSmartEnabled],
  );

  return (
    <ScrollScreen testID="settings-screen">
      {/* ── Preferences ─────────────────────────────────── */}
      <SettingsSection title="Preferences" testID="settings-preferences">
        <SettingRow
          label="Daily Goal"
          value={formatVolume(goalMl, units)}
          onPress={handleOpenDailyGoal}
          testID="settings-daily-goal"
        />
        <SettingRow
          label="Default Cup Size"
          value={`${defaultCupSize} ${unitSuffix(units)}`}
          onPress={handleOpenCupSizePicker}
          testID="settings-cup-size"
        />
        <SettingRow
          label="Units"
          value={units === "oz" ? "Fluid ounces" : "Millilitres"}
          onPress={handleOpenUnitsPicker}
          testID="settings-units"
        />
        <SettingRow
          label="Start Day"
          value={startDay === "monday" ? "Monday" : "Sunday"}
          onPress={handleOpenStartDayPicker}
          testID="settings-start-day"
        />
        <SettingRow
          label="Achievements"
          onPress={handleOpenAchievements}
          testID="settings-achievements"
        />
      </SettingsSection>

      {/* ── Reminders ───────────────────────────────────── */}
      <SettingsSection title="Reminders" testID="settings-reminders">
        <SettingRow
          label="Smart Reminders"
          switchValue={smartEnabled}
          onSwitchChange={handleSmartToggle}
          testID="settings-smart-reminders"
          switchTestID="settings-smart-reminders-switch"
        />
        <SettingRow
          label="Reminder Times"
          onPress={handleOpenReminders}
          testID="settings-reminder-times"
        />
      </SettingsSection>

      {/* ── Integrations ────────────────────────────────── */}
      <SettingsSection title="Integrations" testID="settings-integrations">
        <SettingRow
          label="Apple Health"
          value="Coming soon"
          icon="heart"
          testID="settings-apple-health"
        />
        <SettingRow
          label="Google Fit"
          value="Coming soon"
          icon="fitness"
          testID="settings-google-fit"
        />
      </SettingsSection>

      {/* ── Appearance ──────────────────────────────────── */}
      <SettingsSection title="Appearance" testID="settings-appearance">
        {/* App Color — swatch row inside a content row */}
        <SettingsContentRow testID="settings-app-color">
          <View style={styles.labelBlock}>
            <Text variant="subheadBold" color="onSurface">
              App Color
            </Text>
            <Text variant="caption" color="mutedText">
              Choose your accent color scheme
            </Text>
          </View>

          <View style={styles.accentSwatchRow}>
            {APP_COLOR_SCHEMES.map((scheme) => {
              const selected = scheme.id === schemeId;
              return (
                <Pressable
                  key={scheme.id}
                  style={styles.accentSwatchWrapper}
                  onPress={() => selectScheme(scheme.id as AppColorSchemeId)}
                  accessibilityRole="button"
                  accessibilityLabel={scheme.label}
                  accessibilityState={{ selected }}
                  hitSlop={6}
                >
                  <View
                    style={[
                      styles.accentSwatch,
                      { backgroundColor: scheme.tokens.light.primary },
                      selected && styles.accentSwatchSelected,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </SettingsContentRow>

        {/* Theme Mode — tile row inside a content row */}
        <SettingsContentRow testID="settings-theme-mode">
          <View style={styles.labelBlock}>
            <Text variant="subheadBold" color="onSurface">
              Theme Mode
            </Text>
            <Text variant="caption" color="mutedText">
              Choose how the app looks
            </Text>
          </View>

          <View style={styles.themeRow}>
            {THEME_MODES.map((m) => {
              const selected = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  style={[
                    styles.themeOption,
                    selected && styles.themeOptionSelected,
                  ]}
                  onPress={() => selectMode(m.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={m.icon}
                    size={22}
                    color={
                      selected ? theme.colors.primary : theme.colors.onSurface
                    }
                  />
                  <Text
                    variant="subhead"
                    color={selected ? "primary" : "onSurface"}
                  >
                    {m.label}
                  </Text>
                  <View
                    style={[
                      styles.themeRadioDot,
                      selected && styles.themeRadioDotSelected,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </SettingsContentRow>
      </SettingsSection>

      {/* ── About ───────────────────────────────────────── */}
      <SettingsSection title="About" testID="settings-about">
        <SettingRow label="Version" value={appVersion} />
        <SettingRow label="Build" value={buildVersion} />
        <SettingRow
          label="Privacy policy"
          onPress={handleOpenPrivacy}
          testID="settings-privacy"
        />
        <SettingRow
          label="Terms of service"
          onPress={handleOpenTerms}
          testID="settings-terms"
        />
      </SettingsSection>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  // ── Appearance sub-blocks ─────────────────────────────
  labelBlock: {
    gap: theme.spacing.xxs,
  },
  accentSwatchRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xxs,
  },
  accentSwatchWrapper: {
    alignItems: "center",
  },
  accentSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  accentSwatchSelected: {
    borderColor: theme.colors.onSurface,
  },
  themeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xxs,
  },
  themeOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.panelBorder,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
  },
  themeOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.panel,
  },
  themeRadioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.panelBorder,
    marginTop: 2,
  },
  themeRadioDotSelected: {
    backgroundColor: theme.colors.primary,
  },
}));
