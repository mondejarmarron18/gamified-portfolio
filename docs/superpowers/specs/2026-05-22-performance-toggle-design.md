# Performance Toggle — Design Spec

**Date:** 2026-05-22  
**Status:** Approved

## Problem

On deployed Vercel builds, FPS drops from ~120 to ~11 due to the scene's geometry density (1850 grass blades, 55 flowers, 14 trees, 7 butterflies) and renderer settings (2× pixel ratio, PCFSoft shadows). A quality toggle reduces GPU load instantly by hiding decorative objects and dialling down renderer settings.

## Behaviour

Two orthogonal controls:

| Control | Values | Effect |
|---|---|---|
| `qualityMode` (user) | `'auto'` · `'high'` · `'low'` | User's explicit choice, persisted in localStorage |
| `effectiveQuality` (system) | `'high'` · `'low'` | What is actually applied; auto-mode drives this from FPS |

- `qualityMode = 'high'` → always apply high, ignore FPS
- `qualityMode = 'low'` → always apply low, ignore FPS
- `qualityMode = 'auto'` → effectiveQuality driven by auto-detection rules below

Initial default: `qualityMode = 'auto'`, `effectiveQuality = 'high'`.  
On mount, read `qualityMode` from `localStorage` key `'iforgetech-quality-mode'`; if absent, default to `'auto'`.

## Auto-Detection Rules

Runs only when `qualityMode === 'auto'`. Tracked inside `GameCanvas.tsx` alongside the game loop.

- Maintain a rolling FPS buffer covering the last **3 seconds** of frames.
- **Auto-downgrade:** rolling average < 30 FPS sustained → set `effectiveQuality = 'low'`
- **Auto-upgrade:** rolling average > 55 FPS sustained for **5 s** while currently low → set `effectiveQuality = 'high'`
- **Lockout:** after any auto-switch (either direction), wait **10 s** before evaluating again. Prevents oscillation.
- When `effectiveQuality` changes, call `applyQuality` immediately.

## State (`src/lib/state.ts`)

Add to `GameState`:
```ts
qualityMode: 'auto' | 'high' | 'low'
effectiveQuality: 'high' | 'low'
```

Add to `GameActions`:
```ts
setQualityMode: (mode: 'auto' | 'high' | 'low') => void
setEffectiveQuality: (q: 'high' | 'low') => void
```

Initial values: `qualityMode: 'auto'`, `effectiveQuality: 'high'`.

## Scene Ref Changes (`src/lib/scene/island.ts`, `butterflies.ts`)

Update four builders to return refs. Add returned types to `SceneRefs` in `useThreeScene.ts`.

| Builder | Return type added | Field added to SceneRefs |
|---|---|---|
| `buildGrass` | `THREE.Mesh[]` | `grassMeshes` |
| `buildTrees` | `THREE.Group[]` | `treeGroups` |
| `buildFlowers` | `THREE.Group[]` | `flowerGroups` |
| `buildButterflies` | already returns `THREE.Group[]` | already in SceneRefs ✓ |

No changes to mesh geometry or build logic — only the return value.

## Quality Applier (`src/lib/scene/quality.ts`)

New file. Single exported function:

```ts
export function applyQuality(refs: SceneRefs, q: 'high' | 'low'): void
```

**Low quality:**
- `grassMeshes` → `visible = false`
- `flowerGroups` → `visible = false`
- `butterflies` → `visible = false`
- Every other tree (even indices) → `visible = false` (halves draw calls, keeps silhouette)
- `refs.renderer.shadowMap.enabled = false`
- `refs.renderer.shadowMap.needsUpdate = true`
- `refs.renderer.setPixelRatio(1)`
- `(refs.scene.fog as THREE.FogExp2).density = 0.04` (reduces far overdraw)

**High quality:**
- All above objects → `visible = true`
- `refs.renderer.shadowMap.enabled = true`
- `refs.renderer.shadowMap.needsUpdate = true`
- `refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2))`
- `(refs.scene.fog as THREE.FogExp2).density = 0.012`

`IS_MOBILE` is a local `const` duplicated from `useThreeScene.ts` (same one-liner — no cross-file export needed).

## Butterfly Update Skip

In `GameCanvas.tsx` game loop callback, when `effectiveQuality === 'low'`, skip `updateButterflies` entirely (butterflies are hidden, no need to animate). Rabbit updates continue regardless — they are cheap (3 groups, no wing geometry).

## HUD Changes (`src/components/game/Hud.tsx`)

Add props:
```ts
qualityMode: 'auto' | 'high' | 'low'
effectiveQuality: 'high' | 'low'
onCycleQuality: () => void
```

New button alongside the day/night button. Click cycles: `auto → high → low → auto`.

Labels:
- `auto` → `⚙ Auto` with a small dim sub-label showing `▲ high` or `▼ low`
- `high` → `✨ Quality`
- `low` → `🔋 Performance`

`onCycleQuality` cycles `qualityMode` in the store and saves to `localStorage`.  
When mode changes to `'high'` or `'low'`, immediately set `effectiveQuality` to match and call `applyQuality`.  
When mode changes to `'auto'`, leave `effectiveQuality` as-is (auto-detection will correct it on next evaluation).

## File Changelist

| File | Change |
|---|---|
| `src/lib/state.ts` | Add `qualityMode`, `effectiveQuality`, two actions |
| `src/types/game.ts` | Add fields to `GameState` interface |
| `src/lib/scene/island.ts` | `buildGrass`, `buildTrees`, `buildFlowers` return refs |
| `src/lib/scene/quality.ts` | New file — `applyQuality` |
| `src/hooks/useThreeScene.ts` | Store returned refs; add `grassMeshes`, `treeGroups`, `flowerGroups` to `SceneRefs`; call `applyQuality` once on init with loaded `qualityMode` |
| `src/components/game/GameCanvas.tsx` | Auto-detection logic; skip butterfly updates in low mode; wire HUD props |
| `src/components/game/Hud.tsx` | New quality button + props |
| `src/components/game/Hud.module.css` | Styles for quality button |

## Out of Scope

- Reducing polygon count / LOD — not needed at this scene scale
- Disabling fog entirely — kept at higher density rather than removed (avoids visible pop-in at edges)
- Persisting `effectiveQuality` — only `qualityMode` is persisted; effective quality is always re-derived on load
