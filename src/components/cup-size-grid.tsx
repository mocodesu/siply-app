// ─────────────────────────────────────────────────────────────
// components/cup-size-grid.tsx
//
// Read-only grid of the user's configured cup sizes, shown on the
// Daily Goal screen under "Custom Cup Sizes". Editing lands in the
// Settings step; for now this is display-only.
// ─────────────────────────────────────────────────────────────
import { CupIcon } from "@/components/cup-icon";
import Text from "@/components/text";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface CupSizeGridProps {
  /** Cup sizes in millilitres, in display order. */
  sizes: readonly number[];
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function CupSizeGrid({ sizes, testID }: CupSizeGridProps) {
  const maxSize = sizes.length > 0 ? Math.max(...sizes) : 1;

  return (
    <View testID={testID} style={styles.row}>
      {sizes.map((ml) => (
        <View key={ml} style={styles.cell}>
          <CupIcon size={32} fillRatio={ml / maxSize} />
          <Text variant="caption" color="mutedText" textAlign="center">
            {ml} ml
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  cell: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
}));
