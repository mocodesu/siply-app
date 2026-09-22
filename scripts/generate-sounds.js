#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// scripts/generate-sounds.js
//
// Synthesizes the five UI sound effects used by Siply:
//
//   tap.wav       — crisp click for primary actions
//   tap-soft.wav  — softer click for toggles/selections
//   success.wav   — two-note chime (rising fourth)
//   unlock.wav    — three-note arpeggio (major triad)
//   water.wav     — downward frequency sweep (water drop)
//
// Run with:
//   node scripts/generate-sounds.js
//
// Output goes to `assets/sounds/`. Files are 44.1 kHz, mono,
// 16-bit PCM WAV — the format expo-audio prefers and every platform
// decodes natively.
//
// All synthesis is done with pure Node.js. No dependencies, no
// network access, no ffmpeg. Delete and regenerate freely.
// ─────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = path.join(__dirname, "..", "assets", "sounds");

/**
 * Peak amplitude every sound is normalized to. Slightly below 1.0
 * leaves headroom for the OS mixer so sounds never clip on loud
 * playback, while still being present at low volume.
 */
const NORMALIZE_PEAK = 0.85;

// ─────────────────────────────────────────────────────────────
// WAV writer
//
// Emits a canonical 44-byte header followed by 16-bit little-endian
// PCM. See https://soundfile.sapp.org/doc/WaveFormat/ for the spec.
// ─────────────────────────────────────────────────────────────

function writeWav(filepath, samples) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // ── RIFF chunk ─────────────────────────────────────────
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write("WAVE", 8);

  // ── fmt chunk ──────────────────────────────────────────
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // PCM header size
  buffer.writeUInt16LE(1, 20); // format = PCM
  buffer.writeUInt16LE(1, 22); // channels = mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // ── data chunk ─────────────────────────────────────────
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const int = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(int), 44 + i * 2);
  }

  fs.writeFileSync(filepath, buffer);
  console.log(
    `  ✓ ${path.basename(filepath).padEnd(16)} ${(fileSize / 1024).toFixed(
      1,
    )} KB, ${((numSamples / SAMPLE_RATE) * 1000).toFixed(0)} ms`,
  );
}

// ─────────────────────────────────────────────────────────────
// Envelope helpers
// ─────────────────────────────────────────────────────────────

/**
 * Attack-then-exponential-decay envelope. `attack` is the linear
 * ramp-up duration in seconds; `decay` is the exponential decay
 * rate (higher = faster fade).
 */
function adsr(t, attack, decay) {
  const a = t < attack ? t / attack : 1;
  return a * Math.exp(-t * decay);
}

/**
 * Applies a short linear fade-out over the last `ms` milliseconds
 * of a sample buffer. Prevents the "click" you get when a waveform
 * is cut mid-cycle.
 */
function fadeOut(samples, ms = 8) {
  const fadeSamples = Math.floor((ms / 1000) * SAMPLE_RATE);
  const start = samples.length - fadeSamples;
  for (let i = start; i < samples.length; i++) {
    const k = (i - start) / fadeSamples;
    samples[i] *= 1 - k;
  }
  return samples;
}

/**
 * Scales a buffer so its peak equals `target`. Silent buffers are
 * returned unchanged.
 */
function normalize(samples, target = NORMALIZE_PEAK) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  if (peak === 0) return samples;
  const gain = target / peak;
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  return samples;
}

// ─────────────────────────────────────────────────────────────
// Sound generators
// ─────────────────────────────────────────────────────────────

/**
 * Crisp tap. A short sine burst with a fast exponential decay.
 * Reads as a "click" rather than a "tone" because the decay is
 * faster than the ear can resolve pitch.
 */
function generateTap() {
  const duration = 0.055; // 55 ms
  const frequency = 1600;
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = adsr(t, 0.001, 90);
    // Fundamental + a bit of 3rd harmonic for crispness.
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15;
    out[i] = (fundamental + harmonic) * env;
  }

  return fadeOut(normalize(out));
}

/**
 * Softer, lower-pitched tap. Used for toggles and selections where
 * a full click would be too assertive.
 */
function generateTapSoft() {
  const duration = 0.04;
  const frequency = 950;
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = adsr(t, 0.002, 110);
    // Pure fundamental — softer, less clicky.
    out[i] = Math.sin(2 * Math.PI * frequency * t) * env;
  }

  return fadeOut(normalize(out));
}

/**
 * Two-note rising chime. Plays E5 then A5, a perfect fourth apart,
 * which reads as "acknowledged / done" without being saccharine.
 *
 * Each note has a fundamental plus its 2nd and 3rd harmonics at
 * decreasing amplitudes — the harmonic stack is what makes a
 * synthetic tone sound bell-like rather than flat.
 */
