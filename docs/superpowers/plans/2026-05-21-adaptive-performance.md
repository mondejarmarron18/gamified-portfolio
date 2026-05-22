# Adaptive Performance / Quality Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically detect when the visitor's browser is lagging and reduce graphics quality (butterflies, shadows, pixel ratio) to maintain playable performance, then restore quality when it recovers.

**Architecture:** A rolling-window FPS tracker (`FpsTracker`) measures average frame rate from `dt` values in the game loop. When the average drops below 30fps for 2 seconds the scene steps down one quality tier (high → medium → low); when it exceeds 55fps for 5 seconds it steps back up. Each tier change calls `applyQuality()` which adjusts renderer pixel ratio, shadow map, and butterfly visibility. Hysteresis (slow to upgrade, fast to downgrade) prevents thrashing.

**Tech Stack:** TypeScript, Three.js, React refs (no new state management needed — this is a pure rendering concern)

---

## File structure

| File | Change |
|---|---|
| `src/lib/performance.ts` | **Create** — `QualityTier` type + `FpsTracker` class |
| `src/components/game/GameCanvas.tsx` | **Modify** — import tracker, `applyQuality()` helper, integrate into game loop |

---

### Task 1: Create the FPS tracker (`src/lib/performance.ts`)

**Files:**
- Create: `src/lib/performance.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/performance.ts

export type QualityTier = 'high' | 'medium' | 'low'

/**
 * Tracks a rolling-window average FPS and derives a quality tier.
 *
 * Downgrade rules (fast — 2s):
 *   avg < 30fps → step down one tier (high→medium, or medium→low)
 *
 * Upgrade rules (slow — 5s, with hysteresis):
 *   avg > 55fps → step up one tier (low→medium, or medium→high)
 *
 * Waits for 30 samples before making any decision to avoid false
 * positives on first load.
 */
export class FpsTracker {
  private samples: number[] = []
  private readonly windowSize = 90
  private tier: QualityTier = 'high'
  private timerBad  = 0  // seconds spent below the downgrade threshold
  private timerGood = 0  // seconds spent above the upgrade threshold

  /** Call once per frame with the frame delta time in seconds. Returns current tier. */
  update(dt: number): QualityTier {
    const fps = dt > 0 ? Math.min(1 / dt, 120) : 60
    this.samples.push(fps)
    if (this.samples.length > this.windowSize) this.samples.shift()

    // Wait for a stable sample window before reacting
    if (this.samples.length < 30) return this.tier

    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length

    if (avg < 30) {
      this.timerBad  += dt
      this.timerGood  = 0
      if (this.timerBad > 2 && this.tier !== 'low') {
        this.tier     = this.tier === 'high' ? 'medium' : 'low'
        this.timerBad = 0
      }
    } else if (avg > 55) {
      this.timerGood += dt
      this.timerBad   = 0
      if (this.timerGood > 5 && this.tier !== 'high') {
        this.tier      = this.tier === 'low' ? 'medium' : 'high'
        this.timerGood = 0
      }
    } else {
      // 30–55 fps: neither improving nor degrading — hold current tier
      this.timerBad  = 0
      this.timerGood = 0
    }

    return this.tier
  }

  getTier(): QualityTier { return this.tier }
}
```

- [ ] **Step 2: Verify TypeScript accepts the file**

```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/performance.ts
git commit -m "feat: add FpsTracker for adaptive quality scaling"
```

---

### Task 2: Wire the tracker into GameCanvas and apply quality changes

**Files:**
- Modify: `src/components/game/GameCanvas.tsx`

The current imports section starts around line 1–24. The game loop callback starts at line 254 (`useGameLoop(useCallback((dt, elapsed) => {`). Butterfly update is at line 342 (`updateButterflies(...)`). Rabbit update is at line 304.

- [ ] **Step 1: Add imports at the top of GameCanvas.tsx**

Add after the existing imports (after line 15 `import { updateButterflies } ...`):

```ts
import { FpsTracker } from '@/lib/performance'
import type { QualityTier } from '@/lib/performance'
import type { SceneRefs } from '@/hooks/useThreeScene'
```

