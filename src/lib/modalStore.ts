// src/lib/modalStore.ts
import { create } from 'zustand'

export type ModalType = 'experience' | 'projects' | 'resume' | 'contact'

interface ModalStore {
  activeModal: ModalType | null
  openModal: (type: ModalType) => void
  closeModal: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  activeModal: null,
  openModal: (type) => set({ activeModal: type }),
  closeModal: () => set({ activeModal: null }),
}))

// Accessor for use outside React (input handler, game loop)
export const getModalStore = () => useModalStore.getState()
