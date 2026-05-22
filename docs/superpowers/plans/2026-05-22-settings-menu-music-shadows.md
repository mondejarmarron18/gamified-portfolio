# Settings Gear Menu, Genshin Music & Shadows — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three separate HUD buttons with a bottom-left gear settings panel, upgrade background music to a Genshin Impact-style 3-layer synthesized score, and verify shadows restore correctly on quality toggle.

**Architecture:** Hud.tsx gets a local `settingsOpen` boolean and renders a slide-up panel above a ⚙ gear icon fixed to the bottom-left corner; all three callbacks are unchanged. `audio.ts` replaces `startMusic()` with three Web Audio API layers (pad + arpeggio + melody accent) sharing a single `musicGain` node. Shadow flags are already set correctly at build time; the plan confirms this and makes no structural change to `quality.ts`.

**Tech Stack:** React 19, TypeScript strict, CSS Modules, Web Audio API

---

## File Map

| File | Action |
|---|---|
| `src/components/game/Hud.tsx` | Replace 3 buttons with gear icon + settings panel |
| `src/components/game/Hud.module.css` | Remove old button styles, add gear + panel styles |
| `src/lib/audio.ts` | Rewrite `startMusic()` with 3-layer score; add `_musicRunning`, `arpScheduleTimer`, `melodyTimer`, `arpIndex` |
| `src/lib/scene/quality.ts` | Confirm correct — no changes needed |

---

## Task 1: Gear button + settings panel in Hud.tsx

**Files:**
- Modify: `src/components/game/Hud.tsx`

- [ ] **Step 1: Add `settingsOpen` state and click-away effect**

Replace the opening of `Hud` (after the `qualityLabel` const) with:

```tsx
import { useState, useEffect } from 'react'   // add useEffect to existing import

// inside Hud component, after qualityLabel const:
const [settingsOpen, setSettingsOpen] = useState(false)

useEffect(() => {
  if (!settingsOpen) return
  const handler = (e: MouseEvent) => {
    const panel = document.querySelector('[data-settings-panel]')
    const gear  = document.querySelector('[data-gear-btn]')
    if (!panel?.contains(e.target as Node) && !gear?.contains(e.target as Node)) {
      setSettingsOpen(false)
    }
  }
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [settingsOpen])
```

- [ ] **Step 2: Remove the old centerBtns block, add gear + panel**

Find the `<div className={styles.centerBtns}>` block (contains dayNightBtn, qualityBtn, audioBtn) and replace the entire block with:

```tsx
{/* Gear settings button — bottom-left anchor */}
<button
  data-gear-btn
  className={styles.gearBtn}
  onClick={() => setSettingsOpen((v) => !v)}
  title="Settings"
>
  ⚙
</button>

{/* Settings panel — slides up from gear */}
{settingsOpen && (
  <div data-settings-panel className={styles.settingsPanel}>
    <div className={styles.settingsPanelTitle}>⚙ Settings</div>

    <div className={styles.settingsPanelRow}>
      <span className={styles.settingsPanelLabel}>
        {isDay ? '🌙' : '🌅'} Time of Day
      </span>
      <button className={styles.settingsPillBtn} onClick={onToggleDayNight}>
        {isDay ? 'Evening' : 'Morning'}
      </button>
    </div>

    <div className={styles.settingsPanelRow}>
      <span className={styles.settingsPanelLabel}>✨ Quality</span>
      <button className={styles.settingsPillBtn} onClick={onCycleQuality}>
        {qualityLabel}
        {qualityMode === 'auto' && (
          <span className={styles.settingsPanelSub}>
            {effectiveQuality === 'high' ? ' ▲' : ' ▼'}
          </span>
        )}
      </button>
    </div>

    <div className={styles.settingsPanelRow}>
      <span className={styles.settingsPanelLabel}>🔊 Music</span>
      <div
        className={`${styles.settingsToggle} ${audioEnabled ? styles.settingsToggleOn : ''}`}
        onClick={onToggleAudio}
        role="switch"
        aria-checked={audioEnabled}
      >
        <div className={styles.settingsToggleDot} />
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/Hud.tsx
git commit -m "feat: replace HUD control buttons with gear settings panel"
```

---

## Task 2: CSS — gear button + settings panel styles

**Files:**
- Modify: `src/components/game/Hud.module.css`

- [ ] **Step 1: Remove old button styles**

Delete these rule blocks from `Hud.module.css`:
- `.centerBtns { … }`
- `.dayNightBtn { … }`
- `.dayNightBtn:hover { … }`
- `.qualityBtn { … }`
- `.qualityBtn:hover { … }`
- `.qualityAuto { … }`
- `.audioBtn { … }`
- `.audioBtn:hover { … }`

