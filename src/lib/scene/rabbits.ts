// src/lib/scene/rabbits.ts
import * as THREE from 'three'

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

export function buildRabbits(scene: THREE.Scene): THREE.Group[] {
  const startPositions = [
    { x: -10, z: -4 },
    { x: 9, z: 7 },
    { x: -2, z: -11 },
  ]
  return startPositions.map((pos, i) => {
    const r = buildRabbit()
    r.position.set(pos.x, 0, pos.z)
    r.userData['speed'] = 0.6 + Math.random() * 0.4
    r.userData['targetX'] = pos.x
    r.userData['targetZ'] = pos.z
    r.userData['hopPhase'] = Math.random() * Math.PI * 2
    r.userData['state'] = 'wait'
    r.userData['stateTimer'] = 1 + Math.random() * 2
    r.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true })
    scene.add(r)
    void i  // suppress unused warning
    return r
  })
}

export function updateRabbits(rabbitGroups: THREE.Group[], dt: number, t: number): void {
  rabbitGroups.forEach((r) => {
    const ud = r.userData as {
      speed: number; targetX: number; targetZ: number
      hopPhase: number; state: string; stateTimer: number
    }
    ud.stateTimer -= dt

    if (ud.state === 'wait') {
      r.scale.y = 1 + Math.sin(t * 2 + ud.hopPhase) * 0.015
      if (ud.stateTimer <= 0) {
        const angle = Math.random() * Math.PI * 2
        const radius = 2 + Math.random() * 9
        ud.targetX = Math.cos(angle) * radius
        ud.targetZ = Math.sin(angle) * radius
        ud.state = 'walk'
        ud.stateTimer = 2 + Math.random() * 3
      }
    } else {
      const dx = ud.targetX - r.position.x
      const dz = ud.targetZ - r.position.z
      const dist = Math.hypot(dx, dz)
      if (dist < 0.15 || ud.stateTimer <= 0) {
        ud.state = 'wait'
        ud.stateTimer = 1 + Math.random() * 2.5
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
