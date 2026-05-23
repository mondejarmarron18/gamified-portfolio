import { useState, useEffect } from 'react'
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

  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e: MouseEvent) => {
      const panel = document.querySelector('[data-settings-panel]')
      const gear  = document.querySelector('[data-gear-btn]')
      if (!panel?.contains(e.target as Node) && !gear?.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [settingsOpen])

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

      {/* Gear settings button — bottom-left anchor */}
      <button
        data-gear-btn
        className={styles.gearBtn}
        onClick={() => setSettingsOpen((v) => !v)}
        title="Settings"
      >
        ⚙
      </button>

      {/* Settings panel — slides up from gear */}
      {settingsOpen && (
        <div data-settings-panel className={styles.settingsPanel}>
          <div className={styles.settingsPanelTitle}>⚙ Settings</div>

          <div className={styles.settingsPanelRow}>
            <span className={styles.settingsPanelLabel}>
              {isDay ? '🌙' : '🌅'} Time of Day
            </span>
            <button className={styles.settingsPillBtn} onClick={onToggleDayNight}>
              {isDay ? 'Evening' : 'Morning'}
            </button>
          </div>

          <div className={styles.settingsPanelRow}>
            <span className={styles.settingsPanelLabel}>✨ Quality</span>
            <button className={styles.settingsPillBtn} onClick={onCycleQuality}>
              {qualityLabel}
              {qualityMode === 'auto' && (
                <span className={styles.settingsPanelSub}>
                  {effectiveQuality === 'high' ? ' ▲' : ' ▼'}
                </span>
              )}
            </button>
          </div>

          <div className={styles.settingsPanelRow}>
            <span className={styles.settingsPanelLabel}>🔊 Music</span>
            <div
              className={`${styles.settingsToggle} ${audioEnabled ? styles.settingsToggleOn : ''}`}
              onClick={onToggleAudio}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggleAudio() } }}
              role="switch"
              aria-checked={audioEnabled}
              aria-label="Music"
              tabIndex={0}
            >
              <div className={styles.settingsToggleDot} />
            </div>
          </div>
        </div>
      )}

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
