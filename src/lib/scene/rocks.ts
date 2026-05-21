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
    const baseColor = isGold ? 0xc8a828 : 0x9a8060
    const geo = new THREE.DodecahedronGeometry(isGold ? 1.1 : 0.65, 2)
    const pos = geo.attributes['position'] as THREE.BufferAttribute
    for (let j = 0; j < pos.count; j++) {
      const x = pos.getX(j)
      const y = pos.getY(j)
      const z = pos.getZ(j)
      const len = Math.sqrt(x * x + y * y + z * z)
      const n = noise2(x * 1.8 + i, z * 1.8) * 0.22 + noise2(x * 4 + i, z * 4) * 0.1
      pos.setXYZ(j, x + (x / len) * n, y + (y / len) * n, z + (z / len) * n)
    }
    geo.computeVertexNormals()
    const rockMat = new THREE.MeshStandardMaterial({
      ...(isGold ? {} : { map: tex.rock }),
      color: baseColor,
      roughness: isGold ? 0.4 : 0.78,
      metalness: isGold ? 0.85 : 0.25,
    })
    const rockMesh = new THREE.Mesh(geo, rockMat)
    rockMesh.castShadow = true
    rockMesh.receiveShadow = true
    rockMesh.position.y = isGold ? 1.1 : 0.65
    rockMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI * 0.3,
    )
    g.add(rockMesh)

    // Satellite pebbles
    for (let k = 0; k < 3; k++) {
      const s2 = isGold ? 0.18 + Math.random() * 0.28 : 0.1 + Math.random() * 0.16
      const g2 = new THREE.DodecahedronGeometry(s2, 1)
      const p2 = g2.attributes['position'] as THREE.BufferAttribute
      for (let j = 0; j < p2.count; j++)
        p2.setXYZ(
          j,
          p2.getX(j) + (Math.random() - 0.5) * 0.15,
          p2.getY(j) + (Math.random() - 0.5) * 0.15,
          p2.getZ(j) + (Math.random() - 0.5) * 0.15,
        )
      g2.computeVertexNormals()
      const m2 = new THREE.Mesh(
        g2,
        new THREE.MeshStandardMaterial({
          color: isGold ? 0xa88820 : 0x887060,
          roughness: isGold ? 0.5 : 0.92,
          metalness: isGold ? 0.6 : 0.15,
        }),
      )
      const a2 = (k / 3) * Math.PI * 2
      const orb = isGold ? 0.85 + Math.random() * 0.35 : 0.5 + Math.random() * 0.2
      m2.position.set(Math.cos(a2) * orb, s2 * 0.4, Math.sin(a2) * orb)
      m2.castShadow = true
      g.add(m2)
    }

    const glowColor = isGold ? 0xffcc00 : 0xff8833
    const glowLight = new THREE.PointLight(glowColor, 0.6, 6)
    glowLight.position.y = 1.0
    g.add(glowLight)

    const gemLight = new THREE.PointLight(glowColor, 0, 8)
    gemLight.position.y = 2.5
    g.add(gemLight)

    if (!isGold) {
      const moss = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
        new THREE.MeshStandardMaterial({ color: 0x2a5010, roughness: 0.98 }),
      )
      moss.position.y = 0.03
      moss.scale.set(0.85, 0.3, 0.85)
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
        clearInterval(iv)
      }
    }, 16)
  }
}
