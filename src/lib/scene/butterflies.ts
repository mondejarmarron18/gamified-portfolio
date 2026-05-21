import * as THREE from 'three'

// Pairs: [primary, wing-spot accent]
const PALETTES: [number, number][] = [
  [0x55aaff, 0xffffff],
  [0xff66bb, 0xffeecc],
  [0xffcc33, 0xff6600],
  [0x44ddaa, 0x115533],
  [0xff8833, 0xffee44],
  [0xcc66ff, 0xffaaff],
  [0x33ffcc, 0x006655],
]

/**
 * Custom wing geometry in the XZ plane (Y=0).
 * Wings spread in ±X and Z directions so rotation.z flaps them up/down
 * around the body axis (which runs along Z).
 */
function makeWingGeo(side: 1 | -1, upper: boolean): THREE.BufferGeometry {
  const s = side
  let verts: Float32Array
  let idx: Uint16Array

  if (upper) {
    // Larger teardrop — wider at Z=0 (front), tapering to a rounded tip
    verts = new Float32Array([
      0,          0,  0.00,   // 0 root-front (hinge)
      s * 0.11,   0, -0.07,   // 1 leading edge
      s * 0.17,   0, -0.01,   // 2 outer-front
      s * 0.16,   0,  0.09,   // 3 outer-mid
      s * 0.10,   0,  0.16,   // 4 outer-back
      0,          0,  0.13,   // 5 root-back (hinge)
    ])
    idx = new Uint16Array([0,1,2, 0,2,3, 0,3,4, 0,4,5])
  } else {
    // Smaller fan-shaped lower wing, sits just behind upper
    verts = new Float32Array([
      0,          0,  0.08,   // 0 root-front
      s * 0.08,   0,  0.09,   // 1 outer-front
      s * 0.12,   0,  0.17,   // 2 outer tip
      s * 0.06,   0,  0.23,   // 3 back tip
      0,          0,  0.20,   // 4 root-back
    ])
    idx = new Uint16Array([0,1,2, 0,2,3, 0,3,4])
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  geo.setIndex(new THREE.BufferAttribute(idx, 1))
  geo.computeVertexNormals()
  return geo
}

function buildButterfly(primary: number, accent: number): THREE.Group {
  const g = new THREE.Group()

  // Slim body along Z axis
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.018, 0.10, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.88 }),
  )
  body.rotation.x = Math.PI / 2
  g.add(body)

  // Antennae — two thin bent sticks
  ;([-1, 1] as const).forEach((s) => {
    const ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.10, 4),
      new THREE.MeshStandardMaterial({ color: 0x221100 }),
    )
    ant.position.set(s * 0.025, 0.04, -0.09)
    ant.rotation.z = s * 0.28
    ant.rotation.x = 0.45
    g.add(ant)
  })

  ;([-1, 1] as const).forEach((side) => {
    // Upper wing
    const upPivot = new THREE.Group()
    upPivot.name = side === -1 ? 'lwU' : 'rwU'
    upPivot.add(new THREE.Mesh(
      makeWingGeo(side, true),
      new THREE.MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
    ))
    g.add(upPivot)

    // Lower wing — slightly darker accent colour
    const loPivot = new THREE.Group()
    loPivot.name = side === -1 ? 'lwL' : 'rwL'
    loPivot.add(new THREE.Mesh(
      makeWingGeo(side, false),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
    ))
    g.add(loPivot)
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
    const [primary, accent] = PALETTES[i % PALETTES.length]!
    const b = buildButterfly(primary, accent)
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

// Natural dihedral angle butterflies hold their wings at while gliding
const DIHEDRAL = 0.18

export function updateButterflies(butterflies: THREE.Group[], dt: number, t: number): void {
  butterflies.forEach((b) => {
    const ud = b.userData as {
      targetX: number; targetZ: number; targetY: number
      flapPhase: number; speed: number; stateTimer: number
    }

    ud.stateTimer -= dt
    ud.flapPhase  += dt * 10

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
    b.position.y += dy * 1.5 * dt + Math.sin(t * 3.1 + ud.flapPhase * 0.12) * 0.006

    // Wing flap: rotation.z around the body axis makes tips go up/down.
    // Right wings get +angle, left wings get -angle so both tips rise/fall together.
    const swing = Math.sin(ud.flapPhase) * 0.72
    ;(['rwU', 'rwL', 'lwU', 'lwL'] as const).forEach((name) => {
      const p = b.getObjectByName(name)
      if (!p) return
      const dir = name.startsWith('r') ? 1 : -1
      // dihedral lifts the wing slightly at rest; swing adds the flap
      p.rotation.z = dir * (DIHEDRAL + swing)
    })
  })
}
