// ─────────────────────────────────────────────────────────────
// app/(main)/daily-goal.tsx
//
// Step C:
//   • Edit pencil now resets the slider to the currently saved
//     goal — a real, reversible action instead of a no-op.
//   • "Learn more" navigates to the hydration guide.
//   • Removed the "Edit" text next to Custom Cup Sizes, which had
//     nothing to open — cup sizes are fixed constants.
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
import { feedback } from "@/utils/haptics";
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

  const savedDisplayValue = useMemo(
    () => Math.round(fromMl(currentGoalMl, units)),
    [currentGoalMl, units],
  );

  const [displayValue, setDisplayValue] = useState<number>(savedDisplayValue);

  // Re-sync when the goal changes externally (e.g. from another
  // screen), so a stale slider can't persist after the fact.
  const [syncedFrom, setSyncedFrom] = useState(savedDisplayValue);
  if (syncedFrom !== savedDisplayValue) {
    setSyncedFrom(savedDisplayValue);
    setDisplayValue(savedDisplayValue);
  }

  const hasChanges = displayValue !== savedDisplayValue;

  const selectedPresetKey = useMemo(() => {
    const draftMl = toMl(displayValue, units);
    const match = PRESETS.find(
      (p) => Math.abs(p.ml - draftMl) < Math.max(1, toMl(step, units) / 2),
    );
    return match?.key ?? null;
  }, [displayValue, units, step]);

  // ── Handlers ────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleReset = useCallback(() => {
    if (!hasChanges) return;
    setDisplayValue(savedDisplayValue);
    feedback("selection");
  }, [hasChanges, savedDisplayValue]);

  const handlePresetPress = useCallback(
    (ml: number) => {
      setDisplayValue(Math.round(fromMl(ml, units)));
    },
    [units],
  );

  const handleLearnMore = useCallback(() => {
    router.push("/hydration-guide");
  }, []);

  const handleSave = useCallback(() => {
    void setGoal(toMl(displayValue, units));
    if (router.canGoBack()) router.back();
  }, [setGoal, displayValue, units]);

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="daily-goal-back"
      />
      <IconButton
        name="refresh"
        onPress={handleReset}
        accessibilityLabel="Reset to saved goal"
        testID="daily-goal-reset"
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
        onActionPress={handleLearnMore}
        testID="daily-goal-about"
      />

      <View style={styles.cupSection}>
        <Text variant="subheadBold" color="onSurface">
          Custom Cup Sizes
        </Text>
        <CupSizeGrid sizes={CUP_SIZES_ML} testID="daily-goal-cup-grid" />
      </View>

      <PrimaryButton
        label="Save Goal"
        onPress={handleSave}
        disabled={!hasChanges}
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
}));
