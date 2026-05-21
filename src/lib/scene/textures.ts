// src/lib/scene/textures.ts
import * as THREE from 'three'

// ── Noise helpers ──────────────────────────────────────────────────────────

function hash(n: number): number {
  return (Math.sin(n) * 43758.5453) % 1
}

function noise2(x: number, z: number): number {
  const X = Math.floor(x)
  const Z = Math.floor(z)
  const fx = x - X
  const fz = z - Z
  const u = fx * fx * (3 - 2 * fx)
  const v = fz * fz * (3 - 2 * fz)
  const a = hash(X + Z * 57)
  const b = hash(X + 1 + Z * 57)
  const c = hash(X + (Z + 1) * 57)
  const d = hash(X + 1 + (Z + 1) * 57)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function mkTex(
  w: number,
  h: number,
  fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  fn(canvas.getContext('2d')!, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// ── Texture factories ──────────────────────────────────────────────────────

export interface SceneTextures {
  dirt: THREE.CanvasTexture
  rock: THREE.CanvasTexture
  bark: THREE.CanvasTexture
  skin: THREE.CanvasTexture
  leather: THREE.CanvasTexture
  metal: THREE.CanvasTexture
  grass: THREE.CanvasTexture
  wood: THREE.CanvasTexture
}

let _cache: SceneTextures | null = null

export function getTextures(): SceneTextures {
  if (_cache) return _cache

  const dirt = mkTex(256, 256, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n =
          noise2(x / 18, y / 18) * 0.5 +
          noise2(x / 7, y / 7) * 0.3 +
          noise2(x / 3, y / 3) * 0.2
        const v = (38 + n * 35) | 0
        ctx.fillStyle = `rgb(${v + 10},${(v * 0.6) | 0},${(v * 0.33) | 0})`
        ctx.fillRect(x, y, 1, 1)
      }
  })
  dirt.repeat.set(6, 6)

  const rock = mkTex(256, 256, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise2(x / 14, y / 14) * 0.6 + noise2(x / 5, y / 5) * 0.4
        const v = (52 + n * 58) | 0
        ctx.fillStyle = `rgb(${v},${(v * 0.87) | 0},${(v * 0.72) | 0})`
        ctx.fillRect(x, y, 1, 1)
      }
  })
  rock.repeat.set(2, 2)

  const bark = mkTex(128, 256, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise2(x / 4, y / 18) * 0.7 + noise2(x / 2, y / 5) * 0.3
        const v = (30 + n * 40) | 0
        ctx.fillStyle = `rgb(${v + 8},${(v * 0.56) | 0},${(v * 0.26) | 0})`
        ctx.fillRect(x, y, 1, 1)
      }
  })
  bark.repeat.set(2, 4)

  const skin = mkTex(64, 64, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise2(x / 6, y / 6) * 0.35
        ctx.fillStyle = `rgb(${(180 + n * 28) | 0},${(125 + n * 18) | 0},${(82 + n * 15) | 0})`
        ctx.fillRect(x, y, 1, 1)
      }
  })

  const leather = mkTex(128, 128, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise2(x / 8, y / 8) * 0.5 + noise2(x / 3, y / 3) * 0.3
        const v = (38 + n * 28) | 0
        ctx.fillStyle = `rgb(${v + 12},${(v * 0.52) | 0},${(v * 0.18) | 0})`
        ctx.fillRect(x, y, 1, 1)
      }
  })

  const metal = mkTex(128, 128, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise2(x / 4, y / 18) * 0.6 + noise2(x / 2, y / 4) * 0.4
        const v = (105 + n * 85) | 0
        ctx.fillStyle = `rgb(${v},${v},${v + 5})`
        ctx.fillRect(x, y, 1, 1)
      }
  })

  const grass = mkTex(256, 256, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise2(x / 16, y / 16) * 0.5 + noise2(x / 6, y / 6) * 0.3
        const g = (65 + n * 55) | 0
        ctx.fillStyle = `rgb(${(g * 0.43) | 0},${g},${(g * 0.21) | 0})`
        ctx.fillRect(x, y, 1, 1)
      }
  })
  grass.repeat.set(8, 8)

  const wood = mkTex(128, 128, (ctx, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise2(x / 6, y / 2) * 0.6 + noise2(x / 2, y / 8) * 0.4
        const v = (55 + n * 40) | 0
        ctx.fillStyle = `rgb(${v + 10},${(v * 0.6) | 0},${(v * 0.3) | 0})`
        ctx.fillRect(x, y, 1, 1)
      }
  })
  wood.repeat.set(2, 2)

  _cache = { dirt, rock, bark, skin, leather, metal, grass, wood }
  return _cache
}