function generateSuccess() {
  const totalDuration = 0.55;
  const n = Math.floor(totalDuration * SAMPLE_RATE);
  const out = new Float32Array(n);

  const notes = [
    { freq: 659.25, start: 0.0, duration: 0.4, gain: 1.0 }, // E5
    { freq: 880.0, start: 0.13, duration: 0.4, gain: 1.0 }, // A5
  ];

  for (const note of notes) {
    const startIdx = Math.floor(note.start * SAMPLE_RATE);
    const noteLen = Math.floor(note.duration * SAMPLE_RATE);

    for (let i = 0; i < noteLen; i++) {
      const outIdx = startIdx + i;
      if (outIdx >= n) break;

      const t = i / SAMPLE_RATE;
      // Gentle attack (10 ms) so the note swells in rather than
      // clicking. Faster decay than the tap so it rings out.
      const env = adsr(t, 0.01, 7);

      const fundamental = Math.sin(2 * Math.PI * note.freq * t);
      const h2 = Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.35;
      const h3 = Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.12;

      out[outIdx] += (fundamental + h2 + h3) * env * note.gain * 0.5;
    }
  }

  return fadeOut(normalize(out));
}

/**
 * Three-note ascending arpeggio on a C major triad — C6, E6, G6.
 * Brighter and more "celebratory" than `success.wav`, appropriate
 * for an achievement unlock.
 */
function generateUnlock() {
  const totalDuration = 0.9;
  const n = Math.floor(totalDuration * SAMPLE_RATE);
  const out = new Float32Array(n);

  const notes = [
    { freq: 1046.5, start: 0.0, duration: 0.6, gain: 1.0 }, // C6
    { freq: 1318.51, start: 0.11, duration: 0.6, gain: 1.0 }, // E6
    { freq: 1567.98, start: 0.22, duration: 0.7, gain: 1.0 }, // G6
  ];

  for (const note of notes) {
    const startIdx = Math.floor(note.start * SAMPLE_RATE);
    const noteLen = Math.floor(note.duration * SAMPLE_RATE);

    for (let i = 0; i < noteLen; i++) {
      const outIdx = startIdx + i;
      if (outIdx >= n) break;

      const t = i / SAMPLE_RATE;
      const env = adsr(t, 0.008, 6);

      const fundamental = Math.sin(2 * Math.PI * note.freq * t);
      const h2 = Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.28;
      const h3 = Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.1;

      out[outIdx] += (fundamental + h2 + h3) * env * note.gain * 0.42;
    }
  }

  return fadeOut(normalize(out));
}

/**
 * Water droplet. Two layers:
 *
 *   1. A downward-chirped sine (700 → 260 Hz over 260 ms). The
 *      sweep is the "body" of the drop.
 *   2. A brief high-frequency noise burst (60 ms) that decays fast.
 *      This is the surface-tension "tick" you hear at the instant
 *      a drop lands.
 *
 * Phase accumulation is used for the chirp rather than
 * `sin(2π · f(t) · t)`, because the latter produces the wrong
 * instantaneous frequency when `f` isn't constant.
 */
function generateWater() {
  const duration = 0.32;
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n);

  // ── Layer 1: chirp body ─────────────────────────────────
  let phase = 0;
  const startFreq = 700;
  const endFreq = 260;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = Math.min(1, t / duration);
    // Quadratic ease-out on the frequency — the drop "settles"
    // rather than dropping linearly.
    const eased = 1 - Math.pow(1 - progress, 2);
    const freq = startFreq + (endFreq - startFreq) * eased;

    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const env = adsr(t, 0.004, 12);
    out[i] = Math.sin(phase) * env;
  }

  // ── Layer 2: impact tick ────────────────────────────────
  const tickLen = Math.floor(0.06 * SAMPLE_RATE);
  for (let i = 0; i < tickLen; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 120);
    // Deterministic pseudo-noise — reproducible between runs.
    const noise = Math.sin(i * 12.9898) * 43758.5453;
    const rand = 2 * (noise - Math.floor(noise)) - 1;
    out[i] += rand * env * 0.35;
  }

  return fadeOut(normalize(out));
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function main() {
  console.log(`\nGenerating UI sounds → ${OUTPUT_DIR}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const sounds = [
    ["tap.wav", generateTap],
    ["tap-soft.wav", generateTapSoft],
    ["success.wav", generateSuccess],
    ["unlock.wav", generateUnlock],
    ["water.wav", generateWater],
  ];

  for (const [filename, generator] of sounds) {
    writeWav(path.join(OUTPUT_DIR, filename), generator());
  }

  console.log("\nDone. Restart Metro with `npx expo start --clear` to");
  console.log("pick up the new files.\n");
}

main();
