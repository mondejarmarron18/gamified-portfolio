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
  const light = new THREE.PointLight(0xff7722, 0, 22)  // intensity 0 until night
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
  sCtx.fillText('EXPERIENCE', 128, 52)
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

  const pCan = document.createElement('canvas')
  pCan.width = 512
  pCan.height = 512
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pCtx = pCan.getContext('2d')!

  const grad = pCtx.createRadialGradient(256, 256, 60, 256, 256, 280)
  grad.addColorStop(0, '#e8d080')
  grad.addColorStop(0.5, '#d8b86a')
  grad.addColorStop(1, '#a87c38')
  pCtx.fillStyle = grad
  pCtx.fillRect(0, 0, 512, 512)

  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      const v = (Math.random() - 0.5) * 22
      pCtx.fillStyle = `rgba(${v > 0 ? '255,220,140' : '80,40,0'},${Math.abs(v) / 255})`
      pCtx.fillRect(x, y, 1, 1)
    }

  const edgeG = pCtx.createRadialGradient(256, 256, 100, 256, 256, 285)
  edgeG.addColorStop(0, 'rgba(0,0,0,0)')
  edgeG.addColorStop(0.7, 'rgba(30,10,0,.15)')
  edgeG.addColorStop(1, 'rgba(60,20,0,.6)')
  pCtx.fillStyle = edgeG
  pCtx.fillRect(0, 0, 512, 512)

  pCtx.strokeStyle = 'rgba(80,45,8,.5)'
  pCtx.lineWidth = 2.5
  pCtx.strokeRect(22, 22, 468, 468)
  pCtx.font = 'bold 32px Georgia,serif'
  pCtx.fillStyle = 'rgba(50,22,4,.85)'
  pCtx.textAlign = 'center'
  pCtx.textBaseline = 'middle'
  pCtx.fillText('📜 CONTACT', 256, 68)
  pCtx.font = 'italic 18px Georgia,serif'
  pCtx.fillStyle = 'rgba(60,30,5,.7)'
  pCtx.fillText('Left-click to open', 256, 115)
  pCtx.font = '14px Georgia,serif'
  pCtx.fillStyle = 'rgba(55,25,5,.35)'
  ;['hello@iforgetech.com', 'github.com/iforgetech', 'Software Engineer · AI Automation'].forEach(
    (t, i) => pCtx.fillText(t, 256, 148 + i * 24),
  )

  const parchTex = new THREE.CanvasTexture(pCan)
  const faceMat = new THREE.MeshStandardMaterial({ map: parchTex, roughness: 0.9, metalness: 0.01 })
  const backMat = new THREE.MeshStandardMaterial({ color: 0xaa7e40, roughness: 0.95 })

  const paperGeo = new THREE.PlaneGeometry(1.4, 1.8, 10, 16)
  const ppPos = paperGeo.attributes['position'] as THREE.BufferAttribute
  for (let i = 0; i < ppPos.count; i++) {
    const x = ppPos.getX(i)
    const y = ppPos.getY(i)
    const tNorm = (y + 0.9) / 1.8
    const curl = Math.sin(tNorm * Math.PI) * 0.12
    const sideCurl = Math.sin((x / 0.7) * Math.PI * 0.5) * 0.06 * (1 - tNorm)
    ppPos.setZ(i, curl + sideCurl)
  }
  paperGeo.computeVertexNormals()

  const paper = new THREE.Mesh(paperGeo, faceMat)
  paper.rotation.x = 0.12
  paper.position.set(0, 0.92, 0.05)
  paper.castShadow = true
  scrollGroup.add(paper)

  const paperBack = new THREE.Mesh(paperGeo.clone(), backMat)
  paperBack.rotation.x = 0.12
  paperBack.position.set(0, 0.92, 0.03)
  paperBack.scale.z = -1
  scrollGroup.add(paperBack)

  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xb89050, roughness: 0.9 })
  ;[[-0.71, 0], [0.71, 0]].forEach(([ex]) => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.015, 1.82, 0.14), edgeMat)
    edge.position.set(ex!, 0.92, 0.1)
    edge.rotation.x = 0.12
    scrollGroup.add(edge)
  })
  const bottomEdge = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.015, 0.14), edgeMat)
  bottomEdge.position.set(0, 0.015, 0.1)
  scrollGroup.add(bottomEdge)

  const propMat = new THREE.MeshStandardMaterial({ color: 0x5a4838, roughness: 0.95 })
  const prop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.16), propMat)
  prop.position.set(0, 0.06, 0.04)
  prop.rotation.x = 0.12
  scrollGroup.add(prop)
  ;[-0.4, 0.4].forEach((sx) => {
    const stn = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), propMat)
    stn.position.set(sx, 0.08, 0.08)
    scrollGroup.add(stn)
  })

  const sealMat = new THREE.MeshStandardMaterial({ color: 0x881010, roughness: 0.65, metalness: 0.1 })
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.025, 16), sealMat)
  seal.position.set(0, 0.78, 0.22)
  seal.rotation.x = Math.PI / 2 + 0.12
  scrollGroup.add(seal)

  const gl = new THREE.PointLight(0xffcc44, 0.6, 3.5)
  gl.position.set(0, 1.0, 0.3)
  scrollGroup.add(gl)
  scrollGroup.userData['type'] = 'scroll'
  scrollGroup.userData['glow'] = gl

  scrollGroup.position.set(scrollPos.x, 0, scrollPos.z)
  scrollGroup.rotation.y = Math.PI * 0.25
  scene.add(scrollGroup)
  return scrollGroup
}
