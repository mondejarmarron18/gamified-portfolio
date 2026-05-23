// src/lib/scene/sky.ts
import * as THREE from 'three'
import type { LightHandles } from './lighting'

export interface SkyHandles {
  stars: THREE.Points
  moonDisc: THREE.Mesh
  moonGlow: THREE.Mesh   // soft halo ring around moon
  sunDisc: THREE.Mesh
  sunGlow: THREE.Mesh
  clouds: THREE.Group[]
}

export function buildSky(scene: THREE.Scene): SkyHandles {
  // Stars
  const sv: number[] = []
  for (let i = 0; i < 1400; i++) {
    const t = Math.random() * Math.PI * 2
    const p = Math.acos(2 * Math.random() - 1)
    const r = 88 + Math.random() * 52
    if (Math.cos(p) > -0.1)
      sv.push(
        r * Math.sin(p) * Math.cos(t),
        Math.abs(r * Math.cos(p)) + 2,
        r * Math.sin(p) * Math.sin(t),
      )
  }
  const sg = new THREE.BufferGeometry()
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3))
  const stars = new THREE.Points(
    sg,
    new THREE.PointsMaterial({
      color: 0xddeeff,
      size: 0.32,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    }),
  )
  scene.add(stars)

  // Moon disc
  const moonDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4, 32),
    new THREE.MeshBasicMaterial({
      color: 0xddeeff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    }),
  )
  moonDisc.position.set(-45, 55, -80)
  scene.add(moonDisc)

  // Moon glow halo — larger translucent ring behind the disc
  const moonGlow = new THREE.Mesh(
    new THREE.CircleGeometry(9, 32),
    new THREE.MeshBasicMaterial({
      color: 0xaabbee,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  )
  moonGlow.position.set(-45, 55, -80.5) // slightly behind moonDisc
  scene.add(moonGlow)

  // Sun disc
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(5, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  )
  sunDisc.position.set(40, 45, -70)
  scene.add(sunDisc)

  // Sun glow halo
  const sunGlow = new THREE.Mesh(
    new THREE.CircleGeometry(9, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffcc44,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  )
  sunGlow.position.set(40, 45, -70.5)
  scene.add(sunGlow)

  const clouds = buildClouds(scene)

  return { stars, moonDisc, moonGlow, sunDisc, sunGlow, clouds }
}

function buildClouds(scene: THREE.Scene): THREE.Group[] {
  const positions = [
    { x: -30, y: 28, z: -50, s: 1.2 },
    { x: 20, y: 32, z: -60, s: 1.4 },
    { x: 50, y: 25, z: -40, s: 1.0 },
    { x: -50, y: 30, z: -30, s: 1.3 },
    { x: 10, y: 35, z: -70, s: 1.6 },
  ]
  return positions.map(({ x, y, z, s }) => {
    const cg = new THREE.Group()
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf8f4ee,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0,
    })
    const blobs: [number, number, number, number][] = [
      [0, 0, 0, s * 3],
      [s * 2.2, -0.3, 0, s * 2.2],
      [-(s * 2), -0.2, 0, s * 2],
      [s * 0.8, s * 0.8, 0, s * 1.8],
      [-(s * 0.5), s * 0.5, 0, s * 1.6],
      [0, -0.2, s * 1.5, s * 1.8],
      [0, -0.2, -(s * 1.5), s * 1.8],
    ]
    blobs.forEach(([cx, cy, cz, r]) => {
      const blob = new THREE.Mesh(
        new THREE.SphereGeometry(r, 6, 4),
        cloudMat.clone(),
      )
      blob.position.set(cx, cy, cz)
      cg.add(blob)
    })
    cg.position.set(x, y, z)
    cg.userData['baseX'] = x
    cg.userData['driftSpeed'] = 0.004 + Math.random() * 0.003
    scene.add(cg)
    return cg
  })
}

