# Polish — MP3 Music, Volume Sliders, Visual & UI Tweaks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace synthesized music with a looping MP3, add separate volume sliders for music and SFX, fix FPS counter position and settings font sizes, make terrain greener/brighter, and add moonlight glow at night.

**Architecture:** `audio.ts` gets a volume-based API (`setMusicVolume`/`setSfxVolume`) replacing the boolean `setAudioEnabled`; a dedicated `sfxGain` node routes all effects independently from music. Hud replaces the music toggle with two `<input type="range">` sliders. Visual changes are isolated to `island.ts` (terrain color), `lighting.ts` (moonPoint light), and `sky.ts` (moon glow halo + intensity). CSS changes touch only `Hud.module.css`.

**Tech Stack:** React 19, TypeScript strict, Web Audio API (`fetch` + `decodeAudioData`), Three.js, CSS Modules

---

## File Map

| File | Action |
|---|---|
| `src/lib/audio.ts` | Full rewrite: MP3 via fetch/decodeAudioData, sfxGain bus, `setMusicVolume`/`setSfxVolume` |
| `src/components/game/GameCanvas.tsx` | Replace `audioEnabled` state with `musicVolume`/`sfxVolume`; update audio imports |
| `src/components/game/Hud.tsx` | Replace music toggle row with two volume slider rows |
| `src/components/game/Hud.module.css` | Slider styles, larger settings font sizes, FPS counter repositioned |
| `src/lib/scene/island.ts` | Dirt color → grassy green |
| `src/lib/scene/lighting.ts` | Add `moonPoint: THREE.PointLight` to `LightHandles` + `buildLighting` |
| `src/lib/scene/sky.ts` | Add moon glow halo mesh + `moonGlow` to `SkyHandles`; increase night moon intensity |

---

## Task 1: Rewrite audio.ts — MP3 + sfxGain + volume API

**Files:**
- Modify: `src/lib/audio.ts`

- [ ] **Step 1: Replace the entire file with the new implementation**

The MP3 is served from `/assets/audios/background.mp3` (lives in `src/public/assets/audios/`).

Write the complete new `src/lib/audio.ts`:

