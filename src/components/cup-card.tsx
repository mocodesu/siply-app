// ─────────────────────────────────────────────────────────────
// components/cup-card.tsx
//
// Unit-aware — displays the amount in the user's chosen unit.
// ─────────────────────────────────────────────────────────────
import { CupIcon } from "@/components/cup-icon";
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { useSettingsStore } from "@/store/settings-store";
import { formatVolumeValue } from "@/utils/format";
import { unitSuffix } from "@/utils/units";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface CupCardProps {
  amountMl: number;
  maxAmountMl: number;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export function CupCard({
  amountMl,
  maxAmountMl,
  selected,
  onPress,
  testID,
}: CupCardProps) {
  const units = useSettingsStore((s) => s.units);
  const fillRatio = maxAmountMl > 0 ? amountMl / maxAmountMl : 0;
  const displayValue = formatVolumeValue(amountMl, units);

  return (
    <HapticPressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={`${displayValue} ${unitSuffix(units)}`}
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
          {displayValue} {unitSuffix(units)}
        </Text>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: { flex: 1 },
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
