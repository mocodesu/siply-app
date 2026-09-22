// app/(tabs)/stats.tsx
//
// Composed of five independent modules. Each subscribes to exactly
// the data it renders:
//
//   StatsHeader       -- no subscriptions
//   StatsPeriodPicker -- subscribes to period, dispatches setPeriod
//   StatsSummary      -- subscribes to averageMl, delta, period
//                        label, delta label, units
//   StatsChartSection -- subscribes to bars; the chart itself is
//                        only re-rendered when bars change
//   StatsDetailCard   -- subscribes to consistency, totalMl, units
//
// Changing period re-renders the picker, summary, chart, and detail
// card -- but not the header. Logging water on another tab and
// returning causes zero re-renders if the numbers haven't changed.
import { BarChart } from "@/components/bar-chart";
import { ConsistencyBar } from "@/components/consistency-bar";
import { ScrollScreen } from "@/components/screen";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { StatDelta } from "@/components/stat-delta";
import Text from "@/components/text";
import { useStatsSync } from "@/hooks/use-stats";
import { selectUnits, useSettingsStore } from "@/store/settings-store";
import {
  selectStatsAverageMl,
  selectStatsBars,
  selectStatsConsistency,
  selectStatsDeltaLabel,
  selectStatsDeltaPercent,
  selectStatsPeriod,
  selectStatsPeriodLabel,
  selectStatsTotalMl,
  useStatsStore,
  type StatsPeriod,
} from "@/store/stats-store";
import { formatVolumeValue } from "@/utils/format";
import { unitSuffix } from "@/utils/units";
import React, { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// -------------------------------------------------------------
// Period segments
// -------------------------------------------------------------

const PERIODS: readonly Segment<StatsPeriod>[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

// -------------------------------------------------------------
// Screen
// -------------------------------------------------------------

export default function StatsScreen() {
  useStatsSync();

  return (
    <ScrollScreen testID="stats-screen">
      <StatsHeader />
      <StatsPeriodPicker />
      <StatsSummary />
      <StatsChartSection />
      <StatsDetailCard />
    </ScrollScreen>
  );
}

// -------------------------------------------------------------
// Header
//
// No subscriptions. Renders once.
// -------------------------------------------------------------

function StatsHeader() {
  return (
    <View style={styles.titleBlock}>
      <Text variant="h2" color="onBackground" textAlign="center">
        Statistics
      </Text>
    </View>
  );
}

// -------------------------------------------------------------
// Period picker
//
// The only component that subscribes to period for display.
// Setting period updates the store, which propagates the change
// to the sections that read stats values.
// -------------------------------------------------------------

function StatsPeriodPicker() {
  const period = useStatsStore(selectStatsPeriod);
  const setPeriod = useStatsStore((s) => s.setPeriod);

  return (
    <SegmentedControl
      segments={PERIODS}
      value={period}
      onChange={setPeriod}
      testID="stats-period"
    />
  );
}

// -------------------------------------------------------------
// Summary
//
// Subscribes to average, delta values, and units. Re-renders when
// any of those change -- which happens on period change or on a
// successful fetch that yields different numbers.
// -------------------------------------------------------------

function StatsSummary() {
  const averageMl = useStatsStore(selectStatsAverageMl);
  const deltaPercent = useStatsStore(selectStatsDeltaPercent);
  const deltaLabel = useStatsStore(selectStatsDeltaLabel);
  const periodLabel = useStatsStore(selectStatsPeriodLabel);
  const units = useSettingsStore(selectUnits);

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryText}>
        <Text variant="caption" color="mutedText">
          Average Intake
        </Text>
        <Text variant="h2" color="onSurface">
          {formatVolumeValue(averageMl, units)} {unitSuffix(units)}
        </Text>
        <Text variant="caption" color="mutedText">
          {periodLabel}
        </Text>
      </View>

      <StatDelta
        percent={deltaPercent}
        label={deltaLabel}
        testID="stats-delta"
      />
    </View>
  );
}

// -------------------------------------------------------------
// Chart
//
// The measurement and the highlight index live here so the
// onLayout call doesn't re-render anything above it. When the
// bars array is referentially stable (thanks to content equality
// in the store), the chart's animation does not restart.
// -------------------------------------------------------------

function StatsChartSection() {
  const bars = useStatsStore(selectStatsBars);
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  // Highlight the tallest bar, if any has a value.
  let highlightIndex = -1;
  let bestValue = 0;
  for (let i = 0; i < bars.length; i++) {
    if (bars[i].value > bestValue) {
      bestValue = bars[i].value;
      highlightIndex = i;
    }
  }
  if (bestValue === 0) highlightIndex = -1;

  return (
    <View
      style={styles.chartWrapper}
      onLayout={handleLayout}
      testID="stats-chart-wrapper"
    >
      {width > 0 && bars.length > 0 && (
        <BarChart
          data={bars}
          width={width}
          highlightIndex={highlightIndex}
          testID="stats-chart"
        />
      )}
    </View>
  );
}

// -------------------------------------------------------------
// Detail card
//
// Consistency bar plus the period total. Subscribes to the two
// values it displays and to units.
// -------------------------------------------------------------

function StatsDetailCard() {
  const consistency = useStatsStore(selectStatsConsistency);
  const totalMl = useStatsStore(selectStatsTotalMl);
  const units = useSettingsStore(selectUnits);

  return (
    <View style={styles.card}>
      <ConsistencyBar value={consistency} testID="stats-consistency" />

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text variant="subhead" color="mutedText">
          Total Intake
        </Text>
        <Text variant="h3" color="onSurface">
          {formatVolumeValue(totalMl, units)} {unitSuffix(units)}
        </Text>
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------

const styles = StyleSheet.create((theme) => ({
  titleBlock: {
    alignItems: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  summaryText: {
    gap: theme.spacing.xxs,
  },
  chartWrapper: {
    width: "100%",
    paddingVertical: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.panelBorder,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));
