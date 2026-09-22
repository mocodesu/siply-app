// ─────────────────────────────────────────────────────────────
// components/tip-card.tsx
//
// Accent-tinted tip block with an icon and two lines of copy.
// Distinct from InfoCard, which is neutral and informational —
// this one is meant to feel like a nudge, so it carries the
// primary accent.
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import { PrimaryIcon } from "@/components/themed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface TipCardProps {
  /** Bold lead-in line, e.g. "Tip: Consistency is key!". */
  title: string;
  /** Supporting sentence under the title. */
  body: string;
  /** Icon shown on the left. Defaults to a lightbulb. */
  icon?: IconName;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function TipCard({
  title,
  body,
  icon = "bulb-outline",
  style,
  testID,
}: TipCardProps) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        <PrimaryIcon name={icon} size={20} />
      </View>

      <View style={styles.textBlock}>
        <Text variant="subheadBold" color="onSurface">
          {title}
        </Text>
        <Text variant="caption" color="mutedText">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
