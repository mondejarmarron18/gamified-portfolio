import type * as THREE from 'three'

export interface Vec2 {
  x: number
  z: number
}

export interface RockData {
  id: number
  hits: number
  maxHits: number
  cracked: boolean
  pos: Vec2
  isGold: boolean
}

export interface GameState {
  player: Vec2
  target: Vec2 | null
  walking: boolean
  rocks: [RockData, RockData, RockData]
  discovered: number
  stamina: number
  swinging: boolean
  rechargingStamina: boolean
  camPhi: number
  camDist: number
  introZoom: boolean
  introZoomDist: number
  introZoomTarget: number
  signPos: Vec2
  chestPos: Vec2
  scrollPos: Vec2
  chestOpen: boolean
  qualityMode: 'high' | 'low'
  effectiveQuality: 'high' | 'low'
}

// Discriminated union returned by castRay()
export type HitResult =
  | { type: 'rock'; rockIndex: number }
  | { type: 'crackedGold' }
  | { type: 'sign' }
  | { type: 'chest' }
  | { type: 'scroll' }
  | { type: 'rabbit'; rabbitIndex: number }
  | { type: 'ground'; point: THREE.Vector3 }
