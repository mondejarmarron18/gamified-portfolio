# Performance Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-state quality toggle (Auto / Force High / Force Low) that hides decorative scene objects and reduces renderer settings in low mode, with auto-detection that switches based on rolling FPS average.

**Architecture:** A new `quality.ts` module owns the `applyQuality` function which sets `visible` flags and renderer settings. `GameCanvas.tsx` owns auto-detection logic using refs (not React state) to avoid re-renders. The 3-state mode is stored in Zustand and persisted to `localStorage`.

**Tech Stack:** Three.js, Zustand, React 19, TypeScript strict

---

## File Map

| File | Change |
|---|---|
| `src/types/game.ts` | Add `qualityMode`, `effectiveQuality` to `GameState` |
| `src/lib/state.ts` | Add fields + `setQualityMode` / `setEffectiveQuality` actions |
| `src/lib/scene/island.ts` | `buildGrass` → returns `THREE.Mesh[]`; `buildTrees` → returns `THREE.Group[]`; `buildFlowers` → returns `THREE.Group[]` |
| `src/lib/scene/quality.ts` | **New.** Exports `applyQuality(refs, q)` |
| `src/hooks/useThreeScene.ts` | Add `grassMeshes`, `treeGroups`, `flowerGroups` to `SceneRefs`; store returned refs; read localStorage on init and call `applyQuality` |
| `src/components/game/Hud.tsx` | Add `qualityMode`, `effectiveQuality`, `onCycleQuality` props; new quality button |
| `src/components/game/Hud.module.css` | Styles for quality button |
| `src/components/game/GameCanvas.tsx` | Auto-detection logic; skip butterfly updates in low mode; wire `handleCycleQuality`; pass new Hud props |

---

