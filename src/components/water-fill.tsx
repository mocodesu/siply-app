// ─────────────────────────────────────────────────────────────
// components/water-fill.tsx
//
// Animated glass with a layered liquid fill.
//
// Geometry: the water body occupies the exact glass interior — no
// inset — so it touches the walls. Bottom corners are rounded to
// match the glass radius.
//
// ── Skia API note ────────────────────────────────────────────
// Uses the immutable Path API (`Skia.PathBuilder`, `Skia.Path.Oval`)
// introduced in Skia 2.x. The mutable `Skia.Path.Make()` +
// `path.addOval()` API is deprecated and produces paths that can't
// survive the Reanimated worklet boundary — which is what triggers
// the "Invalid prop value for SkPath received" crash.
//   See: shopify.github.io/react-native-skia/docs/shapes/path-migration
// ─────────────────────────────────────────────────────────────
import {
  Canvas,
  Group,
  Path,
  Skia,
  type SkPath,
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Geometry constants
// ─────────────────────────────────────────────────────────────

const GLASS_INSET = 6;
const GLASS_STROKE = 2;
const GLASS_RADIUS = 24;
const WATER_RADIUS = GLASS_RADIUS - GLASS_STROKE / 2;
const TOP_CLEARANCE = GLASS_RADIUS + 12;

// ─────────────────────────────────────────────────────────────
// Wave tuning
// ─────────────────────────────────────────────────────────────

const WAVE_CYCLES = 1.75;
const WAVE_AMPLITUDE = 7;
const WAVE_DURATION = 2400;
const WAVE_SAMPLE_STEP = 4;
const WAVE_EDGE_FADE = 0.08;

const LEVEL_DURATION = 700;

// ─────────────────────────────────────────────────────────────
// Opacity tuning
// ─────────────────────────────────────────────────────────────

const HIGHLIGHT_BAND_OPACITY = 0.22;
const SPECULAR_OPACITY = 0.35;

// ─────────────────────────────────────────────────────────────
// Worklet helpers — module scope, marked `'worklet'`
//
// These must live outside the component body. React Compiler's
// `enableFunctionOutlining` hoists component-scoped functions out
// of the worklet closure, which turns them into "remote functions"
// the UI thread cannot call synchronously.
//   See: github.com/software-mansion/react-native-reanimated/issues/6826
// ─────────────────────────────────────────────────────────────

const waveAmplitudeForLevel = (level: number): number => {
  "worklet";
  const edge = Math.min(1, Math.min(level, 1 - level) / WAVE_EDGE_FADE);
  return WAVE_AMPLITUDE * edge;
};

// ─────────────────────────────────────────────────────────────
// Themed canvas
// ─────────────────────────────────────────────────────────────

interface ThemedWaterCanvasProps {
  width: number;
  height: number;
  glassPath: SkPath;
  waterPath: SkPath;
  highlightBandPath: SkPath;
  specularPath: SkPath;
  crestPath: SkPath;
  glassStroke: string;
  waterFill: string;
  surfaceHighlight: string;
}

const ThemedWaterCanvas = withUnistyles(
  ({
    width,
    height,
    glassPath,
    waterPath,
    highlightBandPath,
    specularPath,
    crestPath,
    glassStroke,
    waterFill,
    surfaceHighlight,
  }: ThemedWaterCanvasProps) => (
    <Canvas style={{ width, height }}>
      {/* 1. Water body */}
      <Path path={waterPath} color={waterFill} />

      {/* 2. Surface highlight band, clipped to the water body */}
      <Group clip={waterPath}>
        <Path
          path={highlightBandPath}
          color={surfaceHighlight}
          opacity={HIGHLIGHT_BAND_OPACITY}
        />
      </Group>

      {/* 3. Specular reflection */}
      <Path
        path={specularPath}
        color={surfaceHighlight}
        opacity={SPECULAR_OPACITY}
      />

      {/* 4. Wave crest */}
      <Path
        path={crestPath}
        color={surfaceHighlight}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        strokeJoin="round"
      />

      {/* 5. Glass outline */}
      <Path
        path={glassPath}
        color={glassStroke}
        style="stroke"
        strokeWidth={GLASS_STROKE}
      />
    </Canvas>
  ),
  (theme) => ({
    glassStroke: theme.colors.panelBorder,
    waterFill: theme.semantic.waterFill,
    surfaceHighlight: theme.semantic.waterSurfaceHighlight,
  }),
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface WaterFillProps {
  amount: number;
  capacity: number;
  width?: number;
  height?: number;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export function WaterFill({
  amount,
  capacity,
  width = 180,
  height = 240,
  style,
  testID,
  accessibilityLabel,
}: WaterFillProps) {
  const safeCapacity = capacity > 0 ? capacity : 1;
  const ratio = Math.max(0, Math.min(1, amount / safeCapacity));

  // ── Static geometry ─────────────────────────────────────
  const geometry = useMemo(() => {
    const left = GLASS_INSET;
    const right = width - GLASS_INSET;
    const topY = GLASS_INSET;
    const bottomY = height - GLASS_INSET;
    const surfaceTopY = GLASS_INSET + TOP_CLEARANCE;
    return { left, right, topY, bottomY, surfaceTopY };
  }, [width, height]);

  // ── Glass outline (immutable, static) ───────────────────
  const glassPath = useMemo(() => {
    const { left, right, topY, bottomY } = geometry;
    const r = GLASS_RADIUS;

    return Skia.PathBuilder.Make()
      .moveTo(left + r, topY)
      .lineTo(right - r, topY)
      .quadTo(right, topY, right, topY + r)
      .lineTo(right, bottomY - r)
      .quadTo(right, bottomY, right - r, bottomY)
      .lineTo(left + r, bottomY)
      .quadTo(left, bottomY, left, bottomY - r)
      .lineTo(left, topY + r)
      .quadTo(left, topY, left + r, topY)
      .close()
      .build();
  }, [geometry]);

  // ── Animated values ─────────────────────────────────────
  const fillShared = useSharedValue(0);
  const phaseShared = useSharedValue(0);

  useEffect(() => {
    fillShared.value = withTiming(ratio, {
      duration: LEVEL_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [ratio, fillShared]);

  useEffect(() => {
    phaseShared.value = withRepeat(
      withTiming(1, {
        duration: WAVE_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [phaseShared]);

  // ── Water body path ─────────────────────────────────────
  const waterPath = useDerivedValue(() => {
    const { left, right, bottomY, surfaceTopY } = geometry;
    const level = fillShared.value;
    const surfaceY = bottomY - (bottomY - surfaceTopY) * level;
    const amplitude = waveAmplitudeForLevel(level);
    const phase = phaseShared.value * Math.PI * 2;
    const w = right - left;
    const radius = Math.min(
      WATER_RADIUS,
      Math.max(0, (bottomY - surfaceY) / 2),
    );

    const builder = Skia.PathBuilder.Make();

    const firstY = surfaceY + Math.sin(phase) * amplitude;
    builder.moveTo(left, firstY);

    const samples = Math.max(2, Math.ceil(w / WAVE_SAMPLE_STEP));
    for (let i = 1; i <= samples; i += 1) {
      const t = i / samples;
      const x = left + t * w;
      const y =
        surfaceY + Math.sin(t * WAVE_CYCLES * Math.PI * 2 + phase) * amplitude;
      builder.lineTo(x, y);
    }

    builder.lineTo(right, bottomY - radius);
    builder.quadTo(right, bottomY, right - radius, bottomY);
    builder.lineTo(left + radius, bottomY);
    builder.quadTo(left, bottomY, left, bottomY - radius);
    builder.lineTo(left, firstY);
    builder.close();

    return builder.build();
  }, [geometry]);

  // ── Crest path ──────────────────────────────────────────
  const crestPath = useDerivedValue(() => {
    const { left, right, bottomY, surfaceTopY } = geometry;
    const level = fillShared.value;
    const surfaceY = bottomY - (bottomY - surfaceTopY) * level;
    const amplitude = waveAmplitudeForLevel(level);
    const phase = phaseShared.value * Math.PI * 2;
    const w = right - left;

    const builder = Skia.PathBuilder.Make();
    builder.moveTo(left, surfaceY + Math.sin(phase) * amplitude);

    const samples = Math.max(2, Math.ceil(w / WAVE_SAMPLE_STEP));
    for (let i = 1; i <= samples; i += 1) {
      const t = i / samples;
      const x = left + t * w;
      const y =
        surfaceY + Math.sin(t * WAVE_CYCLES * Math.PI * 2 + phase) * amplitude;
      builder.lineTo(x, y);
    }

    return builder.build();
  }, [geometry]);

  // ── Highlight band ──────────────────────────────────────
  const highlightBandPath = useDerivedValue(() => {
    const { bottomY, surfaceTopY } = geometry;
    const level = fillShared.value;
    const surfaceY = bottomY - (bottomY - surfaceTopY) * level;
    const amplitude = waveAmplitudeForLevel(level);

    const bandTop = surfaceY - amplitude;
    const waterHeight = Math.max(0, bottomY - surfaceY);
    const bandHeight = amplitude * 2 + waterHeight * 0.35;

    return Skia.PathBuilder.Make()
      .addRect(Skia.XYWHRect(0, bandTop, width, bandHeight))
      .build();
  }, [geometry, width]);

  // ── Specular reflection ─────────────────────────────────
  const specularPath = useDerivedValue(() => {
    const { left, bottomY, surfaceTopY } = geometry;
    const level = fillShared.value;
    const surfaceY = bottomY - (bottomY - surfaceTopY) * level;

    // Only visible once there's a meaningful amount of water.
    if (level < 0.12) {
      return Skia.PathBuilder.Make().build();
    }

    return Skia.Path.Oval(Skia.XYWHRect(left + 18, surfaceY + 14, 30, 5));
  }, [geometry]);

  // ── Accessibility ───────────────────────────────────────
  const percentage = Math.round(ratio * 100);
  const defaultLabel = `Glass ${percentage}% full. ${amount} of ${capacity} millilitres.`;

  return (
    <View
      testID={testID}
      style={[styles.container, { width, height }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? defaultLabel}
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
    >
      <ThemedWaterCanvas
        width={width}
        height={height}
        glassPath={glassPath}
        waterPath={waterPath}
        highlightBandPath={highlightBandPath}
        specularPath={specularPath}
        crestPath={crestPath}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
