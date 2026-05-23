// src/lib/scene/island.ts
import * as THREE from 'three'
import { noise2 } from './noise'
import type { SceneTextures } from './textures'

export function buildIsland(scene: THREE.Scene, tex: SceneTextures): void {
  // Rock base — 36 radial segments for a smooth silhouette
  const geo = new THREE.CylinderGeometry(16, 20, 3, 36, 5)
  const pos = geo.attributes['position'] as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const r = Math.sqrt(x * x + z * z)
    const edgeFactor = Math.max(0, (r - 10) / 7)
    const nv =
      noise2(x / 9, z / 9) * 1.2 * edgeFactor +
      noise2(x / 3, z / 3) * 0.35 * edgeFactor
    if (y > 0) {
      const jitter = edgeFactor * 0.9
      pos.setXYZ(
        i,
        x + (Math.sin(x * 0.8 + z * 0.6) * 0.4 + Math.sin(x * 1.7) * 0.2) * jitter,
        y + nv * 0.4,
        z + (Math.cos(z * 0.7 + x * 0.5) * 0.4 + Math.cos(z * 1.5) * 0.2) * jitter,
      )
    } else {
      pos.setXYZ(i, x + (Math.random() - 0.5) * 0.3, y, z + (Math.random() - 0.5) * 0.3)
    }
  }
  geo.computeVertexNormals()
  const rockBase = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: tex.rock, color: 0x5a5448, roughness: 0.95, metalness: 0.06 }),
  )
  rockBase.position.y = -1.5
  rockBase.receiveShadow = true
  rockBase.castShadow = true
  scene.add(rockBase)

  // Surface dirt plane
  const FSEG = 32
  const dGeo = new THREE.PlaneGeometry(34, 34, FSEG, FSEG)
  const dPos = dGeo.attributes['position'] as THREE.BufferAttribute
  for (let i = 0; i < dPos.count; i++) {
    const x = dPos.getX(i)
    const y = dPos.getY(i)
    const r = Math.sqrt(x * x + y * y)
    const edgeFactor = Math.max(0, (r - 6) / 10)
    const h =
      (Math.sin(x / 5 + y / 7) * 0.18 +
        Math.sin(x / 3 - y / 4) * 0.12 +
        Math.sin(x / 8 + y / 5) * 0.08) *
      edgeFactor
    dPos.setZ(i, h)
  }
  dGeo.computeVertexNormals()
  const dirt = new THREE.Mesh(
    dGeo,
    new THREE.MeshStandardMaterial({ map: tex.dirt, color: 0x7a9a35, roughness: 0.92, metalness: 0.02 }),
  )
  dirt.rotation.x = -Math.PI / 2
  dirt.position.y = 0.03
  dirt.receiveShadow = true
  scene.add(dirt)

  // Void plane below island
  const voidPlane = new THREE.Mesh(
    new THREE.CircleGeometry(40, 32),
    new THREE.MeshBasicMaterial({ color: 0x050304, side: THREE.DoubleSide }),
  )
  voidPlane.rotation.x = -Math.PI / 2
  voidPlane.position.y = -12
  scene.add(voidPlane)

  // Lava glow ring under island
  const lavaRing = new THREE.Mesh(
    new THREE.RingGeometry(14, 22, 36),
    new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  )
  lavaRing.rotation.x = -Math.PI / 2
  lavaRing.position.y = -2
  scene.add(lavaRing)

  // Mist cylinder under island
  const mist = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 14, 4, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x220a00, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  )
  mist.position.y = -3
  scene.add(mist)

  // Cliff perimeter stones
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.2
    const r = 13.5 + Math.random() * 2.8
    const s = 0.3 + Math.random() * 0.9
    const cg = new THREE.DodecahedronGeometry(s, 1)
    const cp = cg.attributes['position'] as THREE.BufferAttribute
    for (let j = 0; j < cp.count; j++)
      cp.setXYZ(
        j,
        cp.getX(j) + (Math.random() - 0.5) * 0.25,
        cp.getY(j) + (Math.random() - 0.5) * 0.25,
        cp.getZ(j) + (Math.random() - 0.5) * 0.25,
      )
    cg.computeVertexNormals()
    const cm = new THREE.Mesh(
      cg,
      new THREE.MeshStandardMaterial({ map: tex.rock, color: 0x4a4038, roughness: 0.95, metalness: 0.08 }),
    )
    cm.position.set(
      Math.cos(a) * r,
      s * 0.25 + (Math.random() - 0.5) * 0.3,
      Math.sin(a) * r,
    )
    cm.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    cm.castShadow = true
    cm.receiveShadow = true
    scene.add(cm)
  }
}

