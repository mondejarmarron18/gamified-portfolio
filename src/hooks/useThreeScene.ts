import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getTextures } from '@/lib/scene/textures'
import { buildLighting } from '@/lib/scene/lighting'
import { buildSky, applyDayNight } from '@/lib/scene/sky'
import {
  buildIsland,
  buildGrass,
  buildTrees,
  buildFlowers,
  buildDecorRocks,
  buildGround,
} from '@/lib/scene/island'
import { buildPlayer } from '@/lib/scene/player'
import { buildRocks } from '@/lib/scene/rocks'
import { buildSignBoard, buildChest, buildScroll } from '@/lib/scene/objects'
import { buildRabbits } from '@/lib/scene/rabbits'
import { getState } from '@/lib/state'
import type { LightHandles } from '@/lib/scene/lighting'
import type { SkyHandles } from '@/lib/scene/sky'
import type { PlayerHandles } from '@/lib/scene/player'
import type { RockHandles } from '@/lib/scene/rocks'
import type { ObjectHandles } from '@/lib/scene/objects'

export interface SceneRefs {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  clock: THREE.Clock
  lights: LightHandles
  sky: SkyHandles
  player: PlayerHandles
  rockHandles: RockHandles[]
  objects: ObjectHandles
  rabbitGroups: THREE.Group[]
  groundMesh: THREE.Mesh
  isDay: boolean
}

const IS_MOBILE =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
): React.RefObject<SceneRefs | null> {
  const refsRef = useRef<SceneRefs | null>(null)

  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060810)
    scene.fog = new THREE.FogExp2(0x0c1018, 0.012)

    const W = container.clientWidth
    const H = container.clientHeight
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 300)
    camera.position.set(0, 20, 38)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: !IS_MOBILE,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(
      IS_MOBILE
        ? Math.min(window.devicePixelRatio, 1.5)
        : Math.min(window.devicePixelRatio, 2),
    )
    renderer.setSize(W, H)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    const clock = new THREE.Clock()
    const tex = getTextures()
    const gs = getState()

    const lights = buildLighting(scene)
    const sky = buildSky(scene)

    buildIsland(scene, tex)
    buildGrass(scene)
    buildTrees(scene, tex)
    buildFlowers(scene)
    buildDecorRocks(scene, tex)
    const groundMesh = buildGround(scene)

    const player = buildPlayer(scene, tex)
    const rockHandles = buildRocks(scene, gs.rocks, tex)
    const signGroup = buildSignBoard(scene, tex, gs.signPos)
    const { chestGroup, chestLid, chestGlow } = buildChest(scene, gs.chestPos)
    const scrollGroup = buildScroll(scene, gs.scrollPos)
    const rabbitGroups = buildRabbits(scene)

    const objects: ObjectHandles = { signGroup, chestGroup, chestLid, chestGlow, scrollGroup }

    applyDayNight(scene, sky, lights, true)

    refsRef.current = {
      scene, camera, renderer, clock,
      lights, sky, player,
      rockHandles, objects, rabbitGroups,
      groundMesh, isDay: true,
    }

    return () => {
      renderer.dispose()
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement)
      refsRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return refsRef
}
