// Generates a cohesive set of high-end thumbnails for the ambient soundscapes.
// Each is a layered gradient + a scene-specific line-art motif, rendered to WebP.
// To use real photos instead, just drop {id}.webp files into public/environments/.
// Run: node scripts/gen-environments.mjs
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'environments')
mkdirSync(outDir, { recursive: true })

const W = 800, H = 600

// deterministic PRNG so re-runs produce identical art (clean git diffs)
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── scene motifs (white/accent line-art over the gradient) ──────────────
const M = {
  rain(r, a) {
    let s = ''
    for (let i = 0; i < 70; i++) {
      const x = r() * (W + 120) - 60
      const y = r() * H
      const len = 26 + r() * 34
      s += `<line x1="${x}" y1="${y}" x2="${x - 14}" y2="${y + len}" stroke="white" stroke-width="2" stroke-linecap="round" opacity="${0.1 + r() * 0.22}"/>`
    }
    return s
  },
  waves(r, a, bold = false) {
    let s = ''
    const rows = bold ? 6 : 5
    for (let k = 0; k < rows; k++) {
      const y = H * 0.42 + k * (H * 0.11)
      const amp = (bold ? 26 : 16) + k * 4
      let d = `M -40 ${y}`
      for (let x = 0; x <= W + 40; x += 80) {
        d += ` Q ${x + 40} ${y - amp} ${x + 80} ${y}`
      }
      const col = k === rows - 1 ? a : 'white'
      s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${bold ? 3.5 : 2.5}" stroke-linecap="round" opacity="${0.12 + k * 0.04}"/>`
    }
    return s
  },
  forest(r, a) {
    let s = ''
    const layers = [
      { y: H * 0.62, o: 0.1 },
      { y: H * 0.74, o: 0.14 },
      { y: H * 0.86, o: 0.2 },
    ]
    for (const L of layers) {
      let d = `M -20 ${H} L -20 ${L.y}`
      for (let x = -20; x <= W + 20; x += 60) {
        d += ` Q ${x + 30} ${L.y - 40 - r() * 50} ${x + 60} ${L.y}`
      }
      d += ` L ${W + 20} ${H} Z`
      s += `<path d="${d}" fill="white" opacity="${L.o}"/>`
    }
    // a couple of frond strokes
    for (let i = 0; i < 2; i++) {
      const x = 120 + i * 460
      s += `<path d="M ${x} ${H * 0.5} q 40 -120 10 -200" fill="none" stroke="${a}" stroke-width="3" opacity="0.25" stroke-linecap="round"/>`
    }
    return s
  },
  storm(r, a) {
    const cx = W * 0.5, cy = H * 0.34
    let s = `<g opacity="0.16" fill="white">`
    for (const [dx, dy, rr] of [[-90, 10, 55], [-30, -20, 70], [50, -10, 60], [110, 14, 48]])
      s += `<circle cx="${cx + dx}" cy="${cy + dy}" r="${rr}"/>`
    s += `</g>`
    s += `<polygon points="${cx - 10},${cy + 60} ${cx + 18},${cy + 60} ${cx - 2},${cy + 110} ${cx + 26},${cy + 110} ${cx - 14},${cy + 180} ${cx - 4},${cy + 118} ${cx - 24},${cy + 118}" fill="${a}" opacity="0.85"/>`
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = cy + 90 + r() * (H - cy - 90)
      s += `<line x1="${x}" y1="${y}" x2="${x - 10}" y2="${y + 24}" stroke="white" stroke-width="2" opacity="0.18" stroke-linecap="round"/>`
    }
    return s
  },
  river(r, a) {
    let s = ''
    for (let k = 0; k < 4; k++) {
      const y = H * 0.5 + k * 34
      let d = `M -40 ${y}`
      for (let x = 0; x <= W + 40; x += 120) d += ` Q ${x + 60} ${y + (k % 2 ? -18 : 18)} ${x + 120} ${y}`
      s += `<path d="${d}" fill="none" stroke="${k === 1 ? a : 'white'}" stroke-width="3" opacity="${0.12 + k * 0.05}" stroke-linecap="round"/>`
    }
    return s
  },
  cafe(r, a) {
    const cx = W * 0.5, cy = H * 0.58
    let s = `<g fill="none" stroke="white" stroke-width="6" opacity="0.22" stroke-linecap="round" stroke-linejoin="round">`
    s += `<path d="M ${cx - 70} ${cy - 30} h 120 v 60 a 60 60 0 0 1 -120 0 Z"/>`
    s += `<path d="M ${cx + 50} ${cy - 16} a 30 30 0 0 1 0 50"/>`
    s += `</g>`
    s += `<g fill="none" stroke="${a}" stroke-width="4" opacity="0.4" stroke-linecap="round">`
    for (let i = 0; i < 3; i++) {
      const x = cx - 36 + i * 36
      s += `<path d="M ${x} ${cy - 56} q 16 -22 0 -44 q -16 -22 0 -44"/>`
    }
    s += `</g>`
    return s
  },
  infra(r, a) {
    let s = ''
    let x = -10
    while (x < W + 10) {
      const w = 36 + r() * 60
      const h = 80 + r() * 200
      s += `<rect x="${x}" y="${H - h}" width="${w}" height="${h}" fill="white" opacity="${0.08 + r() * 0.1}"/>`
      x += w + 8 + r() * 14
    }
    for (let i = 0; i < 30; i++)
      s += `<rect x="${r() * W}" y="${H - r() * 240}" width="5" height="5" fill="${a}" opacity="0.5"/>`
    return s
  },
  wind(r, a) {
    let s = ''
    for (let k = 0; k < 6; k++) {
      const y = H * 0.3 + k * 52
      const x0 = -40 + r() * 120
      const x1 = W * (0.5 + r() * 0.45)
      s += `<path d="M ${x0} ${y} Q ${(x0 + x1) / 2} ${y - 30} ${x1} ${y}" fill="none" stroke="${k % 3 === 0 ? a : 'white'}" stroke-width="3" opacity="${0.12 + r() * 0.16}" stroke-linecap="round"/>`
    }
    return s
  },
  fire(r, a) {
    const cx = W * 0.5, cy = H * 0.92
    let s = `<path d="M ${cx} ${cy} C ${cx - 120} ${cy - 90} ${cx - 70} ${cy - 230} ${cx} ${cy - 300} C ${cx + 70} ${cy - 230} ${cx + 120} ${cy - 90} ${cx} ${cy} Z" fill="white" opacity="0.1"/>`
    s += `<path d="M ${cx} ${cy} C ${cx - 70} ${cy - 70} ${cx - 40} ${cy - 170} ${cx} ${cy - 230} C ${cx + 40} ${cy - 170} ${cx + 70} ${cy - 70} ${cx} ${cy} Z" fill="${a}" opacity="0.55"/>`
    for (let i = 0; i < 18; i++)
      s += `<circle cx="${cx + (r() - 0.5) * 260}" cy="${cy - 120 - r() * 220}" r="${1.5 + r() * 2.5}" fill="${a}" opacity="${0.3 + r() * 0.4}"/>`
    return s
  },
  morning(r, a) {
    const cx = W * 0.5, cy = H * 0.96
    let s = `<circle cx="${cx}" cy="${cy}" r="150" fill="${a}" opacity="0.22"/>`
    s += `<circle cx="${cx}" cy="${cy}" r="100" fill="${a}" opacity="0.3"/>`
    for (let i = 0; i < 12; i++) {
      const ang = Math.PI + (i / 11) * Math.PI
      const x1 = cx + Math.cos(ang) * 170, y1 = cy + Math.sin(ang) * 170
      const x2 = cx + Math.cos(ang) * (240 + r() * 60), y2 = cy + Math.sin(ang) * (240 + r() * 60)
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${a}" stroke-width="3" opacity="0.25" stroke-linecap="round"/>`
    }
    return s
  },
  fan(r, a) {
    const cx = W * 0.5, cy = H * 0.5
    let s = `<g fill="none" stroke="white" opacity="0.16" stroke-width="3">`
    for (const rr of [60, 110, 160]) s += `<circle cx="${cx}" cy="${cy}" r="${rr}"/>`
    s += `</g>`
    s += `<g fill="${a}" opacity="0.3">`
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2
      const x = cx + Math.cos(ang) * 90, y = cy + Math.sin(ang) * 90
      s += `<ellipse cx="${x}" cy="${y}" rx="60" ry="26" transform="rotate(${(ang * 180) / Math.PI} ${x} ${y})"/>`
    }
    s += `</g><circle cx="${cx}" cy="${cy}" r="16" fill="white" opacity="0.3"/>`
    return s
  },
  plane(r, a) {
    const cx = W * 0.5, cy = H * 0.5
    let s = `<rect x="${cx - 120}" y="${cy - 150}" width="240" height="300" rx="120" fill="white" opacity="0.06"/>`
    s += `<rect x="${cx - 95}" y="${cy - 125}" width="190" height="250" rx="95" fill="none" stroke="white" stroke-width="6" opacity="0.2"/>`
    s += `<path d="M ${cx - 95} ${cy + 30} h 190" stroke="${a}" stroke-width="4" opacity="0.4"/>`
    s += `<circle cx="${cx + 40}" cy="${cy - 10}" r="34" fill="${a}" opacity="0.3"/>`
    return s
  },
  train(r, a) {
    let s = ''
    for (let k = 0; k < 7; k++) {
      const y = H * 0.28 + k * 48
      const w = W * (0.4 + r() * 0.5)
      s += `<line x1="-20" y1="${y}" x2="${w}" y2="${y}" stroke="${k % 3 === 0 ? a : 'white'}" stroke-width="4" opacity="${0.1 + r() * 0.16}" stroke-linecap="round"/>`
    }
    for (let i = 0; i < 6; i++)
      s += `<rect x="${80 + i * 110}" y="${H * 0.5}" width="60" height="44" rx="8" fill="white" opacity="0.12"/>`
    return s
  },
}

