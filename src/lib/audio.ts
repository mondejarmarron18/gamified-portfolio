// Synthesized audio — no external files required.
// AudioContext is created lazily on first user gesture.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let musicGain: GainNode | null = null
let musicNodes: AudioNode[] = []
let walkTimer: ReturnType<typeof setInterval> | null = null
let _enabled = false
let _musicRunning = false                        // guards arpeggio/melody loops
let arpScheduleTimer: ReturnType<typeof setTimeout> | null = null
let melodyTimer: ReturnType<typeof setTimeout> | null = null
let arpIndex = 0

// Pentatonic C — arpeggio sequence (C4 E4 G4 A4 C5 A4 G4 E4)
const ARP_NOTES = [261.6, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6]
const ARP_INTERVAL = 0.38 // seconds per note

// Melody accent phrase (G4 A4 C5 E5)
const MELODY_NOTES = [392.0, 440.0, 523.3, 659.3]

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
    masterGain.gain.value = 0.55
    masterGain.connect(c.destination)
  }
  return masterGain
}

export function setAudioEnabled(on: boolean): void {
  _enabled = on
  if (on) {
    startMusic()
  } else {
    stopMusic()
    stopWalkSound()
  }
}

export function startMusic(): void {
  if (!_enabled || _musicRunning) return
  const c = getCtx()
  const master = getMaster()
  if (!c || !master) return

  _musicRunning = true
  arpIndex = 0

  // Shared music gain — fades in over 3 s
  const gain = c.createGain()
  gain.gain.setValueAtTime(0, c.currentTime)
  gain.gain.linearRampToValueAtTime(1, c.currentTime + 3)
  gain.connect(master)
  musicGain = gain

  // ── Layer 1: Warm string pad ──────────────────────────────
  // C pentatonic chord: C3 E3 G3 A3 D4
  const padFreqs: Array<{ freq: number; type: OscillatorType; amp: number; lfoRate: number }> = [
    { freq: 130.8, type: 'sine',     amp: 0.9, lfoRate: 0.055 }, // C3
    { freq: 164.8, type: 'sine',     amp: 0.6, lfoRate: 0.071 }, // E3
    { freq: 196.0, type: 'triangle', amp: 0.7, lfoRate: 0.043 }, // G3
    { freq: 220.0, type: 'sine',     amp: 0.5, lfoRate: 0.062 }, // A3
    { freq: 293.7, type: 'triangle', amp: 0.4, lfoRate: 0.038 }, // D4
  ]

  const padGain = c.createGain()
  padGain.gain.value = 0.045
  padGain.connect(gain)

  padFreqs.forEach(({ freq, type, amp, lfoRate }) => {
    const osc = c.createOscillator()
    osc.type = type
    osc.frequency.value = freq

    // Slow swell LFO
    const lfo = c.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = lfoRate
    const lfoAmt = c.createGain()
    lfoAmt.gain.value = freq * 0.0025
    lfo.connect(lfoAmt)
    lfoAmt.connect(osc.frequency)

    const vGain = c.createGain()
    vGain.gain.value = amp
    osc.connect(vGain)
    vGain.connect(padGain)

    osc.start()
    lfo.start()
    musicNodes.push(osc, lfo)
  })

  // ── Layer 2: Harp arpeggio (look-ahead scheduled) ─────────
  const arpGain = c.createGain()
  arpGain.gain.value = 0.08
  arpGain.connect(gain)

  scheduleArpNote(c, arpGain, c.currentTime)

  // ── Layer 3: Melody accent (randomised timing) ─────────────
  scheduleMelodyAccent(gain)
}

