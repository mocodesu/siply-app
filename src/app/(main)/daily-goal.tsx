// ─────────────────────────────────────────────────────────────
// app/(main)/daily-goal.tsx
//
// Now unit-aware: slider, presets, and displayed amount all
// respect the user's chosen units. Storage stays in ml.
// ─────────────────────────────────────────────────────────────
import { CupSizeGrid } from "@/components/cup-size-grid";
import { GoalSlider } from "@/components/goal-slider";
import { IconButton } from "@/components/icon-button";
import { InfoCard } from "@/components/info-card";
import { PresetChip } from "@/components/preset-chip";
import { PrimaryButton } from "@/components/primary-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { useHydrationStore } from "@/store/hydration-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatVolume, formatVolumeValue } from "@/utils/format";
import {
  fromMl,
  maxGoalForUnit,
  minGoalForUnit,
  stepForUnit,
  toMl,
  unitSuffix,
} from "@/utils/units";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const CUP_SIZES_ML = [100, 250, 500] as const;

interface PresetDef {
  key: string;
  ml: number;
  label: string;
}

const PRESETS: readonly PresetDef[] = [
  { key: "light", ml: 1500, label: "Light" },
  { key: "recommended", ml: 2000, label: "Recommended" },
  { key: "active", ml: 2500, label: "Active" },
];

export default function DailyGoalScreen() {
  const currentGoalMl = useHydrationStore((s) => s.goalMl);
  const setGoal = useHydrationStore((s) => s.setGoal);
  const units = useSettingsStore((s) => s.units);

  const minValue = minGoalForUnit(units);
  const maxValue = maxGoalForUnit(units);
  const step = stepForUnit(units);

  // Slider value is kept in the display unit.
  const [displayValue, setDisplayValue] = useState<number>(() =>
    Math.round(fromMl(currentGoalMl, units)),
  );

  const selectedPresetKey = useMemo(() => {
    const draftMl = toMl(displayValue, units);
    const match = PRESETS.find(
      (p) => Math.abs(p.ml - draftMl) < Math.max(1, toMl(step, units) / 2),
    );
    return match?.key ?? null;
  }, [displayValue, units, step]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handlePresetPress = useCallback(
    (ml: number) => {
      setDisplayValue(Math.round(fromMl(ml, units)));
    },
    [units],
  );

  const handleSave = useCallback(() => {
    void setGoal(toMl(displayValue, units));
    if (router.canGoBack()) router.back();
  }, [setGoal, displayValue, units]);

  const handleNoop = useCallback(() => {
    // Edit mode toggling is a future refinement.
  }, []);

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="daily-goal-back"
      />
      <IconButton
        name="pencil"
        onPress={handleNoop}
        accessibilityLabel="Edit goal"
        testID="daily-goal-edit"
      />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="daily-goal-screen">
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Daily Goal
        </Text>
      </View>

      <View style={styles.amountBlock}>
        <Text variant="h1" color="primary" textAlign="center">
          {formatVolumeValue(toMl(displayValue, units), units)}{" "}
          {unitSuffix(units)}
        </Text>
        <Text variant="subhead" color="mutedText" textAlign="center">
          Your daily goal
        </Text>
      </View>

      <GoalSlider
        value={displayValue}
        minimumValue={minValue}
        maximumValue={maxValue}
        step={step}
        onValueChange={setDisplayValue}
        testID="daily-goal-slider"
        accessibilityLabel="Daily goal"
      />

      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <PresetChip
            key={preset.key}
            value={formatVolume(preset.ml, units)}
            label={preset.label}
            selected={preset.key === selectedPresetKey}
            onPress={() => handlePresetPress(preset.ml)}
            testID={`daily-goal-preset-${preset.key}`}
          />
        ))}
      </View>

      <InfoCard
        title="About your goal"
        body="The amount of water you should drink daily can vary based on your weight, activity level and climate."
        actionLabel="Learn more"
        onActionPress={handleNoop}
        testID="daily-goal-about"
      />

      <View style={styles.cupSection}>
        <View style={styles.cupHeader}>
          <Text variant="subheadBold" color="onSurface">
            Custom Cup Sizes
          </Text>
          <Text variant="subheadBold" color="primary">
            Edit
          </Text>
        </View>
        <CupSizeGrid sizes={CUP_SIZES_ML} testID="daily-goal-cup-grid" />
      </View>

      <PrimaryButton
        label="Save Goal"
        onPress={handleSave}
        testID="daily-goal-save"
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
    alignItems: "center",
  },
  amountBlock: {
    alignItems: "center",
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.md,
  },
  presetRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  cupSection: {
    gap: theme.spacing.sm,
  },
  cupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));
