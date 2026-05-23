// src/lib/state.ts
import { create } from 'zustand'
import type { GameState, Vec2 } from '@/types/game'

interface GameActions {
  setPlayer: (pos: Vec2) => void
  setTarget: (pos: Vec2 | null) => void
  setWalking: (walking: boolean) => void
  hitRock: (index: 0 | 1 | 2) => void
  crackRock: (index: 0 | 1 | 2) => void
  incrementDiscovered: () => void
  setStamina: (stamina: number) => void
  setSwinging: (swinging: boolean) => void
  setRechargingStamina: (v: boolean) => void
  setCamDist: (dist: number) => void
  setCamPhi: (phi: number) => void
  setIntroZoom: (v: boolean) => void
  setIntroZoomDist: (dist: number) => void
  openChest: () => void
  setQualityMode: (mode: 'high' | 'low') => void
  setEffectiveQuality: (q: 'high' | 'low') => void
}

const initialState: GameState = {
  player: { x: 0, z: 0 },
  target: null,
  walking: false,
  rocks: [
    { id: 0, hits: 0, maxHits: 3, cracked: false, pos: { x: -5, z: -7 }, isGold: false },
    { id: 1, hits: 0, maxHits: 3, cracked: false, pos: { x: 5, z: -7 }, isGold: false },
    { id: 2, hits: 0, maxHits: 3, cracked: false, pos: { x: 0, z: -11 }, isGold: true },
  ],
  discovered: 0,
  stamina: 100,
  swinging: false,
  rechargingStamina: false,
  camPhi: 0.55,
  camDist: 9,
  introZoom: true,
  introZoomDist: 38,
  introZoomTarget: 9,
  signPos: { x: -8, z: 3 },
  chestPos: { x: 8, z: 3 },
  scrollPos: { x: 0, z: 6 },
  chestOpen: false,
  qualityMode: 'high',
  effectiveQuality: 'high',
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setPlayer: (pos) => set({ player: pos }),
  setTarget: (pos) => set({ target: pos }),
  setWalking: (walking) => set({ walking }),

  hitRock: (index) =>
    set((s) => {
      const rocks = [...s.rocks] as GameState['rocks']
      const rock = rocks[index]
      if (rock !== undefined) rocks[index] = { ...rock, hits: rock.hits + 1 }
      return { rocks }
    }),

  crackRock: (index) =>
    set((s) => {
      const rocks = [...s.rocks] as GameState['rocks']
      const rock = rocks[index]
      if (rock !== undefined) rocks[index] = { ...rock, cracked: true }
      return { rocks }
    }),

  incrementDiscovered: () => set((s) => ({ discovered: s.discovered + 1 })),
  setStamina: (stamina) => set({ stamina }),
  setSwinging: (swinging) => set({ swinging }),
  setRechargingStamina: (v) => set({ rechargingStamina: v }),
  setCamDist: (camDist) => set({ camDist }),
  setCamPhi: (camPhi) => set({ camPhi }),
  setIntroZoom: (introZoom) => set({ introZoom }),
  setIntroZoomDist: (introZoomDist) => set({ introZoomDist }),
  openChest: () => set({ chestOpen: true }),
  setQualityMode: (qualityMode) => set({ qualityMode }),
  setEffectiveQuality: (effectiveQuality) => set({ effectiveQuality }),
}))

// Snapshot accessor for use outside React (game loop, raycaster)
export const getState = () => useGameStore.getState()
