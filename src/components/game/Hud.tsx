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
  qualityMode: 'high' | 'low'
  onCycleQuality: () => void
  musicVolume: number
  sfxVolume: number
  onMusicVolumeChange: (v: number) => void
  onSfxVolumeChange: (v: number) => void
}

export function Hud({ isDay, onToggleDayNight, hintLabels, isMobile, fps, qualityMode, onCycleQuality, musicVolume, sfxVolume, onMusicVolumeChange, onSfxVolumeChange }: Props) {
  const stamina = useGameStore((s) => s.stamina)
  const discovered = useGameStore((s) => s.discovered)

  const qualityLabel = qualityMode === 'high' ? '✨ Quality' : '🔋 Performance'

  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e: PointerEvent) => {
      const panel = document.querySelector('[data-settings-panel]')
      const gear  = document.querySelector('[data-gear-btn]')
      if (!panel?.contains(e.target as Node) && !gear?.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
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
        aria-expanded={settingsOpen}
        aria-controls="hud-settings-panel"
        aria-label="Settings"
      >
        ⚙
      </button>

      {/* Settings panel — slides up from gear */}
      {settingsOpen && (
        <div data-settings-panel id="hud-settings-panel" className={styles.settingsPanel}>
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
            </button>
          </div>

          <div className={styles.settingsPanelRow}>
            <span className={styles.settingsPanelLabel}>🎵 Music</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
              className={styles.volSlider}
              aria-label="Music volume"
              style={{ '--vol': `${Math.round(musicVolume * 100)}%` } as React.CSSProperties}
            />
          </div>

          <div className={styles.settingsPanelRow}>
            <span className={styles.settingsPanelLabel}>⚡ Effects</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={sfxVolume}
              onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
              className={styles.volSlider}
              aria-label="Effects volume"
              style={{ '--vol': `${Math.round(sfxVolume * 100)}%` } as React.CSSProperties}
            />
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
