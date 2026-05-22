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
  rabbitGroups: THREE.Group[]
}

export function applyQuality(refs: QualityRefs, q: 'high' | 'low'): void {
  const isLow = q === 'low'

  refs.grassMeshes.forEach((m) => { m.visible = !isLow })
  refs.flowerGroups.forEach((g) => { g.visible = !isLow })
  refs.butterflies.forEach((g) => { g.visible = !isLow })
  refs.rabbitGroups.forEach((g) => { g.visible = !isLow })
  // Hide every other tree in low mode; disable shadow casting on all trees for performance
  refs.treeGroups.forEach((g, i) => {
    g.visible = !isLow || i % 2 !== 0
    g.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).castShadow = !isLow
    })
  })

  refs.renderer.shadowMap.enabled = !isLow
  refs.renderer.shadowMap.needsUpdate = true

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  const targetPixelRatio = isLow ? 1 : Math.min(dpr, IS_MOBILE ? 1.5 : 2)
  refs.renderer.setPixelRatio(targetPixelRatio)

  const fog = refs.scene.fog as THREE.FogExp2 | null
  if (fog) fog.density = isLow ? 0.04 : 0.012
}
