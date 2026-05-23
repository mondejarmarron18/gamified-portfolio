// src/lib/scene/rabbits.ts
import * as THREE from 'three'

// ── Heart sprite texture (lazily created once) ────────────────────────────────
let _heartTex: THREE.Texture | null = null
function getHeartTex(): THREE.Texture {
  if (_heartTex) return _heartTex
  const c = document.createElement('canvas')
  c.width = 64; c.height = 64
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const ctx = c.getContext('2d')!

  // Draw a bright-red heart using bezier curves — guaranteed colour on all platforms
  ctx.fillStyle = '#ff1133'
  const cx = 32, cy = 26, s = 16
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.4)
  // right lobe
  ctx.bezierCurveTo(cx + s * 0.1, cy - s * 0.15, cx + s * 1.2, cy - s * 0.15, cx + s * 1.2, cy + s * 0.45)
  ctx.bezierCurveTo(cx + s * 1.2, cy + s * 1.0, cx + s * 0.6, cy + s * 1.4, cx, cy + s * 1.9)
  // left lobe (mirror)
  ctx.bezierCurveTo(cx - s * 0.6, cy + s * 1.4, cx - s * 1.2, cy + s * 1.0, cx - s * 1.2, cy + s * 0.45)
  ctx.bezierCurveTo(cx - s * 1.2, cy - s * 0.15, cx - s * 0.1, cy - s * 0.15, cx, cy + s * 0.4)
  ctx.fill()

  _heartTex = new THREE.CanvasTexture(c)
  return _heartTex
}

// ── World positions to avoid when picking wander targets ──────────────────────
const AVOID_POS = [
  { x: -8, z:  3 },  // sign
  { x:  8, z:  3 },  // chest
  { x:  0, z:  6 },  // scroll
  { x: -5, z: -7 },  // rock 1
  { x:  5, z: -7 },  // rock 2
  { x:  0, z: -11 }, // gold rock
]
const AVOID_R = 3.5  // minimum clearance from any interactive object

/** Pick a wander target relative to the rabbit's current position,
 *  rejecting candidates that land too close to interactive objects. */
function pickWanderTarget(r: THREE.Group): { x: number; z: number } {
  for (let attempt = 0; attempt < 6; attempt++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 2 + Math.random() * 5
    const tx = Math.max(-11, Math.min(11, r.position.x + Math.cos(angle) * radius))
    const tz = Math.max(-11, Math.min(11, r.position.z + Math.sin(angle) * radius))
    if (!AVOID_POS.some(p => Math.hypot(p.x - tx, p.z - tz) < AVOID_R)) {
      return { x: tx, z: tz }
    }
  }
  // All attempts collided — stay put
  return { x: r.position.x, z: r.position.z }
}

// ── Rabbit mesh builder ───────────────────────────────────────────────────────
function buildRabbit(): THREE.Group {
  const g = new THREE.Group()
  const furMat = new THREE.MeshStandardMaterial({ color: 0xd4c8b0, roughness: 0.95 })
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 0.95 })
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 0.9 })

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 5), furMat)
  body.scale.set(1, 1.1, 1.3)
  body.position.y = 0.18
  g.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 5), furMat)
  head.position.set(0, 0.34, 0.14)
  g.add(head)

  ;[-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.22, 6), furMat)
    ear.position.set(s * 0.06, 0.52, 0.1)
    ear.rotation.z = s * 0.12
    g.add(ear)
    const innerEar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.18, 5), darkMat)
    innerEar.position.copy(ear.position)
    innerEar.rotation.copy(ear.rotation)
    g.add(innerEar)
  })

  ;[-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 5, 4),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }),
    )
    eye.position.set(s * 0.062, 0.36, 0.22)
    g.add(eye)
  })

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), noseMat)
  nose.position.set(0, 0.3, 0.26)
  g.add(nose)

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 4), furMat)
  tail.position.set(0, 0.2, -0.22)
  g.add(tail)

  ;[-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.1, 5), furMat)
    leg.position.set(s * 0.08, 0.08, 0.12)
    g.add(leg)
    const hleg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.12, 5), furMat)
    hleg.position.set(s * 0.09, 0.08, -0.1)
    g.add(hleg)
  })

  return g
}

// ── Public: spawn all rabbits ─────────────────────────────────────────────────
export function buildRabbits(scene: THREE.Scene): THREE.Group[] {
  // Loose back-centre triangle — close enough to see each other, clear of all objects
  //   R1 (-4,-3)  R2 (4,-3)  R3 (0,-6)
  // Max pair distance ≈ 8 units; all ≥ 4 units from any interactive object
  const startPositions = [
    { x: -4, z: -3 },
    { x:  4, z: -3 },
    { x:  0, z: -6 },
  ]
  return startPositions.map((pos, i) => {
    const r = buildRabbit()
    r.position.set(pos.x, 0, pos.z)
    r.userData['rabbitIndex'] = i
    r.userData['speed'] = 0.6 + Math.random() * 0.4
    r.userData['targetX'] = pos.x
    r.userData['targetZ'] = pos.z
    r.userData['hopPhase'] = Math.random() * Math.PI * 2
    r.userData['state'] = 'wait'
    r.userData['stateTimer'] = 1 + Math.random() * 2
    r.userData['petTimer'] = 0
    r.userData['hearts'] = []
    r.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true })
    scene.add(r)
    return r
  })
}

