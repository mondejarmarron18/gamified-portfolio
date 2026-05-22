# Design: Settings Gear Menu, Genshin-style Music & Shadow Restore

**Date:** 2026-05-22  
**Status:** Approved

---

## Overview

Three related improvements to the gamified portfolio HUD and audio system:

1. Consolidate the three separate HUD controls (day/night, quality, audio) into a single ⚙ gear settings panel anchored to the bottom-left corner.
2. Replace the plain oscillator ambient pad with a richer, Genshin Impact-style layered score using harp arpeggios, a melody accent layer, and a warm string pad.
3. Audit and fix shadow restoration when switching from low → high quality mode.

---

## 1. Settings Gear Menu

### What changes

**Remove** from `Hud.tsx`:
- `dayNightBtn` button
- `qualityBtn` button  
- `audioBtn` button
- The `centerBtns` container div (no longer needed)
- The `qualityAuto` sub-label span (moves inside the panel)

**Remove** from `Hud.module.css`:
- `.centerBtns`, `.dayNightBtn`, `.qualityBtn`, `.qualityAuto`, `.audioBtn` rules

**Add** to `Hud.tsx`:
- `settingsOpen` boolean state (local to `Hud`, starts `false`)
- A `⚙` circular gear button, position: `absolute; bottom: 10px; left: 10px`
- A settings panel that renders when `settingsOpen === true`, positioned above the gear button
- A click-away handler: `onMouseDown` on the HUD root div closes the panel if the click target is outside the panel/gear

### Settings panel layout (open state)

```
┌─────────────────────┐
│  ⚙ Settings         │  ← small Cinzel serif title
├─────────────────────┤
│ 🌙 Time of Day  [Evening] │  ← pill button, calls onToggleDayNight
│ ✨ Quality    [Auto ▲ high] │  ← pill button, calls onCycleQuality
│ 🔊 Music        [ ● on ] │  ← slide toggle, calls onToggleAudio
└─────────────────────┘
```

Pill buttons show current state as their label and cycle on click. The quality pill shows the auto sub-label inline (e.g. "Auto ▲ high").

### Animation

Panel uses CSS `transform: translateY(8px) → translateY(0)` + `opacity: 0 → 1` on mount, matching the existing `transition: all .3s` style used elsewhere.

### Props interface — no changes

`Hud` props stay identical. The callbacks (`onToggleDayNight`, `onCycleQuality`, `onToggleAudio`, `audioEnabled`, `isDay`, `qualityMode`, `effectiveQuality`) are unchanged — they're just wired to the new controls inside the panel rather than to the old buttons.

### CSS classes to add

| Class | Purpose |
|---|---|
| `.gearBtn` | Circular ⚙ button, bottom-left anchor |
| `.settingsPanel` | The popup panel, positions above gear |
| `.settingsPanelRow` | Each row (label + control), flex space-between |
| `.settingsPillBtn` | Pill-shaped cycle button |
| `.settingsToggle` | Slide toggle track |
| `.settingsToggleDot` | Slide toggle knob |

---

## 2. Genshin Impact-style Background Music

### Architecture

`startMusic()` in `src/lib/audio.ts` is rewritten. Three layers all share the existing `musicGain → masterGain → destination` chain.

### Layer 1 — String pad (always running)

- 5 oscillators on a C pentatonic chord: C3 (130.8 Hz), E3 (164.8), G3 (196), A3 (220), D4 (293.7)
- Types: sine for roots, triangle for upper voices
- Per-voice amplitude: 0.5–0.9, individual slow LFOs (0.05–0.12 Hz) to give organic swell
- Overall gain: ~0.045 (soft background)

### Layer 2 — Harp arpeggio (looping, look-ahead scheduled)

- Pentatonic note sequence: C4, E4, G4, A4, C5, A4, G4, E4 (8 notes, repeat)
- Timing: one note every 0.38 s → full loop ~3 s, loops continuously
- Envelope: attack 0.008 s, exponential decay to 0.001 over 0.35 s (pluck feel)
- Tone: sine oscillator + slight frequency jitter (±0.5 Hz) for "string resonance" feel
- Implemented via a `scheduleArpeggio()` recursive function using `AudioContext.currentTime` lookahead (schedule 2 notes ahead, recurse via `setTimeout`)
- Overall gain: ~0.08

### Layer 3 — Melody accent (randomised interval)

- Triggers every 12–18 s (random within range) via `setTimeout`
- Plays a short 4-note rising phrase: G4 → A4 → C5 → E5
- Note duration: 0.6 s each, overlap slightly (starts next at 0.5 s)
- Envelope: attack 0.02 s, decay to 0.001 over 0.55 s
- Tone: sine with a second oscillator detuned by +7 cents (flute-like shimmer)
- Overall gain: ~0.07
- After playing, schedules the next trigger with a new random delay

### Cleanup

`stopMusic()` fades `musicGain` to 0 over 1.5 s, then calls `.stop()` on all tracked nodes (oscillators from all three layers). The melody accent `setTimeout` ID is stored in a module-level variable and cleared on `stopMusic()`.

---

## 3. Shadow Restore in High Quality

### Current behaviour

`applyQuality(refs, 'low')` sets:
- `renderer.shadowMap.enabled = false`
- `castShadow = false` on all tree meshes

`applyQuality(refs, 'high')` sets:
- `renderer.shadowMap.enabled = true`
- `castShadow = true` on all tree meshes

The renderer shadow map toggle is correct. The issue to verify: at scene build time, does every shadow-casting mesh (island terrain, rocks, player body) have `castShadow = true` and `receiveShadow = true` set? If they do, toggling the renderer is sufficient. If not, switching back to high will re-enable the shadow map but the objects won't cast.

### Audit plan

Check the following files for `castShadow` / `receiveShadow` assignments:
- `src/lib/scene/island.ts`
- `src/lib/scene/rocks.ts`
- `src/lib/scene/player.ts`
- `src/lib/scene/objects.ts` (sign, chest, scroll)
- `src/hooks/useThreeScene.ts` (renderer shadowMap init)

For any mesh that should cast/receive shadows but is missing the flag, add it.

`quality.ts` itself needs no structural change — the renderer toggle is correct. Only missing `castShadow` assignments at build time need fixing.

---

## Files Touched

| File | Change |
|---|---|
| `src/components/game/Hud.tsx` | Replace 3 buttons with gear + settings panel |
| `src/components/game/Hud.module.css` | Remove old button styles, add panel/gear styles |
| `src/components/game/GameCanvas.tsx` | No changes (callbacks unchanged) |
| `src/lib/audio.ts` | Rewrite `startMusic()` with 3-layer score |
| `src/lib/scene/island.ts` | Audit/add castShadow flags |
| `src/lib/scene/rocks.ts` | Audit/add castShadow flags |
| `src/lib/scene/player.ts` | Audit/add castShadow flags |
| `src/lib/scene/objects.ts` | Audit/add castShadow flags |
| `src/hooks/useThreeScene.ts` | Confirm renderer.shadowMap.enabled = true on init |

---

## Success Criteria

- HUD top area is clean — no buttons visible by default
- Gear icon in bottom-left, panel slides up on click, closes on click-away
- Background music sounds melodic and warm — recognisably "adventure game" in feel
- Arpeggios loop smoothly without timing drift
- Shadows visible on terrain, rocks, and player in high/auto-high mode
- Shadows absent in low/auto-low mode
- Quality toggle correctly restores shadows when switching low → high
