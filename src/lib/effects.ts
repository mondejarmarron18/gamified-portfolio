// src/lib/effects.ts
import * as THREE from 'three'

export function spawnSparks(
  worldPos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  gold = false,
): void {
  const rect = renderer.domElement.getBoundingClientRect()
  const v = worldPos.clone().project(camera)
  const sx = (v.x * 0.5 + 0.5) * rect.width + rect.left
  const sy = (-v.y * 0.5 + 0.5) * rect.height + rect.top

  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div')
    s.className = 'spark'
    const a = Math.random() * Math.PI * 2
    const d = 40 + Math.random() * 75
    const hue = gold
      ? `hsl(${40 + Math.random() * 20},100%,${60 + Math.random() * 25}%)`
      : `hsl(${15 + Math.random() * 35},100%,${55 + Math.random() * 30}%)`
    s.style.cssText = `
      position:fixed;
      width:4px;height:4px;border-radius:50%;pointer-events:none;
      left:${sx}px;top:${sy}px;
      --tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;
      background:${hue};
      animation:sf .9s ease-out forwards;
    `
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 950)
  }

  // Flash overlay on canvas container
  const container = renderer.domElement.parentElement
  if (container) {
    const fl = document.createElement('div')
    fl.className = 'mflash'
    fl.style.setProperty('--fx', (v.x * 0.5 + 0.5) * 100 + '%')
    fl.style.setProperty('--fy', (-v.y * 0.5 + 0.5) * 100 + '%')
    container.appendChild(fl)
    setTimeout(() => fl.remove(), 340)
  }
}

export function showCrackLabel(container: HTMLElement, text: string): void {
  const l = document.createElement('div')
  l.className = 'clbl'
  l.textContent = text
  l.style.left = 22 + Math.random() * 50 + '%'
  l.style.top = 14 + Math.random() * 32 + '%'
  container.appendChild(l)
  setTimeout(() => l.remove(), 900)
}

export function showWalkMarker(clientX: number, clientY: number): void {
  const el = document.createElement('div')
  el.className = 'wmr'
  el.style.left = clientX + 'px'
  el.style.top = clientY + 'px'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 700)
}
