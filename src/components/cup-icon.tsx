// ─────────────────────────────────────────────────────────────
// components/cup-icon.tsx
//
// Tapered drinking-glass icon with an internal fill line.
//
// Drawn with Skia rather than react-native-svg because Skia is
// already a dependency and a static polygon like this renders
// essentially for free. The fill is a plain rect clipped to the
// glass interior — clip is reliable here because the path is a
// simple closed polygon with no overlapping curves.
// ─────────────────────────────────────────────────────────────
import {
  Canvas,
  Group,
  Path,
  Rect,
  Skia,
  type SkPath,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import { withUnistyles } from "react-native-unistyles";

/** Height-to-width ratio of the glass. */
const ASPECT = 1.35;
/** Opacity of the fill tint so the outline stays legible. */
const FILL_OPACITY = 0.3;

// ─────────────────────────────────────────────────────────────
// Themed canvas
// ─────────────────────────────────────────────────────────────

interface ThemedCupProps {
  width: number;
  height: number;
  glassPath: SkPath;
  /** Y coordinate where the fill starts. Equals `height` when empty. */
  fillY: number;
  outline: string;
  fill: string;
}

const ThemedCup = withUnistyles(
  ({ width, height, glassPath, fillY, outline, fill }: ThemedCupProps) => (
    <Canvas style={{ width, height }}>
      <Group clip={glassPath}>
        <Rect
          x={0}
          y={fillY}
          width={width}
          height={height - fillY}
          color={fill}
          opacity={FILL_OPACITY}
        />
      </Group>
      <Path
        path={glassPath}
        color={outline}
        style="stroke"
        strokeWidth={1.5}
        strokeJoin="round"
      />
    </Canvas>
  ),
  (theme) => ({
    outline: theme.colors.primary,
    fill: theme.semantic.waterFill,
  }),
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface CupIconProps {
  /** Width of the glass in pixels. Height is derived via `ASPECT`. */
  size?: number;
  /** How full the glass is, 0–1. Clamped. */
  fillRatio?: number;
  /** Container style override. */
  style?: ViewStyle;
}

export function CupIcon({ size = 40, fillRatio = 0, style }: CupIconProps) {
  const width = size;
  const height = size * ASPECT;

  const glassPath = useMemo(() => {
    const pad = 1.5;
    const taper = width * 0.15;
    const radius = width * 0.14;

    const top = pad;
    const bottom = height - pad;
    const leftTop = pad;
    const rightTop = width - pad;
    const leftBottom = pad + taper;
    const rightBottom = width - pad - taper;

    const p = Skia.Path.Make();
    p.moveTo(leftTop + radius, top);
    p.lineTo(rightTop - radius, top);
    p.quadTo(rightTop, top, rightTop, top + radius);
    p.lineTo(rightBottom, bottom - radius);
    p.quadTo(rightBottom, bottom, rightBottom - radius, bottom);
    p.lineTo(leftBottom + radius, bottom);
    p.quadTo(leftBottom, bottom, leftBottom, bottom - radius);
    p.lineTo(leftTop, top + radius);
    p.quadTo(leftTop, top, leftTop + radius, top);
    p.close();
    return p;
  }, [width, height]);

  const fillY = useMemo(() => {
    const pad = 1.5;
    const radius = width * 0.14;
    const interiorTop = pad + radius;
    const interiorBottom = height - pad - radius;
    const clamped = Math.max(0, Math.min(1, fillRatio));
    return interiorBottom - (interiorBottom - interiorTop) * clamped;
  }, [width, height, fillRatio]);

  return (
    <View style={style}>
      <ThemedCup
        width={width}
        height={height}
        glassPath={glassPath}
        fillY={fillY}
      />
    </View>
  );
}