```ts
// Background music via MP3 loop + synthesized SFX.
// AudioContext is created lazily on first user gesture.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null   // master bus (fixed at 0.8)
let musicGain: GainNode | null = null    // music bus — volume controlled by setMusicVolume
let sfxGain: GainNode | null = null      // sfx bus — volume controlled by setSfxVolume
let musicSource: AudioBufferSourceNode | null = null
let walkTimer: ReturnType<typeof setInterval> | null = null
let _musicVolume = 0.7
let _sfxVolume = 0.8

// ── Internal helpers ─────────────────────────────────────────

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function getMaster(): GainNode | null {
  const c = getCtx()
  if (!c) return null
  if (!masterGain) {
    masterGain = c.createGain()
    masterGain.gain.value = 0.8
    masterGain.connect(c.destination)
  }
  return masterGain
}

function getMusicBus(): GainNode | null {
  const c = getCtx()
  const master = getMaster()
  if (!c || !master) return null
  if (!musicGain) {
    musicGain = c.createGain()
    musicGain.gain.value = _musicVolume
    musicGain.connect(master)
  }
  return musicGain
}

function getSfxBus(): GainNode | null {
  const c = getCtx()
  const master = getMaster()
  if (!c || !master) return null
  if (!sfxGain) {
    sfxGain = c.createGain()
    sfxGain.gain.value = _sfxVolume
    sfxGain.connect(master)
  }
  return sfxGain
}

// ── Music ────────────────────────────────────────────────────

async function startMusic(): Promise<void> {
  const c = getCtx()
  const bus = getMusicBus()
  if (!c || !bus || musicSource) return
  try {
    const res = await fetch('/assets/audios/background.mp3')
    const buf = await res.arrayBuffer()
    const decoded = await c.decodeAudioData(buf)
    if (musicSource) return // guard against double-fetch race
    const src = c.createBufferSource()
    src.buffer = decoded
    src.loop = true
    src.connect(bus)
    src.start()
    musicSource = src
  } catch (err) {
    console.warn('[audio] Failed to load background music:', err)
  }
}

function stopMusic(): void {
  if (musicSource) {
    try { musicSource.stop() } catch { /* already stopped */ }
    musicSource = null
  }
}

// ── Public API ───────────────────────────────────────────────

/** Set music volume 0–1. Starts music on first call with v > 0. */
export function setMusicVolume(v: number): void {
  _musicVolume = Math.max(0, Math.min(1, v))
  if (musicGain) musicGain.gain.value = _musicVolume
  if (_musicVolume > 0 && !musicSource) void startMusic()
  if (_musicVolume === 0) stopMusic()
}

/** Set SFX volume 0–1. */
export function setSfxVolume(v: number): void {
  _sfxVolume = Math.max(0, Math.min(1, v))
  if (sfxGain) sfxGain.gain.value = _sfxVolume
}

export function startWalkSound(): void {
  if (_sfxVolume === 0 || walkTimer !== null) return
  playStep()
  walkTimer = setInterval(playStep, 380)
}

export function stopWalkSound(): void {
  if (walkTimer !== null) {
    clearInterval(walkTimer)
    walkTimer = null
  }
}

function playStep(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  const bufSize = Math.floor(c.sampleRate * 0.05)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 500
  const env = c.createGain()
  env.gain.setValueAtTime(0.14, c.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05)
  src.connect(filter)
  filter.connect(env)
  env.connect(sfx)
  src.start()
  src.stop(c.currentTime + 0.08)
}

export function playMineHit(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  // Metallic clang with pitch drop
  const osc = c.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(820, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.14)
  const filt = c.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = 600
  filt.Q.value = 2.5
  const env = c.createGain()
  env.gain.setValueAtTime(0.18, c.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16)
  osc.connect(filt)
  filt.connect(env)
  env.connect(sfx)
  osc.start()
  osc.stop(c.currentTime + 0.18)

  // Low impact thud
  const bufSize = Math.floor(c.sampleRate * 0.06)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 160
  const env2 = c.createGain()
  env2.gain.setValueAtTime(0.28, c.currentTime)
  env2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09)
  src.connect(lp)
  lp.connect(env2)
  env2.connect(sfx)
  src.start()
  src.stop(c.currentTime + 0.11)
}

export function playRockExplode(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  const bufSize = Math.floor(c.sampleRate * 0.6)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(700, c.currentTime)
  filter.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.45)
  filter.Q.value = 0.7
  const env = c.createGain()
  env.gain.setValueAtTime(0.5, c.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55)
  src.connect(filter)
  filter.connect(env)
  env.connect(sfx)
  src.start()
  src.stop(c.currentTime + 0.6)
}

export function playModalOpen(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  // Ascending C major arpeggio chime
  const freqs = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  freqs.forEach((freq, i) => {
    const t = c.currentTime + i * 0.07
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const env = c.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.11, t + 0.008)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.75)
    osc.connect(env)
    env.connect(sfx)
    osc.start(t)
    osc.stop(t + 0.8)
  })
}

export function cleanupAudio(): void {
  stopMusic()
  stopWalkSound()
  if (ctx) {
    void ctx.close()
    ctx = null
    masterGain = null
    musicGain = null
    sfxGain = null
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/audio.ts
git commit -m "feat: replace synthesized music with MP3 loop, add separate sfxGain volume bus"
```

---

## Task 2: GameCanvas — wire musicVolume/sfxVolume, update imports

**Files:**
- Modify: `src/components/game/GameCanvas.tsx`

- [ ] **Step 1: Update imports — remove setAudioEnabled, add setMusicVolume/setSfxVolume**

Replace the audio import block:

```ts
import {
  setAudioEnabled,
  startWalkSound,
  stopWalkSound,
  playMineHit,
  playRockExplode,
  playModalOpen,
  cleanupAudio,
} from '@/lib/audio'
```

With:

