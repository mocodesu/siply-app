// ─────────────────────────────────────────────────────────────
// components/cup-card.tsx
//
// Selectable cup-size card: a glass icon with its fill level and
// the amount below. Used on Add Water and Daily Goal.
//
// Selection state is communicated through border, background, and
// text color together — never color alone — so it stays legible
// for color-blind users and in high-contrast mode.
// ─────────────────────────────────────────────────────────────
import { CupIcon } from "@/components/cup-icon";
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface CupCardProps {
  /** Amount this cup represents, in millilitres. */
  amountMl: number;
  /**
   * Largest available cup size, used to compute the icon's fill
   * level so the glasses are visually comparable to each other.
   */
  maxAmountMl: number;
  /** Whether this card is the current selection. */
  selected: boolean;
  /** Press handler — typically sets the parent's selected amount. */
  onPress: () => void;
  /** Test identifier forwarded to the pressable. */
  testID?: string;
}

export function CupCard({
  amountMl,
  maxAmountMl,
  selected,
  onPress,
  testID,
}: CupCardProps) {
  const fillRatio = maxAmountMl > 0 ? amountMl / maxAmountMl : 0;

  return (
    <HapticPressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={`${amountMl} millilitres`}
      accessibilityState={{ selected }}
      style={styles.pressable}
    >
      <View style={[styles.card, selected && styles.cardSelected]}>
        <CupIcon size={36} fillRatio={fillRatio} />
        <Text
          variant="subheadBold"
          color={selected ? "primary" : "onSurface"}
          textAlign="center"
        >
          {amountMl} ml
        </Text>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    flex: 1,
  },
  card: {
    paddingVertical: theme.components.cupCard.paddingVertical,
    paddingHorizontal: theme.components.cupCard.paddingHorizontal,
    borderRadius: theme.components.cupCard.borderRadius,
    borderWidth: theme.components.cupCard.borderWidth,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.components.cupCard.gap,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.panel,
  },
}));
