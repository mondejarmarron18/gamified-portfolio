// src/lib/scene/objects.ts
import * as THREE from 'three'
import type { SceneTextures } from './textures'
import type { Vec2 } from '@/types/game'

export interface ObjectHandles {
  signGroup: THREE.Group
  chestGroup: THREE.Group
  chestLid: THREE.Group
  chestGlow: THREE.PointLight
  scrollGroup: THREE.Group
  campfireLight: THREE.PointLight
}

export function buildCampfire(scene: THREE.Scene): THREE.PointLight {
  const g = new THREE.Group()

  const logMat = new THREE.MeshStandardMaterial({ color: 0x4a2a0a, roughness: 0.97 })
  const emberMat = new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 1, emissive: new THREE.Color(0xff2200), emissiveIntensity: 1.2 })

  // Log pile — two crossed cylinders
  ;[-1, 1].forEach((s) => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 7), logMat)
    log.rotation.z = s * 0.55
    log.rotation.y = s * 0.4
    log.position.y = 0.12
    log.castShadow = true
    g.add(log)
  })

  // Ember bed
  const embers = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.1, 8), emberMat)
  embers.position.y = 0.05
  g.add(embers)

  // Flame layers — three stacked cones, slightly offset for organic look
  const flameDefs: [number, number, number, number][] = [
    [0.22, 0.55, 7, 0xff6600],
    [0.15, 0.70, 6, 0xff3300],
    [0.08, 0.45, 5, 0xffcc00],
  ]
  flameDefs.forEach(([r, h, seg, color], i) => {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, seg),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
    )
    flame.position.set((i % 2 === 0 ? 0.04 : -0.04) * i, h / 2 + 0.12, (i === 1 ? 0.03 : 0))
    flame.name = `flame_${i}`
    g.add(flame)
  })

  // Warm ground glow disc
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.18 }),
  )
  glow.rotation.x = -Math.PI / 2
  glow.position.y = 0.02
  g.add(glow)

  g.position.set(0, 0, 0)
  g.name = 'campfireGroup'
  g.visible = false  // hidden during day; applyDayNight reveals it at night
  scene.add(g)

  // Point light for the campfire glow
  const light = new THREE.PointLight(0xff6600, 0, 35)  // intensity 0 until night; distance 35 for wide glow
  light.position.set(0, 1.2, 0)
  light.castShadow = false
  light.name = 'campfireLight'
  scene.add(light)

  return light
}

export function buildSignBoard(scene: THREE.Scene, tex: SceneTextures, signPos: Vec2): THREE.Group {
  const signGroup = new THREE.Group()
  const woodMat = new THREE.MeshStandardMaterial({ map: tex.wood, color: 0x6a3c18, roughness: 0.92 })
  const ironMat = new THREE.MeshStandardMaterial({ map: tex.metal, color: 0x707880, roughness: 0.45, metalness: 0.85 })

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 8), woodMat)
  post.position.y = 1.1
  post.castShadow = true
  signGroup.add(post)

  const signCanvas = document.createElement('canvas')
  signCanvas.width = 256
  signCanvas.height = 128
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sCtx = signCanvas.getContext('2d')!
  sCtx.fillStyle = '#6a3c18'
  sCtx.fillRect(0, 0, 256, 128)
  sCtx.strokeStyle = 'rgba(40,20,8,.3)'
  sCtx.lineWidth = 2
  for (let i = 0; i < 6; i++) {
    sCtx.beginPath()
    sCtx.moveTo(0, i * 22 + 8)
    sCtx.lineTo(256, i * 22 + 8)
    sCtx.stroke()
  }
  sCtx.fillStyle = '#f8d87a'
  sCtx.textAlign = 'center'
  sCtx.textBaseline = 'middle'
  sCtx.font = 'bold 30px serif'
  sCtx.fillText('QUEST LOG', 128, 52)
  sCtx.font = '18px serif'
  sCtx.fillStyle = '#e0b84a'
  sCtx.fillText('[ Click to Read ]', 128, 88)

  const signTex = new THREE.CanvasTexture(signCanvas)
  const boardMats: THREE.Material[] = [
    woodMat, woodMat, woodMat, woodMat,
    new THREE.MeshStandardMaterial({ map: signTex }),
    woodMat,
  ]
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.1), boardMats)
  board.position.y = 2.1
  board.castShadow = true
  signGroup.add(board)

  ;[[-0.6, 2.4], [0.6, 2.4], [-0.6, 1.8], [0.6, 1.8]].forEach(([x, y]) => {
    const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 6), ironMat)
    nail.rotation.z = Math.PI / 2
    nail.position.set(x!, y!, 0.07)
    signGroup.add(nail)
  })

  const brac = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.08), ironMat)
  brac.position.set(0, 1.65, 0)
  signGroup.add(brac)

  signGroup.position.set(signPos.x, 0, signPos.z)
  signGroup.rotation.y = 1.9296
  signGroup.userData['type'] = 'sign'
  scene.add(signGroup)
  return signGroup
}

