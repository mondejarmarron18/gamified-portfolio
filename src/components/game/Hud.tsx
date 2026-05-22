import styles from './Hud.module.css'
import { useGameStore } from '@/lib/state'

interface HintLabel {
  id: string
  text: string
  x: number
  y: number
  visible: boolean
}

interface Props {
  isDay: boolean
  onToggleDayNight: () => void
  hintLabels: HintLabel[]
  isMobile: boolean
  fps: number
  qualityMode: 'auto' | 'high' | 'low'
  effectiveQuality: 'high' | 'low'
  onCycleQuality: () => void
  audioEnabled: boolean
  onToggleAudio: () => void
}

export function Hud({ isDay, onToggleDayNight, hintLabels, isMobile, fps, qualityMode, effectiveQuality, onCycleQuality, audioEnabled, onToggleAudio }: Props) {
  const stamina = useGameStore((s) => s.stamina)
  const discovered = useGameStore((s) => s.discovered)

  const qualityLabel =
    qualityMode === 'high' ? '✨ Quality' :
    qualityMode === 'low'  ? '🔋 Performance' :
    '⚙ Auto'

  return (
    <div className={styles.hud}>
      <div className={styles.topLeft}>
        <div className={styles.name}>⚒ iForgeTech</div>
        <div className={styles.tagline}>Software Engineer · AI Automation</div>
        <div className={styles.staminaRow}>
          <span className={styles.staminaLabel}>Pickaxe</span>
          <div className={styles.staminaBar}>
            <div className={styles.staminaFill} style={{ width: `${stamina}%` }} />
          </div>
        </div>
      </div>

      <div className={`${styles.fpsCounter} ${fps >= 50 ? styles.fpsGood : fps >= 30 ? styles.fpsMid : styles.fpsBad}`}>
        {fps} <span className={styles.fpsLabel}>fps</span>
      </div>

      <div className={styles.topRight}>
        <div className={styles.discLabel}>Discoveries</div>
        <div className={styles.discCount}>{discovered} / 3</div>
      </div>

      <div className={styles.centerBtns}>
        <button className={styles.dayNightBtn} onClick={onToggleDayNight}>
          {isDay ? '🌙 Evening' : '🌅 Morning'}
        </button>
        <button className={styles.qualityBtn} onClick={onCycleQuality}>
          {qualityLabel}
          {qualityMode === 'auto' && (
            <span className={styles.qualityAuto}>
              {effectiveQuality === 'high' ? '▲ high' : '▼ low'}
            </span>
          )}
        </button>
        <button className={styles.audioBtn} onClick={onToggleAudio} title={audioEnabled ? 'Mute audio' : 'Unmute audio'}>
          {audioEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {!isMobile ? (
        <div className={styles.controls}>
          <kbd className={styles.key}>Right-click</kbd> Walk
          <span className={styles.sep}>·</span>
          <kbd className={styles.key}>Left-click</kbd> Mine / Interact
          <span className={styles.sep}>·</span>
          <kbd className={styles.key}>Scroll</kbd> Zoom
        </div>
      ) : (
        <div className={styles.touchHint}>👆 Tap = Walk / Interact &nbsp;·&nbsp; 👌 Pinch = Zoom</div>
      )}

      {hintLabels.map((h) =>
        h.visible ? (
          <div
            key={h.id}
            className={styles.hint3d}
            style={{ left: h.x, top: h.y }}
          >
            {h.text}
          </div>
        ) : null,
      )}
    </div>
  )
}