```ts
import {
  setMusicVolume,
  setSfxVolume,
  startWalkSound,
  stopWalkSound,
  playMineHit,
  playRockExplode,
  playModalOpen,
  cleanupAudio,
} from '@/lib/audio'
```

- [ ] **Step 2: Replace audioEnabled state with musicVolume + sfxVolume**

Remove:
```ts
const [audioEnabled, setAudioEnabledState] = useState(true)
```

Add in its place:
```ts
const [musicVolume, setMusicVolumeState] = useState(0.7)
const [sfxVolume, setSfxVolumeState] = useState(0.8)
```

- [ ] **Step 3: Replace handleToggleAudio with two volume handlers**

Remove the `handleToggleAudio` callback entirely.

Add after `handleCycleQuality`:

```ts
const handleMusicVolumeChange = useCallback((v: number) => {
  setMusicVolumeState(v)
  setMusicVolume(v)
}, [])

const handleSfxVolumeChange = useCallback((v: number) => {
  setSfxVolumeState(v)
  setSfxVolume(v)
}, [])
```

- [ ] **Step 4: Fix game start — replace setAudioEnabled with setMusicVolume**

Find:
```ts
<button className={styles.introBtn} onClick={() => { setGameStarted(true); setAudioEnabled(true) }}>
```

Replace with:
```ts
<button className={styles.introBtn} onClick={() => { setGameStarted(true); setMusicVolume(0.7); setSfxVolume(0.8) }}>
```

- [ ] **Step 5: Update Hud props — replace audioEnabled/onToggleAudio**

Find the `<Hud ... />` JSX and replace `audioEnabled` and `onToggleAudio` props:

```tsx
<Hud
  isDay={isDay}
  onToggleDayNight={handleToggleDayNight}
  hintLabels={hintLabels}
  isMobile={IS_MOBILE}
  fps={fps}
  qualityMode={qualityMode}
  effectiveQuality={effectiveQuality}
  onCycleQuality={handleCycleQuality}
  musicVolume={musicVolume}
  sfxVolume={sfxVolume}
  onMusicVolumeChange={handleMusicVolumeChange}
  onSfxVolumeChange={handleSfxVolumeChange}
/>
```

- [ ] **Step 6: Run typecheck**

```bash
bun run typecheck
```

Expected: errors only in Hud.tsx (Props not updated yet — fixed in Task 3).

- [ ] **Step 7: Commit**

```bash
git add src/components/game/GameCanvas.tsx
git commit -m "feat: replace audioEnabled toggle with musicVolume/sfxVolume in GameCanvas"
```

---

## Task 3: Hud — replace music toggle with volume sliders

**Files:**
- Modify: `src/components/game/Hud.tsx`

- [ ] **Step 1: Update Props interface**

Replace the old audio props:

```ts
interface Props {
  isDay: boolean
  onToggleDayNight: () => void
  hintLabels: HintLabel[]
  isMobile: boolean
  fps: number
  qualityMode: 'auto' | 'high' | 'low'
  effectiveQuality: 'high' | 'low'
  onCycleQuality: () => void
  musicVolume: number
  sfxVolume: number
  onMusicVolumeChange: (v: number) => void
  onSfxVolumeChange: (v: number) => void
}
```

- [ ] **Step 2: Update function signature**

Replace:
```ts
export function Hud({ isDay, onToggleDayNight, hintLabels, isMobile, fps, qualityMode, effectiveQuality, onCycleQuality, audioEnabled, onToggleAudio }: Props) {
```

With:
```ts
export function Hud({ isDay, onToggleDayNight, hintLabels, isMobile, fps, qualityMode, effectiveQuality, onCycleQuality, musicVolume, sfxVolume, onMusicVolumeChange, onSfxVolumeChange }: Props) {
```

- [ ] **Step 3: Replace the music toggle row with two slider rows**

In the settings panel JSX, find the Music row:

```tsx
<div className={styles.settingsPanelRow}>
  <span className={styles.settingsPanelLabel}>🔊 Music</span>
  <div
    className={`${styles.settingsToggle} ${audioEnabled ? styles.settingsToggleOn : ''}`}
    onClick={onToggleAudio}
    role="switch"
    aria-checked={audioEnabled}
    aria-label="Music"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggleAudio() } }}
  >
    <div className={styles.settingsToggleDot} />
  </div>
</div>
```

