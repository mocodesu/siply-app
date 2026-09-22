// ─────────────────────────────────────────────────────────────
// app/(main)/add-water.tsx
//
// Modal for logging a glass of water. Reached from the Home
// quick-add card.
//
// Layout mirrors reference screen 2: header, title + today's
// running total, cup-size row, animated glass, amount display,
// primary CTA.
// ─────────────────────────────────────────────────────────────
import { CupCard } from "@/components/cup-card";
import { IconButton } from "@/components/icon-button";
import { PrimaryButton } from "@/components/primary-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { WaterFill } from "@/components/water-fill";
import { useHydrationStore } from "@/store/hydration-store";
import { formatNumber } from "@/utils/format";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Configuration
//
// These are hardcoded for now. When Settings lands, they should be
// read from the preferences table so the user's chosen default and
// cup sizes drive this screen.
// ─────────────────────────────────────────────────────────────

const CUP_SIZES_ML = [100, 250, 500] as const;
const DEFAULT_CUP_ML = 250;
const MAX_CUP_ML = 500;

/** Millilitres the glass illustration represents when full. */
const GLASS_CAPACITY_ML = 500;

export default function AddWaterScreen() {
  const totalMl = useHydrationStore((s) => s.totalMl);
  const addWater = useHydrationStore((s) => s.addWater);

  const [selectedMl, setSelectedMl] = useState<number>(DEFAULT_CUP_ML);
  const [isSaved, setIsSaved] = useState(false);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

  const handleAdd = useCallback(() => {
    // Fire-and-forget: the store refreshes in the background and
    // the modal dismisses immediately so the tap feels instant.
    void addWater(selectedMl, selectedMl);
    if (router.canGoBack()) {
      router.back();
    }
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
      {/* ── Title ───────────────────────────────────────── */}
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Add Water
        </Text>
        <Text variant="subhead" color="mutedText" textAlign="center">
          Today: {formatNumber(totalMl)} ml
        </Text>
      </View>

      {/* ── Cup sizes ───────────────────────────────────── */}
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

      {/* ── Glass illustration ──────────────────────────── */}
      <View style={styles.glassWrapper}>
        <WaterFill
          amount={selectedMl}
          capacity={GLASS_CAPACITY_ML}
          width={170}
          height={230}
          testID="add-water-glass"
        />
      </View>

      {/* ── Amount ──────────────────────────────────────── */}
      <View style={styles.amountBlock}>
        <Text variant="h1" color="primary" textAlign="center">
          + {selectedMl} ml
        </Text>
        <Text variant="subhead" color="mutedText" textAlign="center">
          Great choice!
        </Text>
      </View>

      {/* ── CTA ─────────────────────────────────────────── */}
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
