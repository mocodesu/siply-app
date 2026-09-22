// ─────────────────────────────────────────────────────────────
// app/(main)/add-water.tsx
//
// Unit-aware: cup cards, glass amount, and CTA respect the user's
// chosen units. Storage stays in ml.
// ─────────────────────────────────────────────────────────────
import { CupCard } from "@/components/cup-card";
import { IconButton } from "@/components/icon-button";
import { PrimaryButton } from "@/components/primary-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { WaterFill } from "@/components/water-fill";
import { useHydrationStore } from "@/store/hydration-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatVolume } from "@/utils/format";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const CUP_SIZES_ML = [100, 250, 500] as const;
const DEFAULT_CUP_ML = 250;
const MAX_CUP_ML = 500;
const GLASS_CAPACITY_ML = 500;

export default function AddWaterScreen() {
  const totalMl = useHydrationStore((s) => s.totalMl);
  const addWater = useHydrationStore((s) => s.addWater);
  const units = useSettingsStore((s) => s.units);

  const [selectedMl, setSelectedMl] = useState<number>(DEFAULT_CUP_ML);
  const [isSaved, setIsSaved] = useState(false);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleAdd = useCallback(() => {
    void addWater(selectedMl, selectedMl);
    if (router.canGoBack()) router.back();
  }, [addWater, selectedMl]);

  const handleToggleSaved = useCallback(() => {
    setIsSaved((prev) => !prev);
  }, []);

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="close"
        onPress={handleClose}
        accessibilityLabel="Close"
        testID="add-water-close"
      />
      <IconButton
        name={isSaved ? "bookmark" : "bookmark-outline"}
        onPress={handleToggleSaved}
        accessibilityLabel={isSaved ? "Remove from saved" : "Save this amount"}
        testID="add-water-save"
      />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="add-water-screen">
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Add Water
        </Text>
        <Text variant="subhead" color="mutedText" textAlign="center">
          Today: {formatVolume(totalMl, units)}
        </Text>
      </View>

      <View style={styles.cupRow}>
        {CUP_SIZES_ML.map((ml) => (
          <CupCard
            key={ml}
            amountMl={ml}
            maxAmountMl={MAX_CUP_ML}
            selected={ml === selectedMl}
            onPress={() => setSelectedMl(ml)}
            testID={`add-water-cup-${ml}`}
          />
        ))}
      </View>

      <View style={styles.glassWrapper}>
        <WaterFill
          amount={selectedMl}
          capacity={GLASS_CAPACITY_ML}
          width={170}
          height={230}
          testID="add-water-glass"
        />
      </View>

      <View style={styles.amountBlock}>
        <Text variant="h1" color="primary" textAlign="center">
          + {formatVolume(selectedMl, units)}
        </Text>
        <Text variant="subhead" color="mutedText" textAlign="center">
          Great choice!
        </Text>
      </View>

      <PrimaryButton
        label="Add Water"
        icon="water"
        onPress={handleAdd}
        testID="add-water-submit"
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.layout.minTouchTarget,
  },
  titleBlock: {
    gap: theme.spacing.xxs,
  },
  cupRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  glassWrapper: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  amountBlock: {
    gap: theme.spacing.xxs,
    alignItems: "center",
  },
}));
