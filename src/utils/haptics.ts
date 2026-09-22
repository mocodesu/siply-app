// ─────────────────────────────────────────────────────────────
// utils/haptics.ts
//
// Haptic + audio feedback in one place. Every `withHaptic` call
// now fires both a haptic and a matching sound, so existing
// `HapticPressable` call sites get audio for free.
// ─────────────────────────────────────────────────────────────
import * as Haptics from "expo-haptics";
import { GestureResponderEvent, Platform } from "react-native";

import { playSound, type SoundName } from "@/utils/sounds";

export type HapticType =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  /** Minimum gap between two haptic triggers, in milliseconds. */
  minTriggerIntervalMs: 40,
  /** Master switch for haptics. Audio has its own switch in `sounds.ts`. */
  enabled: true,
};

/**
 * Which sound (if any) accompanies each haptic. Deliberately sparse:
 * warnings and errors stay silent so they don't train the user to
 * ignore a sound they hear constantly.
 */
const HAPTIC_SOUND: Record<HapticType, SoundName | null> = {
  selection: "tapSoft",
  light: "tapSoft",
  medium: "tap",
  heavy: "tap",
  success: "success",
  warning: null,
  error: null,
};

// ─────────────────────────────────────────────────────────────
// Internal state
// ─────────────────────────────────────────────────────────────

let lastTriggerAt = 0;

const hapticErrorHandler = (error: unknown) => {
  console.warn("Haptic trigger failed:", error);
};

// ─────────────────────────────────────────────────────────────
// Core triggers
// ─────────────────────────────────────────────────────────────

/**
 * Fires a haptic and its associated sound. Throttled globally so
 * rapid double-taps don't produce a stutter of feedback.
 *
 * Use this directly for events that aren't press-driven, like an
 * achievement unlocking.
 */
export function feedback(
  type: HapticType = "selection",
  sound?: SoundName | null,
): void {
  if (Platform.OS === "web" || !CONFIG.enabled) return;

  const now = Date.now();
  if (now - lastTriggerAt < CONFIG.minTriggerIntervalMs) return;
  lastTriggerAt = now;

  // ── Haptic ─────────────────────────────────────────────
  (async () => {
    switch (type) {
      case "selection":
        await Haptics.selectionAsync();
        break;
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        break;
      case "warning":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  })().catch(hapticErrorHandler);

  // ── Sound ──────────────────────────────────────────────
  const resolvedSound = sound !== undefined ? sound : HAPTIC_SOUND[type];
  if (resolvedSound) {
    playSound(resolvedSound);
  }
}

/**
 * Haptic only — no sound. Use for passive events that shouldn't
 * make noise, like a slider crossing a step boundary.
 */
export function triggerHaptic(type: HapticType = "selection"): void {
  if (Platform.OS === "web" || !CONFIG.enabled) return;

  const now = Date.now();
  if (now - lastTriggerAt < CONFIG.minTriggerIntervalMs) return;
  lastTriggerAt = now;

  (async () => {
    switch (type) {
      case "selection":
        await Haptics.selectionAsync();
        break;
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        break;
      case "warning":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  })().catch(hapticErrorHandler);
}

// ─────────────────────────────────────────────────────────────
// Press wrapper
// ─────────────────────────────────────────────────────────────

type PressHandler = ((event: GestureResponderEvent) => void) | null | undefined;

/**
 * Wraps a press handler so it fires feedback (haptic + sound)
 * before running. Used by `HapticPressable` — updating this one
 * function gives every pressable in the app audio.
 */
export function withHaptic(
  callback: PressHandler,
  type: HapticType = "selection",
): (event: GestureResponderEvent) => void {
  return (event) => {
    feedback(type);
    callback?.(event);
  };
}

/**
 * Fires feedback only if `condition` is true. Useful for
 * conditional highlights (e.g. a value crossing a threshold).
 */
export function triggerHapticIf(
  condition: boolean,
  type: HapticType = "selection",
): void {
  if (condition) {
    feedback(type);
  }
}
