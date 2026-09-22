// app/(tabs)/settings.tsx
//
// Composed of six independent sections. Each subscribes to exactly
// the state it renders:
//
//   SettingsPreferences   -- goal, cup size, units, start day
//   SettingsReminders     -- smart-enabled toggle only
//   SettingsIntegrations  -- no subscriptions, static
//   SettingsAppearance    -- theme context only
//   SettingsAbout         -- version info captured once
//
// No useUnistyles in this screen. Icon colors come from the
// withUnistyles-wrapped variants in @/components/themed.
import { ScrollScreen } from "@/components/screen";
import { SettingRow } from "@/components/setting-row";
import {
  SettingsContentRow,
  SettingsSection,
} from "@/components/settings-section";
import Text from "@/components/text";
import { PrimaryIcon, SurfaceIcon } from "@/components/themed";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { selectGoalMl, useHydrationStore } from "@/store/hydration-store";
import { selectSmartEnabled, useRemindersStore } from "@/store/reminders-store";
import {
  selectDefaultCupSize,
  selectStartDay,
  selectUnits,
  useSettingsStore,
} from "@/store/settings-store";
import {
  APP_COLOR_SCHEMES,
  type AppColorSchemeId,
} from "@/theme/color-schemes";
import type { ThemeMode } from "@/types";
import { formatVolume } from "@/utils/format";
import { unitSuffix } from "@/utils/units";
import type { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// -------------------------------------------------------------
// Static data
// -------------------------------------------------------------

type IconName = keyof typeof Ionicons.glyphMap;

interface ThemeModeOption {
  key: ThemeMode;
  label: string;
  icon: IconName;
}

const THEME_MODES: readonly ThemeModeOption[] = [
  { key: "system", label: "System", icon: "phone-portrait-outline" },
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon" },
];

// -------------------------------------------------------------
// Module-scope navigation handlers
//
// Stable references. React Compiler memoizes per component, but
// module-scope is free and unambiguous.
// -------------------------------------------------------------

const goToDailyGoal = () => router.push("/daily-goal");
const goToReminders = () => router.push("/reminders");
const goToAchievements = () => router.push("/achievements");
const goToPrivacy = () => router.push("/legal/privacy");
const goToTerms = () => router.push("/legal/terms");
const goToCupSizePicker = () =>
  router.push({ pathname: "/picker", params: { setting: "cup-size" } });
const goToUnitsPicker = () =>
  router.push({ pathname: "/picker", params: { setting: "units" } });
const goToStartDayPicker = () =>
  router.push({ pathname: "/picker", params: { setting: "start-day" } });

// -------------------------------------------------------------
// Screen
// -------------------------------------------------------------

export default function SettingsScreen() {
  return (
    <ScrollScreen testID="settings-screen">
      <SettingsPreferences />
      <SettingsReminders />
      <SettingsIntegrations />
      <SettingsAppearance />
      <SettingsAbout />
    </ScrollScreen>
  );
}

// -------------------------------------------------------------
// Preferences
//
// Subscribes to goalMl, defaultCupSize, units, startDay. Does not
// re-render when theme changes, when Smart Reminders toggles, or
// when version info is captured.
// -------------------------------------------------------------

function SettingsPreferences() {
  const goalMl = useHydrationStore(selectGoalMl);
  const defaultCupSize = useSettingsStore(selectDefaultCupSize);
  const units = useSettingsStore(selectUnits);
  const startDay = useSettingsStore(selectStartDay);

  const goalLabel = formatVolume(goalMl, units);
  const cupSizeLabel = `${defaultCupSize} ${unitSuffix(units)}`;
  const unitsLabel = units === "oz" ? "Fluid ounces" : "Millilitres";
  const startDayLabel = startDay === "monday" ? "Monday" : "Sunday";

  return (
    <SettingsSection title="Preferences" testID="settings-preferences">
      <SettingRow
        label="Daily Goal"
        value={goalLabel}
        onPress={goToDailyGoal}
        testID="settings-daily-goal"
      />
      <SettingRow
        label="Default Cup Size"
        value={cupSizeLabel}
        onPress={goToCupSizePicker}
        testID="settings-cup-size"
      />
      <SettingRow
        label="Units"
        value={unitsLabel}
        onPress={goToUnitsPicker}
        testID="settings-units"
      />
      <SettingRow
        label="Start Day"
        value={startDayLabel}
        onPress={goToStartDayPicker}
        testID="settings-start-day"
      />
      <SettingRow
        label="Achievements"
        onPress={goToAchievements}
        testID="settings-achievements"
      />
    </SettingsSection>
  );
}

// -------------------------------------------------------------
// Reminders
//
// Subscribes to smartEnabled only.
// -------------------------------------------------------------

function SettingsReminders() {
  const smartEnabled = useRemindersStore(selectSmartEnabled);
  const setSmartEnabled = useRemindersStore((s) => s.setSmartEnabledLocal);

  const handleToggle = (value: boolean) => {
    void setSmartEnabled(value);
  };

  return (
    <SettingsSection title="Reminders" testID="settings-reminders">
      <SettingRow
        label="Smart Reminders"
        switchValue={smartEnabled}
        onSwitchChange={handleToggle}
        testID="settings-smart-reminders"
        switchTestID="settings-smart-reminders-switch"
      />
      <SettingRow
        label="Reminder Times"
        onPress={goToReminders}
        testID="settings-reminder-times"
      />
    </SettingsSection>
  );
}

// -------------------------------------------------------------
// Integrations
//
// No subscriptions. Renders once.
// -------------------------------------------------------------

function SettingsIntegrations() {
  return (
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
  );
}

// -------------------------------------------------------------
// Appearance
//
// The only section that consumes theme context. Re-renders on
// scheme or mode change and nothing else.
//
// Icon colors come from withUnistyles-wrapped variants, so this
// screen never calls useUnistyles directly.
// -------------------------------------------------------------

function SettingsAppearance() {
  const { schemeId, mode, selectScheme, selectMode } = useThemePreference();

  return (
    <SettingsSection title="Appearance" testID="settings-appearance">
      <SettingsContentRow testID="settings-app-color">
        <View style={styles.labelBlock}>
          <Text variant="subheadBold" color="onSurface">
            App Color
          </Text>
          <Text variant="caption" color="mutedText">
            Choose your accent color scheme
          </Text>
        </View>

        <View style={styles.swatchRow}>
          {APP_COLOR_SCHEMES.map((scheme) => (
            <AppColorSwatch
              key={scheme.id}
              schemeId={scheme.id as AppColorSchemeId}
              color={scheme.tokens.light.primary}
              label={scheme.label}
              selected={scheme.id === schemeId}
              onSelect={selectScheme}
            />
          ))}
        </View>
      </SettingsContentRow>

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
          {THEME_MODES.map((option) => (
            <ThemeModeTile
              key={option.key}
              mode={option.key}
              label={option.label}
              icon={option.icon}
              selected={option.key === mode}
              onSelect={selectMode}
            />
          ))}
        </View>
      </SettingsContentRow>
    </SettingsSection>
  );
}

// -------------------------------------------------------------
// App Color swatch
//
// Each swatch re-renders only when its own selected flag changes.
// Because React Compiler memoizes on props, a selection change
// re-renders exactly two swatches: the one losing selection and
// the one gaining it.
// -------------------------------------------------------------

interface AppColorSwatchProps {
  schemeId: AppColorSchemeId;
  color: string;
  label: string;
  selected: boolean;
  onSelect: (id: AppColorSchemeId) => void;
}

function AppColorSwatch({
  schemeId,
  color,
  label,
  selected,
  onSelect,
}: AppColorSwatchProps) {
  const handlePress = () => onSelect(schemeId);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={6}
    >
      <View
        style={
          selected
            ? [styles.swatch, styles.swatchSelected, { backgroundColor: color }]
            : [styles.swatch, { backgroundColor: color }]
        }
      />
    </Pressable>
  );
}

