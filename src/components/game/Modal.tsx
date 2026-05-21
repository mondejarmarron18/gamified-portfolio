import type { ReactNode } from 'react'
import { useModalStore } from '@/lib/modalStore'
import styles from './Modal.module.css'

interface Props {
  children: ReactNode
}

export function Modal({ children }: Props) {
  const { activeModal, closeModal } = useModalStore()
  if (!activeModal) return null

  return (
    <div className={styles.backdrop} onClick={closeModal}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={closeModal}>✕</button>
        {children}
      </div>
    </div>
  )
}
