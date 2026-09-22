// components/achievement-unlock-overlay.tsx
//
// Full-screen celebration shown when a badge unlocks. Reads the
// front of the hydration store's unlock queue, plays a haptic and
// chime on mount, and dismisses on tap.
//
// Particles radiate outward from the centre and fade. The card
// scales in with a spring. Backdrop fades in first.
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { feedback } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

// -------------------------------------------------------------
// Animation + layout constants
// -------------------------------------------------------------

const BACKDROP_DURATION = 200;
const CARD_DELAY = 120;
const PARTICLES = 20;
const PARTICLE_MIN_DISTANCE = 90;
const PARTICLE_MAX_DISTANCE = 180;
const PARTICLE_MIN_SIZE = 6;
const PARTICLE_MAX_SIZE = 12;
const PARTICLE_DURATION = 900;
const PARTICLE_DELAY_SPREAD = 0.15;

// -------------------------------------------------------------
// Themed badge
// -------------------------------------------------------------

const ThemedBadgeIcon = withUnistyles(Ionicons, (theme) => ({
  color: theme.colors.onPrimary,
}));

// -------------------------------------------------------------
// Particle
// -------------------------------------------------------------

interface ParticleConfig {
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

interface ParticleProps {
  config: ParticleConfig;
  progress: Animated.SharedValue<number>;
}

function Particle({ config, progress }: ParticleProps) {
  const style = useAnimatedStyle(() => {
    const localProgress = Math.max(
      0,
      (progress.value - config.delay) / (1 - config.delay),
    );
    const eased = 1 - Math.pow(1 - localProgress, 3);
    const dx = Math.cos(config.angle) * config.distance * eased;
    const dy = Math.sin(config.angle) * config.distance * eased;

    return {
      width: config.size,
      height: config.size,
      borderRadius: config.size / 2,
      transform: [{ translateX: dx }, { translateY: dy }],
      opacity: 1 - localProgress,
    };
  });

  return <Animated.View style={[styles.particle, style]} />;
}

// -------------------------------------------------------------
// Overlay
// -------------------------------------------------------------

export interface AchievementUnlockOverlayProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  };
  onDismiss: () => void;
  testID?: string;
}

export function AchievementUnlockOverlay({
  achievement,
  onDismiss,
  testID,
}: AchievementUnlockOverlayProps) {
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const particleProgress = useSharedValue(0);

  // Pre-compute particle configs once per mount, so each celebration
  // looks slightly different. Deterministic enough to render and
  // animate correctly on the UI thread.
  const particles = useMemo<ParticleConfig[]>(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => {
        const baseAngle = (i / PARTICLES) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.3;
        return {
          angle: baseAngle + jitter,
          distance:
            PARTICLE_MIN_DISTANCE +
            Math.random() * (PARTICLE_MAX_DISTANCE - PARTICLE_MIN_DISTANCE),
          size:
            PARTICLE_MIN_SIZE +
            Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE),
          delay: Math.random() * PARTICLE_DELAY_SPREAD,
        };
      }),
    [],
  );

  useEffect(() => {
    // Fire feedback once on mount -- heavy success haptic plus the
    // unlock chime.
    feedback("success", "unlock");

    backdropOpacity.value = withTiming(1, {
      duration: BACKDROP_DURATION,
      easing: Easing.out(Easing.quad),
    });

    cardOpacity.value = withDelay(CARD_DELAY, withTiming(1, { duration: 260 }));

    cardScale.value = withDelay(
      CARD_DELAY,
      withSpring(1, { damping: 14, stiffness: 220, mass: 0.8 }),
    );

    particleProgress.value = withDelay(
      CARD_DELAY,
      withTiming(1, {
        duration: PARTICLE_DURATION,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [backdropOpacity, cardOpacity, cardScale, particleProgress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <HapticPressable
      onPress={onDismiss}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${achievement.title} unlocked. ${achievement.description}. Tap to continue.`}
      testID={testID}
      style={styles.root}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      <View style={styles.centerWrap} pointerEvents="none">
        {particles.map((config, index) => (
          <Particle key={index} config={config} progress={particleProgress} />
        ))}
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.badge}>
          <ThemedBadgeIcon name={achievement.icon} size={44} />
        </View>

        <Text variant="micro" color="primary" textAlign="center">
          ACHIEVEMENT UNLOCKED
        </Text>

        <Text variant="h2" color="onSurface" textAlign="center">
          {achievement.title}
        </Text>

        <Text
          variant="subhead"
          color="mutedText"
          textAlign="center"
          style={styles.description}
        >
          {achievement.description}
        </Text>

        <Text
          variant="caption"
          color="mutedText"
          textAlign="center"
          style={styles.tapHint}
        >
          Tap anywhere to continue
        </Text>
      </Animated.View>
    </HapticPressable>
  );
}

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------

const styles = StyleSheet.create((theme) => ({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    backgroundColor: theme.colors.primary,
  },
  card: {
    width: "80%",
    maxWidth: 320,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    alignItems: "center",
    gap: theme.spacing.md,
    ...theme.elevation.xl,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  description: {
    paddingHorizontal: theme.spacing.sm,
  },
  tapHint: {
    marginTop: theme.spacing.sm,
  },
}));
