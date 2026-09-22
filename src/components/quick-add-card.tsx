// ─────────────────────────────────────────────────────────────
// components/quick-add-card.tsx
//
// Full-width card with a floating "+" affordance. The entire card
// is the touch target — the "+" is a visual cue, not a nested
// button — which keeps the accessibility tree flat and makes the
// tap area generous.
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { OnPrimaryIcon } from "@/components/themed";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface QuickAddCardProps {
  /** Tap handler — usually calls the hydration store's addWater. */
  onPress: () => void;
  /** Title shown on the left. */
  title?: string;
  /** Supporting copy shown under the title. */
  description?: string;
  /** Test identifier forwarded to the outer pressable. */
  testID?: string;
  /** Accessibility label override. */
  accessibilityLabel?: string;
}

export function QuickAddCard({
  onPress,
  title = "Add water",
  description = "Logging water is as easy as 1 tap!",
  testID,
  accessibilityLabel,
}: QuickAddCardProps) {
  return (
    <HapticPressable
      testID={testID}
      onPress={onPress}
      haptic="medium"
      accessibilityLabel={accessibilityLabel ?? `${title}. ${description}`}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <View style={[styles.card, pressed && styles.cardPressed]}>
          <View style={styles.textBlock}>
            <Text variant="title" color="onSurface" numberOfLines={1}>
              {title}
            </Text>
            <Text variant="caption" color="mutedText" numberOfLines={2}>
              {description}
            </Text>
          </View>

          <View style={styles.fab}>
            <OnPrimaryIcon name="add" size={28} />
          </View>
        </View>
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    borderRadius: theme.radii.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
  },
  cardPressed: {
    opacity: theme.opacity.pressed,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.semantic.quickAddBackground,
  },
}));
