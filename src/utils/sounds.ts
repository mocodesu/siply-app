// ─────────────────────────────────────────────────────────────
// utils/sounds.ts
//
// Global sound-effect player. One cached player per sound, so
// repeated taps don't allocate a new audio node every time.
//
// ── Adding / removing sounds ─────────────────────────────────
// 1. Drop the WAV files into `assets/sounds/` (see that folder's
//    README for the expected filenames and sources).
// 2. Update `SOURCES` and the `SoundName` union if you add names.
// 3. Set `SOUNDS_ENABLED = false` below to run the app in silent
//    mode without touching any call sites.
//
// All errors are swallowed. A missing or broken sound file must
// never crash a screen or block a tap.
// ─────────────────────────────────────────────────────────────
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

/** Flip to false to disable all audio without touching call sites. */
const SOUNDS_ENABLED = true;

/** Playback volume for every sound. Kept low — these are accents. */
const SOUND_VOLUME = 0.35;

export type SoundName = "tap" | "tapSoft" | "success" | "unlock" | "water";

// ─────────────────────────────────────────────────────────────
// Sources
//
// Metro requires static require() calls — the paths can't be
// computed at runtime. Update this map when you add or rename
// files in `assets/sounds/`.
// ─────────────────────────────────────────────────────────────

const SOURCES = SOUNDS_ENABLED
  ? ({
      tap: require("@/assets/sounds/tap.wav"),
      tapSoft: require("@/assets/sounds/tap-soft.wav"),
      success: require("@/assets/sounds/success.wav"),
      unlock: require("@/assets/sounds/unlock.wav"),
      water: require("@/assets/sounds/water.wav"),
    } as Record<SoundName, number>)
  : ({} as Record<SoundName, number>);

// ─────────────────────────────────────────────────────────────
// Player cache
// ─────────────────────────────────────────────────────────────

const players = new Map<SoundName, AudioPlayer>();

let didConfigureAudioMode = false;

/**
 * Configures the audio session so short SFX respect the ringer
 * switch on iOS and mix with other apps' audio. Idempotent — only
 * runs the first time a sound is played.
 */
async function configureAudioMode(): Promise<void> {
  if (didConfigureAudioMode) return;
  didConfigureAudioMode = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });
  } catch {
    // Platform rejected the config — the default session still
    // plays SFX fine, so there's nothing to recover.
  }
}

/**
 * Returns the cached player for a sound, creating it on first use.
 * Returns null if the source is missing or the player fails to
 * construct.
 */
function getPlayer(name: SoundName): AudioPlayer | null {
  if (!SOUNDS_ENABLED) return null;

  const cached = players.get(name);
  if (cached) return cached;

  const source = SOURCES[name];
  if (!source) return null;

  try {
    const player = createAudioPlayer(source);
    player.volume = SOUND_VOLUME;
    players.set(name, player);
    return player;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Plays a sound effect. Safe to call from anywhere, any number of
 * times. Never throws, never blocks, and never awaits.
 */
export function playSound(name: SoundName): void {
  if (!SOUNDS_ENABLED) return;

  void configureAudioMode();

  const player = getPlayer(name);
  if (!player) return;

  try {
    // Rewind before playing so rapid taps retrigger the accent
    // instead of playing into the tail of the previous one.
    // `seekTo` is async but fire-and-forget here — a slight
    // ordering delay is imperceptible for a UI click.
    void player.seekTo(0);
    player.play();
  } catch {
    // Missing source at runtime (e.g. overwritten by a hot
    // reload). Silent failure is the correct behaviour.
  }
}

/**
 * Warms the players for every sound. Call once near the root of
 * the app so the first tap of a session doesn't pay the player
 * construction cost.
 */
export function preloadSounds(): void {
  if (!SOUNDS_ENABLED) return;
  void configureAudioMode();
  (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
    void getPlayer(name);
  });
}
