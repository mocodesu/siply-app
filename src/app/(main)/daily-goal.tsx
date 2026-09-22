// ─────────────────────────────────────────────────────────────
// app/(main)/daily-goal.tsx
//
// Modal for reviewing and changing the daily hydration goal.
//
// Layout mirrors reference screen 3: header with back + edit,
// amount display, slider, preset chips, About card, custom cup
// sizes, and the Save CTA.
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
import { formatNumber } from "@/utils/format";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const CUP_SIZES_ML = [100, 250, 500] as const;

interface Preset {
  key: string;
  value: number;
  label: string;
}

const PRESETS: readonly Preset[] = [
  { key: "light", value: 1500, label: "Light" },
  { key: "recommended", value: 2000, label: "Recommended" },
  { key: "active", value: 2500, label: "Active" },
];

const SLIDER_MIN = 500;
const SLIDER_MAX = 5000;
const SLIDER_STEP = 100;

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function DailyGoalScreen() {
  const currentGoalMl = useHydrationStore((s) => s.goalMl);
  const setGoal = useHydrationStore((s) => s.setGoal);

  const [draftGoalMl, setDraftGoalMl] = useState<number>(currentGoalMl);
  const [isEditing, setIsEditing] = useState(false);

  const selectedPresetKey = useMemo(() => {
    const match = PRESETS.find((p) => p.value === draftGoalMl);
    return match?.key ?? null;
  }, [draftGoalMl]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

  const handleToggleEdit = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const handlePresetPress = useCallback((value: number) => {
    setDraftGoalMl(value);
  }, []);

  const handleSliderChange = useCallback((value: number) => {
    setDraftGoalMl(value);
  }, []);

  const handleSave = useCallback(() => {
    void setGoal(draftGoalMl);
    if (router.canGoBack()) {
      router.back();
    }
  }, [setGoal, draftGoalMl]);

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="daily-goal-back"
      />
      <IconButton
        name={isEditing ? "checkmark" : "pencil"}
        onPress={handleToggleEdit}
        accessibilityLabel={isEditing ? "Done editing" : "Edit goal"}
        testID="daily-goal-edit"
      />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="daily-goal-screen">
      {/* ── Title ───────────────────────────────────────── */}
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Daily Goal
        </Text>
      </View>

      {/* ── Amount ──────────────────────────────────────── */}
      <View style={styles.amountBlock}>
        <Text variant="h1" color="primary" textAlign="center">
          {formatNumber(draftGoalMl)} ml
        </Text>
        <Text variant="subhead" color="mutedText" textAlign="center">
          Your daily goal
        </Text>
      </View>

      {/* ── Slider ──────────────────────────────────────── */}
      <GoalSlider
        value={draftGoalMl}
        minimumValue={SLIDER_MIN}
        maximumValue={SLIDER_MAX}
        step={SLIDER_STEP}
        onValueChange={handleSliderChange}
        testID="daily-goal-slider"
      />

      {/* ── Presets ─────────────────────────────────────── */}
      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <PresetChip
            key={preset.key}
            value={`${formatNumber(preset.value)} ml`}
            label={preset.label}
            selected={preset.key === selectedPresetKey}
            onPress={() => handlePresetPress(preset.value)}
            testID={`daily-goal-preset-${preset.key}`}
          />
        ))}
      </View>

      {/* ── About ───────────────────────────────────────── */}
      <InfoCard
        title="About your goal"
        body="The amount of water you should drink daily can vary based on your weight, activity level and climate."
        actionLabel="Learn more"
        onActionPress={() => {
          // Opens the legal/about flow in a later step.
        }}
        testID="daily-goal-about"
      />

      {/* ── Custom cup sizes ────────────────────────────── */}
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

      {/* ── CTA ─────────────────────────────────────────── */}
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