// -------------------------------------------------------------
// Theme Mode tile
//
// Uses PrimaryIcon when selected, SurfaceIcon when not. Both are
// withUnistyles-wrapped, so no theme hook is needed here.
// -------------------------------------------------------------

interface ThemeModeTileProps {
  mode: ThemeMode;
  label: string;
  icon: IconName;
  selected: boolean;
  onSelect: (mode: ThemeMode) => void;
}

function ThemeModeTile({
  mode,
  label,
  icon,
  selected,
  onSelect,
}: ThemeModeTileProps) {
  const handlePress = () => onSelect(mode);

  return (
    <Pressable
      style={selected ? [styles.tile, styles.tileSelected] : styles.tile}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {selected ? (
        <PrimaryIcon name={icon} size={22} />
      ) : (
        <SurfaceIcon name={icon} size={22} />
      )}

      <Text variant="subhead" color={selected ? "primary" : "onSurface"}>
        {label}
      </Text>

      <View
        style={
          selected
            ? [styles.radioDot, styles.radioDotSelected]
            : styles.radioDot
        }
      />
    </Pressable>
  );
}

// -------------------------------------------------------------
// About
//
// Version info captured once at mount. Static thereafter.
// -------------------------------------------------------------

function SettingsAbout() {
  const [appVersion] = useState(
    () => Application.nativeApplicationVersion ?? "—",
  );
  const [buildVersion] = useState(() => Application.nativeBuildVersion ?? "—");

  return (
    <SettingsSection title="About" testID="settings-about">
      <SettingRow label="Version" value={appVersion} />
      <SettingRow label="Build" value={buildVersion} />
      <SettingRow
        label="Privacy policy"
        onPress={goToPrivacy}
        testID="settings-privacy"
      />
      <SettingRow
        label="Terms of service"
        onPress={goToTerms}
        testID="settings-terms"
      />
    </SettingsSection>
  );
}

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------

const styles = StyleSheet.create((theme) => ({
  labelBlock: {
    gap: theme.spacing.xxs,
  },
  swatchRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xxs,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: theme.colors.onSurface,
  },
  themeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xxs,
  },
  tile: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.panelBorder,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
  },
  tileSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.panel,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.panelBorder,
    marginTop: 2,
  },
  radioDotSelected: {
    backgroundColor: theme.colors.primary,
  },
}));
