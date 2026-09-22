// ─────────────────────────────────────────────────────────────
// components/water-fill.tsx
//
// Animated glass with a liquid fill. Used on the Add Water screen.
//
// The water body is a single closed path: a sampled sine for the
// top edge, straight sides, and rounded corners matching the glass.
// Building the correct shape up front avoids depending on Skia's
// `clip`, which is unreliable with heavily-curved paths.
//
// Both the fill level and the wave phase are Reanimated shared
// values that Skia consumes directly on the UI thread. Colors come
// from `theme.semantic` via `withUnistyles`, so this component
// re-renders only when the theme changes.
// ─────────────────────────────────────────────────────────────

import { Canvas, Path, Skia, type SkPath } from "@shopify/react-native-skia";
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
// TUNING
// ─────────────────────────────────────────────────────────────

/** Wave crests visible across the glass interior. */
const WAVE_CYCLES = 2;
/** Peak deviation from the water's flat surface, in pixels. */
const WAVE_AMPLITUDE = 7;
/** One full wave loop, in milliseconds. */
const WAVE_DURATION = 2400;
/** Fill-level transition, in milliseconds. */
const LEVEL_DURATION = 700;
/** Horizontal sampling step for the wave curve. Smaller = smoother. */
const WAVE_SAMPLE_STEP = 3;

/** Glass outline inset from the canvas edges. */
const GLASS_INSET = 6;
/** Corner radius of the glass. */
const GLASS_RADIUS = 20;
/** Water body inset — sits just inside the glass stroke. */
const WATER_INSET = GLASS_INSET + 2;
/** Water never rises past this much from the top. */
const WATER_TOP_CLEARANCE = 22;

// ─────────────────────────────────────────────────────────────
// THEMED CANVAS
//
// `withUnistyles` maps theme tokens into Skia color props. Only this
// leaf re-renders on theme change, never the parent screen.
// ─────────────────────────────────────────────────────────────

interface ThemedWaterCanvasProps {
  width: number;
  height: number;
  glassPath: SkPath;
  waterPath: SkPath;
  surfacePath: SkPath;
  glassStroke: string;
  waterFill: string;
  crestHighlight: string;
}

const ThemedWaterCanvas = withUnistyles(
  ({
    width,
    height,
    glassPath,
    waterPath,
    surfacePath,
    glassStroke,
    waterFill,
    crestHighlight,
  }: ThemedWaterCanvasProps) => (
    <Canvas style={{ width, height }}>
      {/* Water body (closed shape) */}
      <Path path={waterPath} color={waterFill} />
      {/* Crest highlight riding the surface */}
      <Path
        path={surfacePath}
        color={crestHighlight}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        strokeJoin="round"
      />
      {/* Glass outline drawn last so it sits above the water */}
      <Path
        path={glassPath}
        color={glassStroke}
        style="stroke"
        strokeWidth={2}
      />
    </Canvas>
  ),
  (theme) => ({
    glassStroke: theme.colors.panelBorder,
    waterFill: theme.semantic.waterFill,
    crestHighlight: theme.semantic.waterSurfaceHighlight,
  }),
);

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export interface WaterFillProps {
  /** Current amount in millilitres. */
  amount: number;
  /** Capacity of the glass in millilitres. */
  capacity: number;
  /** Canvas width in pixels. */
  width?: number;
  /** Canvas height in pixels. */
  height?: number;
  /** Container style override. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outer View. */
  testID?: string;
  /** Accessibility label override. */
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
  // ── Ratio, clamped to [0, 1] ────────────────────────────
  const safeCapacity = capacity > 0 ? capacity : 1;
  const ratio = Math.max(0, Math.min(1, amount / safeCapacity));

  // ── Glass outline (static) ──────────────────────────────
  const glassPath = useMemo(() => {
    const left = GLASS_INSET;
    const right = width - GLASS_INSET;
    const top = GLASS_INSET;
    const bottom = height - GLASS_INSET;
    const r = GLASS_RADIUS;

    const p = Skia.Path.Make();
    p.moveTo(left + r, top);
    p.lineTo(right - r, top);
    p.quadTo(right, top, right, top + r);
    p.lineTo(right, bottom - r);
    p.quadTo(right, bottom, right - r, bottom);
    p.lineTo(left + r, bottom);
    p.quadTo(left, bottom, left, bottom - r);
    p.lineTo(left, top + r);
    p.quadTo(left, top, left + r, top);
    p.close();
    return p;
  }, [width, height]);

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

  // ── Geometry constants derived from canvas size ─────────
  const geometry = useMemo(() => {
    const left = WATER_INSET;
    const right = width - WATER_INSET;
    const bottomY = height - WATER_INSET;
    const topY = WATER_INSET + WATER_TOP_CLEARANCE;
    const cornerRadius = Math.max(
      6,
      GLASS_RADIUS - (WATER_INSET - GLASS_INSET),
    );
    const waveWidth = right - left;
    return { left, right, bottomY, topY, cornerRadius, waveWidth };
  }, [width, height]);

  // ── Water body — closed shape, rebuilt every frame ──────
  const waterPath = useDerivedValue(() => {
    const { left, right, bottomY, topY, cornerRadius, waveWidth } = geometry;

    const level = fillShared.value;
    const surfaceY = bottomY - (bottomY - topY) * level;

    // Amplitude fades near empty and full so the wave never clips
    // against the rim or the base.
    const amplitude = WAVE_AMPLITUDE * Math.sin(level * Math.PI);

    const phase = phaseShared.value * Math.PI * 2;

    const p = Skia.Path.Make();
    p.moveTo(left, surfaceY);

    // Sampled sine for the top edge.
    for (let x = left; x <= right; x += WAVE_SAMPLE_STEP) {
      const t = (x - left) / waveWidth;
      const y =
        surfaceY + Math.sin(t * WAVE_CYCLES * Math.PI * 2 + phase) * amplitude;
      p.lineTo(x, y);
    }
    // Ensure we land exactly on the right edge.
    const endY =
      surfaceY + Math.sin(WAVE_CYCLES * Math.PI * 2 + phase) * amplitude;
    p.lineTo(right, endY);

    // Right edge down to the bottom corner.
    p.lineTo(right, bottomY - cornerRadius);
    p.quadTo(right, bottomY, right - cornerRadius, bottomY);

    // Bottom edge.
    p.lineTo(left + cornerRadius, bottomY);

    // Bottom-left corner.
    p.quadTo(left, bottomY, left, bottomY - cornerRadius);

    // Left edge back up to the surface.
    p.lineTo(left, surfaceY);

    p.close();
    return p;
  }, [geometry]);

  // ── Crest highlight — just the top edge, no fill ────────
  const surfacePath = useDerivedValue(() => {
    const { left, right, bottomY, topY, waveWidth } = geometry;

    const level = fillShared.value;
    const surfaceY = bottomY - (bottomY - topY) * level;
    const amplitude = WAVE_AMPLITUDE * Math.sin(level * Math.PI);
    const phase = phaseShared.value * Math.PI * 2;

    const p = Skia.Path.Make();
    p.moveTo(left, surfaceY);

    for (let x = left; x <= right; x += WAVE_SAMPLE_STEP) {
      const t = (x - left) / waveWidth;
      const y =
        surfaceY + Math.sin(t * WAVE_CYCLES * Math.PI * 2 + phase) * amplitude;
      p.lineTo(x, y);
    }
    p.lineTo(
      right,
      surfaceY + Math.sin(WAVE_CYCLES * Math.PI * 2 + phase) * amplitude,
    );

    return p;
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
        surfacePath={surfacePath}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