// id, name, motif, gradient c1/c2, accent
const SPECS = [
  { id: 'cabin-rain', motif: ['rain'], c1: '#1f3a3d', c2: '#0a1417', a: '#7fd1d6', seed: 11 },
  { id: 'ocean-waves', motif: ['waves'], c1: '#15467a', c2: '#06101d', a: '#5bb0ff', seed: 22 },
  { id: 'rain-indoors', motif: ['rain'], c1: '#2b3540', c2: '#0d1217', a: '#9fb3c8', seed: 33 },
  { id: 'rainforest', motif: ['forest'], c1: '#0f5132', c2: '#06130d', a: '#34e27a', seed: 44 },
  { id: 'thunderstorm', motif: ['storm'], c1: '#2a2f55', c2: '#090b1a', a: '#b79cff', seed: 55 },
  { id: 'riverside', motif: ['river'], c1: '#14564f', c2: '#07130f', a: '#2dd4bf', seed: 66 },
  { id: 'cafe', motif: ['cafe'], c1: '#5a3a1e', c2: '#180f08', a: '#e0a458', seed: 77 },
  { id: 'public-infra', motif: ['infra'], c1: '#3a3f47', c2: '#101316', a: '#9aa6b2', seed: 88 },
  { id: 'coastal-wind', motif: ['wind', 'waves'], c1: '#243b42', c2: '#0a1316', a: '#7fd1d6', seed: 99 },
  { id: 'fire-crackling', motif: ['fire'], c1: '#6a2a12', c2: '#180806', a: '#ff8b3d', seed: 111 },
  { id: 'heavy-waves', motif: ['wavesBold'], c1: '#0f3a66', c2: '#050d18', a: '#4a90d9', seed: 122 },
  { id: 'morning-energy', motif: ['morning'], c1: '#7a4a16', c2: '#1a1206', a: '#ffc15e', seed: 133 },
  { id: 'hvac-industrial', motif: ['fan'], c1: '#2a3942', c2: '#0c1316', a: '#8fc6d6', seed: 144 },
  { id: 'aeroplane-cabin', motif: ['plane'], c1: '#1e2b40', c2: '#0a0f17', a: '#8aa6d6', seed: 155 },
  { id: 'train-movement', motif: ['train'], c1: '#2a2c4a', c2: '#0b0c16', a: '#9b9cf0', seed: 166 },
]

function svgFor(spec) {
  const r = rng(spec.seed)
  let motif = ''
  for (const m of spec.motif) {
    if (m === 'wavesBold') motif += M.waves(r, spec.a, true)
    else motif += M[m](r, spec.a)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${spec.c1}"/>
        <stop offset="1" stop-color="${spec.c2}"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.3" cy="0.18" r="0.9">
        <stop offset="0" stop-color="${spec.a}" stop-opacity="0.32"/>
        <stop offset="0.5" stop-color="${spec.a}" stop-opacity="0.06"/>
        <stop offset="1" stop-color="${spec.a}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.5"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <g>${motif}</g>
    <rect width="${W}" height="${H}" fill="url(#vig)"/>
  </svg>`
}

for (const spec of SPECS) {
  const png = new Resvg(svgFor(spec), { fitTo: { mode: 'width', value: W } }).render().asPng()
  await sharp(png).webp({ quality: 82 }).toFile(join(outDir, `${spec.id}.webp`))
  console.log('wrote', `${spec.id}.webp`)
}
console.log('done →', outDir)