- [ ] **Step 2: Add gear + panel styles**

Append to the end of `Hud.module.css`:

```css
/* ── Gear settings button ───────────────────────────────── */
.gearBtn {
  position: absolute; bottom: 10px; left: 10px;
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(6,4,1,.92); border: 1px solid rgba(201,144,58,.55);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.05rem; color: #f0c060; cursor: pointer; pointer-events: all;
  box-shadow: 0 0 14px rgba(255,107,26,.22); transition: all .25s; z-index: 15;
  padding: 0;
}
.gearBtn:hover { border-color: #f0c060; box-shadow: 0 0 22px rgba(255,107,26,.45); }

/* ── Settings panel ─────────────────────────────────────── */
.settingsPanel {
  position: absolute; bottom: 52px; left: 10px;
  background: rgba(8,5,1,.97); border: 1px solid rgba(201,144,58,.5);
  border-radius: 10px; padding: 10px 14px; min-width: 178px;
  backdrop-filter: blur(14px); pointer-events: all; z-index: 16;
  box-shadow: 0 8px 32px rgba(0,0,0,.8), 0 0 20px rgba(255,107,26,.1);
  animation: panelSlideUp .2s ease;
}
@keyframes panelSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.settingsPanelTitle {
  font-family: 'Cinzel', serif; font-size: .54rem; color: #7a5a20;
  letter-spacing: .14em; text-transform: uppercase; margin-bottom: 8px;
  padding-bottom: 6px; border-bottom: 1px solid rgba(201,144,58,.2);
}

.settingsPanelRow {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 0; gap: 12px;
  border-bottom: 1px solid rgba(201,144,58,.07);
}
.settingsPanelRow:last-child { border-bottom: none; }

.settingsPanelLabel {
  font-size: .58rem; color: #c0a050; white-space: nowrap;
}

.settingsPanelSub {
  font-size: .48rem; color: #7a6040; margin-left: 2px;
}

.settingsPillBtn {
  font-size: .54rem; font-family: 'Cinzel', serif; color: #f0c060;
  background: rgba(201,144,58,.12); border: 1px solid rgba(201,144,58,.35);
  border-radius: 10px; padding: 2px 9px; cursor: pointer; pointer-events: all;
  white-space: nowrap; transition: all .2s;
}
.settingsPillBtn:hover { border-color: #f0c060; background: rgba(201,144,58,.2); }

/* Toggle switch */
.settingsToggle {
  width: 38px; height: 20px; border-radius: 10px; flex-shrink: 0;
  background: #2a1a10; border: 1px solid #4a2a18;
  position: relative; cursor: pointer; pointer-events: all; transition: all .25s;
}
.settingsToggleOn {
  background: #1a4a18; border-color: #3a7a30;
}
.settingsToggleDot {
  position: absolute; top: 3px; left: 3px; width: 12px; height: 12px;
  border-radius: 50%; background: #6a4020; transition: all .25s;
}
.settingsToggleOn .settingsToggleDot {
  left: 21px; background: #66dd66;
}
```

- [ ] **Step 3: Run typecheck and visually confirm in browser**

```bash
bun run typecheck
bun run dev
```

Open `http://localhost:3000`. Confirm:
- No buttons in the top-center
- ⚙ gear appears bottom-left
- Clicking ⚙ opens the panel with Time of Day, Quality, Music rows
- Clicking outside the panel closes it
- Each control still works (day/night, quality cycle, music toggle)

- [ ] **Step 4: Commit**

```bash
git add src/components/game/Hud.module.css
git commit -m "style: gear settings panel CSS — remove old buttons, add panel/toggle styles"
```

---

## Task 3: Genshin Impact-style background music

**Files:**
- Modify: `src/lib/audio.ts`

- [ ] **Step 1: Add module-level vars for the new layers**

Replace the existing module-level block at the top of `audio.ts` (lines 1–9) with:

```ts
// Synthesized audio — no external files required.
// AudioContext is created lazily on first user gesture.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let musicGain: GainNode | null = null
let musicNodes: AudioNode[] = []
let walkTimer: ReturnType<typeof setInterval> | null = null
let _enabled = false
let _musicRunning = false                        // guards arpeggio/melody loops
let arpScheduleTimer: ReturnType<typeof setTimeout> | null = null
let melodyTimer: ReturnType<typeof setTimeout> | null = null
let arpIndex = 0

// Pentatonic C — arpeggio sequence (C4 E4 G4 A4 C5 A4 G4 E4)
const ARP_NOTES = [261.6, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6]
const ARP_INTERVAL = 0.38 // seconds per note

// Melody accent phrase (G4 A4 C5 E5)
const MELODY_NOTES = [392.0, 440.0, 523.3, 659.3]
```

