// src/lib/scene/player.ts
import * as THREE from 'three'
import type { SceneTextures } from './textures'

export interface PlayerHandles {
  group: THREE.Group
  swingArm: THREE.Group
}

export function buildPlayer(scene: THREE.Scene, tex: SceneTextures): PlayerHandles {
  const playerGroup = new THREE.Group()

  const skinMat = new THREE.MeshStandardMaterial({ map: tex.skin, color: 0xb87040, roughness: 0.75 })
  const leatherMat = new THREE.MeshStandardMaterial({ map: tex.leather, color: 0x3a1e08, roughness: 0.92 })
  const chainMat = new THREE.MeshStandardMaterial({ map: tex.metal, color: 0x606870, roughness: 0.5, metalness: 0.7 })
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc09028, roughness: 0.3, metalness: 0.9 })
  const ironMat = new THREE.MeshStandardMaterial({ map: tex.metal, color: 0x707880, roughness: 0.45, metalness: 0.85 })
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xb87820, roughness: 0.9 })
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1c0e04, roughness: 0.95 })

  // Torso
  const tg = new THREE.CylinderGeometry(0.28, 0.32, 0.62, 12, 3)
  const tp = tg.attributes['position'] as THREE.BufferAttribute
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i)
    if (Math.abs(y) < 0.28)
      tp.setX(i, tp.getX(i) * (1 + Math.sin(((y / 0.62 + 0.5) * Math.PI)) * 0.08))
  }
  tg.computeVertexNormals()
  const torso = new THREE.Mesh(tg, leatherMat)
  torso.position.y = 0.82
  torso.castShadow = true
  playerGroup.add(torso)

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.18), chainMat)
  chest.position.set(0, 0.88, 0.16)
  playerGroup.add(chest)

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), goldMat)
  buckle.position.set(0, 0.72, 0.25)
  playerGroup.add(buckle)

  ;[-1, 1].forEach((s) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), ironMat)
    p.position.set(s * 0.34, 0.98, 0)
    p.rotation.z = s * -0.28
    playerGroup.add(p)
    const tr = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 6, 12), goldMat)
    tr.position.copy(p.position)
    tr.rotation.copy(p.rotation)
    playerGroup.add(tr)
  })

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.09, 12), leatherMat)
  belt.position.y = 0.56
  playerGroup.add(belt)
  const bb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.06), goldMat)
  bb.position.set(0, 0.56, 0.34)
  playerGroup.add(bb)

  // Head
  const hg = new THREE.SphereGeometry(0.22, 12, 10)
  const hv = hg.attributes['position'] as THREE.BufferAttribute
  for (let i = 0; i < hv.count; i++)
    if (hv.getY(i) < 0) hv.setX(i, hv.getX(i) * 1.1)
  hg.computeVertexNormals()
  const head = new THREE.Mesh(hg, skinMat)
  head.position.y = 1.42
  head.castShadow = true
  playerGroup.add(head)

  ;[-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.5 }),
    )
    eye.position.set(s * 0.09, 1.46, 0.18)
    playerGroup.add(eye)
    const sh = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.4 }),
    )
    sh.position.set(s * 0.09, 1.47, 0.21)
    playerGroup.add(sh)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.04), hairMat)
    brow.position.set(s * 0.09, 1.52, 0.19)
    brow.rotation.z = s * 0.2
    playerGroup.add(brow)
  })

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinMat)
  nose.scale.set(1, 0.7, 1.3)
  nose.position.set(0, 1.41, 0.24)
  playerGroup.add(nose)

  // Helmet
  const helmMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    ironMat,
  )
  helmMesh.position.y = 1.54
  helmMesh.castShadow = true
  playerGroup.add(helmMesh)
  const helmRim = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.022, 8, 20), goldMat)
  helmRim.position.y = 1.44
  helmRim.rotation.x = Math.PI * 0.05
  playerGroup.add(helmRim)
  const ng = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), ironMat)
  ng.position.set(0, 1.44, 0.23)
  playerGroup.add(ng)
  ;[-1, 1].forEach((s) => {
    const rv = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), goldMat)
    rv.position.set(s * 0.22, 1.55, 0.04)
    playerGroup.add(rv)
  })

  // Beard
  const beardDefs: [number, number, number, number, number, number, number][] = [
    [0, 1.3, 0.2, 0.38, 0.32, 0.12, 0],
    [-0.08, 1.22, 0.18, 0.24, 0.22, 0.1, -0.15],
    [0.08, 1.22, 0.18, 0.24, 0.22, 0.1, 0.15],
  ]
  const beardCols = [0xc09030, 0xa87828, 0xd4aa40]
  beardDefs.forEach(([bx, by, bz, bw, bh, bd, rz], idx) => {
    const bm = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshStandardMaterial({ color: beardCols[idx]!, roughness: 0.95 }),
    )
    bm.position.set(bx, by, bz)
    bm.rotation.z = rz
    playerGroup.add(bm)
  })
  ;[-1, 1].forEach((s) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.044, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xc09030, roughness: 0.95 }),
    )
    m.position.set(s * 0.07, 1.38, 0.22)
    m.rotation.z = s * -0.14
    playerGroup.add(m)
  })

  // Arms
  let swingArm!: THREE.Group
  ;[-1, 1].forEach((s) => {
    const ag = new THREE.Group()
    const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.088, 0.32, 9), chainMat)
    ua.position.y = -0.16
    ua.castShadow = true
    ag.add(ua)
    ag.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 7), ironMat))
    const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.28, 9), leatherMat)
    fa.position.y = 0.14
    ag.add(fa)
    const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.1), bootMat)
    hnd.position.y = 0.3
    ag.add(hnd)
    ag.position.set(s * 0.4, 0.95, 0)
    ag.rotation.z = s * 0.12
    ag.userData['isArm'] = true
    ag.userData['side'] = s
    ag.userData['phase'] = s === 1 ? 0 : Math.PI

    if (s === 1) {
      // Pickaxe on right arm
      const pk = new THREE.Group()
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, 0.72, 8),
        new THREE.MeshStandardMaterial({ map: tex.bark, color: 0x5a3018, roughness: 0.95 }),
      )
      handle.rotation.z = Math.PI / 2.4
      pk.add(handle)
      const pkh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.09), ironMat)
      pkh.position.set(0.22, 0.22, 0)
      pk.add(pkh)
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 6), ironMat)
      tip.rotation.z = -Math.PI / 2
      tip.position.set(0.4, 0.22, 0)
      pk.add(tip)
      pk.position.set(0.14, 0.26, 0.04)
      ag.add(pk)
      swingArm = ag
    }
    playerGroup.add(ag)
  })

  // Legs
  ;[-1, 1].forEach((s) => {
    const lg = new THREE.Group()
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.35, 10), leatherMat)
    th.position.y = -0.175
    lg.add(th)
    lg.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 7), ironMat))
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.095, 0.32, 10), chainMat)
    sh.position.y = 0.16
    lg.add(sh)
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.24), bootMat)
    boot.position.set(0, 0.31, 0.04)
    lg.add(boot)
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.04, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x100804, roughness: 1 }),
    )
    sole.position.set(0, 0.25, 0.04)
    lg.add(sole)
    lg.position.set(s * 0.16, 0.35, 0)
    lg.userData['isLeg'] = true
    lg.userData['side'] = s
    lg.userData['phase'] = s === 1 ? 0 : Math.PI
    playerGroup.add(lg)
  })

  const pl = new THREE.PointLight(0xff9944, 0.4, 4)
  pl.position.set(0, 1.6, 0)
  playerGroup.add(pl)

  scene.add(playerGroup)
  return { group: playerGroup, swingArm }
}

// Animate legs and arms each frame while walking
export function animatePlayerWalk(playerGroup: THREE.Group, t: number, swinging: boolean): void {
  playerGroup.children.forEach((c) => {
    if (c.userData['isLeg'] === true)
      (c as THREE.Group).rotation.x = Math.sin(t * 9 + (c.userData['phase'] as number)) * 0.32
    if (c.userData['isArm'] === true && !swinging)
      (c as THREE.Group).rotation.x =
        Math.sin(t * 9 + ((c.userData['side'] as number) === 1 ? Math.PI : 0)) * 0.18
  })
  playerGroup.position.y = Math.abs(Math.sin(t * 9)) * 0.055
}

// Reset limbs to idle pose when player stops
export function resetPlayerPose(playerGroup: THREE.Group): void {
  playerGroup.children.forEach((c) => {
    if (c.userData['isLeg'] === true || c.userData['isArm'] === true)
      (c as THREE.Group).rotation.x = 0
  })
  playerGroup.position.y = 0
}
