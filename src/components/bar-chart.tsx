// ─────────────────────────────────────────────────────────────
// components/bar-chart.tsx
//
// Skia bar chart with top-rounded bars, horizontal grid lines, and
// text labels rendered as React Native overlays.
//
// Why RN Text for labels: Skia's `Text` needs a loaded typeface
// handle, which would duplicate the font wiring we already have.
// The labels are static and few, so overlaying RN text is both
// simpler and more accessible.
//
// All bars live in a single Skia path (one subpath per bar), so
// the canvas draws in one pass regardless of bucket count. A
// separate highlight path is used when a bar should stand out.
//
// ── React Compiler note ──────────────────────────────────────
// `appendBar` lives at module scope with a `'worklet'` directive.
// It was originally a component-scoped helper, but React Compiler's
// `enableFunctionOutlining` optimization hoisted it out of the
// worklet closure, turning it into a "remote function" that the UI
// thread cannot call synchronously. Keeping it at module scope
// avoids that transformation entirely.
//   See: github.com/software-mansion/react-native-reanimated/issues/6826
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import {
  Canvas,
  Line,
  Path,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────

/** Height of the bar + grid area, in pixels. */
const CHART_HEIGHT = 170;
/** Height of the x-axis label strip below the chart. */
const AXIS_HEIGHT = 24;
/** Width of the y-axis label column, in pixels. */
const Y_AXIS_WIDTH = 38;
/** Corner radius on the top of each bar. */
const BAR_RADIUS = 4;
/** Bar width as a fraction of its slot. */
const BAR_WIDTH_RATIO = 0.55;
/** Bars grow from 0 to full over this many milliseconds. */
const GROW_DURATION = 600;

// ─────────────────────────────────────────────────────────────
// Worklet helper — module scope, marked `'worklet'`
//
// Appends a top-rounded rectangle subpath to `path`. Must stay at
// module scope; see the React Compiler note at the top of the file.
// ─────────────────────────────────────────────────────────────

const appendBar = (
  path: SkPath,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  "worklet";
  if (h <= 0) return;
  const r = Math.min(BAR_RADIUS, w / 2, h);
  path.moveTo(x, y + h);
  path.lineTo(x, y + r);
  path.quadTo(x, y, x + r, y);
  path.lineTo(x + w - r, y);
  path.quadTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h);
  path.close();
};

// ─────────────────────────────────────────────────────────────
// Y-axis tick computation
// ─────────────────────────────────────────────────────────────

interface YAxis {
  max: number;
  ticks: number[];
}