- [ ] **Step 2: Rewrite `startMusic()` — Layer 1: string pad**

Replace the entire `startMusic()` function:

```ts
export function startMusic(): void {
  if (!_enabled || _musicRunning) return
  const c = getCtx()
  const master = getMaster()
  if (!c || !master) return

  _musicRunning = true
  arpIndex = 0

  // Shared music gain — fades in over 3 s
  const gain = c.createGain()
  gain.gain.setValueAtTime(0, c.currentTime)
  gain.gain.linearRampToValueAtTime(1, c.currentTime + 3)
  gain.connect(master)
  musicGain = gain

  // ── Layer 1: Warm string pad ──────────────────────────────
  // C pentatonic chord: C3 E3 G3 A3 D4
  const padFreqs: Array<{ freq: number; type: OscillatorType; amp: number; lfoRate: number }> = [
    { freq: 130.8, type: 'sine',     amp: 0.9, lfoRate: 0.055 }, // C3
    { freq: 164.8, type: 'sine',     amp: 0.6, lfoRate: 0.071 }, // E3
    { freq: 196.0, type: 'triangle', amp: 0.7, lfoRate: 0.043 }, // G3
    { freq: 220.0, type: 'sine',     amp: 0.5, lfoRate: 0.062 }, // A3
    { freq: 293.7, type: 'triangle', amp: 0.4, lfoRate: 0.038 }, // D4
  ]

  const padGain = c.createGain()
  padGain.gain.value = 0.045
  padGain.connect(gain)

  padFreqs.forEach(({ freq, type, amp, lfoRate }) => {
    const osc = c.createOscillator()
    osc.type = type
    osc.frequency.value = freq

    // Slow swell LFO
    const lfo = c.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = lfoRate
    const lfoAmt = c.createGain()
    lfoAmt.gain.value = freq * 0.0025
    lfo.connect(lfoAmt)
    lfoAmt.connect(osc.frequency)

    const vGain = c.createGain()
    vGain.gain.value = amp
    osc.connect(vGain)
    vGain.connect(padGain)

    osc.start()
    lfo.start()
    musicNodes.push(osc, lfo)
  })

  // ── Layer 2: Harp arpeggio (look-ahead scheduled) ─────────
  const arpGain = c.createGain()
  arpGain.gain.value = 0.08
  arpGain.connect(gain)

  scheduleArpNote(c, arpGain, c.currentTime)

  // ── Layer 3: Melody accent (randomised timing) ─────────────
  scheduleMelodyAccent(gain)
}
```

- [ ] **Step 3: Add `scheduleArpNote()` helper (after `startMusic`)**

```ts
function scheduleArpNote(c: AudioContext, arpGain: GainNode, scheduleAt: number): void {
  if (!_musicRunning) return

  const freq = ARP_NOTES[arpIndex % ARP_NOTES.length]!
  arpIndex++

  const osc = c.createOscillator()
  osc.type = 'sine'
  // Tiny frequency jitter for "string resonance" feel
  osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.8, scheduleAt)

  const env = c.createGain()
  env.gain.setValueAtTime(0, scheduleAt)
  env.gain.linearRampToValueAtTime(1, scheduleAt + 0.008)
  env.gain.exponentialRampToValueAtTime(0.001, scheduleAt + 0.35)

  osc.connect(env)
  env.connect(arpGain)
  osc.start(scheduleAt)
  osc.stop(scheduleAt + 0.42)
  musicNodes.push(osc)

  // Fire next note scheduling 30 ms before it's due (look-ahead)
  const msUntilNext = (scheduleAt - c.currentTime + ARP_INTERVAL) * 1000 - 30
  arpScheduleTimer = setTimeout(() => {
    const c2 = getCtx()
    if (!c2 || !_musicRunning) return
    scheduleArpNote(c2, arpGain, scheduleAt + ARP_INTERVAL)
  }, Math.max(0, msUntilNext))
}
```

- [ ] **Step 4: Add `scheduleMelodyAccent()` and `playMelodyAccent()` helpers**

