// Neuronest audio engine — generates focus soundscapes procedurally with the
// Web Audio API so the prototype plays real sound with zero asset files.

export type SoundType = 'white' | 'pink' | 'brown' | 'binaural' | 'drone'

export interface SoundOptions {
  /** carrier frequency for binaural beats (Hz) */
  carrier?: number
  /** beat frequency = difference between L/R ears (Hz) */
  beat?: number
  /** low-pass cutoff for noise textures (Hz) */
  cutoff?: number
}

interface Voice {
  stop: () => void
}

function makeNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer {
  const length = ctx.sampleRate * 4 // 4s seamless loop
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else {
    // brown
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  }
  return buffer
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voice: Voice | null = null
  private _volume = 0.6

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this._volume
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  get volume() {
    return this._volume
  }

  setVolume(v: number) {
    this._volume = v
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.04)
    }
  }

  /** Play a sound, replacing whatever is currently playing. */
  play(type: SoundType, options: SoundOptions = {}) {
    const ctx = this.ensure()
    const master = this.master!
    this.stop()

    const voiceGain = ctx.createGain()
    voiceGain.gain.setValueAtTime(0.0001, ctx.currentTime)
    voiceGain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.8) // fade in
    voiceGain.connect(master)

    const nodes: { stop?: () => void }[] = []

    if (type === 'binaural') {
      const carrier = options.carrier ?? 200
      const beat = options.beat ?? 10

      const oscL = ctx.createOscillator()
      const oscR = ctx.createOscillator()
      oscL.type = 'sine'
      oscR.type = 'sine'
      oscL.frequency.value = carrier
      oscR.frequency.value = carrier + beat

      const panL = ctx.createStereoPanner()
      const panR = ctx.createStereoPanner()
      panL.pan.value = -1
      panR.pan.value = 1

      const toneGain = ctx.createGain()
      toneGain.gain.value = 0.5
      oscL.connect(panL).connect(toneGain)
      oscR.connect(panR).connect(toneGain)
      toneGain.connect(voiceGain)

      // soft pink bed so it isn't a clinical tone
      const bed = ctx.createBufferSource()
      bed.buffer = makeNoiseBuffer(ctx, 'pink')
      bed.loop = true
      const bedFilter = ctx.createBiquadFilter()
      bedFilter.type = 'lowpass'
      bedFilter.frequency.value = 900
      const bedGain = ctx.createGain()
      bedGain.gain.value = 0.18
      bed.connect(bedFilter).connect(bedGain).connect(voiceGain)

      oscL.start()
      oscR.start()
      bed.start()
      nodes.push(
        { stop: () => oscL.stop() },
        { stop: () => oscR.stop() },
        { stop: () => bed.stop() },
      )
    } else if (type === 'drone') {
      const base = options.carrier ?? 110
      const freqs = [base, base * 1.5, base * 2.01, base * 0.5]
      const droneFilter = ctx.createBiquadFilter()
      droneFilter.type = 'lowpass'
      droneFilter.frequency.value = options.cutoff ?? 600
      droneFilter.connect(voiceGain)

      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = i % 2 === 0 ? 'sine' : 'triangle'
        osc.frequency.value = f
        osc.detune.value = (i - 1.5) * 6
        const g = ctx.createGain()
        g.gain.value = 0.16 / (i + 1)
        osc.connect(g).connect(droneFilter)
        osc.start()
        nodes.push({ stop: () => osc.stop() })
      })
    } else {
      // noise textures: white / pink / brown
      const src = ctx.createBufferSource()
      src.buffer = makeNoiseBuffer(ctx, type)
      src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = options.cutoff ?? 18000
      src.connect(filter).connect(voiceGain)
      src.start()
      nodes.push({ stop: () => src.stop() })
    }

    this.voice = {
      stop: () => {
        const now = ctx.currentTime
        voiceGain.gain.cancelScheduledValues(now)
        voiceGain.gain.setValueAtTime(Math.max(voiceGain.gain.value, 0.0001), now)
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25) // fade out
        setTimeout(() => {
          nodes.forEach((n) => {
            try {
              n.stop?.()
            } catch {
              /* already stopped */
            }
          })
          voiceGain.disconnect()
        }, 320)
      },
    }
  }

  stop() {
    if (this.voice) {
      this.voice.stop()
      this.voice = null
    }
  }
}

export const engine = new AudioEngine()
