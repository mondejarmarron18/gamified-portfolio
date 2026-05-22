// Synthesized audio for high-quality mode — no external files required.
// AudioContext is created lazily on first use (requires a prior user gesture).

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let musicGain: GainNode | null = null
let musicNodes: AudioNode[] = []
let walkTimer: ReturnType<typeof setInterval> | null = null
let _enabled = false

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
  if (!_enabled || musicNodes.length > 0) return
  const c = getCtx()
  const master = getMaster()
  if (!c || !master) return

  const gain = c.createGain()
  gain.gain.setValueAtTime(0, c.currentTime)
  gain.gain.linearRampToValueAtTime(0.07, c.currentTime + 4)
  gain.connect(master)
  musicGain = gain

  // Soft ambient pad — C major voicing across two octaves
  const voices: Array<{ freq: number; type: OscillatorType; amp: number; lfoRate: number }> = [
    { freq: 65.4,  type: 'sine',     amp: 1.0, lfoRate: 0.030 }, // C2
    { freq: 82.4,  type: 'sine',     amp: 0.6, lfoRate: 0.041 }, // E2
    { freq: 98.0,  type: 'sine',     amp: 0.8, lfoRate: 0.023 }, // G2
    { freq: 130.8, type: 'triangle', amp: 0.4, lfoRate: 0.037 }, // C3
  ]

  voices.forEach(({ freq, type, amp, lfoRate }) => {
    const osc = c.createOscillator()
    osc.type = type
    osc.frequency.value = freq

    // Subtle pitch waver for an organic, living feel
    const lfo = c.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = lfoRate
    const lfoAmt = c.createGain()
    lfoAmt.gain.value = freq * 0.003
    lfo.connect(lfoAmt)
    lfoAmt.connect(osc.frequency)

    const voiceGain = c.createGain()
    voiceGain.gain.value = amp
    osc.connect(voiceGain)
    voiceGain.connect(gain)

    osc.start()
    lfo.start()
    musicNodes.push(osc, lfo)
  })
}

export function stopMusic(): void {
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
