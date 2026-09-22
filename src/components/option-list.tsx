// ─────────────────────────────────────────────────────────────
// components/option-list.tsx
//
// Radio list for a modal picker. The selected option carries a
// checkmark on the right; the whole row is the touch target.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { PrimaryIcon } from "@/components/themed";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface OptionListItem {
  /** Stable value the caller receives on selection. */
  value: string;
  /** Display label. */
  label: string;
  /** Optional secondary line under the label. */
  description?: string;
}

export interface OptionListProps {
  /** Options to render, top to bottom. */
  options: readonly OptionListItem[];
  /** Currently selected value, or null. */
  value: string | null;
  /** Fires when an option is tapped. */
  onSelect: (value: string) => void;
  /** Test identifier prefix forwarded to each row. */
  testIDPrefix?: string;
}

export function OptionList({
  options,
  value,
  onSelect,
  testIDPrefix,
}: OptionListProps) {
  return (
    <View style={styles.list}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <HapticPressable
            key={option.value}
            testID={
              testIDPrefix ? `${testIDPrefix}-${option.value}` : undefined
            }
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            haptic="selection"
          >
            <View style={[styles.row, selected && styles.rowSelected]}>
              <View style={styles.textBlock}>
                <Text
                  variant="subheadBold"
                  color={selected ? "primary" : "onSurface"}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text variant="caption" color="mutedText">
                    {option.description}
                  </Text>
                )}
              </View>

              {selected && <PrimaryIcon name="checkmark" size={22} />}
            </View>
          </HapticPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: {
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: theme.layout.minTouchTarget + 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.surface,
  },
  rowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.panel,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