## Task 1: Add quality fields to GameState and store

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/lib/state.ts`

- [ ] **Step 1.1 — Add fields to GameState interface**

In `src/types/game.ts`, add two fields at the end of `GameState`:

```ts
export interface GameState {
  player: Vec2
  target: Vec2 | null
  walking: boolean
  rocks: [RockData, RockData, RockData]
  discovered: number
  stamina: number
  swinging: boolean
  rechargingStamina: boolean
  camPhi: number
  camDist: number
  introZoom: boolean
  introZoomDist: number
  introZoomTarget: number
  signPos: Vec2
  chestPos: Vec2
  scrollPos: Vec2
  chestOpen: boolean
  qualityMode: 'auto' | 'high' | 'low'
  effectiveQuality: 'high' | 'low'
}
```

- [ ] **Step 1.2 — Add actions to GameActions interface and store**

In `src/lib/state.ts`, add to the `GameActions` interface:

```ts
interface GameActions {
  setPlayer: (pos: Vec2) => void
  setTarget: (pos: Vec2 | null) => void
  setWalking: (walking: boolean) => void
  hitRock: (index: 0 | 1 | 2) => void
  crackRock: (index: 0 | 1 | 2) => void
  incrementDiscovered: () => void
  setStamina: (stamina: number) => void
  setSwinging: (swinging: boolean) => void
  setRechargingStamina: (v: boolean) => void
  setCamDist: (dist: number) => void
  setCamPhi: (phi: number) => void
  setIntroZoom: (v: boolean) => void
  setIntroZoomDist: (dist: number) => void
  openChest: () => void
  setQualityMode: (mode: 'auto' | 'high' | 'low') => void
  setEffectiveQuality: (q: 'high' | 'low') => void
}
```

Add to `initialState`:

```ts
const initialState: GameState = {
  // ... existing fields unchanged ...
  qualityMode: 'auto',
  effectiveQuality: 'high',
}
```

Add actions in the `create` call (after `openChest`):

```ts
setQualityMode: (qualityMode) => set({ qualityMode }),
setEffectiveQuality: (effectiveQuality) => set({ effectiveQuality }),
```

- [ ] **Step 1.3 — Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 1.4 — Commit**

```bash
git add src/types/game.ts src/lib/state.ts
git commit -m "feat: add qualityMode and effectiveQuality to game state"
```

---

## Task 2: Update island.ts builders to return refs

**Files:**
- Modify: `src/lib/scene/island.ts`

- [ ] **Step 2.1 — Update buildGrass to return meshes**

Change the signature and capture each mesh before adding to scene:

```ts
export function buildGrass(scene: THREE.Scene): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  const configs = [
    { color: 0x3a6418, count: 800, max: 15, min: 2.5 },
    { color: 0x4a7a22, count: 600, max: 14.5, min: 2 },
    { color: 0x2d5214, count: 450, max: 15, min: 3 },
  ]
  configs.forEach((cfg) => {
    const verts: number[] = []
    const idxs: number[] = []
    const uvs: number[] = []
    const cols: number[] = []
    const col = new THREE.Color(cfg.color)
    for (let i = 0; i < cfg.count; i++) {
      let bx: number, bz: number, r: number
      do {
        bx = (Math.random() - 0.5) * 32
        bz = (Math.random() - 0.5) * 32
        r = Math.sqrt(bx * bx + bz * bz)
      } while (r > cfg.max || r < cfg.min)
      const edgeF = Math.min(1, (r - cfg.min) / (cfg.max - cfg.min))
      const hgt = (0.25 + Math.random() * 0.4) * (0.5 + edgeF * 0.5)
      const hw = 0.045 + Math.random() * 0.05
      const lean = (Math.random() - 0.5) * 0.5
      const ry = Math.random() * Math.PI * 2
      const cosRy = Math.cos(ry)
      const sinRy = Math.sin(ry)
      const surfH = noise2(bx / 7, bz / 7) * 0.25 * Math.max(0, (r - 5) / 10)
      const base = verts.length / 3
      const shade = 0.5 + Math.random() * 0.5
      ;[
        [-hw, 0, 0],
        [hw, 0, 0],
        [lean, hgt, 0],
      ].forEach((v) => {
        verts.push(bx + v[0]! * cosRy, v[1]! + surfH + 0.015, bz + v[0]! * sinRy)
        cols.push(col.r * shade, col.g * shade, col.b * shade)
      })
      uvs.push(0, 0, 1, 0, 0.5, 1)
      idxs.push(base, base + 1, base + 2)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    geo.setIndex(idxs)
    geo.computeVertexNormals()
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        side: THREE.DoubleSide,
        alphaTest: 0.05,
      }),
    )
    scene.add(mesh)
    meshes.push(mesh)
  })
  return meshes
}
```

- [ ] **Step 2.2 — Update buildTrees to return groups**

Change signature and push each group before returning:

```ts
export function buildTrees(scene: THREE.Scene, tex: SceneTextures): THREE.Group[] {
  const groups: THREE.Group[] = []
  const positions: [number, number, number][] = [
    [-11, 0, -5], [-13, 0, 1], [-10, 0, 7.5], [10.5, 0, -8],
    [12, 0, 2], [8.5, 0, 8], [-7, 0, -13], [5, 0, -14],
    [-4, 0, 11], [1, 0, 13], [13, 0, -4], [-14, 0, -1],
    [6, 0, 11], [-9, 0, 9],
  ]
  positions.forEach(([x, , z]) => {
    if (Math.sqrt(x * x + z * z) > 15.5) return
    const sc = 0.85 + Math.random() * 0.6
    const g = new THREE.Group()
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * sc, 0.18 * sc, 2 * sc, 10, 3),
      new THREE.MeshStandardMaterial({ map: tex.bark, color: 0x4a2c12, roughness: 0.97 }),
    )
    trunk.position.y = sc
    trunk.castShadow = true
    g.add(trunk)
    const foliageCols = [0x1e4d0a, 0x265e0d, 0x2d6e10, 0x356014, 0x3a6e18]
    const layers = 4 + Math.floor(Math.random() * 2)
    for (let i = 0; i < layers; i++) {
      const rad = (1.5 - (i / (layers - 1)) * 1.0) * sc
      const hgt = (0.9 + Math.random() * 0.3) * sc
      const fg = new THREE.ConeGeometry(rad, hgt, 9, 2)
      const fp = fg.attributes['position'] as THREE.BufferAttribute
      for (let j = 0; j < fp.count; j++)
        fp.setXYZ(
          j,
          fp.getX(j) + (Math.random() - 0.5) * 0.18 * sc,
          fp.getY(j) + (Math.random() - 0.5) * 0.1 * sc,
          fp.getZ(j) + (Math.random() - 0.5) * 0.18 * sc,
        )
      fg.computeVertexNormals()
      const f = new THREE.Mesh(
        fg,
        new THREE.MeshStandardMaterial({ color: foliageCols[Math.min(i, 4)]!, roughness: 0.85, map: tex.grass }),
      )
      f.position.y = (2.0 + i * 0.65) * sc
      f.rotation.y = Math.random() * Math.PI
      f.castShadow = true
      g.add(f)
    }
    g.position.set(x, 0, z)
    g.rotation.y = Math.random() * Math.PI * 2
    g.rotation.z = (Math.random() - 0.5) * 0.06
    scene.add(g)
    groups.push(g)
  })
  return groups
}
```

- [ ] **Step 2.3 — Update buildFlowers to return groups**

```ts
export function buildFlowers(scene: THREE.Scene): THREE.Group[] {
  const groups: THREE.Group[] = []
  const flowerColors = [0xff1493, 0xff69b4, 0xff1493, 0xff69b4, 0xff1493, 0xee1177]
  for (let i = 0; i < 55; i++) {
    let fx: number, fz: number, fr: number
    do {
      fx = (Math.random() - 0.5) * 28
      fz = (Math.random() - 0.5) * 28
      fr = Math.sqrt(fx * fx + fz * fz)
    } while (fr > 13.5 || fr < 1.5)

    const g = new THREE.Group()
    const col = flowerColors[Math.floor(Math.random() * flowerColors.length)]!
    const petalMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a7010, roughness: 0.95 })
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffee44, roughness: 0.8 })

    const stemH = 0.12 + Math.random() * 0.1
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, stemH, 5), stemMat)
    stem.position.y = stemH * 0.5
    g.add(stem)

    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.038, 5, 3), petalMat)
      petal.scale.set(1, 0.35, 1.6)
      petal.position.set(Math.cos(angle) * 0.042, stemH + 0.005, Math.sin(angle) * 0.042)
      petal.rotation.y = angle
      g.add(petal)
    }

    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 7), centerMat)
    center.position.y = stemH + 0.006
    g.add(center)

    g.position.set(fx, 0, fz)
    g.rotation.y = Math.random() * Math.PI * 2
    scene.add(g)
    groups.push(g)
  }
  return groups
}
```

- [ ] **Step 2.4 — Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 2.5 — Commit**

```bash
git add src/lib/scene/island.ts
git commit -m "feat: return mesh/group refs from buildGrass, buildTrees, buildFlowers"
```

---

## Task 3: Create quality.ts

**Files:**
- Create: `src/lib/scene/quality.ts`

- [ ] **Step 3.1 — Create the file**

```ts
// src/lib/scene/quality.ts
import * as THREE from 'three'

