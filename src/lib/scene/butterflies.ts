import * as THREE from 'three'

const COLORS = [0x44aaff, 0xff66bb, 0xffdd44, 0x44ffaa, 0xff8844, 0xcc66ff, 0x44ffee, 0xff5566]

function buildButterfly(color: number): THREE.Group {
  const g = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.028, 0.13, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.9 }),
  )
  body.rotation.x = Math.PI / 2
  g.add(body)

  // Two wing pivots — rotation.y folds wings open/closed like a book
  ;([-1, 1] as const).forEach((side) => {
    const pivot = new THREE.Group()
    pivot.name = side === -1 ? 'lw' : 'rw'
    const wing = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.22),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
    )
    wing.position.x = side * 0.15  // pivot at body edge
    pivot.add(wing)
    g.add(pivot)
  })

  return g
}

export function buildButterflies(scene: THREE.Scene): THREE.Group[] {
  const spawns = [
    { x: -5, z: 2,  y: 1.5 },
    { x:  4, z: -3, y: 2.1 },
    { x: -3, z: -5, y: 1.8 },
    { x:  6, z: 2,  y: 2.3 },
    { x:  1, z: 5,  y: 1.6 },
    { x: -7, z: 1,  y: 2.0 },
    { x:  2, z: -7, y: 1.9 },
  ]
  return spawns.map((pos, i) => {
    const b = buildButterfly(COLORS[i % COLORS.length]!)
    b.position.set(pos.x, pos.y, pos.z)
    b.userData['targetX']    = pos.x
    b.userData['targetZ']    = pos.z
    b.userData['targetY']    = pos.y
    b.userData['flapPhase']  = Math.random() * Math.PI * 2
    b.userData['speed']      = 1.4 + Math.random() * 0.9
    b.userData['stateTimer'] = Math.random() * 3
    scene.add(b)
    return b
  })
}

export function updateButterflies(butterflies: THREE.Group[], dt: number, t: number): void {
  butterflies.forEach((b) => {
    const ud = b.userData as {
      targetX: number; targetZ: number; targetY: number
      flapPhase: number; speed: number; stateTimer: number
    }

    ud.stateTimer -= dt
    ud.flapPhase  += dt * 9

    // Pick a new waypoint periodically
    if (ud.stateTimer <= 0) {
      const angle = Math.random() * Math.PI * 2
      const r = 1.5 + Math.random() * 7
      ud.targetX    = Math.cos(angle) * r
      ud.targetZ    = Math.sin(angle) * r
      ud.targetY    = 1.0 + Math.random() * 2.5
      ud.stateTimer = 2.5 + Math.random() * 4
    }

    const dx   = ud.targetX - b.position.x
    const dz   = ud.targetZ - b.position.z
    const dy   = ud.targetY - b.position.y
    const dist = Math.hypot(dx, dz)

    if (dist > 0.3) {
      const step = ud.speed * dt
      b.position.x += (dx / dist) * step
      b.position.z += (dz / dist) * step
      b.rotation.y  = Math.atan2(dx, dz)
    }
    // Vertical bob + drift toward target height
    b.position.y += dy * 1.5 * dt + Math.sin(t * 3.1 + ud.flapPhase * 0.12) * 0.007

    // Wing flap — fold/unfold around Y axis
    const fold = Math.abs(Math.sin(ud.flapPhase)) * 1.1
    const lw = b.getObjectByName('lw')
    const rw = b.getObjectByName('rw')
    if (lw) lw.rotation.y = -fold
    if (rw) rw.rotation.y =  fold
  })
}