function scheduleArpNote(c: AudioContext, arpGain: GainNode, scheduleAt: number): void {
  if (!_musicRunning) return

  const freq = ARP_NOTES[arpIndex % ARP_NOTES.length]!
  arpIndex++

  const osc = c.createOscillator()
  osc.type = 'sine'
  // Tiny frequency jitter for "string resonance" feel
  osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.8, scheduleAt)

  const env = c.createGain()
  env.gain.setValueAtTime(0, scheduleAt)
  env.gain.linearRampToValueAtTime(1, scheduleAt + 0.008)
  env.gain.exponentialRampToValueAtTime(0.001, scheduleAt + 0.35)

  osc.connect(env)
  env.connect(arpGain)
  osc.start(scheduleAt)
  osc.stop(scheduleAt + 0.42)
  musicNodes.push(osc)

  // Fire next note scheduling 30 ms before it's due (look-ahead)
  const msUntilNext = (scheduleAt - c.currentTime + ARP_INTERVAL) * 1000 - 30
  arpScheduleTimer = setTimeout(() => {
    const c2 = getCtx()
    if (!c2 || !_musicRunning) return
    scheduleArpNote(c2, arpGain, scheduleAt + ARP_INTERVAL)
  }, Math.max(0, msUntilNext))
}

function scheduleMelodyAccent(musicGainNode: GainNode): void {
  if (!_musicRunning) return
  const delay = 12000 + Math.random() * 6000 // 12–18 s
  melodyTimer = setTimeout(() => {
    if (!_musicRunning) return
    playMelodyAccent(musicGainNode)
    scheduleMelodyAccent(musicGainNode) // schedule the next one
  }, delay)
}

function playMelodyAccent(musicGainNode: GainNode): void {
  const c = getCtx()
  if (!c || !_musicRunning) return

  const accentGain = c.createGain()
  accentGain.gain.value = 0.07
  accentGain.connect(musicGainNode)

  MELODY_NOTES.forEach((freq, i) => {
    const t = c.currentTime + i * 0.5

    // Sine + detuned shimmer (+7 cents) for flute-like tone
    const detunedFreq = freq * Math.pow(2, 7 / 1200)
    ;[freq, detunedFreq].forEach((f) => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f

      const env = c.createGain()
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(1, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.55)

      osc.connect(env)
      env.connect(accentGain)
      osc.start(t)
      osc.stop(t + 0.62)
      musicNodes.push(osc)
    })
  })
}

export function stopMusic(): void {
  _musicRunning = false

  if (arpScheduleTimer !== null) { clearTimeout(arpScheduleTimer); arpScheduleTimer = null }
  if (melodyTimer !== null)       { clearTimeout(melodyTimer);       melodyTimer = null }
  arpIndex = 0

  const c = getCtx()
  const nodesToStop = [...musicNodes]
  const gainToFade = musicGain
  musicNodes = []
  musicGain = null

  if (c && gainToFade) {
    gainToFade.gain.setValueAtTime(gainToFade.gain.value, c.currentTime)
    gainToFade.gain.linearRampToValueAtTime(0, c.currentTime + 1.5)
    setTimeout(() => {
      nodesToStop.forEach((n) => { try { (n as OscillatorNode).stop() } catch { /* already stopped */ } })
      try { gainToFade.disconnect() } catch { /* ignore */ }
    }, 1600)
  } else {
    nodesToStop.forEach((n) => { try { (n as OscillatorNode).stop() } catch { /* already stopped */ } })
  }
}

export function startWalkSound(): void {
  if (!_enabled || walkTimer !== null) return
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
  const master = getMaster()
  if (!c || !master || !_enabled) return

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
  env.connect(master)
  src.start()
  src.stop(c.currentTime + 0.08)
}

export function playMineHit(): void {
  const c = getCtx()
  const master = getMaster()
  if (!c || !master || !_enabled) return

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
  env.connect(master)
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
  env2.connect(master)
  src.start()
  src.stop(c.currentTime + 0.11)
}

export function playRockExplode(): void {
  const c = getCtx()
  const master = getMaster()
  if (!c || !master || !_enabled) return

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
  env.connect(master)
  src.start()
  src.stop(c.currentTime + 0.6)
}

export function playModalOpen(): void {
  const c = getCtx()
  const master = getMaster()
  if (!c || !master || !_enabled) return

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
    env.connect(master)
    osc.start(t)
    osc.stop(t + 0.8)
  })
}

export function cleanupAudio(): void {
  stopMusic()
  stopWalkSound()
  if (ctx) {
    void ctx.close()
    ctx = null
    masterGain = null
  }
}
