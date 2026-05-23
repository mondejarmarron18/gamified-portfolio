// Background music via MP3 loop + synthesized SFX.
// AudioContext is created lazily on first user gesture.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null   // master bus (fixed at 0.8)
let musicGain: GainNode | null = null    // music bus — volume controlled by setMusicVolume
let sfxGain: GainNode | null = null      // sfx bus — volume controlled by setSfxVolume
let musicSource: AudioBufferSourceNode | null = null
let walkTimer: ReturnType<typeof setInterval> | null = null
let _musicVolume = 0.3
let _sfxVolume = 0.7
let _musicLoading: Promise<void> | null = null

// ── Internal helpers ─────────────────────────────────────────

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function getMaster(): GainNode | null {
  const c = getCtx()
  if (!c) return null
  if (!masterGain) {
    masterGain = c.createGain()
    masterGain.gain.value = 0.8
    masterGain.connect(c.destination)
  }
  return masterGain
}

function getMusicBus(): GainNode | null {
  const c = getCtx()
  const master = getMaster()
  if (!c || !master) return null
  if (!musicGain) {
    musicGain = c.createGain()
    musicGain.gain.value = _musicVolume
    musicGain.connect(master)
  }
  return musicGain
}

function getSfxBus(): GainNode | null {
  const c = getCtx()
  const master = getMaster()
  if (!c || !master) return null
  if (!sfxGain) {
    sfxGain = c.createGain()
    sfxGain.gain.value = _sfxVolume
    sfxGain.connect(master)
  }
  return sfxGain
}

// ── Music ────────────────────────────────────────────────────

async function startMusic(): Promise<void> {
  if (musicSource || _musicLoading) return _musicLoading ?? undefined
  _musicLoading = _doStartMusic().finally(() => { _musicLoading = null })
  return _musicLoading
}

async function _doStartMusic(): Promise<void> {
  const c = getCtx()
  const bus = getMusicBus()
  if (!c || !bus) return
  try {
    const res = await fetch('/assets/audios/background.mp3')
    if (!res.ok) throw new Error(`[audio] HTTP ${res.status} fetching background.mp3`)
    const buf = await res.arrayBuffer()
    const decoded = await c.decodeAudioData(buf)
    if (musicSource) return // guard against race
    const src = c.createBufferSource()
    src.buffer = decoded
    src.loop = true
    src.connect(bus)
    src.start()
    musicSource = src
  } catch (err) {
    console.warn('[audio] Failed to load background music:', err)
  }
}

function stopMusic(): void {
  if (musicSource) {
    try { musicSource.stop() } catch { /* already stopped */ }
    musicSource = null
  }
}

// ── Public API ───────────────────────────────────────────────

/** Set music volume 0–1. Starts music on first call with v > 0. */
export function setMusicVolume(v: number): void {
  _musicVolume = Math.max(0, Math.min(1, v))
  if (musicGain) musicGain.gain.value = _musicVolume
  if (_musicVolume > 0 && !musicSource) void startMusic()
  if (_musicVolume === 0) stopMusic()
}

/** Set SFX volume 0–1. */
export function setSfxVolume(v: number): void {
  _sfxVolume = Math.max(0, Math.min(1, v))
  if (sfxGain) sfxGain.gain.value = _sfxVolume
}

export function startWalkSound(): void {
  if (_sfxVolume === 0 || walkTimer !== null) return
  playStep()
  walkTimer = setInterval(playStep, 380)
}

export function stopWalkSound(): void {
  if (walkTimer !== null) {
    clearInterval(walkTimer)
    walkTimer = null
  }
}

function playStep(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  const bufSize = Math.floor(c.sampleRate * 0.05)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 500
  const env = c.createGain()
  env.gain.setValueAtTime(0.14, c.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05)
  src.connect(filter)
  filter.connect(env)
  env.connect(sfx)
  src.start()
  src.stop(c.currentTime + 0.08)
}

export function playMineHit(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  // Metallic clang with pitch drop
  const osc = c.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(820, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.14)
  const filt = c.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = 600
  filt.Q.value = 2.5
  const env = c.createGain()
  env.gain.setValueAtTime(0.18, c.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16)
  osc.connect(filt)
  filt.connect(env)
  env.connect(sfx)
  osc.start()
  osc.stop(c.currentTime + 0.18)

  // Low impact thud
  const bufSize = Math.floor(c.sampleRate * 0.06)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 160
  const env2 = c.createGain()
  env2.gain.setValueAtTime(0.28, c.currentTime)
  env2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09)
  src.connect(lp)
  lp.connect(env2)
  env2.connect(sfx)
  src.start()
  src.stop(c.currentTime + 0.11)
}

export function playRockExplode(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  const bufSize = Math.floor(c.sampleRate * 0.6)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(700, c.currentTime)
  filter.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.45)
  filter.Q.value = 0.7
  const env = c.createGain()
  env.gain.setValueAtTime(0.5, c.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55)
  src.connect(filter)
  filter.connect(env)
  env.connect(sfx)
  src.start()
  src.stop(c.currentTime + 0.6)
}

export function playModalOpen(): void {
  const c = getCtx()
  const sfx = getSfxBus()
  if (!c || !sfx || _sfxVolume === 0) return

  // Ascending C major arpeggio chime
  const freqs = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  freqs.forEach((freq, i) => {
    const t = c.currentTime + i * 0.07
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const env = c.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.11, t + 0.008)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.75)
    osc.connect(env)
    env.connect(sfx)
    osc.start(t)
    osc.stop(t + 0.8)
  })
}

export function cleanupAudio(): void {
  stopMusic()
  stopWalkSound()
  _musicLoading = null
  if (ctx) {
    void ctx.close()
    ctx = null
    masterGain = null
    musicGain = null
    sfxGain = null
  }
}