export function applyDayNight(
  scene: THREE.Scene,
  sky: SkyHandles,
  lights: LightHandles,
  isDay: boolean,
  onComplete?: () => void,
): void {
  const dur = 2500
  const start = Date.now()
  const campfireGroup = scene.getObjectByName('campfireGroup')
  const campfirePointLight = scene.getObjectByName('campfireLight') as THREE.PointLight | undefined
  // Sign board face material — emissive glow at night so text is readable
  const signBoard = scene.getObjectByName('signBoard') as THREE.Mesh | undefined
  const signFaceMat = Array.isArray(signBoard?.material)
    ? (signBoard!.material[4] as THREE.MeshStandardMaterial)
    : undefined

  const dayBg = new THREE.Color(0x87ceeb)
  const nightBg = new THREE.Color(0x060810)
  const dayFog = new THREE.Color(0xb0d8f0)
  const nightFog = new THREE.Color(0x0c1018)

  const tick = setInterval(() => {
    const p = Math.min(1, (Date.now() - start) / dur)
    const ep = p * p * (3 - 2 * p) // smoothstep

    if (isDay) {
      scene.background = nightBg.clone().lerp(dayBg, ep)
      if (scene.fog instanceof THREE.FogExp2)
        scene.fog.color.copy(nightFog.clone().lerp(dayFog, ep))
      ;(sky.stars.material as THREE.PointsMaterial).opacity = 0.9 * (1 - ep)
      ;(sky.moonDisc.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - ep)
      ;(sky.moonGlow.material as THREE.MeshBasicMaterial).opacity = 0.18 * (1 - ep)
      lights.moonPoint.intensity = 2.5 * (1 - ep)
      ;(sky.sunDisc.material as THREE.MeshBasicMaterial).opacity = ep * 0.8
      ;(sky.sunGlow.material as THREE.MeshBasicMaterial).opacity = ep * 0.3
      sky.clouds.forEach((cg) =>
        cg.children.forEach(
          (b) => ((b as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = ep * 0.88,
        ),
      )
      lights.moon.intensity = 2.4 * (1 - ep)
      lights.sun.intensity = ep * 2.2
      lights.hemi.color.set(0x223366).lerp(new THREE.Color(0x88bbff), ep)
      lights.hemi.groundColor.set(0x1a1006).lerp(new THREE.Color(0x6a8040), ep)
      lights.hemi.intensity = 0.75 + ep * 0.5
    } else {
      scene.background = dayBg.clone().lerp(nightBg, ep)
      if (scene.fog instanceof THREE.FogExp2)
        scene.fog.color.copy(dayFog.clone().lerp(nightFog, ep))
      ;(sky.stars.material as THREE.PointsMaterial).opacity = ep * 0.9
      ;(sky.moonDisc.material as THREE.MeshBasicMaterial).opacity = ep * 0.55
      ;(sky.moonGlow.material as THREE.MeshBasicMaterial).opacity = ep * 0.18
      lights.moonPoint.intensity = ep * 2.5
      ;(sky.sunDisc.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - ep)
      ;(sky.sunGlow.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - ep)
      sky.clouds.forEach((cg) =>
        cg.children.forEach(
          (b) => ((b as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.88 * (1 - ep),
        ),
      )
      lights.moon.intensity = ep * 2.4
      lights.sun.intensity = 0.85 * (1 - ep) * 0.3
      lights.hemi.color.set(0x88bbff).lerp(new THREE.Color(0x223366), ep)
      lights.hemi.groundColor.set(0x6a8040).lerp(new THREE.Color(0x1a1006), ep)
      lights.hemi.intensity = 1.25 - ep * 0.5
    }

    // Sign board glow — fades in at night so text stays readable
    if (signFaceMat) signFaceMat.emissiveIntensity = isDay ? 1.4 * (1 - ep) : 1.4 * ep

    // Campfire: only relevant when switching modes
    if (!isDay) {
      // Fading to night — show and fade in
      if (campfireGroup) campfireGroup.visible = true
      if (campfirePointLight) campfirePointLight.intensity = 4.5 * ep
    } else if (campfireGroup?.visible) {
      // Fading to day and campfire was on — fade out then hide
      if (campfirePointLight) campfirePointLight.intensity = 4.5 * (1 - ep)
      if (p >= 1) campfireGroup.visible = false
    }

    if (p >= 1) {
      clearInterval(tick)
      onComplete?.()
    }
  }, 16)
}

export function updateSkyDrift(sky: SkyHandles, t: number): void {
  sky.clouds.forEach((cg) => {
    const baseX = cg.userData['baseX'] as number
    const driftSpeed = cg.userData['driftSpeed'] as number
    cg.position.x = baseX + Math.sin(t * driftSpeed) * 8
  })
}