const IS_MOBILE =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

export interface QualityRefs {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  grassMeshes: THREE.Mesh[]
  treeGroups: THREE.Group[]
  flowerGroups: THREE.Group[]
  butterflies: THREE.Group[]
}

export function applyQuality(refs: QualityRefs, q: 'high' | 'low'): void {
  const isLow = q === 'low'

  refs.grassMeshes.forEach((m) => { m.visible = !isLow })
  refs.flowerGroups.forEach((g) => { g.visible = !isLow })
  refs.butterflies.forEach((g) => { g.visible = !isLow })
  // Hide every other tree in low mode (even indices), keep odd ones for silhouette
  refs.treeGroups.forEach((g, i) => { g.visible = !isLow || i % 2 !== 0 })

  refs.renderer.shadowMap.enabled = !isLow
  refs.renderer.shadowMap.needsUpdate = true

  const targetPixelRatio = isLow ? 1 : Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2)
  refs.renderer.setPixelRatio(targetPixelRatio)

  const fog = refs.scene.fog as THREE.FogExp2 | null
  if (fog) fog.density = isLow ? 0.04 : 0.012
}
```

- [ ] **Step 3.2 — Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3.3 — Commit**

```bash
git add src/lib/scene/quality.ts
git commit -m "feat: add applyQuality scene module"
```

---

## Task 4: Update SceneRefs and useThreeScene

**Files:**
- Modify: `src/hooks/useThreeScene.ts`

- [ ] **Step 4.1 — Add new fields to SceneRefs interface**

Add three fields to the `SceneRefs` interface:

```ts
export interface SceneRefs {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  clock: THREE.Clock
  lights: LightHandles
  sky: SkyHandles
  player: PlayerHandles
  rockHandles: RockHandles[]
  objects: ObjectHandles
  rabbitGroups: THREE.Group[]
  groundMesh: THREE.Mesh
  isDay: boolean
  butterflies: THREE.Group[]
  grassMeshes: THREE.Mesh[]
  treeGroups: THREE.Group[]
  flowerGroups: THREE.Group[]
}
```

- [ ] **Step 4.2 — Update imports in useThreeScene.ts**

Add the `applyQuality` import and `useGameStore` import at the top of the file:

```ts
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getTextures } from '@/lib/scene/textures'
import { buildLighting } from '@/lib/scene/lighting'
import { buildSky, applyDayNight } from '@/lib/scene/sky'
import {
  buildIsland,
  buildGrass,
  buildTrees,
  buildFlowers,
  buildDecorRocks,
  buildGround,
} from '@/lib/scene/island'
import { buildPlayer } from '@/lib/scene/player'
import { buildRocks } from '@/lib/scene/rocks'
import { buildSignBoard, buildChest, buildScroll, buildCampfire } from '@/lib/scene/objects'
import { buildRabbits } from '@/lib/scene/rabbits'
import { buildButterflies } from '@/lib/scene/butterflies'
import { applyQuality } from '@/lib/scene/quality'
import { getState, useGameStore } from '@/lib/state'
import type { LightHandles } from '@/lib/scene/lighting'
import type { SkyHandles } from '@/lib/scene/sky'
import type { PlayerHandles } from '@/lib/scene/player'
import type { RockHandles } from '@/lib/scene/rocks'
import type { ObjectHandles } from '@/lib/scene/objects'
```

- [ ] **Step 4.3 — Capture returned refs and apply initial quality**

Replace the builder calls in the `useEffect` body. Find this block:

```ts
buildIsland(scene, tex)
buildGrass(scene)
buildTrees(scene, tex)
buildFlowers(scene)
buildDecorRocks(scene, tex)
const groundMesh = buildGround(scene)
```

Replace with:

```ts
buildIsland(scene, tex)
const grassMeshes = buildGrass(scene)
const treeGroups = buildTrees(scene, tex)
const flowerGroups = buildFlowers(scene)
buildDecorRocks(scene, tex)
const groundMesh = buildGround(scene)
```

Then find the `refsRef.current = { ... }` assignment and add the three new fields:

```ts
refsRef.current = {
  scene, camera, renderer, clock,
  lights, sky, player,
  rockHandles, objects, rabbitGroups,
  groundMesh, isDay: true, butterflies,
  grassMeshes, treeGroups, flowerGroups,
}
```

After that assignment, add the initial quality application (reads localStorage):

```ts
const savedMode = (typeof window !== 'undefined'
  ? localStorage.getItem('iforgetech-quality-mode')
  : null) as 'auto' | 'high' | 'low' | null

