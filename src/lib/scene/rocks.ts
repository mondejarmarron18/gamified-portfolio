// src/lib/scene/rocks.ts
import * as THREE from 'three'
import { noise2 } from './noise'
import type { SceneTextures } from './textures'
import type { RockData } from '@/types/game'

export interface RockHandles {
  group: THREE.Group
  rockMesh: THREE.Mesh
  rockMat: THREE.MeshStandardMaterial
  glowLight: THREE.PointLight
  gemLight: THREE.PointLight
  bobOffset: number
  rockIndex: 0 | 1 | 2
  isGold: boolean
}

export function buildRocks(
  scene: THREE.Scene,
  rocks: [RockData, RockData, RockData],
  tex: SceneTextures,
): RockHandles[] {
  return rocks.map((rock, i) => {
    const g = new THREE.Group()
    const isGold = rock.isGold

    // ── Geometry ────────────────────────────────────────────────────────────
    let geo: THREE.BufferGeometry
    let rockYOffset: number

    if (isGold) {
      // Gold: keep roughly spherical (it's a gem deposit)
      geo = new THREE.DodecahedronGeometry(1.1, 2)
      const pos = geo.attributes['position'] as THREE.BufferAttribute
      for (let j = 0; j < pos.count; j++) {
        const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j)
        const len = Math.sqrt(x*x + y*y + z*z)
        const n = noise2(x*1.8 + i, z*1.8) * 0.22 + noise2(x*4+i, z*4) * 0.1
        pos.setXYZ(j, x+(x/len)*n, y+(y/len)*n, z+(z/len)*n)
      }
      rockYOffset = 1.1
    } else {
      // Non-gold: volcano / craggy rock formation
      // Wide base (r=1.15), narrow irregular top (r=0.35), 8 radial segments = angular silhouette
      geo = new THREE.CylinderGeometry(0.35, 1.15, 1.6, 8, 7)
      const pos = geo.attributes['position'] as THREE.BufferAttribute
      for (let j = 0; j < pos.count; j++) {
        const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j)
        // yNorm: 0 = bottom, 1 = top
        const yNorm = (y + 0.8) / 1.6
        const r = Math.sqrt(x*x + z*z)

        // Radial outward noise — more aggressive toward top → craggy peaks
        const cragi = noise2(x*2.4 + i*5, z*2.4) * (0.22 + yNorm*0.38)
                    + noise2(x*5.5 + i, z*5.5) * 0.08
                    + noise2(x*10, z*10 + i*3) * 0.03
        // Vertical noise — uneven top rim, flat bottom stays grounded
        const yn = noise2(x*3.5 + i*2, z*3.5) * 0.22 * (yNorm * yNorm)
        // Suppress displacement at very bottom so rock sits flush
        const groundDamp = Math.min(1, yNorm * 3.5)

        if (r > 0.001) {
          const scale = 1 + cragi * groundDamp
          pos.setXYZ(j, x * scale, y + yn, z * scale)
        } else {
          // Top-center vertices: pull up/down for crater-like uneven tip
          pos.setXYZ(j, x, y + noise2(j*0.5, i) * 0.2, z)
        }
      }
      rockYOffset = 0  // cylinder base already at y=0 after displacement
    }

    geo.computeVertexNormals()

    const rockMat = new THREE.MeshStandardMaterial({
      ...(isGold ? {} : { map: tex.rock }),
      color: isGold ? 0xc8a828 : 0x5e4e3a,
      roughness: isGold ? 0.4 : 0.96,
      metalness: isGold ? 0.85 : 0.08,
      flatShading: !isGold,  // flat shading = visible angular facets on the rock
    })

    const rockMesh = new THREE.Mesh(geo, rockMat)
    rockMesh.castShadow = true
    rockMesh.receiveShadow = true
    rockMesh.position.y = rockYOffset
    if (isGold) {
      rockMesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI*0.3)
    } else {
      // Random Y rotation only so volcano silhouette stays upright
      rockMesh.rotation.y = Math.random() * Math.PI * 2
    }
    g.add(rockMesh)

    // ── Satellite chunks ────────────────────────────────────────────────────
    for (let k = 0; k < 3; k++) {
      const s2 = isGold ? 0.18 + Math.random()*0.28 : 0.12 + Math.random()*0.2
      // Non-gold: use BoxGeometry for angular boulder chunks
      const g2 = isGold
        ? (() => {
            const d = new THREE.DodecahedronGeometry(s2, 1)
            const p2 = d.attributes['position'] as THREE.BufferAttribute
            for (let j = 0; j < p2.count; j++)
              p2.setXYZ(j, p2.getX(j)+(Math.random()-0.5)*0.12, p2.getY(j)+(Math.random()-0.5)*0.12, p2.getZ(j)+(Math.random()-0.5)*0.12)
            d.computeVertexNormals()
            return d
          })()
        : (() => {
            const b = new THREE.BoxGeometry(s2*1.4, s2*0.9, s2*1.2)
            const p2 = b.attributes['position'] as THREE.BufferAttribute
            for (let j = 0; j < p2.count; j++)
              p2.setXYZ(j, p2.getX(j)+(Math.random()-0.5)*s2*0.5, p2.getY(j)+(Math.random()-0.5)*s2*0.4, p2.getZ(j)+(Math.random()-0.5)*s2*0.5)
            b.computeVertexNormals()
            return b
          })()
      const m2 = new THREE.Mesh(
        g2,
        new THREE.MeshStandardMaterial({
          color: isGold ? 0xa88820 : 0x4a3c2c,
          roughness: isGold ? 0.5 : 0.97,
          metalness: isGold ? 0.6 : 0.05,
          flatShading: !isGold,
        }),
      )
      const a2 = (k / 3) * Math.PI * 2
      const orb = isGold ? 0.85 + Math.random()*0.35 : 0.8 + Math.random()*0.3
      m2.position.set(Math.cos(a2)*orb, s2*0.5, Math.sin(a2)*orb)
      m2.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI*2, Math.random()*Math.PI)
      m2.castShadow = true
      g.add(m2)
    }

    // ── Lights ──────────────────────────────────────────────────────────────
    const glowColor = isGold ? 0xffcc00 : 0xff8833
    const glowLight = new THREE.PointLight(glowColor, 0, 6)
    glowLight.position.y = 1.0
    g.add(glowLight)

    const gemLight = new THREE.PointLight(glowColor, 0, 8)
    gemLight.position.y = 2.5
    g.add(gemLight)

    // Moss cap on non-gold rocks (sits at base of volcano)
    if (!isGold) {
      const moss = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.18, 0.12, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a4a10, roughness: 0.99 }),
      )
      moss.position.y = 0.06
      g.add(moss)
    }

    g.position.set(rock.pos.x, 0, rock.pos.z)
    g.userData['rockMesh'] = rockMesh
    g.userData['rockIndex'] = i

    scene.add(g)

    return {
      group: g,
      rockMesh,
      rockMat,
      glowLight,
      gemLight,
      bobOffset: Math.random() * Math.PI * 2,
      rockIndex: i as 0 | 1 | 2,
      isGold,
    }
  })
}

