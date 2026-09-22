// ─────────────────────────────────────────────────────────────
// app/(tabs)/stats.tsx — Statistics
//
// Step C: the back chevron is gone. This screen is a tab, and a
// back affordance that sometimes does nothing is worse than no
// affordance at all. The header is just the title.
// ─────────────────────────────────────────────────────────────
import { BarChart } from "@/components/bar-chart";
import { ConsistencyBar } from "@/components/consistency-bar";
import { ScrollScreen } from "@/components/screen";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { StatDelta } from "@/components/stat-delta";
import Text from "@/components/text";
import { useStats, type StatsPeriod } from "@/hooks/use-stats";
import { useSettingsStore } from "@/store/settings-store";
import { formatVolumeValue } from "@/utils/format";
import { unitSuffix } from "@/utils/units";
import React, { useCallback, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const PERIODS: readonly Segment<StatsPeriod>[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

export default function StatsScreen() {
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [chartWidth, setChartWidth] = useState(0);

  const units = useSettingsStore((s) => s.units);
  const stats = useStats(period);

  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  }, []);

  const highlightIndex = React.useMemo(() => {
    if (stats.bars.length === 0) return -1;
    let bestIndex = -1;
    let bestValue = 0;
    stats.bars.forEach((bar, index) => {
      if (bar.value > bestValue) {
        bestValue = bar.value;
        bestIndex = index;
      }
    });
    return bestValue > 0 ? bestIndex : -1;
  }, [stats.bars]);

  return (
    <ScrollScreen testID="stats-screen">
      <View style={styles.titleBlock}>
        <Text variant="h2" color="onBackground" textAlign="center">
          Statistics
        </Text>
      </View>

      <SegmentedControl
        segments={PERIODS}
        value={period}
        onChange={setPeriod}
        testID="stats-period"
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryText}>
          <Text variant="caption" color="mutedText">
            Average Intake
          </Text>
          <Text variant="h2" color="onSurface">
            {formatVolumeValue(stats.averageMl, units)} {unitSuffix(units)}
          </Text>
          <Text variant="caption" color="mutedText">
            {stats.periodLabel}
          </Text>
        </View>

        <StatDelta
          percent={stats.deltaPercent}
          label={stats.deltaLabel}
          testID="stats-delta"
        />
      </View>

      <View
        style={styles.chartWrapper}
        onLayout={handleChartLayout}
        testID="stats-chart-wrapper"
      >
        {chartWidth > 0 && stats.bars.length > 0 && (
          <BarChart
            data={stats.bars}
            width={chartWidth}
            highlightIndex={highlightIndex}
            testID="stats-chart"
          />
        )}
      </View>

      <View style={styles.card}>
        <ConsistencyBar value={stats.consistency} testID="stats-consistency" />

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text variant="subhead" color="mutedText">
            Total Intake
          </Text>
          <Text variant="h3" color="onSurface">
            {formatVolumeValue(stats.totalMl, units)} {unitSuffix(units)}
          </Text>
        </View>
      </View>
    </ScrollScreen>
  );
}

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