if (savedMode && savedMode !== 'auto') {
  useGameStore.getState().setQualityMode(savedMode)
  useGameStore.getState().setEffectiveQuality(savedMode === 'low' ? 'low' : 'high')
  applyQuality({ renderer, scene, grassMeshes, treeGroups, flowerGroups, butterflies }, savedMode === 'low' ? 'low' : 'high')
}
```

- [ ] **Step 4.4 — Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 4.5 — Commit**

```bash
git add src/hooks/useThreeScene.ts
git commit -m "feat: wire grassMeshes/treeGroups/flowerGroups into SceneRefs, apply saved quality on init"
```

---

## Task 5: Add quality button to Hud

**Files:**
- Modify: `src/components/game/Hud.tsx`
- Modify: `src/components/game/Hud.module.css`

- [ ] **Step 5.1 — Add props and button to Hud.tsx**

Replace the entire `Hud.tsx` with:

```tsx
import styles from './Hud.module.css'
import { useGameStore } from '@/lib/state'

interface HintLabel {
  id: string
  text: string
  x: number
  y: number
  visible: boolean
}

interface Props {
  isDay: boolean
  onToggleDayNight: () => void
  hintLabels: HintLabel[]
  isMobile: boolean
  fps: number
  qualityMode: 'auto' | 'high' | 'low'
  effectiveQuality: 'high' | 'low'
  onCycleQuality: () => void
}

