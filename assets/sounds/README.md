# Sound effects

This folder holds the app's UI sound effects. The sounds module
(`src/utils/sounds.ts`) requires the following files at bundle time:

| Filename       | Purpose                               | Duration |
| -------------- | ------------------------------------- | -------- |
| `tap.wav`      | Button tap (primary actions)          | ~80 ms   |
| `tap-soft.wav` | Soft tap (toggles, selections, nav)   | ~60 ms   |
| `success.wav`  | Success chime (goal saved, water add) | ~300 ms  |
| `unlock.wav`   | Achievement unlocked                  | ~600 ms  |
| `water.wav`    | Water drop / pour (logging water)     | ~400 ms  |

## Format

- **WAV**, mono, 44.1 kHz, 16-bit
- Keep files under 30 KB each
- Normalize to around -6 dBFS — the app already scales playback to ~35%

## Free sources

- https://mixkit.co/free-sound-effects/click/ (taps)
- https://pixabay.com/sound-effects/search/ui/ (toggles, confirmations)
- https://freesound.org/ (water, chimes)

## Disabling sounds

If you don't want to add the files yet, open `src/utils/sounds.ts`
and set `SOUNDS_ENABLED = false`. Everything else keeps working —
`playSound()` becomes a no-op.