- [ ] **Step 2: Add `applyQuality` function**

Add this as a module-level function (before the `GameCanvas` component, around line 30 where `SPEED` and `BOUNDS` constants are):

```ts
function applyQuality(refs: SceneRefs, tier: QualityTier): void {
  // Pixel ratio — most impactful single change
  const dpr =
    tier === 'high'   ? Math.min(window.devicePixelRatio, 2) :
    tier === 'medium' ? Math.min(window.devicePixelRatio, 1.5) :
                        1.0
  refs.renderer.setPixelRatio(dpr)

  // Shadows — expensive; disable entirely on low
  refs.renderer.shadowMap.enabled = tier !== 'low'

  // Butterflies — visually nice but CPU/GPU heavy
  // high: all 7, medium: first 3, low: none
  refs.butterflies.forEach((b, i) => {
    b.visible =
      tier === 'high'   ? true :
      tier === 'medium' ? i < 3 :
      false
  })
}
```

- [ ] **Step 3: Add tracker and frame-count refs inside the component**

Add alongside the other `useRef` calls near the top of the `GameCanvas` function body (around line 55–70 where `campfireActiveRef` is):

```ts
const fpsTrackerRef   = useRef(new FpsTracker())
const qualityTierRef  = useRef<QualityTier>('high')
const frameCountRef   = useRef(0)
```

- [ ] **Step 4: Integrate into the game loop — tier check at the top**

Inside the `useGameLoop(useCallback((dt, elapsed) => {` callback, add these three lines immediately after `const gs = getState()` (around line 258):

```ts
frameCountRef.current++
const tier = fpsTrackerRef.current.update(dt)
if (tier !== qualityTierRef.current) {
  qualityTierRef.current = tier
  applyQuality(refs, tier)
}
```

- [ ] **Step 5: Make butterfly updates tier-aware**

Replace the existing butterfly update line (currently line 342):
```ts
updateButterflies(refs.butterflies, dt, elapsed)
```
With:
```ts
// Skip butterfly animation on low tier (they're hidden anyway, but skip CPU too)
if (tier !== 'low') updateButterflies(refs.butterflies, dt, elapsed)
```

- [ ] **Step 6: Make rabbit updates tier-aware**

Replace the existing rabbit update line (currently line 304):
```ts
void import('@/lib/scene/rabbits').then(({ updateRabbits }) => updateRabbits(refs.rabbitGroups, dt, elapsed))
```
With:
```ts
// Low tier: update rabbits every other frame only
if (tier !== 'low' || frameCountRef.current % 2 === 0)
  void import('@/lib/scene/rabbits').then(({ updateRabbits }) => updateRabbits(refs.rabbitGroups, dt, elapsed))
```

- [ ] **Step 7: Typecheck**

```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Step 8: Manual test — simulate lag**

Open the browser devtools → Performance tab → CPU throttle to 6×.
Navigate to http://localhost:3000 and watch the scene for 10–15 seconds.

Expected behaviour:
- After ~2 seconds of low fps: butterflies should disappear (or reduce to 3)
- After sustained low fps: all butterflies hidden, shadows gone (flat lit scene)
- Remove throttle: after ~5 seconds butterflies gradually return, shadows re-enable

- [ ] **Step 9: Commit**

```bash
git add src/components/game/GameCanvas.tsx
git commit -m "feat: integrate adaptive quality scaling — reduces butterflies/shadows/dpr on lag"
```

---

## Self-Review

**Spec coverage:**
- ✅ Detect lag → `FpsTracker.update()` rolling window
- ✅ Reduce butterflies → `applyQuality` hides them by tier
- ✅ Reduce moving objects → butterflies hidden, rabbits skip frames
- ✅ Reduce graphics → pixel ratio lowered, shadows disabled on low
- ✅ Restore when recovering → upgrade path with 5s hysteresis
- ✅ No impact on gameplay → purely rendering concern, player/camera/interaction unaffected

**Placeholder scan:** none found.

**Type consistency:** `QualityTier` exported from `performance.ts` and imported in `GameCanvas.tsx` — consistent.