// ── Public: trigger pet interaction ──────────────────────────────────────────
/** Called when the player clicks/taps a rabbit. Stops it and spawns hearts. */
export function petRabbit(r: THREE.Group): void {
  const ud = r.userData as Record<string, unknown>
  // Already petting — allow re-trigger to restart the heart burst
  // Clean up any existing hearts first
  const existing = ud['hearts'] as THREE.Sprite[]
  existing.forEach((h) => h.parent?.remove(h))
  ud['hearts'] = []

  ud['state'] = 'pet'
  ud['petTimer'] = 2.8           // seconds of hearts before flee
  r.position.y = 0              // snap to ground in case mid-hop
  r.scale.y = 1

  const scene = r.parent
  if (!scene) return
  const tex = getHeartTex()
  const hearts = ud['hearts'] as THREE.Sprite[]

  for (let i = 0; i < 6; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1 })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(0.3, 0.3, 1)
    sprite.position.set(
      r.position.x + (Math.random() - 0.5) * 0.5,
      0.7 + Math.random() * 0.35,
      r.position.z + (Math.random() - 0.5) * 0.5,
    )
    sprite.userData['vy'] = 0.32 + Math.random() * 0.22   // units/sec upward drift
    sprite.userData['age'] = 0
    sprite.userData['maxAge'] = 1.4 + Math.random() * 1.0
    sprite.userData['sway'] = (Math.random() - 0.5) * 0.6 // horizontal sway speed
    scene.add(sprite)
    hearts.push(sprite)
  }
}

// ── Public: per-frame update ──────────────────────────────────────────────────
export function updateRabbits(rabbitGroups: THREE.Group[], dt: number, t: number): void {
  rabbitGroups.forEach((r) => {
    const ud = r.userData as {
      speed: number; targetX: number; targetZ: number
      hopPhase: number; state: string; stateTimer: number
      petTimer: number; hearts: THREE.Sprite[]
    }

    // ── Heart particles (updated regardless of rabbit state) ────────────────
    for (let i = ud.hearts.length - 1; i >= 0; i--) {
      const h = ud.hearts[i]!
      const age = (h.userData['age'] as number) + dt
      const maxAge = h.userData['maxAge'] as number
      h.userData['age'] = age
      h.position.y += (h.userData['vy'] as number) * dt
      h.position.x += (h.userData['sway'] as number) * dt * Math.sin(age * 3)
      ;(h.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - age / maxAge)
      if (age >= maxAge) {
        h.parent?.remove(h)
        ud.hearts.splice(i, 1)
      }
    }

    // ── State machine ────────────────────────────────────────────────────────
    if (ud.state === 'pet') {
      // Stay still — gentle ear-wiggle via scale pulse
      r.scale.y = 1 + Math.sin(t * 8) * 0.04
      ud.petTimer -= dt
      if (ud.petTimer <= 0) {
        // Flee — wander away, respecting avoidance zones
        const t = pickWanderTarget(r)
        ud.targetX = t.x
        ud.targetZ = t.z
        ud.state = 'walk'
        ud.stateTimer = 3 + Math.random() * 2
      }
      return
    }

    ud.stateTimer -= dt

    if (ud.state === 'wait') {
      r.scale.y = 1 + Math.sin(t * 2 + ud.hopPhase) * 0.015
      if (ud.stateTimer <= 0) {
        const t = pickWanderTarget(r)
        ud.targetX = t.x
        ud.targetZ = t.z
        ud.state = 'walk'
        ud.stateTimer = 2 + Math.random() * 3
      }
    } else {
      // Walk state
      const dx = ud.targetX - r.position.x
      const dz = ud.targetZ - r.position.z
      const dist = Math.hypot(dx, dz)
      if (dist < 0.15 || ud.stateTimer <= 0) {
        ud.state = 'wait'
        ud.stateTimer = 1 + Math.random() * 2.5
        r.position.y = 0
        r.scale.y = 1
      } else {
        const step = Math.min(ud.speed * dt, dist)
        r.position.x += (dx / dist) * step
        r.position.z += (dz / dist) * step
        r.rotation.y = Math.atan2(dx, dz)
        ud.hopPhase += dt * 10
        r.position.y = Math.max(0, Math.sin(ud.hopPhase) * 0.08)
        r.children.forEach((ch, ci) => {
          if (ci === 3 || ci === 4)
            (ch as THREE.Object3D).rotation.x = Math.sin(ud.hopPhase * 0.5) * 0.1
        })
      }
    }
  })
}