function buildPotion(color: number, x: number, z: number, height: number): THREE.Group {
  const g = new THREE.Group()
  const glassMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
  })
  const capMat = new THREE.MeshStandardMaterial({ color: 0xb8861a, roughness: 0.3, metalness: 0.92 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, height, 10), glassMat)
  body.position.y = height * 0.5
  g.add(body)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, 0.06, 8), glassMat)
  neck.position.y = height + 0.03
  g.add(neck)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), capMat)
  cap.position.y = height + 0.08
  g.add(cap)
  const liq = new THREE.PointLight(color, 0.4, 0.5)
  liq.position.y = height * 0.4
  g.add(liq)
  g.position.set(x, 0.73, z)
  return g
}

export function buildChest(
  scene: THREE.Scene,
  chestPos: Vec2,
): { chestGroup: THREE.Group; chestLid: THREE.Group; chestGlow: THREE.PointLight } {
  const chestGroup = new THREE.Group()
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd84a, roughness: 0.18, metalness: 0.92 })
  goldMat.emissive.set(0x3a2800)
  goldMat.emissiveIntensity = 0.18
  const goldDark = new THREE.MeshStandardMaterial({ color: 0xe0a830, roughness: 0.3, metalness: 0.9 })
  goldDark.emissive.set(0x221400)
  goldDark.emissiveIntensity = 0.12
  const goldAccent = new THREE.MeshStandardMaterial({ color: 0xffe878, roughness: 0.1, metalness: 0.95 })
  goldAccent.emissive.set(0x504010)
  goldAccent.emissiveIntensity = 0.25
  const velvetMat = new THREE.MeshStandardMaterial({ color: 0x5a0a18, roughness: 0.98 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), goldMat)
  base.position.y = 0.35
  base.castShadow = true
  base.receiveShadow = true
  chestGroup.add(base)

  ;[[-0.36, 0.35, 0.42, 0.22, 0.55, 0.04], [0, 0.35, 0.42, 0.22, 0.55, 0.04], [0.36, 0.35, 0.42, 0.22, 0.55, 0.04]].forEach(
    ([x, y, z, w, h, d]) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(w!, h!, d!), goldDark)
      panel.position.set(x!, y!, z!)
      chestGroup.add(panel)
    },
  )

  ;[{ y: 0.08, h: 0.04 }, { y: 0.35, h: 0.03 }, { y: 0.63, h: 0.04 }].forEach(({ y, h }) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.22, h, 0.82), goldAccent)
    band.position.y = y
    chestGroup.add(band)
  })

  ;[[-0.58, 0.35, 0.38], [0.58, 0.35, 0.38], [-0.58, 0.35, -0.38], [0.58, 0.35, -0.38]].forEach(([x, y, z]) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.06), goldAccent)
    pillar.position.set(x!, y!, z!)
    chestGroup.add(pillar)
  })

  // Lid
  const chestLid = new THREE.Group()
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.8), goldMat)
  lid.position.set(0, 0.14, 0)
  lid.castShadow = true
  chestLid.add(lid)

  const dome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 1.18, 20, 1, false, 0, Math.PI),
    goldDark,
  )
  dome.rotation.z = Math.PI / 2
  dome.position.set(0, 0.22, 0)
  dome.scale.set(1, 0.28, 0.68)
  chestLid.add(dome)

  const lidBand = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.04, 0.82), goldAccent)
  lidBand.position.set(0, 0.27, 0)
  chestLid.add(lidBand)

  ;[[-0.58, 0.14, 0.38], [0.58, 0.14, 0.38], [-0.58, 0.14, -0.38], [0.58, 0.14, -0.38]].forEach(([x, y, z]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), goldAccent)
    c.position.set(x!, y!, z!)
    chestLid.add(c)
  })

  const lockBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.06), goldAccent)
  lockBase.position.set(0, 0.1, 0.44)
  chestLid.add(lockBase)
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.08), goldDark)
  lockBody.position.set(0, 0.1, 0.48)
  chestLid.add(lockBody)
  const kh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x100808, roughness: 0.5 }),
  )
  kh.rotation.x = Math.PI / 2
  kh.position.set(0, 0.11, 0.52)
  chestLid.add(kh)

  ;[
    [-0.56, 0.26, 0.36], [0.56, 0.26, 0.36], [-0.56, 0.02, 0.36], [0.56, 0.02, 0.36],
    [-0.56, 0.26, -0.36], [0.56, 0.26, -0.36], [-0.56, 0.02, -0.36], [0.56, 0.02, -0.36],
  ].forEach(([x, y, z]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), goldAccent)
    b.position.set(x!, y!, z!)
    chestLid.add(b)
  })

  chestLid.position.set(0, 0.7, -0.4)
  chestGroup.add(chestLid)

  // Base corner spheres
  ;[
    [-0.56, 0.64, 0.36], [0.56, 0.64, 0.36], [-0.56, 0.06, 0.36], [0.56, 0.06, 0.36],
    [-0.56, 0.64, -0.36], [0.56, 0.64, -0.36], [-0.56, 0.06, -0.36], [0.56, 0.06, -0.36],
  ].forEach(([x, y, z]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), goldAccent)
    b.position.set(x!, y!, z!)
    chestGroup.add(b)
  })

  const interior = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.03, 0.68), velvetMat)
  interior.position.set(0, 0.72, -0.04)
  chestGroup.add(interior)

  // Potions
  ;[
    { color: 0x44aaff, x: -0.32, z: -0.05, h: 0.18 },
    { color: 0xff3366, x: 0, z: -0.05, h: 0.22 },
    { color: 0x44ff88, x: 0.32, z: -0.05, h: 0.16 },
    { color: 0xaa44ff, x: -0.16, z: 0.12, h: 0.2 },
    { color: 0xffaa00, x: 0.16, z: 0.12, h: 0.17 },
  ].forEach((p) => chestGroup.add(buildPotion(p.color, p.x, p.z, p.h)))

  const chestGlow = new THREE.PointLight(0xffcc44, 0, 5)
  chestGlow.position.set(0, 1.1, 0)
  chestGroup.add(chestGlow)

  const ambientGold = new THREE.PointLight(0xffe060, 1.2, 6)
  ambientGold.position.set(0, 1.5, 0)
  chestGroup.add(ambientGold)

  chestGroup.position.set(chestPos.x, 0, chestPos.z)
  chestGroup.rotation.y = -1.9296
  chestGroup.userData['type'] = 'chest'
  scene.add(chestGroup)

  return { chestGroup, chestLid, chestGlow }
}

