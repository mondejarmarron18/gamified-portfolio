// src/lib/raycaster.ts
import * as THREE from 'three'
import type { HitResult } from '@/types/game'

export interface RaycastTargets {
  rockMeshes: THREE.Mesh[]
  rockGroups: THREE.Group[]
  crackedGoldGroups: THREE.Group[]
  scrollGroup: THREE.Group
  signGroup: THREE.Group
  chestGroup: THREE.Group
  groundMesh: THREE.Mesh
  bounds: number
}

const _raycaster = new THREE.Raycaster()

function toNDC(
  clientX: number,
  clientY: number,
  renderer: THREE.WebGLRenderer,
): THREE.Vector2 {
  const rect = renderer.domElement.getBoundingClientRect()
  return new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )
}

export function castRay(
  clientX: number,
  clientY: number,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  targets: RaycastTargets,
): HitResult | null {
  const ndc = toNDC(clientX, clientY, renderer)
  _raycaster.setFromCamera(ndc, camera)

  // Uncracked rocks
  const rockHits = _raycaster.intersectObjects(targets.rockMeshes)
  if (rockHits.length > 0) {
    const hitMesh = rockHits[0]!.object as THREE.Mesh
    const group = targets.rockGroups.find((g) => g.userData['rockMesh'] === hitMesh)
    if (group !== undefined) {
      return { type: 'rock', rockIndex: group.userData['rockIndex'] as 0 | 1 | 2 }
    }
  }

  // Cracked gold rock — manual sphere test since mesh may be hidden
  for (const g of targets.crackedGoldGroups) {
    const gp = g.position
    const dir = _raycaster.ray.direction
    const ori = _raycaster.ray.origin
    const dx = gp.x - ori.x
    const dy = gp.y + 1 - ori.y
    const dz = gp.z - ori.z
    const tca = dx * dir.x + dy * dir.y + dz * dir.z
    if (tca < 0) continue
    const d2 = dx * dx + dy * dy + dz * dz - tca * tca
    if (d2 < 2.5) return { type: 'crackedGold' }
  }

  // Scroll (check before ground — scroll sits on ground plane)
  const scrollHits = _raycaster.intersectObjects(targets.scrollGroup.children, true)
  if (scrollHits.length > 0) return { type: 'scroll' }

  // Sign
  const signHits = _raycaster.intersectObjects(targets.signGroup.children, true)
  if (signHits.length > 0) return { type: 'sign' }

  // Chest
  const chestHits = _raycaster.intersectObjects(targets.chestGroup.children, true)
  if (chestHits.length > 0) return { type: 'chest' }

  // Ground
  const groundHits = _raycaster.intersectObject(targets.groundMesh)
  if (groundHits.length > 0) {
    const point = groundHits[0]!.point
    if (Math.sqrt(point.x * point.x + point.z * point.z) < targets.bounds) {
      return { type: 'ground', point }
    }
  }

  return null
}
