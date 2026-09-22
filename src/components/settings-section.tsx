// ─────────────────────────────────────────────────────────────
// components/settings-section.tsx
//
// Grouped card with a section title above it and separator lines
// between rows. Mirrors the iOS Settings grouping pattern while
// staying inside the app's own visual language.
//
// Children are rendered as-is; the section only owns the container
// and the dividers. Rows are responsible for their own layout.
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import React, { Children, Fragment } from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface SettingsSectionProps {
  /** Section heading shown above the card, e.g. "Preferences". */
  title: string;
  /** Rows to render inside the card. */
  children: React.ReactNode;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
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
}));