export function buildScroll(scene: THREE.Scene, scrollPos: Vec2): THREE.Group {
  const scrollGroup = new THREE.Group()

  const woodMat  = new THREE.MeshStandardMaterial({ color: 0x5a2e0a, roughness: 0.88 })
  const ivoryMat = new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 0.75 })
  const sealMat  = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.55, metalness: 0.1 })
  const sealTopMat = new THREE.MeshStandardMaterial({ color: 0x660000, roughness: 0.45 })
  const ribbonMat  = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 })
  const backMat    = new THREE.MeshStandardMaterial({ color: 0xaa7e40, roughness: 0.95, side: THREE.BackSide })

  // ── Roll body ─────────────────────────────────────────────────────────────
  // Parchment texture wrapping the cylindrical roll
  const rollCan = document.createElement('canvas')
  rollCan.width = 256; rollCan.height = 64
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rCtx = rollCan.getContext('2d')!
  const rGrad = rCtx.createLinearGradient(0, 0, 0, 64)
  rGrad.addColorStop(0, '#f0d890'); rGrad.addColorStop(0.5, '#d8b860'); rGrad.addColorStop(1, '#c0a040')
  rCtx.fillStyle = rGrad; rCtx.fillRect(0, 0, 256, 64)
  rCtx.strokeStyle = 'rgba(80,40,0,.15)'; rCtx.lineWidth = 1.2
  for (let i = 0; i < 5; i++) { rCtx.beginPath(); rCtx.moveTo(0, i * 14 + 5); rCtx.lineTo(256, i * 14 + 5); rCtx.stroke() }
  const rollTex = new THREE.CanvasTexture(rollCan)
  rollTex.wrapS = THREE.RepeatWrapping; rollTex.repeat.set(5, 1)
  const rollMat = new THREE.MeshStandardMaterial({ map: rollTex, roughness: 0.88, metalness: 0.01 })

  // The roll cylinder lying on its side (axis along X)
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.3, 16), rollMat)
  roll.rotation.z = Math.PI / 2
  roll.position.set(0, 0.14, 0)
  roll.castShadow = true
  scrollGroup.add(roll)

  // Wooden rod through the entire roll
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8), woodMat)
  rod.rotation.z = Math.PI / 2
  rod.position.set(0, 0.14, 0)
  rod.castShadow = true
  scrollGroup.add(rod)

  // Ivory end caps + round finial knobs at each tip
  ;[-1, 1].forEach((side) => {
    const capX = side * 0.69
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 12), ivoryMat)
    cap.rotation.z = Math.PI / 2
    cap.position.set(capX, 0.14, 0)
    scrollGroup.add(cap)

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), ivoryMat)
    knob.scale.set(1, 1, 0.85)
    knob.position.set(capX + side * 0.075, 0.14, 0)
    scrollGroup.add(knob)
  })

  // ── Flat unrolled parchment section ──────────────────────────────────────
  // Canvas with aged parchment + text visible from above
  const pCan = document.createElement('canvas')
  pCan.width = 512; pCan.height = 512
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pCtx = pCan.getContext('2d')!

  const pGrad = pCtx.createLinearGradient(0, 0, 512, 512)
  pGrad.addColorStop(0, '#f4e09a'); pGrad.addColorStop(0.4, '#e8cc72')
  pGrad.addColorStop(0.8, '#d4b458'); pGrad.addColorStop(1, '#c0a040')
  pCtx.fillStyle = pGrad; pCtx.fillRect(0, 0, 512, 512)

  // Grain texture
  for (let py = 0; py < 512; py += 2)
    for (let px = 0; px < 512; px += 2) {
      const v = (Math.random() - 0.5) * 20
      pCtx.fillStyle = `rgba(${v > 0 ? '255,225,145' : '60,28,0'},${Math.abs(v) / 255})`
      pCtx.fillRect(px, py, 2, 2)
    }

  // Edge aging gradient
  const eGrad = pCtx.createRadialGradient(256, 256, 80, 256, 256, 290)
  eGrad.addColorStop(0, 'rgba(0,0,0,0)'); eGrad.addColorStop(0.65, 'rgba(30,12,0,.12)')
  eGrad.addColorStop(1, 'rgba(70,25,0,.55)')
  pCtx.fillStyle = eGrad; pCtx.fillRect(0, 0, 512, 512)

  // Decorative double border
  pCtx.strokeStyle = 'rgba(80,40,6,.6)'; pCtx.lineWidth = 5
  pCtx.strokeRect(22, 22, 468, 468)
  pCtx.lineWidth = 1.5; pCtx.strokeStyle = 'rgba(80,40,6,.3)'
  pCtx.strokeRect(34, 34, 444, 444)

  // Small corner ornaments
  ;[[22,22],[490,22],[22,490],[490,490]].forEach(([cx, cy]) => {
    pCtx.beginPath(); pCtx.arc(cx!, cy!, 8, 0, Math.PI * 2)
    pCtx.fillStyle = 'rgba(80,40,6,.5)'; pCtx.fill()
  })

  // Title
  pCtx.fillStyle = 'rgba(45,18,2,.92)'
  pCtx.font = 'bold 38px Georgia,serif'
  pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle'
  pCtx.fillText('~ REACH OUT ~', 256, 90)

  // Divider line
  pCtx.strokeStyle = 'rgba(80,40,6,.35)'; pCtx.lineWidth = 2
  pCtx.beginPath(); pCtx.moveTo(80, 118); pCtx.lineTo(432, 118); pCtx.stroke()

  // Body text
  pCtx.font = 'italic 21px Georgia,serif'; pCtx.fillStyle = 'rgba(55,25,4,.78)'
  pCtx.fillText('Reach out to the herald', 256, 155)
  pCtx.fillText('and send a message', 256, 183)

  pCtx.strokeStyle = 'rgba(80,40,6,.25)'; pCtx.lineWidth = 1.5
  pCtx.beginPath(); pCtx.moveTo(80, 205); pCtx.lineTo(432, 205); pCtx.stroke()

  pCtx.font = '17px Georgia,serif'; pCtx.fillStyle = 'rgba(55,25,4,.55)'
  pCtx.fillText('[ Click to open ]', 256, 235)

  // Leave bottom half blank for wax seal placement
  const parchTex = new THREE.CanvasTexture(pCan)
  const faceMat = new THREE.MeshStandardMaterial({ map: parchTex, roughness: 0.88, metalness: 0.01 })

  // Partially-unrolled flat parchment — wider than before so more of the scroll is visible
  // Flat extends z: 0.14 → 1.64 (length 1.5, center at 0.89)
  const flatGeo = new THREE.PlaneGeometry(1.3, 1.5, 10, 16)
  const fPos = flatGeo.attributes['position'] as THREE.BufferAttribute
  for (let i = 0; i < fPos.count; i++) {
    const fx = fPos.getX(i)
    const fy = fPos.getY(i)
    // Curl at top edge (near roll) and gentle side waves
    const tNorm = (fy + 0.75) / 1.5
    const z = Math.sin(tNorm * Math.PI * 0.25) * 0.04 + Math.abs(fx / 0.65) * 0.02 * (1 - tNorm)
    fPos.setZ(i, z)
  }
  flatGeo.computeVertexNormals()

  const flat = new THREE.Mesh(flatGeo, faceMat)
  flat.rotation.x = -Math.PI / 2
  flat.position.set(0, 0.014, 0.89)
  flat.castShadow = true; flat.receiveShadow = true
  scrollGroup.add(flat)

  const flatBack = new THREE.Mesh(flatGeo.clone(), backMat)
  flatBack.rotation.x = -Math.PI / 2
  flatBack.position.set(0, 0.01, 0.89)
  scrollGroup.add(flatBack)

  // ── Wax seal — moved further along the parchment ──────────────────────────
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.032, 16), sealMat)
  seal.position.set(0, 0.032, 1.20)
  seal.castShadow = true
  scrollGroup.add(seal)

  const sealTop = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.038, 8), sealTopMat)
  sealTop.position.set(0, 0.05, 1.20)
  scrollGroup.add(sealTop)

  // Ribbon strips from roll to seal (longer to match new seal position)
  ;[-0.09, 0.09].forEach((xo) => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.009, 0.82), ribbonMat)
    rib.position.set(xo, 0.022, 0.64)
    scrollGroup.add(rib)
  })

  // ── Glow ──────────────────────────────────────────────────────────────────
  const gl = new THREE.PointLight(0xffcc44, 0.6, 3.5)
  gl.position.set(0, 0.6, 0.7)
  scrollGroup.add(gl)

  scrollGroup.userData['type'] = 'scroll'
  scrollGroup.userData['glow'] = gl
  scrollGroup.position.set(scrollPos.x, 0, scrollPos.z)
  scrollGroup.rotation.y = Math.PI * 0.25
  scene.add(scrollGroup)
  return scrollGroup
}
