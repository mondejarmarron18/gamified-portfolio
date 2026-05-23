// src/lib/scene/lighting.ts
import * as THREE from 'three'

export interface LightHandles {
  moon: THREE.DirectionalLight
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
  forge: THREE.PointLight
  moonPoint: THREE.PointLight   // soft blue ground fill at night
}

export function buildLighting(scene: THREE.Scene): LightHandles {
  const moon = new THREE.DirectionalLight(0x9aaedd, 1.4)
  moon.name = 'moonLight'
  moon.position.set(-15, 30, 10)
  moon.castShadow = true
  moon.shadow.mapSize.set(2048, 2048)
  moon.shadow.camera.near = 0.5
  moon.shadow.camera.far = 100
  moon.shadow.camera.left = -30
  moon.shadow.camera.right = 30
  moon.shadow.camera.top = 30
  moon.shadow.camera.bottom = -30
  moon.shadow.bias = -0.001
  scene.add(moon)

  // Soft moonlight point — activates at night via applyDayNight
  const moonPoint = new THREE.PointLight(0x99aadd, 0, 60)
  moonPoint.name = 'moonPoint'
  moonPoint.position.set(-10, 28, 8)
  scene.add(moonPoint)

  const sun = new THREE.DirectionalLight(0xffeebb, 0)
  sun.name = 'sunLight'
  sun.position.set(30, 40, -20)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 100
  sun.shadow.camera.left = -30
  sun.shadow.camera.right = 30
  sun.shadow.camera.top = 30
  sun.shadow.camera.bottom = -30
  sun.shadow.bias = -0.001
  scene.add(sun)

  const hemi = new THREE.HemisphereLight(0x223366, 0x1a1006, 0.75)
  hemi.name = 'hemiLight'
  scene.add(hemi)

  const forge = new THREE.PointLight(0xff7722, 3.5, 28)
  forge.position.set(0, 5, -3)
  forge.name = 'forgeLight'
  scene.add(forge)

  const lLeft = new THREE.PointLight(0xff3300, 1.4, 20)
  lLeft.castShadow = false
  lLeft.position.set(-14, 3, -6)
  scene.add(lLeft)

  const lRight = new THREE.PointLight(0xff8800, 1.1, 20)
  lRight.castShadow = false
  lRight.position.set(14, 3, -6)
  scene.add(lRight)

  const fill = new THREE.DirectionalLight(0x334466, 0.3)
  fill.position.set(0, 5, 15)
  scene.add(fill)

  return { moon, sun, hemi, forge, moonPoint }
}