function computeYAxis(maxValue: number): YAxis {
  let step: number;
  if (maxValue <= 3000) step = 1000;
  else if (maxValue <= 8000) step = 2000;
  else if (maxValue <= 15000) step = 5000;
  else step = 10000;

  const max = Math.max(step, Math.ceil(maxValue / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return { max, ticks };
}

function formatTick(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) {
    const k = value / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(value);
}

// ─────────────────────────────────────────────────────────────
// Themed canvas
// ─────────────────────────────────────────────────────────────

interface ThemedChartCanvasProps {
  width: number;
  height: number;
  barsPath: SkPath;
  highlightPath: SkPath | null;
  tickYs: number[];
  barColor: string;
  highlightColor: string;
  gridColor: string;
}

const ThemedChartCanvas = withUnistyles(
  ({
    width,
    height,
    barsPath,
    highlightPath,
    tickYs,
    barColor,
    highlightColor,
    gridColor,
  }: ThemedChartCanvasProps) => (
    <Canvas style={{ width, height }}>
      {/* Horizontal grid lines */}
      {tickYs.map((y, index) => (
        <Line
          key={`grid-${index}`}
          p1={vec(0, y)}
          p2={vec(width, y)}
          color={gridColor}
          strokeWidth={1}
          style="stroke"
        />
      ))}
      {/* Regular bars */}
      <Path path={barsPath} color={barColor} />
      {/* Highlighted bar, drawn on top */}
      {highlightPath && <Path path={highlightPath} color={highlightColor} />}
    </Canvas>
  ),
  (theme) => ({
    barColor: theme.semantic.chartBar,
    highlightColor: theme.semantic.chartBarHighlight,
    gridColor: theme.semantic.chartGridLine,
  }),
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface BarChartDatum {
  /** Label shown under the bar. */
  label: string;
  /** Numeric value the bar's height represents. */
  value: number;
}

export interface BarChartProps {
  /** Data points, left to right. */
  data: readonly BarChartDatum[];
  /** Total width of the chart, including the y-axis column. */
  width: number;
  /** Index of the bar to draw in the highlight color. `-1` for none. */
  highlightIndex?: number;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
}

export function BarChart({
  data,
  width,
  highlightIndex = -1,
  style,
  testID,
}: BarChartProps) {
  const chartWidth = Math.max(0, width - Y_AXIS_WIDTH);

  const { max: niceMax, ticks } = useMemo(
    () => computeYAxis(Math.max(0, ...data.map((d) => d.value))),
    [data],
  );

  // ── Grid line positions (top of canvas = max, bottom = 0) ──
  const tickYs = useMemo(
    () => ticks.map((tick) => CHART_HEIGHT - (tick / niceMax) * CHART_HEIGHT),
    [ticks, niceMax],
  );

  // ── Grow animation ────────────────────────────────────────
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: GROW_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [data, progress]);

  // ── Geometry memoised so the derived value only rebuilds on
  //    real data or size changes, not every frame. ───────────
  const geometry = useMemo(() => {
    if (data.length === 0 || chartWidth <= 0) return [];

    const slotWidth = chartWidth / data.length;
    const barWidth = slotWidth * BAR_WIDTH_RATIO;

    return data.map((datum, index) => {
      const x = index * slotWidth + (slotWidth - barWidth) / 2;
      const targetHeight =
        niceMax > 0 ? (datum.value / niceMax) * CHART_HEIGHT : 0;
      return { x, width: barWidth, targetHeight };
    });
  }, [data, chartWidth, niceMax]);

  const barsPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    for (let i = 0; i < geometry.length; i += 1) {
      if (i === highlightIndex) continue;
      const bar = geometry[i];
      const h = bar.targetHeight * progress.value;
      appendBar(path, bar.x, CHART_HEIGHT - h, bar.width, h);
    }
    return path;
  }, [geometry, highlightIndex]);

  const highlightPath = useDerivedValue(() => {
    if (highlightIndex < 0 || highlightIndex >= geometry.length) return null;
    const bar = geometry[highlightIndex];
    const h = bar.targetHeight * progress.value;
    const path = Skia.Path.Make();
    appendBar(path, bar.x, CHART_HEIGHT - h, bar.width, h);
    return path;
  }, [geometry, highlightIndex]);

  if (chartWidth <= 0) {
    return <View testID={testID} style={style} />;
  }

  return (
    <View testID={testID} style={[styles.root, style]}>
      <View style={styles.chartRow}>
        {/* ── Y-axis labels ───────────────────────────── */}
        <View style={styles.yAxis}>
          {ticks.map((tick, index) => (
            <Text
              key={`y-${index}`}
              variant="caption"
              color="mutedText"
              style={[styles.yLabel, { top: tickYs[index] - 8 }]}
            >
              {formatTick(tick)}
            </Text>
          ))}
        </View>

        {/* ── Canvas ──────────────────────────────────── */}
        <ThemedChartCanvas
          width={chartWidth}
          height={CHART_HEIGHT}
          barsPath={barsPath}
          highlightPath={highlightPath}
          tickYs={tickYs}
        />
      </View>

      {/* ── X-axis labels ─────────────────────────────── */}
      <View style={[styles.xAxis, { marginLeft: Y_AXIS_WIDTH }]}>
        {data.map((datum, index) => (
          <View key={`x-${index}`} style={styles.xSlot}>
            <Text
              variant="caption"
              color={index === highlightIndex ? "primary" : "mutedText"}
              textAlign="center"
              numberOfLines={1}
            >
              {datum.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  chartRow: {
    flexDirection: "row",
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT,
    position: "relative",
  },
  yLabel: {
    position: "absolute",
    right: 6,
  },
  xAxis: {
    flexDirection: "row",
    height: AXIS_HEIGHT,
    alignItems: "center",
  },
  xSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
