'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useThreeScene } from '@/hooks/useThreeScene'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useInput } from '@/hooks/useInput'
import { useGameStore, getState } from '@/lib/state'
import { useModalStore } from '@/lib/modalStore'
import { castRay } from '@/lib/raycaster'
import { applyDayNight, updateSkyDrift } from '@/lib/scene/sky'
import { animatePlayerWalk, resetPlayerPose } from '@/lib/scene/player'
import { shakeMesh, explodeRock } from '@/lib/scene/rocks'
import { spawnSparks, showCrackLabel, showWalkMarker } from '@/lib/effects'
import { updateButterflies } from '@/lib/scene/butterflies'
import { applyQuality } from '@/lib/scene/quality'
import {
  setMusicVolume,
  setSfxVolume,
  startWalkSound,
  stopWalkSound,
  playMineHit,
  playRockExplode,
  playModalOpen,
  cleanupAudio,
} from '@/lib/audio'
import { Hud } from './Hud'
import { Modal } from './Modal'
import { ExperienceModal } from './modals/ExperienceModal'
import { ProjectsModal } from './modals/ProjectsModal'
import { ResumeModal } from './modals/ResumeModal'
import { ContactModal } from './modals/ContactModal'
import type { RaycastTargets } from '@/lib/raycaster'
import styles from './GameCanvas.module.css'

const IS_MOBILE =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

const SPEED = 5.5
const BOUNDS = 13

interface HintConfig {
  id: string
  text: string
  worldPos: THREE.Vector3
}

