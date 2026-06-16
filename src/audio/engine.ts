// Neuronest audio engine — plays pre-rendered, seamless loop files through a
// single <audio> element. This is deliberate: a real media element is the ONLY
// playback path mobile OSes keep alive when the screen locks. (The loops are
// rendered from the same DSP via scripts/render-loops.mjs.)

export class AudioEngine {
  private el: HTMLAudioElement | null = null
  private _volume = 0.6
  private fadeRAF = 0

  private ensure(): HTMLAudioElement {
    if (!this.el) {
      const el = new Audio()
      el.loop = true
      el.preload = 'auto'
      el.setAttribute('playsinline', '')
      el.volume = this._volume
      this.el = el
    }
    return this.el
  }

  /** Underlying media element (for Media Session / lock-screen wiring). */
  get media(): HTMLAudioElement {
    return this.ensure()
  }

  get volume() {
    return this._volume
  }

  setVolume(v: number) {
    this._volume = v
    if (this.el) {
      cancelAnimationFrame(this.fadeRAF) // a manual change wins over any fade
      this.el.volume = v
    }
  }

  private rampTo(target: number, ms: number, done?: () => void) {
    const el = this.el
    if (!el) return
    cancelAnimationFrame(this.fadeRAF)
    const start = el.volume
    const t0 = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      el.volume = start + (target - start) * k
      if (k < 1) this.fadeRAF = requestAnimationFrame(tick)
      else done?.()
    }
    this.fadeRAF = requestAnimationFrame(tick)
  }

  // rAF is frozen while the screen is locked / tab hidden, so a rAF volume
  // fade would leave audio stuck at ~0 (playing but silent). Only fade when the
  // page is actually visible; otherwise set volume / pause synchronously.
  private get canFade() {
    return typeof document !== 'undefined' && document.visibilityState === 'visible'
  }

  /** Play a soundscape loop by track id, replacing whatever is playing. */
  play(id: string) {
    const el = this.ensure()
    const src = `${import.meta.env.BASE_URL}audio/${id}.mp3`
    const want = new URL(src, location.href).href
    if (el.src !== want) {
      el.src = src
      el.currentTime = 0
    }
    el.loop = true
    cancelAnimationFrame(this.fadeRAF)
    if (this.canFade) {
      el.volume = 0.0001
      void el.play()
      this.rampTo(this._volume, 600) // gentle fade-in
    } else {
      el.volume = this._volume // locked screen: full volume immediately
      void el.play()
    }
  }

  /** Pause but keep the playback position (resume continues from here). */
  pause() {
    const el = this.el
    if (!el) return
    cancelAnimationFrame(this.fadeRAF)
    el.volume = this._volume // undo any in-flight fade so resume isn't silent
    el.pause()
  }

  /** Resume the current track from where it was paused. */
  resume() {
    const el = this.el
    if (!el || !el.src) return
    cancelAnimationFrame(this.fadeRAF)
    el.volume = this._volume
    void el.play()
  }

  /** Stop and reset to the start (used when switching away entirely). */
  stop() {
    const el = this.el
    if (!el) return
    cancelAnimationFrame(this.fadeRAF)
    el.pause()
    el.currentTime = 0
    el.volume = this._volume
  }
}

export const engine = new AudioEngine()