Replace with two rows:

```tsx
<div className={styles.settingsPanelRow}>
  <span className={styles.settingsPanelLabel}>🎵 Music</span>
  <input
    type="range"
    min={0}
    max={1}
    step={0.05}
    value={musicVolume}
    onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
    className={styles.volSlider}
    aria-label="Music volume"
  />
</div>

<div className={styles.settingsPanelRow}>
  <span className={styles.settingsPanelLabel}>⚡ Effects</span>
  <input
    type="range"
    min={0}
    max={1}
    step={0.05}
    value={sfxVolume}
    onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
    className={styles.volSlider}
    aria-label="Effects volume"
  />
</div>
```

- [ ] **Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/game/Hud.tsx
git commit -m "feat: replace music toggle with music/effects volume sliders in settings panel"
```

---

## Task 4: CSS — slider styles, larger fonts, FPS reposition

**Files:**
- Modify: `src/components/game/Hud.module.css`

- [ ] **Step 1: Increase settings font sizes**

Find and update these rules:

```css
/* OLD */
.settingsPanelTitle {
  font-family: 'Cinzel', serif; font-size: .54rem; color: #7a5a20;
  letter-spacing: .14em; text-transform: uppercase; margin-bottom: 8px;
  padding-bottom: 6px; border-bottom: 1px solid rgba(201,144,58,.2);
}
.settingsPanelLabel {
  font-size: .58rem; color: #c0a050; white-space: nowrap;
}
.settingsPillBtn {
  font-size: .54rem; font-family: 'Cinzel', serif; color: #f0c060;
  background: rgba(201,144,58,.12); border: 1px solid rgba(201,144,58,.35);
  border-radius: 10px; padding: 2px 9px; cursor: pointer; pointer-events: all;
  white-space: nowrap; transition: all .2s;
}
```

Replace with:

```css
.settingsPanelTitle {
  font-family: 'Cinzel', serif; font-size: .72rem; color: #7a5a20;
  letter-spacing: .14em; text-transform: uppercase; margin-bottom: 8px;
  padding-bottom: 6px; border-bottom: 1px solid rgba(201,144,58,.2);
}
.settingsPanelLabel {
  font-size: .76rem; color: #c0a050; white-space: nowrap;
}
.settingsPillBtn {
  font-size: .7rem; font-family: 'Cinzel', serif; color: #f0c060;
  background: rgba(201,144,58,.12); border: 1px solid rgba(201,144,58,.35);
  border-radius: 10px; padding: 3px 11px; cursor: pointer; pointer-events: all;
  white-space: nowrap; transition: all .2s;
}
```

Also widen the panel min-width to accommodate larger text. Find:

```css
.settingsPanel {
  position: absolute; bottom: 52px; left: 10px;
  background: rgba(8,5,1,.97); border: 1px solid rgba(201,144,58,.5);
  border-radius: 10px; padding: 10px 14px; min-width: 178px;
```

Change `min-width: 178px` to `min-width: 210px`.

- [ ] **Step 2: Move FPS counter to bottom level (same as gear)**

Find:

```css
.fpsCounter {
  position: absolute; bottom: 52px; right: 16px;
```

Change to:

```css
.fpsCounter {
  position: absolute; bottom: 10px; right: 16px;
```

- [ ] **Step 3: Remove old toggle styles, add volume slider styles**

Remove these rules that are no longer used:
```css
.settingsToggle { … }
.settingsToggleOn { … }
.settingsToggleDot { … }
.settingsToggleOn .settingsToggleDot { … }
```

Append at the end of the file:

```css
/* ── Volume sliders ─────────────────────────────────────────── */
.volSlider {
  -webkit-appearance: none; appearance: none;
  width: 88px; height: 4px; border-radius: 2px; outline: none;
  background: linear-gradient(90deg, #f0c060, #f0c060) no-repeat,
              #2a1a08;
  background-size: 70% 100%;
  cursor: pointer; pointer-events: all; transition: background-size .1s;
}
.volSlider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px; border-radius: 50%;
  background: #f0c060; border: 2px solid #c07820;
  box-shadow: 0 0 6px rgba(255,160,40,.5);
  cursor: pointer;
}
.volSlider::-moz-range-thumb {
  width: 14px; height: 14px; border-radius: 50%;
  background: #f0c060; border: 2px solid #c07820;
  box-shadow: 0 0 6px rgba(255,160,40,.5);
  cursor: pointer;
}
.volSlider:focus-visible { outline: 2px solid #f0c060; outline-offset: 3px; }
```

**Note:** The `background-size: 70% 100%` above is a static default. The slider track fill will visually update via the browser's built-in range styling; this is a baseline style, not dynamic fill. Dynamic fill would require JS — skip it (YAGNI).

- [ ] **Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/game/Hud.module.css
git commit -m "style: larger settings fonts, FPS counter to bottom, volume slider styles"
```

---

## Task 5: Brighter/greener terrain — island.ts

**Files:**
- Modify: `src/lib/scene/island.ts`

- [ ] **Step 1: Change the dirt surface color to grassy green**

Find:

```ts
const dirt = new THREE.Mesh(
  dGeo,
  new THREE.MeshStandardMaterial({ map: tex.dirt, color: 0x6a4a2a, roughness: 0.94, metalness: 0.02 }),
)
```

Change the color to `0x7a9a35` (warm grass green — still earthy, reads as a grassy island):

```ts
const dirt = new THREE.Mesh(
  dGeo,
  new THREE.MeshStandardMaterial({ map: tex.dirt, color: 0x7a9a35, roughness: 0.92, metalness: 0.02 }),
)
```

- [ ] **Step 2: Brighten decor rock and cliff colors slightly**

The rock base at `0x4a443a` is very dark. Lighten to `0x5a5448`:

Find:
```ts
new THREE.MeshStandardMaterial({ map: tex.rock, color: 0x4a443a, roughness: 0.97, metalness: 0.06 }),
```

Change to:
```ts
new THREE.MeshStandardMaterial({ map: tex.rock, color: 0x5a5448, roughness: 0.95, metalness: 0.06 }),
```

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/scene/island.ts
git commit -m "style: brighter grassy terrain color, lighten cliff rock base"
```

---

## Task 6: Moonlight — add PointLight + moon glow halo

**Files:**
- Modify: `src/lib/scene/lighting.ts`
- Modify: `src/lib/scene/sky.ts`

### Part A — lighting.ts: add moonPoint to LightHandles

- [ ] **Step 1: Add `moonPoint` to `LightHandles` and `buildLighting`**

In `src/lib/scene/lighting.ts`, update `LightHandles`:

```ts
export interface LightHandles {
  moon: THREE.DirectionalLight
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
  forge: THREE.PointLight
  moonPoint: THREE.PointLight   // soft blue ground fill at night
}
```

In `buildLighting`, add after `scene.add(moon)`:

```ts
// Soft moonlight point — activates at night via applyDayNight
const moonPoint = new THREE.PointLight(0x99aadd, 0, 60)
moonPoint.name = 'moonPoint'
moonPoint.position.set(-10, 28, 8)
scene.add(moonPoint)
```

Update the return:

```ts
return { moon, sun, hemi, forge, moonPoint }
```

### Part B — sky.ts: add moon glow halo + animate

- [ ] **Step 2: Add `moonGlow` to `SkyHandles`**

In `src/lib/scene/sky.ts`, update `SkyHandles`:

```ts
export interface SkyHandles {
  stars: THREE.Points
  moonDisc: THREE.Mesh
  moonGlow: THREE.Mesh   // soft halo ring around moon
  sunDisc: THREE.Mesh
  sunGlow: THREE.Mesh
  clouds: THREE.Group[]
}
```

- [ ] **Step 3: Build the moon glow halo in `buildSky`**

After `scene.add(moonDisc)` (line 52), add:

```ts
// Moon glow halo — larger translucent ring behind the disc
const moonGlow = new THREE.Mesh(
  new THREE.CircleGeometry(9, 32),
  new THREE.MeshBasicMaterial({
    color: 0xaabbee,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  }),
)
moonGlow.position.set(-45, 55, -80.5) // slightly behind moonDisc
scene.add(moonGlow)
```

Update the return to include `moonGlow`:

```ts
return { stars, moonDisc, moonGlow, sunDisc, sunGlow, clouds }
```

- [ ] **Step 4: Animate moonGlow + moonPoint + boost moon intensity in `applyDayNight`**

In the `isDay` branch (going from night → day), find:

```ts
;(sky.moonDisc.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - ep)
```

Add below it:
```ts
;(sky.moonGlow.material as THREE.MeshBasicMaterial).opacity = 0.18 * (1 - ep)
lights.moonPoint.intensity = 2.5 * (1 - ep)
```

And find:
```ts
lights.moon.intensity = 1.4 * (1 - ep)
```
Change to:
```ts
lights.moon.intensity = 2.4 * (1 - ep)
```

In the `!isDay` branch (going from day → night), find:

```ts
;(sky.moonDisc.material as THREE.MeshBasicMaterial).opacity = ep * 0.55
```

Add below it:
```ts
;(sky.moonGlow.material as THREE.MeshBasicMaterial).opacity = ep * 0.18
lights.moonPoint.intensity = ep * 2.5
```

And find:
```ts
lights.moon.intensity = ep * 1.4
```
Change to:
```ts
lights.moon.intensity = ep * 2.4
```

- [ ] **Step 5: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors (if `LightHandles` interface change in lighting.ts breaks useThreeScene, it will surface here).

- [ ] **Step 6: Verify useThreeScene still compiles**

```bash
grep -n "moonPoint\|LightHandles" src/hooks/useThreeScene.ts
```

`useThreeScene` uses `refs.lights` which is typed as `LightHandles`. The new `moonPoint` field is added to the interface, so TypeScript will require no change at call sites — it's just an extra field on the returned object. The `applyDayNight` call in GameCanvas passes `refs.lights` which now carries `moonPoint`. Confirm no errors from typecheck output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/scene/lighting.ts src/lib/scene/sky.ts
git commit -m "feat: add moonlight point light and moon glow halo for night mode"
```

---

## Task 7: Shadow — confirm performance-only (audit)

**Files:**
- Read-only: `src/lib/scene/quality.ts`

- [ ] **Step 1: Verify current behaviour**

Open `src/lib/scene/quality.ts` and confirm:

```ts
refs.renderer.shadowMap.enabled = !isLow
refs.renderer.shadowMap.needsUpdate = true
```

When `q === 'low'` (Performance): `!isLow = false` → shadows disabled ✓  
When `q === 'high'` (Quality): `!isLow = true` → shadows enabled ✓

If these lines exist and are correct, **no code change is needed**.

- [ ] **Step 2: If a bug is found, fix and commit**

If `needsUpdate = true` is missing or the logic is inverted, apply the fix:

```ts
refs.renderer.shadowMap.enabled = !isLow
refs.renderer.shadowMap.needsUpdate = true
```

```bash
git add src/lib/scene/quality.ts
git commit -m "fix: ensure shadows only disabled in performance mode"
```

If no bug is found, skip this step.

---

## Final Verification

- [ ] `bun run typecheck` — zero errors
- [ ] In browser: click "Explore My Work" → MP3 music plays within 1–2 s
- [ ] Settings panel shows 🎵 Music slider and ⚡ Effects slider (no toggle)
- [ ] Dragging Music slider to 0 stops music; raising it restarts
- [ ] Dragging Effects slider to 0 silences mine hits and modal chimes
- [ ] Settings text is visibly larger than before
- [ ] FPS counter sits at bottom-right, same vertical level as the ⚙ gear
- [ ] Terrain is noticeably greener/brighter than before
- [ ] Switching to Evening mode shows the moon glow halo and brighter moonlight on terrain
- [ ] Performance mode: no shadows. Quality mode: shadows present
