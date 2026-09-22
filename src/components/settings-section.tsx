// ─────────────────────────────────────────────────────────────
// components/settings-section.tsx
//
// Grouped card with a section title above it and separator lines
// between rows. Also exports `SettingsContentRow` for custom
// content that needs to sit inside the group at the same padding
// as a `SettingRow`.
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import React, { Children, Fragment } from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function SettingsSection({
  title,
  children,
  style,
  testID,
}: SettingsSectionProps) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View testID={testID} style={[styles.section, style]}>
      <Text variant="subheadBold" color="mutedText" style={styles.title}>
        {title}
      </Text>

      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {row}
            {index < rows.length - 1 && <View style={styles.divider} />}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export interface SettingsContentRowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Wrapper for custom content inside a `SettingsSection`. Applies
 * the same horizontal and vertical padding as a `SettingRow` so the
 * content aligns with the rest of the group.
 */
export function SettingsContentRow({
  children,
  style,
  testID,
}: SettingsContentRowProps) {
  return (
    <View testID={testID} style={[styles.contentRow, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.sm,
  },
  title: {
    paddingHorizontal: theme.spacing.xxs,
  },
  card: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    overflow: "hidden",
  },
  divider: {
    height: theme.borderWidth.hairline,
    marginLeft: theme.spacing.md,
    backgroundColor: theme.colors.panelBorder,
  },
  contentRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
}));