export function Hud({ isDay, onToggleDayNight, hintLabels, isMobile, fps, qualityMode, effectiveQuality, onCycleQuality }: Props) {
  const stamina = useGameStore((s) => s.stamina)
  const discovered = useGameStore((s) => s.discovered)

  const qualityLabel =
    qualityMode === 'high' ? '✨ Quality' :
    qualityMode === 'low'  ? '🔋 Performance' :
    '⚙ Auto'

  return (
    <div className={styles.hud}>
      <div className={styles.topLeft}>
        <div className={styles.name}>⚒ iForgeTech</div>
        <div className={styles.tagline}>Software Engineer · AI Automation</div>
        <div className={styles.staminaRow}>
          <span className={styles.staminaLabel}>Pickaxe</span>
          <div className={styles.staminaBar}>
            <div className={styles.staminaFill} style={{ width: `${stamina}%` }} />
          </div>
        </div>
      </div>

      <div className={`${styles.fpsCounter} ${fps >= 50 ? styles.fpsGood : fps >= 30 ? styles.fpsMid : styles.fpsBad}`}>
        {fps} <span className={styles.fpsLabel}>fps</span>
      </div>

      <div className={styles.topRight}>
        <div className={styles.discLabel}>Discoveries</div>
        <div className={styles.discCount}>{discovered} / 3</div>
      </div>

      <div className={styles.centerBtns}>
        <button className={styles.dayNightBtn} onClick={onToggleDayNight}>
          {isDay ? '🌙 Evening' : '🌅 Morning'}
        </button>
        <button className={styles.qualityBtn} onClick={onCycleQuality}>
          {qualityLabel}
          {qualityMode === 'auto' && (
            <span className={styles.qualityAuto}>
              {effectiveQuality === 'high' ? '▲ high' : '▼ low'}
            </span>
          )}
        </button>
      </div>

      {!isMobile ? (
        <div className={styles.controls}>
          <kbd className={styles.key}>Right-click</kbd> Walk
          <span className={styles.sep}>·</span>
          <kbd className={styles.key}>Left-click</kbd> Mine / Interact
          <span className={styles.sep}>·</span>
          <kbd className={styles.key}>Scroll</kbd> Zoom
        </div>
      ) : (
        <div className={styles.touchHint}>👆 Tap = Walk / Interact &nbsp;·&nbsp; 👌 Pinch = Zoom</div>
      )}

      {hintLabels.map((h) =>
        h.visible ? (
          <div
            key={h.id}
            className={styles.hint3d}
            style={{ left: h.x, top: h.y }}
          >
            {h.text}
          </div>
        ) : null,
      )}
    </div>
  )
}
```

- [ ] **Step 5.2 — Add CSS for centerBtns and qualityBtn**

In `Hud.module.css`, replace the `.dayNightBtn` rule and add new rules:

```css
.centerBtns {
  position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 15;
}

