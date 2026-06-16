// Pre-renders each generated soundscape to a seamless looping MP3 so it can be
// played through an <audio> element — the only path that keeps audio alive on a
// locked screen (Web Audio is suspended when the screen locks on mobile).
//
// Mirrors the DSP in src/audio/engine.ts. Run: node scripts/render-loops.mjs
// (requires ffmpeg on PATH for MP3 encoding).
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio')
mkdirSync(outDir, { recursive: true })

const SR = 44100
const DUR = 30 // seconds of seamless loop

// Track specs — must match src/data/tracks.ts (id/type/options).
const TRACKS = [
  { id: 'deep-focus', type: 'brown', options: { cutoff: 2600 } },
  { id: 'flow-state', type: 'binaural', options: { carrier: 210, beat: 10 } },
  { id: 'gamma-boost', type: 'binaural', options: { carrier: 240, beat: 40 } },
  { id: 'white-veil', type: 'white', options: { cutoff: 9000 } },
  { id: 'pink-haze', type: 'pink', options: { cutoff: 6000 } },
  { id: 'rainfall', type: 'pink', options: { cutoff: 1400 } },
  { id: 'theta-drift', type: 'binaural', options: { carrier: 160, beat: 6 } },
  { id: 'night-drone', type: 'drone', options: { carrier: 90, cutoff: 480 } },
]

// ── noise generators (mirror engine.ts) ──────────────────────────────
function noiseGen(type) {
  if (type === 'white') return () => Math.random() * 2 - 1
  if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    return () => {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      const out = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
      return out
    }
  }
  // brown
  let last = 0
  return () => {
    const w = Math.random() * 2 - 1
    last = (last + 0.02 * w) / 1.02
    return last * 3.5
  }
}

// two cascaded one-pole low-passes ≈ the engine's 12 dB/oct biquad
function makeLP(cutoff) {
  const a = Math.exp((-2 * Math.PI * cutoff) / SR)
  let y1 = 0, y2 = 0
  return (x) => {
    y1 = (1 - a) * x + a * y1
    y2 = (1 - a) * y1 + a * y2
    return y2
  }
}

const tri = (ph) => (2 / Math.PI) * Math.asin(Math.sin(ph))

// ── render one track to interleaved stereo Float32 (length = DUR + xfade) ──
function render({ type, options }) {
  const xfadeSec = type === 'binaural' ? 1.0 : type === 'drone' ? 0.75 : 0.08
  const linear = type !== 'drone' // identical/quiet seams → linear; drone → equal-power
  const N = Math.floor(SR * DUR)
  const X = Math.floor(SR * xfadeSec)
  const total = N + X
  const L = new Float32Array(total)
  const R = new Float32Array(total)

  if (type === 'binaural') {
    const carrier = options.carrier ?? 200
    const beat = options.beat ?? 10
    const bed = noiseGen('pink')
    const lp1 = makeLP(900), lp2 = makeLP(900) // (cascade handled inside makeLP)
    void lp2
    for (let i = 0; i < total; i++) {
      const t = i / SR
      const b = lp1(bed()) * 0.18
      L[i] = 0.5 * Math.sin(2 * Math.PI * carrier * t) + b
      R[i] = 0.5 * Math.sin(2 * Math.PI * (carrier + beat) * t) + b
    }
  } else if (type === 'drone') {
    const base = options.carrier ?? 110
    const freqs = [base, base * 1.5, base * 2.01, base * 0.5]
    const lp = makeLP(options.cutoff ?? 600)
    for (let i = 0; i < total; i++) {
      const t = i / SR
      let s = 0
      freqs.forEach((f, k) => {
        const fd = f * Math.pow(2, ((k - 1.5) * 6) / 1200) // detune cents
        const ph = 2 * Math.PI * fd * t
        const wave = k % 2 === 0 ? Math.sin(ph) : tri(ph)
        s += wave * (0.16 / (k + 1))
      })
      const v = lp(s)
      L[i] = v
      R[i] = v
    }
  } else {
    const gen = noiseGen(type)
    const lp = makeLP(options.cutoff ?? 18000)
    for (let i = 0; i < total; i++) {
      const v = lp(gen())
      L[i] = v
      R[i] = v
    }
  }

  // fold the crossfade tail back over the head so the N-sample loop is seamless
  for (let k = 0; k < X; k++) {
    const a = k / X
    const fin = linear ? a : Math.sin((a * Math.PI) / 2)
    const fout = linear ? 1 - a : Math.cos((a * Math.PI) / 2)
    L[k] = L[k] * fin + L[N + k] * fout
    R[k] = R[k] * fin + R[N + k] * fout
  }

  // peak-normalize to -1 dBFS over the looped region
  let peak = 0
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
  const gain = peak > 0 ? 0.89 / peak : 1
  const inter = new Float32Array(N * 2)
  for (let i = 0; i < N; i++) {
    inter[i * 2] = L[i] * gain
    inter[i * 2 + 1] = R[i] * gain
  }
  return inter
}

function writeWav(path, interleaved) {
  const n = interleaved.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(2, 22) // stereo
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2 * 2, 28)
  buf.writeUInt16LE(4, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, interleaved[i]))
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2)
  }
  writeFileSync(path, buf)
}

for (const track of TRACKS) {
  const wav = join(outDir, `${track.id}.wav`)
  const mp3 = join(outDir, `${track.id}.mp3`)
  writeWav(wav, render(track))
  execFileSync('ffmpeg', ['-y', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '4', mp3], {
    stdio: 'ignore',
  })
  rmSync(wav)
  console.log('rendered', `${track.id}.mp3`)
}
console.log('done →', outDir)
