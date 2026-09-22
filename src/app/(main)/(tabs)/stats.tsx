// ─────────────────────────────────────────────────────────────
// app/(tabs)/stats.tsx — Statistics
//
// Layout mirrors reference screen 7: header, Week/Month/Year
// segmented control, an average-intake summary with a delta, the
// intake bar chart, a consistency bar, and the period total.
//
// The chart measures its own width via `onLayout` rather than
// computing it from `useWindowDimensions`, so it stays correct on
// tablets and in split view without any theme lookups here.
// ─────────────────────────────────────────────────────────────
import { BarChart } from "@/components/bar-chart";
import { ConsistencyBar } from "@/components/consistency-bar";
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { StatDelta } from "@/components/stat-delta";
import Text from "@/components/text";
import { useStats, type StatsPeriod } from "@/hooks/use-stats";
import { formatNumber } from "@/utils/format";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Period segments
// ─────────────────────────────────────────────────────────────

const PERIODS: readonly Segment<StatsPeriod>[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [chartWidth, setChartWidth] = useState(0);

  const stats = useStats(period);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  }, []);

  // Highlight the tallest bar when it has a meaningful value.
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

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="stats-back"
      />
      <Text
        variant="title"
        color="onBackground"
        textAlign="center"
        style={styles.headerTitle}
      >
        Statistics
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="stats-screen">
      {/* ── Period picker ───────────────────────────────── */}
      <SegmentedControl
        segments={PERIODS}
        value={period}
        onChange={setPeriod}
        testID="stats-period"
      />

      {/* ── Summary ─────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryText}>
          <Text variant="caption" color="mutedText">
            Average Intake
          </Text>
          <Text variant="h2" color="onSurface">
            {formatNumber(stats.averageMl)} ml
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

      {/* ── Chart ───────────────────────────────────────── */}
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

      {/* ── Consistency ─────────────────────────────────── */}
      <View style={styles.card}>
        <ConsistencyBar value={stats.consistency} testID="stats-consistency" />

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text variant="subhead" color="mutedText">
            Total Intake
          </Text>
          <Text variant="h3" color="onSurface">
            {formatNumber(stats.totalMl)} ml
          </Text>
        </View>
      </View>
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