```ts
function scheduleMelodyAccent(musicGainNode: GainNode): void {
  if (!_musicRunning) return
  const delay = 12000 + Math.random() * 6000 // 12–18 s
  melodyTimer = setTimeout(() => {
    if (!_musicRunning) return
    playMelodyAccent(musicGainNode)
    scheduleMelodyAccent(musicGainNode) // schedule the next one
  }, delay)
}

function playMelodyAccent(musicGainNode: GainNode): void {
  const c = getCtx()
  if (!c || !_musicRunning) return

  const accentGain = c.createGain()
  accentGain.gain.value = 0.07
  accentGain.connect(musicGainNode)

  MELODY_NOTES.forEach((freq, i) => {
    const t = c.currentTime + i * 0.5

    // Sine + detuned shimmer (+7 cents) for flute-like tone
    const detunedFreq = freq * Math.pow(2, 7 / 1200)
    ;[freq, detunedFreq].forEach((f) => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f

      const env = c.createGain()
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(1, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.55)

      osc.connect(env)
      env.connect(accentGain)
      osc.start(t)
      osc.stop(t + 0.62)
      musicNodes.push(osc)
    })
  })
}
```

- [ ] **Step 5: Update `stopMusic()` to clean up new timers**

Replace the entire `stopMusic()` function:

```ts
export function stopMusic(): void {
  _musicRunning = false

  if (arpScheduleTimer !== null) { clearTimeout(arpScheduleTimer); arpScheduleTimer = null }
  if (melodyTimer !== null)       { clearTimeout(melodyTimer);       melodyTimer = null }
  arpIndex = 0

  const c = getCtx()
  const nodesToStop = [...musicNodes]
  const gainToFade = musicGain
  musicNodes = []
  musicGain = null

  if (c && gainToFade) {
    gainToFade.gain.setValueAtTime(gainToFade.gain.value, c.currentTime)
    gainToFade.gain.linearRampToValueAtTime(0, c.currentTime + 1.5)
    setTimeout(() => {
      nodesToStop.forEach((n) => { try { (n as OscillatorNode).stop() } catch { /* already stopped */ } })
      try { gainToFade.disconnect() } catch { /* ignore */ }
    }, 1600)
  } else {
    nodesToStop.forEach((n) => { try { (n as OscillatorNode).stop() } catch { /* already stopped */ } })
  }
}
```

- [ ] **Step 6: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 7: Smoke-test in browser**

```bash
bun run dev
```

Open `http://localhost:3000`. Click "Explore My Work":
- After ~3 s you should hear a warm pad sound build in
- Shortly after, a gentle harp-like arpeggio plays continuously
- After 12–18 s, a short 4-note melody phrase plays
- Opening the settings panel and toggling Music off fades everything out cleanly
- Toggling Music back on restarts all layers

- [ ] **Step 8: Commit**

```bash
git add src/lib/audio.ts
git commit -m "feat: Genshin-style 3-layer ambient music — pad, harp arpeggio, melody accent"
```

---

## Task 4: Confirm shadow restore (audit only)

**Files:**
- Read-only audit: `src/lib/scene/quality.ts`, `src/hooks/useThreeScene.ts`

- [ ] **Step 1: Verify `quality.ts` high-mode restore path**

Open `src/lib/scene/quality.ts` and confirm these lines exist in `applyQuality`:

```ts
refs.renderer.shadowMap.enabled = !isLow
refs.renderer.shadowMap.needsUpdate = true
```

And that the tree traverse block sets `castShadow = !isLow` (true when high, false when low). This is already correct — no code change needed.

- [ ] **Step 2: Verify renderer shadow map init**

Open `src/hooks/useThreeScene.ts` and confirm:

```ts
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
```

These lines must exist before the scene is built. Already correct — no change needed.

- [ ] **Step 3: Manual shadow verification in browser**

```bash
bun run dev
```

1. Open `http://localhost:3000`, click "Explore My Work"
2. Open Settings panel → Quality → cycle to **🔋 Performance**
3. Confirm no shadows on terrain/player/rocks
4. Cycle Quality back to **✨ Quality** (or **⚙ Auto** if FPS > 55)
5. Confirm shadows return on the island terrain and objects

If shadows don't return after step 4: in `quality.ts`, after `renderer.shadowMap.enabled = true`, add `renderer.shadowMap.needsUpdate = true` (it should already be there — this is a confirmation step, not a change).

- [ ] **Step 4: Commit (only if any fix was needed)**

```bash
# Only run if step 3 revealed a real bug and you changed a file:
git add src/lib/scene/quality.ts
git commit -m "fix: ensure shadow map needsUpdate fires on quality restore"
```

---

## Final Verification

- [ ] Run `bun run typecheck` — zero errors
- [ ] Run `bun run lint` — zero warnings
- [ ] In browser: gear icon visible bottom-left, no stray buttons in top-center
- [ ] Settings panel opens/closes, all three controls work
- [ ] Music plays on start, has audible arpeggio layer within 5 s
- [ ] Melody accent plays after ~15 s
- [ ] Muting stops music cleanly; unmuting restarts
- [ ] Shadows present in high/auto-high mode, absent in low mode
- [ ] No console errors
