// ─────────────────────────────────────────────────────────────
// app/(main)/picker.tsx
//
// Generic option picker modal. Reads a `setting` query param that
// selects which preference to edit, renders a radio list, writes
// to the settings store on selection, and dismisses.
//
// One modal serves all three pickers (cup size, units, start day)
// because they share the same shape: a flat list of string values.
// Adding a fourth picker means adding an entry to PICKERS below —
// no new route, no new screen.
// ─────────────────────────────────────────────────────────────
import { IconButton } from "@/components/icon-button";
import { OptionList, type OptionListItem } from "@/components/option-list";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import type { CupSizeMl, StartDay, Units } from "@/repositories/settings-repo";
import { useSettingsStore } from "@/store/settings-store";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Picker definitions
// ─────────────────────────────────────────────────────────────

type PickerType = "cup-size" | "units" | "start-day";

interface PickerConfig {
  title: string;
  options: readonly OptionListItem[];
}

const PICKERS: Record<PickerType, PickerConfig> = {
  "cup-size": {
    title: "Default Cup Size",
    options: [
      { value: "100", label: "100 ml", description: "Small glass" },
      { value: "250", label: "250 ml", description: "Standard glass" },
      { value: "500", label: "500 ml", description: "Large bottle" },
    ],
  },
  units: {
    title: "Units",
    options: [
      { value: "ml", label: "Millilitres", description: "Metric (ml)" },
      { value: "oz", label: "Fluid ounces", description: "Imperial (oz)" },
    ],
  },
  "start-day": {
    title: "Start Day",
    options: [
      { value: "monday", label: "Monday" },
      { value: "sunday", label: "Sunday" },
    ],
  },
};

function isPickerType(value: unknown): value is PickerType {
  return value === "cup-size" || value === "units" || value === "start-day";
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function PickerScreen() {
  const params = useLocalSearchParams<{ setting?: string }>();
  const setting: PickerType = isPickerType(params.setting)
    ? params.setting
    : "cup-size";

  const config = PICKERS[setting];

  // ── Current values from the store ───────────────────────
  const cupSize = useSettingsStore((s) => s.defaultCupSize);
  const units = useSettingsStore((s) => s.units);
  const startDay = useSettingsStore((s) => s.startDay);
  const setDefaultCupSize = useSettingsStore((s) => s.setDefaultCupSize);
  const setUnits = useSettingsStore((s) => s.setUnits);
  const setStartDay = useSettingsStore((s) => s.setStartDay);

  const currentValue =
    setting === "cup-size"
      ? String(cupSize)
      : setting === "units"
        ? units
        : startDay;

  // ── Handlers ────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      if (setting === "cup-size") {
        void setDefaultCupSize(Number(value) as CupSizeMl);
      } else if (setting === "units") {
        void setUnits(value as Units);
      } else {
        void setStartDay(value as StartDay);
      }
      if (router.canGoBack()) router.back();
    },
    [setting, setDefaultCupSize, setUnits, setStartDay],
  );

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="picker-back"
      />
      <Text
        variant="title"
        color="onBackground"
        textAlign="center"
        style={styles.headerTitle}
      >
        {config.title}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <ScrollScreen header={header} testID={`picker-${setting}`}>
      <OptionList
        options={config.options}
        value={currentValue}
        onSelect={handleSelect}
        testIDPrefix={`picker-option`}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.layout.minTouchTarget,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
}));