export function shakeMesh(g: THREE.Group): void {
  const origin = g.position.clone()
  let tick = 0
  const iv = setInterval(() => {
    tick++
    g.position.set(
      origin.x + (Math.random() - 0.5) * 0.16,
      origin.y + (Math.random() - 0.5) * 0.09,
      origin.z + (Math.random() - 0.5) * 0.16,
    )
    if (tick > 9) {
      g.position.copy(origin)
      clearInterval(iv)
    }
  }, 26)
}

export function explodeRock(scene: THREE.Scene, handles: RockHandles): void {
  handles.rockMesh.visible = false
  handles.gemLight.intensity = 4

  if (handles.isGold) {
    // Persistent gold nugget — brighter than scatter shards, clearly clickable
    const nuggetGeo = new THREE.DodecahedronGeometry(0.28, 1)
    const np = nuggetGeo.attributes['position'] as THREE.BufferAttribute
    for (let j = 0; j < np.count; j++)
      np.setXYZ(j, np.getX(j) + (Math.random() - 0.5) * 0.06, np.getY(j) + (Math.random() - 0.5) * 0.06, np.getZ(j) + (Math.random() - 0.5) * 0.06)
    nuggetGeo.computeVertexNormals()
    const nugget = new THREE.Mesh(
      nuggetGeo,
      new THREE.MeshStandardMaterial({ color: 0xffe060, roughness: 0.15, metalness: 0.95, emissive: new THREE.Color(0xffaa00), emissiveIntensity: 0.6 }),
    )
    nugget.position.copy(handles.group.position).add(new THREE.Vector3(0, 0.32, 0))
    nugget.castShadow = true
    nugget.name = 'crackedGoldNugget'
    scene.add(nugget)

    // Pulse light above nugget
    const pulse = new THREE.PointLight(0xffdd44, 3.5, 4)
    pulse.position.copy(nugget.position).add(new THREE.Vector3(0, 0.5, 0))
    scene.add(pulse)

    // Slow bob + spin + pulse glow in game loop via elapsed stored on userData
    nugget.userData['pulse'] = pulse
    nugget.userData['baseY'] = nugget.position.y
    nugget.userData['startTime'] = performance.now() / 1000
    handles.group.userData['nugget'] = nugget
    handles.group.userData['nuggetLight'] = pulse
  }

  for (let i = 0; i < 20; i++) {
    const s = 0.06 + Math.random() * 0.18
    const sGeo = new THREE.DodecahedronGeometry(s, 0)
    const sp = sGeo.attributes['position'] as THREE.BufferAttribute
    for (let j = 0; j < sp.count; j++)
      sp.setXYZ(
        j,
        sp.getX(j) + (Math.random() - 0.5) * 0.13,
        sp.getY(j) + (Math.random() - 0.5) * 0.13,
        sp.getZ(j) + (Math.random() - 0.5) * 0.13,
      )
    sGeo.computeVertexNormals()
    const col = handles.isGold
      ? new THREE.Color(0xf0c030)
      : new THREE.Color().setHSL(0.07, 0.35, 0.45 + Math.random() * 0.2)
    const shard = new THREE.Mesh(
      sGeo,
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: handles.isGold ? 0.4 : 0.9,
        metalness: handles.isGold ? 0.7 : 0.1,
      }),
    )
    shard.position.copy(handles.group.position).add(new THREE.Vector3(0, 1, 0))
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      Math.random() * 7 + 3,
      (Math.random() - 0.5) * 6,
    )
    scene.add(shard)
    let t = 0
    const iv = setInterval(() => {
      t += 0.055
      shard.position.add(vel.clone().multiplyScalar(0.055))
      vel.y -= 0.22
      shard.rotation.x += 0.15
      shard.rotation.z += 0.1
      if (t > 1.6) {
        scene.remove(shard)
        shard.geometry.dispose()
        ;(shard.material as THREE.Material).dispose()
        clearInterval(iv)
      }
    }, 16)
  }
}
