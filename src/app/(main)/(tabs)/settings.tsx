import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useThemePreference } from "@/hooks/use-theme-preference";
import {
  APP_COLOR_SCHEMES,
  type AppColorSchemeId,
} from "@/theme/color-schemes";
import { ThemeMode } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// ---------- Theme modes (mirrors THEME_MODES in appsettings.tsx) ----------
const THEME_MODES: {
  key: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "system", label: "System", icon: "phone-portrait-outline" },
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon" },
];

export default function SettingsScreen() {
  const { theme } = useUnistyles();
  const db = useSQLiteContext();

  const { schemeId, mode, selectScheme, selectMode } = useThemePreference();

  // ── Version info ────────────────────────────────────────
  const appVersion = Application.nativeApplicationVersion ?? "—";
  const buildVersion = Application.nativeBuildVersion ?? "—";

  return (
    <ScrollScreen>
      {/* ── APPEARANCE ───────────────────────────────────── */}
      <View style={styles.card}>
        <Text variant="title" color="onSurface">
          Appearance
        </Text>

        {/* ── App Color (scheme picker) ─────────────────── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
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
        </View>

        <View style={styles.divider} />

        {/* ── Theme Mode (mode picker) ──────────────────── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
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
        </View>
      </View>

      {/* ── ABOUT ────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text variant="title" color="onSurface">
          About
        </Text>

        <View style={styles.aboutRow}>
          <Text variant="subhead" color="mutedText">
            Version
          </Text>
          <Text variant="subheadBold" color="onSurface">
            {appVersion}
          </Text>
        </View>

        <View style={styles.aboutRow}>
          <Text variant="subhead" color="mutedText">
            Build
          </Text>
          <Text variant="subheadBold" color="onSurface">
            {buildVersion}
          </Text>
        </View>

        <View style={styles.aboutRow}>
          <Text variant="subhead" color="mutedText">
            Made with ❤️ by
          </Text>
          <Text variant="subheadBold" color="onSurface">
            Mocodesu
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/legal/privacy")}
          hitSlop={8}
          style={({ pressed }) => [styles.aboutLink, pressed && styles.pressed]}
        >
          <Text variant="subhead" color="primary">
            Privacy policy
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.primary}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push("/legal/terms")}
          hitSlop={8}
          style={({ pressed }) => [styles.aboutLink, pressed && styles.pressed]}
        >
          <Text variant="subhead" color="primary">
            Terms of service
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.primary}
          />
        </Pressable>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: rt.insets.top,
  },
  content: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.giant,
    gap: theme.spacing.lg,
  },

  // ── Cards ─────────────────────────────────────────────
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  rowText: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  textButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },

  // ── Buttons ───────────────────────────────────────────
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.sm,
  },
  pressed: { opacity: theme.opacity.pressed },
  disabled: { opacity: theme.opacity.disabled },

  // ── Appearance ────────────────────────────────────────
  sectionBlock: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    gap: theme.spacing.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.panelBorder,
  },

  // Theme-mode tiles (mirrors `themeOption` in appsettings.tsx)
  themeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
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

  // Accent swatches (mirrors `accentSwatch*` in appsettings.tsx)
  accentSwatchRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
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

  // ── About ─────────────────────────────────────────────
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aboutLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
  },
}));