const HINT_CONFIGS: HintConfig[] = [
  { id: 'sign',   text: '📋 Quest Log — Click to read',        worldPos: new THREE.Vector3(-8, 3.6, 3) },
  { id: 'chest',  text: '📦 Creations — Click to explore',     worldPos: new THREE.Vector3(8, 2.2, 3) },
  { id: 'gold',   text: '💛 Character Sheet — Mine to unlock', worldPos: new THREE.Vector3(0, 3.0, -11) },
  { id: 'scroll', text: '📜 Reach Out — Click to open',        worldPos: new THREE.Vector3(0, 0.9, 6) },
]

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isDay, setIsDay] = useState(true)
  const [fps, setFps] = useState(60)
  const qualityMode = useGameStore((s) => s.qualityMode)
  const [hintLabels, setHintLabels] = useState(
    HINT_CONFIGS.map((h) => ({ id: h.id, text: h.text, x: 0, y: 0, visible: false })),
  )
  const onArriveRef = useRef<(() => void) | null>(null)
  const camThetaRef = useRef(0)
  const camThetaVelRef = useRef(0)
  const campfireActiveRef = useRef(false)
  const wasWalkingRef = useRef(false)
  const [musicVolume, setMusicVolumeState] = useState(0.7)
  const [sfxVolume, setSfxVolumeState] = useState(0.8)

  const sceneRefsRef = useThreeScene(canvasContainerRef, gameStarted)
  const { activeModal, openModal, closeModal } = useModalStore()

  // Clean up AudioContext when component unmounts
  useEffect(() => () => cleanupAudio(), [])

  useEffect(() => {
    function onResize() {
      const refs = sceneRefsRef.current
      const c = canvasContainerRef.current
      if (!refs || !c) return
      const W = c.clientWidth, H = c.clientHeight
      refs.camera.aspect = W / H
      refs.camera.updateProjectionMatrix()
      refs.renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [sceneRefsRef])

  function getRaycastTargets(): RaycastTargets | null {
    const refs = sceneRefsRef.current
    if (!refs) return null
    const gs = getState()
    const uncrackedMeshes = refs.rockHandles
      .filter((_, i) => !gs.rocks[i]!.cracked)
      .map((h) => h.rockMesh)
    const uncrackedGroups = refs.rockHandles
      .filter((_, i) => !gs.rocks[i]!.cracked)
      .map((h) => h.group)
    const crackedGold = refs.rockHandles
      .filter((h) => h.isGold && gs.rocks[h.rockIndex]!.cracked)
      .map((h) => h.group)
    return {
      rockMeshes: uncrackedMeshes,
      rockGroups: uncrackedGroups,
      crackedGoldGroups: crackedGold,
      scrollGroup: refs.objects.scrollGroup,
      signGroup: refs.objects.signGroup,
      chestGroup: refs.objects.chestGroup,
      groundMesh: refs.groundMesh,
      bounds: BOUNDS,
    }
  }

  const handleInteract = useCallback((clientX: number, clientY: number) => {
    const refs = sceneRefsRef.current
    const targets = getRaycastTargets()
    if (!refs || !targets) return
    const hit = castRay(clientX, clientY, refs.camera, refs.renderer, targets)
    if (!hit) return
    const gs = getState()
    const { setTarget, setWalking } = useGameStore.getState()

    if (hit.type === 'ground') return
    if (hit.type === 'crackedGold') { playModalOpen(); openModal('resume'); return }
    if (hit.type === 'sign') {
      const dist = Math.hypot(gs.player.x - gs.signPos.x, gs.player.z - gs.signPos.z)
      if (dist <= 5) { playModalOpen(); openModal('experience') }
      else { setTarget({ x: gs.signPos.x, z: gs.signPos.z + 2 }); setWalking(true); onArriveRef.current = () => { playModalOpen(); openModal('experience') } }
      return
    }
    if (hit.type === 'chest') {
      const dist = Math.hypot(gs.player.x - gs.chestPos.x, gs.player.z - gs.chestPos.z)
      if (dist <= 5) openChest()
      else { setTarget({ x: gs.chestPos.x, z: gs.chestPos.z + 2 }); setWalking(true); onArriveRef.current = () => openChest() }
      return
    }
    if (hit.type === 'scroll') {
      const dist = Math.hypot(gs.player.x - gs.scrollPos.x, gs.player.z - gs.scrollPos.z)
      if (dist <= 5) { playModalOpen(); openModal('contact') }
      else { setTarget({ x: gs.scrollPos.x, z: gs.scrollPos.z + 2 }); setWalking(true); onArriveRef.current = () => { playModalOpen(); openModal('contact') } }
      return
    }
    if (hit.type === 'rock') {
      const ri = hit.rockIndex as 0 | 1 | 2
      const rock = gs.rocks[ri]!
      const dist = Math.hypot(gs.player.x - rock.pos.x, gs.player.z - rock.pos.z)
      if (dist <= 5) tryMine(ri)
      else {
        const rp = refs.rockHandles[ri]!.group.position
        const dx = rp.x - gs.player.x, dz = rp.z - gs.player.z, d = Math.hypot(dx, dz)
        setTarget({ x: rp.x - (dx / d) * 2.3, z: rp.z - (dz / d) * 2.3 })
        setWalking(true)
        onArriveRef.current = () => tryMine(ri)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleWalk = useCallback((clientX: number, clientY: number) => {
    const refs = sceneRefsRef.current
    const targets = getRaycastTargets()
    if (!refs || !targets) return
    const hit = castRay(clientX, clientY, refs.camera, refs.renderer, targets)
    if (!hit) return
    const { setTarget, setWalking } = useGameStore.getState()
    const gs = getState()
    if (hit.type === 'ground') { setTarget(hit.point); setWalking(true); showWalkMarker(clientX, clientY) }
    else if (hit.type === 'rock') {
      const rp = refs.rockHandles[hit.rockIndex]!.group.position
      const dx = rp.x - gs.player.x, dz = rp.z - gs.player.z, d = Math.hypot(dx, dz)
      setTarget({ x: rp.x - (dx / d) * 2.3, z: rp.z - (dz / d) * 2.3 }); setWalking(true)
    }
    else if (hit.type === 'sign')   { setTarget({ x: gs.signPos.x, z: gs.signPos.z + 2 }); setWalking(true) }
    else if (hit.type === 'chest')  { setTarget({ x: gs.chestPos.x, z: gs.chestPos.z + 2 }); setWalking(true) }
    else if (hit.type === 'scroll') { setTarget({ x: gs.scrollPos.x, z: gs.scrollPos.z + 2 }); setWalking(true) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMouseMove = useCallback((clientX: number, clientY: number) => {
    const refs = sceneRefsRef.current
    const targets = getRaycastTargets()
    if (!refs || !targets) return
    const hit = castRay(clientX, clientY, refs.camera, refs.renderer, targets)
    if (!hit) { document.body.style.cursor = ''; return }
    document.body.style.cursor =
      hit.type === 'rock' ? 'crosshair' :
      hit.type === 'ground' ? 'move' : 'pointer'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canvas = sceneRefsRef.current?.renderer.domElement ?? null
  useInput(canvas, {
    onLeftClick: handleInteract,
    onRightClick: handleWalk,
    onMouseMove: handleMouseMove,
    onWheel: (deltaY) => useGameStore.getState().setCamDist(
      Math.max(4, Math.min(18, getState().camDist + deltaY * 0.015)),
    ),
    onTap: handleInteract,
    onPinchDelta: (delta) => useGameStore.getState().setCamDist(
      Math.max(4, Math.min(22, getState().camDist - delta * 0.022)),
    ),
    onEscape: closeModal,
  }, gameStarted)

  function openChest() {
    const refs = sceneRefsRef.current
    const gs = getState()
    if (!refs) return
    if (!gs.chestOpen) {
      useGameStore.getState().openChest()
      let angle = 0
      const iv = setInterval(() => {
        angle += 0.06
        refs.objects.chestLid.rotation.x = -Math.min(angle, Math.PI * 0.75)
        if (angle >= Math.PI * 0.75) clearInterval(iv)
      }, 16)
      refs.objects.chestGlow.intensity = 2.5
    }
    playModalOpen()
    openModal('projects')
  }

  function tryMine(index: 0 | 1 | 2) {
    const refs = sceneRefsRef.current
    const gs = getState()
    const rock = gs.rocks[index]!
    if (!refs || rock.cracked || gs.swinging || gs.stamina < 20) return
    const store = useGameStore.getState()
    store.setSwinging(true)
    store.setStamina(Math.max(0, gs.stamina - 25))

    const { swingArm } = refs.player
    swingArm.rotation.x = -1.3
    setTimeout(() => { swingArm.rotation.x = 0.1; setTimeout(() => { swingArm.rotation.x = 0; store.setSwinging(false) }, 120) }, 340)

    const handle = refs.rockHandles[index]!
    const dx = rock.pos.x - gs.player.x, dz = rock.pos.z - gs.player.z
    refs.player.group.rotation.y = Math.atan2(dx, dz)

    store.hitRock(index)
    const newHits = gs.rocks[index]!.hits + 1
    const crackCols = handle.isGold ? [0xd4aa30, 0xecc840, 0xffd84c] : [0xb09070, 0xc8a870, 0xe0c080]
    handle.rockMat.color.setHex(crackCols[Math.min(newHits - 1, 2)]!)
    handle.glowLight.intensity = newHits * 1.5
    shakeMesh(handle.group)
    spawnSparks(handle.group.position, refs.camera, refs.renderer, handle.isGold)
    playMineHit()
    const canvasContainer = canvasContainerRef.current
    if (canvasContainer)
      showCrackLabel(canvasContainer, ['CRACK!', 'BREAKING!', '💥 SHATTERED!'][Math.min(newHits - 1, 2)]!)

    if (newHits >= rock.maxHits) {
      store.crackRock(index)
      store.incrementDiscovered()
      handle.glowLight.intensity = 0
      setTimeout(() => { playRockExplode(); explodeRock(refs.scene, handle) }, 300)
      if (handle.isGold) setTimeout(() => { playModalOpen(); openModal('resume') }, 800)
    }

    if (!gs.rechargingStamina) {
      store.setRechargingStamina(true)
      const iv = setInterval(() => {
        const current = getState().stamina
        if (current >= 100) { store.setRechargingStamina(false); clearInterval(iv); return }
        store.setStamina(Math.min(100, current + 10))
      }, 185)
    }
  }

  useGameLoop(
    useCallback((dt: number, elapsed: number) => {
      const refs = sceneRefsRef.current
      if (!refs) return
      const gs = getState()
      const store = useGameStore.getState()

      // Walk sound — start/stop on transition
      if (gs.walking && !wasWalkingRef.current) startWalkSound()
      else if (!gs.walking && wasWalkingRef.current) stopWalkSound()
      wasWalkingRef.current = gs.walking

      if (gs.target) {
        const dx = gs.target.x - gs.player.x
        const dz = gs.target.z - gs.player.z
        const dist = Math.hypot(dx, dz)
        if (dist < 0.1) {
          store.setWalking(false)
          store.setTarget(null)
          resetPlayerPose(refs.player.group)
          onArriveRef.current?.()
          onArriveRef.current = null
        } else {
          const step = Math.min(SPEED * dt, dist)
          store.setPlayer({ x: gs.player.x + (dx / dist) * step, z: gs.player.z + (dz / dist) * step })
          refs.player.group.position.x = gs.player.x + (dx / dist) * step
          refs.player.group.position.z = gs.player.z + (dz / dist) * step
          refs.player.group.rotation.y = Math.atan2(dx, dz)
          animatePlayerWalk(refs.player.group, elapsed, gs.swinging)
        }
      }

      if (gs.introZoom) {
        store.setIntroZoomDist(THREE.MathUtils.lerp(gs.introZoomDist, gs.introZoomTarget, 0.055))
        const cx = gs.introZoomDist * Math.sin(camThetaRef.current) * Math.cos(gs.camPhi)
        const cy = gs.introZoomDist * Math.sin(gs.camPhi) + 1.5
        const cz = gs.introZoomDist * Math.cos(camThetaRef.current) * Math.cos(gs.camPhi)
        refs.camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.04)
        refs.camera.lookAt(0, 0, 0)
        if (Math.abs(gs.introZoomDist - gs.introZoomTarget) < 1.0) store.setIntroZoom(false)
      } else {
        if (gs.walking) {
          const targetTheta = refs.player.group.rotation.y + Math.PI
          const da = ((targetTheta - camThetaRef.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI
          camThetaVelRef.current += da * 0.016
          camThetaVelRef.current *= 0.85
          camThetaRef.current += camThetaVelRef.current
        }
        const cx = gs.player.x + gs.camDist * Math.sin(camThetaRef.current) * Math.cos(gs.camPhi)
        const cy = gs.camDist * Math.sin(gs.camPhi) + 1.5
        const cz = gs.player.z + gs.camDist * Math.cos(camThetaRef.current) * Math.cos(gs.camPhi)
        refs.camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.05)
        refs.camera.lookAt(gs.player.x, 1.5, gs.player.z)
      }

      void import('@/lib/scene/rabbits').then(({ updateRabbits }) => updateRabbits(refs.rabbitGroups, dt, elapsed))

      refs.rockHandles.forEach((h, i) => {
        const r = gs.rocks[i]!
        if (r.cracked) {
          h.gemLight.intensity = 3 + Math.sin(elapsed * 2.2 + i) * 1.2
          // Animate the persistent gold nugget
          const nugget = h.group.userData['nugget'] as THREE.Mesh | undefined
          const nuggetLight = h.group.userData['nuggetLight'] as THREE.PointLight | undefined
          if (nugget) {
            const baseY = nugget.userData['baseY'] as number
            nugget.position.y = baseY + Math.sin(elapsed * 2.4 + i) * 0.08
            nugget.rotation.y += 0.022
          }
          if (nuggetLight) {
            nuggetLight.intensity = 3 + Math.sin(elapsed * 3.1 + i) * 1.2
          }
        } else {
          h.group.position.y = Math.sin(elapsed * 1.3 + h.bobOffset) * 0.05
        }
      })

      if (gs.chestOpen) {
        refs.objects.chestGlow.intensity = 2 + Math.sin(elapsed * 2) * 0.5
      }

      const forgeLight = refs.scene.getObjectByName('forgeLight') as THREE.PointLight | undefined
      if (forgeLight) forgeLight.intensity = 3.5 + Math.sin(elapsed * 6.8) * 0.4 + Math.sin(elapsed * 11.3) * 0.18

      // Campfire flicker — only when night is fully active (not during transition)
      const campfireLight = refs.scene.getObjectByName('campfireLight') as THREE.PointLight | undefined
      if (campfireLight && campfireActiveRef.current)
        campfireLight.intensity = 4.5 + Math.sin(elapsed * 7.3) * 0.6 + Math.sin(elapsed * 13.7) * 0.3

      // Skip butterfly animation when hidden (low quality)
      const { effectiveQuality } = gs
      if (effectiveQuality === 'high') {
        updateButterflies(refs.butterflies, dt, elapsed)
      }

      if (!gs.walking) refs.player.group.rotation.z = Math.sin(elapsed * 1.2) * 0.014

      updateSkyDrift(refs.sky, elapsed)

      if (Math.round(elapsed * 60) % 3 === 0) {
        setFps(dt > 0 ? Math.round(1 / dt) : 60)
        const W = refs.renderer.domElement.clientWidth
        const H = refs.renderer.domElement.clientHeight
        setHintLabels(
          HINT_CONFIGS.map((cfg) => {
            const wp = cfg.worldPos.clone().project(refs.camera)
            const sx = (wp.x * 0.5 + 0.5) * W
            const sy = (-wp.y * 0.5 + 0.5) * H
            const dist = Math.hypot(gs.player.x - cfg.worldPos.x, gs.player.z - cfg.worldPos.z)
            const isGoldLabel = cfg.id === 'gold'
            const cracked = gs.rocks[2]!.cracked
            const text = isGoldLabel && cracked ? '✨ Résumé — Click to view again' : cfg.text
            return { id: cfg.id, text, x: sx, y: sy, visible: wp.z < 1 && dist < 16 }
          }),
        )
      }

      refs.renderer.render(refs.scene, refs.camera)
    }, [sceneRefsRef]),
    gameStarted,
  )

  function handleToggleDayNight() {
    const refs = sceneRefsRef.current
    if (!refs) return
    const newIsDay = !isDay
    setIsDay(newIsDay)
    if (newIsDay) campfireActiveRef.current = false  // stop flicker immediately when going to day
    applyDayNight(refs.scene, refs.sky, refs.lights, newIsDay, () => {
      if (!newIsDay) campfireActiveRef.current = true  // start flicker after night transition completes
    })
  }

  const handleMusicVolumeChange = useCallback((v: number) => {
    setMusicVolumeState(v)
    setMusicVolume(v)
  }, [])

  const handleSfxVolumeChange = useCallback((v: number) => {
    setSfxVolumeState(v)
    setSfxVolume(v)
  }, [])

  const handleCycleQuality = useCallback(() => {
    const { qualityMode } = getState()
    const refs = sceneRefsRef.current
    const store = useGameStore.getState()
    const next: 'high' | 'low' = qualityMode === 'high' ? 'low' : 'high'
    store.setQualityMode(next)
    store.setEffectiveQuality(next)
    if (typeof window !== 'undefined') localStorage.setItem('iforgetech-quality-mode', next)
    const qualityRefs = { renderer: refs!.renderer, scene: refs!.scene, grassMeshes: refs!.grassMeshes, treeGroups: refs!.treeGroups, flowerGroups: refs!.flowerGroups, butterflies: refs!.butterflies, rabbitGroups: refs!.rabbitGroups }
    if (refs) applyQuality(qualityRefs, next)
  }, [sceneRefsRef])

  if (!gameStarted) {
    return (
      <div className={styles.intro}>
        <div className={styles.introEmoji}>⚒️</div>
        <h1 className={styles.introTitle}>iForgeTech</h1>
        <p className={styles.introSub}>Software Engineer &amp; AI Automation</p>
        <div className={styles.introDivider} />
        <p className={styles.introDesc}>
          We forge intelligent systems — from full-stack apps to AI-driven automation.<br />
          Explore the island. Uncover the work. Discover what's possible.
        </p>
        <button className={styles.introBtn} onClick={() => { setGameStarted(true); setMusicVolume(0.7); setSfxVolume(0.8) }}>
          ⚒ Explore My Work
        </button>
      </div>
    )
  }

  const ModalContent = activeModal
    ? { experience: ExperienceModal, projects: ProjectsModal, resume: ResumeModal, contact: ContactModal }[activeModal]
    : null

  return (
    <div ref={containerRef} className={styles.gameRoot}>
      <div ref={canvasContainerRef} className={styles.canvasContainer} />
      <Hud
        isDay={isDay}
        onToggleDayNight={handleToggleDayNight}
        hintLabels={hintLabels}
        isMobile={IS_MOBILE}
        fps={fps}
        qualityMode={qualityMode}
        onCycleQuality={handleCycleQuality}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        onMusicVolumeChange={handleMusicVolumeChange}
        onSfxVolumeChange={handleSfxVolumeChange}
      />
      <Modal>
        {ModalContent && <ModalContent />}
      </Modal>
    </div>
  )
}
