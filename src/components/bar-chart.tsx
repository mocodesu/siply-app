// ─────────────────────────────────────────────────────────────
// components/bar-chart.tsx
//
// Skia bar chart with top-rounded bars, horizontal grid lines, and
// text labels rendered as React Native overlays.
//
// ── Skia API note ────────────────────────────────────────────
// Uses the immutable Path API. Every bar subpath is appended to a
// single `SkPathBuilder`, then `.build()` produces the final path.
//   See: shopify.github.io/react-native-skia/docs/shapes/path-migration
//
// ── React Compiler note ──────────────────────────────────────
// `appendBar` lives at module scope with a `'worklet'` directive.
// React Compiler's `enableFunctionOutlining` optimization hoists
// component-scoped helpers out of the worklet closure, turning them
// into "remote functions" the UI thread cannot call synchronously.
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

const CHART_HEIGHT = 170;
const AXIS_HEIGHT = 24;
const Y_AXIS_WIDTH = 38;
const BAR_RADIUS = 4;
const BAR_WIDTH_RATIO = 0.55;
const GROW_DURATION = 600;

// ─────────────────────────────────────────────────────────────
// Worklet helper — module scope, marked `'worklet'`
// ─────────────────────────────────────────────────────────────

type BarPathBuilder = ReturnType<typeof Skia.PathBuilder.Make>;

const appendBar = (
  builder: BarPathBuilder,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  "worklet";
  if (h <= 0) return;
  const r = Math.min(BAR_RADIUS, w / 2, h);
  builder.moveTo(x, y + h);
  builder.lineTo(x, y + r);
  builder.quadTo(x, y, x + r, y);
  builder.lineTo(x + w - r, y);
  builder.quadTo(x + w, y, x + w, y + r);
  builder.lineTo(x + w, y + h);
  builder.close();
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
      <Path path={barsPath} color={barColor} />
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
  label: string;
  value: number;
}

export interface BarChartProps {
  data: readonly BarChartDatum[];
  width: number;
  highlightIndex?: number;
  style?: ViewStyle;
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

  // ── Geometry ──────────────────────────────────────────────
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
    const builder = Skia.PathBuilder.Make();
    for (let i = 0; i < geometry.length; i += 1) {
      if (i === highlightIndex) continue;
      const bar = geometry[i];
      const h = bar.targetHeight * progress.value;
      appendBar(builder, bar.x, CHART_HEIGHT - h, bar.width, h);
    }
    return builder.build();
  }, [geometry, highlightIndex]);

  const highlightPath = useDerivedValue(() => {
    if (highlightIndex < 0 || highlightIndex >= geometry.length) return null;
    const bar = geometry[highlightIndex];
    const h = bar.targetHeight * progress.value;
    const builder = Skia.PathBuilder.Make();
    appendBar(builder, bar.x, CHART_HEIGHT - h, bar.width, h);
    return builder.build();
  }, [geometry, highlightIndex]);

  if (chartWidth <= 0) {
    return <View testID={testID} style={style} />;
  }

  return (
    <View testID={testID} style={[styles.root, style]}>
      <View style={styles.chartRow}>
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

        <ThemedChartCanvas
          width={chartWidth}
          height={CHART_HEIGHT}
          barsPath={barsPath}
          highlightPath={highlightPath}
          tickYs={tickYs}
        />
      </View>

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
  root: { width: "100%" },
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