export function buildGrass(scene: THREE.Scene): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  const configs = [
    { color: 0x3a6418, count: 800, max: 15, min: 2.5 },
    { color: 0x4a7a22, count: 600, max: 14.5, min: 2 },
    { color: 0x2d5214, count: 450, max: 15, min: 3 },
  ]
  configs.forEach((cfg) => {
    const verts: number[] = []
    const idxs: number[] = []
    const uvs: number[] = []
    const cols: number[] = []
    const col = new THREE.Color(cfg.color)
    for (let i = 0; i < cfg.count; i++) {
      let bx: number, bz: number, r: number
      do {
        bx = (Math.random() - 0.5) * 32
        bz = (Math.random() - 0.5) * 32
        r = Math.sqrt(bx * bx + bz * bz)
      } while (r > cfg.max || r < cfg.min)
      const edgeF = Math.min(1, (r - cfg.min) / (cfg.max - cfg.min))
      const hgt = (0.25 + Math.random() * 0.4) * (0.5 + edgeF * 0.5)
      const hw = 0.045 + Math.random() * 0.05
      const lean = (Math.random() - 0.5) * 0.5
      const ry = Math.random() * Math.PI * 2
      const cosRy = Math.cos(ry)
      const sinRy = Math.sin(ry)
      const surfH = noise2(bx / 7, bz / 7) * 0.25 * Math.max(0, (r - 5) / 10)
      const base = verts.length / 3
      const shade = 0.5 + Math.random() * 0.5
      ;[
        [-hw, 0, 0],
        [hw, 0, 0],
        [lean, hgt, 0],
      ].forEach((v) => {
        verts.push(bx + v[0]! * cosRy, v[1]! + surfH + 0.015, bz + v[0]! * sinRy)
        cols.push(col.r * shade, col.g * shade, col.b * shade)
      })
      uvs.push(0, 0, 1, 0, 0.5, 1)
      idxs.push(base, base + 1, base + 2)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    geo.setIndex(idxs)
    geo.computeVertexNormals()
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        side: THREE.DoubleSide,
        alphaTest: 0.05,
      }),
    )
    scene.add(mesh)
    meshes.push(mesh)
  })
  return meshes
}

export function buildTrees(scene: THREE.Scene, tex: SceneTextures): THREE.Group[] {
  const groups: THREE.Group[] = []
  const positions: [number, number, number][] = [
    [-11, 0, -5], [-13, 0, 1], [-10, 0, 7.5], [10.5, 0, -8],
    [12, 0, 2], [8.5, 0, 8], [-7, 0, -13], [5, 0, -14],
    [-4, 0, 11], [1, 0, 13], [13, 0, -4], [-14, 0, -1],
    [6, 0, 11], [-9, 0, 9],
  ]
  positions.forEach(([x, , z]) => {
    if (Math.sqrt(x * x + z * z) > 15.5) return
    const sc = 0.85 + Math.random() * 0.6
    const g = new THREE.Group()
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * sc, 0.18 * sc, 2 * sc, 10, 3),
      new THREE.MeshStandardMaterial({ map: tex.bark, color: 0x4a2c12, roughness: 0.97 }),
    )
    trunk.position.y = sc
    trunk.castShadow = true
    g.add(trunk)
    const foliageCols = [0x1e4d0a, 0x265e0d, 0x2d6e10, 0x356014, 0x3a6e18]
    const layers = 4 + Math.floor(Math.random() * 2)
    for (let i = 0; i < layers; i++) {
      const rad = (1.5 - (i / (layers - 1)) * 1.0) * sc
      const hgt = (0.9 + Math.random() * 0.3) * sc
      const fg = new THREE.ConeGeometry(rad, hgt, 9, 2)
      const fp = fg.attributes['position'] as THREE.BufferAttribute
      for (let j = 0; j < fp.count; j++)
        fp.setXYZ(
          j,
          fp.getX(j) + (Math.random() - 0.5) * 0.18 * sc,
          fp.getY(j) + (Math.random() - 0.5) * 0.1 * sc,
          fp.getZ(j) + (Math.random() - 0.5) * 0.18 * sc,
        )
      fg.computeVertexNormals()
      const f = new THREE.Mesh(
        fg,
        new THREE.MeshStandardMaterial({ color: foliageCols[Math.min(i, 4)]!, roughness: 0.85, map: tex.grass }),
      )
      f.position.y = (2.0 + i * 0.65) * sc
      f.rotation.y = Math.random() * Math.PI
      f.castShadow = true
      g.add(f)
    }
    g.position.set(x, 0, z)
    g.rotation.y = Math.random() * Math.PI * 2
    g.rotation.z = (Math.random() - 0.5) * 0.06
    scene.add(g)
    groups.push(g)
  })
  return groups
}