.dayNightBtn {
  background: rgba(6,4,1,.9); border: 1px solid rgba(201,144,58,.55);
  border-radius: 20px; padding: 6px 14px; font-family: 'Cinzel', serif;
  font-size: .68rem; color: #f0c060; cursor: pointer; pointer-events: all;
  backdrop-filter: blur(8px); box-shadow: 0 0 14px rgba(255,107,26,.18);
  transition: all .3s; letter-spacing: .08em;
}
.dayNightBtn:hover { box-shadow: 0 0 22px rgba(255,107,26,.4); border-color: #f0c060; }

.qualityBtn {
  background: rgba(6,4,1,.85); border: 1px solid rgba(201,144,58,.35);
  border-radius: 20px; padding: 4px 12px; font-family: 'Cinzel', serif;
  font-size: .62rem; color: #c0a050; cursor: pointer; pointer-events: all;
  backdrop-filter: blur(8px); transition: all .3s; letter-spacing: .08em;
  display: flex; flex-direction: column; align-items: center; gap: 1px;
}
.qualityBtn:hover { border-color: rgba(201,144,58,.7); color: #f0c060; }

.qualityAuto {
  font-size: .48rem; color: #7a6040; letter-spacing: .06em;
}
```

- [ ] **Step 5.3 — Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 5.4 — Commit**

```bash
git add src/components/game/Hud.tsx src/components/game/Hud.module.css
git commit -m "feat: add quality toggle button to Hud"
```

---

## Task 6: Wire auto-detection and quality cycling in GameCanvas

**Files:**
- Modify: `src/components/game/GameCanvas.tsx`

- [ ] **Step 6.1 — Add import for applyQuality**

Add to the imports at the top of `GameCanvas.tsx`:

```ts
import { applyQuality } from '@/lib/scene/quality'
```

- [ ] **Step 6.2 — Add auto-detection refs**

Add four new refs alongside the existing refs (after `campfireActiveRef`):

```ts
const autoDowngradeTimerRef = useRef(0)
const autoUpgradeTimerRef = useRef(0)
const autoLockoutEndRef = useRef(0)
const rollingFpsRef = useRef<number[]>([])
```

- [ ] **Step 6.3 — Add handleCycleQuality callback**

Add after the `handleToggleDayNight` function:

```ts
const handleCycleQuality = useCallback(() => {
  const { qualityMode } = getState()
  const refs = sceneRefsRef.current
  const store = useGameStore.getState()
  const next: 'auto' | 'high' | 'low' =
    qualityMode === 'auto' ? 'high' : qualityMode === 'high' ? 'low' : 'auto'
  store.setQualityMode(next)
  if (typeof window !== 'undefined') localStorage.setItem('iforgetech-quality-mode', next)
  if (next === 'high') {
    store.setEffectiveQuality('high')
    if (refs) applyQuality({ renderer: refs.renderer, scene: refs.scene, grassMeshes: refs.grassMeshes, treeGroups: refs.treeGroups, flowerGroups: refs.flowerGroups, butterflies: refs.butterflies }, 'high')
  } else if (next === 'low') {
    store.setEffectiveQuality('low')
    if (refs) applyQuality({ renderer: refs.renderer, scene: refs.scene, grassMeshes: refs.grassMeshes, treeGroups: refs.treeGroups, flowerGroups: refs.flowerGroups, butterflies: refs.butterflies }, 'low')
  }
  // 'auto': keep current effectiveQuality, auto-detection takes over from here
}, [sceneRefsRef])
```

- [ ] **Step 6.4 — Add auto-detection and butterfly skip in the game loop**

Inside the `useGameLoop` callback, find the `updateButterflies` call:

```ts
updateButterflies(refs.butterflies, dt, elapsed)
```

Replace it with the auto-detection block + conditional butterfly update:

```ts
// Auto quality detection
const { qualityMode, effectiveQuality } = gs
if (qualityMode === 'auto' && elapsed > autoLockoutEndRef.current && dt > 0) {
  rollingFpsRef.current.push(1 / dt)
  if (rollingFpsRef.current.length > 180) rollingFpsRef.current.shift()
  const avg = rollingFpsRef.current.reduce((a, b) => a + b, 0) / rollingFpsRef.current.length

  if (effectiveQuality === 'high' && avg < 30) {
    autoDowngradeTimerRef.current += dt
    if (autoDowngradeTimerRef.current >= 3) {
      store.setEffectiveQuality('low')
      applyQuality({ renderer: refs.renderer, scene: refs.scene, grassMeshes: refs.grassMeshes, treeGroups: refs.treeGroups, flowerGroups: refs.flowerGroups, butterflies: refs.butterflies }, 'low')
      autoLockoutEndRef.current = elapsed + 10
      autoDowngradeTimerRef.current = 0
      rollingFpsRef.current = []
    }
  } else {
    autoDowngradeTimerRef.current = 0
  }

  if (effectiveQuality === 'low' && avg > 55) {
    autoUpgradeTimerRef.current += dt
    if (autoUpgradeTimerRef.current >= 5) {
      store.setEffectiveQuality('high')
      applyQuality({ renderer: refs.renderer, scene: refs.scene, grassMeshes: refs.grassMeshes, treeGroups: refs.treeGroups, flowerGroups: refs.flowerGroups, butterflies: refs.butterflies }, 'high')
      autoLockoutEndRef.current = elapsed + 10
      autoUpgradeTimerRef.current = 0
      rollingFpsRef.current = []
    }
  } else {
    autoUpgradeTimerRef.current = 0
  }
}

// Skip butterfly animation when hidden (low quality)
if (effectiveQuality === 'high') {
  updateButterflies(refs.butterflies, dt, elapsed)
}
```

- [ ] **Step 6.5 — Wire quality props to Hud**

Find the `<Hud ... />` render and add the three new props:

```tsx
<Hud
  isDay={isDay}
  onToggleDayNight={handleToggleDayNight}
  hintLabels={hintLabels}
  isMobile={IS_MOBILE}
  fps={fps}
  qualityMode={useGameStore((s) => s.qualityMode)}
  effectiveQuality={useGameStore((s) => s.effectiveQuality)}
  onCycleQuality={handleCycleQuality}
/>
```

Wait — `useGameStore` cannot be called inline in JSX outside a hook. Read the quality values from the store using `useState`-style subscription at the top of `GameCanvas`. Add two lines alongside the other `useState` declarations:

```ts
const qualityMode = useGameStore((s) => s.qualityMode)
const effectiveQuality = useGameStore((s) => s.effectiveQuality)
```

Then pass them directly:

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
/>
```

- [ ] **Step 6.6 — Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 6.7 — Dev server smoke test**

```bash
bun run dev
```

Open http://localhost:3000, click "Explore My Work", then verify:
1. Two buttons appear in the center top: day/night + quality
2. Quality button starts as "⚙ Auto" with "▲ high" indicator
3. Clicking cycles: Auto → ✨ Quality → 🔋 Performance → Auto
4. In "🔋 Performance" mode: grass, flowers, butterflies disappear; half the trees disappear
5. In "✨ Quality" mode: everything reappears
6. Reload page in Performance mode → scene starts in low quality immediately (localStorage persisted)

- [ ] **Step 6.8 — Commit**

```bash
git add src/components/game/GameCanvas.tsx
git commit -m "feat: wire performance toggle auto-detection and manual cycling in GameCanvas"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** qualityMode/effectiveQuality state ✓ · island builder refs ✓ · quality.ts applyQuality ✓ · butterfly update skip ✓ · auto-detection (downgrade 3s, upgrade 5s, 10s lockout) ✓ · 3-state HUD button ✓ · localStorage persist ✓ · init from localStorage ✓
- [x] **Placeholders:** none
- [x] **Type consistency:** `QualityRefs` used in Task 3 and referenced identically in Tasks 4, 6 ✓ · `grassMeshes/treeGroups/flowerGroups` added to `SceneRefs` in Task 4 and consumed in Task 6 ✓
- [x] **Circular deps:** `quality.ts` defines its own `QualityRefs` — does not import from `useThreeScene.ts` ✓
