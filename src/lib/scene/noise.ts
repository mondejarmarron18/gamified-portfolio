// src/lib/scene/noise.ts

export function hash(n: number): number {
  return Math.abs((Math.sin(n) * 43758.5453) % 1)
}

export function noise2(x: number, z: number): number {
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