export function buildFlowers(scene: THREE.Scene): THREE.Group[] {
  const groups: THREE.Group[] = []
  const flowerColors = [0xff1493, 0xff69b4, 0xff1493, 0xff69b4, 0xff1493, 0xee1177]
  for (let i = 0; i < 55; i++) {
    let fx: number, fz: number, fr: number
    do {
      fx = (Math.random() - 0.5) * 28
      fz = (Math.random() - 0.5) * 28
      fr = Math.sqrt(fx * fx + fz * fz)
    } while (fr > 13.5 || fr < 1.5)

    const g = new THREE.Group()
    const col = flowerColors[Math.floor(Math.random() * flowerColors.length)]!
    const petalMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a7010, roughness: 0.95 })
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffee44, roughness: 0.8 })

    const stemH = 0.07 + Math.random() * 0.05
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, stemH, 5), stemMat)
    stem.position.y = stemH * 0.5
    g.add(stem)

    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 3), petalMat)
      petal.scale.set(1, 0.35, 1.6)
      petal.position.set(Math.cos(angle) * 0.020, stemH + 0.003, Math.sin(angle) * 0.020)
      petal.rotation.y = angle
      g.add(petal)
    }

    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.007, 7), centerMat)
    center.position.y = stemH + 0.004
    g.add(center)

    g.position.set(fx, 0, fz)
    g.rotation.y = Math.random() * Math.PI * 2
    scene.add(g)
    groups.push(g)
  }
  return groups
}

export function buildDecorRocks(scene: THREE.Scene, tex: SceneTextures): void {
  const positions: [number, number, number][] = [
    [-4, 0, -2], [5, 0, -1], [2, 0, 3.5], [-3, 0, 4.5], [-6, 0, 6.5], [11, 0, 0.5], [-12, 0, 2.5],
  ]
  positions.forEach(([x, , z]) => {
    if (Math.sqrt(x * x + z * z) > 15) return
    const s = 0.2 + Math.random() * 0.6
    const geo = new THREE.DodecahedronGeometry(s, 1)
    const pos = geo.attributes['position'] as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++)
      pos.setXYZ(
        i,
        pos.getX(i) + (Math.random() - 0.5) * 0.22,
        pos.getY(i) + (Math.random() - 0.5) * 0.22,
        pos.getZ(i) + (Math.random() - 0.5) * 0.22,
      )
    geo.computeVertexNormals()
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        map: tex.rock,
        color: new THREE.Color().setHSL(0.06 + Math.random() * 0.04, 0.18, 0.30 + Math.random() * 0.12),
        roughness: 0.94,
        metalness: 0.08,
      }),
    )
    m.position.set(
      x + (Math.random() - 0.5) * 0.5,
      s * 0.35,
      z + (Math.random() - 0.5) * 0.5,
    )
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    m.castShadow = true
    m.receiveShadow = true
    scene.add(m)
  })

  // Cliff spike stones
  for (let i = 0; i < 10; i++) {
    const hh = 0.8 + Math.random() * 3
    const geo = new THREE.ConeGeometry(0.08 + Math.random() * 0.16, hh, 6, 2)
    const pos = geo.attributes['position'] as THREE.BufferAttribute
    for (let j = 0; j < pos.count; j++)
      pos.setXYZ(
        j,
        pos.getX(j) + (Math.random() - 0.5) * 0.07,
        pos.getY(j),
        pos.getZ(j) + (Math.random() - 0.5) * 0.07,
      )
    geo.computeVertexNormals()
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ map: tex.rock, color: 0x3a3028, roughness: 0.97, metalness: 0.04 }),
    )
    const a = (i / 10) * Math.PI * 2
    const r = 13 + Math.random() * 2.5
    m.position.set(Math.cos(a) * r, hh / 2, Math.sin(a) * r)
    m.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2)
    m.castShadow = true
    scene.add(m)
  }
}

// Returns invisible ground plane used for raycasting walk targets
export function buildGround(scene: THREE.Scene): THREE.Mesh {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.01
  scene.add(ground)
  return ground
}
